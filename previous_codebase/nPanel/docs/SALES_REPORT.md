# Sales & Revenue Report   Documentation

This document describes the **Sales & Revenue Report** in nPanel: what each metric means, how it is derived, and how it helps the business make decisions.

---

## 1. Overview

### Purpose

The Sales Report gives a single place to see **revenue health**, **subscription performance**, **invoicing and collections**, **acquisition and pipeline**, and **customer behaviour**. All numbers are **aggregated in real time** from your existing data (invoices, Nisc orders, Nisc client subscriptions, products, teams). No separate “report tables” are written to; the report reads and sums live data.

### Data sources

| Source | Used for |
|--------|----------|
| **Invoice** | Paid/invoiced amounts, status, dates, team, tax, discount |
| **InvoiceLineItem** | (Legacy snapshot reports; overview uses subscriptions/orders) |
| **InvoiceTransaction** | Payment method breakdown |
| **CreditNote** | Credits issued in period |
| **NiscOrder** | Order pipeline, conversion, promo usage |
| **NiscOrderItem** | Product/plan per order |
| **NiscClientSubscription** | MRR, active counts, tenure, renewals due, churn, upgrades/downgrades |
| **NiscClientSubscriptionRenewal** | Domain (and other) renewal events |
| **NiscProduct** / **NiscProductPlan** | Category, product name, plan name, cost (for margin) |
| **Team** | Revenue by company, customer count |

### Report tabs

The UI is organised into **7 tabs**:

1. **Overview**   Executive KPIs, MRR by category, revenue trend, subscriptions, invoicing health, commission, revenue by company.
2. **Revenue**   Revenue by product/plan, billing mix, average deal size, revenue concentration.
3. **Retention**   Churn, tenure, upgrades/downgrades, auto-renew, renewals due, expiring soon.
4. **Invoicing**   Payment velocity, overdue aging, invoice status mix, tax & credits, revenue by payment method.
5. **Pipeline**   New customers, order pipeline & conversion, promo effectiveness, new subscriptions by product.
6. **Customers**   Margin by category, multi-product customers, top customers trend, at-risk customers.
7. **Comparisons**   Month-over-month, year-over-year, annual run rate.

---

## 2. Overview tab

### 2.1 Monthly Recurring Revenue (MRR)

**What it is**  
Total recurring revenue from **active** subscriptions, normalised to a **monthly** amount.

**How it’s derived**  
All `NiscClientSubscription` with status `ACTIVE` (and not upgraded/downgraded) are included. For **FIXED** pricing, `agreedPrice` is converted to monthly using `billingCycle` (e.g. yearly ÷ 12). Commission-based subscriptions are counted in subscription numbers but do not add to MRR until a “base” amount is recorded.

**Why it’s useful**  
MRR is the standard measure of predictable subscription revenue. It answers: *“How much recurring revenue do we have right now?”* and drives growth targets and runway.

---

### 2.2 MRR change vs previous month

**What it is**  
Percentage and absolute change in MRR compared to the **previous month**.

**How it’s derived**  
Previous month MRR is approximated as: *current MRR − new MRR (this month) + lost MRR (this month)*. The change is then (current − previous) / previous as a percentage, plus the amount in currency.

**Why it’s useful**  
Shows whether the subscription base is growing or shrinking and by how much, without needing historical snapshots.

---

### 2.3 New MRR (this month)

**What it is**  
MRR from subscriptions whose **start date** (`subscriptionDate`) falls in the **current month**.

**How it’s derived**  
Subscriptions with `subscriptionDate` in the current month; their agreed price is normalised to monthly (same logic as MRR).

**Why it’s useful**  
Measures **acquisition** impact on recurring revenue. Helps compare sales and marketing efforts month to month.

---

### 2.4 Lost MRR (this month)

**What it is**  
MRR that left in the current month because subscriptions were **cancelled or expired**.

**How it’s derived**  
Subscriptions with status `CANCELLED` or `EXPIRED` and `updatedAt` in the current month; their last agreed price is normalised to monthly.

**Why it’s useful**  
Quantifies **churn** in revenue terms. High lost MRR drives focus on retention, offboarding reasons, and win-back.

---

### 2.5 Customers (with revenue)

**What it is**  
Count of **customers** (teams) that either have at least one active subscription or at least one paid invoice in the selected period.

**How it’s derived**  
Distinct `teamId` from active subscriptions plus distinct `teamId` from paid invoices in the date range.

**Why it’s useful**  
Denominator for “revenue per customer” and scale of the paying base. Combined with MRR it supports ARPC (see below).

---

### 2.6 Average Revenue Per Customer (ARPC)

**What it is**  
MRR divided by the number of **customers (teams)** with revenue.

**How it’s derived**  
`ARPC = total MRR ÷ customer count` (customers as defined above).

**Why it’s useful**  
Shows typical revenue per account. Rising ARPC indicates upsell or better-fit customers; falling ARPC can indicate downgrades or mix shift.

---

### 2.7 MRR by category

**What it is**  
MRR broken down by **product category**: Cloud (domains, hosting), Marketing, Consulting, Custom.

**How it’s derived**  
Each active subscription is attributed to its product’s `category`; that subscription’s monthly value is added to that category’s MRR and count.

**Why it’s useful**  
Reveals which **lines of business** drive recurring revenue and where to invest or rebalance.

---

### 2.8 Revenue trend (paid)

**What it is**  
For each of the last 12 months: **paid revenue** (invoices with status PAID and payment in that month), plus optional invoiced amount and invoice counts.

**How it’s derived**  
Invoices grouped by month (from `createdAt` or `paidAt`); for each month we sum paid amount, invoiced amount, and count of invoices / paid invoices.

**Why it’s useful**  
Shows **trend and seasonality** of cash collected. Compare paid vs invoiced to see collection lag.

---

### 2.9 Active subscriptions

**What it is**  
Counts of **active** subscriptions by type: **web hosting**, **email hosting**, and **total active** (optionally by category).

**How it’s derived**  
Active subscriptions (same as for MRR) filtered by `hostingType` (e.g. `WEB_HOSTING`, `EMAIL_HOSTING`) and by product category.

**Why it’s useful**  
Shows **product mix** and capacity (e.g. how many web vs email hosting accounts). Supports capacity and product strategy.

---

### 2.10 Domain renewal rate

**What it is**  
Among domains **due for renewal** in the current month, the **percentage that were renewed**.

**How it’s derived**  
- **Due:** Active domain subscriptions (product type = domain) with `nextRenewalDate` in the month.  
- **Renewed:** `NiscClientSubscriptionRenewal` with `renewalType = DOMAIN` and `renewalDate` in the month.  
- **Rate** = renewed ÷ due (as a percentage).

**Why it’s useful**  
Measures **domain retention**. Low rate suggests renewal reminders, pricing, or UX issues.

---

### 2.11 Invoicing health

**What it is**  
Summary of **invoicing and collections** for the current month and overall: invoiced this month, paid this month, number of overdue invoices, total **outstanding (A/R)**.

**How it’s derived**  
- Invoiced/paid this month: from invoices with `createdAt` in the month; paid = those with status PAID.  
- Overdue: count of invoices with status OVERDUE (or due date in the past and not paid).  
- Outstanding: sum of amounts for invoices not PAID, CANCELLED, or WRITTEN_OFF.

**Why it’s useful**  
Answers *“How much did we invoice and collect this month?”* and *“How much is still owed?”*. Drives cash flow and collection actions.

---

### 2.12 Commission (agency fees)

**What it is**  
Number of **commission-based** subscriptions and, when base data exists, **estimated agency fees** (e.g. % of ad spend).

**How it’s derived**  
Count of active subscriptions with `pricingModel = COMMISSION`. Fee amount would be base × agreed rate when base (e.g. ad spend) is stored; otherwise only count is shown.

**Why it’s useful**  
Shows how much revenue comes from **variable/commission** products and whether fee income is being tracked.

---

### 2.13 Revenue by company (paid in period)

**What it is**  
Total **paid** invoice amount per **team** (company) in the selected date range, with share of total and optional top N.

**How it’s derived**  
Paid invoices in the period grouped by `teamId`; sum of amounts and percentage of total paid.

**Why it’s useful**  
Identifies **largest customers** and concentration. Supports account management and “revenue by company” views.

---

## 3. Revenue tab

### 3.1 Revenue by product

**What it is**  
MRR and subscription count per **product** (e.g. Web Hosting, SEO, Domains).

**How it’s derived**  
Active subscriptions grouped by `productId`; MRR and count per product, sorted by MRR.

**Why it’s useful**  
Shows which **products** earn the most recurring revenue and where to focus sales and product effort.

---

### 3.2 Revenue by plan

**What it is**  
MRR and count per **plan** (e.g. Starter, Pro, Enterprise) within each product.

**How it’s derived**  
Active subscriptions grouped by `productPlanId` (and product name); MRR and count per plan.

**Why it’s useful**  
Reveals which **tiers** sell best and supports pricing and packaging decisions.

---

### 3.3 Billing mix

**What it is**  
Share of MRR and count of subscriptions by **billing cycle**: Monthly, Yearly, Bienially, Custom.

**How it’s derived**  
Active subscriptions grouped by `billingCycle`; MRR and count per cycle; percentage of total MRR per cycle.

**Why it’s useful**  
Shows whether revenue is mostly monthly vs annual. More annual improves cash flow and often retention.

---

### 3.4 Average deal size

**What it is**  
**Mean** and **median** paid invoice amount in the selected period.

**How it’s derived**  
From paid invoices in the period: mean = sum of amounts ÷ count; median = middle value when amounts are sorted.

**Why it’s useful**  
Typical **transaction size**. Helps set targets and compare segments or time periods.

---

### 3.5 Revenue concentration

**What it is**  
Percentage of **total paid revenue** (in the period) that comes from the **top 5** and **top 10** teams (by paid amount).

**How it’s derived**  
Teams sorted by paid amount; sum of top 5 and top 10 as amount and as % of total paid in period.

**Why it’s useful**  
Measures **customer concentration risk**. High concentration means a few accounts drive most revenue; diversification may be needed.

---

## 4. Retention tab

### 4.1 Churn rate

**What it is**  
Among subscriptions that were **active at the start** of the month, the **percentage that churned** (cancelled or expired) during the month.

**How it’s derived**  
Churned = subscriptions that became CANCELLED/EXPIRED in the month (by `updatedAt`). Active at start ≈ current active + churned − new. Rate = churned ÷ active at start.

**Why it’s useful**  
Core **retention** metric. High churn drives focus on product, support, and retention actions.

---

### 4.2 Subscription tenure

**What it is**  
Distribution of **active** subscriptions by **age**: 0–3 months, 3–6, 6–12, 12+ months since start.

**How it’s derived**  
Months since `subscriptionDate` (or `createdAt`) for each active subscription; counted into buckets.

**Why it’s useful**  
Shows **stability** of the base: more long-tenure subs usually means healthier retention and predictable revenue.

---

### 4.3 Upgrades vs downgrades

**What it is**  
Count and **MRR impact** of subscriptions that were **upgraded** or **downgraded** in the current month.

**How it’s derived**  
Subscriptions with status UPGRADED or DOWNGRADED and upgrade/downgrade date in the month; MRR impact from the agreed price of the old subscription (upgrade adds, downgrade subtracts conceptually).

**Why it’s useful**  
Shows **expansion vs contraction** within the base. Net positive movement is good; many downgrades may signal price or fit issues.

---

### 4.4 Auto-renew rate

**What it is**  
Among **active** subscriptions, the **percentage** that have **auto-renew** turned on.

**How it’s derived**  
Count of active subscriptions where `autoRenew = true` ÷ total active count.

**Why it’s useful**  
Higher auto-renew usually means **less manual lapse** and smoother renewals. Encourages enabling auto-renew where possible.

---

### 4.5 Renewals due (30 / 60 / 90 days)

**What it is**  
Count of subscriptions and **MRR** whose **next renewal date** falls in the next 0–30, 31–60, and 61–90 days.

**How it’s derived**  
Active subscriptions filtered by `nextRenewalDate` in each window; count and sum of monthly value (MRR) per window.

**Why it’s useful**  
**Cash flow and workload** planning. Shows how much revenue is up for renewal soon and helps prioritise renewal outreach.

---

### 4.6 Expiring soon

**What it is**  
Subscriptions whose **expiry date** is in the **next 30 days** (and not yet renewed). Count and MRR at risk.

**How it’s derived**  
Active subscriptions with `expiryDate` between now and 30 days ahead; count and sum of their MRR.

**Why it’s useful**  
Identifies **immediate risk**: accounts that will lapse soon if not renewed. Drives urgent follow-up.

---

## 5. Invoicing tab

### 5.1 Payment velocity

**What it is**  
**Average** and **median** number of **days from invoice date to payment** for paid invoices (e.g. last 6 months).

**How it’s derived**  
Paid invoices with `paidAt` in range; days = `paidAt` − (`issueDate` or `createdAt`). Mean and median of those days.

**Why it’s useful**  
Measures **how fast customers pay**. Slower velocity may need better terms, reminders, or payment options.

---

### 5.2 Overdue aging

**What it is**  
Outstanding invoices (not paid/cancelled/written off) that are **past due**, broken into **aging buckets**: 0–30, 31–60, 61–90, 90+ days overdue.

**How it’s derived**  
Invoices with `dueDate` in the past and status not final; days overdue = today − due date; grouped into buckets; count and sum per bucket.

**Why it’s useful**  
Shows **where** the A/R is stuck. Older buckets need stronger collection or write-off decisions.

---

### 5.3 Invoice status mix

**What it is**  
Count of invoices in each **status**: Draft, Sent, Partially paid, Paid, Overdue, Cancelled, Written off (and total).

**How it’s derived**  
Group invoices by `status`; count per status.

**Why it’s useful**  
Pipeline view of **invoices**: how many are stuck in sent, partially paid, or overdue. Supports process and follow-up.

---

### 5.4 Tax and credits

**What it is**  
**Tax collected** (this month and in period), **discounts** this month, and **credit notes issued** in the period.

**How it’s derived**  
From paid invoices: sum of `tax`; sum of `discount`. From credit notes: sum of `amount` where `issuedAt` in period.

**Why it’s useful**  
**Compliance** (tax) and **commercial** view: how much discount and credit you’re giving. Helps control leakage and track tax liability.

---

### 5.5 Revenue by payment method

**What it is**  
Paid amount and count per **payment method** (e.g. MPESA, Bank transfer, Card) in the selected period.

**How it’s derived**  
From `InvoiceTransaction` with status COMPLETED and `paidAt` in period; group by `method`; sum amount and count; percentage of total.

**Why it’s useful**  
Shows **how** customers pay. Informs payment options, fees, and reconciliation.

---

## 6. Pipeline tab

### 6.1 New customers (this month / previous month)

**What it is**  
Count of **teams** that had their **first paid invoice** in the **current** month and in the **previous** month.

**How it’s derived**  
For each team, find the earliest `paidAt` across its paid invoices; count teams whose first payment falls in the current (or previous) month.

**Why it’s useful**  
Measures **new customer acquisition** and trend (this month vs last). Core for growth reporting.

---

### 6.2 New subscriptions by product (this month)

**What it is**  
Count of **new** subscriptions (by `subscriptionDate` in the month) **per product** (and optionally category).

**How it’s derived**  
Subscriptions with `subscriptionDate` in the current month; grouped by product; count per product.

**Why it’s useful**  
Shows **which products** are acquiring new subs. Supports product and campaign focus.

---

### 6.3 Order pipeline

**What it is**  
**Count** and **total value** of Nisc orders by **status** (Pending, Processing, Completed, Failed, Partial) over a recent window (e.g. last 3 months), plus **conversion rate** (completed ÷ total orders).

**How it’s derived**  
`NiscOrder` in the window; group by status; sum `total` and count; conversion = completed count ÷ total count.

**Why it’s useful**  
Shows **funnel**: how many orders are in flight and how many complete. Low conversion may indicate checkout or provisioning issues.

---

### 6.4 Promo effectiveness

**What it is**  
**Redemptions** in the period, **orders that used a promo**, **revenue with vs without** promo, and **top promos** by redemptions.

**How it’s derived**  
From `NiscProductPromoRedeem`: count redemptions and by promo code. From `NiscOrder`: orders with `niscProductPromoId` set (with promo) vs not (without); sum totals for each set.

**Why it’s useful**  
Measures **promotion** impact: volume and revenue with promos. Helps decide which promos to keep or retire.

---

## 7. Customers tab

### 7.1 Margin by category

**What it is**  
Per **product category**: **revenue** (MRR), **cost** (from agreed/cost fields), **margin %** ((revenue − cost) / revenue), and **subscription count**.

**How it’s derived**  
Active subscriptions with `agreedPrice` and `agreedCost` (or plan cost); normalise to monthly; sum revenue and cost by product category; margin % = (revenue − cost) / revenue.

**Why it’s useful**  
Shows **profitability** by line of business. Low margin categories may need pricing or cost control.

---

### 7.2 Multi-product customers

**What it is**  
Among teams with at least one subscription: **how many** have subscriptions in **more than one product** (or category), and the **percentage** that are multi-product.

**How it’s derived**  
For each team with subscriptions, count distinct products (or categories); if count > 1, multi-product. Then count multi-product teams and single-product teams.

**Why it’s useful**  
**Cross-sell** indicator. Higher multi-product % often means better stickiness and revenue per account.

---

### 7.3 Top customers (MRR trend)

**What it is**  
**Top N teams** by **current MRR**, with **previous period MRR** and **change %** (and amount) where available.

**How it’s derived**  
MRR per team from active subscriptions; sort by MRR; take top N. Previous MRR would require historical snapshot (if not stored, previous may be 0).

**Why it’s useful**  
Identifies **key accounts** and whether they are growing or shrinking. Supports account management and at-risk flags.

---

### 7.4 At-risk customers

**What it is**  
Count of **teams** that have **active subscriptions** but **no payment** in the last **90 days** (or configured window).

**How it’s derived**  
Last `paidAt` per team from paid invoices; teams where last payment is older than 90 days and the team still has at least one active subscription.

**Why it’s useful**  
Surfaces **accounts that might churn** or have payment issues. Drives proactive outreach and payment follow-up.

---

## 8. Comparisons tab

### 8.1 MRR month-over-month (MoM) %

**What it is**  
**Percentage change** in MRR from the **previous month** to the current month (same as the executive MRR change).

**How it’s derived**  
(current MRR − previous month MRR) / previous month MRR × 100.

**Why it’s useful**  
Quick **growth** check for recurring revenue in one number.

---

### 8.2 Paid revenue month-over-month (MoM) %

**What it is**  
**Percentage change** in **paid invoice revenue** (cash collected) from the **previous month** to the current month.

**How it’s derived**  
Paid amount this month vs paid amount previous month; (this − prev) / prev × 100.

**Why it’s useful**  
Shows **collection trend** independent of MRR (e.g. one-off invoices or timing of payments).

---

### 8.3 Paid revenue year-over-year (YoY) %

**What it is**  
**Percentage change** in **paid revenue** for the **current month** vs the **same month last year**.

**How it’s derived**  
Paid amount in current month vs paid amount in same calendar month previous year; (this − last year) / last year × 100.

**Why it’s useful**  
Removes **seasonality** and shows true growth or decline over a year.

---

### 8.4 Annual run rate

**What it is**  
**MRR × 12**: projected annual recurring revenue if current MRR were sustained for a year.

**How it’s derived**  
Total MRR (same as executive) × 12.

**Why it’s useful**  
Single **run rate** number for planning, targets, and investor/stakeholder reporting.

---

## 9. Glossary

| Term | Meaning |
|------|--------|
| **MRR** | Monthly Recurring Revenue   subscription revenue normalised to a monthly amount. |
| **ARPC** | Average Revenue Per Customer (here: per team with revenue). |
| **Churn** | Subscriptions that left (cancelled or expired) in a period. |
| **Tenure** | How long a subscription has been active (from subscription/start date). |
| **A/R** | Accounts receivable   money owed (outstanding invoices). |
| **Payment velocity** | How quickly invoices are paid (days from issue to payment). |
| **Aging** | Grouping overdue amounts by how many days they are past due. |
| **Conversion (orders)** | Share of orders that reach “Completed” status. |
| **Run rate** | Current MRR extrapolated to a full year (× 12). |

---

## 10. Where to find the report

- **Path:** Agency → Reports → **Sales Reports** (e.g. `/agency/reports/sales`).
- **API:** Single tRPC procedure `reports.sales.getSalesReportOverview` with optional `from`, `to`, `monthsTrend`, `topTeamsLimit`.
- **Data:** All metrics are computed on demand from the database; no separate report tables are updated.

If you need additional metrics or different date logic, they can be added to the same overview computation and exposed in the same report UI.
