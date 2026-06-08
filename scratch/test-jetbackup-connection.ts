import { config } from "dotenv";
import { resolve } from "path";
import { request } from "undici";

config({ path: resolve("apps/server/.env") });

const HOST = process.env.VITE_PUBLIC_PLESK_HOST || "orion.nisccloud.com";
const KEY = process.env.PLESK_SECRET_KEY;

async function tryEndpoint(
  label: string,
  url: string,
  opts: {
    method?: string;
    headers?: Record<string, string>;
    body?: unknown;
  } = {},
) {
  try {
    const method = opts.method || "POST";
    const hasBody = opts.body !== undefined;
    const res = await request(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": KEY!,
        ...(opts.headers || {}),
      },
      body: hasBody
        ? typeof opts.body === "string"
          ? opts.body
          : JSON.stringify(opts.body)
        : undefined,
      signal: AbortSignal.timeout(30000),
    });
    const text = await res.body.text();
    console.log(`\n[${label}] ${method} ${url}`);
    console.log(`  Status: ${res.statusCode}`);
    console.log(`  Body: ${text.substring(0, 400).replace(/\n/g, " ")}`);
    return { status: res.statusCode, text };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    console.log(`\n[${label}] ERROR: ${message}`);
    return null;
  }
}

console.log("Host:", HOST);
console.log("Has PLESK_SECRET_KEY:", !!KEY);

console.log("\n=== 1. Plesk core API (verify key) ===");
await tryEndpoint("server", `https://${HOST}:8443/api/v2/server`, {
  method: "GET",
  body: undefined,
});

console.log("\n=== 2. List extensions ===");
await tryEndpoint("extensions", `https://${HOST}:8443/api/v2/extensions`, {
  method: "GET",
  body: undefined,
});

console.log("\n=== 3. JetBackup extension bridge paths ===");
const paths = [
  "/api/v2/extensions/jetbackup5/call",
  "/modules/jetbackup5/api.php",
  "/modules/jetbackup5/headerless.php",
  "/api/modules/jetbackup5/api.php",
];
for (const p of paths) {
  await tryEndpoint(p, `https://${HOST}:8443${p}`);
}

console.log("\n=== 4. Session bridge ===");
const sessionRes = await request(`https://${HOST}:8443/api/v2/auth/sessions`, {
  method: "POST",
  headers: { "X-API-Key": KEY!, "Content-Type": "application/json" },
  body: JSON.stringify({ description: "nPanel JetBackup test" }),
  signal: AbortSignal.timeout(30000),
});
const sessionText = await sessionRes.body.text();
console.log("Session create status:", sessionRes.statusCode);
if (sessionRes.statusCode === 201) {
  const { sid } = JSON.parse(sessionText) as { sid: string };
  await tryEndpoint(
    "session+headerless",
    `https://${HOST}:8443/modules/jetbackup5/headerless.php`,
    {
      headers: { Cookie: `PLESKSESSID=${sid}` },
      body: { function: "getInfo" },
    },
  );
} else {
  console.log("Session body:", sessionText.substring(0, 200));
}
