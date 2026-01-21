"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Check } from "lucide-react"
import NumberFlow from "@number-flow/react"
import { ArrowRight } from "lucide-react"

export type PlanLevel = string

export interface PlanFeatureValue {
  // For boolean features: true = included, false/null = not included
  // For numeric features: number or string number = value, null = not included
  value: boolean | number | string | null
  // The raw feature string from the plan
  raw: string
}

export interface PricingPlan {
  id: string
  name: string
  level: PlanLevel
  price: {
    monthly: number
    yearly: number
  }
  popular?: boolean
  // Map of feature name to value
  features: Record<string, PlanFeatureValue>
}

export interface PricingTableProps
  extends React.HTMLAttributes<HTMLDivElement> {
  plans: PricingPlan[]
  onPlanSelect?: (plan: PricingPlan & { selectedBillingCycle: "MONTHLY" | "YEARLY"; selectedPrice: number }) => void
  onPlanCardClick?: (plan: PricingPlan) => void
  defaultPlan?: PlanLevel
  defaultInterval?: "monthly" | "yearly"
  containerClassName?: string
  buttonClassName?: string
  currency?: string
  locale?: string
}

/**
 * Extract numeric value from a feature string
 * Examples: "10 GB Storage" -> 10, "Unlimited Email" -> null
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
 * Examples: "10 GB Storage" -> "Storage", "Unlimited Email" -> "Email"
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
 * Extract all unique features from all plans and determine their types
 */
function extractAllFeatures(plans: PricingPlan[]): Array<{
  name: string
  isNumeric: boolean
  unit?: string
}> {
  const featureMap = new Map<string, { isNumeric: boolean; unit?: string }>()

  plans.forEach((plan) => {
    Object.entries(plan.features).forEach(([featureName, featureValue]) => {
      // If feature already exists, prefer numeric version if available
      const existing = featureMap.get(featureName)
      const numericValue = extractNumericValue(featureValue.raw)
      const isNumeric = numericValue !== null

      // Extract unit if numeric
      let unit: string | undefined
      if (isNumeric) {
        const unitMatch = featureValue.raw.match(/\d+(?:\.\d+)?\s*([A-Za-z]+)/i)
        unit = unitMatch?.[1]
      }

      // Only update if this is numeric and existing is not, or if feature doesn't exist
      if (!existing || (isNumeric && !existing.isNumeric)) {
        featureMap.set(featureName, { isNumeric, unit })
      }
    })
  })

  return Array.from(featureMap.entries()).map(([name, { isNumeric, unit }]) => ({
    name,
    isNumeric,
    unit,
  }))
}

export function PricingTable({
  plans,
  onPlanSelect,
  onPlanCardClick,
  defaultPlan,
  defaultInterval = "monthly",
  className,
  containerClassName,
  buttonClassName,
  currency = "KES",
  locale = "en-KE",
  ...props
}: PricingTableProps) {
  const [isYearly, setIsYearly] = React.useState(defaultInterval === "yearly")
  const [selectedPlan, setSelectedPlan] = React.useState<PlanLevel>(
    defaultPlan || plans[0]?.level || ""
  )

  const handlePlanCardClick = (plan: PricingPlan) => {
    // Only change the selected plan visually, don't trigger buy now
    setSelectedPlan(plan.level)
  }

  // Extract all unique features
  const allFeatures = extractAllFeatures(plans)
  const selectedPlanData = plans.find((p) => p.level === selectedPlan)

  return (
    <section
      className={cn(
        "bg-background text-foreground",
        "py-12 sm:py-24 md:py-32 px-4",
        className
      )}
      {...props}
    >
      <div
        className={cn("w-full max-w-6xl mx-auto px-4", containerClassName)}
      >
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-2 p-1 bg-muted rounded-lg border border-border">
            <button
              type="button"
              onClick={() => setIsYearly(false)}
              className={cn(
                "px-4 py-2 rounded-md text-sm font-medium transition-all",
                !isYearly
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setIsYearly(true)}
              className={cn(
                "px-4 py-2 rounded-md text-sm font-medium transition-all",
                isYearly
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Yearly
            </button>
          </div>
          
        {selectedPlanData && onPlanSelect && (
          <Button
            className={cn(
              "w-full sm:w-auto px-8 py-2 rounded-xl",
              buttonClassName
            )}
            onClick={() => {
              const selectedBillingCycle = isYearly ? "YEARLY" : "MONTHLY";
              const selectedPrice = isYearly ? selectedPlanData.price.yearly : selectedPlanData.price.monthly;
              onPlanSelect({
                ...selectedPlanData,
                selectedBillingCycle,
                selectedPrice,
              });
            }}
          >
            Get started with {selectedPlanData.name}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          {plans.map((plan) => (
            <button
              key={plan.id}
              type="button"
              onClick={() => handlePlanCardClick(plan)}
              className={cn(
                "flex-1 p-4 rounded-xl text-left transition-all",
                "border border-border",
                selectedPlan === plan.level &&
                  "ring-2 ring-primary"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{plan.name}</span>
                {plan.popular && (
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                    Popular
                  </span>
                )}
              </div>
              <div className="flex items-baseline gap-1">
                <NumberFlow
                  format={{
                    style: "currency",
                    currency: currency,
                    trailingZeroDisplay: "stripIfInteger",
                  }}
                  value={isYearly ? plan.price.yearly : plan.price.monthly}
                  className="text-2xl font-bold"
                />
                <span className="text-sm font-normal text-zinc-500">
                  /{isYearly ? "year" : "month"}
                </span>
              </div>
            </button>
          ))}
        </div>

        <div className="border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[640px] divide-y divide-border">
              <div className="flex items-center p-4 bg-muted">
                <div className="w-48 sm:w-64 flex-shrink-0 text-sm font-medium">Features</div>
                <div className="flex items-center gap-4 sm:gap-6 text-sm flex-1">
                  {plans.map((plan) => (
                    <div
                      key={plan.level}
                      className="flex-1 min-w-[100px] text-center font-medium"
                    >
                      {plan.name}
                    </div>
                  ))}
                </div>
              </div>
              {allFeatures.map((feature) => (
                <div
                  key={feature.name}
                  className={cn(
                    "flex items-center p-4 transition-colors",
                    selectedPlanData &&
                      selectedPlanData.features[feature.name]?.value !== null &&
                      selectedPlanData.features[feature.name]?.value !== false &&
                      "bg-primary/5"
                  )}
                >
                  <div className="w-48 sm:w-64 flex-shrink-0 text-sm">{feature.name}</div>
                  <div className="flex items-center gap-4 sm:gap-6 text-sm flex-1">
                    {plans.map((plan) => {
                      const featureValue = plan.features[feature.name]
                      const hasFeature =
                        featureValue &&
                        featureValue.value !== null &&
                        featureValue.value !== false

                      return (
                        <div
                          key={plan.level}
                          className={cn(
                            "flex-1 min-w-[100px] flex justify-center",
                            plan.level === selectedPlan && "font-medium"
                          )}
                        >
                          {hasFeature && featureValue ? (
                            feature.isNumeric ? (
                              // Show numeric value with unit
                              <span className="text-foreground">
                                {(() => {
                                  // Handle both number and string numbers
                                  const numValue = typeof featureValue.value === "number" 
                                    ? featureValue.value 
                                    : (typeof featureValue.value === "string" 
                                        ? parseFloat(featureValue.value) 
                                        : null)
                                  
                                  if (numValue !== null && !isNaN(numValue)) {
                                    return `${numValue}${feature.unit ? ` ${feature.unit}` : ""}`
                                  }
                                  return "-"
                                })()}
                              </span>
                            ) : (
                              // Show checkmark for boolean features
                              <Check className="w-5 h-5 text-primary" />
                            )
                          ) : (
                            <span className="text-muted-foreground">
                              -
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}
