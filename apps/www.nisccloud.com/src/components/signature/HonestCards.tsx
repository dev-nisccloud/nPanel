import type { ComponentType, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils.ts";

export type HonestItem = { icon: LucideIcon; title: string; text: string; Art?: ComponentType };

/**
 * "Where we might not suit you": honest cards that set expectations before someone commits.
 * Each card has an illustration band on top, then an icon, title and short explanation.
 */
export function HonestCards({
  id,
  eyebrow,
  title,
  intro,
  items,
  className,
}: {
  id?: string;
  eyebrow: string;
  title: ReactNode;
  intro?: ReactNode;
  items: readonly HonestItem[];
  className?: string;
}) {
  return (
    <section id={id} className={cn("scroll-mt-24 bg-background px-4 py-24 md:px-8 md:py-28", className)}>
      <div className="mx-auto max-w-6xl">
        <p className="type-label text-[#38b6ff]">{eyebrow}</p>
        <h2 className="type-h2 mt-3 max-w-2xl">{title}</h2>
        {intro ? <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">{intro}</p> : null}
        <ul className={cn("mt-12 grid gap-5", items.length === 2 ? "md:grid-cols-2" : "md:grid-cols-3")}>
          {items.map((item) => (
            <li key={item.title} className="overflow-hidden rounded-[24px] border border-border bg-card">
              {item.Art ? (
                <div className="border-b border-border bg-[#38b6ff]/5 px-6 py-4">
                  <item.Art />
                </div>
              ) : null}
              <div className="p-7 pt-6">
                <h3 className="flex items-center gap-2.5 text-xl font-semibold">
                  <item.icon className="size-5 text-[#38b6ff]" aria-hidden />
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
