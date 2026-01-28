"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { toast } from "sonner";
import { SheetClose } from "@/components/npanel-ui/sheet";
import { trpc } from "@/utils/trpc";

const transferFormSchema = z.object({
  authCode: z.string().min(1, "Authorization code is required"),
});

type TransferFormValues = z.infer<typeof transferFormSchema>;

// Same formatPrice as domain search/registration (Intl.NumberFormat + currency symbols)
function formatPrice(price?: number, currency?: string): string {
  if (price == null) return "N/A";
  const currencySymbols: Record<string, string> = {
    USD: "$",
    KES: "KSh",
    EUR: "€",
    GBP: "£",
    CAD: "C$",
    AUD: "A$",
    JPY: "¥",
    INR: "₹",
    ZAR: "R",
    NGN: "₦",
  };
  const symbol = currencySymbols[currency ?? "USD"] ?? currency ?? "$";
  const formattedNumber = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
  return `${symbol} ${formattedNumber}`;
}

export const TRANSFER_FORM_ID = "transfer-form";

interface TransferFormProps {
  fullDomain: string;
  initialDomain: string;
  initialExtension: string;
  price: number;
  currency: string;
  onSuccess?: () => void;
  isSubmitting?: boolean;
}

export function TransferForm({
  fullDomain,
  initialDomain,
  initialExtension,
  price,
  currency,
  onSuccess,
}: TransferFormProps) {
  const form = useForm<TransferFormValues>({
    resolver: zodResolver(transferFormSchema),
    defaultValues: {
      authCode: "",
    },
  });

  const transferMutation = trpc.openProvider.domains.transfer.useMutation({
    onSuccess: () => {
      toast.success("Domain transfer initiated successfully", {
        description: `Transfer request for ${fullDomain} has been submitted.`,
      });
      form.reset();
      onSuccess?.();
    },
    onError: (error) => {
      toast.error("Failed to initiate transfer", {
        description: error.message || "An unexpected error occurred",
      });
    },
  });

  const onSubmit = async (data: TransferFormValues) => {
    try {
      const extension = initialExtension.startsWith(".")
        ? initialExtension.slice(1)
        : initialExtension;

      await transferMutation.mutateAsync({
        domain: {
          name: initialDomain,
          extension,
        },
        auth_code: data.authCode,
        owner_handle: "default",
        admin_handle: "default",
        tech_handle: "default",
        autorenew: "default",
      });
    } catch {
      // Error handled by mutation onError
    }
  };

  const isSubmitting = transferMutation.isPending;

  return (
    <Form {...form}>
      <form id={TRANSFER_FORM_ID} onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none">Domain</label>
          <Input value={fullDomain} disabled className="bg-muted" readOnly />
          <p className="text-xs text-muted-foreground">
            The domain you are transferring to Nisc Cloud
          </p>
        </div>

        <FormField
          control={form.control}
          name="authCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Authorization code (EPP code)</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="Enter authorization code from current registrar"
                  {...field}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormDescription>
                Obtain this code from your current registrar to authorize the transfer.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="rounded-lg border bg-muted/50 p-4">
          <p className="text-sm font-medium text-foreground">Transfer price</p>
          <p className="text-xl font-bold text-foreground">{formatPrice(price, currency)}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Includes one year renewal after transfer
          </p>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <SheetClose asChild>
            <Button type="button" variant="outline" disabled={isSubmitting}>
              Cancel
            </Button>
          </SheetClose>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Spinner variant="ellipsis" className="mr-2" size="sm" />
                Initiating transfer...
              </>
            ) : (
              "Initiate transfer"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
