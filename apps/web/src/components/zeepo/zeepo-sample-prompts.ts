import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Building2,
  Camera,
  Car,
  Clapperboard,
  Frame,
  Globe,
  Hexagon,
  Layers,
  LayoutDashboard,
  Map as MapIcon,
  Megaphone,
  Music,
  Palette,
  ScanSearch,
  TrendingUp,
} from "lucide-react";

export type ZeepoPromptCategory = "design" | "create" | "research" | "strategy";

export type ZeepoSamplePrompt = {
  icon: LucideIcon;
  color: string;
  bg: string;
  title: string;
  prompt: string;
  category: ZeepoPromptCategory;
};

export const ZEEPO_PROMPT_CATEGORY_META: Record<
  ZeepoPromptCategory,
  { label: string; pillClass: string; headingClass: string }
> = {
  design: {
    label: "Design",
    pillClass: "border-fuchsia-500/25 bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-300",
    headingClass: "text-fuchsia-600 dark:text-fuchsia-400",
  },
  create: {
    label: "Create",
    pillClass: "border-blue-500/25 bg-blue-500/10 text-blue-700 dark:text-blue-300",
    headingClass: "text-blue-600 dark:text-blue-400",
  },
  research: {
    label: "Research",
    pillClass: "border-sky-500/25 bg-sky-500/10 text-sky-700 dark:text-sky-300",
    headingClass: "text-sky-600 dark:text-sky-400",
  },
  strategy: {
    label: "Strategy",
    pillClass: "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    headingClass: "text-emerald-600 dark:text-emerald-400",
  },
};

export const ZEEPO_PROMPT_CATEGORY_ORDER: ZeepoPromptCategory[] = [
  "design",
  "create",
  "research",
  "strategy",
];

export const ZEEPO_SAMPLE_PROMPTS: ZeepoSamplePrompt[] = [
  {
    icon: Layers,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    category: "design",
    title: "Editorial streetwear ad suite",
    prompt: `You are a senior graphic designer. Design a set of 5 print-ready social ad creatives for "Jua Collective" — premium East African streetwear for Gen Z. Use the design-specialist model only. Treat each output as a finished agency comp (crisp type, aligned grid, realistic shadows, no AI slop, no watermarks). Brand system locked across all five: neon orange #FF5C00, black #000000, white #FFFFFF; hero product = oversized orange graphic hoodie and/or high-top sneakers; typography = bold Swiss sans (headlines, CTAs) with optional elegant serif for one editorial line only.

Reference the precision of premium DTC / outdoor campaign layouts: editorial hierarchy, lifestyle photography integrated with designed type, pill or rounded CTAs, circular badges, hand-drawn feature callouts, and asymmetric product + copy balance.

Deliver 5 separate images:

(1) Instagram feed — 1:1, asymmetric minimalist layout (ASARAI-style): off-white textured background; streetwear product group left (~45% width) with soft directional shadow; right column — "JUA COLLECTIVE" wordmark top, headline "Wear the City Loud" in bold black sans, subline "Limited Nairobi Drop" smaller, neon orange pill CTA "Shop Now" bottom-right; frame edges with subtle urban props (spray cap, chain, folded map) like botanical framing — tasteful, not cluttered; strict alignment and generous whitespace.

(2) Instagram Stories — 2:3, layered editorial poster (North Face NEXT-style): full-bleed lifestyle photo — young East African model in orange hoodie, urban rooftop, soft fog/mist background; giant background word "DROP" in extra-bold black sans behind the subject (subject breaks the letterforms); foreground headline "Don't Miss the Drop" left-aligned; vertical side text "Heavyweight · Oversized Fit" rotated 90°; solid black pill CTA "SHOP NOW" lower-right; reserve clean swipe-up zone at bottom 12%.

(3) Facebook / Meta feed — 1:1, lifestyle-meets-product editorial (CAYZEN-style): high-key scene — hands styling/adjusting the orange hoodie on a white marble or concrete surface; top-centered typography — serif hero line "Built for the Streets" + sans subline "New Season. Same Heat."; product flat-lay at bottom with streetwear props (cap, laces, tag); circular black "NEW DROP" badge mid-left with small orange dot accent; rounded rectangle CTA "Shop Now" in #FF5C00 bottom-right; soft window bokeh city background, natural diffused light.

(4) TikTok / Reels cover — 2:3, technical action poster (North Face annotate-style): dynamic mid-stride model in orange hoodie, high-contrast environment (gritty wall or night street, shallow depth); top headline "Defy Ordinary. Move Different." bold black sans; three hand-drawn script callouts with thin orange arrows pointing to garment: "Premium Cotton Blend", "Oversized Cut", "Reflective Hit" — casual marker-style lettering; circular "NEW" badge; black rectangular CTA "Shop Now" white type bottom-right; energetic but designed, not chaotic.

(5) Twitter/X banner — 3:2, product grid + dominant brand lockup: deep black background; 3-column product collage (hoodie flat-lay, sneaker angle, detail crop of orange graphic print) with thin white gutters; large "JUA COLLECTIVE" wordmark dominant left or center in bold white sans; electric orange accent line or underline; small supporting line "East Africa · Streetwear · 2025"; compact orange outline or solid CTA "Shop the Drop" far right; editorial, poster-like balance.

Global craft rules: consistent lighting logic per frame; real-world proportions; CTAs always legible at mobile size; no lorem ipsum; no extra logos; all five must feel like one campaign system.`,
  },
  {
    icon: Hexagon,
    color: "text-yellow-500",
    bg: "bg-yellow-500/10",
    category: "design",
    title: "Premium logo design",
    prompt: `Design a premium, print-ready logo for "Vertex Advisory" — a financial consulting firm serving high-net-worth individuals and family offices across Africa. Use the design-specialist model. Deliver four outputs: (1) Primary logo — a refined geometric symbol (a clean upward-pointing abstract form suggesting precision, growth, and altitude) paired with an elegant serif wordmark, rendered in deep navy (#0B1F4F) and brushed gold (#C9A84C) on white; (2) Reversed version — identical mark on a deep navy background with the symbol in gold and wordmark in white; (3) Symbol-only monogram — the geometric mark isolated, suitable for app icon, embossed letterhead, and stamp seal; (4) Horizontal lockup — symbol left, wordmark right, proportionally balanced for email signatures and document headers. Design constraints: no gradients in the primary symbol — solid, geometric, timeless. The result must read as credible and authoritative at both 16px favicon size and large-format print. Ultra-high fidelity, boardroom-quality output, not generic.`,
  },
  {
    icon: Frame,
    color: "text-green-600",
    bg: "bg-green-600/10",
    category: "design",
    title: "Brand mockup suite",
    prompt: `You are a senior brand designer and mockup specialist. Create a cohesive, photorealistic brand mockup suite for "Kora Brew Co." — a specialty cold-brew coffee brand targeting urban professionals in Nairobi and the diaspora. Use the design-specialist / high-graphics model only. Every output must read as a real photographed or studio-rendered mockup (correct perspective, believable materials, natural shadows, subtle imperfections, no flat paste-on graphics, no AI slop, no watermarks, no stock-photo clichés).

Brand system (lock across all mockups): wordmark "KORA" in bold condensed sans + subline "Brew Co."; primary palette deep espresso brown #3B2314, warm cream #F5F0E8, accent copper #C4713B; secondary sage #8A9A7B for botanical accents; typography = modern geometric sans for headlines, clean humanist sans for body; tone = premium, calm, craft-forward, African urban sophistication.

Deliver 8 separate mockup images — each a distinct real-world application (adapt subject matter freely: packaging, apparel, signage, digital, print, environment, vehicle, merch — anything a brand would actually need):

(1) Product packaging mockup — 3D standing pouch or bottle on a styled surface: matte kraft + copper foil stamp logo, "Cold Brew · 12hr Steep" callout, origin line "Nairobi Roast", soft side lighting, shallow depth of field, marble or walnut surface with scattered coffee beans and a folded linen napkin; camera angle ~15° hero three-quarter view.

(2) Mobile app UI device mockup — latest smartphone in hand or on desk, screen showing a minimal app home: Kora logo, "Order Pickup", subscription card, copper CTA button; realistic screen glare, bezel reflections, UI aligned to safe areas; lifestyle desk context (ceramic cup, notebook) blurred in background.

(3) Storefront / signage mockup — exterior café fascia or window vinyl: large KORA wordmark, hours, "Specialty Cold Brew" tagline; shot at golden hour on a contemporary African street (clean architecture, subtle pedestrians motion-blurred); believable glass reflections and sign mounting hardware.

(4) Merchandise apparel mockup — premium heavyweight tee or tote flat-lay or on invisible mannequin: centered chest print (logo + small copper line icon), fabric texture visible, natural wrinkles, neutral cream background; optional second item (cap) partially in frame for depth.

(5) Out-of-home billboard mockup — urban roadside hoarding at dusk: dramatic product pour visual or hero bottle, headline "Slow Brew. Fast City.", logo lockup bottom-right; correct forced perspective on the board, city skyline bokeh, car light trails optional.

(6) Business stationery mockup — top-down flat-lay: letterhead, business card stack (foil edge), branded envelope, copper wax seal or sticker; precise alignment grid, soft even studio light, cream paper stock texture.

(7) Vehicle / delivery mockup — compact delivery van or scooter panel wrap: logo wrap follows body lines, phone number and QR placeholder legible, parked outside a café; overcast soft light, realistic paint and vinyl wrap curvature.

(8) Social + web composite mockup — MacBook on desk showing landing page hero (same brand system) beside phone with Instagram grid preview; consistent photography style across devices; shallow DOF, warm interior lifestyle setting.

Global craft rules: one unified campaign world (same lighting family, colour grading, and prop styling); accurate scale and perspective per mockup type; logos applied with correct curvature on curved surfaces; all text spelled correctly and legible; outputs must feel client-ready for a brand guidelines PDF or Behance case study. If I ask for a different brand, product, or category later, swap the name and category but keep this mockup rigor and deliver the same breadth of applications.`,
  },
  {
    icon: LayoutDashboard,
    color: "text-lime-500",
    bg: "bg-lime-500/10",
    category: "design",
    title: "Data infographic",
    prompt: `Create a single-page, visually stunning infographic image titled "The State of African Tech — 2025" designed for LinkedIn publication and press distribution. Use the design-specialist model for premium editorial quality. The infographic must include all of the following elements laid out as a cohesive designed graphic: (1) Hero statistic — "$8.5 Billion total VC funding raised across Africa in 2025" in large typographic treatment with supporting context line; (2) Top 5 funded markets — clean horizontal bar chart: Nigeria 34%, Kenya 22%, Egypt 19%, South Africa 15%, Ghana 10%; (3) Sector breakdown — donut/pie chart: Fintech 41%, Healthtech 18%, Agritech 14%, Edtech 12%, Logistics 15%; (4) Funding stage split — visual breakdown of Seed vs Series A vs Growth-stage deals as a proportional graphic; (5) Three milestone icons — Africa's first unicorn exit, a $1B continent-focused fund launch, record female-founded startup funding — each with a 1-line caption; (6) Pull quote from a leading Pan-African VC in a styled callout box. Visual style: dark background (#0A0F1E), vibrant data colours (indigo, cyan, amber, emerald), modern editorial layout, professional enough for The Economist or TechCrunch. Format: 2:3 portrait, high resolution.`,
  },
  {
    icon: Camera,
    color: "text-pink-500",
    bg: "bg-pink-500/10",
    category: "design",
    title: "Premium skincare product images",
    prompt: `Generate 6 ultra-premium product photography images for an African luxury skincare line called "Amani Beauty" — clean beauty, African botanicals positioning. Each image should feature a different product in a distinctive luxury flat-lay or 3D render style: (1) Vitamin C face serum — dark glass bottle, fresh baobab fruit slices, gold dropper, white marble surface; (2) Retinol eye cream — jade roller beside it, soft morning light, linen fabric background; (3) Shea body butter — open jar with creamy texture visible, shea nuts and flowers scattered artfully; (4) Kaolin face mask — ceramic bowl with mask applied to brush, volcanic stone, eucalyptus stems; (5) Rose hip toner — mist bottle mid-spray, rose petals in the air, dewy glass surface; (6) Moringa moisturiser — moringa pods and leaves framing the product, earthy terracotta tones. All images: ultra-clean, aspirational, consistent warm ivory and gold colour palette, 3:2 landscape, photorealistic render quality.`,
  },
  {
    icon: Palette,
    color: "text-fuchsia-500",
    bg: "bg-fuchsia-500/10",
    category: "design",
    title: "Brand identity design",
    prompt: `Design a complete brand identity concept for "Cascade Digital" — a performance marketing agency specialising in e-commerce growth for African brands. Generate the following as high-quality graphic design outputs using the design-specialist model: (1) Primary logo mark — wordmark with a modern abstract symbol representing growth and flow, dark navy background, electric blue and white; (2) Alternate logo on white background — same mark adapted for light surfaces; (3) Business card design front — name, role, contact, clean minimal layout; (4) Business card design back — logo mark large, brand colour fill; (5) Social media profile header — LinkedIn banner format, 3:2, showing brand tagline "Built for African Growth". All outputs: premium graphic design quality, consistent brand language, modern yet authoritative, suitable for an agency pitching Fortune 500 clients.`,
  },
  {
    icon: Music,
    color: "text-purple-500",
    bg: "bg-purple-500/10",
    category: "design",
    title: "Artist EP promo assets",
    prompt: `Generate a complete set of visual promotion assets for an Afrobeats artist releasing a debut 6-track EP called "Nairobi Nights". Create: (1) EP cover art — dark, cinematic, neon-lit Nairobi skyline reflected in water, artist silhouette in the foreground, moody purple and gold tones, typography space for title; (2) Single cover for lead track "Midnight Drive" — close-up of dashboard lights in a moving car at night, motion blur on city lights outside, intimate and sensual; (3) Promotional poster for a release party — dark background, event details layout with artist photo space, bold typography treatment, ticket call-to-action; (4) Instagram square post — album art adapted for 1:1 format with streaming platform badges; (5) YouTube thumbnail — high energy, bright contrast, artist name and EP title prominent. Style across all: premium music industry quality, Afrobeats visual language meets modern editorial photography, consistently dark and vibrant.`,
  },
  {
    icon: BarChart3,
    color: "text-indigo-500",
    bg: "bg-indigo-500/10",
    category: "create",
    title: "Series A investor pitch",
    prompt: `Create a 15-slide Series A investor pitch deck for a B2B SaaS platform that automates accounts payable for mid-market companies in East Africa. Include these slides in order: (1) Cover with tagline, (2) The problem — $2.3B lost annually to manual invoicing delays and fraud, (3) Our solution — AI-powered AP automation with ERP integrations, (4) Product walkthrough — 3 key screens with feature callouts, (5) Market size — TAM/SAM/SOM for East African B2B fintech, (6) Business model — SaaS subscriptions + per-transaction fees, (7) Traction — 150 enterprise customers, $240K ARR, 18% MoM growth (use a chart), (8) Go-to-market — direct sales + channel partner strategy, (9) Competitive landscape — positioning matrix vs SAP Concur, Tipalti, local alternatives, (10) Unit economics — CAC, LTV, payback period as stats slide, (11) Team — founders and key hires, (12) 3-year financial projections — revenue chart, (13) Use of funds — $2M ask breakdown, (14) Roadmap — 18-month timeline, (15) Closing slide with contact. Use dark theme with indigo accents. After building the deck, also generate a cinematic cover image for slide 1 showing a futuristic African fintech office.`,
  },
  {
    icon: Clapperboard,
    color: "text-violet-500",
    bg: "bg-violet-500/10",
    category: "create",
    title: "Luxury safari image deck",
    prompt: `Create a photorealistic image-based slide deck for a luxury safari lodge in the Maasai Mara — 8 slides, all using high-graphics generation with google/nano-banana-pro. Generate each image before assembling the deck. Slide 1: aerial golden-hour panoramic shot of endless savanna with a lone acacia tree, warm amber light, cinematic widescreen crop; Slide 2: intimate candlelit bush dinner setup under the stars with white linen tables and lanterns; Slide 3: dramatic close-up of a lion at golden hour, shallow depth of field, National Geographic style; Slide 4: luxurious tented suite interior with four-poster bed, floor-to-ceiling mesh walls opening to the bush; Slide 5: bush breakfast with giraffes grazing in the soft-focus background, lifestyle editorial feel; Slide 6: milky way night sky over the lodge, long exposure, ultra-detailed stars; Slide 7: Maasai warriors in traditional attire at sunset, cultural richness and dignity; Slide 8: rooftop infinity pool at dusk overlooking the plain. Every image: cinematic, ultra-high quality, moody editorial photography, consistent warm tones.`,
  },
  {
    icon: TrendingUp,
    color: "text-orange-500",
    bg: "bg-orange-500/10",
    category: "create",
    title: "Q2 performance review deck",
    prompt: `Build a polished 14-slide Q2 business performance review presentation for an e-commerce company. Include: (1) Cover slide with Q2 date range, (2) Executive summary — 3 big wins, 2 key challenges, (3) Revenue dashboard — actual vs target chart, MoM trend, (4) Orders and GMV stats — 4 KPI cards with deltas, (5) Top 10 products by revenue — bar chart, (6) Customer acquisition — CAC trend, new vs returning ratio chart, (7) Marketing channel performance — donut chart of revenue by channel, (8) Fulfilment and logistics KPIs — on-time delivery rate, return rate, NPS as stats, (9) Team highlights — key hires, notable contributions, (10) What worked — bullets with specific outcomes, (11) What didn't — honest assessment with root cause, (12) Q3 priorities — timeline slide with 5 strategic bets, (13) Budget vs actual — two-column comparison, (14) Closing slide with Q3 targets. Use light theme, clean corporate style. Add a photorealistic cover image showing a modern African office team reviewing data on screens.`,
  },
  {
    icon: Building2,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    category: "create",
    title: "Real estate launch campaign",
    prompt: `Generate a set of 6 ultra-realistic architectural visualisation images for "The Canopy Residences" — a luxury apartment development in Karen, Nairobi. Each image should be a distinct selling point: (1) Exterior at magic hour — glass and wood facade lit from inside against a deep blue sky, lush landscaping; (2) Rooftop infinity pool — evening setting, city lights in the far distance, dramatic reflections; (3) Master bedroom suite — floor-to-ceiling windows framing Karen forest, king bed with crisp white linen; (4) Open-plan kitchen and living — double-height ceilings, island counter, indoor garden wall; (5) Residents' co-working lounge — contemporary furniture, curated bookshelves, natural light; (6) Aerial drone shot — development set among mature trees, Karen Golf Club visible in background. Style: hyper-realistic architectural CGI render, warm but sophisticated tones, aspirational lifestyle quality. Then write a 500-word press release announcing the launch, including pricing tiers, handover timeline, and developer contact.`,
  },
  {
    icon: ScanSearch,
    color: "text-sky-500",
    bg: "bg-sky-500/10",
    category: "research",
    title: "Competitor analysis report",
    prompt: `Research and write a comprehensive competitive analysis report for a fast-casual restaurant chain entering the Nairobi market. For each of the top 6 competitors — Java House, Artcaffe, Chicken Inn, KFC Kenya, Burger King Kenya, and Galitos — provide: menu positioning and price points, primary target demographics, number of locations and expansion pace, social media presence and engagement quality, loyalty/rewards programmes, perceived brand strengths and weaknesses. Then produce: a 2×2 positioning matrix (price vs quality), a gap analysis identifying underserved segments, a full SWOT for our entry strategy, and 5 specific strategic recommendations for differentiation. Format this as a structured strategy document with clear section headings, tables where relevant, and an executive summary at the top.`,
  },
  {
    icon: Globe,
    color: "text-cyan-500",
    bg: "bg-cyan-500/10",
    category: "research",
    title: "Legal tech brand & domains",
    prompt: `I am launching an online legal services platform in Kenya that connects clients with vetted lawyers for contract drafting, company registration, employment law, and virtual consultations via video call — all handled remotely without visiting a law firm. Research the Kenyan legal tech landscape and any regional competitors. Then suggest 8 strong brand name ideas that convey trust, technology, accessibility, and African identity — names should be original, memorable, 1–2 words, and not generic. For each name: explain the concept and why it fits, then check domain availability across .co.ke, .com, and .ke. After checking, recommend the top 3 names with full reasoning covering brand strength, domain availability, and market fit.`,
  },
  {
    icon: Car,
    color: "text-teal-500",
    bg: "bg-teal-500/10",
    category: "research",
    title: "EV market entry research",
    prompt: `Research the current state of the electric vehicle market in Kenya for 2025–2026 and compile a comprehensive market entry analysis document for a company considering importing and distributing EVs. Cover: (1) Market overview — total vehicle imports, current EV penetration %, key models being sold (Nissan Leaf, BYD, MG, others), pricing range; (2) Charging infrastructure — number of public charging stations by county, operators (Ampersand, Roam, PlugnDrive), grid capacity constraints; (3) Government policy — import duty waivers, CBK green vehicle financing, Vision 2030 transport targets, KEBS type approval process; (4) Consumer adoption — key barriers (range anxiety, cost, charging access), survey data on EV interest among Kenyan professionals; (5) Competitive landscape — existing distributors, their inventory, pricing strategies, after-sales networks; (6) Financing and insurance — current EV loan products, premium differences, warranty structures; (7) Entry strategy recommendation — ideal vehicle segments (2-wheelers vs passenger vs commercial), ideal distribution model, pricing strategy, and 18-month rollout plan with projected unit targets.`,
  },
  {
    icon: MapIcon,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    category: "strategy",
    title: "Mobile lending GTM strategy",
    prompt: `Write a comprehensive go-to-market strategy document for a mobile money lending app targeting SMEs in Kenya. Structure it with these sections: (1) Executive summary, (2) Market context — M-Pesa ecosystem, the $5.4B credit gap for MSMEs, CBK lending data, (3) Ideal customer profile — three distinct segments: jua kali vendors, agri input traders, urban retail SMEs — with detailed personas for each, (4) Positioning statement and key messages per segment, (5) Channel mix — USSD, Android app, and agent network — with acquisition cost estimates, (6) Pricing strategy — interest rate model, fee structure, competitor comparison, (7) Strategic partnerships — Safaricom, SACCOs, tier-2 banks, MFIs — with a partnership prioritisation matrix, (8) Regulatory considerations — CBK Digital Credit Provider framework, compliance roadmap, (9) 90-day launch sprint — week-by-week milestones, (10) Success metrics and OKR framework, (11) Risk register with mitigation plans. Use professional document formatting with an executive summary, subheadings, and tables.`,
  },
  {
    icon: Megaphone,
    color: "text-rose-500",
    bg: "bg-rose-500/10",
    category: "strategy",
    title: "Digital marketing strategy doc",
    prompt: `Write a full 12-month digital marketing strategy document for a Kenyan fashion brand targeting diaspora shoppers in the UK, USA, and Canada. Cover: (1) Brand voice and messaging framework — how to speak to diaspora identity, nostalgia, and pride; (2) Instagram and TikTok content strategy — content pillars, posting frequency, format mix (Reels vs static vs Stories), with a 30-day sample content calendar; (3) Influencer marketing plan — 3 macro influencers (100K+) and 10 micro influencers (10–50K) in the diaspora market, outreach approach, compensation model; (4) Paid social strategy — Meta Ads (suggested audiences, lookalike strategy, retargeting funnel) and TikTok Ads (UGC creatives, interest targeting), monthly budget recommendation; (5) Email marketing flows — Welcome series (5 emails), Abandoned cart (3 emails), Post-purchase upsell (2 emails) — include subject lines and content hooks for each; (6) SEO strategy — target keyword clusters for "African fashion diaspora", content SEO plan; (7) 90-day revenue model — projected traffic, conversion rate, AOV, and revenue by channel. Present as a structured document.`,
  },
];
