import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { useNavigate } from "react-router-dom";

export default function ServicesCTA() {
  const navigate = useNavigate();

  return (
    <section className="py-24 border-t border-border/40">
      <div className="max-w-3xl mx-auto px-4 md:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 text-xs text-primary font-mono mb-6">
            READY TO START?
          </div>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Pick Your Orbit.
          </h2>
          <p className="text-muted-foreground text-lg mb-8">
            Need all four pillars or just one? We'll build a custom package around your goals. Book a free strategy call and let's map your path to orbit.
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
              onClick={() => navigate("/")}
              className="border border-border hover:bg-secondary cursor-pointer font-semibold"
            >
              Back to Home
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
