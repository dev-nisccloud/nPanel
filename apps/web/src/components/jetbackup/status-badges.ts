import { cn } from "@/lib/utils";

/** Matches agency hosting active / success styling */
export const JETBACKUP_SUCCESS_BADGE_CLASS =
  "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800";

export const JETBACKUP_INFO_BADGE_CLASS =
  "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200 border-sky-200 dark:border-sky-800";

export const JETBACKUP_WARNING_BADGE_CLASS =
  "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200 border-amber-200 dark:border-amber-800";

export const JETBACKUP_ERROR_BADGE_CLASS =
  "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200 border-red-200 dark:border-red-800";

export type JetBackupStatusTone = "success" | "error" | "warning";

export function jetbackupStatusBadgeClass(tone: JetBackupStatusTone): string {
  switch (tone) {
    case "success":
      return JETBACKUP_SUCCESS_BADGE_CLASS;
    case "error":
      return JETBACKUP_ERROR_BADGE_CLASS;
    case "warning":
      return JETBACKUP_WARNING_BADGE_CLASS;
  }
}

export function jetbackupQueueStatusBadgeClass(
  status: "pending" | "running" | "completed" | "failed" | "stopped" | "unknown",
): string {
  if (status === "completed" || status === "running") {
    return jetbackupStatusBadgeClass("success");
  }
  if (status === "failed") {
    return jetbackupStatusBadgeClass("error");
  }
  return jetbackupStatusBadgeClass("warning");
}

export function jetbackupSuccessBadgeClass(active = true) {
  return active ? JETBACKUP_SUCCESS_BADGE_CLASS : undefined;
}

export function jetbackupAlertLevelClass(level: number | undefined): string {
  if (level === 2) return JETBACKUP_WARNING_BADGE_CLASS;
  if (level === 3) return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200 border-red-200 dark:border-red-800";
  return JETBACKUP_INFO_BADGE_CLASS;
}

export function jetbackupSendLogClass(success: boolean) {
  return cn(
    "rounded px-2 py-1 text-xs font-medium",
    success
      ? "bg-green-600 text-white dark:bg-green-700"
      : "bg-muted text-muted-foreground",
  );
}
