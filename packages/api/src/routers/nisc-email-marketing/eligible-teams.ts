import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../../trpc";
import { listTeamsWithNiscEmailMarketingSubscription } from "../../lib/nisc-email-marketing-billing";

function isAgencyUserRole(role: string | null | undefined): boolean {
	return ["AGENCY_USER", "AGENCY_ADMIN", "AGENCY_SUPER_ADMIN"].includes(role ?? "");
}

export const niscEmailMarketingEligibleTeamsRouter = router({
	list: protectedProcedure
		.input(z.object({}).optional().default({}))
		.query(async ({ ctx }) => {
			const role = ctx.session?.user?.role;
			if (!isAgencyUserRole(role)) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Only agency users can list organizations for email marketing linking",
				});
			}
			return listTeamsWithNiscEmailMarketingSubscription();
		}),
});
