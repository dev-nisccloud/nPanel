"use client";

export function formatMoneyUsd(amount?: number) {
	if (amount === undefined || amount === null || !isFinite(amount)) return "N/A";
	try {
		return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
	} catch {
		return `$${amount.toFixed(2)}`;
	}
}

