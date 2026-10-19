import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { db, eq } from "@npanel/db";
import { user } from "@npanel/db/schema/auth";
import { protectedProcedure, router } from "../trpc";
import {
	MailMcpRequestError,
	createMailMcpUser,
	deleteMailMcpUser,
	getMailMcpUser,
	listMailMcpUsers,
	mailMcpPublicUrls,
	rotateMailMcpToken,
} from "../lib/mail-mcp-client";

async function assertAgencySuperAdmin(userId: string): Promise<void> {
	const [row] = await db
		.select({ role: user.role })
		.from(user)
		.where(eq(user.id, userId))
		.limit(1);

	if (!row) {
		throw new TRPCError({ code: "UNAUTHORIZED", message: "User not found" });
	}
	if (row.role !== "AGENCY_SUPER_ADMIN") {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "Only agency super admins can manage Mail MCP users.",
		});
	}
}

function mapMailMcpError(error: unknown): never {
	if (error instanceof MailMcpRequestError) {
		if (error.status === 400) {
			throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
		}
		if (error.status === 404) {
			throw new TRPCError({ code: "NOT_FOUND", message: "That Mail MCP user was not found." });
		}
		if (error.status === 409) {
			throw new TRPCError({
				code: "CONFLICT",
				message: "A mailbox for this user is still syncing. Try again in a moment.",
			});
		}
		if (error.status === 429) {
			throw new TRPCError({
				code: "TOO_MANY_REQUESTS",
				message: "Mail MCP is rate limited. Wait and try again.",
			});
		}
		if (error.status === 503) {
			throw new TRPCError({
				code: "PRECONDITION_FAILED",
				message: "Mail MCP is not configured. Set NISC_MAIL_MCP_API_KEY on the server.",
			});
		}
		throw new TRPCError({
			code: "INTERNAL_SERVER_ERROR",
			message: error.status === 401 ? "Mail MCP rejected the admin key." : error.message,
		});
	}
	throw new TRPCError({
		code: "INTERNAL_SERVER_ERROR",
		message: "Mail MCP request failed.",
	});
}

const displayNameSchema = z
	.string()
	.trim()
	.min(1, "Name is required")
	.max(200, "Name must be 200 characters or fewer")
	.refine((value) => !/[\r\n]/.test(value), "Name cannot contain line breaks");

export const mailMcpRouter = router({
	urls: protectedProcedure.query(async ({ ctx }) => {
		await assertAgencySuperAdmin(ctx.session.user.id);
		try {
			return mailMcpPublicUrls();
		} catch (error) {
			mapMailMcpError(error);
		}
	}),

	list: protectedProcedure.query(async ({ ctx }) => {
		await assertAgencySuperAdmin(ctx.session.user.id);
		try {
			return await listMailMcpUsers();
		} catch (error) {
			mapMailMcpError(error);
		}
	}),

	get: protectedProcedure.input(z.object({ id: z.string().uuid() })).query(async ({ ctx, input }) => {
		await assertAgencySuperAdmin(ctx.session.user.id);
		try {
			return await getMailMcpUser(input.id);
		} catch (error) {
			mapMailMcpError(error);
		}
	}),

	rotateToken: protectedProcedure
		.input(z.object({ id: z.string().uuid() }))
		.mutation(async ({ ctx, input }) => {
			await assertAgencySuperAdmin(ctx.session.user.id);
			try {
				return await rotateMailMcpToken(input.id);
			} catch (error) {
				mapMailMcpError(error);
			}
		}),

	create: protectedProcedure
		.input(
			z.object({
				displayName: displayNameSchema,
				email: z.string().trim().email("Enter a valid email").max(320),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			await assertAgencySuperAdmin(ctx.session.user.id);
			try {
				return await createMailMcpUser(input);
			} catch (error) {
				mapMailMcpError(error);
			}
		}),

	delete: protectedProcedure
		.input(z.object({ id: z.string().uuid() }))
		.mutation(async ({ ctx, input }) => {
			await assertAgencySuperAdmin(ctx.session.user.id);
			try {
				await deleteMailMcpUser(input.id);
				return { success: true as const };
			} catch (error) {
				mapMailMcpError(error);
			}
		}),
});
