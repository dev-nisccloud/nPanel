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
