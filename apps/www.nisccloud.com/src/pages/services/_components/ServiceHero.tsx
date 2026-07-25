import { motion } from "motion/react";

export default function ServiceHero() {
  return (
    <section className="relative pt-32 pb-20 overflow-hidden">
      {/* Grid bg */}
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
            "radial-gradient(ellipse 70% 50% at 50% 0%, oklch(0.18 0.06 230 / 0.5) 0%, transparent 70%)",
        }}
      />

      <div className="max-w-4xl mx-auto px-4 md:px-8 text-center relative">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-5xl md:text-6xl font-bold tracking-tight mb-6 text-balance"
        >
          Everything Your Brand
          <br />
          <span className="text-primary">Needs to Grow.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8"
        >
          Four service pillars that work together: create your brand, launch online, market to the right people, and automate the follow-up. One team, clear reporting, and 24/7 support.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-wrap justify-center gap-3"
        >
          {["01 Create", "02 Launch", "03 Market", "04 Automate"].map((s, i) => (
            <button
              key={s}
              onClick={() => {
                const ids = ["#create", "#launch", "#market", "#automate"];
                document.querySelector(ids[i])?.scrollIntoView({ behavior: "smooth" });
              }}
              className="px-4 py-2 rounded-full border border-border/60 text-sm text-muted-foreground hover:border-primary/40 hover:text-foreground transition-all cursor-pointer font-mono"
            >
              {s}
            </button>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
