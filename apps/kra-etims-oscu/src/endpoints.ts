/**
 * OSCU path maps.
 *
 * Gava Connect uses Apigee suffixes (what nPanel certification scored).
 * Classic OSCU uses the original specification names.
 */

export const CLASSIC_ENDPOINTS = {
  selectInitOsdcInfo: "/selectInitOsdcInfo",
  selectCodeList: "/selectCodeList",
  selectItemClsList: "/selectItemClsList",
  selectBhfList: "/selectBhfList",
  selectNoticeList: "/selectNoticeList",
  selectNotices: "/selectNoticeList",
  selectCustomer: "/selectCustomer",
  selectCustomerList: "/selectCustomerList",
  selectTaxPayerInfo: "/selectCustomer",
  saveBhfCustomer: "/saveBhfCustomer",
  saveBhfUser: "/saveBhfUser",
  saveBhfInsurance: "/saveBhfInsurance",
  selectItemList: "/selectItemList",
  saveItem: "/saveItem",
  saveItemComposition: "/saveItemComposition",
  selectImportItemList: "/selectImportItemList",
  updateImportItem: "/updateImportItem",
  saveTrnsSalesOsdc: "/saveTrnsSalesOsdc",
  selectTrnsSalesList: "/selectTrnsSalesList",
  selectInvoiceDetails: "/selectInvoiceDetails",
  selectTrnsPurchaseSalesList: "/selectTrnsPurchaseSalesList",
  insertTrnsPurchase: "/insertTrnsPurchase",
  selectStockMoveList: "/selectStockMoveList",
  insertStockIO: "/insertStockIO",
  saveStockMaster: "/saveStockMaster",
} as const;

export const GAVA_ENDPOINTS = {
  selectInitOsdcInfo: "/initialize",
  selectCodeList: "/selectCodeList",
  selectItemClsList: "/selectItemClass",
  selectBhfList: "/branchList",
  selectNoticeList: "/selectNoticeList",
  selectNotices: "/selectNotices",
  selectCustomer: "/customerPinInfo",
  selectCustomerList: "/selectCustomerList",
  selectTaxPayerInfo: "/selectTaxpayerInfo",
  saveBhfCustomer: "/branchSendCustomerInfo",
  saveBhfUser: "/branchUserAccount",
  saveBhfInsurance: "/branchInsuranceInfo",
  selectItemList: "/itemInfo",
  saveItem: "/saveItem",
  saveItemComposition: "/saveItemComposition",
  selectImportItemList: "/importedItemInfo",
  updateImportItem: "/importedItemConvertedInfo",
  saveTrnsSalesOsdc: "/sendSalesTransaction",
  selectTrnsSalesList: "/selectSalesTransactions",
  selectInvoiceDetails: "/selectInvoiceDetail",
  selectTrnsPurchaseSalesList: "/getPurchaseTransactionInfo",
  insertTrnsPurchase: "/sendPurchaseTransactionInfo",
  selectStockMoveList: "/selectStockMoveLists",
  insertStockIO: "/insert/stockIO",
  saveStockMaster: "/save/stockMaster",
} as const;

export type KraEndpointKey = keyof typeof GAVA_ENDPOINTS;

export function endpointsFor(host: "gava" | "classic"): Record<KraEndpointKey, string> {
  return host === "gava" ? GAVA_ENDPOINTS : CLASSIC_ENDPOINTS;
}

export function kraLabel(key: KraEndpointKey): string {
  return CLASSIC_ENDPOINTS[key];
}
