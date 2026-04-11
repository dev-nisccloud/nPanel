"use client";

import * as React from "react";
import { RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/sonner";
import { trpc } from "@/utils/trpc";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatMoney } from "./format";

export function CurrencyConverterNode({
  fromCurrency,
  toCurrency,
  rate,
  rateOverride,
  setRateOverride,
}: {
  fromCurrency: string;
  toCurrency: string;
  /** Displayed effective rate (KES per 1 unit) */
  rate: number;
  /** Editable override string (KES per 1 unit) */
  rateOverride: string | undefined;
  setRateOverride: (v: string) => void;
}) {
  const utils = trpc.useUtils();
  const refreshRatesMutation = trpc.currency.refreshExchangeRates.useMutation({
    onSuccess: async (out) => {
      if (!out.success) {
        toast.error(out.error ?? "Could not refresh exchange rates.");
        return;
      }
      await Promise.all([
        utils.currency.getExchangeRates.invalidate({ baseCurrency: "USD" }),
        utils.currency.getCacheStatus.invalidate(),
      ]);
      toast.success("Exchange rates updated.");
    },
    onError: (err) => {
      toast.error(err.message || "Could not refresh exchange rates.");
    },
  });

  const isValid = rateOverride == null || rateOverride.trim() === ""
    ? true
    : Number.isFinite(Number(rateOverride)) && Number(rateOverride) > 0;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-medium">Currency converter</div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="nodrag h-7 w-7 px-0"
            title="Refresh exchange rates from server"
            disabled={refreshRatesMutation.isPending}
            onClick={() => refreshRatesMutation.mutate({ baseCurrency: "USD" })}
          >
            <RefreshCw
              className={
                refreshRatesMutation.isPending ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"
              }
            />
          </Button>
          <Badge variant="outline" className="text-[10px]">
            {fromCurrency} → {toCurrency}
          </Badge>
        </div>
      </div>

      <div className="text-[11px] text-muted-foreground max-w-[360px]">
        Used to convert campaign spend into <span className="font-mono">{toCurrency}</span> before fees/invoice math.
      </div>

      <div className="nodrag flex items-center gap-2 text-xs">
        <span className="font-mono">1 {fromCurrency}</span>
        <span className="text-muted-foreground">=</span>
        <Input
          value={rateOverride ?? String(Number.isFinite(rate) ? rate.toFixed(2) : "")}
          onChange={(e) => setRateOverride(e.target.value)}
          inputMode="decimal"
          className="h-7 w-[140px] text-xs"
        />
        <span className="font-mono">{toCurrency}</span>
      </div>

      {!isValid && (
        <div className="text-[11px] text-destructive">
          Enter a positive number (KES per 1 {fromCurrency}).
        </div>
      )}
    </div>
  );
}

export function FeeNode({
  platformLabel,
  feeInput,
  setFeeInput,
  currency,
  setCurrency,
}: {
  platformLabel: string;
  feeInput: string;
  setFeeInput: (v: string) => void;
  currency: string;
  setCurrency: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="text-sm font-medium">{platformLabel}: Ad serving fee</div>
      <div className="text-[11px] text-muted-foreground max-w-[280px]">
        Optional. Added as a final line item for this platform.
      </div>
      <div className="flex items-center gap-2">
        <Input
          value={feeInput}
          onChange={(e) => setFeeInput(e.target.value)}
          placeholder="0"
          inputMode="decimal"
          className="nodrag h-7 w-[140px] text-xs"
        />
        <div className="nodrag">
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger size="sm" className="h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="KES">KES</SelectItem>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="EUR">EUR</SelectItem>
              <SelectItem value="GBP">GBP</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

export function InvoicePreviewNode({
  platformLabel,
  commissionRatePercent,
  lines,
  fee,
  selectedSpendTotal,
  invoiceTotal,
}: {
  platformLabel: string;
  commissionRatePercent: number;
  lines: Array<{
    id: string;
    name: string;
    context: string;
    originalSpend: number;
    currency: string;
    spendKes: number;
  }>;
  fee: number;
  selectedSpendTotal: number;
  invoiceTotal: number;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-medium">{platformLabel}: Invoice preview</div>
        <Badge variant="outline" className="text-[10px]">
          {commissionRatePercent}% commission
        </Badge>
      </div>

      <div className="text-[11px] text-muted-foreground max-w-[360px]">
        Line items are the selected entries (qty 1). Amount is spend × commission
        rate, plus “Total ad serving fee”.
      </div>

      <div className="nowheel flex max-h-[220px] flex-col gap-1 overflow-auto pr-1">
        {lines.map((l) => {
          const commissionAmount = (l.spendKes * commissionRatePercent) / 100;
          return (
            <div key={l.id} className="rounded-md border px-2 py-1.5">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-xs font-medium truncate">{l.name}</div>
                  <div className="text-[11px] text-muted-foreground truncate">
                    {platformLabel} • {l.context}
                  </div>
                  {l.currency !== "KES" && (
                    <div className="text-[11px] text-muted-foreground truncate">
                      {formatMoney(l.originalSpend, l.currency)} → {formatMoney(l.spendKes, "KES")}
                    </div>
                  )}
                </div>
                <div className="text-xs font-medium whitespace-nowrap">
                  {formatMoney(commissionAmount, "KES")}
                </div>
              </div>
            </div>
          );
        })}

        <div className="rounded-md border px-2 py-1.5 bg-muted/30">
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs font-medium">Total ad serving fee</div>
            <div className="text-xs font-medium whitespace-nowrap">
              {formatMoney(fee, "KES")}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-[11px]">
        <div className="rounded-md border px-2 py-1.5">
          <div className="text-muted-foreground">Selected spend</div>
          <div className="font-medium">{formatMoney(selectedSpendTotal, "KES")}</div>
        </div>
        <div className="rounded-md border px-2 py-1.5">
          <div className="text-muted-foreground">Invoice total</div>
          <div className="font-medium">{formatMoney(invoiceTotal, "KES")}</div>
        </div>
      </div>
    </div>
  );
}

export function GenerateInvoicesNode({
  metaTotal,
  googleTotal,
  linkedInTotal,
  grandTotal,
  status,
  canGenerate,
  onGenerate,
}: {
  metaTotal: number | null;
  googleTotal: number | null;
  linkedInTotal: number | null;
  grandTotal: number;
  status: "idle" | "generating" | "generated" | "error";
  canGenerate: boolean;
  onGenerate: () => void | Promise<void>;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="text-sm font-medium">Generate invoices</div>
      <div className="text-[11px] text-muted-foreground max-w-[360px]">
        Creates one invoice per platform (Meta/Google/LinkedIn) for platforms with
        selected spend. Invoices are stored and then downloaded manually one-by-one.
      </div>

      <div className="grid grid-cols-3 gap-2 text-[11px]">
        <div className="rounded-md border px-2 py-1.5">
          <div className="text-muted-foreground">Meta</div>
          <div className="font-medium">
            {metaTotal != null ? formatMoney(metaTotal, "KES") : "—"}
          </div>
        </div>
        <div className="rounded-md border px-2 py-1.5">
          <div className="text-muted-foreground">Google Ads</div>
          <div className="font-medium">
            {googleTotal != null ? formatMoney(googleTotal, "KES") : "—"}
          </div>
        </div>
        <div className="rounded-md border px-2 py-1.5">
          <div className="text-muted-foreground">LinkedIn</div>
          <div className="font-medium">
            {linkedInTotal != null ? formatMoney(linkedInTotal, "KES") : "—"}
          </div>
        </div>
      </div>

      <div className="rounded-md border px-2 py-1.5">
        <div className="text-muted-foreground text-[11px]">Grand total</div>
        <div className="text-sm font-semibold">{formatMoney(grandTotal, "KES")}</div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          disabled={!canGenerate}
          className="nodrag h-7 text-xs"
          onClick={onGenerate}
        >
          {status === "generating"
            ? "Generating…"
            : status === "generated"
              ? "Generated"
              : "Generate"}
        </Button>
        {status === "error" && (
          <span className="text-[11px] text-destructive">Failed. Check details and try again.</span>
        )}
      </div>
    </div>
  );
}

export function EndNode() {
  return (
    <div className="flex flex-col gap-1">
      <div className="text-sm font-medium">Ended</div>
      <div className="text-[11px] text-muted-foreground max-w-[300px]">
        Invoices were generated and are ready to download.
      </div>
    </div>
  );
}

