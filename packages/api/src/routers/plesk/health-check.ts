import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { XMLParser } from "fast-xml-parser";
import { publicProcedure, router } from "../../trpc";
import { sendPleskXmlRequest } from "../../lib/plesk/xml-client";
import { sendPleskRestRequest } from "../../lib/plesk/rest-client";

/**
 * Plesk Health Check Router
 * Tests connectivity to Plesk XML and REST APIs without making actual requests
 */
export const pleskHealthCheckRouter = router({
	/**
	 * Test Plesk XML API connection
	 * Makes a minimal request to verify connectivity and authentication
	 */
	testXmlConnection: publicProcedure
		.input(z.object({}).optional().default({}))
		.query(async () => {
			try {
				// Check environment variables
				const hasXmlEndpoint = !!process.env.PLESK_XML_ENDPOINT;
				const hasSecretKey = !!process.env.PLESK_SECRET_KEY;
				const hasUsername = !!process.env.PLESK_XML_USERNAME;
				const hasPassword = !!process.env.PLESK_XML_PASSWORD;

				if (!hasXmlEndpoint) {
					return {
						status: "error",
						message: "PLESK_XML_ENDPOINT environment variable is not set",
						details: {
							has_xml_endpoint: false,
							has_secret_key: hasSecretKey,
							has_username: hasUsername,
							has_password: hasPassword,
						},
					};
				}

				if (!hasSecretKey && !(hasUsername && hasPassword)) {
					return {
						status: "error",
						message: "Plesk authentication credentials not configured. Set either PLESK_SECRET_KEY or both PLESK_XML_USERNAME and PLESK_XML_PASSWORD",
						details: {
							has_xml_endpoint: true,
							has_secret_key: hasSecretKey,
							has_username: hasUsername,
							has_password: hasPassword,
						},
					};
				}

				// Make a minimal XML request to test connection
				// Using server.get request which is lightweight
				const testXml = `<?xml version="1.0"?>
<packet version="1.6.9.1">
	<server>
		<get>
			<gen_info/>
		</get>
	</server>
</packet>`;

				const startTime = Date.now();
				const { xml, isAuthError, isHostUnreachable } = await sendPleskXmlRequest(testXml);
				const duration = Date.now() - startTime;

				// Check for connection errors
				if (isHostUnreachable) {
					return {
						status: "error",
						message: "Plesk XML API host is unreachable",
						details: {
							has_xml_endpoint: true,
							has_secret_key: hasSecretKey,
							has_username: hasUsername,
							has_password: hasPassword,
							response_time_ms: duration,
							is_host_unreachable: true,
							is_auth_error: isAuthError,
						},
					};
				}

				if (isAuthError) {
					return {
						status: "error",
						message: "Plesk XML API authentication failed",
						details: {
							has_xml_endpoint: true,
							has_secret_key: hasSecretKey,
							has_username: hasUsername,
							has_password: hasPassword,
							response_time_ms: duration,
							is_host_unreachable: false,
							is_auth_error: true,
						},
					};
				}

				// Parse XML response
				if (!xml || xml.trim() === '') {
					return {
						status: "error",
						message: "Empty response from Plesk XML API",
						details: {
							has_xml_endpoint: true,
							has_secret_key: hasSecretKey,
							has_username: hasUsername,
							has_password: hasPassword,
							response_time_ms: duration,
							is_host_unreachable: false,
							is_auth_error: false,
						},
					};
				}

				const parser = new XMLParser({ ignoreAttributes: false });
				let parsed: any;
				try {
					parsed = parser.parse(xml);
				} catch (parseError) {
					return {
						status: "error",
						message: "Failed to parse Plesk XML response",
						details: {
							has_xml_endpoint: true,
							has_secret_key: hasSecretKey,
							has_username: hasUsername,
							has_password: hasPassword,
							response_time_ms: duration,
							is_host_unreachable: false,
							is_auth_error: false,
							parse_error: parseError instanceof Error ? parseError.message : "Unknown parse error",
							raw_xml: xml.substring(0, 500), // First 500 chars for debugging
						},
					};
				}

				// Check for errors in parsed response
				if (parsed?.packet?.system?.status === "error") {
					const errorCode = parsed.packet.system.errcode;
					const errorText = parsed.packet.system.errtext || "Unknown error";

					return {
						status: "error",
						message: `Plesk XML API returned an error: ${errorText}`,
						details: {
							has_xml_endpoint: true,
							has_secret_key: hasSecretKey,
							has_username: hasUsername,
							has_password: hasPassword,
							error_code: errorCode,
							error_text: errorText,
							response_time_ms: duration,
							is_host_unreachable: false,
							is_auth_error: false,
							raw_response: parsed,
						},
					};
				}

				// Success
				return {
					status: "healthy",
					message: "Plesk XML API connection successful",
					details: {
						has_xml_endpoint: true,
						has_secret_key: hasSecretKey,
						has_username: hasUsername,
						has_password: hasPassword,
						response_time_ms: duration,
						is_host_unreachable: false,
						is_auth_error: false,
						server_info: parsed?.packet?.server?.get?.result?.gen_info || null,
						raw_response: parsed,
					},
				};
			} catch (error) {
				return {
					status: "error",
					message: "Failed to test Plesk XML API connection",
					details: {
						error: error instanceof Error ? error.message : "Unknown error",
						error_type: error instanceof Error ? error.constructor.name : typeof error,
					},
				};
			}
		}),

	/**
	 * Test Plesk REST API connection
	 * Makes a minimal request to verify connectivity and authentication
	 */
	testRestConnection: publicProcedure
		.input(z.object({}).optional().default({}))
		.query(async () => {
			try {
				// Check environment variables
				const hasRestEndpoint = !!process.env.PLESK_REST_ENDPOINT;
				const hasSecretKey = !!process.env.PLESK_SECRET_KEY;
				const hasUsername = !!process.env.PLESK_XML_USERNAME;
				const hasPassword = !!process.env.PLESK_XML_PASSWORD;

				if (!hasRestEndpoint) {
					return {
						status: "error",
						message: "PLESK_REST_ENDPOINT environment variable is not set",
						details: {
							has_rest_endpoint: false,
							has_secret_key: hasSecretKey,
							has_username: hasUsername,
							has_password: hasPassword,
						},
					};
				}

				if (!hasSecretKey && !(hasUsername && hasPassword)) {
					return {
						status: "error",
						message: "Plesk authentication credentials not configured. Set either PLESK_SECRET_KEY or both PLESK_XML_USERNAME and PLESK_XML_PASSWORD",
						details: {
							has_rest_endpoint: true,
							has_secret_key: hasSecretKey,
							has_username: hasUsername,
							has_password: hasPassword,
						},
					};
				}

				// Make a minimal REST request to test connection
				// Using /v1/installations endpoint with limit=1 to make it lightweight
				// This endpoint is part of WordPress Toolkit REST API
				const startTime = Date.now();
				const result = await sendPleskRestRequest("/v1/installations?limit=1", "GET");
				const duration = Date.now() - startTime;

				// Check for errors
				if (result.isHostUnreachable) {
					return {
						status: "error",
						message: "Plesk REST API host is unreachable",
						details: {
							has_rest_endpoint: true,
							has_secret_key: hasSecretKey,
							has_username: hasUsername,
							has_password: hasPassword,
							response_time_ms: duration,
							is_host_unreachable: true,
							is_auth_error: result.isAuthError,
							status_code: result.statusCode,
						},
					};
				}

				if (result.isAuthError) {
					return {
						status: "error",
						message: "Plesk REST API authentication failed",
						details: {
							has_rest_endpoint: true,
							has_secret_key: hasSecretKey,
							has_username: hasUsername,
							has_password: hasPassword,
							response_time_ms: duration,
							is_host_unreachable: false,
							is_auth_error: true,
							status_code: result.statusCode,
						},
					};
				}

				if (result.statusCode && (result.statusCode < 200 || result.statusCode >= 300)) {
					return {
						status: "error",
						message: `Plesk REST API returned status ${result.statusCode}`,
						details: {
							has_rest_endpoint: true,
							has_secret_key: hasSecretKey,
							has_username: hasUsername,
							has_password: hasPassword,
							response_time_ms: duration,
							is_host_unreachable: result.isHostUnreachable,
							is_auth_error: result.isAuthError,
							status_code: result.statusCode,
							response_data: result.data,
						},
					};
				}

				// Success - REST API is working (even if no installations exist)
				return {
					status: "healthy",
					message: "Plesk REST API (WordPress Toolkit) connection successful",
					details: {
						has_rest_endpoint: true,
						has_secret_key: hasSecretKey,
						has_username: hasUsername,
						has_password: hasPassword,
						response_time_ms: duration,
						is_host_unreachable: false,
						is_auth_error: false,
						status_code: result.statusCode,
						note: "REST API is primarily for WordPress Toolkit. An empty response is normal if no WordPress installations exist.",
						response_data: result.data,
					},
				};
			} catch (error) {
				return {
					status: "error",
					message: "Failed to test Plesk REST API connection",
					details: {
						error: error instanceof Error ? error.message : "Unknown error",
						error_type: error instanceof Error ? error.constructor.name : typeof error,
					},
				};
			}
		}),

	/**
	 * Test both XML and REST API connections
	 * Comprehensive health check for Plesk integration
	 */
	testAll: publicProcedure
		.input(z.object({}).optional().default({}))
		.query(async () => {
			const [xmlResult, restResult] = await Promise.allSettled([
				// Test XML connection
				(async () => {
					const hasXmlEndpoint = !!process.env.PLESK_XML_ENDPOINT;
					const hasSecretKey = !!process.env.PLESK_SECRET_KEY;
					const hasUsername = !!process.env.PLESK_XML_USERNAME;
					const hasPassword = !!process.env.PLESK_XML_PASSWORD;

					if (!hasXmlEndpoint) {
						return {
							status: "error",
							message: "PLESK_XML_ENDPOINT not configured",
						};
					}

					if (!hasSecretKey && !(hasUsername && hasPassword)) {
						return {
							status: "error",
							message: "Plesk XML authentication not configured",
						};
					}

					const testXml = `<?xml version="1.0"?>
<packet version="1.6.9.1">
	<server>
		<get>
			<gen_info/>
		</get>
	</server>
</packet>`;

					const startTime = Date.now();
					const { xml, isAuthError, isHostUnreachable } = await sendPleskXmlRequest(testXml);
					const duration = Date.now() - startTime;

					if (isHostUnreachable) {
						return {
							status: "error",
							message: "Plesk XML API host is unreachable",
							response_time_ms: duration,
						};
					}

					if (isAuthError) {
						return {
							status: "error",
							message: "Plesk XML API authentication failed",
							response_time_ms: duration,
						};
					}

					if (!xml || xml.trim() === '') {
						return {
							status: "error",
							message: "Empty response from Plesk XML API",
							response_time_ms: duration,
						};
					}

					const parser = new XMLParser({ ignoreAttributes: false });
					let parsed: any;
					try {
						parsed = parser.parse(xml);
					} catch (parseError) {
						return {
							status: "error",
							message: "Failed to parse Plesk XML response",
							response_time_ms: duration,
						};
					}

					if (parsed?.packet?.system?.status === "error") {
						return {
							status: "error",
							message: `Plesk XML API error: ${parsed.packet.system.errtext || "Unknown error"}`,
							error_code: parsed.packet.system.errcode,
							response_time_ms: duration,
						};
					}

					return {
						status: "healthy",
						message: "Plesk XML API connection successful",
						response_time_ms: duration,
						server_info: parsed?.packet?.server?.get?.result?.gen_info || null,
					};
				})(),
				// Test REST connection
				(async () => {
					const hasRestEndpoint = !!process.env.PLESK_REST_ENDPOINT;
					const hasSecretKey = !!process.env.PLESK_SECRET_KEY;
					const hasUsername = !!process.env.PLESK_XML_USERNAME;
					const hasPassword = !!process.env.PLESK_XML_PASSWORD;

					if (!hasRestEndpoint) {
						return {
							status: "error",
							message: "PLESK_REST_ENDPOINT not configured",
						};
					}

					if (!hasSecretKey && !(hasUsername && hasPassword)) {
						return {
							status: "error",
							message: "Plesk REST authentication not configured",
						};
					}

					const startTime = Date.now();
					const result = await sendPleskRestRequest("/v1/installations?limit=1", "GET");
					const duration = Date.now() - startTime;

					if (result.isHostUnreachable) {
						return {
							status: "error",
							message: "Plesk REST API host is unreachable",
							response_time_ms: duration,
						};
					}

					if (result.isAuthError) {
						return {
							status: "error",
							message: "Plesk REST API authentication failed",
							response_time_ms: duration,
						};
					}

					if (result.statusCode && (result.statusCode < 200 || result.statusCode >= 300)) {
						return {
							status: "error",
							message: `Plesk REST API returned status ${result.statusCode}`,
							status_code: result.statusCode,
							response_time_ms: duration,
						};
					}

					return {
						status: "healthy",
						message: "Plesk REST API (WordPress Toolkit) connection successful",
						response_time_ms: duration,
					};
				})(),
			]);

			const xmlStatus = xmlResult.status === "fulfilled" ? xmlResult.value : { status: "error", message: xmlResult.reason?.message || "XML test failed" };
			const restStatus = restResult.status === "fulfilled" ? restResult.value : { status: "error", message: restResult.reason?.message || "REST test failed" };

			const overallStatus = xmlStatus.status === "healthy" && restStatus.status === "healthy" ? "healthy" : "error";

			return {
				status: overallStatus,
				message: overallStatus === "healthy" 
					? "All Plesk API connections are healthy" 
					: "One or more Plesk API connections failed",
				timestamp: new Date().toISOString(),
				xml_api: xmlStatus,
				rest_api: restStatus,
				environment: {
					has_xml_endpoint: !!process.env.PLESK_XML_ENDPOINT,
					has_rest_endpoint: !!process.env.PLESK_REST_ENDPOINT,
					has_secret_key: !!process.env.PLESK_SECRET_KEY,
					has_username: !!process.env.PLESK_XML_USERNAME,
					has_password: !!process.env.PLESK_XML_PASSWORD,
				},
			};
		}),
});

