"use client";

import * as React from "react";
import { ShieldCheck, Wrench } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { WpStatusBadge } from "@/components/wordpress/wp-status-badge";
import { Checkbox } from "@/components/ui/checkbox";
import { WpFeatureCard } from "@/components/wordpress/wp-feature-card";
import { WpTaskProgress, extractTaskUrl } from "@/components/wordpress/wp-task-progress";
import { trpc } from "@/utils/trpc";

type Measure = { id: string; title: string; description?: string };
type MeasureStatus = { id: string; status?: boolean; available?: boolean };

export function SecurityMeasuresCard({ installationId }: { installationId: number }) {
  const [taskUrl, setTaskUrl] = React.useState<string | null>(null);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const utils = trpc.useUtils();

  const { data: catalog } = trpc.plesk.wpFeatures.getSecurityMeasures.useQuery();
  const { data: statusData, refetch: refetchStatus } = trpc.plesk.wpFeatures.getSecurityStatus.useQuery({
    installationsIds: [installationId],
  });

  const rawMeasures = Array.isArray(catalog?.data)
    ? catalog.data
    : Array.isArray(catalog)
      ? catalog
      : [];

  const measures: Measure[] = rawMeasures.filter(
    (m): m is Measure =>
      m != null &&
      typeof m === "object" &&
      typeof (m as Measure).id === "string" &&
      typeof (m as Measure).title === "string",
  );

  const installStatus = Array.isArray(statusData?.data)
    ? statusData.data[0]
    : Array.isArray(statusData)
      ? statusData[0]
      : null;

  const applied: MeasureStatus[] = Array.isArray(installStatus?.securityMeasures)
    ? installStatus.securityMeasures
    : [];

  const startCheck = trpc.plesk.wpFeatures.startSecurityCheck.useMutation({
    onSuccess: (res) => {
      const url = extractTaskUrl(res);
      if (url) setTaskUrl(url);
      toast.success("Security check started");
    },
    onError: (e) => toast.error(e.message),
  });

  const resolveMutation = trpc.plesk.wpFeatures.resolveSecurityMeasure.useMutation({
    onSuccess: (res) => {
      const url = extractTaskUrl(res);
      if (url) setTaskUrl(url);
      else toast.success("Security measures applied");
      refetchStatus();
    },
    onError: (e) => toast.error(e.message),
  });

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <WpFeatureCard
      title="Security measures"
      description="Harden WordPress with recommended security fixes from WP Toolkit."
      icon={ShieldCheck}
      badge={
        installStatus?.securityStatus
          ? { label: String(installStatus.securityStatus), variant: "secondary" }
          : undefined
      }
    >
      <div className="space-y-4">
        {taskUrl ? (
          <WpTaskProgress
            taskUrl={taskUrl}
            onComplete={() => {
              setTaskUrl(null);
              void refetchStatus();
              utils.plesk.wordpress.getById.invalidate({ id: installationId });
            }}
            onDismiss={() => setTaskUrl(null)}
          />
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={startCheck.isPending}
            onClick={() => startCheck.mutate({ installationId })}
          >
            Run security check
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={selected.size === 0 || resolveMutation.isPending}
            onClick={() =>
              resolveMutation.mutate({
                installationsIds: [installationId],
                securityMeasures: Array.from(selected),
              })
            }
          >
            <Wrench className="mr-2 h-4 w-4" />
            Apply selected ({selected.size})
          </Button>
        </div>

        <ul className="space-y-2 max-h-80 overflow-y-auto rounded-lg border border-border/60 divide-y divide-border/60">
          {measures.map((m) => {
            const st = applied.find((a) => a.id === m.id);
            return (
              <li key={m.id} className="flex items-start gap-3 px-3 py-2.5 text-sm">
                <Checkbox
                  checked={selected.has(m.id)}
                  onCheckedChange={() => toggleSelect(m.id)}
                  disabled={st?.status === true}
                />
                <div className="min-w-0 flex-1">
                  <p className="font-medium leading-snug">{m.title}</p>
                  {m.description ? (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {m.description}
                    </p>
                  ) : null}
                </div>
                <WpStatusBadge label={st?.status ? "Applied" : "Pending"} />
              </li>
            );
          })}
        </ul>
      </div>
    </WpFeatureCard>
  );
}
