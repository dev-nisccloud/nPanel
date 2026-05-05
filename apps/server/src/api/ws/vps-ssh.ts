import { Context } from "hono";
import { Client } from "ssh2";
import { auth } from "@npanel/auth";
import { hivelocityRequest } from "@npanel/api/lib/hivelocity-client";
import type { WSEvents } from "hono/ws";

// A map to store SSH clients associated with a WebSocket connection
// We use a WeakMap or store it on the WS object if possible, but hono/ws doesn't expose the underlying socket easily in onMessage.
// Actually, we can just use closure variables inside the upgradeWebSocket handler because it returns an object of event handlers.

export function handleVpsSshUpgrade(c: Context): WSEvents {
  let sshClient: Client | null = null;
  let sshStream: any = null;
  let deviceIdStr: string | null = null;
  
  // We can't do async inside upgradeWebSocket definition directly, so we handle authentication inside the onMessage 'init' event.
  
  return {
    onMessage: async (event, ws) => {
      try {
        const data = typeof event.data === "string" ? event.data : new TextDecoder().decode(event.data as ArrayBuffer);
        const payload = JSON.parse(data);

        if (payload.type === "init") {
          // 1. Authenticate user
          let authHeaders = new Headers(c.req.raw.headers);
          if (payload.cookie) {
            authHeaders.set("cookie", payload.cookie);
          }
          const session = await auth.api.getSession({ headers: authHeaders });
          if (!session || !session.user) {
            ws.send(JSON.stringify({ type: "error", code: "UNAUTHORIZED", message: "Unauthorized" }));
            ws.close();
            return;
          }

          deviceIdStr = payload.deviceId;
          if (!deviceIdStr) {
            ws.send(JSON.stringify({ type: "error", code: "INVALID_INPUT", message: "Missing deviceId" }));
            ws.close();
            return;
          }

          // 2. Determine SSH Credentials
          const deviceId = parseInt(deviceIdStr, 10);
          let sshPassword = payload.password;
          let hostIp = payload.hostIp;

          // If no password provided, try to fetch the initial password from Hivelocity
          if (!sshPassword) {
            try {
              const credsRes = await hivelocityRequest<any>(`/device/${deviceId}/initial-password`, { requireApiKey: true });
              if (credsRes && credsRes.password) {
                sshPassword = credsRes.password;
              } else {
                ws.send(JSON.stringify({ type: "error", code: "NO_INITIAL_CREDENTIALS", message: "No initial password found. Please provide it manually." }));
                ws.close();
                return;
              }
            } catch (err) {
              console.error("Failed to fetch initial password:", err);
              ws.send(JSON.stringify({ type: "error", code: "AUTH_FAILED", message: "Failed to fetch initial password" }));
              ws.close();
              return;
            }
          }

          // If hostIp isn't provided, fetch device details to get it
          if (!hostIp) {
            try {
              // Try VPS first
              let deviceDetails = await hivelocityRequest<any>(`/vps/${deviceId}`, { requireApiKey: true }).catch(() => null);
              if (!deviceDetails) {
                 deviceDetails = await hivelocityRequest<any>(`/device/${deviceId}`, { requireApiKey: true });
              }
              hostIp = deviceDetails?.primaryIp;
              
              if (!hostIp) {
                ws.send(JSON.stringify({ type: "error", code: "INVALID_INPUT", message: "Could not determine host IP" }));
                ws.close();
                return;
              }
            } catch (err) {
               console.error("Failed to fetch device details:", err);
               ws.send(JSON.stringify({ type: "error", code: "INVALID_INPUT", message: "Failed to fetch device details" }));
               ws.close();
               return;
            }
          }

          // 3. Connect via SSH
          sshClient = new Client();

          sshClient.on("ready", () => {
            sshClient!.shell({ term: 'xterm-256color' }, (err, stream) => {
              if (err) {
                console.error("SSH Shell error:", err);
                ws.send(JSON.stringify({ type: "error", code: "SHELL_ERROR", message: "Failed to start SSH shell" }));
                ws.close();
                return;
              }
              
              sshStream = stream;
              ws.send(JSON.stringify({ type: "connected" }));

              stream.on("data", (d: any) => {
                ws.send(JSON.stringify({ type: "data", data: d.toString("utf-8") }));
              }).on("close", () => {
                ws.close();
              });
            });
          });

          sshClient.on("error", (err: any) => {
            console.error("SSH Connection Error:", err);
            // Detect auth failure
            if (err.level === "client-authentication") {
              ws.send(JSON.stringify({ type: "error", code: "AUTH_FAILED", message: "Authentication failed. Password might have been changed." }));
            } else {
              ws.send(JSON.stringify({ type: "error", code: "CONNECTION_ERROR", message: err.message || "Failed to connect to SSH" }));
            }
            ws.close();
          });

          // Connect
          try {
            sshClient.connect({
              host: hostIp,
              port: 22,
              username: "root", // Hivelocity initial user is usually root
              password: sshPassword,
              readyTimeout: 15000,
            });
          } catch (e: any) {
            console.error("SSH Connect exception:", e);
            ws.send(JSON.stringify({ type: "error", code: "CONNECTION_ERROR", message: e.message || "Failed to connect" }));
            ws.close();
          }

        } else if (payload.type === "data" && sshStream) {
          sshStream.write(payload.data);
        } else if (payload.type === "resize" && sshStream) {
          sshStream.setWindow(payload.rows, payload.cols, 0, 0);
        }
      } catch (err) {
        console.error("WS message error:", err);
      }
    },
    onClose: () => {
      if (sshStream) {
        sshStream.end();
      }
      if (sshClient) {
        sshClient.end();
      }
    },
    onError: (err) => {
      console.error("WS error:", err);
      if (sshClient) sshClient.end();
    }
  };
}
