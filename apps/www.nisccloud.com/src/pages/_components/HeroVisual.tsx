import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { AgencyDeveloperStory, CloudInfrastructureStory } from "@/components/artwork/flagship-art.tsx";
import { EcosystemStory } from "@/components/artwork/ecosystem-story.tsx";
import { cn } from "@/lib/utils.ts";

const slides = [
  {
    id: "ecosystem",
    label: "Nisc Cloud ecosystem",
    description: "Domains, hosting, email, websites, marketing, Zepo AI, security and billing connected through Nisc Cloud.",
    visual: EcosystemStory,
  },
  {
    id: "cloud",
    label: "Cloud & infrastructure",
    description: "Domains, hosting, business email and cloud infrastructure.",
    visual: CloudInfrastructureStory,
  },
  {
    id: "agency",
    label: "Agencies & developers",
    description: "Client switching and technical management in nPanel.",
    visual: AgencyDeveloperStory,
  },
] as const;

/**
 * Three-state hero artwork showcase. The sales copy remains stable; only the
 * visual story changes. Switching is manual to avoid decorative autoplay.
 */
export function HeroVisual() {
  const [active, setActive] = useState(0);
  const reduceMotion = useReducedMotion() ?? false;
  const slide = slides[active];
  const Visual = slide.visual;
  const move = (direction: -1 | 1) => {
    setActive((current) => (current + direction + slides.length) % slides.length);
  };

  return (
    <div
      data-hero-visual
      className="relative w-full"
      aria-label="Nisc Cloud product stories"
    >
      <div
        role="group"
        aria-roledescription="slide"
        aria-label={`${active + 1} of ${slides.length}: ${slide.label}`}
        aria-live="polite"
        className="min-h-[280px] overflow-hidden sm:min-h-[390px]"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={slide.id}
            initial={reduceMotion ? false : { opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, x: -12 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
          >
            <Visual />
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <div role="tablist" aria-label="Hero visual stories" className="flex items-center gap-1.5">
          {slides.map((item, index) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={active === index}
              aria-label={item.label}
              onClick={() => setActive(index)}
              onKeyDown={(event) => {
                const next =
                  event.key === "ArrowRight"
                    ? (index + 1) % slides.length
                    : event.key === "ArrowLeft"
                      ? (index - 1 + slides.length) % slides.length
                      : event.key === "Home"
                        ? 0
                        : event.key === "End"
                          ? slides.length - 1
                          : null;
                if (next === null) return;
                event.preventDefault();
                setActive(next);
                document.getElementById(`hero-story-${next}`)?.focus();
              }}
              id={`hero-story-${index}`}
              className={cn(
                "group flex size-11 items-center justify-center rounded-[10px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary motion-reduce:transition-none",
              )}
            >
              <span
                className={cn(
                  "block h-2 rounded-full transition-[width,background-color] motion-reduce:transition-none",
                  active === index ? "w-7 bg-primary" : "w-2 bg-border group-hover:bg-primary/45",
                )}
              />
            </button>
          ))}
        </div>
        <p className="hidden min-w-0 flex-1 truncate text-right text-[10px] text-muted-foreground sm:block">
          <b className="text-foreground">{slide.label}</b> · {slide.description}
        </p>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => move(-1)}
            aria-label="Previous visual story"
            className="flex size-11 items-center justify-center rounded-[10px] border border-border bg-background text-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => move(1)}
            aria-label="Next visual story"
            className="flex size-11 items-center justify-center rounded-[10px] border border-border bg-background text-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
