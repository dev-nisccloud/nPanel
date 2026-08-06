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
import { trpc } from "@/utils/trpc";
import { ComboboxDropdown } from "@npanel/ui/components/combobox-dropdown";
import type { ComboboxItem } from "@npanel/ui/components/combobox-dropdown";

const ITEM_CLASS_OPTIONS: ComboboxItem[] = [
  { id: "81111600", label: "81111600   Computer programmers" },
  { id: "80161500", label: "80161500   Management support services" },
  { id: "84111600", label: "84111600   Audit services" },
  { id: "83111600", label: "83111600   Mobile communications services" },
  { id: "82101600", label: "82101600   Broadcast advertising" },
  { id: "80171600", label: "80171600   Publicity and marketing support services" },
  { id: "82111600", label: "82111600   Non technical writing" },
  { id: "82141600", label: "82141600   Graphic display services" },
  { id: "86111600", label: "86111600   Adult education" },
  { id: "76111600", label: "76111600   Building component cleaning services" },
].sort((a, b) => a.id.localeCompare(b.id));

const formSchema = z.object({
  item_name: z.string().min(1, "Product name is required"),
  item_class_code: z.string().min(1, "Classification code is required"),
  item_type_code: z.enum(["1", "2", "3"]).default("3"), // Default to 3: Service
  tax_type_code: z.enum(["A", "B", "C", "D", "E"]).default("B"),
  default_unit_price: z.coerce.number().min(0, "Price must be positive"),
  origin_nation_code: z.string().min(2).max(2).default("KE"),
  package_unit_code: z.string().min(1).default("OU"),
  quantity_unit_code: z.string().min(1).default("U"),
  item_bar_code: z.string().optional().nullable(),
  stock_quantity: z.coerce.number().optional().nullable().default(0),
});

type FormData = z.infer<typeof formSchema>;

export function RegisterDigitaxItemSheet({
  open,
  onOpenChange,
  onSuccess,
  item,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  item?: any;
}) {
  const isEditing = !!item;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      item_name: "",
      item_class_code: "81111600",
      item_type_code: "3",
      tax_type_code: "B",
      default_unit_price: 0,
      origin_nation_code: "KE",
      package_unit_code: "OU",
      quantity_unit_code: "U",
      item_bar_code: "",
      stock_quantity: 0,
    },
  });

  // Pre-fill form when editing
  React.useEffect(() => {
    if (item && open) {
      form.reset({
        item_name: item.item_name || "",
        item_class_code: item.item_class_code || "81111600",
        item_type_code: item.item_type_code || "3",
        tax_type_code: item.tax_type_code || "B",
        default_unit_price: item.default_unit_price || 0,
        origin_nation_code: item.origin_nation_code || "KE",
        package_unit_code: item.package_unit_code || "OU",
        quantity_unit_code: item.quantity_unit_code || "U",
        item_bar_code: item.item_bar_code || "",
        stock_quantity: item.stock_quantity || 0,
      });
    } else if (!open) {
      form.reset();
    }
  }, [item, open, form]);

  const createItem = trpc.digitax.items.create.useMutation({
    onSuccess: () => {
      captureEvent("digitax_product_registered");
      toast.success("Product registered in eTIMS system");
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to register product");
    },
  });

  const updateItem = trpc.digitax.items.update.useMutation({
    onSuccess: () => {
      toast.success("Product updated successfully");
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update product");
    },
  });

  const onSubmit = (data: FormData) => {
    const payload = {
      ...data,
      stock_quantity: data.stock_quantity ?? 0,
      item_bar_code: data.item_bar_code || undefined,
    };

    if (isEditing && item?.id) {
      updateItem.mutate({
        itemId: item.id,
        data: payload,
      });
    } else {
      createItem.mutate(payload);
    }
  };

  const isPending = createItem.isPending || updateItem.isPending;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEditing ? "Update Product / Service" : "Register Product / Service"}</SheetTitle>
          <SheetDescription>
            {isEditing 
              ? "Modify product details for tax compliance and catalog updates."
              : "Add a new item to your eTIMS catalog for tax compliance."}
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-8">
            <FormField
              control={form.control}
              name="item_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product/Service Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Premium Web Hosting" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="item_type_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Item Type</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1">Raw Material</SelectItem>
                        <SelectItem value="2">Finished Good</SelectItem>
                        <SelectItem value="3">Service</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tax_type_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tax Category</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select tax" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="A">A (Exempt)</SelectItem>
                        <SelectItem value="B">B (16% VAT)</SelectItem>
                        <SelectItem value="C">C (0% Zero Rated)</SelectItem>
                        <SelectItem value="D">D (Non-VAT)</SelectItem>
                        <SelectItem value="E">E (8%)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="item_class_code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>KRA Classification (HS Code)</FormLabel>
                  <FormControl>
                    <ComboboxDropdown
                      placeholder="Select classification code"
                      searchPlaceholder="Search HS codes..."
                      items={ITEM_CLASS_OPTIONS}
                      selectedItem={ITEM_CLASS_OPTIONS.find((x) => x.id === field.value)}
                      onSelect={(item) => field.onChange(item.id)}
                      emptyResults="No codes found"
                      className="w-full"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="default_unit_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Base Price (KES)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="stock_quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Initial Stock</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} value={field.value || 0} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border/20">
              <FormField
                control={form.control}
                name="package_unit_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-muted-foreground uppercase tracking-wider">Pkg Unit</FormLabel>
                    <FormControl>
                      <Input placeholder="OU" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="quantity_unit_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-muted-foreground uppercase tracking-wider">Qty Unit</FormLabel>
                    <FormControl>
                      <Input placeholder="U" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <SheetFooter className="pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={createItem.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createItem.isPending} className="min-w-[140px]">
                {createItem.isPending ? (
                  <>
                    <Spinner size={16} className="mr-2" />
                    Registering...
                  </>
                ) : (
                  "Complete Registration"
                )}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
