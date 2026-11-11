# Nisc Cloud illustration library

Reusable exports of the website artwork for social media, proposals, decks, brochures, advertising and documentation. Every composition uses fictional organisations (Savanna Bakery, Savanna Industries, Acacia Traders, Jambo Clinic, Kilima Tours, Baobab Media) and contains no real customer data.

## Brand rules baked into the artwork

- Primary: Nisc Cloud sky blue `#38b6ff` (`--primary`).
- Secondary accent: orange `#fc734d` (`--color-brand-orange`), used only for emphasis, selection and small highlights.
- Typography: DM Sans Variable (UI) and Space Mono (technical labels), both self-hosted via Fontsource (OFL).
- Status colours (green / amber / red) are reserved for real status meaning.

## How to regenerate

```bash
bun run dev                                    # Vite on http://localhost:5174
bun design/illustration-library/export-artworks.ts
bun design/illustration-library/build-readme.ts
```

`export-artworks.ts` renders the development-only route `/__artwork-library` (registered in `src/App.tsx` only when `import.meta.env.DEV` is true) and captures each component at 2× with its intended stage background. The React source stays editable in `src/components/artwork/`.

## Formats

- `*.webp` — optimised 2× raster for web, decks and social.
- `*@2x.png` — lossless 2× raster for print layouts and design tools.
- `*-mobile.*` — separately composed mobile variant where the layout differs substantially.
- `*.svg` — true vector artwork, hand-authored for the flagship concepts. These are editable in Figma/Illustrator and contain no embedded rasters. React/CSS compositions that depend on layered DOM effects (backdrop blur, box-shadows, variable fonts) are **not** faithfully exportable as standalone SVG and are supplied as PNG/WebP only.

## Inventory

Exported 45 compositions on 2026-11-07.

### homepage/

| Artwork | Source component | Type | Exports | Dimensions |
| --- | --- | --- | --- | --- |
| **Hero 1 · Nisc Cloud ecosystem** | `flagship-art.tsx › EcosystemStory` | Editorial / creative composition | `hero-connected-ecosystem.webp`<br>`hero-connected-ecosystem@2x.png`<br>`hero-connected-ecosystem-mobile.webp`<br>`hero-connected-ecosystem-mobile@2x.png`<br>`hero-connected-ecosystem.svg` | 1504×904<br>mobile 815×1130 |
| **Hero 2 · Cloud & infrastructure** | `flagship-art.tsx › CloudInfrastructureStory` | Conceptual product composition | `hero-cloud-infrastructure.webp`<br>`hero-cloud-infrastructure@2x.png`<br>`hero-cloud-infrastructure-mobile.webp`<br>`hero-cloud-infrastructure-mobile@2x.png` | 1504×904<br>mobile 815×1130 |
| **Hero 3 · Agencies & developers** | `flagship-art.tsx › AgencyDeveloperStory` | Authentic nPanel UI (sanitised, fictional data) | `hero-agencies-developers.webp`<br>`hero-agencies-developers@2x.png`<br>`hero-agencies-developers-mobile.webp`<br>`hero-agencies-developers-mobile@2x.png` | 1504×904<br>mobile 815×1130 |
| **Goal · Run my business online** | `npanel-art.tsx › RunOnlineArt` | Authentic nPanel UI (sanitised, fictional data) | `goal-run-online.webp`<br>`goal-run-online@2x.png` | 1264×671 |
| **Goal · Build my brand or website** | `flagship-art.tsx › BrandWebFlagshipArt` | Editorial / creative composition | `goal-brand-web.webp`<br>`goal-brand-web@2x.png`<br>`goal-brand-web-mobile.webp`<br>`goal-brand-web-mobile@2x.png` | 1264×900<br>mobile 815×990 |

### cloud/

| Artwork | Source component | Type | Exports | Dimensions |
| --- | --- | --- | --- | --- |
| **Web hosting stack** | `flagship-art.tsx › HostingFlagshipArt` | Conceptual product composition | `cloud-hosting-stack.webp`<br>`cloud-hosting-stack@2x.png`<br>`cloud-hosting-stack-mobile.webp`<br>`cloud-hosting-stack-mobile@2x.png` | 1264×794<br>mobile 815×1626 |
| **Hosting support** | `cloud-art.tsx › HostingSupportArt` | Conceptual product composition | `cloud-hosting-support.webp`<br>`cloud-hosting-support@2x.png` | 1264×891 |
| **Domain search** | `cloud-art.tsx › DomainSearchArt` | Authentic nPanel UI (sanitised, fictional data) | `cloud-domain-search.webp`<br>`cloud-domain-search@2x.png` | 1264×992 |
| **DNS records** | `cloud-art.tsx › HostingDnsArt` | Authentic nPanel UI (sanitised, fictional data) | `cloud-hosting-dns.webp`<br>`cloud-hosting-dns@2x.png` | 1264×923 |
| **WordPress hosting** | `cloud-art.tsx › WordPressArt` | Authentic nPanel UI (sanitised, fictional data) | `cloud-wordpress.webp`<br>`cloud-wordpress@2x.png` | 1264×912 |
| **Business email mailboxes** | `cloud-art.tsx › MailboxesArt` | Authentic nPanel UI (sanitised, fictional data) | `cloud-mailboxes.webp`<br>`cloud-mailboxes@2x.png` | 1264×1007 |
| **VPS server** | `cloud-art.tsx › ServerArt kind=vps` | Conceptual product composition | `cloud-server-vps.webp`<br>`cloud-server-vps@2x.png` | 1264×865 |
| **VDS server** | `cloud-art.tsx › ServerArt kind=vds` | Conceptual product composition | `cloud-server-vds.webp`<br>`cloud-server-vds@2x.png` | 1264×865 |
| **Dedicated server** | `cloud-art.tsx › ServerArt kind=dedicated` | Conceptual product composition | `cloud-server-dedicated.webp`<br>`cloud-server-dedicated@2x.png` | 1264×1297 |
| **SSL certificate** | `cloud-art.tsx › SslArt` | Authentic nPanel UI (sanitised, fictional data) | `cloud-ssl.webp`<br>`cloud-ssl@2x.png` | 1264×865 |
| **Website migration** | `cloud-art.tsx › MigrationArt` | Conceptual product composition | `cloud-migration.webp`<br>`cloud-migration@2x.png` | 1264×1023 |
| **Hosting file manager** | `more-art.tsx › HostingFilesArt` | Authentic nPanel UI (sanitised, fictional data) | `cloud-hosting-files.webp`<br>`cloud-hosting-files@2x.png` | 1264×908 |
| **Mail DNS authentication** | `more-art.tsx › MailDnsArt` | Authentic nPanel UI (sanitised, fictional data) | `cloud-mail-dns.webp`<br>`cloud-mail-dns@2x.png` | 1264×833 |
| **Webmail** | `more-art.tsx › WebmailArt` | Authentic nPanel UI (sanitised, fictional data) | `cloud-webmail.webp`<br>`cloud-webmail@2x.png` | 1264×654 |
| **Server backups** | `more-art.tsx › ServerBackupsArt` | Authentic nPanel UI (sanitised, fictional data) | `cloud-server-backups.webp`<br>`cloud-server-backups@2x.png` | 1264×833 |
| **Domain transfer** | `more-art.tsx › DomainTransferArt` | Authentic nPanel UI (sanitised, fictional data) | `cloud-domain-transfer.webp`<br>`cloud-domain-transfer@2x.png` | 1264×849 |
| **Nameservers** | `more-art.tsx › NameserversArt` | Authentic nPanel UI (sanitised, fictional data) | `cloud-nameservers.webp`<br>`cloud-nameservers@2x.png` | 1264×910 |
| **Licence quotation** | `more-art.tsx › QuotationArt` | Authentic nPanel UI (sanitised, fictional data) | `cloud-licence-quotation.webp`<br>`cloud-licence-quotation@2x.png` | 1264×917 |
| **cloud-infrastructure-topology** (vector concept) | hand-authored SVG | True vector | `cloud-infrastructure-topology.svg` | 1200×720 viewBox, 4 KB |

### npanel/

| Artwork | Source component | Type | Exports | Dimensions |
| --- | --- | --- | --- | --- |
| **nPanel for agencies** | `flagship-art.tsx › AgencyFlagshipArt` | Authentic nPanel UI (sanitised, fictional data) | `npanel-agency-client-management.webp`<br>`npanel-agency-client-management@2x.png`<br>`npanel-agency-client-management-mobile.webp`<br>`npanel-agency-client-management-mobile@2x.png`<br>`npanel-agency-client-management.svg` | 1264×967<br>mobile 815×1663 |
| **nPanel for businesses** | `npanel-art.tsx › NpanelBusinessArt` | Authentic nPanel UI (sanitised, fictional data) | `npanel-business-workspace.webp`<br>`npanel-business-workspace@2x.png` | 1264×930 |
| **nPanel for developers** | `npanel-art.tsx › NpanelDeveloperArt` | Authentic nPanel UI (sanitised, fictional data) | `npanel-developer-terminal.webp`<br>`npanel-developer-terminal@2x.png` | 1264×998 |
| **nPanel operations** | `npanel-art.tsx › NpanelOperationsArt` | Authentic nPanel UI (sanitised, fictional data) | `npanel-operations.webp`<br>`npanel-operations@2x.png` | 1264×946 |

### growth/

| Artwork | Source component | Type | Exports | Dimensions |
| --- | --- | --- | --- | --- |
| **SEO search performance** | `flagship-art.tsx › SeoFlagshipArt` | Conceptual product composition | `growth-seo-search-performance.webp`<br>`growth-seo-search-performance@2x.png`<br>`growth-seo-search-performance-mobile.webp`<br>`growth-seo-search-performance-mobile@2x.png` | 1264×692<br>mobile 815×1453 |
| **SEO analytics review** | `more-art.tsx › SeoAnalyticsArt` | Conceptual product composition | `growth-seo-analytics.webp`<br>`growth-seo-analytics@2x.png` | 1264×1034 |
| **Email campaign report** | `growth-art.tsx › EmailCampaignArt` | Authentic nPanel UI (sanitised, fictional data) | `growth-email-campaign.webp`<br>`growth-email-campaign@2x.png` | 1264×901 |
| **Paid advertising** | `growth-art.tsx › AdsArt` | Conceptual product composition | `growth-paid-ads.webp`<br>`growth-paid-ads@2x.png` | 1264×810 |
| **Social advertising** | `growth-art.tsx › AdsArt social` | Conceptual product composition | `growth-social-ads.webp`<br>`growth-social-ads@2x.png` | 1264×810 |
| **Social content calendar** | `more-art.tsx › SocialCalendarArt` | Conceptual product composition | `growth-social-calendar.webp`<br>`growth-social-calendar@2x.png` | 1264×575 |
| **Content plan** | `more-art.tsx › ContentPlanArt` | Conceptual product composition | `growth-content-plan.webp`<br>`growth-content-plan@2x.png` | 1264×499 |
| **Ecommerce storefront** | `growth-art.tsx › CommerceArt` | Editorial / creative composition | `growth-ecommerce-store.webp`<br>`growth-ecommerce-store@2x.png` | 1264×689 |
| **Store orders** | `more-art.tsx › StoreOrdersArt` | Conceptual product composition | `growth-store-orders.webp`<br>`growth-store-orders@2x.png` | 1264×644 |
| **Checkout experience** | `more-art.tsx › CheckoutArt` | Conceptual product composition | `growth-checkout.webp`<br>`growth-checkout@2x.png` | 1264×607 |
| **Brand identity kit** | `growth-art.tsx › BrandKitArt` | Editorial / creative composition | `growth-brand-kit.webp`<br>`growth-brand-kit@2x.png` | 1264×723 |
| **Creative assets** | `growth-art.tsx › CreativeAssetsArt` | Editorial / creative composition | `growth-creative-assets.webp`<br>`growth-creative-assets@2x.png` | 1264×949 |
| **Creative brief** | `more-art.tsx › CreativeBriefArt` | Conceptual product composition | `growth-creative-brief.webp`<br>`growth-creative-brief@2x.png` | 1264×917 |
| **Team workspace** | `growth-art.tsx › TeamWorkspaceArt` | Conceptual product composition | `growth-team-workspace.webp`<br>`growth-team-workspace@2x.png` | 1264×736 |
| **seo-search-performance** (vector concept) | hand-authored SVG | True vector | `seo-search-performance.svg` | 1200×720 viewBox, 5 KB |

### ai/

| Artwork | Source component | Type | Exports | Dimensions |
| --- | --- | --- | --- | --- |
| **Zeepo AI assistant** | `growth-art.tsx › ZeepoArt` | Authentic nPanel UI (sanitised, fictional data) | `ai-zeepo-assistant.webp`<br>`ai-zeepo-assistant@2x.png` | 1264×901 |
| **Zeepo AI activity** | `more-art.tsx › ZeepoActivityArt` | Authentic nPanel UI (sanitised, fictional data) | `ai-zeepo-activity.webp`<br>`ai-zeepo-activity@2x.png` | 1264×901 |
| **AI Email Builder** | `growth-art.tsx › AiEmailBuilderArt` | Authentic nPanel UI (sanitised, fictional data) | `ai-email-builder.webp`<br>`ai-email-builder@2x.png` | 1264×876 |

### security/

| Artwork | Source component | Type | Exports | Dimensions |
| --- | --- | --- | --- | --- |
| **Email security gate** | `security/_components/EmailSecurityArtwork.tsx › EmailGateArtwork` | Conceptual product composition | `security-email-gate.webp`<br>`security-email-gate@2x.png` | 1288×592 |

## Contact sheet

`contact-sheet.webp` / `contact-sheet.png` show the full collection as rendered on the export route.

## Archive

`archive/` holds superseded compositions kept for reference. Nothing in `archive/` should be used in new marketing.
