/** Predefined email marketing goals for the NISC Email Builder brief. */
export const NEB_EMAIL_GOALS = [
	{ value: "drive_conversions", label: "Drive product sales or conversions" },
	{ value: "promote_offer", label: "Promote a sale or limited-time offer" },
	{ value: "drive_signups", label: "Drive sign-ups (webinar, event, or free trial)" },
	{ value: "re_engage", label: "Re-engage inactive subscribers" },
	{ value: "announce_launch", label: "Announce a new product or feature" },
	{ value: "nurture_leads", label: "Nurture leads and build brand awareness" },
	{ value: "collect_feedback", label: "Collect feedback or survey responses" },
] as const;

/** Predefined target audiences for the NISC Email Builder brief. */
export const NEB_EMAIL_AUDIENCES = [
	{ value: "new_subscribers", label: "New subscribers / welcome segment" },
	{ value: "existing_customers", label: "Existing customers" },
	{ value: "leads_prospects", label: "Leads who haven't purchased yet" },
	{ value: "inactive_subscribers", label: "Inactive or lapsed subscribers" },
	{ value: "vip_loyal", label: "VIP or loyal customers" },
	{ value: "b2b_decision_makers", label: "B2B decision makers" },
	{ value: "smb_owners", label: "SMB business owners" },
] as const;

export const NEB_BRIEF_OTHER = "other" as const;

export type NebGoalValue =
	| (typeof NEB_EMAIL_GOALS)[number]["value"]
	| typeof NEB_BRIEF_OTHER;
export type NebAudienceValue =
	| (typeof NEB_EMAIL_AUDIENCES)[number]["value"]
	| typeof NEB_BRIEF_OTHER;

const goalByValue = new Map(NEB_EMAIL_GOALS.map((g) => [g.value, g.label]));
const audienceByValue = new Map(NEB_EMAIL_AUDIENCES.map((a) => [a.value, a.label]));

export function resolveBriefGoal(preset: string, custom: string): string {
	if (preset === NEB_BRIEF_OTHER) return custom.trim();
	return goalByValue.get(preset as (typeof NEB_EMAIL_GOALS)[number]["value"]) ?? custom.trim();
}

export function resolveBriefAudience(preset: string, custom: string): string {
	if (preset === NEB_BRIEF_OTHER) return custom.trim();
	return (
		audienceByValue.get(preset as (typeof NEB_EMAIL_AUDIENCES)[number]["value"]) ??
		custom.trim()
	);
}

export function inferGoalSelection(storedGoal: string): {
	preset: NebGoalValue;
	custom: string;
} {
	const trimmed = storedGoal.trim();
	if (!trimmed) {
		return { preset: NEB_EMAIL_GOALS[0].value, custom: "" };
	}
	for (const g of NEB_EMAIL_GOALS) {
		if (g.label === trimmed) return { preset: g.value, custom: "" };
	}
	return { preset: NEB_BRIEF_OTHER, custom: trimmed };
}

export function inferAudienceSelection(storedAudience: string): {
	preset: NebAudienceValue;
	custom: string;
} {
	const trimmed = storedAudience.trim();
	if (!trimmed) {
		return { preset: NEB_EMAIL_AUDIENCES[0].value, custom: "" };
	}
	for (const a of NEB_EMAIL_AUDIENCES) {
		if (a.label === trimmed) return { preset: a.value, custom: "" };
	}
	return { preset: NEB_BRIEF_OTHER, custom: trimmed };
}
