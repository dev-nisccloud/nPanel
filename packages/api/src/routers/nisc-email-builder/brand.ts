import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
	enrichWebsiteBrand,
	normalizeWebsiteUrl,
} from "../../lib/nisc-email-builder/website-brand-extract";
import { protectedProcedure, router } from "../../trpc";

export const previewWebsiteBrandSchema = z.object({
	websiteUrl: z.string().min(1),
	companyHint: z.string().optional(),
});

export const nebBrandRouter = router({
	/** Optional preview before submit — same extraction as startBuild */
	previewFromWebsite: protectedProcedure
		.input(previewWebsiteBrandSchema)
		.query(async ({ ctx, input }) => {
			if (!ctx.session?.user?.id) {
				throw new TRPCError({ code: "UNAUTHORIZED" });
			}
			try {
				normalizeWebsiteUrl(input.websiteUrl);
			} catch (e) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: e instanceof Error ? e.message : "Invalid website URL",
				});
			}
			return enrichWebsiteBrand(input.websiteUrl, {
				companyHint: input.companyHint,
			});
		}),
});
