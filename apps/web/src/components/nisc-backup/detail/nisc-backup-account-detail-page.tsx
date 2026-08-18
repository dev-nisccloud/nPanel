"use client";

import { ArrowLeft } from "lucide-react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { NiscBackupErrorState } from "../primitives";
import { trpc } from "@/utils/trpc";
import { niscBackupQueryOptions } from "../query-options";
import { NiscBackupAccountDetailContent } from "./nisc-backup-account-detail-content";

export interface NiscBackupAccountDetailPageProps {
  accountId: string;
  backPath: string;
  readOnly?: boolean;
  restoreRole?: "admin" | "user";
}

function AccountDetailSkeleton() {
  return (
    <div className="@container/main flex flex-col px-4 py-4 md:px-6 md:py-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl space-y-5">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-64" />
        <Skeleton className="h-20 w-full rounded-lg" />
        <div className="flex gap-8">
          <Skeleton className="hidden h-40 w-44 rounded-lg md:block" />
          <Skeleton className="h-64 flex-1 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function NiscBackupAccountDetailPage({
  accountId,
  backPath,
  readOnly = false,
  restoreRole = "admin",
}: NiscBackupAccountDetailPageProps) {
  const { data, isLoading, isError, error, refetch } = trpc.niscBackup.accounts.get.useQuery(
    { _id: accountId },
    niscBackupQueryOptions,
  );

  if (isLoading) return <AccountDetailSkeleton />;
  if (isError || !data) {
    return (
      <div className="@container/main flex flex-col px-4 py-4 md:px-6 md:py-6 lg:px-8">
        <div className="mx-auto w-full max-w-6xl space-y-5">
          <Link to={backPath}>
            <Button variant="ghost" size="sm" className="-ml-2 h-8 px-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to accounts
            </Button>
          </Link>
          <NiscBackupErrorState
            title="Failed to load account"
            message={error?.message}
            onRetry={() => refetch()}
          />
        </div>
      </div>
    );
  }

  const account = data as Record<string, unknown>;

  return (
    <div className="@container/main flex flex-col px-4 py-4 md:px-6 md:py-6 lg:px-8">
      <NiscBackupAccountDetailContent
        accountId={accountId}
        account={account}
        readOnly={readOnly}
        restoreRole={restoreRole}
        backAction={
          <Link to={backPath}>
            <Button variant="ghost" size="sm" className="-ml-2 h-8 px-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to accounts
            </Button>
          </Link>
        }
      />
    </div>
  );
}
