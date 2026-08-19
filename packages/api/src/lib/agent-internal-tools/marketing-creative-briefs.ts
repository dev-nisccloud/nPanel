/**
 * Creative brief submission for Zeepo AI.
 * Agency design work is fulfilled by the creatives team — the AI submits a brief when context needs new assets.
 */
import { randomUUID } from "node:crypto";
import { eq } from "@npanel/db";
import { db } from "@npanel/db";
import { team } from "@npanel/db/schema/teams";
import {
	creativeBrief,
	creativeBriefActivityLog,
} from "@npanel/db/schema/creative-briefs";
import { isAgencyMarketingRole } from "./marketing-access";

export type SubmitCreativeBriefArgs = {
	name: string;
	background: string;
	objectives: string;
	requirements: string;
	comments?: string | null;
	style?: string | null;
	copy?: string | null;
	mandatoryElements?: string | null;
	designPreference?: string | null;
	timelineStartDate?: string | null;
	timelineEndDate?: string | null;
	userId: string;
	userRole: string | null | undefined;
	teamId: string | null;
};

function parseDate(value?: string | null): Date | null {
	if (!value) return null;
	const d = new Date(value);
	return Number.isNaN(d.getTime()) ? null : d;
}

export async function agentSubmitCreativeBrief(args: SubmitCreativeBriefArgs) {
	const name = args.name.trim();
	const background = args.background.trim();
	const objectives = args.objectives.trim();
	const requirements = args.requirements.trim();
	if (!name || !background || !objectives || !requirements) {
		throw new Error("name, background, objectives, and requirements are required.");
	}

	let teamId = args.teamId;
	if (teamId) {
		const teamRow = await db.query.team.findFirst({ where: eq(team.id, teamId) });
		if (!teamRow) teamId = null;
	}

	const start = parseDate(args.timelineStartDate);
	const end = parseDate(args.timelineEndDate);
	if (start && end && end < start) {
		throw new Error("timelineEndDate must be on or after timelineStartDate.");
	}

	const briefId = randomUUID();
	const now = new Date();
	await db.transaction(async (tx) => {
		await tx.insert(creativeBrief).values({
			id: briefId,
			name,
			userId: args.userId,
			teamId,
			status: "DRAFT",
			background,
			objectives,
			requirements,
			comments: args.comments?.trim() || null,
			style: args.style?.trim() || null,
			copy: args.copy?.trim() || null,
			mandatoryElements: args.mandatoryElements?.trim() || null,
			designPreference: args.designPreference?.trim() || null,
			timelineStartDate: start,
			timelineEndDate: end,
			createdAt: now,
			updatedAt: now,
		});
		await tx.insert(creativeBriefActivityLog).values({
			id: randomUUID(),
			creativeBriefId: briefId,
			userId: args.userId,
			action: "CREATE",
			description: isAgencyMarketingRole(args.userRole)
				? "Creative brief submitted by Zeepo AI"
				: "Creative brief submitted by Zeepo AI for this team",
			metadata: { source: "zeepo_ai" },
			createdAt: now,
		});
	});

	return {
		_tool: "submit_creative_brief",
		ok: true,
		briefId,
		name,
		status: "DRAFT",
		message:
			"Creative brief submitted to the Nisc Cloud design team. They will produce the assets from this brief.",
	};
}
