"use client";

import * as React from "react";
import { Cpu, Check, X } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WpFeatureCard } from "@/components/wordpress/wp-feature-card";
import { WpTaskProgress, extractTaskUrl } from "@/components/wordpress/wp-task-progress";
import { trpc } from "@/utils/trpc";

function parsePhpChoices(stub: unknown): Array<{ value: string; title: string }> {
  const root = stub as Record<string, unknown> | null;
  const value = (root?.value ?? root) as Record<string, unknown>;
  const php = value?.php as Record<string, unknown> | undefined;
  const meta = php?.meta as { versions?: Array<{ value: string; title: string }> } | undefined;
  if (Array.isArray(meta?.versions)) {
    return meta.versions.map((v) => ({ value: v.value, title: v.title }));
  }
  if (typeof php?.value === "string") {
    return [{ value: php.value, title: php.value }];
  }
  return [];
}

export function SmartPhpUpdateCard({
  installationId,
  available,
}: {
  installationId: number;
  available?: boolean;
}) {
  const [taskUrl, setTaskUrl] = React.useState<string | null>(null);
  const [phpHandler, setPhpHandler] = React.useState<string>("");

  const { data: stub } = trpc.plesk.wpFeatures.getSmartPhpUpdateStub.useQuery(
    { installationId },
    { enabled: available !== false },
  );

  const { data: result, refetch } = trpc.plesk.wpFeatures.getSmartPhpUpdateResult.useQuery(
    { installationId },
    { enabled: available !== false, retry: false },
  );

  const phpChoices = parsePhpChoices(stub?.data ?? stub);
  const resultBody = result?.data ?? result;
  const phpStatus = resultBody?.phpUpdateStatus as string | undefined;

  React.useEffect(() => {
    if (phpChoices.length && !phpHandler) setPhpHandler(phpChoices[0].value);
  }, [phpChoices, phpHandler]);

  const runMutation = trpc.plesk.wpFeatures.runSmartPhpUpdate.useMutation({
    onSuccess: (res) => {
      const url = extractTaskUrl(res);
      if (url) setTaskUrl(url);
      toast.success("Smart PHP Update started");
    },
    onError: (e) => toast.error(e.message),
  });

  const acceptMutation = trpc.plesk.wpFeatures.acceptSmartPhpUpdate.useMutation({
    onSuccess: () => {
      toast.success("PHP update applied");
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const discardMutation = trpc.plesk.wpFeatures.discardSmartPhpUpdate.useMutation({
    onSuccess: () => {
      toast.success("Smart PHP Update discarded");
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <WpFeatureCard
      title="Smart PHP Update"
      description="Test a PHP version on a clone before switching production."
      icon={Cpu}
      unavailable={available === false}
      badge={phpStatus ? { label: phpStatus, variant: "outline" } : undefined}
    >
      <div className="space-y-4">
        {taskUrl ? (
          <WpTaskProgress
            taskUrl={taskUrl}
            onComplete={() => {
              setTaskUrl(null);
              refetch();
            }}
            onDismiss={() => setTaskUrl(null)}
          />
        ) : null}

        {phpChoices.length > 0 ? (
          <div className="space-y-2 max-w-xs">
            <Label>Target PHP handler</Label>
            <Select value={phpHandler} onValueChange={setPhpHandler}>
              <SelectTrigger>
                <SelectValue placeholder="Select PHP version" />
              </SelectTrigger>
              <SelectContent>
                {phpChoices.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={runMutation.isPending || available === false}
          onClick={() =>
            runMutation.mutate({
              installationId,
              php: phpHandler || undefined,
            })
          }
        >
          Start test run
        </Button>

        {phpStatus && phpStatus !== "none" ? (
          <div className="flex flex-wrap gap-2 border-t border-border/60 pt-4">
            <Button
              type="button"
              size="sm"
              disabled={acceptMutation.isPending}
              onClick={() => acceptMutation.mutate({ installationId })}
            >
              <Check className="mr-2 h-4 w-4" />
              Apply PHP update
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={discardMutation.isPending}
              onClick={() => discardMutation.mutate({ installationId })}
            >
              <X className="mr-2 h-4 w-4" />
              Discard
            </Button>
          </div>
        ) : null}
      </div>
    </WpFeatureCard>
  );
}
