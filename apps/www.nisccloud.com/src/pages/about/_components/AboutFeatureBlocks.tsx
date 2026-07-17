import AlternatingFeatureBlocks from "@/components/AlternatingFeatureBlocks.tsx";
import { CheckCircle2, Users, Headphones } from "lucide-react";

const items = [
  {
    tag: "WHY WE EXIST",
    tagColor: "#3b82f6",
    headline: "We started because businesses like yours deserved better",
    description:
      "Too many capable businesses were held back by unreliable hosting and marketing that never connected. We built one team to fix both.",
    bullets: [
      "Built to help businesses of every size compete online",
      "Designers, marketers, and engineers on one team",
      "Hosting and marketing planned to work together",
      "We measure ourselves by your results",
    ],
    stat: { value: "100+", label: "businesses growing with us" },
    imageUrl: "https://hercules-cdn.com/file_Ddgao10TeysogQKGKmCLMije",
    imageAlt: "Team dashboard",
    imageRight: true,
    badge: { icon: Users, text: "One team for hosting and marketing", color: "#3b82f6" },
  },
  {
    tag: "OUR PROMISE",
    tagColor: "#10b981",
    headline: "One team that handles everything and genuinely cares",
    description:
      "No more chasing five vendors. No more strategy meetings that lead nowhere. One team owns your hosting and marketing, and you will feel the difference from day one.",
    bullets: [
      "Single point of contact, no department ping-pong",
      "Strategy, creative, tech, and marketing on one team",
      "Clear progress updates and transparent reporting",
      "Free migration and setup help when you join us",
    ],
    stat: { value: "24/7", label: "support when you need help" },
    imageUrl: "https://hercules-cdn.com/file_CyApk5qfxRD50robzU6umkV5",
    imageAlt: "Strategy and account management",
    imageRight: false,
    badge: { icon: Headphones, text: "Real people, real support", color: "#10b981" },
  },
  {
    tag: "OUR METHOD",
    tagColor: "#8b5cf6",
    headline: "The Atom Approach: four steps, zero gaps",
    description:
      "Most agencies pick one thing they are good at. We built a complete path: create your brand, host it reliably, market it clearly, then automate the work that should run on its own.",
    bullets: [
      "Create: brand, website, and identity",
      "Host: reliable cloud hosting and business email",
      "Market: SEO, paid ads, social, and email working together",
      "Automate: AI and workflows that keep growing for you",
    ],
    stat: { value: "30-day", label: "results focus, or we keep working" },
    imageUrl: "https://hercules-cdn.com/file_53JVa6cfTRen7L8auPX8h3a6",
    imageAlt: "4-step Atom Approach framework",
    imageRight: true,
    badge: { icon: CheckCircle2, text: "Clear 4-step framework", color: "#8b5cf6" },
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
