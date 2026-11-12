# nPanel visual stories

Status: approved implementation reference. Production accounts were reviewed read-only; no records were changed.

## Capture and privacy matrix

| Area | Interface evidence retained | Public treatment |
| --- | --- | --- |
| Dashboard | KPI cards, attention list, service shortcuts | Reconstructed layout only |
| Domains | Search, portfolio, transfer preparation, DNS actions | `northstar.example`, sample statuses and dates |
| Hosting | Overview plus DNS, Mail, Files and WordPress tabs | `northstar.example`, reserved IP `192.0.2.24` |
| Cloud servers | Plan and location filters, provisioning, service detail | Sample plan, Nairobi region and reserved IP `198.51.100.42` |
| Business email | Mailbox setup and service management | Fictional Northstar Studio users only |
| SEO | Audit, issue list, keyword opportunities and reporting | Fictional scores and non-performance claims |
| Email marketing | Audience, campaign builder and report | Fictional campaign and aggregate sample data |
| Billing, support, clients and Zepo | Navigation and component language only | No customer content, IDs, amounts or conversations retained |

Never place raw super-admin or customer captures in tracked/public assets. Names, emails, phones,
addresses, domains, organisations, IPs, DNS, IDs, amounts, credentials, messages, audiences and
analytics in these stories are coherent fictional samples.

## Storyboards

Every desktop composition uses a 16:10 nPanel window. Mobile keeps the same outcome and collapses
secondary detail rather than requiring a swipe. The final frame is the reduced-motion/static state.

1. **Domains** — Search `northstar.example` → availability check → transfer preparation → active
   portfolio row with DNS ready.
2. **Hosting** — Active service overview → DNS tab → Mail/Files/WordPress tools → healthy managed
   service outcome.
3. **Cloud servers** — Choose plan and Nairobi location → provision → running instance with CPU,
   memory and storage meters.
4. **SEO** — Start audit → show technical issues and keyword opportunities → downloadable reporting
   summary. Sample numbers are interface demonstration, not client results.
5. **Business email** — Add mailbox → assign Nisc Mail/Microsoft 365/Google Workspace mix → routing
   verified and mailboxes ready.
6. **Email marketing** — Select audience → prepare campaign → send → aggregate sample report.

## Surface and colour direction

- Midnight anchors browser chrome, active navigation and cloud infrastructure moments.
- Sky blue is the primary action/status colour.
- White and soft sky/slate surfaces carry dense product detail and are used more often on mobile.
- Green and amber communicate status only.
- Violet is reserved for Zepo/AI and is not used in these six stories.

## Interaction acceptance

- One story animates at a time; all essential labels and the final outcome remain readable without motion.
- Play/pause/replay are keyboard accessible and exposed with explicit labels.
- Timelines pause offscreen and while the document is hidden.
- Reduced motion renders the completed frame immediately.
- Captions identify each composition as a real nPanel interface using sample data.

## QA record

Tested on 10 November 2026:

- Platform layout at 1440, 1024, 768, 390 and 320 CSS pixels; no document-level horizontal overflow.
- Domains, shared hosting, VPS, business email, SEO and email-marketing integrations at 320px.
- Platform tabs with mouse and Arrow Left/Right/Home/End keyboard behavior.
- Play, pause and replay labels; reduced motion renders frame four and replaces animation controls with a status.
- Light and dark story surfaces, including the lighter domain/SEO/email-marketing direction and midnight cloud treatment.
- Lazy mounting: only the selected Platform story is present.
- Source scan found no reviewed customer names, emails, domains or account identifiers. Public IP examples use
  documentation ranges `192.0.2.0/24` and `198.51.100.0/24`.
- Scoped lint completed with no errors (one pre-existing artwork-library Fast Refresh warning); the production
  build, SSR build and prerender completed successfully for all 49 routes.

Automated browser checks cannot prove screen-reader pronunciation or performance on low-end physical devices;
those remain suitable release-candidate checks rather than blockers for this visual implementation.
