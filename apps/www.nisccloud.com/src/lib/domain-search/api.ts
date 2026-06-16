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

/** Same-origin tRPC calls  proxied to npanel-server in dev (Vite) and production (server.ts). */
export async function trpcQuery<T>(procedure: string, input?: unknown): Promise<T> {
  const params = new URLSearchParams({ batch: "1" });
  if (input !== undefined) {
    params.set("input", JSON.stringify(batchEnvelope(input)));
  }
  const res = await fetch(`${TRPC_BASE}/${procedure}?${params}`, {
    signal: AbortSignal.timeout(30_000),
  });
  return parseTrpcBatch(res) as T;
}

export async function trpcMutation<T>(procedure: string, input: unknown): Promise<T> {
  const res = await fetch(`${TRPC_BASE}/${procedure}?batch=1`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(batchEnvelope(input)),
    signal: AbortSignal.timeout(30_000),
  });
  return parseTrpcBatch(res) as T;
}
