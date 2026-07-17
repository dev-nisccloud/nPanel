import { motion } from "motion/react";
import { Briefcase } from "lucide-react";

export default function WorkHero() {
  return (
    <section className="relative pt-28 pb-16 px-6 text-center overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full bg-primary/8 blur-[120px]" />
      </div>

      <div className="relative max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-center gap-2 mb-5"
        >
          <Briefcase className="w-5 h-5 text-primary" />
          <span className="text-sm font-bold text-primary tracking-widest uppercase">
            Our Work
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl md:text-6xl font-bold text-balance mb-5"
        >
          Work We Are{" "}
          <span className="text-primary">Proud Of</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-xl text-muted-foreground text-balance"
        >
          A look at how we help businesses get online, stay online, and grow
          with hosting and marketing under one team.
        </motion.p>
      </div>
    </section>
  );
}
