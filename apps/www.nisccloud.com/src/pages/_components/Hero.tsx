import { useEffect, type CSSProperties } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { Link, useSearchParams } from "react-router-dom";
import { trackEvent } from "@/lib/track.ts";
import { TypedPhrase } from "./TypedPhrase.tsx";
import { ClientLogoStrip } from "./ClientLogoStrip.tsx";
import { HeroCredentials } from "./HeroCredentials.tsx";

const audiences = ["Businesses", "Agencies", "Developers"] as const;

const HERO_PHRASES = [
  "build with purpose.",
  "run with control.",
  "grow with clarity.",
] as const;

const HERO_TOKENS = {
  "--foreground": "#ffffff",
  "--muted-foreground": "rgb(255 255 255 / 0.72)",
  "--border": "rgb(255 255 255 / 0.14)",
  "--card": "rgb(255 255 255 / 0.06)",
} as CSSProperties;

// TEMPORARY review concepts: ?hero=blue (violet to sky) and ?hero=aurora (midnight + blue with a violet glow) ?hero=sky (exact #38b6ff, white text) and ?hero=sky-midnight (exact #38b6ff, midnight text). Remove after the owner's review.
const BLUE_TOKENS = {
  "--foreground": "#ffffff",
  "--muted-foreground": "rgb(255 255 255 / 0.8)",
  "--border": "rgb(255 255 255 / 0.18)",
  "--card": "rgb(255 255 255 / 0.08)",
} as CSSProperties;

const SKY_TOKENS = {
  "--foreground": "#ffffff",
  "--muted-foreground": "rgb(255 255 255 / 0.95)",
  "--border": "rgb(255 255 255 / 0.3)",
  "--card": "rgb(255 255 255 / 0.14)",
} as CSSProperties;

const SKY_MIDNIGHT_TOKENS = {
  "--foreground": "#02070a",
  "--muted-foreground": "rgb(2 7 10 / 0.75)",
  "--border": "rgb(2 7 10 / 0.16)",
  "--card": "rgb(255 255 255 / 0.22)",
} as CSSProperties;

export default function Hero() {
  const reduceMotion = useReducedMotion() ?? false;
  const [params] = useSearchParams();
  const blue = params.get("hero") === "blue";
  const aurora = params.get("hero") === "aurora";
  const sky = params.get("hero") === "sky";
  const skyMid = params.get("hero") === "sky-midnight";
  const concept = blue ? "blue" : sky ? "sky" : skyMid ? "sky-midnight" : "";
  useEffect(() => {
    if (!concept) return;
    document.documentElement.dataset.hero = concept;
    return () => {
      delete document.documentElement.dataset.hero;
    };
  }, [concept]);
  const rise = (delay: number, y = 16) => ({
    initial: reduceMotion ? false : { opacity: 0, y },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, delay },
  });

  const dot = blue ? "text-[#8fd6ff]" : aurora ? "text-[#5ec4ff]" : sky ? "text-[#02070a]" : skyMid ? "text-white" : "text-primary";

  return (
    <section
      id="hero"
      aria-labelledby="hero-heading"
      className={`${blue ? "hero-bg-blue" : aurora ? "hero-bg hero-bg-aurora" : sky || skyMid ? "hero-bg-sky" : "hero-bg"} relative isolate overflow-hidden pt-28 text-foreground md:pt-32`}
      style={blue ? BLUE_TOKENS : sky ? SKY_TOKENS : skyMid ? SKY_MIDNIGHT_TOKENS : HERO_TOKENS}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.07] [mask-image:radial-gradient(ellipse_75%_65%_at_50%_35%,black,transparent)]"
        style={{
          backgroundImage: `radial-gradient(${skyMid ? "#02070a" : "#ffffff"} 1px, transparent 1px)`,
          backgroundSize: "26px 26px",
        }}
      />

      <div className="mx-auto flex max-w-4xl flex-col items-center px-4 text-center md:px-8">
        <HeroCredentials
          className={skyMid ? "border-[#02070a]/10 bg-white/30 text-[#02070a]/85" : blue || sky ? "border-white/20 bg-white/10 text-white" : "border-white/10 bg-white/[0.06] text-white/85"}
        />

        <motion.h1
          id="hero-heading"
          aria-label="Build. Run. Grow."
          {...rise(0.05, 12)}
          className="type-display mb-5 text-foreground max-[360px]:text-[2.5rem]"
        >
          Build<span className={dot}>.</span> Run<span className={dot}>.</span> Grow
          <span className={dot}>.</span>
        </motion.h1>

        <motion.h2
          {...rise(0.1)}
          className="type-lead mb-6 text-muted-foreground"
        >
          One accountable technology partner to help you
          <span className="block font-medium sm:whitespace-nowrap">
            <TypedPhrase phrases={HERO_PHRASES} className={blue ? "text-[#8fd6ff]" : aurora ? "text-[#5ec4ff]" : sky ? "text-white" : skyMid ? "text-[#02070a]" : "text-primary"} caretClassName={skyMid ? "bg-[#02070a]" : "bg-white"} />
          </span>
        </motion.h2>

        <motion.p
          {...rise(0.16)}
          className="mb-9 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg"
        >
          Cloud infrastructure, software and digital growth in one connected
          operation for businesses, agencies and developers.
        </motion.p>

        <motion.div {...rise(0.22)} className="mb-6 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
          <Button
            asChild
            size="lg"
            className={`cursor-pointer gap-2 rounded-[10px] px-7 text-[15px] font-semibold shadow-lg shadow-black/15 ${skyMid ? "bg-[#02070a] text-white hover:bg-[#02070a]/90" : "bg-white text-[#02070a] hover:bg-white/90"}`}
          >
            <Link to="/hosting" onClick={() => trackEvent("hero_cloud_click")}>
              Explore Cloud Products
              <ArrowRight size={15} aria-hidden />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className={`cursor-pointer gap-2 rounded-[10px] bg-transparent px-7 text-[15px] font-semibold dark:bg-transparent ${skyMid ? "border-[#02070a]/30 text-[#02070a] hover:bg-[#02070a]/5 hover:text-[#02070a] dark:border-[#02070a]/30 dark:hover:bg-[#02070a]/5" : sky ? "border-white/50 text-white hover:bg-white/15 hover:text-white dark:border-white/50 dark:hover:bg-white/15" : "border-white/25 text-white hover:bg-white/10 hover:text-white dark:border-white/25 dark:hover:bg-white/10"}`}
          >
            <Link to="/services" onClick={() => trackEvent("hero_solutions_click")}>
              Explore Business Solutions
            </Link>
          </Button>
        </motion.div>

        <motion.p
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm text-muted-foreground"
        >
          <span>For</span>
          {audiences.map((audience, i) => (
            <span key={audience} className="flex items-center gap-2">
              <span className="font-semibold text-foreground">{audience.toLowerCase()}</span>
              {i < audiences.length - 1 && (
                <span aria-hidden className="size-1 rounded-full bg-foreground/40" />
              )}
            </span>
          ))}
        </motion.p>
      </div>

      <motion.div {...rise(0.4)} className={`mx-auto mt-14 max-w-6xl px-4 pb-14 md:mt-16 md:px-8 md:pb-16${aurora ? " hero-logo-glow relative" : ""}`}>
        <ClientLogoStrip variant={skyMid ? "tiles" : "white"} />
      </motion.div>
    </section>
  );
}
