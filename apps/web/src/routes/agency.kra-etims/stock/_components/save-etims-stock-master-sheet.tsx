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
import { kraMutationError } from "../../_lib/etims-kra";
import { isServiceItem, type EtimsItemRecord } from "../../products/_components/etims-item-utils";

const formSchema = z.object({
  itemCd: z.string().min(1, "Item is required"),
  rsdQty: z.coerce.number().min(0),
});

type FormData = z.infer<typeof formSchema>;

export function SaveETimsStockMasterSheet({
  open = false,
  onOpenChange,
  items,
  initialItem,
  onSuccess,
  embedded = false,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  items: EtimsItemRecord[];
  initialItem?: EtimsItemRecord | null;
  onSuccess?: () => void;
  embedded?: boolean;
}) {
  const goods = React.useMemo(
    () => items.filter((item) => item.useYn !== "N" && !isServiceItem(item)),
    [items],
  );

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { itemCd: "", rsdQty: 0 },
  });

  React.useEffect(() => {
    if (!embedded && !open) return;
    form.reset({
      itemCd: initialItem?.itemCd ?? goods[0]?.itemCd ?? "",
      rsdQty: Number(initialItem?.rsdQty ?? initialItem?.sftyQty ?? 0),
    });
  }, [open, embedded, initialItem, goods, form]);

  const save = trpc.etims.stock.saveStockMaster.useMutation();

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
      toast.success("Remaining quantity saved on KRA eTIMS");
      onOpenChange?.(false);
      onSuccess?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save remaining quantity");
    }
  };

  const fields = (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className={embedded ? "space-y-4" : "mt-6 space-y-4"}>
            <FormField
              control={form.control}
              name="itemCd"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Item</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select item" />
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
              name="rsdQty"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Remaining quantity (on hand)</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {embedded ? (
              <div className="flex justify-end">
                <Button type="submit" disabled={save.isPending || goods.length === 0}>
                  {save.isPending ? <><Spinner size={16} className="mr-2" />Saving...</> : "Save remaining quantity"}
                </Button>
              </div>
            ) : (
            <SheetFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange?.(false)} disabled={save.isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={save.isPending || goods.length === 0}>
                {save.isPending ? <><Spinner size={16} className="mr-2" />Saving...</> : "Save remaining quantity"}
              </Button>
            </SheetFooter>
            )}
          </form>
        </Form>
  );

  if (embedded) {
    return (
      <div className="rounded-lg border bg-card shadow-sm p-4 md:p-6 space-y-4">
        <div>
          <h2 className="text-sm font-semibold">Stock taking</h2>
          <p className="text-xs text-muted-foreground">
            Set how many units KRA should show on hand for a goods item. The required stock movement is recorded for you.
          </p>
        </div>
        {goods.length === 0 ? (
          <p className="text-sm text-muted-foreground">Register a raw material or finished product on Products first.</p>
        ) : fields}
      </div>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Stock taking</SheetTitle>
          <SheetDescription>
            Set remaining on-hand quantity for a goods item. KRA records the required stock movement automatically.
          </SheetDescription>
        </SheetHeader>
        {fields}
      </SheetContent>
    </Sheet>
  );
}
