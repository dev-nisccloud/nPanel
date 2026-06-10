import { motion } from "motion/react";
import { CheckCircle2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type FeatureBlockItem = {
  tag: string;
  tagColor?: string;
  headline: string;
  description: string;
  bullets: string[];
  stat?: { value: string; label: string };
  imageUrl: string;
  imageAlt: string;
  /** If true, image goes on the right. If false/undefined, image goes on the left. Alternates automatically if not set. */
  imageRight?: boolean;
  badge?: { icon?: LucideIcon; text: string; color?: string };
};

type Props = {
  items: FeatureBlockItem[];
  /** Accent color for bullets and tag. Default: primary */
  accentColor?: string;
};

export default function AlternatingFeatureBlocks({ items, accentColor }: Props) {
  return (
    <div className="space-y-20 md:space-y-28">
      {items.map((item, i) => {
        const imageRight = item.imageRight !== undefined ? item.imageRight : i % 2 === 0;
        const accent = item.tagColor ?? accentColor ?? "var(--color-primary)";

        const textBlock = (
          <motion.div
            initial={{ opacity: 0, x: imageRight ? -30 : 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.65 }}
            className="flex flex-col justify-center"
          >
            <span
              className="inline-flex items-center self-start text-[11px] font-mono font-bold tracking-widest px-3 py-1 rounded-full border mb-4"
              style={{ color: accent, borderColor: `${accent}30`, backgroundColor: `${accent}10` }}
            >
              {item.tag}
            </span>
            <h3 className="text-2xl md:text-3xl font-bold tracking-tight mb-4 leading-snug">
              {item.headline}
            </h3>
            <p className="text-muted-foreground leading-relaxed mb-6 text-[15px]">
              {item.description}
            </p>
            <ul className="space-y-2.5">
              {item.bullets.map((b) => (
                <li key={b} className="flex items-start gap-3 text-sm text-muted-foreground">
                  <CheckCircle2 size={15} className="mt-0.5 shrink-0" style={{ color: accent }} />
                  {b}
                </li>
              ))}
            </ul>
            {item.stat && (
              <div className="mt-8 inline-flex items-baseline gap-2 border-l-4 pl-4" style={{ borderColor: accent }}>
                <span className="text-3xl font-extrabold" style={{ color: accent }}>{item.stat.value}</span>
                <span className="text-sm text-muted-foreground">{item.stat.label}</span>
              </div>
            )}
          </motion.div>
        );

        const imageBlock = (
          <motion.div
            initial={{ opacity: 0, x: imageRight ? 30 : -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.65, delay: 0.1 }}
            className="relative rounded-2xl overflow-hidden aspect-[4/3] shadow-xl"
          >
            <img
              src={item.imageUrl}
              alt={item.imageAlt}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/50 via-transparent to-transparent" />
            {item.badge && (
              <div className="absolute bottom-5 left-5 bg-card/90 backdrop-blur border border-border/60 rounded-xl px-4 py-2.5 flex items-center gap-2.5 shadow-lg">
                {item.badge.icon && (
                  <item.badge.icon size={14} style={{ color: item.badge.color ?? accent }} />
                )}
                <span className="text-sm font-semibold" style={{ color: item.badge.color ?? accent }}>
                  {item.badge.text}
                </span>
              </div>
            )}
          </motion.div>
        );

        return (
          <div key={i} className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
            {imageRight ? (
              <>
                {textBlock}
                {imageBlock}
              </>
            ) : (
              <>
                {imageBlock}
                {textBlock}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
