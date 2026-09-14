const NAIROBI = "Africa/Nairobi";

function parts(d: Date) {
  const list = new Intl.DateTimeFormat("en-GB", {
    timeZone: NAIROBI,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const g = (t: string) => list.find((p) => p.type === t)?.value ?? "00";
  return { y: g("year"), m: g("month"), d: g("day"), hh: g("hour") === "24" ? "00" : g("hour"), mm: g("minute"), ss: g("second") };
}

/** `yyyyMMddHHmmss` in Africa/Nairobi (what KRA sandbox accepted). */
export function kraDateTime(d = new Date()): string {
  const p = parts(d);
  return `${p.y}${p.m}${p.d}${p.hh}${p.mm}${p.ss}`;
}

/** `yyyyMMdd` in Africa/Nairobi. */
export function kraDate(d = new Date()): string {
  const p = parts(d);
  return `${p.y}${p.m}${p.d}`;
}

export function parseKraDateTime(value: string | null | undefined): Date | null {
  if (!value) return null;
  const s = String(value).trim();
  if (s.length !== 14) return null;
  const y = s.slice(0, 4);
  const m = s.slice(4, 6);
  const d = s.slice(6, 8);
  const hh = s.slice(8, 10);
  const mm = s.slice(10, 12);
  const ss = s.slice(12, 14);
  const dt = new Date(`${y}-${m}-${d}T${hh}:${mm}:${ss}+03:00`);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

export function formatKraDateTimeDisplay(value: string | null | undefined): string | null {
  if (!value || value.length !== 14) return value ?? null;
  return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)} ${value.slice(8, 10)}:${value.slice(10, 12)}:${value.slice(12, 14)}`;
}

export function isKraDateTime(value: string): boolean {
  return /^\d{14}$/.test(value);
}

export function isKraDate(value: string): boolean {
  return /^\d{8}$/.test(value);
}

/** Add seconds to a 14-digit Kenya timestamp (used when a credit-note rfdDt must be after the sale). */
export function addSecondsToKraDateTime(value: string, seconds: number): string {
  const parsed = parseKraDateTime(value);
  if (!parsed) return kraDateTime(new Date(Date.now() + seconds * 1000));
  return kraDateTime(new Date(parsed.getTime() + seconds * 1000));
}

/**
 * Credit-note `rfdDt` must be a Kenya 14-digit stamp **after** the original sale `sdcDateTime`.
 * UTC wall-clock (e.g. `new Date()` formatted locally) was rejected as "Invalid RfdDt Date".
 */
export function creditNoteRefundDt(originalSdcDateTime: string, now = new Date()): string {
  const nowKra = kraDateTime(now);
  if (isKraDateTime(originalSdcDateTime) && nowKra <= originalSdcDateTime) {
    return addSecondsToKraDateTime(originalSdcDateTime, 60);
  }
  return nowKra;
}
