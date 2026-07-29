/**
 * Alternating content + Quiet Stage visual panels under "What You Get".
 */

import { motion } from "motion/react";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils.ts";
import type { VisualTheme } from "@/components/shadcn-space/blocks/built-different-01/visual-context.ts";
import { ShowcaseStage } from "./showcase-stages.tsx";

export type ShowcaseBlock = {
  /** Optional section label  not rendered (kept for existing page data). */
  tag?: string;
  headline: string;
  body: string;
  bullets: string[];
  /** Themed stage shown opposite the copy */
  visual: VisualTheme;
  /** When true the visual sits on the right */
  visualRight?: boolean;
  /** @deprecated Use visualRight */
  mockupRight?: boolean;
};

type Props = {
  blocks: ShowcaseBlock[];
  className?: string;
};

export function ShowcaseVisualCard({
  visual,
  headline,
  className,
}: {
  visual: VisualTheme;
  headline: string;
  className?: string;
}) {
  return (
    <div className={cn("w-full", className)}>
      <ShowcaseStage theme={visual} label={headline} />
    </div>
  );
}

function Block({ block, index }: { block: ShowcaseBlock; index: number }) {
  const right =
    block.visualRight !== undefined
      ? block.visualRight
      : block.mockupRight !== undefined
        ? block.mockupRight
        : index % 2 === 0;

  const text = (
    <motion.div
      initial={{ opacity: 0, x: right ? -28 : 28 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.55 }}
      className="flex flex-col justify-center"
    >
      <h3 className="mb-4 text-2xl font-bold leading-snug tracking-tight md:text-3xl">
        {block.headline}
      </h3>
      <p className="mb-6 text-[15px] leading-relaxed text-muted-foreground">{block.body}</p>
      <ul className="space-y-2.5">
        {block.bullets.map((b) => (
          <li key={b} className="flex items-start gap-3 text-sm text-muted-foreground">
            <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-primary" />
            {b}
          </li>
        ))}
      </ul>
    </motion.div>
  );

  const visualPanel = (
    <motion.div
      initial={{ opacity: 0, x: right ? 28 : -28 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.55, delay: 0.08 }}
    >
      <ShowcaseVisualCard visual={block.visual} headline={block.headline} />
    </motion.div>
  );

  return (
    <div className="grid items-center gap-12 md:grid-cols-2 md:gap-16">
      {right ? (
        <>
          {text}
          {visualPanel}
        </>
      ) : (
        <>
          {visualPanel}
          {text}
        </>
      )}
    </div>
  );
}

export default function ServiceShowcaseSection({ blocks, className }: Props) {
  return (
    <section
      className={cn(
        "mx-auto max-w-7xl space-y-20 px-4 pb-20 pt-6 md:space-y-24 md:px-8",
        className,
      )}
    >
      {blocks.map((b, i) => (
        <Block key={`${b.headline}-${i}`} block={b} index={i} />
      ))}
    </section>
  );
}
