/**
 * KENIC EPP domain check with fee — returns create and transfer pricing only.
 * Used for transfer flow (and registration) where we show price and "we'll check availability".
 */

import { XMLParser } from "fast-xml-parser";
import { createConnection, readFrame, sendFrame } from "./epp-client";
import {
	buildLoginXml,
	buildLogoutXml,
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

export interface KenicPricingResult {
	createFee: { amount: number; currency: string } | null;
	transferFee: { amount: number; currency: string } | null;
}

const MAX_TLD_PRICING_ATTEMPTS = 15;

/**
 * Known-registered domains per KENIC TLD used to fetch TLD-level fees when the registry
 * only returns fee data for existing (non-available) domains. Random placeholders often return
 * "available" with no fee info.
 */
const FALLBACK_DOMAINS_BY_TLD: Record<string, string[]> = {
	"co.ke": ["nic.co.ke", "kenya.co.ke", "google.co.ke"],
	ke: ["nic.ke", "kenic.ke", "google.ke"],
	"or.ke": ["nic.or.ke"],
	"ne.ke": ["nic.ne.ke"],
	"me.ke": ["nic.me.ke"],
	"mobi.ke": ["nic.mobi.ke"],
	"info.ke": ["nic.info.ke"],
	"sc.ke": ["nic.sc.ke"],
	"ac.ke": ["nic.ac.ke"],
};

/** Random label for placeholder domain (not a real word; avoids collisions with taken names). */
function randomPlaceholderLabel(): string {
	return `${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-6)}`;
}

/**
 * Get KENIC create and transfer fees for a TLD by running a check on a domain.
 * Tries random placeholders first; if the registry returns "available" with no fee info (common),
 * falls back to known-registered domains for that TLD so we get real-time transfer/create pricing.
 */
export async function getKenicPricingForTld(extension: string): Promise<KenicPricingResult | null> {
	if (!validateKenicDomains([`x.${extension}`]).valid) return null;

	for (let attempt = 0; attempt < MAX_TLD_PRICING_ATTEMPTS; attempt++) {
		const placeholder = `${randomPlaceholderLabel()}.${extension}`;
		const result = await getKenicPricing(placeholder);
		if (result?.transferFee != null) return result;
	}

	const fallbacks = FALLBACK_DOMAINS_BY_TLD[extension.toLowerCase()];
	if (fallbacks) {
		for (const domain of fallbacks) {
			const result = await getKenicPricing(domain);
			if (result?.transferFee != null) return result;
		}
	}

	return null;
}

/**
 * Get KENIC create and transfer fees for one domain (no availability check).
 * Uses EPP domain check with fee extension; returns pricing only.
 */
export async function getKenicPricing(domain: string): Promise<KenicPricingResult | null> {
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
			buildDomainCheckWithFeeXml([domain], {
				currency: "KES",
				periodYears: 1,
			})
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
		// Prefer an item that has transfer fee (handles single-result TLD check and casing/objID mismatches).
		const item =
			normalized.find((d) => d.transferFee != null) ??
			normalized.find((d) => d.domain.toLowerCase() === domain.toLowerCase()) ??
			normalized.at(0);
		if (!item) return null;

		const createFee =
			item.createFee != null
				? { amount: item.createFee.amount, currency: item.createFee.currency }
				: null;
		const transferFee =
			item.transferFee != null
				? { amount: item.transferFee.amount, currency: item.transferFee.currency }
				: null;

		return { createFee, transferFee };
	} catch {
		return null;
	} finally {
		socket?.destroy();
	}
}
