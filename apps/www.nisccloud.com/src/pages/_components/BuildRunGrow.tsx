import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { PillarIcon, type Pillar } from "./PillarIcon.tsx";

const pillars: {
  pillar: Pillar;
  tag: string;
  title: string;
  items: string;
  cta: { label: string; href: string };
  tagClass: string;
}[] = [
  {
    pillar: "build",
    tag: "Build",
    title: "Make your ideas real.",
    items: "Brand identity · Websites · Ecommerce · Custom applications",
    cta: { label: "Explore Build Solutions", href: "/services" },
    tagClass: "text-[#b9411f] dark:text-brand-orange",
  },
  {
    pillar: "run",
    tag: "Run",
    title: "Keep your digital business running.",
    items: "Domains · Hosting · Email · VPS & servers",
    cta: { label: "Explore Cloud Products", href: "/hosting" },
    tagClass: "text-sky-700 dark:text-primary",
  },
  {
    pillar: "grow",
    tag: "Grow",
    title: "Turn digital activity into measurable growth.",
    items: "SEO · Paid media · Social & content · Marketing automation",
    cta: { label: "Explore Growth Services", href: "/services/marketing" },
    tagClass: "text-foreground",
  },
  {
    pillar: "ai",
    tag: "Zepo AI",
    title: "Smarter tools, built into the way you work.",
    items: "Customer conversations · Follow-ups · Repetitive workflows, where available",
    cta: { label: "Explore Zepo AI", href: "/services/zepo-ai" },
    tagClass: "text-[#b9411f] dark:text-brand-orange",
  },
];

/** Homepage Build / Run / Grow summary, with Zepo AI working across all three. */
export default function BuildRunGrow() {
  return (
    <section id="build-run-grow" aria-labelledby="brg-heading" className="py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="mb-8 max-w-2xl">
          <p className="type-label mb-2 text-sky-700 dark:text-primary">Build. Run. Grow.</p>
          <h2 id="brg-heading" className="type-h2 text-balance">
            One partner for every stage of your digital business.
          </h2>
        </div>

        <div className="grid gap-px overflow-hidden rounded-3xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
          {pillars.map(({ pillar, tag, title, items, cta, tagClass }) => (
            <article key={tag} className="flex flex-col bg-card p-6">
              <PillarIcon pillar={pillar} active />
              <p className={`type-label mt-4 ${tagClass}`}>{tag}</p>
              <h3 className="type-h3 mt-1">{title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{items}</p>
              <Link
                to={cta.href}
                className="mt-5 inline-flex items-center gap-1.5 self-start text-sm font-semibold text-sky-700 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:text-primary"
              >
                {cta.label}
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
