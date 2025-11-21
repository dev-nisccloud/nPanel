import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../trpc";
import prisma from "@nPanel/db";

// ============================================================================
// TYPESCRIPT TYPES - Independent from Prisma, mirroring database structure
// ============================================================================

// Status enums as TypeScript types
type CreativeAssetStatusType = "DRAFT" | "IN_REVIEW" | "APPROVED" | "ARCHIVED";
type VersionApprovalStatusType = "PENDING" | "APPROVED" | "REJECTED" | "NOT_APPLICABLE";

// Database model types (matching Prisma schema structure but independent)
interface DbCreativeAssetVersion {
  id: string;
  creativeAssetId: string;
  internalVersionNumber: number;
  publicVersionNumber: number | null;
  isPublic: boolean;
  internalApprovalStatus: VersionApprovalStatusType;
  publicApprovalStatus: VersionApprovalStatusType;
  fileUrl: string;
  fileKey: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  versionNotes: string | null;
  changesSummary: string | null;
  previousVersionId: string | null;
  createdBy: string;
  internalApprovedBy: string | null;
  internalApprovedAt: Date | null;
  internalRejectedBy: string | null;
  internalRejectedAt: Date | null;
  internalRejectionReason: string | null;
  publicApprovedBy: string | null;
  publicApprovedAt: Date | null;
  publicRejectedBy: string | null;
  publicRejectedAt: Date | null;
  publicRejectionReason: string | null;
  madePublicBy: string | null;
  madePublicAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface DbTeam {
  id: string;
  name: string;
  slug: string;
  members?: Array<{ userId: string }>;
}

interface DbCreativeAsset {
  id: string;
  teamId: string;
  name: string;
  description: string | null;
  category: string | null;
  status: CreativeAssetStatusType;
  currentInternalVersion: number | null;
  currentPublicVersion: number | null;
  isPublic: boolean;
  createdBy: string;
  lastModifiedBy: string;
  createdAt: Date;
  updatedAt: Date;
  team: DbTeam;
  versions?: DbCreativeAssetVersion[];
  permissions?: Array<{
    id: string;
    creativeAssetId: string;
    userId: string;
    canView: boolean;
    canEdit: boolean;
    canComment: boolean;
    canApprove: boolean;
    canPublish: boolean;
    canDelete: boolean;
    grantedBy: string;
    createdAt: Date;
    updatedAt: Date;
  }>;
  _count?: {
    versions: number;
  };
}

interface DbCreativeAssetComment {
  id: string;
  creativeAssetVersionId: string;
  userId: string;
  content: string;
  isInternal: boolean;
  parentCommentId: string | null;
  mentions: string[];
  replyCount: number;
  createdAt: Date;
  updatedAt: Date;
  replies?: DbCreativeAssetComment[];
}

// ============================================================================
// ZOD SCHEMAS - Independent from database schema (no shared types)
// ============================================================================

// Response schemas
const creativeAssetVersionSchema = z.object({
  id: z.string(),
  creativeAssetId: z.string(),
  internalVersionNumber: z.number(),
  publicVersionNumber: z.number().nullable(),
  isPublic: z.boolean(),
  internalApprovalStatus: z.string(),
  publicApprovalStatus: z.string(),
  fileUrl: z.string(),
  fileKey: z.string(),
  fileName: z.string(),
  fileSize: z.number(),
  mimeType: z.string(),
  versionNotes: z.string().nullable(),
  changesSummary: z.string().nullable(),
  previousVersionId: z.string().nullable(),
  createdBy: z.string(),
  internalApprovedBy: z.string().nullable(),
  internalApprovedAt: z.date().nullable(),
  internalRejectedBy: z.string().nullable(),
  internalRejectedAt: z.date().nullable(),
  internalRejectionReason: z.string().nullable(),
  publicApprovedBy: z.string().nullable(),
  publicApprovedAt: z.date().nullable(),
  publicRejectedBy: z.string().nullable(),
  publicRejectedAt: z.date().nullable(),
  publicRejectionReason: z.string().nullable(),
  madePublicBy: z.string().nullable(),
  madePublicAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

const creativeAssetPermissionSchema = z.object({
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
  createdAt: z.date(),
  updatedAt: z.date(),
});

const creativeAssetSchema = z.object({
  id: z.string(),
  teamId: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  category: z.string().nullable(),
  status: z.string(),
  currentInternalVersion: z.number().nullable(),
  currentPublicVersion: z.number().nullable(),
  isPublic: z.boolean(),
  createdBy: z.string(),
  lastModifiedBy: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  team: z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
  }),
});

const commentSchema = z.object({
  id: z.string(),
  creativeAssetVersionId: z.string(),
  userId: z.string(),
  content: z.string(),
  isInternal: z.boolean(),
  parentCommentId: z.string().nullable(),
  mentions: z.array(z.string()),
  replyCount: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// ============================================================================
// Helper Functions
// ============================================================================

// Transform functions to ensure clean data (no Prisma types leak)
// These convert Prisma enum types to plain strings for API layer

function transformVersion(version: DbCreativeAssetVersion): {
  id: string;
  creativeAssetId: string;
  internalVersionNumber: number;
  publicVersionNumber: number | null;
  isPublic: boolean;
  internalApprovalStatus: string;
  publicApprovalStatus: string;
  fileUrl: string;
  fileKey: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  versionNotes: string | null;
  changesSummary: string | null;
  previousVersionId: string | null;
  createdBy: string;
  internalApprovedBy: string | null;
  internalApprovedAt: Date | null;
  internalRejectedBy: string | null;
  internalRejectedAt: Date | null;
  internalRejectionReason: string | null;
  publicApprovedBy: string | null;
  publicApprovedAt: Date | null;
  publicRejectedBy: string | null;
  publicRejectedAt: Date | null;
  publicRejectionReason: string | null;
  madePublicBy: string | null;
  madePublicAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
} {
  return {
    id: version.id,
    creativeAssetId: version.creativeAssetId,
    internalVersionNumber: version.internalVersionNumber,
    publicVersionNumber: version.publicVersionNumber,
    isPublic: version.isPublic,
    internalApprovalStatus: version.internalApprovalStatus as string,
    publicApprovalStatus: version.publicApprovalStatus as string,
    fileUrl: version.fileUrl,
    fileKey: version.fileKey,
    fileName: version.fileName,
    fileSize: version.fileSize,
    mimeType: version.mimeType,
    versionNotes: version.versionNotes,
    changesSummary: version.changesSummary,
    previousVersionId: version.previousVersionId,
    createdBy: version.createdBy,
    internalApprovedBy: version.internalApprovedBy,
    internalApprovedAt: version.internalApprovedAt,
    internalRejectedBy: version.internalRejectedBy,
    internalRejectedAt: version.internalRejectedAt,
    internalRejectionReason: version.internalRejectionReason,
    publicApprovedBy: version.publicApprovedBy,
    publicApprovedAt: version.publicApprovedAt,
    publicRejectedBy: version.publicRejectedBy,
    publicRejectedAt: version.publicRejectedAt,
    publicRejectionReason: version.publicRejectionReason,
    madePublicBy: version.madePublicBy,
    madePublicAt: version.madePublicAt,
    createdAt: version.createdAt,
    updatedAt: version.updatedAt,
  };
}

function transformAsset(asset: DbCreativeAsset) {
  const result: {
    id: string;
    teamId: string;
    name: string;
    description: string | null;
    category: string | null;
    status: string;
    currentInternalVersion: number | null;
    currentPublicVersion: number | null;
    isPublic: boolean;
    createdBy: string;
    lastModifiedBy: string;
    createdAt: Date;
    updatedAt: Date;
    team: {
      id: string;
      name: string;
      slug: string;
    };
    versions?: ReturnType<typeof transformVersion>[];
    permissions?: DbCreativeAsset['permissions'];
    _count?: DbCreativeAsset['_count'];
  } = {
    id: asset.id,
    teamId: asset.teamId,
    name: asset.name,
    description: asset.description,
    category: asset.category,
    status: asset.status as string, // Convert enum to string
    currentInternalVersion: asset.currentInternalVersion,
    currentPublicVersion: asset.currentPublicVersion,
    isPublic: asset.isPublic,
    createdBy: asset.createdBy,
    lastModifiedBy: asset.lastModifiedBy,
    createdAt: asset.createdAt,
    updatedAt: asset.updatedAt,
    team: {
      id: asset.team.id,
      name: asset.team.name,
      slug: asset.team.slug,
    },
  };
  
  if (asset.versions !== undefined) {
    result.versions = asset.versions.map(transformVersion);
  }
  if (asset.permissions !== undefined) {
    result.permissions = asset.permissions;
  }
  if (asset._count !== undefined) {
    result._count = asset._count;
  }
  
  return result;
}

function transformComment(comment: DbCreativeAssetComment): {
  id: string;
  creativeAssetVersionId: string;
  userId: string;
  content: string;
  isInternal: boolean;
  parentCommentId: string | null;
  mentions: string[];
  replyCount: number;
  createdAt: Date;
  updatedAt: Date;
  replies?: ReturnType<typeof transformComment>[];
} {
  return {
    id: comment.id,
    creativeAssetVersionId: comment.creativeAssetVersionId,
    userId: comment.userId,
    content: comment.content,
    isInternal: comment.isInternal,
    parentCommentId: comment.parentCommentId,
    mentions: comment.mentions || [],
    replyCount: comment.replyCount || 0,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
    replies: comment.replies ? comment.replies.map(transformComment) : undefined,
  };
}

// Helper to get authenticated user with role from context
async function getAuthenticatedUser(ctx: { session: { user?: { id: string; name?: string; email?: string } } | null }) {
	const user = ctx.session?.user;
	if (!user?.id) {
		throw new TRPCError({
			code: "UNAUTHORIZED",
			message: "You must be logged in",
		});
	}

	const dbUser = await prisma.user.findUnique({
		where: { id: user.id },
		select: { id: true, role: true, email: true, name: true },
	});

	if (!dbUser) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "User not found",
		});
	}

	return { id: user.id, role: dbUser.role as string };
}

// Helper to check if user is agency user
const isAgencyUser = (role: string) => {
	return ["AGENCY_USER", "AGENCY_ADMIN", "AGENCY_SUPER_ADMIN"].includes(role);
};

// Helper to check if user is customer
const isCustomer = (role: string) => {
	return role === "CUSTOMER";
};

export const creativeAssetsRouter = router({
	// Create a new creative asset
	create: protectedProcedure
		.input(
			z.object({
				teamId: z.string(),
				name: z.string().min(1).max(255),
				description: z.string().optional(),
				category: z.string().optional(),
				status: z.enum(["DRAFT", "IN_REVIEW", "APPROVED", "ARCHIVED"]).optional(),
			}),
		)
		.output(creativeAssetSchema)
		.mutation(async ({ ctx, input }) => {
			const user = await getAuthenticatedUser(ctx);

			// Only agency users can create creative assets
			if (!isAgencyUser(user.role)) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Only agency users can create creative assets",
				});
			}

			// Verify team exists
			const team = await prisma.team.findUnique({
				where: { id: input.teamId },
			});

			if (!team) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Team not found",
				});
			}

			const asset = await prisma.creativeAsset.create({
				data: {
					id: crypto.randomUUID(),
					teamId: input.teamId,
					name: input.name,
					description: input.description,
					category: input.category,
					status: input.status || "DRAFT",
					currentInternalVersion: null,
					currentPublicVersion: null,
					isPublic: false,
					createdBy: user.id,
					lastModifiedBy: user.id,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				include: {
					team: true,
				},
			});

			// Create permission for creator
			await prisma.creativeAssetPermission.create({
				data: {
					id: crypto.randomUUID(),
					creativeAssetId: asset.id,
					userId: user.id,
					canView: true,
					canEdit: true,
					canComment: true,
					canApprove: true,
					canPublish: true,
					canDelete: true,
					grantedBy: user.id,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			});

			// Log activity
			await prisma.creativeAssetActivityLog.create({
				data: {
					id: crypto.randomUUID(),
					creativeAssetId: asset.id,
					userId: user.id,
					action: "CREATE",
					description: `Created creative asset: ${asset.name}`,
					metadata: { teamId: input.teamId },
					createdAt: new Date(),
				},
			});

			return transformAsset(asset);
		}),

	// Upload a new version
	uploadVersion: protectedProcedure
		.input(
			z.object({
				creativeAssetId: z.string(),
				fileUrl: z.string().url(),
				fileKey: z.string(),
				fileName: z.string(),
				fileSize: z.number(),
				mimeType: z.string(),
				fileMetadata: z.record(z.string(), z.unknown()).optional(),
				versionNotes: z.string().optional(),
				changesSummary: z.string().optional(),
			}),
		)
		.output(creativeAssetVersionSchema)
		.mutation(async ({ ctx, input }) => {
			const user = await getAuthenticatedUser(ctx);

			// Get the asset
			const asset = await prisma.creativeAsset.findUnique({
				where: { id: input.creativeAssetId },
				include: {
					permissions: true,
					versions: {
						orderBy: { internalVersionNumber: "desc" },
						take: 1,
					},
				},
			});

			if (!asset) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Creative asset not found",
				});
			}

			// Check permissions for agency users
			if (isAgencyUser(user.role)) {
				const permission = asset.permissions.find((p) => p.userId === user.id);
				if (!permission?.canEdit) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "You don't have permission to upload versions",
					});
				}
			} else {
				// Customers cannot upload versions
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Only agency users can upload new versions",
				});
			}

			// Get the latest version to set previousVersionId
			const latestVersion = asset.versions[0];
			const newInternalVersion = (asset.currentInternalVersion ?? 0) + 1;

			// Create new version
			const version = await prisma.creativeAssetVersion.create({
				data: {
					id: crypto.randomUUID(),
					creativeAssetId: input.creativeAssetId,
					internalVersionNumber: newInternalVersion,
					publicVersionNumber: null,
					isPublic: false,
					internalApprovalStatus: "PENDING",
					publicApprovalStatus: "NOT_APPLICABLE",
					fileUrl: input.fileUrl,
					fileKey: input.fileKey,
					fileName: input.fileName,
					fileSize: input.fileSize,
					mimeType: input.mimeType,
					versionNotes: input.versionNotes,
					changesSummary: input.changesSummary,
					previousVersionId: latestVersion?.id,
					createdBy: user.id,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			});

			// Update asset's current internal version
			await prisma.creativeAsset.update({
				where: { id: input.creativeAssetId },
				data: {
					currentInternalVersion: newInternalVersion,
					lastModifiedBy: user.id,
					updatedAt: new Date(),
				},
			});

			// Log activity
			await prisma.creativeAssetVersionActivityLog.create({
				data: {
					id: crypto.randomUUID(),
					creativeAssetVersionId: version.id,
					userId: user.id,
					action: "CREATE",
					description: `Uploaded version ${newInternalVersion}`,
					metadata: { fileName: input.fileName },
					createdAt: new Date(),
				},
			});

			return transformVersion(version);
		}),

	// Approve version internally (agency)
	approveVersionInternally: protectedProcedure
		.input(
			z.object({
				versionId: z.string(),
			}),
		)
		.output(creativeAssetVersionSchema)
		.mutation(async ({ ctx, input }) => {
			const user = await getAuthenticatedUser(ctx);

			// Only agency users can approve internally
			if (!isAgencyUser(user.role)) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Only agency users can approve versions internally",
				});
			}

			const version = await prisma.creativeAssetVersion.findUnique({
				where: { id: input.versionId },
				include: {
					creativeAsset: {
						include: {
							permissions: true,
						},
					},
				},
			});

			if (!version) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Version not found",
				});
			}

			// Check permission
			const permission = version.creativeAsset.permissions.find(
				(p) => p.userId === user.id,
			);
			if (!permission?.canApprove) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You don't have permission to approve versions",
				});
			}

			// If version is not already public, make it public and assign public version number
			let updateVersionData: any = {
					internalApprovalStatus: "APPROVED",
					internalApprovedBy: user.id,
					internalApprovedAt: new Date(),
					internalRejectedBy: null,
					internalRejectedAt: null,
					internalRejectionReason: null,
					updatedAt: new Date(),
			};

			if (!version.isPublic) {
				// Get latest public version to calculate next public version number
				const latestPublicVersion = await prisma.creativeAssetVersion.findFirst({
					where: {
						creativeAssetId: version.creativeAssetId,
						isPublic: true,
					},
					orderBy: { publicVersionNumber: "desc" },
				});
				const nextPublicVersion = latestPublicVersion
					? (latestPublicVersion.publicVersionNumber || 0) + 1
					: 1;

				// Automatically make it public when approving
				updateVersionData = {
					...updateVersionData,
					isPublic: true,
					publicVersionNumber: nextPublicVersion,
					publicApprovalStatus: "PENDING",
					madePublicBy: user.id,
					madePublicAt: new Date(),
				};

				// Update asset to reflect new public version
				await prisma.creativeAsset.update({
					where: { id: version.creativeAssetId },
					data: {
						isPublic: true,
						currentPublicVersion: nextPublicVersion,
						lastModifiedBy: user.id,
						updatedAt: new Date(),
				},
			});

			// Log activity
				await prisma.creativeAssetVersionActivityLog.create({
					data: {
						id: crypto.randomUUID(),
						creativeAssetVersionId: version.id,
						userId: user.id,
						action: "APPROVE_INTERNAL",
						description: `Approved version ${version.internalVersionNumber} internally and made it public as version ${nextPublicVersion}`,
						createdAt: new Date(),
					},
				});
			} else {
				// Version is already public, just log the approval
			await prisma.creativeAssetVersionActivityLog.create({
				data: {
					id: crypto.randomUUID(),
					creativeAssetVersionId: version.id,
					userId: user.id,
					action: "APPROVE_INTERNAL",
					description: `Approved version ${version.internalVersionNumber} internally`,
					createdAt: new Date(),
				},
				});
			}

			// Update version
			const updatedVersion = await prisma.creativeAssetVersion.update({
				where: { id: input.versionId },
				data: updateVersionData,
			});

			return transformVersion(updatedVersion);
		}),

	// Reject version internally (agency)
	rejectVersionInternally: protectedProcedure
		.input(
			z.object({
				versionId: z.string(),
				rejectionReason: z.string().optional(),
			}),
		)
		.output(creativeAssetVersionSchema)
		.mutation(async ({ ctx, input }) => {
			const user = await getAuthenticatedUser(ctx);

			// Only agency users can reject internally
			if (!isAgencyUser(user.role)) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Only agency users can reject versions internally",
				});
			}

			const version = await prisma.creativeAssetVersion.findUnique({
				where: { id: input.versionId },
				include: {
					creativeAsset: {
						include: {
							permissions: true,
						},
					},
				},
			});

			if (!version) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Version not found",
				});
			}

			// Check permission
			const permission = version.creativeAsset.permissions.find(
				(p) => p.userId === user.id,
			);
			if (!permission?.canApprove) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You don't have permission to reject versions",
				});
			}

			// Update version
			const updatedVersion = await prisma.creativeAssetVersion.update({
				where: { id: input.versionId },
				data: {
					internalApprovalStatus: "REJECTED",
					internalRejectedBy: user.id,
					internalRejectedAt: new Date(),
					internalRejectionReason: input.rejectionReason,
					internalApprovedBy: null,
					internalApprovedAt: null,
					updatedAt: new Date(),
				},
			});

			// Log activity
			await prisma.creativeAssetVersionActivityLog.create({
				data: {
					id: crypto.randomUUID(),
					creativeAssetVersionId: version.id,
					userId: user.id,
					action: "REJECT_INTERNAL",
					description: `Rejected version ${version.internalVersionNumber} internally`,
					metadata: { reason: input.rejectionReason },
					createdAt: new Date(),
				},
			});

			return transformVersion(updatedVersion);
		}),

	// Make version public (agency)
	makeVersionPublic: protectedProcedure
		.input(
			z.object({
				versionId: z.string(),
			}),
		)
		.output(creativeAssetVersionSchema)
		.mutation(async ({ ctx, input }) => {
			const user = await getAuthenticatedUser(ctx);

			// Only agency users can make versions public
			if (!isAgencyUser(user.role)) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Only agency users can make versions public",
				});
			}

			const version = await prisma.creativeAssetVersion.findUnique({
				where: { id: input.versionId },
				include: {
					creativeAsset: {
						include: {
							permissions: true,
							versions: {
								where: { isPublic: true },
								orderBy: { publicVersionNumber: "desc" },
								take: 1,
							},
						},
					},
				},
			});

			if (!version) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Version not found",
				});
			}

			// Check permission
			const permission = version.creativeAsset.permissions.find(
				(p) => p.userId === user.id,
			);
			if (!permission?.canPublish) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You don't have permission to make versions public",
				});
			}

			// Must be approved internally first
			if (version.internalApprovalStatus !== "APPROVED") {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Version must be approved internally before making it public",
				});
			}

			// Get next public version number
			const latestPublicVersion = version.creativeAsset.versions[0];
			const nextPublicVersion = latestPublicVersion
				? (latestPublicVersion.publicVersionNumber || 0) + 1
				: 1;

			// Update version
			const updatedVersion = await prisma.creativeAssetVersion.update({
				where: { id: input.versionId },
				data: {
					isPublic: true,
					publicVersionNumber: nextPublicVersion,
					publicApprovalStatus: "PENDING",
					madePublicBy: user.id,
					madePublicAt: new Date(),
					updatedAt: new Date(),
				},
			});

			// Update asset
			await prisma.creativeAsset.update({
				where: { id: version.creativeAssetId },
				data: {
					isPublic: true,
					currentPublicVersion: nextPublicVersion,
					lastModifiedBy: user.id,
					updatedAt: new Date(),
				},
			});

			// Log activity
			await prisma.creativeAssetVersionActivityLog.create({
				data: {
					id: crypto.randomUUID(),
					creativeAssetVersionId: version.id,
					userId: user.id,
					action: "MAKE_PUBLIC",
					description: `Made version ${version.internalVersionNumber} public as version ${nextPublicVersion}`,
					createdAt: new Date(),
				},
			});

			return transformVersion(updatedVersion);
		}),

	// Approve version publicly (customer)
	approveVersionPublicly: protectedProcedure
		.input(
			z.object({
				versionId: z.string(),
			}),
		)
		.output(creativeAssetVersionSchema)
		.mutation(async ({ ctx, input }) => {
			const user = await getAuthenticatedUser(ctx);

			// Only customers can approve publicly
			if (!isCustomer(user.role)) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Only customers can approve versions publicly",
				});
			}

			const version = await prisma.creativeAssetVersion.findUnique({
				where: { id: input.versionId },
				include: {
					creativeAsset: {
						include: {
							team: {
								include: {
									members: true,
								},
							},
						},
					},
				},
			});

			if (!version) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Version not found",
				});
			}

			// Check if version is public
			if (!version.isPublic) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "This version is not public yet",
				});
			}

			// Check if user is member of the team
			const isMember = version.creativeAsset.team.members.some(
				(m) => m.userId === user.id,
			);
			if (!isMember) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You are not a member of this team",
				});
			}

			// Update version
			const updatedVersion = await prisma.creativeAssetVersion.update({
				where: { id: input.versionId },
				data: {
					publicApprovalStatus: "APPROVED",
					publicApprovedBy: user.id,
					publicApprovedAt: new Date(),
					publicRejectedBy: null,
					publicRejectedAt: null,
					publicRejectionReason: null,
					updatedAt: new Date(),
				},
			});

			// Log activity
			await prisma.creativeAssetVersionActivityLog.create({
				data: {
					id: crypto.randomUUID(),
					creativeAssetVersionId: version.id,
					userId: user.id,
					action: "APPROVE_PUBLIC",
					description: `Approved public version ${version.publicVersionNumber}`,
					createdAt: new Date(),
				},
			});

			return transformVersion(updatedVersion);
		}),

	// Reject version publicly (customer)
	rejectVersionPublicly: protectedProcedure
		.input(
			z.object({
				versionId: z.string(),
				rejectionReason: z.string().optional(),
			}),
		)
		.output(creativeAssetVersionSchema)
		.mutation(async ({ ctx, input }) => {
			const user = await getAuthenticatedUser(ctx);

			// Only customers can reject publicly
			if (!isCustomer(user.role)) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Only customers can reject versions publicly",
				});
			}

			const version = await prisma.creativeAssetVersion.findUnique({
				where: { id: input.versionId },
				include: {
					creativeAsset: {
						include: {
							team: {
								include: {
									members: true,
								},
							},
						},
					},
				},
			});

			if (!version) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Version not found",
				});
			}

			// Check if version is public
			if (!version.isPublic) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "This version is not public yet",
				});
			}

			// Check if user is member of the team
			const isMember = version.creativeAsset.team.members.some(
				(m) => m.userId === user.id,
			);
			if (!isMember) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You are not a member of this team",
				});
			}

			// Update version
			const updatedVersion = await prisma.creativeAssetVersion.update({
				where: { id: input.versionId },
				data: {
					publicApprovalStatus: "REJECTED",
					publicRejectedBy: user.id,
					publicRejectedAt: new Date(),
					publicRejectionReason: input.rejectionReason,
					publicApprovedBy: null,
					publicApprovedAt: null,
					updatedAt: new Date(),
				},
			});

			// Log activity
			await prisma.creativeAssetVersionActivityLog.create({
				data: {
					id: crypto.randomUUID(),
					creativeAssetVersionId: version.id,
					userId: user.id,
					action: "REJECT_PUBLIC",
					description: `Rejected public version ${version.publicVersionNumber}`,
					metadata: { reason: input.rejectionReason },
					createdAt: new Date(),
				},
			});

			return transformVersion(updatedVersion);
		}),

	// Update version approval status
	updateVersionStatus: protectedProcedure
		.input(
			z.object({
				versionId: z.string(),
				status: z.enum(["PENDING", "APPROVED", "REJECTED", "NOT_APPLICABLE"]),
			}),
		)
		.output(creativeAssetVersionSchema)
		.mutation(async ({ ctx, input }) => {
			const user = await getAuthenticatedUser(ctx);

			// Only agency users can update version status
			if (!isAgencyUser(user.role)) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Only agency users can update version status",
				});
			}

			const version = await prisma.creativeAssetVersion.findUnique({
				where: { id: input.versionId },
				include: {
					creativeAsset: {
						include: {
							permissions: true,
						},
					},
				},
			});

			if (!version) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Version not found",
				});
			}

			// Check permission
			const permission = version.creativeAsset.permissions.find(
				(p) => p.userId === user.id,
			);
			if (!permission?.canApprove) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You don't have permission to update version status",
				});
			}

			// If setting to APPROVED, automatically make it public
			let updateData: any = {
				internalApprovalStatus: input.status,
				updatedAt: new Date(),
			};

			if (input.status === "APPROVED") {
				// If version is not already public, make it public and assign public version number
				if (!version.isPublic) {
					// Get latest public version to calculate next public version number
					const latestPublicVersion = await prisma.creativeAssetVersion.findFirst({
						where: {
							creativeAssetId: version.creativeAssetId,
							isPublic: true,
						},
						orderBy: { publicVersionNumber: "desc" },
					});
					const nextPublicVersion = latestPublicVersion
						? (latestPublicVersion.publicVersionNumber || 0) + 1
						: 1;

					updateData = {
						...updateData,
						internalApprovedBy: user.id,
						internalApprovedAt: new Date(),
						internalRejectedBy: null,
						internalRejectedAt: null,
						internalRejectionReason: null,
						// Automatically make it public when approving
						isPublic: true,
						publicVersionNumber: nextPublicVersion,
						publicApprovalStatus: "PENDING",
						madePublicBy: user.id,
						madePublicAt: new Date(),
					};

					// Update asset to reflect new public version
					await prisma.creativeAsset.update({
						where: { id: version.creativeAssetId },
						data: {
							isPublic: true,
							currentPublicVersion: nextPublicVersion,
							lastModifiedBy: user.id,
							updatedAt: new Date(),
						},
					});
				} else {
					// Version is already public, just update approval status
					updateData = {
						...updateData,
						internalApprovedBy: user.id,
						internalApprovedAt: new Date(),
						internalRejectedBy: null,
						internalRejectedAt: null,
						internalRejectionReason: null,
						// Keep existing public version number
					};
				}
			} else if (input.status === "REJECTED") {
				updateData = {
					...updateData,
					internalRejectedBy: user.id,
					internalRejectedAt: new Date(),
					internalApprovedBy: null,
					internalApprovedAt: null,
				};
			} else if (input.status === "PENDING") {
				updateData = {
					...updateData,
					internalApprovedBy: null,
					internalApprovedAt: null,
					internalRejectedBy: null,
					internalRejectedAt: null,
					internalRejectionReason: null,
				};
			} else if (input.status === "NOT_APPLICABLE") {
				// When archiving (NOT_APPLICABLE), clear approval/rejection fields
				updateData = {
					...updateData,
					internalApprovedBy: null,
					internalApprovedAt: null,
					internalRejectedBy: null,
					internalRejectedAt: null,
					internalRejectionReason: null,
				};
			}

			// Update version
			const updatedVersion = await prisma.creativeAssetVersion.update({
				where: { id: input.versionId },
				data: updateData,
			});

			// Log activity
			const actionMap: Record<string, string> = {
				PENDING: "SET_STATUS_PENDING",
				APPROVED: "APPROVE_INTERNAL",
				REJECTED: "REJECT_INTERNAL",
				NOT_APPLICABLE: "ARCHIVE_VERSION",
			};

			await prisma.creativeAssetVersionActivityLog.create({
				data: {
					id: crypto.randomUUID(),
					creativeAssetVersionId: version.id,
					userId: user.id,
					action: actionMap[input.status] || "UPDATE_STATUS",
					description: `Updated version ${version.internalVersionNumber} status to ${input.status}`,
					createdAt: new Date(),
				},
			});

			return transformVersion(updatedVersion);
		}),

	// Make version private (unpublish)
	makeVersionPrivate: protectedProcedure
		.input(
			z.object({
				versionId: z.string(),
			}),
		)
		.output(creativeAssetVersionSchema)
		.mutation(async ({ ctx, input }) => {
			const user = await getAuthenticatedUser(ctx);

			// Only agency users can make versions private
			if (!isAgencyUser(user.role)) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Only agency users can make versions private",
				});
			}

			const version = await prisma.creativeAssetVersion.findUnique({
				where: { id: input.versionId },
				include: {
					creativeAsset: {
						include: {
							permissions: true,
						},
					},
				},
			});

			if (!version) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Version not found",
				});
			}

			// Check permission
			const permission = version.creativeAsset.permissions.find(
				(p) => p.userId === user.id,
			);
			if (!permission?.canPublish) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You don't have permission to make versions private",
				});
			}

			// Must be public to make it private
			if (!version.isPublic) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Version is not public",
				});
			}

			// Update version
			const updatedVersion = await prisma.creativeAssetVersion.update({
				where: { id: input.versionId },
				data: {
					isPublic: false,
					publicVersionNumber: null,
					publicApprovalStatus: "NOT_APPLICABLE",
					madePublicBy: null,
					madePublicAt: null,
					updatedAt: new Date(),
				},
			});

			// Check if this was the current public version and update asset if needed
			const asset = await prisma.creativeAsset.findUnique({
				where: { id: version.creativeAssetId },
				include: {
					versions: {
						where: { isPublic: true },
						orderBy: { publicVersionNumber: "desc" },
						take: 1,
					},
				},
			});

			if (asset) {
				const latestPublicVersion = asset.versions[0];
				await prisma.creativeAsset.update({
					where: { id: version.creativeAssetId },
					data: {
						isPublic: latestPublicVersion ? true : false,
						currentPublicVersion: latestPublicVersion?.publicVersionNumber || null,
						lastModifiedBy: user.id,
						updatedAt: new Date(),
					},
				});
			}

			// Log activity
			await prisma.creativeAssetVersionActivityLog.create({
				data: {
					id: crypto.randomUUID(),
					creativeAssetVersionId: version.id,
					userId: user.id,
					action: "MAKE_PRIVATE",
					description: `Made version ${version.internalVersionNumber} private`,
					createdAt: new Date(),
				},
			});

			return transformVersion(updatedVersion);
		}),

	// Get all assets for a team
	getByTeam: protectedProcedure
		.input(
			z.object({
				teamId: z.string(),
			}),
		)
		.output(z.array(creativeAssetSchema.extend({
			versions: z.array(creativeAssetVersionSchema).optional(),
			permissions: z.array(creativeAssetPermissionSchema).optional(),
			_count: z.object({
				versions: z.number(),
			}).optional(),
		})))
		.query(async ({ ctx, input }) => {
			const user = await getAuthenticatedUser(ctx);

			// Verify user has access to team
			const teamMember = await prisma.teamMember.findFirst({
				where: {
					teamId: input.teamId,
					userId: user.id,
				},
			});

			const isAgency = isAgencyUser(user.role);

			if (!isAgency && !teamMember) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You don't have access to this team",
				});
			}

			const assets = await prisma.creativeAsset.findMany({
				where: { teamId: input.teamId },
				include: {
					team: true,
					versions: {
						where: isAgency
							? undefined
							: { isPublic: true }, // Customers only see public versions
						orderBy: { createdAt: "desc" },
					},
					permissions: isAgency ? true : false, // Only agency users need permissions
					_count: {
						select: {
							versions: true,
						},
					},
				},
				orderBy: { createdAt: "desc" },
			});

			// Filter by permissions for agency users
			if (isAgency) {
				return assets
					.filter((asset) => {
						const permission = asset.permissions.find((p) => p.userId === user.id);
						return permission?.canView;
					})
					.map(transformAsset);
			}

			return assets.map(transformAsset);
		}),

	// Get all assets for the current user (across all teams)
	getAll: protectedProcedure
		.output(z.array(creativeAssetSchema.extend({
			versions: z.array(creativeAssetVersionSchema).optional(),
			permissions: z.array(creativeAssetPermissionSchema).optional(),
			_count: z.object({
				versions: z.number(),
			}).optional(),
		})))
		.query(async ({ ctx }) => {
			const user = await getAuthenticatedUser(ctx);
			const isAgency = isAgencyUser(user.role);

			let assetIds: string[] = [];

			if (isAgency) {
				// Agency users: Get all asset IDs they have view permission for
				const permissions = await prisma.creativeAssetPermission.findMany({
					where: {
						userId: user.id,
						canView: true,
					},
					select: {
						creativeAssetId: true,
					},
				});

				assetIds = permissions.map((p) => p.creativeAssetId);
			} else {
				// Customers: Get asset IDs from teams they're members of
				const teamMemberships = await prisma.teamMember.findMany({
					where: { userId: user.id },
					select: {
						teamId: true,
					},
				});

				const teamIds = teamMemberships.map((tm) => tm.teamId);

				const customerAssets = await prisma.creativeAsset.findMany({
					where: {
						teamId: { in: teamIds },
					},
					select: {
						id: true,
					},
				});

				assetIds = customerAssets.map((a) => a.id);
			}

			// Fetch all assets with their relations
			const assets = await prisma.creativeAsset.findMany({
				where: {
					id: { in: assetIds },
				},
				include: {
					team: true,
					versions: {
						where: isAgency
							? undefined
							: { isPublic: true }, // Customers only see public versions
						orderBy: { createdAt: "desc" },
					},
					permissions: isAgency ? true : false, // Only agency users need permissions
					_count: {
						select: {
							versions: true,
						},
					},
				},
				orderBy: { createdAt: "desc" },
			});

			// Filter by permissions for agency users (double-check)
			if (isAgency) {
				return assets
					.filter((asset) => {
						const permission = asset.permissions?.find((p) => p.userId === user.id);
						return permission?.canView;
					})
					.map(transformAsset);
			}

			return assets.map(transformAsset);
		}),

	// Get asset details
	getById: protectedProcedure
		.input(
			z.object({
				id: z.string(),
			}),
		)
		.output(creativeAssetSchema.extend({
			team: z.object({
				id: z.string(),
				name: z.string(),
				slug: z.string(),
				members: z.array(z.object({
					userId: z.string(),
				})).optional(),
			}),
			versions: z.array(creativeAssetVersionSchema).optional(),
			permissions: z.array(creativeAssetPermissionSchema).optional(),
		}))
		.query(async ({ ctx, input }) => {
			const user = await getAuthenticatedUser(ctx);

			const asset = await prisma.creativeAsset.findUnique({
				where: { id: input.id },
				include: {
					team: {
						include: {
							members: true,
						},
					},
					versions: {
						orderBy: { internalVersionNumber: "desc" },
					},
					permissions: true,
				},
			});

			if (!asset) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Asset not found",
				});
			}

			const isAgency = isAgencyUser(user.role);

			// Check access
			if (isAgency) {
				const permission = asset.permissions.find((p) => p.userId === user.id);
				if (!permission?.canView) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "You don't have permission to view this asset",
					});
				}
			} else {
				// Check if customer is team member
				const isMember = asset.team.members.some((m) => m.userId === user.id);
				if (!isMember) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "You don't have access to this asset",
					});
				}

				// Filter to only public versions for customers
				asset.versions = asset.versions.filter((v) => v.isPublic);
			}

			// Transform and return
			const transformed = transformAsset(asset);
			return {
				...transformed,
				team: {
					id: asset.team.id,
					name: asset.team.name,
					slug: asset.team.slug,
					members: asset.team.members,
				},
				versions: asset.versions.map(transformVersion),
				permissions: asset.permissions,
			};
		}),

	// Add comment to version
	addComment: protectedProcedure
		.input(
			z.object({
				versionId: z.string(),
				content: z.string().min(1),
				isInternal: z.boolean(),
				parentCommentId: z.string().optional(),
				mentions: z.array(z.string()).optional(),
			}),
		)
		.output(commentSchema)
		.mutation(async ({ ctx, input }) => {
			const user = await getAuthenticatedUser(ctx);

			const version = await prisma.creativeAssetVersion.findUnique({
				where: { id: input.versionId },
				include: {
					creativeAsset: {
						include: {
							permissions: true,
							team: {
								include: {
									members: true,
								},
							},
						},
					},
				},
			});

			if (!version) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Version not found",
				});
			}

			const isAgency = isAgencyUser(user.role);

			// Check access and permissions
			if (isAgency) {
				const permission = version.creativeAsset.permissions.find(
					(p) => p.userId === user.id,
				);
				if (!permission?.canComment) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "You don't have permission to comment",
					});
				}
			} else {
				// Customers can only comment on public versions
				if (!version.isPublic) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "This version is not public yet",
					});
				}

				// Check if customer is team member
				const isMember = version.creativeAsset.team.members.some(
					(m) => m.userId === user.id,
				);
				if (!isMember) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "You don't have access to this version",
					});
				}

				// Customers can only add public comments
				if (input.isInternal) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "Customers cannot add internal comments",
					});
				}
			}

			// Agency users cannot add public comments to non-public versions
			if (isAgency && !input.isInternal && !version.isPublic) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message:
						"Cannot add public comments to versions that are not public yet",
				});
			}

			// Create comment
			const comment = await prisma.creativeAssetComment.create({
				data: {
					id: crypto.randomUUID(),
					creativeAssetVersionId: input.versionId,
					userId: user.id,
					content: input.content,
					isInternal: input.isInternal,
					parentCommentId: input.parentCommentId,
					mentions: input.mentions || [],
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			});

			// Update parent comment reply count
			if (input.parentCommentId) {
				await prisma.creativeAssetComment.update({
					where: { id: input.parentCommentId },
					data: {
						replyCount: { increment: 1 },
					},
				});
			}

			return transformComment(comment);
		}),

	// Get comments for a version
	getComments: protectedProcedure
		.input(
			z.object({
				versionId: z.string(),
			}),
		)
		.output(z.array(commentSchema.extend({
			replies: z.array(commentSchema).optional(),
		})))
		.query(async ({ ctx, input }) => {
			const user = await getAuthenticatedUser(ctx);

			const version = await prisma.creativeAssetVersion.findUnique({
				where: { id: input.versionId },
				include: {
					creativeAsset: {
						include: {
							permissions: true,
							team: {
								include: {
									members: true,
								},
							},
						},
					},
				},
			});

			if (!version) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Version not found",
				});
			}

			const isAgency = isAgencyUser(user.role);

			// Check access
			if (isAgency) {
				const permission = version.creativeAsset.permissions.find(
					(p) => p.userId === user.id,
				);
				if (!permission?.canView) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "You don't have permission to view this version",
					});
				}
			} else {
				// Customers can only view public versions
				if (!version.isPublic) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "This version is not public yet",
					});
				}

				// Check if customer is team member
				const isMember = version.creativeAsset.team.members.some(
					(m) => m.userId === user.id,
				);
				if (!isMember) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "You don't have access to this version",
					});
				}
			}

			const comments = await prisma.creativeAssetComment.findMany({
				where: {
					creativeAssetVersionId: input.versionId,
					isInternal: isAgency ? undefined : false, // Customers only see public comments
					parentCommentId: null, // Only get top-level comments
				},
				include: {
					replies: {
						orderBy: { createdAt: "asc" },
						where: {
							isInternal: isAgency ? undefined : false, // Customers only see public replies
					},
				},
				},
				orderBy: { createdAt: "asc" }, // Oldest first
			});

			return comments.map(transformComment);
		}),

	// Update a comment
	updateComment: protectedProcedure
		.input(
			z.object({
				commentId: z.string(),
				content: z.string().min(1),
			}),
		)
		.output(commentSchema)
		.mutation(async ({ ctx, input }) => {
			const user = await getAuthenticatedUser(ctx);

			// Check if comment exists and user owns it
			const comment = await prisma.creativeAssetComment.findUnique({
				where: { id: input.commentId },
			});

			if (!comment) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Comment not found",
				});
			}

			// Only the comment owner can update it
			if (comment.userId !== user.id) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You can only edit your own comments",
				});
			}

			// Update comment
			const updatedComment = await prisma.creativeAssetComment.update({
				where: { id: input.commentId },
				data: {
					content: input.content,
					updatedAt: new Date(),
					editedAt: new Date(),
				},
			});

			return transformComment(updatedComment);
		}),

	// Delete a comment
	deleteComment: protectedProcedure
		.input(
			z.object({
				commentId: z.string(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const user = await getAuthenticatedUser(ctx);

			// Check if comment exists
			const comment = await prisma.creativeAssetComment.findUnique({
				where: { id: input.commentId },
				include: {
					parentComment: true,
				},
			});

			if (!comment) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Comment not found",
				});
			}

			// Only the comment owner can delete it (or admins in the future)
			if (comment.userId !== user.id) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You can only delete your own comments",
				});
			}

			// Decrement parent comment reply count if this is a reply
			if (comment.parentCommentId) {
				await prisma.creativeAssetComment.update({
					where: { id: comment.parentCommentId },
					data: {
						replyCount: { decrement: 1 },
					},
				});
			}

			// Delete the comment (cascade will delete replies)
			await prisma.creativeAssetComment.delete({
				where: { id: input.commentId },
			});

			return { success: true };
		}),

	// Grant permissions to agency user
	grantPermissions: protectedProcedure
		.input(
			z.object({
				creativeAssetId: z.string(),
				userId: z.string(),
				permissions: z.object({
					canView: z.boolean().optional(),
					canEdit: z.boolean().optional(),
					canComment: z.boolean().optional(),
					canApprove: z.boolean().optional(),
					canPublish: z.boolean().optional(),
					canDelete: z.boolean().optional(),
				}),
			}),
		)
		.output(creativeAssetPermissionSchema)
		.mutation(async ({ ctx, input }) => {
			const user = await getAuthenticatedUser(ctx);

			// Only agency admins and super admins can grant permissions
			if (user.role !== "AGENCY_ADMIN" && user.role !== "AGENCY_SUPER_ADMIN") {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Only agency admins can grant permissions",
				});
			}

			// Verify the target user is an agency user
			const targetUser = await prisma.user.findUnique({
				where: { id: input.userId },
			});

			if (!targetUser || !isAgencyUser(targetUser.role as string)) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Target user must be an agency user",
				});
			}

			// Verify asset exists
			const asset = await prisma.creativeAsset.findUnique({
				where: { id: input.creativeAssetId },
			});

			if (!asset) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Asset not found",
				});
			}

			// Upsert permissions
			const permission = await prisma.creativeAssetPermission.upsert({
				where: {
					creativeAssetId_userId: {
						creativeAssetId: input.creativeAssetId,
						userId: input.userId,
					},
				},
				create: {
					id: crypto.randomUUID(),
					creativeAssetId: input.creativeAssetId,
					userId: input.userId,
					...input.permissions,
					grantedBy: user.id,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				update: {
					...input.permissions,
					updatedAt: new Date(),
				},
			});

			// Log activity
			await prisma.creativeAssetActivityLog.create({
				data: {
					id: crypto.randomUUID(),
					creativeAssetId: input.creativeAssetId,
					userId: user.id,
					action: "EDIT_PERMISSIONS",
					description: `Updated permissions for user ${input.userId}`,
					metadata: { targetUserId: input.userId, permissions: input.permissions },
					createdAt: new Date(),
				},
			});

			return permission;
		}),

	// Update a creative asset
	update: protectedProcedure
		.input(
			z.object({
				id: z.string(),
				name: z.string().min(1).max(255).optional(),
				description: z.string().optional(),
				category: z.string().optional(),
				status: z.enum(["DRAFT", "IN_REVIEW", "APPROVED", "ARCHIVED"]).optional(),
				teamId: z.string().optional(),
			}),
		)
		.output(creativeAssetSchema)
		.mutation(async ({ ctx, input }) => {
			const user = await getAuthenticatedUser(ctx);

			// Only agency users can update creative assets
			if (!isAgencyUser(user.role)) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Only agency users can update creative assets",
				});
			}

			const asset = await prisma.creativeAsset.findUnique({
				where: { id: input.id },
				include: {
					permissions: true,
					team: true,
				},
			});

			if (!asset) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Creative asset not found",
				});
			}

			// Check permission
			const permission = asset.permissions.find((p) => p.userId === user.id);
			if (!permission?.canEdit) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You don't have permission to update this asset",
				});
			}

			// Verify team exists if teamId is being updated
			if (input.teamId && input.teamId !== asset.teamId) {
				const team = await prisma.team.findUnique({
					where: { id: input.teamId },
				});

				if (!team) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Team not found",
					});
				}
			}

			// Build update data object
			const updateData: {
				name?: string;
				description?: string | null;
				category?: string | null;
				status?: string;
				teamId?: string;
				lastModifiedBy: string;
				updatedAt: Date;
			} = {
				lastModifiedBy: user.id,
				updatedAt: new Date(),
			};

			if (input.name !== undefined) updateData.name = input.name;
			if (input.description !== undefined) updateData.description = input.description || null;
			if (input.category !== undefined) updateData.category = input.category || null;
			if (input.status !== undefined) updateData.status = input.status;
			if (input.teamId !== undefined) updateData.teamId = input.teamId;

			// Update asset
			const updatedAsset = await prisma.creativeAsset.update({
				where: { id: input.id },
				data: updateData,
				include: {
					team: true,
				},
			});

			// Log activity
			await prisma.creativeAssetActivityLog.create({
				data: {
					id: crypto.randomUUID(),
					creativeAssetId: asset.id,
					userId: user.id,
					action: "UPDATE",
					description: `Updated creative asset: ${updatedAsset.name}`,
					metadata: {
						previousValues: {
							name: asset.name,
							description: asset.description,
							category: asset.category,
							status: asset.status,
							teamId: asset.teamId,
						},
						newValues: updateData,
					},
					createdAt: new Date(),
				},
			});

			return transformAsset(updatedAsset);
		}),

	// Archive a creative asset
	archive: protectedProcedure
		.input(
			z.object({
				id: z.string(),
			}),
		)
		.output(creativeAssetSchema)
		.mutation(async ({ ctx, input }) => {
			const user = await getAuthenticatedUser(ctx);

			// Only agency users can archive creative assets
			if (!isAgencyUser(user.role)) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Only agency users can archive creative assets",
				});
			}

			const asset = await prisma.creativeAsset.findUnique({
				where: { id: input.id },
				include: {
					permissions: true,
					team: true,
				},
			});

			if (!asset) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Creative asset not found",
				});
			}

			// Check permission
			const permission = asset.permissions.find((p) => p.userId === user.id);
			if (!permission?.canEdit && !permission?.canDelete) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You don't have permission to archive this asset",
				});
			}

			// Update asset status to ARCHIVED
			const updatedAsset = await prisma.creativeAsset.update({
				where: { id: input.id },
				data: {
					status: "ARCHIVED",
					lastModifiedBy: user.id,
					updatedAt: new Date(),
				},
				include: {
					team: true,
				},
			});

			// Log activity
			await prisma.creativeAssetActivityLog.create({
				data: {
					id: crypto.randomUUID(),
					creativeAssetId: asset.id,
					userId: user.id,
					action: "ARCHIVE",
					description: `Archived creative asset: ${asset.name}`,
					metadata: { previousStatus: asset.status },
					createdAt: new Date(),
				},
			});

			return transformAsset(updatedAsset);
		}),

	// Unarchive a creative asset (change status from ARCHIVED to DRAFT)
	unarchive: protectedProcedure
		.input(
			z.object({
				id: z.string(),
			}),
		)
		.output(creativeAssetSchema)
		.mutation(async ({ ctx, input }) => {
			const user = await getAuthenticatedUser(ctx);

			// Only agency users can unarchive creative assets
			if (!isAgencyUser(user.role)) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Only agency users can unarchive creative assets",
				});
			}

			const asset = await prisma.creativeAsset.findUnique({
				where: { id: input.id },
				include: {
					permissions: true,
					team: true,
				},
			});

			if (!asset) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Creative asset not found",
				});
			}

			// Check if asset is archived
			if (asset.status !== "ARCHIVED") {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Asset is not archived",
				});
			}

			// Check permission
			const permission = asset.permissions.find((p) => p.userId === user.id);
			if (!permission?.canEdit && !permission?.canDelete) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You don't have permission to unarchive this asset",
				});
			}

			// Update asset status to DRAFT
			const updatedAsset = await prisma.creativeAsset.update({
				where: { id: input.id },
				data: {
					status: "DRAFT",
					lastModifiedBy: user.id,
					updatedAt: new Date(),
				},
				include: {
					team: true,
				},
			});

			// Log activity
			await prisma.creativeAssetActivityLog.create({
				data: {
					id: crypto.randomUUID(),
					creativeAssetId: asset.id,
					userId: user.id,
					action: "UNARCHIVE",
					description: `Unarchived creative asset: ${asset.name}`,
					metadata: { previousStatus: asset.status },
					createdAt: new Date(),
				},
			});

			return transformAsset(updatedAsset);
		}),
});

