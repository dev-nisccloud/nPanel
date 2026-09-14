import { KraOscuClient, type KraOscuClientConfig } from "./client";
import { KraOscuError } from "./errors";
import type { KraEndpointKey } from "./endpoints";
import type { OscuIdentity } from "./types";
import type { KraResult } from "./unwrap";

export type OscuProxyPayload = {
  endpointKey: KraEndpointKey;
  body?: Record<string, unknown>;
  identity?: OscuIdentity | null;
  requireCmcKey?: boolean;
};

/**
 * Backend handler: frontends POST `{ endpointKey, body, identity? }` here.
 * Keep consumerKey / consumerSecret only on the server that constructs `client`.
 */
export async function dispatchOscuProxy(
  client: KraOscuClient,
  payload: OscuProxyPayload,
): Promise<KraResult<unknown>> {
  if (payload.identity?.cmcKey) client.setIdentity(payload.identity);
  return client.request(payload.endpointKey, payload.body ?? {}, {
    identity: payload.identity ?? undefined,
    requireCmcKey: payload.requireCmcKey,
  });
}

/** Web-standard fetch handler (Hono, Next.js Route Handler, Cloudflare Workers, Deno). */
export async function oscuProxyFetchHandler(client: KraOscuClient, request: Request): Promise<Response> {
  let payload: OscuProxyPayload;
  try {
    payload = (await request.json()) as OscuProxyPayload;
  } catch {
    return Response.json({ message: "Invalid JSON body" }, { status: 400 });
  }
  if (!payload?.endpointKey) {
    return Response.json({ message: "endpointKey is required" }, { status: 400 });
  }
  try {
    const result = await dispatchOscuProxy(client, payload);
    return Response.json(result);
  } catch (error) {
    if (error instanceof KraOscuError) {
      const status = error.statusCode >= 400 && error.statusCode < 600 ? error.statusCode : 502;
      return Response.json(
        {
          message: error.message,
          resultCd: error.resultCd,
          resultMsg: error.resultMsg,
          endpointKey: error.endpointKey,
          url: error.url,
        },
        { status },
      );
    }
    const message = error instanceof Error ? error.message : "OSCU proxy error";
    return Response.json({ message }, { status: 500 });
  }
}

export function createOscuProxyHandler(config: KraOscuClientConfig) {
  const client = new KraOscuClient(config);
  return {
    client,
    dispatch: (payload: OscuProxyPayload) => dispatchOscuProxy(client, payload),
    fetch: (request: Request) => oscuProxyFetchHandler(client, request),
  };
}
