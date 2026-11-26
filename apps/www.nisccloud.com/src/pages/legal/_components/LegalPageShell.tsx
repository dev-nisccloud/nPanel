import { useState, useEffect, useRef, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  ArrowUpRight,
  ChevronRight,
  Clock,
  FileText,
  ListOrdered,
  Printer,
  Shield,
} from "lucide-react";
import Navbar from "@/pages/_components/Navbar.tsx";
import Footer from "@/pages/_components/Footer.tsx";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet.tsx";
import { LegalContactPanel } from "./LegalContactPanel.tsx";

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

function useReadingProgress() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);
  return progress;
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
  const [sheetOpen, setSheetOpen] = useState(false);
  const pendingTarget = useRef<string | null>(null);
  const progress = useReadingProgress();
  const chapters = toc.filter((item) => !item.sub);
  const activeChapter = (() => {
    const index = toc.findIndex((item) => item.id === active);
    for (let i = index; i >= 0; i--) if (!toc[i].sub) return toc[i];
    return chapters[0];
  })();

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
    const el = document.getElementById(id);
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    history.replaceState(null, "", `#${id}`);
  };

  const tocLinks = (onPick?: () => void) =>
    toc.map((item) => {
      const isActive = active === item.id;
      return (
        <a
          key={item.id}
          href={`#${item.id}`}
          aria-current={isActive ? "location" : undefined}
          onClick={(event) => {
            event.preventDefault();
            if (onPick) {
              pendingTarget.current = item.id;
              onPick();
            } else {
              scrollTo(item.id);
            }
          }}
          className={[
            "block rounded-lg border-l-2 py-2 pr-2 text-sm leading-snug transition-colors",
            item.sub ? "pl-7 text-[13px]" : "pl-3",
            isActive
              ? "border-[#38b6ff] bg-[#38b6ff]/[0.08] font-semibold text-foreground"
              : "border-transparent text-muted-foreground hover:border-border hover:bg-muted/60 hover:text-foreground",
          ].join(" ")}
        >
          {item.label}
        </a>
      );
    });

  return (
    <div className="min-h-screen bg-background text-foreground print:bg-white print:text-black">
      <div
        className="fixed inset-x-0 top-0 z-[60] h-[3px] origin-left bg-[#38b6ff] print:hidden"
        style={{ transform: `scaleX(${progress})` }}
        role="progressbar"
        aria-label="Reading progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress * 100)}
      />
      <div className="print:hidden">
        <Navbar />
      </div>

      {/* Hero */}
      <header className="relative overflow-hidden border-b border-border bg-gradient-to-b from-muted/60 to-background pt-16 print:bg-none print:pt-0">
        <div
          className="pointer-events-none absolute inset-0 opacity-60 [background-image:radial-gradient(circle_at_1px_1px,rgb(56_182_255_/_0.18)_1px,transparent_0)] [background-size:22px_22px] [mask-image:linear-gradient(to_bottom,black,transparent_85%)] print:hidden"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-24 -top-24 size-[420px] rounded-full bg-[#38b6ff]/15 blur-3xl print:hidden"
          aria-hidden
        />
        <div className="relative mx-auto max-w-7xl px-4 py-10 md:px-8 md:py-14 print:px-0 print:py-4">
          <p className="mb-2 hidden text-xs print:block">Nisc Cloud Limited · nisccloud.com</p>
          <nav aria-label="Breadcrumb" className="mb-5 print:hidden">
            <ol className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <li>
                <Link to="/legal" className="rounded hover:text-foreground hover:underline">Legal centre</Link>
              </li>
              <li aria-hidden><ChevronRight size={14} /></li>
              <li aria-current="page" className="font-medium text-foreground">{title}</li>
            </ol>
          </nav>
          <h1 className="type-h1 mb-3 text-balance text-foreground">{title}</h1>
          <p className="mb-6 max-w-2xl text-base text-muted-foreground md:text-lg">{subtitle}</p>

          <div className="mb-6 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5 rounded-full border border-border bg-card/80 px-3 py-1.5 font-medium backdrop-blur">
              <Clock size={12} aria-hidden />
              Effective: {effectiveDate}
            </span>
            <span className="flex items-center gap-1.5 rounded-full border border-border bg-card/80 px-3 py-1.5 font-medium backdrop-blur">
              <Clock size={12} aria-hidden />
              Last updated: {lastUpdated}
            </span>
            {version ? (
              <span className="flex items-center gap-1.5 rounded-full border border-border bg-card/80 px-3 py-1.5 font-medium backdrop-blur">
                <FileText size={12} aria-hidden />
                Version {version}
              </span>
            ) : null}
            <span className="flex items-center gap-1.5 rounded-full border border-border bg-card/80 px-3 py-1.5 font-medium backdrop-blur print:hidden">
              <ListOrdered size={12} aria-hidden />
              {chapters.length} sections
            </span>
            <button
              type="button"
              onClick={() => window.print()}
              className="flex min-h-8 cursor-pointer items-center gap-1.5 rounded-full border border-border px-3 py-1.5 font-medium transition-colors hover:bg-muted hover:text-foreground print:hidden"
            >
              <Printer size={12} aria-hidden />
              Print or save as PDF
            </button>
          </div>

          <div className="grid gap-3 md:grid-cols-2 print:hidden">
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
              <AlertCircle size={15} className="mt-0.5 shrink-0" aria-hidden />
              <span>
                <strong>Subject to change.</strong> Registered users are emailed at least 30 days before
                material changes take effect. Continued use after that date means you accept them.
              </span>
            </div>
            <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
              <Shield size={15} className="mt-0.5 shrink-0" aria-hidden />
              <span>
                Registered with the <strong>Office of the Data Protection Commissioner</strong>. No.{" "}
                <strong>160-3417-5D07</strong> · Serial <strong>14768</strong> · valid 16 Sep 2025 – 16 Sep 2027.
              </span>
            </div>
          </div>
        </div>
      </header>

      {summary}

      {/* Body */}
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-8 print:px-0 print:py-4">
        <div className="print:block lg:grid lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-14 xl:grid-cols-[320px_minmax(0,1fr)] xl:gap-20">
          {/* Contents sidebar */}
          <aside className="hidden lg:block print:hidden" aria-label="Document contents">
            <div className="sticky top-24 flex max-h-[calc(100vh-7rem)] flex-col rounded-[24px] border border-border bg-card/70 p-4 shadow-sm backdrop-blur">
              <div className="flex items-center justify-between gap-3 px-1 pb-3">
                <p className="type-label text-primary">On this page</p>
                <span className="text-xs font-semibold tabular-nums text-muted-foreground">
                  {Math.round(progress * 100)}% read
                </span>
              </div>
              <div className="mx-1 mb-3 h-1 overflow-hidden rounded-full bg-muted" aria-hidden>
                <div
                  className="h-full origin-left rounded-full bg-[#38b6ff]"
                  style={{ transform: `scaleX(${progress})` }}
                />
              </div>
              <nav aria-label="On this page" className="-mr-2 flex-1 overflow-y-auto overscroll-contain pr-2">
                {tocLinks()}
              </nav>
              <div className="mt-3 border-t border-border px-1 pt-3 text-xs leading-relaxed text-muted-foreground">
                Questions?{" "}
                <a href="mailto:compliance@nisccloud.com" className="font-semibold text-primary hover:underline">
                  compliance@nisccloud.com
                </a>
              </div>
            </div>
          </aside>

          {/* Prose content */}
          <main
            id="main-content"
            className="min-w-0 prose prose-gray dark:prose-invert max-w-none
              prose-headings:scroll-mt-28
              prose-h2:text-xl md:prose-h2:text-2xl prose-h2:font-bold prose-h2:tracking-tight prose-h2:border-b prose-h2:border-border prose-h2:pb-3 prose-h2:mt-14 prose-h2:mb-0
              prose-h3:text-base prose-h3:font-semibold prose-h3:mt-7 prose-h3:mb-2
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
                <div className="flex items-end justify-between gap-4">
                  <h2 id="related-documents" className="type-label text-primary">Related documents</h2>
                  <Link to="/legal" className="text-sm font-semibold text-primary hover:underline">
                    All legal documents
                  </Link>
                </div>
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
                          className="mt-0.5 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary motion-reduce:transition-none"
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

      <LegalContactPanel />

      {/* Mobile contents: a thumb-reach button that opens the full outline */}
      <button
        type="button"
        onClick={() => setSheetOpen(true)}
        className={[
          "fixed bottom-4 left-4 z-40 flex h-12 max-w-[calc(100vw-6rem)] cursor-pointer items-center gap-2 rounded-full border border-border bg-card/95 pl-4 pr-5 text-sm font-semibold text-foreground shadow-lg backdrop-blur transition-[opacity,transform] duration-200 motion-reduce:transition-none lg:hidden print:hidden sm:bottom-6 sm:left-6",
          progress > 0.03 ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0",
        ].join(" ")}
        aria-haspopup="dialog"
      >
        <ListOrdered size={16} className="shrink-0 text-[#38b6ff]" aria-hidden />
        <span className="truncate">{activeChapter?.label ?? "Contents"}</span>
      </button>
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="bottom"
          className="max-h-[80vh] rounded-t-[24px] lg:hidden"
          onCloseAutoFocus={(event) => {
            // The sheet restores scroll and focus as it closes; scroll only after that.
            const id = pendingTarget.current;
            if (!id) return;
            event.preventDefault();
            pendingTarget.current = null;
            scrollTo(id);
          }}
        >
          <SheetHeader className="pb-2">
            <SheetTitle>On this page</SheetTitle>
            <SheetDescription>
              {title} · {Math.round(progress * 100)}% read
            </SheetDescription>
          </SheetHeader>
          <nav aria-label="On this page" className="overflow-y-auto overscroll-contain px-4 pb-6">
            {tocLinks(() => setSheetOpen(false))}
          </nav>
        </SheetContent>
      </Sheet>

      <div className="print:hidden">
        <Footer />
      </div>
    </div>
  );
}
