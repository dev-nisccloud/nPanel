import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight, Check, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { NpanelAgencyArt, NpanelBusinessArt, NpanelDeveloperArt } from "@/components/artwork/npanel-art.tsx";
import { ZeepoArt } from "@/components/artwork/growth-art.tsx";
import { ClosingCta } from "@/components/closing-cta.tsx";
import Navbar from "@/pages/_components/Navbar.tsx";
import Footer from "@/pages/_components/Footer.tsx";

const NPANEL_URL = import.meta.env.VITE_NPANEL_APP_URL ?? "https://npanel.nisccloud.com";
const ZEPO_PATH = "/services/zepo-ai";

const NPANEL_POINTS = [
  "Domains, hosting, email and servers in one account",
  "Invoices, renewals and payment history in one place",
  "Support tickets linked to the service they are about",
  "The hosting tools included with your plan, one click away",
];

const ZEPO_POINTS = [
  "Support for customer conversations",
  "Help with follow-ups and repetitive workflows",
  "Available in selected services, confirmed for yours before you start",
];

const PERSONAS = [
  {
    title: "Businesses",
    body: "See every service, invoice and renewal for your business without chasing emails.",
    href: "/hosting",
    cta: "Hosting for businesses",
    Art: NpanelBusinessArt,
  },
  {
    title: "Agencies",
    body: "Keep each client in its own organisation while you manage them from one agency account.",
    href: "/hosting/agency",
    cta: "Agency hosting",
    Art: NpanelAgencyArt,
  },
  {
    title: "Developers",
    body: "Servers, domains and DNS alongside the billing and support for each project.",
    href: "/hosting/vps",
    cta: "Servers for developers",
    Art: NpanelDeveloperArt,
  },
];

function Points({ items }: { items: string[] }) {
  return (
    <ul className="mt-6 space-y-3">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-3 text-[15px] leading-snug text-foreground/85">
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/12 text-primary">
            <Check className="h-3 w-3" strokeWidth={3} />
          </span>
          {item}
        </li>
      ))}
    </ul>
  );
}

export default function PlatformPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <Navbar />
      <main id="main-content">
      <section className="relative overflow-hidden border-b border-border/60">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_80%_at_50%_0%,rgba(56,182,255,0.14),transparent_70%)]"
        />
        <div className="relative mx-auto max-w-5xl px-4 pb-20 pt-32 text-center sm:px-6 lg:pt-40">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Platform</p>
          <h1 className="mt-4 text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
            One account for every Nisc Cloud service
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            nPanel is where you manage domains, hosting, email, billing and support. Zepo AI helps with
            customer conversations and follow-ups where it is available.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="gap-2">
              <a href="#npanel">
                Explore nPanel <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
            <Button asChild size="lg" variant="outline" className="gap-2">
              <Link to={ZEPO_PATH}>
                Explore Zepo AI <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="ghost" className="gap-2">
              <a href={NPANEL_URL} rel="noopener">
                <LogIn className="h-4 w-4" /> Log in to nPanel
              </a>
            </Button>
          </div>
        </div>
      </section>

      <section id="npanel" className="scroll-mt-24 py-20 lg:py-28">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
          <div>
            <p className="text-sm font-semibold text-primary">nPanel</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Your services, bills and support, connected
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              Every order you place with Nisc Cloud appears in nPanel, so you always know what you have, what
              renews next and where to get help.
            </p>
            <Points items={NPANEL_POINTS} />
            <Button asChild size="lg" className="mt-8 gap-2">
              <a href={NPANEL_URL} rel="noopener">
                Open nPanel <ArrowUpRight className="h-4 w-4" />
              </a>
            </Button>
          </div>
          <div className="min-w-0">
            <NpanelBusinessArt />
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Illustrative nPanel view · sample business and data
            </p>
          </div>
        </div>
      </section>

      <section id="zepo-ai" className="scroll-mt-24 border-y border-border/60 bg-muted/20 py-20 lg:py-28">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
          <div className="min-w-0 lg:order-1">
            <ZeepoArt variant={1} />
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Illustrative Zepo view · sample conversation and data
            </p>
          </div>
          <div className="lg:order-2">
            <p className="text-sm font-semibold text-brand-orange">Zepo AI</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">AI help built into the way you work</h2>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              Zepo AI supports customer conversations, follow-ups and repetitive workflows in the services
              where it is available.
            </p>
            <Points items={ZEPO_POINTS} />
            <Button asChild size="lg" variant="outline" className="mt-8 gap-2">
              <Link to={ZEPO_PATH}>
                Explore Zepo AI <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-extrabold tracking-tight sm:text-4xl">Built for how you work</h2>
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {PERSONAS.map(({ title, body, href, cta, Art }) => (
              <article key={title} className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 focus-within:ring-2 focus-within:ring-primary motion-reduce:hover:translate-y-0">
                <div className="pointer-events-none max-h-64 overflow-hidden border-b border-border/60" aria-hidden>
                  <Art />
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <h3 className="text-xl font-bold">{title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{body}</p>
                  <Link to={href} className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary after:absolute after:inset-0 focus-visible:outline-none">
                    {cta} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <ClosingCta
        eyebrow="Get started"
        headline="Everything you buy from us, managed in one place"
        subtext="Choose a service and your nPanel account is created at checkout. Already a customer? Sign in to see your services."
        primary={{ label: "View pricing", href: "/pricing" }}
        secondary={{ label: "Log in to nPanel", href: NPANEL_URL, external: true }}
      />
      </main>
      <Footer />
    </div>
  );
}
