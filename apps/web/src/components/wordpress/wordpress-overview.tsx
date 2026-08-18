"use client";

import { z } from "zod";

import { WordPressOverviewToolkit } from "@/components/wordpress/overview-toolkit";
import { WordPressSiteCredentials } from "@/components/wordpress/wordpress-site-credentials";
import { wordpressInstallationSchema } from "@/routes/$slug.wordpress/_components/schema";

interface WordPressOverviewProps {
  wpData: z.infer<typeof wordpressInstallationSchema>;
  onNavigateToTab?: (tab: string) => void;
}

export function WordPressOverview({ wpData, onNavigateToTab }: WordPressOverviewProps) {
  return (
    <div className="space-y-6">
      {wpData.id != null ? (
        <WordPressSiteCredentials installationId={String(wpData.id)} />
      ) : null}

      <WordPressOverviewToolkit wpData={wpData} onNavigateToTab={onNavigateToTab} />
    </div>
  );
}
