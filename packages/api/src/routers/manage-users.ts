import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import { TRPCError } from "@trpc/server";
import prisma from "@nPanel/db";
import * as crypto from "crypto";
import { auth } from "@nPanel/auth";
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

// ============================================================================
// tRPC ROUTER
// ============================================================================

export const manageUsersRouter = router({
	// Get all agency users (AGENCY_ADMIN, AGENCY_SUPER_ADMIN, AGENCY_USER)
	getAll: protectedProcedure
		.input(getAllUsersInputSchema)
		.output(getAllUsersOutputSchema)
		.query(async ({ ctx, input }) => {
			const session = ctx.session;
			if (!session?.user?.id) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "You must be logged in to view users",
				});
			}

			// Only allow AGENCY_ADMIN and AGENCY_SUPER_ADMIN to view users
			const userRole = session.user.role;
			if (userRole !== "AGENCY_ADMIN" && userRole !== "AGENCY_SUPER_ADMIN") {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You do not have permission to view users",
				});
			}

			const users = await prisma.user.findMany({
				where: {
					role: {
						in: ["AGENCY_ADMIN", "AGENCY_SUPER_ADMIN", "AGENCY_USER"],
					},
				},
				orderBy: {
					createdAt: "desc",
				},
			});

			return users.map((user) => ({
				id: user.id,
				name: user.name,
				email: user.email,
				emailVerified: user.emailVerified,
				role: user.role,
				status: user.status,
				image: user.image,
				lastLoginAt: user.lastLoginAt,
				createdAt: user.createdAt,
				updatedAt: user.updatedAt,
			}));
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

			// Only allow AGENCY_ADMIN and AGENCY_SUPER_ADMIN to view user details
			const userRole = session.user.role;
			if (userRole !== "AGENCY_ADMIN" && userRole !== "AGENCY_SUPER_ADMIN") {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You do not have permission to view user details",
				});
			}

			const user = await prisma.user.findUnique({
				where: { id: input.userId },
			});

			if (!user) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "User not found",
				});
			}

			// Only return agency users
			if (!["AGENCY_ADMIN", "AGENCY_SUPER_ADMIN", "AGENCY_USER"].includes(user.role)) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "This user is not an agency user",
				});
			}

			return {
				id: user.id,
				name: user.name,
				email: user.email,
				emailVerified: user.emailVerified,
				role: user.role,
				status: user.status,
				image: user.image,
				lastLoginAt: user.lastLoginAt,
				createdAt: user.createdAt,
				updatedAt: user.updatedAt,
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
			const existingUser = await prisma.user.findUnique({
				where: { email: input.email },
			});

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

			if (!signupResult || signupResult.error) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: signupResult?.error?.message || "Failed to create user account",
				});
			}

			// Get the created user
			const user = await prisma.user.findUnique({
				where: { email: input.email },
			});

			if (!user) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "User was created but could not be retrieved",
				});
			}

			// Update user role to the specified role (Better Auth defaults to CUSTOMER)
			await prisma.user.update({
				where: { id: user.id },
				data: {
					role: input.role,
				},
			});

			// Get updated user with correct role
			const updatedUser = await prisma.user.findUnique({
				where: { id: user.id },
			});

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
			await prisma.userActivityLog.create({
				data: {
					id: crypto.randomUUID(),
					userId: updatedUser.id,
					action: "AGENCY_USER_CREATED_BY_ADMIN",
					description: `Agency user account created by admin: ${session.user.email}`,
					metadata: {
						createdBy: userId,
						createdByEmail: session.user.email,
						role: input.role,
					},
					createdAt: new Date(),
				},
			});

			return {
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

			// Find the user
			const existingUser = await prisma.user.findUnique({
				where: { id: input.userId },
			});

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
			if (input.email && input.email !== existingUser.email) {
				const emailExists = await prisma.user.findUnique({
					where: { email: input.email },
				});

				if (emailExists) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "A user with this email already exists",
					});
				}
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

			// Update the user
			const updatedUser = await prisma.user.update({
				where: { id: input.userId },
				data: updateData,
			});

			// Log activity
			const changedFields = Object.keys(updateData).filter(key => key !== "updatedAt");
			await prisma.userActivityLog.create({
				data: {
					id: crypto.randomUUID(),
					userId: updatedUser.id,
					action: "AGENCY_USER_UPDATED_BY_ADMIN",
					description: `Agency user account updated by admin: ${session.user.email}`,
					metadata: {
						updatedBy: userId,
						updatedByEmail: session.user.email,
						changedFields,
						previousValues: {
							name: existingUser.name,
							email: existingUser.email,
							role: existingUser.role,
						},
						newValues: {
							name: updatedUser.name,
							email: updatedUser.email,
							role: updatedUser.role,
						},
					},
					createdAt: new Date(),
				},
			});

			return {
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
			const existingUser = await prisma.user.findUnique({
				where: { id: input.userId },
			});

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

			// Update status
			const updatedUser = await prisma.user.update({
				where: { id: input.userId },
				data: {
					status: input.status,
					updatedAt: new Date(),
				},
			});

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

			// Log activity with specific action type
			await prisma.userActivityLog.create({
				data: {
					id: crypto.randomUUID(),
					userId: updatedUser.id,
					action: actionType,
					description: actionDescription,
					metadata: {
						changedBy: userId,
						changedByEmail: session.user.email,
						previousStatus: existingUser.status,
						newStatus: input.status,
					},
					createdAt: new Date(),
				},
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
			const user = await prisma.user.findUnique({
				where: { id: input.userId },
			});

			if (!user) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "User not found",
				});
			}

			// Verify it's an agency user
			if (!["AGENCY_ADMIN", "AGENCY_SUPER_ADMIN", "AGENCY_USER"].includes(user.role)) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "This user is not an agency user",
				});
			}

			// Request password reset using Better Auth
			try {
				const result = await auth.api.requestPasswordReset({
					body: {
						email: user.email,
					},
				});

				// Log activity
				await prisma.userActivityLog.create({
					data: {
						id: crypto.randomUUID(),
						userId: user.id,
						action: "AGENCY_USER_PASSWORD_RESET_REQUESTED_BY_ADMIN",
						description: `Password reset requested for agency user by admin: ${session.user.email}`,
						metadata: {
							requestedBy: session.user.id,
							requestedByEmail: session.user.email,
						},
						createdAt: new Date(),
					},
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

			// Only allow AGENCY_ADMIN and AGENCY_SUPER_ADMIN to view sessions
			const userRole = session.user.role;
			if (userRole !== "AGENCY_ADMIN" && userRole !== "AGENCY_SUPER_ADMIN") {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You do not have permission to view sessions",
				});
			}

			// Verify the user exists and is an agency user
			const user = await prisma.user.findUnique({
				where: { id: input.userId },
			});

			if (!user) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "User not found",
				});
			}

			if (!["AGENCY_ADMIN", "AGENCY_SUPER_ADMIN", "AGENCY_USER"].includes(user.role)) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "This user is not an agency user",
				});
			}

			// Get all sessions for the user
			const sessions = await prisma.session.findMany({
				where: {
					userId: input.userId,
				},
				orderBy: {
					createdAt: "desc",
				},
			});

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

			// Only allow AGENCY_SUPER_ADMIN to view profiles
			const userRole = session.user.role;
			if (userRole !== "AGENCY_SUPER_ADMIN") {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You do not have permission to view profiles",
				});
			}

			// Verify the user exists and is an agency user
			const user = await prisma.user.findUnique({
				where: { id: input.userId },
				include: {
					profile: true,
				},
			});

			if (!user) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "User not found",
				});
			}

			if (!["AGENCY_ADMIN", "AGENCY_SUPER_ADMIN", "AGENCY_USER"].includes(user.role)) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "This user is not an agency user",
				});
			}

			return {
				firstName: user.profile?.firstName || null,
				lastName: user.profile?.lastName || null,
				phone: user.profile?.phone || null,
				address: user.profile?.address || null,
				city: user.profile?.city || null,
				state: user.profile?.state || null,
				country: user.profile?.country || null,
				postalCode: user.profile?.postalCode || null,
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

			// Find the user
			const existingUser = await prisma.user.findUnique({
				where: { id: input.userId },
				include: {
					profile: true,
				},
			});

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

			// Separate user fields from profile fields
			const { name, firstName, lastName, phone, address, city, state, country, postalCode } = input;

			// Update user name if provided
			if (name) {
				await prisma.user.update({
					where: { id: input.userId },
					data: {
						name,
						updatedAt: new Date(),
					},
				});
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
			if (existingUser.profile) {
				await prisma.userProfile.update({
					where: { userId: input.userId },
					data: profileData,
				});
			} else {
				await prisma.userProfile.create({
					data: {
						id: crypto.randomUUID(),
						userId: input.userId,
						...profileData,
						createdAt: new Date(),
					},
				});
			}

			// Log activity
			const changedFields = Object.keys(input).filter(key => key !== "userId");
			await prisma.userActivityLog.create({
				data: {
					id: crypto.randomUUID(),
					userId: input.userId,
					action: "AGENCY_USER_PROFILE_UPDATED_BY_ADMIN",
					description: `Agency user profile updated by admin: ${session.user.email}`,
					metadata: {
						updatedBy: userId,
						updatedByEmail: session.user.email,
						changedFields,
						previousValues: {
							name: existingUser.name,
							firstName: existingUser.profile?.firstName || null,
							lastName: existingUser.profile?.lastName || null,
							phone: existingUser.profile?.phone || null,
							address: existingUser.profile?.address || null,
							city: existingUser.profile?.city || null,
							state: existingUser.profile?.state || null,
							country: existingUser.profile?.country || null,
							postalCode: existingUser.profile?.postalCode || null,
						},
					},
					createdAt: new Date(),
				},
			});

			return {
				success: true,
				message: "Profile updated successfully",
			};
		}),
});

