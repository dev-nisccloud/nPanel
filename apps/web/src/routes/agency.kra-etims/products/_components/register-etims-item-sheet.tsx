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
import type { EtimsItemRecord } from "./etims-item-utils";
import { ItemClassificationPicker } from "./item-classification-picker";

const formSchema = z.object({
  itemNm: z.string().min(1, "Service name is required"),
  itemClsCd: z.string().min(1, "Item classification code is required"),
  taxTyCd: z.enum(["A", "B", "C", "D", "E"]).default("B"),
  dftPrc: z.coerce.number().min(0, "Price must be >= 0").default(0),

  // Official KRA itemCd (OSCU §4.19): {orgnNatCd}{itemTyCd}{pkgUnitCd}{qtyUnitCd}{seq7}
  // Example: KE2NTBA0000012  do NOT insert X between pkg and qty (Apigee rejects "XU").
  itemCd: z.string()
    .min(1, "Item code is required")
    .regex(
      /^[A-Z]{2}\d[A-Z0-9]+\d{7}$/,
      "Invalid itemCd format. Use the Generate button to create a valid code."
    ),
  itemStdNm: z.string().nullable().optional(),
  orgnNatCd: z.string().length(2).default("KE"),
  pkgUnitCd: z.string().min(1).default("OU"),
  // Apigee rejects 1-char qty units in itemCd ("U"); prefer 2-char codes like NO.
  qtyUnitCd: z.string().min(1).default("NO"),
  btchNo: z.string().nullable().optional(),
  bcd: z.string().nullable().optional(),
  addInfo: z.string().nullable().optional(),
  sftyQty: z.coerce.number().nullable().optional(),
  useYn: z.enum(["Y", "N"]).default("Y"),
});

type FormData = z.infer<typeof formSchema>;

export type NiscProductKraSyncSource = {
  id: string;
  name: string;
  etimsItemClsCd?: string | null;
  etimsTaxTyCd?: string | null;
  etimsDefaultPrice?: string | null;
  etimsPkgUnitCd?: string | null;
  etimsQtyUnitCd?: string | null;
};

function parseTaxTyCd(value?: string | null): FormData["taxTyCd"] {
  if (value === "A" || value === "B" || value === "C" || value === "D" || value === "E") return value;
  return "B";
}

const EMPTY_FORM_VALUES: FormData = {
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
};

const KRA_ITEM_LIST_INPUT = { lastReqDt: "20230101000000" } as const;

export function RegisterETimsItemSheet({
  open,
  onOpenChange,
  onSuccess,
  initialItem,
  syncNiscProduct,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  initialItem?: EtimsItemRecord | null;
  /** When set, syncs to KRA then persists eTIMS fields on the Nisc product. */
  syncNiscProduct?: NiscProductKraSyncSource | null;
}) {
  const isSyncFromNisc = !!syncNiscProduct;
  const isEdit = !isSyncFromNisc && !!initialItem?.itemCd;
  const utils = trpc.useUtils();
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: EMPTY_FORM_VALUES,
  });

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

  const pendingItemCdRef = React.useRef(false);
  const awaitingFreshItemListRef = React.useRef(false);

  React.useEffect(() => {
    if (!open) {
      pendingItemCdRef.current = false;
      awaitingFreshItemListRef.current = false;
      form.reset(EMPTY_FORM_VALUES);
      return;
    }
    if (syncNiscProduct) {
      form.reset({
        itemNm: syncNiscProduct.name,
        itemClsCd: String(syncNiscProduct.etimsItemClsCd ?? "").trim(),
        taxTyCd: parseTaxTyCd(syncNiscProduct.etimsTaxTyCd),
        dftPrc: Number(syncNiscProduct.etimsDefaultPrice ?? 0) || 0,
        itemCd: "",
        itemStdNm: null,
        orgnNatCd: "KE",
        pkgUnitCd: syncNiscProduct.etimsPkgUnitCd ?? "OU",
        qtyUnitCd: syncNiscProduct.etimsQtyUnitCd ?? "U",
        btchNo: null,
        bcd: null,
        addInfo: null,
        sftyQty: 0,
        useYn: "Y",
      });
      pendingItemCdRef.current = true;
      return;
    }
    if (initialItem) {
      form.reset(buildFormValues(initialItem));
      pendingItemCdRef.current = false;
      return;
    }
    form.reset(EMPTY_FORM_VALUES);
    pendingItemCdRef.current = true;
  }, [open, initialItem, syncNiscProduct, form, buildFormValues]);

  const itemsQuery = trpc.etims.items.getItemList.useQuery(KRA_ITEM_LIST_INPUT, {
    enabled: open,
    staleTime: 0,
    refetchOnMount: "always",
  });

  React.useEffect(() => {
    if (!open) return;
    awaitingFreshItemListRef.current = true;
    void utils.etims.items.getItemList.invalidate(KRA_ITEM_LIST_INPUT).then(() => itemsQuery.refetch());
  }, [open, utils, itemsQuery.refetch]);

  React.useEffect(() => {
    if (!open || !awaitingFreshItemListRef.current) return;
    if (itemsQuery.isLoading || itemsQuery.isFetching) return;
    awaitingFreshItemListRef.current = false;
  }, [open, itemsQuery.isLoading, itemsQuery.isFetching, itemsQuery.data]);

  const saveItem = trpc.etims.items.saveItem.useMutation();
  const updateProduct = trpc.products.update.useMutation();

  const handleKraSaveSuccess = React.useCallback((data: FormData, res: { success?: boolean; data?: unknown; errorMessage?: string; requiresReinitialization?: boolean }) => {
    if (res?.success === false) {
      if (res?.requiresReinitialization) {
        toast.error(
          "KRA session expired  please re-initialize your device in Settings, then try again.",
          {
            duration: 8000,
            action: {
              label: "Go to Settings",
              onClick: () => {
                window.location.href = "/agency/kra-etims/settings";
              },
            },
          },
        );
      } else {
        toast.error(res?.errorMessage ?? "Failed to register item on KRA");
      }
      return false;
    }
    const body = (res?.data as { responseBody?: { resultCd?: string; resultMsg?: string }; resultCd?: string; resultMsg?: string })?.responseBody
      ?? (res?.data as { resultCd?: string; resultMsg?: string })
      ?? res;
    const resultCd = (body as { resultCd?: string })?.resultCd;
    if (resultCd && resultCd !== "000" && resultCd !== "001") {
      toast.error((body as { resultMsg?: string })?.resultMsg ?? "Failed to register item on KRA");
      return false;
    }
    return true;
  }, []);

  const kraItemList = React.useMemo(() => {
    const root: any = itemsQuery.data;
    const payload = root?.data?.responseBody?.data ?? root?.data ?? root?.responseBody?.data ?? root;
    const data: any = payload?.data ?? payload;
    const list: unknown = data?.itemList;
    return Array.isArray(list) ? list : [];
  }, [itemsQuery.data]);

  const generateNextItemCd = React.useCallback(() => {
    const orgnNatCd = form.getValues("orgnNatCd");
    const pkgUnitCd = form.getValues("pkgUnitCd");
    const qtyUnitCd = form.getValues("qtyUnitCd");
    // For npanel we register services only.
    const itemTyCd = "3";
    // Official format: Country + Type + Pkg + Qty + Seq7 (no X separator)
    const prefix = `${orgnNatCd}${itemTyCd}${pkgUnitCd}${qtyUnitCd}`;

    let maxSeq = 0;
    for (const it of kraItemList) {
      const code = (it as { itemCd?: string })?.itemCd;
      if (!code || typeof code !== "string") continue;
      if (!code.startsWith(prefix)) continue;
      const tail = code.slice(prefix.length);
      const seq = Number.parseInt(tail, 10);
      if (Number.isFinite(seq)) maxSeq = Math.max(maxSeq, seq);
    }

    const nextSeq = maxSeq + 1;
    const seqStr = String(nextSeq).padStart(7, "0");
    return `${prefix}${seqStr}`;
  }, [form, kraItemList]);

  React.useEffect(() => {
    if (!open || isEdit || !pendingItemCdRef.current || awaitingFreshItemListRef.current) return;
    if (itemsQuery.isLoading || itemsQuery.isFetching) return;

    form.setValue("itemCd", generateNextItemCd(), { shouldValidate: true });
    pendingItemCdRef.current = false;
  }, [
    open,
    isEdit,
    itemsQuery.isLoading,
    itemsQuery.isFetching,
    itemsQuery.data,
    generateNextItemCd,
    form,
  ]);

  const buildSaveItemInput = (data: FormData) => {
    const itemTyCd = isEdit ? String(initialItem?.itemTyCd ?? "3") : "3";
    return {
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
        isrcAplcbYn: "N" as const,
        useYn: data.useYn,
        regrNm: "Admin",
        regrId: "Admin",
        modrNm: "Admin",
        modrId: "Admin",
      },
    };
  };

  const onSubmit = async (data: FormData) => {
    const itemTyCd = isEdit ? String(initialItem?.itemTyCd ?? "3") : "3";
    if (itemTyCd !== "1" && itemTyCd !== "2" && itemTyCd !== "3") {
      toast.error("Invalid item type on record");
      return;
    }

    try {
      const kraRes = await saveItem.mutateAsync(buildSaveItemInput(data));
      if (!handleKraSaveSuccess(data, kraRes as Parameters<typeof handleKraSaveSuccess>[1])) return;

      if (syncNiscProduct) {
        await updateProduct.mutateAsync({
          id: syncNiscProduct.id,
          etimsItemCd: data.itemCd,
          etimsItemClsCd: data.itemClsCd,
          etimsTaxTyCd: data.taxTyCd,
          etimsDefaultPrice: String(data.dftPrc),
          etimsPkgUnitCd: data.pkgUnitCd,
          etimsQtyUnitCd: data.qtyUnitCd,
        });
        toast.success("Service synced to KRA and saved to Nisc catalog");
      } else {
        toast.success(isEdit ? "Product updated in KRA eTIMS" : "Service registered in KRA eTIMS");
      }

      await utils.etims.items.getItemList.invalidate(KRA_ITEM_LIST_INPUT);
      form.reset(EMPTY_FORM_VALUES);
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to sync service");
    }
  };

  const isPending = saveItem.isPending || updateProduct.isPending;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {isSyncFromNisc ? "Sync with KRA" : isEdit ? "Edit product" : "Register Service"}
          </SheetTitle>
          <SheetDescription>
            {isSyncFromNisc
              ? "Registers this Nisc service on KRA eTIMS, then saves the fiscal fields on the product."
              : isEdit
                ? "Updates the item on KRA eTIMS via /saveItem (same endpoint used to register)."
                : "Registers a service item in KRA eTIMS."}
          </SheetDescription>
        </SheetHeader>

        <Form {...form} key={isSyncFromNisc ? `sync-${syncNiscProduct?.id}` : isEdit ? `edit-${initialItem?.itemCd}` : "create"}>
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
                        placeholder={
                          !field.value && (itemsQuery.isLoading || itemsQuery.isFetching)
                            ? "Generating code…"
                            : "Click Generate →"
                        }
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        disabled={isEdit || itemsQuery.isLoading || itemsQuery.isFetching}
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
                    <div className="w-full">
                      <ItemClassificationPicker
                        key={
                          isSyncFromNisc
                            ? `sync-cls-${syncNiscProduct?.id}`
                            : isEdit
                              ? `edit-cls-${initialItem?.itemCd}`
                              : "create-cls"
                        }
                        enabled={open}
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                      />
                    </div>
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    Pick a hierarchy level, search, then select a KRA classification code.
                    Level 4 is recommended for registering services.
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
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <>
                    <Spinner size={16} className="mr-2" />
                    {isSyncFromNisc ? "Syncing..." : "Registering..."}
                  </>
                ) : (
                  isSyncFromNisc ? "Sync now" : isEdit ? "Save changes" : "Register Service"
                )}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}


