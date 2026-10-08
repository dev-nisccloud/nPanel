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
import { isServiceItem, type EtimsItemRecord } from "./etims-item-utils";

const formSchema = z.object({
  itemCd: z.string().min(1, "Parent item is required"),
  cpstItemCd: z.string().min(1, "Component item is required"),
  cpstQty: z.coerce.number().min(0.01, "Quantity must be greater than 0"),
});

type FormData = z.infer<typeof formSchema>;

export function SaveETimsCompositionSheet({
  open,
  onOpenChange,
  items,
  initialParent,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: EtimsItemRecord[];
  initialParent?: EtimsItemRecord | null;
}) {
  const goods = React.useMemo(
    () => items.filter((item) => item.useYn !== "N" && !isServiceItem(item)),
    [items],
  );
  const parents = goods.filter((item) => String(item.itemTyCd) === "2" || /^[A-Z]{2}2/.test(item.itemCd));
  const children = goods.filter((item) => String(item.itemTyCd) === "1" || /^[A-Z]{2}1/.test(item.itemCd));
  const parentPool = parents.length ? parents : goods;
  const childPool = children.length ? children : goods;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { itemCd: "", cpstItemCd: "", cpstQty: 1 },
  });

  React.useEffect(() => {
    if (!open) return;
    form.reset({
      itemCd: initialParent?.itemCd ?? "",
      cpstItemCd: "",
      cpstQty: 1,
    });
  }, [open, initialParent, form]);

  const save = trpc.etims.items.saveItemComposition.useMutation();

  const onSubmit = async (data: FormData) => {
    if (data.itemCd === data.cpstItemCd) {
      toast.error("Parent and component must be different items");
      return;
    }
    try {
      const res = await save.mutateAsync({
        composition: {
          itemCd: data.itemCd,
          cpstItemCd: data.cpstItemCd,
          cpstQty: data.cpstQty,
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
      toast.success("Item composition saved on KRA eTIMS");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save composition");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Made from</SheetTitle>
          <SheetDescription>
            Optional recipe: how many units of a raw material go into this finished product. Skip for items you buy ready-made. Both items need stock taking first.
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <FormField
              control={form.control}
              name="itemCd"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Finished product</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Finished product" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {parentPool.map((item) => (
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
              name="cpstItemCd"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Raw material</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Raw material" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {childPool.map((item) => (
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
                    <Input type="number" min={0.01} step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <SheetFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={save.isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={save.isPending || goods.length < 2}>
                {save.isPending ? <><Spinner size={16} className="mr-2" />Saving...</> : "Save recipe"}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
