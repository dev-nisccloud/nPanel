import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button.tsx";
import { ArrowRight, Calendar } from "lucide-react";

export default function AboutCTA() {
  const navigate = useNavigate();

  return (
    <section className="py-24 px-6 bg-muted/30">
      <div className="max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-balance">
            Let{"'"}s Get Your Business{" "}
            <span className="text-primary">Online and Growing</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-10 text-balance">
            Book a free strategy call. We will map clear hosting and marketing
            next steps for your business, with no pressure.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => navigate("/contact")}
              className="gap-2 cursor-pointer"
            >
              <Calendar className="w-5 h-5" />
              Book a Free Strategy Call
            </Button>
            <Button
              variant="ghost"
              size="lg"
              onClick={() => navigate("/services")}
              className="gap-2 cursor-pointer"
            >
              Explore Our Services
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
