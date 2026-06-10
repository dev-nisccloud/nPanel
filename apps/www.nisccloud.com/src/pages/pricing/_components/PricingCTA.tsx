import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { useNavigate } from "react-router-dom";

export default function PricingCTA() {
  const navigate = useNavigate();

  return (
    <section className="py-20 border-t border-border/40">
      <div
        className="max-w-3xl mx-auto px-4 md:px-8 text-center rounded-2xl py-16 border border-primary/20 relative overflow-hidden"
        style={{
          background:
            "radial-gradient(ellipse 80% 100% at 50% 100%, oklch(0.20 0.06 220 / 0.5), transparent)",
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 text-xs text-primary font-mono mb-6">
            NOT SURE WHICH PLAN?
          </div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Let Us Build You
            <br />a Custom Package.
          </h2>
          <p className="text-muted-foreground text-base mb-8 max-w-md mx-auto">
            Every brand is different. Talk to our team and we'll design a plan around your exact goals and budget - no pressure.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              size="lg"
              onClick={() => navigate("/contact")}
              className="bg-primary text-primary-foreground hover:opacity-90 cursor-pointer font-semibold gap-2"
            >
              Book a Free Strategy Call <ArrowRight size={16} />
            </Button>
            <Button
              size="lg"
              variant="ghost"
              onClick={() => navigate("/services")}
              className="border border-border hover:bg-secondary cursor-pointer font-semibold"
            >
              Explore Services
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
