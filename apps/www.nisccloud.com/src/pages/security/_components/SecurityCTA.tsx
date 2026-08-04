import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { useNavigate } from "react-router-dom";

type SecurityCTAProps = {
  title?: string;
  description?: string;
  ctaLabel?: string;
  plansId?: string;
  footnote?: string;
};

export default function SecurityCTA({
  title = "Protect Your Site With Clear, Managed Security",
  description = "Add SSL, malware scanning, firewall protection, and backups so your website stays safe and available for your customers.",
  ctaLabel = "View Security Plans",
  plansId = "security-plans",
  footnote = "30-day money-back guarantee. Setup help included.",
}: SecurityCTAProps = {}) {
  const navigate = useNavigate();

  return (
    <section className="py-20 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-3xl mx-auto text-center rounded-3xl p-12 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, oklch(0.60 0.22 235 / 0.12) 0%, oklch(0.55 0.18 195 / 0.08) 50%, oklch(0.58 0.20 265 / 0.10) 100%)",
          border: "1px solid oklch(0.60 0.22 235 / 0.20)",
        }}
      >
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, oklch(0.60 0.22 235 / 0.15) 0%, transparent 70%)" }} />
        <div className="absolute -bottom-12 -left-12 w-40 h-40 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, oklch(0.55 0.18 195 / 0.12) 0%, transparent 70%)" }} />
        <div className="relative z-10">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">{title}</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">{description}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              className="bg-primary text-primary-foreground font-bold px-8 rounded-2xl h-12 cursor-pointer hover:opacity-90 gap-2"
              onClick={() => document.getElementById(plansId)?.scrollIntoView({ behavior: "smooth" })}
            >
              {ctaLabel} <ArrowRight size={16} />
            </Button>
            <Button
              variant="ghost"
              className="border border-border rounded-2xl h-12 cursor-pointer font-medium hover:border-primary/40"
              onClick={() => navigate("/contact")}
            >
              Talk to an Expert
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-6">{footnote}</p>
        </div>
      </motion.div>
    </section>
  );
}
