import FaqBlock from "@/components/shadcn-space/blocks/faq-01/faq.tsx";

const faqs = [
  {
    question: "Can I switch plans later?",
    answer: "Yes. You can upgrade or downgrade at any time. Changes take effect at the start of your next billing cycle, and our team will help you move smoothly.",
  },
  {
    question: "Is there a setup or onboarding fee?",
    answer: "No. Every plan includes free setup help and an onboarding session. The price you see is the price you pay.",
  },
  {
    question: "What does managed cloud hosting include?",
    answer: "Managed hosting covers server setup, SSL, CDN, daily automated backups, uptime monitoring, security patches, and careful deployments. You do not need to manage the server yourself. We target 99.99% uptime.",
  },
  {
    question: "How long until my website is live?",
    answer: "For Launchpad plans, expect first design concepts within 48 hours of onboarding and a live website within 2 to 3 weeks. Orbit and Galaxy timelines are discussed on your strategy call.",
  },
  {
    question: "Do I own my website and brand assets?",
    answer: "Yes, completely. Once your project is delivered, all brand files, website code, and creative assets are yours. If you leave, we provide a full handover package.",
  },
  {
    question: "Can I cancel at any time?",
    answer: "Monthly plans can be cancelled with 30 days notice. Annual plans are non-refundable, but we will always work with you to get value from your remaining term.",
  },
  {
    question: "What platforms do you manage for social media?",
    answer: "We manage Instagram, Facebook, LinkedIn, X (Twitter), TikTok, and YouTube. Each plan specifies how many platforms are included.",
  },
  {
    question: "Do you work with businesses outside Kenya?",
    answer: "Yes. We are based in Nairobi, Kenya. All communication is handled digitally, and support is available 24/7.",
  },
  {
    question: "Can you migrate my existing site?",
    answer: "Yes. Free migration is included when you move hosting to us. Our team handles the move and helps with setup so you stay online.",
  },
];

export default function PricingFAQ() {
  return (
    <FaqBlock
      faqs={faqs}
      badge="Pricing FAQ"
      title="Common questions about our plans"
    />
  );
}
