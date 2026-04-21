import { z } from "zod";
import { protectedProcedure, router } from "../../trpc";
import { executeKenicTransferRequest } from "../../lib/kenic-transfer-request";

const domainTransferInputSchema = z.object({
	name: z.string().min(1),
	authCode: z.string().min(1, "Auth code from losing registrar is required"),
	roid: z.string().optional(),
	period: z.number().int().min(1).max(10).optional(),
});

/**
 * KENIC EPP domain transfer (RFC 5731, op="request").
 * Initiates transfer of a domain to us (gaining registrar). Auth code must be obtained from current registrar.
 */
export const kenicDomainTransferRouter = router({
	request: protectedProcedure
		.input(domainTransferInputSchema)
		.mutation(async ({ input }) => executeKenicTransferRequest(input)),
});
