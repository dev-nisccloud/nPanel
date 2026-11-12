import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import { AboutHeroVisual } from "@/components/artwork/about-art.tsx";
import { OFFICE_PHOTOS } from "./photos.ts";

export default function AboutHero() {
  const reduce = useReducedMotion();
  const rise = (delay: number) => ({
    initial: reduce ? false : { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, delay },
  });
  return (
    <section className="relative overflow-hidden px-4 pb-24 pt-32 md:px-8 md:pt-36">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{ background: "radial-gradient(50% 60% at 85% 30%, rgb(56 182 255 / 0.16), transparent 70%)" }}
      />
      <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1fr_1.05fr] lg:gap-16">
        <div>
          <motion.p {...rise(0)} className="type-label text-[#38b6ff]">
            About Nisc Cloud
          </motion.p>
          <motion.h1 {...rise(0.05)} className="type-h1 mt-4 text-balance">
            Build. Run. Grow. With one technology partner.
          </motion.h1>
          <motion.p {...rise(0.15)} className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Nisc Cloud brings cloud infrastructure, software and digital growth together for businesses, agencies and developers. nPanel connects
            the services you use, and one team in Nairobi stays accountable for all of it.
          </motion.p>
          <motion.div {...rise(0.25)} className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/contact"
              className="inline-flex min-h-12 items-center justify-center rounded-[12px] bg-[#38b6ff] px-6 text-base font-semibold text-[#02070A] hover:bg-[#38b6ff]/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38b6ff] focus-visible:ring-offset-2"
            >
              Talk to our team
            </Link>
            <a
              href="#ceo-message"
              className="inline-flex min-h-12 items-center justify-center rounded-[12px] border border-border px-6 text-base font-semibold hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38b6ff] focus-visible:ring-offset-2"
            >
              Read our CEO's message
            </a>
          </motion.div>
        </div>
        <div className="px-4 sm:px-8 lg:px-0">
          <AboutHeroVisual photo={OFFICE_PHOTOS.team} />
        </div>
      </div>
    </section>
  );
}
