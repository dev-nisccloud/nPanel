import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { assertZeepoAiTeamAccess } from "../../lib/zeepo-ai-access";
import {
	getZeepoAiHomeSuggestions,
	zeepoHomeSuggestionsResultSchema,
} from "../../lib/zeepo-ai-home-suggestions";
import { router } from "../../trpc";
import { zeepoAiProcedure } from "./procedures";

export const zeepoAiSuggestionsRouter = router({
	/** Cached, team-specific starters for the customer Zeepo home screen. */
	list: zeepoAiProcedure
		.input(z.object({ teamId: z.string().min(1) }))
		.output(zeepoHomeSuggestionsResultSchema)
		.query(async ({ ctx, input }) => {
			const userId = ctx.session?.user?.id;
			if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });

			await assertZeepoAiTeamAccess({
				userId,
				userRole: ctx.session?.user?.role,
				teamId: input.teamId,
			});

			return getZeepoAiHomeSuggestions(input.teamId);
		}),
});
