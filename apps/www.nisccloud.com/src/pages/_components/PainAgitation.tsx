import { motion } from "motion/react";
import { X, Check, Paintbrush, Globe, TrendingUp, Server, Bot, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { useNavigate } from "react-router-dom";

const vendors = [
  { icon: Paintbrush, label: "Design Agency", color: "oklch(0.65 0.22 25)" },
  { icon: Globe, label: "Web Developer", color: "oklch(0.55 0.18 265)" },
  { icon: Server, label: "Hosting Provider", color: "oklch(0.55 0.20 200)" },
  { icon: TrendingUp, label: "Marketing Agency", color: "oklch(0.55 0.22 145)" },
  { icon: Bot, label: "AI Tools Vendor", color: "oklch(0.52 0.18 300)" },
];

const pains = [
  "5 invoices, 5 logins, 5 different contacts",
  "Brand looks different on every channel",
  "Nobody takes ownership when things break",
  "Months pass with no measurable results",
];

const gains = [
  "One team, one invoice, one strategy",
  "Consistent brand voice everywhere",
  "One account manager who owns outcomes",
  "Results in 30 days  or we keep working",
  "AI automation runs the repetitive work",
];

export default function PainAgitation() {
  const navigate = useNavigate();

  return (
    <section className="py-16 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/20 to-background pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 md:px-8 relative">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 bg-destructive/10 border border-destructive/20 rounded-full px-4 py-1.5 text-xs text-destructive font-mono mb-4">
            SOUND FAMILIAR?
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3 text-balance">
            Still Paying 5 Vendors Separately?
          </h2>
          <p className="text-muted-foreground text-base max-w-xl mx-auto">
            Most Nairobi businesses waste KES 100K+ a year on fragmented tools that don't talk to each other  and get half the results.
          </p>
        </motion.div>

        {/* Vendor chaos pills */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-10"
        >
          <p className="text-center text-sm font-mono font-bold text-destructive tracking-widest mb-6 uppercase">
            The old way  chaos
          </p>
          <div className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto">
            {vendors.map((v, i) => (
              <motion.div
                key={v.label}
                initial={{ opacity: 0, scale: 0.8, rotate: i % 2 === 0 ? -4 : 4 }}
                whileInView={{ opacity: 1, scale: 1, rotate: i % 2 === 0 ? -2 : 2 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border-2 border-dashed bg-card/60"
                style={{ borderColor: `${v.color}40` }}
              >
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${v.color}18`, color: v.color }}
                >
                  <v.icon size={14} />
                </div>
                <span className="text-sm font-semibold text-foreground/70">{v.label}</span>
                <span className="text-[10px] bg-destructive/15 text-destructive font-bold px-1.5 py-0.5 rounded-full">
                  +invoice
                </span>
              </motion.div>
            ))}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.5 }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border-2 border-dashed border-destructive/30 bg-destructive/5"
            >
              <X size={14} className="text-destructive" />
              <span className="text-sm font-bold text-destructive">No one talks to each other</span>
            </motion.div>
          </div>
        </motion.div>

        {/* Before vs After */}
        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto mb-8">
          {/* Pain column */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="bg-card border-2 border-destructive/20 rounded-3xl p-7 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-destructive/5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="text-xs font-mono font-bold tracking-widest text-destructive mb-6 flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-destructive/15 flex items-center justify-center">
                <X size={10} className="text-destructive" />
              </div>
              WITHOUT NISC CLOUD
            </div>
            <div className="space-y-4">
              {pains.map((pain) => (
                <div key={pain} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-destructive/15 flex items-center justify-center shrink-0 mt-0.5">
                    <X size={10} className="text-destructive" />
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{pain}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Gain column */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="rounded-3xl p-7 border-2 border-primary/30 relative overflow-hidden"
            style={{
              background: "radial-gradient(ellipse 120% 80% at 50% 0%, oklch(0.72 0.2 210 / 0.08), transparent)",
            }}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="text-xs font-mono font-bold tracking-widest text-primary mb-6 flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center">
                <Check size={10} className="text-primary" />
              </div>
              WITH NISC CLOUD
            </div>
            <div className="space-y-4">
              {gains.map((gain) => (
                <div key={gain} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
                    <Check size={10} className="text-primary" />
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">{gain}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <Button
            onClick={() => navigate("/contact")}
            className="rounded-full px-8 h-12 font-bold text-base gap-2 cursor-pointer"
          >
            Talk to us  it's free
            <ArrowRight size={16} />
          </Button>
          <p className="text-xs text-muted-foreground mt-3">
            No commitment. We'll map out a plan for your business in 30 minutes.
          </p>
        </motion.div>

      </div>
    </section>
  );
}
