import { TRPCError } from "@trpc/server";

const HIVELOCITY_BASE_URL = "https://core.hivelocity.net/api/v2";

type HivelocityRequestOptions = {
	method?: "GET" | "POST" | "PUT" | "DELETE";
	query?: Record<string, string | number | boolean | null | undefined>;
	/** JSON request body (for POST/PUT). */
	body?: unknown;
	headers?: Record<string, string | undefined>;
	/** If true, throws when `HIVELOCITY_API_KEY` is missing. */
	requireApiKey?: boolean;
};

function getHivelocityApiKey(): string | undefined {
	const key = process.env.HIVELOCITY_API_KEY;
	return typeof key === "string" && key.trim().length > 0 ? key.trim() : undefined;
}

function buildUrl(path: string, query?: HivelocityRequestOptions["query"]): string {
	// Important: `new URL("/foo", "https://host/api/v2")` drops the `/api/v2` prefix.
	// We always want `${HIVELOCITY_BASE_URL}${path}`.
	const normalizedPath = path.startsWith("/") ? path : `/${path}`;
	const url = new URL(`${HIVELOCITY_BASE_URL}${normalizedPath}`);
	if (query) {
		for (const [k, v] of Object.entries(query)) {
			if (v === undefined || v === null) continue;
			url.searchParams.set(k, String(v));
		}
	}
	return url.toString();
}

export async function hivelocityRequest<T>(path: string, options: HivelocityRequestOptions = {}): Promise<T> {
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
	let json: unknown = null;
	try {
		json = text.length ? JSON.parse(text) : null;
	} catch {
		json = null;
	}

	if (!resp.ok) {
		const messageFromBody =
			(json && typeof json === "object" && json !== null && "message" in json && typeof (json as any).message === "string")
				? (json as any).message
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

	return (json as T) ?? (null as T);
}

export function getHivelocityEnvStatus() {
	const apiKey = getHivelocityApiKey();
	return {
		hasApiKey: !!apiKey,
		baseUrl: HIVELOCITY_BASE_URL,
	};
}
