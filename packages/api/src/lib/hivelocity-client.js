import { TRPCError } from "@trpc/server";
const HIVELOCITY_BASE_URL = "https://core.hivelocity.net/api/v2";
function getHivelocityApiKey() {
    const key = process.env.HIVELOCITY_API_KEY;
    return typeof key === "string" && key.trim().length > 0 ? key.trim() : undefined;
}
function buildUrl(path, query) {
    // Important: `new URL("/foo", "https://host/api/v2")` drops the `/api/v2` prefix.
    // We always want `${HIVELOCITY_BASE_URL}${path}`.
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    const url = new URL(`${HIVELOCITY_BASE_URL}${normalizedPath}`);
    if (query) {
        for (const [k, v] of Object.entries(query)) {
            if (v === undefined || v === null)
                continue;
            url.searchParams.set(k, String(v));
        }
    }
    return url.toString();
}
export async function hivelocityRequest(path, options = {}) {
    const apiKey = getHivelocityApiKey();
    if (options.requireApiKey && !apiKey) {
        throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "HIVELOCITY_API_KEY environment variable is not set",
        });
    }
    const hasBody = options.body !== undefined;
    const resp = await fetch(buildUrl(path, options.query), {
        method: options.method ?? "GET",
        headers: {
            Accept: "application/json",
            ...(hasBody ? { "Content-Type": "application/json" } : {}),
            ...(apiKey ? { "X-API-KEY": apiKey } : {}),
            ...options.headers,
        },
        ...(hasBody ? { body: JSON.stringify(options.body) } : {}),
    });
    // Hivelocity responses are JSON; still guard for non-JSON error pages.
    const text = await resp.text();
    let json = null;
    try {
        json = text.length ? JSON.parse(text) : null;
    }
    catch {
        json = null;
    }
    if (!resp.ok) {
        const messageFromBody = (json && typeof json === "object" && json !== null && "message" in json && typeof json.message === "string")
            ? json.message
            : text?.slice(0, 500) || `${resp.status} ${resp.statusText}`;
        if (resp.status === 401 || resp.status === 403) {
            throw new TRPCError({ code: "UNAUTHORIZED", message: messageFromBody });
        }
        if (resp.status === 404) {
            throw new TRPCError({ code: "NOT_FOUND", message: messageFromBody });
        }
        if (resp.status === 429) {
            throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: messageFromBody });
        }
        throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Hivelocity API error: ${resp.status} ${resp.statusText}. ${messageFromBody}`,
        });
    }
    return json ?? null;
}
export function getHivelocityEnvStatus() {
    const apiKey = getHivelocityApiKey();
    return {
        hasApiKey: !!apiKey,
        baseUrl: HIVELOCITY_BASE_URL,
    };
}
