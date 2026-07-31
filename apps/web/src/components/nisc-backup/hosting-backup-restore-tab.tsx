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
  enabled?: boolean;
}

function BackupRestoreTabSkeleton() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-5">
      <Skeleton className="h-4 w-64" />
      <Skeleton className="h-20 w-full rounded-lg" />
      <div className="flex gap-8">
        <Skeleton className="hidden h-40 w-44 rounded-lg md:block" />
        <Skeleton className="h-64 flex-1 rounded-lg" />
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
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
      <ArchiveRestore className="mb-4 h-12 w-12 text-muted-foreground" />
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      <p className="max-w-md text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

export function HostingBackupRestoreTab({
  domainName,
  username,
  readOnly = false,
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
    />
  );
}
