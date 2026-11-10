import { ClosingCta } from "@/components/closing-cta.tsx";

export default function WorkCTA() {
  return (
    <ClosingCta
      eyebrow="Your project next"
      headline="Let's plan your next step"
      subtext="Book a free strategy call and we will map clear hosting and marketing next steps for your business."
      primary={{ label: "Get Your Free Strategy Call", href: "/contact" }}
      secondary={{ label: "Explore Our Services", href: "/services" }}
      details={{ variant: "brief", items: ["What you do and who you serve", "The website or software needed", "Budget and timing"] }}
    />
  );
}
