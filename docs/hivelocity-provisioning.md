# Hivelocity Auto-Provisioning & Purchase Logic
## Complete Technical Reference

> **Scope:** Dedicated Servers Hosting, VPS Hosting, VDS Hosting  
> **Status:** niscProduct DB rows already created. This document covers everything else.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Data Flow — End to End](#2-data-flow--end-to-end)
3. [What Is Already in Place](#3-what-is-already-in-place)
4. [Step 1 — New TRPC Procedures in the Hivelocity Router](#4-step-1--new-trpc-procedures-in-the-hivelocity-router)
5. [Step 2 — The Hivelocity Purchase Dialog (UI)](#5-step-2--the-hivelocity-purchase-dialog-ui)
6. [Step 3 — Cart Store: New Item Type](#6-step-3--cart-store-new-item-type)
7. [Step 4 — Wiring the PlanCard Buttons](#7-step-4--wiring-the-plancard-buttons)
8. [Step 5 — createFromPayment Schema: Hivelocity Metadata](#8-step-5--createfrompayment-schema-hivelocity-metadata)
9. [Step 6 — Order Processor: Hivelocity Branch](#9-step-6--order-processor-hivelocity-branch)
10. [Step 7 — niscClientSubscription Record](#10-step-7--niscclientsubscription-record)
11. [Pricing Logic: Margin + Currency + VAT](#11-pricing-logic-margin--currency--vat)
12. [Billing Period Reference](#12-billing-period-reference)
13. [Option Compatibility](#13-option-compatibility)
14. [Error Handling at Each Layer](#14-error-handling-at-each-layer)
15. [Post-Provisioning: Servers Tab](#15-post-provisioning-servers-tab)
16. [Hivelocity Account Prerequisites](#16-hivelocity-account-prerequisites)
17. [Complete Data Object Reference](#17-complete-data-object-reference)

---

## 1. Architecture Overview

The system follows the same pipeline that already exists for hosting and domains, with a new external integration branch: **Hivelocity**.

```
Customer
  │
  ├─[clicks Buy Now / Add to Cart]
  │
  ▼
HivelocityPurchaseDialog (new component)
  ├── Step 1: OS Selection        ← fetches GET /product/{id}/operating-systems
  ├── Step 2: Hostname + Period   ← validated inputs + billing period picker
  ├── Step 3: Add-on Options      ← fetches GET /product/{id}/options
  ├── Step 4: Review + Price      ← full breakdown, VAT, total in KES
  └── Step 5: Payment (M-Pesa)   ← existing flow unchanged
        │
        └─[on success]
            │
            ▼
        trpc.niscServiceOrders.createFromPayment
            │   payload: { checkoutRequestId, items: [{ productId (nisc), metadata: { hivelocityProductId, locationName, osName, hostname, period, selectedOptionIds } }] }
            │
            ▼
        niscOrder + niscOrderItem created in DB
            │
            ▼
        enqueueNiscOrderProcessing (QStash)
            │
            ▼
        /api/workers/process-nisc-order
            │
            ▼
        processNiscOrder()
            │
            ├── branches by item.product.serviceType
            │
            └── [dedicated_server_hosting | vps_hosting | vds_hosting]
                    │
                    ▼
                processHivelocityOrderItem()   ← NEW
                    │
                    └── POST /bare-metal-devices/ (Hivelocity API)
                            │
                            ▼
                        niscClientSubscription created
                        hivelocityOrderId stored in metadata
                        item.status = "PROVISIONED"
```

---

## 2. Data Flow — End to End

### Phase 1: Customer Configuration (UI)

1. Customer is on the agency Dedicated Servers / VPS / VDS page (Plans tab).
2. They click **"Buy Now"** on a plan card. This opens `HivelocityPurchaseDialog` and passes a `HivelocityPlanConfig` object containing the raw inventory data for the selected plan.
3. The dialog immediately calls two Hivelocity API endpoints in parallel:
   - `trpc.hivelocity.getProductOperatingSystems({ productId })` → populates OS picker
   - `trpc.hivelocity.getProductOptions({ productId })` → populates add-on picker
4. Customer **must** select an OS before they can proceed. This is enforced by disabling the "Next" button until an OS is chosen.
5. Customer enters a hostname (FQDN) and selects a billing period.
6. Customer optionally selects add-ons.

### Phase 2: Price Calculation (UI)

All prices from Hivelocity come in **USD**. The dialog applies:

1. **Agency margin** via `useHivelocityPricing(productType).applyMargin(priceUsd)` — applies the configured percentage or fixed margin + round-off.
2. **KES conversion** via `pricing.toKes(marginedUsd)` — multiplies by the USD→KES exchange rate.
3. **16% VAT** added on top of the KES total.
4. Margin is applied independently to: base plan price, OS license fee, and each selected add-on.

### Phase 3: Payment (UI → Backend)

1. Customer reviews the full breakdown and clicks "Choose payment method".
2. M-Pesa STK push is initiated. Polling begins for the result.
3. On `resultCode === 0` (success): `trpc.niscServiceOrders.createFromPayment` is called.

### Phase 4: Order Creation (Backend)

`createFromPayment` does the following in one transaction:
1. Verifies the `checkoutRequestId` maps to a real, successful `paymentTransaction`.
2. Creates a `niscOrder` row.
3. Creates one `niscOrderItem` row per item in the array.
4. The `item.metadata` JSONB field carries the full Hivelocity provisioning payload (see §8).
5. Enqueues the order via QStash.

### Phase 5: Provisioning (QStash Worker)

1. The QStash worker receives the order ID and loads the full order.
2. `processNiscOrder()` iterates over order items.
3. For each item, it reads `item.product.serviceType`.
4. If the serviceType is `dedicated_server_hosting`, `vps_hosting`, or `vds_hosting` → the new `processHivelocityOrderItem()` function is called.
5. That function reads `item.metadata` and calls `POST /bare-metal-devices/` on the Hivelocity API.
6. Hivelocity responds synchronously with a `BareMetalDevice` object containing `orderId`, `deviceId`, `productId`, `osName`, `locationName`.
7. A `niscClientSubscription` row is created with the Hivelocity IDs stored in `metadata`.
8. `niscOrderItem.status` is set to `PROVISIONED`.

### Phase 6: Post-Provisioning (Async on Hivelocity Side)

The server is not yet live when step 5 completes. Hivelocity provisions the physical/virtual machine in the background (~7–15 min for Linux, longer for Windows). The "Servers" tab will later poll `GET /order/{hivelocityOrderId}` to reflect live status.

---

## 3. What Is Already in Place

| What | Location | Notes |
|---|---|---|
| Hivelocity inventory router | `packages/api/src/routers/hivelocity/index.ts` | Lists plans; no OS/options/provision endpoints yet |
| `hivelocityRequest()` client | `packages/api/src/lib/hivelocity-client.ts` | Handles auth, errors, JSON parsing |
| `useHivelocityPricing(productType)` | `apps/web/src/hooks/use-hivelocity-pricing.ts` | Margin, KES conversion, USD rates |
| `hivelocityPricingSettings` DB table | `packages/db/src/schema/hivelocity-pricing-settings.ts` | Per-product-type margin config |
| `hivelocityPricingSettings` TRPC router | `packages/api/src/routers/hivelocity-pricing-settings.ts` | get/upsert/delete |
| `niscServiceOrders.createFromPayment` | `packages/api/src/routers/nisc-service-orders.ts` | Creates order from M-Pesa success |
| `processNiscOrder()` worker | `packages/api/src/lib/nisc-order-processor.ts` | Branches by serviceType; no Hivelocity branch yet |
| `BuyNowDialog` | `apps/web/src/components/buy-now-dialog.tsx` | Used for hosting; does NOT have an OS step |
| `cart-store.ts` | `apps/web/src/stores/cart-store.ts` | Has domain items only |
| `niscProduct` rows | Database | Already created by you: "Dedicated Servers Hosting", "VPS Hosting", "VDS Hosting" |
| Plan cards (×3) | `agency.dedicated-servers/_components/plan-card.tsx` etc. | Buttons show "coming soon" toast |

---

## 4. Step 1 — New TRPC Procedures in the Hivelocity Router

Add two new procedures to `packages/api/src/routers/hivelocity/index.ts`.

### 4.1 `getProductOperatingSystems`

**Hivelocity endpoint:** `GET /product/{productId}/operating-systems`

**Purpose:** Returns the list of valid operating systems for a given `productId`. Must be called when the purchase dialog opens.

**Response shape from Hivelocity (one element):**
```json
{
  "id": 57,
  "name": "Ubuntu 22.x",
  "monthlyPrice": 0,
  "currency": "USD",
  "tags": ["linux", "ubuntu"],
  "expressions": [],
  "operatingSystemFeatures": {
    "sshKey": true,
    "cloudInit": true,
    "postInstall": true
  }
}
```

**Key facts:**
- `monthlyPrice: 0` means the OS is free (most Linux distros).
- `monthlyPrice > 0` means a licensed OS (e.g., Windows 2022 Standard). This amount must be added to the cart total and shown to the customer before payment.
- The `name` field is what gets passed verbatim as `osName` to `POST /bare-metal-devices/`.
- `id` can optionally be passed as `osOptionId` instead of `osName`.
- `tags` and `expressions` are used for option compatibility (see §13).

**TRPC procedure to add:**
```typescript
getProductOperatingSystems: protectedProcedure
  .input(z.object({ productId: z.number().int().positive() }))
  .query(async ({ input }) => {
    const raw = await hivelocityRequest<unknown[]>(
      `/product/${input.productId}/operating-systems`,
      { requireApiKey: true }
    );
    return { success: true, data: raw };
  }),
```

> **Caching note:** OS lists for a product change rarely. Cache for 5 minutes client-side using `staleTime: 5 * 60 * 1000` in the query options.

---

### 4.2 `getProductOptions`

**Hivelocity endpoint:** `GET /product/{productId}/options?groupBy=upgrade`

**Purpose:** Returns add-on options available for the product, grouped by category.

**Response shape from Hivelocity:**
```json
{
  "Server Management": [
    {
      "id": 9001,
      "name": "Managed Services",
      "monthlyPrice": 99.0,
      "currency": "USD",
      "tags": ["managed"],
      "expressions": []
    }
  ],
  "Bandwidth": [
    {
      "id": 9042,
      "name": "10TB Bandwidth",
      "monthlyPrice": 30.0,
      "currency": "USD",
      "tags": [],
      "expressions": []
    }
  ]
}
```

**Key facts:**
- All prices are in USD.
- Option IDs are **globally static** across all products. An option with ID `9001` always means the same thing regardless of product.
- Options are passed as `optionIds: [9001, 9042]` in the `POST /bare-metal-devices/` body. (Note: verify the exact field name via the Hivelocity API playground or by testing — the OpenAPI schema does not explicitly list `optionIds` in `BareMetalDeviceCreate` but the store functionality confirms they exist.)
- `tags` and `expressions` control which options are mutually compatible (see §13).

**TRPC procedure to add:**
```typescript
getProductOptions: protectedProcedure
  .input(z.object({
    productId: z.number().int().positive(),
    groupBy: z.string().optional().default("upgrade"),
  }))
  .query(async ({ input }) => {
    const raw = await hivelocityRequest<unknown>(
      `/product/${input.productId}/options`,
      {
        query: { groupBy: input.groupBy },
        requireApiKey: true,
      }
    );
    return { success: true, data: raw };
  }),
```

---

## 5. Step 2 — The Hivelocity Purchase Dialog (UI)

Create a **new** dedicated component: `apps/web/src/routes/_components/hivelocity-purchase-dialog.tsx`.

Do **not** modify the existing `BuyNowDialog`. The existing dialog is designed for single-product service plans (hosting, emails). The Hivelocity flow requires dynamic configuration that does not fit its interface.

### 5.1 Props Interface

```typescript
export interface HivelocityPlanConfig {
  // From the inventory item (after margin/currency applied):
  hivelocityProductId: number;          // raw product_id from Hivelocity inventory
  productName: string;                  // display name
  locationName: string;                 // facility code, e.g. "TPA1"
  locationDisplayName: string;          // human-readable, e.g. "Tampa, FL"
  serverType: "DEDICATED_SERVERS" | "VPS" | "VDS";
  niscProductId: string;                // UUID of the nisc_product row in our DB
  // Raw USD prices (pre-margin, pre-conversion):
  basePriceUsdMonthly: number;
  basePriceUsdHourly: number;
  // Display prices (post-margin, post-conversion, in displayCurrency):
  displayPriceMonthly: number;
  displayPriceHourly: number;
  displayCurrency: "KES" | "USD";
  // Billing periods disabled for this product:
  disabledPeriods: string[];
  // Whether a margin is configured (needed to compute option prices):
  pricingSettings: PricingSettings | null;
  usdToKesRate: number | null;
}

interface HivelocityPurchaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: HivelocityPlanConfig | null;
  teamId?: string;
}
```

---

### 5.2 Dialog Steps

The dialog has **five steps** in order:

```
os → configure → addons → review → payment → success | error
```

---

#### Step 1: OS Selection (`"os"`) — **MANDATORY GATE**

This is the very first step. The customer **cannot proceed** until an OS is selected.

**UI Behavior:**
- On dialog open, immediately call `trpc.hivelocity.getProductOperatingSystems({ productId })`.
- While loading: show a spinner with "Loading available operating systems...".
- Once loaded: render a list/grid of OS options. For each OS:
  - Name (e.g., "Ubuntu 22.x")
  - Price label: "Free" if `monthlyPrice === 0`, or `+{formattedPrice}/mo` if `monthlyPrice > 0` (in KES if rate available, else USD).
  - A radio button or clickable card style (consistent with existing UI patterns).
- "Next" button is **disabled** until exactly one OS is selected.
- If the query errors: show an error state with a retry button. Do not allow proceeding.

**State stored after this step:**
```typescript
selectedOs: {
  id: number;
  name: string;             // passed as osName to Hivelocity
  monthlyPriceUsd: number;  // 0 if free
}
```

---

#### Step 2: Configure (`"configure"`)

**Fields:**

1. **Hostname** (required)
   - Label: "Hostname (FQDN)"
   - Placeholder: "e.g. server.yourdomain.com"
   - Validation: must match `/^([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/i`
   - Show green checkmark / red X inline validation (same pattern as the domain input in `BuyNowDialog`).
   - Helper text: "A fully qualified domain name for your server. Example: web1.company.com"

2. **Billing Period** (required, default: `monthly`)
   - Options (exclude any in `plan.disabledPeriods`):

   | Value | Label | Note |
   |---|---|---|
   | `hourly` | Hourly | Charged per hour; first month as deposit |
   | `monthly` | Monthly | 33% off first month |
   | `quarterly` | Quarterly | 38% off first quarter |
   | `semi-annually` | Semi-Annually | 43% off first two quarters |
   | `annually` | Annually | 48% off first year |
   | `biennial` | Biennial (2 years) | — |
   | `triennial` | Triennial (3 years) | — |

   - Render as a `Select` or `RadioGroup` component.
   - The price shown in the review step always reflects the **monthly** display price (this is the base the customer is charged per billing cycle, not per hour). The `period` value passed to Hivelocity determines billing, not the price we show.

**State stored after this step:**
```typescript
hostname: string;
billingPeriod: "hourly" | "monthly" | "quarterly" | "semi-annually" | "annually" | "biennial" | "triennial";
```

---

#### Step 3: Add-on Options (`"addons"`)

**UI Behavior:**
- This step is shown **after** OS and hostname are done.
- Call `trpc.hivelocity.getProductOptions({ productId })` (can be pre-fetched in parallel with OS query on dialog open).
- If the product has no options or the query returns empty: **skip this step automatically** and proceed directly to Review.
- While loading: show a skeleton loader.
- On load: render options grouped by category.

**Per option display:**
- Option name
- Price: "Free" / "+KSh X,XXX/mo" or "+$X.XX/mo"
- A checkbox (options are optional, multi-select is allowed subject to compatibility rules).
- Incompatible options must be visually disabled with a tooltip: "Incompatible with [other selected option name]".

**Compatibility logic (see §13 for full detail):**
When an option is toggled on, run the compatibility check against all currently selected options. If any pair is incompatible, prevent selection and show a tooltip.

**State stored after this step:**
```typescript
selectedOptions: Array<{
  id: number;
  name: string;
  monthlyPriceUsd: number;
}>;
```

---

#### Step 4: Review (`"review"`)

Shows the full order summary before the customer commits to payment.

**Layout:**

```
[Product name + location]          [Stock badge]

OS:                  Ubuntu 22.x (Free)
Hostname:            server.company.com
Billing Period:      Monthly

─────────────────────────────────────────
Price Breakdown
─────────────────────────────────────────
Base Plan              KSh XX,XXX /mo
OS License             Free
Server Management      KSh X,XXX /mo
                      ─────────────────
Subtotal               KSh XX,XXX
16% VAT                KSh X,XXX
─────────────────────────────────────────
Total                  KSh XX,XXX
─────────────────────────────────────────

[coupon code field — same as existing dialog]

[legal text — same as existing dialog]
```

**Price calculation for the review step (all in display currency):**
```
subtotalUsd = basePriceUsdMonthly
            + selectedOs.monthlyPriceUsd
            + sum(selectedOptions[i].monthlyPriceUsd)

// Apply margin to each component separately, then sum:
marginedBase    = applyMargin(basePriceUsdMonthly).final
marginedOs      = applyMargin(selectedOs.monthlyPriceUsd).final
marginedAddons  = selectedOptions.reduce((s, o) => s + applyMargin(o.monthlyPriceUsd).final, 0)

subtotalMarginedUsd = marginedBase + marginedOs + marginedAddons

// Convert to KES if rate available:
subtotalKes = toKes(subtotalMarginedUsd) ?? subtotalMarginedUsd

// Add VAT:
vatAmount = subtotalKes * 0.16
totalKes  = subtotalKes + vatAmount
```

> **Important:** If `usdToKesRate` is null (exchange rate unavailable), display everything in USD and note: "Exchange rates unavailable — prices shown in USD."

---

#### Step 5: Payment (`"payment"`)

Identical to the existing `BuyNowDialog` payment step:
- M-Pesa STK push via `trpc.paymentGateway.mpesa.initiateStkPush`
- Phone number + amount + account reference inputs
- Loading state with `Spinner` while waiting for push
- Polling `trpc.paymentGateway.mpesa.queryStkPush` for completion

The `paymentAmount` must be `totalKes` (the full VAT-inclusive total, rounded to a whole number — M-Pesa requires integer amounts).

---

#### Step 6: Success (`"success"`)

On `resultCode === 0`:
1. Call `trpc.niscServiceOrders.createFromPayment` (see §8 for exact payload).
2. Show success screen:
   - Green checkmark icon
   - "Order Received!"
   - "Your server is being provisioned. This typically takes 7–15 minutes for Linux-based systems and up to 30 minutes for Windows. You will receive an email when it's ready."
   - Display the order total and selected configuration summary.

> **Do NOT say** "will be activated on your dashboard in a few minutes" — provisioning is asynchronous on Hivelocity's infrastructure, not an instant DB operation.

---

#### Step 7: Error (`"error"`)

Same as existing dialog. Show the M-Pesa error message and offer "Try Again" (returns to payment step) and "Close".

---

### 5.3 Dialog State Machine

```
Initial state → "os"
  "os": OS selected? → "configure"
  "configure": hostname valid + period selected? → "addons" (or "review" if no options)
  "addons": continue → "review"
  "review": proceed → "payment"
  "payment": success → "success"  |  failure → "error"
  "success": close dialog
  "error": try again → "payment"  |  close dialog
```

When the dialog is closed and reopened (for a different plan), **all state resets**.

---

## 6. Step 3 — Cart Store: New Item Type

Add a `HivelocityServerCartItem` to `apps/web/src/stores/cart-store.ts`.

### 6.1 Type Definition

```typescript
interface HivelocityServerCartItem extends BaseCartItem {
  type: 'hivelocity_server';
  serverType: 'DEDICATED_SERVERS' | 'VPS' | 'VDS';
  niscProductId: string;               // UUID from nisc_product table
  hivelocityProductId: number;         // integer product_id from Hivelocity inventory
  productName: string;
  locationName: string;                // facility code e.g. "TPA1"
  locationDisplayName: string;
  osName: string;
  osOptionId?: number;
  hostname: string;
  billingPeriod: string;
  selectedOptionIds: number[];
  selectedOptionNames: string[];
  // Raw USD prices (pre-margin):
  basePriceUsdMonthly: number;
  osPriceUsdMonthly: number;
  addonsPriceUsdMonthly: number;
  // Display prices (post-margin, post-conversion, in displayCurrency, pre-VAT):
  subtotalDisplay: number;
  vatAmountDisplay: number;
  totalDisplay: number;
  displayCurrency: 'KES' | 'USD';
}
```

### 6.2 Cart Methods to Add

```typescript
addHivelocityServer: (data: Omit<HivelocityServerCartItem, 'id' | 'type' | 'addedAt'>) => void;
removeHivelocityServer: (id: string) => void;
getHivelocityServers: () => HivelocityServerCartItem[];
isHivelocityServerInCart: (hivelocityProductId: number, locationName: string) => boolean;
```

### 6.3 Update `getTotal` and `getTotalsByCurrency`

The existing `getTotal` only handles domain items. Add a case for `hivelocity_server`:

```typescript
if (item.type === 'hivelocity_server') {
  const currency = item.displayCurrency;
  totals[currency] = (totals[currency] || 0) + item.totalDisplay;
}
```

### 6.4 "Add to Cart" vs "Buy Now"

- **"Buy Now"**: Opens `HivelocityPurchaseDialog` directly. Does not interact with the cart. Payment is immediate.
- **"Add to Cart"**: Opens `HivelocityPurchaseDialog` for configuration (OS, hostname, period, addons). On completion (before the payment step), adds a `HivelocityServerCartItem` to the cart and closes the dialog. The cart checkout dialog (`CheckoutDialog`) then handles payment for all cart items together.

> The `CheckoutDialog` (sidebar cart) will need to handle `hivelocity_server` items on checkout. It currently only processes domain items. This is a separate enhancement — initially, the "Add to Cart" button can open the same `HivelocityPurchaseDialog` in a "cart" mode where the final step adds to cart instead of paying.

---

## 7. Step 4 — Wiring the PlanCard Buttons

In each of the three `plan-card.tsx` files:

- `apps/web/src/routes/agency.dedicated-servers/_components/plan-card.tsx`
- `apps/web/src/routes/agency.vps/_components/plan-card.tsx`
- `apps/web/src/routes/agency.vds/_components/plan-card.tsx`

**New props to add to `PlanCard`:**

```typescript
onBuyNow: (plan: DedicatedPlan) => void;
onAddToCart: (plan: DedicatedPlan) => void;
```

The parent page (`agency.dedicated-servers.tsx` etc.) constructs the `HivelocityPlanConfig` from the plan + pricing hook and manages the dialog open state.

**In the parent page, the pattern is:**

```typescript
const [buyNowPlan, setBuyNowPlan] = React.useState<HivelocityPlanConfig | null>(null);
const [dialogOpen, setDialogOpen] = React.useState(false);

function handleBuyNow(p: DedicatedPlan) {
  setBuyNowPlan(buildHivelocityPlanConfig(p, pricing, displayCurrency, niscProductId));
  setDialogOpen(true);
}

// Pass to each card:
<PlanCard
  ...
  onBuyNow={() => handleBuyNow(p)}
  onAddToCart={() => handleAddToCart(p)}
/>
```

**`buildHivelocityPlanConfig` helper (defined in the page or a shared util):**

```typescript
function buildHivelocityPlanConfig(
  plan: DedicatedPlan,
  pricing: ReturnType<typeof useHivelocityPricing>,
  displayCurrency: "KES" | "USD",
  niscProductId: string,
): HivelocityPlanConfig {
  return {
    hivelocityProductId: plan.product_id,
    productName: plan.product_name,
    locationName: plan.data_center,
    locationDisplayName: /* lookup from facilityTitleByCode */ "",
    serverType: "DEDICATED_SERVERS", // or VPS/VDS per page
    niscProductId,
    basePriceUsdMonthly: /* raw USD price from original plan */ 0,
    basePriceUsdHourly:  /* raw USD hourly */ 0,
    displayPriceMonthly: plan.product_monthly_price ?? 0, // already margin+KES applied
    displayPriceHourly:  plan.product_hourly_price ?? 0,
    displayCurrency,
    disabledPeriods: plan.product_disabled_billing_periods ?? [],
    pricingSettings: pricing.settings,
    usdToKesRate: pricing.usdToKesRate,
  };
}
```

> **Note on raw USD prices:** The `displayPlans` array has already had margin + KES conversion applied to the displayed prices. The raw USD prices (`basePriceUsdMonthly`, `basePriceUsdHourly`) are the **original** inventory values before transformation. These need to be passed along from the `__originalUsd` data that is already being computed in the `displayPlans` memo, or by storing the original plan alongside the transformed one.

---

## 8. Step 5 — createFromPayment Schema: Hivelocity Metadata

### 8.1 The Problem

`createFromPaymentItemSchema` in `packages/api/src/routers/nisc-service-orders-schemas.ts` currently types `metadata` as `transferItemMetadataSchema` — which only accepts domain transfer fields (`transferAuthCode`, `nameServers`).

Hivelocity items need to store a completely different payload in `metadata`.

### 8.2 Solution

Change `metadata` to accept a discriminated union or a looser type. The safest approach is a union:

```typescript
// In nisc-service-orders-schemas.ts

export const hivelocityItemMetadataSchema = z.object({
  hivelocityProductId: z.number().int().positive(),
  hivelocityLocationName: z.string().min(1),   // facility code, e.g. "TPA1"
  hivelocityOsName: z.string().min(1),          // e.g. "Ubuntu 22.x"
  hivelocityHostname: z.string().min(1),        // FQDN
  hivelocityPeriod: z.enum([
    "hourly", "monthly", "quarterly",
    "semi-annually", "annually", "biennial", "triennial"
  ]),
  hivelocityOptionIds: z.array(z.number().int()).default([]),
  // Prices in USD (raw, pre-margin) stored for cost reconciliation:
  basePriceUsd: z.number().optional(),
  osPriceUsd: z.number().optional(),
  addonsPriceUsd: z.number().optional(),
  // Prices in KES (post-margin, pre-VAT) stored for invoice generation:
  subtotalKes: z.number().optional(),
  totalKes: z.number().optional(),
  // Exchange rate snapshot at time of order:
  usdToKesRate: z.number().optional(),
});
export type HivelocityItemMetadata = z.infer<typeof hivelocityItemMetadataSchema>;

// Update createFromPaymentItemSchema:
export const createFromPaymentItemSchema = z.object({
  productId: z.string(),
  productPlanId: z.string().nullable().optional(),
  billingCycle: billingCycleSchema.optional(),
  primaryDomain: z.string().optional(),
  description: z.string().optional(),
  itemPrice: z.string(),
  itemSubtotal: z.string(),
  domainSubscriptionId: z.string().optional(),
  // Changed: accept either domain transfer metadata OR Hivelocity metadata OR nothing:
  metadata: z.union([
    transferItemMetadataSchema,
    hivelocityItemMetadataSchema,
    z.undefined(),
    z.null(),
  ]).optional(),
});
```

### 8.3 What to Pass from the Dialog

When calling `createFromPayment` after successful M-Pesa payment, the items array element for a Hivelocity order looks like:

```typescript
{
  productId: plan.niscProductId,          // UUID of "Dedicated Servers Hosting" nisc_product
  productPlanId: null,                    // no plan row needed
  billingCycle: "MONTHLY",               // map the Hivelocity period to the closest enum
  description: `${plan.productName} @ ${plan.locationDisplayName}`,
  itemPrice: String(Math.round(totalKes)), // KES total paid (VAT inclusive)
  itemSubtotal: String(Math.round(subtotalKes)), // pre-VAT KES
  metadata: {
    hivelocityProductId: plan.hivelocityProductId,
    hivelocityLocationName: plan.locationName,
    hivelocityOsName: selectedOs.name,
    hivelocityHostname: hostname,
    hivelocityPeriod: billingPeriod,
    hivelocityOptionIds: selectedOptions.map(o => o.id),
    basePriceUsd: plan.basePriceUsdMonthly,
    osPriceUsd: selectedOs.monthlyPriceUsd,
    addonsPriceUsd: selectedOptions.reduce((s, o) => s + o.monthlyPriceUsd, 0),
    subtotalKes: Math.round(subtotalKes),
    totalKes: Math.round(totalKes),
    usdToKesRate: plan.usdToKesRate ?? undefined,
  }
}
```

> **`billingCycle` mapping:** The `billingCycleSchema` enum is `MONTHLY | YEARLY | BIENNIALLY | CUSTOM`. For Hivelocity's `hourly`, `quarterly`, `semi-annually`, `triennial`, use `"CUSTOM"`. For `monthly` use `"MONTHLY"`, for `annually` use `"YEARLY"`, for `biennial` use `"BIENNIALLY"`.

---

## 9. Step 6 — Order Processor: Hivelocity Branch

### 9.1 Add Service Types Constant

In `packages/api/src/lib/nisc-order-processor.ts`, add:

```typescript
const HIVELOCITY_SERVICE_TYPES = [
  "dedicated_server_hosting",
  "vps_hosting",
  "vds_hosting",
];
```

> These must exactly match the `serviceType` column values in the `nisc_product` rows you created in the database.

### 9.2 Add Branch in `processNiscOrder`

In the per-item loop, insert the new branch **before** the `OPENPROVIDER_SERVICE_TYPES` check:

```typescript
if (HIVELOCITY_SERVICE_TYPES.includes(serviceType)) {
  const result = await processHivelocityOrderItem(order, item);
  // handle result (same pattern as Plesk/domain branches)
  continue;
}
```

### 9.3 `processHivelocityOrderItem` Function

```typescript
async function processHivelocityOrderItem(
  order: { teamId: string | null; userId: string | null; createdBy: string | null; id: string; currency: string },
  item: {
    id: string;
    productId: string;
    productPlanId: string | null;
    billingCycle: string | null;
    itemPrice: string;
    itemSubtotal: string;
    description: string | null;
    metadata: unknown;
    product: { name: string; serviceType: string };
    productPlan: null;
  }
): Promise<
  | { ok: true; subscriptionId: string; hivelocityOrderId: number; hivelocityDeviceId?: number }
  | { ok: false; error: string; errorDetails?: Record<string, unknown> }
> {
  // 1. Parse and validate metadata
  const meta = hivelocityItemMetadataSchema.safeParse(item.metadata);
  if (!meta.success) {
    return {
      ok: false,
      error: "Invalid Hivelocity provisioning metadata on order item.",
      errorDetails: { zodError: meta.error.flatten() },
    };
  }

  const {
    hivelocityProductId,
    hivelocityLocationName,
    hivelocityOsName,
    hivelocityHostname,
    hivelocityPeriod,
    hivelocityOptionIds,
  } = meta.data;

  // 2. Call Hivelocity API
  let provisionResponse: {
    orderId: number;
    deviceId?: number;
    productId: number;
    osName: string;
    locationName: string;
    period: string;
  };

  try {
    provisionResponse = await hivelocityRequest<any>("/bare-metal-devices/", {
      method: "POST",
      requireApiKey: true,
      headers: { "Content-Type": "application/json" },
      // body is passed as the second arg — update hivelocityRequest to accept body for POST
      // (see §9.4 for the client update required)
    });
    // Actual call with body (see §9.4):
    // body: {
    //   productId: hivelocityProductId,
    //   locationName: hivelocityLocationName,
    //   osName: hivelocityOsName,
    //   hostname: hivelocityHostname,
    //   period: hivelocityPeriod,
    //   ...(hivelocityOptionIds.length > 0 ? { optionIds: hivelocityOptionIds } : {}),
    // }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      ok: false,
      error: `Hivelocity provisioning failed: ${message}`,
      errorDetails: buildProvisioningErrorDetails(err),
    };
  }

  // 3. Create niscClientSubscription
  const subId = randomUUID();
  const now = new Date();
  const subscriptionName = `${item.product.name} — ${hivelocityOsName} @ ${hivelocityLocationName}`;

  const inserted = await db
    .insert(niscClientSubscription)
    .values({
      id: subId,
      name: subscriptionName,
      description: item.description ?? null,
      userId: order.userId,
      teamId: order.teamId,
      productId: item.productId,
      productPlanId: null,
      orderId: null,
      niscOrderId: order.id,
      subscribedBy: order.createdBy,
      status: "ACTIVE",
      subscriptionDate: now,
      billingCycle: (item.billingCycle as any) ?? null,
      pricingModel: "FIXED",
      agreedPrice: item.itemPrice,
      agreedCurrency: order.currency,
      agreedCost: null,
      agreedCostCurrency: "USD",
      providerCost: meta.data.basePriceUsd ? String(meta.data.basePriceUsd) : null,
      providerCostCurrency: "USD",
      agreedCommissionRate: null as any,
      agreedCommissionBase: null,
      metadata: {
        hivelocityOrderId: provisionResponse.orderId,
        hivelocityDeviceId: provisionResponse.deviceId ?? null,
        hivelocityProductId,
        locationName: hivelocityLocationName,
        osName: hivelocityOsName,
        hostname: hivelocityHostname,
        period: hivelocityPeriod,
        optionIds: hivelocityOptionIds,
        provisionedAt: now.toISOString(),
      },
    })
    .returning();

  const sub = inserted[0];
  if (!sub) {
    throw new Error("Failed to create Nisc subscription for Hivelocity order.");
  }

  return {
    ok: true,
    subscriptionId: sub.id,
    hivelocityOrderId: provisionResponse.orderId,
    hivelocityDeviceId: provisionResponse.deviceId,
  };
}
```

### 9.4 Update `hivelocityRequest` to Accept a POST Body

The current `hivelocityRequest` in `packages/api/src/lib/hivelocity-client.ts` does not accept a request body. It needs one additional field in `HivelocityRequestOptions`:

```typescript
type HivelocityRequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  query?: Record<string, string | number | boolean | null | undefined>;
  body?: unknown;                     // ADD THIS
  headers?: Record<string, string | undefined>;
  requireApiKey?: boolean;
};
```

In the `fetch` call, add:

```typescript
const resp = await fetch(buildUrl(path, options.query), {
  method: options.method ?? "GET",
  headers: {
    Accept: "application/json",
    ...(options.body !== undefined ? { "Content-Type": "application/json" } : {}),
    ...(apiKey ? { "X-API-KEY": apiKey } : {}),
    ...options.headers,
  },
  ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
});
```

---

## 10. Step 7 — niscClientSubscription Record

The subscription created by `processHivelocityOrderItem` contains all the information needed to:

1. Show the customer their active server subscription in their dashboard.
2. Link to the provisioned Hivelocity device.
3. Track billing and renewal.

**The `metadata` JSONB field on `niscClientSubscription` stores:**

```json
{
  "hivelocityOrderId": 123456,
  "hivelocityDeviceId": 789012,
  "hivelocityProductId": 584,
  "locationName": "TPA1",
  "osName": "Ubuntu 22.x",
  "hostname": "server.company.com",
  "period": "monthly",
  "optionIds": [9001],
  "provisionedAt": "2026-04-14T10:30:00.000Z"
}
```

**Fields on the subscription row itself:**

| Field | Value |
|---|---|
| `name` | `"Dedicated Servers Hosting — Ubuntu 22.x @ TPA1"` |
| `status` | `"ACTIVE"` |
| `agreedPrice` | KES total paid (VAT inclusive) |
| `agreedCurrency` | `"KES"` |
| `providerCost` | USD base price (from Hivelocity, for cost tracking) |
| `providerCostCurrency` | `"USD"` |
| `billingCycle` | Mapped value (`MONTHLY`, `YEARLY`, etc.) |

---

## 11. Pricing Logic: Margin + Currency + VAT

### Full Calculation Chain

The `useHivelocityPricing` hook already implements the margin and KES conversion. For the purchase dialog, the same logic applies to every price component independently:

```
For each price component (base plan, OS, each add-on):

  1. priceUsd (raw from Hivelocity API)
  
  2. marginedUsd = applyMargin(priceUsd)
     - If marginType === "PERCENTAGE":
         marginedUsd = priceUsd * (1 + percentage/100)
     - If marginType === "FIXED":
         marginedUsd = priceUsd + fixedAmount
     - If roundOff configured:
         marginedUsd = ceil(marginedUsd / roundOff) * roundOff
     - If no margin configured:
         marginedUsd = priceUsd (pass through unchanged)
  
  3. priceKes = marginedUsd * usdToKesRate
     (if rate unavailable, remain in USD)
  
Sum all components → subtotalKes

  4. vatAmount = subtotalKes * 0.16
  
  5. totalKes = subtotalKes + vatAmount
```

### What Gets Stored vs Displayed

| Value | Where stored | Currency |
|---|---|---|
| `itemPrice` on `niscOrderItem` | DB | KES (VAT inclusive, what customer paid) |
| `itemSubtotal` on `niscOrderItem` | DB | KES (pre-VAT) |
| `providerCost` on `niscClientSubscription` | DB | USD (raw Hivelocity price, no margin) |
| `agreedPrice` on `niscClientSubscription` | DB | KES (what we charged) |
| `metadata.basePriceUsd` | DB JSONB | USD |
| `metadata.usdToKesRate` | DB JSONB | Rate at time of order |

---

## 12. Billing Period Reference

| Hivelocity `period` value | Label shown to customer | Map to `billingCycle` enum |
|---|---|---|
| `hourly` | Hourly | `CUSTOM` |
| `monthly` | Monthly | `MONTHLY` |
| `quarterly` | Quarterly | `CUSTOM` |
| `semi-annually` | Semi-Annually | `CUSTOM` |
| `annually` | Annually | `YEARLY` |
| `biennial` | Biennial (2 years) | `BIENNIALLY` |
| `triennial` | Triennial (3 years) | `CUSTOM` |

**Special note on hourly billing:**
- Hivelocity charges a **full first-month deposit** for hourly servers. This deposit appears as account credit if the server is deleted before the month ends.
- The customer is charged KES at checkout. The hourly rate they see on the card is for reference. The amount charged at purchase time is always the **monthly total**.
- For hourly plans, `billingCycle` is `CUSTOM` and the `description` field should note "hourly billing, deposit equivalent to 1 month charged upfront."

---

## 13. Option Compatibility

Hivelocity uses a tag-expression system to prevent incompatible option combinations. Each option has:

- `tags: string[]` — labels describing what this option is/requires.
- `expressions: string[]` — boolean expressions evaluated against selected option tags to determine compatibility.

**Example:** A "Managed Windows" option might have `expressions: ["os:windows"]` meaning it can only be selected if an OS tagged `"os:windows"` is also selected.

The compatibility checker is an LR parser. The reference implementation is available at:
https://gist.github.com/exit99/546a0e2e7e8f85f64ed0b87578706f89

**Implementation approach in the dialog:**

When the customer toggles an option:
1. Build the current "tag set" from all selected options (and the selected OS).
2. For the newly toggled option, evaluate its `expressions` against the tag set.
3. If any expression evaluates to `false` → the option is incompatible; disable it visually and show a tooltip.
4. Also re-evaluate all currently selected options against the new tag set after the change.

For the initial release, if implementing the full LR parser is too complex, a simpler heuristic is acceptable: if `expressions` is non-empty and the option's required tags are not present in the selected option set, disable the option. This covers the majority of real-world cases.

### 13.1 Safety Rule Using `operatingSystemFeatures` (UI Guardrail)

In practice, we also receive `operatingSystemFeatures` objects on both:

- **OS options** (selected OS capabilities), and sometimes
- **Product add-ons** (what that add-on requires/supports during provisioning).

Because `expressions` parsing may be implemented later (LR parser), we apply an additional **conservative client-side guardrail**:

- Treat any `true` field on an add-on’s `operatingSystemFeatures` as a **minimum required OS capability**.
- If the selected OS has that capability as `false` (or missing), the add-on is **disabled** and the UI explains why.
- If an add-on field is `false`, it does **not** block selection even if the OS has it `true` (monotonic compatibility).

**Example:**

- Add-on requires `sshKey: true`
- Selected OS has `sshKey: false`
- Result: disable add-on with: “Unavailable for [OS name]: requires SSH keys support.”

This rule is intentionally strict (it may disable some combinations that Hivelocity would still accept), but it prevents obvious mismatches and reduces provisioning failures.

---

## 14. Error Handling at Each Layer

### 14.1 OS/Options Fetch Failure (Dialog)

- Show an error state with a retry button.
- Do not allow proceeding past the OS step if the OS list could not be loaded.
- The "Buy Now" button on the plan card should be disabled if the product is out of stock (`stock === "unavailable"`).

### 14.2 M-Pesa Failure (Dialog)

- Show `error` step with the specific M-Pesa error code message.
- Offer "Try Again" — returns to payment step, resets polling state.

### 14.3 `createFromPayment` Failure (Client)

- Rare but possible (e.g., server error).
- If this fails after a successful M-Pesa payment, the customer has paid but no order was created.
- The `toast.error` from the mutation's `onError` handler should say: "Your payment was received but the order could not be created. Please contact support with reference: [checkoutRequestId]."

### 14.4 Hivelocity Provisioning Failure (Order Processor)

- The `processHivelocityOrderItem` function catches all errors and returns `{ ok: false, error, errorDetails }`.
- The order processor marks `niscOrderItem.status = "FAILED"` and stores the error in `provisioningError`.
- The order status becomes `"FAILED"` (or `"PARTIAL"` if some items succeeded).
- The existing worker sends a failure email (via `renderNiscOrderFailedEmail`).
- The agency admin sees the failure in the Orders dashboard and can trigger a retry.

**Common Hivelocity API errors:**

| HTTP Status | Meaning | Action |
|---|---|---|
| 400 | Invalid parameters (bad hostname format, invalid OS name, etc.) | Log `errorDetails`; do not retry automatically |
| 401/403 | API key invalid or account not verified | Alert agency admin; block all Hivelocity orders until resolved |
| 404 | Product or location no longer available | Mark item FAILED; notify customer |
| 429 | Rate limited | Retry with exponential backoff |
| 500 | Hivelocity internal error | Retry once after 30 seconds |

### 14.5 Hivelocity API Key Not Configured

The `hivelocityRequest` function throws a `TRPCError` with `code: "INTERNAL_SERVER_ERROR"` if `HIVELOCITY_API_KEY` is missing and `requireApiKey: true`. This will surface as an order processor failure. The `HIVELOCITY_API_KEY` environment variable must be set in production.

---

## 15. Post-Provisioning: Servers Tab

The "Servers" tab on each product page currently shows "coming soon." Once provisioning is live, it should display the customer's active Hivelocity subscriptions.

This requires:

1. A new TRPC procedure `hivelocity.getProvisionedDevices` that queries `niscClientSubscription` for rows with `productId` matching the relevant Hivelocity `nisc_product` IDs, extracts `metadata.hivelocityOrderId`, and optionally calls `GET /order/{id}` or `GET /device/{id}` to get live status.

2. Display per device:
   - Hostname, OS, location
   - Power status (from `GET /device/{deviceId}` — returns `powerStatus: "ON" | "OFF"`)
   - Primary IP (available once provisioned)
   - Monthly cost

3. Actions per device:
   - Power on/off: `POST /device/{deviceId}/power` (to be added to the router when implementing this tab)
   - Cancel/Delete: `DELETE /bare-metal-devices/{deviceId}` + update subscription status to `CANCELLED`

This is a **post-launch enhancement** and does not block the purchase + provisioning flow.

---

## 16. Hivelocity Account Prerequisites

These are operational requirements outside the codebase. All must be satisfied before any production order can succeed.

| Requirement | Why | How |
|---|---|---|
| Hivelocity account verified (KYC complete) | API orders are blocked until account is verified | Log into my.hivelocity.net → complete verification |
| Credit card or pre-funded balance on Hivelocity account | Hivelocity charges your account in USD when a device is provisioned | Add payment method at my.hivelocity.net/billing |
| `HIVELOCITY_API_KEY` env variable set | All API calls require it | Generate at my.hivelocity.net/api-keys; set in your deployment environment |
| Hourly server limit raised (if selling hourly plans) | Default limit is 2 concurrent hourly servers | Open support ticket at Hivelocity to increase |
| Understand the hourly deposit rule | Every hourly server charges a full month deposit upfront | Factor into pricing and customer communication |

---

## 17. Complete Data Object Reference

### 17.1 Hivelocity `POST /bare-metal-devices/` Request Body

```json
{
  "productId": 584,
  "locationName": "TPA1",
  "osName": "Ubuntu 22.x",
  "hostname": "server.company.com",
  "period": "monthly",
  "optionIds": [9001, 9042],
  "publicSshKeyId": null,
  "tags": []
}
```

**Required fields:** `productId`, `locationName`, `osName`, `hostname`  
**Defaults:** `period` defaults to `"hourly"` if omitted

### 17.2 Hivelocity `POST /bare-metal-devices/` Response (BareMetalDevice)

```json
{
  "orderId": 123456,
  "deviceId": 789012,
  "productId": 584,
  "productName": "E3-1240v3 / 32GB / 2x 1TB HDD",
  "osName": "Ubuntu 22.x",
  "locationName": "TPA1",
  "hostname": "server.company.com",
  "period": "monthly",
  "primaryIp": null,
  "powerStatus": null,
  "serviceId": 456789
}
```

`primaryIp` is `null` at time of creation — it is assigned during provisioning.

### 17.3 `niscOrderItem.metadata` Shape (Hivelocity)

```typescript
{
  hivelocityProductId: number;
  hivelocityLocationName: string;
  hivelocityOsName: string;
  hivelocityHostname: string;
  hivelocityPeriod: string;
  hivelocityOptionIds: number[];
  basePriceUsd?: number;
  osPriceUsd?: number;
  addonsPriceUsd?: number;
  subtotalKes?: number;
  totalKes?: number;
  usdToKesRate?: number;
}
```

### 17.4 `niscClientSubscription.metadata` Shape (Hivelocity)

```typescript
{
  hivelocityOrderId: number;
  hivelocityDeviceId: number | null;
  hivelocityProductId: number;
  locationName: string;
  osName: string;
  hostname: string;
  period: string;
  optionIds: number[];
  provisionedAt: string; // ISO 8601
}
```

### 17.5 `HivelocityPlanConfig` (passed to dialog)

```typescript
{
  hivelocityProductId: number;
  productName: string;
  locationName: string;
  locationDisplayName: string;
  serverType: "DEDICATED_SERVERS" | "VPS" | "VDS";
  niscProductId: string;
  basePriceUsdMonthly: number;
  basePriceUsdHourly: number;
  displayPriceMonthly: number;
  displayPriceHourly: number;
  displayCurrency: "KES" | "USD";
  disabledPeriods: string[];
  pricingSettings: PricingSettings | null;
  usdToKesRate: number | null;
}
```

---

## Implementation Order

Build in this sequence to avoid dependency issues:

1. **`hivelocityRequest` body support** — affects all downstream POST calls
2. **`getProductOperatingSystems` + `getProductOptions` TRPC procedures** — dialog depends on these
3. **`hivelocityItemMetadataSchema` + `createFromPaymentItemSchema` update** — processor depends on this
4. **`processHivelocityOrderItem` in the order processor** — needs schema from step 3
5. **`HivelocityServerCartItem` in cart store** — dialog depends on this
6. **`HivelocityPurchaseDialog` component** — needs all of the above
7. **Wire PlanCard buttons in all 3 pages** — final UI connection

Each step is independently testable before the next one begins.
