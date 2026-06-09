import { motion } from "motion/react";
import { Check, ArrowRight, ShieldCheck, Star } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { cn } from "@/lib/utils.ts";
import { useNavigate } from "react-router-dom";

const plans = [
  {
    id: "standard",
    name: "Website Security Standard",
    tagline: "Essential protection for one website",
    from: 2500,
    period: "mo",
    billingNote: "With a 12-month term",
    features: [
      "Helps protect one website",
      "SSL certificate included",
      "Daily malware scanning (4×/day)",
      "Site cleanup and repair 1× per year",
      "Blacklist monitoring",
      "SEO spam monitoring",
      "Uptime monitoring & alerts",
    ],
  },
  {
    id: "advanced",
    name: "Website Security Advanced",
    tagline: "Enhanced protection + performance",
    from: 5500,
    period: "mo",
    billingNote: "With a 12-month term",
    badge: "RECOMMENDED",
    recommended: true,
    features: [
      "Helps protect one website",
      "SSL certificate included",
      "Daily malware scanning (4×/day)",
      "Site cleanup and repair 5× per year",
      "25 GB secure daily backup",
      "Up to 5× faster performance",
      "DDoS protection",
      "Web Application Firewall (WAF)",
    ],
  },
  {
    id: "premium",
    name: "Website Security Premium",
    tagline: "Unlimited cleanups + full backup",
    from: 9000,
    period: "mo",
    billingNote: "With a 12-month term",
    features: [
      "Helps protect one website",
      "SSL certificate included",
      "Daily malware scanning (4×/day)",
      "Unlimited site cleanup and repair",
      "Unlimited storage — secure daily backup",
      "Up to 5× faster performance",
      "DDoS protection + CDN acceleration",
      "Web Application Firewall (WAF)",
      "Priority response SLA",
    ],
  },
];

export default function SecurityPlans() {
  const navigate = useNavigate();

  return (
    <section id="security-plans" className="py-20 border-y border-primary/10" style={{ background: "linear-gradient(160deg, oklch(0.97 0.03 235 / 0.6) 0%, oklch(0.96 0.04 260 / 0.4) 50%, oklch(0.97 0.03 195 / 0.5) 100%)" }}>
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="text-center mb-12">
          <span className="text-xs font-mono font-bold tracking-widest text-primary uppercase">Website Security Plans</span>
          <h2 className="text-3xl font-bold mt-2 mb-3">Choose Your Protection Level</h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm">100% risk-free, 30-day money-back guarantee. All plans include a free SSL certificate.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className={cn(
                "relative rounded-3xl border bg-card flex flex-col overflow-hidden",
                plan.recommended
                  ? "border-primary shadow-2xl shadow-primary/10 scale-[1.02]"
                  : "border-border hover:border-primary/30 hover:shadow-lg transition-all"
              )}
            >
              {plan.recommended && (
                <div className="bg-primary text-primary-foreground text-[11px] font-bold text-center py-2 tracking-wider flex items-center justify-center gap-1.5">
                  <Star size={11} className="fill-primary-foreground" />
                  MOST POPULAR
                </div>
              )}
              <div className="p-7 flex flex-col flex-1">
                <h3 className="font-bold text-lg mb-1">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mb-5 leading-snug">{plan.tagline}</p>

                <div className="mb-1">
                  <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1">As Low As</p>
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-extrabold text-primary leading-none">
                      KES {plan.from.toLocaleString()}
                    </span>
                    <span className="text-muted-foreground text-sm mb-0.5">/{plan.period}</span>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground mb-6">{plan.billingNote}</p>

                <ul className="space-y-2.5 flex-1 mb-7">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm">
                      <Check size={14} className="text-primary shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className={cn(
                    "w-full font-semibold rounded-2xl cursor-pointer h-11 gap-1.5",
                    plan.recommended
                      ? "bg-primary text-primary-foreground hover:opacity-90"
                      : "bg-muted text-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                  )}
                  onClick={() => navigate("/contact")}
                >
                  Get Started <ArrowRight size={15} />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          <ShieldCheck size={14} className="inline mr-1.5 text-primary" />
          All plans include a free SSL certificate and 30-day money-back guarantee.
        </div>
      </div>
    </section>
  );
}
