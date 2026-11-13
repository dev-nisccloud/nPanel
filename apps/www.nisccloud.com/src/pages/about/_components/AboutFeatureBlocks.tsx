import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";
import { Check, Hammer, Rocket, Server } from "lucide-react";
import { BlueprintSiteArt } from "@/components/artwork/build-art.tsx";
import { HostingFlagshipArt, SeoFlagshipArt } from "@/components/artwork/flagship-art.tsx";

const PILLARS = [
  {
    id: "build",
    tab: "Build",
    hint: "Make it real",
    icon: Hammer,
    summary: "Brands, websites, ecommerce and software.",
    headline: "Brands, websites, ecommerce and software",
    text: "We shape how your business looks and works online, from the logo and company profile to the store and the software behind it.",
    bullets: ["Brand identity and company profiles", "Websites and ecommerce that load fast", "Software built around the way you work"],
    Art: BlueprintSiteArt,
  },
  {
    id: "run",
    tab: "Run",
    hint: "Keep it online",
    icon: Server,
    summary: "Domains, hosting, email, servers and security.",
    headline: "Domains, hosting, email, servers and security",
    text: "The infrastructure that keeps you available, connected and secure, with every service visible and manageable in nPanel.",
    bullets: ["Domains, hosting and business email", "Cloud servers, backups and SSL", "Support from the team that set it up"],
    Art: HostingFlagshipArt,
  },
  {
    id: "grow",
    tab: "Grow",
    hint: "Bring customers",
    icon: Rocket,
    summary: "Search, advertising, content and automation.",
    headline: "Search, advertising, content and automation",
    text: "Marketing that runs on the same account as your website, so every campaign starts from a site that is ready for the traffic.",
    bullets: ["SEO, paid ads and social media", "Content and email campaigns", "Automation that gives small teams hours back"],
    Art: SeoFlagshipArt,
  },
] as const;

const DURATION = 7000;

export default function AboutFeatureBlocks() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { amount: 0.35 });
  const reduce = useReducedMotion() ?? false;
  const auto = inView && !paused && !reduce;
  const pillar = PILLARS[active];

  useEffect(() => {
    if (!auto) return;
    const id = window.setTimeout(() => setActive((i) => (i + 1) % PILLARS.length), DURATION);
    return () => window.clearTimeout(id);
  }, [auto, active]);

  return (
    <section
      ref={sectionRef}
      aria-labelledby="pillars-title"
      className="border-t border-border/40 bg-muted/40 px-4 py-20 md:px-8 md:py-28"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="mx-auto max-w-7xl">
        <div className="max-w-2xl">
          <p className="type-label text-[#38b6ff]">What we do</p>
          <h2 id="pillars-title" className="type-h2 mt-3 text-balance">
            One accountable team across Build, Run and Grow
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Start with what you need now and add the rest as your business changes. Automation supports the work in every pillar.
          </p>
        </div>

        <div role="tablist" aria-label="Nisc Cloud pillars" className="mt-10 grid gap-3 md:grid-cols-3">
          {PILLARS.map((item, index) => {
            const selected = index === active;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                id={`pillar-tab-${item.id}`}
                aria-selected={selected}
                aria-controls="pillar-panel"
                onClick={() => setActive(index)}
                className={`group relative overflow-hidden rounded-[22px] border p-5 text-left transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38b6ff] focus-visible:ring-offset-2 md:p-6 ${
                  selected
                    ? "border-[#38b6ff] bg-[#02070A] text-white shadow-[0_24px_48px_-28px_rgb(56_182_255_/_0.7)]"
                    : "border-border bg-card hover:-translate-y-0.5 hover:border-[#38b6ff]/60"
                }`}
              >
                <span className="flex items-center justify-between">
                  <span
                    className={`grid size-11 place-items-center rounded-xl transition-colors ${
                      selected ? "bg-[#38b6ff] text-[#02070A]" : "bg-[#38b6ff]/10 text-[#38b6ff]"
                    }`}
                  >
                    <item.icon className="size-5" aria-hidden />
                  </span>
                  <span className={`text-sm font-semibold ${selected ? "text-white/60" : "text-muted-foreground"}`}>0{index + 1}</span>
                </span>
                <span className="mt-5 block text-2xl font-semibold">{item.tab}</span>
                <span className="mt-1 block text-sm font-semibold text-[#38b6ff]">{item.hint}</span>
                <span className={`mt-2 block text-sm leading-relaxed ${selected ? "text-white/75" : "text-muted-foreground"}`}>{item.summary}</span>
                <span className={`absolute inset-x-0 bottom-0 h-1 ${selected ? "bg-white/10" : "bg-transparent"}`} aria-hidden>
                  {selected ? (
                    <motion.span
                      key={`${item.id}-${auto ? "run" : "hold"}`}
                      className="block h-full bg-[#38b6ff]"
                      initial={{ width: auto ? "0%" : "100%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: auto ? DURATION / 1000 : 0, ease: "linear" }}
                    />
                  ) : null}
                </span>
              </button>
            );
          })}
        </div>

        <div id="pillar-panel" role="tabpanel" aria-labelledby={`pillar-tab-${pillar.id}`} className="mt-5">
          <AnimatePresence mode="wait">
            <motion.div
              key={pillar.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="grid items-center gap-8 overflow-hidden rounded-[28px] border border-border bg-card p-6 md:p-10 lg:grid-cols-[0.9fr_1.1fr]"
            >
              <div>
                <h3 className="text-2xl font-semibold leading-tight md:text-3xl">{pillar.headline}</h3>
                <p className="mt-4 text-base leading-relaxed text-muted-foreground">{pillar.text}</p>
                <ul className="mt-6 grid gap-3">
                  {pillar.bullets.map((bullet) => (
                    <li key={bullet} className="flex gap-3 text-base text-foreground">
                      <Check className="mt-1 size-4 shrink-0 text-[#38b6ff]" aria-hidden />
                      {bullet}
                    </li>
                  ))}
                </ul>
              </div>
              <pillar.Art />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
