import ServicePageShell from "@/pages/_components/ServicePageShell.tsx";
import { niscWebsiteImage } from "@/lib/nisc-website-images.ts";
import { Palette, Layers, PenTool, Award, Sparkles, FileText, Users, Globe, CheckCircle2, Star } from "lucide-react";
import type { ShowcaseBlock } from "@/pages/_components/ServiceShowcaseSection.tsx";

const showcaseBlocks: ShowcaseBlock[] = [
  {
    tag: "Brand Strategy",
    headline: "A logo and system your team can actually use",
    body: "Your brand identity tells your story before you say a word. We craft visual systems that look professional, stay consistent, and help customers trust you faster.",
    bullets: [
      "Starter brands typically ready within a few business days",
      "All source files included: AI, EPS, SVG, PDF, and PNG",
      "Colour and type choices tuned for clarity and recognition",
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
          <div className="text-xs text-muted-foreground mb-2 font-medium">HOW WE SUPPORT YOU</div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-primary">24/7</span>
            <span className="text-xs text-muted-foreground">support available</span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-primary" style={{ width: "100%" }} />
          </div>
          <div className="flex items-center gap-1 mt-2">
            {[1,2,3,4,5].map(s => <Star key={s} size={12} className="fill-yellow-400 text-yellow-400" />)}
            <span className="text-xs text-muted-foreground ml-1">Clear feedback at every step</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    tag: "Brand Guide",
    headline: "Every detail documented. Every touchpoint consistent.",
    body: "We do not hand you a logo and disappear. You receive brand guidelines your whole team can use, from how to write headlines to how to place your logo on a dark background.",
    bullets: [
      "Full brand guidelines PDF on higher plans",
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
            <div className="text-xl font-extrabold text-primary">100+</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">Clients Helped</div>
          </div>
          <div className="flex-1 bg-white dark:bg-card rounded-xl border border-border/40 shadow p-3 text-center">
            <div className="text-xl font-extrabold text-primary">30 days</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">Post-delivery support</div>
          </div>
        </div>
      </div>
    ),
  },
  {
    tag: "Clear Positioning",
    headline: "Look premium. Stay consistent. Earn trust.",
    body: "Professional branding helps customers take you seriously and makes every ad, website, and social post feel like the same business. We focus on clarity, consistency, and practical assets you can use right away.",
    bullets: [
      "Competitor brand audit included on Enterprise plan",
      "Brand positioning that explains what makes you different",
      "Packaging, signage, and vehicle wrap mockups available",
    ],
    mockupRight: true,
    mockup: (
      <div className="space-y-3">
        <div className="bg-white dark:bg-card rounded-2xl p-4 border border-border/40 shadow-md">
          <div className="text-xs text-muted-foreground mb-2 font-semibold uppercase tracking-wide">What You Get</div>
          <div className="space-y-2">
            {[["Logo system","Complete"],["Colour & type","Documented"],["Usage rules","Ready to share"]].map(([label, status]) => (
              <div key={String(label)} className="flex justify-between text-xs">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-bold text-primary">{status}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white dark:bg-card rounded-2xl p-4 border border-border/40 shadow-md flex items-center gap-3">
          <CheckCircle2 size={28} className="text-primary shrink-0" />
          <div>
            <div className="font-bold text-sm">Free setup help</div>
            <div className="text-xs text-muted-foreground">We walk you through files and usage</div>
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
      subtext="First impressions matter. We craft logos, brand systems, and visual identities that help people trust you, recognise you, and choose you with confidence."
      serviceType="marketing"
      checkoutServiceType="brand_identity"
      checkoutProductName="Brand Identity"
      heroImage={niscWebsiteImage("brand_identity.png")}
      heroImageStandalone
      trustStats={[
        { value: "100+", label: "Clients We Have Helped" },
        { value: "24/7", label: "Support Available" },
        { value: "30 days", label: "Post-Delivery Support" },
        { value: "Clear", label: "Files & Brand Guides" },
      ]}
      features={[
        {
          icon: <Palette size={20} />,
          title: "Custom Logo Design",
          desc: "Unique, scalable logos crafted from scratch, not templates. Delivered in all formats: SVG, PNG, PDF, and editable source files.",
        },
        {
          icon: <Layers size={20} />,
          title: "Full Brand System",
          desc: "Colour palettes, typography hierarchies, spacing rules, and visual tone documented in a brand guide your whole team can use.",
        },
        {
          icon: <PenTool size={20} />,
          title: "Brand Guidelines Document",
          desc: "A professional PDF brand manual covering logo usage rules, do's and don'ts, mockups, and application examples across print and digital.",
        },
        {
          icon: <Award size={20} />,
          title: "Clear Market Positioning",
          desc: "We research your competitors and industry so your brand stands apart and attracts the customers you want.",
        },
        {
          icon: <Sparkles size={20} />,
          title: "Business Card & Stationery",
          desc: "Professional business cards, letterheads, and email signatures that carry your brand identity into every customer touchpoint.",
        },
        {
          icon: <FileText size={20} />,
          title: "Social Media Kit",
          desc: "Pre-sized profile images, cover photos, and post templates for Facebook, Instagram, LinkedIn, and X, ready to publish on day one.",
        },
        {
          icon: <Users size={20} />,
          title: "Competitor Brand Audit",
          desc: "We review your top competitors' visual identity so your brand deliberately stands apart and owns a clear visual space.",
        },
        {
          icon: <Globe size={20} />,
          title: "Unlimited Revisions",
          desc: "We iterate until you love every detail. Our revision process is structured but flexible, so you stay in control at every design milestone.",
        },
      ]}
      plans={[
        {
          id: "brand-starter",
          name: "Starter",
          price: 25000,
          period: "once",
          features: [
            "Custom logo design (3 concepts)",
            "Logo files in all formats (PNG, SVG, PDF)",
            "Colour palette + typography system",
            "Mini brand guide (5 pages)",
            "Business card design included",
            "Delivered in 5 business days",
          ],
        },
        {
          id: "brand-enterprise",
          name: "Enterprise",
          price: 120000,
          period: "once",
          features: [
            "Everything in Starter",
            "Full brand guidelines PDF (20+ pages)",
            "Competitor brand audit report",
            "Brand positioning strategy",
            "Social media profile kit",
            "30-day post-delivery support",
          ],
        },
      ]}
      addons={[
        { id: "brand-explainer", label: "Brand Story Video (60s)", price: 35000, period: "once" },
        { id: "brand-print", label: "Print-Ready Marketing Collateral Pack", price: 18000, period: "once" },
        { id: "brand-audit-ongoing", label: "Quarterly Brand Consistency Audit", price: 8000, period: "month" },
      ]}
      process={[
        { num: "01", title: "Discovery Call", desc: "We dig into your business goals, target audience, competitors, and the feeling you want your brand to create." },
        { num: "02", title: "Concept Design", desc: "Our designers create 3 to 5 original logo directions with mood boards, each backed by a clear rationale." },
        { num: "03", title: "Refine & Perfect", desc: "You choose your favourite direction and we refine every detail: colours, weight, spacing, until it feels right." },
        { num: "04", title: "Deliver & Launch", desc: "You receive a complete asset pack plus brand guide. We stay available for 30 days after delivery for adjustments." },
      ]}
      whyPoints={[
        { title: "Local Market Understanding", desc: "We understand local culture, colour psychology, and what communicates trust and quality to Kenyan audiences." },
        { title: "Strategy Before Aesthetics", desc: "Every design decision is rooted in research, not personal taste. Your logo should communicate before a word is spoken." },
        { title: "Practical Business Assets", desc: "You leave with files, guidelines, and templates you can use across your website, social, and print materials right away." },
        { title: "Experienced Designers", desc: "Every project is handled by an experienced brand designer. You work with people who know how to run a clear process." },
        { title: "Fast Turnaround, Clear Process", desc: "Starter brands in a few days. Enterprise projects in about 7 to 10 days. We move quickly because the process is tight, not because we cut corners." },
        { title: "You Own Everything", desc: "All source files, all intellectual property. You get every original working file with full ownership transfer." },
      ]}
      faqs={[
        { q: "How many logo concepts will I receive?", a: "Depending on your plan: Starter gets 3 concepts, Growth gets 5, and Enterprise gets unlimited directions. Each concept is unique and comes with a design rationale explaining the thinking behind it." },
        { q: "Can I use the logo for print materials immediately?", a: "Yes. You receive high-resolution print-ready files including vector formats (SVG, AI/EPS) that can be scaled to any size, from a business card to a billboard, without quality loss." },
        { q: "What if I don't like any of the initial concepts?", a: "If the initial concepts miss the mark, we discuss why and redesign with a new direction. Your satisfaction matters, and we keep refining until it feels right." },
        { q: "Do you understand Kenyan market aesthetics?", a: "Yes. Our team has designed brands for businesses across Kenya. We understand what communicates trust, professionalism, and quality to local audiences." },
        { q: "How do revisions work?", a: "Revisions are round-based on Starter (2 rounds), unlimited on Growth and above. Each revision round means you give consolidated feedback and we implement all changes before the next review." },
        { q: "Can you rebrand an existing business without losing our existing customers?", a: "Yes. Our Enterprise plan includes a rebrand approach with customer communication planning, a transition timeline, and guidelines for phasing out old assets without confusing customers." },
      ]}
      ctaHeadline="Ready to Build a Brand People Trust?"
      ctaSubtext="A clear visual identity helps you win clients, contracts, and credibility. Let's build something professional and useful together."
      pricingNote="One-time investment. You own all files forever. No annual fees."
      showcaseBlocks={showcaseBlocks}
    />
  );
}
