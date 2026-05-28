"use client";

import * as React from "react";
import { ShoppingCart, Globe, CheckCircle2, XCircle, HelpCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  useZeepoPaymentHandler,
  type AgentDomainCheckEntry,
  type AgentDomainCheckResult,
} from "@/stores/zeepo-payment-store";

/** Whole-number prices — aligned with agency /domains and agent toRetailPrice. */
function formatDomainPrice(amount: number, currency: string): string {
  const whole = Math.ceil(amount);
  const symbols: Record<string, string> = {
    USD: "$",
    KES: "KSh",
    EUR: "€",
    GBP: "£",
  };
  const symbol = symbols[currency] ?? currency;
  return `${symbol} ${whole.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatCheckedAt(isoString: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(isoString));
  } catch {
    return "";
  }
}

function DomainRow({ entry }: { entry: AgentDomainCheckEntry }) {
  const { purchaseDomain, domainsProductId, isLoadingProductId } = useZeepoPaymentHandler();

  const isAvailable = entry.available;
  const isError = entry.via === "error";

  const statusBadge = () => {
    if (isError || entry.status === "unknown") {
      return (
        <Badge variant="outline" className="gap-1 text-muted-foreground shrink-0">
          <HelpCircle className="h-3 w-3" />
          Unknown
        </Badge>
      );
    }
    if (isAvailable) {
      return (
        <Badge className="gap-1 bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400 shrink-0 border-green-200 dark:border-green-800">
          <CheckCircle2 className="h-3 w-3" />
          Available
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="gap-1 text-muted-foreground shrink-0">
        <XCircle className="h-3 w-3" />
        {entry.status === "reserved" ? "Reserved" : "Taken"}
      </Badge>
    );
  };

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 transition-colors",
        isAvailable
          ? "bg-green-50/60 dark:bg-green-950/20 hover:bg-green-50 dark:hover:bg-green-950/30"
          : "bg-muted/30 opacity-70",
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <Globe className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <span
          className={cn(
            "truncate text-sm font-medium",
            isAvailable ? "text-foreground" : "text-muted-foreground",
          )}
        >
          {entry.domain}
          {entry.isPremium && (
            <span className="ml-1.5 text-[10px] font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">
              Premium
            </span>
          )}
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {statusBadge()}

        {isAvailable && entry.price && (
          <span className="text-xs font-semibold text-foreground tabular-nums">
            {formatDomainPrice(entry.price.amount, entry.price.currency)}
          </span>
        )}

        {isAvailable && (
          <Button
            size="sm"
            className="h-7 gap-1 px-2.5 text-xs"
            disabled={!domainsProductId || isLoadingProductId}
            onClick={() => purchaseDomain(entry)}
          >
            <ShoppingCart className="h-3 w-3" />
            Buy
          </Button>
        )}
      </div>
    </div>
  );
}

interface ZeepoDomainPurchaseCardProps {
  result: AgentDomainCheckResult;
}

export function ZeepoDomainPurchaseCard({ result }: ZeepoDomainPurchaseCardProps) {
  const checkedAt = formatCheckedAt(result.checkedAt);
  const available = result.checked.filter((d) => d.available);
  const unavailable = result.checked.filter((d) => !d.available);

  return (
    <div className="w-full max-w-[min(85%,30rem)] rounded-2xl rounded-bl-md border bg-card shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-primary shrink-0" />
          <span className="text-sm font-semibold text-foreground">Domain Availability</span>
          {result.availableCount > 0 && (
            <Badge className="h-5 bg-primary/10 text-primary hover:bg-primary/10 text-[10px] px-1.5 border-primary/20">
              {result.availableCount} available
            </Badge>
          )}
        </div>
        {checkedAt && (
          <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">{checkedAt}</span>
        )}
      </div>

      {/* Domain rows */}
      <div className="flex flex-col gap-1 p-2">
        {available.map((entry) => (
          <DomainRow key={entry.domain} entry={entry} />
        ))}

        {available.length > 0 && unavailable.length > 0 && (
          <div className="px-2 py-1">
            <Separator />
          </div>
        )}

        {unavailable.map((entry) => (
          <DomainRow key={entry.domain} entry={entry} />
        ))}
      </div>

      {/* Footer hint */}
      {result.availableCount === 0 && (
        <div className="border-t px-4 py-2.5">
          <p className="text-xs text-muted-foreground">
            No domains available. Try a different name or extension.
          </p>
        </div>
      )}
    </div>
  );
}
