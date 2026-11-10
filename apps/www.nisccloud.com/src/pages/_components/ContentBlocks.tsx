import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils.ts";

/**
 * Answer-first content blocks for product and service pages. Each band opens with a short, quotable
 * answer to its heading (for search and AI answers), then the detail buyers need at that point.
 */
export function ContentBand({
  id,
  label,
  title,
  answer,
  children,
  tone = "plain",
  className,
}: {
  id: string;
  label?: string;
  title: string;
  answer: string;
  children?: ReactNode;
  tone?: "plain" | "muted";
  className?: string;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className={cn("scroll-mt-24 py-16 md:py-20", tone === "muted" && "border-y border-border/60 bg-muted/30", className)}
    >
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        {label ? <p className="type-label mb-3 text-sky-700 dark:text-primary">{label}</p> : null}
        <h2 id={`${id}-heading`} className="max-w-3xl text-balance text-3xl font-bold tracking-tight md:text-4xl">
          {title}
        </h2>
        <p className="mt-5 max-w-[70ch] border-l-4 border-primary pl-4 text-lg font-medium leading-relaxed text-foreground">
          {answer}
        </p>
        {children}
      </div>
    </section>
  );
}

export function Prose({ paragraphs, className }: { paragraphs: string[]; className?: string }) {
  return (
    <div className={cn("space-y-4", className)}>
      {paragraphs.map((p) => (
        <p key={p.slice(0, 48)} className="max-w-[70ch] text-base leading-relaxed text-muted-foreground md:text-[17px]">
          {p}
        </p>
      ))}
    </div>
  );
}

export function RelatedLinks({ links, className }: { links: { label: string; href: string }[]; className?: string }) {
  return (
    <ul className={cn("flex flex-wrap gap-x-6 gap-y-2", className)}>
      {links.map((l) => (
        <li key={l.href}>
          <Link
            to={l.href}
            className="inline-flex items-center gap-1 text-base font-semibold text-sky-700 underline-offset-4 hover:underline dark:text-primary"
          >
            {l.label}
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function StepList({ steps, className }: { steps: string[]; className?: string }) {
  return (
    <ol className={cn("space-y-4", className)}>
      {steps.map((step, i) => (
        <li key={step} className="flex gap-4">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-base font-bold text-[#02070a]">
            {i + 1}
          </span>
          <span className="pt-1.5 text-base leading-relaxed text-foreground md:text-[17px]">{step}</span>
        </li>
      ))}
    </ol>
  );
}

export function Glossary({ items, className }: { items: { term: string; desc: string }[]; className?: string }) {
  return (
    <dl className={cn("divide-y divide-border rounded-3xl border border-border bg-card", className)}>
      {items.map((d) => (
        <div key={d.term} className="grid gap-1 p-5 sm:grid-cols-[150px_minmax(0,1fr)] sm:gap-6">
          <dt className="text-base font-semibold text-foreground">{d.term}</dt>
          <dd className="text-[15px] leading-relaxed text-muted-foreground">{d.desc}</dd>
        </div>
      ))}
    </dl>
  );
}

export type PlanFit = { name: string; level: number; bestFor: string; chooseIf: string; recommended?: boolean };

function PlanFitMeter({ level, max }: { level: number; max: number }) {
  return (
    <span aria-hidden className="flex items-end gap-1">
      {Array.from({ length: max }, (_, i) => i + 1).map((bar) => (
        <span
          key={bar}
          className={cn("w-2 rounded-sm", bar <= level ? "bg-primary" : "bg-primary/15")}
          style={{ height: `${8 + bar * 5}px` }}
        />
      ))}
    </span>
  );
}

/** "Which plan fits?" cards shown straight after the plan cards, while visitors decide. */
export function PlanFitGrid({
  plans,
  note,
  contactHref,
}: {
  plans: PlanFit[];
  note: ReactNode;
  contactHref: string;
}) {
  const max = Math.max(...plans.map((p) => p.level));
  return (
    <>
      <ul className={cn("mt-10 grid gap-4 sm:grid-cols-2", plans.length === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3")}>
        {plans.map((plan) => (
          <li
            key={plan.name}
            className={cn(
              "flex flex-col rounded-3xl border bg-card p-6",
              plan.recommended ? "border-primary ring-2 ring-primary/25" : "border-border",
            )}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold tracking-tight">{plan.name}</h3>
              <PlanFitMeter level={plan.level} max={max} />
            </div>
            <p className="mt-3 text-base font-semibold text-foreground">{plan.bestFor}</p>
            <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
              <span className="font-medium text-foreground">Choose it if </span>
              {plan.chooseIf.charAt(0).toLowerCase() + plan.chooseIf.slice(1)}
            </p>
            {plan.recommended ? (
              <span className="mt-4 w-fit rounded-full bg-brand-orange/15 px-2.5 py-1 text-xs font-semibold text-[#b9411f] dark:text-brand-orange">
                Most businesses start here
              </span>
            ) : null}
          </li>
        ))}
      </ul>
      <div className="mt-8 flex flex-col gap-4 rounded-3xl border border-dashed border-primary/40 bg-primary/[0.05] p-6 md:flex-row md:items-center md:justify-between">
        <p className="max-w-[65ch] text-base leading-relaxed text-foreground">{note}</p>
        <div className="flex shrink-0 flex-wrap gap-3">
          <a
            href="#plans"
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-base font-bold text-[#02070a] transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Compare plans
            <ArrowRight className="size-4" aria-hidden />
          </a>
          <Link
            to={contactHref}
            className="inline-flex h-11 items-center rounded-xl border border-border bg-card px-5 text-base font-semibold text-foreground transition hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Ask our team
          </Link>
        </div>
      </div>
    </>
  );
}

/** Comparison table that highlights the column for the product on the current page. */
export function ComparisonTable({
  caption,
  columns,
  rows,
  highlight,
  links,
}: {
  caption: string;
  columns: { title: string; href?: string }[];
  rows: { label: string; cells: string[] }[];
  /** Index into `columns` for the current product. */
  highlight: number;
  links?: boolean;
}) {
  return (
    <div className="mt-10 overflow-x-auto rounded-3xl border border-border bg-card">
      <table className="w-full min-w-[720px] border-collapse text-left">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            <th scope="col" className="w-44 p-5" />
            {columns.map((c, i) => (
              <th
                key={c.title}
                scope="col"
                className={cn("p-5 align-bottom text-lg font-bold", i === highlight && "bg-primary/10")}
              >
                {i === highlight ? (
                  <span className="mb-2 block w-fit rounded-full bg-primary px-2.5 py-0.5 text-xs font-bold text-[#02070a]">You're here</span>
                ) : null}
                {c.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-t border-border">
              <th scope="row" className="p-5 align-top text-base font-semibold text-foreground">
                {row.label}
              </th>
              {row.cells.map((cell, i) => (
                <td
                  key={i}
                  className={cn("p-5 align-top text-[15px] leading-relaxed text-muted-foreground", i === highlight && "bg-primary/10 text-foreground")}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
          {links ? (
            <tr className="border-t border-border">
              <td className="p-5" />
              {columns.map((c, i) => (
                <td key={c.title} className={cn("p-5", i === highlight && "bg-primary/10")}>
                  {c.href ? (
                    <Link
                      to={c.href}
                      className="inline-flex items-center gap-1 text-[15px] font-semibold text-sky-700 underline-offset-4 hover:underline dark:text-primary"
                    >
                      {i === highlight ? "See plans" : `Explore ${c.title}`}
                      <ArrowRight className="size-4" aria-hidden />
                    </Link>
                  ) : null}
                </td>
              ))}
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
