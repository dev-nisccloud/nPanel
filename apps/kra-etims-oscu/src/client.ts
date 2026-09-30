import { DEFAULT_LAST_REQ_DT, detectHostKind, resolveOscuUrls, type KraEnvironment, type KraHostKind } from "./env";
import { endpointsFor, kraLabel, type KraEndpointKey } from "./endpoints";
import { KraOscuError, isBusinessSuccess, RESULT } from "./errors";
import { basicAuth, fetchJson, MemoryTokenStore } from "./http";
import { omitNullish, unwrapKraResult, kraMessage, isEmptySearch, type KraResult } from "./unwrap";
import { extractFiscalReceipt, type FiscalReceipt } from "./receipt";
import type {
  OscuIdentity,
  TokenStore,
  DeviceInfo,
  ItemRecord,
  ItemComposition,
  BranchCustomer,
  BranchUser,
  BranchInsurance,
  ConvertImportedItem,
  SalesTransaction,
  PurchaseTransaction,
  StockIo,
  StockMaster,
} from "./types";

const TOKEN_BUFFER_MS = 60_000;

export type KraOscuTransport = (
  key: KraEndpointKey,
  body: Record<string, unknown>,
  opts?: { identity?: OscuIdentity | null; requireCmcKey?: boolean },
) => Promise<KraResult<unknown>>;

export type KraOscuClientConfig = {
  environment: KraEnvironment;
  /** Defaults to Gava Connect (what the certification dashboard scores). */
  host?: KraHostKind;
  consumerKey?: string;
  consumerSecret?: string;
  /** Defaults to consumerKey. Required on Gava Connect. */
  apigeeAppId?: string;
  baseUrl?: string;
  tokenUrl?: string;
  tokenStore?: TokenStore;
  /**
   * Replace the HTTP call. Used by frontends that POST to your backend proxy
   * so the consumer secret never leaves the server.
   */
  transport?: KraOscuTransport;
};

export type KraRawResponse = {
  endpointKey: KraEndpointKey;
  kraPath: string;
  url: string;
  statusCode: number;
  bodyText: string;
  bodyJson: unknown | null;
};

export class KraOscuClient {
  readonly environment: KraEnvironment;
  readonly host: KraHostKind;
  readonly baseUrl: string;
  readonly tokenUrl: string;
  private readonly consumerKey: string;
  private readonly consumerSecret: string;
  private readonly apigeeAppId: string;
  private readonly tokenStore: TokenStore;
  private readonly transport: KraOscuTransport | null;
  private identity: OscuIdentity | null = null;

  constructor(config: KraOscuClientConfig) {
    this.environment = config.environment;
    const urls = resolveOscuUrls(config.environment, config.host ?? "gava");
    this.baseUrl = (config.baseUrl ?? urls.baseUrl).replace(/\/+$/, "");
    this.tokenUrl = (config.tokenUrl ?? urls.tokenUrl).replace(/\/+$/, "");
    this.host = config.host ?? detectHostKind(this.baseUrl);
    this.consumerKey = (config.consumerKey ?? "").trim();
    this.consumerSecret = (config.consumerSecret ?? "").trim();
    this.apigeeAppId = (config.apigeeAppId ?? this.consumerKey).trim();
    this.tokenStore = config.tokenStore ?? new MemoryTokenStore();
    this.transport = config.transport ?? null;
    if (!this.transport && (!this.consumerKey || !this.consumerSecret)) {
      throw new Error("consumerKey and consumerSecret are required unless a proxy transport is set.");
    }
  }

  setIdentity(identity: OscuIdentity): this {
    this.identity = {
      tin: identity.tin.trim(),
      bhfId: identity.bhfId.trim(),
      cmcKey: identity.cmcKey.trim(),
    };
    return this;
  }

  getIdentity(): OscuIdentity {
    if (!this.identity?.cmcKey) {
      throw new Error("OSCU identity is not set. Call initializeDevice() or setIdentity({ tin, bhfId, cmcKey }).");
    }
    return this.identity;
  }

  getIdentityOrNull(): OscuIdentity | null {
    return this.identity;
  }

  path(key: KraEndpointKey): string {
    return endpointsFor(this.host)[key];
  }

  url(key: KraEndpointKey): string {
    return `${this.baseUrl}${this.path(key)}`;
  }

  async getToken(force = false): Promise<string> {
    if (this.transport) {
      throw new Error("getToken() is not available on a proxy client. Tokens stay on the server.");
    }
    if (!force) {
      const cached = await this.tokenStore.get();
      if (cached) return cached.token;
    }
    const auth = basicAuth(this.consumerKey, this.consumerSecret);
    const url = `${this.tokenUrl}?grant_type=client_credentials`;
    const { status, text, json } = await fetchJson(url, {
      method: "GET",
      headers: { Authorization: `Basic ${auth}` },
    });
    if (status !== 200) {
      throw new KraOscuError({
        message: `Token request failed (${status}): ${text}`,
        statusCode: status,
        endpointKey: "token",
        url,
        body: json,
      });
    }
    const data = (json ?? {}) as { access_token?: string; expires_in?: string };
    if (!data.access_token) {
      throw new KraOscuError({
        message: `Token response missing access_token: ${text}`,
        statusCode: status,
        endpointKey: "token",
        url,
        body: json,
      });
    }
    const expiresIn = Number.parseInt(data.expires_in ?? "3600", 10);
    await this.tokenStore.set(data.access_token, Date.now() + expiresIn * 1000 - TOKEN_BUFFER_MS);
    return data.access_token;
  }

  async clearToken(): Promise<void> {
    await this.tokenStore.clear();
  }

  /**
   * Raw POST. Does not throw on KRA business `resultCd`.
   * Still retries once on HTTP 401.
   */
  async requestRaw(
    key: KraEndpointKey,
    body: Record<string, unknown>,
    opts?: { identity?: OscuIdentity | null; requireCmcKey?: boolean },
  ): Promise<KraRawResponse> {
    const requireCmcKey = opts?.requireCmcKey ?? key !== "selectInitOsdcInfo";
    const identity =
      opts?.identity === undefined ? (requireCmcKey ? this.getIdentity() : this.identity) : opts.identity;

    if (!identity?.tin || !identity.bhfId) {
      throw new Error(`tin and bhfId are required for ${key}`);
    }
    if (requireCmcKey && !identity.cmcKey) {
      throw new Error(`cmcKey is required for ${key}`);
    }

    const url = this.url(key);
    const token = await this.getToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      tin: identity.tin,
      bhfId: identity.bhfId,
    };
    if (this.host === "gava") headers.apigee_app_id = this.apigeeAppId;
    if (requireCmcKey) headers.cmcKey = identity.cmcKey;

    const payload = omitNullish({
      tin: identity.tin,
      bhfId: identity.bhfId,
      ...(requireCmcKey ? { cmcKey: identity.cmcKey } : {}),
      ...body,
    });

    const doPost = async (bearer: string) =>
      fetchJson(url, {
        method: "POST",
        headers: { ...headers, Authorization: `Bearer ${bearer}` },
        body: JSON.stringify(payload),
      });

    let res = await doPost(token);
    if (res.status === 401) {
      await this.clearToken();
      const fresh = await this.getToken(true);
      res = await doPost(fresh);
    }

    return {
      endpointKey: key,
      kraPath: this.path(key),
      url,
      statusCode: res.status,
      bodyText: res.text,
      bodyJson: res.json,
    };
  }

  async request<T = unknown>(
    key: KraEndpointKey,
    body: Record<string, unknown>,
    opts?: { identity?: OscuIdentity | null; requireCmcKey?: boolean },
  ): Promise<KraResult<T>> {
    if (this.transport) {
      const identity = opts?.identity === undefined ? this.identity : opts.identity;
      return this.transport(key, body, { ...opts, identity }) as Promise<KraResult<T>>;
    }

    const raw = await this.requestRaw(key, body, opts);
    const empty = isEmptySearch(raw.statusCode, raw.bodyJson, raw.bodyText);
    const result = unwrapKraResult<T>(raw.bodyJson, raw.statusCode);

    if (empty) {
      return {
        ...result,
        resultCd: result.resultCd ?? RESULT.NO_SEARCH,
        resultMsg: result.resultMsg ?? kraMessage(raw.bodyJson, raw.bodyText),
        data: (result.data ?? null) as T | null,
      };
    }

    if (raw.statusCode !== 200 && !isBusinessSuccess(result.resultCd)) {
      throw new KraOscuError({
        message: `eTIMS API (${key} → ${kraLabel(key)}) HTTP ${raw.statusCode}: ${kraMessage(raw.bodyJson, raw.bodyText)}`,
        statusCode: raw.statusCode,
        resultCd: result.resultCd,
        resultMsg: kraMessage(raw.bodyJson, raw.bodyText),
        endpointKey: key,
        url: raw.url,
        body: raw.bodyJson,
      });
    }

    if (result.resultCd && !isBusinessSuccess(result.resultCd)) {
      throw new KraOscuError({
        message: `eTIMS API (${key}) resultCd=${result.resultCd}: ${result.resultMsg}`,
        statusCode: raw.statusCode,
        resultCd: result.resultCd,
        resultMsg: result.resultMsg ?? "",
        endpointKey: key,
        url: raw.url,
        body: raw.bodyJson,
      });
    }

    return result;
  }

  /** Call any OSCU function by key. */
  async call<T = unknown>(key: KraEndpointKey, body: Record<string, unknown> = {}): Promise<KraResult<T>> {
    return this.request<T>(key, body);
  }

  private lastReq(lastReqDt = DEFAULT_LAST_REQ_DT) {
    return { lastReqDt };
  }

  // ── 1. Initialization ──────────────────────────────────────────

  async initializeDevice(opts: { tin: string; bhfId: string; dvcSrlNo: string; storedCmcKey?: string }) {
    const identity: OscuIdentity = {
      tin: opts.tin,
      bhfId: opts.bhfId,
      cmcKey: opts.storedCmcKey?.trim() || this.identity?.cmcKey || "",
    };
    const result = await this.request<{ info?: DeviceInfo | null }>(
      "selectInitOsdcInfo",
      { dvcSrlNo: opts.dvcSrlNo },
      { identity, requireCmcKey: false },
    );
    const info = (result.data as { info?: DeviceInfo } | null)?.info ?? null;
    const cmcKey = info?.cmcKey?.trim() || identity.cmcKey || "";
    if (cmcKey) this.setIdentity({ tin: opts.tin, bhfId: opts.bhfId, cmcKey });
    return {
      ...result,
      kraInitUrl: this.url("selectInitOsdcInfo"),
      info,
      cmcKey: cmcKey || null,
      reusedExistingCmcKey: result.resultCd === RESULT.DEVICE_ALREADY_INSTALLED || (!info?.cmcKey && Boolean(cmcKey)),
    };
  }

  // ── 2. Code / classification / notices / taxpayer ──────────────

  async getCodeList(lastReqDt?: string) {
    return this.request<{ clsList?: unknown[]; codeList?: unknown[] }>("selectCodeList", this.lastReq(lastReqDt));
  }

  async getItemClassList(lastReqDt?: string) {
    return this.request<{ itemClsList?: unknown[] }>("selectItemClsList", this.lastReq(lastReqDt));
  }

  async getBranchList(lastReqDt?: string) {
    return this.request<{ bhfList?: unknown[] }>("selectBhfList", this.lastReq(lastReqDt));
  }

  /** Gava Connect dashboard scores `/selectNotices`. */
  async getNotices(lastReqDt?: string) {
    return this.request<{ noticeList?: unknown[] }>("selectNotices", this.lastReq(lastReqDt));
  }

  /** Spec name `/selectNoticeList` (also offered; dashboard uses getNotices). */
  async getNoticeList(lastReqDt?: string) {
    return this.request<{ noticeList?: unknown[] }>("selectNoticeList", this.lastReq(lastReqDt));
  }

  async getCustomerByPin(custmTin: string, lastReqDt?: string) {
    return this.request("selectCustomer", { custmTin, lastReqDt: lastReqDt ?? DEFAULT_LAST_REQ_DT });
  }

  async getCustomerList(lastReqDt?: string) {
    return this.request<{ custList?: unknown[] }>("selectCustomerList", this.lastReq(lastReqDt));
  }

  async getTaxPayerInfo(lastReqDt?: string) {
    return this.request("selectTaxPayerInfo", this.lastReq(lastReqDt));
  }

  // ── 3. Branch send ─────────────────────────────────────────────

  async saveCustomer(customer: BranchCustomer) {
    return this.request("saveBhfCustomer", { ...customer });
  }

  async saveBranchUser(user: BranchUser) {
    return this.request("saveBhfUser", { ...user });
  }

  async saveBranchInsurance(insurance: BranchInsurance) {
    return this.request("saveBhfInsurance", { ...insurance });
  }

  // ── 4. Items ───────────────────────────────────────────────────

  async getItemList(lastReqDt?: string) {
    return this.request<{ itemList?: ItemRecord[] }>("selectItemList", this.lastReq(lastReqDt));
  }

  async saveItem(item: ItemRecord) {
    return this.request("saveItem", { ...item });
  }

  async saveItemComposition(composition: ItemComposition) {
    return this.request("saveItemComposition", { ...composition });
  }

  // ── 5. Imports ─────────────────────────────────────────────────

  async getImportedItems(lastReqDt?: string) {
    return this.request<{ itemList?: unknown[] }>("selectImportItemList", this.lastReq(lastReqDt));
  }

  async confirmImportedItem(item: ConvertImportedItem) {
    return this.request("updateImportItem", { ...item });
  }

  // ── 6. Sales ───────────────────────────────────────────────────

  async sendSalesTransaction(transaction: SalesTransaction) {
    const result = await this.request<{
      curRcptNo?: number | string;
      totRcptNo?: number | string;
      intrlData?: string;
      rcptSign?: string;
      sdcDateTime?: string;
    }>("saveTrnsSalesOsdc", { ...transaction });
    const identity = this.getIdentityOrNull();
    const fiscal: FiscalReceipt | null = identity
      ? extractFiscalReceipt(result.raw ?? result.data, {
          tin: identity.tin,
          bhfId: identity.bhfId,
          environment: this.environment,
        })
      : null;
    return { ...result, fiscal };
  }

  async sendCreditNote(transaction: SalesTransaction) {
    return this.sendSalesTransaction({ ...transaction, rcptTyCd: "R" });
  }

  async getSalesTransactions(lastReqDt?: string) {
    return this.request("selectTrnsSalesList", this.lastReq(lastReqDt));
  }

  async getInvoiceDetails(invcNo: number) {
    return this.request("selectInvoiceDetails", { invcNo });
  }

  // ── 7. Purchases ───────────────────────────────────────────────

  async getPurchaseTransactions(lastReqDt?: string) {
    return this.request<{ saleList?: unknown[] }>("selectTrnsPurchaseSalesList", this.lastReq(lastReqDt));
  }

  async sendPurchaseTransaction(purchase: PurchaseTransaction) {
    return this.request("insertTrnsPurchase", { ...purchase });
  }

  // ── 8. Stock ───────────────────────────────────────────────────

  async getStockMovements(lastReqDt?: string) {
    return this.request("selectStockMoveList", this.lastReq(lastReqDt));
  }

  async sendStockIO(stock: StockIo) {
    return this.request("insertStockIO", { ...stock });
  }

  async saveStockMaster(master: StockMaster) {
    return this.request("saveStockMaster", { ...master });
  }
}

export function createKraOscuClient(config: KraOscuClientConfig): KraOscuClient {
  return new KraOscuClient(config);
}

export function createKraOscuClientFromEnv(
  env: Record<string, string | undefined> = typeof process !== "undefined" ? process.env : {},
): KraOscuClient {
  const environment: KraEnvironment = env.KRA_OSCU_ENV === "production" ? "production" : "sandbox";
  const host: KraHostKind = env.KRA_OSCU_HOST === "classic" ? "classic" : "gava";
  const client = createKraOscuClient({
    environment,
    host,
    consumerKey: env.KRA_OSCU_CONSUMER_KEY ?? env.ETIMS_CONSUMER_KEY,
    consumerSecret: env.KRA_OSCU_CONSUMER_SECRET ?? env.ETIMS_CONSUMER_SECRET,
    apigeeAppId: env.KRA_OSCU_APIGEE_APP_ID ?? env.ETIMS_APIGEE_APP_ID,
    baseUrl: env.KRA_OSCU_BASE_URL ?? env.ETIMS_BASE_URL,
    tokenUrl: env.KRA_OSCU_TOKEN_URL ?? env.ETIMS_TOKEN_URL,
  });
  const tin = env.KRA_OSCU_TIN ?? env.ETIMS_TIN;
  const bhfId = env.KRA_OSCU_BHF_ID ?? env.ETIMS_BHF_ID ?? "00";
  const cmcKey = env.KRA_OSCU_CMC_KEY ?? env.ETIMS_CMC_KEY;
  if (tin && cmcKey) client.setIdentity({ tin, bhfId, cmcKey });
  return client;
}

/**
 * Browser / any frontend: POST each OSCU call to YOUR backend.
 * Never put consumerSecret in a frontend bundle.
 */
export function createKraOscuBrowserClient(opts: {
  proxyUrl: string;
  environment?: KraEnvironment;
  host?: KraHostKind;
  headers?: Record<string, string>;
}): KraOscuClient {
  return new KraOscuClient({
    environment: opts.environment ?? "sandbox",
    host: opts.host ?? "gava",
    transport: async (key, body, reqOpts) => {
      const res = await fetch(opts.proxyUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(opts.headers ?? {}) },
        body: JSON.stringify({
          endpointKey: key,
          body,
          identity: reqOpts?.identity ?? null,
          requireCmcKey: reqOpts?.requireCmcKey,
        }),
      });
      const json = (await res.json().catch(() => null)) as Record<string, unknown> | null;
      if (!res.ok) {
        throw new KraOscuError({
          message: String(json?.message ?? json?.resultMsg ?? `Proxy HTTP ${res.status}`),
          statusCode: res.status,
          resultCd: typeof json?.resultCd === "string" ? json.resultCd : null,
          resultMsg: typeof json?.resultMsg === "string" ? json.resultMsg : undefined,
          endpointKey: key,
          url: opts.proxyUrl,
          body: json,
        });
      }
      return json as KraResult<unknown>;
    },
  });
}
