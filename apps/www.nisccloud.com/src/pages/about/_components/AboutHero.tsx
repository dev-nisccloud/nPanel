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
          className="text-[36px] font-extrabold leading-[1.15] mb-6 text-balance"
        >
          We Help Businesses{" "}
          <span className="text-primary">Get Online and Grow</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="text-lg text-muted-foreground text-balance max-w-2xl mx-auto"
        >
          We help businesses of every size get online, stay online, and grow
          with clear hosting and marketing under one team.
        </motion.p>
      </div>
    </section>
  );
}
