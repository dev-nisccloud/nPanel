import { motion } from "motion/react";
import { Check, Search, TrendingUp, Share2, Mail } from "lucide-react";
import ServiceStatistics, {
  trustStatsToStatisticsItems,
} from "@/components/shadcn-space/blocks/statistics-02/statistics.tsx";
import { ShowcaseVisualCard } from "@/pages/_components/ServiceShowcaseSection.tsx";

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
          >
            <ShowcaseVisualCard visual="reporting" headline="Clear growth reporting" />
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
