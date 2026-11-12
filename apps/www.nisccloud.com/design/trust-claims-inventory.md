# Trust claims inventory — www.nisccloud.com

Date: 2026-11-07. Scope: every public marketing route rendered by `src/App.tsx`
(legal pages, cart, checkout and help centre included). Source of truth for
commitments is `src/pages/legal/terms/page.tsx`.

Classification:

- **Verified** — backed by the Terms, a product fact in the codebase, or a
  visible asset on the site.
- **Needs wording** — true in substance but stated too strongly; reworded.
- **Unverified** — no evidence available to the website team; replaced with
  factual wording until the owner provides evidence.
- **Contradictory** — conflicted with the Terms or with another page; aligned
  to the Terms.
- **Outdated** — superseded by current positioning; removed.

Rule applied throughout: an uptime *target* is never presented as an SLA, and
marketing never promises more than the Terms do.

## 1. Uptime

| Claim | Where it appeared | Class | Action taken |
| --- | --- | --- | --- |
| "99.99% uptime target" / "up to 99.99% uptime" | Homepage (`Features`, `OnePlatform`, `Services`, `AtomApproach`, `DashboardPreview`), `/hosting`, `/hosting/wordpress`, `/services` (`ServicesFeatureBlocks`, `LaunchDetail`), `/services/ecommerce`, `/pricing` (plans + FAQ), cart (`CartItem`, `HostingUpsell`), blog stat row | **Contradictory** — Terms §18.1 commit to a **99.9%** monthly target with service credits | All occurrences changed to "99.9% uptime target" / "99.9% monthly uptime target". Nowhere is it called an SLA. |
| "99.9% uptime" on Nisc Mail | `/hosting/email` | **Verified** (matches Terms §18.1) | Kept. |
| 99.98% figure inside the security dashboard illustration | `SecurityDashboardScreen` | Illustrative artwork value, not a claim | Kept. |
| Legacy `showcase-stages.tsx` stage showing "SLA credit · Network 99.99% tracked" | No longer rendered (replaced by approved artwork) | **Outdated** | Component is unreferenced; recommend deleting the file in a follow-up. |

## 2. Support availability

| Claim | Where it appeared | Class | Action taken |
| --- | --- | --- | --- |
| "24/7 support" / "24/7 Expert Support" / "always online" / "response under 5 minutes" | Homepage (`Features`, `OnePlatform`, `ClosingCTA`, `DashboardPreview`), `/services` hero, `/about`, `/help`, `/contact`, `/pricing` FAQ, cart items, every hosting and service page trust stat, domain transfer | **Unverified** — no published support hours, staffing model or response-time measurement | Replaced with factual wording: "support from our team", "support requests can be raised any time through nPanel, email or WhatsApp", stats swapped for product facts (free migration, daily backups, grace period, IMAP compatibility, etc.). |
| "Sales Mon–Fri · Support 24/7" | `/contact` | **Needs wording** | Now "Sales Mon–Fri · Support requests any time". Owner should confirm real sales hours. |
| "24/7" describing AI chat, WAF monitoring and email automation flows | `/services/zeepo-ai`, `/security`, `/services/email-marketing`, `AutomateDetail`, `ServicesFeatureBlocks` | **Verified** — describes software running continuously, with human handoff stated | Kept. |
| "…free SSL, and 24/7 local support." | `/pricing` and `/hosting/shared` plan section subtitle — **served by the backend** (`products.getHostingPlansForPricing` → product `description` edited in nPanel admin) | **Unverified** | Cannot be fixed in website code. Edit the Web Hosting product description in nPanel admin (suggested: "…free SSL, and support from our team."). |
| "Lightning-fast managed WordPress hosting … enterprise security. Launch your WordPress site in minutes." | `/hosting/wordpress` plan section subtitle — backend product `description` (`products.getWordPressPlansForPricing`) | **Needs wording** | Edit in nPanel admin (suggested: "Managed WordPress hosting on NVMe storage with automatic updates, daily backups and a web application firewall."). |

## 3. Customer volume and social proof

| Claim | Where it appeared | Class | Action taken |
| --- | --- | --- | --- |
| "100+ clients / businesses", "Join 100+ businesses", "Trusted by 100+ Clients" | `ClosingCTA`, `ServicePageShell` default CTA, `/about` (`OurStory`, `AboutFeatureBlocks`), `/services` (`MarketDetail`), every hosting and service page trust stat, `/services/seo` why-card | **Unverified** — no client count supplied | Removed everywhere; replaced with product facts or positioning ("one team"). The SEO why-card now uses a neutral visual instead of the "100+" trust visual, and the trust visual's fallback figure was removed. |
| Client logo wall "Trusted by growing businesses" | Homepage hero | **Verified** — logos present as assets | Kept. Owner should confirm permission to display each logo. |
| Case studies under `/work` | `work/_lib/case-studies.ts` | **Needs verification by owner** | Untouched; results figures inside case studies should be confirmed with each client before launch. Cover images are hot-linked Unsplash stock photos and the figures are in USD for a Kenyan business ("$1.2M revenue", "Verdant Co.", "Stackr", "Lumex Solar") — they read as template content. |
| "Meet the people who help you grow" — six named team members incl. "Marcus Reid, Founder & CEO" with portraits from `images.shadcnspace.com` | `/about` (`team-01/team.tsx`) | **Unverified / fabricated** — template placeholder people | Replaced with a role-based "The team behind your account" section (six capability cards, no names or portraits). Add real people only with consented photos and correct titles. |
| Office photo in "We started because businesses like yours deserved better" | `/about` (`OurStory.tsx`) | **Needs wording** — generic Unsplash stock image, not Nisc Cloud's office | Kept (no caption claims it is the office). Recommend replacing with a real photo or self-hosting the asset. |

## 4. Guarantees and refunds

| Claim | Where it appeared | Class | Action taken |
| --- | --- | --- | --- |
| "30-day money-back guarantee" | `/hosting/shared` (FAQ + pricing note), `/hosting/wordpress` FAQ | **Contradictory** — Terms §10.1 grant **7 days** on new shared, WordPress and email hosting | Changed to "7-day money-back guarantee, as set out in our Terms of Service". |
| "30-day money-back guarantee" on security plans and email security | `SecurityPlans`, `SecurityCTA`, `/security/email` | **Contradictory** — Terms §10 do not define refunds for security services | Removed. If a refund promise is wanted for security services, add it to the Terms first. |
| "First progress within 30 days for defined managed services" / "30-day results promise" | Homepage, `/services/seo`, `MarketDetail` | **Needs wording** — SEO FAQ defines it as extra work at no charge if no progress by month 3 | Kept (already framed as a review, not a result guarantee). Owner to confirm the commitment is operationally real. |
| "No ethical SEO agency guarantees specific rankings" | `/services/seo` FAQ | **Verified** | Kept. |
| "guaranteed resources / guaranteed RAM / guaranteed isolated" | `/hosting`, `/pricing`, VPS and VDS plan sections | **Needs wording** | Changed to "reserved". |

## 5. Compliance, certifications and ownership

| Claim | Where it appeared | Class | Action taken |
| --- | --- | --- | --- |
| "PCI-DSS compliant payment processing" as a feature of ecommerce builds | `/services/ecommerce` | **Needs wording** — compliance belongs to the processor, not the build | Now "payments handled by PCI-DSS compliant processors". |
| "With HTTPS … you are PCI-DSS compliant for payment processing" | `/help` | **Needs wording** — HTTPS is one requirement, not compliance | Now "you meet one of the PCI-DSS requirements for payment pages". |
| "Helps meet PCI-DSS expectations for payment pages" | `/hosting/ssl` | **Verified** (hedged) | Kept. |
| "Bank-Grade Security" | Homepage `Features` | **Unverified** marketing superlative | Renamed "Security Built In". |
| Tier 3 / ISO 27001 / SOC 2 / "100% hardware ownership" / SLA credits on servers | Previously on VPS/VDS/Dedicated pages | **Unverified / Outdated** | Removed in the earlier pass of this engagement; dedicated page now states exclusive allocation does not imply hardware ownership. |
| "Authorised Microsoft partner" / "authorised Microsoft 365 and Google Workspace partner" | Previously in `PartnerServicePage`, homepage hybrid email section and `/hosting/hybrid-email` | **Unverified** | Partner-status wording has been removed. Microsoft 365 and Google Workspace remain described as supported third-party products. Restore partner wording only after evidence is approved. |
| "KeNIC-accredited registrar" and "licensed by the Communications Authority of Kenya" | `/hosting/domains` | **Needs verification by owner** | Kept because these are specific, material credentials. Confirm the current legal entity, licence/accreditation category, number, expiry/current status and permitted logo treatment before launch. |
| "Registered Data Controller · ODPC Reg. No. 160-3417-5D07" | Footer | **Needs verification by owner** | Kept. Confirm the registration number and that it is current. |
| Sectigo as certificate authority | `/hosting/ssl` | **Verified** (product fact in pricing configs) | Kept; now used as a trust stat. |
| "Your domain, code and data remain yours" | Homepage `WhyNisc` | **Verified** against Terms ownership clauses | Kept. |

## 6. Speed and delivery claims

| Claim | Where it appeared | Class | Action taken |
| --- | --- | --- | --- |
| "Starter brands delivered in about 7 days" / "~7 days" | `/services`, `/services/brand-identity` | **Needs verification by owner** | Kept (hedged with "about"). |
| "Most transfers complete in 5 to 7 days" | `/hosting/domains` | **Verified** (registry transfer window) | Kept. |
| "often in under 30 minutes" email setup | `/hosting/email` | **Needs verification by owner** | Kept (hedged). |
| AMD EPYC, 10 Gbps, "< 5 minutes" provisioning | Previously on server pages | **Unverified** | Removed in the earlier pass. |
| "30-day delivery + manager training" | Enterprise ecommerce package in `src/lib/service-packages.ts` | **Unverified fixed deadline** | Replaced with "Delivery schedule and manager training confirmed in your proposal." |

## 7. Plan scope, ownership and cancellation

| Claim | Where it appeared | Class | Action taken |
| --- | --- | --- | --- |
| "Upgrade, pause, or cancel when you need to" | Shared service-page pricing shell | **Contradictory / unsupported** — Terms allow cancellation but do not establish universal pause behaviour or immediate cancellation | Replaced with a reference to upgrade or cancellation under the selected plan and Terms. |
| "You own all files forever" | Brand identity package note | **Too broad** — conflicts with proposal scope, payment conditions and third-party licence limits | Aligned to the detailed brand page and Terms: approved deliverables transfer after agreed invoices are paid, subject to the proposal and third-party licences. |
| "No long-term contract. Cancel with 30-day notice" / social-media cancellation wording | Email-marketing pricing note and service-package notes | **Needs business verification** | Kept pending confirmation that current statements of work use the same notice period and do not impose a minimum term. |
| "Dedicated account manager" | `/services/social-media` and services hub growth content | **Needs business verification** | Kept. Confirm which plans include a named/consistent account lead and the practical coverage when that person is unavailable. |
| Unqualified auto-scaling, CDN, DDoS, daily-backup and security inclusion | Homepage service summaries and services hub | **Unsupported as universal inclusions** | Qualified as plan-defined or available options. Live product specifications remain the purchase source of truth. |

## 8. Public service status

| Check | Evidence | Decision |
| --- | --- | --- |
| Maintained first-party status page | No status-page link or route is present in the public website source. On 2026-11-10, `status.nisccloud.com` returned an error, `nisccloud.com/status` resolved to the generic coming-soon page, and `npanel.nisccloud.com/status` returned no public status content. Search results for “NISC Cloud” pointed to an unrelated US utility provider at `status.cloud.coop`. | **Not verified.** Do not add a status-page link. Confirm the first-party URL and incident-maintenance process before exposing one in navigation or the footer. |

## Items requiring owner authorisation before launch

1. Provide approved evidence before restoring any Microsoft or Google partner-status wording.
2. Confirm the ODPC registration number in the footer.
3. Confirm permission for each client logo on the homepage and the figures in `/work` case studies.
4. Decide whether a refund policy for security services should exist; if so, add it to the Terms and only then to marketing.
5. Confirm real sales hours for `/contact`.
6. Confirm the 7-day brand delivery and 30-minute email setup statements reflect current operations.
7. Edit the Web Hosting and WordPress Hosting product descriptions in nPanel admin (they are rendered verbatim on `/pricing`, `/hosting/shared` and `/hosting/wordpress`) to remove "24/7 local support", "Lightning-fast", "enterprise security" and "in minutes".
8. Supply real team members (names, titles, consented photos) for `/about`, or keep the role-based section.
9. Replace or remove the `/work` case studies unless each client, figure and image is real and approved.
10. Provide a maintained first-party service-status URL before adding a public status link.
11. Confirm KeNIC accreditation and Communications Authority licensing evidence and approved logo use.
12. Confirm cancellation notice and minimum-term rules for email marketing and social media retainers.
13. Confirm which managed-service plans include a dedicated account manager.
