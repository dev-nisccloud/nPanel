"use client"

import * as React from "react"
import { PricingTable, type PricingPlan } from "@/components/ui/pricing-table"
import type { PlanFeatureValue } from "@/components/ui/pricing-table"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * Calculate yearly price from monthly price with 20% discount
 */
function calculateYearlyPrice(monthlyPrice: number): number {
  return Math.round(monthlyPrice * 12 * 0.8)
}

/**
 * Derive pricing from billing cycle
 */
function derivePricing(
  niscPrice: string | null | undefined,
  billingCycle: string
): {
  monthlyPrice: number
  yearlyPrice: number
} {
  if (!niscPrice) {
    return { monthlyPrice: 0, yearlyPrice: 0 }
  }

  const price = parseFloat(niscPrice)
  if (isNaN(price)) {
    return { monthlyPrice: 0, yearlyPrice: 0 }
  }

  // If billing cycle is MONTHLY, use price as-is for monthly
  if (billingCycle === "MONTHLY") {
    return {
      monthlyPrice: Math.round(price),
      yearlyPrice: calculateYearlyPrice(price),
    }
  }

  // If billing cycle is YEARLY, calculate monthly from yearly
  if (billingCycle === "YEARLY") {
    const monthly = Math.round(price / 12)
    return {
      monthlyPrice: monthly,
      yearlyPrice: Math.round(price),
    }
  }

  // For other cycles, use as monthly and calculate yearly
  return {
    monthlyPrice: Math.round(price),
    yearlyPrice: calculateYearlyPrice(price),
  }
}

/**
 * Extract numeric value from a feature string
 * Also handles string numbers like "10" -> 10
 */
function extractNumericValue(feature: string | number | null | undefined): number | null {
  if (feature === null || feature === undefined) return null
  
  // If it's already a number, return it
  if (typeof feature === "number") {
    return isNaN(feature) ? null : feature
  }
  
  // If it's a string, try to extract number
  if (typeof feature === "string") {
    // First try to parse the entire string as a number
    const directParse = parseFloat(feature.trim())
    if (!isNaN(directParse)) {
      return directParse
    }
    
    // Otherwise, try to match numbers at the start or after common prefixes
    const match = feature.match(/^(\d+(?:\.\d+)?)\s*/i)
    if (match) {
      const num = parseFloat(match[1])
      return isNaN(num) ? null : num
    }
  }
  
  return null
}

/**
 * Normalize feature name by removing numbers and common suffixes
 */
function normalizeFeatureName(feature: string): string {
  // Remove leading numbers, units, and common prefixes
  let normalized = feature
    .replace(/^(unlimited|up to|max|maximum)\s+/i, "") // Remove prefixes
    .replace(/^\d+(?:\.\d+)?\s*(GB|MB|TB|KB|emails?|mailboxes?|domains?|sites?|databases?|subdomains?|users?|accounts?)\s*/i, "") // Remove numbers and units
    .trim()
  
  // If nothing left, use original (for cases like "10 GB" where the unit is the feature)
  if (!normalized) {
    // Extract just the descriptive part
    normalized = feature.replace(/^\d+(?:\.\d+)?\s*/i, "").trim()
  }
  
  return normalized || feature.trim()
}

/**
 * Parse features array into a map of normalized feature names to values
 * Handles features that may be strings, numbers, or string representations of numbers
 */
function parseFeatures(features: (string | number)[]): Record<string, PlanFeatureValue> {
  const featureMap: Record<string, PlanFeatureValue> = {}

  features.forEach((feature) => {
    // Convert to string for processing
    const featureStr = typeof feature === "string" ? feature : String(feature)
    const normalizedName = normalizeFeatureName(featureStr)
    const numericValue = extractNumericValue(feature)

    // If feature already exists, keep the one with numeric value if available
    if (!featureMap[normalizedName] || numericValue !== null) {
      featureMap[normalizedName] = {
        value: numericValue !== null ? numericValue : true, // boolean true if not numeric
        raw: featureStr,
      }
    }
  })

  return featureMap
}

interface HostingPlan {
  id: string
  name: string
  niscPrice: string | null
  billingCycle: string
  features: string[]
  isPopular?: boolean
}

interface PricingTableWrapperProps {
  plans: HostingPlan[]
  isLoading?: boolean
  onPlanSelect?: (plan: HostingPlan) => void
  currency?: string
  locale?: string
  onBuyNow?: (plan: HostingPlan) => void
}

export function PricingTableWrapper({
  plans,
  isLoading = false,
  onPlanSelect,
  currency = "KES",
  locale = "en-KE",
  onBuyNow,
}: PricingTableWrapperProps) {
  if (isLoading) {
    return (
      <div className="h-[800px] overflow-y-auto rounded-lg flex items-center justify-center">
        <div className="text-muted-foreground">Loading pricing plans...</div>
      </div>
    )
  }

  if (plans.length === 0) {
    return (
      <div className="h-[800px] overflow-y-auto rounded-lg flex items-center justify-center">
        <div className="text-muted-foreground">No plans available</div>
      </div>
    )
  }

  // Transform plans to PricingPlan format
  const pricingPlans: PricingPlan[] = plans
    .map((plan, index) => {
      const { monthlyPrice, yearlyPrice } = derivePricing(
        plan.niscPrice,
        plan.billingCycle
      )

      return {
        id: plan.id,
        name: plan.name.toUpperCase(),
        level: plan.id, // Use plan ID as level
        price: {
          monthly: monthlyPrice,
          yearly: yearlyPrice,
        },
        popular: plan.isPopular || false,
        features: parseFeatures(plan.features || []),
      }
    })
    // Sort by monthly price from lowest to highest
    .sort((a, b) => a.price.monthly - b.price.monthly)

  // Find the popular plan or first plan as default
  const defaultPlan = pricingPlans.find((p) => p.popular)?.level || pricingPlans[0]?.level

  const handlePlanSelect = (selectedPlan: PricingPlan) => {
    const originalPlan = plans.find((p) => p.id === selectedPlan.level)
    if (originalPlan) {
      if (onPlanSelect) {
        onPlanSelect(originalPlan)
      }
    }
  }

  const handleBuyNowClick = (selectedPlan: PricingPlan & { selectedBillingCycle: "MONTHLY" | "YEARLY"; selectedPrice: number }) => {
    const originalPlan = plans.find((p) => p.id === selectedPlan.level)
    if (originalPlan && onBuyNow) {
      // Pass the plan with the selected billing cycle and price as additional properties
      onBuyNow({
        ...originalPlan,
        // Add selected billing cycle and price as additional properties
        selectedBillingCycle: selectedPlan.selectedBillingCycle,
        selectedPrice: selectedPlan.selectedPrice,
      } as any)
    }
  }

  return (
    <PricingTable
      plans={pricingPlans}
      onPlanSelect={onBuyNow ? handleBuyNowClick : handlePlanSelect}
      defaultPlan={defaultPlan}
      defaultInterval="monthly"
      currency={currency}
      locale={locale}
    />
  )
}
