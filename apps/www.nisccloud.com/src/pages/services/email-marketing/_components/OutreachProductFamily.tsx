import { Link } from "react-router-dom";
import { ArrowRight, Mail, PanelsTopLeft, Send } from "lucide-react";
import { cn } from "@/lib/utils.ts";

const FAMILY = [
  {
    name: "Nisc Mail",
    role: "Professional business email",
    body: "Everyday email on your own domain for you and your team.",
    href: "/hosting/email",
    icon: Mail,
    current: false,
  },
  {
    name: "Nisc Outreach",
    role: "AI email marketing and campaigns",
    body: "Campaigns to your audience, designed by AI from your brand and tracked to the click.",
    href: null,
    icon: Send,
    current: true,
  },
  {
    name: "nPanel",
    role: "The workspace for managing both",
    body: "Mailboxes, campaigns, audiences, domains and results in one account.",
    href: "/platform",
    icon: PanelsTopLeft,
    current: false,
  },
] as const;

export function OutreachProductFamily() {
  return (
    <section aria-labelledby="outreach-family-heading" className="border-t border-border px-4 py-16 md:py-20">
      <div className="mx-auto max-w-6xl">
        <p className="type-label text-primary">How it fits together</p>
        <h2 id="outreach-family-heading" className="type-h2 mt-3 max-w-2xl">
          Your email, your campaigns, one workspace.
        </h2>
        <ul className="mt-10 grid gap-4 md:grid-cols-3">
          {FAMILY.map(({ name, role, body, href, icon: Icon, current }) => (
            <li
              key={name}
              className={cn(
                "relative flex flex-col rounded-[22px] border p-6",
                current ? "border-primary bg-primary/[0.06] ring-2 ring-primary/15" : "border-border bg-card",
              )}
            >
              <span className={cn("flex size-11 items-center justify-center rounded-xl", current ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary")}>
                <Icon className="size-5" aria-hidden />
              </span>
              <h3 className="mt-5 text-xl font-semibold">{name}</h3>
              <p className="mt-1 text-sm font-medium text-foreground/80">{role}</p>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">{body}</p>
              {href ? (
                <Link
                  to={href}
                  className="mt-5 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-primary after:absolute after:inset-0 focus-visible:outline-2 focus-visible:outline-primary"
                >
                  Explore {name} <ArrowRight className="size-4" aria-hidden />
                </Link>
              ) : (
                <p className="mt-5 inline-flex min-h-11 items-center text-sm font-semibold text-primary">You are here</p>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
