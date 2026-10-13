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
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/npanel-ui/sheet";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { ComboboxDropdown } from "@npanel/ui/components/combobox-dropdown";
import { trpc } from "@/utils/trpc";
import { kraMutationError } from "../../_lib/etims-kra";
import { isServiceItem, type EtimsItemRecord } from "../../products/_components/etims-item-utils";

const formSchema = z.object({
  itemCd: z.string().min(1, "Item is required"),
  rsdQty: z.coerce.number().min(0),
});

type FormData = z.infer<typeof formSchema>;

type ItemOption = EtimsItemRecord & { id: string; label: string };

export function SaveETimsStockMasterSheet({
  open = false,
  onOpenChange,
  items,
  initialItem,
  onSuccess,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  items: EtimsItemRecord[];
  initialItem?: EtimsItemRecord | null;
  onSuccess?: () => void;
}) {
  const goods = React.useMemo((): ItemOption[] => {
    return items
      .filter((item) => item.useYn !== "N" && !isServiceItem(item) && item.itemCd)
      .map((item) => ({
        ...item,
        id: String(item.itemCd),
        label: `${item.itemNm} (${item.itemCd})`,
      }));
  }, [items]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { itemCd: "", rsdQty: 0 },
  });

  React.useEffect(() => {
    if (!open) return;
    form.reset({
      itemCd: initialItem?.itemCd ?? goods[0]?.itemCd ?? "",
      rsdQty: Number(initialItem?.rsdQty ?? initialItem?.sftyQty ?? 0),
    });
  }, [open, initialItem, goods, form]);

  const save = trpc.etims.stock.saveStockMaster.useMutation();
  const selected = goods.find((item) => item.id === form.watch("itemCd"));

  const onSubmit = async (data: FormData) => {
    try {
      const res = await save.mutateAsync({
        stockMaster: {
          itemCd: data.itemCd,
          rsdQty: data.rsdQty,
          regrId: "Admin",
          regrNm: "Admin",
          modrId: "Admin",
          modrNm: "Admin",
        },
      });
      const error = kraMutationError(res);
      if (error) {
        toast.error(error);
        return;
      }
      toast.success("Remaining quantity saved");
      onOpenChange?.(false);
      onSuccess?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save remaining quantity");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Set remaining quantity</SheetTitle>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <FormField
              control={form.control}
              name="itemCd"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Item</FormLabel>
                  <ComboboxDropdown
                    inDialog
                    placeholder="Select item"
                    searchPlaceholder="Search item…"
                    items={goods}
                    selectedItem={selected}
                    onSelect={(item) => field.onChange(item.itemCd)}
                    emptyResults="Register a goods item on Products first."
                    disabled={goods.length === 0}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="rsdQty"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>On hand</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <SheetFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange?.(false)} disabled={save.isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={save.isPending || goods.length === 0}>
                {save.isPending ? <><Spinner size={16} className="mr-2" />Saving…</> : "Save"}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
