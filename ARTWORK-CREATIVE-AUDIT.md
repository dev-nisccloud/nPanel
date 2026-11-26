# Nisc Cloud Artwork Creative Audit

Date: 2026-11-07

Scope: `kit.tsx`, `cloud-art.tsx`, `npanel-art.tsx`, `growth-art.tsx`, `more-art.tsx`, their page usage, the supplied reference artwork and the sanitized nPanel reference screenshots.

## Finding

The first artwork pass improved product accuracy and privacy, but the system became compositionally repetitive:

- 42 `ArtStage` compositions were present.
- 28 used `NpanelWindow`.
- Most of the remaining compositions used the same centered card plus one floating card.
- Tint changes (`sky`, `violet`, `emerald`, `amber`, `slate`, `rose`) created category cues, but not different visual stories.
- Product accuracy was strongest in hosting, agency, email marketing and Zeepo. Creative differentiation was weakest across DNS, email, backups, SSL, quotations, SEO analytics and operations because they shared the same shell, spacing and camera angle.

The supplied references use reusable type and colour systems while varying the focal object, crop, silhouette, depth, photography, interface scale and negative space. The earlier implementation reused the interface frame itself.

## Repetitive groups

### Full nPanel window with floating card

Hosting overview, hosting DNS, domain search, migration, WordPress, mailboxes, server overview, SSL, email campaign, Creative Assets, Zeepo, SEO, Ads, agency Businesses, Developers, Agencies, Operations, file manager, email DNS, backups, domain transfer, nameservers, quotation, SEO analytics, Zeepo activity and creative brief.

Why it fails: the URL bar, left icon rail, title row and floating lower/right card become the dominant subject. At a glance, products differ mainly by labels and icons.

### Two-panel form/result compositions

AI Email Builder, content plan, brand kit, team workspace and several commerce scenes.

Why it fails: the workflow is understandable, but repeated equal-width panels flatten hierarchy and reduce editorial character.

### Card-list compositions

Mailboxes, cloud servers, backups, operations, service orders, social calendar and client organizations.

Why it fails: lists are accurate but visually interchangeable unless the product’s distinctive action or outcome becomes the focal point.

## What remains useful

- `Pill`, `UiButton`, type scale and spacing primitives.
- Official theme tokens and dark-mode behavior.
- Sanitized fictional data.
- Real nPanel vocabulary and workflow details.
- `NpanelWindow` for scenes where the authentic product interface is the point.

`NpanelWindow` should not be the default illustration frame.

## Flagship creative standard

### 1. Homepage ecosystem

- Subject: Build, Run and Grow connected through nPanel, with Zeepo AI.
- Benefit: one connected digital operation.
- Focal point: the nPanel hub.
- Composition: editorial radial ecosystem, plus two manually selected alternative stories.
- Supporting UI: minimal labels; no dashboard shell on the first two states.
- Sky blue: dominant canvas and connection system.
- Orange: one Build cue and one secure-delivery cue.
- Aspect ratio: approximately 4:3.
- Mobile: preserve the four-node system; remove explanatory caption, keep controls.

### 2. Web hosting

- Subject: a live website supported by its hosting stack.
- Benefit: the visible website outcome and the services behind it.
- Focal point: the fictional bakery website.
- Composition: product-commerce outcome beside a vertical infrastructure cutaway.
- Supporting UI: a small nPanel management bridge, not a full dashboard.
- Sky blue: connections, status and management.
- Orange: selected hosting layer and fictional bakery content.
- Aspect ratio: approximately 8:5.
- Mobile: website, nPanel bridge and stack become one vertical narrative.

### 3. nPanel for Agencies

- Subject: separate client organizations inside one agency account.
- Benefit: switch customer context without mixing services.
- Focal point: Jambo Clinic selected in the organization list and switcher.
- Composition: authentic wide SaaS workspace with a docked switcher and customer-view banner.
- Supporting UI: services per customer and organization invitation.
- Sky blue: selected state, actions and context banner.
- Orange: not needed.
- Aspect ratio: approximately 4:3.
- Mobile: sidebar is removed; switcher becomes a full-width panel after the list.

### 4. SEO

- Subject: a search query, result preview, page audit and keyword opportunities.
- Benefit: understand how a page appears in search and what needs review.
- Focal point: the search result under a page-audit lens.
- Composition: search-performance landscape with a dark technical audit rail.
- Supporting UI: qualitative findings and keyword intent, not invented performance results.
- Sky blue: search, lens and selected keyword.
- Orange: warning icons only.
- Aspect ratio: approximately 8:5.
- Mobile: SERP, lens, audit and keyword panel become a clear top-to-bottom sequence.

## Brand colour

- Official primary token: `--primary: #38b6ff`.
- Existing brand orange token: `--color-brand-orange: #fc734d`.
- Sky blue remains the dominant interactive and illustrative colour.
- Orange appears only in selected semantic accents.
- Orange `#fc734d` with the dark text used in artwork passes WCAG AA at 5.74:1.
- Primary sky blue with its foreground passes at 8.97:1.

## Targeted website review

- Hero clarity: stable headline and CTAs are retained; artwork switching is manual, not autoplay.
- nPanel visibility: strong in the hero, goal selector and dedicated persona section.
- Segmentation: Businesses, Developers and Agencies remains explicit.
- Product discovery: cloud purchase and business-solution paths remain separate.
- Enquiry: the three-step corporate flow remains intact.
- Repetition: the Run goal, Build/Run/Grow section and Cloud Products still repeat some category language. This is not severe enough to change before artwork approval.
- Products versus Solutions: Websites and Marketing appear in both the buying model and the outcome model. Keep for now; validate with navigation analytics.
- Mobile: flagship compositions recompose rather than shrink and produce no horizontal overflow.

## Claims requiring approval

- Browser SSH terminal is not visible in the supplied nPanel screenshots.
- nPanel references “Plesk subscriptions”; Shared Hosting copy says cPanel.
- The VPS “guaranteed resources, not shared” claim conflicts with VDS differentiation.
- Confirm organization invitations are available to all relevant agency accounts.
- Confirm Microsoft 365 and Google Workspace partnership wording.
- Keep SLA, uptime and support-hours claims out until evidence is approved.

## Next artwork after flagship approval

Email security, malware removal, website maintenance, Built Different bento scenes, service-detail showcase stages, Build/Run/Grow pillar visuals and the Shared Hosting support image.
