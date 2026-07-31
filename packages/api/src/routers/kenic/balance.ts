import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getKenicBalance } from "../../lib/epp/kenic-balance";
import { protectedProcedure, router } from "../../trpc";

const balanceEntrySchema = z.object({
	tld: z.string(),
	currency: z.string(),
	balance: z.number(),
});

/**
 * KENIC registrar account balance (CoCCA finance EPP extension).
 */
export const kenicBalanceRouter = router({
	/**
	 * Get registrar credit balance from KENIC via EPP finance:info.
	 * Response format from CoCCA: TLD|CURRENCY|BALANCE per zone.
	 */
	getBalance: protectedProcedure
		.output(
			z.object({
				success: z.boolean(),
				balance: z.number(),
				currency: z.string(),
				balances: z.array(balanceEntrySchema),
			}),
		)
		.query(async () => {
			try {
				const result = await getKenicBalance();
				return {
					success: true,
					balance: result.balance,
					currency: result.currency,
					balances: result.balances,
				};
			} catch (error) {
				if (error instanceof TRPCError) throw error;
				const message = error instanceof Error ? error.message : String(error);
				if (
					message.includes("KENIC_EPP_USERNAME") ||
					message.includes("KENIC_EPP_PASSWORD")
				) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "KENIC_EPP_USERNAME and KENIC_EPP_PASSWORD must be set",
					});
				}
				const lower = message.toLowerCase();
				const isTimeout = lower.includes("timeout");
				const isRefused =
					lower.includes("econnrefused") || lower.includes("connection refused");
				throw new TRPCError({
					code: isTimeout
						? "TIMEOUT"
						: isRefused
							? "SERVICE_UNAVAILABLE"
							: "INTERNAL_SERVER_ERROR",
					message: `Failed to retrieve KENIC balance: ${message}`,
					cause: error,
				});
			}
		}),
});
