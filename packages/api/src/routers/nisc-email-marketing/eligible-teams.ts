import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { asc } from "@npanel/db";
import { db } from "@npanel/db";
import { team } from "@npanel/db/schema";
import { protectedProcedure, router } from "../../trpc";

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
			return db
				.select({
					id: team.id,
					name: team.name,
					slug: team.slug,
				})
				.from(team)
				.orderBy(asc(team.name));
		}),
});
