import { z } from "zod";
import { router } from "../../trpc";
import { zeepoAiProcedure } from "./procedures";
import { agentGetCloudPlans } from "../../lib/agent-internal-tools";

const listCloudPlansSchema = z.object({
	kind: z.enum(["vps", "vds", "dedicated"]),
	search: z.string().max(80).optional(),
	limit: z.number().int().min(1).max(24).optional(),
	cursor: z.number().int().min(0).optional(),
	ramGb: z.number().positive().max(2048).optional(),
	cores: z.number().int().positive().max(256).optional(),
	cpu: z.enum(["intel", "amd"]).optional(),
	diskGb: z.number().positive().max(65536).optional(),
	location: z.string().max(80).optional(),
});

export const zeepoAiCloudPlansRouter = router({
	list: zeepoAiProcedure.input(listCloudPlansSchema).query(async ({ input }) => {
		return agentGetCloudPlans({
			kind: input.kind,
			search: input.search,
			limit: input.limit,
			cursor: input.cursor,
			ramGb: input.ramGb,
			cores: input.cores,
			cpu: input.cpu,
			diskGb: input.diskGb,
			location: input.location,
		});
	}),
});
