import { and, eq, isNull, or, sql } from "@npanel/db";
import { careerOpening } from "@npanel/db/schema/careers";

export const CAREER_STATUSES = ["draft", "scheduled", "published", "closed"] as const;
export type CareerStatus = (typeof CAREER_STATUSES)[number];

/** Live on the public careers page. Scheduled roles wait for the exact time. */
export const careerOpeningIsPublic = and(
	or(
		eq(careerOpening.status, "published"),
		and(eq(careerOpening.status, "scheduled"), sql`${careerOpening.opensOn} <= now()`),
	),
	or(isNull(careerOpening.closesOn), sql`${careerOpening.closesOn} >= now()`),
);

export function careerStatusOnWebsite(input: {
	status: string;
	opensOn: string | null;
	closesOn: string | null;
	now?: number;
}) {
	const now = input.now ?? Date.now();
	if (input.closesOn) {
		const closes = new Date(input.closesOn).getTime();
		if (!Number.isNaN(closes) && closes < now) return false;
	}
	if (input.status === "published") return true;
	if (input.status === "scheduled") {
		const opens = input.opensOn ? new Date(input.opensOn).getTime() : Number.NaN;
		return !Number.isNaN(opens) && opens <= now;
	}
	return false;
}
