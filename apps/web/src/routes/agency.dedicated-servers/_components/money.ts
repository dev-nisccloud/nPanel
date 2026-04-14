"use client";

export function formatMoneyUsd(amount?: number) {
	if (amount === undefined || amount === null || !isFinite(amount)) return "N/A";
	try {
		return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
	} catch {
		return `$${amount.toFixed(2)}`;
	}
}

export function formatMoneyKes(amount?: number) {
	if (amount === undefined || amount === null || !isFinite(amount)) return "N/A";
	try {
		return new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES" }).format(amount);
	} catch {
		return `KSh ${amount.toFixed(2)}`;
	}
}

export function formatMoney(amount?: number, currency: "KES" | "USD" = "KES") {
	return currency === "KES" ? formatMoneyKes(amount) : formatMoneyUsd(amount);
}

