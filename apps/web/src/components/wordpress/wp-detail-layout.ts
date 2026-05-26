/** Shared spacing and grid classes for WordPress detail pages (agency + customer). */
export const wpDetailLayout = {
  page: "@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6",
  container: "w-full max-w-7xl mx-auto",
  sectionStack: "space-y-4",
  /** Responsive card grid — 1 col mobile, 2 col tablet+, 3 col wide viewports */
  cardGrid:
    "grid grid-cols-1 gap-4 @md/main:grid-cols-2 @3xl/main:grid-cols-3 [grid-auto-rows:minmax(0,auto)]",
  /** @deprecated use cardGrid */
  featureGrid:
    "grid grid-cols-1 gap-4 @md/main:grid-cols-2 @3xl/main:grid-cols-3 [grid-auto-rows:minmax(0,auto)]",
  /** @deprecated use cardGrid */
  featureGridWide:
    "grid grid-cols-1 gap-4 @md/main:grid-cols-2 [grid-auto-rows:minmax(0,auto)]",
  sectionGrid:
    "grid grid-cols-1 gap-4 @md/main:grid-cols-2 @3xl/main:grid-cols-3 [grid-auto-rows:minmax(0,auto)]",
  statGrid: "grid grid-cols-1 gap-3 @sm/main:grid-cols-2 @lg/main:grid-cols-4",
  infoGrid: "grid gap-x-4 gap-y-3 @sm/main:grid-cols-2",
  cardFullWidth: "col-span-full @3xl/main:col-span-3",
} as const;

/** Card-style tab trigger — matches hosting detail pages. */
export const DETAIL_TAB_TRIGGER_CLASS =
  "group flex flex-col items-start gap-2 p-4 h-auto min-h-[100px] border rounded-lg bg-background hover:bg-muted/50 transition-all data-[state=active]:border-primary data-[state=active]:bg-primary/5 data-[state=active]:shadow-sm flex-shrink-0 min-w-[140px] @lg/main:min-w-[160px]";

export const DETAIL_TABS_LIST_CLASS =
  "inline-flex h-auto w-max min-w-full gap-2 p-1.5 bg-muted/50 rounded-lg border border-border/50";
