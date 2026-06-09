export function formatPrice(price?: number, currency?: string): string {
  if (price == null || price === undefined) return "N/A";
  const symbols: Record<string, string> = {
    USD: "$",
    KES: "KSh",
    EUR: "€",
    GBP: "£",
  };
  const symbol = symbols[currency ?? "USD"] ?? currency ?? "$";
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
  return `${symbol} ${formatted}`;
}
