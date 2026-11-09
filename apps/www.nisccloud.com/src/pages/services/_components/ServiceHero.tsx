import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const PILLARS = [
  { label: "01 Create", id: "#create" },
  { label: "02 Launch", id: "#launch" },
  { label: "03 Market", id: "#market" },
  { label: "04 Automate", id: "#automate" },
];

export default function ServiceHero() {
  return (
    <section className="relative bg-background pt-28 pb-12 md:pt-32">
      <div className="max-w-4xl mx-auto px-4 md:px-8 text-center relative">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-primary"
        >
          Business solutions · Nairobi, Kenya
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.1] tracking-tight mb-6 text-balance"
        >
          Everything Your Brand
          {" "}<br />
          <span className="text-primary">Needs to Grow.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8"
        >
          Brand identity, website design, hosting, SEO, paid ads, social media and AI automation from one Kenyan team. Four service pillars that work together: create your brand, launch online, market to the right people, and automate the follow-up, with clear reporting and support when you need it.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="mb-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <Link
            to="/contact"
            className="group inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/25 transition hover:-translate-y-0.5 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 motion-reduce:hover:translate-y-0 sm:w-auto"
          >
            Book a Free Strategy Call
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </Link>
          <Link
            to="/pricing"
            className="inline-flex h-12 w-full items-center justify-center rounded-xl border border-border px-6 text-sm font-semibold text-foreground transition hover:border-primary/50 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:w-auto"
          >
            See Pricing
          </Link>
        </motion.div>

        <motion.nav
          aria-label="Service pillars"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-wrap justify-center gap-3"
        >
          {PILLARS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => document.querySelector(p.id)?.scrollIntoView({ behavior: "smooth" })}
              className="px-4 py-2 rounded-full border border-border/60 text-sm text-muted-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-foreground transition-all cursor-pointer font-mono"
            >
              {p.label}
            </button>
          ))}
        </motion.nav>
      </div>
    </section>
  );
}
