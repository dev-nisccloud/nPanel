import {
	createContext,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";
import { trpcQuery } from "@/lib/domain-search/api.ts";

export type StorefrontCurrency = "KES" | "USD";

type CurrencyContextValue = {
	currency: StorefrontCurrency;
	countryCode: string | null;
	/** `fallback` covers undetected locations and unavailable USD rates. */
	source: "fallback" | "location";
	kesToCurrencyRate: number | null;
	rateLoading: boolean;
	locationLoading: boolean;
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

function isCurrency(value: unknown): value is StorefrontCurrency {
	return value === "KES" || value === "USD";
}

/** USD can only be paid by Paystack; without it, show KES so checkout stays possible. */
async function isUsdCheckoutEnabled(): Promise<boolean> {
	try {
		const availability = await trpcQuery<{ usdEnabled: boolean }>(
			"storefront.payment.getPaystackAvailability",
		);
		return availability.usdEnabled === true;
	} catch {
		return false;
	}
}

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
	const [currency, setCurrency] = useState<StorefrontCurrency>("KES");
	const [countryCode, setCountryCode] = useState<string | null>(null);
	const [source, setSource] = useState<CurrencyContextValue["source"]>("fallback");
	const [kesToCurrencyRate, setKesToCurrencyRate] = useState<number | null>(1);
	const [rateLoading, setRateLoading] = useState(false);
	const [locationLoading, setLocationLoading] = useState(true);

	useEffect(() => {
		let active = true;
		void trpcQuery<{ countryCode: string | null; currency: StorefrontCurrency }>(
			"storefront.location.detect",
		)
			.then(async (result) => {
				if (!active || !isCurrency(result.currency)) return;
				setCountryCode(result.countryCode);
				if (result.currency === "USD" && !(await isUsdCheckoutEnabled())) return;
				if (!active) return;
				setCurrency(result.currency);
				setSource("location");
			})
			.catch(() => {
				// Undetected locations stay on KES.
			})
			.finally(() => {
				if (active) setLocationLoading(false);
			});
		return () => {
			active = false;
		};
	}, []);

	useEffect(() => {
		if (currency === "KES") {
			setKesToCurrencyRate(1);
			setRateLoading(false);
			return;
		}
		let active = true;
		setRateLoading(true);
		setKesToCurrencyRate(null);
		void trpcQuery<{ rate: number }>("storefront.location.displayFx", {
			currency,
		})
			.then((result) => {
				if (!active) return;
				if (Number.isFinite(result.rate) && result.rate > 0) {
					setKesToCurrencyRate(result.rate);
					return;
				}
				throw new Error("Invalid FX rate");
			})
			.catch(() => {
				// Never relabel KES amounts as USD; show genuine KES prices instead.
				if (!active) return;
				setCurrency("KES");
				setSource("fallback");
			})
			.finally(() => {
				if (active) setRateLoading(false);
			});
		return () => {
			active = false;
		};
	}, [currency]);

	const value = useMemo(
		() => ({
			currency,
			countryCode,
			source,
			kesToCurrencyRate,
			rateLoading,
			locationLoading,
		}),
		[countryCode, currency, kesToCurrencyRate, locationLoading, rateLoading, source],
	);

	return (
		<CurrencyContext.Provider value={value}>
			{children}
		</CurrencyContext.Provider>
	);
}

export function useCurrency(): CurrencyContextValue {
	const context = useContext(CurrencyContext);
	if (!context) {
		throw new Error("useCurrency must be used within CurrencyProvider");
	}
	return context;
}
