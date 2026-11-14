import { cn } from "@/lib/utils.ts";

/**
 * Regulatory credentials confirmed by Nisc Cloud (7 Nov 2026). Logos are the official marks
 * published on ca.go.ke and kenic.or.ke; they sit on a white chip because both are drawn for
 * light backgrounds.
 */
const ACCREDITATIONS = [
  {
    name: "Communications Authority of Kenya",
    statement: "Licensed by the Communications Authority of Kenya",
    logo: "/accreditation/communications-authority-of-kenya.jpg",
    href: "https://www.ca.go.ke/",
    logoClass: "h-7",
  },
  {
    name: "KeNIC",
    statement: "KeNIC-accredited .ke domain registrar",
    logo: "/accreditation/kenic.svg",
    href: "https://kenic.or.ke/",
    logoClass: "h-9",
  },
] as const;

export function AccreditationBadges({ className }: { className?: string }) {
  return (
    <ul className={cn("flex flex-wrap items-center gap-3", className)}>
      {ACCREDITATIONS.map((a) => (
        <li key={a.name}>
          <a
            href={a.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2 hover:border-primary/40 transition-colors"
          >
            <span className="flex h-11 items-center rounded-md bg-white px-2">
              <img src={a.logo} alt={a.name} loading="lazy" className={cn("w-auto", a.logoClass)} />
            </span>
            <span className="text-xs font-medium text-foreground max-w-[13rem] leading-snug">{a.statement}</span>
          </a>
        </li>
      ))}
    </ul>
  );
}