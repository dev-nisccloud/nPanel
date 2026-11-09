import {
  ArrowUp,
  Bot,
  CalendarDays,
  Check,
  CheckCircle2,
  Download,
  FileText,
  Globe,
  ImageIcon,
  Link2,
  Loader2,
  MessageSquare,
  Paperclip,
  Search,
  Send,
  ShoppingBag,
  Sparkles,
  Upload,
  Users,
} from "lucide-react";
import { ArtFlash, ArtReveal, ArtStage, ArtSwap, Float, Meter, NpanelWindow, Panel, Pill, UiButton } from "./kit.tsx";
import { SeoFlagshipArt } from "./flagship-art.tsx";

const BRAND = "Savanna Bakery";
const DOMAIN = "savannabakery.co.ke";

/** Small fictional marketing email used by the email and builder artwork. */
function EmailPreview({ compact = false }: { compact?: boolean }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-white text-slate-900 shadow-sm">
      <div className="flex items-center justify-between bg-[#7c2d12] px-3 py-2">
        <span className="text-[10px] font-bold tracking-wide text-amber-100">SAVANNA BAKERY</span>
        <span className="text-[8px] text-amber-200/80">Weekend menu</span>
      </div>
      <div className="relative h-16 bg-gradient-to-br from-amber-300 via-orange-300 to-rose-300">
        <span className="absolute bottom-2 left-3 size-9 rounded-full bg-amber-100/90 shadow" />
        <span className="absolute bottom-3 left-10 size-7 rounded-full bg-orange-100/90 shadow" />
        <span className="absolute right-3 top-3 rounded-full bg-white/80 px-2 py-0.5 text-[8px] font-semibold text-orange-800">Fresh this Saturday</span>
      </div>
      <div className="space-y-1.5 p-3">
        <p className="text-[11px] font-bold leading-tight">Freshly baked for your weekend</p>
        {!compact && <p className="text-[9px] leading-snug text-slate-600">Pre-order before Friday and collect warm from our Westlands shop.</p>}
        <span className="inline-block rounded-md bg-[#7c2d12] px-2.5 py-1 text-[9px] font-semibold text-white">Pre-order now</span>
      </div>
    </div>
  );
}

/** Email Marketing: the real "Get started" checklist leading to a campaign. */
export function EmailCampaignArt({ variant = 0 }: { variant?: number }) {
  if (variant % 2 === 1) {
    return (
      <ArtStage tone="violet" label="Email campaign report with deliverability and engagement panels">
        <div className="sm:pb-12 sm:pl-12">
          <NpanelWindow
            path="agency/nisc-email-marketing/campaigns"
            active="marketing"
            title="Weekend menu campaign"
            subtitle="Campaign report"
            action={<UiButton variant="outline"><Download className="size-3" /> Export report</UiButton>}
          >
            <div className="grid gap-2.5 sm:grid-cols-3">
              <Panel title="Deliverability">
                <Meter label="Delivered" value={96} tone="green" />
                <div className="mt-2"><Meter label="Bounced" value={4} tone="amber" /></div>
              </Panel>
              <Panel title="Engagement">
                <Meter label="Opened" value={44} />
                <div className="mt-2"><Meter label="Clicked" value={12} tone="violet" /></div>
              </Panel>
              <Panel title="Opt-out">
                <Meter label="Unsubscribed" value={2} tone="amber" />
                <div className="mt-2"><Meter label="Complained" value={1} tone="amber" /></div>
              </Panel>
            </div>
            <Panel title="Top clicked links" className="mt-2.5">
              {["Pre-order now", "View weekend menu"].map((l, i) => (
                <p key={l} className="flex items-center gap-2 border-t border-border/60 py-1.5 text-[10px] first:border-0">
                  <Link2 className="size-3 text-primary" />
                  <span className="flex-1 text-foreground">{l}</span>
                  <span className="h-1.5 rounded-full bg-primary" style={{ width: i === 0 ? 48 : 22 }} />
                </p>
              ))}
            </Panel>
          </NpanelWindow>
        </div>
        <Float className="sm:bottom-0 sm:left-0 sm:w-40">
          <Pill tone="sky">Sent</Pill>
          <p className="mt-1.5 text-[11px] font-semibold text-foreground">Report ready</p>
          <p className="text-[9px] text-muted-foreground">Sample figures for illustration</p>
        </Float>
      </ArtStage>
    );
  }
  const steps = [
    ["Connect your domain", "Send from your own address", true],
    ["Build your audience", "Import or add subscribers", true],
    ["Design your email", "Use the AI email builder or a template", true],
    ["Send your campaign", "Schedule or send now", false],
  ] as const;
  return (
    <ArtStage tone="violet" label="Email marketing setup checklist with a campaign email preview">
      <div className="sm:pb-6 sm:pr-40">
        <NpanelWindow path="agency/nisc-email-marketing/campaigns" active="marketing" title="Get started with email marketing" subtitle="3 / 4 complete">
          <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-muted">
            <ArtSwap
              on="send"
              delay={500}
              block className="h-full [&>*]:h-full"
              before={<span className="block h-full w-3/4 rounded-full bg-primary" />}
              after={<span className="block h-full w-full rounded-full bg-linear-to-r from-primary to-emerald-500" />}
            />
          </div>
          <ol className="space-y-1.5">
            {steps.map(([t, d, done], i) => (
              <li key={t} className={`flex items-center gap-2 rounded-lg border bg-card px-3 py-2 ${done ? "border-border" : "border-primary/60 ring-1 ring-primary/20"}`}>
                {done ? (
                  <CheckCircle2 className="size-3.5 shrink-0 text-emerald-500" />
                ) : (
                  <ArtSwap
                    on="send"
                    delay={500}
                    before={<span className="flex size-3.5 shrink-0 items-center justify-center rounded-full bg-primary text-[8px] font-bold text-white">{i + 1}</span>}
                    after={<CheckCircle2 className="size-3.5 shrink-0 text-emerald-500" />}
                  />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block text-[10px] font-semibold text-foreground">{t}</span>
                  <span className="block truncate text-[9px] text-muted-foreground">{d}</span>
                </span>
                {!done && <UiButton action="send"><ArtSwap on="send" before="Send" after={<><Check className="size-3" /> Sent</>} /></UiButton>}
              </li>
            ))}
          </ol>
        </NpanelWindow>
      </div>
      <Float className="sm:right-0 sm:top-6 sm:w-44 sm:rotate-2 sm:p-2">
        <EmailPreview compact />
      </Float>
      <Float className="sm:bottom-0 sm:right-8 sm:w-40">
        <p className="flex items-center gap-1.5 text-[10px] font-semibold text-foreground"><Users className="size-3.5 text-primary" /> Audience</p>
        <p className="mt-1 text-[9px] text-muted-foreground">Weekend customers</p>
        <ArtReveal on="send" delay={800} className="mt-1.5">
          <Pill tone="green"><Send className="size-2.5" /> Campaign on its way</Pill>
        </ArtReveal>
      </Float>
    </ArtStage>
  );
}

/** AI Email Builder: a brief becomes an editable email preview. */
export function AiEmailBuilderArt() {
  return (
    <ArtStage tone="rose" label="AI email builder turning a short brief into an email preview">
      <div className="grid items-start gap-3 sm:grid-cols-[1fr_1fr]">
        <div className="rounded-2xl border border-border bg-card p-3 shadow-[0_20px_40px_-24px_rgb(14_87_118_/_0.5)]">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold text-foreground"><FileText className="size-3.5 text-primary" /> Start with a brief</p>
          <div className="mt-2.5 space-y-2 text-[9px]">
            {[["Company name", BRAND], ["Goal", "Weekend pre-orders"], ["Audience", "Local customers"], ["Tone", "Warm and friendly"]].map(([k, v]) => (
              <div key={k}>
                <p className="text-muted-foreground">{k}</p>
                <p className="rounded-md border border-border px-2 py-1 font-medium text-foreground">{v}</p>
              </div>
            ))}
            <div>
              <p className="text-muted-foreground">Brand colours</p>
              <div className="mt-1 flex gap-1.5">
                {["#7c2d12", "#fbbf24", "#fb7185"].map((c) => <span key={c} className="size-5 rounded-md ring-1 ring-black/10" style={{ background: c }} />)}
              </div>
            </div>
          </div>
          <UiButton action="generate" className="mt-3 w-full justify-center"><Sparkles className="size-3" /> Generate email</UiButton>
        </div>
        <div className="rounded-2xl border border-border bg-card p-3 shadow-[0_20px_40px_-24px_rgb(14_87_118_/_0.5)] sm:mt-8">
          <div className="mb-2 flex items-center justify-between">
            <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[9px] font-semibold text-primary">Email preview</span>
            <UiButton variant="outline">Export HTML</UiButton>
          </div>
          <div className="mb-2 flex flex-wrap gap-1">
            <ArtSwap
              on="generate"
              before={<Pill tone="sky"><Loader2 className="size-3 animate-spin" /> Designing concept</Pill>}
              after={<Pill tone="green"><CheckCircle2 className="size-3" /> Design concept ready</Pill>}
              delay={700}
            />
            <ArtSwap
              on="generate"
              delay={1400}
              before={<Pill tone="slate">HTML queued</Pill>}
              after={<Pill tone="green"><CheckCircle2 className="size-3" /> HTML ready</Pill>}
            />
          </div>
          <div className="relative">
            <div className="absolute inset-0 grid place-items-center rounded-xl border border-dashed border-primary/30 bg-primary/[0.04]">
              <ArtFlash on="generate" duration={900} className="flex items-center gap-1.5 text-[10px] font-semibold text-primary">
                <Sparkles className="size-3.5 animate-pulse" /> Writing your email…
              </ArtFlash>
            </div>
            <ArtReveal on="generate" delay={700} className="relative">
              <EmailPreview />
            </ArtReveal>
          </div>
          <div className="mt-2 flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1.5">
            <span className="flex-1 truncate text-[9px] text-muted-foreground">Ask for changes to the email…</span>
            <span className="flex size-4 items-center justify-center rounded-full bg-primary"><ArrowUp className="size-2.5 text-white" /></span>
          </div>
        </div>
      </div>
    </ArtStage>
  );
}

/** Creative Assets: versions, comments and approval. */
export function CreativeAssetsArt() {
  return (
    <ArtStage tone="amber" label="Creative asset review with version history, comments and approval">
      <div className="sm:pb-16 sm:pr-10">
        <NpanelWindow path="agency/creative-assets" active="creative" title="Weekend menu poster" subtitle="Creative & design · Poster" action={<UiButton><Upload className="size-3" /> Upload new version</UiButton>}>
          <div className="grid gap-2.5 sm:grid-cols-[1.1fr_1fr]">
            <div className="relative overflow-hidden rounded-xl border border-border bg-gradient-to-br from-amber-100 via-orange-200 to-rose-200 p-3 dark:from-amber-200 dark:via-orange-300 dark:to-rose-300">
              <p className="text-[8px] font-bold tracking-[0.2em] text-orange-900/70">SAVANNA BAKERY</p>
              <p className="mt-1 text-[15px] font-black leading-none text-[#7c2d12]">Weekend<br />bakes</p>
              <div className="mt-3 flex gap-1.5">
                <span className="size-8 rounded-full bg-amber-50 shadow" />
                <span className="size-6 self-end rounded-full bg-orange-50 shadow" />
              </div>
              <span className="mt-2 inline-block rounded bg-[#7c2d12] px-1.5 py-0.5 text-[7px] font-semibold text-white">Pre-order now</span>
              <span className="absolute right-3 top-8 flex size-5 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-white shadow">1</span>
            </div>
            <Panel title="Version history">
              {[["v2", "Latest", "amber", "Pending"], ["v1", "", "slate", "Changes requested"]].map(([v, tag, tone, status]) => (
                <div key={v} className="flex items-center gap-2 border-t border-border/60 py-1.5 first:border-0">
                  <span className="flex size-6 items-center justify-center rounded-md bg-muted text-[9px] font-bold text-foreground">{v}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[9px] font-medium text-foreground">poster-{v}.png {tag && <span className="text-primary">· {tag}</span>}</span>
                    {v === "v2" ? (
                      <ArtSwap on="approve" delay={250} before={<Pill tone="amber">Pending</Pill>} after={<Pill tone="green"><CheckCircle2 className="size-3" /> Approved</Pill>} />
                    ) : (
                      <Pill tone={tone as "amber"}>{status}</Pill>
                    )}
                  </span>
                </div>
              ))}
              <div className="mt-2 flex flex-wrap gap-1.5">
                <UiButton action="approve">Approve</UiButton>
                <UiButton variant="outline">Request changes</UiButton>
              </div>
            </Panel>
          </div>
        </NpanelWindow>
      </div>
      <Float className="sm:bottom-0 sm:left-4 sm:w-52">
        <p className="flex items-center gap-1.5 text-[10px] font-semibold text-foreground"><MessageSquare className="size-3.5 text-primary" /> Comment 1</p>
        <p className="mt-1 text-[9px] leading-snug text-muted-foreground">Make the pre-order date larger on the next version.</p>
        <ArtReveal on="approve" delay={600} className="mt-2 flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-2 py-1 text-[9px] font-semibold text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 className="size-3" /> v2 approved · resolved
        </ArtReveal>
      </Float>
    </ArtStage>
  );
}

function ZeepoAvatar({ className = "size-7" }: { className?: string }) {
  return (
    <span className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-blue-600 text-white shadow ${className}`}>
      <Bot className="size-1/2" />
    </span>
  );
}

/** Zepo AI: a practical question answered with a next step. No internal reasoning is drawn. */
export function ZeepoArt({ variant = 0 }: { variant?: number }) {
  if (variant % 2 === 1) {
    return (
      <ArtStage tone="sky" label="Zepo AI greeting card with suggested questions about domains, hosting and renewals">
        <div className="mx-auto max-w-[460px] rounded-2xl border border-border bg-card p-4 shadow-[0_30px_60px_-30px_rgb(14_87_118_/_0.45)]">
          <div className="flex items-center gap-3">
            <ZeepoAvatar className="size-10" />
            <div>
              <p className="text-[13px] font-semibold text-foreground">Good morning, Amina</p>
              <p className="text-[10px] text-muted-foreground">Ask Zepo about domains, hosting, invoices or your account.</p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-border px-3 py-2">
            <ArtSwap
              on="ask"
              className="flex-1"
              before={<span className="text-[10px] text-muted-foreground">Ask me anything…</span>}
              after={<span className="text-[10px] font-medium text-foreground">What expires in 30 days?</span>}
            />
            <UiButton action="ask"><Search className="size-3" /> Search</UiButton>
          </div>
          <ArtReveal on="ask" delay={700} className="mt-3 flex items-start gap-2 rounded-xl bg-primary/[0.07] p-2.5">
            <ZeepoAvatar className="size-6" />
            <div className="min-w-0 flex-1 text-[10px] leading-snug text-foreground">
              <p><span className="font-semibold">{DOMAIN}</span> renews in 24 days.</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                <Pill tone="green">Auto-renew on</Pill>
                <Pill tone="sky">Invoice ready</Pill>
              </div>
            </div>
          </ArtReveal>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {["What expires in 30 days?", "Set up business email for my team", "Design marketing images for campaigns", "Best hosting for WordPress?"].map((c) => (
              <span key={c} className="rounded-full border border-border bg-muted/50 px-2 py-1 text-[9px] text-foreground">{c}</span>
            ))}
          </div>
        </div>
      </ArtStage>
    );
  }
  return (
    <ArtStage tone="sky" label="Zepo AI chat answering a domain availability question with a register action">
      <div className="sm:pb-10 sm:pr-10">
        <NpanelWindow path="agency/zeepo-ai" active="zeepo" title="Zepo AI" subtitle="New chat" bodyClassName="space-y-2.5">
          <div className="ml-auto w-fit max-w-[80%] rounded-2xl rounded-br-md bg-primary px-3 py-2 text-[10px] text-primary-foreground">
            Is savannacakes.co.ke available?
          </div>
          <div className="flex gap-2">
            <ZeepoAvatar />
            <div className="min-w-0 flex-1 space-y-2">
              <p className="text-[10px] leading-snug text-foreground">Good news. That name looks available. You can register it and connect hosting and email.</p>
              <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2">
                <Globe className="size-3.5 text-primary" />
                <span className="flex-1 truncate text-[10px] font-semibold text-foreground">savannacakes.co.ke</span>
                <Pill>Available</Pill>
                <UiButton action="register"><ArtSwap on="register" before="Register" after={<><Check className="size-3" /> In cart</>} /></UiButton>
              </div>
              <ArtReveal on="register" delay={500} className="flex items-center gap-1.5 text-[9px] font-medium text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="size-3" /> Added to cart. Want hosting and email with it?
              </ArtReveal>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2">
            <span className="flex-1 text-[10px] text-muted-foreground">Message Zepo…</span>
            <span className="text-[9px] text-muted-foreground">Skills</span>
            <Search className="size-3 text-muted-foreground" />
            <Paperclip className="size-3 text-muted-foreground" />
            <span className="flex size-5 items-center justify-center rounded-full bg-primary"><ArrowUp className="size-3 text-white" /></span>
          </div>
        </NpanelWindow>
      </div>
      <Float className="sm:bottom-0 sm:right-0 sm:w-44">
        <p className="text-[10px] font-semibold text-foreground">Suggested next</p>
        <div className="mt-1.5 flex flex-col gap-1">
          {["Set up business email", "Draft a hosting proposal"].map((c) => (
            <span key={c} className="rounded-full border border-border px-2 py-0.5 text-[9px] text-foreground">{c}</span>
          ))}
        </div>
      </Float>
    </ArtStage>
  );
}

/** SEO Suite: an audit of issues and keyword opportunities. Not a ranking promise. */
export function SeoArt() {
  return <SeoFlagshipArt />;
}

const channelDots: Record<string, string> = {
  "Meta Ads": "bg-blue-600",
  "Google Ads": "bg-amber-500",
  "LinkedIn Ads": "bg-sky-700",
};

/** Media buying: campaigns organised by channel. */
export function AdsArt({ social = false }: { social?: boolean }) {
  const campaigns = social
    ? [["Weekend menu reel", "Meta Ads", "Active"], ["Behind the bakery", "Meta Ads", "Scheduled"], ["Catering for offices", "LinkedIn Ads", "Draft"]]
    : [["Birthday cakes search", "Google Ads", "Active"], ["Weekend menu", "Meta Ads", "Active"], ["Office catering", "LinkedIn Ads", "Scheduled"]];
  return (
    <ArtStage tone={social ? "rose" : "amber"} label="Media buying campaigns across Meta, Google and LinkedIn channels with an ad preview">
      <div className="sm:pb-6 sm:pr-40">
        <NpanelWindow path="agency/media-buying" active="marketing" title="Media buying" subtitle="Campaigns by channel">
          <div className="mb-2.5 flex flex-wrap gap-1.5">
            {Object.keys(channelDots).map((c) => (
              <span key={c} className="flex items-center gap-1 rounded-full border border-border bg-card px-2 py-0.5 text-[9px] font-medium text-foreground">
                <span className={`size-1.5 rounded-full ${channelDots[c]}`} />{c}
              </span>
            ))}
          </div>
          <div className="space-y-1.5">
            {campaigns.map(([name, ch, status]) => (
              <div key={name} className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
                <span className={`size-2 shrink-0 rounded-full ${channelDots[ch]}`} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[10px] font-semibold text-foreground">{name}</span>
                  <span className="block text-[8px] text-muted-foreground">{ch}</span>
                </span>
                <Pill tone={status === "Active" ? "green" : status === "Scheduled" ? "sky" : "slate"}>{status}</Pill>
              </div>
            ))}
          </div>
        </NpanelWindow>
      </div>
      <Float className="sm:right-0 sm:top-4 sm:w-40 sm:p-2">
        <div className="flex items-center gap-1.5 px-1 pb-1.5">
          <span className="size-4 rounded-full bg-[#7c2d12]" />
          <span className="text-[9px] font-semibold text-foreground">{BRAND}</span>
          <span className="ml-auto text-[7px] text-muted-foreground">Sponsored</span>
        </div>
        <div className="flex aspect-square items-end rounded-lg bg-gradient-to-br from-amber-300 via-orange-300 to-rose-400 p-2">
          <span className="text-[12px] font-black leading-none text-[#7c2d12]">Fresh this<br />weekend</span>
        </div>
        <span className="mt-1.5 block rounded-md bg-muted py-1 text-center text-[9px] font-semibold text-foreground">Order now</span>
      </Float>
      <Float className="sm:bottom-0 sm:right-6 sm:w-36">
        <p className="flex items-center gap-1.5 text-[10px] font-semibold text-foreground"><CalendarDays className="size-3.5 text-primary" /> Schedule</p>
        <p className="mt-1 text-[9px] text-muted-foreground">Runs Thursday to Sunday</p>
      </Float>
    </ArtStage>
  );
}

/** Online store: product, basket and order confirmation. */
export function CommerceArt() {
  return (
    <ArtStage tone="amber" label="Online store product page with basket and order confirmation">
      <div className="sm:pb-12 sm:pr-24">
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_30px_60px_-30px_rgb(14_87_118_/_0.45)]">
          <div className="flex items-center gap-2 border-b border-border/70 bg-muted/50 px-3 py-2">
            <span className="size-2 rounded-full bg-rose-400" /><span className="size-2 rounded-full bg-amber-400" /><span className="size-2 rounded-full bg-emerald-400" />
            <span className="ml-2 flex-1 truncate rounded-md bg-background/80 px-2 py-0.5 font-mono text-[10px] text-muted-foreground">{DOMAIN}/shop</span>
            <span className="relative">
              <ShoppingBag className="size-3.5 text-primary" />
              <ArtReveal on="basket" delay={200} className="absolute -right-1.5 -top-1.5 flex size-3 items-center justify-center rounded-full bg-brand-orange text-[7px] font-bold text-white">1</ArtReveal>
            </span>
          </div>
          <div className="grid gap-3 p-3 sm:grid-cols-[1fr_1.1fr]">
            <div className="flex aspect-[4/3] items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-orange-200">
              <span className="size-14 rounded-full bg-amber-50 shadow-lg ring-8 ring-orange-100" />
            </div>
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-wide text-primary">Cakes</p>
              <p className="text-[13px] font-semibold text-foreground">Celebration cake</p>
              <p className="mt-1 text-[9px] leading-snug text-muted-foreground">Choose a size, add a message and pick a collection day.</p>
              <div className="mt-2 flex gap-1">
                {["Small", "Medium", "Large"].map((s, i) => (
                  <span key={s} className={`rounded-md border px-1.5 py-0.5 text-[9px] ${i === 1 ? "border-primary bg-primary/10 font-semibold text-primary" : "border-border text-muted-foreground"}`}>{s}</span>
                ))}
              </div>
              <UiButton action="basket" className="mt-2.5"><ArtSwap on="basket" before="Add to basket" after={<><Check className="size-3" /> Added</>} /></UiButton>
            </div>
          </div>
        </div>
      </div>
      <Float className="sm:bottom-0 sm:right-0 sm:w-48">
        <ArtSwap
          on="basket"
          delay={900}
          block
          before={
            <>
              <span className="flex items-center gap-1.5 text-[11px] font-semibold text-foreground"><ShoppingBag className="size-4 text-primary" /> Basket</span>
              <span className="mt-1 block text-[9px] text-muted-foreground">Choose a size and add your cake.</span>
              <span className="mt-2 block h-4 w-2/3 rounded-full bg-muted" />
            </>
          }
          after={
            <>
              <span className="flex items-center gap-1.5 text-[11px] font-semibold text-foreground"><CheckCircle2 className="size-4 text-emerald-500" /> Order received</span>
              <span className="mt-1 block text-[9px] text-muted-foreground">Confirmation email sent to the customer.</span>
              <span className="mt-2 flex gap-1.5"><Pill tone="sky">Paid</Pill><Pill tone="amber">To collect</Pill></span>
            </>
          }
        />
      </Float>
    </ArtStage>
  );
}

/** Brand identity: a brand kit board with approval. */
export function BrandKitArt() {
  return (
    <ArtStage tone="violet" label="Brand identity kit with logo, colour palette, typography and approval status">
      <div className="sm:pb-10 sm:pr-16">
        <div className="grid grid-cols-2 gap-2.5 rounded-2xl border border-border bg-card p-3 shadow-[0_30px_60px_-30px_rgb(14_87_118_/_0.45)]">
          <div className="col-span-2 flex items-center gap-3 rounded-xl bg-[#7c2d12] p-4">
            <span className="flex size-10 items-center justify-center rounded-full bg-amber-200 text-[16px] font-black text-[#7c2d12]">S</span>
            <span>
              <span className="block text-[14px] font-black tracking-wide text-amber-100">SAVANNA</span>
              <span className="block text-[9px] tracking-[0.3em] text-amber-200/80">BAKERY</span>
            </span>
          </div>
          <Panel title="Colour palette">
            <div className="flex gap-1">
              {["#7c2d12", "#f59e0b", "#fde68a", "#fb7185", "#1c1917"].map((c) => (
                <span key={c} className="h-8 flex-1 rounded-md ring-1 ring-black/5" style={{ background: c }} />
              ))}
            </div>
          </Panel>
          <Panel title="Typography">
            <p className="text-[22px] font-black leading-none text-foreground">Aa</p>
            <p className="mt-1 text-[9px] text-muted-foreground">Headings · Body · Captions</p>
          </Panel>
          <div className="col-span-2 flex gap-2">
            {[ImageIcon, FileText, Globe].map((Icon, i) => (
              <span key={i} className="flex flex-1 items-center gap-1.5 rounded-lg bg-muted/60 px-2 py-1.5 text-[9px] text-foreground">
                <Icon className="size-3 text-primary" />{["Social templates", "Letterhead", "Website"][i]}
              </span>
            ))}
          </div>
        </div>
      </div>
      <Float className="sm:bottom-0 sm:right-0 sm:w-44">
        <p className="text-[10px] font-semibold text-foreground">Brand guidelines v2</p>
        <div className="mt-1.5 flex items-center gap-2">
          <ArtSwap on="brand" delay={250} before={<Pill tone="amber">In review</Pill>} after={<Pill>Approved</Pill>} />
          <ArtSwap on="brand" delay={250} before={<span className="text-[9px] text-muted-foreground">Awaiting you</span>} after={<span className="text-[9px] text-muted-foreground">Ready to download</span>} />
        </div>
        <UiButton action="brand" className="mt-2">Approve brand</UiButton>
      </Float>
    </ArtStage>
  );
}

/** Team workspace for Microsoft 365 and Google Workspace style services. */
export function TeamWorkspaceArt() {
  return (
    <ArtStage tone="sky" label="Team workspace with mailboxes, shared files and a calendar invitation">
      <div className="sm:pb-10 sm:pr-16">
        <div className="rounded-2xl border border-border bg-card p-3 shadow-[0_30px_60px_-30px_rgb(14_87_118_/_0.45)]">
          <p className="text-[12px] font-semibold text-foreground">Team workspace</p>
          <p className="text-[9px] text-muted-foreground">{BRAND} · licences requested</p>
          <div className="mt-3 space-y-1.5">
            {[["Amina W.", "Director"], ["Brian O.", "Operations"], ["Faith N.", "Sales"]].map(([n, r]) => (
              <div key={n} className="flex items-center gap-2 rounded-lg border border-border px-2.5 py-1.5">
                <span className="flex size-6 items-center justify-center rounded-full bg-primary/15 text-[9px] font-bold text-primary">{n[0]}</span>
                <span className="flex-1"><span className="block text-[10px] font-semibold text-foreground">{n}</span><span className="block text-[8px] text-muted-foreground">{r}</span></span>
                <Pill tone="sky">Mailbox</Pill>
              </div>
            ))}
          </div>
          <div className="mt-2.5 grid grid-cols-2 gap-1.5">
            <span className="flex items-center gap-1.5 rounded-lg bg-muted/60 px-2 py-1.5 text-[9px] text-foreground"><FileText className="size-3 text-primary" /> Shared files</span>
            <span className="flex items-center gap-1.5 rounded-lg bg-muted/60 px-2 py-1.5 text-[9px] text-foreground"><CalendarDays className="size-3 text-primary" /> Calendars</span>
          </div>
        </div>
      </div>
      <Float className="sm:bottom-0 sm:right-0 sm:w-44">
        <p className="text-[10px] font-semibold text-foreground">Weekly planning</p>
        <p className="text-[9px] text-muted-foreground">Monday · 9:00 · 3 guests</p>
        <div className="mt-1.5 flex gap-1.5">
          <UiButton action="accept"><ArtSwap on="accept" before="Accept" after={<><Check className="size-3" /> Accepted</>} /></UiButton>
          <UiButton variant="outline">Maybe</UiButton>
        </div>
        <ArtReveal on="accept" delay={400} className="mt-1.5 flex items-center gap-1 text-[9px] font-medium text-emerald-700 dark:text-emerald-300">
          <CalendarDays className="size-3" /> Added to your calendar
        </ArtReveal>
      </Float>
    </ArtStage>
  );
}