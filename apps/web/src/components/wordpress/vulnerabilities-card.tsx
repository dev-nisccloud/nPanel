"use client";

import * as React from "react";
import { AlertTriangle, Scan } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { WpStatusBadge } from "@/components/wordpress/wp-status-badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { WpPanel } from "@/components/wordpress/wp-detail-primitives";
import { WpTaskProgress, extractTaskUrl } from "@/components/wordpress/wp-task-progress";
import { trpc } from "@/utils/trpc";

type Vuln = {
  id?: string;
  title?: string;
  riskRank?: string;
  fixedIn?: string;
};

export function VulnerabilitiesCard({
  installationId,
  shell = "card",
}: {
  installationId: number;
  shell?: "card" | "panel" | "none";
}) {
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
  const allVulns = [
    ...coreVulns.map((v) => ({ ...v, _source: "WordPress core" })),
    ...pluginVulns,
  ];

  const badge = (
    <Badge variant={row?.vulnerable ? "destructive" : "outline"} className="text-xs">
      {row?.vulnerable ? `${total} found` : "None"}
    </Badge>
  );

  const content = (
    <div className="divide-y divide-border">
      {taskUrl ? (
        <div className="px-4 py-3">
          <WpTaskProgress
            taskUrl={taskUrl}
            onComplete={() => {
              setTaskUrl(null);
              void refetch();
            }}
            onDismiss={() => setTaskUrl(null)}
          />
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="min-w-0 space-y-0.5">
          <p className="text-sm font-medium text-primary">Last scan status</p>
          <p className="text-xs text-muted-foreground">
            {row?.vulnerable
              ? `${total} vulnerability${total === 1 ? "" : "ies"} need attention`
              : "No vulnerabilities reported in the last scan"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {badge}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 px-2.5 text-xs"
            disabled={startScan.isPending}
            onClick={() => startScan.mutate({ installationId })}
          >
            <Scan className="mr-1 h-3.5 w-3.5" />
            Scan now
          </Button>
        </div>
      </div>

      {total > 0 ? (
        <div className="max-h-72 divide-y divide-border overflow-y-auto">
          {allVulns.map((v: Vuln & { _source?: string }, i: number) => (
            <VulnRow key={`${v.id ?? v.title ?? i}-${i}`} vuln={v} source={v._source ?? "Unknown"} />
          ))}
        </div>
      ) : null}
    </div>
  );

  if (shell === "none") return content;
  if (shell === "panel") {
    return (
      <WpPanel title="Scan results" description="Core, plugins, and themes" badge={badge}>
        {content}
      </WpPanel>
    );
  }

  return (
    <Card className="overflow-hidden py-0 gap-0">
      <CardHeader className="border-b bg-muted/30 px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              Vulnerability scan
            </CardTitle>
            <CardDescription className="text-xs">
              Scan core, plugins, and themes for known security issues
            </CardDescription>
          </div>
          {badge}
        </div>
      </CardHeader>
      <CardContent className="p-0">{content}</CardContent>
    </Card>
  );
}

function VulnRow({ vuln, source }: { vuln: Vuln; source: string }) {
  return (
    <Collapsible>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/30"
        >
          <div className="min-w-0 space-y-0.5">
            <p className="truncate text-sm font-medium text-primary">
              {vuln.title ?? vuln.id ?? "Vulnerability"}
            </p>
            <p className="text-xs text-muted-foreground">{source}</p>
          </div>
          <WpStatusBadge label={vuln.riskRank ?? "unknown"} />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="border-t bg-muted/10 px-4 py-2.5 text-xs text-muted-foreground space-y-1">
        <p>Source: {source}</p>
        {vuln.fixedIn ? <p>Fixed in: {vuln.fixedIn}</p> : null}
      </CollapsibleContent>
    </Collapsible>
  );
}
