import { motion } from "motion/react";
import { ArrowRight, Zap, Paintbrush, Server, TrendingUp, Bot } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { useNavigate } from "react-router-dom";

const services = [
  { icon: Paintbrush, label: "Create", sub: "Brand & Web Design" },
  { icon: Server, label: "Host", sub: "Cloud & Domains" },
  { icon: TrendingUp, label: "Market", sub: "SEO & Paid Ads" },
  { icon: Bot, label: "Automate", sub: "Zeepo AI" },
];

const metrics = [
  { value: "500+", label: "Businesses" },
  { value: "99.9%", label: "Uptime" },
  { value: "+143%", label: "Revenue" },
  { value: "30 days", label: "Results" },
];

const socialProof = [
  { dot: "bg-emerald-400", text: "500+ Businesses Powered" },
  { dot: "bg-primary", text: "99.9% Uptime" },
  { dot: "bg-amber-400", text: "Results in 30 Days" },
];

function PlatformPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.3 }}
      className="w-full max-w-[460px] bg-card border border-border rounded-2xl shadow-xl overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2.5">
          <img src="/nisccloud-logo.svg" alt="Nisc Cloud" className="h-6 w-auto" />
          <span className="text-sm font-semibold text-foreground">Nisc Cloud Platform</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-xs text-muted-foreground">Active</span>
        </div>
      </div>

      {/* Service grid */}
      <div className="p-4 grid grid-cols-2 gap-2.5">
        {services.map((s) => (
          <div
            key={s.label}
            className="flex items-start gap-3 p-3.5 bg-muted/40 hover:bg-muted/70 rounded-xl transition-colors cursor-default"
          >
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-0.5">
              <s.icon size={15} />
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground leading-none mb-1">{s.label}</div>
              <div className="text-xs text-muted-foreground">{s.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Metrics strip */}
      <div className="grid grid-cols-4 border-t border-border">
        {metrics.map((m, i) => (
          <div
            key={m.label}
            className={`px-2 py-4 text-center ${i < 3 ? "border-r border-border" : ""}`}
          >
            <div className="text-base font-bold text-primary leading-none mb-1">{m.value}</div>
            <div className="text-[10px] text-muted-foreground leading-none">{m.label}</div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-5 py-3.5 bg-muted/30 border-t border-border flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">Trusted across Kenya & Africa</span>
        <span className="text-xs font-mono text-muted-foreground/50">nisccloud.com</span>
      </div>
    </motion.div>
  );
}

export default function Hero() {
  const navigate = useNavigate();

  return (
    <section
      id="hero"
      className="relative flex items-center pt-16 overflow-x-hidden lg:min-h-[90vh] bg-background"
    >
      {/* Subtle dot grid */}
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(oklch(0.6 0.02 240 / 0.4) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      {/* Soft radial accent */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 65% 55% at 82% 40%, oklch(0.92 0.04 235 / 0.22) 0%, transparent 70%)",
        }}
      />

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-20 lg:py-28 grid lg:grid-cols-2 gap-14 lg:gap-20 items-center w-full relative z-10">

        {/* Left: text */}
        <div className="max-w-xl">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 text-xs text-primary font-medium mb-7"
          >
            <Zap size={11} className="fill-primary" />
            Kenya's All-In-One Digital Partner
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.08 }}
            className="text-5xl md:text-6xl lg:text-[66px] font-bold leading-[1.06] tracking-tight text-balance mb-5"
          >
            Create. Launch.<br />
            <span className="text-primary">Grow.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.16 }}
            className="text-lg text-muted-foreground leading-relaxed mb-9 max-w-md"
          >
            We build your brand, put it online, and drive real growth - web design, cloud hosting, SEO, and AI automation, all under one roof.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.24 }}
            className="flex flex-col sm:flex-row gap-3 mb-10"
          >
            <Button
              size="lg"
              onClick={() => navigate("/contact")}
              className="bg-primary text-primary-foreground hover:opacity-90 cursor-pointer font-semibold text-[15px] px-7 gap-2 rounded-full"
            >
              Get Your Free Strategy Call
              <ArrowRight size={15} />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/pricing")}
              className="cursor-pointer font-medium text-[15px] rounded-full"
            >
              View Pricing
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground"
          >
            {socialProof.map(({ dot, text }) => (
              <div key={text} className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${dot}`} />
                <span>{text}</span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Right: clean platform card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.25 }}
          className="hidden lg:flex justify-center items-center"
        >
          <PlatformPreview />
        </motion.div>

      </div>
    </section>
  );
}
