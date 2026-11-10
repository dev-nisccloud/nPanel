import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const PILLARS = [
  { label: "01 Build", id: "#build" },
  { label: "02 Run", id: "#run" },
  { label: "03 Grow", id: "#grow" },
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
          Business solutions
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="type-h1 mb-6 text-balance"
        >
          Build with purpose. Run with control.
          {" "}<br />
          <span className="text-primary">Grow with clarity.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8"
        >
          Bring brand, software, cloud infrastructure and digital growth into one accountable operation. Automation supports every stage while your team stays in control.
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
