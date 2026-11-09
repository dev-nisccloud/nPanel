import { motion, useReducedMotion } from "motion/react";
import {
  Ban,
  Check,
  FileWarning,
  Inbox,
  MailWarning,
  Paperclip,
  ShieldCheck,
  Trash2,
} from "lucide-react";

/*
 * Email Security artwork.
 *  EmailGateArtwork   – hero: incoming mail passes a filter gate; clean mail reaches the inbox,
 *                       threats drop into quarantine. Composed as a left-to-right flow, not a window.
 *  EmailSecurityScreen – laptop screen: domain authentication, quarantine queue, today's totals.
 * Every sender, subject and number below is fictional. Domains use reserved or made-up names only.
 */

const SKY = "#38b6ff";
const ORANGE = "#fc734d";

type Verdict = "delivered" | "phishing" | "malware" | "spam";

const incoming: { from: string; subject: string; verdict: Verdict; reason: string }[] = [
  {
    from: "accounts@acacia-traders.co.ke",
    subject: "Invoice INV-2041 for October",
    verdict: "delivered",
    reason: "SPF and DKIM pass",
  },
  {
    from: "it-support@yourbusiness-co-ke.com",
    subject: "Urgent: verify your mailbox today",
    verdict: "phishing",
    reason: "Lookalike domain",
  },
  {
    from: "noreply@delivery-notice.example",
    subject: "Payment_confirmation.zip",
    verdict: "malware",
    reason: "Dangerous attachment",
  },
  {
    from: "promo@bulk-offers.example",
    subject: "Last chance: 90% off everything",
    verdict: "spam",
    reason: "Bulk sender",
  },
];

const verdictStyle: Record<Verdict, { label: string; className: string; icon: typeof Check }> = {
  delivered: {
    label: "Delivered",
    className: "bg-emerald-500/12 text-emerald-700 ring-emerald-500/25 dark:text-emerald-300",
    icon: Check,
  },
  phishing: {
    label: "Quarantined",
    className: "bg-brand-orange/15 text-foreground ring-brand-orange/30",
    icon: MailWarning,
  },
  malware: {
    label: "Blocked",
    className: "bg-rose-500/12 text-rose-700 ring-rose-500/25 dark:text-rose-300",
    icon: FileWarning,
  },
  spam: {
    label: "Spam",
    className: "bg-slate-500/10 text-slate-600 ring-slate-500/20 dark:text-slate-300",
    icon: Ban,
  },
};

const seals = [
  { key: "SPF", status: "Pass" },
  { key: "DKIM", status: "Signed" },
  { key: "DMARC", status: "Aligned" },
];

export function EmailGateArtwork() {
  const reduceMotion = useReducedMotion() ?? false;
  const stagger = (i: number) => (reduceMotion ? 0 : 0.35 + i * 0.3);

  return (
    <figure
      role="img"
      aria-label="Four incoming emails pass through a filter gate that checks SPF, DKIM and DMARC. One legitimate invoice is delivered; a phishing message, a malware attachment and spam are held or blocked."
      className="relative mx-auto w-full max-w-[600px] overflow-hidden rounded-[28px] bg-gradient-to-br from-sky-200/70 via-sky-100/40 to-slate-100/30 p-4 sm:p-6 dark:from-sky-500/20 dark:via-sky-500/5 dark:to-slate-500/10"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40 dark:opacity-20"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, rgb(14 87 118 / 0.18) 1px, transparent 0)",
          backgroundSize: "22px 22px",
          maskImage: "radial-gradient(ellipse 80% 70% at 50% 40%, black, transparent)",
        }}
      />

      <div aria-hidden className="relative grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
        {/* incoming stream */}
        <ul className="space-y-2">
          {incoming.map((mail, i) => (
              <motion.li
                key={mail.from}
                initial={reduceMotion ? false : { opacity: 0, x: -14 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: reduceMotion ? 0 : 0.1 + i * 0.12, duration: 0.4 }}
                className="rounded-xl border border-border bg-card px-3 py-2 shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    {mail.verdict === "malware" ? <Paperclip className="size-3" /> : <Inbox className="size-3" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] font-semibold text-foreground">{mail.subject}</p>
                    <p className="truncate font-mono text-[9px] text-muted-foreground">{mail.from}</p>
                  </div>
                </div>
              </motion.li>
          ))}
        </ul>

        {/* the gate */}
        <div className="relative mx-auto flex flex-col items-center gap-2 py-2 sm:px-2">
          <motion.div
            aria-hidden
            className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-primary to-transparent"
            animate={reduceMotion ? undefined : { opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          />
          <span className="relative flex size-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30">
            <ShieldCheck className="size-5" />
          </span>
          {seals.map((seal, i) => (
            <motion.span
              key={seal.key}
              initial={reduceMotion ? false : { opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: reduceMotion ? 0 : 0.5 + i * 0.15 }}
              className="relative flex w-[76px] items-center justify-between rounded-full border border-primary/30 bg-card px-2 py-1 text-[9px] font-semibold text-foreground"
            >
              {seal.key}
              <span className="text-[8px] font-medium text-emerald-600 dark:text-emerald-400">{seal.status}</span>
            </motion.span>
          ))}
        </div>

        {/* outcomes */}
        <div className="space-y-2">
          <div className="rounded-xl border border-emerald-500/30 bg-card p-3 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-foreground">Inbox</span>
              <span className="font-mono text-[9px] text-muted-foreground">hello@yourbusiness.co.ke</span>
            </div>
            {incoming
              .filter((m) => m.verdict === "delivered")
              .map((mail) => (
                <motion.div
                  key={mail.from}
                  initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: stagger(0) }}
                  className="flex items-center gap-2 rounded-lg bg-emerald-500/10 px-2 py-1.5"
                >
                  <Check className="size-3 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span className="min-w-0 flex-1 truncate text-[10px] font-medium text-foreground">{mail.subject}</span>
                  <span className="text-[8px] text-muted-foreground">{mail.reason}</span>
                </motion.div>
              ))}
          </div>

          <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-foreground">Held before the inbox</span>
              <span className="rounded-full bg-brand-orange/15 px-1.5 py-0.5 text-[8px] font-semibold text-foreground">
                3 messages
              </span>
            </div>
            <ul className="space-y-1.5">
              {incoming
                .filter((m) => m.verdict !== "delivered")
                .map((mail, i) => {
                  const v = verdictStyle[mail.verdict];
                  const Icon = v.icon;
                  return (
                    <motion.li
                      key={mail.from}
                      initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: stagger(i + 1) }}
                      className="flex items-center gap-2"
                    >
                      <span
                        className={`inline-flex shrink-0 items-center gap-1 rounded-full px-1.5 py-0.5 text-[8px] font-semibold ring-1 ring-inset ${v.className}`}
                      >
                        <Icon className="size-2.5" />
                        {v.label}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[9px] text-muted-foreground">{mail.reason}</span>
                    </motion.li>
                  );
                })}
            </ul>
          </div>
        </div>
      </div>
    </figure>
  );
}

/* ── laptop screen ─────────────────────────────────────────────────────────── */

const quarantine = [
  { from: "it-support@yourbusiness-co-ke.com", subject: "Urgent: verify your mailbox today", reason: "Lookalike domain" },
  { from: "noreply@delivery-notice.example", subject: "Payment_confirmation.zip", reason: "Dangerous attachment" },
  { from: "ceo.office@fastmail-relay.example", subject: "Can you process this transfer now?", reason: "Executive impersonation" },
  { from: "promo@bulk-offers.example", subject: "Last chance: 90% off everything", reason: "Bulk sender" },
];

const totals = [
  { label: "Delivered", value: "318", color: "#10b981" },
  { label: "Quarantined", value: "12", color: ORANGE },
  { label: "Attachments blocked", value: "3", color: "#f43f5e" },
];

export function EmailSecurityScreen() {
  const reduceMotion = useReducedMotion() ?? false;

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-[#f7fafc] text-slate-800 select-none">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 15% 0%, rgba(56,182,255,0.12), transparent 55%), radial-gradient(ellipse 50% 40% at 95% 100%, rgba(252,115,77,0.07), transparent 50%)",
        }}
      />

      <header className="relative z-10 flex h-7 shrink-0 items-center justify-between border-b border-slate-200/80 bg-white/80 px-3 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <img src="/nisccloud-logo.svg" alt="" className="h-4 w-auto object-contain object-left" />
          <span className="h-2.5 w-px bg-slate-200" />
          <span className="text-[8px] font-medium text-slate-500">Email Security</span>
          <span className="text-[8px] text-slate-400">yourbusiness.co.ke</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 ring-1 ring-emerald-100">
          <span className="size-1.5 rounded-full bg-emerald-500" />
          <span className="text-[8px] font-semibold text-emerald-700">Filtering active</span>
        </div>
      </header>

      <div className="relative z-10 grid min-h-0 flex-1 grid-cols-[8.5rem_1fr] gap-2.5 px-3 py-2.5">
        {/* left column */}
        <div className="flex min-h-0 flex-col gap-2">
          <div className="rounded-xl bg-white/90 p-2.5 ring-1 ring-slate-200/70">
            <p className="text-[7px] font-medium uppercase tracking-wider text-slate-400">Domain authentication</p>
            <ul className="mt-1.5 space-y-1.5">
              {seals.map((seal, i) => (
                <motion.li
                  key={seal.key}
                  initial={reduceMotion ? false : { opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: reduceMotion ? 0 : 0.15 + i * 0.1 }}
                  className="flex items-center justify-between rounded-md bg-slate-50 px-2 py-1 ring-1 ring-slate-100"
                >
                  <span className="text-[9px] font-semibold text-slate-700">{seal.key}</span>
                  <span className="flex items-center gap-1 text-[8px] font-medium text-emerald-600">
                    <Check className="size-2.5" />
                    {seal.status}
                  </span>
                </motion.li>
              ))}
            </ul>
            <p className="mt-1.5 text-[7px] leading-snug text-slate-400">
              Messages claiming to be from your domain must pass these checks.
            </p>
          </div>

          <div className="flex-1 rounded-xl bg-white/90 p-2.5 ring-1 ring-slate-200/70">
            <p className="text-[7px] font-medium uppercase tracking-wider text-slate-400">Today</p>
            <ul className="mt-1.5 space-y-1.5">
              {totals.map((t) => (
                <li key={t.label} className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[8px] text-slate-500">
                    <span className="size-1.5 rounded-full" style={{ backgroundColor: t.color }} />
                    {t.label}
                  </span>
                  <span className="text-[10px] font-bold tabular-nums text-slate-800">{t.value}</span>
                </li>
              ))}
            </ul>
            <div className="mt-2 flex h-1.5 overflow-hidden rounded-full bg-slate-100">
              <span className="h-full" style={{ width: "95.5%", backgroundColor: "#10b981" }} />
              <span className="h-full" style={{ width: "3.6%", backgroundColor: ORANGE }} />
              <span className="h-full" style={{ width: "0.9%", backgroundColor: "#f43f5e" }} />
            </div>
          </div>
        </div>

        {/* quarantine queue */}
        <div className="flex min-h-0 flex-col rounded-xl bg-white/90 ring-1 ring-slate-200/70">
          <div className="flex items-center justify-between border-b border-slate-100 px-2.5 py-1.5">
            <span className="flex items-center gap-1.5 text-[9px] font-semibold text-slate-700">
              <MailWarning className="size-3" style={{ color: ORANGE }} />
              Quarantine
            </span>
            <span className="text-[7px] text-slate-400">Review, release or delete</span>
          </div>
          <ul className="min-h-0 flex-1 divide-y divide-slate-100">
            {quarantine.map((q, i) => (
              <motion.li
                key={q.from}
                initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: reduceMotion ? 0 : 0.2 + i * 0.1 }}
                className="flex items-center gap-2 px-2.5 py-1.5"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[9px] font-semibold text-slate-800">{q.subject}</p>
                  <p className="truncate font-mono text-[7px] text-slate-400">{q.from}</p>
                </div>
                <span
                  className="hidden shrink-0 rounded-full px-1.5 py-0.5 text-[7px] font-semibold text-slate-800 sm:inline"
                  style={{ backgroundColor: "rgba(252,115,77,0.16)" }}
                >
                  {q.reason}
                </span>
                <span className="flex shrink-0 items-center gap-1">
                  <span className="rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[7px] font-semibold text-slate-600">
                    Release
                  </span>
                  <span className="flex size-4 items-center justify-center rounded-md bg-slate-50 text-slate-400">
                    <Trash2 className="size-2.5" />
                  </span>
                </span>
              </motion.li>
            ))}
          </ul>
          <div className="flex items-center gap-2 border-t border-slate-100 px-2.5 py-1.5">
            <span className="size-1.5 rounded-full" style={{ backgroundColor: SKY }} />
            <p className="text-[7px] text-slate-500">
              Review held messages, release false positives and allow-list trusted senders from here.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
