import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Workflow,
  Building2,
  Check,
  Cloud,
  Code2,
  Globe2,
  LogIn,
  Megaphone,
  PanelsTopLeft,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { NpanelAgencyArt, NpanelBusinessArt, NpanelDeveloperArt } from "@/components/artwork/npanel-art.tsx";
import { ZeepoArt } from "@/components/artwork/growth-art.tsx";
import { PlatformStories } from "@/components/artwork/npanel-stories/platform-stories.tsx";
import { MailMcpStory } from "@/components/artwork/npanel-stories/ai-stories.tsx";
import { ClosingCta } from "@/components/closing-cta.tsx";
import { Highlight } from "@/components/signature/index.ts";
import Navbar from "@/pages/_components/Navbar.tsx";
import Footer from "@/pages/_components/Footer.tsx";

const NPANEL_URL = import.meta.env.VITE_NPANEL_APP_URL ?? "https://npanel.nisccloud.com";
const ZEPO_PATH = "/services/zepo-ai";

const NPANEL_POINTS = [
  "Domains, hosting, business email and cloud servers in one account",
  "Search results and email campaigns beside the services behind them",
  "Zepo AI working across your account and your inbox",
  "Invoices, renewals and support tickets linked to each service",
];

const REPLACES = [
  ["cPanel for your hosting", "Hosting, files, DNS and backups"],
  ["A separate marketing dashboard", "Search results and email campaigns"],
  ["Another login for email", "Mailboxes and your inbox"],
  ["A different tool for AI", "Zepo and your own AI through MCP"],
] as const;

const MCP_POINTS = [
  "Works with ChatGPT, Claude and other assistants that support MCP",
  "Read, search, draft, reply to and send email",
  "Set up and manage the connection yourself in nPanel",
  "Rotate the access token or remove the connection at any time",
];

const ZEPO_POINTS = [
  "Knows your business from the day you create your account",
  "Reads, summarises and drafts your email inside nPanel",
  "300 free credits when you have an active service",
];

const PERSONAS = [
  {
    title: "Businesses",
    body: "See every service, invoice and renewal for your business without chasing emails.",
    href: "/hosting",
    cta: "Hosting for businesses",
    icon: Building2,
    Art: () => <NpanelBusinessArt compact />,
  },
  {
    title: "Agencies",
    body: "Keep each client in its own organisation while you manage them from one agency account.",
    href: "/hosting/agency",
    cta: "Agency hosting",
    icon: Users,
    Art: NpanelAgencyArt,
  },
  {
    title: "Developers",
    body: "Servers, domains and DNS alongside the billing and support for each project.",
    href: "/hosting/vps",
    cta: "Servers for developers",
    icon: Code2,
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
      { label: "SEO & AI Search", href: "/services/seo-ai-search" },
      { label: "Paid advertising", href: "/services/paid-ads" },
      { label: "Social media", href: "/services/social-media" },
      { label: "Nisc Outreach", href: "/services/email-marketing" },
    ],
  },
  {
    title: "Automate",
    description: "Hand everyday work to AI that already knows your account.",
    icon: Workflow,
    accent: "text-primary",
    surface: "bg-primary/[0.08]",
    links: [
      { label: "Zepo AI", href: "/services/zepo-ai" },
      { label: "Nisc Outreach", href: "/services/email-marketing" },
      { label: "AI website builder (coming soon)", href: "/services/ai-website-builder" },
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
              <p className="text-sm font-semibold text-[#38b6ff] dark:text-[#38b6ff]">nPanel, built in-house by Nisc Cloud</p>
              <h1 className="type-h1 mt-4 max-w-4xl">
                One panel for your business, your cloud and your AI.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
                We built nPanel ourselves so business owners can stop jumping between cPanel, marketing
                dashboards and separate apps. Manage your business, cloud infrastructure, domains, email,
                digital services and AI agents in one place.
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

            <aside className="rounded-[24px] border border-border bg-card p-6 sm:p-7" aria-labelledby="replaces-heading">
              <p id="replaces-heading" className="text-sm font-semibold text-[#38b6ff] dark:text-[#38b6ff]">What nPanel replaces</p>
              <ul className="mt-5 divide-y divide-border">
                {REPLACES.map(([before, now]) => (
                  <li key={before} className="py-3.5 first:pt-0 last:pb-0">
                    <span className="block text-sm text-muted-foreground line-through decoration-muted-foreground/50">{before}</span>
                    <span className="mt-1 flex items-center gap-2 text-[15px] font-semibold">
                      <Check className="size-4 shrink-0 text-primary" strokeWidth={3} aria-hidden />
                      {now}, in nPanel
                    </span>
                  </li>
                ))}
              </ul>
            </aside>
          </div>
        </section>

        <section id="npanel" className="scroll-mt-24 bg-white py-20 text-[#02070a] dark:bg-background dark:text-foreground lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-10 lg:grid-cols-[minmax(280px,.68fr)_minmax(0,1.4fr)] lg:items-end">
              <div>
                <p className="text-sm font-semibold text-[#38b6ff] dark:text-[#38b6ff]">nPanel</p>
                <h2 className="type-h2 mt-2">
                  Built in-house, so everything works together.
                </h2>
              </div>
              <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground lg:justify-self-end">
                nPanel is not a stack of other companies' tools stitched together. Your services, marketing,
                email and AI share one login and one view, and each service appears as soon as it is active.
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

        <section id="email-mcp" className="scroll-mt-24 border-t border-border bg-background py-20 lg:py-28" aria-labelledby="mcp-heading">
          <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[minmax(0,.9fr)_minmax(0,1.1fr)] lg:items-center lg:px-8">
            <div>
              <p className="text-sm font-semibold text-[#38b6ff] dark:text-[#38b6ff]">Email MCP, for businesses and developers</p>
              <h2 id="mcp-heading" className="type-h2 mt-2">Use your own AI with your Nisc Cloud email.</h2>
              <p className="mt-4 max-w-xl text-lg leading-relaxed text-muted-foreground">
                Connect any mailbox hosted by Nisc Cloud to the AI assistant you already use. Create the
                connection in nPanel, add it to ChatGPT or Claude, and ask it to handle your email.
              </p>
              <Points items={MCP_POINTS} />
            </div>
            <div className="min-w-0">
              <MailMcpStory />
            </div>
          </div>
        </section>

        <section className="border-y border-border bg-background px-4 py-20 md:px-8 md:py-28" aria-labelledby="audiences-heading">
          <div className="mx-auto max-w-6xl">
            <p className="type-label text-[#38b6ff]">Choose your path</p>
            <h2 id="audiences-heading" className="type-h2 mt-3 max-w-2xl">
              Built around the <Highlight>way you operate</Highlight>
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
              Start with the route closest to your work. Each path leads to relevant products while nPanel keeps supported services and account activity together.
            </p>
            <ul className="mt-12 grid gap-5 md:grid-cols-3">
              {PERSONAS.map(({ title, body, href, cta, icon: Icon, Art }) => (
                <li key={title} className="relative overflow-hidden rounded-[24px] border border-border bg-card focus-within:ring-2 focus-within:ring-[#38b6ff]">
                  <div className="border-b border-border bg-[#38b6ff]/5 p-3" aria-hidden>
                    <Art />
                  </div>
                  <div className="p-7">
                    <h3 className="flex items-center gap-2.5 text-xl font-semibold">
                      <Icon className="size-5 text-[#38b6ff]" aria-hidden />
                      {title}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{body}</p>
                    <Link
                      to={href}
                      className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[#38b6ff] after:absolute after:inset-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38b6ff] focus-visible:ring-offset-2"
                    >
                      {cta} <ArrowRight className="size-4" aria-hidden />
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="py-20 lg:py-28" aria-labelledby="products-heading">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-8 border-b border-border pb-10 lg:grid-cols-[1fr_.7fr] lg:items-end">
              <div>
                <p className="text-sm font-semibold text-[#38b6ff] dark:text-[#38b6ff]">Connected services</p>
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
                    <h3 className="type-h3">{title}</h3>
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
                <h2 className="type-h2 mt-2">An assistant that already knows your account.</h2>
                <p className="mt-4 max-w-xl text-lg leading-relaxed text-muted-foreground">
                  Zepo lives inside nPanel. It answers questions about your services, helps with your inbox and
                  takes on research and writing. You pay for what it does in credits.
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
