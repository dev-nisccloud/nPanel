import AlternatingFeatureBlocks from "@/components/AlternatingFeatureBlocks.tsx";

const items = [
  {
    headline: "Connected technology, without disconnected vendors",
    description:
      "Nisc Cloud brings the technology behind your business into one accountable relationship, from the experience customers see to the infrastructure that keeps it running.",
    bullets: [
      "Brand, websites, ecommerce and software",
      "Domains, hosting, email and cloud infrastructure",
      "Search, content and digital campaigns",
      "Connected service management through nPanel",
    ],
    stat: { value: "One", label: "technology relationship" },
    visual: "trust" as const,
    imageRight: true,
  },
  {
    headline: "One accountable team across the journey",
    description:
      "Start with the product or service you need now, then add connected capabilities as your business changes.",
    bullets: [
      "A clear route for self-service cloud products",
      "Scoped proposals for managed business services",
      "Project, billing and support visibility through nPanel",
      "Specialists across cloud, software and digital growth",
    ],
    stat: { value: "Two", label: "clear ways to get started" },
    visual: "support" as const,
    imageRight: false,
  },
  {
    headline: "Build. Run. Grow. One connected approach.",
    description:
      "The three pillars describe the job Nisc Cloud performs at each stage. Automation supports work across them; it is not a separate fourth pillar.",
    bullets: [
      "Build: brands, websites, ecommerce and software",
      "Run: domains, hosting, email, servers and security",
      "Grow: search, advertising, content and engagement",
      "Automate: support useful work across all three pillars",
    ],
    stat: { value: "3", label: "connected pillars" },
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
