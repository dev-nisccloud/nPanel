import { ClosingCta } from "@/components/closing-cta.tsx";

type SecurityCTAProps = {
  title?: string;
  description?: string;
  ctaLabel?: string;
  plansId?: string;
  footnote?: string;
};

export default function SecurityCTA({
  title = "Protect Your Site With Clear, Managed Security",
  description = "Add SSL, malware scanning, firewall protection, and backups so your website stays safe and available for your customers.",
  ctaLabel = "View Security Plans",
  plansId = "security-plans",
  footnote = "Setup help included.",
}: SecurityCTAProps = {}) {
  return (
    <ClosingCta
      eyebrow="Stay protected"
      headline={title}
      subtext={description}
      primary={{
        label: ctaLabel,
        href: `#${plansId}`,
        onClick: () => document.getElementById(plansId)?.scrollIntoView({ behavior: "smooth" }),
      }}
      secondary={{ label: "Talk to an Expert", href: "/contact" }}
      points={["Setup help included", "Pay with M-Pesa or card"]}
      note={footnote === "Setup help included." ? undefined : footnote}
    />
  );
}
