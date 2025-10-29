import { initTRPC, TRPCError } from "@trpc/server";
import type { Context } from "./context";

export const t = initTRPC.context<Context>().create();

export const router = t.router;

export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
	if (!ctx.session) {
		throw new TRPCError({
			code: "UNAUTHORIZED",
			message: "Authentication required",
			cause: "No session",
		});
	}
	return next({
		ctx: {
			...ctx,
			session: ctx.session,
		},
	});
});

// Export the app router and its type
export { appRouter, type AppRouter } from "./routers/index";

// Export email utilities for use in auth package
export { sendEmail } from "./lib/email";
export { 
  renderResetPasswordEmail, 
  renderPasswordResetSuccessEmail, 
  renderEmailVerificationEmail 
} from "./lib/email-templates";
