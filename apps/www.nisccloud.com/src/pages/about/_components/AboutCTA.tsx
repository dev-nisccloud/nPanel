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
          <p className="text-sm font-bold text-primary tracking-widest uppercase mb-4">
            Ready to Work Together?
          </p>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-balance">
            Let{"'"}s Build Something{" "}
            <span className="text-primary">Worth Orbiting</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-10 text-balance">
            Our team is passionate about taking businesses to the next level.
            Book a free strategy call and find out what the Atom Approach can
            do for you.
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
