# Nisc Cloud — pre-launch remediation and commerce validation log

Running record of every finding and every change made during the final pre-launch remediation (started 7 November 2026). Previous audit: `design/launch-readiness-report.md`. Claims inventory: `design/trust-claims-inventory.md`.

Nothing in this log has been committed or deployed.

## Owner decisions (7 Nov 2026)

| Topic | Decision |
| --- | --- |
| Uptime | 99.99% monthly uptime **target** on hosting pages; Terms §18.1 updated from 99.9% to 99.99% so the contract and the marketing match (service credits apply below 99.99%). Not called an SLA or a guarantee in marketing copy. |
| Performance guarantees | Resource guarantees only: dedicated / guaranteed CPU and RAM on VPS, VDS and dedicated servers; NVMe storage. |
| 24/7 support | 24/7 via tickets, email and chat; phone in business hours. "Local" (Kenyan team) may be used. |
| Enterprise-grade security | Allowed. |
| "100+ clients" | Remove. |
| "Unlimited" resources | Remove. |
| Microsoft 365 / Google Workspace partnership | Confirmed. Keep accurate partnership wording, no accreditation levels. |
| ODPC registration number | Confirmed correct. |
| Communications Authority of Kenya | Nisc Cloud is licensed by the CA — state it, with logo. |
| KeNIC | Nisc Cloud is a KeNIC-accredited registrar — state it, with logo. Official logos fetched from the authorities' websites. |
| Client logos | Usage confirmed for all logos currently shown. |
| `/work` | Keep the route: confirmed client logos + what we deliver + "case studies published with client approval" + CTA. Remove fabricated case studies and their detail pages. |
| Upstream providers | Never name the international registrar or the server-infrastructure provider in public copy. KeNIC may be named. |

### Owner decisions, second brief (7 Nov 2026, evening)

These override the earlier rows where they differ.

| Topic | Decision |
| --- | --- |
| Backend verification | The nPanel backend source is not available. Backend payment controls are marked **Not Verified**; the website and public API are audited with safe read-only tests, and patches and test plans are written for the backend team. |
| Uptime | **99.9% target** everywhere (replaces 99.99%); Terms §18.1 goes back to 99.9%. |
| Recommended badge | The catalogue's Recommended flag: shared **Basic**, WordPress **Business**, email **Standard**. |
| Free email | Removed from the plan grid; shown as "free starter mailbox with every domain" on the email page and domain results; attaching it in the domain cart needs nPanel to support a zero-priced add-on. |
| Business email plans | Basic, Standard, Corporate (KES 12,000/yr) plus a custom-priced **Enterprise** card (Talk to Sales). |
| Microsoft 365 / Google Workspace | Use the vendors' published prices for now; Nisc Cloud margins will be added in nPanel once connected. |
| Renewal reminders | Owner confirms the system sends reminders at **60, 30 and 7 days** before expiry. |
| "30-day results promise" | Replace with a conversion hook that makes no unbacked promise. |
| Nisc Mail AI | Live today: AI writing and reply drafting, and email summaries. Smart sorting is not live. |

## Findings

### Commerce journey (tested against the live API with signed handoffs and quotes only — no accounts, payments, orders or registrations)

| # | Finding | Severity | Owner |
| --- | --- | --- | --- |
| C-1 | **Domain transfer price is taken from the browser.** `storefront.cart.createHandoff` signs whatever `customerPriceAmount` the client sends for `serviceType: "domain_transfer"`, and `storefront.cart.quote` returns it as the price. A handoff with `customerPriceAmount: 1` quoted **KES 1 + KES 1 VAT = KES 2** for both a `.co.ke` and a `.com` transfer. Registration ignores the same field (quoted KES 2,500 correctly). If payment initiation reuses the quote, a customer can pay KES 2 for a transfer. | **P0 (backend)** | nPanel backend — compute transfer price server-side from the registry/registrar fee + margin, ignore client price fields |
| C-2 | Quote does not re-check availability: a handoff for `safaricom.co.ke` (registered) quoted KES 2,900. Whether payment/order creation re-checks availability could not be verified without a payment. | P1 (backend) | nPanel backend — confirm availability is rechecked before `initiateStkPush` / `initiateJengaCheckout`, and that a failed registration after payment triggers a refund/credit path |
| C-3 | Handoff tokens are HS256-signed (`typ: SFCH`), expire after 2 hours; forged or garbage tokens are rejected with "Invalid checkout link. Please select your plan again." | Pass | — |
| C-4 | Registration pricing is server-authoritative: `.co.ke` = KeNIC fee KES 1,000 + fixed margin KES 1,500 = KES 2,500 + 16% VAT = KES 2,900; matches what the search page displays. `.com` KES 1,690 + VAT. | Pass | — |
| C-5 | Hosting pricing is server-authoritative: Starter KES 149/mo; yearly KES 1,788; biennial 3,576; triennial 5,364; VAT 16% on each. A client attempt to switch a domain to MONTHLY is ignored (stays YEARLY). Unknown plan id → "The selected plan is no longer available." | Pass | — |
| C-6 | Server pricing is server-authoritative: `pro.sm.amd` USD 10 + 25% margin × FX 129.94 = KES 1,625/mo on the card and in the quote. A mismatched product id in the quote body is ignored in favour of the signed handoff. | Pass | — |
| C-7 | `.co.ke` quotes take 5–8 s each because the quote calls the registry for the fee every time; the cart re-quotes on every option change, so a `.co.ke` cart feels slow. | P1 (backend) | Cache registry fees (they change rarely) |
| C-8 | Renewal price is not part of the quote; the registry returns `renewFee` (KES 1,000 for `.co.ke`, same as create). Whether the site states renewal prices is covered under item 2 of the report. | Info | — |

### `.co.ke` lookup latency (KeNIC)

Measured directly against `https://npanel-server.nisccloud.com` (bypassing the website), random unregistered names:

| Call | Time |
| --- | --- |
| First `.co.ke` check after idle (response contains `loginSuccess: true`) | **32.6 s** |
| Same call again (warm) | 4.0 s |
| `.co.ke` + `.ke` in one call | 4.5 s (with fees) / 3.6 s (without fees) |
| Three concurrent calls, as the search page fires them | 4.3 s, 8.1 s, **12.8 s** — they queue one after another |
| Taken domain | 2.8 s |
| International `.com` + `.net` (other registrar) | 5.4 s |

Root causes:
1. **Backend / registry integration**: each call appears to log in to the KeNIC EPP service (`loginSuccess` in every response); after idle the login takes ~28 s. Checks on one session are serialised.
2. **Frontend**: the search page sends up to three separate KeNIC requests for the same names (exact match, "Kenyan" list, recommended list), which queue behind each other and triple the wait.
3. **Frontend**: the browser aborts every request at 30 s. A cold lookup (32.6 s) is therefore cancelled; the exact-match card then disappears silently and the Kenyan list shows a generic error. This is the ">30 s searching" seen in the audit.
4. The response also carries the raw EPP XML (≈3 KB per call) to the browser — unnecessary and leaks registry internals.

### Server-plan loading

| Call | Cold | Warm |
| --- | --- | --- |
| VPS plans page 1 | **20.3 s** | 0.66 s |
| VDS plans page 1 | 0.8 s | 0.6 s |
| Dedicated plans page 1 | 0.9 s | 0.66 s |
| Facilities / pricing settings / FX | 1.5 s / 0.8 s / — | — |

The backend already caches upstream inventory; the delay is a cold-cache miss. Only the plan grid waits — hero, features, FAQ and CTA render immediately (verified in the captures).

### Server-plan pricing mismatch (found while tracing item 4)

| # | Finding | Severity | Owner |
| --- | --- | --- | --- |
| S-1 | The VDS and Dedicated pages priced their cards with the **VPS** margin settings (25%), but nPanel has **no margin configured** for `VDS` or `DEDICATED_SERVERS`, so the cart quote charges upstream cost × FX with no margin. Examples: `vds.sm.intel` card KES 3,411 vs cart KES 2,729; `vds.md.intel` 6,010 vs 4,808; dedicated `ci.micro.m1` 15,756 vs 12,605; a USD 750 dedicated plan 121,819 vs 97,455. Customers saw one price and were charged another, and the business would sell these products at cost. | **P0** | Website: **fixed** (cards now use each product's own settings, so they match the cart). Owner: **configure VDS and Dedicated margins in nPanel admin before launch** — until then both pages show and charge cost price. |
| S-2 | Some dedicated plans come back with an empty `product_name` (cards show no name). | P2 (backend data) | nPanel / catalogue mapping |
| S-3 | The cart's server configuration step already used the correct per-product settings. | Pass | — |

## Changes

### 1. `/work` case studies
- Deleted `src/pages/work/_lib/case-studies.ts` (six fabricated case studies: Verdant Co., Apex Realty, Pulse Fitness, Stackr, Harbour Eats, Lumex Solar — USD figures, invented testimonials, Unsplash covers), `src/pages/work/[slug].tsx` and `src/pages/work/_components/PortfolioGrid.tsx`.
- Removed the `/work/:slug` route (old detail URLs now return the 404 page) and the six URLs from `public/sitemap.xml`.
- New `src/pages/work/_components/ClientsAndCapabilities.tsx`: grid of the confirmed client logos, "What we deliver" with the approved Build / Run / Grow / Automate artwork and links, and the note "Detailed case studies are on the way. We publish project details and results only after each client has reviewed and approved them."
- `WorkHero.tsx`: "Businesses we build, run and grow", top padding clears the fixed nav. `/work` meta title/description rewritten (no "results reported"). Navbar "Customer Work" description → "Clients and what we deliver".
- New `src/lib/clients.ts` — single list of approved client logos, now used by `Hero.tsx` and `TrustedBy.tsx` (previously duplicated).

### 3. `.co.ke` lookups
- New `src/lib/domain-search/kenic-check.ts`: every KeNIC availability check on the site goes through one function that (a) coalesces lookups fired within 40 ms into a single registry request, (b) shares in-flight requests for the same domain, (c) reuses a verified answer for 60 s only, (d) waits up to 60 s (the registry's cold start is ~33 s; the old 30 s timeout cancelled it), and (e) rejects on failure — a failed lookup is never shown as available.
- Callers switched: `ExactMatchSection`, `KenyanTldCards`, `RecommendedDomainsList`, `TopLevelSuggestedCards`, cart `DomainUpsell` (two places), `/hosting/domains` `DomainExtensionsSection`.
- New `KenicLookupStatus.tsx`: "Checking example.co.ke with the KeNIC registry…", after 6 s "Still checking… Kenyan domains can take up to a minute to confirm." Failure → "We could not confirm availability with the KeNIC registry just now, so this domain cannot be added yet." + **Check again** (clears the cached answer and retries). Exact-match card no longer disappears silently on failure.
- `/hosting/domains` price table: registry list prices for the probe name cached in `localStorage` for 6 h so the table no longer occupies the registry session ahead of a customer's search on every page load (prices only — never availability).
- `trpcMutation` in `src/lib/domain-search/api.ts` accepts an optional timeout.
- Second pass, after the regression found a `.co.ke` search with no outcome at 80 s:
  - `kenic-check.ts` keeps **one registry request in flight** and folds everything asked meanwhile into the next request (parallel requests only queued upstream and shared one timeout budget).
  - New **background lane**: the price-table probe (`checkKenicDomains(domains, { background: true })`) is sent only when no customer check is queued and is never batched with one. Before this, the probe and the customer's two names went out as one 6-name request that hit the 60 s timeout.
  - `DomainExtensionsSection` starts its probe only once the table is on screen (`IntersectionObserver`, 15% visible), in addition to the existing 6-hour browser cache.
  - `TopLevelSuggestedCards` renders international suggestions (`.com`) as soon as they arrive (about 1 s) instead of waiting for KeNIC; two placeholders hold the Kenyan slots, and the bundle card appears only when both sources are done. A Kenyan name is still shown only after the registry confirms it.
  - Measured after the change (13:00 EAT): the registry's own cold start is now **52.9 s** (then 11.6 s and 4.4 s), up from 32.6 s earlier the same day. A cold first search can therefore still take close to a minute; this is B-4 and cannot be solved in the browser.

### 4. Server plans
- `src/lib/vps-plans-api.ts`: new `catalogQuery()` for display-only catalogue reads (plans, facilities, margin settings, FX): identical concurrent requests share one fetch; successful answers reused from `sessionStorage` (plans 5 min, settings/FX 10 min, facilities 60 min); 45 s timeout for cold upstream reads. The cart quote still re-prices server-side before payment.
- VDS and Dedicated cards now use their own margin settings (`fetchVpsPricingSettings("VDS")` / `("DEDICATED_SERVERS")`) — see S-1.
- New `src/lib/prefetch-server-plans.ts`, wired to `onPointerEnter` / `onFocus` of the VPS, VDS and Dedicated links in `ProductsMegaMenu.tsx` (lazy import, no main-bundle cost).

### 7. Real 404s
- New `src/lib/public-routes.ts`: the single list of public SPA routes (plus blog slugs from `posts-data.ts`).
- `server.ts` (Bun host) now uses it; unknown `/blog/<slug>` paths are 404 as well (previously any `/blog/*` or `/work/*` returned 200).
- New `scripts/vercel-routes.ts` (`bun run routes:sync`) generates `vercel.json`: the `/api` proxy, then one rewrite to `/index.html` per public route, and `trailingSlash: false`. Anything else falls through to `dist/404.html`, which Vercel serves with **HTTP 404**.
- `vite.config.ts` plugin `nisc-404-page`: copies `dist/index.html` → `dist/404.html` after build, and **fails the build** if `vercel.json` has drifted from `public-routes.ts`.
- `server.ts`: the static-file check now requires `statSync().isFile()`; before this, `/` tried to read the `dist` directory and returned **500**.
- Tested with a local harness against both the Bun host and an emulation of the Vercel routing rules: 200 for `/`, `/hosting/vps`, `/work`, `/cart?h=…`, real blog slugs, `/services/marketing`, `sitemap.xml`, `robots.txt` and the `/api` proxy; **404** for unknown paths, `/work/verdant-co`, `/blog/not-a-real-post`, `/hosting/vps/extra`, missing assets and `/HOSTING`; `/work/` → 308 to `/work`. **Still to confirm on a Vercel preview deploy:** real Vercel behaviour, and whether Vercel's external-rewrite proxy timeout is longer than KeNIC's ~33 s cold lookup.

### 6. Claims
- **Uptime:** "99.9%" → "99.99%" in 17 files, always worded as a *target*; Terms §18.1 now 99.99%. `hosting/email` now says "with a 99.99% uptime target".
- **Removed:** dead component `src/pages/_components/Stats.tsx` ("100+ Businesses Served", "30-day results promise"); dead demo `src/components/shadcn-space/blocks/pricing-01/index.tsx` ("SLA guarantee").
- **"Unlimited" reworded** in marketing packages: email aliases ("included on all plans"), brand identity ("structured revision rounds", "a set of directions agreed in your brief"), website design ("custom pages scoped to your project"), e-commerce ("full catalogue setup with product variants"), social ("posts per your content calendar"), paid ads ("ad budgets of any size managed"), Zeepo ("high-volume conversations"). **Kept:** Wildcard SSL "unlimited subdomains" (a real property of the certificate).
- **Support:** 24/7 by ticket, email and chat; phone in business hours (home FAQ, `/help`, `/hosting`, closing CTA, cart, pricing).
- **Resources:** VPS, VDS and Dedicated pages state guaranteed (reserved) CPU and RAM and NVMe storage.
- **Security:** `OnePlatform.tsx` label "Enterprise-Grade Security" (owner approved).
- **Partnerships:** "authorised Microsoft 365 and Google Workspace partner" kept; no accreditation level invented. ODPC line unchanged.
- **Accreditation:** official logos downloaded from ca.go.ke (`cA.jpg`) and kenic.or.ke (`wp-content/uploads/2023/05/1.svg`, checked: no scripts or external references) into `public/accreditation/`. New `src/pages/_components/AccreditationStrip.tsx` ("Licensed by the Communications Authority of Kenya", "KeNIC-accredited .ke domain registrar"; logos on white chips so they read in both themes; each links to the regulator). Shown site-wide in the footer above the ODPC line, and under the domain search on `/hosting/domains`.
- **`/hosting/domains` accuracy:** hero badge now "KeNIC-accredited registrar"; "Instant search… in seconds" → "live search with the registries" (`.co.ke` checks take 4–33 s); "what you see in search is what you pay" → "…the price in your cart, with VAT added at checkout"; the `.go.ke` FAQ no longer says it can be bought online (checkout blocks `.go.ke`); new FAQ "Is Nisc Cloud an accredited .ke registrar?".
- **Upstream providers:** no rendered copy names the server or international-domain providers. They still appear in tRPC procedure names (`hivelocity.*`, `openProvider.*`), which anyone can see in the browser's network tab — renaming needs backend aliases (B-9).

### Service packages (Design A, applied everywhere)
- Two designs were built for comparison (A "spotlight cards" on `/hosting/shared`, B "compare table" on `/hosting/wordpress`). **Owner chose A** (7 Nov 2026) with these changes: list all specs on every card, use the orange and blue brand gradients, make the RAM/CPU spec tiles more engaging, and do not describe one plan in terms of another. Design B and its preview switch were removed.
- Model: `src/pages/hosting/_components/hosting-plan-model.ts`: monthly price (handles yearly-priced rows), feature normalisation, the same headline specs for every plan of a product, and meter values (each plan's allowance as a share of the largest).
- Cards: `PlanCardsSpotlight.tsx`. The recommended plan has an orange-to-blue gradient frame, orange gradient badge and buttons, and a gradient price. The others use a blue accent. Spec tiles have gradient icons and a meter bar. Every included feature is listed. There is a button under the price and another at the bottom. Badge and button text is dark on orange for contrast.
- Section: `HostingPlansPricingSection.tsx`, used by shared, WordPress and email hosting, `/pricing`, and now **SEO and email marketing** (`NpanelPricingSection.tsx` is a thin wrapper that keeps their own titles, intros and pre-filled contact links). Trust row: free SSL (only when every plan has `free_ssl`), 24/7 local support, M-Pesa or card, prices in KES excluding 16% VAT. A click guard runs while the cart handoff is created and resets after the browser's back button.
- Static marketing and security packages (`service-pricing-cards.tsx`, via `service-mock-pricing.tsx`): restyled in the same language; the six-feature cut-off was removed; "Everything in <Plan>" lines are expanded into that plan's actual features; "/once" now reads "one-time". No VAT statement is made on these cards (VAT treatment for marketing services not confirmed).
- Display rules (until the nPanel catalogue is updated, B-10): the "99.9% uptime guarantee" row shows as **"99.99% uptime target"**. Shared "SSD storage" shows as **"NVMe SSD storage"**, and "SSD hosting" in the product intro as "NVMe SSD hosting" (owner: NVMe everywhere). Catalogue "Unlimited" values show as **"Unlimited\*"** with a footnote to the fair-use clause in Terms §11 (owner choice; SSL "Unlimited" shows as a tick).
- The card line says "billed monthly or yearly". The cart offers 1, 12, 24 and 48 months at the monthly rate × months; there is no multi-year discount, so no savings are claimed.
- Price check: every shared and WordPress card price equals the cart quote's monthly price (handoff and quote only, no payment).
- The free email plan has no price in nPanel and the cart refuses it ("Unable to calculate a valid checkout total"). Its button now reads "Ask about this plan" and opens the contact form.

### Cart
- `HostingUpsell.tsx` (hosting offer on domain carts): plans priced only yearly (shared **Basic**, email **Corporate**) were silently dropped, so the recommended Basic plan never appeared. It is now included, at KES 3,899 for 12 months, which matches the quote. Feature labels go through the same normalisation as the cards.
- `OrderSummary.tsx`: "All prices include VAT" changed to "Total includes 16% VAT", because line items are shown before VAT and 16% is added in the summary.

### Accessibility
- Twelve page files had no `<main>` landmark: `ServicePageShell` (most service pages), `SecurityServiceLayout`, `/about`, `/blog`, `/contact`, `/help`, `/hosting`, `/pricing`, `/security`, `/security/email`, `/security/ssl` and `/services`. Content between the navigation and the footer is now wrapped in `<main id="main-content">`. The 404 page (`NotFound.tsx`) now uses `<main>` as its outer element.

## Regression results (7 Nov 2026, local dev server against the live nPanel API)

All runs were read-only: no accounts, leads, payments, orders or registrations. The interaction suite aborts if a `leads.submit` request is sent.

| Check | Result |
| --- | --- |
| `tsc` (app and node configs) | Pass, 0 errors |
| ESLint | 0 errors, 38 warnings (all pre-existing) |
| `bun run build` | Pass; `dist/404.html` produced; `vercel.json` drift check passed |
| Full-page check at 1440, 768 and 390 px: `/`, `/work`, `/hosting/domains`, `/hosting/shared`, `/hosting/wordpress`, `/hosting/vps`, `/pricing`, `/services/seo`, `/security`, `/about` | Horizontal overflow 0, console errors 0, exactly one `h1` and one `main` on every page |
| 404 page at 1440 and 390 px | Overflow 0, errors 0, one `h1`, one `main` (re-captured after the fix) |
| Mega menu opens on hover and closes on leave; hovering VPS prefetches the catalogue | Pass |
| Goal selector by click and arrow keys; hero slider Next | Pass |
| Corporate enquiry blocks an empty first step; no lead submitted | Pass |
| Mobile menu opens, expands a section, closes | Pass |
| `.co.ke` search resolves with a verified result or a retry card, never silently | Pass: "Available, KSh 2,500.00 /1st yr" after 54.5 s on a cold registry, with the waiting notice shown throughout. An earlier run (before the background lane) failed at 130 s. |
| `.com` suggestion shown while KeNIC is still checking | Pass, about 1 s |
| Console errors across the suite | None |
| Package prices vs cart quote (shared, WordPress, cart upsell) | All match |

Test-harness fix: the domain test only recognised prices written "KES …" but the site formats them "KSh …", so it could only ever detect the retry card. It now accepts both.

## Client logo inventory (item 8)

All 17 logos are listed once in `src/lib/clients.ts` (owner confirmed usage on 7 Nov 2026) and served from `public/clients/`.

| Client | File | Size |
| --- | --- | --- |
| Amarom | `amarom2.png` | 5 KB |
| Defen Group | `defen-group-logo.png` | 5 KB |
| Liveright | `liveright-logo.png` | 28 KB |
| MMA | `mma-logo.png` | 10 KB |
| Stanjo | `stanjo.png` | 82 KB |
| Epitome | `epitome-logo.png` | 72 KB |
| Luxewrap | `luxewrap-logo.png` | 64 KB |
| Medplus | `medplus-logo.png` | 6 KB |
| Farma24 | `farma24-logo.png` | 5 KB |
| Ashut | `ashut-logo.png` | 136 KB |
| Trelanbrams | `trelanbrams-logo.png` | 94 KB |
| Datini | `datini-logo.png` | 18 KB |
| HB | `hb-logo.webp` | 3 KB |
| Cruises Bob | `cruisesbob-logo.png` | 207 KB |
| Insaac | `insaac2.png` | 11 KB |
| 2tokee | `2tokee.png` | 96 KB |
| APL | `apl-logo.png` | 83 KB |

Where they appear: home hero and "Trusted by" strip (`Hero.tsx`, `TrustedBy.tsx`, all 17), `/work` (`ClientsAndCapabilities.tsx`, all 17), and the home "Built different" trust visual (`context-visuals.tsx`, the subset Amarom, Medplus, Epitome, Ashut). The subset used to be a separate hard-coded list; it now filters `clients.ts`, so removing a logo there removes it everywhere.

Other third-party marks: the CA and KeNIC logos (`public/accreditation/`, owner confirmed) and the M-Pesa logo in the cart payment dialog (`public/mpesa.png`; used to identify the payment method, which Safaricom's brand rules generally allow, but worth confirming with the payment agreement).

Recommendations: keep written client consent on file for each logo; compress the four files over 90 KB (Cruises Bob, Ashut, Trelanbrams, 2tokee) to WebP; no client names, results or quotes are published beyond the logos.

## Commerce journey: what customers see (item 2)

- **Billing cycles:** hosting and server carts offer 1, 12, 24 and 48 months at the monthly price × months. No discount is applied or claimed for longer terms. Domains are yearly only.
- **Cart persistence:** cart options are kept in `sessionStorage` for 2 hours (the life of the signed handoff) so a sign-in redirect does not reset them. Closing the tab clears them.
- **Sign-in and accounts:** `storefront.auth.checkEmail`, `register`, `completeProfile`, `createOrganization`, `checkoutIdentity` and `issueCheckoutToken`; existing customers sign in on the nPanel app and are returned to the cart (`?resume=1`).
- **Payment:** M-Pesa STK push (`initiateStkPush`, then `pollPaymentStatus` / `queryStkPush`) or card via Jenga (`initiateJengaCheckout`, a POST redirect to the Jenga page, then `getJengaPaymentStatus` on return).
- **Order creation:** the **browser** calls `storefront.orders.createFromPayment` after it sees a successful payment, and sends the cart again (see B-12 and B-13).
- **Renewal prices:** not shown anywhere. Domain cards say "/1st yr", which suggests renewal differs; the registry renewal fee for `.co.ke` equals the create fee. Either show "renews at KSh X/yr" or drop "1st".
## Backend and nPanel actions (cannot be fixed from the website)

| # | Action | Why | Priority |
| --- | --- | --- | --- |
| B-1 | Compute domain-transfer prices server-side and ignore client price fields | C-1: a transfer can be quoted at KES 1 + VAT | **P0, before launch** |
| B-2 | Configure VDS and Dedicated margins in nPanel admin | S-1: both products currently sell at cost | **P0, before launch** |
| B-3 | Recheck domain availability before payment starts; define refund or credit when registration fails after payment | C-2: taken domains can be quoted | P1 |
| B-4 | Reuse the KeNIC EPP session (keep-alive) and allow parallel checks | Cold login is ~28 s; concurrent checks queue | P1 |
| B-5 | Cache registry fees (create and renew) for hours, not per quote | C-7: `.co.ke` quotes take 5–8 s | P1 |
| B-6 | Warm the server catalogue cache on a schedule | Cold VPS plan list takes 20 s | P2 |
| B-7 | Return a product name for every dedicated plan | S-2 | P2 |
| B-8 | Stop sending raw EPP XML to the browser | Leaks registry internals; ~3 KB per lookup | P2 |
| B-9 | Alias public tRPC procedures (for example `servers.*`, `domains.intl.*`) | Upstream provider names are visible in the network tab | P2 |
| B-10 | Update the hosting catalogue: uptime row to "99.99% uptime target"; replace "Unlimited" values with real allowances or confirm fair use; fix Basic having fewer FTP accounts (3) than Starter (4); Basic priced YEARLY (3,899) while other plans are MONTHLY; Deluxe 833.4 is not a round price | The website currently corrects these at display time | P2 |
| B-11 | Provide test access: an M-Pesa STK and Jenga sandbox, a test customer account and a non-production order path | Payment, order creation and provisioning could not be tested end to end without real money | Needed for sign-off |
| B-12 | Create the order from the payment callback (M-Pesa result URL, Jenga notification), not only when the browser calls `orders.createFromPayment` | A customer who pays and closes the tab may have paid with no order and no provisioning | **P0, confirm before launch** |
| B-13 | In `orders.createFromPayment`, build the order from the server-stored payment intent and check the paid amount against a fresh quote; ignore the cart the browser re-sends | The browser sends the cart again at order time; a changed cart must not be accepted against an earlier, smaller payment | **P0, confirm before launch** |
| B-14 | Return a renewal price in the quote and catalogue | The site cannot state renewal prices (item 2) | P2 |

## Claims that still need business confirmation

Updated 8 November 2026. Wording is quoted exactly as it appears on the site today. "Unverified" means no evidence was available in the website code, the nPanel catalogue or a public source; nothing here has been invented or removed without a record.

| # | Claim (verbatim) | Page(s) | Source file | Evidence found | Classification |
| --- | --- | --- | --- | --- | --- |
| 1 | "daily backups" ("NVMe SSD servers with free SSL, daily backups and hosting tools") | `/hosting/shared`, `/hosting/wordpress`, `/security`, homepage features | `hosting/shared/page.tsx`, `hosting/wordpress/page.tsx`, `Features.tsx`, `hosting-pricing-configs.ts` | The shared-hosting catalogue has no backups row; WordPress Launch (Starter) does not list daily backups | **Needs owner confirmation** (per plan) |
| 2 | "guaranteed CPU and RAM" | `/hosting/vps`, `/hosting/dedicated-servers` | `hosting/vps/page.tsx`, `hosting/dedicated-servers/page.tsx` | Dedicated: physical hardware, so true by definition. VPS: depends on the upstream plan type (dedicated vs shared vCPU) | **Needs owner confirmation** for VPS |
| 3 | "Up to 5× faster performance" | `/security`, `/pricing?product=security` | `security/_components/SecurityPlans.tsx` | No benchmark or published basis | **Unverified metric**; recommend removing |
| 4 | "Daily malware scanning (4×/day)" | `/security`, `/pricing?product=security` | `security/_components/SecurityPlans.tsx` | Mixes two frequencies | **Needs owner confirmation** of the real schedule |
| 5 | "Wildcard Upgrade (unlimited subdomains)" | `/hosting/ssl` | `hosting/ssl/page.tsx` | Standard property of a wildcard certificate (one level of subdomains) | **Accurate as a certificate property**; kept |
| 6 | "Nisc Cloud, an authorised Microsoft partner" / "Nisc Cloud is an authorised Google Workspace partner" / "As an authorised Microsoft 365 and Google Workspace partner" | `/hosting/microsoft-365`, `/hosting/google-workspace`, homepage | `PartnerServicePage.tsx`, `ConnectedServices.tsx` | No partner ID, Partner Center or Google Partner Directory listing available to check | **Needs evidence** (partner IDs) before launch |
| 7 | "200+ extensions" / "200+ TLD Extensions" / "200+ Extensions Supported" | `/hosting/domains`, `/domain-transfer` | `hosting/domains/page.tsx`, `domain-transfer/page.tsx` | International registrar catalogue not inspectable (sparse clone); search covers .ke plus international TLDs | **Needs confirmation** of the live TLD count |
| 8 | "WHOIS Privacy Where Available" | `/hosting/domains` | `hosting/domains/page.tsx` | Wording already limited; KeNIC publishes limited data for .ke | **Accurate as worded**; confirm price, if any, for gTLDs |
| 9 | "Free migration" ("Free migration included on all plans", "Free Mailbox Migration", "Free migration and setup help when you join us") | `/hosting/wordpress`, `/hosting/email`, `/about`, cart included-items | `hosting/wordpress/page.tsx`, `hosting/email/page.tsx`, `AboutFeatureBlocks.tsx`, `OurStory.tsx`, `CartItem.tsx` | Owner confirmed free mailbox migration for email; WordPress and general migration scope not documented | **Needs scope confirmation** (number of sites, limits) |
| 10 | "No setup fee on 3-month commitment." | `/services/zeepo-ai`, `/pricing?product=zepo-ai` | `src/lib/service-packages.ts` (`SERVICE_PACKAGE_NOTES.ZEPO_AI`) | No commercial terms on file. "AI improves over time" was removed from the same note | **Needs owner confirmation** |
| 11 | "Free installation" on every SSL certificate | `/hosting/ssl`, `/security/ssl` | `hosting/ssl/page.tsx`, `security/ssl/page.tsx`, `service-packages.ts` | Service promise, not checkable from code | **Needs owner confirmation** |
| 12 | Microsoft 365 and Google Workspace list prices | `/hosting/microsoft-365`, `/hosting/google-workspace`, `/pricing` | `LicencePlansSection.tsx` | microsoft.com and Google Workspace Help Centre, checked 8 Nov 2026 | **Verified**; recheck before launch |

Resolved since the previous version of this list:
- Renewal reminders: owner confirmed **60, 30 and 7 days**; `/hosting/domains` and `/help` now say the same thing. The "30-day grace period" promise was replaced by ICANN's post-expiry notice for gTLDs and KeNIC's rules for .ke.
- Free email plan: hidden from the website (owner); free email is described as a domain perk.
- Uptime: **99.9% target** everywhere, including Terms §18.1, the catalogue normaliser and `llms.txt`.
- Removed as unsupported: "Results in 30 days or we keep working", "100+ businesses growing with us", "Annual billing saves X%" and "Multi-year discounts available" (no multi-term discount exists in the quote), "24/7 local support", the Zepo "assistant that knows your account" wording, and the Nisc Mail 2FA and smart-sorting claims.

Resolved by the owner on 7 Nov 2026: shared hosting storage is **NVMe SSD** everywhere; catalogue "Unlimited" values are shown as **"Unlimited\*"** with the fair-use footnote (this overrides the earlier "remove unlimited resources" ruling for catalogue rows only; the reworded marketing packages stay as they are).
## Final report (item 10)

**Production readiness: not ready to take payments yet.** The website side is ready for a preview deploy. Launching sales needs the two P0 backend fixes, answers on how orders are created after payment, and a short list of owner confirmations. Nothing has been committed or deployed.

### Fixed on the website

1. `/work`: fabricated case studies and their pages removed; confirmed client logos and capabilities shown instead.
2. Commerce: VDS and Dedicated cards priced with the wrong margins (they now match the cart); cart hosting upsell missing the recommended Basic plan; "All prices include VAT" corrected; free email plan no longer leads to a cart that refuses it.
3. KeNIC lookups: one shared, queued registry client; 60 s timeout instead of 30 s; waiting notice and a "Check again" card instead of silent failure; the price-table probe moved to a background lane and only runs when the table is on screen; international results shown without waiting for KeNIC.
4. Server plans: shared, cached catalogue reads, prefetch on menu hover, and skeletons.
5. Architecture and dependencies documented in `design/commerce-architecture.md`.
6. Claims: 99.99% uptime target (and Terms §18.1), "100+ clients" and SLA wording removed, "unlimited" reworded in marketing packages, support hours, guaranteed resources, accreditation, domains-page accuracy, NVMe everywhere, "Unlimited*" with the fair-use footnote.
7. Real 404s: route list shared by the Bun host and a generated `vercel.json`; build fails if they drift; `dist/404.html` is served with HTTP 404.
8. Client logos: inventory above; the home trust visual now uses the shared list.
9. Package cards: Design A applied to shared, WordPress and email hosting, `/pricing`, SEO, email marketing and the static service packages.
10. Accessibility: `<main>` landmark on the 12 page files that lacked it and on the 404 page; every checked page has one `h1` and one `main`.
11. CA and KeNIC accreditation logos in the footer and under the domain search.

### Tests actually run

See "Regression results" above: type checks, lint, production build, full-page checks at three widths on 10 pages plus the 404 page, the interaction suite (14 checks, all passing), and price comparisons between package cards and cart quotes. All against the live API, read-only: signed cart links and quotes only, no accounts, leads, payments, orders or registrations.

### Remaining website issues

- A cold KeNIC registry still makes the first `.co.ke` search take up to about a minute (the registry itself took 52.9 s). The page now explains the wait and offers a retry, but only B-4 removes it.
- Renewal prices are not shown, and domain cards say "/1st yr" (needs B-14 or a wording change).
- 404 behaviour and the proxy timeout for slow registry calls need confirming on a Vercel preview deploy.
- 38 ESLint warnings remain (pre-existing, none are errors). The main JavaScript bundle is 965 KB (293 KB gzipped); worth splitting after launch.
- Four client logos are over 90 KB and should be compressed.

### Backend and API issues

B-1 to B-14 in the table above. Before launch: **B-1** (transfer price taken from the browser), **B-2** (VDS and Dedicated sold at cost), **B-12** (order created only if the browser calls back) and **B-13** (order built from the re-sent cart).

### Needs nPanel or partner access

Payment sandboxes (M-Pesa Daraja, Jenga), a non-production order path, KeNIC test (OT&E) credentials, the international registrar's sandbox, and a resettable test customer (B-11). Without them, payment, order creation and provisioning remain untested.

### Claims and permissions still outstanding

The six items under "Claims that still need business confirmation", including the conflicting renewal-reminder schedules on `/help` and `/hosting/domains`. Logo permissions are confirmed by the owner; keep written consent from each client on file. Confirm M-Pesa logo use under the payment agreement.

### Blockers to launch, in order

1. B-1 and B-2 fixed in nPanel.
2. B-12 and B-13 answered (and fixed if needed).
3. One paid end-to-end test per payment method in a sandbox (B-11).
4. Owner answers on the open claims.
5. Preview deploy checked (404s, proxy timeout), then authorisation to commit and deploy, leaving `.agents/` and `skills-lock.json` out of the commit.
### Checkout terms acceptance and fair-use link (Phase 6.2 / 6.3)

- `StorefrontPaymentDialog.tsx`: added an order-level, **unchecked** checkbox above the payment methods: "I have read and agree to Nisc Cloud's Terms of Service, including the applicable renewal, cancellation and acceptable-use terms." Links go to `/terms`, `/terms#billing`, `/terms#cancellation` and `/terms#acceptable-use` (all anchors exist). Both M-Pesa (`handlePay`) and card (`handleCardPay`) refuse to start until it is ticked, with an inline `role="alert"` message. It is separate from any marketing consent. The existing registration-only checkbox in `CustomerInfoStep` is unchanged.
- **Backend dependency (Not Verified):** acceptance is enforced in the browser only. The payment and order APIs expose no field for it, and the schema can't be inspected (sparse clone), so nothing extra is sent. The server should require and store `termsAccepted`, a terms version (currently the effective date "1 September 2025"), a timestamp and the order reference, and reject orders without them.
- `FAIR_USE_HREF` was `/legal/terms#acceptable-use` (a 404). It is now `/terms#acceptable-use`. The plan-card footnote now describes what §11 actually says: excessive, unreasonable strain on shared infrastructure.
- **Legal drafting gap:** §11 has no explicit "unlimited / fair use" clause defining what "unlimited" bandwidth, storage or mailboxes mean, or what happens when usage exceeds normal levels (notice, throttling, upgrade). Proposed for legal review: "Resources described as unlimited are provided for the normal operation of a single customer's own websites and email. If usage materially exceeds typical use on comparable plans or affects other customers, we will notify you and may ask you to reduce usage or move to a suitable plan before restricting the service." This text has **not** been added to the Terms.
- Also fixed the "Payment confirmed  creating your order…" string (double space, lost dash).

## 8 November 2026: pricing, naming, CTA and SEO pass

Validation for everything below: `tsc --noEmit` clean, ESLint 0 errors (37 pre-existing warnings; the one this pass introduced was fixed), `bun run build` passes, `routes:sync --check` clean. Browser checks on the local dev server against the live nPanel API, read-only (signed cart links and quotes only; no leads, accounts, payments or orders).

**Pricing and checkout**
- Public plan names come from `src/lib/plan-catalog.ts` (see `plan-naming-map.md`); backend plan IDs, names sent to the order API, prices and checkout are unchanged. Ultimate and the free mailbox are hidden.
- Billing-cycle selector (Monthly, 1, 2, 3 years) on web, WordPress and email cards; SEO and email marketing monthly only. The card shows the monthly equivalent, the amount billed for the term, VAT and the renewal price, computed with the same rule as the server quote. Verified: Grow on 2 years shows KES 7,798, and the cart quote returns 7,798 + VAT = 9,046.
- Corporate custom-pricing cards (web hosting, Nisc Mail, Corporate Search) open `/contact?tier=corporate`, which shows optional organisation fields. Details go into the message text because the lead API schema cannot be inspected. A honeypot field and a 3-second minimum fill time quietly drop bot submissions.
- Cart: the strike-through and "Save 0%" no longer appear when there is no saving; "Billed for Monthly" now reads "Billed monthly"; included-item lists match each product. Layout widened from 1,024 px to 1,152 px, with the summary column going from 340 px to 380 px at 1,280 px and wider; no horizontal overflow at 390 px.
- Domain results show the renewal price where KeNIC returns one, and "Renewal price shown in cart" otherwise.

**Single pricing catalogue**
- `src/lib/service-packages.ts` now holds the fixed-price packages (brand identity, website design, ecommerce, social media, paid ads, Zepo AI, SSL) and their notes. Each service page, `/security/ssl` and `/pricing` import the same constants; there were previously two or three copies.
- `/pricing` rebuilt with a grouped sidebar (Cloud Products, Productivity, Business Solutions with a Digital marketing subgroup, Agencies), a native grouped select on screens narrower than 1,024 px, and `?product=` deep links. Every panel reuses the product page's component. All 23 panels were checked in the browser. Plan grids use container queries, so four cards fall back to two per row inside the narrower panel instead of truncating their spec tiles.
- Removed from `/pricing`: the "Cloud Plans" bundles (Launchpad, Orbit), which had no product page.

**Closing CTA**
- New shared `ClosingCta` (`src/components/closing-cta.tsx`): a midnight panel with sky-blue slashes and pixel clusters, framed support artwork (`public/artwork/closing-cta-support.webp`, adapted from the reference artwork, which was not modified) and three floating chips (motion-safe only). It is used by every `ServicePageShell` page, `/security` (and its sub-pages via `SecurityCTA`), `/about`, `/pricing` and `/platform`. The homepage keeps its two-path close. "Results in 30 days" was replaced by "Free strategy call".

**Navigation and naming**
- New `/platform` page (nPanel and Zepo AI). The nav item "nPanel" (an external link) became "Platform" (`/platform`). `/services/zepo-ai` redirects to `/services/zeepo-ai`. Public copy says "Zepo"; route slugs and identifiers are unchanged.
- Persona order is Businesses, Agencies, Developers (homepage hero and nPanel showcase). Goal-selector tabs lost their icon chips and gained a sky-blue indicator bar; the illustration, CTA and swipe rail are unchanged.
- Off-brand purple and green accents replaced with brand blues and orange (`Services`, `DashboardPreview`, `BuildRunGrow`, `/help` categories, `/pricing` hero, `/security` SSL band).

**SEO**
- All 42 public routes crawled in the browser: each has one H1, the correct canonical and JSON-LD. `applyPageMeta` now fits descriptions to 160 characters on a sentence boundary (service pages reused hero text of up to 247 characters). Four titles over 65 characters were shortened.
- `/platform` added to routes, `route-meta.ts`, `vercel.json` (52 routes) and `sitemap.xml` (49 URLs).
- `index.html` `<noscript>` and `public/llms.txt` no longer carry stale prices or removed claims; dead `/work/<case-study>` links were removed from `llms.txt`.

**Backend dependencies (Not Verified; the backend cannot be inspected)**
- Terms acceptance is enforced in the browser only; the order API should require and store it (see the Phase 6.2 section).
- Lead API: no fields for organisation size, environment, migration or start date, and no server-side spam protection could be confirmed. The honeypot is client-side only.
- Renewal prices for non-KeNIC domains are not returned (B-14).
- The free mailbox plan has no price and the quote rejects it; it is hidden rather than fixed.
- Microsoft 365 and Google Workspace have no catalogue entries; margins are to be added in nPanel (owner).