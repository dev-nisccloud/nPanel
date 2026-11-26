import { randomUUID } from "node:crypto";

import { and, eq, ne, notInArray, sql } from "@npanel/db";
import { db } from "@npanel/db";
import { niscStorageResource } from "@npanel/db/schema/nisc-storage";
import { niscClientSubscription, niscProductPlan } from "@npanel/db/schema/products";
import { team } from "@npanel/db/schema/teams";
import { z } from "zod";

import { NISC_STORAGE_PRODUCT_ID } from "../nisc-storage-plans";
import { writeStorageAudit, type StorageActor, type StorageResource } from "./access";
import { readNiscStorageConfig } from "./config";
import { decryptStorageSecret, encryptStorageSecret } from "./crypto";
import { sanitizeStorageError, StorageOperationError } from "./errors";
import { bucketNameFromSlug, generatedBucketName, parseBucketName, parseByteCount } from "./keys";
import {
	commercialCapacityBytes,
	createStorageBucket,
	deleteIdentity,
	deleteStorageBucket,
	disableIdentity,
	ensureIamUser,
	getStorageEncryption,
	getStorageQuota,
	headStorageBucket,
	listRawKeys,
	putIdentityPolicy,
	ensureBucketBrowserCors,
	putStorageEncryption,
	putStorageQuota,
	removeStoredObjects,
	replaceAccessKey,
	storageClusterId,
} from "./seaweed";

const planLimitsSchema = z.object({
	quotaBytes: z.string().regex(/^\d{1,18}$/),
	maxObjectBytes: z.string().regex(/^\d{1,18}$/),
});

type PlanRow = typeof niscProductPlan.$inferSelect;

const MAX_SINGLE_OBJECT_BYTES = 5_368_709_120n;

async function touchSubscription(
	subscriptionId: string | null,
	values: Partial<typeof niscClientSubscription.$inferInsert>,
) {
	if (!subscriptionId) return;
	await db
		.update(niscClientSubscription)
		.set({ ...values, updatedAt: new Date() })
		.where(eq(niscClientSubscription.id, subscriptionId));
}

function isUniqueViolation(error: unknown): boolean {
	const seen = new Set<unknown>();
	let current: unknown = error;
	while (current && typeof current === "object" && !seen.has(current)) {
		seen.add(current);
		if ("code" in current && (current as { code: unknown }).code === "23505") return true;
		current = "cause" in current ? (current as { cause: unknown }).cause : null;
	}
	return false;
}

async function loadPlan(productPlanId: string): Promise<{ plan: PlanRow; quotaBytes: bigint; maxObjectBytes: bigint }> {
	const [plan] = await db
		.select()
		.from(niscProductPlan)
		.where(
			and(
				eq(niscProductPlan.id, productPlanId),
				eq(niscProductPlan.productId, NISC_STORAGE_PRODUCT_ID),
				eq(niscProductPlan.isActive, true),
				eq(niscProductPlan.hidden, false),
			),
		)
		.limit(1);
	if (!plan) throw new StorageOperationError("That storage plan is not available.", "NOT_FOUND");
	const parsed = planLimitsSchema.safeParse(plan.metadata);
	if (!parsed.success) {
		throw new StorageOperationError("That storage plan is not available.", "FAILED");
	}
	const quotaBytes = parseByteCount(parsed.data.quotaBytes);
	const maxObjectBytes = parseByteCount(parsed.data.maxObjectBytes);
	if (!quotaBytes || !maxObjectBytes || maxObjectBytes > quotaBytes) {
		throw new StorageOperationError("That storage plan is not available.", "FAILED");
	}
	return { plan, quotaBytes, maxObjectBytes };
}

async function reservedBytes(
	tx: Pick<typeof db, "select">,
	ignoreResourceId: string | null,
): Promise<bigint> {
	const rows = await tx
		.select({
			id: niscStorageResource.id,
			quotaBytes: niscStorageResource.quotaBytes,
		})
		.from(niscStorageResource)
		.where(notInArray(niscStorageResource.status, ["DELETED", "PROVISIONING_FAILED"]));
	let total = 0n;
	for (const row of rows) {
		if (row.id === ignoreResourceId) continue;
		total += parseByteCount(row.quotaBytes) ?? 0n;
	}
	return total;
}

export type StorageCapacity = {
	commercialBytes: string;
	allocatedBytes: string;
	remainingBytes: string;
	requestedBytes: string | null;
	fits: boolean | null;
};

async function measureCapacity(
	tx: Pick<typeof db, "select">,
	requestedBytes: bigint | null,
	ignoreResourceId: string | null,
): Promise<StorageCapacity> {
	const commercial = commercialCapacityBytes();
	const allocated = await reservedBytes(tx, ignoreResourceId);
	const remaining = commercial > allocated ? commercial - allocated : 0n;
	const fits =
		requestedBytes === null ? null : allocated + requestedBytes <= commercial;
	return {
		commercialBytes: commercial.toString(),
		allocatedBytes: allocated.toString(),
		remainingBytes: remaining.toString(),
		requestedBytes: requestedBytes?.toString() ?? null,
		fits,
	};
}

function capacityLimit(capacity: StorageCapacity): StorageOperationError {
	return new StorageOperationError(
		`This allocation needs ${capacity.requestedBytes} bytes. ${capacity.allocatedBytes} bytes are already allocated of the ${capacity.commercialBytes} byte commercial size, leaving ${capacity.remainingBytes}.`,
		"LIMIT",
	);
}

async function assertAllocationFits(
	tx: Pick<typeof db, "select">,
	requestedBytes: bigint,
	ignoreResourceId: string | null,
): Promise<void> {
	const capacity = await measureCapacity(tx, requestedBytes, ignoreResourceId);
	if (capacity.fits === false) throw capacityLimit(capacity);
}

/** Commercial size, what is already allocated, and whether one more allocation fits. */
export async function readStorageCapacity(input: {
	quotaBytes?: string;
	productPlanId?: string;
	ignoreResourceId?: string | null;
}): Promise<StorageCapacity> {
	let requested: bigint | null = null;
	if (input.productPlanId) {
		requested = (await loadPlan(input.productPlanId)).quotaBytes;
	} else if (input.quotaBytes) {
		requested = parseByteCount(input.quotaBytes);
		if (!requested) throw new StorageOperationError("Enter a storage size in bytes.", "LIMIT");
	}
	return measureCapacity(db, requested, input.ignoreResourceId ?? null);
}

async function markFailed(resourceId: string, step: string, error: unknown): Promise<void> {
	await db
		.update(niscStorageResource)
		.set({
			status: "PROVISIONING_FAILED",
			failedStep: step,
			failureReason: sanitizeStorageError(error),
			updatedAt: new Date(),
		})
		.where(eq(niscStorageResource.id, resourceId));
}

async function applyRemoteBucket(resource: StorageResource, reuseRemote: boolean): Promise<StorageResource> {
	let current = resource;
	let step = "bucket";
	try {
		try {
			await createStorageBucket(current.bucketName, reuseRemote);
		} catch (error) {
			if (current.kind === "INTERNAL") throw error;
			if (!(error instanceof StorageOperationError) || error.code !== "CONFLICT" || reuseRemote) throw error;
			const bucketName = generatedBucketName();
			await db
				.update(niscStorageResource)
				.set({ bucketName, bucketNameSource: "GENERATED", updatedAt: new Date() })
				.where(eq(niscStorageResource.id, current.id));
			current = { ...current, bucketName, bucketNameSource: "GENERATED" };
			await createStorageBucket(bucketName, false);
		}

		step = "encryption";
		await putStorageEncryption(current.bucketName);
		await ensureBucketBrowserCors(current.bucketName);
		const algorithm = await getStorageEncryption(current.bucketName);
		if (algorithm !== "AES256") {
			throw new StorageOperationError("Encryption could not be confirmed.", "FAILED");
		}

		step = "iam-user";
		await ensureIamUser(current.iamUserName);
		step = "iam-key";
		const key = await replaceAccessKey(current.iamUserName);
		step = "iam-policy";
		await putIdentityPolicy(current.iamUserName, current.bucketName);
		const now = new Date();
		await db
			.update(niscStorageResource)
			.set({
				accessKeyId: key.accessKeyId,
				secretCiphertext: encryptStorageSecret(key.secret),
				credentialsCreatedAt: current.credentialsCreatedAt ?? now,
				credentialsRotatedAt: current.credentialsCreatedAt ? now : null,
				updatedAt: now,
			})
			.where(eq(niscStorageResource.id, current.id));

		step = "quota";
		const quotaBytes = parseByteCount(current.quotaBytes);
		if (!quotaBytes) throw new StorageOperationError("The storage quota is invalid.", "FAILED");
		await putStorageQuota(current.bucketName, quotaBytes);
		const quota = await getStorageQuota(current.bucketName);
		if (!quota?.enabled || quota.bytes !== quotaBytes) {
			throw new StorageOperationError("The storage quota could not be confirmed.", "FAILED");
		}

		step = "readback";
		if (!(await headStorageBucket(current.bucketName))) {
			throw new StorageOperationError("The bucket could not be confirmed.", "FAILED");
		}

		await db
			.update(niscStorageResource)
			.set({
				status: "ACTIVE",
				encryptionStatus: "AES256",
				quotaSyncStatus: "PENDING",
				failedStep: null,
				failureReason: null,
				updatedAt: new Date(),
			})
			.where(eq(niscStorageResource.id, current.id));
		await touchSubscription(current.subscriptionId, { status: "ACTIVE" });
		return { ...current, status: "ACTIVE", encryptionStatus: "AES256" };
	} catch (error) {
		await disableIdentity(current.iamUserName).catch(() => undefined);
		await db
			.update(niscStorageResource)
			.set({ accessKeyId: null, secretCiphertext: null, updatedAt: new Date() })
			.where(eq(niscStorageResource.id, current.id));
		await markFailed(current.id, step, error);
		throw error instanceof StorageOperationError
			? error
			: new StorageOperationError("Storage could not be provisioned.", "FAILED");
	}
}

export async function provisionTeamStorage(
	actor: StorageActor,
	teamId: string,
	productPlanId: string,
	options?: {
		bucketName?: string;
		agreedPrice?: string;
		subscriptionDate?: Date;
		nextRenewalDate?: Date;
		autoRenew?: boolean;
		userId?: string;
	},
) {
	const { plan, quotaBytes, maxObjectBytes } = await loadPlan(productPlanId);
	const [teamRow] = await db.select().from(team).where(eq(team.id, teamId)).limit(1);
	if (!teamRow?.isActive) throw new StorageOperationError("That team was not found.", "NOT_FOUND");

	let createdId = "";
	let reuseRemote = false;
	try {
		const prepared = await db.transaction(async (tx) => {
			await tx.execute(sql`select pg_advisory_xact_lock(84261021)`);
			const [existing] = await tx
				.select()
				.from(niscStorageResource)
				.where(and(eq(niscStorageResource.teamId, teamId), ne(niscStorageResource.status, "DELETED")))
				.limit(1);
			if (existing && existing.status !== "PROVISIONING" && existing.status !== "PROVISIONING_FAILED") {
				throw new StorageOperationError("This team already has object storage.", "CONFLICT");
			}

			await assertAllocationFits(tx, quotaBytes, existing?.id ?? null);

			if (existing) return { resource: existing, reuseRemote: true };

			const now = new Date();
			const subscriptionId = randomUUID();
			const resourceId = randomUUID();
			const requestedName = options?.bucketName ? parseBucketName(options.bucketName) : null;
			if (options?.bucketName && !requestedName) {
				throw new StorageOperationError(
					"Bucket names are 3 to 63 characters, lowercase letters, numbers, and hyphens.",
					"LIMIT",
				);
			}
			let name = requestedName
				? { bucketName: requestedName, source: "GIVEN" as const }
				: bucketNameFromSlug(teamRow.slug);
			const [nameTaken] = await tx
				.select({ id: niscStorageResource.id })
				.from(niscStorageResource)
				.where(
					and(eq(niscStorageResource.bucketName, name.bucketName), ne(niscStorageResource.status, "DELETED")),
				)
				.limit(1);
			if (nameTaken && requestedName) {
				throw new StorageOperationError("That bucket name is already taken.", "CONFLICT");
			}
			if (nameTaken) name = { bucketName: generatedBucketName(), source: "GENERATED" as const };

			await tx.insert(niscClientSubscription).values({
				id: subscriptionId,
				name: "Object storage",
				teamId,
				userId: options?.userId ?? actor.userId,
				productId: NISC_STORAGE_PRODUCT_ID,
				productPlanId: plan.id,
				subscribedBy: actor.userId,
				recordedBy: actor.userId,
				status: "PENDING",
				subscriptionDate: options?.subscriptionDate ?? now,
				billingCycle: plan.billingCycle ?? "MONTHLY",
				nextRenewalDate: options?.nextRenewalDate ?? null,
				autoRenew: options?.autoRenew ?? false,
				pricingModel: plan.pricingModel || "FIXED",
				agreedPrice: options?.agreedPrice ?? plan.price,
				agreedCurrency: plan.currency ?? "KES",
				metadata: { niscStorage: true },
				createdAt: now,
				updatedAt: now,
			});
			await tx.insert(niscStorageResource).values({
				id: resourceId,
				kind: "CUSTOMER",
				label: teamRow.name,
				teamId,
				subscriptionId,
				productPlanId: plan.id,
				storageClusterId: storageClusterId(),
				bucketName: name.bucketName,
				bucketNameSource: name.source,
				iamUserName: `ncst${resourceId.replace(/-/g, "").slice(0, 20)}`,
				status: "PROVISIONING",
				quotaBytes: quotaBytes.toString(),
				maxObjectBytes: maxObjectBytes.toString(),
				usedBytes: "0",
				encryptionStatus: "UNKNOWN",
				quotaSyncStatus: "PENDING",
				correlationId: randomUUID(),
				createdAt: now,
				updatedAt: now,
			});
			const [resource] = await tx
				.select()
				.from(niscStorageResource)
				.where(eq(niscStorageResource.id, resourceId))
				.limit(1);
			if (!resource) throw new StorageOperationError("Storage could not be provisioned.", "FAILED");
			return { resource, reuseRemote: false };
		});
		createdId = prepared.resource.id;
		reuseRemote = prepared.reuseRemote;
		const ready = await applyRemoteBucket(prepared.resource, reuseRemote);
		const [fresh] = await db
			.select()
			.from(niscStorageResource)
			.where(eq(niscStorageResource.id, ready.id))
			.limit(1);
		const resource = fresh ?? ready;
		await writeStorageAudit({
			resourceId: resource.id,
			teamId,
			actorUserId: actor.userId,
			action: "provision",
			outcome: "ALLOW",
		});
		return {
			resource,
			credentials:
				resource.accessKeyId && resource.secretCiphertext
					? {
							accessKeyId: resource.accessKeyId,
							secretAccessKey: decryptStorageSecret(resource.secretCiphertext),
						}
					: null,
		};
	} catch (error) {
		if (isUniqueViolation(error)) {
			throw new StorageOperationError("This team already has object storage.", "CONFLICT");
		}
		await writeStorageAudit({
			resourceId: createdId || null,
			teamId,
			actorUserId: actor.userId,
			action: "provision",
			outcome: "ERROR",
			detail: sanitizeStorageError(error),
		});
		throw error;
	}
}

function limitsForInternal(quotaRaw: string, maxRaw: string | undefined): { quotaBytes: bigint; maxObjectBytes: bigint } {
	const quotaBytes = parseByteCount(quotaRaw);
	if (!quotaBytes || quotaBytes < 1n) {
		throw new StorageOperationError("Enter a storage size in bytes.", "LIMIT");
	}
	const maxObjectBytes = maxRaw ? parseByteCount(maxRaw) : quotaBytes < MAX_SINGLE_OBJECT_BYTES ? quotaBytes : MAX_SINGLE_OBJECT_BYTES;
	if (!maxObjectBytes || maxObjectBytes < 1n || maxObjectBytes > quotaBytes || maxObjectBytes > MAX_SINGLE_OBJECT_BYTES) {
		throw new StorageOperationError("The file limit must fit inside the bucket size, up to 5 GB.", "LIMIT");
	}
	return { quotaBytes, maxObjectBytes };
}

export async function createInternalStorage(
	actor: StorageActor,
	input: { bucketName: string; label?: string; quotaBytes: string; maxObjectBytes?: string },
) {
	const bucketName = parseBucketName(input.bucketName);
	if (!bucketName) {
		throw new StorageOperationError(
			"Bucket names are 3 to 63 characters, lowercase letters, numbers, and hyphens.",
			"LIMIT",
		);
	}
	const { quotaBytes, maxObjectBytes } = limitsForInternal(input.quotaBytes, input.maxObjectBytes);
	const label = input.label?.trim() || bucketName;

	let createdId = "";
	try {
		const prepared = await db.transaction(async (tx) => {
			await tx.execute(sql`select pg_advisory_xact_lock(84261021)`);
			const [existing] = await tx
				.select()
				.from(niscStorageResource)
				.where(and(eq(niscStorageResource.bucketName, bucketName), ne(niscStorageResource.status, "DELETED")))
				.limit(1);
			if (existing && (existing.kind !== "INTERNAL" || (existing.status !== "PROVISIONING" && existing.status !== "PROVISIONING_FAILED"))) {
				throw new StorageOperationError("That bucket name is already taken.", "CONFLICT");
			}
			await assertAllocationFits(tx, quotaBytes, existing?.id ?? null);
			if (existing) {
				await tx
					.update(niscStorageResource)
					.set({
						label,
						quotaBytes: quotaBytes.toString(),
						maxObjectBytes: maxObjectBytes.toString(),
						updatedAt: new Date(),
					})
					.where(eq(niscStorageResource.id, existing.id));
				const [resource] = await tx
					.select()
					.from(niscStorageResource)
					.where(eq(niscStorageResource.id, existing.id))
					.limit(1);
				if (!resource) throw new StorageOperationError("The bucket could not be created.", "FAILED");
				return { resource, reuseRemote: true };
			}

			const now = new Date();
			const resourceId = randomUUID();
			await tx.insert(niscStorageResource).values({
				id: resourceId,
				kind: "INTERNAL",
				label,
				storageClusterId: storageClusterId(),
				bucketName,
				bucketNameSource: "GIVEN",
				iamUserName: `ncst${resourceId.replace(/-/g, "").slice(0, 20)}`,
				status: "PROVISIONING",
				quotaBytes: quotaBytes.toString(),
				maxObjectBytes: maxObjectBytes.toString(),
				usedBytes: "0",
				encryptionStatus: "UNKNOWN",
				quotaSyncStatus: "PENDING",
				correlationId: randomUUID(),
				createdAt: now,
				updatedAt: now,
			});
			const [resource] = await tx
				.select()
				.from(niscStorageResource)
				.where(eq(niscStorageResource.id, resourceId))
				.limit(1);
			if (!resource) throw new StorageOperationError("The bucket could not be created.", "FAILED");
			return { resource, reuseRemote: false };
		});
		createdId = prepared.resource.id;
		const ready = await applyRemoteBucket(prepared.resource, prepared.reuseRemote);
		const [fresh] = await db
			.select()
			.from(niscStorageResource)
			.where(eq(niscStorageResource.id, ready.id))
			.limit(1);
		const resource = fresh ?? ready;
		await writeStorageAudit({
			resourceId: resource.id,
			actorUserId: actor.userId,
			action: "create-internal",
			outcome: "ALLOW",
		});
		return {
			resource,
			credentials:
				resource.accessKeyId && resource.secretCiphertext
					? {
							accessKeyId: resource.accessKeyId,
							secretAccessKey: decryptStorageSecret(resource.secretCiphertext),
						}
					: null,
		};
	} catch (error) {
		if (isUniqueViolation(error)) {
			throw new StorageOperationError("That bucket name is already taken.", "CONFLICT");
		}
		await writeStorageAudit({
			resourceId: createdId || null,
			actorUserId: actor.userId,
			action: "create-internal",
			outcome: "ERROR",
			detail: sanitizeStorageError(error),
		});
		throw error;
	}
}

export async function updateInternalStorage(
	actor: StorageActor,
	resource: StorageResource,
	input: { label?: string; quotaBytes?: string; maxObjectBytes?: string },
) {
	if (resource.status !== "ACTIVE") {
		throw new StorageOperationError("This bucket is not active.", "DENIED");
	}
	const quotaBytes = input.quotaBytes ? parseByteCount(input.quotaBytes) : parseByteCount(resource.quotaBytes);
	const maxRaw = input.maxObjectBytes ?? resource.maxObjectBytes;
	if (!quotaBytes) throw new StorageOperationError("Enter a storage size in bytes.", "LIMIT");
	const limits = limitsForInternal(quotaBytes.toString(), maxRaw);
	const currentQuota = parseByteCount(resource.quotaBytes) ?? 0n;
	const used = parseByteCount(resource.usedBytes) ?? 0n;
	if (limits.quotaBytes < currentQuota) {
		if (resource.quotaSyncStatus !== "OK") {
			throw new StorageOperationError("Sync usage before making this bucket smaller.", "CONFLICT");
		}
		if (used > limits.quotaBytes) {
			throw new StorageOperationError("Usage is above the new size.", "LIMIT");
		}
	}
	if (limits.quotaBytes > currentQuota) {
		await db.transaction(async (tx) => {
			await tx.execute(sql`select pg_advisory_xact_lock(84261021)`);
			await assertAllocationFits(tx, limits.quotaBytes, resource.id);
			await tx
				.update(niscStorageResource)
				.set({ quotaBytes: limits.quotaBytes.toString(), updatedAt: new Date() })
				.where(eq(niscStorageResource.id, resource.id));
		});
	}
	try {
		await putStorageQuota(resource.bucketName, limits.quotaBytes);
	} catch (error) {
		if (limits.quotaBytes > currentQuota) {
			await db
				.update(niscStorageResource)
				.set({ quotaBytes: currentQuota.toString(), updatedAt: new Date() })
				.where(eq(niscStorageResource.id, resource.id));
		}
		throw error;
	}
	const confirmed = await getStorageQuota(resource.bucketName);
	if (!confirmed?.enabled || confirmed.bytes !== limits.quotaBytes) {
		throw new StorageOperationError("The storage quota could not be confirmed.", "FAILED");
	}
	await db
		.update(niscStorageResource)
		.set({
			label: input.label?.trim() || resource.label,
			quotaBytes: limits.quotaBytes.toString(),
			maxObjectBytes: limits.maxObjectBytes.toString(),
			updatedAt: new Date(),
		})
		.where(eq(niscStorageResource.id, resource.id));
	await writeStorageAudit({
		resourceId: resource.id,
		teamId: resource.teamId,
		actorUserId: actor.userId,
		action: "update-limits",
		outcome: "ALLOW",
	});
}

export async function changeStoragePlan(actor: StorageActor, resource: StorageResource, productPlanId: string) {
	if (resource.kind === "INTERNAL" || !resource.subscriptionId) {
		throw new StorageOperationError("Internal buckets are not on a customer plan.", "CONFLICT");
	}
	if (resource.status !== "ACTIVE") {
		throw new StorageOperationError("This storage plan is not active.", "DENIED");
	}
	const { plan, quotaBytes, maxObjectBytes } = await loadPlan(productPlanId);
	const currentQuota = parseByteCount(resource.quotaBytes) ?? 0n;
	const used = parseByteCount(resource.usedBytes) ?? 0n;
	if (quotaBytes < currentQuota) {
		if (resource.quotaSyncStatus !== "OK") {
			throw new StorageOperationError("Sync usage before moving to a smaller plan.", "CONFLICT");
		}
		if (used > quotaBytes) {
			throw new StorageOperationError("Usage is above the smaller plan.", "LIMIT");
		}
	}
	if (quotaBytes > currentQuota) {
		await db.transaction(async (tx) => {
			await tx.execute(sql`select pg_advisory_xact_lock(84261021)`);
			await assertAllocationFits(tx, quotaBytes, resource.id);
			await tx
				.update(niscStorageResource)
				.set({ quotaBytes: quotaBytes.toString(), updatedAt: new Date() })
				.where(eq(niscStorageResource.id, resource.id));
		});
	}

	try {
		await putStorageQuota(resource.bucketName, quotaBytes);
	} catch (error) {
		if (quotaBytes > currentQuota) {
			await db
				.update(niscStorageResource)
				.set({ quotaBytes: currentQuota.toString(), updatedAt: new Date() })
				.where(eq(niscStorageResource.id, resource.id));
		}
		throw error;
	}
	const confirmed = await getStorageQuota(resource.bucketName);
	if (!confirmed?.enabled || confirmed.bytes !== quotaBytes) {
		throw new StorageOperationError("The storage quota could not be confirmed.", "FAILED");
	}
	const now = new Date();
	await db
		.update(niscStorageResource)
		.set({
			productPlanId: plan.id,
			quotaBytes: quotaBytes.toString(),
			maxObjectBytes: maxObjectBytes.toString(),
			updatedAt: now,
		})
		.where(eq(niscStorageResource.id, resource.id));
	await touchSubscription(resource.subscriptionId, {
		productPlanId: plan.id,
		agreedPrice: plan.price,
		status: "ACTIVE",
	});
	await writeStorageAudit({
		resourceId: resource.id,
		teamId: resource.teamId,
		actorUserId: actor.userId,
		action: "change-plan",
		outcome: "ALLOW",
	});
}

export async function suspendStorage(actor: StorageActor, resource: StorageResource) {
	if (resource.status !== "ACTIVE" && resource.status !== "SUSPENDED") {
		throw new StorageOperationError("This storage plan cannot be suspended.", "CONFLICT");
	}
	const now = new Date();
	await db
		.update(niscStorageResource)
		.set({
			status: "SUSPENDED",
			suspendedAt: resource.suspendedAt ?? now,
			accessKeyId: null,
			secretCiphertext: null,
			updatedAt: now,
		})
		.where(eq(niscStorageResource.id, resource.id));
	await touchSubscription(resource.subscriptionId, { status: "SUSPENDED" });
	await disableIdentity(resource.iamUserName);
	await writeStorageAudit({
		resourceId: resource.id,
		teamId: resource.teamId,
		actorUserId: actor.userId,
		action: "suspend",
		outcome: "ALLOW",
	});
}

export async function resumeStorage(actor: StorageActor, resource: StorageResource) {
	if (resource.status !== "SUSPENDED") {
		throw new StorageOperationError("This storage plan is not suspended.", "CONFLICT");
	}
	await ensureIamUser(resource.iamUserName);
	const key = await replaceAccessKey(resource.iamUserName);
	await putIdentityPolicy(resource.iamUserName, resource.bucketName);
	const quotaBytes = parseByteCount(resource.quotaBytes);
	if (!quotaBytes) throw new StorageOperationError("The storage quota is invalid.", "FAILED");
	await putStorageQuota(resource.bucketName, quotaBytes);
	const now = new Date();
	await db
		.update(niscStorageResource)
		.set({
			status: "ACTIVE",
			suspendedAt: null,
			accessKeyId: key.accessKeyId,
			secretCiphertext: encryptStorageSecret(key.secret),
			credentialsRotatedAt: now,
			updatedAt: now,
		})
		.where(eq(niscStorageResource.id, resource.id));
	await touchSubscription(resource.subscriptionId, { status: "ACTIVE" });
	await writeStorageAudit({
		resourceId: resource.id,
		teamId: resource.teamId,
		actorUserId: actor.userId,
		action: "resume",
		outcome: "ALLOW",
	});
	return { accessKeyId: key.accessKeyId, secretAccessKey: key.secret };
}

export function revealStorageCredentials(actor: StorageActor, resource: StorageResource) {
	if (resource.status !== "ACTIVE" || !resource.accessKeyId || !resource.secretCiphertext) {
		throw new StorageOperationError("Storage credentials are not available.", "CONFLICT");
	}
	const secretAccessKey = decryptStorageSecret(resource.secretCiphertext);
	const current = readNiscStorageConfig();
	void writeStorageAudit({
		resourceId: resource.id,
		teamId: resource.teamId,
		actorUserId: actor.userId,
		action: "reveal-credentials",
		outcome: "ALLOW",
	});
	return {
		accessKeyId: resource.accessKeyId,
		secretAccessKey,
		bucketName: resource.bucketName,
		endpoint: current.endpoint,
		region: current.region,
	};
}

export async function rotateStorageCredentials(actor: StorageActor, resource: StorageResource) {
	if (resource.status !== "ACTIVE") {
		throw new StorageOperationError("This storage plan is not active.", "DENIED");
	}
	const key = await replaceAccessKey(resource.iamUserName);
	await putIdentityPolicy(resource.iamUserName, resource.bucketName);
	const now = new Date();
	await db
		.update(niscStorageResource)
		.set({
			accessKeyId: key.accessKeyId,
			secretCiphertext: encryptStorageSecret(key.secret),
			credentialsRotatedAt: now,
			updatedAt: now,
		})
		.where(eq(niscStorageResource.id, resource.id));
	await writeStorageAudit({
		resourceId: resource.id,
		teamId: resource.teamId,
		actorUserId: actor.userId,
		action: "rotate-credentials",
		outcome: "ALLOW",
	});
	return { accessKeyId: key.accessKeyId, secretAccessKey: key.secret };
}

const DELETION_WAIT_MS = 7 * 24 * 60 * 60 * 1000;

function isSuperAdmin(actor: StorageActor): boolean {
	return actor.role === "AGENCY_SUPER_ADMIN";
}

export async function beginStorageDeletion(actor: StorageActor, resource: StorageResource) {
	if (!["ACTIVE", "SUSPENDED", "PROVISIONING_FAILED"].includes(resource.status)) {
		throw new StorageOperationError("This storage plan cannot be deleted.", "CONFLICT");
	}
	const now = new Date();
	await db
		.update(niscStorageResource)
		.set({
			status: "PENDING_DELETION",
			statusBeforeDeletion: resource.status,
			deletionScheduledAt: new Date(now.getTime() + DELETION_WAIT_MS),
			accessKeyId: null,
			secretCiphertext: null,
			updatedAt: now,
		})
		.where(eq(niscStorageResource.id, resource.id));
	await disableIdentity(resource.iamUserName).catch(() => undefined);
	await writeStorageAudit({
		resourceId: resource.id,
		teamId: resource.teamId,
		actorUserId: actor.userId,
		action: "begin-deletion",
		outcome: "ALLOW",
	});
}

export async function cancelStorageDeletion(actor: StorageActor, resource: StorageResource) {
	if (resource.status !== "PENDING_DELETION") {
		throw new StorageOperationError("This storage plan is not waiting for deletion.", "CONFLICT");
	}
	const restore =
		resource.statusBeforeDeletion === "SUSPENDED" || resource.statusBeforeDeletion === "PROVISIONING_FAILED"
			? resource.statusBeforeDeletion
			: "ACTIVE";
	const now = new Date();
	if (restore === "ACTIVE") {
		await ensureIamUser(resource.iamUserName);
		const key = await replaceAccessKey(resource.iamUserName);
		await putIdentityPolicy(resource.iamUserName, resource.bucketName);
		await db
			.update(niscStorageResource)
			.set({
				status: "ACTIVE",
				statusBeforeDeletion: null,
				deletionScheduledAt: null,
				accessKeyId: key.accessKeyId,
				secretCiphertext: encryptStorageSecret(key.secret),
				credentialsRotatedAt: now,
				updatedAt: now,
			})
			.where(eq(niscStorageResource.id, resource.id));
	} else {
		await db
			.update(niscStorageResource)
			.set({
				status: restore,
				statusBeforeDeletion: null,
				deletionScheduledAt: null,
				updatedAt: now,
			})
			.where(eq(niscStorageResource.id, resource.id));
	}
	await writeStorageAudit({
		resourceId: resource.id,
		teamId: resource.teamId,
		actorUserId: actor.userId,
		action: "cancel-deletion",
		outcome: "ALLOW",
	});
}

export async function continueStorageDeletion(actor: StorageActor, resource: StorageResource) {
	if (resource.status !== "PENDING_DELETION") {
		throw new StorageOperationError("This storage plan is not waiting for deletion.", "CONFLICT");
	}
	const due = !resource.deletionScheduledAt || resource.deletionScheduledAt.getTime() <= Date.now();
	if (!due && !isSuperAdmin(actor)) {
		throw new StorageOperationError(
			"This bucket is scheduled for deletion. A super admin can remove it before the 7 days end.",
			"CONFLICT",
		);
	}
	let deleted = 0;
	let token: string | undefined;
	for (let page = 0; page < 5; page += 1) {
		const listed = await listRawKeys({
			bucket: resource.bucketName,
			token,
			maxKeys: 500,
		});
		if (listed.objects.length === 0) {
			token = undefined;
			break;
		}
		await removeStoredObjects(
			resource.bucketName,
			listed.objects.map((object) => object.key),
		);
		deleted += listed.objects.length;
		if (!listed.nextToken) {
			token = undefined;
			break;
		}
		token = listed.nextToken;
	}
	if (token) {
		return { complete: false, deleted };
	}
	const leftover = await listRawKeys({ bucket: resource.bucketName, maxKeys: 1 });
	if (leftover.objects.length > 0) {
		return { complete: false, deleted };
	}
	await deleteStorageBucket(resource.bucketName);
	await deleteIdentity(resource.iamUserName).catch(() => undefined);
	const now = new Date();
	await db
		.update(niscStorageResource)
		.set({ status: "DELETED", deletedAt: now, updatedAt: now })
		.where(eq(niscStorageResource.id, resource.id));
	await touchSubscription(resource.subscriptionId, { status: "CANCELLED" });
	await writeStorageAudit({
		resourceId: resource.id,
		teamId: resource.teamId,
		actorUserId: actor.userId,
		action: "delete",
		outcome: "ALLOW",
	});
	return { complete: true, deleted };
}

export async function deleteStorageImmediately(actor: StorageActor, resource: StorageResource) {
	if (!isSuperAdmin(actor)) {
		throw new StorageOperationError("Only a super admin can delete a bucket immediately.", "DENIED");
	}
	if (!["ACTIVE", "SUSPENDED", "PROVISIONING_FAILED", "PENDING_DELETION"].includes(resource.status)) {
		throw new StorageOperationError("This storage plan cannot be deleted.", "CONFLICT");
	}
	const now = new Date();
	if (resource.status !== "PENDING_DELETION") {
		await db
			.update(niscStorageResource)
			.set({
				status: "PENDING_DELETION",
				statusBeforeDeletion: resource.status,
				deletionScheduledAt: now,
				accessKeyId: null,
				secretCiphertext: null,
				updatedAt: now,
			})
			.where(eq(niscStorageResource.id, resource.id));
		await disableIdentity(resource.iamUserName).catch(() => undefined);
	} else if (!resource.deletionScheduledAt || resource.deletionScheduledAt.getTime() > now.getTime()) {
		await db
			.update(niscStorageResource)
			.set({ deletionScheduledAt: now, updatedAt: now })
			.where(eq(niscStorageResource.id, resource.id));
	}
	return continueStorageDeletion(actor, {
		...resource,
		status: "PENDING_DELETION",
		deletionScheduledAt: now,
	});
}

export async function syncStorageUsage(resource: StorageResource): Promise<{ usedBytes: string; partial: boolean }> {
	let total = 0n;
	let token: string | undefined;
	let partial = false;
	for (let page = 0; page < 20; page += 1) {
		const listed = await listRawKeys({ bucket: resource.bucketName, token, maxKeys: 1000 });
		for (const object of listed.objects) total += BigInt(Math.max(0, object.size));
		if (!listed.nextToken) {
			token = undefined;
			break;
		}
		token = listed.nextToken;
		if (page === 19) partial = true;
	}
	const now = new Date();
	await db
		.update(niscStorageResource)
		.set({
			usedBytes: total.toString(),
			quotaSyncStatus: partial ? "PARTIAL" : "OK",
			lastUsageSyncAt: now,
			updatedAt: now,
		})
		.where(eq(niscStorageResource.id, resource.id));
	return { usedBytes: total.toString(), partial };
}
