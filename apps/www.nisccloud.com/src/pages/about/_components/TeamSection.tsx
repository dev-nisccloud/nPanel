import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { BarChart3, Building2, Code2, Headset, Palette, Server, Workflow, type LucideIcon } from "lucide-react";

type TeamRole = { icon: LucideIcon; role: string; description: string; x: number; y: number };

/** Real names and portraits are added only once the owner supplies them with consent. */
const ROLES: TeamRole[] = [
  {
    icon: Headset,
    role: "Client success and support",
    description: "Keeps projects on track and makes sure there is always a real person who owns your account.",
    x: 50,
    y: 11,
  },
  {
    icon: Server,
    role: "Hosting and infrastructure",
    description: "Runs the domains, hosting, email and server platform, monitors uptime against our targets and handles migrations.",
    x: 84,
    y: 30,
  },
  {
    icon: Code2,
    role: "Development",
    description: "Builds fast, reliable websites, ecommerce and custom software, and ships carefully so your business stays online.",
    x: 84,
    y: 70,
  },
  {
    icon: Palette,
    role: "Brand and web design",
    description: "Designs identities and websites that are clear, usable and built to convert, not just to look good.",
    x: 50,
    y: 89,
  },
  {
    icon: BarChart3,
    role: "Marketing and growth",
    description: "Runs SEO, paid media, social and email with measurable goals and reporting you can read.",
    x: 16,
    y: 70,
  },
  {
    icon: Workflow,
    role: "Automation and Zepo AI",
    description: "Sets up workflows, chat and follow-up automation that save time, and explains every step in plain language.",
    x: 16,
    y: 30,
  },
];

export default function TeamSection() {
  const [active, setActive] = useState(0);
  const reduce = useReducedMotion();
  const role = ROLES[active];
  return (
    <section aria-labelledby="team-title" className="bg-muted/40 px-4 py-20 md:px-8 md:py-28">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-2xl">
          <p className="type-label text-[#38b6ff]">Who you work with</p>
          <h2 id="team-title" className="type-h2 mt-3 text-balance">
            Six teams, one account, one point of contact
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Every team works on the same account in nPanel, so nothing gets lost between design, development, hosting and marketing. Pick a team
            to see what it does for you.
          </p>
        </div>

        <div className="mt-12 grid items-center gap-10 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="relative mx-auto hidden aspect-[5/4] w-full max-w-2xl md:block">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full" aria-hidden>
              {ROLES.map((item, i) => (
                <line
                  key={item.role}
                  x1="50"
                  y1="50"
                  x2={item.x}
                  y2={item.y}
                  vectorEffect="non-scaling-stroke"
                  strokeWidth={i === active ? 2 : 1}
                  strokeDasharray="4 5"
                  className={i === active ? "stroke-[#38b6ff]" : "stroke-[#38b6ff]/35"}
                />
              ))}
            </svg>
            {!reduce
              ? ROLES.map((item, i) => (
                  <motion.span
                    key={`pulse-${item.role}`}
                    aria-hidden
                    className={`absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full ${i === active ? "bg-[#fc734d]" : "bg-[#38b6ff]"}`}
                    initial={{ left: "50%", top: "50%", opacity: 0 }}
                    animate={{ left: ["50%", `${item.x}%`], top: ["50%", `${item.y}%`], opacity: [0, 1, 0] }}
                    transition={{ duration: i === active ? 1.4 : 2.4, repeat: Infinity, delay: i * 0.4, ease: "easeInOut" }}
                  />
                ))
              : null}

            <div className="absolute left-1/2 top-1/2 grid -translate-x-1/2 -translate-y-1/2 justify-items-center gap-2 rounded-[24px] border border-[#38b6ff] bg-card px-6 py-5 text-center shadow-[0_0_0_10px_rgb(56_182_255_/_0.08)]">
              <span className="grid size-11 place-items-center rounded-2xl bg-[#38b6ff] text-[#02070A]">
                <Building2 className="size-5" aria-hidden />
              </span>
              <span className="text-sm font-semibold">Your business</span>
              <span className="text-xs text-muted-foreground">One account in nPanel</span>
            </div>

            {ROLES.map((item, i) => (
              <button
                key={item.role}
                type="button"
                aria-pressed={i === active}
                onClick={() => setActive(i)}
                onMouseEnter={() => setActive(i)}
                style={{ left: `${item.x}%`, top: `${item.y}%` }}
                className={`absolute flex w-40 -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-2xl border px-3 py-2.5 text-left text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38b6ff] focus-visible:ring-offset-2 ${
                  i === active ? "border-[#38b6ff] bg-[#38b6ff] text-[#02070A] shadow-lg" : "border-border bg-card text-foreground hover:border-[#38b6ff]"
                }`}
              >
                <item.icon className="size-4 shrink-0" aria-hidden />
                {item.role}
              </button>
            ))}
          </div>

          <ul className="grid gap-2 md:hidden">
            {ROLES.map((item, i) => (
              <li key={item.role}>
                <button
                  type="button"
                  aria-pressed={i === active}
                  onClick={() => setActive(i)}
                  className={`flex min-h-12 w-full items-center gap-3 rounded-2xl border px-4 text-left text-sm font-semibold ${
                    i === active ? "border-[#38b6ff] bg-[#38b6ff] text-[#02070A]" : "border-border bg-card"
                  }`}
                >
                  <item.icon className="size-4 shrink-0" aria-hidden />
                  {item.role}
                </button>
              </li>
            ))}
          </ul>

          <div aria-live="polite">
            <AnimatePresence mode="wait">
              <motion.div
                key={role.role}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="rounded-[28px] border border-border bg-card p-7 md:p-8"
              >
                <span className="grid size-12 place-items-center rounded-2xl bg-[#38b6ff]/10 text-[#38b6ff]">
                  <role.icon className="size-6" aria-hidden />
                </span>
                <h3 className="mt-5 text-2xl font-semibold">{role.role}</h3>
                <p className="mt-3 text-base leading-relaxed text-muted-foreground">{role.description}</p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
