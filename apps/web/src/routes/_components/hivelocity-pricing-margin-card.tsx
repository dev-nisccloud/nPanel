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

import type { HivelocityProductType } from "@/hooks/use-hivelocity-pricing";

const formSchema = z
  .object({
    marginType: z.enum(["PERCENTAGE", "FIXED"]).optional().nullable(),
    percentageMargin: z.string().optional().nullable(),
    fixedMargin: z.string().optional().nullable(),
    roundOff: z.string().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.marginType === "PERCENTAGE") {
      if (!data.percentageMargin?.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Required", path: ["percentageMargin"] });
      }
    }
    if (data.marginType === "FIXED") {
      if (!data.fixedMargin?.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Required", path: ["fixedMargin"] });
      }
    }
  });

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
  const [form, setForm] = React.useState({
    marginType: (current as any)?.marginType ?? ("PERCENTAGE" as "PERCENTAGE" | "FIXED"),
    percentageMargin: (current as any)?.percentageMargin ?? "",
    fixedMargin: (current as any)?.fixedMargin ?? "",
    roundOff: (current as any)?.roundOff ?? "0.01",
  });

  React.useEffect(() => {
    if (!open) return;
    setErrors({});
    setForm({
      marginType: (current as any)?.marginType ?? ("PERCENTAGE" as "PERCENTAGE" | "FIXED"),
      percentageMargin: (current as any)?.percentageMargin ?? "",
      fixedMargin: (current as any)?.fixedMargin ?? "",
      roundOff: (current as any)?.roundOff ?? "0.01",
    });
  }, [open, current]);

  const onSave = async () => {
    const parsed = formSchema.safeParse(form);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "form");
        next[key] = issue.message;
      }
      setErrors(next);
      return;
    }

    setErrors({});
    await upsertMutation.mutateAsync({
      productType,
      marginType: parsed.data.marginType ?? undefined,
      percentageMargin: parsed.data.marginType === "PERCENTAGE" ? parsed.data.percentageMargin ?? undefined : undefined,
      fixedMargin: parsed.data.marginType === "FIXED" ? parsed.data.fixedMargin ?? undefined : undefined,
      roundOff: parsed.data.roundOff ?? undefined,
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
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Margin type</span>
                <span className="font-medium">{(current as any).marginType ?? "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Value</span>
                <span className="font-medium">
                  {(current as any).marginType === "PERCENTAGE"
                    ? `${(current as any).percentageMargin ?? "—"}%`
                    : (current as any).marginType === "FIXED"
                      ? `$${(current as any).fixedMargin ?? "—"}`
                      : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Round off</span>
                <span className="font-medium">{(current as any).roundOff ?? "—"}</span>
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
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Margin configuration</CardTitle>
                <CardDescription>Applied to base USD prices before conversion to KES.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Margin type</Label>
                    <Select
                      value={form.marginType ?? "PERCENTAGE"}
                      onValueChange={(v) => setForm((p) => ({ ...p, marginType: v as any }))}
                    >
                      <SelectTrigger className={errors.marginType ? "border-destructive" : ""}>
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
                    <Select value={form.roundOff ?? "0.01"} onValueChange={(v) => setForm((p) => ({ ...p, roundOff: v }))}>
                      <SelectTrigger className={errors.roundOff ? "border-destructive" : ""}>
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

                {form.marginType === "PERCENTAGE" ? (
                  <div className="space-y-2">
                    <Label>Percentage margin</Label>
                    <Input
                      placeholder="25"
                      value={form.percentageMargin ?? ""}
                      onChange={(e) => setForm((p) => ({ ...p, percentageMargin: e.target.value }))}
                      className={errors.percentageMargin ? "border-destructive" : ""}
                    />
                    {errors.percentageMargin ? <p className="text-sm text-destructive">{errors.percentageMargin}</p> : null}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>Fixed margin (USD)</Label>
                    <Input
                      placeholder="5.00"
                      value={form.fixedMargin ?? ""}
                      onChange={(e) => setForm((p) => ({ ...p, fixedMargin: e.target.value }))}
                      className={errors.fixedMargin ? "border-destructive" : ""}
                    />
                    {errors.fixedMargin ? <p className="text-sm text-destructive">{errors.fixedMargin}</p> : null}
                  </div>
                )}
              </CardContent>
            </Card>

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

