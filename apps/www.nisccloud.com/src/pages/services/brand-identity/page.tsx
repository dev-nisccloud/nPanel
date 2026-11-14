import ServicePageShell from "@/pages/_components/ServicePageShell.tsx";
import ProjectEnquiryFlow from "@/components/ProjectEnquiryFlow.tsx";
import { BRAND_OFFER } from "@/lib/project-packages.ts";
import { niscWebsiteImage } from "@/lib/nisc-website-images.ts";
import { Palette, Layers, PenTool, Award, Sparkles, FileText, Users, Globe } from "lucide-react";
import type { ShowcaseBlock } from "@/pages/_components/ServiceShowcaseSection.tsx";

const showcaseBlocks: ShowcaseBlock[] = [
  {
    tag: "Brand Strategy",
    headline: "A clear position before a new visual identity",
    body: "We clarify who the brand serves, what it should stand for and how it should communicate before developing the visual system.",
    bullets: [
      "Audience, category and competitor context",
      "Positioning, value proposition and messaging direction",
      "A written strategy your team can review and approve",
    ],
    mockupRight: true,
    visual: "brand",
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
    visual: "clarity",
  },
  {
    tag: "Clear Positioning",
    headline: "Refresh what works, or reframe what no longer fits.",
    body: "A refresh improves recognition without discarding useful equity. A rebrand addresses a deeper change in audience, offer, market position or business direction.",
    bullets: [
      "A recommendation based on business need, not design preference",
      "A rollout approach for teams and customer touchpoints",
      "Packaging, signage and campaign applications scoped separately",
    ],
    mockupRight: true,
    visual: "trust",
  },
];

export default function BrandIdentityPage() {
  return (
    <ServicePageShell
      badge="Brand Identity & Logo Design"
      headline={<>Strategy and identity for a <br /><span className="text-primary">brand people can understand</span></>}
      subtext="Clarify your position, message and visual system so customers recognise what makes your business relevant—and your team can express it consistently."
      serviceType="marketing"
      checkoutServiceType="brand_identity"
      checkoutProductName="Brand Identity"
      heroImage={niscWebsiteImage("brand_identity.png")}
      heroImageStandalone
      trustStats={[
        { value: "Yours", label: "All Source Files" },
        { value: "Clear", label: "Approval Stages" },
        { value: "Practical", label: "Guides & Templates" },
        { value: "Scoped", label: "Rollout Support" },
      ]}
      features={[
        {
          icon: <Palette size={20} />,
          title: "Custom logo design",
          desc: "Unique, scalable logos crafted from scratch, not templates. Delivered in all formats: SVG, PNG, PDF, and editable source files.",
        },
        {
          icon: <Layers size={20} />,
          title: "Full brand system",
          desc: "Colour palettes, typography hierarchies, spacing rules, and visual tone documented in a brand guide your whole team can use.",
        },
        {
          icon: <PenTool size={20} />,
          title: "Brand guidelines document",
          desc: "A professional PDF brand manual covering logo usage rules, do's and don'ts, mockups, and application examples across print and digital.",
        },
        {
          icon: <Award size={20} />,
          title: "Positioning & value proposition",
          desc: "Define the audience, category, difference and value your brand should communicate before visual design begins.",
        },
        {
          icon: <Sparkles size={20} />,
          title: "Business card & stationery",
          desc: "Professional business cards, letterheads, and email signatures that carry your brand identity into every customer touchpoint.",
        },
        {
          icon: <FileText size={20} />,
          title: "Social media kit",
          desc: "Pre-sized profile images, cover photos, and post templates for Facebook, Instagram, LinkedIn, and X, ready to publish on day one.",
        },
        {
          icon: <Users size={20} />,
          title: "Audience & category insight",
          desc: "Review customer needs, alternatives and category conventions to identify useful opportunities for distinction.",
        },
        {
          icon: <Globe size={20} />,
          title: "Rollout & governance",
          desc: "Document approval, ownership and usage rules so internal teams and external partners can apply the brand consistently.",
        },
      ]}
      plans={[]}
      customPlansSection={<ProjectEnquiryFlow offer={BRAND_OFFER} />}
      strategySections={[
        {
          eyebrow: "When to consider it",
          title: "Use strategy when the business has outgrown the current story.",
          desc: "A strategic engagement is useful when customers misunderstand the offer, teams describe it differently, a new market is opening, or the identity no longer reflects the business.",
          items: [
            "A new offer, audience or market needs a clearer position",
            "Sales, marketing and leadership use inconsistent messages",
            "The current identity limits credibility or recognition",
          ],
        },
        {
          eyebrow: "Positioning versus marketing",
          title: "Positioning defines the meaning. Marketing carries it to market.",
          desc: "Brand strategy establishes who the business is for, the problem it is best placed to solve and why it should be chosen. Campaigns then turn that foundation into demand.",
          items: [
            "Positioning and value proposition",
            "Messaging hierarchy and verbal direction",
            "Campaign briefs grounded in one approved foundation",
          ],
        },
        {
          eyebrow: "Refresh or rebrand",
          title: "Change only as much as the business requires.",
          desc: "A refresh improves consistency and expression while retaining useful equity. A full rebrand is appropriate when the business model, audience, offer or reputation needs a deeper reset.",
          items: [
            "Brand audit and change recommendation",
            "Customer and team transition considerations",
            "Phased rollout across priority touchpoints",
          ],
        },
        {
          eyebrow: "What the work can include",
          title: "A system your team can operate after launch.",
          desc: "The final scope is agreed before work begins and separates core strategy, identity, applications and rollout support.",
          items: [
            "Audience, category, positioning and messaging foundation",
            "Visual identity, guidelines and approved source assets",
            "Governance, templates and rollout plan where scoped",
          ],
        },
      ]}
      process={[
        { num: "01", title: "Discover", desc: "Align stakeholders on the business, audience, category, goals and constraints." },
        { num: "02", title: "Define", desc: "Develop the positioning, value proposition and messaging foundation for approval." },
        { num: "03", title: "Design", desc: "Translate the approved strategy into identity directions and practical applications." },
        { num: "04", title: "Deliver", desc: "Handover the agreed files, guidance and rollout plan with clear ownership and next steps." },
      ]}
      whyPoints={[
        { title: "Market context, not assumptions", desc: "We consider the audience, category and market evidence relevant to the brief rather than relying on generic design trends.", visual: "localMarket" },
        { title: "Strategy before aesthetics", desc: "Every design decision is rooted in research, not personal taste. Your logo should communicate before a word is spoken.", visual: "strategy" },
        { title: "Practical business assets", desc: "You leave with files, guidelines, and templates you can use across your website, social, and print materials right away.", visual: "assets" },
        { title: "Experienced designers", desc: "Every project is handled by an experienced brand designer. You work with people who know how to run a clear process.", visual: "craft" },
        { title: "Approval gates and governance", desc: "Strategy, direction and final applications are reviewed at clear milestones so decisions do not get lost in subjective revision cycles.", visual: "process" },
        { title: "Clear ownership and handover", desc: "Once agreed invoices are paid, you own the approved deliverables listed in your proposal, subject to third-party licence terms. The proposal also states which source files are included.", visual: "ownership" },
      ]}
      faqs={[
        { q: "How many logo concepts will I receive?", a: "Small Business includes three concepts. Corporate directions and review stages are agreed in the project brief before work begins." },
        { q: "Can I use the logo for print materials immediately?", a: "Yes. You receive high-resolution print-ready files including vector formats (SVG, AI/EPS) that can be scaled to any size, from a business card to a billboard, without quality loss." },
        { q: "What if the initial direction misses the brief?", a: "We review the approved strategy and your consolidated feedback, then agree the correction within the revision scope documented in your proposal." },
        { q: "Can the strategy work beyond Kenya?", a: "Yes. The work is based on the audience, category and markets in your brief. Kenya-specific context can inform the strategy without limiting the brand to a local-agency position." },
        { q: "How do revisions work?", a: "Small Business includes two revision rounds. Growth and Corporate rounds are agreed in the proposal. Each round means you give consolidated feedback and we implement those changes before the next review." },
        { q: "Can you rebrand an existing business without losing our existing customers?", a: "Yes. A Corporate project can include a rebrand approach with customer communication planning, a transition timeline, and guidelines for phasing out old assets." },
      ]}
      ctaHeadline="Ready to build a brand people trust?"
      ctaSubtext="A clear visual identity helps you win clients, contracts, and credibility. Let's build something professional and useful together."
      showcaseBlocks={showcaseBlocks}
    />
  );
}
