/**
 * Enterprise plans are hidden catalogue plans that only agency staff can sell.
 * Staff set the agreed price on the order; the subscription renews at that price.
 */
export const AGENCY_ONLY_PLAN_METADATA_KEY = "agencyOnly";

export function isAgencyOnlyPlan(metadata: unknown): boolean {
	return (
		typeof metadata === "object" &&
		metadata !== null &&
		(metadata as Record<string, unknown>)[AGENCY_ONLY_PLAN_METADATA_KEY] === true
	);
}
