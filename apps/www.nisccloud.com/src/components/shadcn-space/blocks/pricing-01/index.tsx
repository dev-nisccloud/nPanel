import ServicePricingCards from "@/components/shadcn-space/blocks/pricing-01/service-pricing-cards.tsx";

const demoPlans = [
  {
    name: "Starter",
    description: "Perfect for individuals and small projects.",
    price: "KES 2,500",
    period: "/month",
    features: [
      "Up to 3 integrations",
      "1,000 API calls/month",
      "Community support",
      "Basic analytics",
      "Email notifications",
      "Standard setup",
    ],
    cta: "Get Started",
    highlighted: false,
  },
  {
    name: "Pro",
    description: "For growing teams that need more power.",
    price: "KES 3,800",
    period: "/month",
    features: [
      "Unlimited integrations",
      "100,000 API calls/month",
      "Priority support",
      "Advanced analytics",
      "Custom webhooks",
      "Team collaboration",
    ],
    cta: "Get Started",
    highlighted: true,
  },
  {
    name: "Custom Quote",
    description: "For organizations with advanced needs.",
    price: "Custom",
    period: "",
    features: [
      "Everything in Pro",
      "Unlimited API calls",
      "Dedicated support",
      "SLA guarantee",
      "Custom contracts",
      "On-premise option",
    ],
    cta: "Contact Sales",
    fullWidth: true,
  },
];

const Pricing01 = () => {
  return (
    <ServicePricingCards
      title="Simple, Transparent Pricing"
      subtitle="Choose the plan that fits your needs. All plans include a 14-day free trial."
      plans={demoPlans}
    />
  );
};

export default Pricing01;
