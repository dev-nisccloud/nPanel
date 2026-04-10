"use client";

export function formatMoney(value: number, currency = "USD") {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

export function parseNumberOrZero(input: string) {
  const v = input.trim();
  if (!v) return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

