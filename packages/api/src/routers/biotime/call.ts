import { TRPCError } from "@trpc/server";
import { BioTimeApiError, BioTimeClient, BioTimeConfigError } from "../../lib/biotime-client";

export async function runBioTime<T>(work: (client: BioTimeClient) => Promise<T>): Promise<T> {
	try {
		return await work(BioTimeClient.fromEnv());
	} catch (error) {
		if (error instanceof BioTimeConfigError) {
			throw new TRPCError({ code: "PRECONDITION_FAILED", message: error.message });
		}
		if (error instanceof BioTimeApiError) {
			const code =
				error.statusCode === 401
					? "UNAUTHORIZED"
					: error.statusCode === 404
						? "NOT_FOUND"
						: error.statusCode === 400
							? "BAD_REQUEST"
							: "BAD_GATEWAY";
			throw new TRPCError({ code, message: error.message });
		}
		throw error;
	}
}
