"use client";

import * as React from "react";
import { AlertTriangle, Scan } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { WpStatusBadge } from "@/components/wordpress/wp-status-badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { WpFeatureCard } from "@/components/wordpress/wp-feature-card";
import { WpTaskProgress, extractTaskUrl } from "@/components/wordpress/wp-task-progress";
import { trpc } from "@/utils/trpc";

type Vuln = {
  id?: string;
  title?: string;
  riskRank?: string;
  fixedIn?: string;
};

export function VulnerabilitiesCard({ installationId }: { installationId: number }) {
  const [taskUrl, setTaskUrl] = React.useState<string | null>(null);

  const { data, refetch } = trpc.plesk.wpFeatures.getVulnerabilities.useQuery({
    installationId,
  });

  const startScan = trpc.plesk.wpFeatures.startVulnerabilityCheck.useMutation({
    onSuccess: (res) => {
      const url = extractTaskUrl(res);
      if (url) setTaskUrl(url);
      toast.success("Vulnerability scan started");
    },
    onError: (e) => toast.error(e.message),
  });

  const row = Array.isArray(data?.data) ? data.data[0] : Array.isArray(data) ? data[0] : null;
  const coreVulns: Vuln[] = Array.isArray(row?.core?.vulnerabilities)
    ? row.core.vulnerabilities
    : [];
  const pluginVulns = (Array.isArray(row?.plugins) ? row.plugins : []).flatMap(
    (p: { title?: string; vulnerabilities?: Vuln[] }) =>
      (p.vulnerabilities ?? []).map((v) => ({ ...v, _source: p.title })),
  );

  const total = coreVulns.length + pluginVulns.length;

  return (
    <WpFeatureCard
      title="Vulnerability scan"
      description="Scan core, plugins, and themes for known security issues."
      icon={AlertTriangle}
      badge={{
        label: row?.vulnerable ? `${total} found` : "None",
        variant: row?.vulnerable ? "destructive" : "outline",
      }}
    >
      <div className="space-y-4">
        {taskUrl ? (
          <WpTaskProgress
            taskUrl={taskUrl}
            onComplete={() => {
              setTaskUrl(null);
              void refetch();
            }}
            onDismiss={() => setTaskUrl(null)}
          />
        ) : null}

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={startScan.isPending}
          onClick={() => startScan.mutate({ installationId })}
        >
          <Scan className="mr-2 h-4 w-4" />
          Scan for vulnerabilities
        </Button>

        {total === 0 ? (
          <p className="text-sm text-muted-foreground">No vulnerabilities reported in the last scan.</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {coreVulns.map((v, i) => (
              <VulnRow key={`core-${i}`} vuln={v} source="WordPress core" />
            ))}
            {pluginVulns.map((v: Vuln & { _source?: string }, i: number) => (
              <VulnRow key={`plugin-${i}`} vuln={v} source={v._source ?? "Plugin"} />
            ))}
          </div>
        )}
      </div>
    </WpFeatureCard>
  );
}

function VulnRow({ vuln, source }: { vuln: Vuln; source: string }) {
  return (
    <Collapsible className="rounded-md border border-border/60">
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="flex w-full items-start justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-muted/30"
        >
          <span className="font-medium line-clamp-1">{vuln.title ?? vuln.id}</span>
          <WpStatusBadge label={vuln.riskRank ?? "unknown"} />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="px-3 pb-2 text-xs text-muted-foreground space-y-1">
        <p>Source: {source}</p>
        {vuln.fixedIn ? <p>Fixed in: {vuln.fixedIn}</p> : null}
      </CollapsibleContent>
    </Collapsible>
  );
}
