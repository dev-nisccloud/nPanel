"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "@/components/ui/sonner";
import { Plus, Trash2 } from "lucide-react";
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
import {
  STOCK_IO_TYPES,
  isoDateInNairobi,
  dateInputToKra8,
  kraMutationError,
  lineAmountsFromInclusive,
} from "../../_lib/etims-kra";
import { isServiceItem, type EtimsItemRecord } from "../../products/_components/etims-item-utils";

const lineSchema = z.object({
  itemCd: z.string().min(1),
  qty: z.coerce.number().min(0.01),
});

const formSchema = z.object({
  sarTyCd: z.string().min(1),
  ocrnDt: z.string().min(8),
  sarNo: z.coerce.number().int().min(1),
  remark: z.string().optional(),
  lines: z.array(lineSchema).min(1),
});

type FormData = z.infer<typeof formSchema>;

export function SendETimsStockIoSheet({
  open,
  onOpenChange,
  items,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: EtimsItemRecord[];
  onSuccess?: () => void;
}) {
  const goods = React.useMemo(
    () => items.filter((item) => item.useYn !== "N" && !isServiceItem(item)),
    [items],
  );

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sarTyCd: "06",
      ocrnDt: isoDateInNairobi(),
      sarNo: 1,
      remark: "",
      lines: [{ itemCd: "", qty: 1 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "lines" });

  React.useEffect(() => {
    if (!open) return;
    form.reset({
      sarTyCd: "06",
      ocrnDt: isoDateInNairobi(),
      sarNo: 1,
      remark: "",
      lines: [{ itemCd: goods[0]?.itemCd ?? "", qty: 1 }],
    });
  }, [open, form, goods]);

  const send = trpc.etims.stock.sendStockIO.useMutation();

  const onSubmit = async (data: FormData) => {
    const itemList = data.lines.map((line, index) => {
      const item = goods.find((g) => g.itemCd === line.itemCd);
      if (!item) throw new Error(`Unknown item ${line.itemCd}`);
      const price = Number(item.dftPrc ?? 0);
      const amts = lineAmountsFromInclusive({
        inclusiveUnitPrice: price,
        qty: line.qty,
        taxTyCd: String(item.taxTyCd ?? "B"),
      });
      return {
        itemSeq: index + 1,
        itemCd: item.itemCd,
        itemClsCd: item.itemClsCd,
        itemNm: item.itemNm,
        bcd: item.bcd ?? null,
        pkgUnitCd: item.pkgUnitCd ?? "NT",
        pkg: 1,
        qtyUnitCd: item.qtyUnitCd && item.qtyUnitCd.length >= 2 ? item.qtyUnitCd : "BA",
        qty: line.qty,
        itemExprDt: null,
        prc: amts.prc,
        splyAmt: amts.splyAmt,
        totDcAmt: amts.dcAmt,
        taxblAmt: amts.taxblAmt,
        taxTyCd: String(item.taxTyCd ?? "B"),
        taxAmt: amts.taxAmt,
        totAmt: amts.totAmt,
      };
    });
    const totals = itemList.reduce(
      (acc, line) => ({
        taxbl: acc.taxbl + line.taxblAmt,
        tax: acc.tax + line.taxAmt,
        tot: acc.tot + line.totAmt,
      }),
      { taxbl: 0, tax: 0, tot: 0 },
    );
    try {
      const res = await send.mutateAsync({
        stockData: {
          sarNo: data.sarNo,
          orgSarNo: 0,
          regTyCd: "M",
          sarTyCd: data.sarTyCd,
          ocrnDt: dateInputToKra8(data.ocrnDt),
          totItemCnt: itemList.length,
          totTaxblAmt: totals.taxbl,
          totTaxAmt: totals.tax,
          totAmt: totals.tot,
          remark: data.remark || null,
          regrId: "Admin",
          regrNm: "Admin",
          modrId: "Admin",
          modrNm: "Admin",
          itemList,
        },
      });
      const error = kraMutationError(res);
      if (error) {
        toast.error(error);
        return;
      }
      toast.success("Stock in/out submitted to KRA");
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send stock I/O");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent size="wide" className="w-full min-w-0 overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Record movement</SheetTitle>
          <SheetDescription>
            Stock in or stock out for a goods item (import, purchase, sale, adjustment). Services do not use stock.
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="sarTyCd"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Movement type</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {STOCK_IO_TYPES.map((t) => (
                          <SelectItem key={t.code} value={t.code}>{t.code} — {t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="ocrnDt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Occurrence date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sarNo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SAR number</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="space-y-3">
              {fields.map((row, index) => (
                <div key={row.id} className="grid grid-cols-1 sm:grid-cols-[1fr_8rem_auto] gap-2 items-end">
                  <FormField
                    control={form.control}
                    name={`lines.${index}.itemCd`}
                    render={({ field }) => (
                      <FormItem>
                        {index === 0 ? <FormLabel>Goods item</FormLabel> : null}
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select goods item" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {goods.map((item) => (
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
                    name={`lines.${index}.qty`}
                    render={({ field }) => (
                      <FormItem>
                        {index === 0 ? <FormLabel>Qty</FormLabel> : null}
                        <FormControl>
                          <Input type="number" min={0.01} step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="button" variant="ghost" size="icon" disabled={fields.length === 1} onClick={() => remove(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => append({ itemCd: goods[0]?.itemCd ?? "", qty: 1 })}>
                <Plus className="mr-2 h-3 w-3" />
                Add line
              </Button>
            </div>
            <FormField
              control={form.control}
              name="remark"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Remark</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <SheetFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={send.isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={send.isPending || goods.length === 0}>
                {send.isPending ? <><Spinner size={16} className="mr-2" />Sending...</> : "Send stock I/O"}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
