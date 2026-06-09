import { motion } from "motion/react";

const stats = [
  { value: "500+", label: "Businesses Powered" },
  { value: "99.9%", label: "Uptime Guaranteed" },
  { value: "300+", label: "Campaigns Delivered" },
  { value: "KES 50M+", label: "Revenue Generated" },
];

export default function Stats() {
  return (
    <section
      id="stats"
      className="py-20 border-y border-border/40"
      style={{
        background:
          "radial-gradient(ellipse 100% 80% at 50% 50%, oklch(0.60 0.22 235 / 0.06), transparent)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
            >
              <div className="text-4xl md:text-5xl font-bold text-primary mb-2 tracking-tight">
                {s.value}
              </div>
              <div className="text-sm text-muted-foreground font-medium">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
