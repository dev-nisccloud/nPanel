import { parseNiscBackupBytes, sortNewestFirst } from "../formatters";
import type { NiscBackupDownloadRow } from "../types";

function mapDownloadRow(raw: Record<string, unknown>): NiscBackupDownloadRow {
  return {
    _id: String(raw._id ?? ""),
    path: raw.path ? String(raw.path) : undefined,
    account: raw.account ? String(raw.account) : raw.account_name ? String(raw.account_name) : undefined,
    account_id: raw.account_id ? String(raw.account_id) : undefined,
    size: parseNiscBackupBytes(raw.size),
    created: raw.created as string | number | undefined,
    backup_type: typeof raw.backup_type === "number" ? raw.backup_type : undefined,
  };
}

function normalizeDownloads(data: unknown): NiscBackupDownloadRow[] {
  if (!data || typeof data !== "object") return [];
  const record = data as Record<string, unknown>;
  const list = record.downloads ?? record.items;
  if (!Array.isArray(list)) return [];
  return sortNewestFirst(
    list
      .filter((item) => item && typeof item === "object")
      .map((item) => mapDownloadRow(item as Record<string, unknown>)),
    (item) => item.created,
  );
}

export function buildNiscBackupDownloadFileUrl(downloadId: string): string {
  return `/api/nisc-backup/downloads/${encodeURIComponent(downloadId)}/file`;
}

export { normalizeDownloads, mapDownloadRow };
