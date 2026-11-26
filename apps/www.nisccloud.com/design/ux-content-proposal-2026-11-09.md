# Nisc Cloud: UI, UX, creative direction and content proposal

Date: 9 November 2026 · Phase: design and content planning (for approval) · Status: **proposal only. No production component has been changed for this phase.**

How to read this document:
- **Observed** = seen in the running site (localhost:5175) or the source, with route and file evidence.
- **Recommendation** = proposed change, not yet built.
- **Verify** = a business fact the owner must confirm before it is published or kept.

The site is not production-ready. A passing build is not a passing design review, and nothing here claims security, payment or performance validation.

---

## 0. Scope, environment and what was actually tested

**App:** `apps/www.nisccloud.com` (Bun, Vite 7, React 19, Tailwind 4, react-router-dom, prerendered to static HTML per route).

**Routes:** 53 static public routes plus blog posts (`src/lib/public-routes.ts`). Redirects in the client router: `/services/marketing` goes to `/services`, and `/services/zepo-ai` goes to `/services/zeepo-ai` (`src/App.tsx` lines 128 and 167).

**Uncommitted work preserved:** these files are modified or new in git and were left as they are:
- `src/index.css`
- `src/pages/_components/Hero.tsx`
- `src/pages/_components/ClientLogoStrip.tsx`
- `src/pages/_components/HeroCredentials.tsx` (new)
- `NISC-CLOUD-WEBSITE-STRATEGY.md`

The temporary hero previews (`?hero=blue`, `aurora`, `sky`, `sky-midnight`) are still in `Hero.tsx` and should be removed when this proposal is implemented.

**Automated layout pass (observed):** 19 routes at 1440, 1024, 768, 390 and 320 px (95 page loads in an iframe harness). The routes were:
- `/`, `/hosting`, `/hosting/shared`, `/hosting/wordpress`, `/hosting/vps`
- `/hosting/domains`, `/hosting/email`, `/hosting/ssl`, `/security/ssl`
- `/services`, `/services/seo`, `/services/website-design`, `/services/zeepo-ai`
- `/pricing`, `/platform`, `/work`, `/about`, `/contact`, `/cart`

Each load recorded horizontal overflow, H1 count and text, page height, title, description length, interactive targets under 24 px, visible text under 12 px, visible "loading" text after 6.5 s, and broken images.

| Result | Evidence |
| --- | --- |
| No horizontal overflow at any width | scrollWidth ≤ viewport on all 95 loads |
| Exactly one H1 on every tested route | all 95 loads |
| No broken images | all 95 loads |
| No pricing stuck in a loading state while the pricing API was reachable | no visible "Loading/Fetching/Checking" text at 6.5 s |
| Homepage is very long | 8,301 px at 1440; 14,221 px at 390 (about 17 phone screens); 15,621 px at 320 |
| Small text | 43 to 110 visible text nodes under 12 px per route. Most are inside illustrations (down to 5 px on `/services/website-design` and `/work`). Interface text at 9 px: homepage goal tabs ("01 · Run"), card labels. |
| Small targets | 22 to 40 per route under 24 px, mostly footer list links and inline text links. Footer links need 24 px rows. |

**Screenshots** (in `design/review-2026-11-09/`):
- `01-home-390.jpg`: homepage hero on a phone, caught mid-animation.
- `02-hosting-shared-1440.jpg`: shared hosting hero with duplicate CTAs.
- `03-home-npanel-1440.jpg`: nPanel section.
- `04-home-enquiry-1440.jpg`: "Corporate" enquiry and contrast issues.
- `05-work-1440.jpg`: Our Work, "four disciplines".

**Not verified in this phase (must be tested later):**
- **Tablet and orientation:** layouts were checked at 1024 and 768 px by metrics only, with no visual review. Landscape orientation was not checked.
- **Keyboard focus:** focus visibility on the navbar was not confirmed. Programmatic focus does not trigger `:focus-visible`, and real Tab presses did not reach page content in the embedded browser, so a manual keyboard pass is needed. There is no skip link (observed: no `a[href="#main-content"]`).
- **Assistive technology:** no screen reader testing.
- **Zoom, motion and theme:** 200% zoom, reduced motion (only CSS presence was confirmed), and dark mode on every route were not checked.
- **Pricing failure states:** checked in code only. The live failure path was not forced.
- **Forms and checkout:** form submission was not tested, and no enquiries or purchases were made (by instruction).
- **Performance:** no Lighthouse or field Core Web Vitals.

---

## A. Prioritised audit (observed evidence)

Priority: **P0** blocks trust or correctness · **P1** harms conversion or comprehension · **P2** polish.

| # | Pri | Route | Observed | Evidence |
| --- | --- | --- | --- | --- |
| A1 | P0 | `/` and its JSON-LD | Homepage FAQ defines GEO as local or map results: "GEO means showing up in local and map-style results where people search nearby." The FAQPage JSON-LD is generated from the same array, so the wrong definition is also in structured data. | `src/pages/_components/home-faqs.ts` 77–79; `src/pages/Index.tsx` 21–23 |
| A2 | P0 | `/terms` | Terms define "SEO / AEO / GEO" as "…geo-targeted ranking services". The definition is wrong and the Terms are a legal document. | `src/pages/legal/terms/page.tsx` 200 |
| A3 | P0 | `/services/seo`, `/pricing` | SEO plans show "Team access: Unlimited*" with the footnote "Unlimited allowances are subject to the Acceptable Use Policy … which prohibits excessive, unreasonable strain on shared infrastructure." That is a hosting condition and doesn't apply to an SEO service. | rendered text on `/services/seo` (plan section "Choose Your SEO Plan") |
| A4 | P0 | `/`, `/platform`, `/about`, `/work`, `/services/*`, `/hosting/*` | The fictional "Savanna Bakery" or "Amina" appear in product illustrations with no "illustrative" label. On `/work` and `/about` this reads like client work. | rendered text on 9 of 19 tested routes; `05-work-1440.jpg` |
| A5 | P0 | `/work` | "Every engagement draws on the same four disciplines…" contradicts the Build, Run, Grow framework, where automation runs across the three pillars. | `src/pages/work/_components/ClientsAndCapabilities.tsx` 84 |
| A6 | P0 | site-wide | Unverified or inconsistent claims, listed in section F. Examples: "24/7 support by ticket, email and chat"; "7-day money-back guarantee" on shared hosting; "authorised Microsoft 365 and Google Workspace partner"; "Fast for your visitors, wherever they are"; About timeline years and "dozens of clients". | section F |
| A7 | P1 | `/` | Hero meaning changes over time. The typed H2 and the rotating credentials pill leave half-finished states, e.g. "Everything your business needs to ge\|" with the pill mid-swap. The key proposition is only complete at certain moments. | `01-home-390.jpg`; `Hero.tsx`, `TypedPhrase.tsx`, `HeroCredentials.tsx` |
| A8 | P1 | `/` | Repetition. Eleven sections, and the service list (domains, hosting, email, websites, marketing, AI) is explained in about six of them: NeedSelector, BuildRunGrow, CloudProducts, PainAgitation, WhyNisc, plus the hero paragraph. "Explore Cloud Products" appears 4 times. "Build. Run. Grow." is both the H1 and a later section eyebrow. | accessibility tree of `/`; `Index.tsx` 37–47 |
| A9 | P1 | `/` | The nPanel section's persona CTAs all lead to hosting: Businesses to `/hosting`, Agencies to `/hosting/agency`, Developers to `/hosting/vps`. Nothing links to `/platform`. | `src/pages/_components/NpanelShowcase.tsx` 43, 57, 71; `03-home-npanel-1440.jpg` |
| A10 | P1 | `/hosting/shared`, `/hosting/email` and other product pages | The hero has "Choose Your Plan" and "View Pricing", both buttons that go to the same plans section. | `ServicePageShell.tsx` 417, 500, 593; `02-hosting-shared-1440.jpg` |
| A11 | P1 | `/` | The scoped enquiry is headed "Corporate — Tailored to your business requirements." It's a generic project enquiry, and "Corporate" puts off small businesses. | `04-home-enquiry-1440.jpg`; `HomeClosing.tsx` |
| A12 | P1 | `/` (closing) | Contrast failures on the sky self-service card. "Explore Cloud Products" is sky text on white, "View pricing" is white on sky, and the white body text sits on #38b6ff (about 2.1:1, below 4.5:1). | `04-home-enquiry-1440.jpg` |
| A13 | P1 | product pages | Pricing failure UX. On error, a red alert ("We could not load current pricing…") and "No plans available at this time" render together. There's no retry, no timeout, no slow-loading message, and "Contact Us" is a plain `<a>` to `/contact`. | `src/pages/hosting/_components/HostingPlansPricingSection.tsx` 184–198 |
| A14 | P1 | `/hosting/ssl` and `/security/ssl` | Two SSL certificate pages with near-identical intent: "SSL Certificates \| Nisc Cloud" and "SSL Certificates: Get the HTTPS Padlock". They compete with each other in search and split internal links. | rendered titles and H1s |
| A15 | P1 | `/services/zeepo-ai` | The canonical URL uses the legacy spelling "zeepo", while the public name is Zepo. `/services/zepo-ai` is a client-side redirect listed as a 200 public route, so search engines see a soft redirect. | `App.tsx` 166–167; `public-routes.ts` 18–19, 61 |
| A16 | P1 | site-wide | Navigation done with a button. The navbar "Create account" is a `<button>` but goes to an external sign-up URL. No skip link. | accessibility tree; focus probe |
| A17 | P1 | `/services/seo` | Local or Maps SEO is mixed into the SEO proposition (H1 "Help People Find You on Google, Maps & AI Answers"), while the plans are named "SEO, AEO and GEO". Local SEO should be a separate, clearly scoped offer. | `src/pages/services/seo/page.tsx` 22, 33–35, 50–51, 92 |
| A18 | P2 | `/` | The marquee is the only way to see most client logos on mobile, which means waiting or swiping. Interface labels are 9 px. | layout metrics |
| A19 | P2 | `/work` | The client logo grid seems to show "Ashut" twice (Ashut and a second "ASHUT"-styled mark listed as APL). | `05-work-1440.jpg` (Verify) |
| A20 | P2 | site-wide | Footer and inline links have targets under 24 px. Section eyebrows use Space Mono at 11–12 px in uppercase, which is hard to read for long labels. | metrics |
| A21 | P0 | `/services/zeepo-ai`, `/platform`, `/` | Zepo is described inconsistently. Its own page says it handles lead follow-up, support, booking and nurturing 24/7 in English and Swahili, with WhatsApp, social, CRM and payment integrations; the homepage and Platform qualify capabilities with "where it is available". | `services/zeepo-ai/page.tsx` 10, 22, 26, 38, 43, 62, 67, 87, 106, 113–116; `home-faqs.ts` 9, 99; `platform/page.tsx` 20–24, 137 |
| A22 | P0 | `/services/seo`, `/services/paid-ads`, `/blog` | Unsupported outcome claims include "measurable ranking improvements within 60 to 90 days", leads in "24 to 48 hours", over KES 50 million in ad spend, 90%+ WhatsApp open rates and AI handling 80% of enquiries. | `services/seo/page.tsx` 121; `services/paid-ads/page.tsx` 114; `blog/posts-data.ts` 288, 299, 395, 404, 483 |
| A23 | P1 | `/about` | The timeline still says "Create, Host, Market, Automate" and calls it four steps, which conflicts with Build. Run. Grow. and with automation supporting all three pillars. | `about/_components/OurStory.tsx` 12–15 and About feature blocks |
| A24 | P1 | `/contact`, `/` enquiry | Neither lead form has a consent checkbox. The contact form has a honeypot and a 3-second minimum; the homepage enquiry has neither. Both promise or imply a response without verified service hours. | `ContactForm.tsx`; `ProposalEnquiry.tsx` |
| A25 | P1 | hosting and security pages | Backup claims are not consistently scoped: WordPress promises 30-day retention, security says encrypted off-site backups in geographically separate data centres, and another add-on promises six months. These may be different services, but the pages don't make that distinction clear. | `hosting/wordpress/page.tsx` 41, 126; `security/page.tsx` 33; `SecurityFAQ.tsx` 29; `SecurityFeatures.tsx` 52 |

---

## B. Keep / change / remove

| Keep | Change | Remove |
| --- | --- | --- |
| Name, the Build. Run. Grow. framework, sky primary with midnight, restrained orange | Hero: stable proposition, static trust row (A7) | Typed rotating H2 and rotating credentials pill on the homepage |
| Two journeys: buy online, and discuss a scoped project | Homepage: 11 sections reduced to 8, each with one job (C) | PainAgitation as a separate section (merge into "Why Nisc Cloud") |
| Prerendered pages, crawlable links, FAQ content in HTML | nPanel section: CTA to `/platform` (A9) | ConnectedServices as a homepage section (move to `/hosting/email` and footer proof) |
| Client logo strip, now static on mobile | Hosting hero CTAs (A10) | Duplicate "Explore Cloud Products" links |
| Real nPanel route names, product illustrations | Enquiry heading becomes "Discuss your project" (A11) | "Unlimited*" and the shared-infrastructure footnote on SEO plans (A3) |
| Corporate tier on pricing, shown as "Custom pricing" | GEO definition in the FAQ, JSON-LD and Terms (A1, A2) | Client-side "redirect" routes reported as 200 (A15) |
| Accessibility basics: one H1, labelled forms | Illustrations labelled "Illustration · sample business" (A4) | Unverified claims, until confirmed (F) |

---

## C. Revised homepage: wireframe and complete copy

Goal: about 9 phone screens instead of 17. Each section has one job, essential information is visible without animation or swiping, and navigation uses links while actions use buttons.

```
[1 Hero ............ proposition + two journeys + trust row + client proof]
[2 Choose a path ... Build | Run | Grow (+ automation band)]  -> routing
[3 Buy online ...... domain search + 6 products]               -> self-serve
[4 nPanel .......... one platform view, Explore nPanel]        -> platform
[5 Why Nisc Cloud .. 4 verified commitments]                   -> trust
[6 Work ............ client logos + approved stories]          -> proof
[7 FAQ ............. 6 questions, corrected definitions]       -> objections
[8 Start ........... Buy online | Discuss your project form]   -> conversion
```

### 1. Hero

**Desktop (1440):** centred, max width 880 px, midnight-to-blue background (current lightened version). Under the CTAs, a static trust row with two items side by side. Below that, a static row of 8 client logos with "See our clients" linking to `/work`. No typing and no rotation.

**Mobile (390/320):**
- The trust row stacks as two short lines.
- The two CTAs are full width, with the primary first.
- Client logos sit in a static 4×2 grid: no marquee, so nothing needs swiping.
- The H1 is 40 px at 390 and 34 px at 320.

**Copy:**
- **Eyebrow (static):** For businesses, agencies and developers
- **H1:** Build. Run. Grow.
- **Proposition (p, 20–24 px):** Cloud infrastructure, software and digital growth for your business, delivered and supported by one accountable team.
- **Supporting line:** Buy domains, hosting and email online, or work with us on websites, systems and marketing. Manage everything in nPanel.
- **Primary CTA (link):** Explore cloud products, to `/hosting`
- **Secondary CTA (link):** Discuss your project, to `/contact` (or `#start` on the homepage)
- **Trust row (static, with logos):**
  - Licensed by the Communications Authority of Kenya
  - KeNIC-accredited .ke domain registrar
- **Proof line:** Trusted by organisations from small businesses to corporate teams. · See our clients

The H1 stays as the brand framework. An alternative, if the owner prefers the proposition to be the H1 for search, is to make "Build. Run. Grow." the eyebrow and use the proposition as the H1. That's an owner decision, and either option keeps the `<title>` keyword-led.

### 2. Choose a path

- **H2:** Where would you like to start?
- **Intro:** Three ways we work with you. Automation and Zepo support all three.

| Build | Run | Grow |
| --- | --- | --- |
| Create the brand, website and software your business runs on. | Keep your domains, hosting, email and servers reliable and secure. | Reach the right customers and turn visits into enquiries and sales. |
| Brand identity · Website design · E-commerce · Custom software | Domains · Website and WordPress hosting · Business email · VPS and servers · Security | SEO, AEO and GEO · Paid advertising · Social media · Email marketing |
| Link: Explore Build services, to `/services` | Link: Explore cloud products, to `/hosting` | Link: Explore Grow services, to `/services#grow` |

**Automation band (one line, not a fourth pillar):**
- Copy: Automate the repetitive work across all three with Zepo, where it's available on your services.
- Link: How Zepo helps, to `/services/zepo-ai`

### 3. Buy online

- **H2:** Buy online today
- **Intro:** See the price, billing term and renewal before checkout. Pay with M-Pesa or card (Verify).
- **Domain search:** label "Find your domain"; button "Search". Results must only ever show verified availability.
- **Six product links:** Domains · Website hosting · WordPress hosting · Business email · VPS and servers · SSL certificates. Each card shows "From KES …/month" **only** when the live price has loaded, and otherwise "See plans". Prices are never typed into the code.
- **Link:** Compare all pricing, to `/pricing`

### 4. nPanel

- **Eyebrow:** nPanel
- **H2:** One place to run your services
- **Body:** Domains, hosting, email, invoices, support and project updates in one account, for your whole team.
- **Three short persona lines (static, no tabs):**
  - Businesses: see every service and renewal in one place.
  - Agencies: manage client accounts and hosting together (Verify agency features).
  - Developers: servers, DNS and access in one console (Verify).
- **Visual:** product illustration with the caption "Illustration · sample business and data". Replace it with a real, redacted screenshot once one is approved.
- **Primary link:** Explore nPanel, to `/platform`
- **Secondary link:** Log in to nPanel (external)

### 5. Why Nisc Cloud

This merges PainAgitation and WhyNisc.

- **H2:** One accountable team, from setup to growth
- Four points, each listed with its claims-register status:
  1. **One point of contact.** A dedicated account manager for managed services. (Owner-confirmed.)
  2. **Clear pricing.** Prices, billing terms and renewals shown before you buy.
  3. **Your assets stay yours.** Your domains, code and data remain yours if you move. (Verify the wording against the Terms.)
  4. **Agreed goals.** For managed services, we agree first-month milestones and review progress within 30 days. (Verify it's a standard commitment.)

### 6. Work

- **H2:** Organisations we work with
- **Content:** a static logo grid of 12 logos, plus up to 3 approved project stories. Each story covers the client, the work done and an approved outcome. No numbers are allowed without permission and evidence.
- **Link:** See our work, to `/work`
- **Until stories are approved:** show logos only, and leave out any result statements.

### 7. FAQ

Six questions, in visible HTML, with JSON-LD generated from the same source.

1. **What does Nisc Cloud do?** We help businesses build, run and grow online: brand, websites and software (Build); domains, hosting, email, servers and security (Run); and marketing (Grow). nPanel connects your services, and Zepo supports automation where it's available.
2. **Can I buy without talking to sales?** Yes. Domains, hosting, email, servers and SSL can be bought online with the price and renewal shown before checkout. Websites, software and marketing start with a short conversation so we can scope the work.
3. **What are SEO, AEO and GEO?** SEO (Search Engine Optimization) helps your pages appear in search results such as Google. AEO (Answer Engine Optimization) presents clear, accurate answers to the questions your customers ask, so search features and assistants can use them. GEO (Generative Engine Optimization) improves how accurately your business and expertise are represented in AI-generated answers. Local SEO, which covers your Google Business Profile and map results, is a separate service. No provider can guarantee rankings or AI citations.
4. **Do you migrate existing websites?** Yes. Migration is free within an agreed scope. Any extra work is quoted and charged only after you approve it.
5. **What support do you offer?** (Copy pending Verify: exact support hours and channels.)
6. **Who owns my domain and website?** (Copy pending Verify against the Terms.)

### 8. Start

- **H2:** Two ways to get started
- **Left card (midnight background, white text, passes contrast):**
  - Eyebrow: Buy online
  - H3: Ready to buy? Start online.
  - Body: Prices and renewal terms are shown before checkout. Manage everything afterwards in nPanel.
  - Links: Explore cloud products · Compare pricing
- **Right card:**
  - Eyebrow: Business services
  - H3: Discuss your project
  - Body: Tell us what you need in three short steps. We reply with next steps and, where it fits, a proposal.
  - Form: the existing three steps. Step 1 is labelled "What would you like to discuss?", and the submit button reads "Send enquiry". Corporate tiers stay on `/pricing` as "Corporate · Custom pricing".

---

## D. Representative page proposals

### D1. Product page template (e.g. `/hosting/shared`)

1. **Hero:**
   - H1 in the form "Web hosting for business websites in Kenya" (one location reference, no stuffing).
   - Two to three lines of verified specifications.
   - **Primary:** See plans and prices (link to `#plans`).
   - **Secondary:** Compare hosting types (link to `/hosting`), or "Moving from another host? See migration" (link to `#migration`).
   - Remove "Choose Your Plan" and "View Pricing" (A10).
2. **Plan comparison** (see D3).
3. **What's included:** verified specifications only.
4. **Who it suits:** it's for X; choose VPS if Y. Link to alternatives.
5. **Migration:** the scope-qualified free migration, with steps.
6. **Management in nPanel:** a real screenshot when approved, otherwise a labelled illustration.
7. **FAQ:** 5 to 7 buyer questions on renewal, upgrades, refunds (Verify), backups (Verify) and email.
8. **Related products, plus a closing CTA:** See plans, or Talk to us.

### D2. Managed service template (e.g. `/services/seo`)

1. **Hero:**
   - H1: "SEO, AEO and GEO services for businesses".
   - Promise: "Clearer visibility in search and AI answers, reported every month", with no ranking promise.
   - **Primary:** Book a free strategy call.
   - **Secondary:** See SEO plans.
2. **Problem and outcome**, written in the customer's words.
3. **What we do**, as separate blocks: SEO, AEO, GEO. **Local SEO** gets its own block and links to its own offer if one exists (A17).
4. **How we work:** audit, plan, implement, report, with timelines.
5. **Plans:** replace "Team access: Unlimited*" with verified items.
   - Reporting portal access for [n] users (Verify).
   - Websites covered.
   - Target keywords.
   - Pages optimised each month.
   - Footnote: "Work covers the websites and keywords listed. More sites or keywords are quoted before work starts." Remove the shared-infrastructure line (A3).
6. **Evidence:** approved case notes only.
7. **FAQ:** with no guarantees of rankings or AI citations.
8. **Closing CTA.**

### D3. Pricing comparison and enquiry flow

- **Plan cards:**
  - Name, then "For …", then price with billing term and VAT.
  - Renewal price shown beside the first-term price.
  - At most 6 key specifications, then "Compare all features", which expands a full-width table that's keyboard-accessible.
- **Corporate:** always "Custom pricing", with "Discuss your requirements". It never shows 0 KES.
- **Loading, timeout, retry and unavailable states** (A13):

| State | Trigger | Design |
| --- | --- | --- |
| Loading | request in flight, under 4 s | Plan-shaped skeletons and a visually hidden live region: "Loading current prices" |
| Slow | 4 to 12 s | Keep the skeletons, plus a visible line: "Still loading prices from our billing system…" |
| Timeout or error | over 12 s, or a failed request | One card: "We couldn't load current prices." Buttons: "Try again" (retries the request) and "Contact sales" (link). No "No plans available" underneath. |
| Empty | successful response with 0 plans | "These plans are being updated. Contact us for current options." Link: Contact sales. |
| Unavailable plan | plan marked unavailable | Card stays visible but dimmed, labelled "Currently unavailable", with the button "Ask about availability" (link). |
| Never | any state | Hard-coded fallback or promotional prices |

- **Enquiry flow:**
  - Keep the three steps: project, then budget and timing, then details.
  - Show the step count and a "Back" button.
  - Keep entered data when moving between steps.
  - On error, show the message inline and keep the form data.
  - On success, show "We've received your enquiry. Expect a reply within [hours] (Verify)", the next steps, and a link to buy online.
  - The marketing-consent checkbox stays unticked and separate from the Terms.

### D4. Shared rules (design system)

- **Spacing:**
  - 4 px base. Section padding is 64 px on desktop and 48 px on mobile.
  - Content max width is 1200 px; text max width is 68 characters.
  - Card padding is 24 px on desktop and 20 px on mobile.
- **Type** (DM Sans throughout the interface):
  - Heading sizes: H1 56–80 px desktop and 34–40 px mobile; H2 36 / 28 px; H3 20 / 18 px.
  - Body 16–18 px; minimum interface text 12 px (14 px preferred).
  - Space Mono only for code, URLs and data inside illustrations, not for section eyebrows longer than two words.
- **Colour:**
  - Midnight #02070A with sky #38B6FF as primary; orange #FC734D only for single-word emphasis or badges.
  - White text never sits on #38B6FF. Sky text never sits on white below 24 px bold.
  - Body text contrast ≥ 4.5:1; large text and interface parts ≥ 3:1.
- **Components:**
  - Links navigate; buttons act.
  - One primary CTA per section, at most one secondary.
  - Visible 2 px focus ring on every interactive element.
  - Targets ≥ 24 px, 44 px on mobile CTAs.
- **Motion:**
  - Only to explain a change, and never needed to understand content.
  - Off under reduced motion.
  - Nothing rotates in the hero.
- **Illustration direction:**
  - One kit: flat glass panels, sky and midnight, small orange accents, real nPanel interface patterns.
  - Every illustration with readable data carries the caption "Illustration · sample data".
  - The fictional business is used consistently ("Savanna Bakery") and never shown next to real client logos without that label.
- **Photography:**
  - Black African and Kenyan people, natural light, real work settings.
  - Real team photos with consent; until then, no stock photos presented as "our team".
- **Real screenshots versus illustrations:**
  - A real screenshot is labelled "nPanel screenshot · data redacted".
  - An illustration is labelled "Illustration".
  - No sensitive Npanel reference screenshots are published.

---

## E. Site-wide content and metadata map

Definitions used throughout:
- **SEO** = Search Engine Optimization.
- **AEO** = Answer Engine Optimization.
- **GEO** = Generative Engine Optimization.
- **Local SEO** (Google Business Profile, maps) is separate.

Location wording appears once per page where intent is local. There are no duplicated city pages.

The table lists the key routes. Every other route should follow the same pattern before it's implemented.

| Route | Audience and intent | Unique purpose | Title | Description (≤155 chars) | H1 | Main proposition, then CTA | Must cover | Internal links | Evidence needed |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/` | All; navigational and commercial | Route people into the two journeys | Nisc Cloud \| Cloud, Software and Digital Growth | Build, run and grow with one team: domains, hosting, email, websites, software and marketing, managed in nPanel. | Build. Run. Grow. | One accountable team, then Explore cloud products / Discuss your project | Paths, buy online, nPanel, proof, FAQ | /hosting, /services, /platform, /work, /pricing | Client permissions, support hours |
| `/hosting` | Buyers comparing products | Product hub, grouped by need | Cloud Hosting, Domains, Email and Servers \| Nisc Cloud | Compare website hosting, WordPress, VPS, dedicated servers, domains, email and SSL, with prices before checkout. | Cloud products for every stage | Choose by need, then See plans | Which product is for whom | all product pages | Specs |
| `/hosting/shared` | SMEs needing a website host; transactional | Plans for business sites | Web Hosting for Business Websites \| Nisc Cloud | NVMe web hosting with free SSL and backups, managed in nPanel. See plans, renewal prices and migration. | Web hosting for business websites | Reliable hosting, then See plans | Plans, inclusions, migration, refunds | /hosting/wordpress, /hosting/vps, /hosting/domains | Backups, SSL, refund, support |
| `/hosting/wordpress` | WordPress site owners | Managed WordPress | Managed WordPress Hosting \| Nisc Cloud | WordPress hosting with updates, backups and staging (Verify), managed in nPanel. | Managed WordPress hosting | Less maintenance, then See plans | What "managed" covers | /hosting/shared, /security/website-maintenance | Managed scope |
| `/hosting/vps` | Developers; "vps kenya" | Configurable servers | VPS Hosting in Kenya \| Nisc Cloud | Virtual private servers with root access, NVMe and monthly billing in KES. Configure and order online. | VPS servers for growing workloads | Control, then Configure & order | Specs, OS, locations (Verify), support boundary | /hosting/vds, /hosting/dedicated-servers | Locations, specs |
| `/hosting/domains` | Name seekers; transactional | Search and register | Domain Registration in Kenya: .ke and .com \| Nisc Cloud | Search .co.ke, .ke and global domains. KeNIC-accredited registrar; prices and renewals shown first. | Find and register your domain | Verified availability, then Search | Renewal versus registration, transfer | /domain-transfer, /whois, /hosting/email | KeNIC status ✓ |
| `/hosting/email` | SMEs; "business email" | Nisc Mail plans | Business Email Hosting \| Nisc Cloud | Professional email on your own domain with webmail and spam filtering. Compare plans with Microsoft 365 and Google Workspace. | Business email on your domain | Trust, then See plans | Mailbox limits, migration | /hosting/hybrid-email, /hosting/microsoft-365 | Partner status |
| `/hosting/ssl` (canonical for certificates) | Site owners; "buy ssl" | Buy a certificate | SSL Certificates \| Nisc Cloud | Sectigo SSL certificates with installation help. Compare validation types and prices. | SSL certificates for your website | Padlock and trust, then Choose a certificate | DV/OV/EV, installation | /security, /hosting/shared | Sectigo reseller status |
| `/security/ssl` | — | Duplicate of the above | Proposed: permanent (301) redirect to `/hosting/ssl` after a Search Console check | — | — | — | — | — | Which URL has impressions |
| `/security` | Owners worried about safety | Security hub | Website Security Services \| Nisc Cloud | Malware removal, maintenance, email security and SSL in one place. | Website security | Protection, then See services | What each service covers | /security/* | Scope |
| `/services` | Buyers of Build and Grow services | Services hub, by pillar | Websites, Software and Marketing Services \| Nisc Cloud | Brand, websites, e-commerce, software and marketing, scoped and delivered by one team in Kenya. | Build and grow with one team | Scoped work, then Book a strategy call | Pillar sections, process | each service page | Project evidence |
| `/services/website-design` | SMEs; "web design kenya" | Website projects | Website Design and Development in Kenya \| Nisc Cloud | Websites designed to turn visitors into enquiries: planning, design, build, hosting and support. | Websites that turn visitors into customers | Outcomes, then Book a call | Timeline, inclusions, pricing basis | /services/ecommerce, /hosting/shared | Approved portfolio |
| `/services/seo` | SMEs; "seo services kenya" | SEO, AEO and GEO | SEO, AEO and GEO Services \| Nisc Cloud | Search, answer and generative engine optimization with monthly reporting. No ranking guarantees. | SEO, AEO and GEO services | Visibility with reporting, then Book a call / See plans | Definitions, local SEO separate, plans | /blog AEO article, /services/website-design | Plan inclusions |
| `/services/zepo-ai` (new canonical) | Businesses exploring AI | Zepo capabilities available now | Zepo AI Automation \| Nisc Cloud | Zepo helps automate customer conversations and follow-ups in supported Nisc Cloud services. See what's available today. | Zepo: automation that supports your team | Practical automation, then Discuss automation | Available versus planned, data handling | /platform, /services | Live capabilities |
| `/services/zeepo-ai` | Legacy | — | Permanent (301) redirect to `/services/zepo-ai` | — | — | — | — | — | — |
| `/pricing` | Price comparers | All prices in one place | Pricing: Hosting, Domains, Email and Services \| Nisc Cloud | Compare prices for hosting, domains, email, servers and marketing plans in KES, with renewal terms. | Clear pricing | Transparency, then Compare | States in D3, Corporate custom | all products | Live prices only |
| `/platform` | Prospects evaluating nPanel | nPanel and Zepo explained | nPanel: Manage Every Nisc Cloud Service \| Nisc Cloud | One account for domains, hosting, email, invoices, support and projects, for businesses, agencies and developers. | One account for every Nisc Cloud service | Control, then Create account / See products | Feature tour by persona; screenshot versus illustration | /hosting/agency, /services/zepo-ai | Real redacted screenshots |
| `/work` | Evaluators | Proof | Our Work: Clients and Projects \| Nisc Cloud | Organisations we work with and what we deliver across Build, Run and Grow. | Organisations we build, run and grow with | Proof, then Discuss your project | Logos, approved stories, labelled illustrations | /services, /contact | Permissions |
| `/about` | Evaluators | Company credibility | About Nisc Cloud | Kenyan technology company combining cloud, software and digital growth, led by founder and CEO Naftaly Munene. | About Nisc Cloud | Accountable partner, then Contact | Story, leadership, licences, team | /work, /contact | Timeline, team photo |
| `/contact` | Ready to talk | Enquiry and contact | Contact Nisc Cloud | Talk to sales or support, or send a project enquiry. Email, phone and office details. | Talk to Nisc Cloud | Fast reply, then Send enquiry | Form, hours, channels | /help, /pricing | Hours, response time |
| `/cart` | Buyers | Checkout handoff (noindex) | Your Cart \| Nisc Cloud | — | Your cart | — | Renewal, VAT, terms | — | — |

---

## F. Factual-claims register (business confirmation needed)

Status key:
- ✅ owner-confirmed (date)
- ⚠️ unverified; keep only after confirmation
- ❌ contradictory or misleading; change regardless

| # | Claim (as published) | Where (examples) | Status | Needed |
| --- | --- | --- | --- | --- |
| F1 | Licensed by the Communications Authority of Kenya | hero, footer | ✅ (logo and wording in use; licence number not shown) | Licence category and number for `/about` |
| F2 | KeNIC-accredited .ke registrar | hero, footer, /hosting/domains | ✅ | — |
| F3 | ODPC Reg. No. 160-3417-5D07 | footer | ⚠️ | Certificate copy |
| F4 | "authorised Microsoft 365 / Google Workspace partner" | ConnectedServices.tsx 39; PartnerServicePage.tsx 5 | ⚠️ | Partner programme, tier and ID. Use the exact programme wording. |
| F5 | All sold SSL certificates are issued by Sectigo | /hosting/ssl; /security/ssl; homepage product card | ⚠️ | Confirm issuer and reseller relationship; remove the universal "all/every" wording unless it applies to every plan |
| F6 | 99.9% uptime **target** (never a guarantee or SLA) | 22 files, e.g. hosting/page.tsx 28, CartItem.tsx 64 | ✅ target, 9 Nov | Ensure no "guarantee" wording survives (catalogue says "guarantee"; hosting-plan-model.ts 78) |
| F7 | NVMe SSD storage (shared) | hosting pages | ✅ owner decision, 7 Nov | Catalogue still says "SSD"; align |
| F8 | LiteSpeed web server | hosting-pricing-configs.ts 44; wordpress/page.tsx 24 | ⚠️ | Confirm per plan |
| F9 | Daily backups; retention period | shared hero, plans | ✅ daily, 9 Nov; retention ⚠️ | Retention days and restore cost |
| F10 | Auto-scaling, WAF, DDoS protection, vulnerability scanning | Services.tsx 35, OnePlatform.tsx 9 | ✅ 9 Nov | Which plans include each |
| F11 | "24/7 support by ticket, email and chat"; phone in business hours | HostingPlansPricingSection.tsx 56; hosting/page.tsx 93; home-faqs.ts 54; closing-cta.tsx 20 | ⚠️ | Exact hours per channel, staffed or automated, response targets |
| F12 | "Fast for your visitors, wherever they are" | /hosting/shared hero | ❌ implies a global CDN | Remove, or confirm a CDN |
| F13 | 7-day money-back guarantee, new shared hosting accounts | hosting/shared/page.tsx 155–159; terms 365, 402 | ⚠️ | Confirm the Terms match; which products |
| F14 | "Cancel anytime" | CartItem.tsx 321; OrderDialog.tsx 398; terms 328 | ⚠️ | Refund on cancellation, notice period |
| F15 | "Your domain, code and data remain yours. Leave when you want…" | WhyNisc.tsx 77 | ⚠️ | Align with Terms (unpaid invoices, custom code IP) |
| F16 | "First-month milestones … review progress within 30 days" | WhyNisc.tsx 87; home-faqs.ts 124; BentoFeatures.tsx 304 | ⚠️ | Is this standard for all managed services? |
| F17 | Dedicated account managers | AboutHero.tsx 30; CartItem.tsx 176 | ✅ 9 Nov | For which plans or tiers |
| F18 | Clients range to corporate teams; largest over 2,500 employees | /about, llms.txt | ✅ 9 Nov (removed from hero strip at owner request) | — |
| F19 | About timeline 2018 / 2020 / 2022 / 2024; "dozens of clients" | OurStory.tsx 6–15 | ⚠️ | Founding year, milestones, client count |
| F20 | Free migration within agreed scope | pricing FAQ, Terms 5.6 | ✅ 9 Nov | — |
| F21 | Pay with M-Pesa or card | closing-cta.tsx 20 | ⚠️ | Confirm payment methods live |
| F22 | Zepo capabilities (domain answers, register, email drafting, follow-ups) | /services/zeepo-ai, /platform illustrations | ⚠️ | Which features are live today, and for whom |
| F23 | Client logos and names (17), including the possible duplicate Ashut/APL | /, /work | ⚠️ | Written permission per logo; confirm duplicates |
| F24 | SEO plan "Team access: Unlimited*" | /services/seo, /pricing | ❌ | Real allowance and relevant conditions |
| F25 | GEO = local or map results | home FAQ and JSON-LD; Terms 200 | ❌ | Correct the definition (C §7) |
| F26 | Zepo works 24/7 in English and Swahili; WhatsApp, website, Facebook and Instagram; appointment booking; HubSpot, Zoho, Sheets and Zapier; mobile-money payments; 5-day setup | `services/zeepo-ai/page.tsx` | ⚠️ | Capability-by-capability live status, plan availability, data handling and implementation times |
| F27 | SEO clients see measurable ranking improvements within 60–90 days; extra work at no charge if there is no progress by month 3 | `services/seo/page.tsx` 121, 124; `home-faqs.ts` 74 | ❌ pending evidence and precise terms | Remove the typical-result statement or provide attributable evidence; legal review of the remedy |
| F28 | Ads can generate leads in 24–48 hours | `services/paid-ads/page.tsx` 114 | ⚠️ | Evidence and qualification; otherwise say campaigns can begin collecting data after launch |
| F29 | Over KES 50 million ad spend across dozens of Kenyan businesses | `blog/posts-data.ts` 395, 404 | ⚠️ | Verifiable spend records and permission to publish aggregate figures |
| F30 | WhatsApp open rates exceed 90%; Zepo handles 80% of inbound queries; 60-second response | `blog/posts-data.ts` 279, 288, 299, 483 | ❌ pending evidence | Remove or cite a named, current source and clearly distinguish external benchmarks from Nisc Cloud results |
| F31 | Backup retention and location: 30 days, six months, encrypted off-site, geographically separate data centres | WordPress and security pages | ⚠️ | Map each promise to the exact product and plan, plus restore limits and cost |
| F32 | Cancellation: "Cancel anytime" versus 30 days' notice; annual plans non-refundable | `OrderDialog.tsx` 398; `pricing-faqs.ts` 25; `home-faqs.ts` 119; Terms | ❌ contradiction | Pick one policy per product and match the Terms, cart and FAQ |

---

## G. Acceptance checklist (before release of the redesigned pages)

**Every page, at 1440, 1024, 768, 390 and 320 px, in light and dark mode:**
- [ ] No horizontal scroll, clipped text or overlapping elements.
- [ ] One H1. Headings in logical order.
- [ ] Title, description and canonical are unique and match the visible content.
- [ ] Essential information is readable with animation off, and without swiping or waiting.
- [ ] Body text ≥ 16 px; no interface text < 12 px. Contrast meets 4.5:1, or 3:1 for large text and interface parts.
- [ ] Every interactive element is reachable by Tab in reading order, has a visible focus ring, and works with Enter or Space.
- [ ] A skip link to `#main-content` works.
- [ ] Links navigate and buttons act. No `<button>` is used for page navigation.
- [ ] Targets ≥ 24 px, and 44 px for primary CTAs on mobile.
- [ ] Reduced motion: no autoplay rotation, typing or marquee; content is static and complete.
- [ ] Every illustration showing data carries "Illustration · sample data". Real screenshots are labelled and redacted.
- [ ] Every claim on the page is ✅ in the claims register.
- [ ] FAQ JSON-LD equals the visible FAQ, word for word.

**Product pages:**
- [ ] Hero has one primary action ("See plans and prices") and a different secondary destination.
- [ ] Price, billing term, VAT and renewal are visible on each plan.
- [ ] All loading, slow, timeout, empty and unavailable states (D3) are demonstrated with a mocked API.

**Service pages:**
- [ ] Deliverables, exclusions, process, timeline and pricing basis are stated.
- [ ] No ranking, AI-citation or results guarantees.

**Forms:**
- [ ] Labels, inline errors and kept data on error.
- [ ] Unticked marketing consent, separate from the Terms.
- [ ] A privacy notice and link explain how enquiry data will be used. If marketing consent is not needed for a service enquiry, don't add a required checkbox; only add an optional, unticked checkbox for marketing emails.
- [ ] Both forms have equivalent anti-spam controls. Do not bypass bot protection in testing.
- [ ] Tested against a non-production endpoint only.

**Redirects:**
- [ ] `/services/zeepo-ai` and `/security/ssl` (if approved) return a server 301 to the canonical URL.
- [ ] Sitemap lists only canonical URLs.
- [ ] Old URLs still resolve.

---

## H. Later-phase backlog (not part of this phase)

**Engineering:**
- Server-side 301s for `/services/zeepo-ai` to `/services/zepo-ai` and `/services/marketing` to `/services`, with the sitemap and canonical updated.
- An `/security/ssl` decision after a Search Console page check.
- Remove the temporary hero previews.
- Skip link.
- Convert "Create account" to a link.
- Pricing state machine with retry and timeout.
- Static mobile logo grid.
- Lighthouse and field Core Web Vitals.
- A manual keyboard and screen reader pass.

**Security** (needs backend access; no frontend claim of validation):
- Domain transfer price taken from the browser (`design/pre-launch-remediation-log.md` C-1, P0 backend).
- Server-authoritative pricing for every product.
- Rate limiting and bot protection on enquiry forms.
- Content Security Policy and security headers review.

**Payment integrity:**
- Signed, server-verified payment callbacks. A forged or unverified payment must never mark an order Paid or trigger fulfilment.
- Prevent duplicate payments.
- Cancellation and timeout recovery.
- Sandbox-only tests.

**Deployment:**
- Preview deploy of the prerendered build.
- Verify per-route HTML and status codes (200, 301, 404).
- Robots and noindex for preview.
- Rollback plan.
- Commit and deploy only with explicit owner authorisation.

---

## Approval needed

1. **Homepage:** approve the 8-section structure and copy in section C, and choose the H1 option (brand H1, or proposition H1).
2. **SSL routes:** approve consolidating SSL into `/hosting/ssl` (pending a Search Console check).
3. **Zepo URL:** approve `/services/zepo-ai` as the canonical, with a 301 from `zeepo-ai`.
4. **Claims:** answer the ⚠️ and ❌ items in section F.
5. **Recent hero work:** confirm removal of the typed phrase and the rotating credentials pill. These were requested and built earlier today, and this brief asks for a stable hero instead.
