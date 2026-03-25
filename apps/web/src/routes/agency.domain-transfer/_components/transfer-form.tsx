"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff } from "lucide-react";
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
import { toast } from "@/components/ui/sonner";
import { SheetClose } from "@/components/npanel-ui/sheet";
import { trpc } from "@/utils/trpc";
import { useGlobalBuyNowStore } from "@/stores/global-buy-now-store";
import type { TransferProvider } from "./transfer-ready-card";

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
  /** Customer-facing price (after margin) – shown in UI */
  price: number;
  currency: string;
  /** Provider price (no margin) – for DB record */
  providerPriceAmount?: number | null;
  providerPriceCurrency?: string | null;
  /** Customer price (after margin) – for DB record */
  customerPriceAmount?: number | null;
  customerPriceCurrency?: string | null;
  provider: TransferProvider;
  /** For customer/team checkout (createFromPayment teamId) */
  teamId?: string | null;
  onSuccess?: () => void;
}

export function TransferForm({
  fullDomain,
  initialDomain,
  initialExtension,
  price,
  currency,
  providerPriceAmount,
  providerPriceCurrency,
  customerPriceAmount,
  customerPriceCurrency,
  provider,
  teamId,
  onSuccess,
}: TransferFormProps) {
  const [showEppCode, setShowEppCode] = React.useState(false);
  const openForTransfer = useGlobalBuyNowStore((s) => s.openForTransfer);
  // Use the existing \"Domains\" product for transfer (same as registration).
  const { data: domainsProductId, isLoading: loadingDomainsProduct } =
    trpc.clientSubscriptions.getDomainsProductId.useQuery(undefined);

  const form = useForm<TransferFormValues>({
    resolver: zodResolver(transferFormSchema),
    defaultValues: {
      authCode: "",
    },
  });

  const onSubmit = (data: TransferFormValues) => {
    const authCode = (data.authCode ?? "").trim();
    if (!authCode) {
      toast.error("Authorization code required", {
        description: "Enter the EPP code from your current registrar to authorize the transfer.",
      });
      return;
    }
    if (!domainsProductId) {
      toast.error("Domain product not available for transfer", {
        description: "Please try again or contact support.",
      });
      return;
    }
    openForTransfer({
      domain: fullDomain,
      authCode,
      price,
      currency,
      productId: domainsProductId,
      teamId: teamId ?? undefined,
    });
    onSuccess?.();
  };

  const isSubmitDisabled = loadingDomainsProduct;

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
                <div className="relative">
                  <Input
                    type={showEppCode ? "text" : "password"}
                    placeholder="Enter authorization code from current registrar"
                    className="pr-10"
                    {...field}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowEppCode((prev) => !prev)}
                    aria-label={showEppCode ? "Hide authorization code" : "Show authorization code"}
                  >
                    {showEppCode ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </FormControl>
              <FormDescription>
                Required. Obtain this code from your current registrar to authorize the transfer. You cannot submit without it.
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
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </SheetClose>
          <Button type="submit" disabled={isSubmitDisabled}>
            Proceed to payment
          </Button>
        </div>
      </form>
    </Form>
  );
}
