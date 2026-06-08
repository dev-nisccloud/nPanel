import { TRPCError } from "@trpc/server";
import { and, desc, eq, ilike, isNull } from "@npanel/db";
import { db } from "@npanel/db";
import { nebMediaLibrary } from "@npanel/db/schema/nisc-email-builder";
import { teamMember } from "@npanel/db/schema/teams";
import { z } from "zod";
import { saveToNebMediaLibrary } from "../../lib/nisc-email-builder/media-library-persist";
import { protectedProcedure, router } from "../../trpc";
const mediaLibraryItemSchema = z.object({
    id: z.string(),
    userId: z.string(),
    teamId: z.string().nullable(),
    fileName: z.string(),
    fileSize: z.number(),
    mimeType: z.string(),
    fileUrl: z.string().url(),
    storageKey: z.string().nullable(),
    description: z.string().nullable(),
    metadata: z.unknown().nullable(),
    createdAt: z.date(),
});
const createFromUploadSchema = z.object({
    fileName: z.string().min(1),
    fileSize: z.number().min(0),
    mimeType: z.string().min(1),
    fileUrl: z.string().url(),
    storageKey: z.string().optional(),
    description: z.string().optional(),
    metadata: z.unknown().optional(),
    teamId: z.string().optional(),
});
const listSchema = z.object({
    page: z.number().min(1).default(1),
    limit: z.number().min(1).max(100).default(40),
    teamId: z.string().optional(),
    onlyImages: z.boolean().default(true),
    search: z.string().optional(),
});
const deleteSchema = z.object({
    id: z.string(),
});
const isAgencyUserRole = (role) => ["AGENCY_USER", "AGENCY_ADMIN", "AGENCY_SUPER_ADMIN"].includes(role ?? "");
export const nebMediaLibraryRouter = router({
    createFromUpload: protectedProcedure
        .input(createFromUploadSchema)
        .output(z.object({ data: mediaLibraryItemSchema }))
        .mutation(async ({ ctx, input }) => {
        const userId = ctx.session?.user?.id;
        const userRole = ctx.session?.user?.role;
        if (!userId)
            throw new TRPCError({ code: "UNAUTHORIZED" });
        const { teamId, ...rest } = input;
        if (teamId && !isAgencyUserRole(userRole)) {
            const membership = await db.query.teamMember.findFirst({
                where: and(eq(teamMember.teamId, teamId), eq(teamMember.userId, userId)),
            });
            if (!membership) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You do not have access to this team",
                });
            }
        }
        const item = await saveToNebMediaLibrary({
            userId,
            teamId: teamId ?? null,
            fileName: rest.fileName,
            fileSize: rest.fileSize,
            mimeType: rest.mimeType,
            fileUrl: rest.fileUrl,
            storageKey: rest.storageKey ?? null,
            description: rest.description ?? null,
            metadata: rest.metadata && typeof rest.metadata === "object"
                ? rest.metadata
                : undefined,
        });
        if (!item) {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Invalid or non-persistent image URL",
            });
        }
        return { data: item };
    }),
    list: protectedProcedure
        .input(listSchema)
        .output(z.object({
        data: z.array(mediaLibraryItemSchema),
        nextPage: z.number().nullable(),
    }))
        .query(async ({ ctx, input }) => {
        const userId = ctx.session?.user?.id;
        const userRole = ctx.session?.user?.role;
        if (!userId)
            throw new TRPCError({ code: "UNAUTHORIZED" });
        const { page, limit, teamId, onlyImages, search } = input;
        if (teamId && !isAgencyUserRole(userRole)) {
            const membership = await db.query.teamMember.findFirst({
                where: and(eq(teamMember.teamId, teamId), eq(teamMember.userId, userId)),
            });
            if (!membership) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You do not have access to this team",
                });
            }
        }
        const whereConditions = [];
        if (teamId) {
            whereConditions.push(eq(nebMediaLibrary.teamId, teamId));
        }
        else {
            whereConditions.push(eq(nebMediaLibrary.userId, userId));
            if (!isAgencyUserRole(userRole)) {
                whereConditions.push(isNull(nebMediaLibrary.teamId));
            }
        }
        if (onlyImages) {
            whereConditions.push(ilike(nebMediaLibrary.mimeType, "image/%"));
        }
        if (search?.trim()) {
            whereConditions.push(ilike(nebMediaLibrary.fileName, `%${search.trim()}%`));
        }
        const whereClause = whereConditions.length === 1
            ? whereConditions[0]
            : and(...whereConditions);
        const items = await db.query.nebMediaLibrary.findMany({
            where: whereClause,
            limit,
            offset: (page - 1) * limit,
            orderBy: [desc(nebMediaLibrary.createdAt)],
        });
        return {
            data: items,
            nextPage: items.length === limit ? page + 1 : null,
        };
    }),
    delete: protectedProcedure
        .input(deleteSchema)
        .mutation(async ({ ctx, input }) => {
        const userId = ctx.session?.user?.id;
        if (!userId)
            throw new TRPCError({ code: "UNAUTHORIZED" });
        const item = await db.query.nebMediaLibrary.findFirst({
            where: eq(nebMediaLibrary.id, input.id),
        });
        if (!item) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Image not found" });
        }
        if (item.userId !== userId) {
            throw new TRPCError({
                code: "FORBIDDEN",
                message: "You can only delete your own library images",
            });
        }
        await db.delete(nebMediaLibrary).where(eq(nebMediaLibrary.id, input.id));
        return { success: true };
    }),
});
