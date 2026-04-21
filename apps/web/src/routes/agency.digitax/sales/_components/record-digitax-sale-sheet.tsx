"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
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
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Info } from "lucide-react";
import { ComboboxDropdown } from "@npanel/ui/components/combobox-dropdown";

const saleItemSchema = z.object({
  id: z.string().min(1, "Item selection is required"),
  quantity: z.coerce.number().min(1, "Qty must be at least 1"),
  unit_price: z.coerce.number().min(0, "Price must be >= 0"),
  total_amount: z.coerce.number().min(0),
  item_name: z.string(), // Helper for display
});

const formSchema = z.object({
  sale_date: z.string().min(1, "Date is required"),
  customer_name: z.string().optional().or(z.literal("")),
  customer_tin: z.string().optional().or(z.literal("")),
  trader_invoice_number: z.string().min(1, "Invoice number is required"),
  receipt_type_code: z.string().default("S"),
  payment_type_code: z.string().default("01"),
  invoice_status_code: z.string().default("02"),
  items: z.array(saleItemSchema).min(1, "Add at least one item"),
});

type FormData = z.infer<typeof formSchema>;

export function RecordDigitaxSaleSheet({
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
      sale_date: new Date().toISOString().split('T')[0],
      trader_invoice_number: `INV-${Math.floor(Math.random() * 1000000)}`,
      receipt_type_code: "S",
      payment_type_code: "01",
      invoice_status_code: "02",
      customer_name: "",
      customer_tin: "",
      items: [{ id: "", quantity: 1, unit_price: 0, total_amount: 0, item_name: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const { data: itemsData } = trpc.digitax.items.getAll.useQuery({ page_size: 20 }, { enabled: open });
  const { data: customersData } = trpc.digitax.customers.getAll.useQuery({ page_size: 20 }, { enabled: open });

  const recordSale = trpc.digitax.sales.add.useMutation({
    onSuccess: () => {
      toast.success("Sale transaction transmitted successfully");
      form.reset();
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to transmit sale");
    },
  });

  const productOptions = React.useMemo(() => {
    return (itemsData?.data ?? []).map((it: any) => ({
      id: it.id,
      label: `${it.name} (${it.code}) - KES ${it.unit_price}`,
      price: it.unit_price,
      name: it.name,
    }));
  }, [itemsData]);

  const customerOptions = React.useMemo(() => {
    return (customersData?.data ?? []).map((c: any) => ({
      id: c.tin,
      label: `${c.name} (${c.tin})`,
      name: c.name,
      tin: c.tin,
    }));
  }, [customersData]);

  const onSubmit = (data: FormData) => {
    // Remove the helper item_name from the payloads
    const cleanedItems = data.items.map(({ item_name, ...rest }) => rest);
    recordSale.mutate({
      ...data,
      items: cleanedItems,
      customer_name: data.customer_name || undefined,
      customer_tin: data.customer_tin || undefined,
    });
  };

  const calculateTotals = () => {
    const items = form.watch("items");
    return items.reduce((acc, curr) => acc + (curr.quantity * curr.unit_price), 0);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-3xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Transmit Sales Transaction</SheetTitle>
          <SheetDescription>
            Generate a KRA-compliant sale record. Totals are automatically calculated.
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 mt-10">
            {/* Header Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-muted/20 p-5 rounded-2xl border border-border/50">
              <FormField
                control={form.control}
                name="trader_invoice_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Merchant Invoice #</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sale_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sale Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="receipt_type_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Receipt Type</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="S">Standard (Sale)</SelectItem>
                        <SelectItem value="C">Copy (Reprint)</SelectItem>
                        <SelectItem value="T">Training</SelectItem>
                        <SelectItem value="P">Proforma</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="payment_type_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Mode</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="01">Cash</SelectItem>
                        <SelectItem value="02">Mobile Money</SelectItem>
                        <SelectItem value="03">Card</SelectItem>
                        <SelectItem value="04">Bank Transfer</SelectItem>
                        <SelectItem value="05">Credit</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Customer Section */}
            <div className="space-y-4 pt-4">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground/80">Customer Information</h4>
                <Badge variant="outline" className="text-[9px] font-bold">Optional for Cash</Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="customer_tin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer TIN (PIN)</FormLabel>
                      <FormControl>
                        <ComboboxDropdown
                          placeholder="Select registered customer..."
                          searchPlaceholder="Search TIN..."
                          items={customerOptions}
                          selectedItem={customerOptions.find(x => x.id === field.value)}
                          onSelect={(item: any) => {
                            field.onChange(item.tin);
                            form.setValue("customer_name", item.name);
                          }}
                          className="w-full"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="customer_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Items Section */}
            <div className="space-y-5 pt-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground/80">Line Items</h4>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={() => append({ id: "", quantity: 1, unit_price: 0, total_amount: 0, item_name: "" })}
                  className="rounded-full h-8 px-4 gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Row
                </Button>
              </div>

              <div className="space-y-3">
                {fields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-12 gap-3 items-end bg-muted/10 p-3 rounded-xl border border-border/30">
                    <div className="col-span-5">
                      <FormField
                        control={form.control}
                        name={`items.${index}.id`}
                        render={({ field }) => (
                          <FormItem className="space-y-1.5">
                            <FormLabel className="text-[10px] font-bold uppercase text-muted-foreground/60">Product/Service</FormLabel>
                            <FormControl>
                              <ComboboxDropdown
                                placeholder="Choose item..."
                                items={productOptions}
                                selectedItem={productOptions.find(x => x.id === field.value)}
                                onSelect={(item: any) => {
                                  field.onChange(item.id);
                                  form.setValue(`items.${index}.unit_price`, item.price);
                                  form.setValue(`items.${index}.item_name`, item.name);
                                  const qty = form.getValues(`items.${index}.quantity`);
                                  form.setValue(`items.${index}.total_amount`, item.price * qty);
                                }}
                                className="w-full"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="col-span-2">
                      <FormField
                        control={form.control}
                        name={`items.${index}.quantity`}
                        render={({ field }) => (
                          <FormItem className="space-y-1.5">
                            <FormLabel className="text-[10px] font-bold uppercase text-muted-foreground/60">Qty</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                {...field} 
                                onChange={(e) => {
                                  field.onChange(e);
                                  const prc = form.getValues(`items.${index}.unit_price`);
                                  form.setValue(`items.${index}.total_amount`, Number(e.target.value) * prc);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="col-span-2">
                       <FormField
                        control={form.control}
                        name={`items.${index}.unit_price`}
                        render={({ field }) => (
                          <FormItem className="space-y-1.5">
                            <FormLabel className="text-[10px] font-bold uppercase text-muted-foreground/60">Price</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                {...field} 
                                onChange={(e) => {
                                  field.onChange(e);
                                  const qty = form.getValues(`items.${index}.quantity`);
                                  form.setValue(`items.${index}.total_amount`, Number(e.target.value) * qty);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="col-span-2">
                      <div className="space-y-1.5 flex flex-col justify-end h-full">
                        <span className="text-[10px] font-bold uppercase text-muted-foreground/60 px-1">Total</span>
                        <div className="h-10 flex items-center px-3 rounded-lg bg-muted/40 font-bold text-xs">
                          {form.watch(`items.${index}.total_amount`).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="col-span-1 pb-1">
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => remove(index)}
                        className="h-9 w-9 text-rose-500 hover:bg-rose-500/10 rounded-full"
                        disabled={fields.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary Section */}
            <div className="pt-6 border-t border-border/40 flex flex-col items-end gap-3">
               <div className="flex items-center gap-2 text-muted-foreground">
                  <Info className="h-3.5 w-3.5" />
                  <span className="text-xs">VAT and standard levies are applied automatically by DigiTax.</span>
               </div>
               <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10 w-full md:w-80 space-y-3">
                  <div className="flex justify-between text-sm text-muted-foreground">
                     <span>Subtotal</span>
                     <span>KES {calculateTotals().toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                     <span>Est. VAT (16%)</span>
                     <span>KES {(calculateTotals() * 0.16).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-primary/20">
                     <span className="font-bold text-foreground">Total Sale</span>
                     <span className="text-xl font-black text-primary">KES {(calculateTotals() * 1.16).toLocaleString()}</span>
                  </div>
               </div>
            </div>

            <SheetFooter className="pt-8">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={recordSale.isPending}
                className="h-12 px-8 rounded-xl font-bold"
              >
                Discard
              </Button>
              <Button type="submit" disabled={recordSale.isPending} className="h-12 px-10 rounded-xl font-bold min-w-[200px]">
                {recordSale.isPending ? (
                  <>
                    <Spinner size={16} className="mr-2" />
                    Transmitting...
                  </>
                ) : (
                  "Record & Transmit"
                )}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
