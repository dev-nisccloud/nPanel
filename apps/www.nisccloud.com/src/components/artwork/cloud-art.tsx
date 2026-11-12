import {
  ArrowRightLeft,
  Check,
  CheckCircle2,
  Cpu,
  FileText,
  Globe,
  HardDrive,
  Loader2,
  Lock,
  Mail,
  MemoryStick,
  Plus,
  RotateCcw,
  Search,
  Server,
  ShieldCheck,
  ShoppingCart,
  Terminal,
} from "lucide-react";
import { HostingFlagshipArt } from "./flagship-art.tsx";
import {
  ArtFlash,
  ArtReveal,
  ArtStage,
  ArtSwap,
  Float,
  KeyValues,
  Meter,
  NpanelWindow,
  Panel,
  Pill,
  Ring,
  TabStrip,
  UiButton,
} from "./kit.tsx";

/** Fictional demonstration data only. IPs use the RFC 5737 documentation range. */
const DOMAIN = "savannabakery.co.ke";

const hostingTabs: [string, string][] = [
  ["Overview", "Summary"],
  ["DNS", "Records"],
  ["Mail", "Accounts"],
  ["File Manager", "Files"],
  ["Databases", "MySQL"],
  ["WordPress", "Instances"],
];

function WordPressMark({ className = "size-7" }: { className?: string }) {
  return (
    <span className={`flex shrink-0 items-center justify-center rounded-full bg-[#21759b] font-serif text-[13px] font-bold text-white ${className}`}>
      W
    </span>
  );
}

/** Flagship hosting story: customer outcome first, management context second. */
export function HostingOverviewArt() {
  return <HostingFlagshipArt />;
}

/**
 * Hosting support: a conversation that stays linked to the customer's hosting service,
 * with the migration checklist the team is working through. Conversation-led, not a dashboard.
 */
export function HostingSupportArt() {
  const steps: [string, "done" | "active" | "todo"][] = [
    ["Copy of current website received", "done"],
    ["Hosting plan prepared with SSL", "done"],
    ["Test copy shared for your review", "active"],
    ["Switch domain and go live", "todo"],
  ];
  return (
    <ArtStage tone="sky" label="Hosting support conversation linked to a customer's hosting service, with a migration checklist in progress">
      <div className="relative mx-auto max-w-[520px] pb-20 sm:pb-24">
        <div className="rounded-2xl border border-border bg-card shadow-[0_30px_60px_-30px_rgb(14_87_118_/_0.45)]">
          <div className="flex items-center gap-2 border-b border-border/70 px-4 py-3">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary/12 text-primary">
              <Server className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] font-semibold text-foreground">Moving {DOMAIN} to Nisc Cloud</p>
              <p className="truncate text-[9px] text-muted-foreground">Linked to: Website hosting · Business plan</p>
            </div>
            <Pill tone="sky">In progress</Pill>
          </div>
          <div className="art-seq space-y-3 px-4 py-4">
            <div className="flex gap-2">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-amber-100 text-[9px] font-bold text-amber-800 dark:bg-amber-500/20 dark:text-amber-200">
                A
              </span>
              <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-muted px-3 py-2 text-[10px] leading-relaxed text-foreground">
                Our current host expires on the 28th. Can you move the website and email without any downtime for customers?
              </div>
            </div>
            <div className="flex flex-row-reverse gap-2">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                N
              </span>
              <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-primary/10 px-3 py-2 text-[10px] leading-relaxed text-foreground">
                Yes. We copy the site to your new hosting first, you review a test version, and we only switch the domain once you approve. Email mailboxes are created before the switch.
              </div>
            </div>
            <ArtReveal on="send" delay={200} className="flex gap-2">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-amber-100 text-[9px] font-bold text-amber-800 dark:bg-amber-500/20 dark:text-amber-200">
                A
              </span>
              <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-muted px-3 py-2 text-[10px] leading-relaxed text-foreground">
                Test copy looks great. Please go ahead and switch.
              </div>
            </ArtReveal>
            <div className="flex items-center gap-2 pt-1">
              <span className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-[10px] text-muted-foreground">
                <span className="art-caret">Reply to Nisc Cloud support…</span>
              </span>
              <UiButton action="send">Send</UiButton>
            </div>
          </div>
        </div>
        <Float className="sm:-bottom-2 sm:right-0 sm:w-[260px]">
          <p className="mb-2 text-[10px] font-semibold text-foreground">Migration checklist</p>
          <ul className="space-y-1.5">
            {steps.map(([label, state]) => (
              <li key={label} className="flex items-center gap-2 text-[9px]">
                {state === "done" ? (
                  <CheckCircle2 className="size-3.5 shrink-0 text-emerald-500" />
                ) : state === "active" ? (
                  <ArtSwap
                    on="send"
                    delay={900}
                    before={
                      <span className="flex size-3.5 shrink-0 items-center justify-center rounded-full bg-brand-orange/15">
                        <span className="art-ping size-1.5 rounded-full bg-brand-orange" />
                      </span>
                    }
                    after={<CheckCircle2 className="size-3.5 shrink-0 text-emerald-500" />}
                  />
                ) : (
                  <span className="size-3.5 shrink-0 rounded-full border border-border" />
                )}
                <span className={state === "todo" ? "text-muted-foreground" : "text-foreground"}>{label}</span>
              </li>
            ))}
          </ul>
        </Float>
      </div>
    </ArtStage>
  );
}

/** Hosting DNS tab: records you can view, edit and add. */
export function HostingDnsArt() {
  const records = [
    ["A", "@", "192.0.2.24"],
    ["CNAME", "www", DOMAIN],
    ["MX", "@", `mail.${DOMAIN}`],
    ["TXT", "@", "v=spf1 a mx ~all"],
  ];
  return (
    <ArtStage tone="slate" label="nPanel hosting DNS records table with add record action">
      <div className="sm:pb-10 sm:pl-10">
        <NpanelWindow
          path="hosting/subscriptions"
          active="hosting"
          title={DOMAIN}
          subtitle="DNS records for this subscription"
          action={<UiButton><Plus className="size-3" /> Add Record</UiButton>}
        >
          <TabStrip tabs={hostingTabs} active={1} />
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="grid grid-cols-[48px_44px_1fr_40px] gap-2 border-b border-border bg-muted/40 px-3 py-1.5 text-[8px] font-semibold uppercase tracking-wide text-muted-foreground">
              <span>Type</span><span>Host</span><span>Value</span><span>TTL</span>
            </div>
            {records.map(([type, host, value]) => (
              <div key={type} className="grid grid-cols-[48px_44px_1fr_40px] items-center gap-2 border-b border-border/60 px-3 py-2 text-[10px] last:border-0">
                <Pill tone="sky" className="justify-center">{type}</Pill>
                <span className="font-mono text-foreground">{host}</span>
                <span className="truncate font-mono text-muted-foreground">{value}</span>
                <span className="text-muted-foreground">3600</span>
              </div>
            ))}
            <ArtSwap
              on="dns"
              delay={300}
              block
              before={<span className="block w-full px-3 py-2 text-center text-[9px] text-muted-foreground/70">No pending changes</span>}
              after={
                <span className="grid w-full grid-cols-[48px_44px_1fr_40px] items-center gap-2 bg-emerald-500/[0.07] px-3 py-2 text-[10px]">
                  <Pill tone="green" className="justify-center">TXT</Pill>
                  <span className="font-mono text-foreground">_verify</span>
                  <span className="flex min-w-0 items-center gap-1 font-mono text-muted-foreground"><span className="truncate">site-verification=…</span></span>
                  <span className="flex items-center gap-0.5 text-[8px] font-semibold text-emerald-600 dark:text-emerald-400"><Check className="size-3" />Saved</span>
                </span>
              }
            />
          </div>
        </NpanelWindow>
      </div>
      <Float className="sm:bottom-0 sm:left-0 sm:w-52">
        <p className="mb-2 text-[11px] font-semibold text-foreground">Add DNS record</p>
        <div className="space-y-1.5 text-[9px]">
          <p className="rounded-md border border-border px-2 py-1 text-muted-foreground">Type <span className="float-right font-medium text-foreground">TXT</span></p>
          <p className="rounded-md border border-border px-2 py-1 text-muted-foreground">Host <span className="float-right font-mono text-foreground">_verify</span></p>
          <UiButton action="dns" className="w-full justify-center">Save record</UiButton>
        </div>
      </Float>
    </ArtStage>
  );
}

/** Domain search: name, extension results and a select action. No prices are drawn. */
export function DomainSearchArt() {
  const results = [
    [".co.ke", "Available", "green"],
    [".com", "Available", "green"],
    [".ke", "Registered", "slate"],
    [".africa", "Available", "green"],
  ] as const;
  return (
    <ArtStage tone="sky" label="Domain search showing extension availability and a domain details card">
      <div className="sm:pb-14 sm:pr-16">
        <NpanelWindow path="domains/register" active="domains" title="Get a domain" subtitle="Search for a name for your business">
          <div className="relative mb-3 flex items-center gap-2 rounded-xl border-2 border-primary/60 bg-card px-3 py-2 shadow-[0_8px_20px_-14px_var(--primary)]">
            <Search className="size-3.5 text-primary" />
            <span className="flex-1 text-[11px] font-medium text-foreground">savannabakery</span>
            <ArtFlash on="search" duration={700} className="flex items-center gap-1 text-[9px] font-medium text-primary">
              <Loader2 className="size-3 animate-spin" /> Checking…
            </ArtFlash>
            <UiButton action="search">Search</UiButton>
          </div>
          <div className="space-y-1.5">
            {results.map(([ext, status, tone], i) => (
              <div key={ext} className={`flex items-center gap-2 rounded-lg border bg-card px-3 py-2 ${i === 0 ? "border-primary/60 ring-1 ring-primary/20" : "border-border"}`}>
                <span className="flex-1 truncate text-[11px] text-foreground">
                  savannabakery<span className="font-semibold text-primary">{ext}</span>
                </span>
                <ArtSwap
                  on="search"
                  delay={650 + i * 160}
                  before={<span className="h-3.5 w-12 animate-pulse rounded-full bg-muted" />}
                  after={<Pill tone={tone}>{status}</Pill>}
                />
                {status === "Available" ? (
                  i === 0 ? (
                    <UiButton action="pick">
                      <ArtSwap on="pick" before="Select" after={<><Check className="size-3" /> Added</>} />
                    </UiButton>
                  ) : (
                    <UiButton variant="outline">Select</UiButton>
                  )
                ) : (
                  <UiButton variant="outline">WHOIS</UiButton>
                )}
              </div>
            ))}
          </div>
        </NpanelWindow>
      </div>
      <Float className="sm:bottom-0 sm:right-0 sm:w-48">
        <ArtSwap
          on="pick"
          delay={250}
          block
          before={
            <span className="flex h-full flex-col items-center justify-center gap-1.5 py-3 text-center">
              <span className="flex size-8 items-center justify-center rounded-xl border border-dashed border-primary/40 text-primary">
                <ShoppingCart className="size-4" />
              </span>
              <span className="text-[10px] font-semibold text-foreground">Your cart</span>
              <span className="text-[9px] text-muted-foreground">Select a name to add it here.</span>
            </span>
          }
          after={
            <>
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-xl bg-linear-to-br from-[#38b6ff] to-[#38b6ff] text-white shadow-sm">
              <ShoppingCart className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">Added to cart</p>
              <p className="truncate text-[11px] font-semibold text-foreground">{DOMAIN}</p>
            </div>
          </div>
          <div className="mt-2.5 space-y-1.5 text-[9px] text-muted-foreground">
            <p className="flex items-center justify-between"><span className="flex items-center gap-1"><Globe className="size-3" /> Registration</span><span className="font-medium text-foreground">1 year</span></p>
            <p className="flex items-center justify-between"><span className="flex items-center gap-1"><Lock className="size-3" /> Transfer lock</span><span className="h-3 w-6 rounded-full bg-emerald-500 p-0.5"><span className="ml-auto block size-2 rounded-full bg-white" /></span></p>
          </div>
          <span className="mt-2.5 flex items-center justify-center gap-1 rounded-md bg-brand-orange py-1 text-[9px] font-bold text-[#02070A]">Continue to checkout</span>
            </>
          }
        />
      </Float>
    </ArtStage>
  );
}

/** Domain transfer and website migration checklist. */
export function MigrationArt() {
  const steps = [
    ["Current site reviewed", "Files, databases and email listed", true],
    ["Copy to Nisc Cloud", "Website restored to new hosting", true],
    ["Test before switching", "Preview checked with your team", true],
    ["Point the domain", "Nameservers updated when you approve", false],
  ] as const;
  return (
    <ArtStage tone="violet" label="Migration checklist moving a website from a previous host to Nisc Cloud">
      <div className="sm:pb-12 sm:pr-12">
        <NpanelWindow path="support" active="support" title="Website migration" subtitle={DOMAIN}>
          <div className="mb-3 flex items-center gap-2 rounded-xl bg-card p-2.5 text-[10px]">
            <span className="rounded-lg bg-muted px-2 py-1 font-medium text-muted-foreground">Previous host</span>
            <ArrowRightLeft className="size-3.5 text-primary" />
            <span className="rounded-lg bg-primary/10 px-2 py-1 font-semibold text-primary">Nisc Cloud hosting</span>
          </div>
          <ol className="space-y-1.5">
            {steps.map(([t, d, done]) => (
              <li key={t} className="flex items-start gap-2 rounded-lg border border-border bg-card px-3 py-2">
                {done ? (
                  <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-500" />
                ) : (
                  <ArtSwap
                    on="switch"
                    delay={700}
                    className="mt-0.5"
                    before={<span className="size-3.5 shrink-0 rounded-full border-2 border-primary" />}
                    after={<CheckCircle2 className="size-3.5 shrink-0 text-emerald-500" />}
                  />
                )}
                <span className="min-w-0">
                  <span className="block text-[10px] font-semibold text-foreground">{t}</span>
                  <span className="block text-[9px] text-muted-foreground">{d}</span>
                </span>
              </li>
            ))}
          </ol>
        </NpanelWindow>
      </div>
      <Float className="sm:bottom-0 sm:right-0 sm:w-44">
        <p className="text-[11px] font-semibold text-foreground">Nameservers</p>
        <ArtSwap
          on="switch"
          className="mt-1"
          before={<span className="text-[9px] text-muted-foreground">Ready to update when you approve the switch.</span>}
          after={
            <span className="flex items-center gap-1 text-[9px] font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-3" /> Switched · site live on Nisc Cloud
            </span>
          }
        />
        <UiButton action="switch" className="mt-2">Approve switch</UiButton>
      </Float>
    </ArtStage>
  );
}

/** WordPress instances inside a hosting subscription. */
export function WordPressArt({ variant = 0 }: { variant?: number }) {
  if (variant % 2 === 1) {
    return (
      <ArtStage tone="emerald" label="WordPress backup and restore points for a hosted site">
        <div className="sm:pb-12 sm:pl-12">
          <NpanelWindow path="hosting/subscriptions" active="hosting" title="Backup & Restore" subtitle="Nisc Backup for savannabakery.co.ke">
            <TabStrip tabs={[["WordPress", "Instances"], ["Backup & Restore", "Nisc Backup"], ["Databases", "MySQL"]]} active={1} />
            <div className="space-y-1.5">
              {["Before plugin update", "Daily backup", "Daily backup"].map((t, i) => (
                <div key={i} className={`flex items-center gap-2 rounded-lg border bg-card px-3 py-2 ${i === 0 ? "border-primary/50 ring-1 ring-primary/15" : "border-border"}`}>
                  <HardDrive className="size-3.5 text-primary" />
                  <span className="flex-1 text-[10px] font-medium text-foreground">{t}</span>
                  <span className="text-[9px] text-muted-foreground">Files + database</span>
                  <UiButton variant="outline" action={i === 0 ? "restore" : undefined}><RotateCcw className="size-3" /> Restore</UiButton>
                </div>
              ))}
            </div>
          </NpanelWindow>
        </div>
        <Float className="sm:bottom-0 sm:left-0 sm:w-48">
          <ArtFlash on="restore" duration={1000} className="absolute inset-x-3 top-3 flex items-center gap-2 text-[11px] font-semibold text-foreground">
            <Loader2 className="size-4 animate-spin text-primary" /> Restoring files + database…
          </ArtFlash>
          <ArtSwap
            on="restore"
            delay={1300}
            before={<span className="block h-4" />}
            after={
              <span className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-emerald-500" />
                <span className="text-[11px] font-semibold text-foreground">Site restored</span>
              </span>
            }
          />
          <p className="mt-1 text-[9px] text-muted-foreground">Restored from the point before the plugin update.</p>
        </Float>
      </ArtStage>
    );
  }
  return (
    <ArtStage tone="sky" label="nPanel WordPress instance with status and management actions">
      <div className="sm:pb-14 sm:pr-14">
        <NpanelWindow
          path="hosting/subscriptions"
          active="hosting"
          title={DOMAIN}
          subtitle="WordPress instances"
          action={<UiButton action="install"><Plus className="size-3" /> Install</UiButton>}
        >
          <TabStrip tabs={hostingTabs} active={5} />
          <div className="rounded-xl border border-border bg-card p-3">
            <div className="flex items-center gap-2.5">
              <WordPressMark />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[11px] font-semibold text-foreground">Savanna Bakery</p>
                <p className="truncate font-mono text-[9px] text-muted-foreground">https://{DOMAIN}</p>
              </div>
              <Pill>Active</Pill>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-1.5 text-[9px]">
              {[["Plugins", "Up to date"], ["Theme", "Active"], ["SSL", "Enabled"]].map(([k, v]) => (
                <div key={k} className="rounded-lg bg-muted/60 px-2 py-1.5">
                  <p className="text-muted-foreground">{k}</p>
                  <p className="font-semibold text-foreground">{v}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <UiButton>Open dashboard</UiButton>
              <UiButton variant="outline">Backup</UiButton>
              <UiButton variant="outline">Settings</UiButton>
            </div>
          </div>
        </NpanelWindow>
      </div>
      <Float className="sm:bottom-0 sm:right-0 sm:w-52">
        <p className="mb-2 text-[11px] font-semibold text-foreground">Install WordPress</p>
        <div className="space-y-1">
          <Meter label="Creating database" value={100} tone="green" />
          <Meter label="Copying files" value={100} tone="green" />
          <ArtSwap
            on="install"
            delay={900}
            block
            before={<Meter label="Applying SSL" value={70} />}
            after={<Meter label="Applying SSL" value={100} tone="green" detail="Done" />}
          />
          <ArtReveal on="install" delay={1300} className="flex items-center gap-1 pt-1 text-[9px] font-semibold text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="size-3" /> WordPress is ready
          </ArtReveal>
        </div>
      </Float>
    </ArtStage>
  );
}

/** Business email: mailboxes on your own domain. */
export function MailboxesArt() {
  const boxes = [
    ["info", "Shared inbox", 42],
    ["amina", "Director", 28],
    ["sales", "Sales team", 61],
    ["accounts", "Finance", 15],
  ] as const;
  return (
    <ArtStage tone="violet" label="Business email mailboxes on a company domain with create mailbox form">
      <div className="sm:pb-12 sm:pr-14">
        <NpanelWindow path="hosting/subscriptions" active="email" title="Mail accounts" subtitle={DOMAIN} action={<UiButton><Plus className="size-3" /> Create</UiButton>}>
          <TabStrip tabs={hostingTabs} active={2} />
          <div className="space-y-1.5">
            {boxes.map(([user, role, used]) => (
              <div key={user} className="grid grid-cols-[22px_1fr_70px] items-center gap-2 rounded-lg border border-border bg-card px-2.5 py-2">
                <span className="flex size-[22px] items-center justify-center rounded-full bg-primary/15 text-[9px] font-bold uppercase text-primary dark:text-[#38b6ff]">{user[0]}</span>
                <span className="min-w-0">
                  <span className="block truncate text-[10px] font-semibold text-foreground">{user}@{DOMAIN}</span>
                  <span className="block text-[8px] text-muted-foreground">{role}</span>
                </span>
                <Meter label="Storage" value={used} tone="violet" />
              </div>
            ))}
            <ArtSwap
              on="mailbox"
              delay={350}
              block
              before={
                <span className="flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-primary/40 px-2.5 py-2.5 text-[9px] font-medium text-muted-foreground">
                  <Plus className="size-3" /> New mailbox
                </span>
              }
              after={
                <span className="grid w-full grid-cols-[22px_1fr_auto] items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/[0.06] px-2.5 py-2">
                  <span className="flex size-[22px] items-center justify-center rounded-full bg-brand-orange text-[9px] font-bold uppercase text-white">o</span>
                  <span className="min-w-0">
                    <span className="block truncate text-[10px] font-semibold text-foreground">orders@{DOMAIN}</span>
                    <span className="block text-[8px] text-muted-foreground">Orders · just created</span>
                  </span>
                  <Pill>Ready</Pill>
                </span>
              }
            />
          </div>
        </NpanelWindow>
      </div>
      <Float className="sm:bottom-0 sm:right-0 sm:w-52">
        <p className="mb-2 text-[11px] font-semibold text-foreground">New mailbox</p>
        <p className="rounded-md border border-border px-2 py-1 font-mono text-[9px] text-foreground">orders<span className="text-muted-foreground">@{DOMAIN}</span></p>
        <div className="mt-2 flex items-center justify-between text-[9px] text-muted-foreground">
          <span>Phone and desktop setup</span>
          <UiButton action="mailbox">Create</UiButton>
        </div>
      </Float>
    </ArtStage>
  );
}

export type ServerKind = "vps" | "vds" | "dedicated";

const serverCopy: Record<ServerKind, { menu: string; host: string; cpu: string; note: string; tone: "sky" | "violet" | "slate" }> = {
  vps: { menu: "VPS Hosting", host: "web-01", cpu: "vCPU", note: "Virtual server with root access", tone: "sky" },
  vds: { menu: "VDS Hosting", host: "app-01", cpu: "Dedicated vCPU", note: "Reserved CPU cores for steady workloads", tone: "violet" },
  dedicated: { menu: "Dedicated Servers", host: "db-01", cpu: "Physical cores", note: "A whole physical machine for one customer", tone: "slate" },
};

function ServerChassis() {
  return (
    <svg viewBox="0 0 220 120" className="h-auto w-full" aria-hidden>
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(10 ${10 + i * 34})`}>
          <rect width="200" height="28" rx="6" className="fill-slate-800 dark:fill-slate-700" />
          <rect x="10" y="9" width="70" height="10" rx="2" className="fill-slate-600" />
          {[0, 1, 2, 3, 4, 5].map((j) => (
            <rect key={j} x={92 + j * 12} y="8" width="8" height="12" rx="1.5" className="fill-slate-600" />
          ))}
          <circle cx="178" cy="14" r="3" fill={i === 0 ? "#10b981" : "#24ace4"} />
          <circle cx="190" cy="14" r="3" className="fill-slate-500" />
        </g>
      ))}
    </svg>
  );
}

/** Cloud server overview with resources and a browser terminal session. */
export function ServerArt({ kind = "vps", variant = 0 }: { kind?: ServerKind; variant?: number }) {
  const c = serverCopy[kind];
  if (variant % 2 === 1) {
    return (
      <ArtStage tone="slate" label={`${c.menu} browser terminal session`}>
        <div className="sm:pb-12 sm:pl-14">
          <div className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 shadow-[0_30px_60px_-30px_rgb(2_6_23_/_0.7)]">
            <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2">
              <Terminal className="size-3.5 text-[#38b6ff]" />
              <span className="text-[10px] font-semibold text-slate-200">Terminal</span>
              <span className="ml-auto font-mono text-[9px] text-slate-500">{c.host}</span>
            </div>
            <pre className="overflow-hidden whitespace-pre-wrap p-4 font-mono text-[10px] leading-relaxed text-slate-300">
{`deploy@${c.host}:~$ uptime
 load average: 0.08, 0.10, 0.09
deploy@${c.host}:~$ df -h /
Filesystem  Size  Used Avail Use%
/dev/vda1    80G   21G   59G  27%
deploy@${c.host}:~$ sudo systemctl status nginx
`}<span className="text-emerald-400">● nginx.service  active (running)</span>{`
deploy@${c.host}:~$ `}<span className="inline-block h-3 w-1.5 translate-y-0.5 bg-[#38b6ff]" />
            </pre>
          </div>
        </div>
        <Float className="sm:bottom-0 sm:left-0 sm:w-48">
          <p className="mb-2 text-[11px] font-semibold text-foreground">Server controls</p>
          <div className="flex flex-wrap gap-1.5">
            <UiButton variant="outline">Restart</UiButton>
            <UiButton variant="outline">Backups</UiButton>
            <UiButton variant="outline">Firewall</UiButton>
          </div>
        </Float>
      </ArtStage>
    );
  }
  return (
    <ArtStage tone={c.tone} label={`${c.menu} server overview with assigned resources`}>
      <div className="sm:pb-14 sm:pr-16">
        <NpanelWindow path="cloud-servers" active="cloud" title={`${c.host}.${DOMAIN}`} subtitle={`Cloud Servers · ${c.menu}`} action={<Pill>Running</Pill>}>
          <div className="grid gap-2.5 sm:grid-cols-[1fr_1fr]">
            <Panel title="Assigned resources" hint={c.note}>
              <div className="space-y-2">
                <Meter label={c.cpu} value={kind === "vps" ? 38 : 52} detail="In use" />
                <Meter label="Memory" value={46} tone="violet" detail="In use" />
                <Meter label="NVMe disk" value={27} tone="green" detail="In use" />
              </div>
            </Panel>
            <Panel title="Server" hint="Access and network">
              <KeyValues
                rows={[
                  ["OS", "Ubuntu LTS"],
                  ["IPv4", "203.0.113.18"],
                  ["Access", "SSH key"],
                  ["Billing", "Monthly"],
                ]}
              />
            </Panel>
          </div>
          {kind === "dedicated" && (
            <div className="mt-2.5 rounded-xl border border-border bg-card p-2">
              <ServerChassis />
            </div>
          )}
        </NpanelWindow>
      </div>
      <Float className="sm:bottom-0 sm:right-0 sm:w-48">
        <div className="mb-2 flex items-center gap-2">
          {kind === "dedicated" ? <HardDrive className="size-4 text-primary" /> : kind === "vds" ? <Cpu className="size-4 text-primary" /> : <MemoryStick className="size-4 text-primary" />}
          <p className="text-[11px] font-semibold text-foreground">{c.menu}</p>
        </div>
        <p className="text-[9px] leading-snug text-muted-foreground">{c.note}.</p>
        <div className="mt-2 flex gap-1.5">
          <UiButton><Terminal className="size-3" /> Console</UiButton>
          <UiButton variant="outline">Resize</UiButton>
        </div>
      </Float>
    </ArtStage>
  );
}

/** Sectigo SSL certificate status and domain validation steps. */
export function SslArt() {
  const steps = [
    ["Certificate request generated", true],
    ["Domain control validated", true],
    ["Certificate issued and installed", true],
  ] as const;
  return (
    <ArtStage tone="emerald" label="SSL certificate details with domain validation steps and secure browser address bar">
      <div className="sm:pb-14 sm:pr-14">
        <NpanelWindow path="ssl" active="hosting" title="SSL certificate" subtitle={`Sectigo · ${DOMAIN}`} action={<Pill>Active</Pill>}>
          <div className="grid gap-2.5 sm:grid-cols-[1fr_1.1fr]">
            <Panel title="Certificate" icon={ShieldCheck}>
              <KeyValues
                rows={[
                  ["Issuer", "Sectigo"],
                  ["Validation", "Domain (DV)"],
                  ["Covers", `www.${DOMAIN}`],
                  ["Renewal", "Reminder on"],
                ]}
              />
            </Panel>
            <Panel title="Domain validation" icon={FileText}>
              <ol className="space-y-1.5">
                {steps.map(([t]) => (
                  <li key={t} className="flex items-center gap-1.5 text-[10px] text-foreground">
                    <CheckCircle2 className="size-3.5 shrink-0 text-emerald-500" /> {t}
                  </li>
                ))}
              </ol>
            </Panel>
          </div>
        </NpanelWindow>
      </div>
      <Float className="sm:bottom-0 sm:right-0 sm:w-56">
        <div className="flex items-center gap-2 rounded-full bg-muted/70 px-3 py-1.5">
          <Lock className="size-3 text-emerald-500" />
          <span className="truncate font-mono text-[10px] text-foreground">https://{DOMAIN}</span>
        </div>
        <p className="mt-2 text-[9px] text-muted-foreground">Visitors connect over HTTPS.</p>
      </Float>
    </ArtStage>
  );
}
