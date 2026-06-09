import ServicePageShell from "@/pages/_components/ServicePageShell.tsx";
import { Palette, Layers, PenTool, Award, Sparkles, FileText, Users, Globe, CheckCircle2, Star, TrendingUp } from "lucide-react";
import type { ShowcaseBlock } from "@/pages/_components/ServiceShowcaseSection.tsx";

const showcaseBlocks: ShowcaseBlock[] = [
  {
    tag: "Brand Strategy",
    headline: "A logo that works as hard as you do",
    body: "From the boardroom to the billboard, your brand identity tells your story before you say a word. We craft visual systems that command premium positioning in the Kenyan market.",
    bullets: [
      "Delivered in 3 days — Starter brands ready before the week ends",
      "All source files included — AI, EPS, SVG, PDF, and PNG",
      "Colour psychology tuned for Kenyan consumer behaviour",
    ],
    mockupRight: true,
    mockup: (
      <div className="space-y-4">
        <div className="flex items-center gap-3 bg-white dark:bg-card rounded-2xl p-4 shadow-md border border-border/40">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shrink-0">
            <Palette size={22} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold truncate">Brand Identity Kit</div>
            <div className="text-xs text-muted-foreground">Logo · Colours · Typography</div>
          </div>
          <CheckCircle2 size={18} className="text-green-500 shrink-0" />
        </div>
        <div className="grid grid-cols-5 gap-2">
          {["oklch(0.60 0.22 235)","oklch(0.50 0.20 265)","oklch(0.65 0.16 160)","oklch(0.75 0.05 240)","oklch(0.20 0.02 260)"].map((c) => (
            <div key={c} className="h-10 rounded-xl border border-border/30 shadow-sm" style={{ background: c }} />
          ))}
        </div>
        <div className="bg-white dark:bg-card rounded-2xl p-4 border border-border/40 shadow-md">
          <div className="text-xs text-muted-foreground mb-2 font-medium">CLIENT SATISFACTION</div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-primary">98%</span>
            <span className="text-xs text-muted-foreground">happy clients</span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-primary" style={{ width: "98%" }} />
          </div>
          <div className="flex items-center gap-1 mt-2">
            {[1,2,3,4,5].map(s => <Star key={s} size={12} className="fill-yellow-400 text-yellow-400" />)}
            <span className="text-xs text-muted-foreground ml-1">4.9 average rating</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    tag: "Brand Guide",
    headline: "Every detail documented. Every touchpoint consistent.",
    body: "We don't hand you a logo and disappear. You receive a comprehensive brand guidelines PDF your entire team can use — from how to write headlines to how to use your logo on a dark background.",
    bullets: [
      "20-page brand guidelines PDF on Growth plans",
      "Typography hierarchy, spacing, and grid systems",
      "Print, digital, and social media application rules",
    ],
    mockupRight: false,
    mockup: (
      <div className="space-y-3">
        <div className="bg-white dark:bg-card rounded-2xl border border-border/40 shadow-md overflow-hidden">
          <div className="bg-primary px-5 py-3 flex items-center justify-between">
            <span className="text-white text-sm font-bold">Brand Guidelines</span>
            <FileText size={16} className="text-white/80" />
          </div>
          <div className="p-4 space-y-2.5">
            {["Logo Usage Rules","Colour Palette","Typography System","Spacing & Grid","Imagery Style","Do's & Don'ts"].map(item => (
              <div key={item} className="flex items-center gap-2.5 text-sm">
                <CheckCircle2 size={13} className="text-primary shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <div className="flex-1 bg-white dark:bg-card rounded-xl border border-border/40 shadow p-3 text-center">
            <div className="text-xl font-extrabold text-primary">300+</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">Brands Built</div>
          </div>
          <div className="flex-1 bg-white dark:bg-card rounded-xl border border-border/40 shadow p-3 text-center">
            <div className="text-xl font-extrabold text-primary">7 Days</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">Avg Delivery</div>
          </div>
        </div>
      </div>
    ),
  },
  {
    tag: "Market Impact",
    headline: "From invisible to unmissable",
    body: "Businesses that invest in professional brand identity report 40–70% improvements in perceived value. Premium branding enables premium pricing — the most direct path to higher revenue.",
    bullets: [
      "Competitor brand audit included on Enterprise plan",
      "Brand positioning strategy that owns a unique market space",
      "Packaging, signage, and vehicle wrap mockups available",
    ],
    mockupRight: true,
    mockup: (
      <div className="space-y-3">
        <div className="bg-white dark:bg-card rounded-2xl p-4 border border-border/40 shadow-md">
          <div className="text-xs text-muted-foreground mb-2 font-semibold uppercase tracking-wide">Perceived Value After Branding</div>
          <div className="space-y-2">
            {[["Before","32%","oklch(0.7 0.03 240)"],["After Nisc Brand","78%","oklch(0.60 0.22 235)"]].map(([label, pct, color]) => (
              <div key={String(label)}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-bold" style={{ color: String(color) }}>{pct}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: String(pct), background: String(color) }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white dark:bg-card rounded-2xl p-4 border border-border/40 shadow-md flex items-center gap-3">
          <TrendingUp size={28} className="text-primary shrink-0" />
          <div>
            <div className="font-bold text-sm">40–70% Higher</div>
            <div className="text-xs text-muted-foreground">Perceived value increase post-rebrand</div>
          </div>
        </div>
      </div>
    ),
  },
];

export default function BrandIdentityPage() {
  return (
    <ServicePageShell
      badge="Brand Identity & Logo Design"
      headline={<>Your Brand Is Your<br /><span className="text-primary">Most Valuable Asset</span></>}
      subtext="First impressions are permanent. We craft logos, brand systems, and visual identities that command trust, attract premium customers, and make your Kenyan business unforgettable — from Nairobi to the world."
      serviceType="marketing"
      trustStats={[
        { value: "300+", label: "Brands Created in Kenya" },
        { value: "98%", label: "Client Satisfaction Rate" },
        { value: "7 Days", label: "Average Delivery Time" },
        { value: "4.9★", label: "Average Client Rating" },
      ]}
      features={[
        {
          icon: <Palette size={20} />,
          title: "Custom Logo Design",
          desc: "Unique, scalable logos crafted from scratch — no templates. Delivered in all formats: SVG, PNG, PDF, and editable source files.",
        },
        {
          icon: <Layers size={20} />,
          title: "Full Brand System",
          desc: "Colour palettes, typography hierarchies, spacing rules, and visual tone documented in a comprehensive brand guide your whole team can use.",
        },
        {
          icon: <PenTool size={20} />,
          title: "Brand Guidelines Document",
          desc: "A professional PDF brand manual covering logo usage rules, do's and don'ts, mockups, and application examples across print and digital.",
        },
        {
          icon: <Award size={20} />,
          title: "Premium Market Positioning",
          desc: "We research your competitors and industry to position your brand at the premium end — so you attract better clients and command higher prices.",
        },
        {
          icon: <Sparkles size={20} />,
          title: "Business Card & Stationery",
          desc: "Professional business cards, letterheads, and email signatures that carry your brand identity consistently into every customer touchpoint.",
        },
        {
          icon: <FileText size={20} />,
          title: "Social Media Kit",
          desc: "Pre-sized profile images, cover photos, and post templates for Facebook, Instagram, LinkedIn, and X — ready to publish on day one.",
        },
        {
          icon: <Users size={20} />,
          title: "Competitor Brand Audit",
          desc: "We analyse your top 5 competitors' visual identity so your brand deliberately stands apart and owns a unique visual space in your market.",
        },
        {
          icon: <Globe size={20} />,
          title: "Unlimited Revisions",
          desc: "We iterate until you love every detail. Our revision process is structured but flexible — you stay in control at every design milestone.",
        },
      ]}
      plans={[
        {
          id: "brand-starter",
          name: "Starter",
          price: 25000,
          period: "once",
          features: [
            "3 logo concepts",
            "2 revision rounds",
            "Final logo in PNG, SVG, PDF",
            "Basic colour palette (3 colours)",
            "Typography recommendation",
            "5-page mini brand guide",
            "Business card design",
            "3-day delivery",
          ],
        },
        {
          id: "brand-growth-popular",
          name: "Growth",
          price: 55000,
          period: "once",
          features: [
            "5 logo concepts",
            "Unlimited revisions",
            "All file formats + editable AI/EPS",
            "Full colour palette + usage rules",
            "Typography system (primary + secondary)",
            "20-page brand guidelines PDF",
            "Business card + letterhead design",
            "Social media profile kit",
            "Email signature design",
            "5-day delivery",
          ],
        },
        {
          id: "brand-enterprise",
          name: "Enterprise",
          price: 120000,
          period: "once",
          features: [
            "Everything in Growth",
            "Competitor brand audit report",
            "Brand positioning strategy",
            "Brand naming assistance",
            "Vehicle/signage mockups",
            "Packaging design concepts",
            "Pitch deck slide template",
            "30-day post-delivery support",
            "7-day delivery",
          ],
        },
        {
          id: "brand-custom",
          name: "Custom",
          price: 0,
          period: "quote",
          features: [
            "Multi-brand / sub-brand architecture",
            "Full rebranding strategy",
            "Agency white-label option",
            "Dedicated brand strategist",
            "On-site stakeholder workshops",
            "Custom deliverables scope",
            "Priority dedicated account manager",
          ],
        },
      ]}
      addons={[
        { id: "brand-explainer", label: "Brand Story Video (60s)", price: 35000, period: "once" },
        { id: "brand-print", label: "Print-Ready Marketing Collateral Pack", price: 18000, period: "once" },
        { id: "brand-audit-ongoing", label: "Quarterly Brand Consistency Audit", price: 8000, period: "month" },
      ]}
      process={[
        { num: "01", title: "Discovery Call", desc: "We deep-dive into your business goals, target audience, competitors, and the feeling you want your brand to evoke." },
        { num: "02", title: "Concept Design", desc: "Our designers create 3–5 original logo directions with mood boards, each backed by a strategic rationale." },
        { num: "03", title: "Refine & Perfect", desc: "You choose your favourite direction and we refine every detail — colours, weight, spacing — until it's exactly right." },
        { num: "04", title: "Deliver & Launch", desc: "You receive a complete asset pack plus brand guide. We're available for 30 days post-delivery for any adjustments." },
      ]}
      whyPoints={[
        { title: "Kenya-Focused Design Intelligence", desc: "We understand local culture, colour psychology, and what resonates with Kenyan consumers across urban and rural markets." },
        { title: "Strategy Before Aesthetics", desc: "Every design decision is rooted in market research, not personal taste. Your logo communicates before a word is spoken." },
        { title: "Real Business Results", desc: "Clients who rebrand with us report 40–70% improvements in perceived value, enabling premium pricing and better client acquisition." },
        { title: "Senior Designers Only", desc: "No juniors, no outsourced freelancers. Every project is handled by an experienced brand designer with 5+ years in East Africa." },
        { title: "Fast Turnaround, Zero Compromise", desc: "Starter brands in 3 days. Enterprise projects in 7–10 days. We're fast because our process is tight — not because we cut corners." },
        { title: "You Own Everything", desc: "All source files, all intellectual property. You get every original working file — Illustrator, Figma, PDF — with full ownership transfer." },
      ]}
      faqs={[
        { q: "How many logo concepts will I receive?", a: "Depending on your plan: Starter gets 3 concepts, Growth gets 5, and Enterprise gets unlimited directions. Each concept is unique and comes with a design rationale explaining the strategic thinking behind it." },
        { q: "Can I use the logo for print materials immediately?", a: "Absolutely. You receive high-resolution print-ready files including vector formats (SVG, AI/EPS) that can be scaled to any size — from a business card to a billboard — without quality loss." },
        { q: "What if I don't like any of the initial concepts?", a: "We've never had a client leave without a logo they love. If the initial concepts miss the mark, we discuss why and redesign with new direction. Your satisfaction is guaranteed." },
        { q: "Do you understand Kenyan market aesthetics?", a: "Yes. Our team has designed brands for businesses across Nairobi, Mombasa, Kisumu, and beyond. We understand what communicates trust, professionalism, and quality to Kenyan audiences." },
        { q: "How do revisions work?", a: "Revisions are round-based on Starter (2 rounds), unlimited on Growth and above. Each revision round means you give consolidated feedback and we implement all changes before the next review." },
        { q: "Can you rebrand an existing business without losing our existing customers?", a: "Yes. Our Enterprise plan includes a full rebrand strategy that includes customer communication planning, a transition timeline, and guidelines for phasing out old assets without customer confusion." },
      ]}
      ctaHeadline="Ready to Build a Brand That Wins?"
      ctaSubtext="Your competitors are investing in their brand right now. Don't let a weak visual identity cost you clients, contracts, and credibility. Let's build something extraordinary together."
      pricingNote="One-time investment. You own all files forever. No annual fees."
      showcaseBlocks={showcaseBlocks}
    />
  );
}
