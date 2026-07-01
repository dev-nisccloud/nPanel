import { Skeleton } from "@/components/ui/skeleton.tsx";

export function CartPageSkeleton() {
  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 pt-16 pb-8" aria-busy="true" aria-label="Loading cart">
      {/* Step indicator */}
      <div className="mb-5 flex items-center gap-2">
        <Skeleton className="h-6 w-6 rounded-full shrink-0" />
        <Skeleton className="h-4 w-16 hidden sm:block" />
        <Skeleton className="h-px flex-1 mx-1" style={{ minWidth: 24 }} />
        <Skeleton className="h-6 w-6 rounded-full shrink-0" />
        <Skeleton className="h-4 w-20 hidden sm:block" />
      </div>

      {/* Page title */}
      <Skeleton className="h-8 w-40 mb-6" />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">
        {/* Left column */}
        <div className="space-y-4">
          {/* Cart item card */}
          <div className="bg-white border border-border rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2 min-w-0">
                  <Skeleton className="h-5 w-3/5 max-w-[220px]" />
                  <Skeleton className="h-4 w-2/5 max-w-[140px]" />
                </div>
              </div>
              <Skeleton className="h-6 w-24 shrink-0" />
            </div>
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>

          {/* Upsell / config block */}
          <div className="bg-white border border-border rounded-2xl p-5 shadow-sm space-y-4">
            <Skeleton className="h-5 w-56" />
            <Skeleton className="h-4 w-full max-w-md" />
            <div className="space-y-3 pt-1">
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-24 w-full rounded-xl" />
            </div>
          </div>
        </div>

        {/* Order summary */}
        <div className="lg:sticky lg:top-24">
          <div className="bg-white border border-border rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 pt-5 pb-4 border-b border-border">
              <Skeleton className="h-5 w-32" />
            </div>
            <div className="px-5 py-4 space-y-3">
              <div className="flex justify-between gap-2">
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-4 w-16 shrink-0" />
              </div>
              <div className="flex justify-between gap-2 pt-1">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-16" />
              </div>
              <div className="flex justify-between gap-2 pt-2">
                <Skeleton className="h-5 w-12" />
                <Skeleton className="h-7 w-28" />
              </div>
            </div>
            <div className="px-5 pb-5 pt-2">
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-3 w-48 mx-auto mt-3" />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sticky bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-border px-4 py-3 flex items-center justify-between gap-4 z-30 shadow-lg">
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-5 w-28" />
        </div>
        <Skeleton className="h-11 flex-1 max-w-44 rounded-xl" />
      </div>

      <div className="h-20 lg:h-0" />
    </div>
  );
}
