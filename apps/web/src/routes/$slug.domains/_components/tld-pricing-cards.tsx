"use client";

import { TldPricingCards as SharedTldPricingCards } from "@/components/domain-search/tld-pricing-cards";
import { useCurrency } from "./currency-context";

/** Customer domains search: live TLD prices (Kenic + OpenProvider + retail margin). */
export function TLDPricingCards() {
	const currencyContext = useCurrency();
	return <SharedTldPricingCards currencyContext={currencyContext} />;
}
