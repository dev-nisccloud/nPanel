import AlternatingFeatureBlocks from "@/components/AlternatingFeatureBlocks.tsx";
import { Paintbrush, Server, TrendingUp, Bot } from "lucide-react";

const items = [
  {
    tag: "01 - CREATE",
    tagColor: "#3b82f6",
    headline: "We create and position your brand clearly",
    description:
      "Before you can compete, you need a brand that looks professional and earns trust. We craft your logo, website, and voice so your business looks like a clear choice for your customers.",
    bullets: [
      "Logo, colour palette and full visual identity",
      "Custom website designed to turn visitors into customers",
      "Clear copy that speaks to your exact audience",
      "Brand guidelines so everything stays consistent",
      "Starter brands delivered in about 7 days",
    ],
    stat: { value: "7 days", label: "typical brand delivery" },
    imageUrl: "https://hercules-cdn.com/file_dsJ6msxASR0iwMgZUbaSIVyW",
    imageAlt: "Brand design and creation dashboard",
    imageRight: true,
    badge: { icon: Paintbrush, text: "Brand ready in 7 days", color: "#3b82f6" },
  },
  {
    tag: "02 - HOST",
    tagColor: "#06b6d4",
    headline: "We take your business online and keep it reliable",
    description:
      "A great website means nothing if it goes down or loads slowly. We host you on solid cloud infrastructure that is fast, secure, and available, with professional email that matches your domain.",
    bullets: [
      "Managed cloud hosting with 99.99% uptime",
      "Business email at your domain (info@yourbusiness.co.ke)",
      "Free SSL certificate so visitors see the padlock",
      "Daily automated backups and DDoS protection",
      "Free setup help so you can go live quickly",
    ],
    stat: { value: "99.99%", label: "uptime we aim to deliver" },
    imageUrl: "https://hercules-cdn.com/file_pKLYpmvgblyzJ2o57ONxd5L2",
    imageAlt: "Cloud server infrastructure dashboard",
    imageRight: false,
    badge: { icon: Server, text: "Always online, always fast", color: "#06b6d4" },
  },
  {
    tag: "03 - MARKET",
    tagColor: "#8b5cf6",
    headline: "We put you in front of the right people",
    description:
      "Having a strong brand online is only half the work. We help people find you through SEO, paid ads, social media, and email, with clear reporting so you see what is working.",
    bullets: [
      "SEO that helps people find you on Google, Maps, and AI answers",
      "Google, Meta and TikTok ads managed for real leads and sales",
      "Social media content, scheduling and community management",
      "Email campaigns that nurture leads into customers",
      "Clear reporting so you know where every lead comes from",
    ],
    stat: { value: "30 days", label: "results promise on active work" },
    imageUrl: "https://hercules-cdn.com/file_S6KC8vtS1HpomrwzArDDvgJQ",
    imageAlt: "Digital marketing analytics dashboard",
    imageRight: true,
    badge: { icon: TrendingUp, text: "Results focus in 30 days", color: "#8b5cf6" },
  },
  {
    tag: "04 - AUTOMATE",
    tagColor: "#10b981",
    headline: "We help your business follow up without the grind",
    description:
      "We set up AI chatbots, automated follow-up sequences, and CRM workflows that reply to leads quickly, day or night, so your team can focus on closing and serving customers.",
    bullets: [
      "AI chatbot that answers questions and qualifies leads",
      "Automated email and WhatsApp follow-up sequences",
      "CRM workflows that move leads through your sales process",
      "Clear reporting on conversations, leads and bookings",
      "24/7 availability with human handoff when needed",
    ],
    stat: { value: "24/7", label: "AI and support coverage" },
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
