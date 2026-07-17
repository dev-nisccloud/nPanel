import { motion } from "motion/react";
import { ShieldCheck } from "lucide-react";
import { MacbookScroll } from "@/components/ui/macbook-scroll.tsx";
import SecurityDashboardScreen from "./SecurityDashboardScreen.tsx";

export default function SecurityMacbookSection() {
  return (
    <section className="relative overflow-hidden border-t border-border/40 bg-background">
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute left-1/2 top-0 h-[420px] w-[720px] -translate-x-1/2 rounded-full blur-[110px]"
          style={{ background: "radial-gradient(circle, oklch(0.88 0.1 220 / 0.35), transparent 70%)" }}
        />
      </div>

      <div className="relative z-10">
        <div className="mx-auto max-w-2xl px-4 pt-14 text-center">
          <motion.span
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary"
          >
            <ShieldCheck size={12} /> Live Security Dashboard
          </motion.span>

          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: 0.05 }}
            className="mb-4 text-4xl font-extrabold leading-tight text-foreground sm:text-5xl"
          >
            Your protection,
            <br />
            <span className="text-primary">visible in real time</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: 0.1 }}
            className="mx-auto max-w-lg text-base leading-relaxed text-muted-foreground"
          >
            Firewall, malware scans, SSL, backups, and DDoS defence — monitored in one place so you always know your site is safe.
          </motion.p>
        </div>

        <div className="w-full overflow-hidden">
          <MacbookScroll
            showGradient={false}
            content={<SecurityDashboardScreen />}
            title={
              <span className="sr-only">
                Nisc Cloud Security Dashboard — real-time threat monitoring
              </span>
            }
          />
        </div>
      </div>
    </section>
  );
}
