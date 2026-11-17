import * as React from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Clock,
  KeyRound,
  Loader2,
  Lock,
  LockOpen,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/cn";
export type TransferBlockerCode =
  | "registrar_lock"
  | "registry_lock"
  | "recently_registered"
  | "recently_transferred"
  | "pending_transfer"
  | "redemption"
  | "pending_delete";

export type TransferDetails = {
  registrar: string | null;
  registrarUrl: string | null;
  registeredAt: string | null;
  expiresAt: string | null;
  lastTransferredAt: string | null;
  statuses: string[];
  blockers: TransferBlockerCode[];
  warnings: Array<"expired" | "expiring_soon">;
  eligibleFrom: string | null;
  checkedAt: string;
};

/** Subset of `domainTransfer.checkTransfer` this report reads. */
export type CheckTransferResult = {
  transferStatus: string;
  transferrable: boolean;
  domain: string | null;
  error: string | null;
  details?: TransferDetails | null;
};

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});
const timeFormat = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" });

function formatDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : dateFormat.format(date);
}

function formatTime(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : timeFormat.format(date);
}

type Tone = "ready" | "waiting" | "blocked";

/** "Example, Inc." would end a sentence with two full stops. */
function inSentence(name: string): string {
  return name.replace(/\.$/, "");
}

const BLOCKER_TONE: Record<TransferBlockerCode, Tone> = {
  registrar_lock: "waiting",
  registry_lock: "waiting",
  recently_registered: "waiting",
  recently_transferred: "waiting",
  pending_transfer: "blocked",
  redemption: "blocked",
  pending_delete: "blocked",
};

function blockerCopy(
  code: TransferBlockerCode,
  registrar: string,
  eligibleFrom: string | null,
): { title: string; body: string } {
  const from = eligibleFrom ? ` You can transfer it from ${eligibleFrom}.` : "";
  switch (code) {
    case "registrar_lock":
      return {
        title: "Transfer lock is on",
        body: `${registrar} has a transfer lock on this domain. Turn it off in your account there, then check again.`,
      };
    case "registry_lock":
      return {
        title: "Registry lock is on",
        body: `The registry has locked this domain, usually at the owner's request. Only ${registrar} can ask for it to be removed, so contact their support.`,
      };
    case "recently_registered":
      return {
        title: "Registered less than 60 days ago",
        body: `A domain can't move to a new registrar in the first 60 days after it is registered.${from}`,
      };
    case "recently_transferred":
      return {
        title: "Transferred less than 60 days ago",
        body: `A domain can't move again in the first 60 days after a transfer.${from}`,
      };
    case "pending_transfer":
      return {
        title: "A transfer is already in progress",
        body: `Another transfer for this domain is underway. If you didn't start it, contact ${registrar} straight away.`,
      };
    case "redemption":
      return {
        title: "Expired and in redemption",
        body: `This domain expired and is waiting to be deleted. Only ${registrar} can restore it, usually for a restore fee. Restore it first, then check again.`,
      };
    case "pending_delete":
      return {
        title: "About to be deleted",
        body: "The registry will delete this domain soon and it can't be transferred or restored. Once it's deleted, you may be able to register it again.",
      };
  }
}

function Fact({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 truncate text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}

function Steps({ items }: { items: React.ReactNode[] }) {
  return (
    <ol className="mt-2 space-y-1.5 text-sm text-muted-foreground">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2">
          <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground">
            {i + 1}
          </span>
          <span className="min-w-0">{item}</span>
        </li>
      ))}
    </ol>
  );
}

function Guide({
  icon: Icon,
  title,
  defaultOpen,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details open={defaultOpen} className="group rounded-lg border border-border/70 bg-background/60">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2.5 text-sm font-semibold text-foreground [&::-webkit-details-marker]:hidden">
        <Icon className="size-4 shrink-0 text-primary" />
        <span className="flex-1">{title}</span>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180 motion-reduce:transition-none" />
      </summary>
      <div className="px-3 pb-3">{children}</div>
    </details>
  );
}

export function UnlockGuide({ registrar: rawRegistrar, defaultOpen }: { registrar: string; defaultOpen?: boolean }) {
  const registrar = inSentence(rawRegistrar);
  return (
    <Guide icon={LockOpen} title="How to unlock your domain" defaultOpen={defaultOpen}>
      <Steps
        items={[
          <>Sign in to your account at {registrar}.</>,
          <>Open this domain&apos;s settings, often called Domain management or Manage domain.</>,
          <>
            Turn off the setting called <strong className="text-foreground">Domain lock</strong>,{" "}
            <strong className="text-foreground">Registrar lock</strong> or{" "}
            <strong className="text-foreground">Transfer lock</strong>.
          </>,
          <>Come back here and press Check again. Registry updates can take a few minutes to show.</>,
        ]}
      />
    </Guide>
  );
}

export function EppGuide({ registrar: rawRegistrar, defaultOpen }: { registrar: string; defaultOpen?: boolean }) {
  const registrar = inSentence(rawRegistrar);
  return (
    <Guide icon={KeyRound} title="How to get your EPP (transfer) code" defaultOpen={defaultOpen}>
      <Steps
        items={[
          <>In the same domain settings at {registrar}, look for Auth code, EPP code or Transfer code.</>,
          <>Reveal or request the code. Some registrars email it to the domain owner&apos;s address, so make sure you can read that inbox.</>,
          <>Keep it ready. You&apos;ll enter it after checkout to start the transfer.</>,
        ]}
      />
    </Guide>
  );
}

function isRegistrarLocked(result: CheckTransferResult): boolean {
  return result.details
    ? result.details.blockers.includes("registrar_lock")
    : result.transferStatus === "locked";
}

/** Tell the customer what changed when they re-check the same domain. */
export function announceRecheck(
  previous: CheckTransferResult | null,
  next: CheckTransferResult,
): void {
  if (!previous || previous.transferrable) return;
  if (previous.domain?.toLowerCase() !== next.domain?.toLowerCase()) return;
  if (next.transferrable) {
    toast.success(`${next.domain} is ready to transfer`, {
      description: "The registry now shows the domain as unlocked.",
    });
  } else if (isRegistrarLocked(previous) && isRegistrarLocked(next)) {
    toast("Still locked", {
      description: "Registry updates can take a few minutes. Try again shortly.",
    });
  }
}

type TransferCheckReportProps = {
  result: CheckTransferResult;
  onCheckAgain: () => void;
  checking?: boolean;
  className?: string;
};

/** Registry facts, blockers with fixes, and a fresh re-check for a domain transfer. */
export function TransferCheckReport({
  result,
  onCheckAgain,
  checking = false,
  className,
}: TransferCheckReportProps) {
  const details: TransferDetails | null = result.details ?? null;
  const blockers: TransferBlockerCode[] =
    details?.blockers ?? (result.transferStatus === "locked" ? ["registrar_lock"] : []);
  const registrarName = inSentence(details?.registrar ?? "your current registrar");
  const eligibleFrom = formatDate(details?.eligibleFrom);
  const expires = formatDate(details?.expiresAt);
  const ready = result.transferrable && blockers.length === 0;
  const tone: Tone = ready
    ? "ready"
    : blockers.some((b) => BLOCKER_TONE[b] === "blocked") || blockers.length === 0
      ? "blocked"
      : "waiting";
  const locked = blockers.includes("registrar_lock") || blockers.includes("registry_lock");
  const showLockGuides = blockers.includes("registrar_lock");

  const headline = ready
    ? result.transferStatus === "pending_check"
      ? "No transfer blockers found"
      : "Ready to transfer"
    : tone === "waiting"
      ? locked && blockers.length === 1
        ? "Locked, almost there"
        : "Not ready to transfer yet"
      : "This domain can't transfer";

  return (
    <section
      aria-live="polite"
      className={cn(
        "rounded-xl border p-4 text-left",
        tone === "ready" && "border-emerald-500/30 bg-emerald-500/5",
        tone === "waiting" && "border-amber-500/30 bg-amber-500/5",
        tone === "blocked" && "border-destructive/30 bg-destructive/5",
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 gap-3">
          {tone === "ready" ? (
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          ) : tone === "waiting" ? (
            locked ? (
              <Lock className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" />
            ) : (
              <Clock className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" />
            )
          ) : (
            <ShieldAlert className="mt-0.5 size-5 shrink-0 text-destructive" />
          )}
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-foreground">{headline}</h3>
            <p className="truncate text-sm text-muted-foreground">{result.domain}</p>
          </div>
        </div>
        {!ready && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8 rounded-full px-3 text-xs"
            onClick={onCheckAgain}
            disabled={checking}
          >
            {checking ? (
              <Loader2 className="mr-1.5 size-3.5 animate-spin" />
            ) : (
              <RefreshCw className="mr-1.5 size-3.5" />
            )}
            {checking ? "Checking…" : "Check again"}
          </Button>
        )}
      </div>

      {details && (
        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 rounded-lg border border-border/60 bg-background/60 p-3 sm:grid-cols-4">
          <Fact
            label="Current registrar"
            value={
              details.registrarUrl && details.registrar ? (
                <a
                  href={details.registrarUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {details.registrar}
                </a>
              ) : (
                (details.registrar ?? "Not published")
              )
            }
          />
          <Fact
            label="Transfer lock"
            value={
              locked ? (
                <span className="text-amber-700 dark:text-amber-400">Locked</span>
              ) : (
                <span className="text-emerald-700 dark:text-emerald-400">Unlocked</span>
              )
            }
          />
          <Fact label="Registered" value={formatDate(details.registeredAt) ?? "Not published"} />
          <Fact
            label="Expires"
            value={
              details.warnings.includes("expired") ? (
                <span className="text-destructive">Expired {expires}</span>
              ) : (
                (expires ?? "Not published")
              )
            }
          />
        </dl>
      )}

      {blockers.length > 0 && (
        <ul className="mt-4 space-y-3">
          {blockers.map((code) => {
            const copy = blockerCopy(code, registrarName, eligibleFrom);
            return (
              <li key={code} className="text-sm">
                <p className="font-semibold text-foreground">{copy.title}</p>
                <p className="mt-0.5 text-muted-foreground">{copy.body}</p>
              </li>
            );
          })}
        </ul>
      )}

      {!ready && blockers.length === 0 && result.error && (
        <p className="mt-3 text-sm text-muted-foreground">{result.error}</p>
      )}

      {details?.warnings.includes("expired") && (
        <p className="mt-3 flex gap-2 text-sm text-muted-foreground">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <span>
            This domain expired on {expires}. Renew it at {registrarName} first so it isn&apos;t lost while
            the transfer is processed.
          </span>
        </p>
      )}
      {details?.warnings.includes("expiring_soon") && (
        <p className="mt-3 flex gap-2 text-sm text-muted-foreground">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <span>
            This domain expires on {expires}. A transfer can take up to 5 days, so consider renewing at{" "}
            {registrarName} first.
          </span>
        </p>
      )}

      {(showLockGuides || ready) && (
        <div className="mt-4 space-y-2">
          {showLockGuides && <UnlockGuide registrar={registrarName} defaultOpen />}
          <EppGuide registrar={registrarName} defaultOpen={false} />
        </div>
      )}

      {details?.checkedAt && (
        <p className="mt-3 text-xs text-muted-foreground">
          Live registry check at {formatTime(details.checkedAt)}
        </p>
      )}
    </section>
  );
}
