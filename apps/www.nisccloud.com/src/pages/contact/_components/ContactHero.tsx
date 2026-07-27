import { motion } from "motion/react";

export default function ContactHero() {
  return (
    <section className="relative overflow-hidden pt-28 pb-10 md:pt-32 md:pb-12">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(ellipse 70% 50% at 50% 0%, color-mix(in srgb, var(--color-primary) 12%, transparent), transparent 70%)",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-3xl px-4 text-center md:px-8">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-3 text-sm font-semibold tracking-wide text-primary"
        >
          Contact
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.05 }}
          className="mb-3 text-balance text-3xl font-bold tracking-tight md:text-4xl"
        >
          Tell us what you need.
          <span className="text-primary"> We&apos;ll help you grow.</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1 }}
          className="mx-auto max-w-xl text-base text-muted-foreground"
        >
          Share your goals and we&apos;ll follow up within 24 hours with a clear next step.
        </motion.p>
      </div>
    </section>
  );
}
