"use client";

import * as React from "react";
import { useNavigate } from "react-router";
import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { trpc } from "@/utils/trpc";
import {
  OrganizationGroupsList,
  groupItemsByOrganization,
} from "@/components/ui/organization-groups-list";
import {
  paymentTransactionUiSchema,
  type PaymentTransactionUI,
} from "@/routes/agency.dashboard/_components/schemas";

export default function TransactionsIndexPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = React.useState("");
  const { data, isLoading, isError, error, refetch, isFetching } =
    trpc.paymentTransactions.list.useQuery({
      limit: 200,
      offset: 0,
    });

  const transactions: PaymentTransactionUI[] = React.useMemo(() => {
    if (!data?.transactions) return [];
    return data.transactions
      .map((t) => {
        try {
          return paymentTransactionUiSchema.parse({
            id: t.id,
            userId: t.userId,
            teamId: t.teamId,
            userName: t.userName ?? null,
            teamName: t.teamName ?? null,
            gateway: t.gateway,
            status: t.status,
            amount: t.amount,
            currency: t.currency,
            accountReference: t.accountReference,
            transactionDesc: t.transactionDesc,
            receiptNumber: t.receiptNumber,
            initiatedAt: t.initiatedAt,
            processedAt: t.processedAt,
            failedAt: t.failedAt,
            createdAt: t.createdAt,
            updatedAt: t.updatedAt,
          });
        } catch {
          return null;
        }
      })
      .filter((t): t is PaymentTransactionUI => t != null);
  }, [data?.transactions]);

  const groups = React.useMemo(
    () =>
      groupItemsByOrganization(
        transactions,
        (tx) => ({ teamId: tx.teamId ?? null, teamName: tx.teamName ?? null }),
        (tx) => tx.processedAt ?? tx.initiatedAt,
      ),
    [transactions],
  );

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
      <div className="w-full max-w-7xl mx-auto">
        <div className="flex flex-col gap-2">
          <h1 className="text-base font-semibold tracking-tight">Transactions</h1>
          <p className="text-xs text-muted-foreground">
            Browse payment transactions by organization, then open individual payments.
          </p>
        </div>

        <div className="mt-6">
          <OrganizationGroupsList
            groups={groups}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            itemLabel="transaction"
            isLoading={isLoading}
            isError={isError}
            error={(error as Error) ?? null}
            onRetry={() => refetch()}
            onOpenGroup={(group) =>
              navigate(`/agency/transactions/organizations/${group.routeId}`)
            }
            toolbarActions={
              <Button
                variant="outline"
                size="icon"
                onClick={() => refetch()}
                disabled={isFetching}
                title="Refresh"
              >
                <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
              </Button>
            }
          />
        </div>
      </div>
    </div>
  );
}
