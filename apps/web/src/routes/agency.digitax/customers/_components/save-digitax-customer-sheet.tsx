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
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { trpc } from "@/utils/trpc";

const formSchema = z.object({
  customer_name: z.string().min(1, "Customer name is required"),
  customer_tin: z.string().min(1, "Customer TIN is required"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
});

type FormData = z.infer<typeof formSchema>;

export function SaveDigitaxCustomerSheet({
  open,
  onOpenChange,
  onSuccess,
  customer,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  customer?: any;
}) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customer_name: "",
      customer_tin: "",
      email: "",
      phone: "",
    },
  });

  React.useEffect(() => {
    if (customer) {
      form.reset({
        customer_name: customer.customer_name || "",
        customer_tin: customer.customer_tin || "",
        email: customer.email || "",
        phone: customer.phone || "",
      });
    } else {
      form.reset({
        customer_name: "",
        customer_tin: "",
        email: "",
        phone: "",
      });
    }
  }, [customer, form]);

  const createCustomer = trpc.digitax.customers.create.useMutation({
    onSuccess: () => {
      toast.success("Customer registered successfully");
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to register customer");
    },
  });

  const updateCustomer = trpc.digitax.customers.update.useMutation({
    onSuccess: () => {
      toast.success("Customer profile updated");
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update customer");
    },
  });

  const onSubmit = (data: FormData) => {
    const payload = {
      ...data,
      email: data.email || undefined,
      phone: data.phone || undefined,
    };

    if (customer?.id) {
      updateCustomer.mutate({
        customerId: customer.id,
        data: payload,
      });
    } else {
      createCustomer.mutate(payload);
    }
  };

  const isPending = createCustomer.isPending || updateCustomer.isPending;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{customer ? "Edit Customer" : "New Customer"}</SheetTitle>
          <SheetDescription>
            {customer ? "Modify existing customer tax details." : "Register a new customer tax identity for eTIMS compliance."}
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-8">
            <FormField
              control={form.control}
              name="customer_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Legal Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. John Doe / Acme Inc" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="customer_tin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer TIN (KRA PIN)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. A012345678X" {...field} disabled={!!customer} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-border/20">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input placeholder="example@domain.com" type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="+254..." {...field} />
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
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending} className="min-w-[140px]">
                {isPending ? (
                  <>
                    <Spinner size={16} className="mr-2" />
                    Saving...
                  </>
                ) : (
                  customer ? "Update Profile" : "Register Customer"
                )}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
