"use client";

import * as React from "react";
import { DollarSign, Trash2, Pencil } from "lucide-react";
import { z } from "zod";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { toast } from "@/components/ui/sonner";
import { useConfirm } from "@/hooks/use-confirm";
import { trpc } from "@/utils/trpc";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/npanel-ui/sheet";

import type { HivelocityProductType, MarginType } from "@/hooks/use-hivelocity-pricing";
import { captureEvent } from "@/lib/posthog";

const marginBlockSchema = z
  .object({
    marginType: z.enum(["PERCENTAGE", "FIXED"]).optional().nullable(),
    percentageMargin: z.string().optional().nullable(),
    fixedMargin: z.string().optional().nullable(),
    roundOff: z.string().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.marginType === "PERCENTAGE" && !data.percentageMargin?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Required", path: ["percentageMargin"] });
    }
    if (data.marginType === "FIXED" && !data.fixedMargin?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Required", path: ["fixedMargin"] });
    }
  });

const formSchema = z.object({
  base: marginBlockSchema,
  os: marginBlockSchema,
  addons: marginBlockSchema,
});

type MarginFormBlock = z.infer<typeof marginBlockSchema>;
type FormState = z.infer<typeof formSchema>;

function getDisplayValue(block: { marginType: string | null; percentageMargin: string | null; fixedMargin: string | null }) {
  if (block.marginType === "PERCENTAGE") return `${block.percentageMargin ?? " "}%`;
  if (block.marginType === "FIXED") return `$${block.fixedMargin ?? " "}`;
  return " ";
}

function defaultBlockFromCurrent(current: any, prefix: "" | "os" | "addons"): MarginFormBlock {
  const cap = (s: string) => (s ? s[0]!.toUpperCase() + s.slice(1) : s);
  if (!prefix) {
    return {
      marginType: (current?.marginType ?? "PERCENTAGE") as MarginType,
      percentageMargin: current?.percentageMargin ?? "",
      fixedMargin: current?.fixedMargin ?? "",
      roundOff: current?.roundOff ?? "0.01",
    };
  }
  const key = cap(prefix);
  return {
    marginType: (current?.[`${prefix}MarginType`] ?? current?.[`${prefix}MarginType`] ?? "PERCENTAGE") as MarginType,
    percentageMargin: current?.[`${prefix}PercentageMargin`] ?? "",
    fixedMargin: current?.[`${prefix}FixedMargin`] ?? "",
    roundOff: current?.[`${prefix}RoundOff`] ?? "0.01",
  };
}

function parseErrors(parsed: z.SafeParseReturnType<FormState, FormState>) {
  if (parsed.success) return {};
  const next: Record<string, string> = {};
  for (const issue of parsed.error.issues) {
    const path = issue.path.map(String).join(".");
    next[path || "form"] = issue.message;
  }
  return next;
}

function blockKey(prefix: "base" | "os" | "addons", field: keyof MarginFormBlock) {
  return `${prefix}.${String(field)}`;
}

function MarginSection({
  title,
  description,
  value,
  errors,
  onChange,
}: {
  title: string;
  description: string;
  value: MarginFormBlock;
  errors: Record<string, string>;
  onChange: (next: MarginFormBlock) => void;
}) {
  const err = (k: keyof MarginFormBlock) => errors[k as string];
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Margin type</Label>
            <Select value={value.marginType ?? "PERCENTAGE"} onValueChange={(v) => onChange({ ...value, marginType: v as any })}>
              <SelectTrigger className={err("marginType") ? "border-destructive" : ""}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                <SelectItem value="FIXED">Fixed (USD)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Round off</Label>
            <Select value={value.roundOff ?? "0.01"} onValueChange={(v) => onChange({ ...value, roundOff: v })}>
              <SelectTrigger className={err("roundOff") ? "border-destructive" : ""}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0.01">0.01</SelectItem>
                <SelectItem value="0.05">0.05</SelectItem>
                <SelectItem value="0.10">0.10</SelectItem>
                <SelectItem value="1.00">1.00</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {value.marginType === "PERCENTAGE" ? (
          <div className="space-y-2">
            <Label>Percentage margin</Label>
            <Input
              placeholder="25"
              value={value.percentageMargin ?? ""}
              onChange={(e) => onChange({ ...value, percentageMargin: e.target.value })}
              className={err("percentageMargin") ? "border-destructive" : ""}
            />
            {err("percentageMargin") ? <p className="text-sm text-destructive">{err("percentageMargin")}</p> : null}
          </div>
        ) : (
          <div className="space-y-2">
            <Label>Fixed margin (USD)</Label>
            <Input
              placeholder="5.00"
              value={value.fixedMargin ?? ""}
              onChange={(e) => onChange({ ...value, fixedMargin: e.target.value })}
              className={err("fixedMargin") ? "border-destructive" : ""}
            />
            {err("fixedMargin") ? <p className="text-sm text-destructive">{err("fixedMargin")}</p> : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function HivelocityPricingMarginCard({
  productType,
  title = "Pricing margin",
  description = "Configure the margin added to the prices your customer sees (converted to KES).",
}: {
  productType: HivelocityProductType;
  title?: string;
  description?: string;
}) {
  const utils = trpc.useUtils();
  const settingsQuery = trpc.hivelocityPricingSettings.get.useQuery({ productType });

  const upsertMutation = trpc.hivelocityPricingSettings.upsert.useMutation({
    onSuccess: () => {
      captureEvent("hivelocity_pricing_settings_updated", {
        margin_changed: true,
        product_type: productType,
      });
      toast.success("Pricing margin saved");
      utils.hivelocityPricingSettings.get.invalidate({ productType });
      setOpen(false);
    },
    onError: (e) => toast.error(e.message || "Failed to save pricing margin"),
  });

  const deleteMutation = trpc.hivelocityPricingSettings.delete.useMutation({
    onSuccess: () => {
      toast.success("Pricing margin deleted");
      utils.hivelocityPricingSettings.get.invalidate({ productType });
    },
    onError: (e) => toast.error(e.message || "Failed to delete pricing margin"),
  });

  const [ConfirmDialog, confirm] = useConfirm("Delete pricing margin?", "This will remove the margin configuration for this product.");

  const current = settingsQuery.data?.success ? settingsQuery.data.data : null;

  const [open, setOpen] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [form, setForm] = React.useState<FormState>(() => ({
    base: defaultBlockFromCurrent(current as any, ""),
    os: defaultBlockFromCurrent(current as any, "os"),
    addons: defaultBlockFromCurrent(current as any, "addons"),
  }));

  React.useEffect(() => {
    if (!open) return;
    setErrors({});
    setForm({
      base: defaultBlockFromCurrent(current as any, ""),
      os: defaultBlockFromCurrent(current as any, "os"),
      addons: defaultBlockFromCurrent(current as any, "addons"),
    });
  }, [open, current]);

  const onSave = async () => {
    const parsed = formSchema.safeParse(form);
    if (!parsed.success) {
      setErrors(parseErrors(parsed));
      return;
    }

    setErrors({});
    await upsertMutation.mutateAsync({
      productType,
      marginType: parsed.data.base.marginType ?? undefined,
      percentageMargin:
        parsed.data.base.marginType === "PERCENTAGE" ? parsed.data.base.percentageMargin ?? undefined : undefined,
      fixedMargin: parsed.data.base.marginType === "FIXED" ? parsed.data.base.fixedMargin ?? undefined : undefined,
      roundOff: parsed.data.base.roundOff ?? undefined,

      osMarginType: parsed.data.os.marginType ?? undefined,
      osPercentageMargin: parsed.data.os.marginType === "PERCENTAGE" ? parsed.data.os.percentageMargin ?? undefined : undefined,
      osFixedMargin: parsed.data.os.marginType === "FIXED" ? parsed.data.os.fixedMargin ?? undefined : undefined,
      osRoundOff: parsed.data.os.roundOff ?? undefined,

      addonsMarginType: parsed.data.addons.marginType ?? undefined,
      addonsPercentageMargin:
        parsed.data.addons.marginType === "PERCENTAGE" ? parsed.data.addons.percentageMargin ?? undefined : undefined,
      addonsFixedMargin: parsed.data.addons.marginType === "FIXED" ? parsed.data.addons.fixedMargin ?? undefined : undefined,
      addonsRoundOff: parsed.data.addons.roundOff ?? undefined,
    });
  };

  const onDelete = async () => {
    const ok = await confirm();
    if (!ok) return;
    await deleteMutation.mutateAsync({ productType });
  };

  if (settingsQuery.isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-3/4" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-9 w-28" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <ConfirmDialog />
      <Card className="transition-all hover:shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                {title}
              </CardTitle>
              <CardDescription className="mt-1">{description}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {current ? (
                <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              ) : (
                <Button size="sm" onClick={() => setOpen(true)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Set up
                </Button>
              )}
              {current ? (
                <Button variant="outline" size="sm" onClick={onDelete} disabled={deleteMutation.isPending}>
                  {deleteMutation.isPending ? (
                    <Spinner size="sm" />
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </>
                  )}
                </Button>
              ) : null}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {current ? (
            <div className="grid gap-2 text-sm">
              <div className="grid gap-3">
                <div className="rounded-lg border bg-muted/20 p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Base plan</span>
                    <span className="text-muted-foreground">
                      {(current as any).marginType ?? " "} · {getDisplayValue(current as any)} · RO {(current as any).roundOff ?? " "}
                    </span>
                  </div>
                </div>

                <div className="rounded-lg border bg-muted/20 p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Operating System</span>
                    <span className="text-muted-foreground">
                      {(current as any).osMarginType ?? " "} ·{" "}
                      {getDisplayValue({
                        marginType: (current as any).osMarginType ?? null,
                        percentageMargin: (current as any).osPercentageMargin ?? null,
                        fixedMargin: (current as any).osFixedMargin ?? null,
                      })}{" "}
                      · RO {(current as any).osRoundOff ?? " "}
                    </span>
                  </div>
                </div>

                <div className="rounded-lg border bg-muted/20 p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Add-ons</span>
                    <span className="text-muted-foreground">
                      {(current as any).addonsMarginType ?? " "} ·{" "}
                      {getDisplayValue({
                        marginType: (current as any).addonsMarginType ?? null,
                        percentageMargin: (current as any).addonsPercentageMargin ?? null,
                        fixedMargin: (current as any).addonsFixedMargin ?? null,
                      })}{" "}
                      · RO {(current as any).addonsRoundOff ?? " "}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No pricing margin configured yet.</p>
          )}
        </CardContent>
      </Card>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="overflow-y-auto max-w-xl">
          <SheetHeader className="mb-4">
            <SheetTitle>Pricing margin</SheetTitle>
            <SheetDescription>Set the pricing margin for {productType.replaceAll("_", " ")}.</SheetDescription>
            <SheetClose asChild>
              <Button size="icon" variant="ghost" className="absolute right-6 top-6" aria-label="Close">
                ×
              </Button>
            </SheetClose>
          </SheetHeader>

          <div className="space-y-5">
            <MarginSection
              title="Base plan markup"
              description="Applied to the product base USD prices before conversion to KES."
              value={form.base}
              errors={{
                marginType: errors[blockKey("base", "marginType")] ?? "",
                percentageMargin: errors[blockKey("base", "percentageMargin")] ?? "",
                fixedMargin: errors[blockKey("base", "fixedMargin")] ?? "",
                roundOff: errors[blockKey("base", "roundOff")] ?? "",
              }}
              onChange={(next) => setForm((p) => ({ ...p, base: next }))}
            />

            <MarginSection
              title="Operating System markup"
              description="Applied to OS license price (USD) before conversion to KES."
              value={form.os}
              errors={{
                marginType: errors[blockKey("os", "marginType")] ?? "",
                percentageMargin: errors[blockKey("os", "percentageMargin")] ?? "",
                fixedMargin: errors[blockKey("os", "fixedMargin")] ?? "",
                roundOff: errors[blockKey("os", "roundOff")] ?? "",
              }}
              onChange={(next) => setForm((p) => ({ ...p, os: next }))}
            />

            <MarginSection
              title="Add-ons markup"
              description="Applied to each selected add-on price (USD) before conversion to KES."
              value={form.addons}
              errors={{
                marginType: errors[blockKey("addons", "marginType")] ?? "",
                percentageMargin: errors[blockKey("addons", "percentageMargin")] ?? "",
                fixedMargin: errors[blockKey("addons", "fixedMargin")] ?? "",
                roundOff: errors[blockKey("addons", "roundOff")] ?? "",
              }}
              onChange={(next) => setForm((p) => ({ ...p, addons: next }))}
            />

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={onSave} disabled={upsertMutation.isPending}>
                {upsertMutation.isPending ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    Saving...
                  </>
                ) : (
                  "Save"
                )}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

