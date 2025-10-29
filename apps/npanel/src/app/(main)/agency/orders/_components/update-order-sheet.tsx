"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { ShoppingCart, XIcon, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/npanel-ui/sheet";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { DatePicker } from "@/components/npanel-ui/date-picker";

import { orderSchema } from "./schema";

const FormSchema = z.object({
  orderNumber: z.string().min(1, { message: "Order number is required." }),
  companyName: z.string().min(1, { message: "Company name is required." }),
  date: z.string().min(1, { message: "Date is required." }),
  paymentStatus: z.enum(["pending", "paid", "failed", "refunded"]),
  totalAmount: z.number().min(0, { message: "Total amount must be positive." }),
  status: z.enum(["pending", "processing", "active", "suspended", "cancelled"]),
});

interface UpdateOrderSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: z.infer<typeof orderSchema> | null;
  onUpdateOrder: (orderId: number, order: Partial<z.infer<typeof orderSchema>>) => void;
}

export function UpdateOrderSheet({ open, onOpenChange, order, onUpdateOrder }: UpdateOrderSheetProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      orderNumber: "",
      companyName: "",
      date: "",
      paymentStatus: "pending",
      totalAmount: 0,
      status: "pending",
    },
  });

  React.useEffect(() => {
    if (order) {
      form.reset({
        orderNumber: order.orderNumber,
        companyName: order.companyName,
        date: new Date(order.date).toISOString().split('T')[0],
        paymentStatus: order.paymentStatus,
        totalAmount: order.totalAmount,
        status: order.status,
      });
    }
  }, [order, form]);

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    if (!order) return;
    
    setIsSubmitting(true);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const updatedOrder = {
        orderNumber: data.orderNumber,
        companyName: data.companyName,
        date: new Date(data.date).toISOString(),
        paymentStatus: data.paymentStatus,
        totalAmount: data.totalAmount,
        status: data.status,
      };

      onUpdateOrder(order.id, updatedOrder);
      
      toast.success("Order updated successfully!");
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating order:", error);
      toast.error("Failed to update order", {
        description: "Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!order) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader className="mb-6 flex justify-between items-center flex-row">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-full">
              <ShoppingCart className="h-6 w-6 text-primary" />
            </div>
            <div>
              <SheetTitle className="text-2xl font-bold">Update Order</SheetTitle>
              <SheetDescription className="text-base">
                Edit order details
              </SheetDescription>
            </div>
          </div>
          <SheetClose asChild>
            <Button
              size="icon"
              variant="ghost"
              className="p-0 m-0 size-auto hover:bg-transparent"
            >
              <XIcon className="size-5" />
            </Button>
          </SheetClose>
        </SheetHeader>

        <div className="px-1 pb-1">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Order Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Order Information
                  </CardTitle>
                  <CardDescription>Basic order details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="orderNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Order Number</FormLabel>
                        <FormControl>
                          <Input placeholder="ORD-2024-001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name</FormLabel>
                        <FormControl>
                          <Input placeholder="TechCorp Solutions" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Order Date</FormLabel>
                        <FormControl>
                          <DatePicker
                            value={field.value ? new Date(field.value) : undefined}
                            onChange={(date) => field.onChange(date ? date.toISOString().split('T')[0] : "")}
                            placeholder="Select order date"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="totalAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Total Amount</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              step="0.01"
                              placeholder="1250.00" 
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="paymentStatus"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Payment Status</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select payment status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="paid">Paid</SelectItem>
                              <SelectItem value="failed">Failed</SelectItem>
                              <SelectItem value="refunded">Refunded</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Order Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select order status" />
                            </SelectTrigger>
                          </FormControl>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="processing">Processing</SelectItem>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="suspended">Suspended</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <SheetFooter className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <Spinner variant="ellipsis" className="text-primary-foreground" size="sm" />
                      <span>Updating...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Save className="h-4 w-4" />
                      <span>Update Order</span>
                    </div>
                  )}
                </Button>
              </SheetFooter>
            </form>
          </Form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
