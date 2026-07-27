# Agency SEO Suite — Product & Feature Spec (DataForSEO-backed)

**Status:** Design / planning only (no implementation in this doc)  
**Date:** 2026-07-27  
**Primary data vendor:** [DataForSEO](https://dataforseo.com/)  
**Scope:** Agency panel SEO product surface; customer team mirror follows the same model later  

---

## 1. Purpose

Today the agency SEO experience is an **analytics viewer** over Google Search Console and organic GA4. That stays. This document defines a second product surface — a full **SEO Suite** powered primarily by DataForSEO — so nPanel can move from “view what Google already measured” to “research, audit, track, compete, and optimize with actionable SEO data.”

**Non-goals for this doc**

- No UI code, API code, or schema migrations
- No change to existing GSC/GA4 report logic
- No replacing Google Analytics / Search Console — Analytics tab keeps them

**Goals**

- Leave no knowledge gap between what DataForSEO offers and how nPanel should productize it
- Define navigation, module flows, data contracts, agency differentiators, billing/cost controls, and phased delivery
- Keep Analytics frozen; put all new capability under a dedicated **SEO** tab/area

---

## 2. Current state (as-is)

### 2.1 Where it lives

| Surface | Path | Notes |
|---------|------|--------|
| Agency | `/agency/seo-reports` | Primary ops surface |
| Agency site detail | `/agency/seo-reports/:siteId` | Secondary/legacy-style detail |
| Customer / team | `/$slug/seo-reports` | Same UX, subscription-gated |
| Nav | Digital Marketing → SEO → SEO Reports | Sidebar |

Key files:

- `apps/web/src/routes/agency.seo-reports._index.tsx`
- `apps/web/src/routes/agency.seo-reports/_components/seo-search-console-view.tsx`
- `apps/web/src/routes/agency.seo-reports/_components/seo-ga4-view.tsx`
- `packages/api/src/routers/seo-reports/`
- `packages/api/src/lib/google-search-console-client.ts`
- `packages/api/src/lib/google-analytics-client.ts`

### 2.2 Current UX

Top-level page: **SEO Reports**

Two inner tabs (unchanged in behavior today):

1. **Search Console** — property picker, date range, refresh, create SEO subscription  
2. **Google Analytics 4** — property picker, date range, organic-channel metrics only  

### 2.3 What Analytics already delivers (must remain)

**Search Console**

- Total clicks, impressions, average CTR, average position (+ vs previous period)
- Daily clicks/impressions trend
- Device mix (desktop / mobile / tablet)
- Top queries (clicks, impressions, CTR, position)
- Top landing pages
- Opportunity heuristics: page-2 keywords (pos 11–20), low-CTR high-impression targets
- Trending up/down pages
- Top countries
- Search appearance types
- Sitemap health (status, errors/warnings, submitted/indexed)

**GA4 (Organic Search only)**

- Sessions, users, engagement rate, conversions, bounce rate, avg session duration
- Daily sessions/users trend
- Device mix, countries
- Highly engaged pages / bounce alerts / top performance pages

**Ops**

- Create SEO subscription (link GSC site or GA4 property → team + plan)

### 2.4 Data sources today

| Source | Auth | Role |
|--------|------|------|
| Google Search Console API | Service account | Live performance samples |
| GA4 Data + Admin APIs | Service account | Organic channel behavior |
| DB `seo_report` tables | Internal | Legacy monthly report CRUD (API exists; UI unused) |

**Critical distinction:** current product is **first-party Google analytics**. It does not crawl sites, estimate competitor traffic, score backlinks, track ranks over time independently of GSC, or measure AI/LLM visibility.

### 2.5 Marketing / docs drift

Fumadocs / product marketing sometimes imply audits, backlinks, crawl, competitor tools. Those are **not implemented**. This suite is the plan to make those real using DataForSEO.

---

## 3. Target information architecture

### 3.1 Navigation rename / split

Keep the existing route family for Google analytics, but reframe the product as two peer areas under agency SEO.

**Proposed agency IA**

```
Digital Marketing
 └── SEO
      ├── Analytics          ← today’s SEO Reports (GSC + GA4), unchanged
      └── SEO Suite          ← new DataForSEO-powered workspace
```

**Page-level tabs (recommended for the SEO Suite shell)**

When a client **Project / Site** is selected in SEO Suite:

| Tab / Nav item | Purpose |
|----------------|---------|
| Overview | Project health snapshot (SEO + optional Analytics deep-links) |
| Keyword Research | Ideas, demand, difficulty, intent, live SERPs |
| Domain Overview | Organic/paid visibility estimate for any domain |
| Competitors | Gap, intersection, SERP rivals |
| Backlinks | Link profile, referring domains, link quality, link gap |
| Rank Tracking | Scheduled position tracking over time |
| Site Audit | Crawl + technical / on-page issues |
| Content & Mentions | Web brand/content mentions + sentiment (Content Analysis) |
| Local & Reviews | GBP / reviews / local pack context (Business Data + Reviews) |
| AI Visibility | LLM mentions, citations, AI search volume |
| Prompt Explorer | Same prompt across ChatGPT / Claude / Gemini / Perplexity / scrapers |
| SERP Lab | Live SERP inspector (features, AI Overview, People Also Ask) |
| Tech & WHOIS | Domain technologies + registration intel |
| Saved Keywords | Lists, folders, tags → feed Rank Tracking & content |
| Reports & Alerts | Scheduled digests, white-label PDFs, threshold alerts |

**Analytics tab (existing)**

- Remains exactly as today: Search Console + GA4 sub-tabs
- Optional later: “Open in SEO Suite” deep links from a GSC query → Keyword Overview / Rank Tracking add

### 3.2 Project model (required)

Everything in SEO Suite hangs off a **Project**:

| Field | Meaning |
|-------|---------|
| `name` | Client-facing label |
| `primaryDomain` | e.g. `client.co.ke` |
| `defaultLocation` | DataForSEO `location_code` / name (e.g. Kenya, Nairobi) |
| `defaultLanguage` | e.g. `en` |
| `competitors[]` | Up to N competitor domains |
| `linkedGscSiteId` | Optional bridge to Analytics |
| `linkedGa4PropertyId` | Optional bridge to Analytics |
| `teamId` / `clientId` | Billing & access scope |
| `brandEntities[]` | Brand names, product names for AI Visibility / mentions |

Agency users manage many projects. Customer users see only projects on their subscription.

### 3.3 Cross-link: Analytics ↔ SEO Suite

| From | To | Action |
|------|----|--------|
| GSC top query | Keyword Research → Keyword Overview | Pre-fill keyword |
| GSC page-2 opportunity | Saved Keywords / Rank Tracking | One-click track |
| Low CTR target | SERP Lab | Inspect live SERP features causing CTR loss |
| GA4 landing page | Instant Page Audit | On-page + CWV check |
| Domain Overview keyword | Content brief / Prompt Explorer | Create AI + SEO brief |

Analytics stays measurement of **owned** traffic. SEO Suite adds **market**, **competitive**, **technical**, and **generative** intelligence.

---

## 4. DataForSEO — full capability inventory

DataForSEO is a pay-as-you-go SEO/SEM/AI data API stack ([homepage](https://dataforseo.com/), [APIs](https://dataforseo.com/apis), [SEO solutions](https://dataforseo.com/solutions/seo), [pricing](https://dataforseo.com/pricing-list)). One account unlocks all APIs; you pay per call/row. Live endpoints typically return in ~2s where applicable; task/queue modes exist for heavier jobs.

Approximate index scale (vendor-published, changes over time): hundreds of millions of Google SERPs, billions of keywords, trillions of live backlinks, hundreds of millions of LLM prompts for AI Optimization.

### 4.1 API families and what they unlock for nPanel

| DataForSEO API | What it is | nPanel module(s) |
|----------------|------------|------------------|
| **SERP API** | Live Google / Bing / Yahoo / Baidu / YouTube SERPs + SERP features (incl. AI Overviews) | Rank Tracking, SERP Lab, live SERP in Keyword Research |
| **Keywords Data API** | Google Ads, Bing Ads, Google Trends volumes/CPC/trends | Keyword Research demand metrics, Trends |
| **DataForSEO Labs API** | Keyword ideas/intent/difficulty, ranked keywords, domain/competitor intel, historical SERPs/ranks | Keyword Research, Domain Overview, Competitors, historical charts |
| **Backlinks API** | Backlinks, anchors, referring domains/networks, history, domain/page intersection | Backlinks, Link Gap |
| **On-Page API** | Site crawl, page checks, resources, links, redirects, non-indexable, Lighthouse, Instant Pages, screenshots, CWV | Site Audit, Instant Page Audit |
| **AI Optimization API** | LLM Mentions, AI Keyword Data, LLM Responses, LLM Scraper | AI Visibility, Prompt Explorer |
| **Domain Analytics API** | Tech stack detection, WHOIS | Tech & WHOIS, Domain Overview enrichment |
| **Content Analysis API** | Web citations, brand mentions, sentiment, trends, rating distribution | Content & Mentions |
| **Business Data API** | Google My Business / Hotels / listings-style business data | Local SEO |
| **Reviews API** | Google, Trustpilot, Tripadvisor, Play/App Store, Amazon reviews | Local & Reviews / Reputation |
| **Merchant API** | Amazon / Google Shopping | Optional e-commerce add-on (later) |
| **App Data API** | Play Store / App Store ASO | Optional mobile add-on (later) |

### 4.2 Labs Google endpoints (core SEO brain)

From [Labs Google overview](https://docs.dataforseo.com/v3/dataforseo_labs-google-overview/):

**Keyword research**

- Keywords For Site  
- Related Keywords  
- Keyword Suggestions  
- Keyword Ideas  
- Bulk Keyword Difficulty  
- Search Intent (bulk)  
- Keyword Overview  
- Historical Keyword Data (from ~2019)

**Market / category**

- Categories For Domain  
- Keywords For Categories  
- Domain Metrics By Categories  
- Top Searches  

**Competitor / domain**

- Ranked Keywords  
- SERP Competitors  
- Competitors Domain  
- Domain Intersection  
- Page Intersection  
- Subdomains  
- Relevant Pages  
- Domain Rank Overview  
- Historical SERPs  
- Historical Rank Overview  
- Bulk Traffic Estimation  

### 4.3 Backlinks endpoints

- Backlinks (list)  
- Backlink Summary  
- Backlink History (≈2019+)  
- Backlink Anchors  
- Referring Domains  
- Domain Pages  
- Referring Networks  
- Domain Intersection (link gap)  
- Page Intersection  

### 4.4 On-Page endpoints

**Crawl task mode**

- Task POST → crawl  
- Summary  
- Pages  
- Pages by Resource  
- Resources  
- Links  
- Redirect Chains  
- Non-indexable  
- Duplicate Tags / Duplicate Content  
- Keyword Density  
- Raw HTML  
- Lighthouse  

**Live mode**

- Instant Pages (single URL audit; optional browser rendering → CWV)  
- Page Screenshot  

### 4.5 AI Optimization endpoints

From [AI Optimization overview](https://docs.dataforseo.com/v3/ai_optimization-overview/) and [product page](https://dataforseo.com/apis/ai-optimization-api):

| Sub-API | Role | Platforms (as published) |
|---------|------|---------------------------|
| **LLM Mentions** | Mentions, citations, AI search volume, historical / timeseries / lite metrics | Google AI Overview, ChatGPT (location/language limits apply; ChatGPT often US+EN) |
| **AI Keyword Data** | AI search volume + intent-style insights for prompts/keywords | LLM demand signals |
| **LLM Responses** | Submit prompts; structured answers via official model APIs | ChatGPT, Claude, Gemini, Perplexity |
| **LLM Scraper** | Scrape what users see in AI UIs (cheaper monitoring path) | ChatGPT, Gemini (and related) |

### 4.6 SERP engines / verticals

- Google Organic (+ advanced features, AI Overview)  
- Google verticals (as available in SERP API feature set)  
- Bing / Yahoo / Baidu  
- YouTube organic + video info / subtitles / comments  

### 4.7 Commercial model implications (must design for)

- Pay-as-you-go; no need to invent scrapers/proxies  
- Costs vary wildly: Labs rows are cheap; live SERP and LLM Responses are expensive  
- As of 2026-07 pricing updates, monthly commitments for some APIs were removed in favor of pure PAYG ([pricing update](https://dataforseo.com/update/pricing-update-in-dataforseo-apis))  
- nPanel **must** meter usage per project/team, cache aggressively, and prefer Labs/database endpoints over live SERP/LLM when “good enough”

---

## 5. Product principles (how we stand out)

Most agency panels either:

1. Show GSC/GA4 only, or  
2. Resell a white-label SEO tool with little workflow glue  

nPanel differentiator = **agency operating system + first-party Analytics + DataForSEO SEO Suite + client delivery**:

1. **One client Project** spanning Analytics + SEO + (later) hosting/tickets  
2. **Workflow chains**, not isolated tools (Research → Save → Track → Audit → Content → AI Visibility → Report)  
3. **Kenya / regional defaults** (location packs, bilingual content intent, local pack emphasis)  
4. **Cost-aware defaults** (Labs first, live SERP on demand, LLM Responses behind explicit “Run paid check”)  
5. **Evidence-backed recommendations** that cite the exact SERP feature, backlink, audit issue, or LLM citation  
6. **White-label client reports** that merge Google truth (Analytics) with market truth (DataForSEO)  
7. **GEO + SEO together** — classic ranks and AI answer visibility in one place (rare in agency tooling)

---

## 6. Module specs (SEO Suite)

Each module below includes: purpose, user flow, UI sections, DataForSEO endpoints, persistence, and agency extras.

---

### 6.1 Keyword Research

**Purpose:** Find ideas, demand, difficulty, intent, and optionally live SERPs.

#### User flow

1. Enter seed keyword(s), domain (optional “Keywords for site”), location, language  
2. Choose mode: Ideas / Suggestions / Related / For Site / Trends  
3. Results table with filters (volume, KD, intent, CPC, SERP features)  
4. Click a keyword → **Keyword Overview** drawer  
5. Actions: Save to list, Add to Rank Tracking, Open SERP Lab, Open Prompt Explorer, Compare intents  

#### UI sections

- Seed form + mode tabs  
- Results grid: keyword, volume, KD, intent, CPC, competition, trend sparkline, SERP feature chips  
- Keyword Overview drawer: metrics, monthly history, related, difficulty, who ranks (top domains), People Also Ask via SERP Lab link  
- Optional “Live SERP” button (paid)  

#### DataForSEO mapping

| UI need | Endpoint family |
|---------|-----------------|
| Ideas by category | Labs `keyword_ideas` |
| Suggestions | Labs `keyword_suggestions` |
| Related | Labs `related_keywords` |
| Keywords for domain | Labs `keywords_for_site` |
| Difficulty bulk | Labs `bulk_keyword_difficulty` |
| Intent bulk | Labs `search_intent` |
| Overview card | Labs `keyword_overview` |
| History | Labs `historical_search_volume` / historical keyword data |
| Ads volume/CPC | Keywords Data → Google Ads / Bing Ads |
| Seasonality | Keywords Data → Google Trends |
| Live SERP | SERP Google Organic Live Advanced |

#### Persistence

- Query history per user/project  
- Saved result snapshots (optional) for offline review  
- Always write selected keywords into **Saved Keywords**

#### Agency extras

- “Brief builder”: for selected keywords, generate content outline using SERP Lab features + PAA + competitor titles (from ranked URLs)  
- Cluster keywords by parent topic (client-side clustering on Labs results)  
- Import GSC queries as seeds  

---

### 6.2 Domain Overview

**Purpose:** Estimate organic (and paid) visibility for any domain — yours or a competitor’s — without needing GSC access.

#### User flow

1. Enter domain (defaults to project primary) + location/language  
2. Load summary cards + ranking distribution + top pages + top keywords  
3. Compare up to 3–5 domains (Bulk Traffic Estimation)  
4. Drill into Ranked Keywords, Relevant Pages, Subdomains, Categories  

#### UI sections

- KPI cards: organic keywords, estimated traffic (ETV), paid keywords/cost, top position buckets (1–3, 4–10, 11–20, 21–50, 51+)  
- Historical Rank Overview chart  
- Top pages table  
- Top keywords table  
- Category breakdown (in-market categories)  
- Tech stack strip (Domain Analytics)  
- WHOIS summary strip  

#### DataForSEO mapping

| UI need | Endpoint |
|---------|----------|
| Snapshot | Labs `domain_rank_overview` |
| History | Labs `historical_rank_overview` |
| Keywords | Labs `ranked_keywords` |
| Pages | Labs `relevant_pages` |
| Subdomains | Labs `subdomains` |
| Multi-domain compare | Labs `bulk_traffic_estimation` |
| Categories | Labs `categories_for_domain`, `domain_metrics_by_categories` |
| Tech | Domain Analytics `domain_technologies` |
| WHOIS | Domain Analytics WHOIS endpoints |

#### Agency extras

- “Prospect mode”: paste 20 domains → bulk estimate → sales pipeline view  
- Side-by-side vs project competitors  
- Delta alerts when estimated traffic drops week-over-week (requires stored snapshots)

---

### 6.3 Competitors

**Purpose:** Discover who you compete with in SERPs and where the keyword/link gaps are.

#### User flow

1. Auto-load competitors from Labs `competitors_domain` OR use project competitor list  
2. Pick 1–3 competitors  
3. Run Keyword Gap (Domain Intersection modes: only you / only them / shared)  
4. Run Link Gap (Backlinks Domain Intersection)  
5. Save gap keywords → Saved Keywords / Rank Tracking  

#### UI sections

- Competitor discovery table (overlap score, common keywords, traffic estimate)  
- Keyword Gap matrix  
- Page Intersection for URL-level battles  
- SERP Competitors for a keyword set  
- Link Gap opportunities  

#### DataForSEO mapping

- Labs: `competitors_domain`, `domain_intersection`, `page_intersection`, `serp_competitors`  
- Backlinks: `domain_intersection`, `page_intersection`  

#### Agency extras

- “Steal this page” view: competitor URL → Instant Pages audit + ranked keywords for that URL  
- Gap → content calendar export  

---

### 6.4 Backlinks

**Purpose:** Inspect backlinks, referring domains, anchors, networks, quality/spam, history, and opportunities.

#### User flow

1. Open Backlinks for project domain (or any target)  
2. Summary KPIs → drill into Backlinks / Referring Domains / Anchors / Pages / Networks  
3. Filter: dofollow/nofollow, spam score, TLD, new/lost  
4. Link Gap vs competitors  
5. Broken / lost link recovery list (history + status checks where available)  

#### UI sections

- Summary: backlinks, referring domains, referring main domains, IPs/subnets, spam score, rank  
- New & lost (requires periodic snapshots or history endpoints)  
- Anchors cloud / table  
- Top linked pages  
- Referring networks concentration (risk)  
- Link Gap  

#### DataForSEO mapping

- `backlinks/summary/live`  
- `backlinks/backlinks/live`  
- `backlinks/anchors/live`  
- `backlinks/referring_domains/live`  
- `backlinks/domain_pages/live`  
- `backlinks/referring_networks/live`  
- `backlinks/history/live`  
- Intersection endpoints for gap  

#### Agency extras

- Outreach list export (domain, contact page guess, anchor opportunity)  
- Toxic link shortlist for disavow consideration (spam score + network concentration heuristics — label as heuristic, not Google policy)  
- Combine with Content Analysis for “mention without link” opportunities  

---

### 6.5 Rank Tracking

**Purpose:** Track keyword positions over time for project keywords in chosen location/device/engine.

#### User flow

1. Add keywords from Saved Keywords / Research / GSC import  
2. Configure: location, language, device (desktop/mobile), engine (Google default)  
3. Schedule: daily / every 3 days / weekly (cost control)  
4. Dashboard: average position, visibility index, winners/losers, SERP feature presence (incl. AI Overview)  
5. Keyword detail: position history chart + latest SERP snapshot  

#### UI sections

- Tracked keyword table  
- Movement widgets  
- Share of voice vs competitors (optional, based on same keyword set)  
- AI Overview presence toggle/column  
- Tags / folders from Saved Keywords  

#### DataForSEO mapping

- Primary: SERP API Google Organic (Live or Standard/task queue for bulk cheap runs)  
- Enrichment: Labs historical SERPs for backfill where available  
- Optional: Bing SERP for multi-engine clients  

#### Persistence (critical)

nPanel must store:

- Keyword set + schedule config  
- Daily (or scheduled) rank rows: `keywordId`, `date`, `rank_absolute`, `rank_group`, `url`, `serpFeatures[]`, `aiOverview: boolean`, `location`, `device`  
- Latest SERP JSON blob (or truncated) for explainability  

#### Agency extras

- Alerts: dropped out of top 10, lost AI Overview, competitor overtook  
- Client-safe chart embeds in Reports  
- “GSC vs Rank Tracker” comparison (sampled GSC position vs tracked SERP position) to educate clients on discrepancy  

---

### 6.6 Site Audit

**Purpose:** Crawl the site and surface technical / on-page issues with a health score.

#### User flow

1. Start audit: domain, max pages, crawl depth, include/exclude paths, JS rendering on/off  
2. Job runs async (task queue) with progress  
3. Summary score + issue categories  
4. Issue lists with severity, affected URLs, evidence  
5. Re-crawl compare (delta)  
6. Instant audit for a single URL anytime  

#### UI sections

- Health score (DataForSEO on-page score / mapped 0–100)  
- Categories: Indexability, Meta, Content, Links, Performance/CWV, Security/HTTPS, Structured issues, Redirects, Resources  
- Page explorer  
- Duplicate title/description/content  
- Non-indexable  
- Redirect chains  
- Broken links  
- Lighthouse scores (optional expensive pass)  
- Screenshot for key templates  

#### DataForSEO mapping

- On-Page Task + Summary / Pages / Links / Resources / Redirect Chains / Non-indexable / Duplicates / Keyword Density / Raw HTML  
- Instant Pages (+ `enable_browser_rendering` for CWV)  
- Lighthouse endpoints  
- Page Screenshot  

#### Persistence

- Audit runs, issue snapshots, page metrics, comparison baselines  

#### Agency extras

- Ticket bridge: “Create hosting/dev ticket from issue”  
- Priority queue: issues that also hurt tracked keywords’ landing pages  
- Merge with existing PageSpeed Insights hosting card where useful (don’t duplicate blindly)

---

### 6.7 AI Visibility

**Purpose:** Measure brand/domain presence in AI answers (GEO), not just classic SERPs.

#### User flow

1. Configure tracked entities: domain, brand names, products, priority prompts  
2. Dashboard: mention count, citation count, AI search volume, sentiment if available  
3. Platform split: Google AI Overview vs ChatGPT (and expand as DataForSEO adds coverage)  
4. Citation explorer: which pages get cited, for which prompts  
5. Competitor AI share comparison  
6. Historical / timeseries charts  

#### UI sections

- AI Visibility score (nPanel-computed composite)  
- Mentions vs Citations  
- Top prompts where you appear / don’t appear  
- Top cited pages  
- Competitor comparison  
- “Prompts to win” recommendations (high AI volume, low your mentions)  

#### DataForSEO mapping

- LLM Mentions: Search Mentions, Target Metrics, Historical, Timeseries / Delta, Lite endpoints  
- AI Keyword Data for prompt demand  
- Optional LLM Scraper for “what the UI shows” verification  

#### Agency extras

- Tie citations back to Site Audit + content quality of cited competitor pages  
- GEO content checklist generated from winning citation patterns  
- Kenya/regional caveat UX: clearly show location/language support limits per platform  

---

### 6.8 Prompt Explorer

**Purpose:** Run the same prompt across supported models and compare answers, brands mentioned, and citations.

#### User flow

1. Enter prompt (+ optional system instructions)  
2. Select models: ChatGPT / Claude / Gemini / Perplexity (Responses API) and/or Scraper targets  
3. Explicit cost confirmation (“This will spend ~X credits”)  
4. Side-by-side responses  
5. Extracted entities: brands, URLs, citations  
6. Save prompt to AI Visibility tracking set  

#### DataForSEO mapping

- LLM Responses (official APIs, structured, parameter-rich)  
- LLM Scraper (cheaper “what users see” path)  
- AI Keyword Data to validate prompt demand before spending on responses  

#### Agency extras

- Prompt library per industry (hosting, domains, clinics, ecommerce, etc.)  
- Diff view: “Who recommends nPanel / client vs competitors?”  
- Export to client workshop deck  

---

### 6.9 Saved Keywords

**Purpose:** Organize keyword ideas for content and tracking — the hub between Research, Rank Tracking, AI, and content.

#### User flow

1. Lists / folders / tags  
2. Bulk import (CSV, GSC top queries, Domain Ranked Keywords)  
3. Enrich missing metrics on demand (volume, KD, intent)  
4. Send to Rank Tracking / AI Visibility prompts / content brief  

#### Data model

- `KeywordList` → many `SavedKeyword`  
- Fields: keyword, location, language, tags, notes, metrics cache, source (`research|gsc|competitor|manual|ai`), status (`idea|tracking|content|done`)  

#### Agency extras

- Client vs internal lists  
- “Content pipeline” statuses synced to tasks  

---

### 6.10 SERP Lab (extension — highly recommended)

**Purpose:** Inspect a live (or historical) SERP like an SEO would: features, AI Overview, PAA, local pack, sitelinks, who owns the page-1 estate.

#### Why it matters

Keyword tables alone don’t explain CTR. Agencies win when they show *why* a query is hard (AI Overview, video packs, local pack, dominant brand).

#### DataForSEO mapping

- SERP Google Organic Live Advanced (`calculate_rectangles` optional)  
- Labs Historical SERPs  
- AI Overview presence tracking templates from DataForSEO no-code gallery patterns  

#### UI

- Visual SERP mock (simplified)  
- Feature checklist  
- Domains on page 1  
- “Track this SERP weekly” → Rank Tracking  

---

### 6.11 Content & Mentions (extension)

**Purpose:** Brand/topic mentions across the web with sentiment — beyond backlinks.

#### DataForSEO mapping

- Content Analysis Search / Summary  
- Sentiment  
- Citation trends by date  
- Rating distribution  

#### Agency use

- PR / digital PR target discovery  
- “Mentioned but not linked” → outreach  
- Crisis / reputation spikes  

---

### 6.12 Local & Reviews (extension)

**Purpose:** Local SEO and reputation for clients with physical presence (critical for Kenya/regional agencies).

#### DataForSEO mapping

- Business Data (Google My Business / listings style endpoints)  
- Reviews API (Google, Trustpilot, Tripadvisor, etc.)  
- SERP local pack via SERP API  

#### UI

- GBP-style overview (where API allows)  
- Review volume, rating trend, response gaps  
- Local pack rank for geo-keywords (via Rank Tracking local location codes)  

---

### 6.13 Tech & WHOIS (extension)

**Purpose:** Enrich Domain Overview and sales/prospecting.

#### DataForSEO mapping

- Domain Technologies (+ aggregation / domains-by-technology)  
- WHOIS  

#### Agency use

- “They’re on WordPress + Woo → upsell hosting/care plan”  
- Competitor stack comparison  
- Expired/expiring domain opportunity lists (careful compliance)  

---

### 6.14 Reports & Alerts (cross-cutting)

**Purpose:** Turn data into client-ready delivery — the agency moat.

#### Report types

1. Monthly SEO Performance (Rank Tracking + Domain Overview deltas)  
2. Technical Audit Executive Summary  
3. Backlink Growth / Risk  
4. AI Visibility / GEO report  
5. Combined Analytics + SEO (GSC/GA4 + DataForSEO) — flagship  

#### Alerts

- Rank drops  
- New/lost backlinks (high rank referring domains)  
- Audit score regression  
- AI citation loss  
- Competitor overtakes  

#### Delivery

- In-app  
- Email digest  
- PDF export (white-label)  
- Optional share link for client  

---

## 7. Extended feature set (beyond the initial list)

User-requested baseline:

1. Keyword Research  
2. Domain Overview  
3. Backlinks  
4. Rank Tracking  
5. Site Audit  
6. AI Visibility  
7. Prompt Explorer  
8. Saved Keywords  

**Add these to stand out (mapped to DataForSEO):**

| Extension | Why | Primary APIs |
|-----------|-----|--------------|
| Competitors / Keyword Gap / Link Gap | Agency core deliverable | Labs + Backlinks intersections |
| SERP Lab + AI Overview tracking | Explains CTR & modern SERPs | SERP + Labs historical SERPs |
| Content & Mentions | PR + unlinked mentions | Content Analysis |
| Local & Reviews | Local businesses | Business Data + Reviews + local SERP |
| Tech & WHOIS | Upsell + enrichment | Domain Analytics |
| Trends & Seasonality | Timing content/campaigns | Google Trends (Keywords Data) |
| Market Categories | Industry demand maps | Labs categories endpoints |
| Instant Page + CWV | Sales demos & quick wins | On-Page Instant Pages |
| Historical Visibility | Proof of progress | Labs historical rank/SERP + Backlink history |
| Prospecting Bulk Traffic | Sales tool | Labs bulk traffic estimation |
| YouTube visibility (phase later) | Video SEO clients | YouTube SERP |
| Shopping/Merchant (phase later) | Ecommerce clients | Merchant API |
| App ASO (phase later) | App clients | App Data API |
| White-label Reports & Alerts | Delivery layer | All + nPanel storage |
| GSC/GA4 bridge workflows | Unique to nPanel | Internal Analytics + Suite |

---

## 8. End-to-end agency workflows (flagship flows)

### 8.1 New client onboarding (golden path)

```
Create Project (domain, location, language, brand entities)
        │
        ├─► Domain Overview (baseline ETV + keywords)
        ├─► Competitors auto-discover + confirm
        ├─► Site Audit (first crawl)
        ├─► Backlinks summary snapshot
        ├─► AI Visibility baseline (domain + brand)
        ├─► Import GSC top queries (if Analytics linked)
        ├─► Seed Saved Keywords (GSC + ranked + gap)
        └─► Enable Rank Tracking (priority set)
```

Output: **Baseline Report** PDF for kickoff meeting.

### 8.2 Content opportunity sprint

```
Keyword Research / Gap
  → cluster topics
  → SERP Lab (feature constraints)
  → Prompt Explorer (how AI answers today)
  → Instant Pages on top-ranking URLs
  → brief + assign content
  → track keywords
```

### 8.3 Link building sprint

```
Backlinks Link Gap
  → Content Analysis unlinked mentions
  → outreach list
  → monitor new referring domains weekly
```

### 8.4 Technical remediation sprint

```
Site Audit
  → prioritize issues on money pages (from Rank Tracking + GSC)
  → tickets
  → re-crawl delta
```

### 8.5 GEO / AI answer sprint

```
AI Keyword Data (demand)
  → Prompt Explorer (current answers)
  → LLM Mentions citations (who wins)
  → improve cited-worthy pages (Audit + content)
  → re-check mentions/citations
```

---

## 9. System architecture

### 9.1 Environment variables (container-safe)

Register in [`packages/env/src/server.ts`](../packages/env/src/server.ts) as **optional** (same pattern as `BRAVE_SEARCH_API_KEY` / `DIGITAX_API_KEY`) so Cloud Run / Docker builds and boots without SEO Suite configured:

| Variable | Required at boot? | Purpose |
|----------|-------------------|---------|
| `DATAFORSEO_LOGIN` | No | API login (email) from Dashboard → API Access |
| `DATAFORSEO_PASSWORD` | No | Auto-generated API password (not dashboard password) |
| `QSTASH_SEO_SUITE_RANK_WORKER_ENDPOINT` | No | Public URL for rank worker; if unset, rank checks run inline |
| `QSTASH_SEO_SUITE_AUDIT_WORKER_ENDPOINT` | No | Public URL for audit worker; if unset, audits run inline |

Missing DataForSEO credentials surface as `PRECONDITION_FAILED` / UI banner — they never fail env validation at process start.

### 9.2 High-level

```
┌─────────────────────────────────────────────────────────────┐
│ Agency / Customer Web (SEO Suite UI)                        │
└───────────────────────────┬─────────────────────────────────┘
                            │ tRPC
┌───────────────────────────▼─────────────────────────────────┐
│ packages/api                                                │
│  ├── seoAnalytics (existing seoReports — unchanged)         │
│  └── seoSuite (new)                                         │
│       ├── projects, keywords, trackers, audits, alerts      │
│       └── dataforseo/ client + job orchestrator             │
└───────────────┬─────────────────────────────┬───────────────┘
                │                             │
                ▼                             ▼
     DataForSEO REST v3              Postgres (nPanel)
     Basic Auth login:pass           projects, ranks, audits,
                                     caches, usage ledger
```

### 9.3 Client design rules

1. **Single DataForSEO credential** in server env (`DATAFORSEO_LOGIN`, `DATAFORSEO_PASSWORD`)  
2. Never expose vendor credentials to the browser  
3. All calls server-side; return normalized DTOs to UI  
4. **Cache** Labs/Backlinks/Domain responses (TTL by endpoint class)  
5. **Job queue** for: rank tracking schedules, site crawls, bulk SERP, LLM Responses  
6. **Usage ledger** per team/project/endpoint for billing & abuse control  
7. Prefer Live for interactive UI; Standard/queue for scheduled bulk  

### 9.4 Normalization layer

Map vendor JSON → stable nPanel types so UI doesn’t break when vendor fields evolve:

- `NiscKeywordMetrics`  
- `NiscSerpSnapshot`  
- `NiscDomainVisibility`  
- `NiscBacklinkSummary`  
- `NiscAuditIssue`  
- `NiscLlmMention`  
- `NiscPromptComparison`  

### 9.5 Cost governor

| Action class | Default policy |
|--------------|----------------|
| Labs keyword/domain reads | Allowed; cached 24h–7d |
| Backlinks summary | Cached 24–72h |
| Backlinks deep lists | Paginated; confirm for large exports |
| Live SERP (ad hoc) | Button with cost estimate |
| Scheduled rank tracking | Cap keywords by plan |
| Full site crawl | Cap pages by plan; confirm |
| LLM Responses / Scraper | Always confirm; separate credit pool |
| AI Mentions lite | Dashboard-friendly; prefer lite endpoints |

---

## 10. Data model (logical)

```
SeoProject
  id, teamId, name, primaryDomain, locationCode, languageCode,
  brandEntities[], competitorDomains[], gscSiteId?, ga4PropertyId?,
  createdAt, archivedAt

SeoKeywordList / SeoSavedKeyword
SeoRankTracker / SeoRankTrackerKeyword / SeoRankResult
SeoAuditRun / SeoAuditIssue / SeoAuditPage
SeoBacklinkSnapshot (periodic summary + optional deltas)
SeoAiEntity / SeoAiMentionSnapshot / SeoTrackedPrompt
SeoPromptRun (Prompt Explorer history)
SeoSerpCache
SeoCompetitorSet
SeoAlertRule / SeoAlertEvent
SeoReportDefinition / SeoReportRun
SeoVendorUsageLedger (teamId, projectId, api, endpoint, units, costEstimate, at)
```

Analytics tables/APIs remain separate; link via optional foreign keys on `SeoProject`.

---

## 11. Permissions & tenancy

| Actor | Analytics | SEO Suite |
|-------|-----------|-----------|
| Agency staff (RBAC) | All manageable GSC/GA4 via SA | All projects (or assigned) |
| Team customer | Subscribed resources only | Projects on their subscription |
| Client viewer (future) | Read reports | Read Reports & selected dashboards |

Extend existing SEO subscription product or add `nisc-seo-suite` plans with limits:

- Projects  
- Tracked keywords  
- Crawl pages / month  
- Prompt runs / month  
- AI mention refreshes / month  
- Competitor slots  

---

## 12. UX shell specification

### 12.1 Agency entry

**SEO → Analytics**  
Current `/agency/seo-reports` (rename label only; keep route or redirect).

**SEO → SEO Suite**  
New `/agency/seo` (or `/agency/seo-suite`):

1. Project switcher (required)  
2. Left subnav of modules (section 3.1)  
3. Global location/language chips (editable per view)  
4. Usage meter (soft) in header  

### 12.2 Empty states

- No project → create wizard (onboarding golden path)  
- Module with no data → “Run first analysis” CTA with cost note  

### 12.3 Progressive disclosure

Default views use **database/Labs** data.  
Destructive/expensive actions behind:

- “Refresh live”  
- “Run crawl”  
- “Compare in Prompt Explorer”  

---

## 13. Phased delivery plan

### Phase 0 — Foundations

- Project model, credentials, DataForSEO client, usage ledger, caching, job runner  
- IA: Analytics label + empty SEO Suite shell  

### Phase 1 — Research core (fastest wow)

- Keyword Research  
- Keyword Overview  
- Saved Keywords  
- Domain Overview  
- SERP Lab (live on demand)  

### Phase 2 — Competitive + links

- Competitors / Keyword Gap  
- Backlinks summary + lists + anchors  
- Link Gap  

### Phase 3 — Tracking + audit

- Rank Tracking schedules + history charts + alerts  
- Site Audit crawl + Instant Pages + issue UX  

### Phase 4 — GEO / AI

- AI Visibility (Mentions + AI Keyword Data)  
- Prompt Explorer (Responses + Scraper)  
- AI Overview columns in Rank Tracking / SERP Lab  

### Phase 5 — Agency delivery layer

- Reports (incl. Analytics merge)  
- Alerts digests  
- Content & Mentions  
- Local & Reviews  
- Tech & WHOIS enrichment  
- Prospecting bulk tools  

### Phase 6 — Optional verticals

- YouTube  
- Merchant / Shopping  
- App ASO  

---

## 14. Mapping: user vision → concrete build checklist

| You asked for | Included | DataForSEO backbone | Notes |
|---------------|----------|---------------------|-------|
| Keyword Research | Yes | Labs + Keywords Data + optional SERP | Add clustering + GSC seed import |
| Domain Overview | Yes | Labs domain/ranked/historical + Domain Analytics | Add bulk prospecting |
| Backlinks | Yes | Backlinks API (all 9-style endpoints) | Add Link Gap + toxic heuristics |
| Rank Tracking | Yes | SERP API + stored history | Schedule + AI Overview flags |
| Site Audit | Yes | On-Page crawl + Instant + Lighthouse | Job UX + ticket bridge |
| AI Visibility | Yes | LLM Mentions + AI Keyword Data | Multi-entity + competitors |
| Prompt Explorer | Yes | LLM Responses + LLM Scraper | Hard cost gates |
| Saved Keywords | Yes | nPanel DB + enrich via Labs | Hub for all modules |
| *(extend)* Competitors | Yes | Labs intersections | Essential agency feature |
| *(extend)* SERP Lab | Yes | SERP + historical SERPs | CTR diagnosis |
| *(extend)* Mentions/PR | Yes | Content Analysis | Unlinked mention outreach |
| *(extend)* Local/Reviews | Yes | Business Data + Reviews | Regional agency strength |
| *(extend)* Reports/Alerts | Yes | All + Analytics merge | True differentiator |

Analytics (GSC/GA4) remains as-is under **Analytics**.

---

## 15. Risks & constraints

| Risk | Mitigation |
|------|------------|
| Vendor cost blowups (SERP + LLM) | Governors, caps, confirmations, Labs-first |
| Location limits (e.g. ChatGPT mentions US/EN) | Transparent UI warnings; regional fallbacks |
| Data freshness vs GSC truth | Educate: market estimates ≠ Google Search Console |
| Crawl politeness / legal | Respect robots; allow exclude paths; client authorization |
| Over-scoped v1 | Stick to phases; ship Research+Overview before AI |
| Credential leakage | Server-only secrets; no browser calls |
| Rate limits (~2k calls/min Labs class) | Queue + backoff; per-tenant concurrency limits |

---

## 16. Open decisions (product)

1. **Route naming:** keep `/agency/seo-reports` for Analytics vs rename to `/agency/seo/analytics`  
2. **Billing:** expand `nisc-seo-reports` vs new `nisc-seo-suite` product with metered overages  
3. **Customer access:** full Suite vs agency-only until Phase 5  
4. **Default locations:** Kenya nationwide vs city-level packs (Nairobi, Mombasa, etc.)  
5. **White-label PDF:** build in-house vs HTML→PDF service  
6. **Ticket integration depth** for audit issues  
7. Which LLM platforms to enable on day one (cost vs coverage)

---

## 17. Success metrics

- Time-to-baseline for a new client project &lt; 15 minutes  
- % of SEO subscriptions using Rank Tracking weekly  
- Agency seats creating ≥1 audit + 1 keyword list per active project  
- Client report send rate monthly  
- Gross margin after DataForSEO COGS ≥ target (set with finance once plans priced)  
- Qualitative: sales demos win against “we only show Search Console” competitors  

---

## 18. Reference links

- [DataForSEO](https://dataforseo.com/)  
- [DataForSEO APIs](https://dataforseo.com/apis)  
- [SEO API stack use cases](https://dataforseo.com/solutions/seo)  
- [AI Optimization API](https://dataforseo.com/apis/ai-optimization-api)  
- [Labs Google overview](https://docs.dataforseo.com/v3/dataforseo_labs-google-overview/)  
- [AI Optimization overview](https://docs.dataforseo.com/v3/ai_optimization-overview/)  
- [On-Page overview](https://docs.dataforseo.com/v3/on_page-overview/)  
- [Pricing list](https://dataforseo.com/pricing-list)  

---

## 19. Summary decision

| Area | Decision |
|------|----------|
| Existing GSC/GA4 product | **Keep as-is**, label/nav as **Analytics** |
| New product | **SEO Suite** under agency SEO |
| Data vendor | **DataForSEO** (full stack over time) |
| Core modules | Research, Domain Overview, Competitors, Backlinks, Rank Tracking, Site Audit, AI Visibility, Prompt Explorer, Saved Keywords |
| Differentiator modules | SERP Lab, Mentions/PR, Local/Reviews, Tech/WHOIS, merged Analytics+SEO reports, onboarding golden path, cost governors |
| Implementation | **Not in this change** — this document is the blueprint |

This is the complete product/flow blueprint for extending nPanel SEO from analytics viewing into a DataForSEO-powered agency SEO + GEO suite without leaving module, vendor, or workflow gaps.
