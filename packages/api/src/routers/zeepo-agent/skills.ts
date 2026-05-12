import { protectedProcedure, router } from "../../trpc";
import { ZEEPO_AGENT_SKILLS } from "./skills-catalog";

export const zeepoAgentSkillsRouter = router({
	list: protectedProcedure.query(() => ({
		data: ZEEPO_AGENT_SKILLS.map(({ id, category, title, description }) => ({
			id,
			category,
			title,
			description,
		})),
	})),
});
