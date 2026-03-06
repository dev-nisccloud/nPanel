"use client";

import { TopProgressBar } from "@/components/top-progress-bar";

/**
 * Root loading UI – shown while the root segment is loading (e.g. redirect being computed).
 * Now uses the same subtle top progress indicator as dashboards instead of a full-screen overlay.
 */
export default function RootLoading() {
  return <TopProgressBar active />;
}
