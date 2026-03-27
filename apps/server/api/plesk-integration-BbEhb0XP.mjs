
import { fileURLToPath as __fileURLToPath } from 'node:url';
import { dirname as __path_dirname } from 'node:path';
const __filename = __fileURLToPath(import.meta.url);
const __dirname = __path_dirname(__filename);

import { Bt as userProfile, Lt as customerIntegration, Rt as customerIntegrationActivityLog, bn as user, n as src_exports, t as db } from "./src-DdNUZRe_.mjs";
import { t as XMLParser } from "./fxp-BQBBx0DA.mjs";
import { t as require_undici } from "./undici-CfTVRjpj.mjs";
import * as crypto from "crypto";

//#region ../../packages/api/src/lib/plesk/xml-client.ts
var import_undici = require_undici();
const Sentry = {
	addBreadcrumb: (..._args) => {},
	captureException: (..._args) => {}
};
const PLESK_XML_ENDPOINT = process.env.PLESK_XML_ENDPOINT ?? "https://your-plesk-host:8443/enterprise/control/agent.php";
const PLESK_SECRET_KEY = process.env.PLESK_SECRET_KEY;
const pleskAgent = new import_undici.Agent({
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
async function sendPleskXmlRequest(xmlPayload) {
	console.log("Starting Plesk XML request...");
	console.log("PLESK_XML_ENDPOINT:", PLESK_XML_ENDPOINT);
	console.log("Has SECRET_KEY:", !!PLESK_SECRET_KEY);
	const trimmedPayload = xmlPayload.trim();
	if (!trimmedPayload.includes("<packet")) throw new Error("Invalid XML payload: Must contain <packet> element");
	if (!PLESK_XML_ENDPOINT) throw new Error("PLESK_XML_ENDPOINT environment variable is required");
	if (!PLESK_SECRET_KEY) throw new Error("PLESK_SECRET_KEY environment variable is required. Secret key authentication only (basic auth temporarily disabled for testing).");
	Sentry.addBreadcrumb({
		message: "Plesk XML request started",
		category: "plesk-api",
		level: "info",
		data: {
			endpoint: PLESK_XML_ENDPOINT,
			payloadLength: trimmedPayload.length
		}
	});
	(0, import_undici.request)(PLESK_XML_ENDPOINT, {
		method: "HEAD",
		dispatcher: pleskAgent,
		signal: AbortSignal.timeout(5e3)
	}).then(() => {
		console.log("Host reachability check passed");
	}).catch(() => {});
	try {
		console.log("Building request headers...");
		const headers = {
			"Content-Type": "text/xml",
			"HTTP_PRETTY_PRINT": "TRUE",
			"User-Agent": "npanel-Server/1.0"
		};
		if (PLESK_SECRET_KEY) {
			console.log("Using SECRET_KEY authentication (secret key only mode)");
			headers["KEY"] = PLESK_SECRET_KEY;
		} else throw new Error("PLESK_SECRET_KEY is required. Basic auth is temporarily disabled for testing.");
		console.log("Making request to:", PLESK_XML_ENDPOINT);
		const startTime = Date.now();
		const response = await (0, import_undici.request)(PLESK_XML_ENDPOINT, {
			method: "POST",
			headers,
			body: xmlPayload,
			dispatcher: pleskAgent,
			signal: AbortSignal.timeout(3e4)
		});
		const duration = Date.now() - startTime;
		const isAuthError$1 = response.statusCode === 401 || response.statusCode === 403;
		if (!isAuthError$1) {
			Sentry.addBreadcrumb({
				message: "Plesk XML request successful",
				category: "plesk-api",
				level: "info",
				data: {
					status: response.statusCode,
					duration,
					responseLength: response.headers["content-length"] || "unknown"
				}
			});
			Sentry.addBreadcrumb({
				message: `Plesk XML Request completed in ${duration}ms`,
				category: "performance",
				level: "info",
				data: {
					operation: "Plesk XML Request",
					duration,
					success: true
				}
			});
		} else {
			Sentry.addBreadcrumb({
				message: "Plesk XML request failed - Auth Error",
				category: "plesk-api",
				level: "warning",
				data: {
					status: response.statusCode,
					duration
				}
			});
			Sentry.addBreadcrumb({
				message: `Plesk XML Request failed in ${duration}ms`,
				category: "performance",
				level: "warning",
				data: {
					operation: "Plesk XML Request",
					duration,
					success: false
				}
			});
		}
		return {
			xml: await response.body.text(),
			isAuthError: isAuthError$1,
			isHostUnreachable: false
		};
	} catch (error) {
		const err = error;
		console.error("Plesk XML request failed:", err);
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
					component: "api-route",
					route: PLESK_XML_ENDPOINT,
					method: "POST",
					statusCode: "0"
				},
				extra: {
					route: PLESK_XML_ENDPOINT,
					method: "POST",
					statusCode: 0,
					serverTime: (/* @__PURE__ */ new Date()).toISOString()
				}
			});
			Sentry.addBreadcrumb({
				message: "Plesk host unreachable",
				category: "plesk-api",
				level: "error",
				data: {
					endpoint: PLESK_XML_ENDPOINT,
					error: err.message,
					errorType: err.name,
					code: err.code || "unknown"
				}
			});
		} else {
			Sentry.captureException(err, {
				tags: {
					component: "api-route",
					route: PLESK_XML_ENDPOINT,
					method: "POST",
					statusCode: isAuthErrorResult ? "401" : "500"
				},
				extra: {
					route: PLESK_XML_ENDPOINT,
					method: "POST",
					statusCode: isAuthErrorResult ? 401 : 500,
					serverTime: (/* @__PURE__ */ new Date()).toISOString()
				}
			});
			Sentry.addBreadcrumb({
				message: "Plesk XML request failed",
				category: "plesk-api",
				level: "error",
				data: {
					endpoint: PLESK_XML_ENDPOINT,
					error: err.message,
					errorType: err.name,
					code: err.code || "unknown",
					isAuthError: isAuthErrorResult
				}
			});
		}
		return {
			xml: null,
			isAuthError: isAuthErrorResult,
			isHostUnreachable
		};
	}
}

//#endregion
//#region ../../packages/api/src/lib/plesk-integration.ts
/**
* Shared Plesk integration helpers: ensure customer exists in Plesk, provision webspace.
* Used by orders router and NISC order processor.
*
* XML structures and tooling must match the canonical Plesk routers:
* - Customer add: packages/api/src/routers/plesk/customers-create.ts (buildCustomerCreateXml)
* - Webspace add: packages/api/src/routers/plesk/subscriptions-create.ts (buildSubscriptionCreateXml)
* - Transport: packages/api/src/lib/plesk/xml-client.ts (sendPleskXmlRequest)
*
* Plesk docs: Creating a Subscription (plan-id / plan-name), customer add gen_info.
*/
async function ensurePleskIntegration(teamOwnerId, createdBy) {
	const [integrationRow] = await db.select({
		id: customerIntegration.id,
		platformCustomerId: customerIntegration.platformCustomerId,
		isCreated: customerIntegration.isCreated
	}).from(customerIntegration).where((0, src_exports.and)((0, src_exports.eq)(customerIntegration.userId, teamOwnerId), (0, src_exports.eq)(customerIntegration.platform, "PLESK"))).limit(1);
	if (integrationRow?.isCreated && integrationRow.platformCustomerId) return integrationRow.platformCustomerId;
	const [userRow] = await db.select({
		id: user.id,
		name: user.name,
		email: user.email,
		firstName: userProfile.firstName,
		lastName: userProfile.lastName,
		phone: userProfile.phone,
		address: userProfile.address,
		city: userProfile.city,
		state: userProfile.state,
		country: userProfile.country,
		postalCode: userProfile.postalCode,
		profileUserId: userProfile.userId
	}).from(user).leftJoin(userProfile, (0, src_exports.eq)(userProfile.userId, user.id)).where((0, src_exports.eq)(user.id, teamOwnerId)).limit(1);
	if (!userRow) throw new Error("Team owner not found");
	if (!userRow.profileUserId) throw new Error("Team owner profile is incomplete. Please ask the customer to complete their profile information.");
	const ownerUser = {
		name: userRow.name,
		email: userRow.email,
		profile: {
			firstName: userRow.firstName ?? "",
			lastName: userRow.lastName ?? "",
			phone: userRow.phone ?? "",
			address: userRow.address ?? "",
			city: userRow.city ?? "",
			state: userRow.state ?? null,
			country: userRow.country ?? "",
			postalCode: userRow.postalCode ?? ""
		}
	};
	const profile = ownerUser.profile;
	if ([
		profile.firstName,
		profile.lastName,
		profile.address,
		profile.city,
		profile.country,
		profile.postalCode,
		profile.phone
	].some((field) => !field || String(field).trim() === "")) throw new Error("Team owner profile is incomplete. Required fields: first name, last name, address, city, country, postal code, phone. Please ask the customer to complete their profile information.");
	const escapeXml = (str) => str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
	const generateRandomLogin = () => {
		const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
		let result = "";
		for (let i = 0; i < 6; i++) result += letters.charAt(Math.floor(Math.random() * 52));
		return result;
	};
	const login = generateRandomLogin();
	const password = Math.random().toString(36).slice(-12) + "A1!";
	const { xml, isAuthError: isAuthError$1, isHostUnreachable } = await sendPleskXmlRequest(`<?xml version="1.0" encoding="UTF-8"?>
<packet>
  <customer>
    <add>
      <gen_info>
        <cname></cname>
        <pname>${escapeXml(ownerUser.name || `${profile.firstName} ${profile.lastName}`)}</pname>
        <login>${escapeXml(login)}</login>
        <passwd>${escapeXml(password)}</passwd>
        <email>${escapeXml(ownerUser.email ?? "")}</email>
        ${profile.address ? `<address>${escapeXml(profile.address)}</address>` : "<address></address>"}
        ${profile.city ? `<city>${escapeXml(profile.city)}</city>` : "<city></city>"}
        ${profile.state ? `<state>${escapeXml(profile.state)}</state>` : "<state></state>"}
        ${profile.postalCode ? `<pcode>${escapeXml(String(profile.postalCode))}</pcode>` : "<pcode></pcode>"}
        <country>${profile.country ? escapeXml(profile.country === "Kenya" ? "KE" : profile.country) : ""}</country>
        <locale>en-US</locale>
        <owner-id>1</owner-id>
        <description></description>
      </gen_info>
    </add>
  </customer>
</packet>`);
	if (isHostUnreachable) throw new Error("Plesk host is unreachable");
	if (isAuthError$1) throw new Error("Invalid Plesk credentials");
	if (!xml || xml.trim() === "") throw new Error("Empty response from Plesk server");
	const parsed = new XMLParser({ ignoreAttributes: false }).parse(xml);
	if (parsed?.packet?.system?.status === "error") {
		const errCode = parsed.packet.system.errcode;
		const errText = parsed.packet.system.errtext;
		throw new Error(`Plesk API Error ${errCode}: ${errText}`);
	}
	if (parsed?.packet?.customer?.add?.result?.status === "error") throw new Error(`Customer creation failed: ${parsed.packet.customer.add.result.errtext}`);
	const customerId = parsed?.packet?.customer?.add?.result?.id?.["#text"] ?? parsed?.packet?.customer?.add?.result?.id;
	if (!customerId) throw new Error("Failed to create Plesk customer: customer ID not found in response");
	const now = /* @__PURE__ */ new Date();
	let integrationId;
	if (integrationRow?.id) integrationId = (await db.update(customerIntegration).set({
		platformCustomerId: String(customerId),
		isCreated: true,
		isActive: true,
		lastSyncedAt: now,
		updatedAt: now,
		platformData: parsed
	}).where((0, src_exports.eq)(customerIntegration.id, integrationRow.id)).returning({ id: customerIntegration.id }))[0]?.id ?? integrationRow.id;
	else integrationId = (await db.insert(customerIntegration).values({
		id: crypto.randomUUID(),
		userId: teamOwnerId,
		platform: "PLESK",
		platformCustomerId: String(customerId),
		isCreated: true,
		isActive: true,
		createdBy,
		createdAt: now,
		lastSyncedAt: now,
		updatedAt: now,
		platformData: parsed
	}).returning({ id: customerIntegration.id }))[0]?.id ?? crypto.randomUUID();
	await db.insert(customerIntegrationActivityLog).values({
		id: crypto.randomUUID(),
		userId: teamOwnerId,
		customerIntegrationId: integrationId,
		action: "CREATED",
		description: "Plesk customer integration created (e.g. during order creation)",
		metadata: {
			customerId: String(customerId),
			createdBy
		},
		createdAt: now
	});
	return String(customerId);
}
async function provisionToPlesk(input) {
	const generateRandomLogin = () => {
		const letters = "abcdefghijklmnopqrstuvwxyz0123456789";
		let result$1 = "ftp";
		for (let i = 0; i < 6; i++) result$1 += letters.charAt(Math.floor(Math.random() * 36));
		return result$1;
	};
	const generateRandomPassword = () => Math.random().toString(36).slice(-12) + "A1!";
	const ftpLogin = generateRandomLogin();
	const ftpPassword = generateRandomPassword();
	const escapeXml = (str) => str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
	const planIdNumber = parseInt(input.pleskServicePlanId, 10);
	const planSection = !Number.isNaN(planIdNumber) && planIdNumber.toString() === input.pleskServicePlanId ? `<plan-id>${planIdNumber}</plan-id>` : `<plan-name>${escapeXml(input.pleskServicePlanId)}</plan-name>`;
	const { xml, isAuthError: isAuthError$1, isHostUnreachable } = await sendPleskXmlRequest(`<?xml version="1.0" encoding="UTF-8"?>
<packet>
  <webspace>
    <add>
      <gen_setup>
        <name>${escapeXml(input.domainName)}</name>
        <owner-id>${input.pleskOwnerId}</owner-id>
        ${input.ipAddress ? `<ip_address>${escapeXml(input.ipAddress)}</ip_address>` : ""}
        <status>0</status>
        <htype>vrt_hst</htype>
        ${input.description ? `<description>${escapeXml(input.description)}</description>` : ""}
        ${input.adminDescription ? `<admin-description>${escapeXml(input.adminDescription)}</admin-description>` : ""}
      </gen_setup>
      <hosting>
        <vrt_hst>
          <property><name>ftp_login</name><value>${escapeXml(ftpLogin)}</value></property>
          <property><name>ftp_password</name><value>${escapeXml(ftpPassword)}</value></property>
        </vrt_hst>
      </hosting>
      ${planSection}
    </add>
  </webspace>
</packet>`);
	if (isHostUnreachable) throw new Error("Plesk host is unreachable");
	if (isAuthError$1) throw new Error("Invalid Plesk credentials");
	if (!xml || xml.trim() === "") throw new Error("Empty response from Plesk server");
	const parsed = new XMLParser({ ignoreAttributes: false }).parse(xml);
	const result = parsed?.packet?.webspace?.add?.result;
	if (!result) throw new Error("Invalid response structure from Plesk - missing result");
	if (result.status === "error") {
		const code = result.errcode || "unknown";
		const text = result.errtext || "Unknown error from Plesk";
		throw new Error(`Plesk error ${code}: ${text}`);
	}
	let pleskServiceId = null;
	if (result.id) pleskServiceId = typeof result.id === "object" && result.id["#text"] ? result.id["#text"] : result.id;
	if (!pleskServiceId && result["filter-id"]) pleskServiceId = typeof result["filter-id"] === "object" && result["filter-id"]["#text"] ? result["filter-id"]["#text"] : result["filter-id"];
	if (!pleskServiceId) throw new Error(`Failed to create Plesk subscription: service ID not found. ${JSON.stringify(result)}`);
	const pleskStatusText = result?.status?.["#text"] ?? result?.status;
	let pleskStatus = 0;
	if (pleskStatusText) if (typeof pleskStatusText === "string" && pleskStatusText.toLowerCase() === "ok") pleskStatus = 0;
	else {
		const n = parseInt(String(pleskStatusText), 10);
		pleskStatus = Number.isNaN(n) ? 0 : n;
	}
	const pleskGuid = result?.guid?.["#text"] ?? result?.guid ?? null;
	return {
		pleskServiceId: String(pleskServiceId),
		pleskFtpLogin: ftpLogin,
		pleskFtpPassword: ftpPassword,
		pleskStatus,
		pleskGuid: pleskGuid != null ? String(pleskGuid) : null,
		pleskResponseData: parsed
	};
}

//#endregion
export { provisionToPlesk as n, sendPleskXmlRequest as r, ensurePleskIntegration as t };