import { motion } from "motion/react";
import { Check, Search, TrendingUp, Share2, Mail } from "lucide-react";
import ServiceStatistics, {
  trustStatsToStatisticsItems,
} from "@/components/shadcn-space/blocks/statistics-02/statistics.tsx";

const features = [
  { icon: Search, title: "SEO & Content", desc: "Technical audits, keyword strategy, and content that help people find you on Google, Maps, and AI answers." },
  { icon: TrendingUp, title: "Paid Media", desc: "Campaigns across Google, Meta, TikTok, and LinkedIn managed for leads and sales, with clear reporting." },
  { icon: Share2, title: "Social Media", desc: "Strategy, design, posting, and community replies across the platforms your customers use." },
  { icon: Mail, title: "Email Marketing", desc: "Automated sequences, broadcast campaigns, and testing to turn subscribers into buyers." },
];

const included = [
  "Full SEO audit & strategy",
  "Google & Meta ad campaigns",
  "Social media management",
  "Monthly analytics reports",
  "Content calendar",
  "Dedicated account manager",
];

const metrics = [
  { value: "100+", label: "Clients we support" },
  { value: "24/7", label: "Support available" },
  { value: "30 days", label: "Results promise" },
];

export default function MarketDetail() {
  return (
    <section id="market" className="py-24 border-t border-border/40">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center mb-16">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 border rounded-full px-4 py-1.5 text-xs font-mono mb-4" style={{ backgroundColor: "oklch(0.70 0.22 240 / 0.1)", borderColor: "oklch(0.70 0.22 240 / 0.3)", color: "oklch(0.70 0.22 240)" }}>
              03 - MARKET
            </div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-5">
              Full-Stack Growth.<br />
              <span style={{ color: "oklch(0.70 0.22 240)" }}>Clear Reporting.</span>
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-8">
              We do not run channels in isolation. SEO, paid ads, social, and email feed one growth plan, with reporting you can understand and a 30-day results promise on active work.
            </p>
            <ul className="grid grid-cols-2 gap-2 mb-8">
              {included.map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check size={14} style={{ color: "oklch(0.70 0.22 240)" }} className="shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <ServiceStatistics
              embedded
              compact
              className="pt-6"
              items={trustStatsToStatisticsItems(
                metrics.map((m) => ({ label: m.label, value: m.value })),
              )}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="relative rounded-2xl overflow-hidden aspect-[4/3]"
          >
            <img
              src="https://images.unsplash.com/photo-1686061594225-3e92c0cd51b0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=900"
              alt="Marketing analytics"
              className="w-full h-full object-cover opacity-60"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-background/80 via-transparent to-transparent" />
            <div className="absolute bottom-6 right-6 bg-card/90 backdrop-blur border border-border/60 rounded-xl px-5 py-3">
              <div className="text-2xl font-bold" style={{ color: "oklch(0.70 0.22 240)" }}>30 days</div>
              <div className="text-xs text-muted-foreground">Results promise on active work</div>
            </div>
          </motion.div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="bg-card border border-border/60 rounded-xl p-5 transition-all hover:border-[oklch(0.70_0.22_240/0.4)]"
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3" style={{ backgroundColor: "oklch(0.70 0.22 240 / 0.12)", color: "oklch(0.70 0.22 240)" }}>
                <f.icon size={16} />
              </div>
              <h4 className="font-semibold text-sm mb-1">{f.title}</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
