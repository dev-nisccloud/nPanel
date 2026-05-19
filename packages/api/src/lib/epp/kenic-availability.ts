/**
 * KENIC EPP single-domain availability check.
 * Used by domain-transfer when RDAP is unavailable or unreliable for .ke TLDs.
 */

import { XMLParser } from "fast-xml-parser";
import { createConnection, readFrame, sendFrame } from "./epp-client";
import {
	buildLoginXml,
	buildLogoutXml,
	buildDomainCheckXml,
	buildDomainCheckWithFeeXml,
} from "./epp-xml";
import { getKenicEppConfig } from "./kenic-config";
import { normalizeDomainCheckResponse } from "./domain-check-types";
import { validateKenicDomains } from "./kenic-tlds";

const parser = new XMLParser({ ignoreAttributes: false });

function getEppResult(parsed: Record<string, unknown>): { code: string } {
	const response = (parsed?.epp as Record<string, unknown>)?.response as Record<string, unknown> | undefined;
	const res = Array.isArray(response?.result) ? response?.result[0] : response?.result;
	if (!res || typeof res !== "object") return { code: "0" };
	const r = res as Record<string, unknown>;
	return { code: String((r["@_code"] as string) ?? "0") };
}

/**
 * Check availability AND registration fee for a single KENIC domain in one EPP
 * connection by using the fee extension (`buildDomainCheckWithFeeXml`).
 *
 * KENIC registry quirk: when a domain is available the registry sometimes does
 * not populate fee:chkData, so `createFee` may come back null even on success.
 * Callers should fall back to a known-registered domain of the same TLD in that
 * case (see `getKenicPricingFromFallbacks` in kenic-pricing.ts).
 *
 * Returns null on EPP error (no credentials, timeout, parse failure).
 */
export async function checkKenicAvailabilityAndFee(domain: string): Promise<{
	available: boolean;
	createFee: { amount: number; currency: string } | null;
} | null> {
	const validation = validateKenicDomains([domain]);
	if (!validation.valid) return null;

	let socket;
	try {
		const config = getKenicEppConfig(true);
		socket = await createConnection(config);

		await readFrame(socket);

		sendFrame(socket, buildLoginXml(config.username, config.password));
		const loginBuffer = await readFrame(socket);
		const loginParsed = parser.parse(loginBuffer.toString("utf8")) as Record<string, unknown>;
		const loginResult = getEppResult(loginParsed);
		if (loginResult.code !== "1000") {
			sendFrame(socket, buildLogoutXml());
			await readFrame(socket);
			return null;
		}

		sendFrame(
			socket,
			buildDomainCheckWithFeeXml([domain], { currency: "KES", periodYears: 1 }),
		);
		const checkBuffer = await readFrame(socket);
		const checkParsed = parser.parse(checkBuffer.toString("utf8")) as Record<string, unknown>;
		const checkResult = getEppResult(checkParsed);
		if (checkResult.code !== "1000") {
			sendFrame(socket, buildLogoutXml());
			await readFrame(socket);
			return null;
		}

		sendFrame(socket, buildLogoutXml());
		await readFrame(socket);

		const normalized = normalizeDomainCheckResponse(checkParsed);
		const item =
			normalized.find((d) => d.domain.toLowerCase() === domain.toLowerCase()) ??
			normalized.at(0);
		if (!item) return null;

		const createFee =
			item.createFee != null
				? { amount: item.createFee.amount, currency: item.createFee.currency }
				: null;

		return { available: item.available, createFee };
	} catch {
		return null;
	} finally {
		socket?.destroy();
	}
}

/**
 * Check if a single KENIC domain is available (true) or taken (false).
 * Returns null on EPP error (e.g. no credentials, timeout, parse error).
 */
export async function checkKenicAvailability(domain: string): Promise<{ available: boolean } | null> {
	const validation = validateKenicDomains([domain]);
	if (!validation.valid) return null;

	let socket;
	try {
		const config = getKenicEppConfig(true);
		socket = await createConnection(config);

		await readFrame(socket);

		sendFrame(socket, buildLoginXml(config.username, config.password));
		const loginBuffer = await readFrame(socket);
		const loginParsed = parser.parse(loginBuffer.toString("utf8")) as Record<string, unknown>;
		const loginResult = getEppResult(loginParsed);
		if (loginResult.code !== "1000") {
			sendFrame(socket, buildLogoutXml());
			await readFrame(socket);
			return null;
		}

		sendFrame(socket, buildDomainCheckXml([domain]));
		const checkBuffer = await readFrame(socket);
		const checkParsed = parser.parse(checkBuffer.toString("utf8")) as Record<string, unknown>;
		const checkResult = getEppResult(checkParsed);
		if (checkResult.code !== "1000") {
			sendFrame(socket, buildLogoutXml());
			await readFrame(socket);
			return null;
		}

		sendFrame(socket, buildLogoutXml());
		await readFrame(socket);

		const normalized = normalizeDomainCheckResponse(checkParsed);
		const item = normalized.find((d) => d.domain.toLowerCase() === domain.toLowerCase());
		if (!item) return null;
		return { available: item.available };
	} catch {
		return null;
	} finally {
		socket?.destroy();
	}
}
