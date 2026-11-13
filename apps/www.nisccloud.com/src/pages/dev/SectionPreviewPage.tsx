import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Building2, CalendarCheck, Cloud, Code2, LayoutDashboard, Lightbulb, Megaphone, Server, ShoppingCart, Sprout, Unlock, Users } from "lucide-react";
import { BrandWebFlagshipArt, HostingFlagshipArt, SeoFlagshipArt } from "@/components/artwork/flagship-art.tsx";
import { NpanelAgencyArt, NpanelBusinessArt, NpanelDeveloperArt } from "@/components/artwork/npanel-art.tsx";
import ProposalEnquiry from "@/components/ProposalEnquiry.tsx";
import { BentoSection, BentoTile, GlassCta, Highlight, TileText } from "@/components/signature/index.ts";
import BuildRunGrow from "@/pages/_components/BuildRunGrow.tsx";
import HomeClosing from "@/pages/_components/HomeClosing.tsx";
import WhyNisc from "@/pages/_components/WhyNisc.tsx";
import AutomateDetail from "@/pages/services/_components/AutomateDetail.tsx";
import CreateDetail from "@/pages/services/_components/CreateDetail.tsx";
import LaunchDetail from "@/pages/services/_components/LaunchDetail.tsx";
import MarketDetail from "@/pages/services/_components/MarketDetail.tsx";
import ServicesCTA from "@/pages/services/_components/ServicesCTA.tsx";

const JUMP = [
  ["home-why", "Home · reasons"],
  ["home-pillars", "Home · pillars"],
  ["home-close", "Home · closing"],
  ["services-groups", "Services · groups"],
  ["services-close", "Services · closing"],
  ["platform-people", "Platform · paths"],
  ["platform-services", "Platform · services"],
  ["platform-close", "Platform · closing"],
] as const;

function Band({ tone, children }: { tone: "current" | "proposed"; children: ReactNode }) {
  return (
    <p className={`px-4 py-3 text-sm font-semibold md:px-8 ${tone === "current" ? "bg-[#02070A] text-white" : "bg-[#38b6ff] text-[#02070A]"}`}>
      {children}
    </p>
  );
}

function Compare({ id, title, live, current, proposed }: { id: string; title: string; live: string; current: ReactNode; proposed: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-16 border-t border-border">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-muted px-4 py-4 md:px-8">
        <h2 className="text-lg font-semibold">{title}</h2>
        <a href={live} className="text-sm font-semibold text-[#38b6ff] underline-offset-4 hover:underline">
          Open the live page
        </a>
      </div>
      <Band tone="current">Current, live on the site</Band>
      {current}
      <Band tone="proposed">Proposed. Not on the live page until you approve it.</Band>
      {proposed}
    </section>
  );
}

const REASONS = [
  { icon: Server, title: "Infrastructure you can depend on", body: "Domains, hosting, business email, servers and SSL from one provider, with plans and renewal terms shown before you buy." },
  { icon: LayoutDashboard, title: "Control through nPanel", body: "Manage your services, users, billing and support requests from one connected workspace." },
  { icon: Lightbulb, title: "Expertise beyond infrastructure", body: "Brand, web, software and marketing specialists who can build on the services you already run." },
  { icon: Sprout, title: "A partner that grows with you", body: "Start with one product today and add services as your business and your customers' needs change." },
];

function ProposedWhy() {
  return (
    <section className="bg-background px-4 py-20 md:px-8 md:py-28">
      <div className="mx-auto max-w-7xl">
        <div className="text-center">
          <p className="type-label text-[#38b6ff]">Why Nisc Cloud</p>
          <h3 className="type-h2 mx-auto mt-3 max-w-3xl text-balance">
            Built for more than <Highlight>getting online</Highlight>
          </h3>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
            Technology, expertise and accountability as your business evolves.
          </p>
        </div>
        <ul className="mt-12 grid gap-px overflow-hidden rounded-[28px] border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
          {REASONS.map((item) => (
            <li key={item.title} className="flex flex-col bg-card px-6 py-8">
              <span className="grid size-11 place-items-center rounded-2xl bg-[#38b6ff]/10 text-[#38b6ff]">
                <item.icon className="size-5" aria-hidden />
              </span>
              <h4 className="mt-5 text-xl font-semibold">{item.title}</h4>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
            </li>
          ))}
        </ul>
        <div className="mt-4 grid overflow-hidden rounded-[28px] border border-border md:grid-cols-[1fr_1fr_auto]">
          <p className="flex gap-3 border-b border-border p-5 text-sm leading-relaxed md:border-b-0 md:border-r">
            <Unlock className="mt-0.5 size-5 shrink-0 text-[#38b6ff]" aria-hidden />
            <span>
              <span className="font-semibold">Your domain, code and data remain yours.</span>{" "}
              <span className="text-muted-foreground">Subject to paid invoices and agreed third-party licence terms, you can move without losing the assets you own.</span>
            </span>
          </p>
          <p className="flex gap-3 border-b border-border p-5 text-sm leading-relaxed md:border-b-0 md:border-r">
            <CalendarCheck className="mt-0.5 size-5 shrink-0 text-[#38b6ff]" aria-hidden />
            <span>
              <span className="font-semibold">Milestones agreed up front.</span>{" "}
              <span className="text-muted-foreground">For defined managed services, we agree first-month milestones during onboarding and review progress within 30 days.</span>
            </span>
          </p>
          <Link to="/work" className="inline-flex items-center gap-2 p-5 text-sm font-semibold text-[#38b6ff] hover:underline">
            See work we have delivered <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}

const PILLARS = [
  { tag: "Build", title: "Make your ideas real.", items: "Brand identity, websites, ecommerce and custom applications.", href: "/services", cta: "Explore Build solutions", Art: BrandWebFlagshipArt, span: "md:col-span-3 md:row-span-2" },
  { tag: "Run", title: "Keep your digital business running.", items: "Domains, hosting, email, VPS and servers.", href: "/hosting", cta: "Explore cloud products", tone: "brand" as const, span: "md:col-span-3" },
  { tag: "Grow", title: "Turn digital activity into measurable growth.", items: "SEO, paid media, social, content and marketing automation.", href: "/services", cta: "Explore growth services", span: "md:col-span-3" },
  { tag: "Zepo AI", title: "Smarter tools, built into the way you work.", items: "Customer conversations, follow-ups and repetitive workflows, where available.", href: "/services/zepo-ai", cta: "Explore Zepo AI", tone: "dark" as const, span: "md:col-span-3" },
];

function ProposedPillars() {
  return (
    <BentoSection
      eyebrow="Build. Run. Grow."
      title={<>One partner for <Highlight>every stage</Highlight> of your digital business.</>}
      intro="Start with the stage you need now. The same team can add the rest as the business changes."
    >
      {PILLARS.map((item, index) => (
        <BentoTile key={item.tag} index={index} tone={item.tone ?? "card"} className={`flex flex-col p-6 md:p-8 ${item.span}`}>
          <p className="text-sm font-semibold text-[#38b6ff]">{item.tag}</p>
          <div className="mt-3">
            <TileText title={item.title} text={item.items} tone={item.tone ?? "card"} />
          </div>
          {"Art" in item && item.Art ? (
            <div className="mt-6">
              <item.Art />
            </div>
          ) : null}
          <Link to={item.href} className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold underline-offset-4 hover:underline">
            {item.cta} <ArrowRight className="size-4" aria-hidden />
          </Link>
        </BentoTile>
      ))}
    </BentoSection>
  );
}

const BUY = [
  ["Domains", "/hosting/domains"],
  ["Website hosting", "/hosting/web-hosting"],
  ["Business email", "/hosting/email"],
  ["VPS & servers", "/hosting/vps"],
  ["SSL certificates", "/security/ssl"],
  ["Microsoft 365", "/hosting/microsoft-365"],
] as const;

function ProposedHomeClose() {
  return (
    <section className="relative overflow-hidden bg-[#38b6ff] px-4 py-20 text-[#02070A] md:px-8 md:py-28">
      <div className="pointer-events-none absolute bottom-0 right-0 h-0 w-0 border-b-[420px] border-l-[420px] border-b-[#1aa3e6] border-l-transparent" aria-hidden />
      <div className="relative mx-auto max-w-7xl">
        <h3 className="max-w-3xl text-5xl font-semibold leading-[1.02] tracking-tight md:text-6xl">Two ways to get started.</h3>
        <p className="mt-5 max-w-xl text-lg leading-relaxed text-[#02070A]/80">
          Buy cloud products online in minutes, or tell us what your business needs and we will prepare a proposal.
        </p>
        <div className="mt-10 grid items-start gap-5 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-[28px] bg-[#02070A] p-7 text-white md:p-8">
            <ShoppingCart className="size-7 text-[#38b6ff]" aria-hidden />
            <p className="mt-5 text-sm font-semibold text-[#38b6ff]">Self-service</p>
            <h4 className="mt-1 text-2xl font-semibold">Ready to buy? Start online.</h4>
            <p className="mt-3 text-sm leading-relaxed text-white/75">Prices are shown before checkout. Manage everything afterwards in nPanel.</p>
            <ul className="mt-6 grid gap-2 sm:grid-cols-2">
              {BUY.map(([label, href]) => (
                <li key={label}>
                  <Link to={href} className="flex items-center justify-between rounded-xl bg-white/10 px-3.5 py-2.5 text-sm font-semibold hover:bg-white/20">
                    {label} <ArrowRight className="size-3.5" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
            <Link to="/hosting" className="mt-6 inline-flex min-h-12 items-center rounded-[12px] bg-[#38b6ff] px-5 text-sm font-semibold text-[#02070A]">
              Explore cloud products
            </Link>
          </div>
          <div className="rounded-[28px] bg-white/30 p-5 shadow-2xl ring-1 ring-white/50 backdrop-blur md:p-7">
            <div className="mb-4 flex items-start gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-white text-[#38b6ff]">
                <Building2 className="size-5" aria-hidden />
              </span>
              <div>
                <h4 className="text-xl font-semibold">Discuss your project</h4>
                <p className="mt-1 text-sm text-[#02070A]/75">Tell us what you need in three short steps. We will reply with the next step and, where it fits, a scoped proposal.</p>
              </div>
            </div>
            <ProposalEnquiry source="homepage" />
          </div>
        </div>
      </div>
    </section>
  );
}

function ProposedServices() {
  return (
    <BentoSection
      eyebrow="Services"
      title={<>Build, run and grow <Highlight>from one brief</Highlight></>}
      intro="Need every service or just one. The same account holds the work."
    >
      <BentoTile index={0} className="flex flex-col p-6 md:col-span-3 md:row-span-2 md:p-8">
        <TileText title="We build your brand from the ground up." text="Turn strategy into a brand, website or software experience people can understand and use. Scope, ownership and approval stages are agreed before delivery begins." />
        <div className="mt-6"><BrandWebFlagshipArt /></div>
        <Link to="/services#build" className="mt-6 text-sm font-semibold text-[#38b6ff]">See Build</Link>
      </BentoTile>
      <BentoTile index={1} tone="brand" className="p-6 md:col-span-3 md:p-8">
        <TileText tone="brand" title="Run your services with clear control." text="Keep domains, hosting, email, billing and support connected through nPanel. The selected plan defines what is included." />
        <Link to="/services#run" className="mt-5 inline-flex text-sm font-semibold">See Run</Link>
      </BentoTile>
      <BentoTile index={2} className="p-6 md:col-span-3 md:p-8">
        <TileText title="Grow with connected channels." text="Connect search, paid media, social and email around the same audience and business goals." />
        <div className="mt-4"><SeoFlagshipArt /></div>
      </BentoTile>
      <BentoTile index={3} tone="dark" className="p-6 md:col-span-3 md:p-8">
        <TileText tone="dark" title="Automation across Build, Run and Grow." text="Use automation where it removes repetitive work without hiding responsibility. Approval points and the human handoff are defined before activation." />
      </BentoTile>
    </BentoSection>
  );
}

const PEOPLE = [
  { title: "Businesses", body: "See every service, invoice and renewal for your business without chasing emails.", href: "/hosting", cta: "Hosting for businesses", icon: Building2, Art: () => <NpanelBusinessArt compact /> },
  { title: "Agencies", body: "Keep each client in its own organisation while you manage them from one agency account.", href: "/hosting/agency", cta: "Agency hosting", icon: Users, Art: NpanelAgencyArt },
  { title: "Developers", body: "Servers, domains and DNS alongside the billing and support for each project.", href: "/hosting/vps", cta: "Servers for developers", icon: Code2, Art: () => <NpanelDeveloperArt compact /> },
];

function CurrentPeople() {
  return (
    <section className="bg-muted/25 px-4 py-16 md:px-8">
      <div className="mx-auto max-w-7xl">
        <p className="text-sm font-semibold text-[#38b6ff]">Choose your path</p>
        <h3 className="type-h2 mt-2 max-w-3xl">Built around the way you operate.</h3>
        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {PEOPLE.map((item) => (
            <article key={item.title} className="overflow-hidden rounded-2xl border border-border bg-card">
              <div className="h-72 overflow-hidden border-b border-border" aria-hidden><item.Art /></div>
              <h4 className="px-6 pt-6 text-xl font-semibold">{item.title}</h4>
              <p className="px-6 pt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
              <Link to={item.href} className="inline-flex px-6 py-5 text-sm font-semibold text-[#38b6ff]">{item.cta}</Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProposedPeople() {
  return (
    <section className="bg-background px-4 py-20 md:px-8 md:py-28">
      <div className="mx-auto max-w-6xl">
        <p className="type-label text-[#38b6ff]">Choose your path</p>
        <h3 className="type-h2 mt-3 max-w-2xl">Built around the <Highlight>way you operate</Highlight></h3>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
          Start with the route closest to your work. Each path leads to relevant products while nPanel keeps supported services and account activity together.
        </p>
        <ul className="mt-12 grid gap-5 md:grid-cols-3">
          {PEOPLE.map((item) => (
            <li key={item.title} className="overflow-hidden rounded-[24px] border border-border bg-card">
              <div className="h-52 overflow-hidden border-b border-border bg-[#38b6ff]/5" aria-hidden><item.Art /></div>
              <div className="p-7">
                <h4 className="flex items-center gap-2.5 text-xl font-semibold">
                  <item.icon className="size-5 text-[#38b6ff]" aria-hidden />
                  {item.title}
                </h4>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
                <Link to={item.href} className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[#38b6ff]">
                  {item.cta} <ArrowRight className="size-4" aria-hidden />
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function CurrentServicesRow() {
  return (
    <section className="bg-background px-4 py-16 md:px-8">
      <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-3">
        {[
          [Code2, "Build", "Create the brand, website or commerce experience customers meet."],
          [Cloud, "Run", "Keep the infrastructure behind your digital business connected."],
          [Megaphone, "Grow", "Connect campaigns and customer activity to an agreed growth plan."],
        ].map(([Icon, title, text]) => (
          <article key={String(title)} className="rounded-2xl border border-border p-6">
            <Icon className="size-5 text-[#38b6ff]" aria-hidden />
            <h4 className="mt-4 text-xl font-semibold">{String(title)}</h4>
            <p className="mt-2 text-sm text-muted-foreground">{String(text)}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function ProposedPlatformServices() {
  return (
    <BentoSection
      eyebrow="Connected services"
      title={<>Build, run and grow without <Highlight>stitching it together</Highlight></>}
      intro="Product availability and included tools depend on the service you choose. Confirmed details are shown on each product page before you order."
    >
      <BentoTile index={0} className="p-6 md:col-span-3 md:row-span-2 md:p-8">
        <TileText title="Build" text="Create the brand, website or commerce experience customers meet." />
        <div className="mt-5 flex flex-wrap gap-2">
          {[["Website design", "/services/website-design"], ["Ecommerce", "/services/ecommerce"], ["Brand identity", "/services/brand-identity"]].map(([label, href]) => (
            <Link key={label} to={href} className="rounded-full border border-border px-3 py-1.5 text-sm font-semibold">{label}</Link>
          ))}
        </div>
        <div className="mt-6"><BrandWebFlagshipArt /></div>
      </BentoTile>
      <BentoTile index={1} tone="brand" className="p-6 md:col-span-3 md:p-8">
        <TileText tone="brand" title="Run" text="Keep the infrastructure behind your digital business connected." />
        <div className="mt-5 flex flex-wrap gap-2">
          {[["Domains", "/hosting/domains"], ["Hosting", "/hosting"], ["Business email", "/hosting/email"], ["Cloud servers", "/hosting/vps"]].map(([label, href]) => (
            <Link key={label} to={href} className="rounded-full bg-white/70 px-3 py-1.5 text-sm font-semibold">{label}</Link>
          ))}
        </div>
      </BentoTile>
      <BentoTile index={2} tone="dark" className="p-6 md:col-span-6 md:p-8">
        <TileText tone="dark" title="Grow" text="Connect campaigns and customer activity to an agreed growth plan." />
        <div className="mt-5 flex flex-wrap gap-2">
          {[["SEO", "/services/seo"], ["Paid advertising", "/services/paid-ads"], ["Social media", "/services/social-media"], ["Email marketing", "/services/email-marketing"]].map(([label, href]) => (
            <Link key={label} to={href} className="rounded-full bg-white/10 px-3 py-1.5 text-sm font-semibold">{label}</Link>
          ))}
        </div>
        <div className="mt-6 max-w-xl"><HostingFlagshipArt /></div>
      </BentoTile>
    </BentoSection>
  );
}

export default function SectionPreviewPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 md:px-8">
          <p className="shrink-0 text-sm font-semibold">Section preview</p>
          <nav aria-label="Preview sections" className="flex min-w-0 gap-2 overflow-x-auto [scrollbar-width:none]">
            {JUMP.map(([id, label]) => (
              <a key={id} href={`#${id}`} className="shrink-0 rounded-full border border-border px-3 py-1.5 text-xs font-semibold hover:border-[#38b6ff]">
                {label}
              </a>
            ))}
          </nav>
        </div>
      </header>
      <p className="mx-auto max-w-3xl px-4 py-8 text-base leading-relaxed text-muted-foreground md:px-8">
        Each block shows the current section, then the proposed one underneath. Nothing here is on the live Home, Services or Platform pages yet.
      </p>

      <Compare id="home-why" title="Home · Built for more than getting online" live="/" current={<WhyNisc />} proposed={<ProposedWhy />} />
      <Compare id="home-pillars" title="Home · One partner for every stage" live="/" current={<BuildRunGrow />} proposed={<ProposedPillars />} />
      <Compare id="home-close" title="Home · Two ways to get started" live="/" current={<HomeClosing />} proposed={<ProposedHomeClose />} />

      <Compare
        id="services-groups"
        title="Services · the four groups"
        live="/services"
        current={<><CreateDetail /><LaunchDetail /><MarketDetail /><AutomateDetail /></>}
        proposed={<ProposedServices />}
      />
      <Compare
        id="services-close"
        title="Services · closing"
        live="/services"
        current={<ServicesCTA />}
        proposed={
          <GlassCta
            title="Tell us what you need"
            body={<p>Need every service or just one? We will build a package around your goals. Book a free strategy call and we will map a clear next step together.</p>}
            action={{ label: "Book a free strategy call", to: "/contact" }}
            art={<BrandWebFlagshipArt />}
            artLabel="Illustration of a brand and website being built"
          />
        }
      />

      <Compare id="platform-people" title="Platform · Built around the way you operate" live="/platform" current={<CurrentPeople />} proposed={<ProposedPeople />} />
      <Compare id="platform-services" title="Platform · Connected services" live="/platform" current={<CurrentServicesRow />} proposed={<ProposedPlatformServices />} />
      <Compare
        id="platform-close"
        title="Platform · closing"
        live="/platform"
        current={
          <section className="px-4 py-16 text-center md:px-8">
            <h3 className="type-h2">Choose the next part of your digital business to move forward</h3>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">The live page uses the standard closing banner with View pricing and Log in to nPanel.</p>
          </section>
        }
        proposed={
          <GlassCta
            title="Choose the next part to move forward"
            body={<p>Compare available products and pricing, or sign in to nPanel to manage the eligible services already connected to your account.</p>}
            action={{ label: "View pricing", to: "/pricing" }}
            art={<NpanelBusinessArt compact />}
            artLabel="Illustration of a business account in nPanel"
          />
        }
      />
    </div>
  );
}
