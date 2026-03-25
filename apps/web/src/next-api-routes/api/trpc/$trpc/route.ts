import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@npanel/api";
import { auth } from "@npanel/auth";

function handler(req: Request) {
	return fetchRequestHandler({
		endpoint: "/api/trpc",
		req,
		router: appRouter,
		createContext: async () => {
			// Create context directly without passing the request object
			const session = await auth.api.getSession({
				headers: req.headers,
			});
			return {
				session,
				createCaller: (ctx) => appRouter.createCaller(ctx),
			};
		},
	});
}
export { handler as GET, handler as POST };
