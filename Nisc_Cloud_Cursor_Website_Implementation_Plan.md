# Nisc Cloud Website: Cursor Implementation Specification

**Document status:** Approved strategic direction, implementation instructions for the existing website repository  
**Brand:** Nisc Cloud (never NISC Cloud)  
**Product names:** nPanel and Zeepo AI; verify the canonical UI/product spelling in the existing code before editing broadly  
**Primary business objective:** Drive completed self-service purchases for standardized cloud products; generate qualified enquiries for custom, managed and enterprise services.  
**Target audiences:** Businesses, business owners, developers and agencies.  
**Positioning:** Internationally credible technology company with Kenya as an initial commercial focus. Do not present Nisc Cloud as a small 'local boutique agency,' and do not invent global scale.

---

## 0. YOUR ROLE AND EXECUTION RULES (READ FIRST)

You are the senior frontend engineer, UX designer, conversion-rate optimizer and technical SEO lead working in the existing Nisc Cloud website repository. **Inspect the project, then implement the changes** described below. Do not stop at providing suggestions or mockups. Use the existing framework, components, design system, routing, styles, data sources and established conventions. Prioritize a polished, working implementation.

### Non-negotiable constraints

1. **Preserve functional business flows:** domain search and results, domain-to-hosting cart flow, hosting/product selection, checkout, login, customer provisioning handoffs, nPanel external links, account integrations, pricing data, support widget, forms, existing analytics and payment integrations. Do not replace live commerce with fake buttons or mock checkout.
2. **Do not invent product capabilities or commercial claims.** Verify which nPanel features, Zeepo AI functions, infrastructure regions, partner authorizations, guarantees, SLA commitments, customer counts and prices are genuinely supported. If uncertain, use conservative wording, keep existing verified evidence, and record a TODO for business verification.
3. **Do not hard-code new real prices, discounts, plan specifications, stock, contract commitments or billing cycles.** Read existing source-of-truth data/API/config. Monthly billing can only be advertised or offered if checkout and renewal logic support it. Never add illustrative KES amounts from advisory discussions to production.
4. **Do not overstate integrations:** 'one connected workspace' is permitted only insofar as nPanel currently shows the relevant services; don't imply full bidirectional orchestration, unified billing, project tracking, client invitations, SSH access or marketing analytics if not supported for the relevant accounts/plans. Differentiate live, beta and planned features.
5. **Keep the brand unified:** one master brand Nisc Cloud. Do not split into Nisc Growth, Nisc Systems, Nisc Studio or new independent brands. Use BUILD / RUN / GROW as an understandable service framework, with nPanel as the management layer and Zeepo AI as an integrated AI capability plus its own product/solution where appropriate.
6. **Avoid commodity-hosting visuals** (generic server racks, rockets, discount explosions, fabricated dashboard screenshots). Use actual product captures/assets when available. Maintain a premium, restrained, accessible SaaS/technology visual system.
7. **Preserve SEO equity:** do not delete existing indexed URLs, restructure all slugs, or rewrite every service page indiscriminately. Retain redirects/canonicals where applicable, and keep existing product/service routing functional.
8. **Respect deployment environments:** the local/staging deployment must not accidentally be indexed; production must remain crawlable. Never set sitewide `noindex` for production.
9. **Implement responsive, accessible UI:** keyboard navigation, labelled controls, semantic headings, focus states, sufficient contrast, reduced-motion support, no auto-rotating text that destroys readability, no layout shift from unreserved media.
10. **Do not modify backend payment/provisioning contracts unless necessary and clearly validated.** Reuse existing API contracts, capture any gaps as backend follow-ups instead of silently creating incompatible frontend behavior.

### First inspect, then edit

Before changing code, produce a short technical inventory in your implementation notes: framework, router, homepage component, navigation, product/category data, pricing source, domain search handler, cart/checkout routes, forms/CRM submission path, nPanel links, SEO metadata implementation, reusable UI components, current analytics, tests and relevant assets.

Inspect the existing homepage at the available local URL(s), including `http://127.0.0.1:5175/` or `http://localhost:5174/`, where applicable. If a browser is unavailable to the coding environment, use code inspection and local rendering/build tests. Review mobile and desktop layouts.

Proceed with changes in the phases below. If a detail is uncertain, use the safest implementable version and document it. Don't postpone straightforward work waiting for clarification.

---

## 1. BRAND ARCHITECTURE AND COPY RULES

### Core structure

**Nisc Cloud** is the master brand. Its customer-facing framework is:

- **BUILD** — Branding, visual identity, websites, ecommerce, application/software development and digital experiences.
- **RUN** — Domains, web hosting, business email, VPS, dedicated infrastructure, security, backup and operational services.
- **GROW** — SEO, advertising, social and content, CRM/lead generation, reporting and relevant automation services.

**nPanel** is the platform for managing subscribed services and collaborating on work, with persona-specific value for businesses, developers and agencies.

**Zeepo AI** should be expressed as intelligence/automation used where supported across BUILD / RUN / GROW, and can also retain a dedicated product/solution page. Do not represent AI as a mandatory fourth stage or promise broad autonomy that does not exist.

### Voice and positioning

- Modern technology company, clear product-first language, strong operational credibility.
- Avoid 'local boutique agency', 'best in Africa', 'world-leading', 'everything fully automated', 'unlimited' and aggressive generic hosting superlatives unless evidence genuinely supports them.
- Kenya is the initial commercial market, but not a limiting company descriptor. Location appears naturally in About, contacts, region-specific SEO and support details; don't claim global data centers or worldwide service availability without evidence.
- Prioritize outcomes first, practical product detail second, specifications on product pages and comparison tables.
- Apply **Nisc Cloud** case consistently in website copy and metadata. Use the product spelling existing brand assets confirm for nPanel and Zeepo AI.

---

## 2. HOMEPAGE INFORMATION ARCHITECTURE (IMPLEMENT THIS ORDER)

1. Hero and two distinct conversion paths.
2. Trust/customer logos with verified claims.
3. 'What do you need today?' (five goal options, not six).
4. nPanel main product showcase with persona tabs.
5. BUILD / RUN / GROW three connected pillars.
6. Featured cloud products and domain search, with live checkout links.
7. Vendor-fragmentation versus connected-service comparison.
8. Real case study/customer story if approved content exists (otherwise a clean, non-fabricated work teaser).
9. 'Built for more than getting online' reasons/proof.
10. Supported partnerships, FAQ and final intent-specific CTA.

Consolidate/remove repetitive sections rather than stacking every existing long section. Preserve genuinely useful content by moving it into appropriate dedicated product or service pages. The homepage should be noticeably more focused and shorter in cognitive burden, not necessarily minimal in physical length.

### 2.1 Hero: exact recommended copy

**Eyebrow:** `BUILD. RUN. GROW.`

**H1:** `Everything your business needs to operate and grow online.`

**Supporting text:** `From domains, cloud hosting and business email to websites, software, marketing and AI-powered workflows, Nisc Cloud brings your digital services together.`

**Primary CTA:** `Explore Cloud Products` → existing relevant cloud/products listing route or a valid homepage cloud-products anchor.

**Secondary CTA:** `Explore Business Solutions` → existing services/solutions route or an appropriate solutions anchor.

**Supporting persona line:** `For businesses, developers and agencies.`

Keep an nPanel sign-in/action in primary navigation. If the current hero has rotating `Built to...` phrases (for example `design your brand & logo`), **remove that animation from the primary proposition**, because it makes the business sound like a branding-only agency and compromises immediate comprehension. A restrained nonessential animated illustration is acceptable if accessible.

Do **not** use `Get Your Free Strategy Call` as the universal hero CTA. Consultative discovery belongs on service-specific pages and for corporate enquiries.

### 2.2 Customer proof

Use existing real client logos with meaningful alt text and appropriate permissions. Preserve the current logo assets (e.g., Ashut, Luxewrap, Datini and others). Do not manufacture testimonials or outcomes. Check that `100+ Businesses Served`, `24/7 Support`, `up to 99.99% uptime on qualifying plans` and partnership/compliance language are verified and accurately scoped before displaying. If not confirmed, omit or reword.

### 2.3 Five-option goal selector

**Heading:** `What do you need today?`

**Subheading:** `Choose your goal. We'll help you find the right solution.`

**Exactly five user intents:**

1. `Run My Business Online` — Domains, hosting, business email and cloud. This replaces `Go Online` and should be visually prominent.
2. `Create My Brand` — Identity, design and creative services.
3. `Get More Customers` — SEO, paid advertising, social/content and demand generation.
4. `Build a Website or App` — Websites, ecommerce and custom software.
5. `Automate with AI` — Zeepo AI and workflow automation.

**Do not add `Manage Multiple Clients` as a sixth option.** Agency/developer use cases get a concise, dedicated nPanel section and navigation entry. The selector may reveal an inline detail panel or take the visitor to a relevant existing route. One meaningful click should lead to a useful decision or next step. Every CTA must lead somewhere valid.

Keep card descriptions concise, avoid jargon, and ensure mobile cards don't feel like a long questionnaire. Do not automatically open a full branding subsection that dominates the homepage after the goal selector.

### 2.4 nPanel: move immediately after goals

**Eyebrow:** `MEET nPanel`

**Heading:** `Your digital operation. One connected workspace.`

**Intro:** `Manage the services you use, work with your team and keep customer accounts organized through nPanel.`

Build a compact, accessible tabbed presentation with three personas (tabs, not three long stacked sections):

- **Businesses:** Heading `Everything your business depends on.` Description `See the domains, email, hosting, projects, billing, support and performance information available to your account, without switching between multiple providers.` Only mention modules available to that audience.
- **Developers:** Heading `Infrastructure control without dashboard hopping.` Description `Manage supported hosting and cloud services, domains and developer access. Where enabled, use the built-in SSH terminal to access your cloud server directly from nPanel.` Verify server type, user permissions, security and plan eligibility before claiming the SSH capability on a public page.
- **Agencies:** Heading `Every client. One account.` Description `Organize customer workspaces, assign their services, invite authorized users and switch between client accounts in one place.` Verify features are deployed. Emphasize client isolation and delegated access, not shared passwords.

The three experiences should share one visual presentation and a CTA that leads to the relevant nPanel information page or product onboarding, with a second link for existing customers to sign in.

**Use actual nPanel screenshots/UI assets if present.** If unavailable, use a neutral clearly illustrative interface diagram. Do not use fabricated performance stats or pass concept mockups off as real screenshots.

### 2.5 BUILD / RUN / GROW

Replace the existing four-step `CREATE / HOST / MARKET / AUTOMATE` model with three equal-weight service cards/sections:

**BUILD**  
Heading: `Make your ideas real.`  
Copy: `Build a strong brand, launch customer-ready websites and ecommerce experiences, and develop software tailored to the way you work.`  
Examples: Brand identity · Websites · Ecommerce · Custom applications  
CTA: `Explore Build Solutions`

**RUN**  
Heading: `Keep your digital business running.`  
Copy: `Operate with domains, hosting, business email, cloud infrastructure and security services managed around your business needs.`  
Examples: Domains · Hosting · Email · VPS & servers  
CTA: `Explore Cloud Products`

**GROW**  
Heading: `Turn digital activity into measurable growth.`  
Copy: `Reach the right customers through SEO, advertising, content and connected customer engagement.`  
Examples: SEO · Paid media · Social & content · Marketing automation  
CTA: `Explore Growth Services`

AI is a **cross-cutting capability**, not a fourth mandatory stage. Add a subtle cross-pillar Zeepo AI line or link such as:

**`Smarter tools, built into the way you work.`**  
`Explore how Zeepo AI can support customer conversations, follow-ups and repetitive workflows in the services where it is available.`

Do not present speculative AI features as currently available.

### 2.6 Featured cloud commerce and domain search

- Retain the **real domain-search input** and the current result/cart behavior. It is an important immediate-purchase route.
- Offer clean product entry cards for Domains, Web Hosting, Business Email and VPS (and dedicated servers if an existing catalog supports them).
- Each CTA goes to an actual product/category/search flow, not an enquiry form by default.
- Show actual prices here or on linked product pages sourced from the existing catalog; no guessed price data.
- Do not make the lowest hosting price the core corporate brand proof. Show specs on product pages and a few key benefits in product cards.
- Preserve domain + hosting bundling/checkout logic, renewal disclosure and billing conditions.

### 2.7 Replace the old vendor comparison

**Heading:** `Your digital services should work together.`

**Supporting copy:** `Managing separate providers can make everyday work harder than it needs to be. Nisc Cloud connects infrastructure, development and growth under one accountable partner.`

**LEFT TITLE:** `With fragmented providers`  
- Multiple dashboards, contracts and support teams
- Providers and systems operating independently
- Unclear ownership when cross-platform issues arise
- Delays caused by handoffs between teams

**RIGHT TITLE:** `With Nisc Cloud`  
- One accountable technology partner
- Infrastructure and growth services coordinated
- Clear ownership across the services you purchase
- A connected place to manage and track delivery

**Remove:** `Months pass with no measurable results`, `The old way chaos`, claims that every customer must have five invoices, and unqualified claims about achieving marketing results in 30 days. Avoid implying accountability for third-party systems not covered by a customer contract.

### 2.8 Real case study or work evidence

If approved, create one high-quality story from actual work (e.g., an Ashut engagement) using only validated deliverables/outcomes and authorized client references. The ideal structure: Challenge → Nisc Cloud solution → services/technology → verifiable results → related CTA.

If verified metrics or publishing permission aren't available, keep a clear client-logo/portfolio teaser and an `Explore Our Work` CTA. **Do not fabricate outcomes, industries, quotes or screenshots.**

### 2.9 Replace 'Why Choose Us'

**Heading:** `Built for more than getting online.`

**Subheading:** `Technology, expertise and accountability as your business evolves.`

Four concise proof pillars:

- `Infrastructure you can depend on` — actual architecture, backups, security and monitoring evidence.
- `Control through nPanel` — actual account/customer/service management features.
- `Expertise beyond infrastructure` — real engineering, creative and marketing work.
- `A partner that grows with you` — relevant expansion paths and approved client evidence.

Preserve and improve the existing ownership assurance where contractually true: `Your domain, code and data remain yours.` Keep the existing first-month milestone language accurately scoped to eligible managed services. Consolidate repeated pricing/accountability claims.

### 2.10 Partners, FAQ, close

Preserve Google Workspace, Microsoft 365 and Enterprise Hybrid Email links where those services exist. Review the exact meaning of `authorized partner` against actual partnership status; don't silently upgrade a reseller/distributor relationship into official accreditation. Keep concise, relevant FAQ categories and a final pair of actions separating self-service cloud purchases from solution enquiries.

Remove the old footer sentence `Transforming businesses to stand out and succeed.` Replace with: `Technology, infrastructure and growth for modern businesses.`

---

## 3. NAVIGATION AND AUDIENCE PAGES

Preserve the top-level structure if already implemented:

**Products | Solutions | nPanel | Pricing | Resources** — plus **Sign in** and **Get Started**.

Under **Products**, group standardized purchases: Domains, Hosting, WordPress, Business Email, VPS, Dedicated Infrastructure and other existing offerings.

Under **Solutions**, present Build (branding, web, ecommerce, custom software), Grow (SEO, ads, social/creative), managed infrastructure/migrations, Enterprise Hybrid Email and AI/automation. Corporate/Enterprise can be a relevant solutions route, not a generic forced category.

Under **nPanel**, provide clearly navigable experiences for Businesses / Developers / Agencies. Reuse existing routes; create dedicated landing pages only when content and routing can be implemented correctly. Agency messaging must emphasize multi-client accounts, client workspaces and service-level organization. Developer messaging should include supported technologies and integrated SSH only where confirmed.

Do not stuff all service descriptions into mega menus. Keep mobile navigation quick, accessible and readable.

---

## 4. PRICING AND THE TWO CONVERSION ENGINES

### Engine A: Self-serve commerce

Products such as domain registration, standard web hosting, standard business email, standardized VPS and any readily provisioned dedicated plans must show source-of-truth pricing and lead to working purchase/provisioning flows. Never force a strategy call for these.

Offer monthly and annual billing **only on products where backend catalog, invoicing, renewals, taxes and checkout support both**. If monthly billing is already supported, present a simple selector with accurate total due and renewal conditions. Do not invent discounts or promotional strike-through prices. Retain visible KES pricing for Kenyan buyers and supported currency choices where implemented.

### Engine B: Services and enterprise leads

For repeatable fixed-scope services, retain visible packages and deliverable boundaries (e.g., clearly defined branding, SEO, social/content and website packages when operationally standardized). Allow purchase or appropriate onboarding where the workflow supports it.

For complex/custom scope, show an inquiry CTA rather than fabricated package pricing:

- Bespoke brand transformation/rebranding
- Enterprise websites/ecommerce with custom integrations
- Custom ERP, SaaS, business applications and software
- Complex cloud architecture/migrations
- Hybrid enterprise email migration and custom security/archiving
- Large managed infrastructure requirements
- Enterprise advertising/marketing retainers
- Custom Zeepo AI automations and integrations

**Corporate plan label:** `Corporate — Tailored to your business requirements.`  
**CTA:** `Discuss Your Requirements` or `Request a Proposal`.

Use one configurable qualified-enquiry flow rather than a unique, elaborate form for every service.

### Qualified-enquiry form: UX specification

Create **at most three short steps**, with progressive disclosure:

1. **Service + desired outcome/scope:** What is needed, type of business/project, optional website/domain and short requirements.
2. **Project fit:** A service-specific, configurable indicative budget range **with `Not sure yet`**, and intended timeframe (`Immediately`, `1–3 months`, `Later / exploring`). Do not assume the sample budget ranges from the strategy discussion are approved pricing. Budget is for routing, not automatically excluding prospects.
3. **Contact:** Company/name, email, optional phone, notes, privacy acknowledgement as legally appropriate. Preserve the site's anti-spam and validation mechanisms.

On submit: send to existing lead API/CRM or existing contact channel, include service/needs/budget/timeline/source/UTM information as appropriate, provide a clear success state, prevent duplicate submission and preserve accessible errors. Never create a faux-success state if backend submission fails.

Lead scoring/routing can classify requests by service, fit, timing and budget, but should **not reject** all low-budget or personal-email leads automatically. Route simpler needs to standard packages.

---

## 5. UX, DESIGN AND ACCESSIBILITY

- Keep current Nisc Cloud brand assets and design tokens unless their contrast/readability genuinely fail.
- Use restrained hierarchy, whitespace, excellent type scaling, appropriate grid width, authentic product UI and selective motion.
- The homepage should feel like a product company: show what customers can do, then the supporting infrastructure and service expertise.
- Use smaller copy blocks and clear section-specific CTAs; don't repeat the same `one team` proposition in five different ways.
- Persona tabs and goal cards must work with keyboard/screen reader, visible selected state, semantic buttons, logical tab order and stable layout. On mobile, provide an accessible stacked/scroll-friendly alternative.
- Respect `prefers-reduced-motion` and avoid timed carousels/typing effects carrying vital copy.
- Check logos/images for alt text, responsive loading, compression and layout-shift avoidance.
- Ensure contact and pricing flows work on small mobile viewports and do not require excessive input.

---

## 6. TECHNICAL SEO, AEO AND CONTENT QUALITY

Conduct a route-level SEO audit and improve within the project's actual framework. Do not introduce a new rendering framework casually.

### Core tasks

- Every important indexable route has a **unique, intent-matching** title, H1, meta description and canonical URL.
- Confirm main content is discoverable in rendered HTML/normal search-engine rendering. Check if `/services`, `/hosting`, `/pricing`, `/work`, `/security` or other routes accidentally return identical crawler-visible content. **Investigate before attempting architectural fixes.**
- Maintain a correct XML sitemap and production robots policy; avoid accidentally indexing local/staging variants. Avoid blocking critical crawlers at CDN/WAF without reason.
- Keep important page content semantic and accessible; visible page text should support metadata claims.
- Implement appropriate `Organization`, `WebSite`, `BreadcrumbList`, `Product`/`Offer`, `Service` or `Article` structured data **only where applicable and verifiable**. Do not add fake ratings or reviews.
- Add descriptive image alt text, internal links and clear breadcrumbs to service/product pages where appropriate.
- Preserve existing meaningful URLs and backlinks. If a route must change, use a deliberate permanent redirect and update navigation/canonical/sitemap.
- Audit actual site copy, footer descriptions, About page and metadata for old `Hosting & Marketing Under One Team` / boutique-like or overly local-only descriptions. Replace with accurate integrated technology positioning.
- Improve page targeting around existing genuine offerings: domains, hosting, business email, VPS, agency hosting, developer hosting, SEO, advertising, web/app development, enterprise email. Do not mass-generate thin SEO pages or keyword-stuff 'Kenya'.
- Treat `llms.txt` as **supplemental**, not a substitute for good content, technical SEO, authoritative documentation, evidence and appropriately accessible pages.
- If analytics are available, capture baseline search/organic landing performance before large metadata changes.

### Suggested homepage metadata (adjust to actual SEO character budget)

**Title:** `Nisc Cloud | Cloud Hosting, Websites & Digital Growth`  
**Meta description:** `Build, run and grow with Nisc Cloud. Explore domains, hosting, business email, websites, software, digital marketing and nPanel for businesses, developers and agencies.`

Verify no page claims unsupported partner status, server geography, compliance, ISO/SOC certifications or unsupported performance guarantees.

---

## 7. ANALYTICS, CRO AND MEASUREMENT

Reuse the site's established measurement stack and naming conventions; do not install duplicate analytics.

Where feasible, instrument and QA these events with no sensitive personal data in analytics payloads:

- `hero_cloud_click`
- `hero_solutions_click`
- `goal_select` (goal key)
- `npanel_persona_select` (business/developer/agency)
- `domain_search` (do **not** leak personal contact data)
- `hosting_plan_select`
- `checkout_start`
- `purchase` (only after actual confirmed completion and if integrated)
- `proposal_form_start`
- `proposal_form_step_complete`
- `proposal_form_submit_success`
- `proposal_form_submit_error`

Keep core KPIs separate: cloud checkout conversion rate and revenue; services qualified lead rate; corporate proposal-to-close; nPanel audience engagement; mobile funnel drop-off. Do not optimize only for clicks or unqualified form submissions.

---

## 8. IMPLEMENTATION PHASES AND PRIORITY

### PHASE 0 — Inspect and safeguard (before edits)

- Inspect repo, existing pages, UI, data, checkout, forms, auth/links and SEO implementation.
- Record existing routes and purchase flows.
- Establish baseline screenshots or before/after evidence for desktop and mobile.
- Identify verified business/product claims versus claims requiring confirmation.
- Ensure source control safety; do not overwrite unrelated work.

**Exit criteria:** concise audit notes, implementation plan tied to actual files and confirmation of flows that must be preserved.

### PHASE 1 — Homepage conversion and copy (highest priority)

- Hero rewrite and CTA routing.
- Trust bar cleanup.
- Five-goal selector (replace `Go Online` with `Run My Business Online`, no sixth agency card).
- Promote nPanel to fourth section with business/developer/agency tabs.
- Implement BUILD/RUN/GROW replacing the old four pillars.
- Replace vendor comparison copy.
- Replace Why Choose Us with stronger proof section.
- Consolidate repetitive sections and footer.

**Exit criteria:** polished responsive homepage with working CTAs and no unsupported claims.

### PHASE 2 — Commerce, services and lead qualification

- Preserve/QA domain search + hosting cart/checkout.
- Refine cloud product-card links and pricing presentation from real data.
- Support monthly/annual display only for valid backend billing cycles.
- Implement corporate service CTA and a short guided enquiry flow using existing submission infrastructure.
- Confirm service-specific routing, form outcomes and success/error handling.

**Exit criteria:** both the self-serve purchase path and the complex-services enquiry path work end to end in test/staging.

### PHASE 3 — Product/audience pages and proof

- Improve nPanel landing page(s) for businesses/developers/agencies.
- Add verified product screenshots and SSH/agency details if currently supported.
- Update relevant service pages to align with BUILD/RUN/GROW without destroying SEO intent.
- Add one approved genuine customer case study if source material exists.
- Validate Microsoft/Google partnership wording and other badges.

**Exit criteria:** credible proof and distinct, usable journeys for all audiences.

### PHASE 4 — SEO, performance and rollout QA

- Route-specific titles/meta/H1/canonicals/structured data.
- Sitemap/robots/staging policy validation.
- Accessibility, mobile UX and web performance fixes.
- Implement existing-stack event tracking where feasible.
- Run production build, lint, typecheck and available tests.

**Exit criteria:** page metadata is correct, major flows intact, automated checks pass and responsive layouts are visually reviewed.

---

## 9. ACCEPTANCE TESTS / REGRESSION CHECKLIST

### Homepage

- Hero communicates cloud + digital solutions + growth without reading like only a branding agency.
- Primary and secondary CTAs reach live appropriate destinations.
- Five and **only five** goal cards with `Run My Business Online` replacing `Go Online`.
- nPanel appears directly after the goal selector.
- Three nPanel persona tabs function on desktop/mobile and with keyboard.
- BUILD/RUN/GROW appears as three connected pillars; automation remains visibly integrated.
- Vendor comparison uses approved, credible wording; old `months pass` line removed.
- Real customer logos remain intact.
- No unsupported or invented customer metrics, guarantees, certifications, partner affiliations or AI claims.

### Commerce

- Domain input, search, availability/results, cart, product additions and checkout remain functional.
- Product prices, VAT terms, billing cycles, promotional/renewal disclosures and plan specs match source of truth.
- No empty links, dead buttons or fictional products.
- Existing Npanel sign-in works; no broken external links.

### Services/enquiries

- Standard plans remain understandable and prices preserved if published.
- Corporate/custom solution CTAs go to an appropriate qualifying journey.
- Form validation, backend submission, success/error states and anti-spam behavior work.
- Budget options include `Not sure`; mobile form is not excessively long.

### Technical

- All modified routes build cleanly; run lint/typecheck/test commands present in package scripts.
- Check at least 375px mobile, 768px tablet and 1440px desktop, and a keyboard-only pass.
- Check Lighthouse/Core Web Vitals where feasible; avoid heavy hero assets and layout shifting.
- Metadata changes are route-specific, not duplicated; local/staging noindex does not leak into production.
- No secrets in client bundle, logs, analytics or UI.

---

## 10. REQUIRED FINAL REPORT FROM CURSOR

After implementing, provide the owner:

1. **Summary of what actually changed** (not just recommendations).
2. **Changed files and routes**, grouped by phase.
3. **Before/after homepage section map**.
4. **Confirmed working flows**: domain search, cart/checkout, enquiries, nPanel sign-in/navigation.
5. **Results of build, lint, typecheck, tests and responsive/a11y QA**; call out unavailable tests honestly.
6. **Items requiring business sign-off**, especially pricing, partner claims, SLAs, security copy, approved client outcomes, beta functions and integrations.
7. **Remaining backend dependencies / TODOs** with priority.

**Do the implementation in the repository, using its actual existing structure. Prioritize correctness, real conversion paths and source-of-truth data over flashy design.**
