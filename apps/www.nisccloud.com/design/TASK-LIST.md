# Nisc Cloud — master task list

Last updated: 10 November 2026
Branch: `npanel-ai-updates` (not pushed: GitHub rejects this machine's SSH key)

This is the one place for everything still to do on the Nisc Cloud website, nPanel and checkout: urgent items, things waiting on the owner, developer backlog, recommendations, and what is already built. Other design documents hold the detail; this list says what to do next and who does it.

## How to use this list

- **Priority:** `P0` blocks launch or taking payments · `P1` before or just after launch · `P2` improvement.
- **Who:** `Owner` (Nisc Cloud management) · `Dev` (website or nPanel developer) · `Backend` (nPanel API/database) · `Accountant` · `Legal`.
- **Status:** `Not started` · `Partial` · `Done — not deployed` · `Blocked` (waiting on someone else).
- When you finish an item, change its status and add the date. Don't delete rows; move finished items to section 6.
- IDs are stable, so you can refer to them in commits and chats, e.g. "fixes PAY-03".

---

## 1. Urgent — do these first

In this order. Nothing here has been done yet.

| # | ID | Task | Who | Why it's urgent |
| --- | --- | --- | --- | --- |
| 1 | OPS-01 | Push branch `npanel-ai-updates` to GitHub using credentials that can write to `githubnisccloud/nPanel` | Owner/Dev | Recent commits exist only on this computer (`git status -sb` shows how many) |
| 2 | PAY-01 | Price domain transfers on the server; ignore the price the browser sends | Backend | **Critical:** a transfer can be quoted at KES 1 + VAT (`storefront-cart-pricing.ts`, `resolveMainLineQuote`, `domain_transfer` branch) |
| 3 | PAY-02 | Set VDS and Dedicated server margins in nPanel admin | Owner | Both currently sell at cost |
| 4 | OPS-02 | Run migrations `0072`, `0073`, `0074` on the production database | Backend | Must happen before the server deploy, or user/order queries can fail |
| 5 | OPS-03 | Deploy the server, then confirm `storefront.location.detect` and `storefront.location.displayFx` return 200 | Backend | Live API returns 404 for both today, so every visitor sees KES |
| 6 | SEC-B1…B4 | Start the backend security P0s in section 3.3 | Backend | Cross-tenant access and payment-callback risks found in the nPanel review |
| 7 | PAY-05 | One sandbox payment per method (M-Pesa, Jenga card, Paystack), plus failed, cancelled, duplicate and closed-tab cases | Backend | Payment and order creation have never been tested end to end |
| 8 | CLM-01 | Fix the remaining public claims in section 3.6 | Dev | "24/7" support, "SLA", "within 24 hours" and unproven figures are still live |

---

## 2. Waiting on the owner

### 2.1 Business and account setup

| ID | Task | Who | Status | Notes |
| --- | --- | --- | --- | --- |
| BIZ-01 | Create the Nisc Cloud Paystack business account and finish KYB (directors, bank, tax) | Owner | Not started | Use the company's legal details |
| BIZ-02 | Ask Paystack to confirm USD collection and USD settlement for a Kenyan merchant | Owner | Not started | Decides whether card payments can be in USD |
| BIZ-03 | Get Paystack sandbox keys and give them to the backend developer securely | Owner | Blocked by BIZ-01 | Never paste keys into chat or source code |
| BIZ-04 | Accountant approval for foreign zero-rating and foreign-currency eTIMS | Accountant | Not started | Both are disabled; every sale uses 16% VAT for now |
| BIZ-05 | Arrange an independent review of the payment changes | Owner | Not started | Before taking real foreign payments |
| BIZ-06 | Provide test access: M-Pesa Daraja and Jenga sandboxes, KeNIC OT&E credentials, registrar sandbox, a resettable test customer | Owner/Backend | Not started | Needed for PAY-05 |
| BIZ-07 | Edit the Web Hosting and WordPress product descriptions in nPanel admin | Owner | Not started | They still say "24/7 local support", "Lightning-fast", "enterprise security", "in minutes" and appear on pricing pages |
| BIZ-08 | Legal review of a fair-use clause for "Unlimited*" resources | Legal | Not started | Draft wording is in `pre-launch-remediation-log.md` |
| BIZ-09 | Set up a maintained public status page, if wanted | Owner | Not started | No status link is shown until one exists |

### 2.2 Claims to confirm or provide evidence for

The website currently uses cautious wording for each of these. Confirm, correct, or tell us to remove. Details in `trust-claims-inventory.md` and section F of `ux-content-proposal-2026-11-09.md`.

| ID | Claim | What we need from you |
| --- | --- | --- |
| EVD-01 | Licensed by the Communications Authority of Kenya; KeNIC-accredited registrar | Licence category and number, current KeNIC listing, permission to use both logos |
| EVD-02 | ODPC registration 160-3417-5D07 | Copy of the certificate; confirm it's current |
| EVD-03 | Microsoft 365 and Google Workspace partner status | Partner programme, tier and ID. Partner wording was removed until this arrives |
| EVD-04 | 17 client logos on the homepage and Our Work (possible duplicate Ashut/APL) | Written permission per logo; confirm duplicates |
| EVD-05 | Support and sales hours | Hours per channel (ticket, email, chat, phone, WhatsApp), staffed or automated, response targets |
| EVD-06 | Cancellation and refunds | One policy per product: "cancel anytime" or 30 days' notice, minimum terms, which products are refundable |
| EVD-07 | Dedicated account manager | Which plans include one |
| EVD-08 | Backups | Schedule, retention, storage location and restore cost per plan |
| EVD-09 | Security inclusions (WAF, DDoS, CDN, auto-scaling, malware scans) | Which plans include each; real malware-scan frequency |
| EVD-10 | Hosting specs (LiteSpeed, NVMe, VPS guaranteed CPU/RAM) | Confirm per plan |
| EVD-11 | SSL (Sectigo issuer, free installation) | Confirm issuer and reseller relationship |
| EVD-12 | Migration | What "free migration" covers: number of sites, mailboxes, size limits |
| EVD-13 | Delivery times (brand ~7 days, email setup ~30 min, website 10/14/21 days) | Confirm or let us remove the numbers |
| EVD-14 | Zepo AI capabilities (channels, languages, integrations, setup time, "no setup fee on 3-month commitment") | Which features are live today and for which plans |
| EVD-15 | SEO "results in 60–90 days" and "extra work if no progress by month 3"; ads "leads in 24–48 hours" | Evidence, or approve removal |
| EVD-16 | Figures: "thousands of customers", "500+ businesses", "300+ campaigns", "KES 50 million ad spend", blog ROI and WhatsApp statistics | Records and permission to publish, or approve removal |
| EVD-17 | Company history on About (2018/2020/2022/2024 timeline, founding year) | Confirm dates |
| EVD-18 | "200+ domain extensions" | Live TLD count |
| EVD-19 | Security plans "up to 5× faster" | Benchmark, or approve removal |
| EVD-20 | M-Pesa logo use; which payment methods are live | Confirm under the payment agreements |

### 2.3 Decisions and approvals

| ID | Decision | Options |
| --- | --- | --- |
| DEC-01 | nPanel KES/USD account setting | Keep it (customers choose how nPanel shows prices) or remove it (nPanel follows location like the website) |
| DEC-02 | Homepage: merge the goal selector with the Build/Run/Grow section | Approve or keep both (`frontend-design-audit-2026-11-10.md`) |
| DEC-03 | Give Businesses, Agencies and Developers different page layouts, not just different copy | Approve or keep current |
| DEC-04 | Replace the About page "team behind your account" section | Founder story, real team photos, or keep |
| DEC-05 | Merge `/security/ssl` into `/hosting/ssl` | Approve after a Search Console check, or keep both |
| DEC-06 | Remove the temporary `?hero=` colour previews from `Hero.tsx` and `index.css` | Confirm the current hero is final |
| DEC-07 | Add `includeSubDomains` and `preload` to HSTS | Only if every `*.nisccloud.com` host is HTTPS-only |
| DEC-08 | Real HTTP 404s: stay on Vercel (404 page with `noindex`, status 200) or host on the Bun server | Platform choice |
| DEC-09 | Use real nPanel screenshots on the website | Approve which screens, with customer data redacted |

---

## 3. Developer backlog

### 3.1 Release and deployment

| ID | Task | Pri | Who | Status |
| --- | --- | --- | --- | --- |
| OPS-01 | Push `npanel-ai-updates` to GitHub | P0 | Owner/Dev | Blocked (SSH key) |
| OPS-02 | Run migrations 0072–0074 on production before deploying the server | P0 | Backend | Not started |
| OPS-03 | Deploy the server; check the location and FX endpoints | P0 | Backend | Not started |
| OPS-04 | Set a paid `EXCHANGERATE_API_KEY` on the server | P1 | Backend | Not started — the free endpoint is used without it |
| OPS-05 | Preview deploy of the website; check status codes (200/301/404), proxy timeouts for slow registry calls, robots/noindex on preview | P1 | Dev | Not started |
| OPS-06 | Write a rollback plan for the server deploy and migrations | P1 | Backend | Not started |
| OPS-07 | Don't commit `bun.lock` from a sparse checkout; exclude `.agents/` and `skills-lock.json` | P1 | Dev | Ongoing rule |

### 3.2 Payments and checkout

| ID | Task | Pri | Who | Status |
| --- | --- | --- | --- | --- |
| PAY-01 | Server-side domain-transfer pricing (registry fee + margin); ignore `customerPriceAmount` | P0 | Backend | **Not started** |
| PAY-02 | VDS and Dedicated margins configured | P0 | Owner | Not started |
| PAY-03 | Order created from the verified payment (M-Pesa query, Jenga update, Paystack reconcile) using the stored quote, not the browser's cart | P0 | Backend | Done in code — **untested in sandbox** (`storefront-order-completion.ts`) |
| PAY-04 | Paystack: backend initialisation, InlineJS, signed webhook, verification, replay protection | P0 | Backend | Done in code — **switched off** until BIZ-01…03 |
| PAY-05 | Sandbox test plan: forged callback, duplicate callback, underpayment, cart swap, another customer's reference, direct return URL, cancel/timeout/reversal, closed tab, audit trail | P0 | Backend | Not started (needs BIZ-06) |
| PAY-06 | Store terms acceptance on the server (terms version, timestamp, order reference) and reject orders without it | P1 | Backend | Not started — the checkbox is enforced in the browser only |
| PAY-07 | Recheck domain availability before payment; define refund or credit when registration fails after payment | P1 | Backend | Not started |
| PAY-08 | Return renewal prices in quotes and the catalogue for all domains | P2 | Backend | Not started |
| PAY-09 | Enable foreign zero-rating and foreign-currency eTIMS | P2 | Backend | Blocked by BIZ-04 |

### 3.3 Security and vulnerabilities

From the read-only nPanel backend review (chat, 10 Nov) and `security-audit-report.md`. None of the backend items below have been fixed.

| ID | Task | Pri | Who | Status |
| --- | --- | --- | --- | --- |
| SEC-B1 | Role, tenant, ownership and entitlement checks on every Plesk, KeNIC, Zepo Canvas and certification endpoint; cross-tenant tests | P0 | Backend | Not started |
| SEC-B2 | Cryptographic verification and replay protection for Jenga and M-Pesa callbacks before any payment or invoice change | P0 | Backend | Partial — settlement now uses server status checks and exact amount matching; callback authentication and replay controls still to confirm |
| SEC-B3 | Close the MFA settings bypass; rate-limit sign-in and re-authentication; stop account enumeration (`storefront.auth.checkEmail`); revoke sessions on suspension | P0 | Backend | Not started |
| SEC-B4 | Remove or isolate legacy FTP filesystem operations and SSRF paths; bind VPS SSH tickets to an authorised team, device and host | P0 | Backend | Not started |
| SEC-B5 | Authenticate every state-changing webhook; fail closed when secrets are missing; idempotency and replay controls | P1 | Backend | Not started |
| SEC-B6 | Encrypt domain transfer codes, FTP passwords, legacy OAuth/session tokens and backups; test off-host backup restores | P1 | Backend | Not started |
| SEC-B7 | Malware/phishing scanning before publishing customer sites, upload type controls, abuse reporting, takedown and quarantine (lesson from Hostinger's phishing problems) | P1 | Backend | Not started |
| SEC-B8 | Server-side rate limits and bot protection (e.g. Cloudflare Turnstile) on `storefront.leads.submit`, `auth.*` and payment initiation | P1 | Backend | Partial — quote endpoint is rate-limited; forms have a browser-only honeypot |
| SEC-B9 | Stop sending raw KeNIC EPP XML to the browser | P2 | Backend | Not started |
| SEC-B10 | Alias tRPC procedure names that expose providers (`hivelocity.*`, `openProvider.*`) | P2 | Backend | Not started |
| SEC-W1 | Limit AI chat images to `storage.nisccloud.com` | P2 | Dev | Not started |
| SEC-V1 | After fixes: authorisation and payment integration tests, dependency and secret scans, infrastructure review, independent penetration test | P0 before launch | Backend | Not started |

### 3.4 Currency

| ID | Task | Pri | Who | Status |
| --- | --- | --- | --- | --- |
| CUR-01 | Deploy location and FX endpoints (see OPS-02, OPS-03) | P0 | Backend | Not started |
| CUR-02 | Decide the nPanel account setting (DEC-01), then keep or remove `display-currency-preference.tsx` and the preference API | P2 | Owner → Dev | Waiting on decision |
| CUR-03 | Show the currency source on the cart (e.g. "Prices in USD based on your location") now the navbar selector is gone | P2 | Dev | Not started — recommendation |

### 3.5 Domains

| ID | Task | Pri | Who | Status |
| --- | --- | --- | --- | --- |
| DOM-01 | Keep the KeNIC EPP session alive and allow parallel checks (cold `.co.ke` search can take ~1 minute) | P1 | Backend | Not started — the website already shows a wait notice and retry |
| DOM-02 | Cache registry fees for hours instead of per quote | P1 | Backend | Not started |
| DOM-03 | Provider-side transfer status and EPP validation feeding the nPanel transfer list | P2 | Backend | Not started — UI polls every 30 s already |

### 3.6 Claims and content fixes (developer side)

| ID | Task | Pri | Who | Status |
| --- | --- | --- | --- | --- |
| CLM-01 | Remove "24/7" human support wording on `/help` and in `public/llms.txt`; replace "within 24 hours" on `/contact` with "within one working day" | P1 | Dev | Not started |
| CLM-02 | Change "99.9% uptime SLA" to "uptime target" and remove "500+ businesses", "300+ campaigns" and ownership comparisons in Zepo AI prompts (`zeepo-ai/prompts.js`, `zeepo-agent/prompts.js`) | P1 | Dev | Not started |
| CLM-03 | Remove or qualify fixed timelines (website 10/14/21 days, "live in hours", WordPress "2 to 3 minutes", domain "within minutes") | P1 | Dev | Not started (waiting on EVD-13) |
| CLM-04 | Remove "thousands of customers" (About), KES 50M ad spend and the named byline, Zepo ROI and WhatsApp statistics in blog posts | P1 | Dev | Not started (waiting on EVD-16) |
| CLM-05 | Fix "no extra transfer fee" (home FAQ), "so you stay online" (pricing FAQ), "never compromises" (dedicated CTA), "30 days notice" (`llms.txt`), paid-ads "how many leads and sales each campaign generated" | P1 | Dev | Not started |
| CLM-06 | Fix stale blog prices ("shared hosting at KES 350/mo"; live starter is KES 149) | P2 | Dev | Not started |
| CLM-07 | Align catalogue data: "SSD" vs NVMe, "guarantee" vs target, Basic FTP count, Basic billed yearly, non-round prices, missing dedicated plan names, raw SKUs as plan names | P2 | Backend | Not started — the website corrects some at display time |

### 3.7 Website features

| ID | Task | Pri | Who | Status |
| --- | --- | --- | --- | --- |
| FEA-01 | Hybrid email savings calculator (Nisc Mail mixed with Microsoft 365 / Google Workspace) | P2 | Dev | Not started — needs verified seat and licence prices |
| FEA-02 | Deeper SEO and paid-media content: technical/on-page/off-page, wider search discovery, budget optimisation, remarketing, measurement — as methods, not promised results | P2 | Dev | Partial — some on `/services/paid-ads` |
| FEA-03 | Real nPanel screenshots, redacted, labelled as real; transformed into editorial compositions | P2 | Dev | Partial — `visualKind="npanel-product-view"` support exists; no screenshots yet (DEC-09) |
| FEA-04 | Server-side 301s for any remaining legacy URLs (`/services/marketing` → `/services`) and sitemap/canonical updates | P2 | Dev | Partial — `/services/zeepo-ai` redirect done |

### 3.8 Design, UX and accessibility

| ID | Task | Pri | Who | Status |
| --- | --- | --- | --- | --- |
| UX-01 | Add a "Skip to main content" link | P1 | Dev | Not started |
| UX-02 | Fix the homepage closing button: sky-blue text on white is about 2.1:1 contrast (`HomeClosing.tsx`) | P1 | Dev | Not started |
| UX-03 | Raise small `text-white/45` text on the closing CTA to at least 4.5:1 (`closing-cta.tsx`) | P1 | Dev | Not started |
| UX-04 | Make "Create account" a link, not a button | P2 | Dev | Not started |
| UX-05 | Replace the rainbow colours on About "Core values" with brand colours | P2 | Dev | Not started |
| UX-06 | Use the existing type scale (`.type-h1` etc.) instead of hard-coded sizes; reserve Space Mono for real technical data; drop uppercase mono labels | P2 | Dev | Not started |
| UX-07 | Stop colouring one phrase in every headline sky blue | P2 | Dev | Not started |
| UX-08 | Reduce remaining continuous animations (Build/Run/Grow spins and pings, CSS loops, closing CTA glow/orbit) | P2 | Dev | Partial — shared section entrances removed |
| UX-09 | Three standard section gaps and three corner radii | P2 | Dev | Not started |
| UX-10 | Add a visually hidden H1 on `/cart` | P2 | Dev | Not started |
| UX-11 | Manual keyboard and screen-reader pass; Lighthouse and real-user Core Web Vitals | P1 | Dev | Not started |
| UX-12 | Hub artwork for `/hosting` and a newer illustration for `/hosting/domains` | P2 | Dev | Not started |
| UX-13 | Self-host or replace Unsplash images on About | P2 | Dev | Not started |

### 3.9 Performance and tidy-up

| ID | Task | Pri | Who | Status |
| --- | --- | --- | --- | --- |
| TEC-01 | Cache or pre-render server plan lists (VPS/VDS/Dedicated take 5–20 s cold) | P1 | Backend | Not started |
| TEC-02 | Split the main JavaScript bundle (~965 KB, 293 KB gzipped) | P2 | Dev | Not started |
| TEC-03 | Compress the four client logos over 90 KB | P2 | Dev | Not started |
| TEC-04 | Delete unused `showcase-stages.tsx` (~3,700 lines), `BentoFeatures.tsx` and `feature-01/*` | P2 | Dev | Not started |
| TEC-05 | Confirm Vercel Web Analytics is enabled | P2 | Owner/Dev | Not started |
| TEC-06 | Start the local database (Docker Desktop) so plans, cart and checkout can run fully locally | P2 | Dev | Not started |

---

## 4. Recommendations (not yet requested)

- **Show currency on the cart** (CUR-03): with the selector gone, a short "Prices in USD based on your location" line on the cart avoids surprise for visitors using a VPN or travelling.
- **Let support override currency for a customer** if a foreign customer needs to pay in KES, since visitors can no longer switch themselves.
- **Do the security P0s before marketing USD to foreign customers.** Foreign traffic increases abuse and fraud attempts.
- **Learn from Hostinger's history:** scan new sites for phishing and malware, limit what free or preview sites can publish, and have a fast takedown process (SEC-B7). Store passwords hashed only and keep dependencies current.
- **Keep Kenya-specific advantages (KeNIC, M-Pesa, KES pricing) as supporting evidence,** not the headline, so Nisc Cloud reads as a premium technology company.
- **Publish exact support hours** once EVD-05 is answered; vague hours are the most repeated claim problem.

---

## 5. What is built — status by feature

Nothing below is deployed. "Done" means the code is committed and passed type checks, lint and the production build.

### Fully implemented (done — not deployed)

- Currency follows location (Kenya and unknown → KES, elsewhere → USD); navbar selector removed; USD falls back to genuine KES prices if the rate fails. Tested locally as a US visitor and with a forced rate failure.
- Exchange-rate service with Redis cache (`fx-rates.ts`).
- Signed 15-minute server quotes; the payment dialog uses a snapshot taken when it opens.
- Multi-currency fields on orders, payments and invoices (migrations 0072–0073); reports avoid mixed-currency totals.
- Currency, tax, quote and Paystack HMAC unit tests (`currency-checkout.test.ts`).
- Build/Run/Grow positioning across the site, with automation across all three; services hub updated.
- Separate page structures for cloud products and managed services; Platform page restructured around nPanel.
- Product and service page content rewritten so each section has a distinct purpose.
- Brand identity page expanded with strategy content.
- Pricing loading, slow, retry, unavailable and quote-expiry states.
- Decorative entrance and hover motion removed from shared sections; illustrations back on the light/neutral style; sample-data captions removed.
- First batch of claims qualified (support, partnership, delivery, ownership, cancellation, hosting inclusions) and recorded in `trust-claims-inventory.md`.
- Website security headers and CSP, client forwarding headers stripped, dependency upgrades, malformed URL handling (SEC-06 to SEC-09).
- Real 404s on the Bun host and generated `vercel.json`.
- `/services/zepo-ai` canonical with server-side redirect from `/services/zeepo-ai`.
- Contact and enquiry forms: privacy notice, optional marketing consent, matching honeypot and timing checks.
- Stable homepage hero (no typing animation); compact static CA/KeNIC credentials.

### Partially implemented

| Feature | Done | Still missing |
| --- | --- | --- |
| Paystack | Backend, InlineJS, signed webhook, verification, replay protection | Account, keys, sandbox tests; switched off (PAY-04) |
| M-Pesa / Jenga settlement | Server status checks, exact amount matching, order from verified payment | Callback authentication review, sandbox tests (SEC-B2, PAY-05) |
| Tax | 16% VAT, KES fiscal equivalents, tax evidence stored | Zero-rating and foreign-currency eTIMS (BIZ-04) |
| Saved currency preference | Database column, API, nPanel setting | Website no longer uses it; decision pending (DEC-01) |
| Guided domain transfer | Eligibility, EPP help, DNS preparation, retries, nPanel polling | Provider-side status and EPP validation (DOM-03) |
| Terms acceptance | Required checkbox at checkout | Not stored or enforced by the server (PAY-06) |
| Anti-spam | Browser honeypot and timing check | Server-side limits and bot protection (SEC-B8) |
| KeNIC lookups | Shared queued client, 60 s timeout, wait notice, retry | Backend keep-alive and fee caching (DOM-01, DOM-02) |
| Claims | Many qualified | Evidence from owner (section 2.2), remaining fixes (section 3.6) |
| Real nPanel screenshots | Component support | Screenshots and approval (FEA-03) |
| SEO / paid-media depth | Some methods on paid ads | Full content (FEA-02) |

### Not started

Hybrid email calculator (FEA-01) · server-side transfer pricing (PAY-01) · backend security P0/P1 fixes (SEC-B1…B8) · abuse and malware scanning · penetration test · status page · renewal prices for all domains · catalogue clean-up · skip link and contrast fixes · bundle splitting · Lighthouse and screen-reader pass.

---

## 6. Finished items log

Move rows here when done, with the date and commit.

| Date | ID | What | Commit |
| --- | --- | --- | --- |
| 10 Nov 2026 | — | Location-based currency, KES fallback, selector removed | `0a31be52` |
| 10 Nov 2026 | — | Account currency preference, migration 0074, payment snapshot, Build/Run/Grow pages, claims batch | `bddb7190` |

---

## 7. Running it locally

The local website sends `/api` calls to the live server by default (`VITE_NPANEL_SERVER_URL`). To test the new location and exchange-rate endpoints before they are deployed:

```powershell
# Terminal 1 — API server on port 8050 (apps/server/.env uses a local database on 127.0.0.1:54322)
cd apps/server
bun run dev

# Terminal 2 — website; only storefront.location.* goes to the local API
cd apps/www.nisccloud.com
$env:DEV_LOCATION_API_URL='http://127.0.0.1:8050'
$env:DEV_SIMULATE_COUNTRY='US'   # leave out to behave as a Kenyan or unknown visitor
bun run dev
```

These two variables only affect the Vite dev server. Plans, cart and checkout still come from the live server until the local database runs (TEC-06).

## 8. Detail documents

- `NISC-CLOUD-WEBSITE-STRATEGY.md` (repo root) — strategy and dated change log
- `design/trust-claims-inventory.md` — every claim and its status
- `design/ux-content-proposal-2026-11-09.md` — UX proposal, claims register F1–F32, acceptance checklist
- `design/frontend-design-audit-2026-11-10.md` — design audit and approval items
- `design/security-audit-report.md` — website security findings and payment test plan
- `design/pre-launch-remediation-log.md` — backend actions B-1 to B-14 and commerce findings
- `design/launch-readiness-report.md` — 7 Nov launch audit (P0/P1/P2)
- `design/commerce-architecture.md` — how website, nPanel and provisioning connect
