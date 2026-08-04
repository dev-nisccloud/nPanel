import { motion } from "motion/react";

export default function WorkHero() {
  return (
    <section className="relative pt-28 pb-8 px-4 md:px-8 bg-background">
      <div className="max-w-6xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="text-[36px] font-extrabold leading-[1.15] mb-3 text-balance"
        >
          Work We Are <span className="text-primary">Proud Of</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.08 }}
          className="text-base text-muted-foreground max-w-2xl leading-relaxed"
        >
          How we help businesses get online, stay online, and grow  with hosting and marketing under one team.
        </motion.p>
      </div>
    </section>
  );
}
