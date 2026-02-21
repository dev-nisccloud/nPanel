import { initTRPC, TRPCError } from "@trpc/server";

export type Session = {
	user?: {
		id: string;
		name?: string;
		email?: string;
		role?: string;
	};
} | null;

export type Context = {
	session: Session;
	/** Used by AI chat to get a tRPC caller. Injected by the app to avoid circular imports. */
	createCaller?: (ctx: Context) => unknown;
};

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
	if (!ctx.session?.user) {
		throw new TRPCError({ code: "UNAUTHORIZED" });
	}

	return next({
		ctx: {
			session: { ...ctx.session, user: ctx.session.user },
		},
	});
});
