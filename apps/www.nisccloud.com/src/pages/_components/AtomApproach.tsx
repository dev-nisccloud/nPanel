import { motion } from "motion/react";
import { Paintbrush, Server, TrendingUp, Bot, ArrowRight, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button.tsx";

const steps = [
  {
    number: "01",
    icon: Paintbrush,
    tag: "CREATE",
    accent: "#3b82f6",
    accentLight: "#3b82f615",
    headline: "We shape your brand and site",
    subline: "A clear look and message so people understand you quickly and remember you.",
    proof: "Logo · Website · Copy · Identity",
    stat: "Clear",
    statLabel: "brand and site package",
    badge: "✓ Delivered",
    badgeColor: "#3b82f6",
    emotion: "Walk into any room and your brand already feels familiar.",
    progress: 88,
  },
  {
    number: "02",
    icon: Server,
    tag: "HOST",
    accent: "#06b6d4",
    accentLight: "#06b6d415",
    headline: "We keep you online and trusted",
    subline: "Fast hosting, your domain, and business email so customers find you and believe you.",
    proof: "Hosting · Domain · Email · SSL",
    stat: "99.99%",
    statLabel: "uptime, with 24/7 support",
    badge: "● Online",
    badgeColor: "#06b6d4",
    emotion: "Customers check you late at night. Your site should still look sharp.",
    progress: 99,
  },
  {
    number: "03",
    icon: TrendingUp,
    tag: "MARKET",
    accent: "#8b5cf6",
    accentLight: "#8b5cf615",
    headline: "We bring the right people to you",
    subline: "SEO, ads, social, and email that focus on real interest, not empty traffic.",
    proof: "SEO · Ads · Social · Email",
    stat: "30 days",
    statLabel: "results promise",
    badge: "Growing",
    badgeColor: "#8b5cf6",
    emotion: "Spend should bring people who can buy, not just more clicks.",
    progress: 72,
  },
  {
    number: "04",
    icon: Bot,
    tag: "AUTOMATE",
    accent: "#10b981",
    accentLight: "#10b98115",
    headline: "We help you grow after hours",
    subline: "AI chat, follow-ups, and simple workflows that keep working while you rest.",
    proof: "AI Chat · CRM · Campaigns · Workflows",
    stat: "24/7",
    statLabel: "tools that keep following up",
    badge: "● AI Active",
    badgeColor: "#10b981",
    emotion: "You focus on the business. Smart tools handle the repeat work.",
    progress: 95,
  },
];

export default function AtomApproach() {
  const navigate = useNavigate();

  const getBadgeIcon = (stepNumber: string) => {
    switch (stepNumber) {
      case "01":
        return <CheckCircle2 size={10} className="shrink-0" />;
      case "02":
        return (
          <span className="relative flex h-2 w-2 mr-0.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
        );
      case "03":
        return <TrendingUp size={10} className="shrink-0" />;
      case "04":
        return (
          <span className="relative flex h-2 w-2 mr-0.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
        );
      default:
        return <CheckCircle2 size={10} className="shrink-0" />;
    }
  };

  return (
    <section id="approach" className="py-20 relative">
      <div className="max-w-7xl mx-auto px-4 md:px-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 text-xs text-primary font-mono mb-4 tracking-wider">
            YOUR GROWTH PATH
          </div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
            Create. Host. Market. Automate.
          </h2>
          <p className="text-muted-foreground text-base max-w-xl mx-auto">
            One team for the full journey. Fewer handoffs. Clear ownership from day one.
          </p>
        </motion.div>

        {/* 4-in-a-row grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: i * 0.09 }}
              className="rounded-2xl border border-border/60 p-5 relative overflow-hidden flex flex-col hover:border-primary/30 hover:-translate-y-1 transition-all duration-300 bg-card/50"
              style={{ background: `radial-gradient(ellipse 130% 90% at 0% 0%, ${step.accentLight}, transparent)` }}
            >
              {/* Watermark number */}
              <div
                className="absolute -top-1 -right-1 text-7xl font-extrabold font-mono opacity-[0.04] leading-none select-none pointer-events-none"
                style={{ color: step.accent }}
              >
                {step.number}
              </div>

              {/* Icon + tag */}
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${step.accent}18`, color: step.accent }}
                >
                  <step.icon size={19} />
                </div>
                <span
                  className="text-[10px] font-mono font-bold tracking-widest"
                  style={{ color: step.accent }}
                >
                  {step.tag}
                </span>
              </div>

              {/* Headline */}
              <h3 className="font-bold text-base leading-snug mb-2 text-foreground">{step.headline}</h3>

              {/* Emotional line */}
              <p className="text-xs text-muted-foreground leading-relaxed italic mb-3 border-l-2 pl-3" style={{ borderColor: `${step.accent}50` }}>
                "{step.emotion}"
              </p>

              {/* Subline */}
              <p className="text-xs text-muted-foreground leading-relaxed mb-4">{step.subline}</p>

              {/* Proof pills */}
              <div className="flex flex-wrap gap-1 mb-5">
                {step.proof.split(" · ").map((p) => (
                  <span
                    key={p}
                    className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: `${step.accent}12`, color: step.accent }}
                  >
                    {p}
                  </span>
                ))}
              </div>

              {/* Spacer */}
              <div className="flex-1" />

              {/* Big stat */}
              <div className="mb-3">
                <div className="flex items-baseline gap-1.5 mb-0.5">
                  <span className="text-2xl font-extrabold leading-none" style={{ color: step.accent }}>{step.stat}</span>
                </div>
                <span className="text-[11px] text-muted-foreground">{step.statLabel}</span>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-3">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${step.progress}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.9, delay: 0.2 + i * 0.09, ease: "easeOut" as const }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: step.accent }}
                />
              </div>

              {/* Badge */}
              <span
                className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full self-start"
                style={{ backgroundColor: `${step.badgeColor}15`, color: step.badgeColor }}
              >
                {getBadgeIcon(step.number)}
                {step.badge}
              </span>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mt-12"
        >
          <Button
            onClick={() => navigate("/contact")}
            size="lg"
            className="rounded-full px-10 h-12 font-bold text-base gap-2 cursor-pointer"
          >
            Get Your Free Strategy Call
            <ArrowRight size={16} />
          </Button>
          <p className="text-xs text-muted-foreground mt-3">No commitment. 30 minutes. Real plan.</p>
        </motion.div>
      </div>
    </section>
  );
}
