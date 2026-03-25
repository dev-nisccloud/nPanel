import { z } from "zod";
import { and, desc, eq, gte, lte } from "@npanel/db";

import { db } from "@npanel/db";
import { creativeProductionSnapshot } from "@npanel/db/schema/reporting";
import { protectedProcedure, router } from "../../trpc";
import { aggregateCreative } from "./utils";
import { subDays } from "date-fns";
import { creativeProductionSnapshotSchema } from "./schemas";

export const creativeReportsRouter = router({
    getProductionStats: protectedProcedure
        .input(z.object({
            from: z.coerce.date().optional(),
            to: z.coerce.date().optional(),
            limit: z.number().optional().default(30),
        }))
        .output(z.array(creativeProductionSnapshotSchema))
        .query(async ({ input }) => {
            const startDate = input.from || subDays(new Date(), 30);
            const endDate = input.to || new Date();

			const snapshotWhere = and(
				eq(creativeProductionSnapshot.period, "DAILY"),
				gte(creativeProductionSnapshot.date, startDate),
				lte(creativeProductionSnapshot.date, endDate),
			);

			let results = await db
				.select()
				.from(creativeProductionSnapshot)
				.where(snapshotWhere)
				.orderBy(desc(creativeProductionSnapshot.date))
				.limit(input.limit);

			if (results.length === 0) {
				await aggregateCreative("DAILY");
				results = await db
					.select()
					.from(creativeProductionSnapshot)
					.where(snapshotWhere)
					.orderBy(desc(creativeProductionSnapshot.date))
					.limit(input.limit);
			}

			return results;
        }),

    sync: protectedProcedure
        .input(z.object({
            period: z.enum(["DAILY", "MONTHLY"]).optional().default("DAILY"),
        }))
        .output(z.object({ success: z.boolean() }))
        .mutation(async ({ input }) => {
            await aggregateCreative(input.period);
            return { success: true };
        }),
});
