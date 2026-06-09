import AlternatingFeatureBlocks from "@/components/AlternatingFeatureBlocks.tsx";
import { CheckCircle2, Users, Star } from "lucide-react";

const items = [
  {
    tag: "WHY WE EXIST",
    tagColor: "#3b82f6",
    headline: "We started because businesses like yours deserved better",
    description:
      "We saw too many talented entrepreneurs with great products losing to less capable competitors — simply because they lacked the right online presence and strategy. We decided to change that.",
    bullets: [
      "Founded to level the playing field for local businesses",
      "Built by marketers, designers & engineers who've seen both sides",
      "Every service designed around real Kenyan business challenges",
      "We measure ourselves by your results, nothing else",
    ],
    stat: { value: "300+", label: "businesses launched & growing" },
    imageUrl: "https://hercules-cdn.com/file_Ddgao10TeysogQKGKmCLMije",
    imageAlt: "Nisc Cloud team dashboard",
    imageRight: true,
    badge: { icon: Users, text: "Real team, real results", color: "#3b82f6" },
  },
  {
    tag: "OUR PROMISE",
    tagColor: "#10b981",
    headline: "One team that handles everything — and genuinely cares",
    description:
      "No more chasing five vendors. No more strategy meetings that lead nowhere. With Nisc Cloud, one team owns every part of your digital growth — and you'll feel the difference from day one.",
    bullets: [
      "Single point of contact — no department ping-pong",
      "Strategy, creative, tech & marketing under one roof",
      "Weekly progress updates, transparent reporting",
      "We treat your budget like it's our own money",
    ],
    stat: { value: "97%", label: "client retention rate" },
    imageUrl: "https://hercules-cdn.com/file_CyApk5qfxRD50robzU6umkV5",
    imageAlt: "Strategy and account management dashboard",
    imageRight: false,
    badge: { icon: Star, text: "4.9/5 average rating", color: "#f59e0b" },
  },
  {
    tag: "OUR METHOD",
    tagColor: "#8b5cf6",
    headline: "The Atom Approach — four steps, zero gaps",
    description:
      "Most agencies pick one thing they're good at. We built a complete system: Create your brand, take you online, market you to the right people, then automate your growth. It's a sequence that compounds.",
    bullets: [
      "Create — brand, website, and identity in 7 days",
      "Host — always-on cloud infrastructure and business email",
      "Market — SEO, paid ads, social, and email working together",
      "Automate — AI and workflows growing your business 24/7",
    ],
    stat: { value: "4×", label: "average return on ad spend" },
    imageUrl: "https://hercules-cdn.com/file_53JVa6cfTRen7L8auPX8h3a6",
    imageAlt: "4-step Atom Approach framework dashboard",
    imageRight: true,
    badge: { icon: CheckCircle2, text: "Proven 4-step framework", color: "#8b5cf6" },
  },
];

export default function AboutFeatureBlocks() {
  return (
    <section className="py-20 border-t border-border/40">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <AlternatingFeatureBlocks items={items} />
      </div>
    </section>
  );
}
