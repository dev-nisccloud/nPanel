"use client";

import * as React from "react";
import { CurrencyProvider } from "../domains/_components/currency-context";
import { TransferDomainSection } from "./_components/transfer-domain-section";
import { TransferPrerequisites } from "./_components/transfer-prerequisites";
import { Separator } from "@/components/ui/separator";

export default function DomainTransferPage() {
  return (
    <CurrencyProvider>
      <div className="@container/main flex flex-col gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
        <div className="w-full max-w-4xl mx-auto space-y-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">Domain Transfer</h1>
            <p className="text-muted-foreground">
              Transfer domains from other registrars to Nisc Cloud. Enter the domain to check eligibility and price, then complete the transfer with your authorization code.
            </p>
          </div>

          <TransferDomainSection />

          <Separator className="my-8" />

          <TransferPrerequisites />
        </div>
      </div>
    </CurrencyProvider>
  );
}
