import { motion } from "motion/react";
import { LayoutDashboard, Headphones, BarChart3, Bot, ShieldCheck, Users } from "lucide-react";

const pillars = [
  { icon: LayoutDashboard, label: "One Clear Team", desc: "One team, one plan, one bill. Create, host, market, and automate without juggling vendors." },
  { icon: Headphones, label: "24/7 Support", desc: "Real people ready around the clock when something needs fixing." },
  { icon: BarChart3, label: "Clear Reporting", desc: "We measure what matters and show you progress in plain language." },
  { icon: Bot, label: "Zeepo AI-Powered", desc: "Smart tools that help with content, campaigns, and follow-ups." },
  { icon: ShieldCheck, label: "Strong Security", desc: "SSL, WAF, DDoS protection, and a 99.99% uptime target on hosting." },
  { icon: Users, label: "Built for Growth", desc: "Hosting and marketing that work together for businesses of every size." },
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
            Stop juggling 5 vendors. One dashboard, one team, one invoice - from brand creation to market domination.
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
