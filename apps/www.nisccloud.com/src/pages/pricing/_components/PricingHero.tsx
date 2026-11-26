import { motion } from "motion/react";
import { useCurrency } from "@/components/providers/currency.tsx";

export default function PricingHero() {
  const { currency } = useCurrency();
  return (
    <section className="relative pt-28 pb-10 overflow-hidden md:pt-32">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.96 0.05 235 / 0.55) 0%, oklch(0.97 0.03 230 / 0.35) 50%, oklch(0.96 0.04 195 / 0.40) 100%)",
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
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-primary">Pricing · {currency}</p>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="type-h1 mb-4 text-balance"
        >
          Clear plans for hosting &amp; marketing
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-lg text-muted-foreground max-w-2xl mx-auto mb-4"
        >
          Prices are shown in {currency}. No hidden fees. Every plan includes setup help and a dedicated account contact.
        </motion.p>
      </div>
    </section>
  );
}
