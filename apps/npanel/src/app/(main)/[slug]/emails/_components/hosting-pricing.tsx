"use client";

import { Pricing } from "@/components/pricing";
import { trpc } from "@/utils/trpc";

interface PricingPlan {
  name: string;
  price: string;
  yearlyPrice: string;
  period: string;
  features: string[];
  description: string;
  buttonText: string;
  href: string;
  isPopular: boolean;
}

/**
 * Calculate yearly price from monthly price with 20% discount
 */
function calculateYearlyPrice(monthlyPrice: number): string {
  return Math.round(monthlyPrice * 12 * 0.8).toString();
}

/**
 * Derive pricing from billing cycle
 */
function derivePricing(niscPrice: string | null | undefined, billingCycle: string): {
  monthlyPrice: string;
  yearlyPrice: string;
} {
  if (!niscPrice) {
    return { monthlyPrice: "0", yearlyPrice: "0" };
  }

  const price = parseFloat(niscPrice);
  if (isNaN(price)) {
    return { monthlyPrice: "0", yearlyPrice: "0" };
  }

  // If billing cycle is MONTHLY, use price as-is for monthly
  if (billingCycle === "MONTHLY") {
    return {
      monthlyPrice: Math.round(price).toString(),
      yearlyPrice: calculateYearlyPrice(price),
    };
  }

  // If billing cycle is YEARLY, calculate monthly from yearly
  if (billingCycle === "YEARLY") {
    const monthly = Math.round(price / 12);
    return {
      monthlyPrice: monthly.toString(),
      yearlyPrice: Math.round(price).toString(),
    };
  }

  // For other cycles, use as monthly and calculate yearly
  return {
    monthlyPrice: Math.round(price).toString(),
    yearlyPrice: calculateYearlyPrice(price),
  };
}

export function HostingPricing() {
  // Filter by EMAIL_HOSTING subtype for email hosting plans
  const { data: plans, isLoading } = trpc.hostingPlans.getAll.useQuery({
    planType: "HOSTING",
    hostingSubType: "EMAIL_HOSTING",
    isActive: true,
  });

  if (isLoading) {
    return (
      <div className="h-[800px] overflow-y-auto rounded-lg flex items-center justify-center">
        <div className="text-muted-foreground">Loading pricing plans...</div>
      </div>
    );
  }

  const emailHostingPlans = plans || [];

  if (emailHostingPlans.length === 0) {
    return (
      <div className="h-[800px] overflow-y-auto rounded-lg flex items-center justify-center">
        <div className="text-muted-foreground">No email hosting plans available</div>
      </div>
    );
  }

  // Transform plans to pricing format
  const pricingPlans: PricingPlan[] = emailHostingPlans
    .map((plan) => {
      const { monthlyPrice, yearlyPrice } = derivePricing(
        plan.niscPrice,
        plan.billingCycle
      );

      const planNameLower = plan.name.toLowerCase();
      // Determine button text: "Contact Us" if plan name contains "unlimited" or "ultimate", otherwise "Get Started"
      const buttonText =
        planNameLower.includes("unlimited") || planNameLower.includes("ultimate")
          ? "Contact Us"
          : "Get Started";

      return {
        name: plan.name.toUpperCase(),
        price: monthlyPrice,
        yearlyPrice: yearlyPrice,
        period: "per month",
        features: plan.features || [],
        description: plan.description || "",
        buttonText,
        href: "", // Empty for now as per requirements
        isPopular: plan.isPopular || false,
      };
    })
    // Sort by monthly price from lowest to highest
    .sort((a, b) => {
      const priceA = parseFloat(a.price) || 0;
      const priceB = parseFloat(b.price) || 0;
      return priceA - priceB;
    });

  return (
    <div className="h-[800px] overflow-y-auto rounded-lg">
      <Pricing
        plans={pricingPlans}
        title="Simple, Transparent Pricing"
        description="Choose the plan that works for you."
        currency="KES"
      />
    </div>
  );
}
