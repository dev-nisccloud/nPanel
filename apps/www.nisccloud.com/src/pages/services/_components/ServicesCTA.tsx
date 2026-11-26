import { ClosingCta } from "@/components/closing-cta.tsx";

export default function ServicesCTA() {
  return (
    <ClosingCta
      eyebrow="Build. Run. Grow."
      headline="Tell us what you need"
      subtext="Need every service or just one? We will build a package around your goals. Book a free strategy call and we will map a clear next step together."
      primary={{ label: "Book a Free Strategy Call", href: "/contact" }}
      secondary={{ label: "See Pricing", href: "/pricing" }}
      details={{ variant: "timeline", items: ["Free strategy call", "Proposal with scope and price", "Work tracked in nPanel", "Review and next steps"] }}
    />
  );
}
