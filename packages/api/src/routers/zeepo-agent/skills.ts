import { router } from "../../trpc";
import { zeepoAgentProcedure } from "./procedures";
import { ZEEPO_AGENT_SKILLS } from "./skills-catalog";

export const zeepoAgentSkillsRouter = router({
	list: zeepoAgentProcedure.query(() => ({
		data: ZEEPO_AGENT_SKILLS.map(({ id, category, title, description }) => ({
			id,
			category,
			title,
			description,
		})),
	})),
});
