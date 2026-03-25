import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "@npanel/db";
import { db } from "@npanel/db";
import {
	customerIntegration,
	customerIntegrationActivityLog,
	userActivityLog,
	userProfile,
} from "@npanel/db/schema/auth-extras";
import { session as sessionTable, user } from "@npanel/db/schema/auth";
import * as crypto from "crypto";
import { auth } from "@npanel/auth";
import { renderAccountCreatedEmail } from "../lib/email-templates";
import { sendEmail } from "react-email-starter/src/email";
import { sendPleskXmlRequest } from "../lib/plesk/xml-client";
import { XMLParser } from "fast-xml-parser";
import { createOpenProviderClient, OpenProviderApiError } from "../lib/openprovider-client";
import type { OpenProviderCustomerRequest } from "../types/openprovider";

// ============================================================================
// ZOD SCHEMAS - Independent from database schema
// ============================================================================

const getAllClientsInputSchema = z.object({}).optional().default({});

const clientOutputSchema = z.object({
	id: z.string(),
	name: z.string(),
	email: z.string(),
	emailVerified: z.boolean(),
	role: z.enum(["CUSTOMER", "AGENCY_ADMIN", "AGENCY_SUPER_ADMIN", "AGENCY_USER"]),
	status: z.enum(["ACTIVE", "SUSPENDED", "BANNED", "DEACTIVATED"]),
	image: z.string().nullable(),
	lastLoginAt: z.date().nullable(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

const getAllClientsOutputSchema = z.array(clientOutputSchema);

const createClientInputSchema = z.object({
	name: z.string().min(1, "Name is required"),
	email: z.string().email("Invalid email address"),
	password: z.string().min(8, "Password must be at least 8 characters"),
	role: z.enum(["CUSTOMER", "AGENCY_ADMIN", "AGENCY_SUPER_ADMIN", "AGENCY_USER"]).optional().default("CUSTOMER"),
});

const createClientOutputSchema = clientOutputSchema;

const updateClientInputSchema = z.object({
	userId: z.string(),
	name: z.string().optional(),
	email: z.string().email("Invalid email address").optional(),
	role: z.enum(["CUSTOMER", "AGENCY_ADMIN", "AGENCY_SUPER_ADMIN", "AGENCY_USER"]).optional(),
}).refine(
	(data) => {
		// At least one field must be provided for update
		return data.name !== undefined || data.email !== undefined || data.role !== undefined;
	},
	{
		message: "At least one field must be provided for update",
	},
);

const updateClientOutputSchema = clientOutputSchema;

const changeStatusInputSchema = z.object({
	userId: z.string(),
	status: z.enum(["ACTIVE", "SUSPENDED", "BANNED", "DEACTIVATED"]),
});

const changeStatusOutputSchema = z.object({
	success: z.boolean(),
});

const requestPasswordResetInputSchema = z.object({
	userId: z.string(),
});

const requestPasswordResetOutputSchema = z.object({
	success: z.boolean(),
});

const getClientSessionsInputSchema = z.object({
	userId: z.string(),
});

const sessionOutputSchema = z.object({
	id: z.string(),
	token: z.string(),
	expiresAt: z.date(),
	createdAt: z.date(),
	updatedAt: z.date(),
	ipAddress: z.string().nullable(),
	userAgent: z.string().nullable(),
});

const getClientSessionsOutputSchema = z.array(sessionOutputSchema);

const getProfileInputSchema = z.object({
	userId: z.string(),
});

const profileOutputSchema = z.object({
	firstName: z.string().nullable(),
	lastName: z.string().nullable(),
	phone: z.string().nullable(),
	address: z.string().nullable(),
	city: z.string().nullable(),
	state: z.string().nullable(),
	country: z.string().nullable(),
	postalCode: z.string().nullable(),
});

const getProfileOutputSchema = profileOutputSchema;

const updateProfileInputSchema = z.object({
	userId: z.string(),
	name: z.string().min(2).max(100).optional(),
	firstName: z.string().min(1).max(50).optional(),
	lastName: z.string().min(1).max(50).optional(),
	phone: z.string().optional(),
	address: z.string().optional(),
	city: z.string().optional(),
	state: z.string().optional(),
	country: z.string().optional(),
	postalCode: z.string().optional(),
}).refine(
	(data) => {
		// At least one field must be provided for update
		return data.name !== undefined || data.firstName !== undefined || data.lastName !== undefined || 
			data.phone !== undefined || data.address !== undefined || data.city !== undefined || 
			data.state !== undefined || data.country !== undefined || data.postalCode !== undefined;
	},
	{
		message: "At least one field must be provided for update",
	},
);

const updateProfileOutputSchema = z.object({
	success: z.boolean(),
	message: z.string().optional(),
});

const getIntegrationsInputSchema = z.object({
	userId: z.string(),
});

const integrationOutputSchema = z.object({
	id: z.string(),
	userId: z.string(),
	platform: z.enum(["PLESK", "OPENPROVIDER", "KENIC"]),
	platformCustomerId: z.string().nullable(),
	isActive: z.boolean(),
	isCreated: z.boolean(),
	createdBy: z.string().nullable(),
	createdAt: z.date(),
	lastSyncedAt: z.date().nullable(),
	platformData: z.any().nullable(),
	updatedAt: z.date(),
});

const getIntegrationsOutputSchema = z.array(integrationOutputSchema);

const createIntegrationInputSchema = z.object({
	userId: z.string(),
	platform: z.enum(["PLESK", "OPENPROVIDER"]),
});

const createIntegrationOutputSchema = integrationOutputSchema;

const checkEmailVerificationInputSchema = z.object({
	userId: z.string(),
	integrationId: z.string(),
});

const emailVerificationStatusOutputSchema = z.object({
	isVerified: z.boolean(),
	status: z.string().nullable(),
	email: z.string().nullable(),
	handle: z.string().nullable(),
	domains: z.array(z.object({
		domain: z.string(),
		status: z.string(),
		expiration_date: z.string().nullable(),
		is_suspended: z.boolean(),
	})).optional(),
});

const checkEmailVerificationOutputSchema = emailVerificationStatusOutputSchema;

const sendEmailVerificationInputSchema = z.object({
	userId: z.string(),
	integrationId: z.string(),
	language: z.string().optional().default("en"),
});

const sendEmailVerificationOutputSchema = z.object({
	success: z.boolean(),
	message: z.string(),
	verificationId: z.string().optional().nullable(),
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get user role - optimized to use session role when available
 * Falls back to database query if role not in session
 */
async function getUserRole(userId: string, sessionUser?: { role?: string }): Promise<string> {
	// Optimize: Use role from session if available (set by auth hooks)
	// This avoids unnecessary database queries
	if (sessionUser?.role) {
		return sessionUser.role;
	}

	// Fallback: Query database if role not in session
	const [dbUser] = await db
		.select({ role: user.role })
		.from(user)
		.where(eq(user.id, userId))
		.limit(1);

	if (!dbUser) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "User not found",
		});
	}

	return dbUser.role;
}

// ============================================================================
// tRPC ROUTER
// ============================================================================

export const clientsRouter = router({
	// Get all customer users
	getAll: protectedProcedure
		.input(getAllClientsInputSchema)
		.output(getAllClientsOutputSchema)
		.query(async ({ ctx }) => {
			const session = ctx.session;
			if (!session?.user?.id) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "You must be logged in to view clients",
				});
			}

			// Only allow AGENCY_ADMIN and AGENCY_SUPER_ADMIN to view clients
			// Optimize: Pass session user to avoid database query if role is in session
			const userRole = await getUserRole(session.user.id, session.user as { role?: string });
			if (userRole !== "AGENCY_ADMIN" && userRole !== "AGENCY_SUPER_ADMIN") {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You do not have permission to view clients",
				});
			}

			const clients = await db
				.select()
				.from(user)
				.where(eq(user.role, "CUSTOMER"))
				.orderBy(desc(user.createdAt));

			return getAllClientsOutputSchema.parse(clients.map((client) => ({
				id: client.id,
				name: client.name,
				email: client.email,
				emailVerified: client.emailVerified,
				role: client.role,
				status: client.status,
				image: client.image,
				lastLoginAt: client.lastLoginAt,
				createdAt: client.createdAt,
				updatedAt: client.updatedAt,
			})));
		}),

	// Create a new client
	create: protectedProcedure
		.input(createClientInputSchema)
		.output(createClientOutputSchema)
		.mutation(async ({ ctx, input }) => {
			const session = ctx.session;
			if (!session?.user?.id) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "You must be logged in to create clients",
				});
			}

			// Only allow AGENCY_ADMIN and AGENCY_SUPER_ADMIN to create clients
			const userRole = await getUserRole(session.user.id);
			if (userRole !== "AGENCY_ADMIN" && userRole !== "AGENCY_SUPER_ADMIN") {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You do not have permission to create clients",
				});
			}

			const userId = session.user.id;

			// Check if user with this email already exists
			const [existingUser] = await db
				.select({ id: user.id })
				.from(user)
				.where(eq(user.email, input.email))
				.limit(1);

			if (existingUser) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "A user with this email already exists",
				});
			}

			// Use Better Auth's signUpEmail API to create the user
			// This properly handles password hashing and account creation
			const signupResult = await auth.api.signUpEmail({
				body: {
					email: input.email,
					password: input.password,
					name: input.name,
				},
			});

			if (!signupResult) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to create user account",
				});
			}
			
			if ('error' in signupResult && signupResult.error) {
				const errorMessage = typeof signupResult.error === 'object' && 'message' in signupResult.error 
					? String(signupResult.error.message) 
					: "Failed to create user account";
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: errorMessage,
				});
			}

			// Batch: Get user, update role if needed, and get updated user
			// This reduces connection usage from 3 sequential queries to 1-2 queries
			let [updatedUser] = await db
				.select()
				.from(user)
				.where(eq(user.email, input.email))
				.limit(1);

			if (!updatedUser) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "User was created but could not be retrieved",
				});
			}

			// Update user role to the specified role (Better Auth defaults to CUSTOMER)
			if (input.role && input.role !== updatedUser.role) {
				await db
					.update(user)
					.set({ role: input.role })
					.where(eq(user.id, updatedUser.id));
				const [refetchedUser] = await db
					.select()
					.from(user)
					.where(eq(user.id, updatedUser.id))
					.limit(1);
				updatedUser = refetchedUser;
			}

			if (!updatedUser) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "User could not be retrieved after role update",
				});
			}

			// Send custom credentials email
			try {
				const frontendUrl = process.env.CORS_ORIGIN || "http://localhost:3002";
				const loginLink = `${frontendUrl}/auth/login`;

				const html = await renderAccountCreatedEmail({
					userFirstname: input.name,
					email: input.email,
					password: input.password, // Send plain password in email (they should change it)
					loginLink,
				});

				await sendEmail({
					to: input.email,
					subject: "Your account has been created - Nisc Cloud",
					html,
				});
			} catch (emailError) {
				// Log email error but don't fail the creation
				console.error("Failed to send account creation email:", emailError);
				// Still log activity even if email fails
			}

			// Log activity
			await db.insert(userActivityLog).values({
				id: crypto.randomUUID(),
				userId: updatedUser.id,
				action: "ACCOUNT_CREATED_BY_ADMIN",
				description: `Account created by admin: ${session.user.email}`,
				metadata: {
					createdBy: userId,
					createdByEmail: session.user.email,
					role: input.role,
				},
				ipAddress: null,
				userAgent: null,
				createdAt: new Date(),
			});

			return createClientOutputSchema.parse({
				id: updatedUser.id,
				name: updatedUser.name,
				email: updatedUser.email,
				emailVerified: updatedUser.emailVerified,
				role: updatedUser.role,
				status: updatedUser.status,
				image: updatedUser.image,
				lastLoginAt: updatedUser.lastLoginAt,
				createdAt: updatedUser.createdAt,
				updatedAt: updatedUser.updatedAt,
			});
		}),

	// Update client
	update: protectedProcedure
		.input(updateClientInputSchema)
		.output(updateClientOutputSchema)
		.mutation(async ({ ctx, input }) => {
			const session = ctx.session;
			if (!session?.user?.id) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "You must be logged in to update clients",
				});
			}

			// Only allow AGENCY_ADMIN and AGENCY_SUPER_ADMIN to update clients
			const userRole = await getUserRole(session.user.id);
			if (userRole !== "AGENCY_ADMIN" && userRole !== "AGENCY_SUPER_ADMIN") {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You do not have permission to update clients",
				});
			}

			const userId = session.user.id;

			// Batch: Find user and check email availability in parallel (if email is being changed)
			const [existingUser, emailExists] = await Promise.all([
				db
					.select()
					.from(user)
					.where(eq(user.id, input.userId))
					.limit(1)
					.then((rows) => rows[0]),
				input.email
					? db
							.select({ id: user.id })
							.from(user)
							.where(eq(user.email, input.email))
							.limit(1)
							.then((rows) => rows.length > 0)
							.catch(() => false)
					: Promise.resolve(false),
			]);

			if (!existingUser) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "User not found",
				});
			}

			// Check if email is being changed and if it's already taken
			if (input.email && input.email !== existingUser.email && emailExists) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "A user with this email already exists",
				});
			}

			// Build update data
			const updateData: Record<string, unknown> = {
				updatedAt: new Date(),
			};

			if (input.name !== undefined) {
				updateData.name = input.name;
			}

			if (input.email !== undefined) {
				updateData.email = input.email;
			}

			if (input.role !== undefined) {
				updateData.role = input.role;
			}

			// Batch: Update user and log activity in a transaction
			const changedFields = Object.keys(updateData).filter(key => key !== "updatedAt");
			const updatedUser = await db.transaction(async (tx) => {
				await tx
					.update(user)
					.set(updateData)
					.where(eq(user.id, input.userId));

				const [updated] = await tx
					.select()
					.from(user)
					.where(eq(user.id, input.userId))
					.limit(1);

				if (!updated) {
					throw new TRPCError({
						code: "INTERNAL_SERVER_ERROR",
						message: "Failed to update user",
					});
				}

				await tx.insert(userActivityLog).values({
					id: crypto.randomUUID(),
					userId: updated.id,
					action: "ACCOUNT_UPDATED_BY_ADMIN",
					description: `Account updated by admin: ${session.user!.email}`,
					metadata: {
						updatedBy: userId,
						updatedByEmail: session.user!.email,
						changedFields,
						previousValues: {
							name: existingUser.name,
							email: existingUser.email,
							role: existingUser.role,
						},
						newValues: {
							name: updated.name,
							email: updated.email,
							role: updated.role,
						},
					},
					ipAddress: null,
					userAgent: null,
					createdAt: new Date(),
				});

				return updated;
			});

			return updateClientOutputSchema.parse({
				id: updatedUser.id,
				name: updatedUser.name,
				email: updatedUser.email,
				emailVerified: updatedUser.emailVerified,
				role: updatedUser.role,
				status: updatedUser.status,
				image: updatedUser.image,
				lastLoginAt: updatedUser.lastLoginAt,
				createdAt: updatedUser.createdAt,
				updatedAt: updatedUser.updatedAt,
			});
		}),

	// Change client status
	changeStatus: protectedProcedure
		.input(changeStatusInputSchema)
		.output(changeStatusOutputSchema)
		.mutation(async ({ ctx, input }) => {
			const session = ctx.session;
			if (!session?.user?.id) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "You must be logged in to change client status",
				});
			}

			// Only allow AGENCY_ADMIN and AGENCY_SUPER_ADMIN to change status
			const userRole = await getUserRole(session.user.id);
			if (userRole !== "AGENCY_ADMIN" && userRole !== "AGENCY_SUPER_ADMIN") {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You do not have permission to change client status",
				});
			}

			const userId = session.user.id;

			// Find the user
			const [existingUser] = await db
				.select()
				.from(user)
				.where(eq(user.id, input.userId))
				.limit(1);

			if (!existingUser) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "User not found",
				});
			}

			// Batch: Update status and log activity in a transaction
			// Determine specific action type based on status change
			let actionType = "STATUS_CHANGED_BY_ADMIN";
			let actionDescription = `Status changed from ${existingUser.status} to ${input.status} by admin: ${session.user.email}`;

			if (input.status === "DEACTIVATED" && existingUser.status !== "DEACTIVATED") {
				actionType = "ACCOUNT_DEACTIVATED_BY_ADMIN";
				actionDescription = `Account deactivated by admin: ${session.user.email}`;
			} else if (input.status === "ACTIVE" && existingUser.status === "DEACTIVATED") {
				actionType = "ACCOUNT_REACTIVATED_BY_ADMIN";
				actionDescription = `Account reactivated by admin: ${session.user.email}`;
			} else if (input.status === "BANNED" && existingUser.status !== "BANNED") {
				actionType = "ACCOUNT_BANNED_BY_ADMIN";
				actionDescription = `Account banned by admin: ${session.user.email}`;
			} else if (input.status === "ACTIVE" && existingUser.status === "BANNED") {
				actionType = "ACCOUNT_UNBANNED_BY_ADMIN";
				actionDescription = `Account unbanned by admin: ${session.user.email}`;
			} else if (input.status === "SUSPENDED" && existingUser.status !== "SUSPENDED") {
				actionType = "ACCOUNT_SUSPENDED_BY_ADMIN";
				actionDescription = `Account suspended by admin: ${session.user.email}`;
			} else if (input.status === "ACTIVE" && existingUser.status === "SUSPENDED") {
				actionType = "ACCOUNT_UNSUSPENDED_BY_ADMIN";
				actionDescription = `Account unsuspended by admin: ${session.user.email}`;
			}

			// Batch: Update status and log activity in a transaction
			await db.transaction(async (tx) => {
				await tx
					.update(user)
					.set({
						status: input.status,
						updatedAt: new Date(),
					})
					.where(eq(user.id, input.userId));

				await tx.insert(userActivityLog).values({
					id: crypto.randomUUID(),
					userId: input.userId,
					action: actionType,
					description: actionDescription,
					metadata: {
						changedBy: userId,
						changedByEmail: session.user!.email,
						previousStatus: existingUser.status,
						newStatus: input.status,
					},
					ipAddress: null,
					userAgent: null,
					createdAt: new Date(),
				});
			});

			return {
				success: true,
			};
		}),

	// Request password reset for client
	requestPasswordReset: protectedProcedure
		.input(requestPasswordResetInputSchema)
		.output(requestPasswordResetOutputSchema)
		.mutation(async ({ ctx, input }) => {
			const session = ctx.session;
			if (!session?.user?.id) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "You must be logged in to request password reset",
				});
			}

			// Only allow AGENCY_ADMIN and AGENCY_SUPER_ADMIN to request password reset
			const userRole = await getUserRole(session.user.id);
			if (userRole !== "AGENCY_ADMIN" && userRole !== "AGENCY_SUPER_ADMIN") {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You do not have permission to request password reset",
				});
			}

			// Find the user
			const [targetUser] = await db
				.select()
				.from(user)
				.where(eq(user.id, input.userId))
				.limit(1);

			if (!targetUser) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "User not found",
				});
			}

			// Request password reset using Better Auth
			try {
				await auth.api.requestPasswordReset({
					body: {
						email: targetUser.email,
					},
				});

				// Log activity
				await db.insert(userActivityLog).values({
					id: crypto.randomUUID(),
					userId: targetUser.id,
					action: "PASSWORD_RESET_REQUESTED_BY_ADMIN",
					description: `Password reset requested by admin: ${session.user.email}`,
					metadata: {
						requestedBy: session.user.id,
						requestedByEmail: session.user.email,
					},
					ipAddress: null,
					userAgent: null,
					createdAt: new Date(),
				});

				return {
					success: true,
				};
			} catch (error) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to send password reset email",
				});
			}
		}),

	// Get client sessions
	getSessions: protectedProcedure
		.input(getClientSessionsInputSchema)
		.output(getClientSessionsOutputSchema)
		.query(async ({ ctx, input }) => {
			const session = ctx.session;
			if (!session?.user?.id) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "You must be logged in to view sessions",
				});
			}

			// Only allow AGENCY_ADMIN and AGENCY_SUPER_ADMIN to view sessions
			const userRole = await getUserRole(session.user.id);
			if (userRole !== "AGENCY_ADMIN" && userRole !== "AGENCY_SUPER_ADMIN") {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You do not have permission to view sessions",
				});
			}

			// Verify the user exists
			const [targetUser] = await db
				.select({ id: user.id })
				.from(user)
				.where(eq(user.id, input.userId))
				.limit(1);

			if (!targetUser) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "User not found",
				});
			}

			// Get all sessions for the user
			const sessions = await db
				.select()
				.from(sessionTable)
				.where(eq(sessionTable.userId, input.userId))
				.orderBy(desc(sessionTable.createdAt));

			return sessions.map((session) => ({
				id: session.id,
				token: session.token.substring(0, 20) + "...", // Only show partial token for security
				expiresAt: session.expiresAt,
				createdAt: session.createdAt,
				updatedAt: session.updatedAt,
				ipAddress: session.ipAddress,
				userAgent: session.userAgent,
			}));
		}),

	// Get client profile information
	getProfile: protectedProcedure
		.input(getProfileInputSchema)
		.output(getProfileOutputSchema)
		.query(async ({ ctx, input }) => {
			const session = ctx.session;
			if (!session?.user?.id) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "You must be logged in to view profile",
				});
			}

			// Only allow AGENCY_ADMIN and AGENCY_SUPER_ADMIN to view profiles
			const userRole = await getUserRole(session.user.id);
			if (userRole !== "AGENCY_ADMIN" && userRole !== "AGENCY_SUPER_ADMIN") {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You do not have permission to view profiles",
				});
			}

			// Verify the user exists and is a customer
			const [targetUser] = await db
				.select()
				.from(user)
				.where(eq(user.id, input.userId))
				.limit(1);
			const [profile] = await db
				.select()
				.from(userProfile)
				.where(eq(userProfile.userId, input.userId))
				.limit(1);

			if (!targetUser) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "User not found",
				});
			}

			if (targetUser.role !== "CUSTOMER") {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "This user is not a customer",
				});
			}

			return {
				firstName: profile?.firstName || null,
				lastName: profile?.lastName || null,
				phone: profile?.phone || null,
				address: profile?.address || null,
				city: profile?.city || null,
				state: profile?.state || null,
				country: profile?.country || null,
				postalCode: profile?.postalCode || null,
			};
		}),

	// Update client profile information
	updateProfile: protectedProcedure
		.input(updateProfileInputSchema)
		.output(updateProfileOutputSchema)
		.mutation(async ({ ctx, input }) => {
			const session = ctx.session;
			if (!session?.user?.id) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "You must be logged in to update profile",
				});
			}

			// Only allow AGENCY_ADMIN and AGENCY_SUPER_ADMIN to update profiles
			const userRole = await getUserRole(session.user.id);
			if (userRole !== "AGENCY_ADMIN" && userRole !== "AGENCY_SUPER_ADMIN") {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You do not have permission to update profiles",
				});
			}

			const userId = session.user.id;

			// Find the user
			const [existingUser] = await db
				.select()
				.from(user)
				.where(eq(user.id, input.userId))
				.limit(1);
			const [existingProfile] = await db
				.select()
				.from(userProfile)
				.where(eq(userProfile.userId, input.userId))
				.limit(1);

			if (!existingUser) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "User not found",
				});
			}

			if (existingUser.role !== "CUSTOMER") {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "This user is not a customer",
				});
			}

			// Batch: Update user name, profile, and log activity in a transaction
			const { name, firstName, lastName, phone, address, city, state, country, postalCode } = input;
			const changedFields = Object.keys(input).filter(key => key !== "userId");

			await db.transaction(async (tx) => {
				// Update user name if provided
				if (name) {
					await tx
						.update(user)
						.set({
							name,
							updatedAt: new Date(),
						})
						.where(eq(user.id, input.userId));
				}

				// Prepare profile data
				const profileData = {
					firstName,
					lastName,
					phone,
					address,
					city,
					state,
					country,
					postalCode,
					updatedAt: new Date(),
				};

				// Update or create profile
				if (existingProfile) {
					await tx
						.update(userProfile)
						.set(profileData)
						.where(eq(userProfile.userId, input.userId));
				} else {
					await tx.insert(userProfile).values({
						id: crypto.randomUUID(),
						userId: input.userId,
						...profileData,
						createdAt: new Date(),
					});
				}

				// Log activity
				await tx.insert(userActivityLog).values({
					id: crypto.randomUUID(),
					userId: input.userId,
					action: "PROFILE_UPDATED_BY_ADMIN",
					description: `Profile updated by admin: ${session.user!.email}`,
					metadata: {
						updatedBy: userId,
						updatedByEmail: session.user!.email,
							changedFields,
							previousValues: {
								name: existingUser.name,
							firstName: existingProfile?.firstName || null,
							lastName: existingProfile?.lastName || null,
							phone: existingProfile?.phone || null,
							address: existingProfile?.address || null,
							city: existingProfile?.city || null,
							state: existingProfile?.state || null,
							country: existingProfile?.country || null,
							postalCode: existingProfile?.postalCode || null,
							},
						},
					ipAddress: null,
					userAgent: null,
						createdAt: new Date(),
				});
			});

			return {
				success: true,
				message: "Profile updated successfully",
			};
		}),

	// Get client integrations
	getIntegrations: protectedProcedure
		.input(getIntegrationsInputSchema)
		.output(getIntegrationsOutputSchema)
		.query(async ({ ctx, input }) => {
			const session = ctx.session;
			if (!session?.user?.id) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "You must be logged in to view integrations",
				});
			}

			// Only allow AGENCY_ADMIN and AGENCY_SUPER_ADMIN to view integrations
			const userRole = await getUserRole(session.user.id);
			if (userRole !== "AGENCY_ADMIN" && userRole !== "AGENCY_SUPER_ADMIN") {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You do not have permission to view integrations",
				});
			}

			// Verify the user exists and is a customer
			const [targetUser] = await db
				.select()
				.from(user)
				.where(eq(user.id, input.userId))
				.limit(1);

			if (!targetUser) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "User not found",
				});
			}

			if (targetUser.role !== "CUSTOMER") {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "This user is not a customer",
				});
			}

			const integrations = await db
				.select()
				.from(customerIntegration)
				.where(eq(customerIntegration.userId, input.userId))
				.orderBy(desc(customerIntegration.createdAt));

			return getIntegrationsOutputSchema.parse(integrations.map((integration) => ({
				id: integration.id,
				userId: integration.userId,
				platform: integration.platform,
				platformCustomerId: integration.platformCustomerId,
				isActive: integration.isActive,
				isCreated: integration.isCreated,
				createdBy: integration.createdBy,
				createdAt: integration.createdAt,
				lastSyncedAt: integration.lastSyncedAt,
				platformData: integration.platformData,
				updatedAt: integration.updatedAt,
			})));
		}),

	// Create client integration
	createIntegration: protectedProcedure
		.input(createIntegrationInputSchema)
		.output(createIntegrationOutputSchema)
		.mutation(async ({ ctx, input }) => {
			const session = ctx.session;
			if (!session?.user?.id) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "You must be logged in to create integrations",
				});
			}

			// Only allow AGENCY_ADMIN and AGENCY_SUPER_ADMIN to create integrations
			const userRole = await getUserRole(session.user.id);
			if (userRole !== "AGENCY_ADMIN" && userRole !== "AGENCY_SUPER_ADMIN") {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You do not have permission to create integrations",
				});
			}

			const userId = session.user.id;

			// Get user and profile information
			const [targetUser] = await db
				.select()
				.from(user)
				.where(eq(user.id, input.userId))
				.limit(1);
			const [profile] = await db
				.select()
				.from(userProfile)
				.where(eq(userProfile.userId, input.userId))
				.limit(1);

			if (!targetUser) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "User not found",
				});
			}

			if (targetUser.role !== "CUSTOMER") {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "This user is not a customer",
				});
			}

			// Check if integration already exists
			const [existingIntegration] = await db
				.select({ id: customerIntegration.id })
				.from(customerIntegration)
				.where(
					and(
						eq(customerIntegration.userId, input.userId),
						eq(customerIntegration.platform, input.platform),
					),
				)
				.limit(1);

			if (existingIntegration) {
				throw new TRPCError({
					code: "CONFLICT",
					message: `Integration for ${input.platform} already exists for this user`,
				});
			}

			// Validate that required profile data exists
			if (!profile) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "User profile information is required. Please complete the profile first.",
				});
			}

			const userProfileData = profile;

			// Validate required fields based on platform
			if (input.platform === "PLESK") {
				if (!targetUser.name || !targetUser.email) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "User name and email are required for Plesk integration",
					});
				}
			} else if (input.platform === "OPENPROVIDER") {
				if (!userProfileData.firstName || !userProfileData.lastName || !userProfileData.address || !userProfileData.city || 
					!userProfileData.country || !userProfileData.postalCode || !userProfileData.phone) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "Complete profile information (first name, last name, address, city, country, postal code, phone) is required for OpenProvider integration",
					});
				}
			}

			try {
				let platformCustomerId: string | null = null;
				let platformData: any = null;

				if (input.platform === "PLESK") {
					// Build Plesk customer creation XML
					const escapeXml = (str: string): string => {
						return str
							.replace(/&/g, '&amp;')
							.replace(/</g, '&lt;')
							.replace(/>/g, '&gt;')
							.replace(/"/g, '&quot;')
							.replace(/'/g, '&apos;');
					};

					const generateRandomLogin = () => {
						const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
						let result = '';
						for (let i = 0; i < 6; i++) {
							result += letters.charAt(Math.floor(Math.random() * letters.length));
						}
						return result;
					};

					const login = generateRandomLogin();
					const password = Math.random().toString(36).slice(-12) + 'A1!';

					const xmlRequest = `<?xml version="1.0" encoding="UTF-8"?>
<packet>
  <customer>
    <add>
      <gen_info>
						<pname>${escapeXml(targetUser.name)}</pname>
        <login>${escapeXml(login)}</login>
        <passwd>${escapeXml(password)}</passwd>
				        <email>${escapeXml(targetUser.email)}</email>
				        ${userProfileData.address ? `<address>${escapeXml(userProfileData.address)}</address>` : ''}
				        ${userProfileData.city ? `<city>${escapeXml(userProfileData.city)}</city>` : ''}
				        ${userProfileData.state ? `<state>${escapeXml(userProfileData.state)}</state>` : ''}
				        ${userProfileData.postalCode ? `<pcode>${escapeXml(String(userProfileData.postalCode))}</pcode>` : ''}
				        ${userProfileData.country ? `<country>${escapeXml(userProfileData.country === 'Kenya' ? 'KE' : userProfileData.country)}</country>` : ''}
        <locale>en-US</locale>
        <owner-id>1</owner-id>
      </gen_info>
    </add>
  </customer>
</packet>`;

					const { xml, isAuthError, isHostUnreachable } = await sendPleskXmlRequest(xmlRequest);

					if (isHostUnreachable) {
						throw new TRPCError({
							code: "SERVICE_UNAVAILABLE",
							message: "Plesk host is unreachable. Check network connectivity and server status.",
						});
					}

					if (isAuthError) {
						throw new TRPCError({
							code: "UNAUTHORIZED",
							message: "Invalid Plesk credentials",
						});
					}

					if (!xml || xml.trim() === '') {
						throw new TRPCError({
							code: "INTERNAL_SERVER_ERROR",
							message: "Empty response from Plesk server",
						});
					}

					const parser = new XMLParser({ ignoreAttributes: false });
					const parsed = parser.parse(xml);

					// Check for errors
					if (parsed.packet?.system?.status === 'error') {
						const errorCode = parsed.packet.system.errcode;
						const errorText = parsed.packet.system.errtext;
						throw new TRPCError({
							code: "BAD_REQUEST",
							message: `Plesk API Error ${errorCode}: ${errorText}`,
						});
					}

					if (parsed.packet?.customer?.add?.result?.status === 'error') {
						const errorCode = parsed.packet.customer.add.result.errcode;
						const errorText = parsed.packet.customer.add.result.errtext;
						
						if (errorCode === 1007 && errorText.includes('already exists')) {
							throw new TRPCError({
								code: "CONFLICT",
								message: `Customer already exists: ${errorText}`,
							});
						} else {
							throw new TRPCError({
								code: "BAD_REQUEST",
								message: `Customer creation failed: ${errorText}`,
							});
						}
					}

					// Extract customer ID
					if (parsed.packet?.customer?.add?.result?.status === 'ok' && parsed.packet.customer.add.result.id) {
						platformCustomerId = String(parsed.packet.customer.add.result.id);
						platformData = parsed.packet.customer.add.result;
					} else {
						throw new TRPCError({
							code: "INTERNAL_SERVER_ERROR",
							message: "Failed to get customer ID from Plesk response",
						});
					}
				} else if (input.platform === "OPENPROVIDER") {
					// Parse phone number for OpenProvider format
					const phoneStr = userProfileData.phone || "";
					// Simple parsing - assume format like "+254 700 000 000" or "254700000000"
					const phoneDigits = phoneStr.replace(/\D/g, "");
					let countryCode = "";
					let areaCode = "";
					let subscriberNumber = "";

					if (phoneDigits.startsWith("254")) {
						countryCode = "254";
						const remaining = phoneDigits.slice(3);
						if (remaining.length >= 9) {
							areaCode = remaining.slice(0, 2);
							subscriberNumber = remaining.slice(2);
						} else {
							areaCode = remaining.slice(0, 1);
							subscriberNumber = remaining.slice(1);
						}
					} else if (phoneDigits.length >= 9) {
						countryCode = "254"; // Default to Kenya
						areaCode = phoneDigits.slice(0, 2);
						subscriberNumber = phoneDigits.slice(2);
					} else {
						throw new TRPCError({
							code: "BAD_REQUEST",
							message: "Invalid phone number format. Please use format: +254 700 000 000",
						});
					}

					// Parse address - split street and number
					const addressParts = (userProfileData.address || "").split(/\s+/);
					const street = addressParts.slice(0, -1).join(" ") || userProfileData.address || "";
					const number = addressParts[addressParts.length - 1] || "1";

					// Normalize country code - always use "KE" for Kenya
					// OpenProvider requires ISO 3166-1 alpha-2 country codes
					const addressCountryCode = "KE"; // Always default to Kenya (KE)

					// Prepare OpenProvider customer data
					const openProviderData: OpenProviderCustomerRequest = {
						name: {
							first_name: userProfileData.firstName!,
							last_name: userProfileData.lastName!,
						},
						address: {
							street: street,
							number: number,
							zipcode: userProfileData.postalCode!,
							city: userProfileData.city!,
							country: addressCountryCode, // Always use "KE" for Kenya
							state: userProfileData.state || undefined,
						},
						phone: {
							country_code: countryCode, // Phone country code (254 for Kenya)
							area_code: areaCode,
							subscriber_number: subscriberNumber,
						},
						email: targetUser.email,
					};

					// Create OpenProvider client and authenticate
					const client = createOpenProviderClient();
					
					try {
						await client.authenticate({
							username: process.env.OPENPROVIDER_USERNAME!,
							password: process.env.OPENPROVIDER_PASSWORD!,
							ip: process.env.OPENPROVIDER_IP,
						});
					} catch (authError) {
						throw new TRPCError({
							code: 'INTERNAL_SERVER_ERROR',
							message: 'OpenProvider service unavailable. Please check server configuration.',
						});
					}

					// Create customer
					const response = await client.createCustomer(openProviderData);
					
					if (response.code !== 0) {
						throw new TRPCError({
							code: 'BAD_REQUEST',
							message: response.desc || 'Failed to create customer on OpenProvider',
						});
					}

					if (response.data?.handle) {
						platformCustomerId = response.data.handle;
						platformData = response.data;
					} else {
						throw new TRPCError({
							code: "INTERNAL_SERVER_ERROR",
							message: "Failed to get customer handle from OpenProvider response",
						});
					}
				}

				// Batch: Create integration and log activities in a transaction
				const integration = await db.transaction(async (tx) => {
					const integrationId = crypto.randomUUID();
					const now = new Date();
					await tx.insert(customerIntegration).values({
						id: integrationId,
						userId: input.userId,
						platform: input.platform,
						platformCustomerId,
						isActive: true,
						isCreated: true,
						createdBy: userId,
						createdAt: now,
						updatedAt: now,
						platformData,
						lastSyncedAt: null,
					});

					const [integration] = await tx
						.select()
						.from(customerIntegration)
						.where(eq(customerIntegration.id, integrationId))
						.limit(1);
					if (!integration) {
						throw new TRPCError({
							code: "INTERNAL_SERVER_ERROR",
							message: "Failed to create integration",
						});
					}

					// Log activities in parallel
					await Promise.all([
						tx.insert(customerIntegrationActivityLog).values({
								id: crypto.randomUUID(),
								userId: input.userId,
								customerIntegrationId: integration.id,
								action: "CREATE",
							description: `Customer integration created for ${input.platform} by admin: ${session.user!.email}`,
							metadata: {
								createdBy: userId,
								createdByEmail: session.user!.email,
									platform: input.platform,
									platformCustomerId,
								},
								ipAddress: null,
								userAgent: null,
								createdAt: new Date(),
						}),
						tx.insert(userActivityLog).values({
								id: crypto.randomUUID(),
								userId: input.userId,
								action: "CUSTOMER_INTEGRATION_CREATED_BY_ADMIN",
							description: `Customer integration created for ${input.platform} by admin: ${session.user!.email}`,
							metadata: {
								createdBy: userId,
								createdByEmail: session.user!.email,
									platform: input.platform,
									platformCustomerId,
									integrationId: integration.id,
								},
								ipAddress: null,
								userAgent: null,
								createdAt: new Date(),
						}),
					]);

					return integration;
				});

				return createIntegrationOutputSchema.parse({
					id: integration.id,
					userId: integration.userId,
					platform: integration.platform,
					platformCustomerId: integration.platformCustomerId,
					isActive: integration.isActive,
					isCreated: integration.isCreated,
					createdBy: integration.createdBy,
					createdAt: integration.createdAt,
					lastSyncedAt: integration.lastSyncedAt,
					platformData: integration.platformData,
					updatedAt: integration.updatedAt,
				});
			} catch (error) {
				if (error instanceof TRPCError) {
					throw error;
				}
				console.error(`Failed to create ${input.platform} integration:`, error);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: `Failed to create ${input.platform} integration: ${error instanceof Error ? error.message : "Unknown error"}`,
				});
			}
		}),

	// Check email verification status for OpenProvider integration
	checkEmailVerification: protectedProcedure
		.input(checkEmailVerificationInputSchema)
		.output(checkEmailVerificationOutputSchema)
		.query(async ({ ctx, input }) => {
			const session = ctx.session;
			if (!session?.user?.id) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "You must be logged in to check email verification status",
				});
			}

			// Only allow AGENCY_ADMIN and AGENCY_SUPER_ADMIN to check verification
			const userRole = await getUserRole(session.user.id);
			if (userRole !== "AGENCY_ADMIN" && userRole !== "AGENCY_SUPER_ADMIN") {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You do not have permission to check email verification status",
				});
			}

			// Get integration
			const [integration] = await db
				.select()
				.from(customerIntegration)
				.where(eq(customerIntegration.id, input.integrationId))
				.limit(1);

			if (!integration) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Integration not found",
				});
			}

			if (integration.userId !== input.userId) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Integration does not belong to this user",
				});
			}

			if (integration.platform !== "OPENPROVIDER") {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Email verification is only available for OpenProvider integrations",
				});
			}

			if (!integration.platformCustomerId) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Integration does not have a platform customer ID",
				});
			}

			try {
				// Create OpenProvider client and authenticate
				const client = createOpenProviderClient();

				try {
					await client.authenticate({
						username: process.env.OPENPROVIDER_USERNAME!,
						password: process.env.OPENPROVIDER_PASSWORD!,
						ip: process.env.OPENPROVIDER_IP,
					});
				} catch (authError) {
					throw new TRPCError({
						code: 'INTERNAL_SERVER_ERROR',
						message: 'OpenProvider service unavailable. Please check server configuration.',
					});
				}

				// Check email verification status
				const [integrationUser] = await db
					.select({ email: user.email })
					.from(user)
					.where(eq(user.id, integration.userId))
					.limit(1);
				if (!integrationUser) {
					throw new TRPCError({ code: "NOT_FOUND", message: "Integration user not found" });
				}

				const response = await client.checkEmailVerificationStatus({
					handle: integration.platformCustomerId,
					email: integrationUser.email,
				});

				if (response.code !== 0) {
					throw new TRPCError({
						code: 'BAD_REQUEST',
						message: response.desc || 'Failed to check email verification status',
					});
				}

				// Parse response to determine verification status
				const results = response.data?.results || [];
				const verifiedDomains = results.filter((r: any) => r.status === 'verified');
				const isVerified = verifiedDomains.length > 0;
				const latestStatus = results.length > 0 ? results[0].status : null;

				return {
					isVerified,
					status: latestStatus,
					email: integrationUser.email,
					handle: integration.platformCustomerId,
					domains: results.map((r: any) => ({
						domain: r.domain || '',
						status: r.status || 'unknown',
						expiration_date: r.expiration_date || null,
						is_suspended: r.is_suspended || false,
					})),
				};
			} catch (error) {
				if (error instanceof TRPCError) {
					throw error;
				}
				console.error('Failed to check email verification status:', error);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: `Failed to check email verification status: ${error instanceof Error ? error.message : "Unknown error"}`,
				});
			}
		}),

	// Send email verification for OpenProvider integration
	sendEmailVerification: protectedProcedure
		.input(sendEmailVerificationInputSchema)
		.output(sendEmailVerificationOutputSchema)
		.mutation(async ({ ctx, input }) => {
			const session = ctx.session;
			if (!session?.user?.id) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "You must be logged in to send email verification",
				});
			}

			// Only allow AGENCY_ADMIN and AGENCY_SUPER_ADMIN to send verification
			const userRole = await getUserRole(session.user.id);
			if (userRole !== "AGENCY_ADMIN" && userRole !== "AGENCY_SUPER_ADMIN") {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You do not have permission to send email verification",
				});
			}

			const userId = session.user.id;

			// Get integration
			const [integration] = await db
				.select()
				.from(customerIntegration)
				.where(eq(customerIntegration.id, input.integrationId))
				.limit(1);

			if (!integration) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Integration not found",
				});
			}

			if (integration.userId !== input.userId) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Integration does not belong to this user",
				});
			}

			if (integration.platform !== "OPENPROVIDER") {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Email verification is only available for OpenProvider integrations",
				});
			}

			if (!integration.platformCustomerId) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Integration does not have a platform customer ID",
				});
			}

			const [integrationUser] = await db
				.select({ email: user.email })
				.from(user)
				.where(eq(user.id, integration.userId))
				.limit(1);
			if (!integrationUser?.email) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "User email is required for email verification",
				});
			}

			try {
				// Create OpenProvider client and authenticate
				const client = createOpenProviderClient();

				try {
					await client.authenticate({
						username: process.env.OPENPROVIDER_USERNAME!,
						password: process.env.OPENPROVIDER_PASSWORD!,
						ip: process.env.OPENPROVIDER_IP,
					});
				} catch (authError) {
					throw new TRPCError({
						code: 'INTERNAL_SERVER_ERROR',
						message: 'OpenProvider service unavailable. Please check server configuration.',
					});
				}

				// Start email verification
				const response = await client.startEmailVerification({
					email: integrationUser.email,
					handle: integration.platformCustomerId,
					language: input.language || "en",
				});

				// Handle OpenProvider specific error codes
				// Code 20001 means "Verification email in progress" - this is actually a success state
				if (response.code !== 0 && response.code !== 20001) {
					throw new TRPCError({
						code: 'BAD_REQUEST',
						message: response.desc || 'Failed to send email verification',
					});
				}

				// If code is 20001, the email is already in progress - treat as success
				const isAlreadyInProgress = response.code === 20001;
				const successMessage = isAlreadyInProgress 
					? "Verification email is already in progress. Please check your email inbox."
					: "Email verification sent successfully";

				// Batch: Log activities in a transaction
				await db.transaction(async (tx) => {
					await Promise.all([
						tx.insert(customerIntegrationActivityLog).values({
								id: crypto.randomUUID(),
								userId: input.userId,
								customerIntegrationId: integration.id,
								action: "SEND_EMAIL_VERIFICATION",
								description: `Email verification sent for OpenProvider integration by admin: ${session.user!.email}`,
								metadata: {
									sentBy: userId,
									sentByEmail: session.user!.email,
									platform: "OPENPROVIDER",
									email: integrationUser.email,
									handle: integration.platformCustomerId,
									language: input.language || "en",
									verificationId: response.data?.id || null,
								},
								ipAddress: null,
								userAgent: null,
								createdAt: new Date(),
						}),
						tx.insert(userActivityLog).values({
								id: crypto.randomUUID(),
								userId: input.userId,
								action: "OPENPROVIDER_EMAIL_VERIFICATION_SENT_BY_ADMIN",
								description: `Email verification sent for OpenProvider integration by admin: ${session.user!.email}`,
								metadata: {
									sentBy: userId,
									sentByEmail: session.user!.email,
									platform: "OPENPROVIDER",
									integrationId: integration.id,
									email: integrationUser.email,
									handle: integration.platformCustomerId,
									verificationId: response.data?.id || null,
								},
								ipAddress: null,
								userAgent: null,
								createdAt: new Date(),
						}),
					]);
				});

				return {
					success: true,
					message: successMessage,
					verificationId: response.data?.id || null,
				};
			} catch (error: unknown) {
				if (error instanceof TRPCError) {
					throw error;
				}
				
				// Handle OpenProvider API error code 20001 - "Verification email in progress"
				// This is actually a success state, not an error
				if (error instanceof OpenProviderApiError && error.code === 20001) {
					const successMessage = "Verification email is already in progress. Please check your email inbox.";
					
					// Batch: Log activities for "in progress" case in a transaction
					await db.transaction(async (tx) => {
						await Promise.all([
							tx.insert(customerIntegrationActivityLog).values({
									id: crypto.randomUUID(),
									userId: input.userId,
									customerIntegrationId: integration.id,
									action: "SEND_EMAIL_VERIFICATION",
									description: `Email verification already in progress for OpenProvider integration by admin: ${session.user!.email}`,
									metadata: {
										sentBy: userId,
										sentByEmail: session.user!.email,
										platform: "OPENPROVIDER",
										email: integrationUser.email,
										handle: integration.platformCustomerId,
										language: input.language || "en",
										status: "already_in_progress",
										errorCode: 20001,
									},
									ipAddress: null,
									userAgent: null,
									createdAt: new Date(),
							}),
							tx.insert(userActivityLog).values({
									id: crypto.randomUUID(),
									userId: input.userId,
									action: "OPENPROVIDER_EMAIL_VERIFICATION_SENT_BY_ADMIN",
									description: `Email verification already in progress for OpenProvider integration by admin: ${session.user!.email}`,
									metadata: {
										sentBy: userId,
										sentByEmail: session.user!.email,
										platform: "OPENPROVIDER",
										integrationId: integration.id,
										email: integrationUser.email,
										handle: integration.platformCustomerId,
										status: "already_in_progress",
										errorCode: 20001,
									},
									ipAddress: null,
									userAgent: null,
									createdAt: new Date(),
							}),
						]);
					});

					return {
						success: true,
						message: successMessage,
						verificationId: null,
					};
				}
				
				console.error('Failed to send email verification:', error);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: `Failed to send email verification: ${error instanceof Error ? error.message : "Unknown error"}`,
				});
			}
		}),
});

