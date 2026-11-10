import {
	createContext,
	useCallback,
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
	source: "fallback" | "location" | "manual";
	kesToCurrencyRate: number | null;
	rateLoading: boolean;
	setCurrency: (currency: StorefrontCurrency) => void;
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);
const STORAGE_KEY = "nisc-storefront-currency";
const COOKIE_NAME = "nisc_currency";

function isCurrency(value: unknown): value is StorefrontCurrency {
	return value === "KES" || value === "USD";
}

function readPersistedCurrency(): StorefrontCurrency | null {
	if (typeof window === "undefined") return null;
	try {
		const stored = window.localStorage.getItem(STORAGE_KEY);
		if (isCurrency(stored)) return stored;
	} catch {
		// Cookies remain available when storage is blocked.
	}
	const cookie = document.cookie
		.split(";")
		.map((part) => part.trim())
		.find((part) => part.startsWith(`${COOKIE_NAME}=`))
		?.split("=")[1];
	return isCurrency(cookie) ? cookie : null;
}

function persistCurrency(currency: StorefrontCurrency) {
	try {
		window.localStorage.setItem(STORAGE_KEY, currency);
	} catch {
		// The first-party cookie is the fallback persistence mechanism.
	}
	document.cookie = `${COOKIE_NAME}=${currency}; Path=/; Max-Age=31536000; SameSite=Lax`;
}

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
	const [manualCurrency] = useState(readPersistedCurrency);
	const [currency, setCurrencyState] = useState<StorefrontCurrency>(
		manualCurrency ?? "KES",
	);
	const [countryCode, setCountryCode] = useState<string | null>(null);
	const [source, setSource] = useState<CurrencyContextValue["source"]>(
		manualCurrency ? "manual" : "fallback",
	);
	const [kesToCurrencyRate, setKesToCurrencyRate] = useState<number | null>(
		manualCurrency === "USD" ? null : 1,
	);
	const [rateLoading, setRateLoading] = useState(false);

	useEffect(() => {
		if (manualCurrency) return;
		let active = true;
		void trpcQuery<{ countryCode: string | null; currency: StorefrontCurrency }>(
			"storefront.location.detect",
		)
			.then((result) => {
				if (!active || !isCurrency(result.currency)) return;
				setCountryCode(result.countryCode);
				setCurrencyState(result.currency);
				setSource("location");
			})
			.catch(() => {
				// Fail safely to KES for uncertain/local traffic.
			});
		return () => {
			active = false;
		};
	}, [manualCurrency]);

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
				if (active && Number.isFinite(result.rate) && result.rate > 0) {
					setKesToCurrencyRate(result.rate);
				}
			})
			.catch(() => {
				// Leave the rate unavailable; never relabel an unconverted amount.
			})
			.finally(() => {
				if (active) setRateLoading(false);
			});
		return () => {
			active = false;
		};
	}, [currency]);

	const setCurrency = useCallback((next: StorefrontCurrency) => {
		persistCurrency(next);
		setCurrencyState(next);
		setSource("manual");
	}, []);

	const value = useMemo(
		() => ({
			currency,
			countryCode,
			source,
			kesToCurrencyRate,
			rateLoading,
			setCurrency,
		}),
		[
			countryCode,
			currency,
			kesToCurrencyRate,
			rateLoading,
			setCurrency,
			source,
		],
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
