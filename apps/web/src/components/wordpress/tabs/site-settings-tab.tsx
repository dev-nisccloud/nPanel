"use client";

import type * as React from "react";
import { Construction, Gauge, Terminal } from "lucide-react";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { WordPressPerformanceTab } from "@/components/wordpress/tabs/performance-tab";
import { WordPressDevelopmentTab } from "@/components/wordpress/tabs/development-tab";
import { WordPressMaintenanceTab } from "@/components/wordpress/tabs/maintenance-tab";

function SectionShell({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <Card className="overflow-hidden py-0 gap-0 border-dashed bg-muted/20 shadow-none">
        <CardHeader className="px-4 py-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Icon className="h-4 w-4 text-muted-foreground" />
            {title}
          </CardTitle>
          <CardDescription className="text-xs">{description}</CardDescription>
        </CardHeader>
      </Card>
      <div className="grid grid-cols-1 gap-4">{children}</div>
    </div>
  );
}

export function WordPressSiteSettingsTab({ installationId }: { installationId: string }) {
  return (
    <div className="space-y-6">
      <SectionShell
        title="Performance"
        description="Indexing, caching, and cron scheduling"
        icon={Gauge}
      >
        <WordPressPerformanceTab installationId={installationId} />
      </SectionShell>

      <SectionShell
        title="Development"
        description="Debug mode and developer constants"
        icon={Terminal}
      >
        <WordPressDevelopmentTab installationId={installationId} />
      </SectionShell>

      <SectionShell
        title="Maintenance"
        description="Visitor-facing downtime page"
        icon={Construction}
      >
        <WordPressMaintenanceTab installationId={installationId} />
      </SectionShell>
    </div>
  );
}
