import { Paintbrush, Globe, Server, Mail, TrendingUp, ShieldCheck, Sparkles, Bot, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";

const SERVICES = [
  { id: "1", title: "Brand Identity Design", icon: Paintbrush },
  { id: "2", title: "Website & E-commerce", icon: Globe },
  { id: "3", title: "Business Hosting", icon: Server },
  { id: "4", title: "Business Email Hosting", icon: Mail },
  { id: "5", title: "SEO & Paid Advertising", icon: TrendingUp },
  { id: "6", title: "SSL & Website Security", icon: ShieldCheck },
  { id: "7", title: "Zeepo AI Automation", icon: Sparkles },
  { id: "8", title: "AI Chatbots & Lead Flows", icon: Bot },
];

export default function BentoServiceCarousel() {
  const [visible, setVisible] = useState(SERVICES.slice(0, 3));
  const [pointer, setPointer] = useState(2);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible((prev) => {
        const nextIndex = (pointer + 1) % SERVICES.length;
        setPointer(nextIndex);
        return [...prev.slice(1), SERVICES[nextIndex]];
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [pointer]);

  return (
    <div className="relative flex flex-col items-center rounded-2xl h-52 w-full overflow-hidden">
      <AnimatePresence initial={false}>
        {visible.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ y: 215, opacity: 0, scale: 0.9 }}
            animate={{
              y: i * 70,
              scale: i === 1 ? 1 : 0.9,
              opacity: i === 1 ? 1 : 0.5,
            }}
            exit={{ y: -100, opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="absolute flex items-center justify-between w-full px-5 py-4 rounded-xl bg-background border border-border text-card-foreground"
          >
            <div className="flex items-center gap-2.5">
              <item.icon size={18} className="text-primary shrink-0" />
              <span className="text-sm font-medium">{item.title}</span>
            </div>
            <Check size={18} className="text-primary shrink-0" />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
