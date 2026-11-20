import { randomUUID } from "node:crypto";

import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { and, desc, eq, ilike, lt, ne, or } from "@npanel/db";
import { db } from "@npanel/db";
import { niscStorageFolderGrant, niscStorageResource } from "@npanel/db/schema/nisc-storage";
import { niscProductPlan } from "@npanel/db/schema/products";
import { team, teamMember } from "@npanel/db/schema/teams";

import { NISC_STORAGE_PRODUCT_ID } from "../../lib/nisc-storage-plans";
import {
	loadStorageAccess,
	memberCanSeeStorage,
	presentResource,
	writeStorageAudit,
	type StorageAccess,
	type StorageActor,
} from "../../lib/nisc-storage/access";
import { sanitizeStorageError, StorageOperationError } from "../../lib/nisc-storage/errors";
import { capabilitiesAt, grantCoversPrefix } from "../../lib/nisc-storage/grants";
import { normalizeStoragePrefix, parseByteCount } from "../../lib/nisc-storage/keys";
import {
	beginStorageDeletion,
	cancelStorageDeletion,
	changeStoragePlan,
	continueStorageDeletion,
	createInternalStorage,
	deleteStorageImmediately,
	provisionTeamStorage,
	readStorageCapacity,
	resumeStorage,
	revealStorageCredentials,
	rotateStorageCredentials,
	suspendStorage,
	syncStorageUsage,
	updateInternalStorage,
} from "../../lib/nisc-storage/lifecycle";
import {
	cancelStorageUpload,
	completeStorageUpload,
	createStorageDownload,
	createStorageFolder,
	createStorageUpload,
	deleteStorageFile,
	deleteStoragePrefix,
	downloadStorageZip,
	extractStorageZip,
	listStorageFolder,
	moveStorageFile,
} from "../../lib/nisc-storage/objects";
import { getStorageEncryption, getStorageQuota, headStorageBucket } from "../../lib/nisc-storage/seaweed";
import { assertTeamPermission, isAgencyUserRole } from "../../lib/team-permissions/assert";
import { protectedProcedure, router } from "../../trpc";

const resourceIdSchema = z.string().uuid();
const prefixSchema = z.string().max(1024);
const fileNameSchema = z.string().trim().min(1).max(200);

function actorFrom(ctx: { session: { user: { id: string; role?: string | null } } }): StorageActor {
	return { userId: ctx.session.user.id, role: ctx.session.user.role };
}

function fail(error: unknown): never {
	if (error instanceof TRPCError) throw error;
	if (error instanceof StorageOperationError) {
		const code =
			error.code === "NOT_CONFIGURED"
				? "PRECONDITION_FAILED"
				: error.code === "DENIED"
					? "FORBIDDEN"
					: error.code === "NOT_FOUND"
						? "NOT_FOUND"
						: error.code === "CONFLICT"
							? "CONFLICT"
							: error.code === "LIMIT"
								? "BAD_REQUEST"
								: "BAD_REQUEST";
		throw new TRPCError({ code, message: error.message });
	}
	console.error("[nisc-storage]", sanitizeStorageError(error));
	throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Object storage request failed." });
}

function assertAgency(role: string | null | undefined) {
	if (!isAgencyUserRole(role)) {
		throw new TRPCError({ code: "FORBIDDEN", message: "Only Nisc staff can do this." });
	}
}

async function openResource(
	ctx: { session: { user: { id: string; role?: string | null } } },
	resourceId: string,
): Promise<{ actor: StorageActor; access: StorageAccess }> {
	const actor = actorFrom(ctx);
	try {
		const access = await loadStorageAccess(actor, resourceId);
		if (!(await memberCanSeeStorage(access, actor))) {
			throw new StorageOperationError("Storage was not found.", "NOT_FOUND");
		}
		return { actor, access };
	} catch (error) {
		fail(error);
	}
}

function containsPattern(value: string): string | null {
	const cleaned = value.trim().slice(0, 80).replace(/[%_\\]/g, "");
	return cleaned ? `%${cleaned}%` : null;
}

function encodeCursor(row: { createdAt: Date; id: string }): string {
	return Buffer.from(`${row.createdAt.toISOString()}|${row.id}`).toString("base64url");
}

function decodeCursor(value: string): { createdAt: Date; id: string } | null {
	try {
		const [iso, id] = Buffer.from(value, "base64url").toString("utf8").split("|");
		const createdAt = new Date(iso ?? "");
		if (!iso || !id || Number.isNaN(createdAt.getTime()) || !z.string().uuid().safeParse(id).success) {
			return null;
		}
		return { createdAt, id };
	} catch {
		return null;
	}
}

async function assertGrantManager(
	access: StorageAccess,
	actor: StorageActor,
	prefix: string,
	requested?: { canList: boolean; canGet: boolean; canPut: boolean; canDelete: boolean },
) {
	if (access.scope === "agency" || access.scope === "owner") return;
	await assertTeamPermission({
		teamId: access.resource.teamId,
		userId: actor.userId,
		userRole: actor.role,
		key: "storage.sharing",
		access: "write",
	});
	if (!grantCoversPrefix(access.grants, prefix)) {
		throw new StorageOperationError("You do not have access to this folder.", "DENIED");
	}
	if (!requested) return;
	const held = capabilitiesAt(access.grants, prefix);
	if (
		(requested.canList && !held.canList) ||
		(requested.canGet && !held.canGet) ||
		(requested.canPut && !held.canPut) ||
		(requested.canDelete && !held.canDelete)
	) {
		throw new StorageOperationError("You can only grant access you already have.", "DENIED");
	}
}

const planLimitsSchema = z.object({
	quotaBytes: z.string().regex(/^\d+$/),
	maxObjectBytes: z.string().regex(/^\d+$/),
});

export const niscStorageRouter = router({
	plans: protectedProcedure.query(async () => {
		const rows = await db
			.select()
			.from(niscProductPlan)
			.where(
				and(
					eq(niscProductPlan.productId, NISC_STORAGE_PRODUCT_ID),
					eq(niscProductPlan.isActive, true),
					eq(niscProductPlan.hidden, false),
				),
			)
			.orderBy(niscProductPlan.sortOrder);
		return rows.flatMap((plan) => {
			const limits = planLimitsSchema.safeParse(plan.metadata);
			if (!limits.success) return [];
			return [
				{
					id: plan.id,
					name: plan.name,
					description: plan.description,
					price: plan.price,
					currency: plan.currency,
					billingCycle: plan.billingCycle,
					quotaBytes: limits.data.quotaBytes,
					maxObjectBytes: limits.data.maxObjectBytes,
					highlights: plan.highlights,
					isPopular: plan.isPopular,
					isRecommended: plan.isRecommended,
				},
			];
		});
	}),

	capacity: protectedProcedure
		.input(
			z.object({
				quotaBytes: z.string().regex(/^\d{1,18}$/).optional(),
				productPlanId: z.string().min(1).max(80).optional(),
				resourceId: resourceIdSchema.optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			assertAgency(ctx.session.user.role);
			try {
				return await readStorageCapacity({
					quotaBytes: input.productPlanId ? undefined : input.quotaBytes,
					productPlanId: input.productPlanId,
					ignoreResourceId: input.resourceId,
				});
			} catch (error) {
				fail(error);
			}
		}),

	list: protectedProcedure
		.input(
			z.object({
				teamId: z.string().min(1).max(80).optional(),
				kind: z.enum(["CUSTOMER", "INTERNAL"]).optional(),
				search: z.string().trim().max(80).optional(),
				liveOnly: z.boolean().optional(),
				cursor: z.string().max(200).optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const actor = actorFrom(ctx);
			const agency = isAgencyUserRole(actor.role);
			if (!agency && !input.teamId) return { items: [], nextCursor: null };
			if (!agency && input.teamId) {
				const [membership] = await db
					.select({ id: teamMember.id, role: teamMember.role })
					.from(teamMember)
					.where(and(eq(teamMember.teamId, input.teamId), eq(teamMember.userId, actor.userId)))
					.limit(1);
				if (!membership) return { items: [], nextCursor: null };
				const [row] = await db
					.select()
					.from(niscStorageResource)
					.where(
						and(eq(niscStorageResource.teamId, input.teamId), ne(niscStorageResource.status, "DELETED")),
					)
					.limit(1);
				if (!row) return { items: [], nextCursor: null };
				let access: StorageAccess;
				try {
					access = await loadStorageAccess(actor, row.id);
				} catch (error) {
					fail(error);
				}
				if (!(await memberCanSeeStorage(access, actor))) return { items: [], nextCursor: null };
				const [plan] = row.productPlanId
					? await db
							.select({ name: niscProductPlan.name })
							.from(niscProductPlan)
							.where(eq(niscProductPlan.id, row.productPlanId))
							.limit(1)
					: [];
				return {
					items: [
						{
							...presentResource(row, {
								includeBucket: access.scope !== "member",
								includeAccessKeyId: access.scope !== "member",
							}),
							planName: plan?.name ?? null,
						},
					],
					nextCursor: null,
				};
			}

			const cursor = input.cursor ? decodeCursor(input.cursor) : null;
			if (input.cursor && !cursor) {
				throw new TRPCError({ code: "BAD_REQUEST", message: "That page cursor is not valid." });
			}
			const pattern = input.search ? containsPattern(input.search) : null;
			const filters = [
				input.liveOnly ? ne(niscStorageResource.status, "DELETED") : undefined,
				input.teamId ? eq(niscStorageResource.teamId, input.teamId) : undefined,
				input.kind ? eq(niscStorageResource.kind, input.kind) : undefined,
				pattern
					? or(
							ilike(niscStorageResource.bucketName, pattern),
							ilike(niscStorageResource.label, pattern),
							ilike(team.name, pattern),
							ilike(niscProductPlan.name, pattern),
						)
					: undefined,
				cursor
					? or(
							lt(niscStorageResource.createdAt, cursor.createdAt),
							and(eq(niscStorageResource.createdAt, cursor.createdAt), lt(niscStorageResource.id, cursor.id)),
						)
					: undefined,
			].filter((filter) => filter !== undefined);
			const rows = await db
				.select({
					resource: niscStorageResource,
					teamName: team.name,
					teamSlug: team.slug,
					planName: niscProductPlan.name,
				})
				.from(niscStorageResource)
				.leftJoin(team, eq(team.id, niscStorageResource.teamId))
				.leftJoin(niscProductPlan, eq(niscProductPlan.id, niscStorageResource.productPlanId))
				.where(filters.length > 0 ? and(...filters) : undefined)
				.orderBy(desc(niscStorageResource.createdAt), desc(niscStorageResource.id))
				.limit(21);
			const page = rows.slice(0, 20);
			return {
				items: page.map((row) => ({
					...presentResource(row.resource, { includeBucket: true, includeAccessKeyId: true }),
					teamName: row.teamName,
					teamSlug: row.teamSlug,
					planName: row.resource.kind === "INTERNAL" ? null : row.planName,
				})),
				nextCursor: rows.length > 20 ? encodeCursor(page[page.length - 1]!.resource) : null,
			};
		}),

	get: protectedProcedure
		.input(z.object({ resourceId: resourceIdSchema }))
		.query(async ({ ctx, input }) => {
			const { access } = await openResource(ctx, input.resourceId);
			const presented = presentResource(access.resource, {
				includeBucket: access.scope !== "member",
				includeAccessKeyId: access.scope !== "member",
			});
			if (!access.resource.productPlanId) return { ...presented, planName: null, teamName: null, teamSlug: null };
			const [plan] = await db
				.select({ name: niscProductPlan.name })
				.from(niscProductPlan)
				.where(eq(niscProductPlan.id, access.resource.productPlanId))
				.limit(1);
			const [owner] = access.resource.teamId
				? await db
						.select({ name: team.name, slug: team.slug })
						.from(team)
						.where(eq(team.id, access.resource.teamId))
						.limit(1)
				: [];
			return {
				...presented,
				planName: plan?.name ?? null,
				teamName: owner?.name ?? null,
				teamSlug: owner?.slug ?? null,
			};
		}),

	createInternal: protectedProcedure
		.input(
			z.object({
				bucketName: z.string().trim().min(3).max(63),
				label: z.string().trim().min(1).max(80).optional(),
				quotaBytes: z.string().regex(/^\d{1,18}$/),
				maxObjectBytes: z.string().regex(/^\d{1,18}$/).optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			assertAgency(ctx.session.user.role);
			try {
				const created = await createInternalStorage(actorFrom(ctx), input);
				return {
					...presentResource(created.resource, { includeBucket: true, includeAccessKeyId: true }),
					planName: null,
					credentials: created.credentials,
				};
			} catch (error) {
				fail(error);
			}
		}),

	updateInternal: protectedProcedure
		.input(
			z.object({
				resourceId: resourceIdSchema,
				label: z.string().trim().min(1).max(80).optional(),
				quotaBytes: z.string().regex(/^\d{1,18}$/).optional(),
				maxObjectBytes: z.string().regex(/^\d{1,18}$/).optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			assertAgency(ctx.session.user.role);
			const { actor, access } = await openResource(ctx, input.resourceId);
			try {
				await updateInternalStorage(actor, access.resource, input);
				return { ok: true as const };
			} catch (error) {
				fail(error);
			}
		}),

	provision: protectedProcedure
		.input(z.object({ teamId: z.string().min(1).max(80), productPlanId: z.string().min(1).max(80) }))
		.mutation(async ({ ctx, input }) => {
			assertAgency(ctx.session.user.role);
			try {
				const created = await provisionTeamStorage(actorFrom(ctx), input.teamId, input.productPlanId);
				return {
					...presentResource(created.resource, { includeBucket: true, includeAccessKeyId: true }),
					credentials: created.credentials,
				};
			} catch (error) {
				fail(error);
			}
		}),

	changePlan: protectedProcedure
		.input(z.object({ resourceId: resourceIdSchema, productPlanId: z.string().min(1).max(80) }))
		.mutation(async ({ ctx, input }) => {
			assertAgency(ctx.session.user.role);
			const { actor, access } = await openResource(ctx, input.resourceId);
			try {
				await changeStoragePlan(actor, access.resource, input.productPlanId);
				return { ok: true as const };
			} catch (error) {
				fail(error);
			}
		}),

	suspend: protectedProcedure
		.input(z.object({ resourceId: resourceIdSchema }))
		.mutation(async ({ ctx, input }) => {
			assertAgency(ctx.session.user.role);
			const { actor, access } = await openResource(ctx, input.resourceId);
			try {
				await suspendStorage(actor, access.resource);
				return { ok: true as const };
			} catch (error) {
				fail(error);
			}
		}),

	resume: protectedProcedure
		.input(z.object({ resourceId: resourceIdSchema }))
		.mutation(async ({ ctx, input }) => {
			assertAgency(ctx.session.user.role);
			const { actor, access } = await openResource(ctx, input.resourceId);
			try {
				const credentials = await resumeStorage(actor, access.resource);
				return { ok: true as const, credentials };
			} catch (error) {
				fail(error);
			}
		}),

	revealCredentials: protectedProcedure
		.input(z.object({ resourceId: resourceIdSchema }))
		.mutation(async ({ ctx, input }) => {
			const { actor, access } = await openResource(ctx, input.resourceId);
			if (access.scope === "member") {
				throw new TRPCError({ code: "FORBIDDEN", message: "Only the team owner can view storage credentials." });
			}
			try {
				return revealStorageCredentials(actor, access.resource);
			} catch (error) {
				fail(error);
			}
		}),

	rotateCredentials: protectedProcedure
		.input(z.object({ resourceId: resourceIdSchema }))
		.mutation(async ({ ctx, input }) => {
			const { actor, access } = await openResource(ctx, input.resourceId);
			if (access.scope === "member") {
				throw new TRPCError({ code: "FORBIDDEN", message: "Only the team owner can rotate storage credentials." });
			}
			try {
				return rotateStorageCredentials(actor, access.resource);
			} catch (error) {
				fail(error);
			}
		}),

	beginDeletion: protectedProcedure
		.input(z.object({ resourceId: resourceIdSchema }))
		.mutation(async ({ ctx, input }) => {
			assertAgency(ctx.session.user.role);
			const { actor, access } = await openResource(ctx, input.resourceId);
			try {
				await beginStorageDeletion(actor, access.resource);
				return { ok: true as const };
			} catch (error) {
				fail(error);
			}
		}),

	cancelDeletion: protectedProcedure
		.input(z.object({ resourceId: resourceIdSchema }))
		.mutation(async ({ ctx, input }) => {
			assertAgency(ctx.session.user.role);
			const { actor, access } = await openResource(ctx, input.resourceId);
			try {
				await cancelStorageDeletion(actor, access.resource);
				return { ok: true as const };
			} catch (error) {
				fail(error);
			}
		}),

	deleteNow: protectedProcedure
		.input(z.object({ resourceId: resourceIdSchema }))
		.mutation(async ({ ctx, input }) => {
			if (ctx.session.user.role !== "AGENCY_SUPER_ADMIN") {
				throw new TRPCError({ code: "FORBIDDEN", message: "Only a super admin can delete a bucket immediately." });
			}
			const { actor, access } = await openResource(ctx, input.resourceId);
			try {
				return await deleteStorageImmediately(actor, access.resource);
			} catch (error) {
				fail(error);
			}
		}),

	continueDeletion: protectedProcedure
		.input(z.object({ resourceId: resourceIdSchema }))
		.mutation(async ({ ctx, input }) => {
			assertAgency(ctx.session.user.role);
			const { actor, access } = await openResource(ctx, input.resourceId);
			try {
				return await continueStorageDeletion(actor, access.resource);
			} catch (error) {
				fail(error);
			}
		}),

	syncUsage: protectedProcedure
		.input(z.object({ resourceId: resourceIdSchema }))
		.mutation(async ({ ctx, input }) => {
			const { access } = await openResource(ctx, input.resourceId);
			if (access.scope === "member") {
				throw new TRPCError({ code: "FORBIDDEN", message: "Only the team owner can sync storage usage." });
			}
			if (access.resource.status !== "ACTIVE" && access.resource.status !== "SUSPENDED") {
				throw new TRPCError({ code: "BAD_REQUEST", message: "This storage plan is not active." });
			}
			try {
				return await syncStorageUsage(access.resource);
			} catch (error) {
				fail(error);
			}
		}),

	health: protectedProcedure
		.input(z.object({ resourceId: resourceIdSchema }))
		.query(async ({ ctx, input }) => {
			const { access } = await openResource(ctx, input.resourceId);
			if (access.scope === "member") {
				throw new TRPCError({ code: "FORBIDDEN", message: "Only the team owner can check storage health." });
			}
			try {
				const bucket = access.resource.bucketName;
				const [exists, encryption, quota] = await Promise.all([
					headStorageBucket(bucket),
					getStorageEncryption(bucket),
					getStorageQuota(bucket),
				]);
				const expected = parseByteCount(access.resource.quotaBytes);
				const ok = exists && encryption === "AES256" && quota?.enabled === true && quota.bytes === expected;
				await db
					.update(niscStorageResource)
					.set({
						lastHealthCheckAt: new Date(),
						encryptionStatus: encryption === "AES256" ? "AES256" : "FAILED",
						updatedAt: new Date(),
					})
					.where(eq(niscStorageResource.id, access.resource.id));
				return { ok, encryption, quotaBytes: quota?.bytes.toString() ?? null };
			} catch (error) {
				fail(error);
			}
		}),

	listGrants: protectedProcedure
		.input(z.object({ resourceId: resourceIdSchema }))
		.query(async ({ ctx, input }) => {
			const { access } = await openResource(ctx, input.resourceId);
			const rows = await db
				.select({
					id: niscStorageFolderGrant.id,
					teamMemberId: niscStorageFolderGrant.teamMemberId,
					prefix: niscStorageFolderGrant.prefix,
					canList: niscStorageFolderGrant.canList,
					canGet: niscStorageFolderGrant.canGet,
					canPut: niscStorageFolderGrant.canPut,
					canDelete: niscStorageFolderGrant.canDelete,
					memberRole: teamMember.role,
					userId: teamMember.userId,
				})
				.from(niscStorageFolderGrant)
				.innerJoin(teamMember, eq(teamMember.id, niscStorageFolderGrant.teamMemberId))
				.where(
					access.scope === "member"
						? and(
								eq(niscStorageFolderGrant.resourceId, access.resource.id),
								eq(niscStorageFolderGrant.teamMemberId, access.memberId ?? ""),
							)
						: eq(niscStorageFolderGrant.resourceId, access.resource.id),
				);
			if (access.scope !== "member") return { scope: "full" as const, grants: rows };
			try {
				await assertTeamPermission({
					teamId: access.resource.teamId,
					userId: ctx.session.user.id,
					userRole: ctx.session.user.role,
					key: "storage.sharing",
					access: "read",
				});
			} catch {
				return {
					scope: "own" as const,
					grants: rows.filter((row) => row.teamMemberId === access.memberId),
				};
			}
			const all = await db
				.select({
					id: niscStorageFolderGrant.id,
					teamMemberId: niscStorageFolderGrant.teamMemberId,
					prefix: niscStorageFolderGrant.prefix,
					canList: niscStorageFolderGrant.canList,
					canGet: niscStorageFolderGrant.canGet,
					canPut: niscStorageFolderGrant.canPut,
					canDelete: niscStorageFolderGrant.canDelete,
					memberRole: teamMember.role,
					userId: teamMember.userId,
				})
				.from(niscStorageFolderGrant)
				.innerJoin(teamMember, eq(teamMember.id, niscStorageFolderGrant.teamMemberId))
				.where(eq(niscStorageFolderGrant.resourceId, access.resource.id));
			return { scope: "full" as const, grants: all };
		}),

	setFolderGrant: protectedProcedure
		.input(
			z.object({
				resourceId: resourceIdSchema,
				teamMemberId: z.string().min(1).max(80),
				prefix: prefixSchema,
				canList: z.boolean(),
				canGet: z.boolean(),
				canPut: z.boolean(),
				canDelete: z.boolean(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { actor, access } = await openResource(ctx, input.resourceId);
			const prefix = normalizeStoragePrefix(input.prefix);
			if (prefix === null) throw new TRPCError({ code: "BAD_REQUEST", message: "That folder name is not allowed." });
			try {
				await assertGrantManager(access, actor, prefix, input);
			} catch (error) {
				fail(error);
			}
			if (access.scope === "member" && input.teamMemberId === access.memberId) {
				throw new TRPCError({ code: "FORBIDDEN", message: "You cannot change your own folder access." });
			}
			const [target] = await db
				.select({ id: teamMember.id, role: teamMember.role, teamId: teamMember.teamId })
				.from(teamMember)
				.where(eq(teamMember.id, input.teamMemberId))
				.limit(1);
			if (!target || target.teamId !== access.resource.teamId) {
				throw new TRPCError({ code: "NOT_FOUND", message: "That team member was not found." });
			}
			if (target.role === "OWNER") {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "The team owner already has access to the whole bucket.",
				});
			}
			if (!input.canList && !input.canGet && !input.canPut && !input.canDelete) {
				await db
					.delete(niscStorageFolderGrant)
					.where(
						and(
							eq(niscStorageFolderGrant.resourceId, access.resource.id),
							eq(niscStorageFolderGrant.teamMemberId, target.id),
							eq(niscStorageFolderGrant.prefix, prefix),
						),
					);
				return { ok: true as const, removed: true as const };
			}
			const [existing] = await db
				.select({ id: niscStorageFolderGrant.id })
				.from(niscStorageFolderGrant)
				.where(
					and(
						eq(niscStorageFolderGrant.resourceId, access.resource.id),
						eq(niscStorageFolderGrant.teamMemberId, target.id),
						eq(niscStorageFolderGrant.prefix, prefix),
					),
				)
				.limit(1);
			if (!existing) {
				const current = await db
					.select({ id: niscStorageFolderGrant.id })
					.from(niscStorageFolderGrant)
					.where(eq(niscStorageFolderGrant.resourceId, access.resource.id));
				if (current.length >= 200) {
					throw new TRPCError({ code: "BAD_REQUEST", message: "This bucket has too many folder rules." });
				}
				await db.insert(niscStorageFolderGrant).values({
					id: randomUUID(),
					resourceId: access.resource.id,
					teamMemberId: target.id,
					prefix,
					canList: input.canList,
					canGet: input.canGet,
					canPut: input.canPut,
					canDelete: input.canDelete,
					createdById: actor.userId,
				});
			} else {
				await db
					.update(niscStorageFolderGrant)
					.set({
						canList: input.canList,
						canGet: input.canGet,
						canPut: input.canPut,
						canDelete: input.canDelete,
						updatedAt: new Date(),
					})
					.where(eq(niscStorageFolderGrant.id, existing.id));
			}
			await writeStorageAudit({
				resourceId: access.resource.id,
				teamId: access.resource.teamId,
				actorUserId: actor.userId,
				action: "set-folder-grant",
				objectKey: prefix,
				outcome: "ALLOW",
			});
			return { ok: true as const, removed: false as const };
		}),

	removeFolderGrant: protectedProcedure
		.input(z.object({ resourceId: resourceIdSchema, grantId: z.string().uuid() }))
		.mutation(async ({ ctx, input }) => {
			const { actor, access } = await openResource(ctx, input.resourceId);
			const [grant] = await db
				.select()
				.from(niscStorageFolderGrant)
				.where(
					and(
						eq(niscStorageFolderGrant.id, input.grantId),
						eq(niscStorageFolderGrant.resourceId, access.resource.id),
					),
				)
				.limit(1);
			if (!grant) throw new TRPCError({ code: "NOT_FOUND", message: "That folder rule was not found." });
			try {
				await assertGrantManager(access, actor, grant.prefix);
			} catch (error) {
				fail(error);
			}
			if (access.scope === "member" && grant.teamMemberId === access.memberId) {
				throw new TRPCError({ code: "FORBIDDEN", message: "You cannot change your own folder access." });
			}
			await db.delete(niscStorageFolderGrant).where(eq(niscStorageFolderGrant.id, grant.id));
			await writeStorageAudit({
				resourceId: access.resource.id,
				teamId: access.resource.teamId,
				actorUserId: actor.userId,
				action: "remove-folder-grant",
				objectKey: grant.prefix,
				outcome: "ALLOW",
			});
			return { ok: true as const };
		}),

	listObjects: protectedProcedure
		.input(
			z.object({
				resourceId: resourceIdSchema,
				prefix: prefixSchema.default(""),
				maxKeys: z.number().int().min(1).max(100).default(50),
				cursor: z.string().max(2048).optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const { actor, access } = await openResource(ctx, input.resourceId);
			try {
				return await listStorageFolder(access, actor, input.prefix, input.maxKeys, input.cursor);
			} catch (error) {
				fail(error);
			}
		}),

	createFolder: protectedProcedure
		.input(z.object({ resourceId: resourceIdSchema, prefix: prefixSchema }))
		.mutation(async ({ ctx, input }) => {
			const { actor, access } = await openResource(ctx, input.resourceId);
			try {
				return await createStorageFolder(access, actor, input.prefix);
			} catch (error) {
				fail(error);
			}
		}),

	createUploadUrl: protectedProcedure
		.input(
			z.object({
				resourceId: resourceIdSchema,
				prefix: prefixSchema.default(""),
				fileName: fileNameSchema,
				contentType: z.string().trim().min(1).max(200),
				fileSize: z.number().int().positive(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { actor, access } = await openResource(ctx, input.resourceId);
			try {
				return await createStorageUpload(
					access,
					actor,
					input.prefix,
					input.fileName,
					input.contentType,
					input.fileSize,
				);
			} catch (error) {
				fail(error);
			}
		}),

	cancelUpload: protectedProcedure
		.input(z.object({ resourceId: resourceIdSchema, key: z.string().min(1).max(1024) }))
		.mutation(async ({ ctx, input }) => {
			const { actor, access } = await openResource(ctx, input.resourceId);
			try {
				return await cancelStorageUpload(access, actor, input.key);
			} catch (error) {
				fail(error);
			}
		}),

	completeUpload: protectedProcedure
		.input(z.object({ resourceId: resourceIdSchema, key: z.string().min(1).max(1024) }))
		.mutation(async ({ ctx, input }) => {
			const { actor, access } = await openResource(ctx, input.resourceId);
			try {
				return await completeStorageUpload(access, actor, input.key);
			} catch (error) {
				fail(error);
			}
		}),

	createDownloadUrl: protectedProcedure
		.input(z.object({ resourceId: resourceIdSchema, key: z.string().min(1).max(1024) }))
		.mutation(async ({ ctx, input }) => {
			const { actor, access } = await openResource(ctx, input.resourceId);
			try {
				return await createStorageDownload(access, actor, input.key);
			} catch (error) {
				fail(error);
			}
		}),

	deleteObject: protectedProcedure
		.input(z.object({ resourceId: resourceIdSchema, key: z.string().min(1).max(1024) }))
		.mutation(async ({ ctx, input }) => {
			const { actor, access } = await openResource(ctx, input.resourceId);
			try {
				return await deleteStorageFile(access, actor, input.key);
			} catch (error) {
				fail(error);
			}
		}),

	deletePrefix: protectedProcedure
		.input(z.object({ resourceId: resourceIdSchema, prefix: prefixSchema }))
		.mutation(async ({ ctx, input }) => {
			const { actor, access } = await openResource(ctx, input.resourceId);
			try {
				return await deleteStoragePrefix(access, actor, input.prefix);
			} catch (error) {
				fail(error);
			}
		}),

	moveObject: protectedProcedure
		.input(
			z.object({
				resourceId: resourceIdSchema,
				sourceKey: z.string().min(1).max(1024),
				destinationPrefix: prefixSchema.default(""),
				destinationName: fileNameSchema,
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { actor, access } = await openResource(ctx, input.resourceId);
			try {
				return await moveStorageFile(
					access,
					actor,
					input.sourceKey,
					input.destinationPrefix,
					input.destinationName,
				);
			} catch (error) {
				fail(error);
			}
		}),

	extractZip: protectedProcedure
		.input(
			z.object({
				resourceId: resourceIdSchema,
				key: z.string().min(1).max(1024),
				destinationPrefix: prefixSchema.default(""),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { actor, access } = await openResource(ctx, input.resourceId);
			try {
				return await extractStorageZip(access, actor, input.key, input.destinationPrefix);
			} catch (error) {
				fail(error);
			}
		}),

	downloadZip: protectedProcedure
		.input(
			z.object({
				resourceId: resourceIdSchema,
				keys: z.array(z.string().min(1).max(1024)).min(1).max(100),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { actor, access } = await openResource(ctx, input.resourceId);
			try {
				return await downloadStorageZip(access, actor, input.keys);
			} catch (error) {
				fail(error);
			}
		}),
});
