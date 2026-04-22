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
import { FileSearch } from "lucide-react";

const formSchema = z.object({
  invoice_number: z.string().min(1, "Invoice number is required"),
  amount: z.coerce.number().optional().or(z.literal(0)),
  supplier_pin: z.string().optional().or(z.literal("")),
  reference_number: z.string().optional().or(z.literal("")),
});

type FormData = z.infer<typeof formSchema>;

export function VerifyDigitaxInvoiceSheet({
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
      invoice_number: "",
      amount: 0,
      supplier_pin: "",
      reference_number: "",
    },
  });

  const verifyMutation = trpc.digitax.verifications.verify.useMutation({
    onSuccess: (res: any) => {
      // res might contain validation details
      toast.success("Verification request submitted successfully");
      form.reset();
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (err) => {
      toast.error(err.message || "Verification request failed");
    },
  });

  const onSubmit = (data: FormData) => {
    verifyMutation.mutate({
      ...data,
      amount: data.amount || undefined,
      supplier_pin: data.supplier_pin || undefined,
      reference_number: data.reference_number || undefined,
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Verify External Invoice</SheetTitle>
          <SheetDescription>
            Audit an external invoice by checking its authenticity against KRA eTIMS records.
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-8">
            <FormField
              control={form.control}
              name="invoice_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>KRA Invoice Number</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. INV-..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="supplier_pin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Supplier PIN (TIN)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. A012345678X" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Amount</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="reference_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reference #</FormLabel>
                    <FormControl>
                      <Input placeholder="Optional" {...field} />
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
                disabled={verifyMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={verifyMutation.isPending} className="min-w-[140px] gap-2">
                {verifyMutation.isPending ? (
                  <>
                    <Spinner size={16} />
                    Checking...
                  </>
                ) : (
                  <>
                    <FileSearch className="h-4 w-4" />
                    Verify Now
                  </>
                )}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
