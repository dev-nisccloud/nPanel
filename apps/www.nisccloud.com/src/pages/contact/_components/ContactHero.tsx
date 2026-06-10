import { motion } from "motion/react";

export default function ContactHero() {
  return (
    <section className="relative pt-32 pb-12 overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(oklch(0.72 0.2 210) 1px, transparent 1px), linear-gradient(90deg, oklch(0.72 0.2 210) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 0%, oklch(0.18 0.06 230 / 0.5) 0%, transparent 70%)",
        }}
      />
      <div className="max-w-4xl mx-auto px-4 md:px-8 text-center relative">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 text-xs text-primary font-mono mb-6"
        >
          GET IN TOUCH
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl md:text-6xl font-bold tracking-tight mb-4 text-balance"
        >
          Let&apos;s Put Your Brand
          <br />
          <span className="text-primary">Into Orbit.</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg text-muted-foreground max-w-xl mx-auto"
        >
          Tell us about your brand, your goals, and which services you need. We&apos;ll follow up within 24 hours with a custom proposal.
        </motion.p>
      </div>
    </section>
  );
}
