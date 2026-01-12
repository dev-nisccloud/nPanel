"use client";

import * as React from "react";
import { HelpCircle, Shield, Mail, Server, Globe, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { trpc } from "@/utils/trpc";
import type { DomainSearchResult } from "@/hooks/use-domain-search";

interface BuyNowDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  domain: DomainSearchResult | null;
}

type Step = "domain" | "addons" | "nameservers" | "hosting" | "plan-selection" | "review";

interface DomainAddon {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  selected: boolean;
}

interface SelectedHostingPlan {
  type: "web" | "email";
  planId: string;
  planName: string;
  billingCycle: "MONTHLY" | "YEARLY" | "BIENNIALLY";
  price: number;
  currency: string;
}

const formatPrice = (price?: number, currency?: string) => {
  if (price === undefined || price === null || isNaN(price) || !isFinite(price)) {
    return "N/A";
  }

  const currencySymbols: Record<string, string> = {
    'USD': '$',
    'KES': 'KSh',
    'EUR': '€',
    'GBP': '£',
    'CAD': 'C$',
    'AUD': 'A$',
    'JPY': '¥',
    'INR': '₹',
    'ZAR': 'R',
    'NGN': '₦',
  };

  const symbol = currencySymbols[currency || 'KES'] || currency || 'KSh';
  
  try {
    const formattedNumber = typeof Intl !== 'undefined' && Intl.NumberFormat
      ? new Intl.NumberFormat('en-US', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(price)
      : price.toFixed(0);
    
    return `${symbol} ${formattedNumber}`;
  } catch (error) {
    console.error('Error formatting price:', error);
    return `${symbol} ${price.toFixed(0)}`;
  }
};

export function BuyNowDialog({ open, onOpenChange, domain }: BuyNowDialogProps) {
  const [currentStep, setCurrentStep] = React.useState<Step>("domain");
  const [duration, setDuration] = React.useState(1);
  const [couponCode, setCouponCode] = React.useState("");
  const [showCouponInput, setShowCouponInput] = React.useState(false);
  const [selectedAddons, setSelectedAddons] = React.useState<DomainAddon[]>([
    { id: "id-protection", name: "ID Protection", description: "Protect your personal information", price: 650, currency: "KES", selected: false },
    { id: "email-forwarding", name: "Email Forwarding", description: "Forward emails to your existing address", price: 0, currency: "KES", selected: false },
  ]);
  const [nameservers, setNameservers] = React.useState<string[]>(["", "", "", "", ""]);
  const [selectedHostingPlans, setSelectedHostingPlans] = React.useState<SelectedHostingPlan[]>([]);
  const [hostingPlanType, setHostingPlanType] = React.useState<"web" | "email" | null>(null);
  const [selectedBillingCycles, setSelectedBillingCycles] = React.useState<Record<string, "MONTHLY" | "YEARLY" | "BIENNIALLY">>({});

  // Fetch hosting plans
  const { data: webHostingPlans = [], isLoading: isLoadingWeb } = trpc.hostingPlans.getAll.useQuery(
    {
      planType: "HOSTING",
      hostingSubType: "WEB_HOSTING",
      isActive: true,
    },
    { enabled: currentStep === "plan-selection" && hostingPlanType === "web" }
  );

  const { data: emailHostingPlans = [], isLoading: isLoadingEmail } = trpc.hostingPlans.getAll.useQuery(
    {
      planType: "HOSTING",
      hostingSubType: "EMAIL_HOSTING",
      isActive: true,
    },
    { enabled: currentStep === "plan-selection" && hostingPlanType === "email" }
  );

  // Safely calculate pricing with proper null/undefined checks
  const calculated = domain?.price?.calculated;
  
  let displayPrice = 0;
  if (calculated) {
    displayPrice = (calculated as any)?.convertedPrice ?? calculated?.finalPrice ?? 0;
  } else {
    displayPrice = domain?.price?.reseller?.price ?? 0;
  }
  
  displayPrice = typeof displayPrice === 'number' && isFinite(displayPrice) ? displayPrice : 0;
  
  const displayCurrency = calculated
    ? ((calculated as any)?.displayCurrency ?? calculated?.currency ?? 'KES')
    : (domain?.price?.reseller?.currency ?? 'KES');
  
  let originalPrice = 0;
  if (calculated?.originalPrice !== undefined && calculated?.originalPrice !== null) {
    originalPrice = calculated.originalPrice;
  } else {
    originalPrice = domain?.price?.reseller?.price ?? 0;
  }
  
  originalPrice = typeof originalPrice === 'number' && isFinite(originalPrice) ? originalPrice : 0;
  const originalCurrency = calculated?.currency ?? domain?.price?.reseller?.currency ?? 'KES';

  // Calculate totals
  const basePrice = Math.max(0, displayPrice * duration);
  const addonsTotal = selectedAddons
    .filter(a => a.selected)
    .reduce((sum, addon) => sum + (addon.price * (addon.id === "id-protection" ? 1 : duration)), 0);
  
  const hostingTotal = selectedHostingPlans.reduce((sum, plan) => sum + plan.price, 0);
  const subtotal = basePrice + addonsTotal + hostingTotal;
  
  const taxRate = 0.16;
  const taxes = Math.max(0, subtotal * taxRate);
  const couponDiscount = 0;
  const total = Math.max(0, subtotal + taxes - couponDiscount);

  const handleAddonToggle = (addonId: string) => {
    setSelectedAddons(prev => 
      prev.map(addon => 
        addon.id === addonId ? { ...addon, selected: !addon.selected } : addon
      )
    );
  };

  const handleNameserverChange = (index: number, value: string) => {
    const newNameservers = [...nameservers];
    newNameservers[index] = value;
    setNameservers(newNameservers);
  };

  const handleHostingCardClick = (type: "web" | "email") => {
    setHostingPlanType(type);
    setCurrentStep("plan-selection");
  };

  const handlePlanSelect = (plan: any, billingCycle?: "MONTHLY" | "YEARLY" | "BIENNIALLY") => {
    const basePrice = parseFloat(plan.niscPrice || "0");
    const planBillingCycle = plan.billingCycle || "MONTHLY";
    
    // Get or default to MONTHLY for this specific plan
    const cycleForPlan = billingCycle || selectedBillingCycles[plan.id] || "MONTHLY";
    
    // Calculate monthly price from plan's base price
    let monthlyPrice = basePrice;
    if (planBillingCycle === "YEARLY") {
      monthlyPrice = basePrice / 12;
    } else if (planBillingCycle === "BIENNIALLY") {
      monthlyPrice = basePrice / 24;
    }
    
    // Calculate total price based on selected billing cycle
    let totalPrice = monthlyPrice;
    if (cycleForPlan === "YEARLY") {
      totalPrice = monthlyPrice * 12;
    } else if (cycleForPlan === "BIENNIALLY") {
      totalPrice = monthlyPrice * 24;
    }
    
    const newPlan: SelectedHostingPlan = {
      type: hostingPlanType!,
      planId: plan.id,
      planName: plan.name,
      billingCycle: cycleForPlan,
      price: totalPrice,
      currency: plan.niscCurrency || "KES",
    };
    
    // Remove existing plan of same type and add new one
    setSelectedHostingPlans(prev => [
      ...prev.filter(p => p.type !== hostingPlanType),
      newPlan
    ]);
  };

  const handleNext = () => {
    if (currentStep === "domain") {
      setCurrentStep("addons");
    } else if (currentStep === "addons") {
      setCurrentStep("nameservers");
    } else if (currentStep === "nameservers") {
      setCurrentStep("hosting");
    } else if (currentStep === "hosting") {
      setCurrentStep("review");
    }
  };

  const handleBack = () => {
    if (currentStep === "addons") {
      setCurrentStep("domain");
    } else if (currentStep === "nameservers") {
      setCurrentStep("addons");
    } else if (currentStep === "hosting") {
      setCurrentStep("nameservers");
    } else if (currentStep === "plan-selection") {
      setCurrentStep("hosting");
    } else if (currentStep === "review") {
      setCurrentStep("hosting");
    }
  };

  const handlePayment = () => {
    // TODO: Implement payment flow
    try {
      if (!domain || !domain.domain) {
        console.error('Cannot proceed to payment: invalid domain', domain);
        return;
      }
      console.log("Proceeding to payment", { 
        domain: domain.domain, 
        duration, 
        couponCode, 
        total,
        addons: selectedAddons.filter(a => a.selected),
        nameservers: nameservers.filter(n => n.trim() !== ""),
        hostingPlans: selectedHostingPlans,
      });
    } catch (error) {
      console.error('Error in payment handler:', error);
    }
  };

  // Reset state when dialog closes
  React.useEffect(() => {
    if (!open) {
      setCurrentStep("domain");
      setDuration(1);
      setCouponCode("");
      setShowCouponInput(false);
      setSelectedAddons([
        { id: "id-protection", name: "ID Protection", description: "Protect your personal information", price: 650, currency: "KES", selected: false },
        { id: "email-forwarding", name: "Email Forwarding", description: "Forward emails to your existing address", price: 0, currency: "KES", selected: false },
      ]);
      setNameservers(["", "", "", "", ""]);
      setSelectedHostingPlans([]);
      setHostingPlanType(null);
      setSelectedBillingCycles({});
    }
  }, [open]);

  if (!domain || !domain.domain) {
    return null;
  }

  const renderStep = () => {
    switch (currentStep) {
      case "domain":
        return (
          <div className="space-y-4">
            <div className="text-center py-4">
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Get the best of your domain
              </h3>
              <p className="text-sm text-muted-foreground">
                Complete your purchase and unlock powerful features
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium truncate">{domain.domain}</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help flex-shrink-0" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>This domain is by default registered for 1 year. Edit the duration below.</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Select
                    value={duration.toString()}
                    onValueChange={(value) => setDuration(parseInt(value))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue>
                        {duration} {duration === 1 ? 'year' : 'years'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 year</SelectItem>
                      <SelectItem value="2">2 years</SelectItem>
                      <SelectItem value="3">3 years</SelectItem>
                      <SelectItem value="4">4 years</SelectItem>
                      <SelectItem value="5">5 years</SelectItem>
                      <SelectItem value="10">10 years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-semibold text-lg">
                    {formatPrice(basePrice, displayCurrency)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "addons":
        return (
          <div className="space-y-4">
            <div className="text-center py-2">
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Domain Add-ons
              </h3>
              <p className="text-sm text-muted-foreground">
                Enhance your domain with these optional features
              </p>
            </div>
            <div className="space-y-3">
              {selectedAddons.map((addon) => (
                <button
                  key={addon.id}
                  onClick={() => handleAddonToggle(addon.id)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    addon.selected
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`mt-1 h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                        addon.selected ? "border-primary bg-primary" : "border-muted-foreground"
                      }`}>
                        {addon.selected && <Check className="h-3 w-3 text-primary-foreground" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {addon.id === "id-protection" ? (
                            <Shield className="h-4 w-4 text-primary" />
                          ) : (
                            <Mail className="h-4 w-4 text-primary" />
                          )}
                          <span className="font-medium text-foreground">{addon.name}</span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-3 break-words">{addon.description}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {addon.price === 0 ? (
                        <span className="text-sm font-medium text-primary">Free</span>
                      ) : (
                        <span className="text-sm font-medium text-foreground">
                          {formatPrice(addon.price, addon.currency)}
                          {addon.id === "id-protection" ? "/yr" : ""}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );

      case "nameservers":
        return (
          <div className="space-y-4">
            <div className="text-center py-2">
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Custom Nameservers (Optional)
              </h3>
              <p className="text-sm text-muted-foreground">
                Configure custom nameservers for your domain
              </p>
            </div>
            <div className="space-y-3">
              {nameservers.map((ns, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Server className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <Input
                    placeholder={`Nameserver ${index + 1} (optional)`}
                    value={ns}
                    onChange={(e) => handleNameserverChange(index, e.target.value)}
                    className="flex-1"
                  />
                </div>
              ))}
            </div>
          </div>
        );

      case "hosting":
        return (
          <div className="space-y-4">
            <div className="text-center py-2">
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Add Hosting Services
              </h3>
              <p className="text-sm text-muted-foreground">
                Complete your online presence with hosting services
              </p>
            </div>
            <div className="grid gap-4">
              {/* Web Hosting Card */}
              <div className={`rounded-lg border-2 p-4 transition-all ${
                selectedHostingPlans.find(p => p.type === "web")
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card hover:border-primary/50"
              }`}>
                {selectedHostingPlans.find(p => p.type === "web") ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Globe className="h-5 w-5 text-primary" />
                        <span className="font-semibold text-foreground">Web Hosting</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedHostingPlans(prev => prev.filter(p => p.type !== "web"));
                        }}
                        className="h-7 text-xs"
                      >
                        Change
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Everything you need to create a site and get online
                    </p>
                    <div className="pt-2 space-y-1 text-sm">
                      {(() => {
                        const webPlan = selectedHostingPlans.find(p => p.type === "web");
                        if (!webPlan) return null;
                        return (
                          <>
                            <div className="flex justify-between gap-2">
                              <span className="text-muted-foreground flex-shrink-0">Plan:</span>
                              <span className="text-foreground font-medium truncate line-clamp-3 text-right">{webPlan.planName}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Billing Cycle:</span>
                              <span className="text-foreground font-medium">{webPlan.billingCycle}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Price:</span>
                              <span className="text-foreground font-medium">
                                {formatPrice(webPlan.price, webPlan.currency)}
                              </span>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Globe className="h-5 w-5 text-primary" />
                      <span className="font-semibold text-lg text-foreground">Add a web hosting plan to your domain</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Everything you need to create a site and get online
                    </p>
                    <div className="flex items-center justify-between pt-2">
                      <div>
                        <div className="text-sm text-muted-foreground line-through">KSh 9,600</div>
                        <div className="font-semibold text-lg text-foreground">From KSh 800/mo</div>
                        <div className="text-xs text-muted-foreground">when getting a 1 year subscription</div>
                      </div>
                      <Button
                        onClick={() => handleHostingCardClick("web")}
                        className="bg-primary text-primary-foreground"
                      >
                        Get deal
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Email Hosting Card */}
              <div className={`rounded-lg border-2 p-4 transition-all ${
                selectedHostingPlans.find(p => p.type === "email")
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card hover:border-primary/50"
              }`}>
                {selectedHostingPlans.find(p => p.type === "email") ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Mail className="h-5 w-5 text-primary" />
                        <span className="font-semibold text-foreground">Email Hosting</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedHostingPlans(prev => prev.filter(p => p.type !== "email"));
                        }}
                        className="h-7 text-xs"
                      >
                        Change
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Professional email hosting for your domain
                    </p>
                    <div className="pt-2 space-y-1 text-sm">
                      {(() => {
                        const emailPlan = selectedHostingPlans.find(p => p.type === "email");
                        if (!emailPlan) return null;
                        return (
                          <>
                            <div className="flex justify-between gap-2">
                              <span className="text-muted-foreground flex-shrink-0">Plan:</span>
                              <span className="text-foreground font-medium truncate line-clamp-3 text-right">{emailPlan.planName}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Billing Cycle:</span>
                              <span className="text-foreground font-medium">{emailPlan.billingCycle}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Price:</span>
                              <span className="text-foreground font-medium">
                                {formatPrice(emailPlan.price, emailPlan.currency)}
                              </span>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Mail className="h-5 w-5 text-primary" />
                      <span className="font-semibold text-lg text-foreground">Get a new email hosting plan</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Professional email hosting with advanced features
                    </p>
                    <div className="flex items-center justify-between pt-2">
                      <div>
                        <div className="text-sm text-muted-foreground line-through">KSh 4,800</div>
                        <div className="font-semibold text-lg text-foreground">From KSh 400/mo</div>
                        <div className="text-xs text-muted-foreground">when getting a 1 year subscription</div>
                      </div>
                      <Button
                        onClick={() => handleHostingCardClick("email")}
                        className="bg-primary text-primary-foreground"
                      >
                        Get deal
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Skip Card */}
              <div className="rounded-lg border-2 border-border bg-card p-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-lg text-foreground">Skip for now</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    You can add hosting services later from your dashboard
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case "plan-selection":
        const plans = hostingPlanType === "web" ? webHostingPlans : emailHostingPlans;
        const isLoading = hostingPlanType === "web" ? isLoadingWeb : isLoadingEmail;

        return (
          <div className="space-y-4">
            <div className="text-center py-2">
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Select {hostingPlanType === "web" ? "Web" : "Email"} Hosting Plan
              </h3>
              <p className="text-sm text-muted-foreground">
                Choose the plan that best fits your needs
              </p>
            </div>
            
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading plans...
              </div>
            ) : plans.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No plans available
              </div>
            ) : (
              <div className="space-y-3">
                {plans.map((plan) => {
                  const price = parseFloat(plan.niscPrice || "0");
                  const monthlyPrice = plan.billingCycle === "MONTHLY" ? price : plan.billingCycle === "YEARLY" ? price / 12 : price / 24;
                  const isSelected = selectedHostingPlans.some(p => p.planId === plan.id && p.type === hostingPlanType);
                  const planBillingCycle = selectedBillingCycles[plan.id] || "MONTHLY";
                  
                  return (
                    <div
                      key={plan.id}
                      className={`rounded-lg border-2 p-4 transition-all cursor-pointer ${
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border bg-card hover:border-primary/50"
                      }`}
                      onClick={() => {
                        if (!isSelected) {
                          // Set default billing cycle if not already set
                          const defaultCycle = selectedBillingCycles[plan.id] || "MONTHLY";
                          if (!selectedBillingCycles[plan.id]) {
                            setSelectedBillingCycles(prev => ({
                              ...prev,
                              [plan.id]: "MONTHLY"
                            }));
                          }
                          handlePlanSelect(plan, defaultCycle);
                        }
                      }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold text-foreground line-clamp-3 break-words">{plan.name}</span>
                            {plan.isPopular && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                                Popular
                              </span>
                            )}
                          </div>
                          {plan.description && (
                            <p className="text-sm text-muted-foreground mb-2 line-clamp-3 break-words">{plan.description}</p>
                          )}
                          <div className="font-semibold text-lg text-foreground">
                            {formatPrice(monthlyPrice, plan.niscCurrency || "KES")}/mo
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                            isSelected ? "border-primary bg-primary" : "border-muted-foreground"
                          }`}>
                            {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                          </div>
                          {isSelected && (
                            <div onClick={(e) => e.stopPropagation()}>
                              <Select
                                value={planBillingCycle}
                                onValueChange={(value: "MONTHLY" | "YEARLY" | "BIENNIALLY") => {
                                  setSelectedBillingCycles(prev => ({
                                    ...prev,
                                    [plan.id]: value
                                  }));
                                  // Recalculate price with new billing cycle
                                  handlePlanSelect(plan, value);
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
          </div>
        );

      case "review":
        return (
          <div className="space-y-4">
            <div className="text-center py-2">
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Complete and Review
              </h3>
              <p className="text-sm text-muted-foreground">
                Review your selections before proceeding to checkout
              </p>
            </div>

            <ScrollArea className="h-[300px] w-full">
              <div className="space-y-4 pr-4">
                {/* Domain */}
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-foreground line-clamp-3 break-words">{domain.domain}</div>
                      <div className="text-sm text-muted-foreground">{duration} {duration === 1 ? 'year' : 'years'}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-foreground">
                        {formatPrice(basePrice, displayCurrency)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Add-ons */}
                {selectedAddons.filter(a => a.selected).length > 0 && (
                  <div className="space-y-2">
                    {selectedAddons.filter(a => a.selected).map((addon) => (
                      <div key={addon.id} className="bg-muted/50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-foreground line-clamp-1 break-words">{addon.name}</div>
                            <div className="text-sm text-muted-foreground line-clamp-3 break-words">{addon.description}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-foreground">
                              {addon.price === 0 ? "Free" : formatPrice(addon.price * (addon.id === "id-protection" ? 1 : duration), addon.currency)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Hosting Plans */}
                {selectedHostingPlans.map((plan) => (
                  <div key={`${plan.type}-${plan.planId}`} className="bg-muted/50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-foreground line-clamp-3 break-words">
                          {plan.type === "web" ? "Web Hosting" : "Email Hosting"} - {plan.planName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Billing Cycle: {plan.billingCycle}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-foreground">
                          {formatPrice(plan.price, plan.currency)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <ScrollBar orientation="vertical" />
            </ScrollArea>

            {/* Coupon Code */}
            <div className="space-y-2">
              {!showCouponInput ? (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Coupon code</span>
                  <Button
                    variant="link"
                    className="h-auto p-0 text-primary"
                    onClick={() => setShowCouponInput(true)}
                  >
                    Add
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Enter coupon code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowCouponInput(false);
                      setCouponCode("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>

            {/* Taxes & Fees */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Taxes & fees</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>16% VAT tax has been applied according to Kenyan regulations.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <span>{formatPrice(taxes, displayCurrency)}</span>
            </div>

            {/* Total */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between font-bold text-lg">
                <span>Total</span>
                <span>{formatPrice(total, displayCurrency)}</span>
              </div>
            </div>

            {/* Legal Text */}
            <p className="text-xs text-muted-foreground">
              By checking out, you agree with our{" "}
              <a href="/terms" className="text-primary underline hover:text-primary/80">
                Terms of Service
              </a>{" "}
              and confirm that you have read our{" "}
              <a href="/privacy" className="text-primary underline hover:text-primary/80">
                Privacy Policy
              </a>
              . You can cancel recurring payments at any time.
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!grid sm:max-w-[600px] h-[90vh] max-h-[90vh] !flex !flex-col overflow-hidden w-full p-0 gap-0">
        <DialogHeader className="min-w-0 w-full px-6 pt-6 pb-4 flex-shrink-0">
          <DialogTitle className="line-clamp-1 break-words truncate min-w-0 w-full max-w-full">
            Buy {domain.domain} domain
          </DialogTitle>
          <DialogDescription className="min-w-0 w-full max-w-full">
            {currentStep === "domain" && "Get the best of your domain"}
            {currentStep === "addons" && "Enhance your domain with add-ons"}
            {currentStep === "nameservers" && "Configure custom nameservers"}
            {currentStep === "hosting" && "Add hosting services to your domain"}
            {currentStep === "plan-selection" && "Select a hosting plan"}
            {currentStep === "review" && "Review your order and proceed to checkout"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 px-6 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="py-4 min-w-0 w-full pr-4">
              {renderStep()}
            </div>
            <ScrollBar orientation="vertical" />
          </ScrollArea>
        </div>

        <DialogFooter className="gap-2 px-6 pb-6 pt-4 flex-shrink-0 border-t">
          {currentStep !== "domain" && (
            <Button
              variant="ghost"
              onClick={handleBack}
              className="text-primary"
            >
              Back
            </Button>
          )}
          {currentStep === "domain" && (
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-primary"
            >
              Cancel
            </Button>
          )}
          {currentStep === "plan-selection" && selectedHostingPlans.some(p => p.type === hostingPlanType) && (
            <Button
              onClick={() => {
                setCurrentStep("hosting");
              }}
              className="bg-primary text-primary-foreground"
            >
              Continue
            </Button>
          )}
          {currentStep === "hosting" && (
            <Button
              onClick={handleNext}
              className="bg-primary text-primary-foreground"
            >
              Proceed to checkout
            </Button>
          )}
          {currentStep === "review" && (
            <Button
              onClick={handlePayment}
              className="bg-primary text-primary-foreground"
            >
              Choose payment method
            </Button>
          )}
          {currentStep !== "plan-selection" && currentStep !== "hosting" && currentStep !== "review" && (
            <Button
              onClick={handleNext}
              className="bg-primary text-primary-foreground"
            >
              {currentStep === "domain" ? "Proceed" : "Next"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
