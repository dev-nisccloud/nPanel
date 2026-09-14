export type KraResult<T = unknown> = {
  resultCd: string | null;
  resultMsg: string | null;
  resultDt: string | null;
  data: T | null;
  statusCode: number;
  raw: unknown;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

/** Unwrap Gava Connect `responseBody` envelope or return the flat OSCU body. */
export function unwrapKraBody(raw: unknown): Record<string, unknown> {
  const root = asRecord(raw);
  if (!root) return {};
  const wrapped = asRecord(root.responseBody);
  return wrapped ?? root;
}

export function unwrapKraResult<T = unknown>(raw: unknown, statusCode: number): KraResult<T> {
  const body = unwrapKraBody(raw);
  const data = (body.data ?? null) as T | null;
  return {
    resultCd: typeof body.resultCd === "string" ? body.resultCd : null,
    resultMsg: typeof body.resultMsg === "string" ? body.resultMsg : null,
    resultDt: typeof body.resultDt === "string" ? body.resultDt : null,
    data,
    statusCode,
    raw,
  };
}

export function kraMessage(raw: unknown, fallback: string): string {
  const body = unwrapKraBody(raw);
  const root = asRecord(raw);
  const header = asRecord(root?.responseHeader);
  return (
    (typeof body.resultMsg === "string" && body.resultMsg) ||
    (typeof body.errorMessage === "string" && body.errorMessage) ||
    (typeof header?.customerMessage === "string" && header.customerMessage) ||
    (typeof header?.debugMessage === "string" && header.debugMessage) ||
    fallback
  );
}

export function isEmptySearch(statusCode: number, raw: unknown, text = ""): boolean {
  const body = unwrapKraBody(raw);
  if (body.resultCd === "001") return true;
  const msg = kraMessage(raw, text).toLowerCase();
  const looksEmpty = /no search result|there is no data|no data found/.test(msg);
  if (!looksEmpty) return false;
  return statusCode === 200 || statusCode === 400;
}

export function parseExpectedCounter(message: string): number | null {
  const m =
    message.match(/Expected:\s*(\d+)\s+but\s+found/i) ??
    message.match(/expected:\s*(\d+)\s+but\s+found/i);
  return m ? Number(m[1]) : null;
}

export function omitNullish<T>(value: T): T {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) {
    return value
      .filter((v) => v !== null && v !== undefined)
      .map((v) => omitNullish(v)) as unknown as T;
  }
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v === null || v === undefined) continue;
      out[k] = omitNullish(v);
    }
    return out as T;
  }
  return value;
}
