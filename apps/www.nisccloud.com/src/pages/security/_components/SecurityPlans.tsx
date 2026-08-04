import { ServiceMockPricingSection } from "@/components/shadcn-space/blocks/pricing-01/service-mock-pricing.tsx";
import type { OrderPlan } from "@/pages/hosting/_components/OrderDialog.tsx";

const defaultPlans: OrderPlan[] = [
  {
    id: "standard",
    name: "Website Security Standard",
    price: 2500,
    period: "mo",
    features: [
      "Protect one website",
      "SSL certificate included",
      "Daily malware scanning (4×/day)",
      "Site cleanup & repair 1×/year",
      "Blacklist & SEO spam monitoring",
      "Uptime monitoring & alerts",
    ],
  },
  {
    id: "advanced",
    name: "Website Security Advanced",
    price: 5500,
    period: "mo",
    features: [
      "Everything in Standard",
      "Site cleanup & repair 5×/year",
      "25 GB secure daily backup",
      "Up to 5× faster performance",
      "DDoS protection included",
      "Web Application Firewall (WAF)",
    ],
  },
];

type SecurityPlansProps = {
  plans?: OrderPlan[];
  serviceName?: string;
  title?: string;
  subtitle?: string;
  sectionId?: string;
};

export default function SecurityPlans({
  plans = defaultPlans,
  serviceName = "Website Security",
  title = "Choose Your Protection Level",
  subtitle = "30-day money-back guarantee. All plans include a free SSL certificate and setup help.",
  sectionId = "security-plans",
}: SecurityPlansProps = {}) {
  return (
    <section id={sectionId}>
      <ServiceMockPricingSection
        plans={plans}
        serviceName={serviceName}
        title={title}
        subtitle={subtitle}
      />
    </section>
  );
}
