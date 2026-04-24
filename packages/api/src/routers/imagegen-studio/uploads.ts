import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "@npanel/db";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { db } from "@npanel/db";
import {
  imageGenUpload,
  imageGenUploadActivityLog,
} from "@npanel/db/schema/imagegen-studio";
import { protectedProcedure, router } from "../../trpc";
import {
  createUploadSchema,
  getUploadsSchema,
  deleteUploadSchema,
  getUploadsResponseSchema,
  imageGenUploadSchema,
} from "./schemas";
import { getUserTeamIds, orUserOrTeamMember, personalScope } from "./team-scope";

const isAgencyUserRole = (role: string | null | undefined) =>
  ["AGENCY_USER", "AGENCY_ADMIN", "AGENCY_SUPER_ADMIN"].includes(role ?? "");

const isAgencySuperAdminRole = (role: string | null | undefined) =>
  role === "AGENCY_SUPER_ADMIN";

/**
 * Transform function to ensure clean data (no ORM types leak)
 */
function transformUpload(upload: any): z.infer<typeof imageGenUploadSchema> {
  return {
    id: upload.id,
    fileUrl: upload.fileUrl,
    fileName: upload.fileName,
    fileSize: upload.fileSize,
    mimeType: upload.mimeType,
    fileMetadata: upload.fileMetadata ?? null,
    createdAt: upload.createdAt,
    updatedAt: upload.updatedAt,
  };
}

export const imageGenUploadsRouter = router({
  create: protectedProcedure
    .input(createUploadSchema)
    .output(z.object({ data: imageGenUploadSchema }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id;
      const userRole = ctx.session?.user?.role;
      if (!userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      if (input.teamId && !isAgencyUserRole(userRole)) {
        const userTeamIds = await getUserTeamIds(userId);
        if (!userTeamIds.includes(input.teamId)) {
          throw new TRPCError({ code: "FORBIDDEN", message: "You do not have access to this team" });
        }
      }

      if (!input.mimeType.startsWith("image/")) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only image files are allowed",
        });
      }

      const now = new Date();
      const id = randomUUID();
      await db.insert(imageGenUpload).values({
        id,
        userId,
        teamId: input.teamId ?? null,
        fileUrl: input.fileUrl,
        fileKey: input.fileKey,
        fileName: input.fileName,
        fileSize: input.fileSize,
        mimeType: input.mimeType,
        fileMetadata: input.fileMetadata ?? null,
        createdAt: now,
        updatedAt: now,
      });

      const upload = await db.query.imageGenUpload.findFirst({
        where: eq(imageGenUpload.id, id),
      });
      if (!upload) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create upload",
        });
      }

      await db.insert(imageGenUploadActivityLog).values({
        id: randomUUID(),
        imageGenUploadId: upload.id,
        userId,
        action: "UPLOAD",
        description: `Uploaded image: ${input.fileName}`,
        metadata: {
          fileName: input.fileName,
          fileSize: input.fileSize,
          mimeType: input.mimeType,
        },
        ipAddress: null,
        userAgent: null,
        createdAt: new Date(),
      });

      return { data: transformUpload(upload) };
    }),

  list: protectedProcedure
    .input(getUploadsSchema)
    .output(getUploadsResponseSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id;
      const userRole = ctx.session?.user?.role;
      if (!userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const { page, limit, teamId } = input;
      const userTeamIds = await getUserTeamIds(userId);

      let whereCond;
      if (teamId) {
        if (isAgencyUserRole(userRole)) {
          whereCond = eq(imageGenUpload.teamId, teamId);
        } else {
          if (!userTeamIds.includes(teamId)) {
            return { data: [], nextPage: null };
          }
          whereCond = eq(imageGenUpload.teamId, teamId);
        }
      } else if (isAgencyUserRole(userRole)) {
        whereCond = undefined;
      } else {
        whereCond = personalScope(imageGenUpload.userId, imageGenUpload.teamId, userId);
      }

      const uploads = await db
        .select({
          id: imageGenUpload.id,
          fileUrl: imageGenUpload.fileUrl,
          fileName: imageGenUpload.fileName,
          fileSize: imageGenUpload.fileSize,
          mimeType: imageGenUpload.mimeType,
          fileMetadata: imageGenUpload.fileMetadata,
          createdAt: imageGenUpload.createdAt,
          updatedAt: imageGenUpload.updatedAt,
        })
        .from(imageGenUpload)
        .where(whereCond ?? undefined)
        .orderBy(desc(imageGenUpload.createdAt))
        .limit(limit)
        .offset((page - 1) * limit);

      return {
        data: uploads.map(transformUpload),
        nextPage: uploads.length === limit ? page + 1 : null,
      };
    }),

  delete: protectedProcedure
    .input(deleteUploadSchema)
    .output(z.object({ data: z.object({ id: z.string() }) }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id;
      const userRole = ctx.session?.user?.role;
      if (!userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const existingUpload = await db.query.imageGenUpload.findFirst({
        where: eq(imageGenUpload.id, input.id),
      });

      if (!existingUpload) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Upload not found" });
      }
      if (!isAgencySuperAdminRole(userRole) && existingUpload.userId !== userId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only the upload owner can delete it" });
      }

      await db.insert(imageGenUploadActivityLog).values({
        id: randomUUID(),
        imageGenUploadId: input.id,
        userId,
        action: "DELETE",
        description: `Deleted upload: ${existingUpload.fileName}`,
        metadata: {
          fileName: existingUpload.fileName,
          fileKey: existingUpload.fileKey,
        },
        ipAddress: null,
        userAgent: null,
        createdAt: new Date(),
      });

      await db.delete(imageGenUpload).where(eq(imageGenUpload.id, input.id));

      return { data: { id: input.id } };
    }),
});
