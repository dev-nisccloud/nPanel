import AlternatingFeatureBlocks from "@/components/AlternatingFeatureBlocks.tsx";

const items = [
  {
    headline: "Build the brand, software and customer experience",
    description:
      "Before you can compete, you need a brand that looks professional and earns trust. We craft your logo, website, and voice so your business looks like a clear choice for your customers.",
    bullets: [
      "Logo, colour palette and full visual identity",
      "Custom website designed to turn visitors into customers",
      "Clear copy that speaks to your exact audience",
      "Brand guidelines so everything stays consistent",
      "Scope, delivery stages and ownership agreed before work begins",
    ],
    stat: { value: "Build", label: "strategy, design and software" },
    visual: "brand" as const,
    imageRight: true,
  },
  {
    headline: "Run the infrastructure and operations behind it",
    description:
      "A great website means nothing if it goes down or loads slowly. We host you on solid cloud infrastructure that is fast, secure, and available, with professional email that matches your domain.",
    bullets: [
      "Managed cloud hosting with a 99.9% uptime target",
      "Business email at your domain (info@yourbusiness.co.ke)",
      "Free SSL certificate so visitors see the padlock",
      "Backup and DDoS controls where included in the selected plan",
      "Setup responsibilities confirmed for your selected plan",
    ],
    stat: { value: "99.9%", label: "monthly uptime target" },
    visual: "uptime" as const,
    imageRight: false,
  },
  {
    headline: "Grow through connected search and campaigns",
    description:
      "Having a strong brand online is only half the work. We help people find you through SEO, paid ads, social media, and email, with clear reporting so you see what is working.",
    bullets: [
      "SEO that helps people find you on Google, Maps, and AI answers",
      "Google, Meta and TikTok campaigns tied to agreed measures",
      "Social media content, scheduling and community management",
      "Email campaigns that nurture leads into customers",
      "Clear reporting so you know where every lead comes from",
    ],
    stat: { value: "Free", label: "strategy call before you commit" },
    visual: "growth" as const,
    imageRight: true,
  },
  {
    headline: "Automation supports Build, Run and Grow",
    description:
      "Use approved automation for supported conversations, follow-up and operational tasks. Your team controls the context, reviews outputs and keeps a human path for work that needs judgement.",
    bullets: [
      "Zepo assistance for supported customer and service questions",
      "Email sequences and integrations scoped to the selected tools",
      "Workflow recommendations reviewed before activation",
      "Clear activity records and escalation paths",
      "Capabilities confirmed for your account and service",
    ],
    stat: { value: "Across", label: "Build, Run and Grow" },
    visual: "automation" as const,
    imageRight: false,
  },
];

export default function ServicesFeatureBlocks() {
  return (
    <section className="py-20 bg-background">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <AlternatingFeatureBlocks items={items} />
      </div>
    </section>
  );
}
