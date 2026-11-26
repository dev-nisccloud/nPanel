import FaqBlock from "@/components/shadcn-space/blocks/faq-01/faq.tsx";
import { PRICING_FAQS } from "../pricing-faqs.ts";

export default function PricingFAQ() {
  return (
    <FaqBlock
      faqs={PRICING_FAQS}
      badge="Pricing FAQ"
      title="Common questions about our plans"
    />
  );
}
