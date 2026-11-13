import { useState, useEffect, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, ArrowUpRight, ChevronDown, Clock, FileText, Printer, Shield } from "lucide-react";
import Navbar from "@/pages/_components/Navbar.tsx";
import Footer from "@/pages/_components/Footer.tsx";

export interface TocItem {
  id: string;
  label: string;
  sub?: boolean;
}

export interface RelatedLegalLink {
  label: string;
  href: string;
  description: string;
}

interface LegalPageShellProps {
  title: string;
  subtitle: string;
  effectiveDate: string;
  lastUpdated: string;
  version?: string;
  toc: TocItem[];
  /** Full-width band between the header and the document, e.g. an "at a glance" summary. */
  summary?: ReactNode;
  related?: RelatedLegalLink[];
  children: React.ReactNode;
}

export function LegalPageShell({
  title,
  subtitle,
  effectiveDate,
  lastUpdated,
  version,
  toc,
  summary,
  related,
  children,
}: LegalPageShellProps) {
  const [active, setActive] = useState<string>(toc[0]?.id ?? "");

  useEffect(() => {
    const els = toc
      .map(({ id }) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[];

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((e) => e.isIntersecting);
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-80px 0px -55% 0px", threshold: 0 },
    );

    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [toc]);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground print:bg-white print:text-black">
      <div className="print:hidden">
        <Navbar />
      </div>

      {/* Hero strip */}
      <div className="pt-16 bg-gradient-to-b from-muted/50 to-background border-b border-border print:pt-0 print:bg-none">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 md:py-14 print:px-0 print:py-4">
          <p className="hidden print:block text-xs mb-2">Nisc Cloud Limited · nisccloud.com</p>
          <h1 className="type-h1 text-foreground mb-3">{title}</h1>
          <p className="text-muted-foreground text-sm md:text-base max-w-2xl mb-6">{subtitle}</p>

          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-5">
            <span className="flex items-center gap-1.5 bg-muted rounded-full px-3 py-1.5 font-medium">
              <Clock size={11} aria-hidden />
              Effective: {effectiveDate}
            </span>
            <span className="flex items-center gap-1.5 bg-muted rounded-full px-3 py-1.5 font-medium">
              <Clock size={11} aria-hidden />
              Last updated: {lastUpdated}
            </span>
            {version ? (
              <span className="flex items-center gap-1.5 bg-muted rounded-full px-3 py-1.5 font-medium">
                <FileText size={11} aria-hidden />
                Version {version}
              </span>
            ) : null}
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 font-medium hover:bg-muted hover:text-foreground transition-colors cursor-pointer print:hidden"
            >
              <Printer size={11} aria-hidden />
              Print or save as PDF
            </button>
          </div>

          <div className="print:hidden rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-700 px-4 py-3 text-sm text-amber-800 dark:text-amber-300 flex items-start gap-3 mb-3">
            <AlertCircle size={15} className="mt-0.5 shrink-0" aria-hidden />
            <span>
              <strong>Subject to Change.</strong> We may revise these terms from time to time.
              Registered users will be notified by email at least 30 days before any material
              changes take effect. Your continued use of our platform after the effective date
              of any revision constitutes acceptance of the updated terms.
            </span>
          </div>

          <div className="print:hidden rounded-xl bg-primary/5 border border-primary/20 px-4 py-3 text-sm text-primary flex items-start gap-3">
            <Shield size={15} className="mt-0.5 shrink-0" aria-hidden />
            <span>
              Nisc Cloud Limited is registered with the{" "}
              <strong>Office of the Data Protection Commissioner (ODPC)</strong> under the Kenya
              Data Protection Act, 2019. Registration No.{" "}
              <strong>160-3417-5D07</strong> · Serial No. <strong>14768</strong> · Valid 16
              September 2025 – 16 September 2027.
            </span>
          </div>
        </div>
      </div>

      {summary}

      {/* Body */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 print:px-0 print:py-4">
        <details className="group mb-8 rounded-2xl border border-border bg-card lg:hidden print:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-semibold [&::-webkit-details-marker]:hidden">
            On this page
            <ChevronDown size={16} className="transition-transform group-open:rotate-180" aria-hidden />
          </summary>
          <nav aria-label="On this page" className="flex flex-col border-t border-border px-2 py-2">
            {toc.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={[
                  "rounded-lg py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground",
                  item.sub ? "pl-6 pr-2" : "px-2",
                ].join(" ")}
              >
                {item.label}
              </a>
            ))}
          </nav>
        </details>

        <div className="lg:grid lg:grid-cols-[240px_1fr] lg:gap-14 xl:gap-20 print:block">

          {/* TOC sidebar */}
          <aside className="hidden lg:block print:hidden">
            <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pr-2">
              <p className="text-[10px] font-mono font-bold text-primary tracking-widest uppercase mb-4">
                On This Page
              </p>
              <nav aria-label="On this page" className="flex flex-col gap-0.5">
                {toc.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => scrollTo(item.id)}
                    className={[
                      "text-left text-sm py-1.5 border-l-2 transition-all duration-150 cursor-pointer",
                      item.sub ? "pl-6" : "pl-3",
                      active === item.id
                        ? "border-primary text-primary font-semibold"
                        : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground",
                    ].join(" ")}
                  >
                    {item.label}
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          {/* Prose content */}
          <main
            id="main-content"
            className="min-w-0 prose prose-gray dark:prose-invert max-w-none
              prose-headings:scroll-mt-28
              prose-h2:text-xl prose-h2:font-bold prose-h2:border-b prose-h2:border-border prose-h2:pb-2 prose-h2:mt-12 prose-h2:mb-4
              prose-h3:text-base prose-h3:font-semibold prose-h3:mt-6 prose-h3:mb-2
              prose-p:text-muted-foreground prose-p:leading-relaxed
              prose-li:text-muted-foreground prose-li:leading-relaxed
              prose-strong:text-foreground prose-strong:font-semibold
              prose-a:text-primary prose-a:no-underline hover:prose-a:underline
              prose-table:text-sm prose-th:text-foreground prose-td:text-muted-foreground
              prose-blockquote:border-primary prose-blockquote:text-muted-foreground
              print:prose-p:text-black print:prose-li:text-black print:prose-td:text-black
            "
          >
            {children}

            {related && related.length > 0 ? (
              <section aria-labelledby="related-documents" className="not-prose mt-16 print:hidden">
                <h2 id="related-documents" className="type-label text-primary">Related documents</h2>
                <ul className="mt-4 grid gap-px overflow-hidden rounded-[24px] border border-border bg-border sm:grid-cols-2">
                  {related.map((item) => (
                    <li key={item.href} className="bg-card">
                      <Link
                        to={item.href}
                        className="group flex h-full items-start justify-between gap-4 p-5 transition-colors hover:bg-muted/50"
                      >
                        <span>
                          <span className="block text-sm font-semibold text-foreground">{item.label}</span>
                          <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">{item.description}</span>
                        </span>
                        <ArrowUpRight
                          size={16}
                          className="mt-0.5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary"
                          aria-hidden
                        />
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </main>
        </div>
      </div>

      <div className="print:hidden">
        <Footer />
      </div>
    </div>
  );
}
