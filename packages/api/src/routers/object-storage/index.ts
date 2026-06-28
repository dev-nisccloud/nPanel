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
} from "../../lib/object-storage";
import { protectedProcedure, router } from "../../trpc";

const TEST_PREFIX = "storage-test";

function assertAgencyUser(role: string | null | undefined) {
	if (!["AGENCY_USER", "AGENCY_ADMIN", "AGENCY_SUPER_ADMIN"].includes(role ?? "")) {
		throw new TRPCError({ code: "FORBIDDEN", message: "Only agency users can access object storage." });
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
				fileSize: z.number().int().positive().max(1024 * 1024 * 1024),
				prefix: z.string().min(1).max(80).default(TEST_PREFIX),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			assertAgencyUser(ctx.session?.user?.role);

			try {
				const key = buildObjectKey({
					prefix: input.prefix,
					fileName: input.fileName,
					userId: ctx.session.user.id,
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
