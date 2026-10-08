"use client";

import { captureEvent } from "@/lib/posthog";

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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { trpc } from "@/utils/trpc";
import { isRawMaterial, type EtimsItemRecord } from "./etims-item-utils";
import { ItemClassificationPicker } from "./item-classification-picker";
import {
  COUNTRY_CODES,
  GOODS_PKG_PREFERENCE,
  GOODS_QTY_PREFERENCE,
  ITEM_TYPES,
  KRA_CODE_CLASS,
  LAST_REQ_DT,
  PACKAGING_UNITS,
  QTY_UNITS,
  SERVICE_PKG_PREFERENCE,
  SERVICE_QTY_PREFERENCE,
  activeKraCodes,
  flattenKraCodeList,
  kraMutationError,
  preferKraCode,
  type KraCodeOption,
} from "../../_lib/etims-kra";

const formSchema = z.object({
  itemNm: z.string().min(1, "Item name is required"),
  itemTyCd: z.enum(["1", "2", "3"]).default("3"),
  itemClsCd: z.string().min(8, "Pick an 8–10 digit classification code"),
  taxTyCd: z.enum(["A", "B", "C", "D"]).default("B"),
  priceMode: z.enum(["dynamic", "fixed"]).default("dynamic"),
  dftPrc: z.coerce.number().min(0, "Price must be >= 0").default(0),
  itemCd: z.string()
    .min(1, "Item code is required")
    .regex(
      /^[A-Z]{2}\d[A-Z0-9]+\d{7}$/,
      "Invalid itemCd format. Use the Generate button to create a valid code."
    ),
  itemStdNm: z.string().nullable().optional(),
  orgnNatCd: z.string().length(2).default("KE"),
  pkgUnitCd: z.string().min(1).default("OU"),
  qtyUnitCd: z.string().min(2, "Quantity unit must be 2 characters, e.g. NO").default("NO"),
  btchNo: z.string().nullable().optional(),
  bcd: z.string().nullable().optional(),
  addInfo: z.string().nullable().optional(),
  sftyQty: z.coerce.number().nullable().optional(),
  isrcAplcbYn: z.enum(["Y", "N"]).default("N"),
  useYn: z.enum(["Y", "N"]).default("Y"),
  openingQty: z.coerce.number().min(0).optional().default(0),
  cpstItemCd: z.string().optional().default(""),
  cpstQty: z.coerce.number().min(0).optional().default(1),
}).superRefine((data, ctx) => {
  if (data.priceMode === "fixed" && data.dftPrc <= 0) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Enter a price", path: ["dftPrc"] });
  }
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
  if (value === "A" || value === "B" || value === "C" || value === "D") return value;
  return "B";
}

function parseItemTyCd(value?: string | null): FormData["itemTyCd"] {
  if (value === "1" || value === "2" || value === "3") return value;
  return "3";
}

function twoCharQty(value?: string | null) {
  const unit = String(value ?? "").trim().toUpperCase();
  if (unit.length >= 2) return unit.slice(0, 2);
  return "NO";
}

function optionsWithCurrent(options: KraCodeOption[], current?: string) {
  const code = String(current ?? "").trim().toUpperCase();
  if (!code || options.some((row) => row.code === code)) return options;
  return [{ code, label: code }, ...options];
}

function defaultsForType(
  itemTyCd: FormData["itemTyCd"],
  packaging: KraCodeOption[],
  quantity: KraCodeOption[],
): Pick<FormData, "pkgUnitCd" | "qtyUnitCd"> {
  if (itemTyCd === "3") {
    return {
      pkgUnitCd: preferKraCode(packaging, SERVICE_PKG_PREFERENCE, "OU"),
      qtyUnitCd: preferKraCode(quantity, SERVICE_QTY_PREFERENCE, "NO"),
    };
  }
  return {
    pkgUnitCd: preferKraCode(packaging, GOODS_PKG_PREFERENCE, "BX"),
    qtyUnitCd: preferKraCode(quantity, GOODS_QTY_PREFERENCE, "NO"),
  };
}

function priceModeFromAmount(value?: number | string | null): FormData["priceMode"] {
  return Number(value ?? 0) > 0 ? "fixed" : "dynamic";
}

const EMPTY_FORM_VALUES: FormData = {
  itemNm: "",
  itemTyCd: "3",
  itemClsCd: "",
  taxTyCd: "B",
  priceMode: "dynamic",
  dftPrc: 0,
  itemCd: "",
  itemStdNm: null,
  orgnNatCd: "KE",
  pkgUnitCd: "OU",
  qtyUnitCd: "NO",
  btchNo: null,
  bcd: null,
  addInfo: null,
  sftyQty: 0,
  isrcAplcbYn: "N",
  useYn: "Y",
  openingQty: 0,
  cpstItemCd: "",
  cpstQty: 1,
};

const STATIC_QTY_OPTIONS = QTY_UNITS.filter((u) => u.code.length === 2);
const STATIC_PKG_OPTIONS = PACKAGING_UNITS.filter((u) => u.code.length === 2 && u.code !== "NT");

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
    itemTyCd: parseItemTyCd(item.itemTyCd),
    itemClsCd: String(item.itemClsCd ?? "").trim(),
    taxTyCd: parseTaxTyCd(item.taxTyCd),
    priceMode: priceModeFromAmount(item.dftPrc),
    dftPrc: Number(item.dftPrc ?? 0),
    itemCd: item.itemCd,
    itemStdNm: item.itemStdNm ?? null,
    orgnNatCd: item.orgnNatCd ?? "KE",
    pkgUnitCd: item.pkgUnitCd ?? "OU",
    qtyUnitCd: twoCharQty(item.qtyUnitCd),
    btchNo: item.btchNo ?? null,
    bcd: item.bcd ?? null,
    addInfo: item.addInfo ?? null,
    sftyQty: item.sftyQty != null ? Number(item.sftyQty) : 0,
    isrcAplcbYn: item.isrcAplcbYn === "Y" ? "Y" : "N",
    useYn: item.useYn === "N" ? "N" : "Y",
    openingQty: 0,
    cpstItemCd: "",
    cpstQty: 1,
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
        ...EMPTY_FORM_VALUES,
        itemNm: syncNiscProduct.name,
        itemTyCd: "3",
        itemClsCd: String(syncNiscProduct.etimsItemClsCd ?? "").trim(),
        taxTyCd: parseTaxTyCd(syncNiscProduct.etimsTaxTyCd),
        priceMode: priceModeFromAmount(syncNiscProduct.etimsDefaultPrice),
        dftPrc: Number(syncNiscProduct.etimsDefaultPrice ?? 0) || 0,
        pkgUnitCd: syncNiscProduct.etimsPkgUnitCd ?? "OU",
        qtyUnitCd: twoCharQty(syncNiscProduct.etimsQtyUnitCd),
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

  const codesQuery = trpc.etims.data.getCodeList.useQuery(
    { lastReqDt: LAST_REQ_DT },
    { enabled: open, staleTime: 10 * 60 * 1000 },
  );

  const codeRows = React.useMemo(() => flattenKraCodeList(codesQuery.data), [codesQuery.data]);

  const packagingOptions = React.useMemo(() => {
    const live = activeKraCodes(codeRows, KRA_CODE_CLASS.PACKAGING, 2);
    return live.length > 0 ? live : STATIC_PKG_OPTIONS;
  }, [codeRows]);

  const qtyOptions = React.useMemo(() => {
    const live = activeKraCodes(codeRows, KRA_CODE_CLASS.QTY_UNIT, 2);
    return live.length > 0 ? live : STATIC_QTY_OPTIONS;
  }, [codeRows]);

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
  const saveStockMaster = trpc.etims.stock.saveStockMaster.useMutation();
  const saveComposition = trpc.etims.items.saveItemComposition.useMutation();

  const kraItemList = React.useMemo(() => {
    const root: any = itemsQuery.data;
    const payload = root?.data?.responseBody?.data ?? root?.data ?? root?.responseBody?.data ?? root;
    const data: any = payload?.data ?? payload;
    const list: unknown = data?.itemList;
    return Array.isArray(list) ? (list as EtimsItemRecord[]) : [];
  }, [itemsQuery.data]);

  const rawMaterials = React.useMemo(
    () => kraItemList.filter((item) => item.useYn !== "N" && isRawMaterial(item)),
    [kraItemList],
  );

  const generateNextItemCd = React.useCallback(() => {
    const orgnNatCd = form.getValues("orgnNatCd") || "KE";
    const itemTyCd = form.getValues("itemTyCd") || "3";
    const pkgUnitCd = form.getValues("pkgUnitCd") || "OU";
    const qtyUnitCd = twoCharQty(form.getValues("qtyUnitCd"));
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

    return `${prefix}${String(maxSeq + 1).padStart(7, "0")}`;
  }, [form, kraItemList]);

  const refreshItemCd = React.useCallback(() => {
    if (isEdit) return;
    form.setValue("itemCd", generateNextItemCd(), { shouldValidate: true });
  }, [form, generateNextItemCd, isEdit]);

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

  React.useEffect(() => {
    if (!open || isEdit) return;
    if (codesQuery.isLoading || codesQuery.isFetching) return;
    const pkg = form.getValues("pkgUnitCd");
    if (packagingOptions.some((row) => row.code === pkg)) return;
    const units = defaultsForType(form.getValues("itemTyCd"), packagingOptions, qtyOptions);
    form.setValue("pkgUnitCd", units.pkgUnitCd, { shouldDirty: true });
    pendingItemCdRef.current = true;
    refreshItemCd();
  }, [
    open,
    isEdit,
    codesQuery.isLoading,
    codesQuery.isFetching,
    packagingOptions,
    qtyOptions,
    form,
    refreshItemCd,
  ]);

  const buildSaveItemInput = (data: FormData) => {
    const dftPrc = data.priceMode === "dynamic" ? 0 : data.dftPrc;
    return {
      item: {
        itemCd: data.itemCd,
        itemClsCd: data.itemClsCd,
        itemTyCd: data.itemTyCd,
        itemNm: data.itemNm,
        itemStdNm: data.itemStdNm ?? null,
        orgnNatCd: data.orgnNatCd,
        pkgUnitCd: data.pkgUnitCd,
        qtyUnitCd: twoCharQty(data.qtyUnitCd),
        taxTyCd: data.taxTyCd,
        btchNo: data.btchNo ?? null,
        bcd: data.bcd ?? null,
        dftPrc,
        grpPrcL1: dftPrc,
        grpPrcL2: dftPrc,
        grpPrcL3: dftPrc,
        grpPrcL4: dftPrc,
        grpPrcL5: 0,
        addInfo: data.addInfo ?? null,
        sftyQty: data.sftyQty ?? 0,
        isrcAplcbYn: data.isrcAplcbYn,
        useYn: data.useYn,
        regrNm: "Admin",
        regrId: "Admin",
        modrNm: "Admin",
        modrId: "Admin",
      },
    };
  };

  const onSubmit = async (data: FormData) => {
    try {
      if (!packagingOptions.some((row) => row.code === data.pkgUnitCd)) {
        toast.error("Pick a packaging unit from the KRA code list.");
        return;
      }
      const kraRes = await saveItem.mutateAsync(buildSaveItemInput(data));
      const error = kraMutationError(kraRes);
      if (error) {
        const rec = kraRes as { requiresReinitialization?: boolean };
        if (rec?.requiresReinitialization) {
          toast.error("KRA session expired  please re-initialize your device in Settings, then try again.", {
            duration: 8000,
            action: {
              label: "Go to Settings",
              onClick: () => { window.location.href = "/agency/kra-etims/settings"; },
            },
          });
        } else {
          toast.error(error);
        }
        return;
      }

      const isGoodsItem = data.itemTyCd === "1" || data.itemTyCd === "2";
      const followUpErrors: string[] = [];

      if (isGoodsItem && Number(data.openingQty) > 0) {
        const stockRes = await saveStockMaster.mutateAsync({
          stockMaster: {
            itemCd: data.itemCd,
            rsdQty: Number(data.openingQty),
            regrId: "Admin",
            regrNm: "Admin",
            modrId: "Admin",
            modrNm: "Admin",
          },
        });
        const stockError = kraMutationError(stockRes);
        if (stockError) followUpErrors.push(`Quantity: ${stockError}`);
      }

      if (data.itemTyCd === "2" && data.cpstItemCd) {
        const compositionRes = await saveComposition.mutateAsync({
          composition: {
            itemCd: data.itemCd,
            cpstItemCd: data.cpstItemCd,
            cpstQty: Number(data.cpstQty) > 0 ? Number(data.cpstQty) : 1,
            regrId: "Admin",
            regrNm: "Admin",
            modrId: "Admin",
            modrNm: "Admin",
          },
        });
        const compositionError = kraMutationError(compositionRes);
        if (compositionError) followUpErrors.push(`Made from: ${compositionError}`);
      }

      if (syncNiscProduct) {
        await updateProduct.mutateAsync({
          id: syncNiscProduct.id,
          etimsItemCd: data.itemCd,
          etimsItemClsCd: data.itemClsCd,
          etimsTaxTyCd: data.taxTyCd,
          etimsDefaultPrice: String(data.priceMode === "dynamic" ? 0 : data.dftPrc),
          etimsPkgUnitCd: data.pkgUnitCd,
          etimsQtyUnitCd: twoCharQty(data.qtyUnitCd),
        });
        toast.success("Item synced to KRA and saved to Nisc catalog");
      } else {
        toast.success(isEdit ? "Item updated in KRA eTIMS" : "Item registered in KRA eTIMS");
        if (!isEdit) captureEvent("etims_product_registered", { product_type: data.itemTyCd });
      }

      if (followUpErrors.length) {
        toast.error(followUpErrors.join(" "));
      }

      await utils.etims.items.getItemList.invalidate(KRA_ITEM_LIST_INPUT);
      form.reset(EMPTY_FORM_VALUES);
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save item");
    }
  };

  const isPending = saveItem.isPending || updateProduct.isPending || saveStockMaster.isPending || saveComposition.isPending;
  const itemTyCd = form.watch("itemTyCd");
  const isGoods = itemTyCd === "1" || itemTyCd === "2";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent size="wide" className="w-full min-w-0 overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {isSyncFromNisc ? "Sync with KRA" : isEdit ? "Edit item" : "Register item"}
          </SheetTitle>
          <SheetDescription>
            {isSyncFromNisc
              ? "Registers this Nisc catalog item on KRA eTIMS, then saves the fiscal fields on the product."
              : isEdit
                ? "Updates the item on KRA eTIMS via /saveItem."
                : "Registers a raw material, finished product, or service on KRA eTIMS."}
          </SheetDescription>
        </SheetHeader>

        <Form {...form} key={isSyncFromNisc ? `sync-${syncNiscProduct?.id}` : isEdit ? `edit-${initialItem?.itemCd}` : "create"}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="itemNm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Item name</FormLabel>
                    <FormControl>
                      <Input placeholder='e.g. "Website Development"' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="itemTyCd"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product type</FormLabel>
                    <Select
                      key={`type-${field.value}`}
                      value={field.value}
                      disabled={isEdit || isSyncFromNisc}
                      onValueChange={(next) => {
                        if (next !== "1" && next !== "2" && next !== "3") return;
                        field.onChange(next);
                        const units = defaultsForType(next, packagingOptions, qtyOptions);
                        form.setValue("pkgUnitCd", units.pkgUnitCd, { shouldDirty: true });
                        form.setValue("qtyUnitCd", units.qtyUnitCd, { shouldDirty: true });
                        pendingItemCdRef.current = true;
                        refreshItemCd();
                      }}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ITEM_TYPES.map((t) => (
                          <SelectItem key={t.code} value={t.code}>{t.code} — {t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="itemCd"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Item code (itemCd)</FormLabel>
                  <FormControl>
                    <div className="flex gap-2">
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
                        onClick={refreshItemCd}
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
                        onChange={(itemClsCd, taxTyCd) => {
                          field.onChange(itemClsCd);
                          if (taxTyCd) {
                            form.setValue("taxTyCd", parseTaxTyCd(taxTyCd), { shouldDirty: true, shouldTouch: true });
                          }
                        }}
                        onBlur={field.onBlur}
                      />
                    </div>
                  </FormControl>
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
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dftPrc"
                render={({ field }) => {
                  const priceMode = form.watch("priceMode");
                  return (
                    <FormItem>
                      <FormLabel>Price</FormLabel>
                      <ToggleGroup
                        type="single"
                        variant="outline"
                        size="sm"
                        value={priceMode}
                        onValueChange={(next) => {
                          if (next !== "dynamic" && next !== "fixed") return;
                          form.setValue("priceMode", next, { shouldValidate: true });
                          if (next === "dynamic") {
                            form.setValue("dftPrc", 0, { shouldValidate: true });
                          }
                        }}
                        className="w-full"
                        aria-label="Price mode"
                      >
                        <ToggleGroupItem value="dynamic" className="flex-1 text-xs">
                          At sale
                        </ToggleGroupItem>
                        <ToggleGroupItem value="fixed" className="flex-1 text-xs">
                          Fixed
                        </ToggleGroupItem>
                      </ToggleGroup>
                      {priceMode === "fixed" ? (
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
                      ) : null}
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="orgnNatCd"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Origin country</FormLabel>
                    <Select
                      value={field.value}
                      disabled={isEdit}
                      onValueChange={(next) => {
                        field.onChange(next);
                        pendingItemCdRef.current = true;
                        refreshItemCd();
                      }}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Country" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {COUNTRY_CODES.map((c) => (
                          <SelectItem key={c.code} value={c.code}>{c.code} — {c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="pkgUnitCd"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Packaging unit</FormLabel>
                    <Select
                      key={`pkg-${field.value}`}
                      value={field.value}
                      disabled={isEdit}
                      onValueChange={(next) => {
                        field.onChange(next);
                        pendingItemCdRef.current = true;
                        refreshItemCd();
                      }}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Packaging" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {optionsWithCurrent(packagingOptions, field.value).map((u) => (
                          <SelectItem key={u.code} value={u.code}>{u.code} — {u.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="qtyUnitCd"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity unit</FormLabel>
                    <Select
                      key={`qty-${field.value}`}
                      value={field.value}
                      disabled={isEdit}
                      onValueChange={(next) => {
                        field.onChange(next);
                        pendingItemCdRef.current = true;
                        refreshItemCd();
                      }}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Quantity" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {optionsWithCurrent(qtyOptions, field.value).map((u) => (
                          <SelectItem key={u.code} value={u.code}>{u.code} — {u.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {isGoods ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="sftyQty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Safety stock</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          value={field.value ?? 0}
                          onChange={(e) => field.onChange(e.target.value === "" ? 0 : Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isrcAplcbYn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Insurance applicable</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="N">No</SelectItem>
                          <SelectItem value="Y">Yes</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            ) : null}

            {isGoods ? (
              <div className="rounded-lg border p-4 space-y-4">
                <div>
                  <p className="text-sm font-medium">Opening quantity</p>
                  <p className="text-xs text-muted-foreground">
                    Optional. After registration, this number is sent as KRA stock taking (remaining quantity). Leave 0 if you will set stock later.
                  </p>
                </div>
                <FormField
                  control={form.control}
                  name="openingQty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Units on hand</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          value={field.value ?? 0}
                          onChange={(e) => field.onChange(e.target.value === "" ? 0 : Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            ) : null}

            {itemTyCd === "2" && rawMaterials.length > 0 ? (
              <div className="rounded-lg border p-4 space-y-4">
                <div>
                  <p className="text-sm font-medium">Made from</p>
                  <p className="text-xs text-muted-foreground">
                    Optional. Only if this finished product is assembled from a registered raw material. Skip for bought-in goods.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="cpstItemCd"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Raw material</FormLabel>
                        <Select value={field.value || "none"} onValueChange={(next) => field.onChange(next === "none" ? "" : next)}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Skip" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">Skip</SelectItem>
                            {rawMaterials.map((item) => (
                              <SelectItem key={item.itemCd} value={item.itemCd}>
                                {item.itemNm} ({item.itemCd})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="cpstQty"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Qty per unit</FormLabel>
                        <FormControl>
                          <Input type="number" min={0} step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            ) : null}

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
                    {isSyncFromNisc ? "Syncing..." : isEdit ? "Saving..." : "Registering..."}
                  </>
                ) : (
                  isSyncFromNisc ? "Sync now" : isEdit ? "Save changes" : "Register item"
                )}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
