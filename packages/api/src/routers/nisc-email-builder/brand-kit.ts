import { TRPCError } from "@trpc/server";
import { randomUUID } from "node:crypto";
import { and, eq } from "@npanel/db";
import { db } from "@npanel/db";
import { nebBrandKit } from "@npanel/db/schema/nisc-email-builder";
import { teamMember } from "@npanel/db/schema/teams";
import { protectedProcedure, router } from "../../trpc";
import { isAgencyUserRole } from "./access";
import { createBrandKitSchema, listBrandKitsSchema } from "./schemas";

export const nebBrandKitRouter = router({
	list: protectedProcedure.input(listBrandKitsSchema).query(async ({ ctx, input }) => {
		const userId = ctx.session?.user?.id;
		if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });

		if (input.teamId) {
			const membership = await db.query.teamMember.findFirst({
				where: and(
					eq(teamMember.teamId, input.teamId),
					eq(teamMember.userId, userId),
				),
			});
			if (!membership && !isAgencyUserRole(ctx.session?.user?.role)) {
				throw new TRPCError({ code: "FORBIDDEN" });
			}
			return db.query.nebBrandKit.findMany({
				where: eq(nebBrandKit.teamId, input.teamId),
			});
		}

		return db.query.nebBrandKit.findMany({
			where: eq(nebBrandKit.userId, userId),
		});
	}),

	create: protectedProcedure
		.input(createBrandKitSchema)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session?.user?.id;
			if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });

			const id = randomUUID();
			const now = new Date();

			await db.insert(nebBrandKit).values({
				id,
				name: input.name,
				userId,
				teamId: input.teamId ?? null,
				colors: input.colors ?? null,
				footerLegal: input.footerLegal ?? null,
				logoAssetId: input.logoAssetId ?? null,
				createdAt: now,
				updatedAt: now,
			});

			return { id };
		}),
});
