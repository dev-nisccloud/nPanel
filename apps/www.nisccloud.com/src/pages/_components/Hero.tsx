import type { CSSProperties } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { Link } from "react-router-dom";
import { trackEvent } from "@/lib/track.ts";
import { TypedPhrase } from "./TypedPhrase.tsx";
import { ClientLogoStrip } from "./ClientLogoStrip.tsx";

const audiences = ["Businesses", "Agencies", "Developers"] as const;

const HERO_PHRASES = [
  "operate and grow online.",
  "reach more customers.",
  "generate more revenue.",
  "launch a site that sells.",
  "work smarter with AI.",
] as const;

const HERO_TOKENS = {
  "--foreground": "#ffffff",
  "--muted-foreground": "rgb(255 255 255 / 0.72)",
  "--border": "rgb(255 255 255 / 0.14)",
  "--card": "rgb(255 255 255 / 0.06)",
} as CSSProperties;

export default function Hero() {
  const reduceMotion = useReducedMotion() ?? false;
  const rise = (delay: number, y = 16) => ({
    initial: reduceMotion ? false : { opacity: 0, y },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, delay },
  });

  return (
    <section
      id="hero"
      aria-labelledby="hero-heading"
      className="hero-bg relative isolate overflow-hidden pt-28 text-foreground md:pt-32"
      style={HERO_TOKENS}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.07] [mask-image:radial-gradient(ellipse_75%_65%_at_50%_35%,black,transparent)]"
        style={{
          backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)",
          backgroundSize: "26px 26px",
        }}
      />

      <div className="mx-auto flex max-w-4xl flex-col items-center px-4 text-center md:px-8">
        <motion.p
          {...rise(0, 10)}
          className="hero-badge relative mb-7 inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.06] py-1 pr-3.5 pl-1 text-xs font-medium text-white/85 backdrop-blur-sm"
        >
          <span className="flex h-7 shrink-0 items-center gap-1.5 rounded-full bg-white px-2.5">
            <img
              src="/accreditation/kenic.svg"
              alt="KeNIC"
              width={35}
              height={20}
              className="h-5 w-[35px] object-contain"
              decoding="async"
            />
            <span aria-hidden className="h-3.5 w-px bg-black/15" />
            <img
              src="/accreditation/communications-authority-of-kenya.jpg"
              alt="Communications Authority of Kenya"
              width={61}
              height={20}
              className="h-5 w-[61px] object-contain"
              decoding="async"
            />
          </span>
          <span className="whitespace-nowrap sm:hidden">Accredited &amp; licensed</span>
          <span className="hidden sm:inline">
            KeNIC-accredited registrar · Licensed by the Communications Authority of Kenya
          </span>
        </motion.p>

        <motion.h1
          id="hero-heading"
          aria-label="Build. Run. Grow."
          {...rise(0.05, 12)}
          className="mb-5 font-sans text-[2.6rem] font-extrabold leading-none tracking-tight text-foreground max-[360px]:text-[2.3rem] sm:text-6xl lg:text-7xl xl:text-[5rem]"
        >
          Build<span className="text-primary">.</span> Run<span className="text-primary">.</span> Grow
          <span className="text-primary">.</span>
        </motion.h1>

        <motion.h2
          {...rise(0.1)}
          className="mb-6 text-[1.35rem] font-semibold leading-[1.25] tracking-tight text-muted-foreground min-[380px]:text-2xl md:text-3xl"
        >
          Everything your business needs to
          <span className="block whitespace-nowrap font-bold">
            <TypedPhrase phrases={HERO_PHRASES} className="text-primary" caretClassName="bg-white" />
          </span>
        </motion.h2>

        <motion.p
          {...rise(0.16)}
          className="mb-9 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg"
        >
          From domains, cloud hosting and business email to websites,
          software, marketing and AI-powered workflows, Nisc Cloud brings your
          digital services together.
        </motion.p>

        <motion.div {...rise(0.22)} className="mb-6 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
          <Button
            asChild
            size="lg"
            className="cursor-pointer gap-2 rounded-[10px] bg-white px-7 text-[15px] font-semibold text-[#02070a] shadow-lg shadow-black/15 hover:bg-white/90"
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
            className="cursor-pointer gap-2 rounded-[10px] border-white/25 bg-transparent px-7 text-[15px] font-semibold text-white hover:bg-white/10 hover:text-white dark:border-white/25 dark:bg-transparent dark:hover:bg-white/10"
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

      <motion.div {...rise(0.4)} className="mx-auto mt-14 max-w-6xl px-4 pb-14 md:mt-16 md:px-8 md:pb-16">
        <ClientLogoStrip variant="white" />
      </motion.div>
    </section>
  );
}
