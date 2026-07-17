import { motion } from "motion/react";
import { Badge } from "@/components/ui/badge.tsx";
import { Unlock, CalendarCheck, CheckCircle2, Globe2, CreditCard, Code2, Receipt, BadgeCheck, RefreshCw } from "lucide-react";
import BentoServiceCarousel from "./BentoServiceCarousel.tsx";
import BentoOrbitingIcons from "./BentoOrbitingIcons.tsx";

const PricingVisual = () => {
  const items = [
    { label: "Brand Identity", price: "KES 25K", color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Website Hosting", price: "KES 500/mo", color: "text-teal-500", bg: "bg-teal-500/10" },
    { label: "SEO Campaign", price: "KES 25K/mo", color: "text-violet-500", bg: "bg-violet-500/10" },
  ];
  return (
    <div className="p-8 bg-muted rounded-t-xl flex-1 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 w-full">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-sm">
            <Receipt className="w-8 h-8 text-primary" />
          </div>
          <motion.div
            className="absolute -right-1.5 -top-1.5 w-5 h-5 bg-primary rounded-full flex items-center justify-center"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          >
            <BadgeCheck className="w-3 h-3 text-white" />
          </motion.div>
        </div>
        <div className="text-center">
          <div className="text-xl font-extrabold text-primary tracking-tight">Clear pricing</div>
          <div className="text-xs text-muted-foreground font-medium mt-0.5">You see the price before you pay</div>
        </div>
        <div className="flex flex-col gap-2 w-full max-w-[180px]">
          {items.map(({ label, price, color, bg }) => (
            <div key={label} className="flex items-center justify-between gap-2">
              <span className={`text-[10px] font-medium px-2 py-1 rounded-full ${bg} ${color}`}>
                {label}
              </span>
              <span className={`text-[10px] font-bold ${color}`}>{price}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5 mt-1 text-[10px] text-muted-foreground">
            <RefreshCw className="w-3 h-3" />
            Monthly billing · Cancel anytime
          </div>
        </div>
      </div>
    </div>
  );
};

const OwnershipVisual = () => (
  <div className="p-8 bg-muted rounded-t-xl flex-1 flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shadow-sm">
          <Unlock className="w-8 h-8 text-amber-500" />
        </div>
      </div>
      <div className="text-center">
        <div className="text-xl font-extrabold text-amber-500 tracking-tight">You own it</div>
        <div className="text-xs text-muted-foreground font-medium mt-0.5">Domain, code, and data stay yours</div>
      </div>
      <div className="flex flex-col gap-2 w-full max-w-[160px]">
        {[
          { icon: Globe2, label: "Your domain" },
          { icon: Code2, label: "Your source code" },
          { icon: CreditCard, label: "Your billing data" },
        ].map(({ icon: Icon, label }) => (
          <div
            key={label}
            className="flex items-center gap-2 text-[11px] font-medium px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-600"
          >
            <Icon className="w-3.5 h-3.5 shrink-0" />
            {label}
          </div>
        ))}
      </div>
    </div>
  </div>
);

const ResultsVisual = () => {
  const milestones = [
    { day: "Day 1", label: "Strategy locked in" },
    { day: "Day 7", label: "Brand delivered" },
    { day: "Day 14", label: "Website live" },
    { day: "Day 30", label: "Results or we work free" },
  ];
  return (
    <div className="p-8 bg-muted rounded-t-xl flex-1 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 w-full">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shadow-sm">
            <CalendarCheck className="w-8 h-8 text-violet-500" />
          </div>
          <motion.div
            className="absolute -right-1.5 -top-1.5 w-5 h-5 bg-violet-500 rounded-full flex items-center justify-center"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <CheckCircle2 className="w-3 h-3 text-white" />
          </motion.div>
        </div>
        <div className="text-center">
          <div className="text-xl font-extrabold text-violet-500 tracking-tight">30-day results</div>
          <div className="text-xs text-muted-foreground font-medium mt-0.5">Progress you can measure</div>
        </div>
        <div className="flex flex-col gap-1.5 w-full max-w-[180px]">
          {milestones.map(({ day, label }, i) => (
            <motion.div
              key={day}
              initial={{ opacity: 0, x: -8 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: i * 0.1 }}
              className="flex items-center gap-2"
            >
              <span className="text-[9px] font-black font-mono text-violet-400 w-10 shrink-0">{day}</span>
              <div className="flex-1 h-px bg-violet-200 dark:bg-violet-800" />
              <span className="text-[9px] text-muted-foreground text-right leading-tight max-w-[100px]">{label}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default function BentoFeatures() {
  return (
    <section className="relative bg-muted/30 py-20 sm:py-32 overflow-hidden">
      <div className="max-w-7xl xl:px-16 lg:px-8 px-4 mx-auto flex flex-col gap-12">

        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex flex-col gap-4 items-center justify-center max-w-3xl mx-auto text-center"
        >
          <Badge variant="outline" className="px-3 py-1 h-auto text-xs font-mono font-bold uppercase tracking-widest">
            Why Choose Us
          </Badge>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-balance">
            Clear help for every step online
          </h2>
          <p className="text-muted-foreground text-base max-w-2xl">
            From brand and website to hosting, marketing, and smart tools.
            One team that helps you get online, stay online, and grow.
          </p>
        </motion.div>

        {/* Bento grid */}
        <div className="grid grid-cols-12 gap-5">

          {/* Cell 1  Animated service carousel (4 cols) */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-4 col-span-12 overflow-hidden"
          >
            <div className="rounded-xl border border-border h-full flex flex-col">
              <div className="bg-muted rounded-t-xl py-8 px-9">
                <BentoServiceCarousel />
              </div>
              <div className="flex flex-col gap-1 p-8 border-t border-border">
                <h3 className="text-xl font-semibold text-foreground">
                  One team for the full journey
                </h3>
                <p className="text-base font-normal text-muted-foreground">
                  Design, hosting, marketing, and automation handled together so you are not chasing five vendors.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Cell 2  Orbiting tech icons (8 cols) */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-8 col-span-12 overflow-hidden"
          >
            <div className="rounded-xl border border-border h-full flex flex-col">
              <div className="rounded-t-xl py-7 lg:px-20 px-6">
                <BentoOrbitingIcons />
              </div>
              <div className="flex flex-col gap-1 p-8 border-t border-border">
                <h3 className="text-xl font-semibold text-foreground">
                  Tools that work together
                </h3>
                <p className="text-base font-normal text-muted-foreground">
                  Domains, hosting, email, security, SEO, and analytics connected so your site and marketing stay in sync.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Cell 3  Transparent pricing (4 cols) */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="lg:col-span-4 col-span-12 overflow-hidden"
          >
            <div className="rounded-xl border border-border h-full flex flex-col">
              <PricingVisual />
              <div className="flex flex-col gap-1 p-8 border-t border-border">
                <h3 className="text-xl font-semibold text-foreground">
                  Pricing you can understand
                </h3>
                <p className="text-base font-normal text-muted-foreground">
                  Clear monthly packages. Paying is simple. Scale up or pause when your needs change.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Cell 4  Ownership (4 cols) */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-4 col-span-12 overflow-hidden"
          >
            <div className="rounded-xl border border-border h-full flex flex-col">
              <OwnershipVisual />
              <div className="flex flex-col gap-1 p-8 border-t border-border">
                <h3 className="text-xl font-semibold text-foreground">
                  You keep what we build
                </h3>
                <p className="text-base font-normal text-muted-foreground">
                  Your domain, code, and data stay yours. Leave when you want without losing your assets.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Cell 5  30-day results (4 cols) */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="lg:col-span-4 col-span-12 overflow-hidden"
          >
            <div className="rounded-xl border border-border h-full flex flex-col">
              <ResultsVisual />
              <div className="flex flex-col gap-1 p-8 border-t border-border">
                <h3 className="text-xl font-semibold text-foreground">
                  Results in 30 days, guaranteed
                </h3>
                <p className="text-base font-normal text-muted-foreground">
                  We set a clear first-month plan. If marketing progress is missing, we keep working at no extra charge until it shows.
                </p>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
