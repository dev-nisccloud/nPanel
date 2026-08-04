"use client";

import * as React from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/utils/trpc";
import { toast } from "@/components/ui/sonner";
import { normalizeTldExtension } from "@/lib/tld-margin";

function formatMarginSummary(setting: {
  marginType: string | null;
  percentageMargin: string | null;
  fixedMargin: string | null;
  roundOff: string | null;
} | null): string {
  if (!setting?.marginType) return "No margin configured";
  if (setting.marginType === "PERCENTAGE" && setting.percentageMargin) {
    const base = `${setting.percentageMargin}%`;
    return setting.roundOff ? `${base} (round ${setting.roundOff})` : base;
  }
  if (setting.marginType === "FIXED" && setting.fixedMargin) {
    const base = `+${setting.fixedMargin} fixed`;
    return setting.roundOff ? `${base} (round ${setting.roundOff})` : base;
  }
  return setting.marginType;
}

interface TldMarginSectionProps {
  extension: string;
  open: boolean;
}

export function TldMarginSection({ extension, open }: TldMarginSectionProps) {
  const normalized = normalizeTldExtension(extension);
  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.tldSettings.getForExtension.useQuery(
    { extension: normalized },
    {
      enabled: open && Boolean(normalized),
      staleTime: 60 * 1000,
    },
  );

  const [editing, setEditing] = React.useState(false);
  const [marginType, setMarginType] = React.useState<"PERCENTAGE" | "FIXED">(
    "PERCENTAGE",
  );
  const [percentageMargin, setPercentageMargin] = React.useState("25");
  const [fixedMargin, setFixedMargin] = React.useState("5.00");
  const [roundOff, setRoundOff] = React.useState("");

  const override = data?.data?.override ?? null;
  const defaultSetting = data?.data?.default ?? null;
  const isOverride = Boolean(data?.data?.isOverride);

  React.useEffect(() => {
    if (!editing) return;
    const source = override ?? defaultSetting;
    if (source?.marginType === "FIXED") {
      setMarginType("FIXED");
      setFixedMargin(source.fixedMargin ?? "5.00");
    } else {
      setMarginType("PERCENTAGE");
      setPercentageMargin(source?.percentageMargin ?? "25");
    }
    setRoundOff(source?.roundOff ?? "");
  }, [editing, override, defaultSetting]);

  React.useEffect(() => {
    if (!open) setEditing(false);
  }, [open]);

  const invalidate = React.useCallback(async () => {
    await Promise.all([
      utils.tldSettings.getForExtension.invalidate({ extension: normalized }),
      utils.tldSettings.listMarginMap.invalidate(),
      utils.tldSettings.list.invalidate(),
      utils.tldSettings.getDefault.invalidate(),
    ]);
  }, [utils, normalized]);

  const upsertMutation = trpc.tldSettings.upsertExtensionMargin.useMutation({
    onSuccess: async () => {
      toast.success(`Custom margin saved for .${normalized}`);
      setEditing(false);
      await invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to save margin");
    },
  });

  const clearMutation = trpc.tldSettings.clearExtensionMargin.useMutation({
    onSuccess: async () => {
      toast.success(`Custom margin cleared for .${normalized}`);
      setEditing(false);
      await invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to clear margin");
    },
  });

  const handleSave = () => {
    if (marginType === "PERCENTAGE") {
      const n = parseFloat(percentageMargin);
      if (Number.isNaN(n) || n < 0 || n > 1000) {
        toast.error("Percentage must be between 0 and 1000");
        return;
      }
    } else {
      const n = parseFloat(fixedMargin);
      if (Number.isNaN(n) || n < 0 || n > 10000) {
        toast.error("Fixed margin must be between 0 and 10000");
        return;
      }
    }
    if (roundOff) {
      const n = parseFloat(roundOff);
      if (Number.isNaN(n) || n < 0.01 || n > 1) {
        toast.error("Round off must be between 0.01 and 1");
        return;
      }
    }

    upsertMutation.mutate({
      extension: normalized,
      marginType,
      percentageMargin:
        marginType === "PERCENTAGE" ? percentageMargin : undefined,
      fixedMargin: marginType === "FIXED" ? fixedMargin : undefined,
      roundOff: roundOff || undefined,
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-3">
        <h3 className="text-lg font-semibold">Retail Margin</h3>
        {!editing && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditing(true)}
            disabled={isLoading}
          >
            <Pencil className="h-3.5 w-3.5 mr-1.5" />
            {isOverride ? "Edit margin" : "Set custom margin"}
          </Button>
        )}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading margin…</p>
      ) : editing ? (
        <div className="space-y-3 rounded-lg border border-border p-3">
          <div className="space-y-1.5">
            <Label>Margin type</Label>
            <Select
              value={marginType}
              onValueChange={(v) => setMarginType(v as "PERCENTAGE" | "FIXED")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                <SelectItem value="FIXED">Fixed amount</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>
              {marginType === "PERCENTAGE"
                ? "Percentage margin"
                : "Fixed margin"}
            </Label>
            <Input
              type="number"
              step="any"
              min={0}
              placeholder={marginType === "PERCENTAGE" ? "25" : "5.00"}
              value={
                marginType === "PERCENTAGE" ? percentageMargin : fixedMargin
              }
              onChange={(e) => {
                if (marginType === "PERCENTAGE") {
                  setPercentageMargin(e.target.value);
                } else {
                  setFixedMargin(e.target.value);
                }
              }}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Round off (optional)</Label>
            <Input
              type="number"
              step="0.01"
              min={0.01}
              max={1}
              placeholder="0.01"
              value={roundOff}
              onChange={(e) => setRoundOff(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              size="sm"
              onClick={handleSave}
              disabled={upsertMutation.isPending}
            >
              {upsertMutation.isPending ? "Saving…" : "Save custom margin"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setEditing(false)}
              disabled={upsertMutation.isPending}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2 py-2 border-b">
            <span className="text-sm font-medium text-muted-foreground">
              Applied
            </span>
            <div className="text-right">
              <Badge variant={isOverride ? "default" : "secondary"}>
                {isOverride ? "Custom" : "Default"}
              </Badge>
              <p className="text-sm mt-1">
                {formatMarginSummary(
                  isOverride ? override : defaultSetting,
                )}
              </p>
            </div>
          </div>
          {isOverride && defaultSetting && (
            <div className="flex items-start justify-between gap-2 py-2 border-b">
              <span className="text-sm font-medium text-muted-foreground">
                Platform default
              </span>
              <p className="text-sm text-muted-foreground text-right">
                {formatMarginSummary(defaultSetting)}
              </p>
            </div>
          )}
          {isOverride && (
            <Button
              variant="outline"
              size="sm"
              className="mt-1"
              onClick={() => clearMutation.mutate({ extension: normalized })}
              disabled={clearMutation.isPending}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              {clearMutation.isPending
                ? "Clearing…"
                : "Clear custom (use default)"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
