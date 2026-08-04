import { motion } from "motion/react";
import { CheckCircle2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ShowcaseVisualCard } from "@/pages/_components/ServiceShowcaseSection.tsx";
import type { VisualTheme } from "@/components/shadcn-space/blocks/built-different-01/visual-context.ts";

export type FeatureBlockItem = {
  tag?: string;
  tagColor?: string;
  headline: string;
  description: string;
  bullets: string[];
  stat?: { value: string; label: string };
  /** Themed visual card (preferred over imageUrl) */
  visual?: VisualTheme;
  /** @deprecated Prefer visual */
  imageUrl?: string;
  imageAlt?: string;
  /** If true, visual goes on the right. Alternates automatically if not set. */
  imageRight?: boolean;
  badge?: { icon?: LucideIcon; text: string; color?: string };
};

type Props = {
  items: FeatureBlockItem[];
};

export default function AlternatingFeatureBlocks({ items }: Props) {
  return (
    <div className="space-y-20 md:space-y-28">
      {items.map((item, i) => {
        const imageRight = item.imageRight !== undefined ? item.imageRight : i % 2 === 0;
        const visual: VisualTheme = item.visual ?? "default";

        const textBlock = (
          <motion.div
            initial={{ opacity: 0, x: imageRight ? -30 : 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.65 }}
            className="flex flex-col justify-center"
          >
            {item.tag ? (
              <span className="mb-4 inline-flex items-center self-start rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-mono font-bold tracking-widest text-primary">
                {item.tag}
              </span>
            ) : null}
            <h3 className="mb-4 text-2xl font-bold leading-snug tracking-tight md:text-3xl">
              {item.headline}
            </h3>
            <p className="mb-6 text-[15px] leading-relaxed text-muted-foreground">
              {item.description}
            </p>
            <ul className="space-y-2.5">
              {item.bullets.map((b) => (
                <li key={b} className="flex items-start gap-3 text-sm text-muted-foreground">
                  <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-primary" />
                  {b}
                </li>
              ))}
            </ul>
            {item.stat ? (
              <div className="mt-8 inline-flex items-baseline gap-2 border-l-4 border-primary pl-4">
                <span className="text-3xl font-extrabold text-primary">
                  {item.stat.value}
                </span>
                <span className="text-sm text-muted-foreground">{item.stat.label}</span>
              </div>
            ) : null}
          </motion.div>
        );

        const visualBlock = (
          <motion.div
            initial={{ opacity: 0, x: imageRight ? 30 : -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.65, delay: 0.1 }}
          >
            <ShowcaseVisualCard visual={visual} headline={item.headline} />
          </motion.div>
        );

        return (
          <div key={item.headline} className="grid items-center gap-12 md:grid-cols-2 md:gap-16">
            {imageRight ? (
              <>
                {textBlock}
                {visualBlock}
              </>
            ) : (
              <>
                {visualBlock}
                {textBlock}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
