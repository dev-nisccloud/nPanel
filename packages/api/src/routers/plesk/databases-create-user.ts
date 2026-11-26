import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../../trpc";
import { assertCanAccessPleskSite } from "../../lib/plesk/hosting-access";
import {
  addPleskDatabaseUser,
  fetchPleskDatabaseById,
  fetchPleskDatabaseUsers,
  getSharedHostingDbHost,
  portForDatabaseType,
  setPleskDefaultDatabaseUser,
} from "../../lib/plesk/database-ops";

export const databasesCreateUserRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        siteId: z.number().int().positive(),
        databaseId: z.number().int().positive(),
        login: z
          .string()
          .min(1, { message: "Username is required" })
          .max(32, { message: "Username must be at most 32 characters" })
          .regex(/^[a-zA-Z0-9_]+$/, {
            message: "Username can only contain letters, numbers, and underscores",
          }),
        password: z
          .string()
          .min(8, { message: "Password must be at least 8 characters" })
          .max(64, { message: "Password must be at most 64 characters" }),
        setAsDefault: z.boolean().optional().default(true),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await assertCanAccessPleskSite({
        siteId: input.siteId,
        userId: ctx.session.user.id,
        role: ctx.session.user.role,
        key: "hosting.databases",
        access: "write",
      });

      try {
        const database = await fetchPleskDatabaseById(input.siteId, input.databaseId);
        const userId = await addPleskDatabaseUser({
          databaseId: input.databaseId,
          login: input.login,
          password: input.password,
        });

        if (input.setAsDefault) {
          await setPleskDefaultDatabaseUser(input.databaseId, userId);
        }

        const users = await fetchPleskDatabaseUsers(input.databaseId);
        const createdUser = users.find((user) => user.id === userId);

        return {
          userId,
          login: createdUser?.login ?? input.login,
          password: input.password,
          databaseId: database.id,
          name: database.name,
          type: database.type,
          localHost: "localhost",
          remoteHost: getSharedHostingDbHost(),
          port: portForDatabaseType(database.type),
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create database user",
          cause: error,
        });
      }
    }),
});
