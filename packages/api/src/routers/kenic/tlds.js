import { z } from "zod";
import { protectedProcedure, router } from "../../trpc";
import { getKenicTlds } from "../../lib/epp/kenic-tlds";
/**
 * KENIC supported TLDs.
 * Use for domain search filters, routing, or validation.
 */
export const kenicTldsRouter = router({
    /**
     * List all TLDs supported by KENIC (e.g. .ke, .co.ke, .or.ke).
     * These are the only TLDs that can be checked/registered via the KENIC EPP integration.
     */
    list: protectedProcedure
        .input(z.object({}).optional().default({}))
        .query(() => {
        return {
            tlds: [...getKenicTlds()],
        };
    }),
});
