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
