import { motion } from "motion/react";
import { ShieldCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { useNavigate } from "react-router-dom";

const trustPoints = [
  "SSL Certificates",
  "Malware Scanning & Removal",
  "Web Application Firewall",
  "DDoS Protection",
  "Daily Backups",
  "24/7 Security Monitoring",
];

export default function SecurityHero() {
  const navigate = useNavigate();

  return (
    <section className="relative pt-28 pb-16 overflow-hidden">
      {/* Gradient atmosphere */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(135deg, oklch(0.96 0.05 235 / 0.55) 0%, oklch(0.97 0.03 260 / 0.35) 50%, oklch(0.96 0.04 195 / 0.40) 100%)" }} />
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 80% 60% at 70% 50%, oklch(0.88 0.12 235 / 0.30) 0%, transparent 65%)" }} />
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 40% 60% at 10% 80%, oklch(0.84 0.14 195 / 0.18) 0%, transparent 60%)" }} />

      <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: copy */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.55 }}
          >
            <span className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-5">
              <ShieldCheck size={13} />
              Website Security
            </span>
            <h1 className="text-4xl md:text-5xl xl:text-6xl font-extrabold leading-tight mb-5 text-balance">
              Keep Your Website
              <br />
              <span className="text-primary">Safe and Online</span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed mb-6 max-w-xl">
              SSL certificates, malware scanning, firewall protection, and daily backups, managed by our security team so you can focus on your business.
            </p>
            <div className="flex flex-wrap gap-2 mb-8">
              {trustPoints.map((p) => (
                <span key={p} className="flex items-center gap-1.5 bg-primary/8 text-primary text-xs font-medium px-3 py-1.5 rounded-full border border-primary/15">
                  <ShieldCheck size={11} />
                  {p}
                </span>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                className="bg-primary text-primary-foreground font-bold px-8 rounded-2xl h-12 cursor-pointer hover:opacity-90 gap-2"
                onClick={() => document.getElementById("security-plans")?.scrollIntoView({ behavior: "smooth" })}
              >
                See Plans &amp; Pricing <ArrowRight size={15} />
              </Button>
              <Button
                variant="ghost"
                className="border border-border rounded-2xl h-12 cursor-pointer font-medium hover:border-primary/40"
                onClick={() => navigate("/contact")}
              >
                Talk to an Expert
              </Button>
            </div>
          </motion.div>

          {/* Right: security illustration */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.65, delay: 0.1 }}
            className="hidden lg:flex items-center justify-center"
          >
            <SecurityIllustration />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function SecurityIllustration() {
  return (
    <div
      className="rounded-3xl border border-primary/15 shadow-2xl p-8 w-full max-w-[500px]"
      style={{ background: "linear-gradient(135deg, oklch(0.97 0.04 240 / 0.9) 0%, oklch(0.95 0.05 260 / 0.7) 50%, oklch(0.96 0.04 210 / 0.8) 100%)" }}
    >
      {/* Security score card */}
      <div className="bg-white/90 rounded-2xl p-5 mb-4 shadow-sm border border-border/30">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Security Score</p>
            <p className="text-2xl font-extrabold text-emerald-500">A+</p>
          </div>
          <div className="w-14 h-14 rounded-full border-4 border-emerald-400 flex items-center justify-center">
            <ShieldCheck size={24} className="text-emerald-500" />
          </div>
        </div>
        <div className="space-y-2.5">
          {[
            { label: "SSL Certificate", status: "Active", color: "bg-emerald-400" },
            { label: "Malware Scan", status: "Clean", color: "bg-emerald-400" },
            { label: "Firewall", status: "Enabled", color: "bg-emerald-400" },
            { label: "Daily Backup", status: "Completed", color: "bg-blue-400" },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{item.label}</span>
              <span className={`flex items-center gap-1.5 text-[10px] font-semibold text-emerald-600`}>
                <span className={`w-2 h-2 rounded-full ${item.color}`} />
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Threat blocked ticker */}
      <div className="bg-white/70 rounded-xl px-4 py-3 border border-border/20">
        <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-2">Recent Activity</p>
        <div className="space-y-1.5">
          {[
            { event: "SQL injection attempt blocked", time: "2m ago", danger: true },
            { event: "Malware scan completed - clean", time: "1h ago", danger: false },
            { event: "SSL renewed automatically", time: "3d ago", danger: false },
          ].map((e, i) => (
            <div key={i} className="flex items-center justify-between gap-2">
              <span className={`text-[11px] ${e.danger ? "text-destructive" : "text-foreground/70"} leading-snug`}>
                {e.danger ? "🛡 " : "✓ "}{e.event}
              </span>
              <span className="text-[10px] text-muted-foreground whitespace-nowrap">{e.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
