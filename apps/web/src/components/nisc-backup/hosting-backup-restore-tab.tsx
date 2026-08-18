"use client";

import { ArchiveRestore } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { NiscBackupErrorState } from "./primitives";
import { NiscBackupAccountDetailContent } from "./detail/nisc-backup-account-detail-content";
import { useNiscBackupAccountByDomain } from "./hooks/use-nisc-backup-account-by-domain";

export interface HostingBackupRestoreTabProps {
  domainName?: string;
  username?: string;
  readOnly?: boolean;
  restoreRole?: "admin" | "user";
  enabled?: boolean;
}

function BackupRestoreTabSkeleton() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-9 w-72 rounded-lg" />
      <div className="flex flex-col gap-4 @sm/main:flex-row @sm/main:items-center @sm/main:justify-between">
        <Skeleton className="h-10 flex-1 @sm/main:max-w-sm" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>
      <div className="divide-y overflow-hidden rounded-xl border bg-card">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="flex items-center justify-between gap-3 px-4 py-3.5">
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <Skeleton className="mt-0.5 h-4 w-4" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <Skeleton className="h-4 w-44" />
                <Skeleton className="h-3 w-36 max-w-full" />
              </div>
            </div>
            <div className="flex gap-1.5">
              <Skeleton className="h-7 w-20" />
              <Skeleton className="h-7 w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BackupRestoreEmptyState({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <div className="rounded-xl border border-dashed bg-card px-4 py-10 text-center">
      <ArchiveRestore className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

export function HostingBackupRestoreTab({
  domainName,
  username,
  readOnly = false,
  restoreRole = "user",
  enabled = true,
}: HostingBackupRestoreTabProps) {
  const {
    account,
    accountId,
    isLoading,
    isError,
    error,
    isNotFound,
    isMissingDomain,
    refetch,
  } = useNiscBackupAccountByDomain({
    domainName,
    username,
    enabled,
  });

  if (isMissingDomain) {
    return (
      <BackupRestoreEmptyState
        title="No domain linked"
        message="This hosting subscription does not have a domain name, so a Nisc Backup account cannot be resolved."
      />
    );
  }

  if (isLoading) {
    return <BackupRestoreTabSkeleton />;
  }

  if (isError) {
    return (
      <NiscBackupErrorState
        title="Failed to load backup account"
        message={error?.message}
        onRetry={() => refetch()}
      />
    );
  }

  if (isNotFound || !account || !accountId) {
    return (
      <BackupRestoreEmptyState
        title="No backup account found"
        message={`No Nisc Backup account is associated with ${domainName}. Backups may not be configured for this hosting account yet.`}
      />
    );
  }

  return (
    <NiscBackupAccountDetailContent
      accountId={accountId}
      account={account}
      readOnly={readOnly}
      restoreRole={restoreRole}
      embedded
    />
  );
}
