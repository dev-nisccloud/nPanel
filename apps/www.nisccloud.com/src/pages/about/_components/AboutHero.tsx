import { motion } from "motion/react";

export default function AboutHero() {
  return (
    <section className="relative pt-32 pb-20 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/10 blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 md:px-8 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="type-h1 mb-6 text-balance"
        >
          Build. Run. Grow.{" "}
          <span className="text-primary">With one technology partner.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="text-lg text-muted-foreground text-balance max-w-2xl mx-auto"
        >
          Nisc Cloud brings cloud infrastructure, software and digital growth
          together for businesses, agencies and developers. nPanel connects
          the services you use, while automation supports work across each
          pillar.
        </motion.p>
      </div>
    </section>
  );
}
