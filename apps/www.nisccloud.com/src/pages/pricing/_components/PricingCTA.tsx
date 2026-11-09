import { ClosingCta } from "@/components/closing-cta.tsx";

export default function PricingCTA() {
  return (
    <ClosingCta
      eyebrow="Not sure which plan?"
      headline="We can build you a custom package"
      subtext="Every business is different. Talk to our team and we will design a plan around your goals and budget, with no pressure."
      primary={{ label: "Book a Free Strategy Call", href: "/contact" }}
      secondary={{ label: "Explore Services", href: "/services" }}
    />
  );
}
