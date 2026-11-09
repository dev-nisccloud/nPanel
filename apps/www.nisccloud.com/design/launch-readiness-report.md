# Nisc Cloud website — launch-readiness report

Date: 7 November 2026 · Scope: `apps/www.nisccloud.com` (Vite + React 19 + Tailwind 4) · Environment: local dev server `http://localhost:5174` proxying the live nPanel API.

Nothing has been committed or deployed. All changes are in the working tree.

## 1. Verdict

**Not launch-ready yet — one platform blocker and four content items need owner action.** Code quality gates pass (0 ESLint errors, `tsc` clean, production build OK). Every public route was opened and checked at 1440, 1024, 768, 390 and 320 px (light) and twelve key routes in dark mode; no horizontal overflow and no console errors on any route (the one warning found — a React duplicate-key warning on the three server pages — was fixed during the run). The remaining blockers are factual content that only the business can confirm, plus a hosting-platform limitation for 404 status codes.

### P0 — must fix before launch
| # | Item | Status |
| --- | --- | --- |
| P0-1 | `/hosting` (Cloud Products hub, target of the hero CTA and nav) rendered **without navigation or footer** because it imported stub `src/_components/Navbar.tsx` / `Footer.tsx` that return empty `<div>`s. | **Fixed** — imports point to the real components; stub directory deleted. |
| P0-2 | `/about` presented six fictional team members (template names, a fictional "Founder & CEO", portraits hot-linked from `images.shadcnspace.com`). | **Fixed** — replaced with a role-based "The team behind your account" section. Real people can be added later with consented photos. |
| P0-3 | `/work` and `/work/:slug` case studies read as template content: USD figures for a Kenyan SME ("From zero to $1.2M"), generic brands ("Verdant Co.", "Stackr", "Lumex Solar"), Unsplash cover photos. | **Owner decision required** — confirm each client/figure/image or remove the section before launch (the footer and nav link to it). |

### P1 — should fix before or immediately after launch
| # | Item | Status |
| --- | --- | --- |
| P1-1 | Unknown URLs return HTTP 200 on Vercel (SPA rewrite). The app now renders a proper `noindex` 404 page, and `server.ts` (Bun host) returns a real 404, but `vercel.json` rewrites cannot set a status. | **Platform limitation** — acceptable with `noindex`; for true 404s move hosting to the Bun server or add a Vercel edge function. |
| P1-2 | Two trust claims are served by the backend product descriptions (nPanel admin), not website code: Web Hosting "…free SSL, and **24/7 local support**" (shown on `/pricing` and `/hosting/shared`), WordPress "**Lightning-fast** … **enterprise security** … **in minutes**" (`/hosting/wordpress`). | **Owner edit in nPanel admin** (suggested wording in `trust-claims-inventory.md`). |
| P1-3 | "Authorised Microsoft 365 and Google Workspace partner" (homepage, `/hosting/microsoft-365`, `/hosting/google-workspace`, `/hosting/hybrid-email`) and "ODPC Reg. No. 160-3417-5D07" (footer). | **Owner evidence required** — keep only if Partner Center / Google Partner status and the ODPC registration can be shown. |
| P1-4 | `.co.ke` / `.ke` availability on `/hosting/domains` stayed in "Searching…" for more than 30 s while global TLDs priced in ~2 s (KeNIC `kenic.domainCheck.check` latency). Buyers of the primary local TLD may give up. | **Backend investigation** — add a timeout + "try again" state on the client if KeNIC cannot be made faster. |
| P1-5 | Client logo wall ("Trusted by growing businesses") needs permission confirmation for each logo. | **Owner confirmation**. |
| P1-6 | Hivelocity plan lists on `/hosting/vps`, `/hosting/vds`, `/hosting/dedicated-servers` take more than 5 s to load (`hivelocity.publicGetVpsPlans` + inventory + pricing settings), so first-time visitors see skeleton cards for several seconds; the QA captures of these pages show the skeleton state for that reason. | **Backend/caching** — cache the plan list server-side (or pre-render a static snapshot refreshed on a schedule) so the page is useful within ~1 s. |

### P2 — polish
| # | Item |
| --- | --- |
| P2-1 | `src/pages/_components/showcase-stages.tsx` (3,700 lines) is now unreferenced dead code — delete in a follow-up (left in place to keep this change set reviewable). `BentoFeatures.tsx` and `feature-01/*` are also unreferenced. |
| P2-2 | `/services` shows the same artwork twice (brand kit in the overview and in "We Build Your Brand"; SEO analytics twice) because detail blocks map to the same approved compositions. |
| P2-3 | Hivelocity plan cards show raw SKUs as plan names (`pro.sm.amd`) on `/hosting/vps`, `/hosting/vds`, `/hosting/dedicated-servers`. |
| P2-4 | `/cart` has no `<h1>` (step layout); it is `noindex` so SEO impact is nil, but add a visually-hidden H1 for assistive tech. |
| P2-5 | Contact form button flips to "Sending…" for a moment on an empty submit while client validation runs. |
| P2-6 | `/security/ssl` and `/hosting/ssl` overlap in purpose; consider consolidating or cross-linking clearly. |
| P2-7 | Blog articles quote historical prices ("shared hosting at KES 350/mo"); live starter price is KES 149. Editorial review. |
| P2-8 | `/about` story photo and `/work` covers are hot-linked Unsplash URLs — self-host or replace with real photography. |
| P2-9 | 38 pre-existing ESLint warnings (react-refresh only-export-components, exhaustive-deps) remain; none affect runtime. |
| P2-10 | Vercel Analytics `track()` is a no-op without the production script; events were verified through the `window.va` queue in dev. Confirm Web Analytics is enabled on the Vercel project. |
| P2-11 | Untracked `apps/www.nisccloud.com/.agents/` and `skills-lock.json` came from a skill install, not from this work — exclude from the commit. |
| P2-12 | `/hosting/domains` hero still uses the older photo-style illustration, which is inconsistent with the pillar-card artwork now used on the other hosting pages. |
| P2-13 | `/hosting` (Cloud Products hub) is visually thin compared with the pillar pages — icon cards only, no hero artwork. Hero top padding was increased so the headline clears the fixed nav, but a hub-level illustration would bring it in line with the rest of the site. |
| P2-14 | React warned "Encountered two children with the same key" on the three server pages because Hivelocity returns the same `product_id` for several data centres. **Fixed** — list keys now combine `product_id` and `data_center`. |

## 2. What was done in this audit (by phase)

1. **Route audit** — 44 public routes opened and checked (matrix in §4).
2. **Goal selector** — compact `tablist`: 4-up desktop, 2×2 tablet, mobile scroll-snap rail with peek, dot indicators and "1 of 4 · swipe for more"; default Run; no autoplay; labels clamp to two lines; mini visual hidden below `sm`.
3. **Hero artwork** — `EcosystemStory`, `CloudInfrastructureStory`, `AgencyDeveloperStory` in the approved pillar-card style with subtle motion (`.art-float`, `.art-dash`, `.art-signal`, `.art-typing`), all disabled under `prefers-reduced-motion`; manual story navigation only.
4. **Glass navigation** — bar keeps 86 % glass + blur; dropdowns, mega menu and mobile drawer are fully solid (`var(--popover)`) after confirming hero headlines ghosted through even 97 % opacity. Verified in both themes and on mobile.
5. **Illustrations** — Built Different bento visuals pinned per point on nine hosting/domain pages and de-duplicated by visual family; `/services` and `/about` showcase cards now render approved artwork (`THEME_ARTWORK`); library re-exported (45 compositions, WebP/PNG/SVG, inventory + README + contact sheet).
6. **Design system** — `SecurityDashboardScreen` moved from hard-coded `#38b6ff` to the `primary` token (classes and `color-mix()` inline values); `ProductsMegaMenu` focus rings use `outline-primary`; `/hosting` hub prices now "See plans and prices" instead of stale hard-coded amounts.
7. **Positioning/copy** — VPS → VDS → Dedicated ladder retained; `/hosting/shared` copy no longer quotes a starting price that the API contradicts.
8. **Trust claims** — 90 exact replacements; inventory in `design/trust-claims-inventory.md` with Verified / Needs wording / Unverified / Contradictory / Outdated classes and nine owner-authorisation items. 99.99 % → 99.9 % monthly uptime **target** (never an SLA); 30-day → 7-day money-back per Terms §10.1 and removed from security plans; "100+ clients" and "24/7 support" removed; "24/7" kept only for software.
9. **Technical SEO** — `src/lib/seo.ts` + `src/lib/route-meta.ts`: unique title/description/canonical/robots/OG/Twitter and JSON-LD (Organization, WebSite, BreadcrumbList, Service, FAQPage, Article) on every route; `/cart` and 404 `noindex`; `/services/marketing` redirects to `/services`; sitemap cleaned; `server.ts` returns 404 for unknown extensionless paths; exactly one H1 on every indexable route.
10. **Conversion journeys** — verified live: `/hosting/domains` search → "Buy now" → `/cart?h=…` (item, upsells, VAT total) → "Continue" → step 2 account form (`storefront.auth.checkoutIdentity` called). Stopped before payment. Events verified through the `window.va` queue: `goal_select`, `product_click`, `npanel_interest`, `contact_form_start` (with `prefilled_service`), plus `add_to_cart`, `checkout_start`, `payment_initiated`, `checkout_success`, `checkout_failure` instrumented with method/stage only. Contact form: `?service=bogus` ignored, `?service=launch` prefills "Cloud Hosting", `?plan=<script>` neutralised, empty submit blocked with four field errors. Proposal form validation reviewed in code (step gating, min lengths, email regex). No payments executed, no leads created.
11. **Lint/types/build** — 20 ESLint errors fixed (17 pre-existing + 2 in the export script + 1 introduced then fixed): typed CDP responses, `insane` options without cast (`s` → `del`), `useAnimatedCounter` moved into `CountUpValue` to satisfy rules-of-hooks, Lenis options narrowed to the typed set, `vps-plans-api` response types (`InventoryPageResponse`, `RawPricingSettings`) with `nextCursor ?? null` so "load more" terminates, `catch (err: unknown)` in three plan sections, `maximumFractionDigits` instead of untyped `trailingZeroDisplay`, control-character sanitiser without a control-regex. `bunx eslint .` → 0 errors / 38 warnings; `tsc --noEmit` clean for `tsconfig.app.json` and `tsconfig.node.json`; `bun run build` succeeds. No test suite exists in this app.
12. **Visual QA** — 244 stitched full-page captures in `design/review-screenshots/final-qa/<route>/<viewport>-<theme>.jpg` (44 routes × 1440/1024/768/390/320 light; 12 key routes × 1440/390 dark), with `qa-log-light.json` and `qa-log-dark.json` recording height, horizontal overflow, H1 count, title and console errors per capture. Every row's `document.title` was cross-checked against its route after a first pass exposed 12 captures that had photographed the previous document (the dev server was slow to serve the new route); the runner now navigates through `about:blank`, waits for `location.pathname` to match and the page to render, and those captures were retaken. Result: 0 px horizontal overflow on every capture, one H1 on every indexable route, 0 console errors after the duplicate-key fix.
13. **This report** and the strategy log entry in `NISC-CLOUD-WEBSITE-STRATEGY.md`.

## 3. Modified and added files

Modified (tracked):
`index.html`, `package.json`, `public/sitemap.xml`, `server.ts`, `vite.config.ts`, `src/App.tsx`, `src/main.tsx`, `src/index.css`,
`src/components/ai-markdown-renderer.tsx`, `src/components/shadcn-space/blocks/built-different-01/{context-visuals.tsx,visual-context.ts}`, `src/components/shadcn-space/blocks/cookie-consent-01/index.tsx`, `src/components/shadcn-space/blocks/feature-01/feature.tsx`, `src/components/shadcn-space/blocks/statistics-02/statistics.tsx`, `src/components/shadcn-space/blocks/team-01/team.tsx`, `src/components/ui/{ScrollStack.tsx,button.tsx,flow-button.tsx}`,
`src/lib/{storefront-cart-url.ts,vps-plans-api.ts}`,
`src/pages/{Index.tsx,NotFound.tsx}`, `src/pages/_components/{AtomApproach,BentoFeatures,BentoOrbitingIcons,ClosingCTA,DashboardPreview,Faq,Features,Footer,Hero,Navbar,NavbarAuth,NeedSelector,OnePlatform,PainAgitation,ServicePageShell,ServiceShowcaseSection,Services,Stats,Testimonials,showcase-stages}.tsx`, `src/pages/_components/domain-search/{TldPricingCards,index}.tsx`,
`src/pages/about/_components/{AboutFeatureBlocks,OurStory}.tsx`, `src/pages/blog/{[slug].tsx,posts-data.ts}`, `src/pages/cart/{page.tsx,_components/CartItem.tsx,_components/HostingUpsell.tsx,_components/StorefrontPaymentDialog.tsx}`, `src/pages/contact/_components/{ContactForm,ContactInfo}.tsx`, `src/pages/domain-transfer/page.tsx`, `src/pages/help/page.tsx`,
`src/pages/hosting/page.tsx`, `src/pages/hosting/_components/{HostingPlansPricingSection.tsx,hosting-pricing-configs.ts}`, `src/pages/hosting/{dedicated-servers,domains,email,shared,ssl,vds,vps,wordpress}/page.tsx`, `src/pages/hosting/{dedicated-servers/_components/DedicatedPlansSection,vds/_components/VdsPlansSection,vps/_components/VpsPlansSection}.tsx`,
`src/pages/pricing/_components/{PricingFAQ,PricingPlans}.tsx`, `src/pages/security/page.tsx`, `src/pages/security/{email,ssl}/page.tsx`, `src/pages/security/_components/{SecurityCTA,SecurityDashboardScreen,SecurityFAQ,SecurityFeatures,SecurityHero,SecurityPlans}.tsx`,
`src/pages/services/_components/{LaunchDetail,MarketDetail,NpanelPricingSection,ServiceHero,ServicesFeatureBlocks}.tsx`, `src/pages/services/{brand-identity,ecommerce,email-marketing,paid-ads,seo,social-media,website-design,zeepo-ai}/page.tsx`, `src/pages/work/[slug].tsx`,
`design/illustration-library/export-artworks.ts`, `../../NISC-CLOUD-WEBSITE-STRATEGY.md`.

Added (untracked):
`src/lib/{seo.ts,route-meta.ts,track.ts,attribution.ts}`, `src/components/ProposalEnquiry.tsx`, `src/components/artwork/`, `src/pages/_components/{BuildRunGrow,CloudProducts,ConnectedServices,GoalArtwork,HeroVisual,HomeClosing,HostingReviewArtwork,NpanelShowcase,PartnerServicePage,ProductsMegaMenu,ServiceArtwork,ServiceDecisionGuide,ServiceExperience,WhyNisc}.tsx`, `src/pages/dev/`, `src/pages/hosting/{agency,google-workspace,hybrid-email,microsoft-365,transfer}/`, `src/pages/security/_components/{EmailSecurityArtwork,SecurityServiceLayout}.tsx`, `src/pages/security/{malware-removal,website-maintenance}/`, `public/artwork/`, `design/` (illustration library, trust-claims inventory, review screenshots, this report).

Deleted: `src/_components/` (stub Navbar/Footer).

Do not commit: `.agents/`, `skills-lock.json` (skill-install artefacts).

## 4. Route audit matrix

Legend: "Opened and checked" = loaded in headless Chrome at every viewport listed, scrolled end-to-end, stitched screenshot stored, metrics logged. Desktop/tablet/mobile cells show Pass when no horizontal overflow at those widths. Dark = 1440 and 390 dark captures where taken. Console errors are collected from `Runtime.consoleAPICalled(error)` and `Runtime.exceptionThrown` over the whole capture.

| URL | Page | Status | SEO (title) | H1 | CTA | Artwork | Desktop 1440/1024 | Tablet 768 | Mobile 390/320 | Dark | Console errors | Overflow | Issues | Severity |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/` | Homepage | Opened and checked | Nisc Cloud \| Cloud Hosting, Websites & Digital Growth | 1 | Explore Cloud Products / Business Solutions; goal selector; domain search; proposal form | EcosystemStory hero + 3 stories, goal artwork, nPanel showcase | Pass | Pass | Pass | Pass | 0 | 0 | — | — |
| `/services` | Business Solutions hub | Opened and checked | Business Solutions: Brand, Web, Marketing and AI \| Nisc Cloud | 1 | Book a Free Strategy Call; four pillar anchors | Approved artwork via THEME_ARTWORK (brand kit and SEO analytics repeat between the overview and detail blocks) | Pass | Pass | Pass | Pass | 0 | 0 | P2: same artwork appears twice on the page | P2 |
| `/pricing` | Pricing | Opened and checked | Pricing for Hosting, Domains, Email and Digital Services \| Nisc Cloud | 1 | Plan Get Started → cart; service pricing | Plan cards | Pass | Pass | Pass | Pass | 0 | 0 | Plan subtitle comes from nPanel product description ("24/7 local support") — owner edit | P1 (content) |
| `/hosting/domains` | Domains | Opened and checked | Domain Registration \| Nisc Cloud | 1 | Search → Buy now → cart (verified end-to-end to checkout step 2) | Pinned bento; hero still uses the older photo-style illustration | Pass | Pass | Pass | Pass | 0 | 0 | .co.ke/.ke KeNIC check stayed in "Searching..." >30 s while global TLDs priced instantly — backend latency to review. P2: hero illustration is inconsistent with the pillar-card artwork used elsewhere | P1 |
| `/contact` | Contact | Opened and checked | Contact Nisc Cloud | 1 | Send message (validated), email, phone | Form + conversation block | Pass | Pass | Pass | Pass | 0 | 0 | Button shows "Sending..." for a moment while client validation runs on an empty submit (P2) | P2 |
| `/security` | Security hub | Opened and checked | Website and Email Security Services \| Nisc Cloud | 1 | Plans / contact | Security artwork | Pass | Pass | Pass | Pass | 0 | 0 | — | — |
| `/blog` | Blog index | Opened and checked | Blog: Hosting, Web and Growth Guides \| Nisc Cloud | 1 | Read posts | Post covers | Pass | Pass | Pass | Pass | 0 | 0 | Articles quote historical prices (e.g. KES 350/mo) — editorial review | P2 (content) |
| `/about` | About | Opened and checked | About Nisc Cloud | 1 | Contact / services links | AlternatingFeatureBlocks with approved artwork | Pass | Pass | Pass | Pass | 0 | 0 | — | — |
| `/this-page-does-not-exist` | 404 | Opened and checked | Page not found \| Nisc Cloud | 1 | Suggested links | — | Pass | Pass | Pass | Pass | 0 | 0 | noindex; HTTP 404 from server.ts, 200 on Vercel rewrites (P1 platform) | P1 (platform) |
| `/hosting` | Cloud Products hub | Opened and checked | Cloud Hosting, Domains, Email and Servers \| Nisc Cloud | 1 | 13 product cards | Icon cards only | Pass | Pass | Pass | Pass | 0 | 0 | FIXED: stub Navbar/Footer rendered empty — page had no navigation or footer; stale hard-coded prices replaced; hero top padding increased. P2: hub is visually thin compared with the pillar pages (icon cards only, no hero artwork) | P0 fixed |
| `/hosting/vps` | VPS | Opened and checked | VPS Servers \| Nisc Cloud | 1 | Live Hivelocity plans → cart | CloudInfrastructureStory, pinned bento | Pass | Pass | Pass | Pass | 0 | 0 | FIXED: React duplicate-key warning (same product_id across data centres) — key now product_id + data_center. P1: Hivelocity plans take >5 s to load, so QA captures show skeleton cards. P2: plan names are raw SKUs (e.g. pro.sm.amd) | P1 (latency) |
| `/cart` | Cart (empty state in QA run; populated state verified manually) | Opened and checked | Your Cart \| Nisc Cloud | 0 | Continue → details → payment | — | Pass | Pass | Pass | Pass | 0 | 0 | noindex; no H1 by design of the step layout (P2) | P2 |
| `/work` | Our Work | Opened and checked | Our Work and Case Studies \| Nisc Cloud | 1 | Get Your Free Strategy Call | Stock photography cards | Pass | Pass | Pass | — | 0 | 0 | Case studies look fictional (USD figures, generic brands) — owner must confirm or remove before launch | P1 (content) |
| `/work/verdant-co` | Case study | Opened and checked | Verdant Co.: From zero to $1.2M in 14 months \| Nisc Cloud | 1 | Strategy call | Cover image | Pass | Pass | Pass | — | 0 | 0 | Same as /work | P1 (content) |
| `/hosting/microsoft-365` | Microsoft 365 | Opened and checked | Microsoft 365 \| Nisc Cloud | 1 | Request a quotation (proposal form) | Partner page artwork | Pass | Pass | Pass | — | 0 | 0 | "Authorised partner" claim needs owner evidence | P1 (content) |
| `/hosting/transfer` | Transfer hosting | Opened and checked | Transfer Hosting \| Nisc Cloud | 1 | Request an assessment | MigrationArt | Pass | Pass | Pass | — | 0 | 0 | — | — |
| `/hosting/agency` | Agency hosting | Opened and checked | Agency Hosting \| Nisc Cloud | 1 | Request a proposal | AgencyFlagshipArt | Pass | Pass | Pass | — | 0 | 0 | — | — |
| `/hosting/shared` | Website hosting | Opened and checked | Shared Web Hosting \| Nisc Cloud | 1 | Live plans → cart | HostingFlagshipArt, pinned bento | Pass | Pass | Pass | — | 0 | 0 | Plan subtitle from nPanel product description (owner edit) | P1 (content) |
| `/hosting/wordpress` | WordPress hosting | Opened and checked | Managed WordPress Hosting \| Nisc Cloud | 1 | Live plans → cart | Pinned bento | Pass | Pass | Pass | — | 0 | 0 | Plan subtitle from nPanel product description (owner edit) | P1 (content) |
| `/hosting/hybrid-email` | Enterprise Hybrid Email | Opened and checked | Enterprise Hybrid Email: Nisc Mail with Microsoft 365 or Google Workspace \| Nisc Cloud | 1 | Annual custom quotation | Hybrid email artwork | Pass | Pass | Pass | — | 0 | 0 | — | — |
| `/hosting/email` | Business email | Opened and checked | Business Email Hosting · Nisc Mail \| Nisc Cloud | 1 | Live plans → cart | Pinned bento | Pass | Pass | Pass | — | 0 | 0 | — | — |
| `/hosting/ssl` | SSL certificates | Opened and checked | SSL Certificates \| Nisc Cloud | 1 | Certificate plans → cart | SslArt | Pass | Pass | Pass | — | 0 | 0 | — | — |
| `/services/brand-identity` | Brand identity | Opened and checked | Brand Identity & Logo Design \| Nisc Cloud | 1 | Proposal form | BrandKitArt | Pass | Pass | Pass | — | 0 | 0 | "about 7 days" delivery needs owner confirmation | P2 (content) |
| `/services/website-design` | Website design | Opened and checked | Website Design & Development \| Nisc Cloud | 1 | Proposal form | BrandWebFlagshipArt | Pass | Pass | Pass | — | 0 | 0 | — | — |
| `/services/ecommerce` | Ecommerce | Opened and checked | E-commerce Store Development \| Nisc Cloud | 1 | Proposal form | Store/checkout art | Pass | Pass | Pass | — | 0 | 0 | — | — |
| `/services/seo` | SEO | Opened and checked | SEO Services \| Nisc Cloud | 1 | Proposal form | SeoFlagshipArt | Pass | Pass | Pass | — | 0 | 0 | — | — |
| `/services/paid-ads` | Paid ads | Opened and checked | Paid Advertising Management \| Nisc Cloud | 1 | Proposal form | AdsArt | Pass | Pass | Pass | — | 0 | 0 | — | — |
| `/services/social-media` | Social media | Opened and checked | Social Media Management \| Nisc Cloud | 1 | Proposal form | Social art | Pass | Pass | Pass | — | 0 | 0 | — | — |
| `/services/zeepo-ai` | Zeepo AI | Opened and checked | AI Automation \| Nisc Cloud | 1 | Proposal form | ZeepoArt | Pass | Pass | Pass | — | 0 | 0 | — | — |
| `/services/email-marketing` | Email marketing | Opened and checked | Email Marketing \| Nisc Cloud | 1 | Proposal form | Email builder art | Pass | Pass | Pass | — | 0 | 0 | — | — |
| `/help` | Help centre | Opened and checked | Help Centre \| Nisc Cloud | 1 | Contact / support | — | Pass | Pass | Pass | — | 0 | 0 | — | — |
| `/whois` | WHOIS | Opened and checked | WHOIS Domain Lookup \| Nisc Cloud | 1 | Lookup | — | Pass | Pass | Pass | — | 0 | 0 | — | — |
| `/domain-transfer` | Domain transfer | Opened and checked | Domain Transfer \| Nisc Cloud | 1 | Transfer check | Pinned bento | Pass | Pass | Pass | — | 0 | 0 | — | — |
| `/security/email` | Email security | Opened and checked | Email Security: Spam, Phishing and Malware Protection \| Nisc Cloud | 1 | Plans / contact | EmailSecurityArtwork | Pass | Pass | Pass | — | 0 | 0 | — | — |
| `/security/ssl` | SSL certificate (security) | Opened and checked | SSL Certificates: Get the HTTPS Padlock \| Nisc Cloud | 1 | Plans | SecurityDashboardScreen (now token colours) | Pass | Pass | Pass | — | 0 | 0 | Overlaps /hosting/ssl — consider consolidating | P2 |
| `/security/malware-removal` | Malware removal | Opened and checked | Website Malware Removal \| Nisc Cloud | 1 | Plans / contact | Bespoke | Pass | Pass | Pass | — | 0 | 0 | — | — |
| `/security/website-maintenance` | Website maintenance | Opened and checked | Website Maintenance \| Nisc Cloud | 1 | Plans / contact | Bespoke | Pass | Pass | Pass | — | 0 | 0 | — | — |
| `/blog/why-every-kenyan-sme-needs-a-digital-identity` | Blog post | Opened and checked | Why Every Kenyan SME Needs a Digital Identity Before Anything Else \| Nisc Cloud | 1 | CTA block | Cover | Pass | Pass | Pass | — | 0 | 0 | Article JSON-LD present | — |
| `/terms` | Terms | Opened and checked | Terms of Service \| Nisc Cloud | 1 | — | — | Pass | Pass | Pass | — | 0 | 0 | — | — |
| `/privacy` | Privacy | Opened and checked | Privacy Policy \| Nisc Cloud | 1 | — | — | Pass | Pass | Pass | — | 0 | 0 | — | — |
| `/cookies` | Cookies | Opened and checked | Cookie Policy \| Nisc Cloud | 1 | — | — | Pass | Pass | Pass | — | 0 | 0 | — | — |
| `/hosting/vds` | VDS | Opened and checked | VDS Servers \| Nisc Cloud | 1 | Live plans → cart | Pinned bento | Pass | Pass | Pass | — | 0 | 0 | As VPS (duplicate-key fixed; plan-load latency; raw SKU names) | P1 (latency) |
| `/hosting/dedicated-servers` | Dedicated servers | Opened and checked | Dedicated Servers \| Nisc Cloud | 1 | Live plans → cart | Pinned bento | Pass | Pass | Pass | — | 0 | 0 | As VPS (duplicate-key fixed; plan-load latency; raw SKU names) | P1 (latency) |
| `/hosting/google-workspace` | Google Workspace | Opened and checked | Google Workspace \| Nisc Cloud | 1 | Request a quotation | Partner page artwork | Pass | Pass | Pass | — | 0 | 0 | Same partner claim | P1 (content) |

Captures: 244 (220 light across 44 routes x 5 viewports; 24 dark across 12 routes x 2 viewports). Logs: `qa-log-light.json`, `qa-log-dark.json`. The three server pages were recaptured after the duplicate-key fix; their captures now show loaded plan cards. `/cart` was captured in its empty state (no H1 by design).
