import { eq } from "@npanel/db";
import { db } from "@npanel/db";
import { team as teamTable, teamMember } from "@npanel/db/schema/teams";

export function isAgencyMarketingRole(role: string | null | undefined): boolean {
	return (
		role === "AGENCY_USER" ||
		role === "AGENCY_ADMIN" ||
		role === "AGENCY_SUPER_ADMIN"
	);
}

export async function getAccessibleTeamIds(userId: string): Promise<string[]> {
	const [memberships, ownedTeams] = await Promise.all([
		db.query.teamMember.findMany({
			where: eq(teamMember.userId, userId),
			columns: { teamId: true },
		}),
		db.query.team.findMany({
			where: eq(teamTable.createdById, userId),
			columns: { id: true },
		}),
	]);
	return [...new Set([...memberships.map((m) => m.teamId), ...ownedTeams.map((t) => t.id)])];
}

export type MoneyValue = {
	amount: number | null;
	currency: string;
	display: string | null;
};

/** Canonical money object. Always carry the ad-account native currency. Never FX-convert. */
export function money(
	amount: number | string | null | undefined,
	currency: string | null | undefined,
): MoneyValue {
	const code = (currency ?? "").trim().toUpperCase() || "UNKNOWN";
	const n =
		amount === null || amount === undefined || amount === ""
			? null
			: Number(amount);
	const amountNum = n != null && Number.isFinite(n) ? n : null;
	return {
		amount: amountNum,
		currency: code,
		display:
			amountNum == null
				? null
				: `${code} ${amountNum.toLocaleString("en-KE", {
						minimumFractionDigits: 2,
						maximumFractionDigits: 2,
					})}`,
	};
}

export function moneyFromMinorUnits(
	minor: number | string | null | undefined,
	currency: string | null | undefined,
	divisor = 100,
): MoneyValue {
	const n =
		minor === null || minor === undefined || minor === "" ? null : Number(minor);
	return money(n != null && Number.isFinite(n) ? n / divisor : null, currency);
}

export function moneyFromMicros(
	micros: number | string | null | undefined,
	currency: string | null | undefined,
): MoneyValue {
	return moneyFromMinorUnits(micros, currency, 1_000_000);
}

export function isoDate(d: Date): string {
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, "0");
	const day = String(d.getDate()).padStart(2, "0");
	return `${y}-${m}-${day}`;
}

export type ResolvedDateRange = {
	since: string;
	until: string;
	preset: string;
	metaDatePreset: string | null;
};

export function resolveMarketingDateRange(input: {
	datePreset?: string | null;
	since?: string | null;
	until?: string | null;
}): ResolvedDateRange {
	const until = input.until?.trim() || isoDate(new Date());
	if (input.since?.trim()) {
		return {
			since: input.since.trim(),
			until,
			preset: "custom",
			metaDatePreset: null,
		};
	}
	const preset = (input.datePreset ?? "last_30d").trim();
	if (preset === "lifetime" || preset === "maximum") {
		return {
			since: "2004-01-01",
			until,
			preset: "lifetime",
			metaDatePreset: "maximum",
		};
	}
	const days = preset === "last_7d" ? 7 : preset === "last_90d" ? 90 : 30;
	const start = new Date();
	start.setDate(start.getDate() - days);
	return {
		since: isoDate(start),
		until,
		preset: days === 7 ? "last_7d" : days === 90 ? "last_90d" : "last_30d",
		metaDatePreset: days === 7 ? "last_7d" : days === 90 ? "last_90d" : "last_30d",
	};
}

export const AD_ACCOUNT_CURRENCY_RULE =
	"All money fields (spend, budget, CPC, CPM, cost) are in this ad account's native currency. Never convert to USD, KES, or the team billing currency unless the user explicitly asks, and then label the conversion as an estimate.";
