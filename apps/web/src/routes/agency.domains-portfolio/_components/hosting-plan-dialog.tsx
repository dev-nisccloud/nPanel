"use client";

import * as React from "react";
import { Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/utils/trpc";
import { toast } from "@/components/ui/sonner";
import { BuyNowDialog, type ServicePlanDetails } from "@/components/buy-now-dialog";

interface HostingPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planType: "web" | "email";
  /** Domain from the portfolio page — shown in Buy now confirmation */
  domainName: string;
  /** Team context for checkout when available */
  teamId?: string | null;
  buyDomainHref?: string;
}

const formatPrice = (price?: number, currency?: string) => {
  if (price === undefined || price === null || isNaN(price) || !isFinite(price)) {
    return "N/A";
  }

  const currencySymbols: Record<string, string> = {
    USD: "$",
    KES: "KSh",
    EUR: "€",
    GBP: " ?",
  };

  const symbol = currencySymbols[currency || "KES"] || currency || "KSh";

  try {
    const formattedNumber =
      typeof Intl !== "undefined" && Intl.NumberFormat
        ? new Intl.NumberFormat("en-US", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(price)
        : price.toFixed(0);

    return `${symbol} ${formattedNumber}`;
  } catch (error) {
    console.error("Error formatting price:", error);
    return `${symbol} ${price.toFixed(0)}`;
  }
};

export function HostingPlanDialog({
  open,
  onOpenChange,
  planType,
  domainName,
  teamId,
  buyDomainHref,
}: HostingPlanDialogProps) {
  const [selectedPlanId, setSelectedPlanId] = React.useState<string | null>(null);
  const [selectedBillingCycle, setSelectedBillingCycle] = React.useState<
    Record<string, "MONTHLY" | "YEARLY" | "BIENNIALLY">
  >({});

  const [buyNowOpen, setBuyNowOpen] = React.useState(false);
  const [buyNowPlan, setBuyNowPlan] = React.useState<ServicePlanDetails | null>(null);

  const { data: webPricing, isLoading: loadingWeb } = trpc.products.getHostingPlansForPricing.useQuery(
    undefined,
    { enabled: open && planType === "web" },
  );
  const { data: emailPricing, isLoading: loadingEmail } =
    trpc.products.getEmailHostingPlansForPricing.useQuery(undefined, {
      enabled: open && planType === "email",
    });

  const plans = planType === "web" ? (webPricing?.plans ?? []) : (emailPricing?.plans ?? []);
  const isLoading = planType === "web" ? loadingWeb : loadingEmail;

  const handlePlanSelect = (planId: string) => {
    if (selectedPlanId === planId) {
      setSelectedPlanId(null);
    } else {
      setSelectedPlanId(planId);
      if (!selectedBillingCycle[planId]) {
        setSelectedBillingCycle((prev) => ({
          ...prev,
          [planId]: "MONTHLY",
        }));
      }
    }
  };

  const handleContinue = () => {
    if (!selectedPlanId) {
      toast.error("Please select a plan");
      return;
    }
    const selected = plans.find((p) => p.id === selectedPlanId);
    if (!selected) {
      toast.error("Selected plan not found");
      return;
    }
    const bc = selectedBillingCycle[selectedPlanId] ?? "MONTHLY";
    const monthly = parseFloat(selected.niscPrice || "0");
    const price =
      bc === "MONTHLY" ? monthly : bc === "YEARLY" ? monthly * 12 : monthly * 24;

    const planDetails: ServicePlanDetails = {
      planId: selected.id,
      planName: selected.name,
      planType: "HOSTING",
      subType: planType === "web" ? "WEB_HOSTING" : "EMAIL_HOSTING",
      price,
      currency: selected.niscCurrency || "KES",
      billingCycle: bc,
      productId: selected.productId,
    };

    setBuyNowPlan(planDetails);
    onOpenChange(false);
    setBuyNowOpen(true);
  };

  React.useEffect(() => {
    if (!open) {
      setSelectedPlanId(null);
      setSelectedBillingCycle({});
    }
  }, [open]);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              Select {planType === "web" ? "Web" : "Email"} Hosting Plan
            </DialogTitle>
            <DialogDescription>
              Choose the plan that best fits your needs for <span className="font-medium text-foreground">{domainName}</span>
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-32" />
                ))}
              </div>
            ) : plans.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No plans available</div>
            ) : (
              <div className="space-y-3">
                {plans.map((plan) => {
                  const price = parseFloat(plan.niscPrice || "0");
                  const billingCycle = selectedBillingCycle[plan.id] || "MONTHLY";
                  const monthlyPrice =
                    billingCycle === "MONTHLY"
                      ? price
                      : billingCycle === "YEARLY"
                        ? price / 12
                        : price / 24;
                  const isSelected = selectedPlanId === plan.id;

                  return (
                    <div
                      key={plan.id}
                      className={`rounded-lg border-2 p-4 transition-all cursor-pointer ${
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border bg-card hover:border-primary/50"
                      }`}
                      onClick={() => handlePlanSelect(plan.id)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold text-foreground line-clamp-3 break-words">
                              {plan.name}
                            </span>
                            {plan.isPopular && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                                Popular
                              </span>
                            )}
                          </div>
                          <div className="font-semibold text-lg text-foreground">
                            {formatPrice(monthlyPrice, plan.niscCurrency || "KES")}
                            /mo
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div
                            className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                              isSelected ? "border-primary bg-primary" : "border-muted-foreground"
                            }`}
                          >
                            {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                          </div>
                          {isSelected && (
                            <div onClick={(e) => e.stopPropagation()}>
                              <Select
                                value={billingCycle}
                                onValueChange={(value: "MONTHLY" | "YEARLY" | "BIENNIALLY") => {
                                  setSelectedBillingCycle((prev) => ({
                                    ...prev,
                                    [plan.id]: value,
                                  }));
                                }}
                              >
                                <SelectTrigger className="w-32 h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="MONTHLY">Monthly</SelectItem>
                                  <SelectItem value="YEARLY">Yearly</SelectItem>
                                  <SelectItem value="BIENNIALLY">Biennially</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleContinue} disabled={!selectedPlanId}>
              Continue to checkout
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <BuyNowDialog
        open={buyNowOpen}
        onOpenChange={(o) => {
          setBuyNowOpen(o);
          if (!o) setBuyNowPlan(null);
        }}
        plan={buyNowPlan}
        requireDomainStep
        teamId={teamId ?? undefined}
        portfolioDomainName={domainName}
        buyDomainHref={buyDomainHref}
        agencyPortfolioCheckout
      />
    </>
  );
}
