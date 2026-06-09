import { motion } from "motion/react";
import { X, Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { useNavigate } from "react-router-dom";

const pains = [
  "5 invoices, 5 logins, 5 different contacts",
  "Brand looks inconsistent across every channel",
  "Nobody takes ownership when something breaks",
  "Months pass with no measurable results",
];

const gains = [
  "One team, one invoice, one strategy",
  "Consistent brand voice across every platform",
  "One account manager who owns your outcomes",
  "Results in 30 days - or we keep working",
  "AI automation handles the repetitive work",
];

export default function PainAgitation() {
  const navigate = useNavigate();

  return (
    <section className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/15 to-background pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 md:px-8 relative">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 bg-destructive/10 border border-destructive/20 rounded-full px-4 py-1.5 text-xs text-destructive font-medium mb-4">
            Sound familiar?
          </div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3 text-balance">
            Still Paying 5 Vendors Separately?
          </h2>
          <p className="text-muted-foreground text-base max-w-md mx-auto">
            Most businesses waste KES 100K+ a year on fragmented tools that don't talk to each other - and get half the results.
          </p>
        </motion.div>

        {/* Before / After cards */}
        <div className="grid md:grid-cols-2 gap-5 max-w-4xl mx-auto mb-10">

          {/* Without */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="bg-card border border-destructive/20 rounded-2xl p-7"
          >
            <div className="flex items-center gap-2.5 mb-6">
              <div className="w-6 h-6 rounded-full bg-destructive/15 flex items-center justify-center shrink-0">
                <X size={12} className="text-destructive" />
              </div>
              <span className="text-xs font-semibold text-destructive tracking-wide uppercase">Without Nisc Cloud</span>
            </div>
            <div className="space-y-4">
              {pains.map((pain) => (
                <div key={pain} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-destructive/10 flex items-center justify-center shrink-0 mt-0.5">
                    <X size={10} className="text-destructive" />
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{pain}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* With */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-card border border-primary/20 rounded-2xl p-7"
            style={{
              background: "radial-gradient(ellipse 120% 80% at 50% 0%, oklch(0.72 0.2 210 / 0.06), transparent)",
            }}
          >
            <div className="flex items-center gap-2.5 mb-6">
              <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                <Check size={12} className="text-primary" />
              </div>
              <span className="text-xs font-semibold text-primary tracking-wide uppercase">With Nisc Cloud</span>
            </div>
            <div className="space-y-4">
              {gains.map((gain) => (
                <div key={gain} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Check size={10} className="text-primary" />
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">{gain}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <Button
            onClick={() => navigate("/contact")}
            className="rounded-full px-8 h-11 font-semibold text-[15px] gap-2 cursor-pointer"
          >
            Talk to us - it's free
            <ArrowRight size={15} />
          </Button>
          <p className="text-xs text-muted-foreground mt-3">
            No commitment. We'll map out a plan for your business in 30 minutes.
          </p>
        </motion.div>

      </div>
    </section>
  );
}
