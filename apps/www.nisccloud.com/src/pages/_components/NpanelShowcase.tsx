import { useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowRight, Briefcase, Building2, Check, Code2 } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import {
  NpanelAgencyArt,
  NpanelBusinessArt,
  NpanelDeveloperArt,
} from "@/components/artwork/npanel-art.tsx";
import { cn } from "@/lib/utils.ts";
import { trackEvent } from "@/lib/track.ts";

type Persona = {
  id: "business" | "developer" | "agency";
  label: string;
  icon: React.ElementType;
  heading: string;
  description: string;
  points: string[];
  cta: { label: string; href: string };
};

const personas: Persona[] = [
  {
    id: "business",
    label: "Businesses",
    icon: Building2,
    heading: "Everything your business depends on.",
    description:
      "See the domains, email, hosting, projects, billing, support and performance information available to your account, without switching between multiple providers.",
    points: [
      "Domains, email and hosting in one account",
      "Project progress and delivery updates",
      "Billing, renewals and support requests",
    ],
    cta: { label: "Explore cloud products", href: "/hosting" },
  },
  {
    id: "agency",
    label: "Agencies",
    icon: Briefcase,
    heading: "Every client. One account.",
    description:
      "Organize customer workspaces, assign their services, invite authorized users and switch between client accounts in one place.",
    points: [
      "A separate workspace for each client",
      "Invite authorized users without sharing passwords",
      "Switch between client accounts in one place",
    ],
    cta: { label: "Explore agency hosting", href: "/hosting/agency" },
  },
  {
    id: "developer",
    label: "Developers",
    icon: Code2,
    heading: "Infrastructure control without dashboard hopping.",
    description:
      "Manage supported hosting and cloud services, domains and developer access. Where enabled, use the built-in SSH terminal to access your cloud server directly from nPanel.",
    points: [
      "Supported hosting and cloud services",
      "Domains and developer access",
      "Built-in SSH terminal where enabled",
    ],
    cta: { label: "Explore VPS hosting", href: "/hosting/vps" },
  },
];

const views = {
  business: NpanelBusinessArt,
  developer: NpanelDeveloperArt,
  agency: NpanelAgencyArt,
} as const;

/** Homepage nPanel section with persona tabs. Visuals are illustrative, with sample data. */
export default function NpanelShowcase() {
  const [active, setActive] = useState(0);
  const reduceMotion = useReducedMotion() ?? false;
  const persona = personas[active];
  const View = views[persona.id];

  const select = (index: number) => {
    setActive(index);
    trackEvent("npanel_persona_select", { persona: personas[index].id });
  };

  return (
    <section
      id="npanel"
      aria-labelledby="npanel-heading"
      className="border-y border-border bg-muted/30 py-14 md:py-20"
    >
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="mx-auto mb-8 max-w-2xl text-center md:mb-10">
          <p className="type-label mb-2 text-sky-700 dark:text-primary">Meet nPanel</p>
          <h2
            id="npanel-heading"
            className="type-h2 text-balance"
          >
            Your digital operation. One connected workspace.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
            Manage the services you use, work with your team and keep customer
            accounts organized through nPanel.
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Who nPanel is for"
          className="mx-auto mb-8 grid w-full max-w-md grid-cols-3 gap-1 rounded-2xl border border-border bg-background p-1 sm:flex sm:w-fit sm:max-w-full"
        >
          {personas.map((p, i) => {
            const isActive = i === active;
            return (
              <button
                key={p.id}
                id={`npanel-tab-${p.id}`}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls="npanel-panel"
                tabIndex={isActive ? 0 : -1}
                onClick={() => select(i)}
                onKeyDown={(event) => {
                  const next =
                    event.key === "ArrowRight"
                      ? (i + 1) % personas.length
                      : event.key === "ArrowLeft"
                        ? (i - 1 + personas.length) % personas.length
                        : event.key === "Home"
                          ? 0
                          : event.key === "End"
                            ? personas.length - 1
                            : null;
                  if (next === null) return;
                  event.preventDefault();
                  select(next);
                  document
                    .getElementById(`npanel-tab-${personas[next].id}`)
                    ?.focus();
                }}
                className={cn(
                  "inline-flex min-w-0 cursor-pointer items-center justify-center gap-2 rounded-xl px-2 py-2.5 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:px-4 sm:text-sm",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-primary",
                )}
              >
                <p.icon className="hidden size-4 shrink-0 min-[400px]:block" aria-hidden />
                {p.label}
              </button>
            );
          })}
        </div>

        <div
          id="npanel-panel"
          role="tabpanel"
          aria-labelledby={`npanel-tab-${persona.id}`}
          className="grid items-center gap-8 lg:grid-cols-2 lg:gap-14"
        >
          <div>
            <h3 className="type-h3">
              {persona.heading}
            </h3>
            <p className="mt-3 max-w-lg leading-relaxed text-muted-foreground">
              {persona.description}
            </p>
            <ul className="mt-5 space-y-2.5">
              {persona.points.map((point) => (
                <li key={point} className="flex items-start gap-3 text-sm">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                    <Check className="size-3" aria-hidden />
                  </span>
                  {point}
                </li>
              ))}
            </ul>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Button asChild className="h-11 gap-2 rounded-[10px] px-6 font-semibold">
                <Link
                  to="/platform"
                  onClick={() => trackEvent("npanel_interest", { persona: persona.id, action: "platform", href: "/platform" })}
                >
                  Explore nPanel
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </Button>
              <Link
                to={persona.cta.href}
                onClick={() => trackEvent("npanel_interest", { persona: persona.id, action: "persona_cta", href: persona.cta.href })}
                className="inline-flex items-center gap-1.5 px-2 text-sm font-semibold text-foreground underline-offset-4 hover:underline"
              >
                {persona.cta.label}
                <ArrowRight className="size-3.5" aria-hidden />
              </Link>
            </div>
          </div>

          <div className="relative min-w-0">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={persona.id}
                initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
              >
                <View />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
