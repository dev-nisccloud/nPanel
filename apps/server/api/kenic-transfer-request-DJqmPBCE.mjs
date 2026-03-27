
import { fileURLToPath as __fileURLToPath } from 'node:url';
import { dirname as __path_dirname } from 'node:path';
const __filename = __fileURLToPath(import.meta.url);
const __dirname = __path_dirname(__filename);

import { t as XMLParser } from "./fxp-BQBBx0DA.mjs";
import { TRPCError } from "@trpc/server";
import * as tls from "node:tls";

//#region ../../packages/api/src/lib/epp/epp-client.ts
/**
* EPP (Extensible Provisioning Protocol) client - minimal transport layer.
* Connects over TLS, reads/writes length-prefixed frames (RFC 5730/5734).
* Used for KENIC registry integration.
*/
const DEFAULT_TIMEOUT_MS = 3e4;
/**
* Read exactly n bytes from the socket (may take multiple read() calls).
*/
function readExactly(socket, n) {
	return new Promise((resolve, reject) => {
		const chunks = [];
		let total = 0;
		const onError = (err) => {
			cleanup();
			reject(err);
		};
		socket.once("error", onError);
		const tryRead = () => {
			const chunk = socket.read(n - total);
			if (chunk && chunk.length > 0) {
				chunks.push(chunk);
				total += chunk.length;
			}
			if (total >= n) {
				cleanup();
				resolve(Buffer.concat(chunks, n));
			}
		};
		const cleanup = () => {
			socket.removeListener("error", onError);
			socket.removeListener("readable", tryRead);
		};
		socket.on("readable", tryRead);
		tryRead();
	});
}
/**
* Read one EPP frame from the socket: 4-byte big-endian length then XML payload.
* Length includes the 4-byte header (RFC 5734).
*/
async function readFrame(socket) {
	const totalLength = (await readExactly(socket, 4)).readUInt32BE(0);
	if (totalLength < 4 || totalLength > 16777215) throw new Error(`Invalid EPP frame length: ${totalLength}`);
	return await readExactly(socket, totalLength - 4);
}
/**
* Send one EPP frame: 4-byte big-endian length (total frame size) then UTF-8 XML.
* Length includes the 4-byte header (RFC 5734).
*/
function sendFrame(socket, xml) {
	const payload = Buffer.from(xml, "utf8");
	const totalLength = 4 + payload.length;
	const header = Buffer.alloc(4);
	header.writeUInt32BE(totalLength, 0);
	socket.write(header);
	socket.write(payload);
}
/**
* Create a TLS connection to the EPP server. Caller must call socket.destroy() when done.
* Do not set encoding on the socket (required for readFrame to receive Buffers).
*/
function createConnection(config) {
	const { host, port, timeoutMs = DEFAULT_TIMEOUT_MS, tlsServername } = config;
	const servername = tlsServername?.trim() || host;
	return new Promise((resolve, reject) => {
		const socket = tls.connect({
			host,
			port,
			servername,
			rejectUnauthorized: true
		}, () => {
			socket.removeListener("error", onError);
			resolve(socket);
		});
		const onError = (err) => reject(err);
		socket.once("error", onError);
		socket.setTimeout(timeoutMs);
		socket.on("timeout", () => {
			socket.destroy(/* @__PURE__ */ new Error("EPP connection timeout"));
		});
	});
}
/**
* Connect to the EPP server over TLS and receive the server greeting.
* The server sends a greeting immediately upon connection (no login required).
* Socket is closed after reading the greeting.
*/
async function connectAndReceiveGreeting(config) {
	const { host, port, timeoutMs = DEFAULT_TIMEOUT_MS, tlsServername } = config;
	const servername = tlsServername?.trim() || host;
	const socket = tls.connect({
		host,
		port,
		servername,
		rejectUnauthorized: true
	}, () => {});
	socket.setTimeout(timeoutMs);
	socket.on("timeout", () => {
		socket.destroy(/* @__PURE__ */ new Error("EPP connection timeout"));
	});
	try {
		return { xml: (await readFrame(socket)).toString("utf8") };
	} finally {
		socket.destroy();
	}
}

//#endregion
//#region ../../packages/api/src/lib/epp/epp-xml.ts
/**
* EPP XML command builders for KENIC (RFC 5730, 5731).
* Object and extension URIs match the live greeting from registry.kenic.or.ke.
*/
/** Escape string for use inside XML text content. */
function escapeXml(s) {
	return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}
/** Default objURIs from KENIC greeting (contact, domain, host). */
const DEFAULT_OBJ_URIS = [
	"urn:ietf:params:xml:ns:contact-1.0",
	"urn:ietf:params:xml:ns:domain-1.0",
	"urn:ietf:params:xml:ns:host-1.0"
];
/** Default extURIs from KENIC greeting. */
const DEFAULT_EXT_URIS = [
	"urn:ietf:params:xml:ns:rgp-1.0",
	"urn:ietf:params:xml:ns:secDNS-1.1",
	"urn:ietf:params:xml:ns:epp:fee-1.0",
	"https://finance.coccaregistry.org"
];
/** Generate a unique client transaction ID (clTRID). */
function clTrId() {
	return `npanel-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}
/**
* Build EPP <login> command (RFC 5730).
* Use the same objURI and extURI as in the server greeting so the server enables those services.
*/
function buildLoginXml(clId, pw, options) {
	const objURIs = options?.objURIs ?? DEFAULT_OBJ_URIS;
	const extURIs = options?.extURIs ?? DEFAULT_EXT_URIS;
	const objUriElements = objURIs.map((u) => `<objURI>${escapeXml(u)}</objURI>`).join("");
	const extUriElements = extURIs.map((u) => `<extURI>${escapeXml(u)}</extURI>`).join("");
	return `<?xml version="1.0" encoding="UTF-8"?>
<epp xmlns="urn:ietf:params:xml:ns:epp-1.0">
  <command>
    <login>
      <clID>${escapeXml(clId)}</clID>
      <pw>${escapeXml(pw)}</pw>
      <options>
        <version>1.0</version>
        <lang>en</lang>
      </options>
      <svcs>
        ${objUriElements}
        <svcExtension>
          ${extUriElements}
        </svcExtension>
      </svcs>
    </login>
    <clTRID>${escapeXml(clTrId())}</clTRID>
  </command>
</epp>`;
}
/**
* Build EPP <logout> command (RFC 5730).
*/
function buildLogoutXml() {
	return `<?xml version="1.0" encoding="UTF-8"?>
<epp xmlns="urn:ietf:params:xml:ns:epp-1.0">
  <command>
    <logout/>
    <clTRID>${escapeXml(clTrId())}</clTRID>
  </command>
</epp>`;
}
/**
* Build EPP domain:check command (RFC 5731).
* @param domains - Full domain names (e.g. ["example.ke", "test.ke"]).
*/
function buildDomainCheckXml(domains) {
	return buildDomainCheckXmlInternal(domains, null);
}
/**
* Build EPP domain:check command with fee extension (RFC 8748).
* Server may return fee:chkData in the response extension with create/renew/transfer fees per domain.
*/
function buildDomainCheckWithFeeXml(domains, options) {
	return buildDomainCheckXmlInternal(domains, options ?? {});
}
function buildDomainCheckXmlInternal(domains, feeOptions) {
	const nameElements = domains.map((d) => `<domain:name>${escapeXml(d)}</domain:name>`).join("");
	const periodYears = feeOptions?.periodYears ?? 1;
	const currency = feeOptions?.currency;
	const currencyEl = currency ? `<fee:currency>${escapeXml(currency)}</fee:currency>` : "";
	const phaseAttr = feeOptions?.phase ? ` phase="${escapeXml(feeOptions.phase)}"` : "";
	const subphaseAttr = feeOptions?.subphase ? ` subphase="${escapeXml(feeOptions.subphase)}"` : "";
	const createCmd = `<fee:command name="create"${phaseAttr}${subphaseAttr}>\n          <fee:period unit="y">${periodYears}</fee:period>\n        </fee:command>`;
	const renewCmd = `<fee:command name="renew"${phaseAttr}${subphaseAttr}>\n          <fee:period unit="y">${periodYears}</fee:period>\n        </fee:command>`;
	const transferCmd = `<fee:command name="transfer"${phaseAttr}${subphaseAttr}>\n          <fee:period unit="y">${periodYears}</fee:period>\n        </fee:command>`;
	const restoreCmd = feeOptions?.includeRestoreFee === true ? `\n        <fee:command name="restore"/>` : "";
	return `<?xml version="1.0" encoding="UTF-8"?>
<epp xmlns="urn:ietf:params:xml:ns:epp-1.0" xmlns:domain="urn:ietf:params:xml:ns:domain-1.0">
  <command>
    <check>
      <domain:check>
        ${nameElements}
      </domain:check>
    </check>${feeOptions === null ? "" : `
    <extension>
      <fee:check xmlns:fee="urn:ietf:params:xml:ns:epp:fee-1.0">
        ${currencyEl}
        ${createCmd}
        ${renewCmd}
        ${transferCmd}${restoreCmd}
      </fee:check>
    </extension>`}
    <clTRID>${escapeXml(clTrId())}</clTRID>
  </command>
</epp>`;
}
function formatStreet(street) {
	return (Array.isArray(street) ? street : [street]).map((s) => `<contact:street>${escapeXml(s)}</contact:street>`).join("\n        ");
}
function formatPostalInfo(p, type) {
	const street = formatStreet(p.street);
	return `<contact:postalInfo type="${type}">
      <contact:name>${escapeXml(p.name)}</contact:name>${p.org ? `\n      <contact:org>${escapeXml(p.org)}</contact:org>` : ""}
      <contact:addr>
        ${street}
        <contact:city>${escapeXml(p.city)}</contact:city>${p.sp ? `\n        <contact:sp>${escapeXml(p.sp)}</contact:sp>` : ""}
        <contact:pc>${escapeXml(p.pc)}</contact:pc>
        <contact:cc>${escapeXml(p.cc)}</contact:cc>
      </contact:addr>
    </contact:postalInfo>`;
}
/**
* Build EPP contact:create command (RFC 3733).
*/
function buildContactCreateXml(params) {
	const postal = Array.isArray(params.postalInfo) ? params.postalInfo.map((p, i) => formatPostalInfo(p, i === 0 ? "int" : "loc")).join("\n    ") : formatPostalInfo(params.postalInfo, "int");
	const fax = params.fax ? `\n    <contact:fax>${escapeXml(params.fax)}</contact:fax>` : "";
	const auth = params.authInfo != null ? `\n    <contact:authInfo>\n      <contact:pw>${escapeXml(params.authInfo)}</contact:pw>\n    </contact:authInfo>` : "";
	const disclose = params.disclose != null ? `\n    <contact:disclose flag="${params.disclose.flag}">${(params.disclose.elements ?? []).map((e) => `<contact:${e}/>`).join("")}\n    </contact:disclose>` : "";
	return `<?xml version="1.0" encoding="UTF-8"?>
<epp xmlns="urn:ietf:params:xml:ns:epp-1.0" xmlns:contact="urn:ietf:params:xml:ns:contact-1.0">
  <command>
    <create>
      <contact:create>
    <contact:id>${escapeXml(params.id)}</contact:id>
    ${postal}
    <contact:voice>${escapeXml(params.voice)}</contact:voice>${fax}
    <contact:email>${escapeXml(params.email)}</contact:email>${auth}${disclose}
      </contact:create>
    </create>
    <clTRID>${escapeXml(clTrId())}</clTRID>
  </command>
</epp>`;
}
/**
* Build EPP domain:create command (RFC 5731).
*/
function buildDomainCreateXml(params) {
	const periodEl = `<domain:period unit="y">${params.period ?? 1}</domain:period>`;
	let nsEl = "";
	if (params.ns) {
		if (params.ns.type === "hostObj") nsEl = params.ns.hosts.map((h) => `<domain:hostObj>${escapeXml(h)}</domain:hostObj>`).join("\n        ");
		else nsEl = params.ns.hosts.map((h) => {
			const addrs = h.addrs?.length ? h.addrs.map((a) => `<domain:hostAddr>${escapeXml(a)}</domain:hostAddr>`).join("\n          ") : "";
			return `<domain:hostAttr>\n          <domain:hostName>${escapeXml(h.name)}</domain:hostName>${addrs ? "\n          " + addrs : ""}\n        </domain:hostAttr>`;
		}).join("\n        ");
		nsEl = `\n    <domain:ns>\n        ${nsEl}\n    </domain:ns>`;
	}
	const adminEl = params.adminContacts?.length ? params.adminContacts.map((c) => `\n    <domain:contact type="admin">${escapeXml(c)}</domain:contact>`).join("") : "";
	const techEl = params.techContacts?.length ? params.techContacts.map((c) => `\n    <domain:contact type="tech">${escapeXml(c)}</domain:contact>`).join("") : "";
	const authEl = params.authInfo != null ? `\n    <domain:authInfo>\n      <domain:pw>${escapeXml(params.authInfo)}</domain:pw>\n    </domain:authInfo>` : "";
	return `<?xml version="1.0" encoding="UTF-8"?>
<epp xmlns="urn:ietf:params:xml:ns:epp-1.0" xmlns:domain="urn:ietf:params:xml:ns:domain-1.0">
  <command>
    <create>
      <domain:create>
    <domain:name>${escapeXml(params.name)}</domain:name>
    ${periodEl}${nsEl}
    <domain:registrant>${escapeXml(params.registrant)}</domain:registrant>${adminEl}${techEl}${authEl}
      </domain:create>
    </create>
    <clTRID>${escapeXml(clTrId())}</clTRID>
  </command>
</epp>`;
}
/**
* Build EPP domain:transfer command with op="request" (RFC 5731).
*/
function buildDomainTransferXml(params) {
	const periodEl = params.period != null && params.period > 0 ? `\n    <domain:period unit="y">${params.period}</domain:period>` : "";
	const roidAttr = params.roid ? ` roid="${escapeXml(params.roid)}"` : "";
	return `<?xml version="1.0" encoding="UTF-8"?>
<epp xmlns="urn:ietf:params:xml:ns:epp-1.0" xmlns:domain="urn:ietf:params:xml:ns:domain-1.0">
  <command>
    <transfer op="request">
      <domain:transfer>
    <domain:name>${escapeXml(params.name)}</domain:name>${periodEl}
    <domain:authInfo>
      <domain:pw${roidAttr}>${escapeXml(params.authCode)}</domain:pw>
    </domain:authInfo>
      </domain:transfer>
    </transfer>
    <clTRID>${escapeXml(clTrId())}</clTRID>
  </command>
</epp>`;
}

//#endregion
//#region ../../packages/api/src/lib/epp/kenic-config.ts
/**
* Read KENIC EPP config from environment.
* Throws if required credentials are missing (for login/command flows).
*/
function getKenicEppConfig(requireAuth) {
	const host = process.env.KENIC_EPP_HOST ?? "registry.kenic.or.ke";
	const port = Number(process.env.KENIC_EPP_PORT ?? "700");
	const timeoutMs = Number(process.env.KENIC_EPP_TIMEOUT_MS ?? "30000");
	const tlsServername = process.env.KENIC_EPP_TLS_SERVERNAME?.trim() || void 0;
	const username = process.env.KENIC_EPP_USERNAME ?? "";
	const password = process.env.KENIC_EPP_PASSWORD ?? "";
	if (Number.isNaN(port) || port < 1 || port > 65535) throw new Error("Invalid KENIC_EPP_PORT (must be 1-65535)");
	if (requireAuth && (!username || !password)) throw new Error("KENIC_EPP_USERNAME and KENIC_EPP_PASSWORD are required for this operation");
	return {
		host,
		port,
		timeoutMs: Number.isNaN(timeoutMs) ? 3e4 : timeoutMs,
		tlsServername,
		username,
		password
	};
}

//#endregion
//#region ../../packages/api/src/lib/epp/kenic-tlds.ts
/**
* KENIC-managed TLDs (Kenya).
* Single source of truth for routing and validation.
* @see https://registry.kenic.or.ke
*/
/**
* KENIC TLDs we support (subset of registry.kenic.or.ke).
* .go.ke is excluded: including it in an EPP domain:check causes the server to return 2400 (Command failed).
*/
const KENIC_TLDS = [
	"ke",
	"co.ke",
	"or.ke",
	"ne.ke",
	"me.ke",
	"mobi.ke",
	"info.ke",
	"sc.ke",
	"ac.ke"
];
/** Set for fast lookup (lowercase). */
const KENIC_TLD_SET = new Set(KENIC_TLDS.map((t) => t.toLowerCase()));
/**
* Returns the list of KENIC TLDs. Use for routing, validation, or UI (e.g. domain search filters).
*/
function getKenicTlds() {
	return KENIC_TLDS;
}
/**
* Extract the effective TLD from a domain name for KENIC (e.g. "example.co.ke" → "co.ke", "test.ke" → "ke").
* Handles both two-part (example.ke) and three-part (example.co.ke) names.
*/
function extractKenicTld(domain) {
	const parts = domain.toLowerCase().trim().split(".");
	if (parts.length < 2) return null;
	if (parts.length >= 3) {
		const twoPart = `${parts.at(-2)}.${parts.at(-1)}`;
		if (KENIC_TLD_SET.has(twoPart)) return twoPart;
	}
	const onePart = parts.at(-1) ?? "";
	if (KENIC_TLD_SET.has(onePart)) return onePart;
	return null;
}
/**
* True if the domain is under a KENIC TLD (e.g. example.ke, test.co.ke).
*/
function isKenicDomain(domain) {
	return extractKenicTld(domain) !== null;
}
/**
* Validate that all given domains are under a KENIC TLD.
* Returns { valid: true } or { valid: false, invalidDomains: string[] }.
*/
function validateKenicDomains(domains) {
	const invalid = domains.filter((d) => !isKenicDomain(d));
	if (invalid.length === 0) return { valid: true };
	return {
		valid: false,
		invalidDomains: invalid
	};
}

//#endregion
//#region ../../packages/api/src/lib/kenic-transfer-request.ts
/**
* Execute KENIC EPP domain transfer request. Shared by kenic.domainTransfer.request
* and domainTransfer.initiateTransfer (save to DB then call provider).
*/
const parser = new XMLParser({ ignoreAttributes: false });
function getEppResult(parsed) {
	const response = (parsed?.epp)?.response;
	const res = Array.isArray(response?.result) ? response?.result[0] : response?.result;
	if (!res || typeof res !== "object") return {
		code: "0",
		msg: "Unknown response structure"
	};
	const r = res;
	const code = String(r["@_code"] ?? "0");
	const msgNode = r.msg;
	const msg = typeof msgNode === "string" ? msgNode : Array.isArray(msgNode) ? String(msgNode[0] ?? "") : typeof msgNode === "object" && msgNode !== null && "#text" in msgNode ? String(msgNode["#text"]) : "";
	let extValue;
	const extNode = r.extValue;
	if (extNode && typeof extNode === "object" && !Array.isArray(extNode)) {
		const ext = extNode;
		const toStr = (v) => v === void 0 || v === null ? void 0 : typeof v === "string" ? v : typeof v === "object" && v !== null && "#text" in v ? String(v["#text"]) : String(v);
		const value = toStr(ext.value);
		const reason = toStr(ext.reason);
		if (value !== void 0 || reason !== void 0) extValue = {
			value,
			reason
		};
	}
	return {
		code,
		msg,
		extValue
	};
}
function getResData(parsed) {
	return ((parsed?.epp)?.response)?.resData;
}
/**
* Run KENIC EPP domain transfer (RFC 5731, op="request"). Caller is responsible for
* creating/updating any DB record (e.g. DomainTransferRequest).
*/
async function executeKenicTransferRequest(input) {
	const validation = validateKenicDomains([input.name]);
	if (!validation.valid) throw new TRPCError({
		code: "BAD_REQUEST",
		message: `Only KENIC TLDs are supported. Domain: ${input.name}.`,
		cause: { invalidDomains: "invalidDomains" in validation ? validation.invalidDomains : [] }
	});
	let socket;
	try {
		const config = getKenicEppConfig(true);
		socket = await createConnection(config);
		await readFrame(socket);
		sendFrame(socket, buildLoginXml(config.username, config.password));
		const loginResponseBuffer = await readFrame(socket);
		const loginResult = getEppResult(parser.parse(loginResponseBuffer.toString("utf8")));
		if (loginResult.code !== "1000") {
			sendFrame(socket, buildLogoutXml());
			await readFrame(socket);
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: `EPP login failed: ${loginResult.msg}`,
				cause: loginResult.extValue
			});
		}
		const transferXml = buildDomainTransferXml({
			name: input.name,
			authCode: input.authCode,
			roid: input.roid,
			period: input.period
		});
		sendFrame(socket, transferXml);
		const transferResponseXml = (await readFrame(socket)).toString("utf8");
		const transferParsed = parser.parse(transferResponseXml);
		const transferResult = getEppResult(transferParsed);
		sendFrame(socket, buildLogoutXml());
		await readFrame(socket);
		if (transferResult.code !== "1000" && transferResult.code !== "1001") throw new TRPCError({
			code: "BAD_REQUEST",
			message: transferResult.msg,
			cause: transferResult.extValue
		});
		const trnData = getResData(transferParsed)?.["domain:trnData"];
		const name = trnData?.["domain:name"];
		const trStatus = trnData?.["domain:trStatus"];
		const reId = trnData?.["domain:reId"];
		const reDate = trnData?.["domain:reDate"];
		const acId = trnData?.["domain:acId"];
		const acDate = trnData?.["domain:acDate"];
		const exDate = trnData?.["domain:exDate"];
		return {
			success: true,
			pending: transferResult.code === "1001",
			domain: name ?? input.name,
			trStatus: trStatus ?? null,
			reId: reId ?? null,
			reDate: reDate ?? null,
			acId: acId ?? null,
			acDate: acDate ?? null,
			exDate: exDate ?? null,
			raw: transferResponseXml
		};
	} catch (error) {
		if (error instanceof TRPCError) throw error;
		const message = error instanceof Error ? error.message : String(error);
		if (message.includes("KENIC_EPP_USERNAME") || message.includes("KENIC_EPP_PASSWORD")) throw new TRPCError({
			code: "BAD_REQUEST",
			message: "KENIC_EPP_USERNAME and KENIC_EPP_PASSWORD are required"
		});
		const isTimeout = message.toLowerCase().includes("timeout");
		const isRefused = message.toLowerCase().includes("econnrefused") || message.toLowerCase().includes("connection refused");
		throw new TRPCError({
			code: isTimeout ? "TIMEOUT" : isRefused ? "SERVICE_UNAVAILABLE" : "INTERNAL_SERVER_ERROR",
			message: `KENIC domain transfer failed: ${message}`,
			cause: error
		});
	} finally {
		socket?.destroy();
	}
}

//#endregion
export { getKenicEppConfig as a, buildDomainCheckXml as c, buildLogoutXml as d, connectAndReceiveGreeting as f, sendFrame as h, validateKenicDomains as i, buildDomainCreateXml as l, readFrame as m, getKenicTlds as n, buildContactCreateXml as o, createConnection as p, isKenicDomain as r, buildDomainCheckWithFeeXml as s, executeKenicTransferRequest as t, buildLoginXml as u };