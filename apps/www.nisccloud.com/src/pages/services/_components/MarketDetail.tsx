import { motion } from "motion/react";
import { Check, Search, TrendingUp, Share2, Mail } from "lucide-react";

const features = [
  { icon: Search, title: "SEO & Content", desc: "Technical audits, keyword strategy, link building, and content that dominates search rankings." },
  { icon: TrendingUp, title: "Paid Media", desc: "AI-optimized campaigns across Google, Meta, TikTok, and LinkedIn to maximize your ROAS." },
  { icon: Share2, title: "Social Media", desc: "End-to-end management: strategy, design, posting, and community engagement across all platforms." },
  { icon: Mail, title: "Email Marketing", desc: "Automated sequences, broadcast campaigns, and A/B testing to turn subscribers into buyers." },
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
  { value: "3.8×", label: "Average ROAS" },
  { value: "+247%", label: "Organic traffic" },
  { value: "4.2%", label: "Email open rate avg." },
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
              <span style={{ color: "oklch(0.70 0.22 240)" }}>Data-Driven Results.</span>
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-8">
              We don't run campaigns in silos. Every channel - SEO, paid ads, social, email - feeds into one unified growth strategy with a single ROI goal.
            </p>
            <ul className="grid grid-cols-2 gap-2 mb-8">
              {included.map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check size={14} style={{ color: "oklch(0.70 0.22 240)" }} className="shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            {/* Metrics row */}
            <div className="flex gap-6 border-t border-border/40 pt-6">
              {metrics.map((m) => (
                <div key={m.label}>
                  <div className="text-2xl font-bold" style={{ color: "oklch(0.70 0.22 240)" }}>{m.value}</div>
                  <div className="text-xs text-muted-foreground">{m.label}</div>
                </div>
              ))}
            </div>
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
              <div className="text-2xl font-bold" style={{ color: "oklch(0.70 0.22 240)" }}>+247%</div>
              <div className="text-xs text-muted-foreground">Avg. organic traffic growth</div>
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
