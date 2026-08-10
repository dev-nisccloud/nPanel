"use client";

import * as React from "react";
import {
  Globe,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  HelpCircle,
  Building2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { AgentDomainsPortfolioResult, AgentPortfolioDomainEntry } from "@/stores/zeepo-payment-store";

// ── Helpers ────────────────────────────────────────────────────────────────

function formatDate(iso: string | null): string {
  if (!iso) return "-";
  try {
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const diff = new Date(iso).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// ── Status badge ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: AgentPortfolioDomainEntry["status"] }) {
  switch (status) {
    case "ACTIVE":
      return (
        <Badge variant="outline" className="gap-1 shrink-0 border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="h-3 w-3" />
          Active
        </Badge>
      );
    case "EXPIRED":
      return (
        <Badge variant="outline" className="gap-1 shrink-0 border-destructive/30 bg-destructive/10 text-destructive">
          <XCircle className="h-3 w-3" />
          Expired
        </Badge>
      );
    case "PENDING":
      return (
        <Badge variant="outline" className="gap-1 shrink-0 border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400">
          <Clock className="h-3 w-3" />
          Pending
        </Badge>
      );
    case "SUSPENDED":
      return (
        <Badge variant="outline" className="gap-1 shrink-0 border-orange-500/30 bg-orange-500/10 text-orange-700 dark:text-orange-400">
          <AlertTriangle className="h-3 w-3" />
          Suspended
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="gap-1 shrink-0 text-muted-foreground">
          <HelpCircle className="h-3 w-3" />
          Unknown
        </Badge>
      );
  }
}

// ── Single domain row ──────────────────────────────────────────────────────

function DomainRow({ entry }: { entry: AgentPortfolioDomainEntry }) {
  const days = daysUntil(entry.expiryDate);
  const expiringSoon = days !== null && days > 0 && days <= 30;
  const isExpired = entry.status === "EXPIRED";

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 transition-colors",
        isExpired
          ? "bg-destructive/5 opacity-75"
          : expiringSoon
            ? "bg-amber-500/5"
            : "bg-muted/30 hover:bg-muted/50",
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <Globe className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-foreground">
            {entry.domain}
          </span>
          {entry.clientName && (
            <span className="block truncate text-[11px] text-muted-foreground">
              {entry.clientName}
            </span>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {expiringSoon && (
          <span className="hidden text-[10px] font-semibold text-amber-600 dark:text-amber-400 sm:block">
            {days}d left
          </span>
        )}
        {entry.expiryDate && !expiringSoon && (
          <span className="hidden text-[10px] text-muted-foreground tabular-nums sm:block">
            {formatDate(entry.expiryDate)}
          </span>
        )}
        <StatusBadge status={entry.status} />
      </div>
    </div>
  );
}

// ── Source section ─────────────────────────────────────────────────────────

function SourceSection({
  label,
  entries,
}: {
  label: string;
  entries: AgentPortfolioDomainEntry[];
}) {
  if (entries.length === 0) return null;
  return (
    <div className="flex flex-col gap-1">
      <p className="px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      {entries.map((e) => (
        <DomainRow key={e.domain} entry={e} />
      ))}
    </div>
  );
}

// ── Main card ──────────────────────────────────────────────────────────────

interface ZeepoDomainsPortfolioCardProps {
  result: AgentDomainsPortfolioResult;
}

function isKeDomain(domain: string): boolean {
  return /\.ke$/i.test(domain.trim());
}

export function ZeepoDomainsPortfolioCard({ result }: ZeepoDomainsPortfolioCardProps) {
  const domains = Array.isArray(result.domains) ? result.domains : [];
  // Prefer explicit source when present; otherwise infer .ke vs gTLD for agency grouping.
  const opDomains = domains.filter(
    (d) => d.source === "openprovider" || (!d.source && !isKeDomain(d.domain)),
  );
  const kenicDomains = domains.filter(
    (d) => d.source === "kenic" || (!d.source && isKeDomain(d.domain)),
  );
  // Customer payloads may omit source entirely — fall back to the full list.
  const customerDomains =
    domains.filter((d) => d.source === "subscription").length > 0
      ? domains.filter((d) => d.source === "subscription")
      : domains;

  const expiringSoon = domains.filter((d) => {
    const days = daysUntil(d.expiryDate);
    return days !== null && days > 0 && days <= 30;
  });

  const totalCount = result.totalCount || domains.length;

  return (
    <div className="w-full rounded-2xl rounded-bl-md border bg-card shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-primary shrink-0" />
          <span className="text-sm font-semibold text-foreground">
            {result.isAgency ? "Domains Portfolio" : "Your Domains"}
          </span>
          {totalCount > 0 && (
            <Badge className="h-5 bg-primary/10 text-primary hover:bg-primary/10 text-[10px] px-1.5 border-primary/20">
              {totalCount}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {result.activeCount > 0 && (
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
              {result.activeCount} active
            </span>
          )}
          {result.expiredCount > 0 && (
            <span className="text-[10px] text-destructive font-medium">
              {result.expiredCount} expired
            </span>
          )}
        </div>
      </div>

      {/* Customer context banner */}
      {!result.isAgency && result.teamName && (
        <div className="flex items-center gap-2 border-b bg-muted/20 px-4 py-2">
          <Building2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">
            Domains registered under{" "}
            <span className="font-semibold text-foreground">{result.teamName}</span>
          </p>
        </div>
      )}

      {/* Expiring soon banner */}
      {expiringSoon.length > 0 && (
        <div className="flex items-center gap-2 border-b bg-amber-500/10 px-4 py-2">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
          <p className="text-xs text-amber-700 dark:text-amber-400">
            {expiringSoon.length === 1
              ? `${expiringSoon[0]!.domain} expires within 30 days`
              : `${expiringSoon.length} domains expire within 30 days`}
          </p>
        </div>
      )}

      {/* Domain rows — API may omit `source`; never filter the list away */}
      <div className="flex flex-col gap-3 p-3">
        {domains.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            {result.isAgency
              ? "No domains found in the portfolio."
              : "No domains found for this organisation."}
          </p>
        ) : result.isAgency ? (
          opDomains.length === 0 && kenicDomains.length === 0 ? (
            <div className="flex flex-col gap-1">
              {domains.map((e) => (
                <DomainRow key={e.domain} entry={e} />
              ))}
            </div>
          ) : (
            <>
              <SourceSection label="Global TLDs" entries={opDomains} />
              {opDomains.length > 0 && kenicDomains.length > 0 ? <Separator /> : null}
              <SourceSection label="Local" entries={kenicDomains} />
            </>
          )
        ) : (
          <div className="flex flex-col gap-1">
            {customerDomains.map((e) => (
              <DomainRow key={e.domain} entry={e} />
            ))}
          </div>
        )}
      </div>

      {/* Footer for hasMore */}
      {result.hasMore && (
        <div className="border-t px-4 py-2.5">
          <p className="text-xs text-muted-foreground">
            Showing the first 100 global TLD domains. Visit Domains Portfolio to see all.
          </p>
        </div>
      )}
    </div>
  );
}
