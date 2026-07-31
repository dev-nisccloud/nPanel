const LOG_STATUS_LABELS: Record<number, string> = {
  0: "Pending",
  1: "Success",
  2: "Failed",
  3: "Running",
  4: "Stopped",
};

const LOG_TYPE_LABELS: Record<number, string> = {
  1: "Backup",
  2: "Restore",
  3: "Download",
  4: "Cleanup",
  5: "System",
};

const QUEUE_TYPE_LABELS: Record<number, string> = {
  1: "Backup",
  2: "Restore",
  3: "Download",
  4: "Download",
};

/** NiscBackup queue group status codes (listQueueGroups). */
const QUEUE_STATUS_LABELS: Record<number, string> = {
  1: "Pending",
  2: "Processing",
  100: "Completed",
  101: "Partially completed",
  102: "Failed",
  103: "Aborted",
  104: "Never finished",
};

export type QueueStatusKey =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "stopped"
  | "unknown";

export function normalizeQueueStatusKey(
  status: number | string | undefined,
): QueueStatusKey {
  if (status == null) return "unknown";
  if (typeof status === "string") {
    const normalized = status.toLowerCase();
    if (normalized === "processing") return "running";
    if (
      normalized === "pending"
      || normalized === "running"
      || normalized === "completed"
      || normalized === "failed"
      || normalized === "stopped"
    ) {
      return normalized;
    }
    return "unknown";
  }
  switch (status) {
    case 1:
      return "pending";
    case 2:
      return "running";
    case 100:
    case 101:
      return "completed";
    case 102:
    case 103:
    case 104:
      return "failed";
    default:
      return "unknown";
  }
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "-";
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB", "PB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 2)} ${units[i]}`;
}

export function formatNiscBackupDate(value: number | string | undefined): string {
  if (value == null) return "-";
  const date = typeof value === "number"
    ? new Date(value > 1e12 ? value : value * 1000)
    : new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatLogStatus(status: number | string | undefined): string {
  if (status == null) return "Unknown";
  if (typeof status === "string") return status;
  return LOG_STATUS_LABELS[status] ?? `Status ${status}`;
}

export function formatLogType(
  type: number | string | undefined,
  info?: { Type?: string },
): string {
  if (info?.Type) return info.Type;
  if (type == null) return "Activity";
  if (typeof type === "string") return type;
  return LOG_TYPE_LABELS[type] ?? `Type ${type}`;
}

export function formatQueueType(type: number | undefined): string {
  if (type == null) return "Unknown";
  return QUEUE_TYPE_LABELS[type] ?? `Type ${type}`;
}

export function formatQueueStatus(status: number | string | undefined): string {
  if (status == null) return "Unknown";
  if (typeof status === "number") {
    return QUEUE_STATUS_LABELS[status] ?? `Status ${status}`;
  }
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function formatDuration(seconds: number | undefined): string {
  if (seconds == null || !Number.isFinite(seconds)) return "-";
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
}

export function formatAlertLevel(level: number | undefined): string {
  if (level === 2) return "Warning";
  if (level === 3) return "Critical";
  return "Information";
}

export function isSuccessStatus(
  status: number | string | undefined,
  text?: string,
): boolean {
  if (typeof status === "number") return status === 1;
  if (typeof status === "string") {
    const normalized = status.toLowerCase();
    return normalized === "success" || normalized === "completed" || normalized === "active";
  }
  if (text?.toLowerCase().includes("success")) return true;
  return false;
}
