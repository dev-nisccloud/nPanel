import {
	getTrustedCountryCodeSync,
	storefrontCurrencyForCountry,
} from "@npanel/location";
import { publicProcedure, router } from "../../trpc";
import { z } from "zod";
import { getAuthoritativeFxRate } from "../../lib/fx-rates";

export const storefrontLocationRouter = router({
	detect: publicProcedure.query(({ ctx }) => {
		const countryCode = getTrustedCountryCodeSync(ctx.req.raw.headers);
		return {
			countryCode,
			currency: storefrontCurrencyForCountry(countryCode),
		};
	}),
	displayFx: publicProcedure
		.input(z.object({ currency: z.enum(["KES", "USD"]) }))
		.query(async ({ input }) => {
			const snapshot = await getAuthoritativeFxRate("KES", input.currency);
			return {
				rate: snapshot.rate,
				retrievedAt: snapshot.retrievedAt,
				expiresAt: snapshot.expiresAt,
			};
		}),
});
