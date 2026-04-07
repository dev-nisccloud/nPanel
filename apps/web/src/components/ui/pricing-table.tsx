"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { CONTACT_TEL_HREF } from "@/lib/contact"
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
  recommended?: boolean
  // Map of feature name to value (legacy, when productFeatures not used)
  features: Record<string, PlanFeatureValue>
  // Per-row values from product (when productFeatures is used): exact values, no number conversion
  featureValues?: Array<{ available: boolean; valueOverride: string | null }>
}

export interface ProductFeatureRow {
  key: string
  label: string
}

export interface PricingTableProps
  extends React.HTMLAttributes<HTMLDivElement> {
  plans: PricingPlan[]
  /** When set, feature rows come from product; cells use plan.featureValues (exact value or tick) */
  productFeatures?: ProductFeatureRow[]
  onPlanSelect?: (plan: PricingPlan & { selectedBillingCycle: "MONTHLY" | "YEARLY"; selectedPrice: number }) => void
  onPlanCardClick?: (plan: PricingPlan) => void
  defaultPlan?: PlanLevel
  defaultInterval?: "monthly" | "yearly"
  containerClassName?: string
  buttonClassName?: string
  currency?: string
  locale?: string
  /** When set, "Contact us" (price 0) uses this tel: link instead of onPlanSelect. Defaults to company number. */
  contactTelHref?: string
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
  productFeatures,
  onPlanSelect,
  onPlanCardClick,
  defaultPlan,
  defaultInterval = "monthly",
  className,
  containerClassName,
  buttonClassName,
  currency = "KES",
  locale = "en-KE",
  contactTelHref = CONTACT_TEL_HREF,
  ...props
}: PricingTableProps) {
  const [isYearly, setIsYearly] = React.useState(defaultInterval === "yearly")
  const [selectedPlan, setSelectedPlan] = React.useState<PlanLevel>(
    defaultPlan || plans[0]?.level || ""
  )

  const handlePlanCardClick = (plan: PricingPlan) => {
    setSelectedPlan(plan.level)
  }

  const useProductFeatures = productFeatures != null && productFeatures.length > 0
  const allFeatures = useProductFeatures
    ? productFeatures.map((f) => ({ name: f.label, isNumeric: false, unit: undefined as string | undefined }))
    : extractAllFeatures(plans)
  const selectedPlanData = plans.find((p) => p.level === selectedPlan)

  return (
    <section
      className={cn(
        "text-foreground",
        "py-12 sm:py-16 md:py-20 px-4",
        className
      )}
      {...props}
    >
      <div
        className={cn("w-full max-w-6xl mx-auto px-4", containerClassName)}
      >
        {/* Billing toggle + CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-1 p-1 rounded-full bg-muted/80 border border-border/80 shadow-sm">
            <button
              type="button"
              onClick={() => setIsYearly(false)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
                !isYearly
                  ? "bg-background text-foreground shadow-sm border border-border/60"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setIsYearly(true)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-1.5",
                isYearly
                  ? "bg-background text-foreground shadow-sm border border-border/60"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Yearly
              <span className="text-[10px] font-semibold uppercase tracking-wide text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                Save 20%
              </span>
            </button>
          </div>

          {selectedPlanData && (onPlanSelect || contactTelHref) && (
            (() => {
              const displayPrice = isYearly ? selectedPlanData.price.yearly : selectedPlanData.price.monthly;
              const isContactUs = displayPrice === 0;
              return isContactUs ? (
                <Button
                  size="lg"
                  className={cn(
                    "w-full sm:w-auto gap-2 rounded-xl font-semibold tracking-tight",
                    "shadow-md hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0",
                    "transition-all duration-200 border-0",
                    buttonClassName
                  )}
                  asChild
                >
                  <a href={contactTelHref}>
                    Contact us
                    <ArrowRight className="w-4 h-4 opacity-90" />
                  </a>
                </Button>
              ) : (
                <Button
                  size="lg"
                  className={cn(
                    "w-full sm:w-auto gap-2 rounded-xl font-semibold tracking-tight",
                    "shadow-md hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0",
                    "transition-all duration-200 border-0",
                    buttonClassName
                  )}
                  onClick={() => {
                    if (!onPlanSelect) return;
                    const selectedBillingCycle = isYearly ? "YEARLY" : "MONTHLY";
                    const selectedPrice = displayPrice;
                    onPlanSelect({
                      ...selectedPlanData,
                      selectedBillingCycle,
                      selectedPrice,
                    });
                  }}
                >
                  Get started with {selectedPlanData.name}
                  <ArrowRight className="w-4 h-4 opacity-90" />
                </Button>
              );
            })()
          )}
        </div>

        {/* Plan selector cards */}
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 mb-10">
          {plans.map((plan) => {
            const isSelected = selectedPlan === plan.level;
            return (
              <button
                key={plan.id}
                type="button"
                onClick={() => handlePlanCardClick(plan)}
                className={cn(
                  "relative flex-1 p-5 sm:p-6 rounded-2xl text-left transition-all duration-200",
                  "border-2 bg-card/60 hover:bg-card/90",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                  isSelected
                    ? "border-primary bg-primary/5 shadow-lg shadow-primary/10 ring-2 ring-primary/25"
                    : "border-border/80 hover:border-primary/40 hover:shadow-md"
                )}
              >
                {/* Selected indicator */}
                <div
                  className={cn(
                    "absolute top-4 right-4 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide transition-opacity",
                    isSelected
                      ? "bg-primary text-primary-foreground opacity-100"
                      : "opacity-0"
                  )}
                >
                  <Check className="w-3 h-3 stroke-[2.5]" />
                  Selected
                </div>

                {/* Radio-style dot */}
                <div
                  className={cn(
                    "mb-4 flex size-8 items-center justify-center rounded-full border-2 transition-colors",
                    isSelected
                      ? "border-primary bg-primary"
                      : "border-muted-foreground/30 bg-muted/50"
                  )}
                >
                  {isSelected ? (
                    <div className="size-2 rounded-full bg-primary-foreground" />
                  ) : null}
                </div>

                <div className="flex items-center justify-between gap-2 mb-3 pr-20">
                  <span className="text-sm font-semibold tracking-tight text-foreground uppercase">
                    {plan.name}
                  </span>
                  {(plan.popular || plan.recommended) && !isSelected && (
                    <span className="flex flex-wrap gap-1 justify-end shrink-0">
                      {plan.popular && (
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-primary bg-primary/10 px-2 py-1 rounded-full">
                          Popular
                        </span>
                      )}
                      {plan.recommended && (
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/20 px-2 py-1 rounded-full border border-emerald-500/20">
                          Recommended
                        </span>
                      )}
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-1.5">
                  {(isYearly ? plan.price.yearly : plan.price.monthly) === 0 ? (
                    <span className="text-2xl sm:text-3xl font-bold tracking-tight">
                      Contact us
                    </span>
                  ) : (
                    <>
                      <NumberFlow
                        format={{
                          style: "currency",
                          currency: currency,
                          trailingZeroDisplay: "stripIfInteger",
                        }}
                        value={isYearly ? plan.price.yearly : plan.price.monthly}
                        className="text-2xl sm:text-3xl font-bold tracking-tight"
                      />
                      <span className="text-sm text-muted-foreground">
                        /{isYearly ? "year" : "month"}
                      </span>
                    </>
                  )}
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  {isSelected
                    ? (isYearly ? plan.price.yearly : plan.price.monthly) === 0
                      ? "Click Contact us above to continue"
                      : "Click Get started above to continue"
                    : "Click to select this plan"}
                </p>
              </button>
            );
          })}
        </div>

        {/* Features table */}
        <div className="rounded-2xl border border-border overflow-hidden shadow-sm bg-card/30">
          <div className="overflow-x-auto">
            <div className="min-w-[640px]">
              <div className="flex items-center px-4 sm:px-5 py-3.5 bg-muted/60 border-b border-border/80">
                <div className="w-48 sm:w-64 flex-shrink-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Features
                </div>
                <div className="flex items-center gap-4 sm:gap-6 text-sm flex-1">
                  {plans.map((plan) => (
                    <div
                      key={plan.level}
                      className={cn(
                        "flex-1 min-w-[100px] text-center font-semibold text-foreground",
                        plan.level === selectedPlan && "text-primary"
                      )}
                    >
                      {plan.name}
                    </div>
                  ))}
                </div>
              </div>
              {allFeatures.map((feature, idx) => {
                const cellFromProduct = useProductFeatures && productFeatures != null
                const selectedHighlight = cellFromProduct
                  ? selectedPlanData?.featureValues?.[idx]?.available
                  : selectedPlanData &&
                      selectedPlanData.features[feature.name]?.value !== null &&
                      selectedPlanData.features[feature.name]?.value !== false

                return (
                  <div
                    key={feature.name}
                    className={cn(
                      "flex items-center px-4 sm:px-5 py-3.5 transition-colors border-b border-border/50 last:border-b-0",
                      idx % 2 === 0 ? "bg-background/50" : "bg-muted/20",
                      selectedHighlight && "bg-primary/[0.06]"
                    )}
                  >
                    <div className="w-48 sm:w-64 flex-shrink-0 text-sm text-foreground/90">
                      {feature.name}
                    </div>
                    <div className="flex items-center gap-4 sm:gap-6 text-sm flex-1">
                      {plans.map((plan) => {
                        if (cellFromProduct && plan.featureValues) {
                          const cell = plan.featureValues[idx]
                          const available = cell?.available ?? false
                          const valueOverride = cell?.valueOverride ?? null
                          return (
                            <div
                              key={plan.level}
                              className={cn(
                                "flex-1 min-w-[100px] flex justify-center",
                                plan.level === selectedPlan && "font-medium text-foreground"
                              )}
                            >
                              {!available ? (
                                <span className="text-muted-foreground/70">- </span>
                              ) : valueOverride != null && valueOverride !== "" ? (
                                <span className="text-foreground">{valueOverride}</span>
                              ) : (
                                <span className="inline-flex size-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                </span>
                              )}
                            </div>
                          )
                        }

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
                              plan.level === selectedPlan && "font-medium text-foreground"
                            )}
                          >
                            {hasFeature && featureValue ? (
                              feature.isNumeric ? (
                                <span className="text-foreground">
                                  {(() => {
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
                                <span className="inline-flex size-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                </span>
                              )
                            ) : (
                              <span className="text-muted-foreground/70">- </span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
