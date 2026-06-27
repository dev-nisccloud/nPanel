import { motion } from "motion/react";
import { Server, Globe, Mail, ShieldCheck, TrendingUp, Sparkles, BarChart3 } from "lucide-react";

const orbitItems = [
  {
    Icon: Globe,
    label: "Domains",
    className: "absolute start-[70%] top-0 z-10",
    animateY: [-15, 15, -15] as number[],
    delay: 0,
    size: "lg",
  },
  {
    Icon: Mail,
    label: "Email",
    className: "absolute start-[91%] top-[28%] z-10",
    animateY: [15, -15, 15] as number[],
    delay: 0,
    size: "sm",
  },
  {
    Icon: ShieldCheck,
    label: "SSL",
    className: "absolute start-[78%] top-[61%] z-10",
    animateY: [-15, 15, -15] as number[],
    delay: 1,
    size: "lg",
  },
  {
    Icon: TrendingUp,
    label: "SEO",
    className: "absolute end-[78%] top-0",
    animateY: [15, -15, 15] as number[],
    delay: 0,
    size: "sm",
  },
  {
    Icon: Sparkles,
    label: "AI",
    className: "absolute end-[67%] lg:top-[61%] top-[80%] z-10",
    animateY: [-15, 15, -15] as number[],
    delay: 0.2,
    size: "lg",
  },
  {
    Icon: BarChart3,
    label: "Analytics",
    className: "absolute lg:end-[98%] end-[80%] lg:top-0 top-[30%]",
    animateY: [15, -15, 15] as number[],
    delay: 0.5,
    size: "lg",
  },
  {
    Icon: Server,
    label: "Hosting",
    className: "absolute end-[95%] top-[67%] z-10",
    animateY: [-15, 15, -15] as number[],
    delay: 0.7,
    size: "sm",
  },
];

export default function BentoOrbitingIcons() {
  return (
    <div className="min-h-[216px] flex items-center justify-center relative">
      {/* Center brand mark */}
      <span className="flex items-center justify-center w-24 h-24">
        <img
          src="/nisciconoriginal.png"
          alt="Nisc Cloud"
          className="w-20 h-20 object-contain"
        />
      </span>

      {orbitItems.map(({ Icon, label, className, animateY, delay, size }) => (
        <motion.div
          key={label}
          className={className}
          animate={{ y: animateY }}
          transition={{ duration: 3, ease: "easeInOut", repeat: Infinity, delay }}
        >
          <span
            aria-label={label}
            className={`flex items-center justify-center rounded-full bg-background border border-border shadow-sm ${
              size === "lg"
                ? "lg:size-14 size-10"
                : "lg:size-10 size-7"
            }`}
          >
            <Icon className={size === "lg" ? "w-6 h-6" : "w-4 h-4"} />
          </span>
        </motion.div>
      ))}
    </div>
  );
}
