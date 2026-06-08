const IP_HEADERS = ["x-forwarded-for", "x-real-ip", "cf-connecting-ip"] as const;

export function readClientIpFromHeaders(headers: Headers): string | null {
  for (const name of IP_HEADERS) {
    const value = headers.get(name);
    if (value) {
      return value.split(",")[0]?.trim() || null;
    }
  }
  return null;
}

/** Local Vite proxy → API requests often omit forwarded IP headers. */
export function ensureClientIpOnRequest(request: Request): Request {
  if (readClientIpFromHeaders(request.headers)) {
    return request;
  }

  const headers = new Headers(request.headers);
  headers.set("x-forwarded-for", "127.0.0.1");

  if (request.method === "GET" || request.method === "HEAD") {
    return new Request(request.url, { method: request.method, headers });
  }

  return new Request(request.url, {
    method: request.method,
    headers,
    body: request.body,
    duplex: "half",
  } as RequestInit);
}
