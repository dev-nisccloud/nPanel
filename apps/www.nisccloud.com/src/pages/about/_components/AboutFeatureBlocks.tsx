import AlternatingFeatureBlocks from "@/components/AlternatingFeatureBlocks.tsx";

const items = [
  {
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
    visual: "trust" as const,
    imageRight: true,
  },
  {
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
    visual: "support" as const,
    imageRight: false,
  },
  {
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
    visual: "process" as const,
    imageRight: true,
  },
];

export default function AboutFeatureBlocks() {
  return (
    <section className="border-t border-border/40 py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <AlternatingFeatureBlocks items={items} />
      </div>
    </section>
  );
}
