import AlternatingFeatureBlocks from "@/components/AlternatingFeatureBlocks.tsx";

const items = [
  {
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
    visual: "brand" as const,
    imageRight: true,
  },
  {
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
    visual: "uptime" as const,
    imageRight: false,
  },
  {
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
    visual: "growth" as const,
    imageRight: true,
  },
  {
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
