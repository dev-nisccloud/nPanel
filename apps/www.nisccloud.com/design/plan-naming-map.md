# Plan naming map

## Owner decisions (7 Nov 2026, late evening)

| Product | Cards on the website | Hidden from the website (kept in nPanel, existing subscriptions unaffected) |
| --- | --- | --- |
| Web hosting | **Launch** (Starter), **Grow** (Basic, Recommended), **Accelerate** (Deluxe), **Corporate** (custom pricing, enquiry) | Ultimate |
| Nisc Mail | **Essentials** (Basic), **Business** (Standard, Recommended), **Scale** (current Corporate, KES 12,000/yr), **Corporate** (custom pricing, enquiry) | Free Email Hosting (shown as a free starter mailbox with a domain instead) |
| SEO / AEO / GEO | **Search Foundations** (Starter), **Search Growth** (Growth, Recommended), **Search Authority** (Pro), **Corporate Search** (custom pricing, proposal) | — |
| WordPress | **Launch** (Starter), **Business** (Business, Recommended), **Performance** (Pro); no custom card | — |
| Agency hosting | Unchanged: proposal-based, no catalogue product | — |
| Email marketing | Unchanged | — |

The web hosting names were chosen by the agent at the owner's request ("be creative"); they can be changed in one place.

## Original proposal

Source: live nPanel catalogue, read on 7 Nov 2026 (`products.get*PlansForPricing`, read-only). Prices are the catalogue's own; nothing here changes a price, a plan id, a product id or a checkout route. Only the public display name changes. Existing subscriptions keep their plan ids and entitlements.

Storage on shared hosting is shown as NVMe SSD (owner decision). "Unlimited" values carry the fair-use footnote.

## Web hosting (`nisc-web-hosting`)

Proposed ladder: Launch, Business, Performance, Corporate (custom). The catalogue has **four** paid plans, so one does not fit.

| Current name | Plan id | Price | Storage | RAM | CPU | Bandwidth | Databases | Mailboxes | FTP | Sub-domains | Catalogue flag | Proposed name |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Starter | `nisc-web-hosting-plan-starter` | KES 149/mo | 10 GB | 1 GB | 1 core | 100 GB | 5 | 10 | 4 | 5 | — | Launch |
| Basic | `nisc-web-hosting-plan-basic` | KES 3,899/yr (≈325/mo) | 40 GB | 4 GB | 2 cores | 500 GB | Unlimited | 20 | 3 | 5 | Recommended | Business |
| Deluxe | `nisc-web-hosting-plan-deluxe` | KES 833.40/mo | 80 GB | 8 GB | 4 cores | 800 GB | Unlimited | 50 | 10 | 10 | Popular | Performance |
| Ultimate | `nisc-web-hosting-plan-ultimate` | KES 1,199/mo | 200 GB | 12 GB | 8 cores | Unlimited | Unlimited | 100 | Unlimited | 20 | — | **Does not fit** (see options) |
| — | — | Custom pricing | — | — | — | — | — | — | — | — | — | Corporate (enquiry) |

All four include the WordPress Toolkit, WordPress acceleration, free SSL, DNS management, PHP 5.6–8.1 and the developer stack.

Is Business a fair recommendation? Yes. Against Launch it has 4× storage, 4× RAM, 2× CPU, 5× bandwidth and unlimited databases for about twice the monthly-equivalent price. Two caveats: it is priced yearly only in the catalogue, and it has fewer FTP accounts (3) than Launch (4) (B-10).

## Nisc Mail (`nisc-email-hosting`)

Proposed: Essentials, Business, Corporate (custom). The catalogue has **three** paid plans plus Free.

| Current name | Plan id | Price | Storage | Mailboxes | Catalogue flag | Proposed name |
| --- | --- | --- | --- | --- | --- | --- |
| Free Email Hosting | `dd59f6e8-3892-43e6-a090-8d330400f6aa` | none | "1" (no unit) | 1 | — | Not a card; shown as a free starter mailbox with a domain (owner decision) |
| Basic | `nisc-email-hosting-plan-basic` | KES 320/mo | 10 GB | 10 | — | Essentials |
| Standard | `nisc-email-hosting-plan-standard` | KES 500/mo | 30 GB | 20 | Recommended | Business |
| Corporate | `nisc-email-hosting-plan-corporate` | KES 12,000/yr (=1,000/mo) | 100 GB | 100 | Popular | **Does not fit**: a priced plan with the same name as the custom tier |

Every paid plan has the same feature set (daily incremental backups, IMAP/POP and secure SMTP, anti-phishing, anti-virus, anti-spam, webmail, desktop clients, free migration, 99.9% uptime target). The real differences are storage and mailbox count, which is enough for two tiers.

## SEO, AEO and GEO (`nisc-seo-reports`)

Proposed: Search Foundations, Search Growth, Corporate Search. The catalogue has **three** priced monthly packages.

| Current name | Plan id | Price | Websites | Keywords | Technical SEO | Content | Link building | Reporting | Proposed name |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Starter | `nisc-seo-reports-plan-starter` | KES 9,999/mo | 1 | 25 | Quarterly audit | 5 pages/mo | — | Monthly | Search Foundations |
| Growth | `nisc-seo-reports-plan-growth` | KES 24,999/mo | 3 | 75 | Monthly audit | 15 pages/mo | Basic outreach | Bi-weekly | Search Growth (Recommended) |
| Pro | `nisc-seo-reports-plan-pro` | KES 59,999/mo | 10 | 200 | Priority fixes | 40 pages/mo | Advanced outreach | Weekly | **Does not fit cleanly**: Corporate Search is meant to be custom-priced, but this is a published price |

## WordPress hosting (`nisc_wordpress_hosting`)

The differences are meaningful at each step, so three paid tiers plus Corporate is justified.

| Current name | Plan id | Price | Sites | NVMe | RAM | CPU | Bandwidth | Mailboxes | Adds | Flag | Proposed name |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Starter | `nisc_wordpress_hosting_plan_starter` | KES 299/mo | 1 | 20 GB | 2 GB | 2 cores | 200 GB | 10 | Updates, malware scanning, LiteSpeed cache, CDN, WP-CLI, SSH | — | Launch |
| Business | `nisc_wordpress_hosting_plan_business` | KES 599/mo | 3 | 50 GB | 4 GB | 4 cores | 500 GB | 25 | + daily backups, staging, object cache, WooCommerce ready, DDoS protection | Recommended | Business |
| Pro | `nisc_wordpress_hosting_plan_pro` | KES 1,199/mo | Unlimited | 100 GB | 8 GB | 8 cores | Unlimited | 100 | + Git integration | Popular | Performance |
| — | — | Custom pricing | | | | | | | | | Corporate (enquiry) |

## Agency hosting (`/hosting/agency`)

There is **no agency product in the catalogue**. The page shows three proposal options with no prices, each opening the enquiry form. No paid tiers can be created without inventing plans, so it stays proposal-based.

## Email marketing (`nisc-email-marketing`), not in the brief

Starter KES 1,999, Growth KES 4,999 (Recommended), Pro KES 9,999. The names are already outcome-neutral; left unchanged unless the owner wants a rename.
