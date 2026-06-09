import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button.tsx";
import { ArrowRight } from "lucide-react";

export default function WorkCTA() {
  const navigate = useNavigate();
  return (
    <section className="py-24 px-6 bg-muted/30">
      <div className="max-w-3xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-sm font-bold text-primary tracking-widest uppercase mb-4">
            Your Business Could Be Next
          </p>
          <h2 className="text-4xl md:text-5xl font-bold mb-5 text-balance">
            Ready to Write Your{" "}
            <span className="text-primary">Success Story?</span>
          </h2>
          <p className="text-lg text-muted-foreground mb-8 text-balance">
            Book a free strategy call and let{"'"}s map out exactly what your
            growth looks like with the Atom Approach.
          </p>
          <Button
            size="lg"
            onClick={() => navigate("/contact")}
            className="gap-2 cursor-pointer"
          >
            Get Your Free Strategy Call
            <ArrowRight className="w-4 h-4" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
