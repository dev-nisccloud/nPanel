import {
  Bot,
  CheckCircle2,
  ChevronDown,
  CreditCard,
  Globe,
  LifeBuoy,
  Mail,
  Server,
  ShoppingCart,
  Terminal,
} from "lucide-react";
import { AgencyFlagshipArt } from "./flagship-art.tsx";
import { ArtReveal, ArtStage, ArtSwap, Float, NpanelWindow, Panel, Pill, Ring, UiButton } from "./kit.tsx";

/** All organisations, people and records below are fictional demonstration data. */

function Initials({ text, tone = "sky" }: { text: string; tone?: "sky" | "violet" | "emerald" | "amber" }) {
  const cls = {
    sky: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
    violet: "bg-primary/15 text-sky-700 dark:text-sky-300",
    emerald: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
    amber: "bg-amber-500/20 text-amber-700 dark:text-amber-300",
  }[tone];
  return (
    <span className={`flex size-7 shrink-0 items-center justify-center rounded-lg text-[9px] font-bold ${cls}`}>{text}</span>
  );
}

function OrgBadge({ initials, name, role }: { initials: string; name: string; role: string }) {
  return (
    <span className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-1.5 py-1">
      <Initials text={initials} />
      <span className="hidden min-w-0 min-[420px]:block">
        <span className="block truncate text-[9px] font-semibold text-foreground">{name}</span>
        <span className="block text-[8px] text-muted-foreground">{role}</span>
      </span>
      <ChevronDown className="size-3 text-muted-foreground" />
    </span>
  );
}

/** Businesses: one customer dashboard for domains, hosting, email, billing and support. */
export function NpanelBusinessArt() {
  const stats = [
    [Globe, "Domains", "2 active"],
    [Server, "Hosting", "1 active"],
    [CreditCard, "Invoices", "All paid"],
    [Mail, "Email", "4 mailboxes"],
  ] as const;
  return (
    <ArtStage tone="sky" label="nPanel customer dashboard connecting domains, hosting, email, billing, support and Zepo AI">
      <div className="sm:pb-12 sm:pr-12">
        <NpanelWindow
          path="savanna-bakery/dashboard"
          active="home"
          title="Welcome back, Amina"
          subtitle="Savanna Bakery"
          action={<OrgBadge initials="SB" name="Savanna Bakery" role="Owner" />}
        >
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {stats.map(([Icon, label, value]) => (
              <div key={label} className="rounded-xl border border-border bg-card p-2.5">
                <Icon className="size-3.5 text-primary" />
                <p className="mt-1.5 text-[9px] text-muted-foreground">{label}</p>
                <p className="text-[11px] font-semibold text-foreground">{value}</p>
              </div>
            ))}
          </div>
          <div className="mt-2.5 rounded-xl border border-primary/25 bg-gradient-to-r from-primary/10 to-transparent p-3">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-blue-600 text-white"><Bot className="size-3.5" /></span>
              <p className="text-[10px] text-foreground">Ask Zepo about domains, hosting, invoices or your account.</p>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {["Renew domain and hosting next year", "Set up business email for my team"].map((c) => (
                <span key={c} className="rounded-full border border-border bg-card px-2 py-0.5 text-[9px] text-foreground">{c}</span>
              ))}
            </div>
          </div>
          <div className="mt-2.5 flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 sm:mr-36">
            <LifeBuoy className="size-3.5 text-primary" />
            <span className="flex-1 text-[10px] font-medium text-foreground">Support &amp; Help</span>
            <Pill tone="sky">Reply received</Pill>
          </div>
        </NpanelWindow>
      </div>
      <Float className="sm:bottom-0 sm:right-0 sm:w-48">
        <p className="mb-1.5 text-[11px] font-semibold text-foreground">Your to-dos</p>
        {[["Verify your email", true], ["Complete organization billing info", true], ["Enable multi-factor authentication", false]].map(([t, done]) => (
          <p key={t as string} className="flex items-center gap-1.5 py-0.5 text-[9px] text-foreground">
            {done ? <CheckCircle2 className="size-3 shrink-0 text-emerald-500" /> : <span className="size-3 shrink-0 rounded-full border-2 border-primary" />}
            <span className={done ? "text-muted-foreground line-through" : ""}>{t as string}</span>
          </p>
        ))}
      </Float>
    </ArtStage>
  );
}

/** Developers: cloud servers by type plus a browser terminal session. */
export function NpanelDeveloperArt() {
  const servers = [
    ["web-01", "VPS Hosting", "Ubuntu LTS"],
    ["app-01", "VDS Hosting", "Ubuntu LTS"],
    ["db-01", "Dedicated Servers", "Debian"],
  ];
  return (
    <ArtStage tone="slate" label="nPanel cloud servers list with VPS, VDS and dedicated servers and a terminal session">
      <div className="sm:pb-28 sm:pr-10">
        <NpanelWindow path="cloud-servers" active="cloud" title="Cloud Servers" subtitle="VPS, VDS and dedicated servers" action={<UiButton action="server">Order server</UiButton>}>
          <div className="space-y-1.5">
            {servers.map(([host, type, os], i) => (
              <div key={host} className={`flex items-center gap-2 rounded-lg border bg-card px-3 py-2 ${i === 0 ? "border-primary/50 ring-1 ring-primary/20" : "border-border"}`}>
                <Server className="size-3.5 shrink-0 text-primary" />
                <span className="min-w-0 flex-1">
                  <span className="block font-mono text-[10px] font-semibold text-foreground">{host}</span>
                  <span className="block truncate text-[8px] text-muted-foreground">{type} · {os}</span>
                </span>
                <Pill>Running</Pill>
                <span className="hidden font-mono text-[9px] text-muted-foreground min-[420px]:inline">203.0.113.{18 + i}</span>
              </div>
            ))}
            <ArtReveal on="server" delay={300} className="flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/[0.06] px-3 py-2">
              <Server className="size-3.5 shrink-0 text-emerald-600" />
              <span className="min-w-0 flex-1">
                <span className="block font-mono text-[10px] font-semibold text-foreground">web-02</span>
                <span className="block truncate text-[8px] text-muted-foreground">VPS Hosting · Ubuntu LTS</span>
              </span>
              <ArtSwap on="server" delay={1500} before={<Pill tone="sky">Provisioning</Pill>} after={<Pill>Running</Pill>} />
              <span className="hidden font-mono text-[9px] text-muted-foreground min-[420px]:inline">203.0.113.21</span>
            </ArtReveal>
          </div>
          <div className="mt-2.5 grid grid-cols-3 gap-1.5">
            {["Firewall", "Backups", "DNS"].map((t) => (
              <span key={t} className="rounded-lg bg-primary/[0.07] px-2 py-1.5 text-center text-[9px] font-medium text-foreground">{t}</span>
            ))}
          </div>
        </NpanelWindow>
      </div>
      <Float className="border-slate-700 bg-slate-950 p-0 sm:bottom-0 sm:left-10 sm:right-0">
        <div className="flex items-center gap-2 border-b border-white/10 px-3 py-1.5">
          <Terminal className="size-3 text-sky-400" />
          <span className="text-[9px] font-semibold text-slate-200">SSH terminal · web-01</span>
        </div>
        <pre className="whitespace-pre-wrap px-3 py-2 font-mono text-[9.5px] leading-relaxed text-slate-300">
{`deploy@web-01:~$ systemctl status nginx
`}<span className="text-emerald-400">● nginx.service  active (running)</span>{`
deploy@web-01:~$ `}<span className="inline-block h-2.5 w-1.5 translate-y-0.5 bg-sky-400" />
        </pre>
      </Float>
    </ArtStage>
  );
}

/** Agencies: one agency account, separate organisations per client. */
export function NpanelAgencyArt() {
  return <AgencyFlagshipArt />;
}

/** Operations: what needs attention across orders, billing and support. */
export function NpanelOperationsArt() {
  const attention = [
    ["Open tickets", "sky"],
    ["Expired domains", "rose"],
    ["Pending quotations", "amber"],
    ["Failed payments", "rose"],
  ] as const;
  return (
    <ArtStage tone="slate" label="nPanel agency operations: items needing attention, service orders and support tickets">
      <div className="sm:pb-12 sm:pr-14">
        <NpanelWindow path="agency/dashboard" active="home" title="Agency dashboard" subtitle="Operations overview">
          <div className="grid gap-2.5 sm:grid-cols-[1fr_1.2fr]">
            <Panel title="Needs attention">
              {attention.map(([t, tone]) => (
                <p key={t} className="flex items-center gap-2 border-t border-border/60 py-1.5 text-[10px] first:border-0">
                  <span className={`size-1.5 rounded-full ${tone === "rose" ? "bg-rose-500" : tone === "amber" ? "bg-amber-500" : "bg-sky-500"}`} />
                  <span className="flex-1 text-foreground">{t}</span>
                  <span className="text-[9px] text-primary">Review</span>
                </p>
              ))}
            </Panel>
            <Panel title="Service orders" icon={ShoppingCart}>
              {[["Acacia Traders", "Completed", "green"], ["Jambo Clinic", "Completed", "green"], ["Rift Logistics", "Pending", "amber"]].map(([org, s, tone]) => (
                <p key={org} className="flex items-center gap-2 border-t border-border/60 py-1.5 text-[10px] first:border-0">
                  <span className="flex-1 truncate text-foreground">{org}</span>
                  <Pill tone={tone as "green"}>{s}</Pill>
                </p>
              ))}
            </Panel>
          </div>
          <div className="mt-2.5 grid grid-cols-3 gap-2">
            {[["Portfolio health", 86, "green"], ["Support queue", 40, "sky"], ["Pipeline", 62, "violet"]].map(([l, v, tone]) => (
              <div key={l as string} className="flex items-center gap-2 rounded-xl border border-border bg-card p-2">
                <Ring value={v as number} tone={tone as "sky"} size={30} />
                <span className="text-[9px] leading-tight text-muted-foreground">{l as string}</span>
              </div>
            ))}
          </div>
        </NpanelWindow>
      </div>
      <Float className="sm:bottom-0 sm:right-0 sm:w-52">
        <p className="flex items-center gap-1.5 text-[10px] font-semibold text-foreground"><LifeBuoy className="size-3.5 text-primary" /> Support ticket</p>
        <p className="mt-1 text-[9px] text-muted-foreground">Email setup for new staff</p>
        <div className="mt-1.5 flex gap-1.5"><Pill tone="sky">In progress</Pill><Pill tone="slate">Normal</Pill></div>
      </Float>
    </ArtStage>
  );
}

/** Run my business online: a domain, hosting and email connected and managed in nPanel. */
export function RunOnlineArt() {
  const chain = [
    [Globe, "Domain", "savannabakery.co.ke", "Active"],
    [Server, "Website hosting", "SSL enabled", "Active"],
    [Mail, "Business email", "info@savannabakery.co.ke", "Active"],
  ] as const;
  return (
    <ArtStage tone="emerald" label="A domain, website hosting and business email connected and managed in nPanel">
      <div className="relative mx-auto max-w-[420px]">
        <span aria-hidden className="absolute bottom-6 left-[27px] top-6 w-0.5 bg-gradient-to-b from-primary via-emerald-400 to-brand-orange" />
        <div className="space-y-3">
          {chain.map(([Icon, label, detail, status]) => (
            <div key={label} className="relative flex items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-[0_16px_32px_-24px_rgb(14_87_118_/_0.6)]">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Icon className="size-4" /></span>
              <span className="min-w-0 flex-1">
                <span className="block text-[12px] font-semibold text-foreground">{label}</span>
                <span className="block truncate font-mono text-[10px] text-muted-foreground">{detail}</span>
              </span>
              <Pill>{status}</Pill>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between gap-2 rounded-2xl border border-primary/30 bg-primary/10 px-3 py-2">
          <span className="flex items-center gap-2 text-[11px] font-semibold text-foreground">
            <img src="/nisciconoriginal.png" alt="" width={20} height={13} className="w-5" /> Managed in nPanel
          </span>
          <span className="text-[9px] text-muted-foreground">Billing and renewals in one account</span>
        </div>
      </div>
    </ArtStage>
  );
}
