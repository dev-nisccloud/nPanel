import { ClosingCta } from "@/components/closing-cta.tsx";

export default function AboutCTA() {
  return (
    <ClosingCta
      eyebrow="Work with us"
      headline="Let's get your business online and growing"
      subtext="Book a free strategy call. We will map clear hosting and marketing next steps for your business, with no pressure."
      primary={{ label: "Book a Free Strategy Call", href: "/contact" }}
      secondary={{ label: "Explore Our Services", href: "/services" }}
      details={{ variant: "brief", items: ["Your business and customers", "What you want to improve", "Where you are hosted today"] }}
    />
  );
}
