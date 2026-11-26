# Nisc Cloud system audit — 2026-11-03

Owner: Naftaly Munene, founder and CEO, Nisc Cloud Limited.
Status: evidence-based initial audit; no redesign or production deployment in this pass.

## Scope and limitations

Reviewed staging homepage, security, portfolio, business email offer, domain lookup and cart through account details; local storefront source; authenticated production agency dashboard and a Test Account customer dashboard/subscriptions through the supported impersonation flow. Returned successfully to /agency/clients after inspection. No payment, registration, email send, subscription change or service provisioning performed. Skipped the test-account welcome tour. A synthetic domain was added only to the staging browser cart, not registered.

This is not a complete security assessment or certification. Backend apps/server, apps/web and packages/api/auth/db are absent from this sparse checkout. No tenant-boundary, webhook, refund, payment-failure or live provisioning test. Browser/CDP delays prevent credible latency measurements. Mobile override yielded inconsistent visual scaling; no mobile pass claimed. All routes and service combinations have not been exhaustively tested.

## Provisional scorecard

Expert review rubric: 1-3 major readiness gaps; 4-6 workable foundation with material friction; 7-8 coherent and substantiated; 9-10 measured excellence across devices and failure paths. Scores are judgments, not Lighthouse measurements or conversion forecasts.

| Area | Score /10 | Evidence |
|---|---:|---|
| Premium positioning | 4 | Broad hosting/marketing message; systems development not prominent; generic promises |
| Public credibility | 3 | Unverified team, portfolio outcomes and testimonials; simulated security telemetry presented as real-time |
| Desktop UI and navigation | 6 | Consistent visual language and service groups; repetitive content, weak differentiation and dense plan tables |
| SEO/AEO/GEO foundation | 4 | Relevant service content exists; staging discovery, metadata/canonical and legacy URL issues documented in strategy |
| Sampled checkout UX | 5 | Domain availability and quotes work; offer mismatch, tax wording and identity-check friction |
| Client dashboard UX | 6 | Useful service navigation, onboarding, billing and support; assistant dominates home and counts need reconciliation |
| Agency operational UX | 6 | Broad service/billing operations surfaced; hierarchy and metric semantics need refinement |
| Security assurance | Not scored | Frontend and authenticated views are insufficient evidence of backend security |
| Performance / payment reliability | Not scored | No controlled timings, field metrics or sandbox payment completion |

Overall observed experience: approximately 5/10 (seven scored areas average 4.9). This is not a whole-system security/reliability score. Strong functional breadth, insufficient proof and consistency for premium readiness.

## Priority findings

### P0: correct before promoting the new public site

1. **Verify public proof.** About source contains a template founder/CEO identity inconsistent with Naftaly. Portfolio /work claims include Verdant Co. $1.2M, Apex Realty +64%, Stackr CAC -52% and other outcomes. Treat all as unverified until the owner supplies evidence and publishing permission. Replace unsupported material with real projects, or clearly labelled demonstrations. Audit testimonials, client logos, uptime, response time, delivery and compliance claims.
2. **Label security demonstration.** /security describes real-time monitoring and live activity. SecurityDashboardScreen.tsx uses hardcoded events/counters (initial threatCount 2841 and uptime 99.98). Label as illustrative interface, or connect authenticated real telemetry with defined scope and time window. Avoid absolute attack-prevention, deliverability and ranking promises.
3. **Protect search continuity.** Use the separate search baseline and strategy: preserve old .php URLs with specific redirects, route metadata/canonicals, meaningful crawlable HTML and true 404s. Keep staging out of search with appropriate access/index controls. Do not launch unverified case studies to indexed pages. No page-one or AI citation guarantee is possible.
4. **Align the purchased product.** Basic email sales table shows 10 GB; cart says 5 GB mailbox storage per account. CartItem.tsx:85 contains hardcoded email features. Use one typed product catalogue for plan page, cart, invoice and provisioning. Clearly distinguish pooled storage from per-mailbox limits and mailbox counts.
5. **Resolve tax presentation.** Basic shows KES320, adds VAT52, total372, yet footer says all prices include VAT. Combined example: 320 + domain1690 + VAT322 =2332. OrderSummary.tsx:275 contains the conflicting text. Source uses Math.ceil for tax; define and reconcile rounding with backend/invoices. This is a presentation/consistency finding, not a tax-law conclusion.

### P1: checkout, trust and client experience

6. **Investigate session handoff.** Details remained on “Checking whether you're signed in to nPanel…” across several observations, then rendered guest form while the browser had an active production agency session. May involve cookie scope, cross-origin auth, unsupported agency identity or request timing. Reproduce with a normal customer, guest and expired session. Add bounded loading, retry and explicit guest/sign-in paths that preserve cart. Do not describe measured seconds from this run.
7. **Reconcile dashboard counts.** Test-account home showed one active subscription; list showed two active Zeepo entries. Clarify whether different product categories are intentionally excluded, then make labels/counts consistent. Do not infer billing error without backend data.
8. **Make the dashboard operational first.** Prioritize renewals, payment problems, domain/hosting health and onboarding. Keep Zeepo available but secondary to urgent service tasks. Show service-specific progress, ownership, billing dates and support links. Use platform-appropriate keyboard hints; Windows currently displays Command-J.
9. **Improve offer readability.** Plan tables require clearer unit labels, inclusions, renewal terms and comparison hierarchy. Explain email migration scope, retention, calendars and actual supported clients; verify product capability before publishing. “Free” plan currently says Contact us: state eligibility and limits.
10. **Fix analytics asset routing.** Browser console repeatedly reports Unexpected token '<' for /_vercel/insights/script.js. Investigate deployment compatibility and SPA fallback; verify actual funnel events after fixing. No claim that all analytics are broken.

### P1: security engineering review (not confirmed exploits)

- Review authorization on every tenant/service/billing operation, session expiry, CSRF/CORS, and customer/agency role separation in backend.
- Impersonation visibly has a banner and Return button. Dialog says customer MFA and alerts are not triggered. Verify privileged step-up, least privilege, reason recording, immutable audit events, expiry and restrictions on payment/security changes. Bypass language alone does not establish a vulnerability.
- Source persists transferAuthCode in the sessionStorage cart draft (page.tsx snapshot + storefront-checkout-api.ts persistence). Treat domain transfer secrets as sensitive: minimize lifetime, avoid persistent client storage if feasible, clear on completion/cancel and assess XSS exposure. No password persistence found in that draft type.
- Verify server-authoritative product prices, tax, discounts, availability, signed handoff expiry and replay handling; frontend pricing is not an authorization boundary.
- Review account-existence checks for enumeration and abuse controls; no abuse testing performed.
- Hosted card-entry text is a positive separation, not proof of PCI compliance. Verify payment webhooks, signatures, idempotency, reconciliation and provisioning only after confirmed settlement.

## Premium positioning proposal

Core line: **Cloud infrastructure, digital systems and growth services — delivered by one accountable team.**

Hero direction: **Build, run and grow your business on a stronger digital foundation.**
Supporting copy: Nisc Cloud brings managed cloud services, business systems and digital marketing together, with clear ownership from implementation to ongoing improvement.

Three pillars: Run reliably (cloud/email/security); Operate efficiently (systems/integrations/automation); Grow demand (brand/web/marketing). Verify actual delivered scope before making claims. Preserve self-service domains/hosting, with a separate “Discuss your requirements” journey for complex engagements.

Premium evidence: named delivery team; genuine case studies with baseline/date/scope; service boundaries and escalation ownership; migration and onboarding process; support tiers and realistic SLAs; reporting examples; architecture/security documentation; procurement-ready proposals and billing. Do not invent team size, partnerships, certifications or global footprint. Kenya can be a credible operating base while the delivery model and evidence address larger regional clients.

Design direction: restrained typography, spacious editorial layout, one disciplined accent system, real product views, specific diagrams and authentic project imagery. Avoid repetitive card grids, stock team identities, decorative dashboards posing as live data and generic claims. Original art direction and accurate content matter more than a component kit.

## Design tools and installation guidance

No third-party skills or component libraries installed during this audit.

BoardUI is a React/Tailwind component/design system plus an agent skill; suitable to pilot for dashboard primitives. Existing storefront uses React19/Tailwind4 with Radix/shadcn-style components. Avoid bulk replacement or automatic global-style migration. Official skill command for Codex, using Bun's runner equivalent:

```powershell
bunx boardui@latest skill --client codex
```

Official docs say this targets the shared agents skill convention and needs a fresh agent session. The default without --client writes a Claude project skill. Component initialization is a separate operation; review changes before adopting. Pro components require a valid license.

UI Skills is a catalogue, not a single visual framework. Recommended first candidate: anthropics/frontend-design, with improve-ui as a separate audit aid. Catalogue installation example, using Bun runner equivalent:

```powershell
bunx skills add https://github.com/anthropics/skills --skill frontend-design
```

Select Codex in installer and inspect skill content before use. `bunx ui-skills get baseline-ui` prints Markdown; it is not by itself proof of a persistent installed skill. Adopt the smallest useful set and maintain a Nisc-specific design brief.

Sources checked 2026-11-03:
- https://www.boardui.com/installation
- https://www.boardui.com/skill
- https://www.ui-skills.com/agents/codex
- https://www.ui-skills.com/cli
- https://www.ui-skills.com/skills/anthropics/frontend-design

## Next implementation sequence and acceptance criteria

1. Correct proof and commercial consistency: verified identities, claim register, catalogue-driven plan details, consistent VAT labels and totals.
2. Repair acquisition foundation: legacy redirects, canonical/index controls, page metadata, crawlability and analytics routing.
3. Implement one flagship service journey (business email) with distinctive design, verified service scope, objections, migration details and conversion measurement.
4. Test checkout using non-production payment/provider fixtures: guest/existing/expired sessions, mobile keyboard, validation, tax/renewal accuracy, cancel/back/resume, duplicate webhook, payment failure/retry and delayed provisioning. No real charge required.
5. Refine customer dashboard around service health, onboarding, renewals and actionable reporting; validate count semantics.
6. Extend the proven design/content system to cloud, marketing and systems pages; add genuine case studies.

Performance acceptance targets, not results: p75 LCP <=2.5s, INP <=200ms, CLS <=0.1; instrument domain search, quote, identity and payment handoff latency separately with p50/p95 and error rate. Measure on representative Kenyan mobile connectivity and desktop. Establish conversion baseline before forecasting improvement.

Change log: 2026-11-03 — added this audit and updated strategy log. No production deployment. Open scope: backend security, mobile QA, full route audit, controlled performance and sandbox transaction tests.
