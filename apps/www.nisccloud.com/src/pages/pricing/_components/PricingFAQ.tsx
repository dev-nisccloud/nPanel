import FaqBlock from "@/components/shadcn-space/blocks/faq-01/faq.tsx";

const faqs = [
  {
    question: "Can I switch plans later?",
    answer: "Absolutely. You can upgrade or downgrade your plan at any time. Changes take effect at the start of your next billing cycle. Our team will help you transition smoothly.",
  },
  {
    question: "Is there a setup or onboarding fee?",
    answer: "No. Every plan includes a free onboarding session and strategy call. We do not charge setup fees  the price you see is the price you pay.",
  },
  {
    question: "What does 'managed cloud hosting' include?",
    answer: "Our managed hosting covers server provisioning, SSL, CDN, daily automated backups, uptime monitoring, security patches, and zero-downtime deployments. You never touch a server.",
  },
  {
    question: "How long until my website is live?",
    answer: "For Launchpad plans, expect your first design concepts within 48 hours of onboarding and a live website within 2–3 weeks. Orbit and Galaxy timelines are discussed during your strategy call.",
  },
  {
    question: "Do I own my website and brand assets?",
    answer: "Yes  completely. Once your project is delivered, all brand files, website code, and creative assets are yours. If you ever leave, we provide a full handover package.",
  },
  {
    question: "Can I cancel at any time?",
    answer: "Monthly plans can be cancelled with 30 days' notice. Annual plans are non-refundable but we'll always work with you to get value from your remaining term.",
  },
  {
    question: "What platforms do you manage for social media?",
    answer: "We manage Instagram, Facebook, LinkedIn, X (Twitter), TikTok, and YouTube. Each plan specifies the number of platforms included.",
  },
  {
    question: "Do you work with businesses outside Kenya?",
    answer: "Yes  we're remote-first and work with clients worldwide. Our team operates across multiple time zones and all communication is handled digitally.",
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
