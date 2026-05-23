"use client";

import { NiscReportProvider } from "./report-context";
import { DashboardShell } from "./dashboard-shell";
import { ExecutiveSection } from "./sections/executive-section";
import { RevenueSection } from "./sections/revenue-section";
import { PaymentsSection } from "./sections/payments-section";
import { InvoicesSection } from "./sections/invoices-section";
import { QuotationsSection } from "./sections/quotations-section";
import { SubscriptionsSection } from "./sections/subscriptions-section";
import { ClientsSection } from "./sections/clients-section";
import { ProfitabilitySection } from "./sections/profitability-section";
import { TaxSection } from "./sections/tax-section";

export function NiscReportDashboard() {
  return (
    <NiscReportProvider>
      <DashboardShell>
        <ExecutiveSection />
        <RevenueSection />
        <PaymentsSection />
        <InvoicesSection />
        <QuotationsSection />
        <SubscriptionsSection />
        <ClientsSection />
        <ProfitabilitySection />
        <TaxSection />
      </DashboardShell>
    </NiscReportProvider>
  );
}
