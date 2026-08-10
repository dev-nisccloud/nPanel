/**
 * Shared TLD margin helpers: normalize extension names, extract from domains,
 * apply PERCENTAGE/FIXED + roundOff, and load default + per-extension overrides.
 */

import { and, eq } from "@npanel/db";
import { db } from "@npanel/db";
import { tldSettings } from "@npanel/db/schema/nameservers";

export type MarginConfig = {
	id?: string;
	name?: string;
	marginType: "PERCENTAGE" | "FIXED" | string | null;
	percentageMargin: string | null;
	fixedMargin: string | null;
	roundOff: string | null;
	isDefault?: boolean;
};

export type MarginMap = {
	default: MarginConfig | null;
	overrides: Record<string, MarginConfig>;
};

/** Lowercase, strip leading dots: `.COM` / `com` → `com`. */
export function normalizeTldExtension(input: string): string {
	return input.trim().toLowerCase().replace(/^\.+/, "");
}

/**
 * Extension from a domain: everything after the first label.
 * `example.co.ke` → `co.ke`, `foo.com` → `com`.
 */
export function extractExtensionFromDomain(domain: string): string {
	const normalized = domain.trim().toLowerCase();
	const idx = normalized.indexOf(".");
	if (idx < 0) return normalizeTldExtension(normalized);
	return normalized.slice(idx + 1);
}

/** Same formula as use-domain-pricing / agent pricing. */
export function applyMargin(price: number, margin: MarginConfig | null): number {
	if (!margin) return price;

	let finalPrice = price;

	if (margin.marginType === "PERCENTAGE" && margin.percentageMargin) {
		const pct = parseFloat(margin.percentageMargin);
		if (!Number.isNaN(pct)) {
			finalPrice = price + (price * pct) / 100;
		}
	} else if (margin.marginType === "FIXED" && margin.fixedMargin) {
		const fixed = parseFloat(margin.fixedMargin);
		if (!Number.isNaN(fixed)) {
			finalPrice = price + fixed;
		}
	}

	if (margin.roundOff) {
		const step = parseFloat(margin.roundOff);
		if (!Number.isNaN(step) && step > 0) {
			finalPrice = Math.ceil(finalPrice / step) * step;
		}
	}

	return finalPrice;
}

function toMarginConfig(row: {
	id: string;
	name: string;
	marginType: string | null;
	percentageMargin: string | null;
	fixedMargin: string | null;
	roundOff: string | null;
	isDefault: boolean;
}): MarginConfig {
	return {
		id: row.id,
		name: row.name,
		marginType: row.marginType,
		percentageMargin: row.percentageMargin,
		fixedMargin: row.fixedMargin,
		roundOff: row.roundOff,
		isDefault: row.isDefault,
	};
}

/** Load platform default + all non-default rows keyed by normalized name. */
export async function loadMarginMap(): Promise<MarginMap> {
	const rows = await db
		.select({
			id: tldSettings.id,
			name: tldSettings.name,
			marginType: tldSettings.marginType,
			percentageMargin: tldSettings.percentageMargin,
			fixedMargin: tldSettings.fixedMargin,
			roundOff: tldSettings.roundOff,
			isDefault: tldSettings.isDefault,
		})
		.from(tldSettings);

	let defaultConfig: MarginConfig | null = null;
	const overrides: Record<string, MarginConfig> = {};

	for (const row of rows) {
		const config = toMarginConfig(row);
		if (row.isDefault) {
			if (!defaultConfig) defaultConfig = config;
			continue;
		}
		const key = normalizeTldExtension(row.name);
		if (!key) continue;
		// Prefer first seen; rows are unordered  last write wins via upsert updating in place
		overrides[key] = config;
	}

	return { default: defaultConfig, overrides };
}

/** Resolve override for extension/domain, else platform default. */
export function resolveMarginForExtension(
	map: MarginMap,
	extensionOrDomain: string | undefined | null,
): MarginConfig | null {
	if (!extensionOrDomain) return map.default;
	const key = extensionOrDomain.includes(".")
		? extractExtensionFromDomain(extensionOrDomain)
		: normalizeTldExtension(extensionOrDomain);
	if (key && map.overrides[key]) return map.overrides[key];
	return map.default;
}

export async function findOverrideByExtension(
	extension: string,
): Promise<MarginConfig | null> {
	const key = normalizeTldExtension(extension);
	if (!key) return null;

	const [row] = await db
		.select({
			id: tldSettings.id,
			name: tldSettings.name,
			marginType: tldSettings.marginType,
			percentageMargin: tldSettings.percentageMargin,
			fixedMargin: tldSettings.fixedMargin,
			roundOff: tldSettings.roundOff,
			isDefault: tldSettings.isDefault,
		})
		.from(tldSettings)
		.where(and(eq(tldSettings.isDefault, false), eq(tldSettings.name, key)))
		.limit(1);

	return row ? toMarginConfig(row) : null;
}

export async function findDefaultMargin(): Promise<MarginConfig | null> {
	const [row] = await db
		.select({
			id: tldSettings.id,
			name: tldSettings.name,
			marginType: tldSettings.marginType,
			percentageMargin: tldSettings.percentageMargin,
			fixedMargin: tldSettings.fixedMargin,
			roundOff: tldSettings.roundOff,
			isDefault: tldSettings.isDefault,
		})
		.from(tldSettings)
		.where(eq(tldSettings.isDefault, true))
		.limit(1);

	return row ? toMarginConfig(row) : null;
}
