import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../../trpc";
import { assertCanAccessPleskSite } from "../../lib/plesk/hosting-access";
import { deletePleskDatabase, fetchPleskDatabaseById } from "../../lib/plesk/database-ops";

export const databasesDeleteRouter = router({
  delete: protectedProcedure
    .input(
      z.object({
        siteId: z.number().int().positive(),
        databaseId: z.number().int().positive(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        await assertCanAccessPleskSite({
          siteId: input.siteId,
          userId: ctx.session.user.id,
          role: ctx.session.user.role,
          key: "hosting.databases",
          access: "write",
        });

        await fetchPleskDatabaseById(input.siteId, input.databaseId);
        await deletePleskDatabase(input.databaseId);
        return { deleted: true, databaseId: input.databaseId };
      } catch (error) {
        console.error("Plesk Database Delete API Error:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete database",
          cause: error,
        });
      }
    }),
});
