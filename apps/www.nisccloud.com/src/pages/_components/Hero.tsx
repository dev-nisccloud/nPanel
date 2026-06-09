import { motion } from "motion/react";
import {
  ArrowRight, Zap, TrendingUp, Users, Globe, ShieldCheck, Bot, Sparkles, BrainCircuit,
} from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { useNavigate } from "react-router-dom";

type MetricCard = {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  color: string;
  pos: string;
  delay: number;
  floatY: number;
};

const cards: MetricCard[] = [
  {
    icon: <TrendingUp size={16} />,
    label: "Revenue Growth",
    value: "+143%",
    sub: "avg. client YoY",
    color: "text-emerald-400",
    pos: "top-[4%] left-[10%]",
    delay: 0,
    floatY: -10,
  },
  {
    icon: <Users size={16} />,
    label: "Businesses Powered",
    value: "500+",
    sub: "across Kenya",
    color: "text-blue-400",
    pos: "top-[2%] right-[8%]",
    delay: 0.4,
    floatY: 8,
  },
  {
    icon: <Globe size={16} />,
    label: "Sites Launched",
    value: "1,200+",
    sub: "live this year",
    color: "text-cyan-400",
    pos: "top-[38%] right-[2%]",
    delay: 0.8,
    floatY: -8,
  },
  {
    icon: <ShieldCheck size={16} />,
    label: "Uptime",
    value: "99.9%",
    sub: "guaranteed SLA",
    color: "text-violet-400",
    pos: "bottom-[10%] right-[10%]",
    delay: 1.2,
    floatY: 10,
  },
  {
    icon: <Bot size={16} />,
    label: "AI Integration",
    value: "Built-In",
    sub: "on every project",
    color: "text-fuchsia-400",
    pos: "bottom-[8%] left-[6%]",
    delay: 1.6,
    floatY: -9,
  },
  {
    icon: <Sparkles size={16} />,
    label: "AI Results In",
    value: "30 Days",
    sub: "or we keep working",
    color: "text-orange-400",
    pos: "top-[40%] left-[0%]",
    delay: 2,
    floatY: 7,
  },
];

function CardContent({ card }: { card: MetricCard }) {
  return (
    <>
      <div className={`flex items-center gap-1.5 ${card.color} mb-1`}>
        {card.icon}
        <span className="text-[10px] font-semibold uppercase tracking-wide text-foreground/50">{card.label}</span>
      </div>
      <div className={`text-2xl font-bold ${card.color} leading-none`}>{card.value}</div>
      <div className="text-[11px] text-foreground/40 mt-0.5">{card.sub}</div>
    </>
  );
}

function FloatingMetrics() {
  return (
    <>
      {/* Desktop only: floating absolute layout */}
      <div className="hidden lg:block relative w-full h-[520px]">
        {/* Center glow */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-56 h-56 rounded-full bg-blue-500/20 blur-3xl" />
        </div>

        {/* Center logo + AI badge */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex flex-col items-center gap-2"
          >
            <img src="/nisccloud-logo.svg" alt="Nisc Cloud" className="w-16 h-16 opacity-90" />
            <span className="text-xs font-mono text-white/50 tracking-widest uppercase">Nisc Cloud</span>
            {/* AI badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 1.2 }}
              className="flex items-center gap-1.5 bg-fuchsia-500/20 border border-fuchsia-400/30 rounded-full px-3 py-1 mt-1"
            >
              <BrainCircuit size={11} className="text-fuchsia-400" />
              <span className="text-[10px] text-fuchsia-300 font-semibold tracking-wide">AI-POWERED</span>
            </motion.div>
          </motion.div>
        </div>

        {/* Connector lines */}
        <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <line x1="50%" y1="50%" x2="20%" y2="12%" stroke="white" strokeWidth="1" strokeDasharray="4 4" />
          <line x1="50%" y1="50%" x2="82%" y2="8%" stroke="white" strokeWidth="1" strokeDasharray="4 4" />
          <line x1="50%" y1="50%" x2="96%" y2="48%" stroke="white" strokeWidth="1" strokeDasharray="4 4" />
          <line x1="50%" y1="50%" x2="78%" y2="88%" stroke="white" strokeWidth="1" strokeDasharray="4 4" />
          <line x1="50%" y1="50%" x2="22%" y2="86%" stroke="white" strokeWidth="1" strokeDasharray="4 4" />
          <line x1="50%" y1="50%" x2="4%" y2="48%" stroke="white" strokeWidth="1" strokeDasharray="4 4" />
        </svg>

        {cards.map((card) => (
          /* Outer: entrance animation (fade + slide up) */
          <motion.div
            key={card.label}
            className={`absolute ${card.pos}`}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: card.delay, ease: "easeOut" as const }}
          >
            {/* Inner: continuous float loop */}
            <motion.div
              className="bg-card border border-border/60 rounded-2xl px-4 py-3 min-w-[140px] shadow-md"
              animate={{ y: [0, card.floatY, 0] }}
              transition={{
                duration: 3.5 + card.delay * 0.4,
                repeat: Infinity,
                ease: "easeInOut" as const,
                delay: card.delay * 0.3,
              }}
            >
              <CardContent card={card} />
            </motion.div>
          </motion.div>
        ))}
      </div>
    </>
  );
}

export default function Hero() {
  const navigate = useNavigate();

  return (
    <section
      id="hero"
      className="relative flex items-center pt-16 overflow-x-hidden lg:min-h-[90vh] lg:pb-0 bg-background"
    >
      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(oklch(0.7 0.01 240 / 0.25) 1px, transparent 1px), linear-gradient(90deg, oklch(0.7 0.01 240 / 0.25) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      {/* Light radial glow */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 80% 60% at 70% 50%, oklch(0.92 0.06 235 / 0.30) 0%, transparent 70%)" }} />
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 40% 60% at 10% 80%, oklch(0.88 0.08 195 / 0.15) 0%, transparent 60%)" }} />

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12 lg:py-20 grid lg:grid-cols-2 gap-10 lg:gap-12 items-center w-full relative z-10">

        {/* Text content */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 text-xs text-primary font-mono mb-6"
          >
            <Zap size={12} className="fill-primary text-primary" />
            KENYA&apos;S ALL-IN-ONE DIGITAL PARTNER
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight text-balance mb-3"
          >
            <span className="text-foreground">Create.</span>{" "}
            <span className="text-primary">Launch.</span>{" "}
            <span className="text-foreground">Grow.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.18 }}
            className="text-xl md:text-2xl font-semibold text-foreground/80 mb-4 max-w-lg"
          >
            Kenya's #1 All-In-One Digital Partner for Businesses
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.26 }}
            className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-lg"
          >
            We create your brand, take it online, and make it grow. Web design, cloud hosting, SEO, and AI automation — all under one roof for Kenyan businesses.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="flex flex-col sm:flex-row gap-3"
          >
            <Button
              size="lg"
              onClick={() => navigate("/contact")}
              className="bg-primary text-white hover:opacity-90 cursor-pointer font-semibold text-base px-8 gap-2 rounded-full"
            >
              Get Your Free Strategy Call <ArrowRight size={16} />
            </Button>
            <Button
              size="lg"
              variant="ghost"
              onClick={() => navigate("/pricing")}
              className="border border-border hover:bg-muted text-foreground cursor-pointer font-semibold text-base rounded-full"
            >
              View Pricing
            </Button>
          </motion.div>

          {/* Social proof strip */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-muted-foreground"
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_2px_rgba(52,211,153,0.6)]" />
              <span>500+ Businesses Powered</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_6px_2px_rgba(96,165,250,0.6)]" />
              <span>99.9% Uptime Guaranteed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_2px_rgba(34,211,238,0.6)]" />
              <span>Results in 30 Days</span>
            </div>
          </motion.div>
        </div>

        {/* Floating metrics — desktop only */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="hidden lg:flex justify-center"
        >
          <FloatingMetrics />
        </motion.div>
      </div>
    </section>
  );
}
