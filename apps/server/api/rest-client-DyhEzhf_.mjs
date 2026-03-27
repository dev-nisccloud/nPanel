
import { fileURLToPath as __fileURLToPath } from 'node:url';
import { dirname as __path_dirname } from 'node:path';
const __filename = __fileURLToPath(import.meta.url);
const __dirname = __path_dirname(__filename);

import { t as require_undici } from "./undici-CfTVRjpj.mjs";

//#region ../../packages/api/src/lib/plesk/rest-client.ts
var import_undici = require_undici();
const Sentry = {
	addBreadcrumb: (..._args) => {},
	captureException: (..._args) => {}
};
const PLESK_REST_ENDPOINT = process.env.PLESK_REST_ENDPOINT ?? "https://your-plesk-host:8443/api/modules/wp-toolkit";
const PLESK_SECRET_KEY = process.env.PLESK_SECRET_KEY;
const pleskRestAgent = new import_undici.Agent({
	connections: 5,
	pipelining: 1,
	keepAliveTimeout: 6e4,
	keepAliveMaxTimeout: 6e4
});
function isHostUnreachableError(error) {
	const message = error.message.toLowerCase();
	const name = error.name.toLowerCase();
	return message.includes("econnrefused") || message.includes("econnaborted") || message.includes("enotfound") || message.includes("enetunreach") || message.includes("timeout") || name === "timeouterror" || name === "aborterror";
}
function isAuthError(error, statusCode) {
	const message = error.message.toLowerCase();
	return message.includes("401") || message.includes("403") || message.includes("unauthorized") || message.includes("forbidden") || statusCode === 401 || statusCode === 403;
}
async function sendPleskRestRequest(endpoint, method = "GET", body) {
	console.log("Starting Plesk REST request...");
	console.log("PLESK_REST_ENDPOINT:", PLESK_REST_ENDPOINT);
	console.log("Endpoint:", endpoint);
	console.log("Method:", method);
	console.log("Has SECRET_KEY:", !!PLESK_SECRET_KEY);
	const fullUrl = `${PLESK_REST_ENDPOINT}${endpoint}`;
	if (!PLESK_REST_ENDPOINT) throw new Error("PLESK_REST_ENDPOINT environment variable is required");
	if (!PLESK_SECRET_KEY) throw new Error("PLESK_SECRET_KEY environment variable is required. Secret key authentication only (basic auth temporarily disabled for testing).");
	Sentry.addBreadcrumb({
		message: "Plesk REST request started",
		category: "plesk-rest-api",
		level: "info",
		data: {
			endpoint: fullUrl,
			method,
			bodyLength: body ? JSON.stringify(body).length : 0
		}
	});
	try {
		await (0, import_undici.request)(fullUrl, {
			method: "HEAD",
			dispatcher: pleskRestAgent,
			signal: AbortSignal.timeout(5e3)
		});
		Sentry.addBreadcrumb({
			message: "Host reachability check passed",
			category: "plesk-rest-api",
			level: "debug",
			data: { endpoint: fullUrl }
		});
	} catch (error) {
		const err = error;
		console.log("Host reachability check failed:", err.message);
		Sentry.addBreadcrumb({
			message: "Host reachability check failed",
			category: "plesk-rest-api",
			level: "warning",
			data: {
				endpoint: fullUrl,
				error: err.message,
				code: err.code || "unknown"
			}
		});
	}
	try {
		console.log("Building request headers...");
		const headers = {
			"Content-Type": "application/json",
			"Accept": "application/json",
			"User-Agent": "npanel-Server/1.0"
		};
		if (PLESK_SECRET_KEY) {
			console.log("Using SECRET_KEY authentication (secret key only mode)");
			headers["X-API-Key"] = PLESK_SECRET_KEY;
		} else throw new Error("PLESK_SECRET_KEY is required. Basic auth is temporarily disabled for testing.");
		console.log("Making request to:", fullUrl);
		const startTime = Date.now();
		const requestOptions = {
			method,
			headers,
			dispatcher: pleskRestAgent,
			signal: AbortSignal.timeout(3e4)
		};
		if (body && (method === "POST" || method === "PUT" || method === "DELETE" || method === "PATCH")) requestOptions.body = JSON.stringify(body);
		const response = await (0, import_undici.request)(fullUrl, requestOptions);
		const duration = Date.now() - startTime;
		const isAuthError$1 = response.statusCode === 401 || response.statusCode === 403;
		if (!isAuthError$1) {
			Sentry.addBreadcrumb({
				message: "Plesk REST request successful",
				category: "plesk-rest-api",
				level: "info",
				data: {
					status: response.statusCode,
					duration,
					responseLength: response.headers["content-length"] || "unknown"
				}
			});
			Sentry.addBreadcrumb({
				message: `Plesk REST Request completed in ${duration}ms`,
				category: "performance",
				level: "info",
				data: {
					operation: "Plesk REST Request",
					duration,
					success: true
				}
			});
		} else {
			Sentry.addBreadcrumb({
				message: "Plesk REST request failed - Auth Error",
				category: "plesk-rest-api",
				level: "warning",
				data: {
					status: response.statusCode,
					duration
				}
			});
			Sentry.addBreadcrumb({
				message: `Plesk REST Request failed in ${duration}ms`,
				category: "performance",
				level: "warning",
				data: {
					operation: "Plesk REST Request",
					duration,
					success: false
				}
			});
		}
		const responseText = await response.body.text();
		let responseData = null;
		if (responseText.trim() === "") responseData = null;
		else try {
			responseData = JSON.parse(responseText);
		} catch (parseError) {
			console.warn("Failed to parse JSON response:", parseError);
			responseData = responseText;
		}
		return {
			data: responseData,
			isAuthError: isAuthError$1,
			isHostUnreachable: false,
			statusCode: response.statusCode
		};
	} catch (error) {
		const err = error;
		console.error("Plesk REST request failed:", err);
		console.error("Error details:", {
			name: err.name,
			message: err.message,
			code: err.code,
			stack: err.stack
		});
		const isHostUnreachable = isHostUnreachableError(err);
		const isAuthErrorResult = isAuthError(err);
		if (isHostUnreachable) {
			Sentry.captureException(err, {
				tags: {
					component: "plesk-rest-api",
					endpoint: fullUrl,
					method,
					statusCode: "0"
				},
				extra: {
					endpoint: fullUrl,
					method,
					statusCode: 0,
					serverTime: (/* @__PURE__ */ new Date()).toISOString()
				}
			});
			Sentry.addBreadcrumb({
				message: "Plesk host unreachable",
				category: "plesk-rest-api",
				level: "error",
				data: {
					endpoint: fullUrl,
					error: err.message,
					errorType: err.name,
					code: err.code || "unknown"
				}
			});
		} else {
			Sentry.captureException(err, {
				tags: {
					component: "plesk-rest-api",
					endpoint: fullUrl,
					method,
					statusCode: isAuthErrorResult ? "401" : "500"
				},
				extra: {
					endpoint: fullUrl,
					method,
					statusCode: isAuthErrorResult ? 401 : 500,
					serverTime: (/* @__PURE__ */ new Date()).toISOString()
				}
			});
			Sentry.addBreadcrumb({
				message: "Plesk REST request failed",
				category: "plesk-rest-api",
				level: "error",
				data: {
					endpoint: fullUrl,
					error: err.message,
					errorType: err.name,
					code: err.code || "unknown",
					isAuthError: isAuthErrorResult
				}
			});
		}
		return {
			data: null,
			isAuthError: isAuthErrorResult,
			isHostUnreachable,
			statusCode: 0
		};
	}
}

//#endregion
export { sendPleskRestRequest as t };