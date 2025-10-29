import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@nPanel/api";
import { auth } from "@nPanel/auth";
import { NextRequest } from "next/server";

// Force Node.js runtime for tRPC procedures (same as legacy Pages API)
export const runtime = 'nodejs';

// Configure max duration for long-running Plesk operations
export const maxDuration = 60; // 60 seconds

function handler(req: NextRequest) {
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
			};
		},
	});
}
export { handler as GET, handler as POST };
