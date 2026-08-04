import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
	buildObjectKey,
	createPresignedUploadUrl,
	deleteObject,
	getObjectStorageConfig,
	isObjectStorageConfigured,
	listObjects,
	ObjectStorageNotConfiguredError,
	STORAGE_PREFIXES,
} from "../../lib/object-storage";
import { checkRateLimit } from "../../lib/rate-limit";
import { protectedProcedure, router } from "../../trpc";

const TEST_PREFIX = "storage-test";

const AGENCY_ROLES = new Set(["AGENCY_USER", "AGENCY_ADMIN", "AGENCY_SUPER_ADMIN"]);

const AGENCY_MAX_FILE_SIZE = 1024 * 1024 * 1024; // 1GB

/** Prefixes customers may upload to, with per-prefix byte caps. */
const CUSTOMER_UPLOAD_LIMITS: Record<string, number> = {
	[STORAGE_PREFIXES.ZEEPO_AGENT]: 16 * 1024 * 1024, // 16MB (chat attachments)
	[STORAGE_PREFIXES.FILES]: 50 * 1024 * 1024, // 50MB (support ticket attachments)
};

/** Customer uploads per user per hour (presigned URL grants). */
const CUSTOMER_UPLOAD_RATE_LIMIT = 30;
const CUSTOMER_UPLOAD_RATE_WINDOW_SEC = 3600;

function isAgencyUser(role: string | null | undefined): boolean {
	return AGENCY_ROLES.has(role ?? "");
}

function assertAgencyUser(role: string | null | undefined) {
	if (!isAgencyUser(role)) {
		throw new TRPCError({ code: "FORBIDDEN", message: "Only agency users can access object storage." });
	}
}

function formatMb(bytes: number): string {
	return `${Math.round(bytes / (1024 * 1024))}MB`;
}

/**
 * Agency: any prefix, up to 1GB.
 * Customer: only allowlisted prefixes with tighter size caps.
 */
function assertCanCreateUploadUrl(params: {
	role: string | null | undefined;
	prefix: string;
	fileSize: number;
}) {
	if (isAgencyUser(params.role)) {
		if (params.fileSize > AGENCY_MAX_FILE_SIZE) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: `File exceeds the ${formatMb(AGENCY_MAX_FILE_SIZE)} upload limit.`,
			});
		}
		return;
	}

	const maxSize = CUSTOMER_UPLOAD_LIMITS[params.prefix];
	if (!maxSize) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "This upload type is only available to agency users.",
		});
	}

	if (params.fileSize > maxSize) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: `File exceeds the ${formatMb(maxSize)} upload limit.`,
		});
	}
}

function mapStorageError(error: unknown): never {
	if (error instanceof ObjectStorageNotConfiguredError) {
		throw new TRPCError({
			code: "PRECONDITION_FAILED",
			message: error.message,
		});
	}
	throw error;
}

export const objectStorageRouter = router({
	getConfig: protectedProcedure.query(({ ctx }) => {
		assertAgencyUser(ctx.session?.user?.role);

		if (!isObjectStorageConfigured()) {
			return {
				configured: false as const,
				bucket: null,
				endpoint: null,
				publicBaseUrl: null,
				region: null,
			};
		}

		try {
			const config = getObjectStorageConfig();
			return {
				configured: true as const,
				bucket: config.bucket,
				endpoint: config.endpoint,
				publicBaseUrl: config.publicBaseUrl,
				region: config.region,
			};
		} catch (error) {
			mapStorageError(error);
		}
	}),

	createUploadUrl: protectedProcedure
		.input(
			z.object({
				fileName: z.string().min(1).max(255),
				contentType: z.string().min(1).max(200),
				fileSize: z.number().int().positive().max(AGENCY_MAX_FILE_SIZE),
				prefix: z.string().min(1).max(80).default(TEST_PREFIX),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const role = ctx.session?.user?.role;
			const userId = ctx.session.user.id;

			assertCanCreateUploadUrl({
				role,
				prefix: input.prefix,
				fileSize: input.fileSize,
			});

			// Extra hourly cap for customers (agency relies on the global procedure limiter).
			if (!isAgencyUser(role)) {
				const rl = await checkRateLimit({
					key: `object-storage:upload:${userId}`,
					limit: CUSTOMER_UPLOAD_RATE_LIMIT,
					windowSec: CUSTOMER_UPLOAD_RATE_WINDOW_SEC,
				});
				if (!rl.allowed) {
					throw new TRPCError({
						code: "TOO_MANY_REQUESTS",
						message: "Upload rate limit exceeded. Please try again later.",
					});
				}
			}

			try {
				const key = buildObjectKey({
					prefix: input.prefix,
					fileName: input.fileName,
					userId,
				});

				return await createPresignedUploadUrl({
					key,
					contentType: input.contentType,
				});
			} catch (error) {
				mapStorageError(error);
			}
		}),

	listTestObjects: protectedProcedure
		.input(
			z
				.object({
					prefix: z.string().min(1).max(80).default(TEST_PREFIX),
					maxKeys: z.number().int().min(1).max(100).default(25),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			assertAgencyUser(ctx.session?.user?.role);

			try {
				const prefix = `${input?.prefix ?? TEST_PREFIX}/${ctx.session.user.id}`;
				return await listObjects({
					prefix,
					maxKeys: input?.maxKeys ?? 25,
				});
			} catch (error) {
				mapStorageError(error);
			}
		}),

	deleteObject: protectedProcedure
		.input(z.object({ key: z.string().min(1).max(512) }))
		.mutation(async ({ ctx, input }) => {
			assertAgencyUser(ctx.session?.user?.role);

			const userPrefix = `${TEST_PREFIX}/${ctx.session.user.id}/`;
			if (!input.key.startsWith(userPrefix)) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You can only delete your own storage-test objects.",
				});
			}

			try {
				await deleteObject(input.key);
				return { success: true as const };
			} catch (error) {
				mapStorageError(error);
			}
		}),
});
