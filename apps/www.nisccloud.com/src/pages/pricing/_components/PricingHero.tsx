import { motion } from "motion/react";

export default function PricingHero() {
  return (
    <section className="relative pt-20 pb-10 overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.96 0.05 235 / 0.55) 0%, oklch(0.97 0.03 260 / 0.35) 50%, oklch(0.96 0.04 195 / 0.40) 100%)",
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 50% 0%, oklch(0.88 0.12 235 / 0.25) 0%, transparent 70%)",
        }}
      />
      <div className="max-w-4xl mx-auto px-4 md:px-8 text-center relative">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-balance"
        >
          Clear Plans for Hosting &amp; Marketing
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-lg text-muted-foreground max-w-2xl mx-auto mb-4"
        >
          All prices in KES. No hidden fees. Every plan includes setup help and a dedicated account contact.
        </motion.p>
      </div>
    </section>
  );
}
