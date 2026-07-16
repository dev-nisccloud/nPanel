/**
 * Storefront cart  signed handoff + authoritative pricing quotes.
 */
import { and, eq } from "@npanel/db";
import { db } from "@npanel/db";
import { niscProduct } from "@npanel/db/schema/products";
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
			let payload = { ...input };
			if (input.serviceType === "domain_transfer" && !payload.productId?.trim()) {
				const [product] = await db
					.select({ id: niscProduct.id })
					.from(niscProduct)
					.where(
						and(
							eq(niscProduct.isActive, true),
							eq(niscProduct.serviceType, "domain_transfer"),
						),
					)
					.limit(1);
				if (product) payload = { ...payload, productId: product.id };
			}
			return { handoff: signStorefrontCartHandoff(payload) };
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

