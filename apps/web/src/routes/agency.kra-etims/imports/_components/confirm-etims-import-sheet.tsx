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
import { IMPORT_ITEM_STATUSES, kraMutationError } from "../../_lib/etims-kra";
import { isServiceItem, type EtimsItemRecord } from "../../products/_components/etims-item-utils";

const formSchema = z.object({
  itemCd: z.string().min(1, "Map to a registered item"),
  itemClsCd: z.string().min(1),
  imptItemSttsCd: z.enum(["2", "3", "4"]),
  remark: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export function ConfirmETimsImportSheet({
  open,
  onOpenChange,
  row,
  items,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  row: Record<string, unknown> | null;
  items: EtimsItemRecord[];
  onSuccess?: () => void;
}) {
  const goods = React.useMemo(
    () => items.filter((item) => item.useYn !== "N" && !isServiceItem(item)),
    [items],
  );

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { itemCd: "", itemClsCd: "", imptItemSttsCd: "3", remark: "" },
  });

  React.useEffect(() => {
    if (!open || !row) return;
    const hs = String(row.hsCd ?? row.itemClsCd ?? "");
    const mapped = goods.find((item) => item.itemClsCd === hs) ?? goods[0];
    form.reset({
      itemCd: mapped?.itemCd ?? "",
      itemClsCd: mapped?.itemClsCd || hs.slice(0, 10),
      imptItemSttsCd: "3",
      remark: "",
    });
  }, [open, row, goods, form]);

  const confirm = trpc.etims.imports.confirmImportedItem.useMutation();

  const onSubmit = async (data: FormData) => {
    if (!row) return;
    try {
      const res = await confirm.mutateAsync({
        item: {
          taskCd: String(row.taskCd ?? ""),
          dclDe: String(row.dclDe ?? "").slice(0, 14),
          itemSeq: Number(row.itemSeq ?? 1),
          hsCd: String(row.hsCd ?? ""),
          itemClsCd: data.itemClsCd,
          itemCd: data.itemCd,
          imptItemSttsCd: data.imptItemSttsCd,
          remark: data.remark || null,
          modrId: "Admin",
          modrNm: "Admin",
        },
      });
      const error = kraMutationError(res);
      if (error) {
        toast.error(error);
        return;
      }
      toast.success("Imported item updated on KRA eTIMS");
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update imported item");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Update imported item</SheetTitle>
          <SheetDescription>
            Approve, wait, or cancel a customs row via /updateImportItem and map it to a registered goods item.
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <p className="text-sm text-muted-foreground">
              {String(row?.itemNm ?? "Import")} · task {String(row?.taskCd ?? "—")} · HS {String(row?.hsCd ?? "—")}
            </p>
            <FormField
              control={form.control}
              name="itemCd"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Local item code</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(next) => {
                      field.onChange(next);
                      const item = goods.find((g) => g.itemCd === next);
                      if (item?.itemClsCd) form.setValue("itemClsCd", item.itemClsCd);
                    }}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Registered goods item" />
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
              name="imptItemSttsCd"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Import status</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {IMPORT_ITEM_STATUSES.filter((s) => s.code !== "1").map((s) => (
                        <SelectItem key={s.code} value={s.code}>{s.code} — {s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
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
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={confirm.isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={confirm.isPending || !row}>
                {confirm.isPending ? <><Spinner size={16} className="mr-2" />Updating...</> : "Update import"}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
