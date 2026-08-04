"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import type { OpenproviderTld } from "@/types/openprovider";
import {
  formatPriceWithKes,
  type ToKesFn,
} from "./tld-price-format";

interface TldCardProps {
  tld: OpenproviderTld;
  onSelect: (tld: OpenproviderTld) => void;
  toKes?: ToKesFn;
}

export const TldCard = React.memo(function TldCard({
  tld,
  onSelect,
  toKes,
}: TldCardProps) {
  const registrationPrice =
    tld.prices?.create_price?.reseller?.price ??
    tld.prices?.create_price?.product?.price;
  const registrationCurrency =
    tld.prices?.create_price?.reseller?.currency ??
    tld.prices?.create_price?.product?.currency ??
    "USD";

  const renewPrice =
    tld.prices?.renew_price?.reseller?.price ??
    tld.prices?.renew_price?.product?.price;
  const renewCurrency =
    tld.prices?.renew_price?.reseller?.currency ??
    tld.prices?.renew_price?.product?.currency ??
    "USD";

  const registrationDisplay = formatPriceWithKes(
    registrationPrice,
    registrationCurrency,
    toKes
  );
  const renewDisplay = formatPriceWithKes(renewPrice, renewCurrency, toKes);

  const handleClick = React.useCallback(() => {
    onSelect(tld);
  }, [onSelect, tld]);

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onSelect(tld);
      }
    },
    [onSelect, tld]
  );

  return (
    <div
      className="flex flex-col p-3 bg-card border border-border rounded-lg hover:border-border/80 hover:shadow-sm transition-[border-color,box-shadow] cursor-pointer"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
    >
      {/* Header: TLD name and status */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <span className="font-semibold text-sm text-card-foreground truncate block">
            {tld.name.toUpperCase()}
          </span>
        </div>
        <Badge
          variant={tld.status === "ACT" ? "default" : "secondary"}
          className="text-xs"
        >
          {tld.status}
        </Badge>
      </div>

      {/* Price Section */}
      {registrationPrice && (
        <div className="mb-2">
          <div className="text-lg font-bold text-card-foreground">
            {registrationDisplay.primary}
          </div>
          {registrationDisplay.kes && (
            <div className="text-xs text-muted-foreground">
              ≈ {registrationDisplay.kes}
            </div>
          )}
          <div className="text-xs text-muted-foreground mt-1">
            Registration
          </div>
        </div>
      )}

      {/* Additional Info */}
      <div className="mt-auto pt-2 space-y-1">
        {renewPrice && (
          <div className="text-xs text-muted-foreground">
            Renewal: {renewDisplay.primary}
            {renewDisplay.kes ? ` (≈ ${renewDisplay.kes})` : ""}
          </div>
        )}
        <div className="text-xs text-muted-foreground">
          Period: {tld.min_period}-{tld.max_period} years
        </div>
        {tld.transfer_available && (
          <div className="text-xs text-muted-foreground">Transfer Available</div>
        )}
        {tld.dnssec_allowed && (
          <div className="text-xs text-muted-foreground">DNSSEC Allowed</div>
        )}
      </div>
    </div>
  );
});
