import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../../trpc";
import { assertCanAccessPleskSite } from "../../lib/plesk/hosting-access";
import {
  fetchPleskDatabaseById,
  fetchPleskDatabaseUsers,
  setPleskDatabaseUser,
} from "../../lib/plesk/database-ops";

export const databasesSetUserRouter = router({
  update: protectedProcedure
    .input(
      z.object({
        siteId: z.number().int().positive(),
        databaseId: z.number().int().positive(),
        userId: z.number().int().positive(),
        password: z.string().min(5).max(64).optional(),
        passwordType: z.enum(["plain", "crypt"]).optional(),
        role: z.enum(["readWrite", "readOnly", "writeOnly"]).optional(),
        acl: z.array(z.string()).optional(),
        allowAccessFrom: z.array(z.string()).optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await assertCanAccessPleskSite({
        siteId: input.siteId,
        userId: ctx.session.user.id,
        role: ctx.session.user.role,
      });

      if (!input.password && !input.role && !input.acl && !input.allowAccessFrom) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "At least one field (password, role, acl, or allowAccessFrom) must be provided",
        });
      }

      try {
        await fetchPleskDatabaseById(input.siteId, input.databaseId);
        const users = await fetchPleskDatabaseUsers(input.databaseId);
        if (!users.some((user) => user.id === input.userId)) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Database user was not found on this database",
          });
        }

        const { xml, parsed } = await setPleskDatabaseUser({
          userId: input.userId,
          password: input.password,
          passwordType: input.passwordType,
          role: input.role,
          acl: input.acl,
          allowAccessFrom: input.allowAccessFrom,
        });

        return { raw: xml, parsed };
      } catch (error) {
        console.error("Plesk Database Set User API Error:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update database user",
          cause: error,
        });
      }
    }),
});
