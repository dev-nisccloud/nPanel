/** Shared spacing and grid classes for WordPress detail pages (agency + customer). */
export const wpDetailLayout = {
  page: "@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6",
  container: "w-full max-w-7xl mx-auto",
  sectionStack: "space-y-4",
  /** Responsive card grid - 1 col mobile, 2 col tablet+, 3 col wide viewports */
  cardGrid:
    "grid grid-cols-1 items-start gap-4 @md/main:grid-cols-2 @3xl/main:grid-cols-3",
  /** @deprecated use cardGrid */
  featureGrid:
    "grid grid-cols-1 gap-4 @md/main:grid-cols-2 @3xl/main:grid-cols-3 [grid-auto-rows:minmax(0,auto)]",
  /** @deprecated use cardGrid */
  featureGridWide:
    "grid grid-cols-1 gap-4 @md/main:grid-cols-2 [grid-auto-rows:minmax(0,auto)]",
  sectionGrid:
    "grid grid-cols-1 items-start gap-4 @md/main:grid-cols-2 @3xl/main:grid-cols-3",
  innerGrid: "grid grid-cols-1 items-start gap-4 @lg/main:grid-cols-2",
  innerGridThree: "grid grid-cols-1 items-start gap-4 @md/main:grid-cols-2 @3xl/main:grid-cols-3",
  statGrid: "grid grid-cols-1 gap-3 @sm/main:grid-cols-2 @lg/main:grid-cols-4",
  infoGrid: "grid gap-x-4 gap-y-3 @sm/main:grid-cols-2",
  cardFullWidth: "col-span-full @3xl/main:col-span-3",
} as const;

/** @deprecated Import from `@/components/ui/detail-card-tabs` instead. */
export {
  DETAIL_TAB_TRIGGER_CLASS,
  DETAIL_TABS_LIST_CLASS,
  DETAIL_TABS_SCROLL_CLASS,
  DETAIL_TAB_CONTENT_CLASS,
} from "@/components/ui/detail-card-tabs";
