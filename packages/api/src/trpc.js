import { initTRPC, TRPCError } from "@trpc/server";
export const t = initTRPC.context().create();
export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
    if (!ctx.session?.user) {
        throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Authentication required",
            cause: "No session user",
        });
    }
    const user = ctx.session.user;
    // Legacy stack only required `user`; for this codebase every protected route uses `user.id`.
    if (typeof user.id !== "string" || user.id.length === 0) {
        throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Authentication required",
            cause: "Invalid session: missing user id",
        });
    }
    // Optional fields (name, email, role) are not enforced here   add a dedicated procedure
    // (e.g. `requiresRole`) or check inside routers that need them.
    return next({
        ctx: {
            ...ctx,
            session: { ...ctx.session, user },
        },
    });
});
