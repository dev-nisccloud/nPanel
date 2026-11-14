# Plan: recording legal acceptance at checkout (website and nPanel)

Status: **plan for owner approval. Nothing implemented.** Implementation starts after the owner and lawyer finish reviewing the legal pages, because the acceptance record has to point at final document versions.

## Why we need records

If a customer disputes a charge, a refund, a suspension or a service credit, we must show which version of the Terms they accepted, when and for which order. Card networks and payment providers ask for this evidence in chargebacks. Under the Kenya Data Protection Act, 2019 we also have to show that the Privacy Policy was presented. Google Cloud, Microsoft and Hostinger all record acceptance on their side; the checkbox alone, with nothing stored, is weak evidence.

## What happens today

| Place | What the customer sees | What is stored |
| --- | --- | --- |
| Website sign-up (`storefront/auth.ts`) | Required checkbox | `user.acceptedTermsAndConditions = true` (yes/no only, no version or time) |
| Website checkout (`StorefrontPaymentDialog.tsx`) | Required checkbox with links to Terms, SLA and Privacy (new tab) | Nothing. Checked only in the browser. |
| nPanel checkout (`global-buy-now-dialog.tsx` lines ~2281, ~2366, ~2507; `components/buy-now-dialog.tsx` ~2918; `agency.domains` and `$slug.domains` buy-now dialogs ~1256) | Text only: "By checking out you agree…" | Nothing |

Orders are created in `packages/api/src/routers/storefront/orders.ts` (`createFromPayment`) and `packages/api/src/routers/nisc-service-orders.ts` (`create`).

## Proposed design

### 1. One list of legal document versions

A shared constant in a package both apps can import, for example `packages/legal/src/versions.ts`:

```ts
export const LEGAL_VERSIONS = {
  terms: { version: "2026-10-01", url: "https://nisccloud.com/terms" },
  sla: { version: "1.0", url: "https://nisccloud.com/sla" },
  aup: { version: "1.0", url: "https://nisccloud.com/acceptable-use" },
  dpa: { version: "1.0", url: "https://nisccloud.com/dpa" },
  privacy: { version: "2026-10-01", url: "https://nisccloud.com/privacy" },
} as const;
```

The website legal pages read their version badge from the same constant, so the page and the record can never disagree. Each published version is archived (a copy of the page text kept in the repo or storage) so we can show exactly what a customer saw.

### 2. New table `legal_acceptance` (migration 0079)

| Column | Purpose |
| --- | --- |
| `id` | Primary key |
| `user_id` | Customer account (required; there is no guest checkout) |
| `team_id` | Agency or team the order belongs to, where applicable |
| `order_id` / `service_order_id` | The order this acceptance was given for |
| `context` | `signup`, `website_checkout`, `npanel_checkout`, `renewal_notice` |
| `documents` | JSON list of `{ document, version }` accepted, e.g. Terms 2026-10-01, SLA 1.0, Privacy 2026-10-01 |
| `accepted_at` | Server time (not browser time) |
| `ip_address` | From the request, for evidence |
| `user_agent` | Browser string, for evidence |
| `wording` | The exact checkbox sentence shown |

Rows are never updated or deleted by the app (append-only). They are kept for 7 years after the account closes, matching invoice retention in Privacy Policy §9. The Privacy Policy already covers account and transaction records; we add one line naming acceptance records when the Terms update is published.

### 3. Server enforcement

- `createFromPayment` and `nisc-service-orders.create` take a new required input: `acceptedLegal: { documents: [{ document, version }] }`.
- The server checks that the versions match the current `LEGAL_VERSIONS`. If they are missing or out of date, the order is refused with "Please review and accept the latest Terms before paying", so an old browser tab cannot pay against an old version.
- The acceptance row is written in the same database transaction as the order.
- Sign-up keeps setting `user.acceptedTermsAndConditions` for compatibility, and also writes a `signup` row.

### 4. nPanel checkout (all buy-now dialogs)

- Replace the "By checking out you agree…" text with the same required checkbox the website uses: "By placing your order, you agree to Nisc Cloud's Terms of Service and applicable Service Level Agreement, and acknowledge our Privacy Policy."
- Each document name is a link that opens in a new tab, so the cart is not lost (the pattern Google Cloud and Microsoft use).
- The Pay button stays disabled until the box is ticked; the error message matches the website.
- One shared `LegalAcceptanceCheckbox` component in `apps/web` used by all five dialogs, so wording and links stay identical.

### 5. When the Terms change

- On the effective date of a new version, signed-in customers see a one-time notice in nPanel ("We've updated our Terms") with links and an "I understand" button, which writes a `renewal_notice` row. Continued use still counts as acceptance under Terms §24; the row is extra evidence.
- The 30-day email notice is sent before that date (outside this build).

### 6. Admin view

A read-only "Legal acceptances" tab on the customer record in nPanel admin: date, context, documents and versions, order link and IP. Export to CSV for disputes and chargebacks.

## Build order and effort

1. Shared versions constant and website badge wiring (small).
2. Migration 0079 and schema (small).
3. Server checks and transactional writes in both order endpoints (medium).
4. Shared nPanel checkbox component in five dialogs (medium).
5. Website checkout sends versions (small).
6. Updated-terms notice in nPanel (medium).
7. Admin view and CSV export (small to medium).

Testing: unit tests for version checks; a test that orders without acceptance are rejected; manual checkout on the website and in nPanel (desktop, phone, dark mode) on staging only. No live payments.

## Owner decisions (13 November 2026)

1. **No guest checkout.** A self-service customer must accept the Terms and create a Nisc Cloud account before paying. Acceptance is recorded at sign-up (`signup` row) and again for each order (`website_checkout` or `npanel_checkout` row), so `user_id` is always set. The website cart must send customers through sign-up or sign-in before payment; check the current cart flow for any path that skips this.
2. **Updated-terms notice: yes.** nPanel shows a one-time notice when a new version takes effect, in addition to the 30-day email.
3. **DPA stays included** in the Terms acceptance (Terms §1 and §16); no separate checkbox.
4. Retention: 7 years after account closure, in line with invoices (assumed; confirm with the lawyer).
