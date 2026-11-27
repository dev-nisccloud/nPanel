import { protectedProcedure, router } from "../../trpc";
import { bioTimeHost, isBioTimeConfigured } from "../../lib/biotime-client";
import { runBioTime } from "./call";

export const biotimeAuthRouter = router({
	/** Whether server credentials are present. Does not call BioTime. */
	status: protectedProcedure.query(() => {
		const configured = isBioTimeConfigured();
		return {
			configured,
			host: configured ? bioTimeHost() : null,
		};
	}),

	/**
	 * Log in as the system user when the cached JWT is missing or due.
	 * The token stays on the server.
	 */
	session: protectedProcedure.query(() =>
		runBioTime(async (client) => {
			const session = await client.authenticate();
			return { connected: true as const, expiresAt: session.expiresAt };
		}),
	),
});
