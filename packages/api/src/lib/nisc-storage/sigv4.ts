import { createHash, createHmac, type BinaryLike } from "node:crypto";

function sha256Hex(value: BinaryLike): string {
	return createHash("sha256").update(value).digest("hex");
}

function hmac(key: BinaryLike, value: string): Buffer {
	return createHmac("sha256", key).update(value, "utf8").digest();
}

function encodeRfc3986(value: string): string {
	return encodeURIComponent(value).replace(
		/[!'()*]/g,
		(char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
	);
}

export async function signedFetch(options: {
	method: string;
	url: URL;
	service: "s3" | "iam";
	region: string;
	accessKey: string;
	secretKey: string;
	body?: string;
	headers?: Record<string, string>;
	timeoutMs?: number;
}): Promise<Response> {
	const method = options.method.toUpperCase();
	const body = options.body ?? "";
	const payloadHash = sha256Hex(body);
	const amzDate = new Date().toISOString().replace(/[:-]|\.\d{3}/g, "");
	const dateStamp = amzDate.slice(0, 8);
	const headerMap = new Map<string, string>();
	headerMap.set("host", options.url.host);
	headerMap.set("x-amz-content-sha256", payloadHash);
	headerMap.set("x-amz-date", amzDate);
	for (const [key, value] of Object.entries(options.headers ?? {})) {
		headerMap.set(key.toLowerCase(), value.trim());
	}

	const names = [...headerMap.keys()].sort();
	const canonicalHeaders = names.map((name) => `${name}:${headerMap.get(name)}\n`).join("");
	const signedHeaders = names.join(";");
	const canonicalQuery = [...options.url.searchParams.entries()]
		.map(([key, value]) => [encodeRfc3986(key), encodeRfc3986(value)] as const)
		.sort((left, right) => (left[0] === right[0] ? left[1].localeCompare(right[1]) : left[0].localeCompare(right[0])))
		.map(([key, value]) => `${key}=${value}`)
		.join("&");
	const canonicalUri =
		options.url.pathname
			.split("/")
			.map((segment) => encodeRfc3986(segment === "" ? "" : decodeURIComponent(segment)))
			.join("/") || "/";
	const canonicalRequest = [
		method,
		canonicalUri.startsWith("/") ? canonicalUri : `/${canonicalUri}`,
		canonicalQuery,
		canonicalHeaders,
		signedHeaders,
		payloadHash,
	].join("\n");
	const credentialScope = `${dateStamp}/${options.region}/${options.service}/aws4_request`;
	const stringToSign = [
		"AWS4-HMAC-SHA256",
		amzDate,
		credentialScope,
		sha256Hex(canonicalRequest),
	].join("\n");
	const signingKey = hmac(
		hmac(hmac(hmac(`AWS4${options.secretKey}`, dateStamp), options.region), options.service),
		"aws4_request",
	);
	const signature = createHmac("sha256", signingKey).update(stringToSign).digest("hex");
	const authorization = `AWS4-HMAC-SHA256 Credential=${options.accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
	const requestHeaders = new Headers();
	for (const name of names) {
		if (name === "host") continue;
		requestHeaders.set(name, headerMap.get(name) ?? "");
	}
	requestHeaders.set("authorization", authorization);

	return fetch(options.url, {
		method,
		headers: requestHeaders,
		body: body.length > 0 ? body : undefined,
		signal: AbortSignal.timeout(options.timeoutMs ?? 20_000),
	});
}
