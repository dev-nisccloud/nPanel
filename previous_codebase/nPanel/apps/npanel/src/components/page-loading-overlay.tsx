"use client";

import { TopProgressBar } from "@/components/top-progress-bar";

/**
 * Loading UI during page navigation. Renders top progress bar (no full-screen overlay).
 * Kept so any remaining or cached references show the bar instead of an overlay.
 */
export function PageLoadingOverlay() {
  return <TopProgressBar active />;
}
