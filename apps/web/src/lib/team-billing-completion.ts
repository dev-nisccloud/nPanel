import { isTeamBillingComplete as apiIsTeamBillingComplete } from "@npanel/api/schemas/team-billing";

export type TeamBillingLike = {
	legalName?: string | null;
	billingEmail?: string | null;
	addressLine1?: string | null;
	city?: string | null;
	country?: string | null;
};

export function isTeamBillingComplete(billing: TeamBillingLike | null | undefined): boolean {
	return apiIsTeamBillingComplete(billing);
}

export function needsCheckoutTeamBillingStep(
	purchaseAsBusiness: boolean,
	billing: TeamBillingLike | null | undefined,
): boolean {
	return purchaseAsBusiness && !isTeamBillingComplete(billing);
}
