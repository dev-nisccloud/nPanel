"use client";

import * as React from "react";
import { WordPressPerformanceTab } from "@/components/wordpress/tabs/performance-tab";
import { WordPressDevelopmentTab } from "@/components/wordpress/tabs/development-tab";
import { WordPressMaintenanceTab } from "@/components/wordpress/tabs/maintenance-tab";
import { WpCardGrid } from "@/components/wordpress/wp-detail-primitives";

export function WordPressSiteSettingsTab({ installationId }: { installationId: string }) {
  return (
    <WpCardGrid>
      <WordPressPerformanceTab installationId={installationId} />
      <WordPressDevelopmentTab installationId={installationId} />
      <WordPressMaintenanceTab installationId={installationId} />
    </WpCardGrid>
  );
}
