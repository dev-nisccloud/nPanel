import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils.ts";

export type TileTone = "card" | "brand" | "dark" | "muted";

const TONE_CLASS: Record<TileTone, string> = {
  card: "border border-border bg-card",
  brand: "bg-[#38b6ff] text-[#02070A]",
  dark: "bg-[#02070A] text-white dark:bg-[#38b6ff]/10",
  muted: "border border-border bg-muted/60",
};

const BODY_CLASS: Record<TileTone, string> = {
  card: "text-muted-foreground",
  brand: "text-[#02070A]/80",
  dark: "text-white/85",
  muted: "text-muted-foreground",
};

/** Section frame for a bento grid: dotted backdrop, heading on the left, short intro on the right. */
export function BentoSection({
  id,
  eyebrow,
  title,
  intro,
  children,
  className,
}: {
  id?: string;
  eyebrow: string;
  title: ReactNode;
  intro?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={cn("relative scroll-mt-24 overflow-hidden bg-background px-4 py-24 md:px-8 md:py-32", className)}>
      <div
        className="pointer-events-none absolute inset-0 opacity-60 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]"
        style={{ backgroundImage: "radial-gradient(rgb(56 182 255 / 0.25) 1px, transparent 1px)", backgroundSize: "22px 22px" }}
        aria-hidden
      />
      <div className="relative mx-auto max-w-7xl">
        <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr] lg:items-end">
          <div>
            <p className="type-label text-[#38b6ff]">{eyebrow}</p>
            <h2 className="type-h2 mt-3 max-w-3xl text-balance">{title}</h2>
          </div>
          {intro ? <p className="max-w-md text-base leading-relaxed text-muted-foreground lg:justify-self-end">{intro}</p> : null}
        </div>
        <ul className="mt-14 grid auto-rows-[minmax(220px,auto)] gap-4 md:grid-cols-6">{children}</ul>
      </div>
    </section>
  );
}

/** One bento tile. Rises in on scroll and lifts slightly on hover. Set the column span through className. */
export function BentoTile({
  index,
  tone = "card",
  className,
  children,
}: {
  index: number;
  tone?: TileTone;
  className?: string;
  children: ReactNode;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.li
      initial={reduce ? false : { opacity: 0, y: 28, scale: 0.98 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "group relative overflow-hidden rounded-[28px] transition-transform duration-300 hover:-translate-y-1 motion-reduce:transition-none",
        TONE_CLASS[tone],
        className,
      )}
    >
      {children}
    </motion.li>
  );
}

export function TileText({ title, text, tone = "card" }: { title: string; text: string; tone?: TileTone }) {
  return (
    <>
      <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
      <p className={cn("mt-2 max-w-md text-sm leading-relaxed", BODY_CLASS[tone])}>{text}</p>
    </>
  );
}
