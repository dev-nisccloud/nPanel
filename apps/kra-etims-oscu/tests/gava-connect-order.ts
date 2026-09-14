/**
 * Gava Connect certification order — the sequence that scored on the KRA dashboard,
 * with the working prerequisites we discovered (stock I/O before composition / master).
 *
 * Dashboard numbered list:
 *  1 init  2 codes  3 item class  4 branches  5 notices  6 customer  7 user
 *  8 insurance  9 products  10 save item  11 composition  12 imports
 *  13 convert import  14 sale  15 purchase list  16 purchase  17 stock master
 *  18 stock movements  19 stock I/O  20 invoice  21 sales list  22 customers
 *  23 taxpayer
 *
 * What actually had to happen on nPanel (this live runner follows THIS order):
 *  stock I/O (sarTyCd 06) BEFORE composition and BEFORE stock master
 *  ("Insufficient Stock" / "Stock IO is empty").
 *  Credit note is Go Live after the dashboard (invcNo sequential, rfdDt after sale).
 */

import type { KraEndpointKey } from "../src/endpoints";

export type LiveStepId =
  | "01-init"
  | "02-codes"
  | "03-item-class"
  | "04-branches"
  | "05-notices"
  | "06-customer"
  | "07-user"
  | "08-insurance"
  | "09-products"
  | "10-save-item"
  | "10b-save-child-item"
  | "11-stock-io"
  | "12-composition"
  | "13-imports"
  | "14-convert-import"
  | "15-sale"
  | "16-purchase-list"
  | "17-purchase"
  | "18-stock-master"
  | "19-stock-movements"
  | "20-invoice-details"
  | "21-sales-list"
  | "22-customer-list"
  | "23-taxpayer"
  | "24-customer-pin"
  | "25-notice-list"
  | "26-credit-note";

export type LiveStep = {
  id: LiveStepId;
  n: number;
  testCase: string;
  endpointKey: KraEndpointKey;
  kraGavaPath: string;
  kraClassicPath: string;
  notes: string;
};

export const GAVA_CONNECT_LIVE_ORDER: LiveStep[] = [
  {
    id: "01-init",
    n: 1,
    testCase: "OSCU INITIALIZATION",
    endpointKey: "selectInitOsdcInfo",
    kraGavaPath: "/initialize",
    kraClassicPath: "/selectInitOsdcInfo",
    notes: "No cmcKey header. resultCd 902 = already installed — reuse stored cmcKey.",
  },
  {
    id: "02-codes",
    n: 2,
    testCase: "LOOK UP LIST OF CODE",
    endpointKey: "selectCodeList",
    kraGavaPath: "/selectCodeList",
    kraClassicPath: "/selectCodeList",
    notes: "lastReqDt 20180101000000 for a full catalog.",
  },
  {
    id: "03-item-class",
    n: 3,
    testCase: "LOOK UP ITEM CLASSIFICATION",
    endpointKey: "selectItemClsList",
    kraGavaPath: "/selectItemClass",
    kraClassicPath: "/selectItemClsList",
    notes: "Cert sheet used tax A 1010150000 Livestock, B 1010150100 Cats, C 9901200300 Shipstores. Skip tax E.",
  },
  {
    id: "04-branches",
    n: 4,
    testCase: "LOOK UP BRANCH LIST",
    endpointKey: "selectBhfList",
    kraGavaPath: "/branchList",
    kraClassicPath: "/selectBhfList",
    notes: "Dashboard wants named branches.",
  },
  {
    id: "05-notices",
    n: 5,
    testCase: "LOOK UP NOTICES LIST",
    endpointKey: "selectNotices",
    kraGavaPath: "/selectNotices",
    kraClassicPath: "/selectNoticeList",
    notes: "Dashboard scores /selectNotices, not /selectNoticeList.",
  },
  {
    id: "06-customer",
    n: 6,
    testCase: "SAVE CUSTOMER BRANCH",
    endpointKey: "saveBhfCustomer",
    kraGavaPath: "/branchSendCustomerInfo",
    kraClassicPath: "/saveBhfCustomer",
    notes: "CUST001 / Application Test Pin as custTin.",
  },
  {
    id: "07-user",
    n: 7,
    testCase: "SAVE BRANCH USER ACCOUNT",
    endpointKey: "saveBhfUser",
    kraGavaPath: "/branchUserAccount",
    kraClassicPath: "/saveBhfUser",
    notes: "npuser01.",
  },
  {
    id: "08-insurance",
    n: 8,
    testCase: "SAVE BRANCH INSURANCES",
    endpointKey: "saveBhfInsurance",
    kraGavaPath: "/branchInsuranceInfo",
    kraClassicPath: "/saveBhfInsurance",
    notes: "Pharmacy-oriented; still required for OSCU coverage. ISRCC01.",
  },
  {
    id: "09-products",
    n: 9,
    testCase: "LOOK UP PRODUCT LIST",
    endpointKey: "selectItemList",
    kraGavaPath: "/itemInfo",
    kraClassicPath: "/selectItemList",
    notes: "First call may be HTTP 400 'There is no search result' — treat as empty success.",
  },
  {
    id: "10-save-item",
    n: 10,
    testCase: "SAVE ITEM (parent, tax B)",
    endpointKey: "saveItem",
    kraGavaPath: "/saveItem",
    kraClassicPath: "/saveItem",
    notes: "KE1NTBA0000001, itemTyCd 1, qty unit BA (2 chars in itemCd).",
  },
  {
    id: "10b-save-child-item",
    n: 10.5,
    testCase: "SAVE ITEM (child, tax A)",
    endpointKey: "saveItem",
    kraGavaPath: "/saveItem",
    kraClassicPath: "/saveItem",
    notes: "KE1NTBA0000002 for composition.",
  },
  {
    id: "11-stock-io",
    n: 11,
    testCase: "SAVE STOCK IN/OUT",
    endpointKey: "insertStockIO",
    kraGavaPath: "/insert/stockIO",
    kraClassicPath: "/insertStockIO",
    notes: "Must run BEFORE composition and stock master. sarTyCd 06 adjustment in, sarNo 1, qty 10 both items.",
  },
  {
    id: "12-composition",
    n: 12,
    testCase: "SAVE ITEM COMPOSITION",
    endpointKey: "saveItemComposition",
    kraGavaPath: "/saveItemComposition",
    kraClassicPath: "/saveItemComposition",
    notes: "Fails with Insufficient Stock until I/O. Parent 0000001, child 0000002, cpstQty 1.",
  },
  {
    id: "13-imports",
    n: 13,
    testCase: "LOOK UP IMPORTED ITEM LIST",
    endpointKey: "selectImportItemList",
    kraGavaPath: "/importedItemInfo",
    kraClassicPath: "/selectImportItemList",
    notes: "Use a real customs row (taskCd/dclDe/hsCd), not TASK001 placeholders.",
  },
  {
    id: "14-convert-import",
    n: 14,
    testCase: "UPDATE IMPORTED ITEMS",
    endpointKey: "updateImportItem",
    kraGavaPath: "/importedItemConvertedInfo",
    kraClassicPath: "/updateImportItem",
    notes: "imptItemSttsCd 3 Approved, map onto saved itemCd.",
  },
  {
    id: "15-sale",
    n: 15,
    testCase: "SAVE SALES TRANSACTION",
    endpointKey: "saveTrnsSalesOsdc",
    kraGavaPath: "/sendSalesTransaction",
    kraClassicPath: "/saveTrnsSalesOsdc",
    notes: "invcNo 1, rcptTyCd S, pmtTyCd 01. Print curRcptNo, totRcptNo, intrlData, rcptSign, sdcDateTime.",
  },
  {
    id: "16-purchase-list",
    n: 16,
    testCase: "LOOK UP PURCHASES-SALES LIST",
    endpointKey: "selectTrnsPurchaseSalesList",
    kraGavaPath: "/getPurchaseTransactionInfo",
    kraClassicPath: "/selectTrnsPurchaseSalesList",
    notes: "Supplier sales registered against your PIN.",
  },
  {
    id: "17-purchase",
    n: 17,
    testCase: "SAVE PURCHASES INFORMATION",
    endpointKey: "insertTrnsPurchase",
    kraGavaPath: "/sendPurchaseTransactionInfo",
    kraClassicPath: "/insertTrnsPurchase",
    notes: "Next session invcNo (2 after sale 1). Ignore integrator-PIN queued rows if they are not the test PIN.",
  },
  {
    id: "18-stock-master",
    n: 18,
    testCase: "SAVE STOCK-MASTER INFORMATION",
    endpointKey: "saveStockMaster",
    kraGavaPath: "/save/stockMaster",
    kraClassicPath: "/saveStockMaster",
    notes: "After I/O. rsdQty 10 on parent item.",
  },
  {
    id: "19-stock-movements",
    n: 19,
    testCase: "LOOK UP STOCK MOVEMENT",
    endpointKey: "selectStockMoveList",
    kraGavaPath: "/selectStockMoveLists",
    kraClassicPath: "/selectStockMoveList",
    notes: "HQ → branch stock moves.",
  },
  {
    id: "20-invoice-details",
    n: 20,
    testCase: "LOOK UP INVOICE DETAILS",
    endpointKey: "selectInvoiceDetails",
    kraGavaPath: "/selectInvoiceDetail",
    kraClassicPath: "/selectInvoiceDetails",
    notes: "invcNo of the signed sale.",
  },
  {
    id: "21-sales-list",
    n: 21,
    testCase: "LOOK UP TRANSACTION SALES LIST",
    endpointKey: "selectTrnsSalesList",
    kraGavaPath: "/selectSalesTransactions",
    kraClassicPath: "/selectTrnsSalesList",
    notes: "",
  },
  {
    id: "22-customer-list",
    n: 22,
    testCase: "LOOK UP CUSTOMER LIST",
    endpointKey: "selectCustomerList",
    kraGavaPath: "/selectCustomerList",
    kraClassicPath: "/selectCustomerList",
    notes: "OSCU offers this even if nPanel rarely uses it.",
  },
  {
    id: "23-taxpayer",
    n: 23,
    testCase: "LOOK UP TAX PAYER INFO",
    endpointKey: "selectTaxPayerInfo",
    kraGavaPath: "/selectTaxpayerInfo",
    kraClassicPath: "/selectCustomer",
    notes: "Gava: /selectTaxpayerInfo. Classic maps to /selectCustomer.",
  },
  {
    id: "24-customer-pin",
    n: 24,
    testCase: "LOOK UP CUSTOMER BY PIN",
    endpointKey: "selectCustomer",
    kraGavaPath: "/customerPinInfo",
    kraClassicPath: "/selectCustomer",
    notes: "Spec CustomerExcute.search — not on the dashboard but OSCU offers it.",
  },
  {
    id: "25-notice-list",
    n: 25,
    testCase: "LOOK UP NOTICE LIST (spec path)",
    endpointKey: "selectNoticeList",
    kraGavaPath: "/selectNoticeList",
    kraClassicPath: "/selectNoticeList",
    notes: "Spec NoticeExcute.search. Dashboard used /selectNotices in step 5.",
  },
  {
    id: "26-credit-note",
    n: 26,
    testCase: "SAVE CREDIT NOTE (Go Live)",
    endpointKey: "saveTrnsSalesOsdc",
    kraGavaPath: "/sendSalesTransaction",
    kraClassicPath: "/saveTrnsSalesOsdc",
    notes: "rcptTyCd R, orgInvcNo = original sale, rfdDt Kenya time after sdcDateTime, rfdRsnCd 06. Next invcNo.",
  },
];

export const OSCU_FUNCTION_COVERAGE: Array<{ category: string; endpointKey: KraEndpointKey; specPath: string }> = [
  { category: "Initialization", endpointKey: "selectInitOsdcInfo", specPath: "/selectInitOsdcInfo" },
  { category: "Code Data", endpointKey: "selectCodeList", specPath: "/selectCodeList" },
  { category: "Code Data", endpointKey: "selectItemClsList", specPath: "/selectItemClsList" },
  { category: "Code Data", endpointKey: "selectCustomer", specPath: "/selectCustomer" },
  { category: "Code Data", endpointKey: "selectBhfList", specPath: "/selectBhfList" },
  { category: "Code Data", endpointKey: "selectNoticeList", specPath: "/selectNoticeList" },
  { category: "Code Data", endpointKey: "selectNotices", specPath: "/selectNotices" },
  { category: "Code Data", endpointKey: "selectCustomerList", specPath: "/selectCustomerList" },
  { category: "Code Data", endpointKey: "selectTaxPayerInfo", specPath: "/selectTaxpayerInfo" },
  { category: "Branch Info", endpointKey: "saveBhfCustomer", specPath: "/saveBhfCustomer" },
  { category: "Branch Info", endpointKey: "saveBhfUser", specPath: "/saveBhfUser" },
  { category: "Branch Info", endpointKey: "saveBhfInsurance", specPath: "/saveBhfInsurance" },
  { category: "Item Mgmt", endpointKey: "selectItemList", specPath: "/selectItemList" },
  { category: "Item Mgmt", endpointKey: "saveItem", specPath: "/saveItem" },
  { category: "Item Mgmt", endpointKey: "saveItemComposition", specPath: "/saveItemComposition" },
  { category: "Import Item", endpointKey: "selectImportItemList", specPath: "/selectImportItemList" },
  { category: "Import Item", endpointKey: "updateImportItem", specPath: "/updateImportItem" },
  { category: "Sales", endpointKey: "saveTrnsSalesOsdc", specPath: "/saveTrnsSalesOsdc" },
  { category: "Sales", endpointKey: "selectTrnsSalesList", specPath: "/selectTrnsSalesList" },
  { category: "Sales", endpointKey: "selectInvoiceDetails", specPath: "/selectInvoiceDetails" },
  { category: "Purchase", endpointKey: "selectTrnsPurchaseSalesList", specPath: "/selectTrnsPurchaseSalesList" },
  { category: "Purchase", endpointKey: "insertTrnsPurchase", specPath: "/insertTrnsPurchase" },
  { category: "Stock", endpointKey: "selectStockMoveList", specPath: "/selectStockMoveList" },
  { category: "Stock", endpointKey: "insertStockIO", specPath: "/insertStockIO" },
  { category: "Stock", endpointKey: "saveStockMaster", specPath: "/saveStockMaster" },
];
