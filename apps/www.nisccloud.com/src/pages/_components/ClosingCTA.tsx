import { motion } from "motion/react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { useNavigate } from "react-router-dom";

const perks = [
  "No long-term contracts",
  "Dedicated account manager",
  "Results in 30 days or we keep working",
  "M-Pesa, Visa & Mastercard accepted",
  "All services under one roof",
  "Kenya-based support team",
];

export default function ClosingCTA() {
  const navigate = useNavigate();

  return (
    <section className="py-28 relative overflow-hidden bg-primary">
      {/* Decorative orbit rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[600px] h-[600px] rounded-full border border-white/10 absolute" />
        <div className="w-[850px] h-[850px] rounded-full border border-white/6 absolute" />
        <div className="w-[1100px] h-[1100px] rounded-full border border-white/4 absolute" />
      </div>

      <div className="max-w-3xl mx-auto px-4 md:px-8 text-center relative">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
        >
          <div className="inline-flex items-center gap-2 bg-white/15 border border-white/25 rounded-full px-4 py-1.5 text-xs text-white font-mono mb-6">
            READY TO GROW YOUR BUSINESS?
          </div>

          <h2 className="text-5xl md:text-6xl font-bold tracking-tight leading-[1.05] mb-6 text-balance text-white">
            Join 500+ Businesses
            <br />
            That Trust Nisc Cloud
          </h2>

          <p className="text-lg text-white/80 mb-10 max-w-xl mx-auto">
            We create your brand, take it online, make it grow, and automate it - all under one roof, one team, one invoice.
          </p>

          {/* Perks */}
          <div className="grid grid-cols-2 gap-3 max-w-md mx-auto mb-10 text-left">
            {perks.map((perk) => (
              <div key={perk} className="flex items-center gap-2 text-sm text-white/80">
                <CheckCircle2 size={15} className="text-white shrink-0" />
                {perk}
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              size="lg"
              onClick={() => navigate("/contact")}
              className="bg-white text-primary hover:bg-white/90 cursor-pointer font-semibold text-base px-8 gap-2"
            >
              Get Started Today <ArrowRight size={16} />
            </Button>
            <Button
              size="lg"
              variant="ghost"
              onClick={() => navigate("/pricing")}
              className="border border-white/40 text-white hover:bg-white/10 cursor-pointer font-semibold text-base"
            >
              View All Pricing
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
