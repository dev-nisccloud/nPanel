/** M-Pesa STK polling helpers — aligned with dashboard buy-now / global-buy-now dialogs. */

export const MPESA_POLL_INTERVAL_MS = 1000;
export const MPESA_POLL_MAX_ATTEMPTS = 90;
export const MPESA_PROCESSING_CODES = new Set([1037, 4999]);

export function getMpesaUserFriendlyError(
  resultCode: string | number,
  resultDesc?: string,
): string {
  const code = typeof resultCode === "string" ? parseInt(resultCode, 10) : resultCode;
  const map: Record<number, string> = {
    0: "Payment completed successfully",
    1: "Insufficient balance in your M-Pesa account",
    2: "Amount is below the minimum transaction limit",
    3: "Amount exceeds the maximum transaction limit",
    4: "Transaction would exceed your daily transfer limit",
    8: "Transaction would exceed account balance limit",
    17: "Too many requests. Please wait a few minutes and try again",
    1019: "Payment request expired. Please initiate a new payment",
    1025: "Error sending payment request. Please try again",
    1032: "Payment request was cancelled",
    2001: "Incorrect M-Pesa PIN entered. Please try again with the correct PIN",
    2028: "Payment request not permitted. Please contact support",
    8006: "Your M-Pesa account is locked. Please contact M-Pesa customer care",
  };
  return map[code] ?? resultDesc ?? `Payment failed with error code ${code}`;
}

export function isMpesaTerminalResultCode(resultCode: string | number): boolean {
  const code = typeof resultCode === "string" ? parseInt(resultCode, 10) : resultCode;
  if (Number.isNaN(code)) return false;
  if (MPESA_PROCESSING_CODES.has(code)) return false;
  return true;
}

export type StorefrontStkQueryData = {
  resultCode?: string | number;
  resultDesc?: string;
};

export type StorefrontStkQueryResponse = {
  success?: boolean;
  data?: StorefrontStkQueryData;
  resultCode?: string | number;
  resultDesc?: string;
};

export function parseStorefrontStkQueryResponse(
  res: StorefrontStkQueryResponse,
): { resultCode: number | null; resultDesc?: string } {
  const data = res && "data" in res ? res.data : null;
  const rawCode = data?.resultCode ?? res.resultCode;
  if (rawCode === undefined || rawCode === null) {
    return { resultCode: null, resultDesc: data?.resultDesc ?? res.resultDesc };
  }
  const code = typeof rawCode === "string" ? parseInt(rawCode, 10) : rawCode;
  return {
    resultCode: Number.isNaN(code) ? null : code,
    resultDesc: data?.resultDesc ?? res.resultDesc,
  };
}
