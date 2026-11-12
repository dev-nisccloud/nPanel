import { motion } from "motion/react";

export default function WorkHero() {
  return (
    <section className="relative pt-32 pb-10 px-4 md:px-8 bg-background">
      <div className="max-w-7xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="type-h1 mb-3 text-balance"
        >
          Businesses we <span className="text-primary">build, run and grow</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.08 }}
          className="text-base text-muted-foreground max-w-2xl leading-relaxed"
        >
          Brands, websites, hosting and marketing for growing Kenyan businesses, delivered and supported by one team.
        </motion.p>
      </div>
    </section>
  );
}
