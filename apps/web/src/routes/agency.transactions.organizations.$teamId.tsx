"use client";

import * as React from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { trpc } from "@/utils/trpc";
import { UNCATEGORIZED_ORG_ROUTE } from "@/components/ui/organization-groups-list";
import { TransactionsTable } from "./agency.transactions/_components/transactions-table";
import { TransactionViewSheet } from "./agency.transactions/_components/transaction-view-sheet";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default function OrganizationTransactionsPage() {
  const navigate = useNavigate();
  const { teamId: teamIdParam } = useParams<{ teamId: string }>();
  const [viewingTransactionId, setViewingTransactionId] = React.useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = React.useState(false);

  const isUnassigned = teamIdParam === UNCATEGORIZED_ORG_ROUTE;
  const teamId = !isUnassigned && teamIdParam && UUID_RE.test(teamIdParam) ? teamIdParam : undefined;
  const isInvalid = !isUnassigned && !teamId;

  const { data } = trpc.paymentTransactions.list.useQuery(
    {
      limit: 200,
      offset: 0,
      teamId,
      unassignedOnly: isUnassigned || undefined,
    },
    { enabled: !isInvalid },
  );

  const teamName = isUnassigned
    ? "Uncategorized"
    : data?.transactions.find((tx) => tx.teamId === teamId)?.teamName ?? "Organization";

  const handleViewTransaction = React.useCallback((id: string) => {
    setViewingTransactionId(id);
    setSheetOpen(true);
  }, []);

  if (isInvalid) {
    return (
      <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
        <div className="w-full max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="mb-2 text-lg font-semibold">Organization not found</p>
            <p className="mb-4 text-sm text-muted-foreground">This organization link is invalid.</p>
            <Button onClick={() => navigate("/agency/transactions")} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to organizations
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
      <div className="w-full max-w-7xl mx-auto">
        <div className="flex flex-col gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 w-fit text-muted-foreground"
            onClick={() => navigate("/agency/transactions")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            All organizations
          </Button>
          <div>
            <h1 className="text-base font-semibold tracking-tight">{teamName}</h1>
            <p className="text-xs text-muted-foreground">
              Payment transactions for this organization.
            </p>
          </div>
        </div>

        <div className="mt-6">
          <TransactionsTable
            teamId={teamId}
            unassignedOnly={isUnassigned || undefined}
            onViewTransaction={handleViewTransaction}
          />
        </div>
      </div>

      <TransactionViewSheet
        transactionId={viewingTransactionId}
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) setViewingTransactionId(null);
        }}
      />
    </div>
  );
}
