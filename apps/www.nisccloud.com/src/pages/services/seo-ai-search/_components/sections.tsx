import { ArrowRight, MapPin, MessageSquareText, Search } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { SearchSurfacesArt } from "@/components/artwork/search-surfaces-art.tsx";
import { SeoStory } from "@/components/artwork/npanel-stories";
import { ClientLogoStrip } from "@/pages/_components/ClientLogoStrip.tsx";
import { SEO_POLICY } from "@/lib/seo-ai-search.ts";

export function SeoHero({ onFindPlan, onComparePlans }: { onFindPlan: () => void; onComparePlans: () => void }) {
  return (
    <section aria-labelledby="seo-hero-heading" className="relative overflow-hidden px-4 pt-24 pb-10 md:px-8 lg:pb-14">
      <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1fr_minmax(0,600px)] lg:gap-14">
        <div>
          <p className="type-label text-primary">SEO &amp; AI Search Optimisation</p>
          <h1 id="seo-hero-heading" className="type-h1 mt-4 text-balance">
            Get found where your next customer searches.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Google, Maps and AI answers, worked on every month. Search positions, clicks, top pages, queries, traffic and your reports show in nPanel automatically.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" className="min-h-12 gap-2 rounded-2xl px-8 font-bold shadow-lg shadow-primary/30" onClick={onFindPlan}>
              Find my plan <ArrowRight className="size-4" aria-hidden />
            </Button>
            <Button size="lg" variant="outline" className="min-h-12 rounded-2xl px-8 font-semibold" onClick={onComparePlans}>
              Compare plans
            </Button>
          </div>
        </div>
        <SearchSurfacesArt />
      </div>
    </section>
  );
}

export function SeoProof() {
  return (
    <section aria-label="Businesses that work with Nisc Cloud" className="px-4 pb-14 md:px-8">
      <div className="mx-auto max-w-7xl">
        <ClientLogoStrip />
      </div>
    </section>
  );
}

const SURFACES = [
  {
    icon: Search,
    title: "Search results",
    method: "SEO",
    body: "When someone types a question into Google or Bing, the results list pages. We help yours get found, understood and chosen.",
  },
  {
    icon: MapPin,
    title: "Maps",
    method: "Local SEO, where relevant",
    body: "If customers visit you or you serve an area, accurate business details and a well-kept Google Business Profile help you show up nearby.",
  },
  {
    icon: MessageSquareText,
    title: "AI answers",
    method: "AEO and GEO",
    body: "ChatGPT, Gemini, Perplexity and Google’s AI Overviews answer questions directly and sometimes name sources. Clear, consistent information makes you easier to describe and cite.",
  },
];

const METHODS = [
  {
    term: "SEO",
    name: "Search engine optimisation",
    detail: "Technical health, useful pages and the right search terms, so search engines can crawl, understand and rank your site.",
  },
  {
    term: "AEO",
    name: "Answer engine optimisation",
    detail: "Direct, well-organised answers to the questions buyers ask, so search features and AI tools can quote them accurately.",
  },
  {
    term: "GEO",
    name: "Generative engine optimisation",
    detail: "Consistent facts about who you are, what you offer and where, on your site and across the web, so AI tools describe you correctly.",
  },
];

export function SearchSurfaces() {
  return (
    <section id="where-customers-search" aria-labelledby="surfaces-heading" className="scroll-mt-24 px-4 py-16 md:px-8 md:py-20">
      <div className="mx-auto max-w-7xl">
        <h2 id="surfaces-heading" className="type-h2 max-w-3xl text-balance">
          Search, Maps and AI answers
        </h2>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          Customers look for businesses in three places. One service covers all three, using three methods that work together.
        </p>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {SURFACES.map(({ icon: Icon, title, method, body }) => (
            <article key={title} className="rounded-2xl border border-border bg-card p-6">
              <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="size-5" aria-hidden />
              </span>
              <h3 className="type-h3 mt-4">{title}</h3>
              <p className="mt-1 text-sm font-semibold text-primary">{method}</p>
              <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">{body}</p>
            </article>
          ))}
        </div>

        <div className="mt-12 rounded-2xl border border-border bg-muted/30 p-6 md:p-8">
          <h3 className="type-h3">What SEO, AEO and GEO mean</h3>
          <dl className="mt-6 grid gap-6 md:grid-cols-3">
            {METHODS.map((m) => (
              <div key={m.term}>
                <dt>
                  <span className="text-2xl font-extrabold tracking-tight text-foreground">{m.term}</span>
                  <span className="mt-0.5 block text-sm font-medium text-muted-foreground">{m.name}</span>
                </dt>
                <dd className="mt-2 text-[15px] leading-relaxed text-foreground">{m.detail}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-6 border-t border-border pt-5 text-sm leading-relaxed text-muted-foreground">
            Every plan includes all three methods. They are not sold separately. Structured data and llms.txt files can help software read a site, but neither is
            required to appear in AI answers, and neither guarantees it.
          </p>
        </div>
      </div>
    </section>
  );
}

const FIRST_30_DAYS = [
  { title: "Understand your business", body: "We learn what you sell and who buys it, and set a baseline for your search visibility." },
  { title: "Agree priorities", body: "We agree the highest-priority improvements with you." },
  { title: "Do the first work", body: "We complete the initial work within your plan’s scope." },
  { title: "Review and plan ahead", body: "We review progress with you and set the next priorities." },
];

export function FirstThirtyDays() {
  return (
    <section id="first-30-days" aria-labelledby="first-30-heading" className="scroll-mt-24 px-4 py-16 md:px-8 md:py-20">
      <div className="mx-auto max-w-7xl">
        <h2 id="first-30-heading" className="type-h2 text-balance">
          Your first 30 days
        </h2>
        <ol className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {FIRST_30_DAYS.map((step, i) => (
            <li key={step.title} className="rounded-2xl border border-border bg-card p-6">
              <span className="flex size-10 items-center justify-center rounded-full border-2 border-primary/30 bg-primary/[0.06] font-bold text-primary">
                {i + 1}
              </span>
              <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{step.body}</p>
            </li>
          ))}
        </ol>
        <p className="mt-6 max-w-3xl text-sm text-muted-foreground">
          We don’t promise rankings. {SEO_POLICY.expectation}
        </p>
      </div>
    </section>
  );
}

const REPORT_CONTENTS = [
  { title: "Work completed", body: "Every change we made that month, page by page." },
  { title: "Observations", body: "What moved in search visibility, traffic and the enquiries we can measure." },
  { title: "AI visibility checks", body: "Sampled answers to a set of buyer questions, where your plan includes them." },
  { title: "Next priorities", body: "What we will work on next, and why." },
];

export function SampleReport() {
  return (
    <section id="sample-report" aria-labelledby="sample-report-heading" className="scroll-mt-24 border-y border-border/60 bg-muted/20 px-4 py-16 md:px-8 md:py-20">
      <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-2">
        <div>
          <h2 id="sample-report-heading" className="type-h2 text-balance">
            What your monthly report shows
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            The reports and analytics appear in your nPanel account automatically: search positions, clicks, top pages, queries and traffic.
          </p>
          <dl className="mt-8 grid gap-5 sm:grid-cols-2">
            {REPORT_CONTENTS.map((item) => (
              <div key={item.title}>
                <dt className="font-semibold">{item.title}</dt>
                <dd className="mt-1 text-[15px] leading-relaxed text-muted-foreground">{item.body}</dd>
              </div>
            ))}
          </dl>
        </div>
        <figure>
          <SeoStory />
          <figcaption className="mt-3 text-center text-sm text-muted-foreground">Sample report. Illustrative data, not a client’s results.</figcaption>
        </figure>
      </div>
    </section>
  );
}
