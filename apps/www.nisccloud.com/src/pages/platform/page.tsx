import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Cloud,
  Code2,
  Globe2,
  LogIn,
  Megaphone,
  PanelsTopLeft,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { NpanelAgencyArt, NpanelBusinessArt, NpanelDeveloperArt } from "@/components/artwork/npanel-art.tsx";
import { ZeepoArt } from "@/components/artwork/growth-art.tsx";
import { PlatformStories } from "@/components/artwork/npanel-stories/platform-stories.tsx";
import { ClosingCta } from "@/components/closing-cta.tsx";
import Navbar from "@/pages/_components/Navbar.tsx";
import Footer from "@/pages/_components/Footer.tsx";

const NPANEL_URL = import.meta.env.VITE_NPANEL_APP_URL ?? "https://npanel.nisccloud.com";
const ZEPO_PATH = "/services/zepo-ai";

const NPANEL_POINTS = [
  "Eligible domains, hosting, email and servers in one account",
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
    Art: () => <NpanelBusinessArt compact />,
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
    Art: () => <NpanelDeveloperArt compact />,
  },
];

const PLATFORM_PATHS = [
  {
    title: "Build",
    description: "Create the brand, website or commerce experience customers meet.",
    icon: Code2,
    accent: "text-brand-orange",
    surface: "bg-brand-orange/[0.07]",
    links: [
      { label: "Website design", href: "/services/website-design" },
      { label: "Ecommerce", href: "/services/ecommerce" },
      { label: "Brand identity", href: "/services/brand-identity" },
    ],
  },
  {
    title: "Run",
    description: "Keep the infrastructure behind your digital business connected.",
    icon: Cloud,
    accent: "text-primary",
    surface: "bg-primary/[0.08]",
    links: [
      { label: "Domains", href: "/hosting/domains" },
      { label: "Hosting", href: "/hosting" },
      { label: "Business email", href: "/hosting/email" },
      { label: "Cloud servers", href: "/hosting/vps" },
      { label: "Security", href: "/security" },
    ],
  },
  {
    title: "Grow",
    description: "Connect campaigns and customer activity to an agreed growth plan.",
    icon: Megaphone,
    accent: "text-foreground",
    surface: "bg-foreground/[0.04]",
    links: [
      { label: "SEO", href: "/services/seo" },
      { label: "Paid advertising", href: "/services/paid-ads" },
      { label: "Social media", href: "/services/social-media" },
      { label: "Email marketing", href: "/services/email-marketing" },
    ],
  },
] as const;

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
        <section className="relative overflow-hidden border-b border-border bg-background">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_78%_20%,rgba(56,182,255,0.12),transparent_34%)]"
          />
          <div className="relative mx-auto grid max-w-7xl gap-12 px-4 pb-20 pt-32 sm:px-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(340px,.65fr)] lg:items-end lg:px-8 lg:pb-28 lg:pt-44">
            <div>
              <p className="text-sm font-semibold text-primary">The Nisc Cloud platform</p>
              <h1 className="type-h1 mt-4 max-w-4xl">
                One account for the digital business you are building.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
                nPanel connects eligible domains, hosting, email, billing and support. From there, Nisc Cloud
                brings together the services you use to build, run and grow online.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Button asChild size="lg" className="gap-2">
                  <a href="#npanel">
                    Explore nPanel <ArrowRight className="h-4 w-4" />
                  </a>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="gap-2"
                >
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

            <aside className="border-l border-border pl-6 sm:pl-8" aria-label="How the platform connects">
              <p className="text-sm font-semibold text-primary">One connected journey</p>
              <ol className="mt-5 space-y-5">
                {[
                  ["Choose", "Find the Nisc Cloud service that fits your next step."],
                  ["Manage", "Use nPanel for supported services, billing and help."],
                  ["Extend", "Add Build, Run and Grow services as your needs change."],
                ].map(([title, body], index) => (
                  <li key={title} className="grid grid-cols-[2rem_1fr] gap-3">
                    <span className="font-mono text-sm text-muted-foreground">0{index + 1}</span>
                    <span>
                      <span className="block font-semibold">{title}</span>
                      <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">{body}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </aside>
          </div>
        </section>

        <section id="npanel" className="scroll-mt-24 bg-white py-20 text-[#02070a] dark:bg-background dark:text-foreground lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-10 lg:grid-cols-[minmax(280px,.68fr)_minmax(0,1.4fr)] lg:items-end">
              <div>
                <p className="text-sm font-semibold text-primary">nPanel</p>
                <h2 className="type-h2 mt-2">
                  The working view of your Nisc Cloud account.
                </h2>
              </div>
              <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground lg:justify-self-end">
                Supported services and orders appear in nPanel after activation, giving you a clear view of
                what you have, available renewal details and where to get help.
              </p>
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {NPANEL_POINTS.map((item) => (
                <div key={item} className="flex gap-3 border-t border-border pt-4 text-sm leading-relaxed">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" strokeWidth={3} />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="mt-12">
              <div className="mb-7 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-5">
                <span className="inline-flex items-center gap-2 text-sm font-semibold">
                  <PanelsTopLeft className="h-4 w-4 text-primary" />
                  nPanel workflow explorer
                </span>
              </div>
              <PlatformStories />
            </div>

            <Button asChild size="lg" className="mt-8 gap-2">
              <a href={NPANEL_URL} rel="noopener">
                Open nPanel <ArrowUpRight className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </section>

        <section className="border-y border-border bg-muted/25 py-20 lg:py-28" aria-labelledby="audiences-heading">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold text-primary">Choose your path</p>
              <h2 id="audiences-heading" className="type-h2 mt-2">
                Built around the way you operate.
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                Start with the route closest to your work. Each path leads to relevant products while nPanel
                keeps supported services and account activity together.
              </p>
            </div>
            <div className="mt-12 grid gap-6 lg:grid-cols-3">
              {PERSONAS.map(({ title, body, href, cta, Art }) => (
                <article key={title} className="relative grid min-w-0 grid-rows-[auto_auto_1fr_auto] overflow-hidden rounded-2xl border border-border bg-card focus-within:ring-2 focus-within:ring-primary lg:row-span-4 lg:grid-rows-subgrid">
                  <div className="pointer-events-none h-[430px] min-w-0 overflow-hidden border-b border-border/60 [&>*]:h-full" aria-hidden>
                    <Art />
                  </div>
                  <h3 className="min-w-0 px-6 pt-6 text-xl font-bold">{title}</h3>
                  <p className="min-w-0 px-6 pt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
                  <Link to={href} className="mx-6 mb-6 mt-5 inline-flex min-w-0 items-center gap-1.5 self-start text-sm font-semibold text-primary after:absolute after:inset-0 focus-visible:outline-none">
                    {cta} <ArrowRight className="h-4 w-4" />
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 lg:py-28" aria-labelledby="products-heading">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-8 border-b border-border pb-10 lg:grid-cols-[1fr_.7fr] lg:items-end">
              <div>
                <p className="text-sm font-semibold text-primary">Connected services</p>
                <h2 id="products-heading" className="type-h2 mt-2 max-w-3xl">
                  Build, run and grow without stitching together the journey yourself.
                </h2>
              </div>
              <p className="max-w-xl text-lg leading-relaxed text-muted-foreground lg:justify-self-end">
                Choose a focused product or combine services around the stage your business is in now.
              </p>
            </div>

            <div className="divide-y divide-border">
              {PLATFORM_PATHS.map(({ title, description, icon: Icon, accent, surface, links }) => (
                <article key={title} className="grid gap-6 py-10 lg:grid-cols-[220px_1fr] lg:items-start">
                  <div className="flex items-center gap-4">
                    <span className={`flex h-12 w-12 items-center justify-center rounded-xl ${surface}`}>
                      <Icon className={`h-5 w-5 ${accent}`} />
                    </span>
                    <h3 className="text-2xl font-extrabold tracking-tight">{title}</h3>
                  </div>
                  <div>
                    <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">{description}</p>
                    <div className="mt-5 flex flex-wrap gap-2">
                      {links.map((link) => (
                        <Button key={link.href} asChild variant="outline" size="sm">
                          <Link to={link.href}>{link.label}</Link>
                        </Button>
                      ))}
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div id="zepo-ai" className="mt-6 grid scroll-mt-24 border-y border-border bg-muted/20 lg:grid-cols-[minmax(0,1fr)_minmax(340px,.85fr)]">
              <div className="p-7 sm:p-10 lg:p-12">
                <p className="text-sm font-semibold text-brand-orange">Zepo AI</p>
                <h2 className="type-h2 mt-2">AI help built into the way you work.</h2>
                <p className="mt-4 max-w-xl text-lg leading-relaxed text-muted-foreground">
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
              <div className="min-w-0 p-4 sm:p-7">
                <ZeepoArt variant={1} />
              </div>
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-between gap-5 rounded-2xl border border-primary/30 bg-primary/[0.07] p-6">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  Product availability and included tools depend on the service you choose. Confirmed details
                  are shown on each product page before you order.
                </p>
              </div>
              <Button asChild variant="ghost" className="gap-2">
                <Link to="/pricing">
                  Compare pricing <Globe2 className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <ClosingCta
          eyebrow="Explore the platform"
          headline="Choose the next part of your digital business to move forward"
          subtext="Compare available products and pricing, or sign in to nPanel to manage the eligible services already connected to your account."
          primary={{ label: "View pricing", href: "/pricing" }}
          secondary={{ label: "Log in to nPanel", href: NPANEL_URL, external: true }}
          details={{ variant: "command" }}
        />
      </main>
      <Footer />
    </div>
  );
}
