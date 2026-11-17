import { Link } from "react-router-dom";

const LEGAL_LINKS = [
  { label: "Terms of Service", href: "/terms" },
  { label: "Privacy Policy", href: "/privacy" },
] as const;

/** Slim footer for cart and checkout: no navigation that pulls people away from paying. */
export function CheckoutFooter() {
  return (
    <footer className="border-t border-border/60">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-3 gap-y-0.5 px-4 py-2.5 text-xs text-muted-foreground sm:justify-between md:px-6 xl:px-8">
        <p>© {new Date().getFullYear()} Nisc Cloud Limited</p>
        <nav aria-label="Legal" className="flex items-center gap-1">
          {LEGAL_LINKS.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className="inline-flex min-h-0 items-center rounded px-1.5 py-1 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
