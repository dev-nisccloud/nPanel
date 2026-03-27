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

const DEFAULT_ITEM_CLASS_CODE = "81112100";

// Curated list for a cloud + digital marketing company.
// Extend this list as you onboard new service lines.
const ITEM_CLASS_OPTIONS: ComboboxItem[] = [
  { id: "81112100", label: "81112100 — Computer programmers" },
  { id: "81111600", label: "81111600 — Computer programmers (alt listing)" },
  { id: "81161600", label: "81161600 — Electronic mail and messaging services" },
  { id: "83111600", label: "83111600 — Mobile communications services" },
  { id: "82101600", label: "82101600 — Broadcast advertising" },
  { id: "80171600", label: "80171600 — Publicity and marketing support services" },
  { id: "82111600", label: "82111600 — Non technical writing" },
  { id: "82141600", label: "82141600 — Graphic display services" },
  { id: "81101600", label: "81101600 — Mechanical engineering (not typical; only use if required)" },
].sort((a, b) => a.id.localeCompare(b.id));

const formSchema = z.object({
  itemNm: z.string().min(1, "Service name is required"),
  itemClsCd: z.string().min(1, "Item classification code is required"),
  taxTyCd: z.enum(["A", "B", "C", "D", "E"]).default("B"),
  dftPrc: z.coerce.number().min(0, "Price must be >= 0").default(0),

  // Optional fields per KRA /saveItem
  itemCd: z.string().min(1, "Item code is required (auto-generated)"),
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
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      itemNm: "",
      itemClsCd: DEFAULT_ITEM_CLASS_CODE,
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

  const saveItem = trpc.etims.items.saveItem.useMutation({
    onSuccess: (res: any) => {
      if (res?.success === false) {
        toast.error(res?.errorMessage ?? "Failed to register item");
        return;
      }
      const body = res?.data?.responseBody ?? res?.data ?? res;
      if (body?.resultCd && body.resultCd !== "000") {
        toast.error(body?.resultMsg ?? "Failed to register item");
        return;
      }
      toast.success("Service registered in KRA eTIMS");
      form.reset();
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to register service");
    },
  });

  const itemClassOptions = React.useMemo(() => ITEM_CLASS_OPTIONS, []);

  const { data: itemsData } = trpc.etims.items.getItemInfo.useQuery(
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
    if (!open) return;
    // Auto-generate itemCd on open (or when units change).
    const itemCd = form.getValues("itemCd");
    if (!itemCd) {
      form.setValue("itemCd", generateNextItemCd(), { shouldValidate: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, generateNextItemCd]);

  const onSubmit = (data: FormData) => {
    // KRA itemTyCd:
    // 1 = Raw, 2 = Finished, 3 = Service (no stock). For npanel we default to service.
    saveItem.mutate({
      item: {
        itemCd: data.itemCd,
        itemClsCd: data.itemClsCd,
        itemTyCd: "3",
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
          <SheetTitle>Register Service</SheetTitle>
          <SheetDescription>
            Registers a service item in KRA eTIMS.
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
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
                      <Input placeholder="Auto-generated item code" {...field} />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => form.setValue("itemCd", generateNextItemCd(), { shouldValidate: true })}
                      >
                        Generate
                      </Button>
                    </div>
                  </FormControl>
                  {/* <p className="text-xs text-muted-foreground">
                    Format: {`{orgnNatCd}{itemTyCd}{pkgUnitCd}X{qtyUnitCd}{optional X}{sequence(7)}`}. For services, itemTyCd is 3.
                  </p> */}
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
                      placeholder="Select classification code"
                      searchPlaceholder="Search by code or name..."
                      items={itemClassOptions}
                      selectedItem={itemClassOptions.find((x) => x.id === field.value)}
                      onSelect={(item) => field.onChange(item.id)}
                      emptyResults="No classifications found"
                      disabled={itemClassOptions.length === 0}
                      className="w-full"
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    Default is {DEFAULT_ITEM_CLASS_CODE}. You can search and select a different classification if needed.
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
                    <Select value={field.value} onValueChange={field.onChange}>
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
                      <Input type="number" min={0} step="0.01" {...field} />
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
                  "Register Service"
                )}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}


