import { stripKenyanTldFromQuery } from "./kenic-schema";

export function sanitizeDomainName(input: string): string {
  let s = input.trim().toLowerCase();
  s = s.replace(/#.*$/, "").trim();
  s = s.replace(/\?.*$/, "").trim();
  s = (s.split("/")[0] ?? s).trim();
  s = s.replace(/^https?:\/\//, "");
  s = s.replace(/\/+$/, "");
  s = s.replace(/^www\./i, "");
  s = stripKenyanTldFromQuery(s);
  s = s.replace(/\.[a-z0-9-]{2,63}$/i, "");
  s = s.replace(/^[.-]+|[.-]+$/g, "");
  return s.trim();
}

export function isValidSearchQuery(sanitized: string): boolean {
  if (!sanitized || sanitized.length > 253) return false;
  if (/[^a-z0-9.-]/.test(sanitized)) return false;
  if (/^[.-]|[.-]$/.test(sanitized)) return false;
  if (/\.\./.test(sanitized)) return false;
  const labels = sanitized.split(".");
  if (labels.some((l) => l.length === 0 || l.length > 63)) return false;
  if (labels.some((l) => /^-|-$/.test(l))) return false;
  return true;
}

export function toSingleLabelName(sanitized: string): string {
  const t = sanitized.trim();
  if (!t) return t;
  const parts = t.split(".");
  return parts[parts.length - 1] ?? t;
}

export function nameForOpenProvider(name: string): string {
  const t = name.trim();
  if (!t) return t;
  const parts = t.split(".");
  return parts[parts.length - 1] ?? t;
}
