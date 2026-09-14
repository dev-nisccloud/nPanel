export class KraOscuError extends Error {
  readonly statusCode: number;
  readonly resultCd: string | null;
  readonly resultMsg: string;
  readonly endpointKey: string;
  readonly url: string;
  readonly body: unknown;

  constructor(opts: {
    message: string;
    statusCode: number;
    resultCd?: string | null;
    resultMsg?: string;
    endpointKey: string;
    url: string;
    body?: unknown;
  }) {
    super(opts.message);
    this.name = "KraOscuError";
    this.statusCode = opts.statusCode;
    this.resultCd = opts.resultCd ?? null;
    this.resultMsg = opts.resultMsg ?? opts.message;
    this.endpointKey = opts.endpointKey;
    this.url = opts.url;
    this.body = opts.body ?? null;
  }
}

export const RESULT = {
  SUCCESS: "000",
  NO_SEARCH: "001",
  DEVICE_ALREADY_INSTALLED: "902",
  INVALID_DEVICE: "901",
  REQUEST_PARAM_ERROR: "910",
  DUPLICATE: "994",
  INVOICE_MUST_FOLLOW_SALES: "922",
} as const;

export function isBusinessSuccess(resultCd: string | null | undefined): boolean {
  return resultCd === RESULT.SUCCESS || resultCd === RESULT.NO_SEARCH || resultCd === RESULT.DEVICE_ALREADY_INSTALLED;
}
