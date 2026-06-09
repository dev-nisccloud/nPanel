import { motion } from "motion/react";
import { LayoutDashboard, Headphones, BarChart3, Bot, ShieldCheck, Users } from "lucide-react";

const pillars = [
  { icon: LayoutDashboard, label: "All-in-One", desc: "One team, one dashboard, one invoice. Create, host, market, automate — no juggling vendors." },
  { icon: Headphones, label: "24/7 Support", desc: "Real humans, always on. No ticket queues, no wait times — we pick up." },
  { icon: BarChart3, label: "Data-Driven", desc: "Every decision backed by analytics. We don't guess — we measure, optimise, and scale." },
  { icon: Bot, label: "Zeepo AI-Powered", desc: "Built-in AI that creates content, runs campaigns, and automates your entire marketing stack." },
  { icon: ShieldCheck, label: "Enterprise Security", desc: "SSL, WAF, DDoS protection, GDPR compliance, and 99.9% uptime SLA on every plan." },
  { icon: Users, label: "Local Market Experts", desc: "We know Kenya. Our strategists understand your customers, your competition, and your market." },
];

export default function OnePlatform() {
  return (
    <section className="py-24 border-y border-border/40 relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: "radial-gradient(oklch(0.72 0.2 210) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="max-w-7xl mx-auto px-4 md:px-8 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 text-xs text-primary font-mono mb-4">
            WHY NISC CLOUD
          </div>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Everything You Need. One Platform.
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Stop juggling 5 vendors. One dashboard, one team, one invoice — from brand creation to market domination.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {pillars.map((p, i) => (
            <motion.div
              key={p.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.07 }}
              className="flex items-start gap-4 bg-card border border-border/60 rounded-2xl p-5 hover:border-primary/30 transition-all duration-300 group"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 group-hover:bg-primary/15 transition-colors">
                <p.icon size={20} />
              </div>
              <div>
                <div className="font-semibold text-base mb-1">{p.label}</div>
                <div className="text-sm text-muted-foreground leading-relaxed">{p.desc}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
