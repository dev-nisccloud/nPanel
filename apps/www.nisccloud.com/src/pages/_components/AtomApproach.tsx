import { motion } from "motion/react";
import { Paintbrush, Server, TrendingUp, Bot, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button.tsx";

const steps = [
  {
    number: "01",
    icon: Paintbrush,
    tag: "Create",
    headline: "We build your brand",
    subline: "Logo, website, copy, and identity - delivered in days, not months.",
    proof: ["Logo Design", "Website", "Copywriting", "Brand Kit"],
    stat: "7 days",
    statLabel: "avg. brand launch",
  },
  {
    number: "02",
    icon: Server,
    tag: "Host",
    headline: "We take you online",
    subline: "Fast, secure, always-on cloud hosting with a domain and email that looks the part.",
    proof: ["Hosting", "Domain", "Business Email", "SSL"],
    stat: "99.9%",
    statLabel: "uptime guaranteed",
  },
  {
    number: "03",
    icon: TrendingUp,
    tag: "Market",
    headline: "We bring customers in",
    subline: "SEO, paid ads, and social media - dialled in to bring real paying customers through your door.",
    proof: ["SEO / GEO", "Google Ads", "Social Media", "Email"],
    stat: "4.2×",
    statLabel: "average client ROAS",
  },
  {
    number: "04",
    icon: Bot,
    tag: "Automate",
    headline: "We help you scale on autopilot",
    subline: "AI chatbots and smart workflows that follow up, nurture, and close leads 24/7.",
    proof: ["AI Chat", "CRM Flows", "Campaigns", "Lead Scoring"],
    stat: "90 sec",
    statLabel: "AI response to every lead",
  },
];

export default function AtomApproach() {
  const navigate = useNavigate();

  return (
    <section id="approach" className="py-20 relative">
      <div className="max-w-7xl mx-auto px-4 md:px-8">

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 text-xs text-primary font-medium mb-4">
            The Nisc Cloud Growth Stack
          </div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
            Create. Host. Market. Automate.
          </h2>
          <p className="text-muted-foreground text-base max-w-lg mx-auto">
            One team. Four superpowers. Zero handoffs. Your growth, fully handled.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: i * 0.09 }}
              className="rounded-2xl border border-border/60 p-6 bg-card/50 hover:border-primary/25 hover:-translate-y-0.5 transition-all duration-300 flex flex-col"
            >
              {/* Icon + step number */}
              <div className="flex items-center justify-between mb-5">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <step.icon size={18} />
                </div>
                <span className="text-xs font-mono font-semibold text-muted-foreground/40 tabular-nums">
                  {step.number}
                </span>
              </div>

              {/* Tag */}
              <span className="text-xs font-semibold text-primary tracking-wide mb-2">{step.tag}</span>

              {/* Headline */}
              <h3 className="font-semibold text-[15px] text-foreground leading-snug mb-2">
                {step.headline}
              </h3>

              {/* Subline */}
              <p className="text-sm text-muted-foreground leading-relaxed mb-5 flex-1">
                {step.subline}
              </p>

              {/* Proof pills */}
              <div className="flex flex-wrap gap-1.5 mb-5">
                {step.proof.map((p) => (
                  <span
                    key={p}
                    className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary"
                  >
                    {p}
                  </span>
                ))}
              </div>

              {/* Stat */}
              <div className="pt-4 border-t border-border/50">
                <div className="text-xl font-bold text-primary leading-none mb-1">{step.stat}</div>
                <div className="text-xs text-muted-foreground">{step.statLabel}</div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mt-10"
        >
          <Button
            onClick={() => navigate("/contact")}
            size="lg"
            className="rounded-full px-10 h-12 font-semibold text-[15px] gap-2 cursor-pointer"
          >
            Get Your Free Strategy Call
            <ArrowRight size={15} />
          </Button>
          <p className="text-xs text-muted-foreground mt-3">No commitment. 30 minutes. Real plan.</p>
        </motion.div>

      </div>
    </section>
  );
}
