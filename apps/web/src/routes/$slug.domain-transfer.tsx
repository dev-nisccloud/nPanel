"use client";

import * as React from "react";
import { useLocation } from "react-router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CurrencyProvider } from "./agency.domains/_components/currency-context";
import { TransferDomainSection } from "./agency.domain-transfer/_components/transfer-domain-section";
import { TransferPrerequisites } from "./agency.domain-transfer/_components/transfer-prerequisites";
import { TransferRequestsList } from "./agency.domain-transfer/_components/transfer-requests-list";
import { trpc } from "@/utils/trpc";

export default function DomainTransferPage() {
  const { pathname } = useLocation();
  const teamSlug = pathname.split("/")[1] ?? "";
  const { data: teamData } = trpc.teams.getTeamIdBySlug.useQuery(
    { slug: teamSlug },
    { enabled: !!teamSlug }
  );

  return (
    <CurrencyProvider>
      <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
        <div className="w-full max-w-7xl mx-auto">
          <div className="flex flex-col gap-2">
            <h1 className="text-base font-semibold tracking-tight">Domain Transfer</h1>
            <p className="text-xs text-muted-foreground">
              Transfer domains from other registrars to Nisc Cloud. Enter the domain to check eligibility and price, then complete the transfer with your authorization code.
            </p>
          </div>

          <Tabs defaultValue="transfer-domain" className="mt-6 w-full">
            <TabsList className="w-fit mb-4">
              <TabsTrigger value="transfer-domain">Transfer domain</TabsTrigger>
              <TabsTrigger value="transfer-requests">Transfer requests</TabsTrigger>
            </TabsList>

            <TabsContent value="transfer-domain" className="mt-0 data-[state=inactive]:hidden" forceMount>
              <TransferDomainSection
                registerDomainsHref={teamSlug ? `/${teamSlug}/domains` : "/agency/domains"}
                teamId={teamData?.id ?? null}
              />
              <div className="mt-6">
                <TransferPrerequisites />
              </div>
            </TabsContent>

            <TabsContent value="transfer-requests" className="mt-0 data-[state=inactive]:hidden">
              <TransferRequestsList />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </CurrencyProvider>
  );
}
