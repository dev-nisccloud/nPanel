import { cn } from "@/lib/utils";

/** Matches agency hosting active / success styling */
export const NISC_BACKUP_SUCCESS_BADGE_CLASS =
  "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800";

export const NISC_BACKUP_INFO_BADGE_CLASS =
  "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200 border-sky-200 dark:border-sky-800";

export const NISC_BACKUP_WARNING_BADGE_CLASS =
  "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200 border-amber-200 dark:border-amber-800";

export const NISC_BACKUP_ERROR_BADGE_CLASS =
  "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200 border-red-200 dark:border-red-800";

export type NiscBackupStatusTone = "success" | "error" | "warning";

export function niscBackupStatusBadgeClass(tone: NiscBackupStatusTone): string {
  switch (tone) {
    case "success":
      return NISC_BACKUP_SUCCESS_BADGE_CLASS;
    case "error":
      return NISC_BACKUP_ERROR_BADGE_CLASS;
    case "warning":
      return NISC_BACKUP_WARNING_BADGE_CLASS;
  }
}

export function niscBackupQueueStatusBadgeClass(
  status: "pending" | "running" | "completed" | "failed" | "stopped" | "unknown",
): string {
  if (status === "completed" || status === "running") {
    return niscBackupStatusBadgeClass("success");
  }
  if (status === "failed") {
    return niscBackupStatusBadgeClass("error");
  }
  return niscBackupStatusBadgeClass("warning");
}

export function niscBackupSuccessBadgeClass(active = true) {
  return active ? NISC_BACKUP_SUCCESS_BADGE_CLASS : undefined;
}

export function niscBackupAlertLevelClass(level: number | undefined): string {
  if (level === 2) return NISC_BACKUP_WARNING_BADGE_CLASS;
  if (level === 3) return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200 border-red-200 dark:border-red-800";
  return NISC_BACKUP_INFO_BADGE_CLASS;
}

export function niscBackupSendLogClass(success: boolean) {
  return cn(
    "rounded px-2 py-1 text-xs font-medium",
    success
      ? "bg-green-600 text-white dark:bg-green-700"
      : "bg-muted text-muted-foreground",
  );
}
