"use client";

import * as React from "react";
import {
	type BundleBasePrice,
	calculateBundleTotalKes,
} from "@/lib/domain-bundle-checkout";

/** Converts base prices to KES, sums them, applies the global 15% bundle margin. */
export function useBundleTotalKes(
	basePrices: BundleBasePrice[],
	convertPricesBatch:
		| ((
				prices: BundleBasePrice[],
				targetCurrency: string,
		  ) => Promise<Array<{ convertedAmount?: number }>>)
		| undefined,
): number | null {
	const [total, setTotal] = React.useState<number | null>(null);
	const priceKey = React.useMemo(
		() => basePrices.map((p) => `${p.amount}:${p.currency}`).join("|"),
		[basePrices],
	);

	React.useEffect(() => {
		if (!basePrices.length || !convertPricesBatch) {
			setTotal(null);
			return;
		}
		let cancelled = false;
		void calculateBundleTotalKes(basePrices, convertPricesBatch).then((result) => {
			if (!cancelled) setTotal(result);
		});
		return () => {
			cancelled = true;
		};
	}, [basePrices, convertPricesBatch, priceKey]);

	return total;
}
