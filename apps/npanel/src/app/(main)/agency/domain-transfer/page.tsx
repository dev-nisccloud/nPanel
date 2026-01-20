"use client";

import * as React from "react";
import { TransferForm } from "./_components/transfer-form";

export default function DomainTransferPage() {
  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
      <div className="w-full max-w-7xl mx-auto">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">Domain Transfer</h1>
          <p className="text-muted-foreground">
            Transfer domains from other registrars to your agency. Enter the domain details and authorization code to initiate the transfer.
          </p>
        </div>

        {/* Transfer Form Section */}
        <div className="mt-6">
          <TransferForm />
        </div>
      </div>
    </div>
  );
}

