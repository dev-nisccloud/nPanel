const TRPC_BASE = "/api/trpc";

export const NPANEL_APP =
  import.meta.env.VITE_NPANEL_APP_URL ?? "https://npanel.nisccloud.com";

type TrpcBatchItem = {
  result?: { data?: unknown };
  error?: { message?: string };
};

function batchEnvelope(input: unknown): Record<string, unknown> {
  return { "0": input };
}

async function parseTrpcBatch(res: Response): Promise<unknown> {
  const batch = (await res.json()) as TrpcBatchItem[];
  if (batch[0]?.error) throw new Error(batch[0].error.message ?? "tRPC error");
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return batch[0]?.result?.data;
}

function unwrapTrpcData(data: unknown): unknown {
  if (
    data &&
    typeof data === "object" &&
    "json" in data &&
    (data as { json: unknown }).json !== undefined
  ) {
    return (data as { json: unknown }).json;
  }
  return data;
}

/** Same-origin tRPC calls  proxied to npanel-server in dev (Vite) and production (server.ts). */
export async function trpcQuery<T>(procedure: string, input?: unknown): Promise<T> {
  const params = new URLSearchParams({ batch: "1" });
  if (input !== undefined) {
    params.set("input", JSON.stringify(batchEnvelope(input)));
  }
  const res = await fetch(`${TRPC_BASE}/${procedure}?${params}`, {
    signal: AbortSignal.timeout(30_000),
  });
  return unwrapTrpcData(await parseTrpcBatch(res)) as T;
}

export async function trpcMutation<T>(procedure: string, input: unknown): Promise<T> {
  const res = await fetch(`${TRPC_BASE}/${procedure}?batch=1`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(batchEnvelope(input)),
    signal: AbortSignal.timeout(30_000),
  });
  return unwrapTrpcData(await parseTrpcBatch(res)) as T;
}

/**
 * Credentialed tRPC against the nPanel *app* origin (not the raw API host, not the
 * landing origin). Session cookies are set on the nPanel SPA host via its `/api`
 * proxy  calling that host is the only reliable way to send them from www.
 */
function credentialedTrpcBase(): string {
  return `${NPANEL_APP.replace(/\/+$/, "")}/api/trpc`;
}

export async function trpcCredentialedQuery<T>(
  procedure: string,
  input?: unknown,
): Promise<T> {
  const params = new URLSearchParams({ batch: "1" });
  if (input !== undefined) {
    params.set("input", JSON.stringify(batchEnvelope(input)));
  }
  const res = await fetch(`${credentialedTrpcBase()}/${procedure}?${params}`, {
    credentials: "include",
    signal: AbortSignal.timeout(30_000),
  });
  return unwrapTrpcData(await parseTrpcBatch(res)) as T;
}

export async function trpcCredentialedMutation<T>(
  procedure: string,
  input: unknown,
): Promise<T> {
  const res = await fetch(`${credentialedTrpcBase()}/${procedure}?batch=1`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(batchEnvelope(input)),
    signal: AbortSignal.timeout(30_000),
  });
  return unwrapTrpcData(await parseTrpcBatch(res)) as T;
}
