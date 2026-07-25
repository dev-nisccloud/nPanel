/**
 * ServiceShowcaseSection
 * Renders 2–3 alternating "floating UI mock + descriptive text" blocks
 * inspired by the Nexsas / wealth-dashboard reference designs the user shared.
 * Each block has:
 *   - A grey/neutral card background with subtle dot-grid
 *   - Floating mini-UI widgets (charts, stats, badge pills, avatars, etc.)
 *   - A text column with tag, headline, body, and bullet list
 */

import { motion } from "motion/react";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils.ts";

export type ShowcaseBlock = {
  /** Optional section label — not rendered (kept for existing page data). */
  tag?: string;
  headline: string;
  body: string;
  bullets: string[];
  /** The React node rendered as the floating UI mockup */
  mockup: React.ReactNode;
  /** When true the mockup sits on the right */
  mockupRight?: boolean;
};

type Props = {
  blocks: ShowcaseBlock[];
  className?: string;
};

function DotGrid() {
  return (
    <div
      className="absolute inset-0 opacity-40 pointer-events-none"
      style={{
        backgroundImage:
          "radial-gradient(circle, oklch(0.5 0.03 240 / 0.25) 1px, transparent 1px)",
        backgroundSize: "22px 22px",
      }}
    />
  );
}

function Block({ block, index }: { block: ShowcaseBlock; index: number }) {
  const right = block.mockupRight !== undefined ? block.mockupRight : index % 2 === 0;

  const text = (
    <motion.div
      initial={{ opacity: 0, x: right ? -28 : 28 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="flex flex-col justify-center"
    >
      <h3 className="text-2xl md:text-3xl font-bold leading-snug tracking-tight mb-4">
        {block.headline}
      </h3>
      <p className="text-muted-foreground leading-relaxed text-[15px] mb-6">{block.body}</p>
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

  const mock = (
    <motion.div
      initial={{ opacity: 0, x: right ? 28 : -28 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: 0.1 }}
      className="relative rounded-3xl overflow-hidden bg-[oklch(0.93_0.01_240)] dark:bg-[oklch(0.18_0.015_260)] border border-border/50 shadow-xl min-h-[340px] flex items-center justify-center p-6 md:p-8"
    >
      <DotGrid />
      <div className="relative z-10 w-full">{block.mockup}</div>
    </motion.div>
  );

  return (
    <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
      {right ? (
        <>
          {text}
          {mock}
        </>
      ) : (
        <>
          {mock}
          {text}
        </>
      )}
    </div>
  );
}

export default function ServiceShowcaseSection({ blocks, className }: Props) {
  return (
    <section className={cn("max-w-7xl mx-auto px-4 md:px-8 pt-6 pb-20 space-y-20 md:space-y-24", className)}>
      {blocks.map((b, i) => (
        <Block key={i} block={b} index={i} />
      ))}
    </section>
  );
}
