import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Search } from "lucide-react";
import Navbar from "@/pages/_components/Navbar.tsx";
import Footer from "@/pages/_components/Footer.tsx";
import { ClosingCta } from "@/components/closing-cta.tsx";
import { cn } from "@/lib/utils.ts";
import { trackEvent } from "@/lib/track.ts";
import {
  ACTION_LABEL,
  FINDER_CHOICES,
  GROUPS,
  PRODUCTS,
  type FinderChoice,
  type ProductKey,
} from "./_components/cloud-catalog.ts";
import { StackIllustration } from "./_components/StackIllustration.tsx";

function ProductFinder({
  choice,
  onChoose,
}: {
  choice: FinderChoice | null;
  onChoose: (choice: FinderChoice | null) => void;
}) {
  return (
    <div>
      <h2 id="finder-heading" className="text-lg font-bold tracking-tight">
        What are you putting online?
      </h2>
      <div role="group" aria-labelledby="finder-heading" className="mt-3 flex flex-wrap gap-2">
        {FINDER_CHOICES.map((c) => {
          const active = choice?.id === c.id;
          const Icon = c.icon;
          return (
            <button
              key={c.id}
              type="button"
              aria-pressed={active}
              onClick={() => {
                const next = active ? null : c;
                onChoose(next);
                if (next) trackEvent("hosting_finder_select", { choice: next.id });
              }}
              className={cn(
                "inline-flex min-h-11 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                active
                  ? "border-[#02070a] bg-[#02070a] text-white dark:border-primary dark:bg-primary dark:text-[#02070a]"
                  : "border-border bg-card text-foreground hover:border-primary/60",
              )}
            >
              <Icon className="size-4 shrink-0" aria-hidden />
              {c.label}
            </button>
          );
        })}
      </div>

      <div aria-live="polite" className="mt-5 min-h-[7.5rem] rounded-2xl border border-border bg-card p-4">
        {choice ? (
          <>
            <p className="text-sm leading-relaxed text-muted-foreground">{choice.summary}</p>
            <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
              {choice.products.map((key) => (
                <li key={key}>
                  <Link
                    to={PRODUCTS[key].href}
                    className="inline-flex items-center gap-1 text-sm font-semibold text-sky-700 underline-offset-4 hover:underline dark:text-primary"
                  >
                    {PRODUCTS[key].title}
                    <ArrowRight className="size-3.5" aria-hidden />
                  </Link>
                </li>
              ))}
              {choice.extra ? (
                <li>
                  <Link
                    to={choice.extra.href}
                    className="inline-flex items-center gap-1 text-sm font-semibold text-sky-700 underline-offset-4 hover:underline dark:text-primary"
                  >
                    {choice.extra.label}
                    <ArrowRight className="size-3.5" aria-hidden />
                  </Link>
                </li>
              ) : null}
            </ul>
          </>
        ) : (
          <p className="text-sm leading-relaxed text-muted-foreground">
            Choose an option to see the products you need. They are also highlighted in the full list below.
          </p>
        )}
      </div>
    </div>
  );
}

function ProductCard({ productKey, recommended }: { productKey: ProductKey; recommended: boolean }) {
  const product = PRODUCTS[productKey];
  const Icon = product.icon;
  return (
    <Link
      to={product.href}
      className={cn(
        "group relative flex h-full flex-col rounded-2xl border bg-card p-6 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        recommended ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-primary/50",
      )}
    >
      <span className="mb-4 flex size-11 items-center justify-center rounded-xl bg-primary/10 text-sky-700 dark:text-primary">
        <Icon size={22} strokeWidth={1.9} aria-hidden />
      </span>
      <h3 className="flex flex-wrap items-center gap-2 text-lg font-bold">
        {product.title}
        {product.isNew ? (
          <span className="rounded-full bg-brand-orange/15 px-2 py-0.5 text-xs font-semibold text-[#b9411f] dark:text-brand-orange">
            New
          </span>
        ) : null}
      </h3>
      {recommended ? (
        <span className="absolute right-4 top-4 rounded-full bg-primary/15 px-2.5 py-1 text-xs font-semibold text-sky-800 dark:text-primary">
          In your stack
        </span>
      ) : null}
      <p className="mb-4 mt-1 text-sm text-muted-foreground">{product.desc}</p>
      <span className="mt-auto inline-flex items-center gap-1 text-sm font-semibold text-sky-700 transition-[gap] group-hover:gap-2 dark:text-primary">
        {ACTION_LABEL[product.action]}
        <ArrowRight size={14} aria-hidden />
      </span>
    </Link>
  );
}

export default function HostingPage() {
  const [choice, setChoice] = useState<FinderChoice | null>(null);
  const recommended = new Set<ProductKey>(choice?.products ?? []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main id="main-content">
        <section aria-labelledby="hosting-heading" className="px-4 pb-14 pt-28 md:px-8 md:pt-32">
          <div className="mx-auto grid max-w-7xl items-start gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-14">
            <div>
              <p className="type-label mb-3 text-sky-700 dark:text-primary">Cloud products</p>
              <h1 id="hosting-heading" className="type-h1 text-balance">
                Everything your website needs to go live and stay fast
              </h1>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
                Domains, hosting, email, servers and SSL in one place, managed together in nPanel.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/hosting/domains"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/25 transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  <Search className="size-4" aria-hidden />
                  Search for a Domain
                </Link>
                <Link
                  to="/pricing"
                  className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-border px-6 text-sm font-semibold text-foreground transition hover:border-primary/50 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  Compare All Plans
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                </Link>
              </div>

              <div className="mt-10">
                <ProductFinder choice={choice} onChoose={setChoice} />
              </div>
            </div>

            <div className="lg:sticky lg:top-28">
              <StackIllustration choice={choice} />
            </div>
          </div>
        </section>

        <nav aria-label="Product categories" className="border-y border-border bg-muted/30 px-4 py-5 md:px-8">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2">
            <span className="mr-2 text-sm font-semibold text-foreground">Browse all products:</span>
            {GROUPS.map((g) => (
              <a
                key={g.id}
                href={`#${g.id}`}
                className="inline-flex min-h-10 items-center rounded-full border border-border bg-card px-4 text-sm font-semibold text-foreground transition-colors hover:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {g.title}
              </a>
            ))}
          </div>
        </nav>

        <div className="mx-auto max-w-7xl space-y-14 px-4 py-14 md:px-8">
          {GROUPS.map((g) => (
            <section key={g.id} id={g.id} aria-labelledby={`${g.id}-heading`} className="scroll-mt-24">
              <h2 id={`${g.id}-heading`} className="type-h2">
                {g.title}
              </h2>
              <p className="mb-5 mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">{g.intro}</p>
              <div className={`grid grid-cols-1 gap-5 sm:grid-cols-2 ${g.cols}`}>
                {g.items.map((key) => (
                  <ProductCard key={key} productKey={key} recommended={recommended.has(key)} />
                ))}
              </div>
            </section>
          ))}
        </div>

        <ClosingCta
          eyebrow="Not sure where to start?"
          headline="Find the right hosting for your business"
          subtext="Compare every plan side by side, or tell us about your website and we will recommend the right setup before you pay."
          primary={{ label: "Compare All Plans", href: "/pricing" }}
          secondary={{ label: "Talk to Our Team", href: "/contact?serviceName=Cloud%20Hosting" }}
          steps={["Choose your products", "Connect your domain", "Go live and manage it in nPanel"]}
          details={{ variant: "rack" }}
        />
      </main>
      <Footer />
    </div>
  );
}
