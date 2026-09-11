/**
 * Resolve billing details for Nisc order invoices.
 * Orders with a team: company billing settings first, then the earliest team owner
 * (role OWNER, else team creator) for invoice customer details, emailed to all owners,
 * then order user profile fallback. Orders without a team: user profile only.
 */
import { and, asc, db, eq } from "@npanel/db";
import { user as userTable } from "@npanel/db/schema/auth";
import { userProfile } from "@npanel/db/schema/auth-extras";
import { team, teamBillingSettings, teamMember } from "@npanel/db/schema/teams";
import {
	isTeamBillingComplete,
	type TeamBillingSettings,
	TEAM_BILLING_REQUIRED_FIELDS,
} from "../schemas/team-billing";

export type NiscInvoiceBillingSource = "team_billing" | "user_profile" | "team_owners";

export type ResolvedNiscOrderBilling = {
	billing: TeamBillingSettings;
	source: NiscInvoiceBillingSource;
	/** When set, invoice PDF is emailed to all listed addresses (first is primary TO). */
	recipientEmails?: string[];
};

export const NISC_INVOICE_SKIP_REASON_CODES = {
	NO_BILLING_DETAILS: "no_billing_details",
	TEAM_BILLING_INCOMPLETE: "team_billing_incomplete",
	USER_PROFILE_INCOMPLETE: "user_profile_incomplete",
	BILLING_EMAIL_EMPTY: "billing_email_empty",
	INVOICE_CREATION_FAILED: "invoice_creation_failed",
	INVOICE_MISSING_AFTER_CREATE: "invoice_missing_after_create",
	EMAIL_SEND_FAILED: "email_send_failed",
	KRA_SYNC_FAILED: "kra_sync_failed",
	KRA_SYNC_SKIPPED: "kra_sync_skipped",
} as const;

export type NiscInvoiceSkipReasonCode =
	(typeof NISC_INVOICE_SKIP_REASON_CODES)[keyof typeof NISC_INVOICE_SKIP_REASON_CODES];

export const NISC_INVOICE_SKIP_REASON_MESSAGES: Record<NiscInvoiceSkipReasonCode, string> = {
	no_billing_details:
		"No invoice was created: no customer account is available for billing on this order.",
	team_billing_incomplete:
		"No invoice was created: team billing settings are incomplete, and the customer profile does not have enough billing information.",
	user_profile_incomplete:
		"No invoice was created: the customer profile is missing required billing fields (name, email, address, city, country).",
	billing_email_empty:
		"Invoice was created but could not be emailed because no billing email address is available.",
	invoice_creation_failed: "No invoice was created: invoice record could not be saved.",
	invoice_missing_after_create: "No invoice was created: invoice record was not found after creation.",
	email_send_failed: "Invoice was created but the email with PDF attachment could not be sent.",
	kra_sync_failed:
		"Invoice was created but could not be registered with KRA eTIMS. The customer was not emailed; retry KRA sync from the invoice.",
	kra_sync_skipped:
		"Invoice was created but KRA eTIMS registration was skipped (missing product mapping or eTIMS not configured). The customer was not emailed.",
};

function missingTeamBillingFields(billing: TeamBillingSettings): string[] {
	return TEAM_BILLING_REQUIRED_FIELDS.filter((field) => {
		const value = billing[field];
		return typeof value !== "string" || value.trim().length === 0;
	});
}

function profileToBillingSettings(
	user: { name: string; email: string },
	profile: {
		firstName: string | null;
		lastName: string | null;
		phone: string | null;
		address: string | null;
		city: string | null;
		state: string | null;
		country: string | null;
		postalCode: string | null;
	} | null,
): TeamBillingSettings {
	const profileName = [profile?.firstName, profile?.lastName].filter(Boolean).join(" ").trim();
	const legalName = profileName || user.name?.trim() || "";

	return {
		legalName,
		billingEmail: user.email?.trim() ?? "",
		billingPhone: profile?.phone?.trim() ?? null,
		addressLine1: profile?.address?.trim() ?? "",
		addressLine2: null,
		city: profile?.city?.trim() ?? "",
		state: profile?.state?.trim() ?? null,
		country: profile?.country?.trim() ?? "",
		postalCode: profile?.postalCode?.trim() ?? null,
		taxId: null,
	};
}

export type TeamOwnerUser = {
	userId: string;
	email: string | null;
	name: string | null;
	createdAt: Date;
};

/** Deduped emails, preserving first-seen (earliest owner) order. */
export function uniqueOwnerEmails(emails: Array<string | null | undefined>): string[] {
	const seen = new Set<string>();
	const out: string[] = [];
	for (const raw of emails) {
		const email = raw?.trim();
		if (!email) continue;
		const key = email.toLowerCase();
		if (seen.has(key)) continue;
		seen.add(key);
		out.push(email);
	}
	return out;
}

/**
 * Team owners, earliest membership first. If nobody has role OWNER, falls back
 * to the team creator (`createdById`) so the original owner is still used.
 */
export async function listTeamOwnerUsers(teamId: string): Promise<TeamOwnerUser[]> {
	const rows = await db
		.select({
			userId: teamMember.userId,
			email: userTable.email,
			name: userTable.name,
			createdAt: teamMember.createdAt,
		})
		.from(teamMember)
		.innerJoin(userTable, eq(teamMember.userId, userTable.id))
		.where(and(eq(teamMember.teamId, teamId), eq(teamMember.role, "OWNER")))
		.orderBy(asc(teamMember.createdAt), asc(teamMember.id));

	if (rows.length > 0) return rows;

	const teamRow = await db.query.team.findFirst({
		where: eq(team.id, teamId),
		columns: { createdById: true },
	});
	if (!teamRow?.createdById) return [];

	const creator = await db.query.user.findFirst({
		where: eq(userTable.id, teamRow.createdById),
		columns: { id: true, email: true, name: true, createdAt: true },
	});
	if (!creator) return [];
	return [
		{
			userId: creator.id,
			email: creator.email,
			name: creator.name,
			createdAt: creator.createdAt,
		},
	];
}

async function billingFromFirstOwner(
	owner: TeamOwnerUser,
	teamId: string,
): Promise<TeamBillingSettings> {
	const userRow = await db.query.user.findFirst({
		where: eq(userTable.id, owner.userId),
		columns: { name: true, email: true },
	});
	const profile = await db.query.userProfile.findFirst({
		where: eq(userProfile.userId, owner.userId),
	});
	const fromProfile = profileToBillingSettings(
		{
			name: userRow?.name || owner.name || "",
			email: userRow?.email?.trim() || owner.email?.trim() || "",
		},
		profile ?? null,
	);
	if (isTeamBillingComplete(fromProfile)) return fromProfile;

	const teamRow = await db.query.team.findFirst({
		where: eq(team.id, teamId),
		columns: { name: true },
	});
	const profileName = [profile?.firstName, profile?.lastName].filter(Boolean).join(" ").trim();

	return {
		legalName:
			fromProfile.legalName?.trim() ||
			profileName ||
			owner.name?.trim() ||
			teamRow?.name?.trim() ||
			"Customer",
		billingEmail: fromProfile.billingEmail?.trim() || owner.email?.trim() || "",
		billingPhone: fromProfile.billingPhone ?? null,
		addressLine1: fromProfile.addressLine1?.trim() || "Not provided",
		addressLine2: fromProfile.addressLine2 ?? null,
		city: fromProfile.city?.trim() || "Not provided",
		state: fromProfile.state ?? null,
		country: fromProfile.country?.trim() || "KE",
		postalCode: fromProfile.postalCode ?? null,
		taxId: fromProfile.taxId ?? null,
	};
}

async function resolveTeamOwnerBilling(teamId: string): Promise<
	| { ok: true; resolved: ResolvedNiscOrderBilling }
	| { ok: false; reasonCode: NiscInvoiceSkipReasonCode; reasonMessage: string }
> {
	const owners = await listTeamOwnerUsers(teamId);
	if (owners.length === 0) {
		return {
			ok: false,
			reasonCode: NISC_INVOICE_SKIP_REASON_CODES.TEAM_BILLING_INCOMPLETE,
			reasonMessage:
				"No invoice was created: team billing settings are not configured and no team owners were found.",
		};
	}

	const recipientEmails = uniqueOwnerEmails(owners.map((o) => o.email));
	const primary = owners[0]!;
	let billing = await billingFromFirstOwner(primary, teamId);
	if (!billing.billingEmail?.trim() && recipientEmails[0]) {
		billing = { ...billing, billingEmail: recipientEmails[0] };
	}

	return {
		ok: true,
		resolved: {
			billing,
			source: "team_owners",
			recipientEmails,
		},
	};
}

async function resolveUserProfileBilling(userId: string): Promise<
	| { ok: true; resolved: ResolvedNiscOrderBilling }
	| { ok: false; reasonCode: NiscInvoiceSkipReasonCode; reasonMessage: string }
> {
	const userRow = await db.query.user.findFirst({
		where: eq(userTable.id, userId),
		columns: { id: true, name: true, email: true },
	});
	if (!userRow?.email?.trim()) {
		return {
			ok: false,
			reasonCode: NISC_INVOICE_SKIP_REASON_CODES.NO_BILLING_DETAILS,
			reasonMessage: NISC_INVOICE_SKIP_REASON_MESSAGES.no_billing_details,
		};
	}

	const profile = await db.query.userProfile.findFirst({
		where: eq(userProfile.userId, userId),
	});

	const profileBilling = profileToBillingSettings(userRow, profile ?? null);
	if (isTeamBillingComplete(profileBilling)) {
		return { ok: true, resolved: { billing: profileBilling, source: "user_profile" } };
	}

	return {
		ok: false,
		reasonCode: NISC_INVOICE_SKIP_REASON_CODES.USER_PROFILE_INCOMPLETE,
		reasonMessage: NISC_INVOICE_SKIP_REASON_MESSAGES.user_profile_incomplete,
	};
}

/**
 * Team orders: company billing first, then user profile.
 * User-only orders (no teamId): user profile only.
 */
export async function resolveNiscOrderInvoiceBilling(params: {
	teamId: string | null;
	userId: string | null;
}): Promise<
	| { ok: true; resolved: ResolvedNiscOrderBilling }
	| { ok: false; reasonCode: NiscInvoiceSkipReasonCode; reasonMessage: string }
> {
	const teamId = params.teamId?.trim() || null;
	const userId = params.userId?.trim() || null;

	if (!teamId) {
		if (!userId) {
			return {
				ok: false,
				reasonCode: NISC_INVOICE_SKIP_REASON_CODES.NO_BILLING_DETAILS,
				reasonMessage: NISC_INVOICE_SKIP_REASON_MESSAGES.no_billing_details,
			};
		}
		return resolveUserProfileBilling(userId);
	}

	let teamRow: TeamBillingSettings | null = null;
	const row = await db.query.teamBillingSettings.findFirst({
		where: eq(teamBillingSettings.teamId, teamId),
	});
	if (row) {
		teamRow = {
			legalName: row.legalName,
			billingEmail: row.billingEmail,
			billingPhone: row.billingPhone,
			addressLine1: row.addressLine1,
			addressLine2: row.addressLine2,
			city: row.city,
			state: row.state,
			country: row.country,
			postalCode: row.postalCode,
			taxId: row.taxId,
		};
	}

	if (teamRow && isTeamBillingComplete(teamRow)) {
		return { ok: true, resolved: { billing: teamRow, source: "team_billing" } };
	}

	const ownerBilling = await resolveTeamOwnerBilling(teamId);
	if (ownerBilling.ok) {
		return ownerBilling;
	}

	if (!userId) {
		const missing = teamRow ? missingTeamBillingFields(teamRow) : [];
		return {
			ok: false,
			reasonCode: NISC_INVOICE_SKIP_REASON_CODES.TEAM_BILLING_INCOMPLETE,
			reasonMessage: teamRow
				? `${NISC_INVOICE_SKIP_REASON_MESSAGES.team_billing_incomplete}${
						missing.length ? ` Missing on team billing: ${missing.join(", ")}.` : ""
					}`
				: ownerBilling.reasonMessage,
		};
	}

	const profileResult = await resolveUserProfileBilling(userId);
	if (profileResult.ok) {
		return profileResult;
	}

	if (teamRow) {
		const missing = missingTeamBillingFields(teamRow);
		return {
			ok: false,
			reasonCode: NISC_INVOICE_SKIP_REASON_CODES.TEAM_BILLING_INCOMPLETE,
			reasonMessage: `${NISC_INVOICE_SKIP_REASON_MESSAGES.team_billing_incomplete}${
				missing.length ? ` Missing on team billing: ${missing.join(", ")}.` : ""
			}`,
		};
	}

	return profileResult;
}
