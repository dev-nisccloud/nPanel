/**
 * Storefront cart — signed handoff + authoritative pricing quotes.
 */
import { publicProcedure, router } from "../../trpc";
import {
	computeStorefrontCartQuote,
} from "../../lib/storefront-cart-pricing";
import {
	signStorefrontCartHandoff,
	storefrontCartHandoffPayloadSchema,
} from "../../lib/storefront-cart-handoff";
import {
	resolveStorefrontCartQuoteInput,
	storefrontCartQuoteRequestSchema,
} from "../../lib/storefront-cart-resolve";

const createHandoffInputSchema = storefrontCartHandoffPayloadSchema.omit({
	v: true,
	iat: true,
	exp: true,
});

export const storefrontCartRouter = router({
	/** Issue a signed handoff token for buy-now navigation (?h=…). */
	createHandoff: publicProcedure
		.input(createHandoffInputSchema)
		.mutation(async ({ input }) => {
			return { handoff: signStorefrontCartHandoff(input) };
		}),

	/** Resolve authoritative pricing (domains re-checked via KENIC/OpenProvider). */
	quote: publicProcedure
		.input(storefrontCartQuoteRequestSchema)
		.query(async ({ input }) => {
			const resolved = resolveStorefrontCartQuoteInput(input);
			return computeStorefrontCartQuote(resolved);
		}),
});

export { storefrontCartQuoteRequestSchema as quoteRequestSchema };
