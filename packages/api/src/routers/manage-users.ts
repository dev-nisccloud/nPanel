import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import { TRPCError } from "@trpc/server";
import { desc, eq, inArray } from "@npanel/db";
import { randomUUID } from "node:crypto";

import { db } from "@npanel/db";
import { session as sessionTable, user } from "@npanel/db/schema/auth";
import { userActivityLog, userProfile } from "@npanel/db/schema/auth-extras";
import { auth } from "@npanel/auth";
import { renderAgencyUserCreatedEmail } from "../lib/email-templates";
import { sendEmail } from "react-email-starter/src/email";

// ============================================================================
// ZOD SCHEMAS - Independent from database schema
// ============================================================================

const getAllUsersInputSchema = z.object({}).optional().default({});

const userOutputSchema = z.object({
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

const getAllUsersOutputSchema = z.array(userOutputSchema);

const createUserInputSchema = z.object({
	name: z.string().min(1, "Name is required"),
	email: z.string().email("Invalid email address"),
	password: z.string().min(8, "Password must be at least 8 characters"),
	role: z.enum(["AGENCY_ADMIN", "AGENCY_SUPER_ADMIN", "AGENCY_USER"]),
});

const createUserOutputSchema = userOutputSchema;

const updateUserInputSchema = z.object({
	userId: z.string(),
	name: z.string().optional(),
	email: z.string().email("Invalid email address").optional(),
	role: z.enum(["AGENCY_ADMIN", "AGENCY_SUPER_ADMIN", "AGENCY_USER"]).optional(),
}).refine(
	(data) => {
		// At least one field must be provided for update
		return data.name !== undefined || data.email !== undefined || data.role !== undefined;
	},
	{
		message: "At least one field must be provided for update",
	},
);

const updateUserOutputSchema = userOutputSchema;

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

const getUserSessionsInputSchema = z.object({
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

const getUserSessionsOutputSchema = z.array(sessionOutputSchema);

const getByIdInputSchema = z.object({
	userId: z.string(),
});

const getByIdOutputSchema = userOutputSchema;

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

type AgencyUserOutput = z.infer<typeof userOutputSchema>;

const isAgencyRole = (role: string | null | undefined) =>
	["AGENCY_USER", "AGENCY_ADMIN", "AGENCY_SUPER_ADMIN"].includes(role ?? "");

// ============================================================================
// tRPC ROUTER
// ============================================================================

export const manageUsersRouter = router({
	// Get all agency users (AGENCY_ADMIN, AGENCY_SUPER_ADMIN, AGENCY_USER)
	getAll: protectedProcedure
		.input(getAllUsersInputSchema)
		.output(getAllUsersOutputSchema)
		.query(async ({ ctx, input: _input }) => {
			const session = ctx.session;
			if (!session?.user?.id) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "You must be logged in to view users",
				});
			}

			// Any agency role can view users
			const userRole = session.user.role;
			if (!isAgencyRole(userRole)) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You do not have permission to view users",
				});
			}

			const users = await db
				.select()
				.from(user)
				.where(
					inArray(user.role, ["AGENCY_ADMIN", "AGENCY_SUPER_ADMIN", "AGENCY_USER"]),
				)
				.orderBy(desc(user.createdAt));

			return users.map((row) =>
				userOutputSchema.parse({
					id: row.id,
					name: row.name,
					email: row.email,
					emailVerified: row.emailVerified,
					role: row.role,
					status: row.status,
					image: row.image,
					lastLoginAt: row.lastLoginAt,
					createdAt: row.createdAt,
					updatedAt: row.updatedAt,
				}),
			);
		}),

	// Get user by ID
	getById: protectedProcedure
		.input(getByIdInputSchema)
		.output(getByIdOutputSchema)
		.query(async ({ ctx, input }) => {
			const session = ctx.session;
			if (!session?.user?.id) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "You must be logged in to view user details",
				});
			}

			// Any agency role can view user details
			const userRole = session.user.role;
			if (!isAgencyRole(userRole)) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You do not have permission to view user details",
				});
			}

			const userRows = await db
				.select()
				.from(user)
				.where(eq(user.id, input.userId))
				.limit(1);
			const userRow = userRows[0];

			if (!userRow) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "User not found",
				});
			}

			// Only return agency users
			if (!["AGENCY_ADMIN", "AGENCY_SUPER_ADMIN", "AGENCY_USER"].includes(userRow.role)) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "This user is not an agency user",
				});
			}

			return {
				id: userRow.id,
				name: userRow.name,
				email: userRow.email,
				emailVerified: userRow.emailVerified,
				role: userRow.role as AgencyUserOutput["role"],
				status: userRow.status as AgencyUserOutput["status"],
				image: userRow.image,
				lastLoginAt: userRow.lastLoginAt,
				createdAt: userRow.createdAt,
				updatedAt: userRow.updatedAt,
			};
		}),

	// Create a new agency user
	create: protectedProcedure
		.input(createUserInputSchema)
		.output(createUserOutputSchema)
		.mutation(async ({ ctx, input }) => {
			const session = ctx.session;
			if (!session?.user?.id) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "You must be logged in to create users",
				});
			}

			// Only allow AGENCY_SUPER_ADMIN to create users (more restrictive than clients)
			const userRole = session.user.role;
			if (userRole !== "AGENCY_SUPER_ADMIN") {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You do not have permission to create users",
				});
			}

			const userId = session.user.id;

			// Check if user with this email already exists
			const existingRows = await db
				.select({ id: user.id })
				.from(user)
				.where(eq(user.email, input.email))
				.limit(1);
			const existingUser = existingRows[0];

			if (existingUser) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "A user with this email already exists",
				});
			}

			// Use Better Auth's signUpEmail API to create the user
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
			
			// Check if signupResult has an error property
			if ('error' in signupResult && signupResult.error) {
				const errorMessage = typeof signupResult.error === 'object' && 'message' in signupResult.error 
					? String(signupResult.error.message) 
					: "Failed to create user account";
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: errorMessage,
				});
			}

			// Batch: Get user, update role, and return updated user
			// This reduces connection usage from 3 sequential queries to 1-2 queries
			const createdRows = await db
				.select()
				.from(user)
				.where(eq(user.email, input.email))
				.limit(1);
			let updatedUser = createdRows[0];

			if (!updatedUser) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "User was created but could not be retrieved",
				});
			}

			// Update user role to the specified role (Better Auth defaults to CUSTOMER)
			const afterRoleRows = await db
				.update(user)
				.set({ role: input.role })
				.where(eq(user.id, updatedUser.id))
				.returning();
			updatedUser = afterRoleRows[0];

			if (!updatedUser) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "User could not be retrieved after role update",
				});
			}

			// Send custom credentials email for agency user
			try {
				const frontendUrl = process.env.CORS_ORIGIN || "http://localhost:3002";
				const loginLink = `${frontendUrl}/auth/login`;

				const html = await renderAgencyUserCreatedEmail({
					userFirstname: input.name,
					email: input.email,
					password: input.password,
					role: input.role,
					loginLink,
				});

				await sendEmail({
					to: input.email,
					subject: "Your agency account has been created - Nisc Cloud",
					html,
				});
			} catch (emailError) {
				console.error("Failed to send agency user creation email:", emailError);
			}

			// Log activity
			await db.insert(userActivityLog).values({
				id: randomUUID(),
				userId: updatedUser.id,
				action: "AGENCY_USER_CREATED_BY_ADMIN",
				description: `Agency user account created by admin: ${session.user.email}`,
				metadata: {
					createdBy: userId,
					createdByEmail: session.user.email,
					role: input.role,
				},
				createdAt: new Date(),
			});

			return {
				id: updatedUser.id,
				name: updatedUser.name,
				email: updatedUser.email,
				emailVerified: updatedUser.emailVerified,
				role: updatedUser.role as AgencyUserOutput["role"],
				status: updatedUser.status as AgencyUserOutput["status"],
				image: updatedUser.image,
				lastLoginAt: updatedUser.lastLoginAt,
				createdAt: updatedUser.createdAt,
				updatedAt: updatedUser.updatedAt,
			};
		}),

	// Update user
	update: protectedProcedure
		.input(updateUserInputSchema)
		.output(updateUserOutputSchema)
		.mutation(async ({ ctx, input }) => {
			const session = ctx.session;
			if (!session?.user?.id) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "You must be logged in to update users",
				});
			}

			// Only allow AGENCY_SUPER_ADMIN to update users
			const userRole = session.user.role;
			if (userRole !== "AGENCY_SUPER_ADMIN") {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You do not have permission to update users",
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
							.then((rows) => {
								const r = rows[0];
								return r != null && r.id !== input.userId;
							})
							.catch(() => false)
					: Promise.resolve(false),
			]);

			if (!existingUser) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "User not found",
				});
			}

			// Verify it's an agency user
			if (!["AGENCY_ADMIN", "AGENCY_SUPER_ADMIN", "AGENCY_USER"].includes(existingUser.role)) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "This user is not an agency user",
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
			const updateData: any = {
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
				const updatedRows = await tx
					.update(user)
					.set(updateData)
					.where(eq(user.id, input.userId))
					.returning();
				const updated = updatedRows[0];
				if (!updated) {
					throw new TRPCError({
						code: "INTERNAL_SERVER_ERROR",
						message: "Failed to update user",
					});
				}

				// Log activity
				await tx.insert(userActivityLog).values({
					id: randomUUID(),
					userId: updated.id,
					action: "AGENCY_USER_UPDATED_BY_ADMIN",
					description: `Agency user account updated by admin: ${session.user!.email}`,
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
					createdAt: new Date(),
				});

				return updated;
			});

			return {
				id: updatedUser.id,
				name: updatedUser.name,
				email: updatedUser.email,
				emailVerified: updatedUser.emailVerified,
				role: updatedUser.role as AgencyUserOutput["role"],
				status: updatedUser.status as AgencyUserOutput["status"],
				image: updatedUser.image,
				lastLoginAt: updatedUser.lastLoginAt,
				createdAt: updatedUser.createdAt,
				updatedAt: updatedUser.updatedAt,
			};
		}),

	// Change user status
	changeStatus: protectedProcedure
		.input(changeStatusInputSchema)
		.output(changeStatusOutputSchema)
		.mutation(async ({ ctx, input }) => {
			const session = ctx.session;
			if (!session?.user?.id) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "You must be logged in to change user status",
				});
			}

			// Only allow AGENCY_SUPER_ADMIN to change status
			const userRole = session.user.role;
			if (userRole !== "AGENCY_SUPER_ADMIN") {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You do not have permission to change user status",
				});
			}

			const userId = session.user.id;

			// Find the user
			const statusUserRows = await db
				.select()
				.from(user)
				.where(eq(user.id, input.userId))
				.limit(1);
			const existingUser = statusUserRows[0];

			if (!existingUser) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "User not found",
				});
			}

			// Verify it's an agency user
			if (!["AGENCY_ADMIN", "AGENCY_SUPER_ADMIN", "AGENCY_USER"].includes(existingUser.role)) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "This user is not an agency user",
				});
			}

			// Determine specific action type based on status change
			let actionType = "AGENCY_USER_STATUS_CHANGED_BY_ADMIN";
			let actionDescription = `Status changed from ${existingUser.status} to ${input.status} by admin: ${session.user.email}`;

			if (input.status === "DEACTIVATED" && existingUser.status !== "DEACTIVATED") {
				actionType = "AGENCY_USER_DEACTIVATED_BY_ADMIN";
				actionDescription = `Agency user account deactivated by admin: ${session.user.email}`;
			} else if (input.status === "ACTIVE" && existingUser.status === "DEACTIVATED") {
				actionType = "AGENCY_USER_REACTIVATED_BY_ADMIN";
				actionDescription = `Agency user account reactivated by admin: ${session.user.email}`;
			} else if (input.status === "BANNED" && existingUser.status !== "BANNED") {
				actionType = "AGENCY_USER_BANNED_BY_ADMIN";
				actionDescription = `Agency user account banned by admin: ${session.user.email}`;
			} else if (input.status === "ACTIVE" && existingUser.status === "BANNED") {
				actionType = "AGENCY_USER_UNBANNED_BY_ADMIN";
				actionDescription = `Agency user account unbanned by admin: ${session.user.email}`;
			} else if (input.status === "SUSPENDED" && existingUser.status !== "SUSPENDED") {
				actionType = "AGENCY_USER_SUSPENDED_BY_ADMIN";
				actionDescription = `Agency user account suspended by admin: ${session.user.email}`;
			} else if (input.status === "ACTIVE" && existingUser.status === "SUSPENDED") {
				actionType = "AGENCY_USER_UNSUSPENDED_BY_ADMIN";
				actionDescription = `Agency user account unsuspended by admin: ${session.user.email}`;
			}

			// Batch: Update status and log activity in a transaction
			await db.transaction(async (tx) => {
				const updatedRows = await tx
					.update(user)
					.set({
						status: input.status,
						updatedAt: new Date(),
					})
					.where(eq(user.id, input.userId))
					.returning();
				const updated = updatedRows[0];
				if (!updated) {
					throw new TRPCError({
						code: "INTERNAL_SERVER_ERROR",
						message: "Failed to update user status",
					});
				}

				// Log activity with specific action type
				await tx.insert(userActivityLog).values({
					id: randomUUID(),
					userId: updated.id,
					action: actionType,
					description: actionDescription,
					metadata: {
						changedBy: userId,
						changedByEmail: session.user!.email,
						previousStatus: existingUser.status,
						newStatus: input.status,
					},
					createdAt: new Date(),
				});
			});

			return {
				success: true,
			};
		}),

	// Request password reset for user
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

			// Only allow AGENCY_SUPER_ADMIN to request password reset
			const userRole = session.user.role;
			if (userRole !== "AGENCY_SUPER_ADMIN") {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You do not have permission to request password reset",
				});
			}

			// Find the user
			const resetUserRows = await db
				.select()
				.from(user)
				.where(eq(user.id, input.userId))
				.limit(1);
			const targetUser = resetUserRows[0];

			if (!targetUser) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "User not found",
				});
			}

			// Verify it's an agency user
			if (!["AGENCY_ADMIN", "AGENCY_SUPER_ADMIN", "AGENCY_USER"].includes(targetUser.role)) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "This user is not an agency user",
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
					id: randomUUID(),
					userId: targetUser.id,
					action: "AGENCY_USER_PASSWORD_RESET_REQUESTED_BY_ADMIN",
					description: `Password reset requested for agency user by admin: ${session.user.email}`,
					metadata: {
						requestedBy: session.user.id,
						requestedByEmail: session.user.email,
					},
					createdAt: new Date(),
				});

				return {
					success: true,
				};
			} catch (_error) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to send password reset email",
				});
			}
		}),

	// Get user sessions
	getSessions: protectedProcedure
		.input(getUserSessionsInputSchema)
		.output(getUserSessionsOutputSchema)
		.query(async ({ ctx, input }) => {
			const session = ctx.session;
			if (!session?.user?.id) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "You must be logged in to view sessions",
				});
			}

			// Any agency role can view sessions
			const userRole = session.user.role;
			if (!isAgencyRole(userRole)) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You do not have permission to view sessions",
				});
			}

			// Verify the user exists and is an agency user
			const sessUserRows = await db
				.select()
				.from(user)
				.where(eq(user.id, input.userId))
				.limit(1);
			const sessUser = sessUserRows[0];

			if (!sessUser) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "User not found",
				});
			}

			if (!["AGENCY_ADMIN", "AGENCY_SUPER_ADMIN", "AGENCY_USER"].includes(sessUser.role)) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "This user is not an agency user",
				});
			}

			// Get all sessions for the user
			const sessions = await db
				.select()
				.from(sessionTable)
				.where(eq(sessionTable.userId, input.userId))
				.orderBy(desc(sessionTable.createdAt));

			return sessions.map((sess) => ({
				id: sess.id,
				token: sess.token.substring(0, 20) + "...", // Only show partial token for security
				expiresAt: sess.expiresAt,
				createdAt: sess.createdAt,
				updatedAt: sess.updatedAt,
				ipAddress: sess.ipAddress,
				userAgent: sess.userAgent,
			}));
		}),

	// Get agency user profile information
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

			// Any agency role can view profiles
			const userRole = session.user.role;
			if (!isAgencyRole(userRole)) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You do not have permission to view profiles",
				});
			}

			// Verify the user exists and is an agency user
			const profileUserRows = await db
				.select()
				.from(user)
				.where(eq(user.id, input.userId))
				.limit(1);
			const profileUser = profileUserRows[0];

			if (!profileUser) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "User not found",
				});
			}

			if (!["AGENCY_ADMIN", "AGENCY_SUPER_ADMIN", "AGENCY_USER"].includes(profileUser.role)) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "This user is not an agency user",
				});
			}

			const profileRows = await db
				.select()
				.from(userProfile)
				.where(eq(userProfile.userId, input.userId))
				.limit(1);
			const prof = profileRows[0];

			return {
				firstName: prof?.firstName ?? null,
				lastName: prof?.lastName ?? null,
				phone: prof?.phone ?? null,
				address: prof?.address ?? null,
				city: prof?.city ?? null,
				state: prof?.state ?? null,
				country: prof?.country ?? null,
				postalCode: prof?.postalCode ?? null,
			};
		}),

	// Update agency user profile information
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

			// Only allow AGENCY_SUPER_ADMIN to update profiles
			const userRole = session.user.role;
			if (userRole !== "AGENCY_SUPER_ADMIN") {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You do not have permission to update profiles",
				});
			}

			const userId = session.user.id;

			const updUserRows = await db
				.select()
				.from(user)
				.where(eq(user.id, input.userId))
				.limit(1);
			const existingUser = updUserRows[0];

			if (!existingUser) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "User not found",
				});
			}

			if (!["AGENCY_ADMIN", "AGENCY_SUPER_ADMIN", "AGENCY_USER"].includes(existingUser.role)) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "This user is not an agency user",
				});
			}

			const updProfileRows = await db
				.select()
				.from(userProfile)
				.where(eq(userProfile.userId, input.userId))
				.limit(1);
			const existingProfile = updProfileRows[0];

			// Batch: Update user name, profile, and log activity in a transaction
			const { name, firstName, lastName, phone, address, city, state, country, postalCode } = input;
			const changedFields = Object.keys(input).filter((key) => key !== "userId");

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
						id: randomUUID(),
						userId: input.userId,
						...profileData,
						createdAt: new Date(),
					});
				}

				// Log activity
				await tx.insert(userActivityLog).values({
					id: randomUUID(),
					userId: input.userId,
					action: "AGENCY_USER_PROFILE_UPDATED_BY_ADMIN",
					description: `Agency user profile updated by admin: ${session.user!.email}`,
					metadata: {
						updatedBy: userId,
						updatedByEmail: session.user!.email,
						changedFields,
						previousValues: {
							name: existingUser.name,
							firstName: existingProfile?.firstName ?? null,
							lastName: existingProfile?.lastName ?? null,
							phone: existingProfile?.phone ?? null,
							address: existingProfile?.address ?? null,
							city: existingProfile?.city ?? null,
							state: existingProfile?.state ?? null,
							country: existingProfile?.country ?? null,
							postalCode: existingProfile?.postalCode ?? null,
						},
					},
					createdAt: new Date(),
				});
			});

			return {
				success: true,
				message: "Profile updated successfully",
			};
		}),
});

