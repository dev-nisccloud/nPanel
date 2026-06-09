import AlternatingFeatureBlocks from "@/components/AlternatingFeatureBlocks.tsx";
import { Paintbrush, Server, TrendingUp, Bot } from "lucide-react";

const items = [
  {
    tag: "01 — CREATE",
    tagColor: "#3b82f6",
    headline: "We create & position your brand to win",
    description:
      "Before you can compete, you need a brand that commands attention and earns trust immediately. We craft every visual and verbal element — your logo, website, and voice — so your business looks like the obvious choice.",
    bullets: [
      "Logo, color palette & full visual identity",
      "Custom website designed to convert visitors into customers",
      "Compelling copy that speaks to your exact audience",
      "Brand guidelines so everything stays consistent",
      "Delivered in 7 days — not 7 months",
    ],
    stat: { value: "7 days", label: "brand delivered & live" },
    imageUrl: "https://hercules-cdn.com/file_dsJ6msxASR0iwMgZUbaSIVyW",
    imageAlt: "Brand design and creation dashboard",
    imageRight: true,
    badge: { icon: Paintbrush, text: "Brand ready in 7 days", color: "#3b82f6" },
  },
  {
    tag: "02 — HOST",
    tagColor: "#06b6d4",
    headline: "We take your business online & build real credibility",
    description:
      "A great website means nothing if it goes down or loads slowly. We put your business on enterprise-grade cloud infrastructure — fast, secure, and always available — with a professional email that completes the picture.",
    bullets: [
      "Managed cloud hosting with 99.9% uptime guarantee",
      "Business email at your domain (info@yourbusiness.co.ke)",
      "Free SSL certificate — the padlock customers look for",
      "Daily automated backups and DDoS protection",
      "Live in under 24 hours",
    ],
    stat: { value: "99.9%", label: "uptime — we never go offline" },
    imageUrl: "https://hercules-cdn.com/file_pKLYpmvgblyzJ2o57ONxd5L2",
    imageAlt: "Cloud server infrastructure dashboard",
    imageRight: false,
    badge: { icon: Server, text: "Always online, always fast", color: "#06b6d4" },
  },
  {
    tag: "03 — MARKET",
    tagColor: "#8b5cf6",
    headline: "We put you in front of the right people",
    description:
      "Having a great brand online is only half the battle. We drive real, paying customers to you through a full-stack marketing engine — SEO, paid ads, social media, and email — all working together and tracked obsessively.",
    bullets: [
      "SEO that gets you ranking on Google in Kenya and beyond",
      "Google, Meta & TikTok ads managed for maximum ROAS",
      "Social media content, scheduling & community management",
      "Email campaigns that nurture leads into loyal customers",
      "Live reporting dashboard — see exactly where every lead comes from",
    ],
    stat: { value: "4.2×", label: "average return on ad spend" },
    imageUrl: "https://hercules-cdn.com/file_S6KC8vtS1HpomrwzArDDvgJQ",
    imageAlt: "Digital marketing analytics dashboard",
    imageRight: true,
    badge: { icon: TrendingUp, text: "First leads in 30 days", color: "#8b5cf6" },
  },
  {
    tag: "04 — AUTOMATE",
    tagColor: "#10b981",
    headline: "We help your business grow while you sleep",
    description:
      "The businesses growing fastest in Kenya aren't working harder — they're working smarter. We set up AI chatbots, automated follow-up sequences, and smart CRM workflows that respond to every lead in 90 seconds, day or night.",
    bullets: [
      "AI chatbot that answers questions and qualifies leads instantly",
      "Automated email & WhatsApp follow-up sequences",
      "CRM workflows that move leads through your sales process",
      "AI-generated content and campaign creation",
      "Monthly automation audit — always improving",
    ],
    stat: { value: "90 sec", label: "AI lead response time" },
    imageUrl: "https://hercules-cdn.com/file_GuxQlsmKkjML1cKcuwtqBgue",
    imageAlt: "AI automation dashboard",
    imageRight: false,
    badge: { icon: Bot, text: "AI active 24/7", color: "#10b981" },
  },
];

export default function ServicesFeatureBlocks() {
  return (
    <section className="py-20 border-t border-border/40">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <AlternatingFeatureBlocks items={items} />
      </div>
    </section>
  );
}
