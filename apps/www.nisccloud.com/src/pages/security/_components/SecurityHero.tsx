import { motion } from "motion/react";
import { ShieldCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { useNavigate } from "react-router-dom";
import { niscWebsiteImage } from "@/lib/nisc-website-images.ts";
import { NiscWebsiteHeroImage } from "@/components/NiscWebsiteHeroImage.tsx";

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

          {/* Right: hero image */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.65, delay: 0.1 }}
            className="hidden lg:flex items-center justify-center"
          >
            <NiscWebsiteHeroImage
              src={niscWebsiteImage("website security.png")}
              alt="Website security protection"
              standalone
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
