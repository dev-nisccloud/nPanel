import type { JetBackupDownloadRow } from "../types";

function mapDownloadRow(raw: Record<string, unknown>): JetBackupDownloadRow {
  return {
    _id: String(raw._id ?? ""),
    path: raw.path ? String(raw.path) : undefined,
    account: raw.account ? String(raw.account) : raw.account_name ? String(raw.account_name) : undefined,
    account_id: raw.account_id ? String(raw.account_id) : undefined,
    size: typeof raw.size === "number" ? raw.size : undefined,
    created: raw.created as string | number | undefined,
    backup_type: typeof raw.backup_type === "number" ? raw.backup_type : undefined,
  };
}

function normalizeDownloads(data: unknown): JetBackupDownloadRow[] {
  if (!data || typeof data !== "object") return [];
  const record = data as Record<string, unknown>;
  const list = record.downloads ?? record.items;
  if (!Array.isArray(list)) return [];
  return list
    .filter((item) => item && typeof item === "object")
    .map((item) => mapDownloadRow(item as Record<string, unknown>));
}

export function buildJetBackupDownloadFileUrl(downloadId: string): string {
  return `/api/jetbackup/downloads/${encodeURIComponent(downloadId)}/file`;
}

export { normalizeDownloads, mapDownloadRow };
