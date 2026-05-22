"use client";

import * as React from "react";
import { authClient } from "@/lib/auth-client";
import { Link, Navigate, useNavigate } from "react-router";
import { trpc } from "@/utils/trpc";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import {
  ArrowUp,
  ArrowUpRight,
  Plus,
  ChevronRight,
  X,
  Clock,
  Trash2,
  BarChart3,
  Clapperboard,
  ScanSearch,
  Map as MapIcon,
  Camera,
  Globe,
  TrendingUp,
  Palette,
  Building2,
  Megaphone,
  Car,
  Music,
  Layers,
  Hexagon,
  LayoutDashboard,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { uploadErrorMessage, uploadFiles, uploadThingFileUrl } from "@/hooks/use-uploadthing";
import { RotatingText } from "@/components/rotating-text";
import { ZeepoMascot } from "@/components/zeepo/zeepo-mascot";

type Attachment = { url: string; name: string; mimeType: string };

type SamplePrompt = { icon: LucideIcon; color: string; bg: string; title: string; prompt: string };

const SAMPLE_PROMPTS: SamplePrompt[] = [
  {
    icon: Layers,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
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
    title: "Premium logo design",
    prompt: `Design a premium, print-ready logo for "Vertex Advisory" — a financial consulting firm serving high-net-worth individuals and family offices across Africa. Use the design-specialist model. Deliver four outputs: (1) Primary logo — a refined geometric symbol (a clean upward-pointing abstract form suggesting precision, growth, and altitude) paired with an elegant serif wordmark, rendered in deep navy (#0B1F4F) and brushed gold (#C9A84C) on white; (2) Reversed version — identical mark on a deep navy background with the symbol in gold and wordmark in white; (3) Symbol-only monogram — the geometric mark isolated, suitable for app icon, embossed letterhead, and stamp seal; (4) Horizontal lockup — symbol left, wordmark right, proportionally balanced for email signatures and document headers. Design constraints: no gradients in the primary symbol — solid, geometric, timeless. The result must read as credible and authoritative at both 16px favicon size and large-format print. Ultra-high fidelity, boardroom-quality output, not generic.`,
  },
  {
    icon: LayoutDashboard,
    color: "text-lime-500",
    bg: "bg-lime-500/10",
    title: "Data infographic",
    prompt: `Create a single-page, visually stunning infographic image titled "The State of African Tech — 2025" designed for LinkedIn publication and press distribution. Use the design-specialist model for premium editorial quality. The infographic must include all of the following elements laid out as a cohesive designed graphic: (1) Hero statistic — "$8.5 Billion total VC funding raised across Africa in 2025" in large typographic treatment with supporting context line; (2) Top 5 funded markets — clean horizontal bar chart: Nigeria 34%, Kenya 22%, Egypt 19%, South Africa 15%, Ghana 10%; (3) Sector breakdown — donut/pie chart: Fintech 41%, Healthtech 18%, Agritech 14%, Edtech 12%, Logistics 15%; (4) Funding stage split — visual breakdown of Seed vs Series A vs Growth-stage deals as a proportional graphic; (5) Three milestone icons — Africa's first unicorn exit, a $1B continent-focused fund launch, record female-founded startup funding — each with a 1-line caption; (6) Pull quote from a leading Pan-African VC in a styled callout box. Visual style: dark background (#0A0F1E), vibrant data colours (indigo, cyan, amber, emerald), modern editorial layout, professional enough for The Economist or TechCrunch. Format: 2:3 portrait, high resolution.`,
  },
  {
    icon: BarChart3,
    color: "text-indigo-500",
    bg: "bg-indigo-500/10",
    title: "Series A investor pitch",
    prompt: `Create a 15-slide Series A investor pitch deck for a B2B SaaS platform that automates accounts payable for mid-market companies in East Africa. Include these slides in order: (1) Cover with tagline, (2) The problem — $2.3B lost annually to manual invoicing delays and fraud, (3) Our solution — AI-powered AP automation with ERP integrations, (4) Product walkthrough — 3 key screens with feature callouts, (5) Market size — TAM/SAM/SOM for East African B2B fintech, (6) Business model — SaaS subscriptions + per-transaction fees, (7) Traction — 150 enterprise customers, $240K ARR, 18% MoM growth (use a chart), (8) Go-to-market — direct sales + channel partner strategy, (9) Competitive landscape — positioning matrix vs SAP Concur, Tipalti, local alternatives, (10) Unit economics — CAC, LTV, payback period as stats slide, (11) Team — founders and key hires, (12) 3-year financial projections — revenue chart, (13) Use of funds — $2M ask breakdown, (14) Roadmap — 18-month timeline, (15) Closing slide with contact. Use dark theme with indigo accents. After building the deck, also generate a cinematic cover image for slide 1 showing a futuristic African fintech office.`,
  },
  {
    icon: Clapperboard,
    color: "text-violet-500",
    bg: "bg-violet-500/10",
    title: "Luxury safari image deck",
    prompt: `Create a photorealistic image-based slide deck for a luxury safari lodge in the Maasai Mara — 8 slides, all using high-graphics generation with google/nano-banana-pro. Generate each image before assembling the deck. Slide 1: aerial golden-hour panoramic shot of endless savanna with a lone acacia tree, warm amber light, cinematic widescreen crop; Slide 2: intimate candlelit bush dinner setup under the stars with white linen tables and lanterns; Slide 3: dramatic close-up of a lion at golden hour, shallow depth of field, National Geographic style; Slide 4: luxurious tented suite interior with four-poster bed, floor-to-ceiling mesh walls opening to the bush; Slide 5: bush breakfast with giraffes grazing in the soft-focus background, lifestyle editorial feel; Slide 6: milky way night sky over the lodge, long exposure, ultra-detailed stars; Slide 7: Maasai warriors in traditional attire at sunset, cultural richness and dignity; Slide 8: rooftop infinity pool at dusk overlooking the plain. Every image: cinematic, ultra-high quality, moody editorial photography, consistent warm tones.`,
  },
  {
    icon: ScanSearch,
    color: "text-sky-500",
    bg: "bg-sky-500/10",
    title: "Competitor analysis report",
    prompt: `Research and write a comprehensive competitive analysis report for a fast-casual restaurant chain entering the Nairobi market. For each of the top 6 competitors — Java House, Artcaffe, Chicken Inn, KFC Kenya, Burger King Kenya, and Galitos — provide: menu positioning and price points, primary target demographics, number of locations and expansion pace, social media presence and engagement quality, loyalty/rewards programmes, perceived brand strengths and weaknesses. Then produce: a 2×2 positioning matrix (price vs quality), a gap analysis identifying underserved segments, a full SWOT for our entry strategy, and 5 specific strategic recommendations for differentiation. Format this as a structured strategy document with clear section headings, tables where relevant, and an executive summary at the top.`,
  },
  {
    icon: MapIcon,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    title: "Mobile lending GTM strategy",
    prompt: `Write a comprehensive go-to-market strategy document for a mobile money lending app targeting SMEs in Kenya. Structure it with these sections: (1) Executive summary, (2) Market context — M-Pesa ecosystem, the $5.4B credit gap for MSMEs, CBK lending data, (3) Ideal customer profile — three distinct segments: jua kali vendors, agri input traders, urban retail SMEs — with detailed personas for each, (4) Positioning statement and key messages per segment, (5) Channel mix — USSD, Android app, and agent network — with acquisition cost estimates, (6) Pricing strategy — interest rate model, fee structure, competitor comparison, (7) Strategic partnerships — Safaricom, SACCOs, tier-2 banks, MFIs — with a partnership prioritisation matrix, (8) Regulatory considerations — CBK Digital Credit Provider framework, compliance roadmap, (9) 90-day launch sprint — week-by-week milestones, (10) Success metrics and OKR framework, (11) Risk register with mitigation plans. Use professional document formatting with an executive summary, subheadings, and tables.`,
  },
  {
    icon: Camera,
    color: "text-pink-500",
    bg: "bg-pink-500/10",
    title: "Premium skincare product images",
    prompt: `Generate 6 ultra-premium product photography images for an African luxury skincare line called "Amani Beauty" — clean beauty, African botanicals positioning. Each image should feature a different product in a distinctive luxury flat-lay or 3D render style: (1) Vitamin C face serum — dark glass bottle, fresh baobab fruit slices, gold dropper, white marble surface; (2) Retinol eye cream — jade roller beside it, soft morning light, linen fabric background; (3) Shea body butter — open jar with creamy texture visible, shea nuts and flowers scattered artfully; (4) Kaolin face mask — ceramic bowl with mask applied to brush, volcanic stone, eucalyptus stems; (5) Rose hip toner — mist bottle mid-spray, rose petals in the air, dewy glass surface; (6) Moringa moisturiser — moringa pods and leaves framing the product, earthy terracotta tones. All images: ultra-clean, aspirational, consistent warm ivory and gold colour palette, 3:2 landscape, photorealistic render quality.`,
  },
  {
    icon: Globe,
    color: "text-cyan-500",
    bg: "bg-cyan-500/10",
    title: "Legal tech brand & domains",
    prompt: `I am launching an online legal services platform in Kenya that connects clients with vetted lawyers for contract drafting, company registration, employment law, and virtual consultations via video call — all handled remotely without visiting a law firm. Research the Kenyan legal tech landscape and any regional competitors. Then suggest 8 strong brand name ideas that convey trust, technology, accessibility, and African identity — names should be original, memorable, 1–2 words, and not generic. For each name: explain the concept and why it fits, then check domain availability across .co.ke, .com, and .ke. After checking, recommend the top 3 names with full reasoning covering brand strength, domain availability, and market fit.`,
  },
  {
    icon: TrendingUp,
    color: "text-orange-500",
    bg: "bg-orange-500/10",
    title: "Q2 performance review deck",
    prompt: `Build a polished 14-slide Q2 business performance review presentation for an e-commerce company. Include: (1) Cover slide with Q2 date range, (2) Executive summary — 3 big wins, 2 key challenges, (3) Revenue dashboard — actual vs target chart, MoM trend, (4) Orders and GMV stats — 4 KPI cards with deltas, (5) Top 10 products by revenue — bar chart, (6) Customer acquisition — CAC trend, new vs returning ratio chart, (7) Marketing channel performance — donut chart of revenue by channel, (8) Fulfilment and logistics KPIs — on-time delivery rate, return rate, NPS as stats, (9) Team highlights — key hires, notable contributions, (10) What worked — bullets with specific outcomes, (11) What didn't — honest assessment with root cause, (12) Q3 priorities — timeline slide with 5 strategic bets, (13) Budget vs actual — two-column comparison, (14) Closing slide with Q3 targets. Use light theme, clean corporate style. Add a photorealistic cover image showing a modern African office team reviewing data on screens.`,
  },
  {
    icon: Palette,
    color: "text-fuchsia-500",
    bg: "bg-fuchsia-500/10",
    title: "Brand identity design",
    prompt: `Design a complete brand identity concept for "Cascade Digital" — a performance marketing agency specialising in e-commerce growth for African brands. Generate the following as high-quality graphic design outputs using the design-specialist model: (1) Primary logo mark — wordmark with a modern abstract symbol representing growth and flow, dark navy background, electric blue and white; (2) Alternate logo on white background — same mark adapted for light surfaces; (3) Business card design front — name, role, contact, clean minimal layout; (4) Business card design back — logo mark large, brand colour fill; (5) Social media profile header — LinkedIn banner format, 3:2, showing brand tagline "Built for African Growth". All outputs: premium graphic design quality, consistent brand language, modern yet authoritative, suitable for an agency pitching Fortune 500 clients.`,
  },
  {
    icon: Building2,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    title: "Real estate launch campaign",
    prompt: `Generate a set of 6 ultra-realistic architectural visualisation images for "The Canopy Residences" — a luxury apartment development in Karen, Nairobi. Each image should be a distinct selling point: (1) Exterior at magic hour — glass and wood facade lit from inside against a deep blue sky, lush landscaping; (2) Rooftop infinity pool — evening setting, city lights in the far distance, dramatic reflections; (3) Master bedroom suite — floor-to-ceiling windows framing Karen forest, king bed with crisp white linen; (4) Open-plan kitchen and living — double-height ceilings, island counter, indoor garden wall; (5) Residents' co-working lounge — contemporary furniture, curated bookshelves, natural light; (6) Aerial drone shot — development set among mature trees, Karen Golf Club visible in background. Style: hyper-realistic architectural CGI render, warm but sophisticated tones, aspirational lifestyle quality. Then write a 500-word press release announcing the launch, including pricing tiers, handover timeline, and developer contact.`,
  },
  {
    icon: Megaphone,
    color: "text-rose-500",
    bg: "bg-rose-500/10",
    title: "Digital marketing strategy doc",
    prompt: `Write a full 12-month digital marketing strategy document for a Kenyan fashion brand targeting diaspora shoppers in the UK, USA, and Canada. Cover: (1) Brand voice and messaging framework — how to speak to diaspora identity, nostalgia, and pride; (2) Instagram and TikTok content strategy — content pillars, posting frequency, format mix (Reels vs static vs Stories), with a 30-day sample content calendar; (3) Influencer marketing plan — 3 macro influencers (100K+) and 10 micro influencers (10–50K) in the diaspora market, outreach approach, compensation model; (4) Paid social strategy — Meta Ads (suggested audiences, lookalike strategy, retargeting funnel) and TikTok Ads (UGC creatives, interest targeting), monthly budget recommendation; (5) Email marketing flows — Welcome series (5 emails), Abandoned cart (3 emails), Post-purchase upsell (2 emails) — include subject lines and content hooks for each; (6) SEO strategy — target keyword clusters for "African fashion diaspora", content SEO plan; (7) 90-day revenue model — projected traffic, conversion rate, AOV, and revenue by channel. Present as a structured document.`,
  },
  {
    icon: Car,
    color: "text-teal-500",
    bg: "bg-teal-500/10",
    title: "EV market entry research",
    prompt: `Research the current state of the electric vehicle market in Kenya for 2025–2026 and compile a comprehensive market entry analysis document for a company considering importing and distributing EVs. Cover: (1) Market overview — total vehicle imports, current EV penetration %, key models being sold (Nissan Leaf, BYD, MG, others), pricing range; (2) Charging infrastructure — number of public charging stations by county, operators (Ampersand, Roam, PlugnDrive), grid capacity constraints; (3) Government policy — import duty waivers, CBK green vehicle financing, Vision 2030 transport targets, KEBS type approval process; (4) Consumer adoption — key barriers (range anxiety, cost, charging access), survey data on EV interest among Kenyan professionals; (5) Competitive landscape — existing distributors, their inventory, pricing strategies, after-sales networks; (6) Financing and insurance — current EV loan products, premium differences, warranty structures; (7) Entry strategy recommendation — ideal vehicle segments (2-wheelers vs passenger vs commercial), ideal distribution model, pricing strategy, and 18-month rollout plan with projected unit targets.`,
  },
  {
    icon: Music,
    color: "text-purple-500",
    bg: "bg-purple-500/10",
    title: "Artist EP promo assets",
    prompt: `Generate a complete set of visual promotion assets for an Afrobeats artist releasing a debut 6-track EP called "Nairobi Nights". Create: (1) EP cover art — dark, cinematic, neon-lit Nairobi skyline reflected in water, artist silhouette in the foreground, moody purple and gold tones, typography space for title; (2) Single cover for lead track "Midnight Drive" — close-up of dashboard lights in a moving car at night, motion blur on city lights outside, intimate and sensual; (3) Promotional poster for a release party — dark background, event details layout with artist photo space, bold typography treatment, ticket call-to-action; (4) Instagram square post — album art adapted for 1:1 format with streaming platform badges; (5) YouTube thumbnail — high energy, bright contrast, artist name and EP title prominent. Style across all: premium music industry quality, Afrobeats visual language meets modern editorial photography, consistently dark and vibrant.`,
  },
];

export default function ZeepoAiAgentIndexPage() {
  const { data: session, isPending: authPending } = authClient.useSession();
  const navigate = useNavigate();
  const utils = trpc.useUtils();

  const [draft, setDraft] = React.useState("");
  const [pendingAttachments, setPendingAttachments] = React.useState<Attachment[]>([]);
  const [isUploading, setIsUploading] = React.useState(false);
  const [historyOpen, setHistoryOpen] = React.useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const listQuery = trpc.zeepoAgent.sessions.list.useQuery(
    { page: 1, limit: 30 },
    { enabled: Boolean(session?.user), retry: 1 },
  );

  const createSession = trpc.zeepoAgent.sessions.create.useMutation();
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const deleteSession = trpc.zeepoAgent.sessions.delete.useMutation({
    onSuccess: () => {
      void utils.zeepoAgent.sessions.list.invalidate();
    },
    onSettled: () => {
      setDeletingId(null);
    },
  });

  // Auto-resize textarea
  React.useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [draft]);

  const handleSubmit = async (opts?: {
    message?: string;
    skillId?: string;
    attachments?: Attachment[];
  }) => {
    const message = opts?.message ?? draft.trim();
    const attachments = opts?.attachments ?? pendingAttachments;
    if (!message && attachments.length === 0) return;

    try {
      const res = await createSession.mutateAsync({});
      void utils.zeepoAgent.sessions.list.invalidate();
      const id = res.data?.id;
      if (id) {
        navigate(`/agency/zeepo-ai-agent/${id}`, {
          state: {
            initialMessage: message,
            initialSkillId: opts?.skillId,
            initialAttachments: attachments.length ? attachments : undefined,
          },
        });
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to create chat");
    }
  };


  const handleFileSelect = async (files: FileList | null) => {
    if (!files?.length) return;
    setIsUploading(true);
    try {
      const fileArray = Array.from(files);
      const results = await uploadFiles("zeepoAgentAttachment", { files: fileArray });
      setPendingAttachments((prev) =>
        [
          ...prev,
          ...results.map((r, i) => ({
            url: uploadThingFileUrl(r),
            name: fileArray[i]?.name ?? r.name ?? "attachment",
            mimeType: fileArray[i]?.type ?? "image/*",
          })),
        ].slice(0, 4),
      );
    } catch (e) {
      toast.error(uploadErrorMessage(e));
    } finally {
      setIsUploading(false);
    }
  };


  if (authPending) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 px-4">
        <Spinner size={32} className="text-muted-foreground" />
      </div>
    );
  }

  if (!session?.user) {
    return <Navigate to="/auth/login" replace />;
  }

  const rows = listQuery.data?.data ?? [];
  const canSend =
    (draft.trim().length > 0 || pendingAttachments.length > 0) &&
    !createSession.isPending &&
    !isUploading;

  return (
    <div className="relative flex min-h-[calc(100vh-theme(spacing.12)-theme(spacing.8))] flex-col items-center justify-start overflow-y-auto px-4 py-8">
      {/* History + Actions row — top right */}
      <div className="absolute right-4 top-4 flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-muted-foreground hover:text-foreground"
          onClick={() => setHistoryOpen(true)}
        >
          <Clock className="size-4" />
          <span className="hidden sm:inline text-sm">Recent chats</span>
        </Button>
      </div>

      {/* ── Main compose area ──────────────────────────────── */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes zeepo-compose-border {
          0%   { border-color: rgba(124,58,237,0.7); box-shadow: 0 0 10px 2px rgba(124,58,237,0.2); }
          33%  { border-color: rgba(37,99,235,0.7);  box-shadow: 0 0 10px 2px rgba(37,99,235,0.2);  }
          66%  { border-color: rgba(6,182,212,0.7);  box-shadow: 0 0 10px 2px rgba(6,182,212,0.2);  }
          100% { border-color: rgba(124,58,237,0.7); box-shadow: 0 0 10px 2px rgba(124,58,237,0.2); }
        }
        .zeepo-compose-wrap {
          position: relative;
          width: 100%;
          border-radius: 1rem;
          border: 2px solid rgba(124,58,237,0.7);
          animation: zeepo-compose-border 6s linear infinite;
          overflow: hidden;
        }
        .zeepo-compose-wrap:focus-within {
          box-shadow: 0 0 18px 4px rgba(124,58,237,0.3) !important;
        }
      `}} />
      <div className="w-full max-w-[760px] flex flex-col items-center gap-7 pt-10">
        {/* Heading */}
        <div className="flex w-full flex-col items-center gap-3">
          <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
            <ZeepoMascot />
            <h1
              className="text-[2rem] sm:text-[2.75rem] font-serif tracking-tight text-foreground text-center leading-tight"
              style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
            >
              What can I do for you?
            </h1>
          </div>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            I can{" "}
            <RotatingText
              texts={[
                "write strategies, plans, and proposals",
                "check domain availability and buy instantly",
                "generate images, video, and audio",
                "research anything with live web search",
                "build brand assets and creative copy",
                "run marketing campaigns end to end",
                "handle operational planning and briefs",
              ]}
              className="font-medium text-foreground"
            />
          </p>
        </div>

        {/* Compose box */}
        <div className="zeepo-compose-wrap bg-card shadow-sm">
          {/* Pending attachment thumbnails */}
          {pendingAttachments.length > 0 && (
            <div className="flex flex-wrap gap-2 px-4 pt-3">
              {pendingAttachments.map((a, i) => (
                <div key={i} className="relative">
                  <img
                    src={a.url}
                    alt={a.name}
                    className="h-14 w-14 rounded-lg object-cover border border-border"
                  />
                  <button
                    type="button"
                    aria-label="Remove attachment"
                    className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-foreground text-background shadow-sm hover:scale-110 transition-transform"
                    onClick={() =>
                      setPendingAttachments((p) => p.filter((_, idx) => idx !== i))
                    }
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Assign a task or ask anything"
            rows={2}
            className="w-full resize-none bg-transparent px-4 pt-4 pb-2 text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none min-h-[64px] max-h-[200px] overflow-y-auto leading-relaxed"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void handleSubmit();
              }
            }}
            disabled={createSession.isPending}
          />

          {/* Bottom toolbar */}
          <div className="flex items-center justify-between px-3 pb-3 pt-1">
            {/* Left: attachment + (future: more tools) */}
            <div className="flex items-center gap-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  void handleFileSelect(e.target.files);
                  e.target.value = "";
                }}
              />
              <button
                type="button"
                aria-label="Attach file"
                disabled={isUploading || createSession.isPending}
                className={cn(
                  "flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors",
                  "hover:bg-muted hover:text-foreground",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  "disabled:pointer-events-none disabled:opacity-40",
                )}
                onClick={() => fileInputRef.current?.click()}
              >
                {isUploading ? (
                  <Spinner size={16} />
                ) : (
                  <Plus className="size-5" />
                )}
              </button>
            </div>

            {/* Right: send button */}
            <button
              type="button"
              aria-label="Send"
              disabled={!canSend}
              className={cn(
                "flex size-8 items-center justify-center rounded-full transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                canSend
                  ? "bg-foreground text-background hover:bg-foreground/85"
                  : "bg-muted text-muted-foreground cursor-not-allowed",
              )}
              onClick={() => void handleSubmit()}
            >
              {createSession.isPending ? (
                <Spinner size={14} className="text-current" />
              ) : (
                <ArrowUp className="size-4" />
              )}
            </button>
          </div>
        </div>

        {/* ── Sample prompt cards ─────────────────────────────── */}
        <div className="w-full">
          <div className="mb-3">
            <p className="text-xs font-medium text-muted-foreground">Sample prompts</p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {SAMPLE_PROMPTS.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.title}
                  type="button"
                  disabled={createSession.isPending}
                  onClick={() => {
                    setDraft(item.prompt);
                    setTimeout(() => textareaRef.current?.focus(), 50);
                  }}
                  className={cn(
                    "group relative flex flex-col items-start gap-2.5 rounded-xl border bg-card p-3.5 text-left shadow-sm",
                    "transition-all hover:border-primary/40 hover:bg-accent hover:shadow-md",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    "disabled:pointer-events-none disabled:opacity-50",
                  )}
                >
                  <div className={cn("flex size-8 items-center justify-center rounded-lg", item.bg)}>
                    <Icon className={cn("size-4", item.color)} strokeWidth={1.75} />
                  </div>
                  <p className="text-xs font-semibold text-foreground leading-snug pr-4">{item.title}</p>
                  <p className="line-clamp-2 text-[10px] text-muted-foreground leading-relaxed pr-2">
                    {item.prompt.slice(0, 88).trimEnd()}…
                  </p>
                  <ArrowUpRight className="absolute bottom-3 right-3 size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── History panel (popover on desktop) ────────────────── */}
      {historyOpen && (
        <>
          {/* Backdrop for mobile */}
          <div
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] sm:hidden"
            onClick={() => setHistoryOpen(false)}
          />
          <div
            className={cn(
              "absolute right-4 top-14 z-50 w-[min(calc(100vw-2rem),20rem)]",
              "rounded-2xl border bg-card shadow-xl",
              "animate-in fade-in slide-in-from-top-2 duration-200",
            )}
          >
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h2 className="text-sm font-semibold">Recent chats</h2>
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                onClick={() => setHistoryOpen(false)}
              >
                <X className="size-3.5" />
              </Button>
            </div>

            <div className="max-h-72 overflow-y-auto">
              <div className="p-2">
                {listQuery.isPending ? (
                  <div className="flex justify-center py-6">
                    <Spinner size={20} className="text-muted-foreground" />
                  </div>
                ) : rows.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    No chats yet
                  </p>
                ) : (
                  rows.map((s) => (
                    <div key={s.id} className="group relative flex items-center rounded-xl hover:bg-muted/50 transition-colors">
                      <Link
                        to={`/agency/zeepo-ai-agent/${s.id}`}
                        className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5"
                        onClick={() => setHistoryOpen(false)}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium leading-tight">
                            {s.title || "Untitled"}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(s.updatedAt), {
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                        <ChevronRight className="size-3.5 shrink-0 text-muted-foreground group-hover:opacity-0 transition-opacity" />
                      </Link>
                      <button
                        type="button"
                        aria-label="Delete chat"
                        disabled={deletingId === s.id}
                        className={cn(
                          "absolute right-2 flex size-6 items-center justify-center rounded-md text-muted-foreground",
                          "opacity-0 group-hover:opacity-100 transition-opacity",
                          "hover:bg-destructive/10 hover:text-destructive",
                          "focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          "disabled:pointer-events-none",
                        )}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDeletingId(s.id);
                          deleteSession.mutate({ id: s.id });
                        }}
                      >
                        {deletingId === s.id ? (
                          <Spinner size={12} className="text-current" />
                        ) : (
                          <Trash2 className="size-3.5" />
                        )}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}

    </div>
  );
}
