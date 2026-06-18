"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "@/components/ui/sonner";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/npanel-ui/sheet";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { trpc } from "@/utils/trpc";
import { ComboboxDropdown } from "@npanel/ui/components/combobox-dropdown";
import type { ComboboxItem } from "@npanel/ui/components/combobox-dropdown";
import type { EtimsItemRecord } from "./etims-item-utils";

const FALLBACK_ITEM_CLASS_OPTIONS: ComboboxItem[] = [
  { id: "81112100", label: "81112100   Computer programmers" },
  { id: "81111600", label: "81111600   Computer programmers (alt listing)" },
  { id: "81161600", label: "81161600   Electronic mail and messaging services" },
  { id: "83111600", label: "83111600   Mobile communications services" },
  { id: "82101600", label: "82101600   Broadcast advertising" },
  { id: "80171600", label: "80171600   Publicity and marketing support services" },
  { id: "82111600", label: "82111600   Non technical writing" },
  { id: "82141600", label: "82141600   Graphic display services" },
].sort((a, b) => a.id.localeCompare(b.id));

const formSchema = z.object({
  itemNm: z.string().min(1, "Service name is required"),
  itemClsCd: z.string().min(1, "Item classification code is required"),
  taxTyCd: z.enum(["A", "B", "C", "D", "E"]).default("B"),
  dftPrc: z.coerce.number().min(0, "Price must be >= 0").default(0),

  // KRA itemCd format: {orgnNatCd(2)}{itemTyCd(1)}{pkgUnitCd(2)}X{qtyUnitCd(1-2)}[X]{seq(7)}
  // Examples from existing KRA items: KE3OUXGRO0000001, KE3OUXNOX0000001, KE3OUXU0000001
  itemCd: z.string()
    .min(1, "Item code is required")
    .regex(
      /^[A-Z]{2}\d[A-Z]{2}X[A-Z0-9]+\d{7}$/,
      "Invalid itemCd format. Use the Generate button to create a valid code."
    ),
  itemStdNm: z.string().nullable().optional(),
  orgnNatCd: z.string().length(2).default("KE"),
  pkgUnitCd: z.string().min(1).default("OU"),
  qtyUnitCd: z.string().min(1).default("U"),
  btchNo: z.string().nullable().optional(),
  bcd: z.string().nullable().optional(),
  addInfo: z.string().nullable().optional(),
  sftyQty: z.coerce.number().nullable().optional(),
  useYn: z.enum(["Y", "N"]).default("Y"),
});

type FormData = z.infer<typeof formSchema>;

export function RegisterETimsItemSheet({
  open,
  onOpenChange,
  onSuccess,
  initialItem,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  initialItem?: EtimsItemRecord | null;
}) {
  const isEdit = !!initialItem?.itemCd;
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      itemNm: "",
      itemClsCd: "",
      taxTyCd: "B",
      dftPrc: 0,
      itemCd: "",
      itemStdNm: null,
      orgnNatCd: "KE",
      pkgUnitCd: "OU",
      qtyUnitCd: "U",
      btchNo: null,
      bcd: null,
      addInfo: null,
      sftyQty: 0,
      useYn: "Y",
    },
  });

  const { data: itemClassData } = trpc.etims.data.getItemClassList.useQuery(
    { lastReqDt: "20230101000000" },
    { enabled: open, staleTime: 5 * 60_000 },
  );

  const itemClassOptions = React.useMemo(() => {
    const root: any = itemClassData;
    const payload = root?.data?.responseBody?.data ?? root?.data ?? root?.responseBody?.data ?? root;
    const data: any = payload?.data ?? payload;
    const list: any[] = data?.itemClsList ?? [];

    const mapped = list
      .filter((row) => row?.itemClsCd && row?.itemClsNm)
      .map((row) => ({
        id: String(row.itemClsCd).trim(),
        label: `${row.itemClsCd}   ${row.itemClsNm}`,
      }))
      .sort((a, b) => a.id.localeCompare(b.id));

    return mapped;
  }, [itemClassData]);

  const selectedItemClsCd = form.watch("itemClsCd");

  const effectiveItemClassOptions = React.useMemo(() => {
    const base = itemClassOptions.length > 0 ? itemClassOptions : FALLBACK_ITEM_CLASS_OPTIONS;
    const byId = new Map(base.map((option) => [option.id, option]));

    const ensureOption = (code?: string | null) => {
      const id = code?.trim();
      if (!id || byId.has(id)) return;
      byId.set(id, { id, label: `${id}   (saved classification)` });
    };

    ensureOption(initialItem?.itemClsCd);
    ensureOption(selectedItemClsCd);

    return Array.from(byId.values()).sort((a, b) => a.id.localeCompare(b.id));
  }, [itemClassOptions, initialItem?.itemClsCd, selectedItemClsCd]);

  const itemClassFetchFailed = React.useMemo(() => {
    const root: any = itemClassData;
    return root?.success === false;
  }, [itemClassData]);

  const buildFormValues = React.useCallback((item: EtimsItemRecord): FormData => ({
    itemNm: item.itemNm,
    itemClsCd: String(item.itemClsCd ?? "").trim(),
    taxTyCd: (item.taxTyCd === "A" || item.taxTyCd === "B" || item.taxTyCd === "C" || item.taxTyCd === "D" || item.taxTyCd === "E")
      ? item.taxTyCd
      : "B",
    dftPrc: Number(item.dftPrc ?? 0),
    itemCd: item.itemCd,
    itemStdNm: item.itemStdNm ?? null,
    orgnNatCd: item.orgnNatCd ?? "KE",
    pkgUnitCd: item.pkgUnitCd ?? "OU",
    qtyUnitCd: item.qtyUnitCd ?? "U",
    btchNo: item.btchNo ?? null,
    bcd: item.bcd ?? null,
    addInfo: item.addInfo ?? null,
    sftyQty: item.sftyQty != null ? Number(item.sftyQty) : 0,
    useYn: item.useYn === "N" ? "N" : "Y",
  }), []);

  React.useEffect(() => {
    if (!open) return;
    if (initialItem) {
      form.reset(buildFormValues(initialItem));
      return;
    }
    form.reset({
      itemNm: "",
      itemClsCd: "",
      taxTyCd: "B",
      dftPrc: 0,
      itemCd: "",
      itemStdNm: null,
      orgnNatCd: "KE",
      pkgUnitCd: "OU",
      qtyUnitCd: "U",
      btchNo: null,
      bcd: null,
      addInfo: null,
      sftyQty: 0,
      useYn: "Y",
    });
  }, [open, initialItem, form, buildFormValues]);

  React.useEffect(() => {
    if (!open || !initialItem) return;
    form.setValue("itemClsCd", String(initialItem.itemClsCd ?? "").trim(), { shouldDirty: false });
  }, [open, initialItem, effectiveItemClassOptions.length, form]);

  React.useEffect(() => {
    if (!open || isEdit) return;
    const current = form.getValues("itemClsCd");
    if (current || effectiveItemClassOptions.length === 0) return;
    form.setValue("itemClsCd", effectiveItemClassOptions[0]!.id, { shouldValidate: true });
  }, [open, isEdit, effectiveItemClassOptions, form]);

  const saveItem = trpc.etims.items.saveItem.useMutation({
    onSuccess: (res: any) => {
      // The router never throws   it always returns { success, data, errorMessage, requiresReinitialization }
      if (res?.success === false) {
        if (res?.requiresReinitialization) {
          toast.error(
            "KRA session expired   please re-initialize your device in Settings, then try again.",
            {
              duration: 8000,
              action: {
                label: "Go to Settings",
                onClick: () => {
                  window.location.href = "/agency/kra-etims/settings";
                },
              },
            }
          );
        } else {
          toast.error(res?.errorMessage ?? "Failed to register item");
        }
        return;
      }
      const body = res?.data?.responseBody ?? res?.data ?? res;
      if (body?.resultCd && body.resultCd !== "000") {
        toast.error(body?.resultMsg ?? "Failed to register item");
        return;
      }
      toast.success(isEdit ? "Product updated in KRA eTIMS" : "Service registered in KRA eTIMS");
      form.reset();
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to register service");
    },
  });

  const { data: itemsData } = trpc.etims.items.getItemList.useQuery(
    { lastReqDt: "20230101000000" },
    { enabled: open, staleTime: 30_000 },
  );

  const generateNextItemCd = React.useCallback(() => {
    const orgnNatCd = form.getValues("orgnNatCd");
    const pkgUnitCd = form.getValues("pkgUnitCd");
    const qtyUnitCd = form.getValues("qtyUnitCd");
    // For npanel we register services only.
    const itemTyCd = "3";
    // Observed from existing KRA items for this taxpayer:
    // - KE3OUXGRO0000001
    // - KE3OUXNOX0000001
    // - KE3OUXU0000001
    // Pattern: {orgnNatCd}{itemTyCd}{pkgUnitCd}X{qtyUnitCd}{optional 'X' if qtyUnitCd length is 2}{7-digit seq}
    const qtySuffix = qtyUnitCd.length === 2 ? `${qtyUnitCd}X` : qtyUnitCd;
    const prefix = `${orgnNatCd}${itemTyCd}${pkgUnitCd}X${qtySuffix}`;

    const root: any = itemsData;
    const payload = root?.data?.responseBody?.data ?? root?.data ?? root?.responseBody?.data ?? root;
    const data: any = payload?.data ?? payload;
    const list: any[] = data?.itemList ?? [];

    let maxSeq = 0;
    for (const it of list) {
      const code: string | undefined = it?.itemCd;
      if (!code || typeof code !== "string") continue;
      if (!code.startsWith(prefix)) continue;
      const tail = code.slice(prefix.length);
      const seq = Number.parseInt(tail, 10);
      if (Number.isFinite(seq)) maxSeq = Math.max(maxSeq, seq);
    }

    const nextSeq = (maxSeq || 0) + 1;
    const seqStr = String(nextSeq).padStart(7, "0");
    return `${prefix}${seqStr}`;
  }, [form, itemsData]);

  React.useEffect(() => {
    if (!open || isEdit) return;
    // Auto-generate itemCd on open (or when units change).
    const itemCd = form.getValues("itemCd");
    if (!itemCd) {
      form.setValue("itemCd", generateNextItemCd(), { shouldValidate: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isEdit, generateNextItemCd]);

  const onSubmit = (data: FormData) => {
    const itemTyCd = isEdit ? String(initialItem?.itemTyCd ?? "3") : "3";
    if (itemTyCd !== "1" && itemTyCd !== "2" && itemTyCd !== "3") {
      toast.error("Invalid item type on record");
      return;
    }
    saveItem.mutate({
      item: {
        itemCd: data.itemCd,
        itemClsCd: data.itemClsCd,
        itemTyCd: itemTyCd as "1" | "2" | "3",
        itemNm: data.itemNm,
        itemStdNm: data.itemStdNm ?? null,
        orgnNatCd: data.orgnNatCd,
        pkgUnitCd: data.pkgUnitCd,
        qtyUnitCd: data.qtyUnitCd,
        taxTyCd: data.taxTyCd,
        btchNo: data.btchNo ?? null,
        bcd: data.bcd ?? null,
        dftPrc: data.dftPrc,
        grpPrcL1: data.dftPrc,
        grpPrcL2: data.dftPrc,
        grpPrcL3: data.dftPrc,
        grpPrcL4: data.dftPrc,
        grpPrcL5: 0,
        addInfo: data.addInfo ?? null,
        sftyQty: data.sftyQty ?? 0,
        isrcAplcbYn: "N",
        useYn: data.useYn,
        regrNm: "Admin",
        regrId: "Admin",
        modrNm: "Admin",
        modrId: "Admin",
      },
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEdit ? "Edit product" : "Register Service"}</SheetTitle>
          <SheetDescription>
            {isEdit
              ? "Updates the item on KRA eTIMS via /saveItem (same endpoint used to register)."
              : "Registers a service item in KRA eTIMS."}
          </SheetDescription>
        </SheetHeader>

        <Form {...form} key={isEdit ? `edit-${initialItem?.itemCd}` : "create"}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">
            <FormField
              control={form.control}
              name="itemNm"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service name</FormLabel>
                  <FormControl>
                    <Input placeholder='e.g. "Website Development"' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="itemCd"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Item code (itemCd)</FormLabel>
                  <FormControl>
                    <div className="flex gap-2">
                      {/* Read-only styled input   only the Generate button or useEffect changes this */}
                      <Input
                        className="font-mono bg-muted/40 cursor-not-allowed"
                        readOnly
                        tabIndex={-1}
                        placeholder="Click Generate →"
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        disabled={isEdit}
                        onClick={() =>
                          form.setValue("itemCd", generateNextItemCd(), { shouldValidate: true })
                        }
                      >
                        Generate
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="itemClsCd"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Item classification code (HS)</FormLabel>
                  <FormControl>
                    <ComboboxDropdown
                      inDialog
                      key={`item-cls-${field.value || "empty"}`}
                      placeholder="Select classification code"
                      searchPlaceholder="Search by code or name..."
                      items={effectiveItemClassOptions}
                      selectedItem={effectiveItemClassOptions.find(
                        (x) => x.id === String(field.value ?? "").trim(),
                      )}
                      onSelect={(item) => field.onChange(item.id)}
                      emptyResults="No classifications found"
                      disabled={effectiveItemClassOptions.length === 0}
                      className="w-full"
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    {itemClassFetchFailed
                      ? "KRA item classification sync is temporarily unavailable; using fallback codes."
                      : "Choose a valid KRA item classification code (fetched from eTIMS)."}
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="taxTyCd"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tax type</FormLabel>
                    <Select key={`tax-${field.value}`} value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select tax type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="A">A (Exempt)</SelectItem>
                        <SelectItem value="B">B (16%)</SelectItem>
                        <SelectItem value="C">C (0%)</SelectItem>
                        <SelectItem value="D">D (Non-VAT)</SelectItem>
                        <SelectItem value="E">E (8%)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dftPrc"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default unit price</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={Number.isFinite(field.value) ? field.value : 0}
                        onChange={(e) => field.onChange(e.target.value === "" ? 0 : Number(e.target.value))}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="pkgUnitCd"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Packaging unit code</FormLabel>
                    <FormControl>
                      <Input placeholder="OU" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="qtyUnitCd"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity unit code</FormLabel>
                    <FormControl>
                      <Input placeholder="U" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <SheetFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset();
                  onOpenChange(false);
                }}
                disabled={saveItem.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saveItem.isPending}>
                {saveItem.isPending ? (
                  <>
                    <Spinner size={16} className="mr-2" />
                    Registering...
                  </>
                ) : (
                  isEdit ? "Save changes" : "Register Service"
                )}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}


