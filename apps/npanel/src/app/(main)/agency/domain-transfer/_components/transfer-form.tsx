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
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { toast } from "sonner";
import { SheetClose } from "@/components/npanel-ui/sheet";
import { trpc } from "@/utils/trpc";
import type { TransferProvider } from "./transfer-ready-card";

type ProviderResponseState =
  | { type: "error"; message: string }
  | { type: "success"; message: string }
  | null;

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
  onSuccess,
}: TransferFormProps) {
  const [showEppCode, setShowEppCode] = React.useState(false);
  const [providerResponse, setProviderResponse] = React.useState<ProviderResponseState>(null);

  const form = useForm<TransferFormValues>({
    resolver: zodResolver(transferFormSchema),
    defaultValues: {
      authCode: "",
    },
  });

  const authCodeValue = form.watch("authCode");
  const prevAuthCodeRef = React.useRef(authCodeValue);

  // Clear error state when user changes EPP code so they can retry
  React.useEffect(() => {
    if (providerResponse?.type === "error" && prevAuthCodeRef.current !== authCodeValue) {
      setProviderResponse(null);
    }
    prevAuthCodeRef.current = authCodeValue;
  }, [authCodeValue, providerResponse?.type]);

  const onTransferSuccess = (message: string) => {
    setProviderResponse({ type: "success", message });
    toast.success("Domain transfer initiated successfully", {
      description: `Transfer request for ${fullDomain} has been submitted. We will process it shortly.`,
    });
    form.reset();
  };

  const handleDone = () => {
    setProviderResponse(null);
    onSuccess?.();
  };

  const initiateTransfer = trpc.domainTransfer.initiateTransfer.useMutation({
    onSuccess: (_data) => {
      const pending = _data && "pending" in _data && _data.pending;
      const msg = pending
        ? "Transfer is pending approval from the current registrar."
        : "Transfer request has been sent to the provider.";
      onTransferSuccess(msg);
    },
    onError: (error) => {
      setProviderResponse({
        type: "error",
        message: error.message ?? "An unexpected error occurred. Please check the EPP code and try again.",
      });
      toast.error("Failed to initiate transfer", {
        description: error.message ?? "An unexpected error occurred",
      });
    },
  });

  const onSubmit = async (data: TransferFormValues) => {
    const authCode = (data.authCode ?? "").trim();
    if (!authCode) {
      toast.error("Authorization code required", {
        description: "Enter the EPP code from your current registrar to authorize the transfer.",
      });
      return;
    }
    try {
      await initiateTransfer.mutateAsync({
        domain: fullDomain,
        authCode,
        provider,
        domainName: initialDomain,
        extension: initialExtension.startsWith(".") ? initialExtension.slice(1) : initialExtension,
        providerPriceAmount: providerPriceAmount != null ? String(providerPriceAmount) : undefined,
        providerPriceCurrency: providerPriceCurrency ?? undefined,
        customerPriceAmount: customerPriceAmount != null ? String(customerPriceAmount) : undefined,
        customerPriceCurrency: customerPriceCurrency ?? undefined,
      });
    } catch {
      // Error handled by mutation onError
    }
  };

  const isSubmitting = initiateTransfer.isPending;
  const isSubmitDisabled = isSubmitting || providerResponse?.type === "error";

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
                    disabled={isSubmitting}
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

        {providerResponse !== null && (
          <div
            className={`rounded-lg border p-4 ${
              providerResponse.type === "error"
                ? "border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/30"
                : "border-green-200 bg-green-50 dark:border-green-900/50 dark:bg-green-950/30"
            }`}
            role="alert"
          >
            <p
              className={`text-sm font-medium ${
                providerResponse.type === "error"
                  ? "text-red-800 dark:text-red-200"
                  : "text-green-800 dark:text-green-200"
              }`}
            >
              {providerResponse.type === "error" ? "Error" : "Success"}
            </p>
            <p
              className={`mt-1 text-sm ${
                providerResponse.type === "error"
                  ? "text-red-700 dark:text-red-300"
                  : "text-green-700 dark:text-green-300"
              }`}
            >
              {providerResponse.message}
            </p>
            {providerResponse.type === "error" && (
              <p className="mt-2 text-xs text-red-600 dark:text-red-400">
                Change the EPP code above to enable the submit button and try again.
              </p>
            )}
            {providerResponse.type === "success" && (
              <Button type="button" size="sm" className="mt-3" onClick={handleDone}>
                Done
              </Button>
            )}
          </div>
        )}

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
          <Button type="submit" disabled={isSubmitDisabled}>
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
