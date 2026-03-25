import { z } from "zod";

// Enums matching Prisma schema
export const creativeAssetStatusSchema = z.enum(["DRAFT", "IN_REVIEW", "APPROVED", "ARCHIVED"]);
export const versionApprovalStatusSchema = z.enum(["PENDING", "APPROVED", "REJECTED", "NOT_APPLICABLE"]);

// Creative Asset Version Schema
export const creativeAssetVersionSchema = z.object({
  id: z.string(),
  creativeAssetId: z.string(),
  internalVersionNumber: z.number(),
  publicVersionNumber: z.number().nullable(),
  isPublic: z.boolean(),
  internalApprovalStatus: versionApprovalStatusSchema,
  publicApprovalStatus: versionApprovalStatusSchema,
  fileUrl: z.string(),
  fileKey: z.string(),
  fileName: z.string(),
  fileSize: z.number(),
  mimeType: z.string(),
  fileMetadata: z.any().nullable(),
  versionNotes: z.string().nullable(),
  changesSummary: z.string().nullable(),
  previousVersionId: z.string().nullable(),
  internalApprovedBy: z.string().nullable(),
  internalApprovedAt: z.string().nullable(),
  internalRejectedBy: z.string().nullable(),
  internalRejectedAt: z.string().nullable(),
  internalRejectionReason: z.string().nullable(),
  publicApprovedBy: z.string().nullable(),
  publicApprovedAt: z.string().nullable(),
  publicRejectedBy: z.string().nullable(),
  publicRejectedAt: z.string().nullable(),
  publicRejectionReason: z.string().nullable(),
  madePublicBy: z.string().nullable(),
  madePublicAt: z.string().nullable(),
  createdBy: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Creative Asset Comment Schema
export const creativeAssetCommentSchema = z.object({
  id: z.string(),
  creativeAssetVersionId: z.string(),
  userId: z.string(),
  content: z.string(),
  isInternal: z.boolean(),
  isResolved: z.boolean(),
  resolvedBy: z.string().nullable(),
  resolvedAt: z.string().nullable(),
  parentCommentId: z.string().nullable(),
  replyCount: z.number(),
  mentions: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
  editedAt: z.string().nullable(),
});

// Creative Asset Permission Schema
export const creativeAssetPermissionSchema = z.object({
  id: z.string(),
  creativeAssetId: z.string(),
  userId: z.string(),
  canView: z.boolean(),
  canEdit: z.boolean(),
  canComment: z.boolean(),
  canApprove: z.boolean(),
  canPublish: z.boolean(),
  canDelete: z.boolean(),
  grantedBy: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Creative Asset Activity Log Schema
export const creativeAssetActivityLogSchema = z.object({
  id: z.string(),
  creativeAssetId: z.string(),
  userId: z.string(),
  action: z.string(),
  description: z.string().nullable(),
  metadata: z.any().nullable(),
  ipAddress: z.string().nullable(),
  userAgent: z.string().nullable(),
  createdAt: z.string(),
});

// Creative Asset Version Activity Log Schema
export const creativeAssetVersionActivityLogSchema = z.object({
  id: z.string(),
  creativeAssetVersionId: z.string(),
  userId: z.string(),
  action: z.string(),
  description: z.string().nullable(),
  metadata: z.any().nullable(),
  ipAddress: z.string().nullable(),
  userAgent: z.string().nullable(),
  createdAt: z.string(),
});

// Main Creative Asset Schema
export const creativeAssetSchema = z.object({
  id: z.string(),
  teamId: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  category: z.string().nullable(),
  status: creativeAssetStatusSchema,
  currentInternalVersion: z.number().nullable(),
  currentPublicVersion: z.number().nullable(),
  isPublic: z.boolean(),
  createdBy: z.string(),
  lastModifiedBy: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  // Relations (populated in detail view)
  versions: z.array(creativeAssetVersionSchema).optional(),
  permissions: z.array(creativeAssetPermissionSchema).optional(),
  activityLogs: z.array(creativeAssetActivityLogSchema).optional(),
});

export type CreativeAsset = z.infer<typeof creativeAssetSchema>;
export type CreativeAssetVersion = z.infer<typeof creativeAssetVersionSchema>;
export type CreativeAssetComment = z.infer<typeof creativeAssetCommentSchema>;
export type CreativeAssetPermission = z.infer<typeof creativeAssetPermissionSchema>;
export type CreativeAssetActivityLog = z.infer<typeof creativeAssetActivityLogSchema>;
export type CreativeAssetVersionActivityLog = z.infer<typeof creativeAssetVersionActivityLogSchema>;
