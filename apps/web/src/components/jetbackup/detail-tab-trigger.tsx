"use client";

import * as React from "react";
import { ChevronRight, type LucideIcon } from "lucide-react";
import { TabsTrigger } from "@/components/ui/tabs";
import { DETAIL_TAB_TRIGGER_CLASS } from "@/components/wordpress/wp-detail-layout";

export function JetBackupDetailTabTrigger({
  value,
  icon: Icon,
  title,
  subtitle,
}: {
  value: string;
  icon: LucideIcon;
  title: string;
  subtitle: string;
}) {
  return (
    <TabsTrigger value={value} className={DETAIL_TAB_TRIGGER_CLASS}>
      <div className="flex items-center justify-between w-full">
        <Icon className="h-6 w-6 shrink-0 text-muted-foreground group-data-[state=active]:text-primary" />
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
      </div>
      <div className="flex flex-col items-start gap-1 w-full">
        <span className="text-sm font-semibold tracking-tight">{title}</span>
        <span className="text-xs text-muted-foreground">{subtitle}</span>
      </div>
    </TabsTrigger>
  );
}
