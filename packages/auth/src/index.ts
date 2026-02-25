import { betterAuth, type BetterAuthOptions } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { createAuthMiddleware, APIError } from "better-auth/api";
import prisma from "@nPanel/db";
import {  
  renderResetPasswordEmail, 
  renderPasswordResetSuccessEmail, 
  renderEmailVerificationEmail 
} from "react-email-starter/src/email-templates";
import { sendEmail } from "react-email-starter/src/email";

// Resolve trusted origins from environment variables
// When BETTER_AUTH_ACCEPT_ANY_HTTPS=true, we don't set trustedOrigins
// This allows Better Auth to accept same-origin requests dynamically for any HTTPS URL
// Otherwise, use BETTER_AUTH_URLS or BETTER_AUTH_URL from env
// Also include APP_URL to match NEXT_PUBLIC_APP_URL used in client redirects
const resolvedTrustedOrigins = (() => {
  // Helper to normalize and add URL to list if not already present
  const addUrlToList = (list: string[], url: string | undefined) => {
    if (url) {
      const normalized = url.replace(/\/+$/, "");
      if (!list.includes(normalized)) {
        list.push(normalized);
      }
    }
  };

  // If explicitly set to accept any HTTPS origin, include all URLs from env + allow dynamic HTTPS
  if (process.env.BETTER_AUTH_ACCEPT_ANY_HTTPS === "true") {
    // When accepting any HTTPS, we still need to include the URLs from env
    // But Better Auth will validate against this list, so include all possible URLs
    const list = process.env.BETTER_AUTH_URLS
      ? process.env.BETTER_AUTH_URLS.split(",").map((s) => s.trim()).filter(Boolean)
      : [];
    
    // Include BETTER_AUTH_URL if set
    addUrlToList(list, process.env.BETTER_AUTH_URL);
    
    // Include APP_URL to match NEXT_PUBLIC_APP_URL used in client redirects
    addUrlToList(list, process.env.APP_URL);
    
    // Also include CORS_ORIGIN for backward compatibility
    addUrlToList(list, process.env.CORS_ORIGIN);
    
    // Normalize all URLs
    const normalized = list.map((url) => url.replace(/\/+$/, ""));
    console.log("[Better Auth Config] BETTER_AUTH_ACCEPT_ANY_HTTPS=true, using trustedOrigins:", normalized);
    return normalized;
  }
  
  const list = process.env.BETTER_AUTH_URLS
    ? process.env.BETTER_AUTH_URLS.split(",").map((s) => s.trim()).filter(Boolean)
    : [];
  
  // If BETTER_AUTH_URLS is set, also include APP_URL and other env vars
  if (list.length > 0) {
    addUrlToList(list, process.env.BETTER_AUTH_URL);
    addUrlToList(list, process.env.APP_URL);
    addUrlToList(list, process.env.CORS_ORIGIN);
    
    // Normalize URLs by removing trailing slashes to avoid origin matching issues
    const normalized = list.map((url) => url.replace(/\/+$/, ""));
    console.log("[Better Auth Config] Using BETTER_AUTH_URLS with additional URLs, trustedOrigins:", normalized);
    return normalized;
  }
  
  // If BETTER_AUTH_URL is set, use it and also include APP_URL
  if (process.env.BETTER_AUTH_URL) {
    const list: string[] = [];
    addUrlToList(list, process.env.BETTER_AUTH_URL);
    addUrlToList(list, process.env.APP_URL);
    addUrlToList(list, process.env.CORS_ORIGIN);
    
    const normalized = list.map((url) => url.replace(/\/+$/, ""));
    console.log("[Better Auth Config] Using BETTER_AUTH_URL with additional URLs, trustedOrigins:", normalized);
    return normalized;
  }
  
  // If APP_URL is set, use it as trusted origin
  if (process.env.APP_URL) {
    const normalized = process.env.APP_URL.replace(/\/+$/, "");
    console.log("[Better Auth Config] Using APP_URL as trustedOrigin:", normalized);
    return [normalized];
  }
  
  // When baseURL is undefined and no trustedOrigins are set,
  // Better Auth should accept same-origin requests automatically
  console.log("[Better Auth Config] No trusted origins configured, setting to undefined");
  return undefined;
})();

export const auth = betterAuth<BetterAuthOptions>({
	database: prismaAdapter(prisma, {
		provider: "postgresql",
	}),
	trustedOrigins: resolvedTrustedOrigins,
	// Avoid absolute baseURL to ensure server-side session checks use same-origin and include cookies
	baseURL: undefined,
	secret: process.env.BETTER_AUTH_SECRET,
	session: {
		// Strict expiry: session ends exactly after expiresIn, no sliding extension
		expiresIn: 60 * 60 * 2, // 2 hours (7200 seconds) – fixed lifetime from login
		updateAge: 0, // Not used when refresh is disabled
		disableSessionRefresh: true, // Never extend on activity – log out when token expires
		// "Remember me" at login still overrides via hook (sets expiresAt to 30 days in DB)
	},
	hooks: {
		before: createAuthMiddleware(async (ctx) => {
			// Reject unknown emails on forget-password so client gets a clear error (no misleading success toast)
			const isForgetPassword =
				ctx.path === "/forget-password" || ctx.path === "/forgot-password";
			if (isForgetPassword) {
				const email = ctx.body?.email;
				if (email && typeof email === "string") {
					const user = await prisma.user.findUnique({
						where: { email },
						select: { id: true },
					});
					if (!user) {
						throw new APIError("NOT_FOUND", {
							message:
								"No account found with this email address. The email may be invalid or not registered. Please check the address or sign up for an account.",
						});
					}
				}
			}

			// Check user status before login
			if (ctx.path === "/sign-in/email") {
				const email = ctx.body?.email;
				if (email) {
					const user = await prisma.user.findUnique({
						where: { email },
						select: { id: true, status: true }
					});
					
					if (user && user.status !== "ACTIVE") {
						// Batch: Log the blocked login attempt in a transaction
						// This reduces connection usage by combining queries
						await prisma.$transaction(async (tx) => {
							await tx.userActivityLog.create({
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
					
					// Batch all related database operations in a single transaction
					// This reduces connection usage significantly (from 5+ queries to 1 transaction)
					try {
						await prisma.$transaction(async (tx) => {
							// Update session expiration based on remember me preference
							if (rememberMe && newSession.session?.token) {
								// Extend session to 30 days in the database
								const thirtyDaysFromNow = new Date(Date.now() + 60 * 60 * 24 * 30 * 1000);
								
								await tx.session.update({
									where: { token: newSession.session.token },
									data: { expiresAt: thirtyDaysFromNow }
								});
							}
							
							// Update last login time
							await tx.user.update({
								where: { id: newSession.user.id },
								data: { lastLoginAt: new Date() }
							});

							// Log successful login with remember me info
							await tx.userActivityLog.create({
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
						});

						// Create login notification in background so login response returns immediately
						const loginUserId = newSession.user.id;
						const loginHeaders = ctx.headers;
						void prisma
							.$transaction(async (tx) => {
								const ipAddress = loginHeaders?.get("x-forwarded-for") || loginHeaders?.get("x-real-ip") || null;
								const accessTime = new Date().toLocaleString("en-US", {
									year: "numeric",
									month: "long",
									day: "numeric",
									hour: "2-digit",
									minute: "2-digit",
									timeZoneName: "short",
								});
								const ipDisplay = ipAddress ? ` from ${ipAddress}` : "";
								const message = `Your account was recently accessed at ${accessTime}${ipDisplay}. If this was not you, kindly reach out to support to secure your account.`;
								const notification = await tx.notification.create({
									data: {
										id: crypto.randomUUID(),
										userId: loginUserId,
										teamId: null,
										type: "SYSTEM",
										priority: "NORMAL",
										title: "Account Access Notification",
										message: message,
										link: null,
										metadata: {
											ipAddress: ipAddress,
											accessTime: accessTime,
											loginMethod: "email_password",
										},
										seen: false,
										readAt: null,
										createdAt: new Date(),
										updatedAt: new Date(),
									} as any,
								});
								await tx.notificationActivityLog.create({
									data: {
										id: crypto.randomUUID(),
										notificationId: notification.id,
										userId: loginUserId,
										action: "CREATE",
										description: "Login notification created",
										metadata: { ipAddress: ipAddress, accessTime: accessTime },
										ipAddress: ipAddress,
										userAgent: loginHeaders?.get("user-agent") || null,
										createdAt: new Date(),
									} as any,
								});
							})
							.catch((error) => console.error("Failed to create login notification:", error));
					} catch (error) {
						// Log error but don't fail the login (transaction already committed)
						console.error("Failed to update login-related data:", error);
					}
				}
			}

			// Log successful signup in background so sign-up response returns immediately
			if (ctx.path.startsWith("/sign-up")) {
				const newSession = ctx.context.newSession;
				if (newSession) {
					const signupUserId = newSession.user.id;
					const signupEmailVerified = newSession.user.emailVerified;
					const signupHeaders = ctx.headers;
					void prisma
						.$transaction(async (tx) => {
							await tx.userActivityLog.create({
								data: {
									id: crypto.randomUUID(),
									userId: signupUserId,
									action: "SIGNUP_SUCCESS",
									description: "User successfully signed up",
									metadata: {
										signupMethod: "email_password",
										emailVerified: signupEmailVerified,
									},
									ipAddress: signupHeaders?.get("x-forwarded-for") || signupHeaders?.get("x-real-ip") || "unknown",
									userAgent: signupHeaders?.get("user-agent") || "unknown",
									createdAt: new Date(),
								},
							});
							const ipAddress = signupHeaders?.get("x-forwarded-for") || signupHeaders?.get("x-real-ip") || null;
							const ipDisplay = ipAddress ? ` from ${ipAddress}` : "";
							const message = `Your account was successfully created${ipDisplay}. Welcome to nPanel!`;
							const notification = await tx.notification.create({
								data: {
									id: crypto.randomUUID(),
									userId: signupUserId,
									teamId: null,
									type: "SYSTEM",
									priority: "NORMAL",
									title: "Account Created",
									message: message,
									link: null,
									metadata: { ipAddress: ipAddress, signupMethod: "email_password" },
									seen: false,
									readAt: null,
									createdAt: new Date(),
									updatedAt: new Date(),
								} as any,
							});
							await tx.notificationActivityLog.create({
								data: {
									id: crypto.randomUUID(),
									notificationId: notification.id,
									userId: signupUserId,
									action: "CREATE",
									description: "Signup notification created",
									metadata: { ipAddress: ipAddress, signupMethod: "email_password" },
									ipAddress: ipAddress,
									userAgent: signupHeaders?.get("user-agent") || null,
									createdAt: new Date(),
								} as any,
							});
						})
						.catch((error) => console.error("Failed to log signup / create signup notification:", error));
				}
			}

			// Log logout
			if (ctx.path === "/sign-out") {
				const session = ctx.context.session;
				if (session) {
					// Single query, but wrapped in transaction for consistency and connection pooling
					try {
						await prisma.$transaction(async (tx) => {
							await tx.userActivityLog.create({
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
						});
					} catch (error) {
						// Log error but don't fail the logout
						console.error("Failed to log logout activity:", error);
					}
				}
			}

			// Log email verification
			if (ctx.path === "/verify-email") {
				const newSession = ctx.context.newSession;
				if (newSession) {
					// Batch email verification logging in a transaction
					try {
						await prisma.$transaction(async (tx) => {
							await tx.userActivityLog.create({
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
						});

						// Create email verification success notification (separate transaction, non-critical)
						try {
							const ipAddress = ctx.headers?.get("x-forwarded-for") || ctx.headers?.get("x-real-ip") || null;
							const verificationTime = new Date().toLocaleString("en-US", {
								year: "numeric",
								month: "long",
								day: "numeric",
								hour: "2-digit",
								minute: "2-digit",
								timeZoneName: "short",
							});
							const ipDisplay = ipAddress ? ` from ${ipAddress}` : "";
							const message = `Your email address has been successfully verified at ${verificationTime}${ipDisplay}. Your account is now fully activated.`;

							// Batch notification creation and activity log
							await prisma.$transaction(async (tx) => {
								const notification = await tx.notification.create({
									data: {
										id: crypto.randomUUID(),
										userId: newSession.user.id,
										teamId: null,
										type: "SYSTEM",
										priority: "NORMAL",
										title: "Email Verified",
										message: message,
										link: null,
										metadata: {
											ipAddress: ipAddress,
											verificationTime: verificationTime,
											email: newSession.user.email,
										},
										seen: false,
										readAt: null,
										createdAt: new Date(),
										updatedAt: new Date(),
									} as any,
								});

								// Log notification activity
								await tx.notificationActivityLog.create({
									data: {
										id: crypto.randomUUID(),
										notificationId: notification.id,
										userId: newSession.user.id,
										action: "CREATE",
										description: "Email verification success notification created",
										metadata: {
											ipAddress: ipAddress,
											verificationTime: verificationTime,
										},
										ipAddress: ipAddress,
										userAgent: ctx.headers?.get("user-agent") || null,
										createdAt: new Date(),
									} as any,
								});
							});
						} catch (error) {
							// Log error but don't fail the email verification
							console.error("Failed to create email verification notification:", error);
						}
					} catch (error) {
						// Log error but don't fail the email verification
						console.error("Failed to log email verification activity:", error);
					}
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
			// Use APP_URL to match NEXT_PUBLIC_APP_URL used in client redirects
			const frontendUrl = process.env.APP_URL || process.env.CORS_ORIGIN || "http://localhost:3002";
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

			// Create password reset success notification
			try {
				const resetTime = new Date().toLocaleString("en-US", {
					year: "numeric",
					month: "long",
					day: "numeric",
					hour: "2-digit",
					minute: "2-digit",
					timeZoneName: "short",
				});
				const message = `Your password was successfully reset at ${resetTime}. If this was not you, please contact support immediately to secure your account.`;

				const notification = await prisma.notification.create({
					data: {
						id: crypto.randomUUID(),
						userId: user.id,
						teamId: null,
						type: "SYSTEM",
						priority: "HIGH",
						title: "Password Reset Successful",
						message: message,
						link: null,
						metadata: {
							resetTime: resetTime,
							resetMethod: "email_link",
						},
						seen: false,
						readAt: null,
						createdAt: new Date(),
						updatedAt: new Date(),
					} as any,
				});

				// Log notification activity
				await prisma.notificationActivityLog.create({
					data: {
						id: crypto.randomUUID(),
						notificationId: notification.id,
						userId: user.id,
						action: "CREATE",
						description: "Password reset success notification created",
						metadata: {
							resetTime: resetTime,
							resetMethod: "email_link",
						},
						ipAddress: null,
						userAgent: null,
						createdAt: new Date(),
					} as any,
				});
			} catch (error) {
				// Log error but don't fail the password reset
				console.error("Failed to create password reset success notification:", error);
			}
			
			// Send password reset success email
			try {
				// Use APP_URL to match NEXT_PUBLIC_APP_URL used in client redirects
				const frontendUrl = process.env.APP_URL || process.env.CORS_ORIGIN || "http://localhost:3002";
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

			// Create email verification sent notification
			try {
				const message = "Please check your email to verify your account. Click the verification link in the email to activate your account.";

				const notification = await prisma.notification.create({
					data: {
						id: crypto.randomUUID(),
						userId: user.id,
						teamId: null,
						type: "SYSTEM",
						priority: "NORMAL",
						title: "Verify Your Email",
						message: message,
						link: null,
						metadata: {
							verificationMethod: "email_link",
							email: user.email,
						},
						seen: false,
						readAt: null,
						createdAt: new Date(),
						updatedAt: new Date(),
					} as any,
				});

				// Log notification activity
				await prisma.notificationActivityLog.create({
					data: {
						id: crypto.randomUUID(),
						notificationId: notification.id,
						userId: user.id,
						action: "CREATE",
						description: "Email verification sent notification created",
						metadata: {
							verificationMethod: "email_link",
						},
						ipAddress: null,
						userAgent: null,
						createdAt: new Date(),
					} as any,
				});
			} catch (error) {
				// Log error but don't fail the email verification send
				console.error("Failed to create email verification sent notification:", error);
			}
			
			// Redirect to frontend verification page instead of API endpoint
			// Use APP_URL to match NEXT_PUBLIC_APP_URL used in client redirects
			const frontendUrl = process.env.APP_URL || process.env.CORS_ORIGIN || "http://localhost:3002";
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
			// Lax is safer for same-origin apps and avoids odd cross-site handling in production
			sameSite: (process.env.BETTER_AUTH_COOKIE_SAMESITE as "lax" | "strict" | "none") || "lax",
			// Secure cookies should be used for HTTPS (production, ngrok, etc.)
			// Better Auth will automatically set this based on the request protocol when baseURL is undefined
			secure: process.env.NODE_ENV === "production" || process.env.BETTER_AUTH_SECURE_COOKIES === "true",
			httpOnly: true,
		},
	},
});
