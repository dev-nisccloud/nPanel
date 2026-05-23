export function fmtKes(n: number, currency = "KES") {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

export function pct(n: number) {
  return `${n.toFixed(1)}%`;
}

export { resolveChartColor, seriesChartColor, CHART_PALETTE } from "./chart-colors";

export const NISC_SECTIONS = [
  { id: "executive", label: "Overview" },
  { id: "revenue", label: "Revenue" },
  { id: "payments", label: "Payments" },
  { id: "invoices", label: "Invoicing" },
  { id: "quotations", label: "Quotations" },
  { id: "subscriptions", label: "Subscriptions" },
  { id: "clients", label: "Clients" },
  { id: "profitability", label: "Profitability" },
  { id: "tax", label: "Tax" },
] as const;

export type NiscSectionId = (typeof NISC_SECTIONS)[number]["id"];
