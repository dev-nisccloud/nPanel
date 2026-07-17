import { motion } from "motion/react";
import { ArrowRight, Search, Globe, TrendingUp, ShoppingBag, Users } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { useNavigate } from "react-router-dom";

const auditPoints = [
  { icon: ShoppingBag, label: "Brand & visual identity" },
  { icon: Globe, label: "Website & hosting health" },
  { icon: TrendingUp, label: "Marketing & ad performance" },
  { icon: Users, label: "Customer acquisition setup" },
];

export default function GrowthAuditCTA() {
  const navigate = useNavigate();

  return (
    <section className="py-20 relative overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 50%, oklch(0.72 0.2 210 / 0.06), transparent)",
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(oklch(0.72 0.2 210) 1px, transparent 1px), linear-gradient(90deg, oklch(0.72 0.2 210) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="max-w-4xl mx-auto px-4 md:px-8 relative">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
          className="bg-card border border-border/60 rounded-3xl p-10 md:p-14 text-center shadow-xl"
          style={{
            background:
              "radial-gradient(ellipse 120% 80% at 50% 0%, oklch(0.72 0.2 210 / 0.07), transparent), var(--card)",
          }}
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 text-xs text-primary font-mono mb-6">
            <Search size={11} />
            FREE GROWTH AUDIT
          </div>

          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-[1.1] mb-5 text-balance">
            Not sure where to start?
            <br className="hidden md:block" />
            <span className="text-primary"> We will show you what matters most.</span>
          </h2>

          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto mb-8 leading-relaxed">
            Book a free growth audit. We review your brand, website, hosting, and marketing, then outline clear next steps to help you get online, stay online, and grow.
          </p>

          {/* What we review */}
          <div className="flex flex-wrap justify-center gap-3 mb-10">
            {auditPoints.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-2 bg-muted/60 border border-border/50 rounded-full px-4 py-2 text-sm text-foreground/70"
              >
                <Icon size={14} className="text-primary" />
                {label}
              </div>
            ))}
          </div>

          {/* CTA */}
          <Button
            size="lg"
            onClick={() => navigate("/contact")}
            className="rounded-full px-10 h-13 font-bold text-base gap-2.5 cursor-pointer shadow-lg"
          >
            Book Your Free Growth Audit
            <ArrowRight size={17} />
          </Button>
          <p className="text-xs text-muted-foreground mt-4">
            No commitment. Just an honest plan for your business, in about 30 minutes.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
