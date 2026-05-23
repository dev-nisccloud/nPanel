/** Full axis labels — no tick skipping or truncation helpers. */

export function formatChartCategoryLabel(value: unknown) {
  return String(value ?? "").replace(/_/g, " ");
}

export function labelsFromData(
  data: Record<string, string | number>[],
  labelKey: string
) {
  return data.map((row) => formatChartCategoryLabel(row[labelKey]));
}

export function maxLabelLength(labels: string[]) {
  return Math.max(...labels.map((l) => l.length), 1);
}

/** Left margin for vertical bar charts (category on Y). */
export function categoryAxisWidth(labels: string[]) {
  const len = maxLabelLength(labels);
  return Math.min(Math.max(len * 7.5, 88), 200);
}

/** Bottom margin when X categories are angled. */
export function angledBottomMargin(labels: string[]) {
  const len = maxLabelLength(labels);
  const count = labels.length;
  if (len > 16 || count > 8) return 88;
  if (len > 10 || count > 5) return 72;
  return 56;
}

export const CHART_TICK = {
  fontSize: 11,
  fill: "hsl(var(--muted-foreground))",
} as const;

export const CHART_CONTAINER_CLASS = "!aspect-auto min-h-0 w-full";
