# Nisc Sales Report Feature   Comprehensive Design Document

**Version:** 1.1  
**Date:** April 2026  
**Status:** Proposal / Pre-implementation

---

## Table of Contents

1. [Overview & Goals](#1-overview--goals)
2. [Current State Analysis](#2-current-state-analysis)
3. [Data Foundation   What We Have](#3-data-foundation--what-we-have)
4. [Report Catalogue](#4-report-catalogue)
   - 4.1 [Revenue & Collections Reports](#41-revenue--collections-reports)
   - 4.2 [Invoicing Reports](#42-invoicing-reports)
   - 4.3 [Quotation Pipeline Reports](#43-quotation-pipeline-reports)
   - 4.4 [Subscription & Recurring Revenue Reports](#44-subscription--recurring-revenue-reports)
   - 4.5 [Client Reports](#45-client-reports)
   - 4.6 [Product & Service Performance Reports](#46-product--service-performance-reports)
   - 4.7 [Commission & Profitability Reports](#47-commission--profitability-reports)
   - 4.8 [Order & Fulfilment Reports](#48-order--fulfilment-reports)
   - 4.9 [Domain Portfolio Reports](#49-domain-portfolio-reports)
   - 4.10 [Hosting Reports](#410-hosting-reports)
   - 4.11 [Promotional & Discount Reports](#411-promotional--discount-reports)
   - 4.12 [Payment & Gateway Reports](#412-payment--gateway-reports)
   - 4.13 [Tax & Compliance Reports](#413-tax--compliance-reports)
   - 4.14 [Creative Production Reports](#414-creative-production-reports)
   - 4.15 [Support & Ticket Reports](#415-support--ticket-reports)
   - 4.16 [Team & User Activity Reports](#416-team--user-activity-reports)
5. [Flexible Filtering System](#5-flexible-filtering-system)
6. [Architecture Approach](#6-architecture-approach)
7. [Status Definitions Reference](#7-status-definitions-reference)

---

## 1. Overview & Goals

The current sales reporting implementation is a collection of pre-aggregated snapshots and a single large `computeSalesReportOverview` function. It only covers invoice totals, a partial MRR number, and limited subscription counts. It does not reflect the full financial picture of the business and sometimes produces inaccurate numbers because it conflates document-creation events with actual paid revenue   not because DRAFT documents should be hidden, but because totals were miscategorised.

**Goals for the new Nisc Sales Report feature:**

- **Comprehensive**   Every significant business event that has a monetary or operational impact must be reportable.
- **Real-time**   All reports query live data directly from the source tables on demand. No pre-aggregated snapshot tables are introduced or maintained. The existing `reporting.*` snapshot tables may continue to exist but the new system does not depend on them.
- **Inclusive of all statuses**   DRAFT invoices and DRAFT quotations are valid documents that the business created. They are reportable just like any other status. Reports surface the full picture and let the user filter by status (including or excluding DRAFT) rather than hiding data by default.
- **Flexible**   Every report must accept a date range and a set of optional dimension filters (team/client, product category, service type, billing cycle, currency, status). No report should have hard-coded date windows or hard-coded status exclusions.
- **Actionable**   Every report should answer a specific business question, not just display data.
- **Exportable**   Every report should be exportable as CSV and PDF.

---

## 2. Current State Analysis

### What exists today

| Component | Location | What it does |
|---|---|---|
| `salesReportSnapshot` table | `packages/db/src/schema/reporting.ts` | Stores daily/monthly aggregated totals: totalRevenue, totalInvoiced, totalPaid, taxableAmount, taxAmount, pendingAmount, invoiceCount, paidInvoiceCount |
| `revenueByServiceSnapshot` table | same file | Revenue broken down by service type per period |
| `revenueByTeamSnapshot` table | same file | Revenue broken down by team per period |
| `creativeProductionSnapshot` table | same file | Assets created, approved, versions, velocity |
| `aggregateSales()` function | `packages/api/src/routers/reports/utils.ts` | Populates snapshot tables from invoice data |
| `computeSalesReportOverview()` | `packages/api/src/routers/reports/sales-overview.ts` | Live aggregation: MRR, ARR, subscription counts, invoice totals, renewal forecasts, top teams, category breakdown |
| UI | `apps/web/src/routes/agency.reports.sales.tsx` | Renders the above |

### Known gaps and inaccuracies

1. **Status misclassification in aggregations**   The snapshot aggregation in `aggregateSales()` does not distinguish between what is actually collected cash (PAID), what is billed but unpaid (SENT/OVERDUE), and what is still a draft document. This makes the "total revenue" figure unreliable because it does not clearly communicate what has been received vs. what is pending vs. what is still being prepared. The fix is not to hide DRAFT documents but to report each status accurately and separately.

2. **No quotation-to-invoice conversion tracking**   Quotations are never queried in any current report. There is no way to see pipeline value or conversion rates.

3. **No per-client breakdown**   Revenue is only broken down by team (company/client) in a very coarse way. There is no drill-down to see individual client payment history, outstanding balances, or lifetime value.

4. **No overdue / collections visibility**   There is no report that surfaces invoices past their due date, aging buckets, or outstanding balances.

5. **No cost/margin tracking**   `niscProductPlan.cost`, `niscClientSubscription.agreedCost`, and `niscClientSubscriptionRenewal.providerRenewalPrice` are never used in any report. We have gross margin data but never show it.

6. **No commission reporting**   `niscCommissionEntry` table exists with full commission data but is never queried in any report.

7. **No payment method / gateway breakdown**   `paymentTransaction` and `invoiceTransaction.method` data are never surfaced.

8. **No credit note impact**   `invoice_credit_note` is never factored into effective revenue in the reports.

9. **No promotional analysis**   `niscProductPromoRedeem` data is never used in any report.

10. **No domain or hosting operational reports**   Domain expiry, upcoming renewals, hosting subscription states are not in the reports module at all.

11. **No KRA/eTIMS compliance reporting**   `kraStatus`, `kraInvoiceNumber`, `kraReceiptNumber` on invoices are never reported on.

---

## 3. Data Foundation   What We Have

This section maps every relevant schema to what reports it enables.

### 3.1 Invoicing (`invoice`, `invoice_line_item`, `invoice_transaction`, `invoice_credit_note`)

**Statuses (all reportable):**
- `DRAFT`   Created internally, not yet sent to or acknowledged by the client. Represents the value of invoices being prepared. Included in reports; clearly labelled as DRAFT in all outputs.
- `SENT`   Delivered to the client and awaiting payment. This is billed but uncollected revenue.
- `PAID`   Payment confirmed. This is collected (actual) revenue.
- `OVERDUE`   Past the due date without payment.
- `PARTIALLY_PAID`   Some payment received, balance remains.
- `CANCELLED`   Voided, no financial impact.
- `CREDITED`   Reversed via a credit note.

**Key fields for reporting:**
- `amount`, `subtotal`, `tax`, `taxPercentage`, `vat`, `discount`   financial figures
- `currency`   multi-currency support
- `creditedAmount`, `creditBalance`   credit note impact
- `issueDate`, `dueDate`, `paidAt`, `sentAt`   time dimensions
- `teamId` → client/company dimension
- `createdBy` → staff dimension
- `kraStatus`, `kraInvoiceNumber`, `kraReceiptNumber` → compliance dimension

**`invoiceTransaction`** provides:
- `method` (payment method: M-PESA, bank transfer, card, etc.)
- `amount`, `paidAt`   actual cash received and when
- `status` (PENDING, COMPLETED, FAILED, REFUNDED)
- `gateway`, `providerReference`, `receiptNumber`

**`invoice_credit_note`** provides:
- `amount`, `reason`, `issuedAt`, `appliedAt`   credit adjustments

### 3.2 Quotations (`quotation`, `quotation_line_item`)

**Statuses (all reportable):**
- `DRAFT`   Created internally, not yet sent to the client. Represents work in preparation. Included in reports; clearly labelled as DRAFT in all outputs.
- `SENT`   Delivered to the client. Active pipeline.
- `ACCEPTED`   Client agreed, should convert to an invoice. Won pipeline.
- `REJECTED`   Client declined. Lost.
- `EXPIRED`   Passed the validity period. Lost.

**Key fields:**
- `amount`, `subtotal`, `tax`, `discount`   quote value
- `issueDate`, `createdAt`   time dimensions
- `customerName`, `customerEmail`   prospect information
- `createdBy`   staff who wrote it

### 3.3 Subscriptions (`nisc_client_subscription`, `nisc_client_subscription_renewal`)

This is the **core recurring revenue source** and the most important table for MRR/ARR calculations.

**Statuses:** `PENDING`, `ACTIVE`, `CANCELLED`, `EXPIRED`, `UPGRADED`, `DOWNGRADED`, `SUSPENDED`

**Key fields:**
- `agreedPrice` + `agreedCurrency` + `billingCycle` → MRR/ARR basis
- `agreedCost` + `agreedCostCurrency` → cost basis for gross margin
- `providerCost` + `providerCostCurrency` → provider pass-through cost
- `agreedCommissionRate` + `agreedCommissionBase` → commission model
- `pricingModel` (`FIXED` or `COMMISSION`) → billing model
- `subscriptionDate`, `nextRenewalDate`, `expiryDate` → time dimensions
- `productId` → product dimension
- `productPlanId` → plan dimension
- `teamId` → client dimension
- `upgradedToSubscriptionId`, `downgradedToSubscriptionId` → upgrade/downgrade tracking
- `autoRenew` → renewal risk flag

**`niscClientSubscriptionRenewal`** provides:
- `renewalDate`, `newExpiryDate`   renewal history
- `renewalPrice`, `providerRenewalPrice`   renewal financials
- `renewalType`   type of renewal event
- `billingCycle`   cycle at time of renewal

### 3.4 Commission Entries (`nisc_commission_entry`)

- `period`   billing period the commission is for
- `baseAmount` + `commissionRate` + `commissionAmount`   commission financials
- `status` (`DRAFT`, `INVOICED`, `PAID`, etc.)   billing state
- `teamId` → client dimension
- `subscriptionId` → subscription link
- `invoiceId` → invoice link (when billed)

### 3.5 Orders (`nisc_order`, `nisc_order_item`, `order`)

**`nisc_order`**   the new order flow (customer-initiated or staff-created):
- `status` (`PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`, `CANCELLED`)
- `total`, `subtotal`, `currency`
- `invoiceId` → linked invoice
- `niscProductPromoId` → promo used
- `paymentTransactionId` → payment link

**`order`**   the older order model (hosting/domain provisioning):
- `type` (`DOMAIN_REGISTRATION`, `HOSTING`, `HOSTING_RENEWAL`, `DOMAIN_RENEWAL`, etc.)
- `status` (`PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`, `CANCELLED`, `REFUNDED`)
- `subtotal`, `total`

### 3.6 Domains (`domain`, `domain_renewal`, `domain_transfer`)

- `registrationDate`, `expirationDate`, `renewalDate`   lifecycle dates
- `openProviderPrice`, `niscPrice`   cost vs. sell price → margin
- `teamId` → client dimension

### 3.7 Hosting (`hosting_subscription`, `hosting_renewal`, `hosting_plan`)

- `status` (`PENDING`, `ACTIVE`, `SUSPENDED`, `CANCELLED`, `EXPIRED`)
- `niscPrice`, `niscCurrency`, `billingCycle`
- `nextRenewalDate`, `expiryDate`
- `hostingType` → service type dimension
- `teamId` → client dimension

### 3.8 Payment Transactions (`payment_transaction`)

- `gateway` (`MPESA`, `BANK`, etc.)   payment channel
- `amount`, `paidAmount`, `currency`
- `status` (`PENDING`, `COMPLETED`, `FAILED`, `REFUNDED`)
- `initiatedAt`, `processedAt`, `failedAt`, `refundedAt`
- `teamId` → client dimension

### 3.9 Products (`nisc_product`, `nisc_product_plan`)

- `category` (`CLOUD`, `MARKETING`, `CONSULTING`, `CUSTOM`, `AI`)   category dimension
- `serviceType`   service type dimension
- `pricingModel` (`FIXED`, `COMMISSION`, `USAGE_BASED`)   pricing model dimension
- `price`, `cost`, `commissionRate`   financials

### 3.10 Promotions (`nisc_product_promo`, `nisc_product_promo_redeem`, `promo`)

- `discountType`, `discountValue`
- `usageCount`, `usageLimit`
- `redeemedAt`, `discountApplied`, `orderValue`   financial impact of promotions

### 3.11 Tickets (`ticket`)

- `type`, `priority`, `status`
- `createdAt`, `resolvedAt`, `closedAt`, `firstResponseAt`
- `teamId` → client dimension
- Timing fields enable SLA and response time analysis

### 3.12 Creative Assets (`creative_asset`, `creative_asset_version`)

- `status` (`DRAFT`, `IN_REVIEW`, `APPROVED`, `REJECTED`, `ARCHIVED`)
- `category`, `teamId`
- `createdAt`, `updatedAt` → velocity

### 3.13 Teams (`team`, `team_member`)

- `name`, `slug`, `baseCurrency`, `isActive`
- Member count → team size dimension

---

## 4. Report Catalogue

Every report in this catalogue follows the same principles:
- All data is queried live from the source tables on demand   no snapshot tables are required.
- All date range parameters default to a sensible window but are always overridable.
- Every filter is optional; omitting it means "all".
- **All statuses are included by default, including DRAFT.** DRAFT documents are real business activity and should appear in reports. The user can narrow results by selecting specific statuses at any time.
- When a report has a monetary "collected" or "paid" KPI, it draws only from PAID status invoices or COMPLETED transactions   but the underlying list views and counts always show everything unless filtered otherwise.
- Multi-currency data is reported in the document's native currency by default, with an optional "normalize to base currency" toggle.

---

### 4.1 Revenue & Collections Reports

#### R-01: Revenue Overview (Dashboard KPIs)

**Business question:** What is our top-line financial performance for the selected period?

**Data sources:** `invoice`, `invoice_transaction`, `invoice_credit_note`

**Metrics:**
- **Total Invoiced**   Sum of `invoice.amount` grouped by status (DRAFT, SENT, OVERDUE, PAID, etc.) so the user can see what was issued in each state within the period (by `issueDate` or `createdAt`).
- **Collected (Cash In)**   Sum of `invoice_transaction.amount` where `status = COMPLETED` and `paidAt` is within the period. This is the only figure that represents actual money received.
- **Billed but Unpaid**   Sum of `invoice.amount` for SENT + OVERDUE + PARTIALLY_PAID invoices. Money that has been sent to clients but not yet collected.
- **In Draft**   Sum of `invoice.amount` for DRAFT invoices in the period. Documents being prepared internally.
- **Net Collected Revenue**   Collected amount minus credit note amounts applied in the period (`invoice_credit_note.amount` where `appliedAt` is in the period).
- **Outstanding (Overdue)**   Sum of `invoice.amount` for SENT and OVERDUE invoices where `dueDate < today`.
- **Tax Collected**   Sum of `invoice.tax` for PAID invoices.
- **Average Invoice Value**   Total Invoiced (all non-CANCELLED) ÷ count of invoices.
- **Payment Rate**   (Paid invoices ÷ Sent invoices) × 100.

**Dimensions / Filters:** Date range (by `issueDate` or `paidAt`), team/client, currency, created_by.

**Comparison:** Period-over-period (vs. previous equivalent period), percentage change.

---

#### R-02: Revenue Trend Over Time

**Business question:** Is revenue growing, shrinking, or flat? Where are the peaks and troughs?

**Data sources:** `invoice`, `invoice_transaction`

**Output:** Time-series chart with configurable granularity (daily, weekly, monthly).

**Series available (each as a separate line/bar, all toggleable):**
- DRAFT invoice value   documents being prepared in the period
- Invoiced (SENT) amount   billed to clients
- Collected (PAID) amount   actually received
- Overdue amount   billed but past due date
- Credit notes issued

**Dimensions / Filters:** Date range, team/client, product category, service type, currency.

---

#### R-03: Revenue by Client

**Business question:** Which clients generate the most revenue? Who owes the most?

**Data sources:** `invoice`, `team`

**Output per client row:**
- Client name (`team.name` or `invoice.customerName`)
- Total invoiced across all statuses (with DRAFT count and amount broken out)
- Total collected (PAID)
- Outstanding balance (SENT + OVERDUE)
- Overdue amount
- Number of invoices (by status breakdown)
- Last invoice date
- Average days to pay (`paidAt - sentAt`, for PAID invoices only)

**Sorted by:** Total invoiced descending (configurable).

**Dimensions / Filters:** Date range, minimum invoice count, minimum amount threshold.

---

#### R-04: Revenue by Service / Product Category

**Business question:** Which services drive the most revenue?

**Data sources:** `invoice_line_item`, `nisc_client_subscription`, `nisc_product`, `nisc_product_plan`

**Output per category row:**
- Category (CLOUD, MARKETING, CONSULTING, AI, CUSTOM   plus a "Manual Invoice" catch-all for invoices not linked to a subscription)
- Total invoiced (all statuses including DRAFT)
- Total collected (PAID only)
- In draft value
- Number of subscriptions
- Number of invoices

**Note:** Line items on invoices should be matched to `nisc_client_subscription` via `nisc_order.invoiceId` → `nisc_order_item.productId` to determine the service category. Invoices not linked to any order/subscription fall into "Manual Invoice".

---

#### R-05: Accounts Receivable Aging

**Business question:** How old is our outstanding debt? Where should collections focus?

**Data sources:** `invoice`

**Scope:** All invoices with `status IN ('SENT', 'OVERDUE', 'PARTIALLY_PAID')`   DRAFT invoices have no due date context yet, CANCELLED and PAID invoices are not outstanding. DRAFT invoices can optionally be shown in a separate "Preparing" row for visibility.

**Aging buckets:**
- Current (due in the future)
- 1–30 days overdue
- 31–60 days overdue
- 61–90 days overdue
- 91–120 days overdue
- 120+ days overdue

**Per bucket:** Total amount, invoice count, list of invoices with client name, invoice number, due date, amount.

**Dimensions / Filters:** Team/client, currency.

---

#### R-06: Outstanding Invoices List

**Business question:** Which specific invoices still need to be collected?

**Data sources:** `invoice`, `team`

**Columns:** Invoice number, client name, issue date, due date, amount, currency, status, days overdue (if applicable), last reminder sent (`reminderSentAt`).

**Filters:** Status (SENT, OVERDUE, PARTIALLY_PAID), team/client, date range, overdue days threshold.

**Sorted by:** Days overdue descending.

---

### 4.2 Invoicing Reports

#### I-01: Invoice Status Summary

**Business question:** What is the distribution of invoices across all statuses?

**Data sources:** `invoice`

**Output:** Count and total amount per status bucket   **DRAFT, SENT, PAID, OVERDUE, PARTIALLY_PAID, CANCELLED, CREDITED**   all shown by default. No status is hidden. This gives the complete picture of all invoice activity in the period.

---

#### I-02: Invoice List (Filterable)

**Business question:** Give me a paginated, searchable list of invoices matching specific criteria.

**Data sources:** `invoice`, `team`

**All columns available as filters and sort keys:**  
Invoice number, client, amount, currency, status, issue date, due date, paid at, sent at, created by, KRA status.

---

#### I-03: Invoice Cycle Time Analysis

**Business question:** How quickly do we send invoices after creating them, and how quickly do clients pay?

**Data sources:** `invoice`

**Metrics:**
- **Time in Draft**   Average `sentAt - createdAt` for invoices that have a `sentAt` set. Shows how long invoices sit as DRAFT before being sent. Useful for spotting bottlenecks in the billing process.
- **Time to Pay**   Average `paidAt - sentAt` for PAID invoices. Shows client payment behaviour.
- **Percentage paid within due date**   (Invoices where `paidAt <= dueDate`) ÷ total PAID invoices × 100.
- **Currently in Draft**   Count and total value of invoices still in DRAFT status (no `sentAt`). These are created but not yet delivered to any client.

**Dimensions / Filters:** Date range, team/client.

---

#### I-04: Credit Note Report

**Business question:** How much value have we credited back to clients? Why?

**Data sources:** `invoice_credit_note`, `invoice`, `team`

**Columns:** Credit note number, linked invoice number, client, amount, reason, status, issued date, applied date.

**Aggregates:** Total credit value issued in period, total applied, total pending application.

---

#### I-05: KRA / eTIMS Compliance Report

**Business question:** Which invoices are pending KRA submission or have errors?

**Data sources:** `invoice`

**Filter scope:** All invoices that have been assigned a KRA-relevant status. DRAFT invoices are included in the "Not Submitted" bucket since they have not yet been submitted to KRA. CANCELLED invoices are excluded.

**Columns:** Invoice number, client, amount, KRA status (`kraStatus`), KRA invoice number, KRA receipt number, KRA error (if any), verified date.

**Buckets:** Verified, Pending, Failed/Error, Not Submitted.

---

### 4.3 Quotation Pipeline Reports

#### Q-01: Quotation Pipeline Overview

**Business question:** What is the full picture of our quoting activity? What value is in each stage?

**Data sources:** `quotation`

**Metrics (shown for all statuses):**
- **In Preparation (DRAFT)**   Sum of `quotation.amount` for DRAFT quotations. Value being prepared but not yet sent. This is visible pipeline work in progress.
- **Active Pipeline (SENT)**   Sum for SENT quotations. Value in the client's hands awaiting a decision.
- **Won Value (ACCEPTED)**   Sum for ACCEPTED quotations in the period.
- **Lost Value (REJECTED)**   Sum for REJECTED quotations in the period.
- **Expired Value (EXPIRED)**   Sum for EXPIRED quotations in the period.
- **Win Rate**   ACCEPTED ÷ (ACCEPTED + REJECTED + EXPIRED) × 100. Only counts decisions, not DRAFT.
- **Average Quote Value**   Won value ÷ count of ACCEPTED quotes.
- **Average Time to Decision**   For ACCEPTED/REJECTED quotes: `updatedAt - issueDate`.
- **Average Time to Send**   For quotes with `sentAt`: `sentAt - createdAt`. Shows how quickly DRAFT quotes become active.

**Dimensions / Filters:** Date range (by `issueDate`), created_by.

---

#### Q-02: Quotation Conversion Funnel

**Business question:** From creation to collected cash, how do quotations progress through the pipeline?

**Data sources:** `quotation`

**Funnel stages (all included):**
1. DRAFT   Created internally
2. SENT   Delivered to client
3. ACCEPTED   Client agreed
4. Converted to Invoice (requires matching `quotation → invoice` linkage   see Architecture notes)
5. PAID (via the linked invoice)

**Drop-off rates** are calculated at each stage transition so you can see where quotations stall or get lost.

---

#### Q-03: Quotation List

**Business question:** Give me a full list of quotations with their current status.

**Data sources:** `quotation`

**All columns as filters:** Quotation number, customer name/email, amount, currency, status, issue date, created by.

**Status filter:** All statuses shown by default (DRAFT, SENT, ACCEPTED, REJECTED, EXPIRED). User can filter to any combination. DRAFT rows are visually distinguished in the UI.

---

### 4.4 Subscription & Recurring Revenue Reports

#### S-01: MRR / ARR Dashboard

**Business question:** What is our monthly and annual recurring revenue right now?

**Data sources:** `nisc_client_subscription`, `nisc_product`, `nisc_product_plan`

**Scope:** Subscriptions with `status = 'ACTIVE'` (or optionally including PENDING).

**Calculations:**
- For `pricingModel = 'FIXED'`: Use `agreedPrice` normalized to monthly equivalent via `billingCycle`.
  - MONTHLY: `agreedPrice × 1`
  - YEARLY: `agreedPrice ÷ 12`
  - BIENNIALLY: `agreedPrice ÷ 24`
- For `pricingModel = 'COMMISSION'`: Use the most recent `niscCommissionEntry.commissionAmount` for that subscription.

**MRR breakdown by category:** Sum MRR contributions grouped by `nisc_product.category`.

**MRR by client:** Sum MRR contributions grouped by `nisc_client_subscription.teamId`.

**ARR = MRR × 12**

---

#### S-02: MRR Movement (Waterfall)

**Business question:** How did our MRR change this month? What drove the change?

**Data sources:** `nisc_client_subscription`

**Tracks changes between two periods:**
- **New MRR**   MRR from subscriptions where `subscriptionDate` is within the period.
- **Expansion MRR**   MRR increase from upgrades (`upgradedToSubscriptionId` set in period; new plan price minus old plan price).
- **Contraction MRR**   MRR decrease from downgrades.
- **Churned MRR**   MRR lost from subscriptions where `status` changed to CANCELLED or EXPIRED in the period.
- **Net MRR Change**   New + Expansion − Contraction − Churned.

---

#### S-03: Subscription Status Summary

**Business question:** How many subscriptions do we have, and what is their health?

**Data sources:** `nisc_client_subscription`, `nisc_product`

**Output:** Count and MRR contribution per status (ACTIVE, PENDING, CANCELLED, EXPIRED, SUSPENDED).

**Dimensions / Filters:** Date (as of date), product category, billing cycle, team/client.

---

#### S-04: Subscription List

**Business question:** Show me all subscriptions matching specific criteria.

**Data sources:** `nisc_client_subscription`, `nisc_product`, `nisc_product_plan`, `team`

**Columns:** Client, product name, plan name, pricing model, agreed price, billing cycle, status, subscription date, next renewal, expiry, commission rate.

**Filters:** Status, category, billing cycle, next renewal within X days, team/client.

---

#### S-05: Upcoming Renewals Forecast

**Business question:** What renewals are due in the coming days? What revenue should they generate?

**Data sources:** `nisc_client_subscription`, `nisc_client_subscription_renewal`, `hosting_subscription`, `hosting_renewal`, `domain`, `domain_renewal`

**Output per upcoming renewal:**
- Client name
- Product / service name
- Type (Subscription / Hosting / Domain)
- Renewal date
- Expected renewal price
- Billing cycle
- Auto-renew flag
- Status (scheduled, at-risk if `autoRenew = false`)

**Filters:** Renewal date range (default: next 30 / 60 / 90 days), type, team/client.

---

#### S-06: Churn Analysis

**Business question:** Who is cancelling? Why (if tracked)? What was their value?

**Data sources:** `nisc_client_subscription`

**Scope:** Subscriptions where status changed to CANCELLED or EXPIRED in the selected period.

**Per churned subscription:** Client, product, plan, agreed price, billing cycle, subscription start date, churn date, MRR lost, tenure (days active).

**Aggregates:** Total churned MRR, churn rate (churned MRR ÷ beginning-of-period MRR × 100), average tenure of churned subscriptions.

---

#### S-07: Subscription Upgrade / Downgrade Report

**Business question:** How are clients changing their service tiers?

**Data sources:** `nisc_client_subscription`

**Scope:** Subscriptions where `upgradedToSubscriptionId` or `downgradedToSubscriptionId` is set and the event occurred within the period.

**Columns:** Client, original product/plan, new product/plan, change type (upgrade/downgrade), price delta, event date.

---

### 4.5 Client Reports

#### C-01: Client Revenue Summary

**Business question:** Give me a 360° financial picture for a specific client.

**Data sources:** `team`, `invoice`, `nisc_client_subscription`, `nisc_order`, `payment_transaction`, `quotation`

**Per client:**
- Total invoiced (lifetime and period)
- Total paid
- Outstanding balance
- Active subscriptions + MRR
- Total orders placed
- Quotation pipeline value
- Payment history summary
- Last activity date

---

#### C-02: Client Retention / Cohort Analysis

**Business question:** Of clients who subscribed in a given month, how many are still with us after 3 / 6 / 12 months?

**Data sources:** `nisc_client_subscription`

**Cohort:** Month of first subscription (`subscriptionDate`).

**Tracked for each cohort:** % of subscriptions still ACTIVE at 1, 3, 6, 12 months after cohort start.

---

#### C-03: New vs. Returning Clients

**Business question:** How many clients are genuinely new vs. existing clients who bought more?

**Data sources:** `team`, `invoice`, `nisc_order`, `nisc_client_subscription`

**Definition:**
- **New client**   First invoice or subscription created in the period (no prior records under their `teamId`).
- **Returning client**   Had prior invoices or subscriptions before the period start.

**Metrics:** Count of new clients, count of returning clients, revenue from each group.

---

### 4.6 Product & Service Performance Reports

#### P-01: Product / Plan Sales Ranking

**Business question:** Which products and plans are selling the most?

**Data sources:** `nisc_order_item`, `nisc_client_subscription`, `nisc_product`, `nisc_product_plan`

**Columns:** Product name, plan name, category, new subscriptions in period, total active subscriptions, total revenue (from linked invoices), average selling price vs. list price, discount rate.

---

#### P-02: Service Category Revenue Breakdown

**Business question:** What percentage of revenue comes from Cloud, Marketing, Consulting, AI, etc.?

**Data sources:** `nisc_client_subscription`, `nisc_product`, `invoice`

**Output:** Pie/bar chart of MRR and collected revenue by `nisc_product.category`.

---

#### P-03: Billing Cycle Distribution

**Business question:** What proportion of our subscriptions and revenue are on monthly vs. annual billing?

**Data sources:** `nisc_client_subscription`

**Output:** Count and MRR per billing cycle (MONTHLY, YEARLY, BIENNIALLY, CUSTOM) for ACTIVE subscriptions.

---

### 4.7 Commission & Profitability Reports

#### M-01: Gross Margin by Subscription

**Business question:** After paying our costs, how much do we actually make?

**Data sources:** `nisc_client_subscription`, `nisc_product_plan`

**Calculation per subscription:**
- **Revenue:** `agreedPrice` (normalized to monthly)
- **Cost:** `agreedCost` (normalized to monthly)
- **Gross Margin:** (Revenue − Cost) ÷ Revenue × 100

**Grouped by:** Product category, client, billing cycle.

**Important caveat:** Only FIXED pricing model subscriptions have meaningful margin data. COMMISSION model subscriptions use commission entries instead.

---

#### M-02: Commission Report

**Business question:** What commission amounts have been earned, billed, and paid in the period?

**Data sources:** `nisc_commission_entry`, `nisc_client_subscription`, `team`

**Columns:** Client, subscription, product/plan, period, base amount, commission rate, commission amount, status, linked invoice number.

**Status buckets:** DRAFT (calculated but not yet billed), INVOICED (billed), PAID (collected).

**Aggregates:** Total commission earned, total billed, total collected, total pending.

**Filters:** Period, team/client, status, product.

---

#### M-03: Provider Cost vs. Client Price (Domain/Hosting)

**Business question:** On domain registrations, renewals, and hosting, what is our markup?

**Data sources:** `domain` (`openProviderPrice` vs. `niscPrice`), `domain_renewal`, `hosting_subscription` (`niscPrice`), `hosting_renewal`

**Per record:** Domain/hosting name, client, provider cost, Nisc selling price, margin (KES and %), transaction date.

---

### 4.8 Order & Fulfilment Reports

#### O-01: Order Volume & Value

**Business question:** How many orders have been placed? What is their total value and fulfilment status?

**Data sources:** `nisc_order`, `order`

**Metrics:** Order count by status (PENDING, PROCESSING, COMPLETED, FAILED, CANCELLED), total order value, average order value, fulfilment rate.

**Filters:** Date range (`createdAt`), status, team/client, promo used.

---

#### O-02: Failed Order Analysis

**Business question:** Which orders failed and why? How much revenue did we lose?

**Data sources:** `nisc_order`, `nisc_order_processing_log`

**Columns:** Order number, client, total, product items, failure reason, date failed, processing log steps.

**Aggregate:** Total value of failed orders in period.

---

#### O-03: Orders with Promo Usage

**Business question:** How many orders used a promotional code? What was the discount impact?

**Data sources:** `nisc_order`, `nisc_product_promo`, `nisc_product_promo_redeem`

**Columns:** Order number, client, promo code, discount type, discount applied, original order value, final order value.

**Aggregate:** Total discount given via promos in the period.

---

### 4.9 Domain Portfolio Reports

#### D-01: Domain Portfolio Overview

**Business question:** How many domains do we manage? What are their statuses and renewal dates?

**Data sources:** `domain`, `nisc_client_subscription` (where product serviceType = DOMAIN)

**Metrics:** Total domains managed, expiring in next 30/60/90 days, recently registered, recently expired.

---

#### D-02: Domain Renewals Report

**Business question:** What domain renewals happened in the period? What revenue did they generate?

**Data sources:** `domain_renewal`

**Columns:** Domain name, client (`teamId`), renewal date, OpenProvider cost, NISC price, margin, renewed by.

**Aggregates:** Total renewal revenue, total cost, total margin, renewal count.

---

#### D-03: Expiring Domains (Risk Report)

**Business question:** Which client domains are expiring soon and have not been renewed?

**Data sources:** `domain`

**Scope:** Domains where `expirationDate` is within the next N days.

**Risk flag:** Domains where `autoRenew = false` on the linked `nisc_client_subscription`.

**Columns:** Domain name, client, expiration date, days to expiry, TLD, auto-renew status.

---

### 4.10 Hosting Reports

#### H-01: Hosting Subscription Overview

**Business question:** How many hosting accounts are we managing? What is their ARR?

**Data sources:** `hosting_subscription`, `hosting_plan`

**Metrics:** Count by status, count by hosting type, total MRR from hosting (sum of `niscPrice` normalized by `billingCycle`).

---

#### H-02: Hosting Renewals Report

**Business question:** What hosting renewals happened in the period? What is upcoming?

**Data sources:** `hosting_renewal`, `hosting_subscription`

**Columns:** Client, primary domain, hosting type, renewal date, expiry date, billing cycle, NISC price, invoice number.

**Aggregates:** Total renewal revenue for the period.

---

#### H-03: Expiring Hosting Accounts

**Business question:** Which hosting subscriptions are expiring soon?

**Data sources:** `hosting_subscription`

**Scope:** `expiryDate` within next N days. Flag accounts where `autoRenew = false`.

---

### 4.11 Promotional & Discount Reports

#### PR-01: Promo Code Performance

**Business question:** Which promo codes are being used? How much revenue are we discounting away?

**Data sources:** `nisc_product_promo`, `nisc_product_promo_redeem`, `promo`

**Per promo code:**
- Code, name, discount type, discount value
- Usage count vs. limit
- Total discount amount given (`discountApplied` sum)
- Total order value at time of redemption (`orderValue` sum)
- Effective discount rate
- Date range of usage

**Sorted by:** Total discount amount descending.

---

#### PR-02: Discount Impact on Revenue

**Business question:** What would revenue have been without discounts?

**Data sources:** `nisc_product_promo_redeem`, `invoice`

**Metric:**
- Actual revenue collected
- Total discounts applied (from promo redeems + invoice-level discounts from `invoice.discount`)
- Gross revenue before discounts

---

### 4.12 Payment & Gateway Reports

#### PY-01: Payment Method Breakdown

**Business question:** How are clients paying us? What channels are most used?

**Data sources:** `invoice_transaction`

**Output:** Count and total amount per `method` (M-PESA, bank transfer, card, cash, etc.).

---

#### PY-02: Payment Gateway Performance

**Business question:** How reliable are our payment gateways? What is the failure rate?

**Data sources:** `payment_transaction`

**Per gateway:** Total initiated, completed, failed, refunded. Success rate, average processing time (`processedAt - initiatedAt`).

---

#### PY-03: Failed / Pending Transactions

**Business question:** Which payment transactions are stuck or failed and need attention?

**Data sources:** `payment_transaction`

**Scope:** `status IN ('PENDING', 'FAILED')`.

**Columns:** Client, gateway, amount, reference number, initiated date, status, error message, phone number.

**Flag:** Transactions pending for more than 24 hours.

---

#### PY-04: Refund Report

**Business question:** How much have we refunded? To whom and why?

**Data sources:** `payment_transaction` (status = REFUNDED), `invoice_credit_note`

**Columns:** Client, refund amount, refund date, gateway, original transaction reference.

**Aggregates:** Total refunded in period.

---

### 4.13 Tax & Compliance Reports

#### T-01: Tax Summary

**Business question:** How much VAT/tax did we collect in the period? (For statutory reporting.)

**Data sources:** `invoice`

**Scope:** PAID invoices in the period. Tax is only legally collectible on invoices that have been paid. DRAFT and SENT invoice tax figures are shown separately as "pending tax" (billed but not yet collected).

**Metrics:**
- Total taxable amount (sum of `invoice.subtotal`)
- Total VAT collected (sum of `invoice.vat`)
- Total tax collected (sum of `invoice.tax`)
- By tax rate (`taxPercentage` grouping)

---

#### T-02: KRA / eTIMS Submission Status

**Business question:** Which invoices have been successfully submitted to KRA? Which are pending or failed?

**Data sources:** `invoice`

**Scope:** All non-CANCELLED invoices. DRAFT invoices appear in the "Not Submitted" bucket since KRA submission only happens on sent/paid documents. This allows staff to see what still needs to be processed as invoices progress from DRAFT to PAID.

**Columns:** Invoice number, client, amount, issue date, KRA status, KRA invoice number, KRA receipt number, KRA QR code available, KRA error (if any), verified date.

**Buckets:** Verified, Pending, Failed, Not Configured.

---

### 4.14 Creative Production Reports

#### CR-01: Asset Production Summary

**Business question:** How many creative assets did we produce? How fast?

**Data sources:** `creative_asset`, `creative_asset_version`

**Metrics:**
- Assets created in period (by `createdAt`)
- Assets currently in each status (DRAFT, IN_REVIEW, APPROVED, REJECTED, ARCHIVED)
- Assets approved in period (by approval event timestamp)
- Versions created per asset (average and total)
- Average days from creation to first approval (`approvedAt - createdAt`)

**Dimensions / Filters:** Date range, team/client, category.

---

#### CR-02: Creative Asset by Client

**Business question:** How much creative work have we done for each client?

**Data sources:** `creative_asset`, `team`

**Per client:** Asset count, approved count, rejected count, pending count, average turnaround time.

---

### 4.15 Support & Ticket Reports

#### ST-01: Ticket Volume & Resolution Summary

**Business question:** How many support tickets do we receive? How quickly do we resolve them?

**Data sources:** `ticket`

**Metrics:**
- New tickets in period
- Resolved tickets in period
- Open tickets (as of now)
- Average First Response Time (`firstResponseAt - createdAt`)
- Average Resolution Time (`resolvedAt - createdAt`)
- SLA breach rate (configurable threshold)

**By type:** GENERAL, BILLING, TECHNICAL, etc.
**By priority:** LOW, NORMAL, HIGH, URGENT.

---

#### ST-02: Tickets by Client

**Business question:** Which clients generate the most support load?

**Data sources:** `ticket`, `team`

**Per client:** Total tickets, open tickets, average resolution time, tickets by priority.

---

### 4.16 Team & User Activity Reports

#### U-01: Staff Invoice Creation Activity

**Business question:** Which team members are creating invoices and quotes? How productive are they?

**Data sources:** `invoice`, `quotation`, `invoice_activity_log`, `quotation_activity_log`

**Per staff member:** Invoices created, quotations created, invoices sent, total value invoiced.

---

#### U-02: Audit Trail Report

**Business question:** What changes were made to invoices, subscriptions, or payments and by whom?

**Data sources:** `invoice_activity_log`, `nisc_client_subscription_activity_log`, `payment_transaction_activity_log`, `invoice_transaction_activity_log`

**Columns:** Entity type, entity ID/number, action, description, performed by, IP address, timestamp.

**Filters:** Entity type, action, user, date range.

---

## 5. Flexible Filtering System

Every report in the catalogue must accept a standardized filter object. This is the foundation of the "flexible, not fixed" requirement.

```typescript
type ReportFilters = {
  // Time dimension
  from: Date;
  to: Date;
  granularity?: "DAILY" | "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY";

  // Entity dimensions
  teamIds?: string[];           // filter to specific clients/companies
  productIds?: string[];        // filter to specific products
  productCategories?: (         // filter to product categories
    | "CLOUD"
    | "MARKETING"
    | "CONSULTING"
    | "CUSTOM"
    | "AI"
  )[];
  serviceTypes?: string[];      // filter to service types
  billingCycles?: (
    | "MONTHLY"
    | "YEARLY"
    | "BIENNIALLY"
    | "CUSTOM"
  )[];

  // Financial dimensions
  currency?: string;            // filter to specific currency (default: show all)
  normalizeToCurrency?: string; // convert all amounts to this currency

  // Status dimensions   when omitted, ALL statuses are returned including DRAFT
  // Pass a non-empty array to restrict to those specific statuses only
  invoiceStatuses?: string[];        // e.g. ["PAID"] or ["SENT", "OVERDUE"] or ["DRAFT"]
  subscriptionStatuses?: string[];
  orderStatuses?: string[];
  quotationStatuses?: string[];

  // Pagination
  page?: number;
  pageSize?: number;

  // Sorting (column key + direction)
  sortBy?: string;
  sortDir?: "ASC" | "DESC";
};
```

**Key rules:**

1. **Status filters default to ALL.** When `invoiceStatuses` is not provided, the query returns invoices of every status including DRAFT. The caller (UI) decides which statuses to show   the API never pre-filters unless explicitly told to.

2. **KPI metrics distinguish status clearly.** Even when a report returns all statuses, the aggregated KPI values (e.g. "Total Collected") always filter to the relevant status (PAID) internally. The status-inclusive data is for the breakdown/list   not for conflating all invoices into one revenue number.

3. **No magic exclusions.** There is no global `includeDraft` toggle because it implies DRAFT is something to hide. Instead, status is just a filter dimension like any other. If a particular view only makes sense for PAID invoices (e.g. tax collected), that is documented per-report   not enforced globally.

---

## 6. Architecture Approach

### 6.1 Computation Strategy   Live Queries Only

**All reports query the source tables directly, on demand. No new snapshot or materialization tables are created.**

The existing `reporting.*` tables (`sales_report_snapshot`, `revenue_by_service_snapshot`, etc.) are legacy infrastructure from the old implementation. The new system does not write to or read from them. They can be deprecated over time.

**Why live queries work:**
- The key tables (`invoice`, `nisc_client_subscription`, `quotation`, `domain`, etc.) are all indexed on the columns used for filtering   `createdAt`, `issueDate`, `dueDate`, `teamId`, `status`, `productId`.
- Drizzle ORM's `groupBy`, `sum`, `count`, `avg` push aggregation down to PostgreSQL, which handles it efficiently.
- For most real-world business data volumes (thousands to low-tens-of-thousands of records per table), live aggregation with proper indexes returns in well under one second.
- If a specific query becomes noticeably slow as data grows, a targeted PostgreSQL index or a server-side computed field can be added without rearchitecting the entire reporting module.

**Approach per report type:**

| Type | Strategy |
|---|---|
| **KPI cards / overview** | Single tRPC query with `count()` and `sum()` aggregations, filtered by the request's date range and status filters. Runs live each time. |
| **List / detail views** | Paginated `findMany` with `where` + `orderBy`. |
| **Time-series trend** | `groupBy` on date-truncated `issueDate` / `createdAt` / `paidAt`, returning one row per day/week/month. |
| **Cross-entity reports** (e.g. revenue by category requires joining invoice → order → product) | Single SQL join query via Drizzle. |
| **CSV / PDF export** | Same query as the UI view but without pagination, streamed to file. |

### 6.2 tRPC Router Structure

```
reportsRouter
├── sales
│   ├── overview          (R-01 KPIs)
│   ├── trend             (R-02 time-series)
│   ├── byClient          (R-03)
│   ├── byCategory        (R-04 / P-02)
│   └── aging             (R-05 / R-06)
│
├── invoices
│   ├── statusSummary     (I-01)
│   ├── list              (I-02)
│   ├── cycleTime         (I-03)
│   ├── creditNotes       (I-04)
│   └── kraCompliance     (I-05 / T-02)
│
├── quotations
│   ├── pipeline          (Q-01)
│   ├── conversionFunnel  (Q-02)
│   └── list              (Q-03)
│
├── subscriptions
│   ├── mrrDashboard      (S-01)
│   ├── mrrMovement       (S-02)
│   ├── statusSummary     (S-03)
│   ├── list              (S-04)
│   ├── renewalForecast   (S-05)
│   ├── churn             (S-06)
│   └── upgrades          (S-07)
│
├── clients
│   ├── summary           (C-01)
│   ├── cohortRetention   (C-02)
│   └── newVsReturning    (C-03)
│
├── products
│   ├── ranking           (P-01)
│   └── billingCycleDist  (P-03)
│
├── profitability
│   ├── grossMargin       (M-01)
│   ├── commission        (M-02)
│   └── domainHostingMargin (M-03)
│
├── orders
│   ├── summary           (O-01)
│   ├── failed            (O-02)
│   └── withPromo         (O-03)
│
├── domains
│   ├── portfolio         (D-01)
│   ├── renewals          (D-02)
│   └── expiring          (D-03)
│
├── hosting
│   ├── overview          (H-01)
│   ├── renewals          (H-02)
│   └── expiring          (H-03)
│
├── promos
│   ├── performance       (PR-01)
│   └── revenueImpact     (PR-02)
│
├── payments
│   ├── methodBreakdown   (PY-01)
│   ├── gatewayPerf       (PY-02)
│   ├── failedPending     (PY-03)
│   └── refunds           (PY-04)
│
├── tax
│   └── summary           (T-01)
│
├── creative
│   ├── productionSummary (CR-01)
│   └── byClient          (CR-02)
│
├── support
│   ├── ticketSummary     (ST-01)
│   └── byClient          (ST-02)
│
└── activity
    ├── staffInvoicing    (U-01)
    └── auditTrail        (U-02)
```

### 6.3 Handling Multi-Currency

The system records amounts in multiple currencies (primarily KES, but others appear in `nisc_product_plan.currency`, `nisc_client_subscription.agreedCurrency`, etc.).

**Rule:**
- By default, each report shows amounts in their native currency and groups them.
- When `normalizeToCurrency` is specified, amounts are converted using an exchange rate. The exchange rate source needs to be determined (static config, ECB feed, or manual entry in a future `exchange_rate` table).
- For now, reports that need a single consolidated figure should default to KES and note that multi-currency figures may be shown separately.

### 6.4 Status Filter Implementation

Every query that computes aggregations uses the `invoiceStatuses` (or equivalent) filter from `ReportFilters`. When the filter array is empty or omitted, no `WHERE status IN (...)` clause is added and all statuses are returned.

```typescript
// Shared helper used by all invoice-related report queries
function buildInvoiceStatusCondition(statuses?: string[]) {
  if (!statuses || statuses.length === 0) {
    return undefined; // no filter   all statuses returned, including DRAFT
  }
  return inArray(invoice.status, statuses);
}

// Example usage in a report procedure:
const condition = and(
  gte(invoice.createdAt, filters.from),
  lte(invoice.createdAt, filters.to),
  buildInvoiceStatusCondition(filters.invoiceStatuses),
  filters.teamIds?.length ? inArray(invoice.teamId, filters.teamIds) : undefined,
);
```

**KPI metrics that need a specific status always pass it explicitly** rather than relying on a global default:

```typescript
// "Collected revenue"   always PAID, regardless of UI filter
const collected = await db
  .select({ total: sum(invoiceTransaction.amount) })
  .from(invoiceTransaction)
  .where(and(
    eq(invoiceTransaction.status, "COMPLETED"),
    gte(invoiceTransaction.paidAt, filters.from),
    lte(invoiceTransaction.paidAt, filters.to),
  ));

// "Invoice count by status"   passes no status filter, returns all
const byStatus = await db
  .select({ status: invoice.status, count: count(), total: sum(invoice.amount) })
  .from(invoice)
  .where(and(
    gte(invoice.createdAt, filters.from),
    lte(invoice.createdAt, filters.to),
  ))
  .groupBy(invoice.status);
```

This approach means DRAFT invoices show up in the count and amount breakdowns, but they never inflate the "collected" or "paid" KPIs.

---

## 7. Status Definitions Reference

The following is a canonical reference for all status values referenced in this document.

### Invoice Statuses

All statuses appear in reports. The table below clarifies which KPI bucket each status contributes to.

| Status | Meaning | Counts as "Collected"? | Counts as "Billed / Receivable"? | Counts as "In Preparation"? |
|---|---|---|---|---|
| `DRAFT` | Created, not yet sent to client | No | No | **Yes** |
| `SENT` | Sent to client, awaiting payment | No | **Yes** | No |
| `PAID` | Fully collected | **Yes** | No | No |
| `OVERDUE` | Past due, not paid | No | **Yes (at-risk)** | No |
| `PARTIALLY_PAID` | Partial payment received | Partial only | **Yes (remainder)** | No |
| `CANCELLED` | Voided | No | No | No |
| `CREDITED` | Reversed via credit note | Subtract credit amount | No | No |

### Quotation Statuses

All statuses appear in reports.

| Status | Meaning | Counts as "Active Pipeline"? | Counts as "In Preparation"? |
|---|---|---|---|
| `DRAFT` | Created, not yet sent to client | No | **Yes** |
| `SENT` | Delivered to client | **Yes** | No |
| `ACCEPTED` | Client agreed (won) | **Yes (won)** | No |
| `REJECTED` | Client declined (lost) | No | No |
| `EXPIRED` | Validity passed (lost) | No | No |

### Subscription Statuses

| Status | Meaning | Count in MRR? |
|---|---|---|
| `PENDING` | Created, provisioning in progress | No (optionally yes, configurable) |
| `ACTIVE` | Fully live | Yes |
| `SUSPENDED` | Temporarily halted | Configurable (excluded by default) |
| `CANCELLED` | Terminated by client or us | No |
| `EXPIRED` | Passed expiry date without renewal | No |
| `UPGRADED` | Replaced by a higher-tier subscription | No (count new sub instead) |
| `DOWNGRADED` | Replaced by a lower-tier subscription | No (count new sub instead) |

### Payment Transaction Statuses

| Status | Meaning | Count as Cash Received? |
|---|---|---|
| `PENDING` | Awaiting gateway confirmation | No |
| `COMPLETED` | Successfully processed | Yes |
| `FAILED` | Gateway error | No |
| `REFUNDED` | Money returned to customer | Subtract from received |

---

*This document covers all report types that can be built from the existing database schemas without schema changes and without introducing any new tables. All computation is done via live queries against the source tables. Future schema additions (e.g. a quotation-to-invoice conversion link field, an exchange rate table, a churn reason field on subscriptions) would unlock additional report variants and drill-downs but are not required for the initial implementation.*
