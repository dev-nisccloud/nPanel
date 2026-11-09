import {
  ArrowUpRight,
  Bot,
  CheckCircle2,
  Clock,
  CreditCard,
  FileCode2,
  FileText,
  Folder,
  Globe,
  HardDrive,
  ImageIcon,
  Inbox,
  KeyRound,
  Loader2,
  Mail,
  Package,
  PenLine,
  RotateCcw,
  Send,
  ShieldCheck,
  Truck,
  Upload,
} from "lucide-react";
import { ArtFlash, ArtReveal, ArtStage, ArtSwap, Float, KeyValues, Meter, NpanelWindow, Panel, Pill, TabStrip, UiButton } from "./kit.tsx";

/** Variant compositions so multi-block pages do not repeat a layout. All data is fictional. */
const DOMAIN = "savannabakery.co.ke";

/** Hosting File Manager tab. */
export function HostingFilesArt() {
  const files = [
    [Folder, "public_html", "Folder"],
    [Folder, "wp-content", "Folder"],
    [FileCode2, "index.php", "4 KB"],
    [FileText, ".htaccess", "1 KB"],
  ] as const;
  return (
    <ArtStage tone="amber" label="nPanel hosting file manager with website folders and an upload in progress">
      <div className="sm:pb-12 sm:pr-14">
        <NpanelWindow path="hosting/subscriptions" active="hosting" title={DOMAIN} subtitle="File Manager" action={<UiButton action="upload"><Upload className="size-3" /> Upload</UiButton>}>
          <TabStrip tabs={[["Overview", "Summary"], ["DNS", "Records"], ["Mail", "Accounts"], ["File Manager", "Files"], ["Databases", "MySQL"]]} active={3} />
          <p className="mb-1.5 font-mono text-[9px] text-muted-foreground">/ home / savannabakery / public_html</p>
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            {files.map(([Icon, name, meta]) => (
              <div key={name} className="flex items-center gap-2 border-b border-border/60 px-3 py-2 last:border-0">
                <Icon className={`size-3.5 ${Icon === Folder ? "text-amber-500" : "text-primary"}`} />
                <span className="flex-1 font-mono text-[10px] text-foreground">{name}</span>
                <span className="text-[9px] text-muted-foreground">{meta}</span>
              </div>
            ))}
            <ArtReveal on="upload" delay={1300} className="flex items-center gap-2 bg-emerald-500/[0.07] px-3 py-2">
              <Package className="size-3.5 text-brand-orange" />
              <span className="flex-1 font-mono text-[10px] text-foreground">menu-photos.zip</span>
              <span className="flex items-center gap-1 text-[9px] font-semibold text-emerald-600 dark:text-emerald-400"><CheckCircle2 className="size-3" /> 18 MB</span>
            </ArtReveal>
          </div>
        </NpanelWindow>
      </div>
      <Float className="sm:bottom-0 sm:right-0 sm:w-48">
        <ArtSwap
          on="upload"
          delay={1200}
          className="mb-2"
          before={<span className="text-[11px] font-semibold text-foreground">Uploading…</span>}
          after={<span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400"><CheckCircle2 className="size-3.5" /> Upload complete</span>}
        />
        <ArtSwap
          on="upload"
          delay={1200}
          block
          before={<Meter label="menu-photos.zip" value={72} />}
          after={<Meter label="menu-photos.zip" value={100} tone="green" detail="Done" />}
        />
      </Float>
    </ArtStage>
  );
}

/** Email authentication records for sending from your own domain. */
export function MailDnsArt() {
  const recs = [
    ["MX", "Mail delivery"],
    ["SPF", "Approved senders"],
    ["DKIM", "Signed messages"],
    ["DMARC", "Policy published"],
  ];
  return (
    <ArtStage tone="emerald" label="Email domain authentication with MX, SPF, DKIM and DMARC records verified">
      <div className="sm:pb-10 sm:pl-12">
        <NpanelWindow path="hosting/subscriptions" active="email" title="Email domain" subtitle={DOMAIN} action={<Pill>Verified</Pill>}>
          <div className="grid grid-cols-2 gap-2">
            {recs.map(([t, d]) => (
              <div key={t} className="rounded-xl border border-border bg-card p-2.5">
                <div className="flex items-center justify-between">
                  <Pill tone="sky">{t}</Pill>
                  <CheckCircle2 className="size-3.5 text-emerald-500" />
                </div>
                <p className="mt-1.5 text-[10px] font-medium text-foreground">{d}</p>
              </div>
            ))}
          </div>
        </NpanelWindow>
      </div>
      <Float className="sm:bottom-0 sm:left-0 sm:w-52">
        <p className="flex items-center gap-1.5 text-[10px] font-semibold text-foreground"><ShieldCheck className="size-3.5 text-emerald-500" /> Ready to send</p>
        <p className="mt-1 text-[9px] text-muted-foreground">Messages go out from info@{DOMAIN}</p>
      </Float>
    </ArtStage>
  );
}

/** Webmail inbox on your own domain. */
export function WebmailArt() {
  const mails = [
    ["Wanjiru K.", "Cake order for Saturday", "9:12", true],
    ["Jambo Clinic", "Staff breakfast catering", "8:40", true],
    ["Supplier", "Flour delivery confirmed", "Yesterday", false],
  ] as const;
  return (
    <ArtStage tone="sky" label="Business email inbox with customer messages and a reply in progress">
      <div className="sm:pb-14 sm:pr-16">
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_30px_60px_-30px_rgb(14_87_118_/_0.45)]">
          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <Inbox className="size-3.5 text-primary" />
            <span className="text-[11px] font-semibold text-foreground">Inbox</span>
            <span className="ml-auto truncate text-[9px] text-muted-foreground">info@{DOMAIN}</span>
          </div>
          {mails.map(([from, subject, time, unread]) => (
            <div key={subject} className="flex items-center gap-2 border-b border-border/60 px-3 py-2.5 last:border-0">
              <span className={`size-1.5 shrink-0 rounded-full ${unread ? "bg-primary" : "bg-transparent"}`} />
              <span className="min-w-0 flex-1">
                <span className={`block truncate text-[10px] ${unread ? "font-semibold" : ""} text-foreground`}>{from}</span>
                <span className="block truncate text-[9px] text-muted-foreground">{subject}</span>
              </span>
              <span className="text-[8px] text-muted-foreground">{time}</span>
            </div>
          ))}
        </div>
      </div>
      <Float className="sm:bottom-0 sm:right-0 sm:w-52">
        <p className="text-[9px] text-muted-foreground">Re: Cake order for Saturday</p>
        <p className="mt-1 text-[10px] leading-snug text-foreground">Thank you, Wanjiru. Your order is confirmed for collection at 10:00.</p>
        <div className="mt-2 flex items-center gap-2">
          <UiButton action="reply"><Send className="size-3" /> Send</UiButton>
          <ArtReveal on="reply" delay={300} className="flex items-center gap-1 text-[9px] font-semibold text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="size-3" /> Reply sent
          </ArtReveal>
        </div>
      </Float>
    </ArtStage>
  );
}

/** Server backups and restore points. */
export function ServerBackupsArt({ host = "web-01" }: { host?: string }) {
  return (
    <ArtStage tone="violet" label="Cloud server backups with restore points">
      <div className="sm:pb-10 sm:pr-14">
        <NpanelWindow path="cloud-servers" active="cloud" title="Backups & Restore" subtitle={`${host} · Cloud Servers`} action={<UiButton action="backup">Back up now</UiButton>}>
          <div className="space-y-1.5">
            <ArtReveal on="backup" delay={200} className="flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/[0.06] px-3 py-2">
              <HardDrive className="size-3.5 text-emerald-600" />
              <span className="min-w-0 flex-1">
                <span className="block text-[10px] font-medium text-foreground">Manual backup</span>
                <ArtSwap
                  on="backup"
                  delay={300}
                  before={<span className="block text-[8px] text-primary">Creating server image…</span>}
                  after={<span className="block text-[8px] text-muted-foreground">Full server image · just now</span>}
                />
              </span>
              <ArtSwap on="backup" delay={1500} before={<Pill tone="sky">Running</Pill>} after={<Pill tone="green">Latest</Pill>} />
            </ArtReveal>
            {["Scheduled backup", "Scheduled backup", "Before system update"].map((t, i) => (
              <div key={i} className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
                <HardDrive className="size-3.5 text-primary" />
                <span className="min-w-0 flex-1">
                  <span className="block text-[10px] font-medium text-foreground">{t}</span>
                  <span className="block text-[8px] text-muted-foreground">Full server image</span>
                </span>
                <Pill tone="slate">Stored</Pill>
                <UiButton variant="outline"><RotateCcw className="size-3" /> Restore</UiButton>
              </div>
            ))}
          </div>
        </NpanelWindow>
      </div>
      <Float className="sm:bottom-0 sm:right-0 sm:w-44">
        <p className="flex items-center gap-1.5 text-[10px] font-semibold text-foreground"><Clock className="size-3.5 text-primary" /> Schedule</p>
        <p className="mt-1 text-[9px] text-muted-foreground">Retention agreed with your plan</p>
      </Float>
    </ArtStage>
  );
}

/** Domain transfer with authorisation code and progress. */
export function DomainTransferArt() {
  const steps = [
    ["Unlock at current registrar", true],
    ["Authorization code entered", true],
    ["Transfer approved", false],
  ] as const;
  return (
    <ArtStage tone="sky" label="Domain transfer in progress with authorization code and steps">
      <div className="sm:pb-12 sm:pr-14">
        <NpanelWindow path="domains/transfer" active="domains" title="Transfer" subtitle="Move a domain to Nisc Cloud">
          <div className="mb-2.5 flex items-center gap-2 rounded-xl border-2 border-primary/50 bg-card px-3 py-2">
            <Globe className="size-3.5 text-primary" />
            <span className="flex-1 text-[11px] font-medium text-foreground">{DOMAIN}</span>
            <ArtSwap on="transfer" delay={900} before={<Pill tone="amber">In progress</Pill>} after={<Pill tone="green">Transferred</Pill>} />
          </div>
          <div className="mb-2.5 flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-[10px]">
            <KeyRound className="size-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Authorization code</span>
            <span className="ml-auto font-mono text-foreground">••••••••••</span>
          </div>
          <ol className="space-y-1.5">
            {steps.map(([t, done]) => (
              <li key={t} className="flex items-center gap-2 text-[10px] text-foreground">
                {done ? (
                  <CheckCircle2 className="size-3.5 text-emerald-500" />
                ) : (
                  <ArtSwap on="transfer" delay={600} before={<span className="size-3.5 rounded-full border-2 border-primary" />} after={<CheckCircle2 className="size-3.5 text-emerald-500" />} />
                )}
                <span className="flex-1">{t}</span>
                {!done && <UiButton action="transfer">Approve</UiButton>}
              </li>
            ))}
          </ol>
        </NpanelWindow>
      </div>
      <Float className="sm:bottom-0 sm:right-0 sm:w-44">
        <p className="text-[10px] font-semibold text-foreground">Website and email</p>
        <p className="mt-1 text-[9px] text-muted-foreground">DNS records copied before the switch.</p>
      </Float>
    </ArtStage>
  );
}

/** Domain details: nameserver configuration. */
export function NameserversArt() {
  return (
    <ArtStage tone="slate" label="Domain nameserver configuration with the domain marked active">
      <div className="sm:pb-10 sm:pl-12">
        <NpanelWindow path="domains" active="domains" title={DOMAIN} subtitle="Domain details" action={<Pill>Active</Pill>}>
          <TabStrip tabs={[["Overview", "Summary"], ["DNS", "Records"], ["Nameservers", "Configuration"], ["Protect Brand", "Extensions"]]} active={2} />
          <Panel title="Nameservers" hint="Where your DNS is managed">
            <div className="space-y-1.5">
              {["Nameserver 1", "Nameserver 2"].map((n) => (
                <div key={n} className="flex items-center gap-2 rounded-md border border-border px-2 py-1.5 text-[10px]">
                  <span className="text-muted-foreground">{n}</span>
                  <span className="ml-auto font-medium text-foreground">Nisc Cloud default</span>
                </div>
              ))}
            </div>
            <UiButton action="ns" className="mt-2">Save changes</UiButton>
          </Panel>
        </NpanelWindow>
      </div>
      <Float className="sm:bottom-0 sm:left-0 sm:w-44">
        <ArtSwap
          on="ns"
          delay={300}
          before={<span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">Unsaved changes</span>}
          after={<span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400"><CheckCircle2 className="size-3" /> Change saved</span>}
        />
        <p className="mt-1 text-[9px] text-muted-foreground">Updates can take a few hours to spread.</p>
      </Float>
    </ArtStage>
  );
}

/** nPanel quotation for licences and setup work. No prices are drawn. */
export function QuotationArt({ product = "Microsoft 365" }: { product?: string }) {
  return (
    <ArtStage tone="violet" label={`A ${product} quotation in nPanel listing licences, migration and setup for review`}>
      <div className="sm:pb-12 sm:pr-14">
        <NpanelWindow path="billing/quotations" active="billing" title="Quotation" subtitle="Savanna Bakery" action={<ArtSwap on="quote" delay={300} before={<Pill tone="sky">Sent</Pill>} after={<Pill tone="green">Accepted</Pill>} />}>
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            {[[`${product} licences`, "Per user"], ["Mailbox migration", "One-off"], ["Domain and DNS setup", "One-off"]].map(([item, unit]) => (
              <div key={item} className="flex items-center gap-2 border-b border-border/60 px-3 py-2 last:border-0">
                <Package className="size-3.5 text-primary" />
                <span className="flex-1 text-[10px] font-medium text-foreground">{item}</span>
                <span className="text-[9px] text-muted-foreground">{unit}</span>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[9px] text-muted-foreground">Licence names, billing terms and totals are confirmed in your quotation.</p>
        </NpanelWindow>
      </div>
      <Float className="sm:bottom-0 sm:right-0 sm:w-44">
        <p className="text-[10px] font-semibold text-foreground">Ready to proceed?</p>
        <div className="mt-2 flex gap-1.5"><UiButton action="quote">Accept</UiButton><UiButton variant="outline">Ask a question</UiButton></div>
        <ArtReveal on="quote" delay={500} className="mt-2 flex items-center gap-1 text-[9px] font-medium text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 className="size-3" /> Accepted · setup gets scheduled
        </ArtReveal>
      </Float>
    </ArtStage>
  );
}

/** SEO analytics with a labelled sample trend. */
export function SeoAnalyticsArt() {
  return (
    <ArtStage tone="sky" label="SEO analytics with a sample organic visits trend and top landing pages">
      <div className="sm:pb-10 sm:pr-14">
        <NpanelWindow path="agency/seo" active="seo" title="Analytics" subtitle={DOMAIN} action={<Pill tone="sky">Review baseline</Pill>}>
          <Panel title="Organic visits" hint="Last 6 months">
            <svg viewBox="0 0 200 60" className="h-16 w-full" aria-hidden>
              <defs>
                <linearGradient id="seoFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0" stopColor="#24ace4" stopOpacity="0.35" />
                  <stop offset="1" stopColor="#24ace4" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M0 50 L40 44 L80 46 L120 34 L160 28 L200 18 L200 60 L0 60Z" fill="url(#seoFill)" />
              <path d="M0 50 L40 44 L80 46 L120 34 L160 28 L200 18" fill="none" stroke="#24ace4" strokeWidth="2" />
            </svg>
          </Panel>
          <Panel title="Top landing pages" className="mt-2.5">
            {["/cakes", "/weekend-menu", "/catering"].map((p) => (
              <p key={p} className="flex items-center justify-between border-t border-border/60 py-1.5 font-mono text-[10px] text-foreground first:border-0">
                {p}<ArrowUpRight className="size-3 text-emerald-500" />
              </p>
            ))}
          </Panel>
        </NpanelWindow>
      </div>
      <Float className="sm:bottom-0 sm:right-0 sm:w-40">
        <p className="text-[10px] font-semibold text-foreground">Monthly report</p>
        <p className="mt-1 text-[9px] text-muted-foreground">Findings and next actions</p>
      </Float>
    </ArtStage>
  );
}

/** Content plan: a keyword becomes a page brief. */
export function ContentPlanArt() {
  return (
    <ArtStage tone="emerald" label="Content plan turning a search topic into a page outline for review">
      <div className="grid gap-3 sm:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-2xl border border-border bg-card p-3 shadow-[0_20px_40px_-24px_rgb(14_87_118_/_0.5)] sm:mt-10">
          <p className="text-[9px] uppercase tracking-wide text-muted-foreground">Topic</p>
          <p className="text-[12px] font-semibold text-foreground">birthday cakes nairobi</p>
          <div className="mt-2 flex gap-1.5"><Pill tone="sky">Buy intent</Pill><Pill tone="violet">Local</Pill></div>
          <p className="mt-2.5 text-[9px] leading-snug text-muted-foreground">Questions customers ask: sizes, delivery, how far ahead to order.</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-3 shadow-[0_20px_40px_-24px_rgb(14_87_118_/_0.5)]">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold text-foreground"><PenLine className="size-3.5 text-primary" /> Page outline</p>
            <Pill tone="amber">In review</Pill>
          </div>
          <ol className="mt-2 space-y-1.5 text-[10px]">
            {[["H1", "Birthday cakes in Nairobi"], ["H2", "Choose a size and flavour"], ["H2", "Order and collection times"], ["H2", "Frequently asked questions"]].map(([h, t]) => (
              <li key={t} className="flex items-center gap-2 rounded-md bg-muted/60 px-2 py-1">
                <span className="font-mono text-[8px] font-bold text-primary">{h}</span>
                <span className="text-foreground">{t}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </ArtStage>
  );
}

/** Store orders list. */
export function StoreOrdersArt() {
  const orders = [
    ["#1042", "Celebration cake", "Paid", "green"],
    ["#1041", "Bread box", "Out for delivery", "sky"],
    ["#1040", "Cupcake set", "Collected", "slate"],
  ] as const;
  return (
    <ArtStage tone="emerald" label="Online store orders with payment and delivery statuses">
      <div className="sm:pb-12 sm:pr-14">
        <div className="rounded-2xl border border-border bg-card p-3 shadow-[0_30px_60px_-30px_rgb(14_87_118_/_0.45)]">
          <p className="text-[12px] font-semibold text-foreground">Orders</p>
          <p className="text-[9px] text-muted-foreground">Store dashboard</p>
          <div className="mt-2.5 space-y-1.5">
            {orders.map(([id, item, status, tone]) => (
              <div key={id} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2">
                <span className="font-mono text-[9px] text-muted-foreground">{id}</span>
                <span className="flex-1 truncate text-[10px] font-medium text-foreground">{item}</span>
                <Pill tone={tone}>{status}</Pill>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Float className="sm:bottom-0 sm:right-0 sm:w-44">
        <p className="flex items-center gap-1.5 text-[10px] font-semibold text-foreground"><Truck className="size-3.5 text-primary" /> Delivery update</p>
        <p className="mt-1 text-[9px] text-muted-foreground">Customer notified by email.</p>
      </Float>
    </ArtStage>
  );
}

/** Checkout steps. */
export function CheckoutArt() {
  return (
    <ArtStage tone="amber" label="Store checkout with delivery details and payment step">
      <div className="mx-auto max-w-[420px] rounded-2xl border border-border bg-card p-4 shadow-[0_30px_60px_-30px_rgb(14_87_118_/_0.45)]">
        <div className="mb-3 flex items-center gap-1.5 text-[9px]">
          {["Details", "Delivery", "Payment"].map((s, i) => (
            <span key={s} className="flex items-center gap-1.5">
              <span className={`flex size-4 items-center justify-center rounded-full text-[8px] font-bold ${i < 2 ? "bg-emerald-500 text-white" : "bg-primary text-white"}`}>{i < 2 ? "✓" : 3}</span>
              <span className="font-medium text-foreground">{s}</span>
              {i < 2 && <span className="h-px w-5 bg-border" />}
            </span>
          ))}
        </div>
        <Panel title="Payment method" icon={CreditCard}>
          {["Card", "Mobile money"].map((m, i) => (
            <p key={m} className={`mt-1.5 flex items-center gap-2 rounded-md border px-2 py-1.5 text-[10px] ${i === 1 ? "border-primary bg-primary/5" : "border-border"}`}>
              <span className={`size-2.5 rounded-full border-2 ${i === 1 ? "border-primary bg-primary" : "border-border"}`} />{m}
            </p>
          ))}
        </Panel>
        <UiButton action="order" className="mt-3 w-full justify-center py-1.5 text-[10px]">Place order</UiButton>
        <div className="mt-2 grid min-h-[34px] [&>*]:col-start-1 [&>*]:row-start-1">
          <ArtFlash on="order" duration={1100} className="flex items-center justify-center gap-1.5 text-[10px] font-medium text-primary">
            <Loader2 className="size-3.5 animate-spin" /> Waiting for payment confirmation…
          </ArtFlash>
          <ArtReveal on="order" delay={1400} className="flex items-center gap-2 rounded-lg bg-emerald-500/10 px-2.5 py-1.5">
            <CheckCircle2 className="size-4 text-emerald-500" />
            <span className="flex-1 text-[10px] font-semibold text-foreground">Payment confirmed</span>
            <span className="font-mono text-[9px] text-muted-foreground">#SB-1042</span>
          </ArtReveal>
        </div>
      </div>
    </ArtStage>
  );
}

/** Zepo AI activity: a record of what Zepo helped with. */
export function ZeepoActivityArt() {
  const items = [
    [Globe, "Checked a domain for availability"],
    [FileText, "Drafted a hosting proposal"],
    [ImageIcon, "Created a product launch image"],
    [Mail, "Suggested a business email setup"],
  ] as const;
  return (
    <ArtStage tone="violet" label="Zepo AI activity list of tasks completed with the user">
      <div className="sm:pb-10 sm:pl-12">
        <NpanelWindow path="agency/zeepo-ai/activity" active="zeepo" title="Zepo AI" subtitle="Activity">
          <div className="space-y-1.5">
            {items.map(([Icon, t]) => (
              <div key={t} className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
                <span className="flex size-6 items-center justify-center rounded-lg bg-primary/12"><Icon className="size-3.5 text-sky-700 dark:text-sky-300" /></span>
                <span className="flex-1 text-[10px] font-medium text-foreground">{t}</span>
                <CheckCircle2 className="size-3.5 text-emerald-500" />
              </div>
            ))}
          </div>
        </NpanelWindow>
      </div>
      <Float className="sm:bottom-0 sm:left-0 sm:w-48">
        <p className="flex items-center gap-1.5 text-[10px] font-semibold text-foreground"><Bot className="size-3.5 text-primary" /> You stay in control</p>
        <p className="mt-1 text-[9px] text-muted-foreground">Review drafts before you send or publish.</p>
      </Float>
    </ArtStage>
  );
}

/** Creative brief form from the Creative briefs tab. */
export function CreativeBriefArt() {
  return (
    <ArtStage tone="rose" label="Creative brief with goal, formats and references submitted for design">
      <div className="sm:pb-12 sm:pr-14">
        <NpanelWindow path="agency/creative-assets" active="creative" title="Creative briefs" subtitle="New brief" action={<UiButton action="brief">Submit brief</UiButton>}>
          <KeyValues rows={[["Project", "Weekend menu launch"], ["Category", "Social media"], ["Formats", "Square · Story"], ["Due", "Thursday"]]} />
          <div className="mt-2.5">
            <p className="text-[8px] uppercase tracking-wide text-muted-foreground">References</p>
            <div className="mt-1 flex gap-1.5">
              {["from-amber-200 to-orange-300", "from-rose-200 to-pink-300", "from-yellow-100 to-amber-200"].map((g) => (
                <span key={g} className={`h-10 flex-1 rounded-lg bg-gradient-to-br ${g}`} />
              ))}
            </div>
          </div>
        </NpanelWindow>
      </div>
      <Float className="sm:bottom-0 sm:right-0 sm:w-44">
        <ArtSwap on="brief" delay={300} before={<Pill tone="slate">Draft</Pill>} after={<Pill tone="violet"><CheckCircle2 className="size-3" /> Brief received</Pill>} />
        <p className="mt-1.5 text-[9px] text-muted-foreground">First concepts appear in Creative Assets for review.</p>
      </Float>
    </ArtStage>
  );
}

/** Social content calendar for a week. */
export function SocialCalendarArt() {
  const days = [
    ["Mon", null],
    ["Tue", ["Behind the bakery", "bg-primary"]],
    ["Wed", null],
    ["Thu", ["Weekend menu", "bg-blue-600"]],
    ["Fri", ["Pre-order reminder", "bg-rose-500"]],
  ] as const;
  return (
    <ArtStage tone="violet" label="Social media content calendar with scheduled posts and approval status">
      <div className="sm:pb-12 sm:pr-14">
        <div className="rounded-2xl border border-border bg-card p-3 shadow-[0_30px_60px_-30px_rgb(14_87_118_/_0.45)]">
          <p className="text-[12px] font-semibold text-foreground">Content calendar</p>
          <p className="text-[9px] text-muted-foreground">This week</p>
          <div className="mt-2.5 grid grid-cols-5 gap-1.5">
            {days.map(([d, post]) => (
              <div key={d} className="min-h-[84px] rounded-lg bg-muted/50 p-1.5">
                <p className="text-[8px] font-semibold text-muted-foreground">{d}</p>
                {post && (
                  <div className="mt-1 rounded-md bg-card p-1 shadow-sm">
                    <span className={`block h-6 rounded ${post[1]} opacity-80`} />
                    <p className="mt-1 text-[7.5px] leading-tight text-foreground">{post[0]}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      <Float className="sm:bottom-0 sm:right-0 sm:w-44">
        <p className="text-[10px] font-semibold text-foreground">Weekend menu post</p>
        <div className="mt-1.5 flex gap-1.5"><Pill>Approved</Pill><Pill tone="sky">Scheduled</Pill></div>
      </Float>
    </ArtStage>
  );
}
