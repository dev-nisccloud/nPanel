"use client";

import * as React from "react";
import { X, Check, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/npanel-ui/sheet";
import type { OpenproviderTld } from "@/types/openprovider";

interface TldDetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tld: OpenproviderTld | null;
}

const formatPrice = (price?: number, currency?: string) => {
  if (!price) return "N/A";

  // Currency symbols mapping
  const currencySymbols: Record<string, string> = {
    USD: "$",
    KES: "KSh",
    EUR: "€",
    GBP: "£",
    CAD: "C$",
    AUD: "A$",
    JPY: "¥",
    INR: "₹",
    ZAR: "R",
    NGN: "₦",
  };

  const symbol = currencySymbols[currency || "USD"] || currency || "$";
  // Format with thousand separators (e.g., 1,000.00)
  const formattedNumber = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);

  return `${symbol} ${formattedNumber}`;
};

const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex items-start justify-between py-2 border-b last:border-0">
    <span className="text-sm font-medium text-muted-foreground">{label}</span>
    <span className="text-sm text-card-foreground text-right flex-1 ml-4">{value}</span>
  </div>
);

const BooleanBadge = ({ value }: { value: boolean }) => (
  value ? (
    <Badge variant="default" className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
      <Check className="h-3 w-3 mr-1" />
      Yes
    </Badge>
  ) : (
    <Badge variant="secondary" className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
      <XCircle className="h-3 w-3 mr-1" />
      No
    </Badge>
  )
);

export function TldDetailsSheet({ open, onOpenChange, tld }: TldDetailsSheetProps) {
  if (!tld) return null;

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

  const transferPrice =
    tld.prices?.transfer_price?.reseller?.price ??
    tld.prices?.transfer_price?.product?.price;
  const transferCurrency =
    tld.prices?.transfer_price?.reseller?.currency ??
    tld.prices?.transfer_price?.product?.currency ??
    "USD";

  const restorePrice =
    tld.prices?.restore_price?.reseller?.price ??
    tld.prices?.restore_price?.product?.price;
  const restoreCurrency =
    tld.prices?.restore_price?.reseller?.currency ??
    tld.prices?.restore_price?.product?.currency ??
    "USD";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col w-full sm:max-w-lg p-0 h-full">
        <div className="flex flex-col h-full overflow-hidden">
          {/* Header */}
          <SheetHeader className="flex-shrink-0 px-6 pt-6 pb-4 border-b">
            <div className="flex items-center justify-between">
              <div>
                <SheetTitle className="text-xl font-semibold">
                  {tld.name.toUpperCase()} Details
                </SheetTitle>
                <SheetDescription className="mt-1">
                  Complete information about this top-level domain
                </SheetDescription>
              </div>
              <SheetClose asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </SheetClose>
            </div>
          </SheetHeader>

          {/* Scrollable Content */}
          <div className="flex-1 min-h-0 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="px-6 py-4 space-y-6">
                {/* Basic Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Basic Information</h3>
                  <div className="space-y-1">
                    <InfoRow
                      label="TLD Name"
                      value={<span className="font-semibold">{tld.name.toUpperCase()}</span>}
                    />
                    <InfoRow
                      label="Status"
                      value={
                        <Badge
                          variant={tld.status === "ACT" ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {tld.status}
                        </Badge>
                      }
                    />
                    <InfoRow
                      label="Registration Period"
                      value={`${tld.min_period} - ${tld.max_period} years`}
                    />
                  </div>
                </div>

                {/* Pricing Information */}
                {tld.prices && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Pricing</h3>
                    <div className="space-y-1">
                      {registrationPrice && (
                        <InfoRow
                          label="Registration"
                          value={formatPrice(registrationPrice, registrationCurrency)}
                        />
                      )}
                      {renewPrice && (
                        <InfoRow
                          label="Renewal"
                          value={formatPrice(renewPrice, renewCurrency)}
                        />
                      )}
                      {transferPrice && (
                        <InfoRow
                          label="Transfer"
                          value={formatPrice(transferPrice, transferCurrency)}
                        />
                      )}
                      {restorePrice && (
                        <InfoRow
                          label="Restore"
                          value={formatPrice(restorePrice, restoreCurrency)}
                        />
                      )}
                    </div>
                  </div>
                )}

                {/* Features & Capabilities */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Features & Capabilities</h3>
                  <div className="space-y-1">
                    <InfoRow
                      label="Transfer Available"
                      value={<BooleanBadge value={tld.transfer_available} />}
                    />
                    <InfoRow
                      label="Trade Available"
                      value={<BooleanBadge value={tld.trade_available} />}
                    />
                    <InfoRow
                      label="Renew Available"
                      value={<BooleanBadge value={tld.renew_available} />}
                    />
                    <InfoRow
                      label="DNSSEC Allowed"
                      value={<BooleanBadge value={tld.dnssec_allowed} />}
                    />
                    <InfoRow
                      label="Private WHOIS Allowed"
                      value={<BooleanBadge value={tld.is_private_whois_allowed} />}
                    />
                    <InfoRow
                      label="Domicile Available"
                      value={<BooleanBadge value={tld.domicile_available} />}
                    />
                  </div>
                </div>

                {/* Auth Code Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Authorization Code</h3>
                  <div className="space-y-1">
                    <InfoRow
                      label="Transfer Auth Code Required"
                      value={<BooleanBadge value={tld.is_transfer_auth_code_required} />}
                    />
                    <InfoRow
                      label="Trade Auth Code Required"
                      value={<BooleanBadge value={tld.is_trade_auth_code_required} />}
                    />
                    <InfoRow
                      label="Auth Code Available"
                      value={<BooleanBadge value={tld.is_auth_code_available} />}
                    />
                    <InfoRow
                      label="Auth Code Changeable"
                      value={<BooleanBadge value={tld.is_auth_code_changeable} />}
                    />
                  </div>
                </div>

                {/* Quarantine Information */}
                {(tld.soft_quarantine_period > 0 || tld.quarantine_period > 0) && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Quarantine Periods</h3>
                    <div className="space-y-1">
                      {tld.soft_quarantine_period > 0 && (
                        <InfoRow
                          label="Soft Quarantine"
                          value={`${tld.soft_quarantine_period} days`}
                        />
                      )}
                      {tld.quarantine_period > 0 && (
                        <InfoRow
                          label="Quarantine"
                          value={`${tld.quarantine_period} days`}
                        />
                      )}
                    </div>
                  </div>
                )}

                {/* Handle Support */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Handle Support</h3>
                  <div className="space-y-1">
                    <InfoRow
                      label="Owner Handle"
                      value={<BooleanBadge value={tld.owner_handle_supported} />}
                    />
                    <InfoRow
                      label="Admin Handle"
                      value={<BooleanBadge value={tld.admin_handle_supported} />}
                    />
                    <InfoRow
                      label="Tech Handle"
                      value={<BooleanBadge value={tld.tech_handle_supported} />}
                    />
                    <InfoRow
                      label="Billing Handle"
                      value={<BooleanBadge value={tld.billing_handle_supported} />}
                    />
                    <InfoRow
                      label="Reseller Handle"
                      value={<BooleanBadge value={tld.reseller_handle_supported} />}
                    />
                  </div>
                </div>

                {/* DNSSEC Details */}
                {tld.dnssec_allowed && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">DNSSEC Details</h3>
                    <div className="space-y-1">
                      <InfoRow
                        label="DNSSEC Keys Allowed"
                        value={<BooleanBadge value={tld.dnssec_keys_allowed} />}
                      />
                      <InfoRow
                        label="DNSSEC Digests Allowed"
                        value={<BooleanBadge value={tld.dnssec_digests_allowed} />}
                      />
                      {tld.dnssec_max_records_amount > 0 && (
                        <InfoRow
                          label="Max DNSSEC Records"
                          value={tld.dnssec_max_records_amount}
                        />
                      )}
                      {tld.dnssec_algorithms && tld.dnssec_algorithms.length > 0 && (
                        <InfoRow
                          label="DNSSEC Algorithms"
                          value={
                            <div className="flex flex-wrap gap-1">
                              {tld.dnssec_algorithms.map((alg) => (
                                <Badge key={alg} variant="outline" className="text-xs">
                                  {alg}
                                </Badge>
                              ))}
                            </div>
                          }
                        />
                      )}
                    </div>
                  </div>
                )}

                {/* IDN Scripts */}
                {tld.supported_idn_scripts && tld.supported_idn_scripts.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Supported IDN Scripts</h3>
                    <div className="space-y-1">
                      <InfoRow
                        label="Scripts"
                        value={
                          <div className="flex flex-wrap gap-1">
                            {tld.supported_idn_scripts.map((script, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {script.description || script.value}
                              </Badge>
                            ))}
                          </div>
                        }
                      />
                    </div>
                  </div>
                )}
              </div>
              <ScrollBar orientation="vertical" />
            </ScrollArea>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
