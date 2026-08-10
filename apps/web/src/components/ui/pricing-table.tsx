"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { CONTACT_TEL_HREF } from "@/lib/contact"
import { Check, HelpCircle } from "lucide-react"
import NumberFlow from "@number-flow/react"
import { ArrowRight } from "lucide-react"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"

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
  description?: string
}

export interface PricingTableProps
  extends React.HTMLAttributes<HTMLDivElement> {
  plans: PricingPlan[]
  /** When set, feature rows come from product; cells use plan.featureValues (exact value or tick) */
  productFeatures?: ProductFeatureRow[]
  onPlanSelect?: (plan: PricingPlan & { selectedBillingCycle: "MONTHLY" | "YEARLY"; selectedPrice: number }) => void
  onPlanCardClick?: (plan: PricingPlan) => void
  defaultPlan?: PlanLevel
  /** Controlled selection (e.g. checkout upsell step) */
  selectedPlanLevel?: PlanLevel
  onSelectedPlanLevelChange?: (level: PlanLevel) => void
  /** Hide Popular / Recommended badges on plan cards */
  hideBadges?: boolean
  /** Compact layout for dialogs and embedded panels */
  embedded?: boolean
  /** Hide the primary CTA button (selection handled externally) */
  hideActionButton?: boolean
  containerClassName?: string
  buttonClassName?: string
  currency?: string
  locale?: string
  /** When set, "Contact us" (price 0) uses this tel: link instead of onPlanSelect. Defaults to company number. */
  contactTelHref?: string
  /** Commission-based plans: show % of ad spend instead of currency. */
  pricingMode?: "fixed" | "commission"
  commissionSuffix?: string
  actionButtonLabel?: string
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
  selectedPlanLevel: selectedPlanLevelProp,
  onSelectedPlanLevelChange,
  hideBadges = false,
  embedded = false,
  hideActionButton = false,
  className,
  containerClassName,
  buttonClassName,
  currency = "KES",
  locale = "en-KE",
  contactTelHref = CONTACT_TEL_HREF,
  pricingMode = "fixed",
  commissionSuffix = "of ad spend / month",
  actionButtonLabel,
  ...props
}: PricingTableProps) {
  const isCommission = pricingMode === "commission"
  const isPlanControlled = selectedPlanLevelProp !== undefined

  const [internalSelectedPlan, setInternalSelectedPlan] = React.useState<PlanLevel>(
    defaultPlan || plans[0]?.level || ""
  )

  const selectedPlan = isPlanControlled ? selectedPlanLevelProp! : internalSelectedPlan

  const setSelectedPlan = (level: PlanLevel) => {
    if (!isPlanControlled) setInternalSelectedPlan(level)
    onSelectedPlanLevelChange?.(level)
  }

  const handlePlanCardClick = (plan: PricingPlan) => {
    setSelectedPlan(plan.level)
    onPlanCardClick?.(plan)
  }

  const useProductFeatures = productFeatures != null && productFeatures.length > 0
  const allFeatures = useProductFeatures
    ? productFeatures.map((f) => ({ name: f.label, isNumeric: false, unit: undefined as string | undefined }))
    : extractAllFeatures(plans)
  const selectedPlanData = plans.find((p) => p.level === selectedPlan)

  /** Feature table column sizing (plan cards use full width separately). */
  const featuresColClass = embedded
    ? "sticky left-0 z-20 w-32 sm:w-40 shrink-0"
    : "w-48 sm:w-64 flex-shrink-0"
  const planColsGapClass = embedded ? "gap-2 sm:gap-3" : "gap-4 sm:gap-6"
  const planCardsGridClass = embedded
    ? plans.length <= 1
      ? "grid-cols-1"
      : "grid-cols-2"
    : plans.length <= 1
      ? "grid-cols-1"
      : plans.length === 2
        ? "grid-cols-1 sm:grid-cols-2"
        : plans.length === 3
          ? "grid-cols-1 sm:grid-cols-3"
          : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"

  const renderCta = () => {
    if (hideActionButton || !selectedPlanData || !(onPlanSelect || contactTelHref)) {
      return null
    }
    const displayPrice = selectedPlanData.price.monthly
    const isContactUs = !isCommission && displayPrice === 0
    const ctaLabel =
      actionButtonLabel ??
      (isCommission ? "Get Started" : `Get started with ${selectedPlanData.name}`)

    if (isContactUs) {
      return (
        <Button
          size={embedded ? "default" : "lg"}
          className={cn(
            "w-full gap-2 rounded-xl font-semibold tracking-tight",
            "shadow-md hover:shadow-lg transition-all duration-200 border-0",
            !embedded && "sm:w-auto",
            buttonClassName
          )}
          asChild
        >
          <a href={contactTelHref}>
            Contact us
            <ArrowRight className="w-4 h-4 opacity-90" />
          </a>
        </Button>
      )
    }

    return (
      <Button
        size={embedded ? "default" : "lg"}
        className={cn(
          "w-full gap-2 rounded-xl font-semibold tracking-tight",
          "shadow-md hover:shadow-lg transition-all duration-200 border-0",
          !embedded && "sm:w-auto sm:ml-auto",
          buttonClassName
        )}
        onClick={() => {
          if (!onPlanSelect) return
          onPlanSelect({
            ...selectedPlanData,
            selectedBillingCycle: "MONTHLY",
            selectedPrice: displayPrice,
          })
        }}
      >
        {ctaLabel}
        <ArrowRight className="w-4 h-4 opacity-90" />
      </Button>
    )
  }

  const renderPlanCard = (plan: PricingPlan) => {
    const isSelected = selectedPlan === plan.level
    return (
      <button
        key={plan.id}
        type="button"
        onClick={() => handlePlanCardClick(plan)}
        className={cn(
          "relative w-full min-w-0 rounded-xl text-left transition-all duration-200",
          embedded ? "p-3" : "rounded-2xl p-5 sm:p-6",
          "border bg-card/60 hover:bg-card/90",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
          isSelected
            ? "border-primary bg-primary/5 shadow-md shadow-primary/10 ring-1 ring-primary/30"
            : "border-border/80 hover:border-primary/40 hover:shadow-sm"
        )}
      >
        {isSelected ? (
          <div
            className={cn(
              "absolute flex items-center justify-center rounded-full bg-primary text-primary-foreground",
              embedded ? "right-2 top-2 size-5" : "right-4 top-4 size-6"
            )}
            aria-hidden
          >
            <Check className={cn(embedded ? "size-3" : "size-3.5", "stroke-[2.5]")} />
          </div>
        ) : null}

        <div className={cn("mb-2 flex items-start justify-between gap-2", isSelected && "pr-6")}>
          <span
            className={cn(
              "font-semibold tracking-tight text-foreground uppercase",
              embedded ? "text-xs" : "text-sm"
            )}
          >
            {plan.name}
          </span>
          {!hideBadges && (plan.popular || plan.recommended) && !isSelected ? (
            <span className="flex flex-col gap-1 items-end shrink-0">
              {plan.popular ? (
                <span className="text-[9px] font-semibold uppercase tracking-wide text-primary bg-primary/10 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                  Popular
                </span>
              ) : null}
              {plan.recommended ? (
                <span className="text-[9px] font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/20 whitespace-nowrap">
                  Recommended
                </span>
              ) : null}
            </span>
          ) : null}
        </div>

        <div className="flex items-baseline gap-1 flex-wrap">
          {isCommission ? (
            <>
              <span className={cn("font-bold tracking-tight", embedded ? "text-lg" : "text-2xl sm:text-3xl")}>
                {plan.price.monthly}%
              </span>
              <span className="text-xs text-muted-foreground">{commissionSuffix}</span>
            </>
          ) : plan.price.monthly === 0 ? (
            <span className={cn("font-bold tracking-tight", embedded ? "text-lg" : "text-2xl sm:text-3xl")}>
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
                value={plan.price.monthly}
                className={cn("font-bold tracking-tight", embedded ? "text-lg" : "text-2xl sm:text-3xl")}
              />
              <span className="text-xs text-muted-foreground">/mo</span>
            </>
          )}
        </div>
        {!embedded && (
          <p className="mt-3 text-xs text-muted-foreground">
            {isSelected
              ? plan.price.monthly === 0
                ? "Click Contact us above to continue"
                : "Click Get started above to continue"
              : "Click to select this plan"}
          </p>
        )}
      </button>
    )
  }

  return (
    <section
      className={cn(
        "text-foreground",
        embedded ? "py-0 px-0" : "py-12 sm:py-16 md:py-20 px-4",
        className
      )}
      {...props}
    >
      <div
        className={cn(
          "w-full mx-auto",
          embedded ? "max-w-none px-0" : "max-w-6xl px-4",
          containerClassName
        )}
      >
        {/* CTA — full pages keep it on top; embedded puts it under plan cards to avoid congestion */}
        {!embedded ? (
          <div
            className={cn(
              "mb-8 sm:mb-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-4 sm:justify-between"
            )}
          >
            {isCommission ? (
              <p className="text-sm text-muted-foreground max-w-xl">
                Commission on total ad spend, invoiced at the end of each billing cycle. Ad spend is paid
                directly to the platform.
              </p>
            ) : null}
            {renderCta()}
          </div>
        ) : null}

        {/* Plan selector cards */}
        <div
          className={cn(
            "grid w-full gap-2.5 sm:gap-3",
            planCardsGridClass,
            embedded ? "mb-3" : "mb-10 gap-4 sm:gap-6",
          )}
        >
          {plans.map(renderPlanCard)}
        </div>

        {embedded ? <div className="mb-3">{renderCta()}</div> : null}

        {/* Features table — sticky first column so labels stay visible while scrolling */}
        <div className="rounded-xl border border-border overflow-hidden shadow-sm bg-card/30">
          <div className="overflow-x-auto overscroll-x-contain">
            <div className={cn(embedded ? "min-w-[520px]" : "min-w-[640px]")}>
              <div className="flex items-center px-3 sm:px-5 py-3 bg-muted/60 border-b border-border/80">
                <div
                  className={cn(
                    featuresColClass,
                    "bg-muted text-xs font-semibold uppercase tracking-wider text-muted-foreground",
                    embedded && "pl-0 pr-2 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.12)]"
                  )}
                >
                  Features
                </div>
                <div className={cn("flex items-center text-sm flex-1", planColsGapClass)}>
                  {plans.map((plan) => (
                    <div
                      key={plan.level}
                      className={cn(
                        "flex-1 min-w-[72px] text-center font-semibold text-foreground",
                        embedded && "min-w-[64px] text-xs",
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

                const rowBg = selectedHighlight
                  ? "bg-primary/[0.06]"
                  : idx % 2 === 0
                    ? "bg-background"
                    : "bg-muted/30"

                return (
                  <div
                    key={feature.name}
                    className={cn(
                      "flex items-center px-3 sm:px-5 py-2.5 transition-colors border-b border-border/50 last:border-b-0",
                      rowBg
                    )}
                  >
                    <div
                      className={cn(
                        featuresColClass,
                        rowBg,
                        "text-sm text-foreground/90 flex items-center gap-1.5",
                        embedded && "text-xs pr-2 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.10)]"
                      )}
                    >
                      <span className="truncate">{feature.name}</span>
                      {cellFromProduct && productFeatures && productFeatures[idx]?.description ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              className="inline-flex shrink-0 items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <HelpCircle className="w-3.5 h-3.5" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-xs">
                            {productFeatures[idx].description}
                          </TooltipContent>
                        </Tooltip>
                      ) : null}
                    </div>
                    <div className={cn("flex items-center text-sm flex-1", planColsGapClass)}>
                      {plans.map((plan) => {
                        if (cellFromProduct && plan.featureValues) {
                          const cell = plan.featureValues[idx]
                          const available = cell?.available ?? false
                          const valueOverride = cell?.valueOverride ?? null
                          return (
                            <div
                              key={plan.level}
                              className={cn(
                                "flex-1 min-w-[72px] flex justify-center",
                                embedded && "min-w-[64px] text-xs",
                                plan.level === selectedPlan && "font-medium text-foreground"
                              )}
                            >
                              {!available ? (
                                <span className="text-muted-foreground/70">-</span>
                              ) : valueOverride != null && valueOverride !== "" ? (
                                <span className="text-foreground">{valueOverride}</span>
                              ) : (
                                <span className="inline-flex size-5 items-center justify-center rounded-full bg-primary/10 text-primary">
                                  <Check className="w-3 h-3 stroke-[2.5]" />
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
                              "flex-1 min-w-[72px] flex justify-center",
                              embedded && "min-w-[64px] text-xs",
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
                                <span className="inline-flex size-5 items-center justify-center rounded-full bg-primary/10 text-primary">
                                  <Check className="w-3 h-3 stroke-[2.5]" />
                                </span>
                              )
                            ) : (
                              <span className="text-muted-foreground/70">-</span>
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
