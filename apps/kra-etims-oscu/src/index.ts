export {
  KRA_OSCU_URLS,
  DEFAULT_LAST_REQ_DT,
  detectHostKind,
  resolveOscuUrls,
  type KraEnvironment,
  type KraHostKind,
} from "./env";

export {
  CLASSIC_ENDPOINTS,
  GAVA_ENDPOINTS,
  endpointsFor,
  kraLabel,
  type KraEndpointKey,
} from "./endpoints";

export { KraOscuError, RESULT, isBusinessSuccess } from "./errors";

export {
  unwrapKraBody,
  unwrapKraResult,
  kraMessage,
  isEmptySearch,
  parseExpectedCounter,
  omitNullish,
  type KraResult,
} from "./unwrap";

export {
  kraDateTime,
  kraDate,
  parseKraDateTime,
  formatKraDateTimeDisplay,
  isKraDateTime,
  isKraDate,
  addSecondsToKraDateTime,
  creditNoteRefundDt,
} from "./dates";

export {
  CODE_CLASS,
  TAX_TYPE,
  PRODUCT_TYPE,
  TAXPAYER_STATUS,
  SALES_TYPE,
  RECEIPT_TYPE,
  PURCHASE_RECEIPT_TYPE,
  PAYMENT_TYPE,
  TXN_STATUS,
  REGISTRATION_TYPE,
  STOCK_IO_TYPE,
  IMPORT_ITEM_STATUS,
  CREDIT_NOTE_REASON,
  RESULT_CODES,
  PACKAGING_UNITS,
  QTY_UNITS,
  CURRENCIES,
  COUNTRIES,
  BRANCH_STATUS,
  DEFAULT_AUDITOR,
  type TaxTyCd,
  type ItemTyCd,
  type CreditNoteReasonCd,
} from "./codes";

export { roundMoney, taxRate, taxBuckets, salesLineAmounts, mergeTaxHeaders, type TaxBandTotals } from "./tax";

export {
  buildItemCd,
  parseItemCd,
  nextItemCd,
  padQtyUnit,
  itemCdWithExpectedSeq,
  type ItemCdParts,
} from "./item-code";

export {
  buildReceiptVerifyUrl,
  extractRcptSign,
  extractFiscalReceipt,
  FISCAL_PRINT_FIELDS,
  dashEvery4,
  kraReceiptLabel,
  buildCuInvoiceNo,
  type FiscalReceipt,
} from "./receipt";

export {
  KraOscuClient,
  createKraOscuClient,
  createKraOscuClientFromEnv,
  createKraOscuBrowserClient,
  type KraOscuClientConfig,
  type KraOscuTransport,
  type KraRawResponse,
} from "./client";

export { MemoryTokenStore, basicAuth, fetchJson } from "./http";

export {
  dispatchOscuProxy,
  oscuProxyFetchHandler,
  createOscuProxyHandler,
  type OscuProxyPayload,
} from "./proxy";

export {
  buildItem,
  buildCustomer,
  buildBranchUser,
  buildInsurance,
  buildComposition,
  buildSalesLine,
  buildSale,
  buildCreditNote,
  buildPurchase,
  buildStockIoLine,
  buildStockIo,
  buildStockMaster,
  buildConvertImportedItem,
  taxHeadersFromLines,
  type BuiltSalesLineInput,
  type BuildSaleInput,
  type BuildPurchaseInput,
  type Auditor,
} from "./builders";

export {
  flattenCodeList,
  codesByClass,
  parseItemClassList,
  pickItemClassForTax,
  firstImportedItem,
  firstPurchaseSale,
} from "./parse";

export type {
  Yn,
  OscuIdentity,
  DeviceInfo,
  CodeRow,
  ItemClassRow,
  BranchRow,
  NoticeRow,
  CustomerRow,
  TaxpayerRow,
  BranchCustomer,
  BranchUser,
  BranchInsurance,
  ItemRecord,
  ItemComposition,
  ImportedItem,
  ConvertImportedItem,
  SalesLine,
  SalesReceipt,
  SalesTransaction,
  SalesFiscalData,
  PurchaseLine,
  PurchaseTransaction,
  StockIoLine,
  StockIo,
  StockMaster,
  TokenStore,
} from "./types";
