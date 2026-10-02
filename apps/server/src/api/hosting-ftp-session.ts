import { createContext, t } from "@npanel/api";
import { appRouter } from "@npanel/api/routers/index";
import type { Context } from "hono";

const appCaller = t.createCallerFactory(appRouter);

export type HostingFtpSession =
	| { ok: true; userId: string; reveal: boolean }
	| { ok: false; response: Response };

export async function readHostingFtpSession(c: Context): Promise<HostingFtpSession> {
	const ctx = await createContext({
		context: c,
		createCaller: (innerCtx) => appCaller(innerCtx),
	});
	const userId = ctx.session?.user?.id;
	if (!userId) {
		return {
			ok: false,
			response: c.json({ message: "Authentication required" }, 401),
		};
	}
	return {
		ok: true,
		userId,
		reveal: ctx.session?.user?.role?.trim().toUpperCase() === "AGENCY_SUPER_ADMIN",
	};
}
