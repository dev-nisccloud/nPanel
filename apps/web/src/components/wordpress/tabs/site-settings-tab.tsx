"use client";

import { WordPressPerformanceTab } from "@/components/wordpress/tabs/performance-tab";
import { WordPressDevelopmentTab } from "@/components/wordpress/tabs/development-tab";
import { WordPressMaintenanceTab } from "@/components/wordpress/tabs/maintenance-tab";

export function WordPressSiteSettingsTab({ installationId }: { installationId: string }) {
  return (
    <div className="space-y-10">
      <WordPressPerformanceTab installationId={installationId} />
      <WordPressDevelopmentTab installationId={installationId} />
      <WordPressMaintenanceTab installationId={installationId} />
    </div>
  );
}
