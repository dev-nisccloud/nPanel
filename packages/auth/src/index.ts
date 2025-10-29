import { betterAuth, type BetterAuthOptions } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { createAuthMiddleware, APIError } from "better-auth/api";
import prisma from "@nPanel/db";
import {  
  renderResetPasswordEmail, 
  renderPasswordResetSuccessEmail, 
  renderEmailVerificationEmail 
} from "@nPanel/api/lib/email-templates";
import { sendEmail } from "@nPanel/api/lib/email";

export const auth = betterAuth<BetterAuthOptions>({
	database: prismaAdapter(prisma, {
		provider: "postgresql",
	}),
	trustedOrigins: [
		process.env.CORS_ORIGIN || "",
		process.env.NEXT_PUBLIC_CORS_ORIGIN || "http://localhost:3002",
		"http://localhost:3002",
		"http://localhost:3001"
	],
	baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3001",
	session: {
		// Default session duration: 2 hours
		// Can be extended to 30 days if user checks "Remember me"
		updateAge: 60 * 60, // 1 hour - refresh session data
		expiresIn: 60 * 60 * 2, // 2 hours default
	},
	hooks: {
		before: createAuthMiddleware(async (ctx) => {
			// Check user status before login
			if (ctx.path === "/sign-in/email") {
				const email = ctx.body?.email;
				if (email) {
					const user = await prisma.user.findUnique({
						where: { email },
						select: { id: true, status: true }
					});
					
					if (user && user.status !== "ACTIVE") {
						// Log the blocked login attempt
						await prisma.userActivityLog.create({
							data: {
								id: crypto.randomUUID(),
								userId: user.id,
								action: "LOGIN_BLOCKED",
								description: `Login blocked due to account status: ${user.status}`,
								metadata: {
									status: user.status,
									reason: "Account not active"
								},
								ipAddress: ctx.headers?.get("x-forwarded-for") || ctx.headers?.get("x-real-ip") || "unknown",
								userAgent: ctx.headers?.get("user-agent") || "unknown",
								createdAt: new Date()
							}
						});

						throw new APIError("FORBIDDEN", {
							message: `Account is ${user.status.toLowerCase()}. Please contact support.`,
						});
					}
				}
			}
		}),
		after: createAuthMiddleware(async (ctx) => {
			// Customize session data to include role for get-session requests
			if (ctx.path === "/get-session" && ctx.context.session?.user) {
				// Fetch the complete user data including role
				const userWithRole = await prisma.user.findUnique({
					where: { id: ctx.context.session.user.id },
					select: {
						id: true,
						name: true,
						email: true,
						emailVerified: true,
						image: true,
						role: true,
						status: true,
						createdAt: true,
						updatedAt: true,
					}
				});

				if (userWithRole) {
					// Update the session user data with complete information
					ctx.context.session.user = {
						...ctx.context.session.user,
						...userWithRole
					};
				}
			}

			// Log successful login and handle "Remember Me"
			if (ctx.path === "/sign-in/email") {
				const newSession = ctx.context.newSession;
				if (newSession) {
					// Check if user wants to be remembered for 30 days
					const rememberMe = ctx.body?.rememberMe === true;
					
					// Update session expiration based on remember me preference
					if (rememberMe && newSession.session?.token) {
						// Extend session to 30 days in the database
						const thirtyDaysFromNow = new Date(Date.now() + 60 * 60 * 24 * 30 * 1000);
						
						await prisma.session.update({
							where: { token: newSession.session.token },
							data: { expiresAt: thirtyDaysFromNow }
						});
					}
					
					// Update last login time
					await prisma.user.update({
						where: { id: newSession.user.id },
						data: { lastLoginAt: new Date() }
					});

					// Log successful login with remember me info
					await prisma.userActivityLog.create({
						data: {
							id: crypto.randomUUID(),
							userId: newSession.user.id,
							action: "LOGIN_SUCCESS",
							description: "User successfully logged in",
							metadata: {
								loginMethod: "email_password",
								rememberMe: rememberMe,
								sessionDuration: rememberMe ? "30 days" : "2 hours"
							},
							ipAddress: ctx.headers?.get("x-forwarded-for") || ctx.headers?.get("x-real-ip") || "unknown",
							userAgent: ctx.headers?.get("user-agent") || "unknown",
							createdAt: new Date()
						}
					});
				}
			}

			// Log successful signup
			if (ctx.path.startsWith("/sign-up")) {
				const newSession = ctx.context.newSession;
				if (newSession) {
					await prisma.userActivityLog.create({
						data: {
							id: crypto.randomUUID(),
							userId: newSession.user.id,
							action: "SIGNUP_SUCCESS",
							description: "User successfully signed up",
							metadata: {
								signupMethod: "email_password",
								emailVerified: newSession.user.emailVerified
							},
							ipAddress: ctx.headers?.get("x-forwarded-for") || ctx.headers?.get("x-real-ip") || "unknown",
							userAgent: ctx.headers?.get("user-agent") || "unknown",
							createdAt: new Date()
						}
					});
				}
			}

			// Log logout
			if (ctx.path === "/sign-out") {
				const session = ctx.context.session;
				if (session) {
					await prisma.userActivityLog.create({
						data: {
							id: crypto.randomUUID(),
							userId: session.user.id,
							action: "LOGOUT",
							description: "User logged out",
							ipAddress: ctx.headers?.get("x-forwarded-for") || ctx.headers?.get("x-real-ip") || "unknown",
							userAgent: ctx.headers?.get("user-agent") || "unknown",
							createdAt: new Date()
						}
					});
				}
			}

			// Log email verification
			if (ctx.path === "/verify-email") {
				const newSession = ctx.context.newSession;
				if (newSession) {
					await prisma.userActivityLog.create({
						data: {
							id: crypto.randomUUID(),
							userId: newSession.user.id,
							action: "EMAIL_VERIFIED",
							description: "User email address verified",
							metadata: {
								email: newSession.user.email
							},
							ipAddress: ctx.headers?.get("x-forwarded-for") || ctx.headers?.get("x-real-ip") || "unknown",
							userAgent: ctx.headers?.get("user-agent") || "unknown",
							createdAt: new Date()
						}
					});
				}
			}
		}),
	},
	emailAndPassword: {
		enabled: true,
		sendResetPassword: async ({ user, url, token }) => {
			console.log(`📧 SENDING PASSWORD RESET EMAIL: User ${user.email} requested password reset`);
			console.log(`Token: ${token}`);
			console.log(`Original URL: ${url}`);
			
			// Log password reset request activity
			try {
				await prisma.userActivityLog.create({
					data: {
						id: crypto.randomUUID(),
						userId: user.id,
						action: "PASSWORD_RESET_REQUESTED",
						description: "User requested password reset via email",
						metadata: {
							email: user.email,
							token: token.substring(0, 8) + "...", // Log partial token for security
							requestMethod: "email_link"
						},
						ipAddress: "unknown", // Will be updated by hooks if available
						userAgent: "unknown", // Will be updated by hooks if available
						createdAt: new Date()
					}
				});
				console.log(`📝 Password reset request activity logged for user ${user.email}`);
			} catch (error) {
				console.error("Failed to log password reset request activity:", error);
			}
			
			// Override URL to include /auth prefix
			const frontendUrl = process.env.CORS_ORIGIN || "http://localhost:3002";
			const resetUrl = `${frontendUrl}/auth/reset-password?token=${token}`;
			
			console.log(`Reset URL: ${resetUrl}`);
			
			// Render the React email template
			const html = await renderResetPasswordEmail({
				userFirstname: user.name || 'User',
				resetPasswordLink: resetUrl,
			});
			
			await sendEmail({
				to: user.email,
				subject: "Reset your password - nPanel",
				html,
			});
		},
		onPasswordReset: async ({ user }) => {
			console.log(`✅ PASSWORD RESET SUCCESS: Password for user ${user.email} has been reset successfully.`);
			console.log(`User ID: ${user.id}`);
			console.log(`Reset timestamp: ${new Date().toISOString()}`);
			
			// Log password reset activity
			try {
				await prisma.userActivityLog.create({
					data: {
						id: crypto.randomUUID(),
						userId: user.id,
						action: "PASSWORD_RESET",
						description: "User password was reset successfully",
						metadata: {
							email: user.email,
							resetMethod: "email_link"
						},
						ipAddress: "unknown", // Will be updated by hooks if available
						userAgent: "unknown", // Will be updated by hooks if available
						createdAt: new Date()
					}
				});
				console.log(`📝 Password reset activity logged for user ${user.email}`);
			} catch (error) {
				console.error("Failed to log password reset activity:", error);
			}
			
			// Send password reset success email
			try {
				const frontendUrl = process.env.CORS_ORIGIN || "http://localhost:3002";
				const loginLink = `${frontendUrl}/auth/login`;
				
				const html = await renderPasswordResetSuccessEmail({
					userFirstname: user.name || 'User',
					loginLink,
				});
				
				await sendEmail({
					to: user.email,
					subject: "Password reset successful - nPanel",
					html,
				});
				
				console.log(`📧 Password reset success email sent to ${user.email}`);
			} catch (error) {
				console.error("Failed to send password reset success email:", error);
				// Don't throw here as the password reset was successful
			}
		},
	},
	emailVerification: {
		sendVerificationEmail: async ({ user, url, token }) => {
			console.log(`📧 SENDING EMAIL VERIFICATION: User ${user.email} needs to verify their email`);
			console.log(`Token: ${token}`);
			console.log(`Original URL: ${url}`);
			
			// Log email verification request activity
			try {
				await prisma.userActivityLog.create({
					data: {
						id: crypto.randomUUID(),
						userId: user.id,
						action: "EMAIL_VERIFICATION_SENT",
						description: "Email verification link sent to user",
						metadata: {
							email: user.email,
							token: token.substring(0, 8) + "...", // Log partial token for security
							verificationMethod: "email_link"
						},
						ipAddress: "unknown", // Will be updated by hooks if available
						userAgent: "unknown", // Will be updated by hooks if available
						createdAt: new Date()
					}
				});
				console.log(`📝 Email verification request activity logged for user ${user.email}`);
			} catch (error) {
				console.error("Failed to log email verification request activity:", error);
			}
			
			// Redirect to frontend verification page instead of API endpoint
			const frontendUrl = process.env.CORS_ORIGIN || "http://localhost:3002";
			const verificationUrl = `${frontendUrl}/auth/verify-email?token=${token}`;
			
			console.log(`Verification URL: ${verificationUrl}`);
			
			// Render the React email template using WelcomeEmail
			const html = await renderEmailVerificationEmail({
				userFirstname: user.name || 'User',
				verificationLink: verificationUrl,
			});
			
			await sendEmail({
				to: user.email,
				subject: "Welcome to nPanel - Verify your email",
				html,
			});
		},
		sendOnSignUp: true,
		autoSignInAfterVerification: true,
		expiresIn: 3600, // 1 hour
	},
	advanced: {
		defaultCookieAttributes: {
			sameSite: "none",
			secure: true,
			httpOnly: true,
		},
	},
});
