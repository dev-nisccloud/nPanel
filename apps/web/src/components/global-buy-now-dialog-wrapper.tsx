"use client";

import { GlobalBuyNowDialog } from "./global-buy-now-dialog";
import { CurrencyProvider } from "@/routes/agency.domains/_components/currency-context";

export function GlobalBuyNowDialogWrapper() {
  return (
    <CurrencyProvider>
      <GlobalBuyNowDialog />
    </CurrencyProvider>
  );
}
