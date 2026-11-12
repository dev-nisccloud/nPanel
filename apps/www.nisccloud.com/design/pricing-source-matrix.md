# Pricing source of truth and billing-cycle support

Checked 7 November 2026 against the website source and the live nPanel API (catalogue reads, signed cart links and quotes only; no orders or payments).

The rule throughout: what the cart charges comes from `storefront.cart.quote`, which re-prices on the server from the signed cart link. Card prices on the website are for display. The one exception is domain transfers (SEC-01).

## 1. Where each price comes from

| Product | Website route(s) | Display price source | Checkout price source | Margin applied where | Dynamic? | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Web hosting | `/hosting/shared`, `/pricing` | nPanel catalogue `products.getHostingPlansForPricing` (`niscPrice`) | nPanel quote | In nPanel (the catalogue price is already Nisc Cloud's selling price) | **Yes** | Ultimate to be hidden from the website (owner) |
| WordPress hosting | `/hosting/wordpress`, `/pricing` | `products.getWordPressPlansForPricing` | nPanel quote | nPanel | **Yes** | The page also defines three add-ons in code (WooCommerce pack 500, premium backups 350, CDN 400); they only show in a dialog that the page never opens. The CDN add-on contradicts "Free CDN" on every plan. |
| Business email (Nisc Mail) | `/hosting/email`, `/pricing` | `products.getEmailHostingPlansForPricing` | nPanel quote | nPanel | **Yes** | Free plan has no price; the quote rejects it |
| SEO / AEO / GEO | `/services/seo` | `products.getSeoPlansForPricing` | nPanel quote | nPanel | **Yes** | |
| Email marketing | `/services/email-marketing` | `products.getNiscEmailMarketingPlansForPricing` | nPanel quote | nPanel | **Yes** | |
| VPS, VDS, Dedicated | `/hosting/vps`, `/hosting/vds`, `/hosting/dedicated-servers` | Upstream server catalogue (USD cost) + `hivelocityPricingSettings.get` margin + `publicPricing.getExchangeRatesPublic` FX, **calculated in the browser** | nPanel quote (calculated again on the server) | Margin settings in nPanel; VDS and Dedicated have **none** (B-2) | **Yes** | The website duplicates the server's price formula. A backend "priced catalogue" endpoint would remove that duplication. |
| Domain registration (.ke) | `/hosting/domains`, search, cart | KeNIC fee from `kenic.domainCheck.check` + TLD margin (`publicPricing.getMarginMap` / `getDefaultMarginConfig`), calculated in the browser | nPanel quote (registry fee + margin on the server) | nPanel TLD margin settings | **Yes** | Registry is called on every quote (B-5) |
| Domain registration (international) | same | Registrar price from `openProvider.domains.checkAvailability` + margin + FX, in the browser | nPanel quote | nPanel | **Yes** | |
| Domain renewal | — | Not shown anywhere | Not in the quote | — | — | Registry returns `renewFee` (KES 1,000 for `.co.ke`, same as create); B-14 |
| Domain transfer | `/domain-transfer` | Registry or registrar transfer fee + margin, in the browser | **The browser's `customerPriceAmount`** | — | — | **SEC-01, Critical**: the quote trusts the client price |
| SSL certificates | `/hosting/ssl`, `/security/ssl`, `/pricing?product=ssl` | **Hard-coded once** in `src/lib/service-packages.ts` (`SSL_PLANS`): DV 1,500, OV 3,500, EV 8,000 KES/yr | None: the CTA opens the enquiry form | — | **No** | Static. `/pricing` reads the same constant and links to `/hosting/ssl#pricing` to order. "Multi-year discounts available" removed from the note (no discount exists) |
| Website security packages | `/security` | **Hard-coded**: 2,500 and 5,500 KES | Enquiry form | — | **No** | |
| Marketing and build services (brand identity, website design, ecommerce, social media, paid ads, Zepo AI) | `/services/*`, `/pricing` | **Hard-coded once** in `src/lib/service-packages.ts` (plans and pricing notes); each service page and `/pricing` import the same constants | Enquiry form | — | **No** | Previously two copies (page and `MarketingPricingSections.tsx`). The `/pricing`-only "Cloud Plans" bundles (Launchpad KES 25,000/mo, Orbit KES 65,000/mo) had no product page and were removed |
| Microsoft 365, Google Workspace | `/hosting/microsoft-365`, `/hosting/google-workspace`, `/pricing` | **Vendor list prices in USD**, hard-coded in `LicencePlansSection.tsx` with source and check date (8 Nov 2026). Microsoft 365 Business Basic $7, Standard $14, Premium $22 per user/month, annual commitment (microsoft.com). Google Workspace Business Starter $7, Standard $14, Plus $22 per user/month on the annual plan; Flexible $8.40 / $16.80 / $26.40 (Google Workspace Help Centre, updated 26 Oct 2026). Enterprise quote-only. Introductory offers excluded | KES quote via the enquiry form | Owner: add margins in nPanel once the reseller catalogue is connected | **No** | Recheck the vendor pages before launch and whenever the check date is older than 90 days |
| Agency hosting | `/hosting/agency` | None (proposal only) | — | — | — | No catalogue product |
| Crawler fallback | `index.html` `<noscript>`, `public/llms.txt` | **No prices** (fixed 8 Nov 2026). Both now list products and link to `/pricing` | — | — | — | The stale "from KES 350/500/2,000/250" figures were removed rather than updated, so they cannot drift again |

### What it would take to centralise pricing in nPanel

1. A catalogue entry, with a Nisc Cloud price or a cost-plus-margin rule, for every product that is sold at a fixed price: SSL certificates, security packages, and any standard marketing packages the business wants to sell online. The website would then read them like the hosting catalogue.
2. A server-side "priced catalogue" endpoint for servers and domains, returning the final KES display price, so the browser no longer repeats the margin formula.
3. Margins for VDS and Dedicated (B-2), and the domain-transfer fix (B-1).
4. A renewal price in the quote and catalogue (B-14).
5. The Microsoft 365 and Google Workspace reseller catalogue, with per-licence margins.

Until then, the static prices above stay exactly as approved; the website does not change them.

## 2. Billing-cycle support (quote API, 7 Nov 2026)

Each plan was put in a signed cart link and quoted at each term. "Accepted" means the quote returned that term with a total; prices are the monthly rate × months, plus 16% VAT, with **no multi-term discount**.

| Product | Monthly | 1 year | 2 years | 3 years | 4 years | Example (excl. VAT) |
| --- | --- | --- | --- | --- | --- | --- |
| Web hosting: Starter, Basic, Deluxe, Ultimate | Accepted | Accepted | Accepted | Accepted | Accepted | Starter 149 / 1,788 / 3,576 / 5,364; Basic 325 / 3,899 / 7,798 / 11,697 |
| WordPress: Starter, Business, Pro | Accepted | Accepted | Accepted | Accepted | Accepted | Business 599 / 7,188 / 14,376 / 21,564 |
| Email: Basic, Standard, Corporate | Accepted | Accepted | Accepted | Accepted | Accepted | Corporate 1,000 / 12,000 / 24,000 / 36,000 |
| Email: Free | Rejected | Rejected | Rejected | Rejected | Rejected | "Unable to calculate a valid checkout total" |
| SEO: Starter, Growth, Pro | Accepted | Accepted | Accepted | Accepted | Accepted | Not offered as multi-year on the website (managed monthly service) |
| Email marketing: Starter | Accepted | Accepted | Accepted | Accepted | (rate-limited) | Growth and Pro hit the API rate limit during the test |
| VPS, VDS, Dedicated | Accepted (earlier tests) | Not re-tested | Not re-tested | **To verify** | Was offered in the cart | Retest after the rate-limit window |
| Domains | Not allowed | Accepted | Cart offers | Cart offers | Cart offers | Registry terms; not forced into the hosting selector |

What the website offers after this change:
- Hosting, WordPress and Nisc Mail cards: Monthly, 1 year, 2 years and 3 years (the 4-year option is removed from the cart).
- SEO and email marketing: monthly only.
- Domains: their own yearly terms.
- Microsoft 365 and Google Workspace: the vendor's own commitments.

The "renews at" price shown in the cart is the same term price, because the catalogue has no separate renewal or introductory price. No introductory discount is shown, because none exists.

## 3. Master pricing page (8 Nov 2026)

`/pricing` stores no prices of its own. Each product panel renders the same component, or reads the same constant, as its product page:

| Panel | Source |
| --- | --- |
| Web hosting, WordPress, Business Email, SEO, Email marketing | Live nPanel catalogue via the product page's pricing section |
| VPS, VDS, Dedicated | Live server catalogue via the product page's plans section |
| Domains | Live domain search |
| SSL, marketing and build services | `src/lib/service-packages.ts` |
| Website security | `SecurityPlans` (same component as `/security`) |
| Microsoft 365, Google Workspace | `LicencePlansSection` (same component as the product pages) |
| Enterprise Hybrid Email, Custom Software | Qualified enquiry, no price |
| Agency hosting | `AgencyPlans` (same component as `/hosting/agency`), enquiry only |

Deep links: `/pricing?product=<id>` (for example `?product=vps`). Selecting a product emits `pricing_category_select` with the product ID only.