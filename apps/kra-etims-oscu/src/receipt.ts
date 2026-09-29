import type { KraEnvironment } from "./env";
import { KRA_OSCU_URLS } from "./env";

/** KRA public receipt verification URL. Query is `Data=` plus PIN + bhfId + rcptSign. */
export function buildReceiptVerifyUrl(opts: {
  tin: string;
  bhfId: string;
  rcptSign: string;
  environment?: KraEnvironment;
}): string | null {
  const tin = opts.tin.trim();
  const bhfId = opts.bhfId.trim();
  const rcptSign = opts.rcptSign.trim().replace(/-/g, "");
  if (!tin || !bhfId || !rcptSign) return null;
  const host = KRA_OSCU_URLS[opts.environment ?? "sandbox"].gava.receiptHost;
  return `${host}/common/link/etims/receipt/indexEtimsReceiptData?Data=${tin}${bhfId}${rcptSign}`;
}

export function extractRcptSign(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const root = data as Record<string, unknown>;
  const body = (root.responseBody ?? root.data ?? root) as Record<string, unknown>;
  const nested = (body.data ?? body) as Record<string, unknown>;
  const sign = nested.rcptSign ?? body.rcptSign ?? (body.receipt as Record<string, unknown> | undefined)?.rcptSign;
  return sign ? String(sign).trim() : null;
}

export type FiscalReceipt = {
  curRcptNo: string | null;
  totRcptNo: string | null;
  intrlData: string | null;
  rcptSign: string | null;
  sdcDateTime: string | null;
  verificationUrl: string | null;
};

export function extractFiscalReceipt(
  data: unknown,
  identity: { tin: string; bhfId: string; environment?: KraEnvironment },
): FiscalReceipt | null {
  if (!data || typeof data !== "object") return null;
  const root = data as Record<string, unknown>;
  const body = ((root.responseBody ?? root) as Record<string, unknown>).data as Record<string, unknown> | undefined;
  const payload = body ?? ((root.responseBody ?? root) as Record<string, unknown>);
  const rcptSign = extractRcptSign(data);
  if (!rcptSign && payload?.intrlData == null) return null;
  return {
    curRcptNo: payload?.curRcptNo != null ? String(payload.curRcptNo) : null,
    totRcptNo: payload?.totRcptNo != null ? String(payload.totRcptNo) : null,
    intrlData: payload?.intrlData != null ? String(payload.intrlData) : null,
    rcptSign,
    sdcDateTime: payload?.sdcDateTime != null ? String(payload.sdcDateTime) : null,
    verificationUrl: rcptSign
      ? buildReceiptVerifyUrl({ ...identity, rcptSign })
      : null,
  };
}

export const FISCAL_PRINT_FIELDS = [
  "curRcptNo",
  "totRcptNo",
  "intrlData",
  "rcptSign",
  "sdcDateTime",
] as const;

/** Spec §6.23.6–6.23.7: dash after every 4th character. */
export function dashEvery4(value: string | null | undefined): string | null {
  if (!value) return null;
  const compact = String(value).replace(/[-\s]/g, "").trim();
  if (!compact) return null;
  return compact.match(/.{1,4}/g)?.join("-") ?? compact;
}

export function kraReceiptLabel(opts: { isCreditNote?: boolean; salesTyCd?: string | null }): string {
  const sales = (opts.salesTyCd ?? "N").trim().toUpperCase() || "N";
  const txn = opts.isCreditNote ? "C" : "S";
  return `${sales}${txn}`;
}

export function buildCuInvoiceNo(opts: {
  sdcId?: string | null;
  curRcptNo?: string | null;
  receiptLabel?: string | null;
}): string | null {
  const id = opts.sdcId?.trim();
  const no = opts.curRcptNo != null ? String(opts.curRcptNo).trim() : "";
  if (!id && !no) return null;
  const base = id && no ? `${id}/${no}` : id || no;
  const label = opts.receiptLabel?.trim();
  return label ? `${base} ${label}` : base;
}
