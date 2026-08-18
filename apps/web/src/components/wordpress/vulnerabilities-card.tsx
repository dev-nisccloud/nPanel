"use client";

import * as React from "react";
import { AlertTriangle, Scan, ShieldCheck } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { WpStatusBadge } from "@/components/wordpress/wp-status-badge";
import { WpPanel } from "@/components/wordpress/wp-detail-primitives";
import { WpTaskProgress, extractTaskUrl } from "@/components/wordpress/wp-task-progress";
import { useConfirm } from "@/hooks/use-confirm";
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
  enabled = true,
}: {
  installationId: number;
  shell?: "card" | "panel" | "none";
  enabled?: boolean;
}) {
  const [taskUrl, setTaskUrl] = React.useState<string | null>(null);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());

  const { data, refetch } = trpc.plesk.wpFeatures.getVulnerabilities.useQuery(
    { installationId },
    { enabled },
  );

  const startScan = trpc.plesk.wpFeatures.startVulnerabilityCheck.useMutation({
    onSuccess: (res) => {
      const url = extractTaskUrl(res);
      if (url) setTaskUrl(url);
      toast.success("Vulnerability scan started");
    },
    onError: (e) => toast.error(e.message),
  });

  const patchMutation = trpc.plesk.wpFeatures.applyVirtualPatches.useMutation({
    onSuccess: (res) => {
      const url = extractTaskUrl(res);
      if (url) setTaskUrl(url);
      else toast.success("Virtual patches applied");
      void refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const [ApplyPatchesDialog, confirmApplyPatches] = useConfirm(
    "Apply virtual patches?",
    "Selected findings will be mitigated with virtual patches until a proper update is available. This can change how WordPress handles known issues.",
  );

  const row = Array.isArray(data?.data) ? data.data[0] : Array.isArray(data) ? data[0] : null;
  const coreVulns: Vuln[] = Array.isArray(row?.core?.vulnerabilities)
    ? row.core.vulnerabilities
    : [];
  const pluginVulns = (Array.isArray(row?.plugins) ? row.plugins : []).flatMap(
    (p: { title?: string; vulnerabilities?: Vuln[] }) =>
      (p.vulnerabilities ?? []).map((v) => ({ ...v, _source: p.title })),
  );

  const allVulns = [
    ...coreVulns.map((v) => ({ ...v, _source: "WordPress core" })),
    ...pluginVulns,
  ];
  const total = allVulns.length;

  const badge = (
    <Badge variant={row?.vulnerable ? "destructive" : "outline"} className="text-xs">
      {row?.vulnerable ? `${total} found` : "None"}
    </Badge>
  );

  const toggleSelect = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const content = (
    <div className="space-y-4">
      <ApplyPatchesDialog />
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

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 space-y-0.5">
          <p className="text-sm font-medium text-primary">Scan results</p>
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
        <>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              disabled={selected.size === 0 || patchMutation.isPending}
              onClick={async () => {
                const ok = await confirmApplyPatches();
                if (!ok) return;
                patchMutation.mutate({ installationId, status: true });
              }}
            >
              <ShieldCheck className="mr-2 h-4 w-4" />
              Patch selected ({selected.size})
            </Button>
          </div>
          <div className="space-y-3">
            {allVulns.map((vuln: Vuln & { _source?: string }, index: number) => {
              const key = `${vuln.id ?? vuln.title ?? index}-${index}`;
              return (
                <div key={key} className="flex items-start gap-3 rounded-lg border px-3 py-3">
                  <Checkbox
                    checked={selected.has(key)}
                    onCheckedChange={() => toggleSelect(key)}
                    className="mt-0.5"
                  />
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="text-sm font-medium leading-snug text-primary">
                      {vuln.title ?? vuln.id ?? "Vulnerability"}
                    </p>
                    <p className="text-xs text-muted-foreground">{vuln._source ?? "Unknown"}</p>
                    {vuln.fixedIn ? (
                      <p className="text-xs text-muted-foreground">Fixed in {vuln.fixedIn}</p>
                    ) : null}
                  </div>
                  <WpStatusBadge label={vuln.riskRank ?? "unknown"} />
                </div>
              );
            })}
          </div>
        </>
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
      <CardContent className="p-4">{content}</CardContent>
    </Card>
  );
}
