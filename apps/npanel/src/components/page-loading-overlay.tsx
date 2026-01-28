"use client";

import { Spinner } from "@/components/ui/shadcn-io/spinner";

/**
 * Full-screen overlay shown during page navigation / loading.
 * Used by NavigationLoader and route loading.tsx for consistent UX.
 */
export function PageLoadingOverlay() {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
      aria-live="polite"
      aria-busy="true"
      role="status"
    >
      <div className="flex flex-col items-center gap-4">
        <Spinner variant="infinite" className="text-primary" size={32} />
        <p className="text-xl font-bold text-muted-foreground">Loading page...</p>
      </div>
    </div>
  );
}
