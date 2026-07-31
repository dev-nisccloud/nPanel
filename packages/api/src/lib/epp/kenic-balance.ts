/**
 * KENIC registrar account balance via CoCCA finance EPP extension.
 * @see https://faq.cocca.org.nz/ (EPP Balance — finance:info)
 */

import { XMLParser } from "fast-xml-parser";
import { createConnection, readFrame, sendFrame } from "./epp-client";
import { buildFinanceInfoXml, buildLoginXml, buildLogoutXml } from "./epp-xml";
import { getKenicEppConfig } from "./kenic-config";

const parser = new XMLParser({ ignoreAttributes: false });

export type KenicBalanceEntry = {
	/** Registry zone / TLD label from CoCCA (e.g. "ke"). */
	tld: string;
	currency: string;
	balance: number;
};

export type KenicBalanceResult = {
	balances: KenicBalanceEntry[];
	/** Preferred display amount: sum of KES entries if any, else first entry. */
	balance: number;
	currency: string;
};

function getEppResult(parsed: Record<string, unknown>): { code: string; msg: string } {
	const response = (parsed?.epp as Record<string, unknown>)?.response as
		| Record<string, unknown>
		| undefined;
	const res = Array.isArray(response?.result) ? response?.result[0] : response?.result;
	if (!res || typeof res !== "object") {
		return { code: "0", msg: "Unknown response structure" };
	}
	const r = res as Record<string, unknown>;
	const code = String((r["@_code"] as string) ?? "0");
	const msgNode = r.msg;
	const msg =
		typeof msgNode === "string"
			? msgNode
			: Array.isArray(msgNode)
				? String(msgNode[0] ?? "")
				: typeof msgNode === "object" && msgNode !== null && "#text" in msgNode
					? String((msgNode as { "#text": string })["#text"])
					: "";
	return { code, msg };
}

function textContent(node: unknown): string {
	if (typeof node === "string" || typeof node === "number") return String(node);
	if (Array.isArray(node)) return textContent(node[0]);
	if (node && typeof node === "object" && "#text" in node) {
		return String((node as { "#text": unknown })["#text"] ?? "");
	}
	return "";
}

/**
 * Parse CoCCA finance:infData balance strings: TLD|CURRENCY|BALANCE
 */
export function parseFinanceBalanceResponse(parsed: Record<string, unknown>): KenicBalanceEntry[] {
	const response = (parsed?.epp as Record<string, unknown>)?.response as
		| Record<string, unknown>
		| undefined;
	const resData = response?.resData as Record<string, unknown> | undefined;
	const infData =
		(resData?.["finance:infData"] as Record<string, unknown> | undefined) ??
		(resData?.infData as Record<string, unknown> | undefined);
	if (!infData) return [];

	const raw = infData["finance:balance"] ?? infData.balance;
	const list = Array.isArray(raw) ? raw : raw != null ? [raw] : [];

	const entries: KenicBalanceEntry[] = [];
	for (const item of list) {
		const value = textContent(item).trim();
		if (!value) continue;
		const parts = value.split("|");
		if (parts.length < 3) continue;
		const tld = parts[0]!.trim();
		const currency = parts[1]!.trim().toUpperCase();
		const balance = Number.parseFloat(parts[2]!.trim());
		if (!tld || !currency || Number.isNaN(balance)) continue;
		entries.push({ tld, currency, balance });
	}
	return entries;
}

function pickPrimaryBalance(balances: KenicBalanceEntry[]): { balance: number; currency: string } {
	const kes = balances.filter((b) => b.currency === "KES");
	if (kes.length > 0) {
		return {
			currency: "KES",
			balance: kes.reduce((sum, b) => sum + b.balance, 0),
		};
	}
	const first = balances[0];
	if (first) {
		const sameCurrency = balances.filter((b) => b.currency === first.currency);
		return {
			currency: first.currency,
			balance: sameCurrency.reduce((sum, b) => sum + b.balance, 0),
		};
	}
	return { balance: 0, currency: "KES" };
}

/**
 * Query KENIC registrar account balance via CoCCA finance:info EPP command.
 */
export async function getKenicBalance(): Promise<KenicBalanceResult> {
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
			await readFrame(socket).catch(() => undefined);
			throw new Error(`EPP login failed: ${loginResult.msg || loginResult.code}`);
		}

		sendFrame(socket, buildFinanceInfoXml());
		const financeBuffer = await readFrame(socket);
		const financeParsed = parser.parse(financeBuffer.toString("utf8")) as Record<string, unknown>;
		const financeResult = getEppResult(financeParsed);

		sendFrame(socket, buildLogoutXml());
		await readFrame(socket).catch(() => undefined);

		if (financeResult.code !== "1000") {
			throw new Error(
				`EPP finance:info failed: ${financeResult.msg || financeResult.code}`,
			);
		}

		const balances = parseFinanceBalanceResponse(financeParsed);
		const primary = pickPrimaryBalance(balances);
		return {
			balances,
			balance: primary.balance,
			currency: primary.currency,
		};
	} finally {
		socket?.destroy();
	}
}
