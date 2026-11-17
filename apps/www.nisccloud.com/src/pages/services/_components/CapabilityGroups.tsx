import type { ElementType, ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils.ts";

export type CapabilityGroup = {
  icon: ElementType;
  title: string;
  body: string;
  /** A real request a customer could type, shown as a chat bubble. */
  example: string;
  items: string[];
};

/** "What you get" for the AI products: grouped abilities, each with an example request. */
export function CapabilityGroups({
  eyebrow = "What you get",
  title,
  intro,
  groups,
  exampleLabel = "You ask",
}: {
  eyebrow?: string;
  title: ReactNode;
  intro?: string;
  groups: CapabilityGroup[];
  exampleLabel?: string;
}) {
  return (
    <section aria-labelledby="capabilities-heading" className="border-t border-border px-4 py-16 md:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <p className="type-label text-primary">{eyebrow}</p>
          <h2 id="capabilities-heading" className="type-h2 mt-3 text-balance">{title}</h2>
          {intro && <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{intro}</p>}
        </div>

        <ul className="mt-10 grid gap-5 md:grid-cols-2">
          {groups.map(({ icon: Icon, title: groupTitle, body, example, items }) => (
            <li key={groupTitle} className="flex flex-col rounded-[24px] border border-border bg-card p-6 sm:p-7">
              <div className="flex items-start gap-4">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-5" aria-hidden />
                </span>
                <div className="min-w-0">
                  <h3 className="text-xl font-semibold">{groupTitle}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{body}</p>
                </div>
              </div>

              <figure className="mt-5 rounded-2xl border border-primary/15 bg-primary/[0.05] p-3.5">
                <figcaption className="text-[11px] font-semibold uppercase tracking-wide text-primary">{exampleLabel}</figcaption>
                <blockquote className="mt-1 text-[15px] font-medium leading-snug text-foreground">“{example}”</blockquote>
              </figure>

              <ul className={cn("mt-5 grid gap-2.5", items.length > 3 && "sm:grid-cols-2")}>
                {items.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm leading-snug text-foreground/85">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" strokeWidth={3} aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
