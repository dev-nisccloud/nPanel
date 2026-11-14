import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  Cookie,
  Database,
  Eye,
  Gauge,
  Gavel,
  ScrollText,
  ShieldBan,
  type LucideIcon,
} from "lucide-react";
import Navbar from "@/pages/_components/Navbar.tsx";
import Footer from "@/pages/_components/Footer.tsx";
import { cn } from "@/lib/utils.ts";
import { AccreditationBadges } from "@/pages/_components/AccreditationStrip.tsx";
import { CookieSettingsButton } from "./_components/CookieSettingsButton.tsx";
import { LegalContactPanel } from "./_components/LegalContactPanel.tsx";
import { LegalGlance, type GlanceFact } from "./_components/LegalGlance.tsx";
import { LEGAL_DOCUMENTS } from "./_components/legal-documents.ts";
import { COMPANY_REGISTRATION, ODPC_REGISTRATION } from "./_components/legal-contacts.ts";

const EFFECTIVE_DATE = "1 October 2026";

type Tone = "midnight" | "blue" | "card";

interface DocCard {
  href: string;
  icon: LucideIcon;
  highlight: string;
  highlightLabel: string;
  span: string;
  tone: Tone;
}

const CARDS: DocCard[] = [
  { href: "/terms", icon: Gavel, highlight: "26", highlightLabel: "sections covering billing, refunds, uptime and disputes", span: "lg:col-span-4", tone: "midnight" },
  { href: "/sla", icon: Gauge, highlight: "99.9%", highlightLabel: "monthly uptime commitment", span: "lg:col-span-2", tone: "blue" },
  { href: "/acceptable-use", icon: ShieldBan, highlight: "abuse@", highlightLabel: "for reporting spam, phishing and malware", span: "lg:col-span-2", tone: "card" },
  { href: "/dpa", icon: Database, highlight: "72 h", highlightLabel: "to tell you about a confirmed breach", span: "lg:col-span-2", tone: "card" },
  { href: "/privacy", icon: Eye, highlight: "Never", highlightLabel: "do we sell your personal data", span: "lg:col-span-2", tone: "card" },
  { href: "/cookies", icon: Cookie, highlight: "4", highlightLabel: "cookie categories; you choose which run", span: "lg:col-span-2", tone: "card" },
];

const FACTS: GlanceFact[] = [
  { value: "Kenya", label: "Governing law", detail: "Disputes go to mediation, then arbitration in Nairobi." },
  { value: "ODPC", label: "Registered data controller", detail: `Registration No. ${ODPC_REGISTRATION}, valid to September 2027.` },
  { value: "30 days", label: "Notice of material changes", detail: "We email registered users before changes take effect." },
  { value: "3", label: "Data centre regions", detail: "Kenya, America and Europe." },
];

const toneStyles: Record<Tone, { card: string; icon: string; muted: string; accent: string }> = {
  midnight: {
    card: "bg-[#02070A] text-white border-white/10",
    icon: "bg-[#38b6ff]/15 text-[#38b6ff]",
    muted: "text-white/70",
    accent: "text-[#38b6ff]",
  },
  blue: {
    card: "bg-[#38b6ff] text-[#02070A] border-transparent",
    icon: "bg-[#02070A]/10 text-[#02070A]",
    muted: "text-[#02070A]/75",
    accent: "text-[#02070A]",
  },
  card: {
    card: "bg-card text-foreground border-border",
    icon: "bg-[#38b6ff]/12 text-[#1d8fd6] dark:text-[#38b6ff]",
    muted: "text-muted-foreground",
    accent: "text-[#1d8fd6] dark:text-[#38b6ff]",
  },
};

function DocumentStack() {
  return (
    <div className="relative mx-auto h-[260px] w-full max-w-[360px] sm:h-[300px]" aria-hidden>
      {LEGAL_DOCUMENTS.slice(0, 4).map((doc, i) => (
        <div
          key={doc.href}
          className="absolute inset-x-6 rounded-2xl border border-border bg-card p-4 shadow-[0_24px_50px_-30px_rgb(2_7_10_/_0.45)] transition-transform duration-500 motion-reduce:transition-none"
          style={{
            top: `${i * 46}px`,
            transform: `rotate(${(i - 1.5) * 2.5}deg)`,
            zIndex: i,
          }}
        >
          <div className="flex items-center gap-2.5">
            <span className="flex size-7 items-center justify-center rounded-lg bg-[#38b6ff]/15 text-[#38b6ff]">
              <ScrollText size={14} />
            </span>
            <span className="text-sm font-semibold">{doc.label}</span>
          </div>
          <div className="mt-3 space-y-1.5">
            <div className="h-1.5 w-full rounded-full bg-muted" />
            <div className="h-1.5 w-4/5 rounded-full bg-muted" />
          </div>
        </div>
      ))}
      <div className="absolute bottom-0 right-0 z-20 rounded-2xl bg-[#38b6ff] px-4 py-3 text-[#02070A] shadow-lg">
        <p className="text-xs font-semibold">Effective</p>
        <p className="text-lg font-bold leading-tight">{EFFECTIVE_DATE}</p>
      </div>
    </div>
  );
}

export default function LegalCentrePage() {
  const docs = CARDS.map((card) => ({ ...card, doc: LEGAL_DOCUMENTS.find((d) => d.href === card.href)! }));

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <header className="relative overflow-hidden border-b border-border bg-gradient-to-b from-muted/60 to-background pt-16">
        <div
          className="pointer-events-none absolute inset-0 opacity-60 [background-image:radial-gradient(circle_at_1px_1px,rgb(56_182_255_/_0.18)_1px,transparent_0)] [background-size:22px_22px] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]"
          aria-hidden
        />
        <div className="pointer-events-none absolute -right-24 -top-24 size-[420px] rounded-full bg-[#38b6ff]/15 blur-3xl" aria-hidden />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-14 md:px-8 md:py-20 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
          <div>
            <p className="type-label text-primary">Legal centre</p>
            <h1 className="type-h1 mt-3 max-w-3xl text-balance">The agreements behind every Nisc Cloud service</h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
              Our terms, service levels and privacy commitments in one place, written as the agreement
              that applies when you order a service.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/terms"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#38b6ff] px-6 text-base font-bold text-[#02070A] shadow-lg transition-colors hover:bg-[#1aa3e6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38b6ff] focus-visible:ring-offset-2"
              >
                Read the Terms of Service
              </Link>
              <a
                href="#contacts"
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-border px-6 text-base font-semibold transition-colors hover:bg-muted"
              >
                Who to contact
              </a>
            </div>
          </div>
          <DocumentStack />
        </div>
      </header>

      <main id="main-content">
        <section aria-labelledby="documents-title" className="mx-auto max-w-7xl px-4 py-14 md:px-8 md:py-20">
          <p className="type-label text-primary">Documents</p>
          <h2 id="documents-title" className="type-h2 mt-3 max-w-2xl text-balance">Six documents, one agreement</h2>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
            The Terms of Service bring these together. When you order a service, all of them apply.
          </p>

          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
            {docs.map(({ doc, icon: Icon, highlight, highlightLabel, span, tone, href }, i) => {
              const style = toneStyles[tone];
              const featured = i === 0;
              return (
                <li key={href} className={cn(span, featured && "sm:col-span-2")}>
                  <Link
                    to={href}
                    className={cn(
                      "group relative flex h-full min-h-[240px] flex-col overflow-hidden rounded-[24px] border p-6 transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-[0_30px_60px_-40px_rgb(2_7_10_/_0.55)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38b6ff] focus-visible:ring-offset-2 motion-reduce:transition-none motion-reduce:hover:translate-y-0 md:p-7",
                      style.card,
                    )}
                  >
                    {tone !== "card" ? (
                      <span
                        className={cn(
                          "pointer-events-none absolute bottom-0 right-0 h-0 w-0 border-l-transparent",
                          featured ? "border-b-[200px] border-l-[200px]" : "border-b-[140px] border-l-[140px]",
                          tone === "blue" ? "border-b-[#1aa3e6]" : "border-b-[#38b6ff]/15",
                        )}
                        aria-hidden
                      />
                    ) : null}
                    <div className="relative flex items-start justify-between gap-4">
                      <span className={cn("flex size-11 items-center justify-center rounded-xl", style.icon)}>
                        <Icon size={20} aria-hidden />
                      </span>
                      <ArrowUpRight
                        size={20}
                        className={cn("transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transition-none", style.muted)}
                        aria-hidden
                      />
                    </div>
                    <h3 className={cn("relative mt-6 font-bold tracking-tight", featured ? "text-2xl md:text-3xl" : "text-xl")}>
                      {doc.label}
                    </h3>
                    <p className={cn("relative mt-2 max-w-xl text-sm leading-relaxed md:text-base", style.muted)}>{doc.description}</p>
                    <div className="relative mt-auto flex items-end gap-3 pt-6">
                      <span className={cn("font-bold leading-none tracking-tight", featured ? "text-5xl md:text-6xl" : "text-4xl", style.accent)}>
                        {highlight}
                      </span>
                      <span className={cn("max-w-[22ch] pb-1 text-xs font-medium leading-snug", style.muted)}>{highlightLabel}</span>
                    </div>
                  </Link>
                </li>
              );
            })}
            <li className="sm:col-span-2 lg:col-span-4">
              <div className="flex h-full flex-col justify-center rounded-[24px] border border-dashed border-[#38b6ff]/40 bg-[#38b6ff]/[0.05] p-6 md:p-8">
              <p className="type-label text-primary">Your privacy controls</p>
              <h2 id="controls-title" className="type-h3 mt-3">Change your choices at any time</h2>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
                Turn analytics and marketing cookies on or off, or ask to see, correct or delete the personal
                data we hold about you.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                <CookieSettingsButton />
                <a
                  href="mailto:privacy@nisccloud.com?subject=Data%20protection%20request"
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-border px-5 text-sm font-semibold transition-colors hover:bg-muted"
                >
                  Make a data request
                </a>
              </div>
            </div>
              </li>
          </ul>
        </section>

        <section aria-label="Company details" className="mx-auto max-w-7xl px-4 pb-14 md:px-8 md:pb-20">
          <div className="flex flex-col gap-6 rounded-[24px] border border-border bg-muted/40 p-6 md:p-8 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="type-label text-primary">Company details</p>
              <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-3 sm:gap-8">
                <div>
                  <dt className="text-muted-foreground">Legal name</dt>
                  <dd className="mt-0.5 font-semibold">NISC CLOUD LIMITED</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Company registration</dt>
                  <dd className="mt-0.5 font-semibold">{COMPANY_REGISTRATION}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">ODPC registration</dt>
                  <dd className="mt-0.5 font-semibold">{ODPC_REGISTRATION} · Serial 14768</dd>
                </div>
              </dl>
            </div>
            <AccreditationBadges className="shrink-0" />
          </div>
        </section>

        <LegalGlance title="The basics" facts={FACTS} />

        <div id="contacts" className="scroll-mt-24 pt-14 md:pt-20">
          <LegalContactPanel title="Who to contact" />
        </div>
      </main>

      <Footer />
    </div>
  );
}
