import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import { TRPCError } from "@trpc/server";
import { db, eq, and } from "@npanel/db";
import { apiKey } from "@npanel/db/schema/auth-extras";
import { createHash, randomBytes } from "node:crypto";

export const apiKeysRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, "Name is required"),
        permissions: z.array(z.string()).default(["*"]),
        expiresAt: z.date().optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const rawKey = `npanel_sk_${randomBytes(32).toString("hex")}`;
      const keyHash = createHash("sha256").update(rawKey).digest("hex");
      const id = crypto.randomUUID();

      await db.insert(apiKey).values({
        id,
        userId: ctx.session.user.id,
        name: input.name,
        keyHash,
        permissions: input.permissions,
        expiresAt: input.expiresAt,
        isActive: true,
      });

      return {
        id,
        name: input.name,
        key: rawKey, // Only returned once!
        permissions: input.permissions,
        expiresAt: input.expiresAt,
      };
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    const keys = await db
      .select({
        id: apiKey.id,
        name: apiKey.name,
        permissions: apiKey.permissions,
        expiresAt: apiKey.expiresAt,
        isActive: apiKey.isActive,
        lastUsedAt: apiKey.lastUsedAt,
        createdAt: apiKey.createdAt,
      })
      .from(apiKey)
      .where(eq(apiKey.userId, ctx.session.user.id));
      
    // Order by createdAt descending manually since orderBy is standard Drizzle
    return keys.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }),

  revoke: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const updated = await db
        .update(apiKey)
        .set({ isActive: false })
        .where(
          and(
            eq(apiKey.id, input.id),
            eq(apiKey.userId, ctx.session.user.id)
          )
        )
        .returning({ id: apiKey.id });

      if (updated.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "API Key not found or you do not have permission to revoke it",
        });
      }

      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const key = await db.query.apiKey.findFirst({
        where: and(
          eq(apiKey.id, input.id),
          eq(apiKey.userId, ctx.session.user.id)
        ),
      });

      if (!key) {
        throw new TRPCError({ code: "NOT_FOUND", message: "API Key not found" });
      }

      if (key.isActive) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "API Key must be revoked before it can be deleted",
        });
      }

      await db.delete(apiKey).where(eq(apiKey.id, input.id));

      return { success: true };
    }),

  getAvailableProcedures: protectedProcedure.query(async () => {
    const { appRouter } = await import("./index");
    
    // Extract fully qualified paths from the tRPC router procedures record
    const record = appRouter._def.procedures;
    return Object.keys(record);
  }),
});
