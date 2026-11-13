import {
  ArrowLeftRight,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  Cloud,
  Code2,
  Database,
  FileSearch,
  Globe,
  HardDrive,
  Loader2,
  Lock,
  Mail,
  Palette,
  PenTool,
  Search,
  Server,
  Shapes,
  ShieldCheck,
  ShoppingBag,
  Terminal,
  Type,
  UserPlus,
  Users,
  Wand2,
} from "lucide-react";
import { cn } from "@/lib/utils.ts";
import { ArtCursor, ArtFlash, ArtReveal, ArtSwap, Pill, UiButton } from "./kit.tsx";
import { useArtLive } from "./use-art-live.ts";

const DOMAIN = "savannabakery.co.ke";

function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "flex items-center gap-1.5 rounded-full border border-primary/20 bg-background/90 px-2 py-1",
        className,
      )}
    >
      <img src="/nisciconoriginal.png" alt="" width={20} height={13} className="w-5" />
      <span className="text-[9px] font-bold text-foreground">nPanel</span>
    </span>
  );
}

/**
 * Flagship commerce composition.
 * A website is the focal outcome; its domain, delivery, protection and storage
 * are shown as a physical stack rather than another dashboard window.
 */
export function HostingFlagshipArt() {
  const { ref, live } = useArtLive<HTMLElement>();
  const layers = [
    { icon: Globe, title: "Domain", detail: DOMAIN, className: "translate-x-0" },
    { icon: ShieldCheck, title: "Secure delivery", detail: "SSL enabled", className: "translate-x-3" },
    { icon: Server, title: "Website hosting", detail: "LiteSpeed · PHP", className: "translate-x-6" },
    { icon: HardDrive, title: "NVMe storage", detail: "Files · databases", className: "translate-x-9" },
  ] as const;

  return (
    <figure
      ref={ref}
      role="img"
      aria-label="A live business website supported by its domain, secure delivery, website hosting and NVMe storage, with management in nPanel"
      className={cn("relative mx-auto w-full max-w-[620px] overflow-hidden rounded-[30px] border border-primary/15 bg-[linear-gradient(135deg,color-mix(in_oklab,var(--primary)_14%,var(--background)),var(--background)_58%,color-mix(in_oklab,var(--color-brand-orange)_8%,var(--background)))] p-4 sm:p-7", live && "art-live")}
    >
      <div aria-hidden className="absolute -right-16 -top-20 size-56 rounded-full border-[34px] border-primary/10" />
      <div aria-hidden className="absolute -bottom-20 -left-16 size-48 rounded-full border-[28px] border-brand-orange/10" />

      <div className="relative grid items-center gap-5 sm:grid-cols-[1.08fr_.92fr]">
        <div className="relative z-10">
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_28px_60px_-34px_rgb(2_132_199_/_0.7)]">
            <div className="flex items-center gap-1.5 border-b border-border bg-muted/60 px-3 py-2">
              <span className="size-2 rounded-full bg-rose-400" />
              <span className="size-2 rounded-full bg-amber-400" />
              <span className="size-2 rounded-full bg-emerald-400" />
              <span className="ml-2 flex min-w-0 flex-1 items-center gap-1 rounded-md bg-background px-2 py-1">
                <Lock className="size-2.5 text-emerald-500" />
                <span className="truncate font-mono text-[8px] text-muted-foreground">{DOMAIN}</span>
              </span>
            </div>
            <div className="bg-card p-3">
              <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-amber-100 via-orange-100 to-rose-100 p-4 dark:from-amber-200 dark:via-orange-200 dark:to-rose-200">
                <span className="text-[8px] font-bold tracking-[0.18em] text-orange-950/65">SAVANNA BAKERY</span>
                <p className="mt-3 max-w-[150px] text-[20px] font-black leading-[0.95] text-[#6b2d13]">
                  Freshly baked for your day.
                </p>
                <span data-art-target className="mt-3 inline-flex rounded-full bg-[#6b2d13] px-2.5 py-1 text-[8px] font-bold text-white">
                  View today&apos;s menu
                </span>
                <div className="art-drift absolute -bottom-3 -right-2 flex gap-1.5">
                  <span className="size-14 rounded-full bg-amber-50 shadow-md" />
                  <span className="mt-4 size-10 rounded-full bg-orange-50 shadow-md" />
                </div>
              </div>
              <div className="mt-2.5 flex items-center justify-between">
                <span className="flex items-center gap-1 text-[9px] font-semibold text-foreground">
                  <CheckCircle2 className="art-ping size-3 text-emerald-500" /> Website online
                </span>
                <span className="rounded-full bg-brand-orange/15 px-2 py-0.5 text-[8px] font-bold text-orange-950 dark:text-orange-200">
                  Managed hosting
                </span>
              </div>
            </div>
          </div>

          <div className="relative mx-auto mt-3 h-[68px] w-[76%]">
            <div className="absolute left-1/2 top-0 h-8 w-px -translate-x-1/2 bg-primary/50" />
            <div data-art-target className="absolute inset-x-0 bottom-0 flex items-center justify-between rounded-2xl border border-primary/20 bg-card/95 px-3 py-2">
              <BrandMark className="border-0 bg-transparent p-0" />
              <span className="text-[8px] text-muted-foreground">Manage files, email and backups</span>
            </div>
          </div>
        </div>

        <div className="relative pb-2 pr-7">
          <p className="mb-3 pl-1 text-[9px] font-bold uppercase tracking-[0.18em] text-primary">
            Your hosting stack
          </p>
          <div className="art-seq space-y-2">
            {layers.map(({ icon: Icon, title, detail, className }, index) => (
              <div
                key={title}
                className={cn(
                  "relative flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5 shadow-[0_14px_28px_-22px_rgb(2_132_199_/_0.7)]",
                  className,
                )}
              >
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-lg",
                    index === 2 ? "bg-brand-orange/18 text-orange-900 dark:text-orange-200" : "bg-primary/12 text-primary",
                  )}
                >
                  <Icon className="size-3.5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[10px] font-semibold text-foreground">{title}</span>
                  <span className="block truncate text-[8px] text-muted-foreground">{detail}</span>
                </span>
                {index < layers.length - 1 && (
                  <span className="absolute -bottom-2.5 left-7 z-10 h-3 w-px bg-primary/40" />
                )}
              </div>
            ))}
          </div>
          <span className="art-pop-late absolute -right-1 bottom-2 rounded-full border border-emerald-500/25 bg-card px-2 py-1 text-[8px] font-semibold text-emerald-700 dark:text-emerald-300">
            <Check className="mr-1 inline size-2.5" /> Connected
          </span>
        </div>
      </div>
      {live ? <ArtCursor stageRef={ref} seed="HostingFlagshipArt" /> : null}
    </figure>
  );
}

function ClientMark({ initials, selected = false }: { initials: string; selected?: boolean }) {
  return (
    <span
      className={cn(
        "flex size-7 shrink-0 items-center justify-center rounded-lg text-[9px] font-black",
        selected ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary",
      )}
    >
      {initials}
    </span>
  );
}

/**
 * Flagship authentic SaaS composition.
 * The organization list, switcher and customer-view banner are the three focal
 * layers. It intentionally uses a real-product crop, not a generic art stage.
 */
export function AgencyFlagshipArt() {
  const { ref, live } = useArtLive<HTMLElement>();
  const clients = [
    { initials: "AT", name: "Acacia Traders", services: ["Domain", "Hosting", "Email"] },
    { initials: "JC", name: "Jambo Clinic", services: ["Domain", "Hosting", "Ads"] },
    { initials: "RL", name: "Rift Logistics", services: ["Domain", "Email", "SEO"] },
  ];

  return (
    <figure
      ref={ref}
      role="img"
      aria-label="An authentic nPanel agency workspace with three separate client organizations, an organization switcher, customer-specific services and an invitation action"
      className={cn("relative mx-auto w-full max-w-[650px] overflow-hidden rounded-[28px] border border-border bg-card shadow-[0_32px_70px_-42px_rgb(2_132_199_/_0.75)]", live && "art-live")}
    >
      <div className="flex items-center gap-2 border-b border-border bg-muted/45 px-3 py-2">
        <span className="size-2 rounded-full bg-rose-400" />
        <span className="size-2 rounded-full bg-amber-400" />
        <span className="size-2 rounded-full bg-emerald-400" />
        <span className="ml-2 min-w-0 flex-1 truncate rounded-md bg-background px-2 py-1 font-mono text-[8px] text-muted-foreground">
          npanel.nisccloud.com/manage-organizations
        </span>
        <span className="hidden rounded-md border border-border bg-background px-2 py-1 text-[8px] text-muted-foreground sm:block">
          Search ⌘K
        </span>
      </div>

      <div className="grid min-h-[340px] sm:grid-cols-[50px_1fr]">
        <aside className="hidden border-r border-border bg-muted/25 py-3 sm:flex sm:flex-col sm:items-center sm:gap-2">
          <img src="/nisciconoriginal.png" alt="" width={24} height={15} className="mb-2 w-6" />
          {[Users, Globe, Server, Mail, CreditCardIcon].map((Icon, index) => (
            <span
              key={index}
              className={cn(
                "flex size-7 items-center justify-center rounded-lg text-muted-foreground",
                index === 0 && "bg-primary/15 text-primary",
              )}
            >
              <Icon className="size-3.5" />
            </span>
          ))}
        </aside>

        <div className="relative min-w-0 bg-muted/20 p-3 sm:p-4">
          <div className="mb-3 flex items-start justify-between gap-2 pr-0 sm:pr-44">
            <div>
              <p className="text-[13px] font-bold text-foreground">Manage organizations</p>
              <p className="text-[9px] text-muted-foreground">One agency account · separate client workspaces</p>
            </div>
            <UiButton><UserPlus className="size-3" /> Add client</UiButton>
          </div>

          <div className="space-y-2 sm:pr-36">
            {clients.map((client, index) => (
              <div
                key={client.name}
                className={cn(
                  "rounded-xl border bg-card p-2.5",
                  index === 1 ? "border-primary/60 ring-1 ring-primary/20" : "border-border",
                )}
              >
                <div className="flex items-center gap-2">
                  <ClientMark initials={client.initials} selected={index === 1} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[10px] font-bold text-foreground">{client.name}</span>
                    <span className="block text-[8px] text-muted-foreground">Organization · KES</span>
                  </span>
                  {index === 1 ? <UiButton>Open workspace</UiButton> : <UiButton variant="outline">View</UiButton>}
                </div>
                <div className="mt-2 flex flex-wrap gap-1 pl-9">
                  {client.services.map((service) => (
                    <span key={service} className="rounded-md bg-primary/[0.07] px-1.5 py-0.5 text-[8px] font-medium text-foreground">
                      {service}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-2 flex items-center gap-2 rounded-xl border border-dashed border-primary/35 bg-primary/[0.04] px-3 py-2 sm:mr-36">
            <UserPlus className="size-3.5 text-primary" />
            <span className="min-w-0 flex-1">
              <span className="block text-[9px] font-bold text-foreground">Invite a member</span>
              <ArtSwap
                on="invite"
                delay={300}
                before={<span className="block truncate text-[8px] text-muted-foreground">Email invite for Jambo Clinic</span>}
                after={<span className="block truncate text-[8px] font-semibold text-emerald-600 dark:text-emerald-400">Invite sent to brian@jamboclinic.example</span>}
              />
            </span>
            <UiButton variant="outline" action="invite"><ArtSwap on="invite" before="Invite" after={<><Check className="size-3" /> Sent</>} /></UiButton>
          </div>

          <div className="relative mt-3 flex items-center gap-2 rounded-xl border border-primary/25 bg-primary/10 px-3 py-2 sm:mr-20">
            <ArrowLeftRight className="size-3.5 shrink-0 text-primary" />
            <p className="min-w-0 flex-1 truncate text-[9px] text-foreground">
              Viewing the dashboard as <b>Jambo Clinic</b>
            </p>
            <span className="text-[8px] font-bold text-primary">Return to agency</span>
          </div>

          <div className="mt-3 rounded-2xl border border-border bg-card p-3 sm:absolute sm:right-3 sm:top-3 sm:mt-0 sm:w-40">
            <p className="mb-2 flex items-center gap-1 text-[8px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
              <ChevronDown className="size-3" /> Switch organization
            </p>
            {clients.map((client, index) => (
              <div
                key={client.name}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg p-1.5",
                  index === 1 && "bg-primary/10",
                )}
              >
                <ClientMark initials={client.initials} selected={index === 1} />
                <span className="min-w-0 flex-1 truncate text-[9px] font-semibold text-foreground">{client.name}</span>
                {index === 1 && <Check className="size-3 text-primary" />}
              </div>
            ))}
          </div>
        </div>
      </div>
      {live ? <ArtCursor stageRef={ref} seed="AgencyFlagshipArt" /> : null}
    </figure>
  );
}

function CreditCardIcon({ className }: { className?: string }) {
  return <Database className={className} />;
}

/**
 * Flagship growth composition.
 * A search query and SERP are the focal plane; the audit lens exposes technical
 * issues and the right rail turns them into reviewable work.
 */
export function SeoFlagshipArt() {
  const { ref, live } = useArtLive<HTMLElement>();
  return (
    <figure
      ref={ref}
      role="img"
      aria-label="An SEO workspace showing a customer search, a search result preview, technical audit findings and keyword opportunities"
      className={cn("relative mx-auto w-full max-w-[620px] overflow-hidden rounded-[30px] border border-primary/15 bg-[linear-gradient(145deg,var(--background),color-mix(in_oklab,var(--primary)_10%,var(--background)))] p-4 sm:p-7", live && "art-live")}
    >
      <div className="relative grid gap-4 sm:grid-cols-[1.15fr_.85fr]">
        <div>
          <div className="flex items-center gap-2 rounded-full border border-primary/35 bg-card px-3 py-2 shadow-[0_16px_34px_-28px_rgb(2_132_199_/_0.8)]">
            <Search className="size-3.5 text-primary" />
            <span className="flex-1 text-[10px] font-medium text-foreground">birthday cakes nairobi</span>
            <span className="flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Search className="size-3" />
            </span>
          </div>

          <div className="relative mt-3 rounded-2xl border border-border bg-card p-3">
            <p className="text-[8px] text-emerald-700 dark:text-emerald-300">{DOMAIN} › celebration-cakes</p>
            <p className="mt-1 text-[12px] font-semibold leading-tight text-primary">
              Birthday cakes in Nairobi | Savanna Bakery
            </p>
            <p className="mt-1 text-[9px] leading-relaxed text-muted-foreground">
              Order a custom celebration cake for collection from our Westlands bakery.
            </p>
            <div className="mt-2 flex gap-1.5">
              <span className="rounded-md bg-primary/[0.07] px-2 py-1 text-[8px] text-foreground">Cake sizes</span>
              <span className="rounded-md bg-primary/[0.07] px-2 py-1 text-[8px] text-foreground">Collection times</span>
            </div>

            <div className="absolute -bottom-5 -right-3 flex size-20 items-center justify-center rounded-full border-[7px] border-primary/75 bg-card/95 shadow-[0_18px_38px_-26px_rgb(2_132_199_/_0.85)]">
              <div className="text-center">
                <FileSearch className="mx-auto size-4 text-primary" />
                <span className="mt-1 block text-[7px] font-bold text-foreground">Page audit</span>
              </div>
              <span className="absolute -bottom-4 -right-2 h-8 w-2 rotate-[-40deg] rounded-full bg-primary" />
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-1.5">
            {["Local intent", "Product page", "Search preview"].map((tag) => (
              <span key={tag} className="rounded-full border border-border bg-card px-2 py-1 text-[8px] text-foreground">
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <div className="rounded-2xl bg-slate-950 p-3 text-white dark:bg-slate-900">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-primary">
                <FileSearch className="size-3.5 text-primary-foreground" />
              </span>
              <div>
                <p className="text-[10px] font-bold">Technical audit</p>
                <p className="text-[8px] text-slate-400">Review before publishing</p>
              </div>
            </div>
            <div className="mt-3 space-y-1.5">
              <p className="flex items-center gap-2 rounded-lg bg-white/[0.07] px-2 py-1.5 text-[9px]">
                <CircleAlert className="size-3 shrink-0 text-brand-orange" />
                <span className="flex-1">Meta description needs review</span>
                <span className="text-[8px] text-slate-400">Fix</span>
              </p>
              <p className="flex items-center gap-2 rounded-lg bg-white/[0.07] px-2 py-1.5 text-[9px]">
                <CircleAlert className="size-3 shrink-0 text-brand-orange" />
                <span className="flex-1">Image alt text missing</span>
                <span className="text-[8px] text-slate-400">Fix</span>
              </p>
              <p className="flex items-center gap-2 rounded-lg bg-white/[0.07] px-2 py-1.5 text-[9px]">
                <CheckCircle2 className="size-3 shrink-0 text-emerald-400" />
                <span className="flex-1">Sitemap submitted</span>
                <span className="text-[8px] text-slate-400">Done</span>
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-3">
            <p className="text-[9px] font-bold text-foreground">Keyword opportunities</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {["birthday cakes nairobi", "custom cakes westlands", "cake collection"].map((keyword, index) => (
                <span
                  key={keyword}
                  className={cn(
                    "rounded-full px-2 py-1 text-[8px] font-medium",
                    index === 0
                      ? "bg-primary text-primary-foreground"
                      : "border border-primary/20 bg-primary/[0.06] text-foreground",
                  )}
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
      {live ? <ArtCursor stageRef={ref} seed="SeoFlagshipArt" /> : null}
    </figure>
  );
}

/**
 * Build goal: "from logo to launch". A vector artboard draws the Savanna Bakery mark with
 * construction guides and bezier handles; clicking "Apply brand" turns the grey website and
 * phone wireframes into the finished, branded experience.
 */
export function BrandWebFlagshipArt() {
  const { ref, live } = useArtLive<HTMLElement>();
  const swatches = [
    { hex: "#02070A", name: "Midnight", text: "text-white" },
    { hex: "#38B6FF", name: "Sky", text: "text-slate-950" },
    { hex: "#FC734D", name: "Ember", text: "text-slate-950" },
    { hex: "#F4E3C1", name: "Sand", text: "text-slate-900" },
  ];
  return (
    <figure
      ref={ref}
      role="img"
      aria-label="A logo being designed on a vector artboard with colour swatches and type, then applied to a website and mobile store in one click"
      className={cn(
        "bw relative mx-auto w-full max-w-[640px] overflow-hidden rounded-[30px] border border-primary/15 bg-[linear-gradient(140deg,color-mix(in_oklab,var(--primary)_14%,var(--background)),var(--background)_50%,color-mix(in_oklab,var(--color-brand-orange)_12%,var(--background)))] p-3 sm:p-5",
        live && "art-live",
      )}
    >
      <div aria-hidden className="art-drift pointer-events-none absolute -left-10 -top-14 size-48 rounded-full bg-primary/25 blur-3xl" />
      <div aria-hidden className="art-drift pointer-events-none absolute -bottom-16 right-0 size-48 rounded-full bg-brand-orange/25 blur-3xl [animation-delay:-3s]" />

      <div className="relative grid gap-3 sm:grid-cols-[1.05fr_1fr]">
        {/* Artboard */}
        <div className="relative overflow-hidden rounded-2xl bg-[#02070A] text-white shadow-[0_30px_60px_-30px_rgb(2_7_10/0.8)] ring-1 ring-white/10">
          <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2">
            <span className="size-1.5 rounded-full bg-rose-400" />
            <span className="size-1.5 rounded-full bg-amber-400" />
            <span className="size-1.5 rounded-full bg-emerald-400" />
            <span className="ml-1 truncate text-[8px] font-semibold text-slate-300">Savanna Bakery · logo v3</span>
            <UiButton action="brand" className="ml-auto bg-brand-orange text-[#02070A]">
              <Wand2 className="size-3" /> Apply brand
            </UiButton>
          </div>
          <div className="relative grid grid-cols-[26px_1fr]">
            <div className="flex flex-col items-center gap-1.5 border-r border-white/10 py-2.5">
              {[PenTool, Type, Palette, Shapes].map((Icon, i) => (
                <span key={i} className={cn("flex size-5 items-center justify-center rounded-md", i === 0 ? "bg-primary text-[#02070A]" : "text-slate-400")}>
                  <Icon className="size-3" />
                </span>
              ))}
            </div>
            <div
              className="relative min-h-[210px] sm:min-h-[250px]"
              style={{
                backgroundImage:
                  "linear-gradient(rgb(56 182 255 / 0.08) 1px, transparent 1px), linear-gradient(90deg, rgb(56 182 255 / 0.08) 1px, transparent 1px)",
                backgroundSize: "16px 16px",
              }}
            >
              <svg viewBox="0 0 200 160" className="absolute inset-x-0 top-1 mx-auto h-[78%] w-full" aria-hidden>
                <defs>
                  <linearGradient id="bw-sun" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#FFB86B" />
                    <stop offset="1" stopColor="#FC734D" />
                  </linearGradient>
                </defs>
                {/* construction guides */}
                <g fill="none" stroke="#38B6FF" strokeOpacity=".45" strokeWidth=".6" strokeDasharray="2 3">
                  <circle cx="100" cy="74" r="46" />
                  <circle cx="100" cy="74" r="28" />
                  <line x1="30" y1="96" x2="170" y2="96" />
                  <line x1="100" y1="14" x2="100" y2="140" />
                </g>
                {/* mark */}
                <circle cx="100" cy="74" r="28" fill="url(#bw-sun)" className="bw-fade" />
                <path
                  d="M54 96 C 76 90, 124 90, 146 96"
                  fill="none"
                  stroke="#38B6FF"
                  strokeWidth="5"
                  strokeLinecap="round"
                  pathLength={1}
                  className="bw-draw"
                />
                <path
                  d="M62 64 C 64 57, 72 55, 78 57 C 82 51, 92 50, 98 54 C 104 49, 115 50, 120 55 C 127 53, 136 57, 138 64 C 126 67, 76 67, 62 64 Z"
                  fill="#F4E3C1"
                  className="bw-fade bw-fade-late"
                />
                <path
                  d="M100 95 L100 76 M100 80 C 96 74, 90 70, 84 66 M100 78 C 104 72, 110 69, 117 66 M100 84 C 106 80, 108 75, 108 70"
                  fill="none"
                  stroke="#F4E3C1"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  pathLength={1}
                  className="bw-draw bw-draw-late"
                />
                {/* bezier handles */}
                <g className="bw-handles">
                  <line x1="54" y1="96" x2="76" y2="88" stroke="#38B6FF" strokeWidth=".7" />
                  <line x1="146" y1="96" x2="124" y2="88" stroke="#38B6FF" strokeWidth=".7" />
                  {[
                    [54, 96],
                    [146, 96],
                    [100, 70],
                  ].map(([x, y]) => (
                    <rect key={`${x}-${y}`} x={x - 2.5} y={y - 2.5} width="5" height="5" fill="#02070A" stroke="#38B6FF" strokeWidth="1" />
                  ))}
                  <circle cx="76" cy="88" r="2" fill="#38B6FF" />
                  <circle cx="124" cy="88" r="2" fill="#38B6FF" />
                </g>
                <text x="100" y="122" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="900" letterSpacing="2.5">SAVANNA</text>
                <text x="100" y="134" textAnchor="middle" fill="#94a3b8" fontSize="6" letterSpacing="4">BAKERY</text>
              </svg>

              {/* swatch deck */}
              <div className="absolute bottom-2.5 left-2.5 flex">
                {swatches.map((s, i) => (
                  <span
                    key={s.hex}
                    className={cn("bw-swatch -ml-3 flex h-12 w-9 flex-col justify-end rounded-md p-1 shadow-[0_8px_16px_-8px_rgb(0_0_0/0.6)] ring-1 ring-white/15 first:ml-0", s.text)}
                    style={{ background: s.hex, transform: `rotate(${(i - 1.5) * 7}deg)`, transformOrigin: "bottom center" }}
                  >
                    <span className="text-[5.5px] font-bold leading-none">{s.name}</span>
                    <span className="mt-0.5 font-mono text-[5px] leading-none opacity-75">{s.hex}</span>
                  </span>
                ))}
              </div>
              {/* type specimen */}
              <div className="absolute right-2 top-2 rounded-lg bg-white/[0.06] px-2 py-1.5 ring-1 ring-white/10">
                <p className="text-[18px] font-black leading-none">Aa</p>
                <p className="mt-0.5 text-[6px] text-slate-400">DM Sans · Bold / Regular</p>
              </div>
            </div>
          </div>
        </div>

        {/* Website + phone */}
        <div className="relative min-h-[240px] sm:min-h-0">
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_26px_50px_-30px_rgb(2_60_100/0.7)]">
            <div className="flex items-center gap-1.5 border-b border-border bg-muted/55 px-2.5 py-1.5">
              <Lock className="size-2.5 text-emerald-500" />
              <span className="truncate font-mono text-[7.5px] text-muted-foreground">{DOMAIN}</span>
              <ArtFlash on="brand" duration={800} className="ml-auto flex items-center gap-1 text-[7.5px] font-semibold text-primary">
                <Loader2 className="size-2.5 animate-spin" /> Applying…
              </ArtFlash>
            </div>
            <ArtSwap
              on="brand"
              delay={500}
              block
              before={
                <span className="block p-3">
                  <span className="flex items-center justify-between">
                    <span className="h-2.5 w-14 rounded bg-muted" />
                    <span className="flex gap-1.5">
                      <span className="h-1.5 w-6 rounded bg-muted" />
                      <span className="h-1.5 w-6 rounded bg-muted" />
                    </span>
                  </span>
                  <span className="mt-3 block h-24 rounded-xl border-2 border-dashed border-border" />
                  <span className="mt-2.5 block h-2 w-3/4 rounded bg-muted" />
                  <span className="mt-1.5 block h-2 w-1/2 rounded bg-muted" />
                  <span className="mt-2.5 block h-4 w-16 rounded-md bg-muted" />
                </span>
              }
              after={
                <span className="block">
                  <span className="flex items-center justify-between px-3 py-2">
                    <span className="flex items-center gap-1">
                      <span className="size-3 rounded-full bg-linear-to-b from-[#FFB86B] to-brand-orange" />
                      <span className="text-[8px] font-black tracking-[0.15em] text-foreground">SAVANNA</span>
                    </span>
                    <span className="flex gap-2 text-[6.5px] font-medium text-muted-foreground">
                      <span>Menu</span>
                      <span>Order</span>
                      <span>Visit</span>
                    </span>
                  </span>
                  <span className="relative mx-2 block h-24 overflow-hidden rounded-xl bg-[linear-gradient(180deg,#0b2538_0%,#123b57_55%,#FC734D_140%)]">
                    <span className="absolute left-1/2 top-[38%] size-12 -translate-x-1/2 rounded-full bg-linear-to-b from-[#FFB86B] to-brand-orange opacity-90 blur-[1px]" />
                    <span className="absolute inset-x-0 bottom-0 h-8 bg-[#F4E3C1]/90 [clip-path:ellipse(70%_100%_at_50%_100%)]" />
                    <span className="absolute left-3 top-3 text-[11px] font-black leading-tight text-white">
                      Baked fresh
                      <br />
                      at sunrise.
                    </span>
                  </span>
                  <span className="flex items-center justify-between px-3 py-2.5">
                    <span className="text-[7px] text-muted-foreground">Pre-order for collection</span>
                    <span className="rounded-md bg-brand-orange px-2 py-1 text-[7px] font-bold text-[#02070A]">Order now</span>
                  </span>
                </span>
              }
            />
          </div>

          <div className="absolute -bottom-1 right-1 w-[38%] rounded-[18px] border-[4px] border-slate-950 bg-card p-1.5 shadow-[0_22px_42px_-24px_rgb(2_60_100/0.85)] dark:border-slate-700 sm:-bottom-3 sm:-right-1">
            <span className="mx-auto mb-1 block h-1 w-6 rounded-full bg-slate-300 dark:bg-slate-600" />
            <ArtSwap
              on="brand"
              delay={850}
              block
              before={
                <span className="block space-y-1">
                  <span className="block h-12 rounded-lg bg-muted" />
                  <span className="block h-1.5 w-3/4 rounded bg-muted" />
                  <span className="block h-3 w-1/2 rounded bg-muted" />
                </span>
              }
              after={
                <span className="block space-y-1">
                  <span className="flex h-12 items-center justify-center rounded-lg bg-linear-to-br from-[#F4E3C1] to-[#FFB86B]">
                    <ShoppingBag className="size-4 text-[#7c2d12]" />
                  </span>
                  <span className="block text-[7px] font-bold leading-tight text-foreground">Sunrise sourdough</span>
                  <span className="block rounded bg-brand-orange py-0.5 text-center text-[6px] font-bold text-[#02070A]">Add to basket</span>
                </span>
              }
            />
          </div>

          <ArtReveal on="brand" delay={1200} className="absolute -left-2 bottom-6 sm:-left-4">
            <Pill tone="green" className="shadow-sm">
              <CheckCircle2 className="size-3" /> Brand applied to 4 assets
            </Pill>
          </ArtReveal>
        </div>
      </div>
      {live ? <ArtCursor stageRef={ref} seed="BrandWebFlagshipArt" /> : null}
    </figure>
  );
}

export function CloudInfrastructureStory() {
  const outputs = [
    { icon: Globe, label: "Website" },
    { icon: Mail, label: "Business email" },
    { icon: Terminal, label: "Cloud server" },
  ];
  return (
    <div className="relative h-full min-h-[280px] overflow-hidden rounded-[28px] bg-slate-950 p-5 text-white sm:min-h-[390px] sm:p-7">
      <div aria-hidden className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(56,182,255,.16)_1px,transparent_1px),linear-gradient(90deg,rgba(56,182,255,.16)_1px,transparent_1px)] [background-size:32px_32px]" />
      <p className="relative text-[9px] font-bold uppercase tracking-[0.2em] text-[#38b6ff]">Cloud &amp; infrastructure</p>

      <div className="relative mt-5 flex items-center justify-between gap-3">
        <div className="w-[31%] rounded-2xl border border-white/10 bg-white/[0.06] p-3">
          <Globe className="size-5 text-[#38b6ff]" />
          <p className="mt-3 text-[11px] font-bold">{DOMAIN}</p>
          <p className="mt-1 text-[8px] text-slate-400">One address for your business</p>
        </div>
        <div className="relative flex size-20 shrink-0 items-center justify-center rounded-full border border-[#38b6ff]/35 bg-[#38b6ff]/10 sm:size-28">
          <span className="absolute inset-2 rounded-full border border-dashed border-[#38b6ff]/45" />
          <ShieldCheck className="size-7 text-[#38b6ff]" />
          <span className="absolute -bottom-2 rounded-full bg-brand-orange px-2 py-1 text-[8px] font-black text-orange-950">
            Secure delivery
          </span>
        </div>
        <div className="w-[31%] space-y-2">
          {outputs.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] p-2">
              <Icon className="size-3.5 text-[#38b6ff]" />
              <span className="text-[9px] font-semibold">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="relative mt-6 grid grid-cols-3 gap-2">
        {[
          [Server, "Compute", "VPS · VDS · Dedicated"],
          [HardDrive, "Storage", "NVMe · Backups"],
          [Cloud, "Management", "nPanel"],
        ].map(([Icon, title, detail]) => {
          const I = Icon as typeof Server;
          return (
            <div key={title as string} className="rounded-xl border border-white/10 bg-white/[0.05] p-2.5">
              <I className="size-3.5 text-[#38b6ff]" />
              <p className="mt-2 text-[9px] font-bold">{title as string}</p>
              <p className="mt-0.5 text-[7.5px] text-slate-400">{detail as string}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function AgencyDeveloperStory() {
  return (
    <div className="relative h-full min-h-[280px] overflow-hidden rounded-[28px] border border-border bg-card p-4 sm:min-h-[390px] sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-primary">Agencies &amp; developers</p>
          <p className="mt-1 text-[11px] font-semibold text-foreground">Client context and technical control</p>
        </div>
        <BrandMark />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_.9fr]">
        <div className="rounded-2xl border border-border bg-muted/35 p-3">
          <p className="mb-2 flex items-center gap-1.5 text-[9px] font-bold text-foreground">
            <Users className="size-3.5 text-primary" /> Client organizations
          </p>
          {[
            ["AT", "Acacia Traders"],
            ["JC", "Jambo Clinic"],
            ["RL", "Rift Logistics"],
          ].map(([initials, name], index) => (
            <div
              key={name}
              className={cn(
                "mb-1.5 flex items-center gap-2 rounded-lg border bg-card p-2 last:mb-0",
                index === 1 ? "border-primary/60" : "border-border",
              )}
            >
              <ClientMark initials={initials} selected={index === 1} />
              <span className="flex-1 text-[9px] font-semibold text-foreground">{name}</span>
              {index === 1 && <Check className="size-3 text-primary" />}
            </div>
          ))}
          <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-primary/10 p-2 text-[8px] text-foreground">
            <ArrowLeftRight className="size-3 text-primary" /> Viewing Jambo Clinic
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl bg-slate-950">
          <div className="flex items-center gap-1.5 border-b border-white/10 px-3 py-2">
            <Terminal className="size-3 text-[#38b6ff]" />
            <span className="text-[8px] font-bold text-slate-200">web-01 · terminal</span>
          </div>
          <pre className="whitespace-pre-wrap p-3 font-mono text-[8px] leading-relaxed text-slate-300">
{`deploy@web-01:~$ uptime
load average: 0.08, 0.10

$ systemctl status nginx
`}<span className="text-emerald-400">● active (running)</span>{`

$ df -h /
/dev/vda1  27% used`}
          </pre>
          <div className="mx-3 mb-3 grid grid-cols-2 gap-1.5">
            <span className="rounded-md bg-white/[0.07] px-2 py-1 text-[7.5px] text-slate-300">Firewall</span>
            <span className="rounded-md bg-white/[0.07] px-2 py-1 text-[7.5px] text-slate-300">Backups</span>
          </div>
        </div>
      </div>
    </div>
  );
}
