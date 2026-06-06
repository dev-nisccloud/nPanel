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

export type HivelocityRequestTiming = {
	path: string;
	method: string;
	durationMs: number;
	responseBytes: number;
	status: number;
};

function shouldLogHivelocityTiming(durationMs: number): boolean {
	if (process.env.HIVELOCITY_DEBUG_TIMING === "true") return true;
	return durationMs >= 500;
}

export function logHivelocityRequestTiming(timing: HivelocityRequestTiming): void {
	if (!shouldLogHivelocityTiming(timing.durationMs)) return;
	console.info(
		`[hivelocity] ${timing.method} ${timing.path} ${timing.durationMs}ms status=${timing.status} bytes=${timing.responseBytes}`,
	);
}

/** Like `hivelocityRequest` but also returns per-call timing for diagnostics. */
export async function hivelocityRequestTimed<T>(
	path: string,
	options: HivelocityRequestOptions = {},
): Promise<{ data: T; timing: HivelocityRequestTiming }> {
	const apiKey = getHivelocityApiKey();
	if (options.requireApiKey && !apiKey) {
		throw new TRPCError({
			code: "INTERNAL_SERVER_ERROR",
			message: "HIVELOCITY_API_KEY environment variable is not set",
		});
	}

	const method = options.method ?? "GET";
	const startedAt = Date.now();
	const hasBody = options.body !== undefined;
	const resp = await fetch(buildUrl(path, options.query), {
		method,
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
	const durationMs = Date.now() - startedAt;
	const timing: HivelocityRequestTiming = {
		path,
		method,
		durationMs,
		responseBytes: text.length,
		status: resp.status,
	};
	logHivelocityRequestTiming(timing);

	let json: unknown = null;
	try {
		json = text.length ? JSON.parse(text) : null;
	} catch {
		json = null;
	}

	if (!resp.ok) {
		let messageFromBody = text?.slice(0, 500) || `${resp.status} ${resp.statusText}`;
		if (json && typeof json === "object" && json !== null) {
			const body = json as Record<string, unknown>;
			if (typeof body.message === "string" && body.message.trim()) {
				messageFromBody = body.message;
			} else if (Array.isArray(body.errors) && body.errors.length > 0) {
				messageFromBody = body.errors.map((e) => String(e)).join("; ");
			}
		}

		if (resp.status === 401 || resp.status === 403) {
			throw new TRPCError({ code: "UNAUTHORIZED", message: messageFromBody });
		}
		if (resp.status === 400) {
			throw new TRPCError({ code: "BAD_REQUEST", message: messageFromBody });
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

	return { data: (json as T) ?? (null as T), timing };
}

export async function hivelocityRequest<T>(path: string, options: HivelocityRequestOptions = {}): Promise<T> {
	const { data } = await hivelocityRequestTimed<T>(path, options);
	return data;
}

export function getHivelocityEnvStatus() {
	const apiKey = getHivelocityApiKey();
	const billingInfoId = process.env.HIVELOCITY_BILLING_INFO_ID?.trim();
	return {
		hasApiKey: !!apiKey,
		hasBillingInfoId: !!billingInfoId,
		baseUrl: HIVELOCITY_BASE_URL,
	};
}
