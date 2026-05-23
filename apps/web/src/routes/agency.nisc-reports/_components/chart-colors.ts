/**
 * Distinct chart colors (not theme chart tokens — those read too similar in the UI).
 */

export const CHART_PALETTE = [
  "#6366f1", // indigo
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#06b6d4", // cyan
  "#f97316", // orange
  "#ec4899", // pink
  "#14b8a6", // teal
  "#84cc16", // lime
] as const;

/** Semantic colors for known status / category labels (case-insensitive). */
export const CHART_SEMANTIC_COLORS: Record<string, string> = {
  // Invoice
  PAID: "#10b981",
  DRAFT: "#64748b",
  SENT: "#3b82f6",
  OVERDUE: "#ef4444",
  PARTIALLY_PAID: "#f59e0b",
  CANCELLED: "#94a3b8",
  CREDITED: "#8b5cf6",
  // Quotations
  ACCEPTED: "#10b981",
  REJECTED: "#ef4444",
  EXPIRED: "#78716c",
  // Subscriptions
  ACTIVE: "#10b981",
  PENDING: "#3b82f6",
  SUSPENDED: "#f59e0b",
  CANCELLED_SUB: "#94a3b8",
  EXPIRED_SUB: "#78716c",
  UPGRADED: "#8b5cf6",
  DOWNGRADED: "#f97316",
  // Revenue trend series
  invoiced: "#6366f1",
  collected: "#10b981",
  overdue: "#ef4444",
  draft: "#94a3b8",
  // MRR movement
  New: "#10b981",
  Expansion: "#3b82f6",
  Contraction: "#f59e0b",
  Churned: "#ef4444",
  Net: "#6366f1",
  // Payment methods (common)
  MPESA: "#10b981",
  M_PESA: "#10b981",
  CARD: "#6366f1",
  BANK: "#8b5cf6",
  CASH: "#f59e0b",
  // Commission buckets
  EARNED: "#6366f1",
  BILLED: "#3b82f6",
  PENDING: "#f59e0b",
  // Product categories
  CLOUD: "#6366f1",
  MARKETING: "#ec4899",
  CONSULTING: "#f59e0b",
  CUSTOM: "#8b5cf6",
  AI: "#06b6d4",
};

export function normalizeChartKey(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, "_");
}

/** Resolve a distinct color for a data item (status name, category, gateway, etc.). */
export function resolveChartColor(name: string, index: number): string {
  const upper = normalizeChartKey(name);
  if (CHART_SEMANTIC_COLORS[upper]) return CHART_SEMANTIC_COLORS[upper];
  if (CHART_SEMANTIC_COLORS[name]) return CHART_SEMANTIC_COLORS[name];
  const lower = name.toLowerCase();
  if (CHART_SEMANTIC_COLORS[lower]) return CHART_SEMANTIC_COLORS[lower];
  return CHART_PALETTE[index % CHART_PALETTE.length]!;
}

/** Series keys for multi-line / area charts. */
export function seriesChartColor(seriesKey: string, index: number): string {
  return resolveChartColor(seriesKey, index);
}
