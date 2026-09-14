# Tests — Gava Connect order

This folder is the certification run, in the order that actually scored, plus the extra OSCU functions KRA offers.

```
bun test                 # offline unit tests
bun run test:live        # hits KRA (needs consumer key/secret)
ONLY=01-init bun run test:live
```

## Order we ran (what worked)

Dashboard numbering vs what nPanel had to do:

| Step | Id | Call | Gava path | What we learned |
|---|---|---|---|---|
| 1 | `01-init` | `initializeDevice` | `/initialize` | Application Test Pin, no cmcKey. `902` → reuse stored key. URL must be `sbx.kra.go.ke/etims-oscu/api/v1/initialize`, not classic `etims-api-sbx`. |
| 2 | `02-codes` | `getCodeList` | `/selectCodeList` | `lastReqDt=20180101000000` |
| 3 | `03-item-class` | `getItemClassList` | `/selectItemClass` | A `1010150000` Livestock, B `1010150100` Cats, C `9901200300` Shipstores. Skip E. |
| 4 | `04-branches` | `getBranchList` | `/branchList` | |
| 5 | `05-notices` | `getNotices` | `/selectNotices` | **Not** `/selectNoticeList` for the dashboard. |
| 6 | `06-customer` | `saveCustomer` | `/branchSendCustomerInfo` | `CUST001` / `P600004455A` |
| 7 | `07-user` | `saveBranchUser` | `/branchUserAccount` | `npuser01` |
| 8 | `08-insurance` | `saveBranchInsurance` | `/branchInsuranceInfo` | `ISRCC01` (pharmacy-oriented; OSCU still offers it) |
| 9 | `09-products` | `getItemList` | `/itemInfo` | First call empty = HTTP 400 “There is no search result” |
| 10 | `10-save-item` | `saveItem` | `/saveItem` | Parent `KE1NTBA0000001` tax B, `itemTyCd` `1` |
| 10b | `10b-save-child-item` | `saveItem` | `/saveItem` | Child `KE1NTBA0000002` tax A |
| 11 | `11-stock-io` | `sendStockIO` | `/insert/stockIO` | **Before** composition and master. `sarTyCd=06`, `sarNo=1`, qty 10 both items |
| 12 | `12-composition` | `saveItemComposition` | `/saveItemComposition` | Failed Insufficient Stock until I/O. Parent 0000001, child 0000002, `cpstQty=1` |
| 13 | `13-imports` | `getImportedItems` | `/importedItemInfo` | Real row e.g. `taskCd=20230209030730`, `dclDe=01022023`, `hsCd=63079000` |
| 14 | `14-convert-import` | `confirmImportedItem` | `/importedItemConvertedInfo` | `imptItemSttsCd=3` onto `KE1NTBA0000001` |
| 15 | `15-sale` | `sendSalesTransaction` | `/sendSalesTransaction` | `invcNo=1`, `trdInvcNo=CERT121920`, tax B 1000/160/1160, `pmtTyCd=01`, `rcptTyCd=S`. Inclusive `prc`/`splyAmt`. |
| 16 | `16-purchase-list` | `getPurchaseTransactions` | `/getPurchaseTransactionInfo` | Ignore integrator-PIN queued rows |
| 17 | `17-purchase` | `sendPurchaseTransaction` | `/sendPurchaseTransactionInfo` | Next `invcNo` (2), supplier = test PIN |
| 18 | `18-stock-master` | `saveStockMaster` | `/save/stockMaster` | After I/O. `rsdQty=10` |
| 19 | `19-stock-movements` | `getStockMovements` | `/selectStockMoveLists` | |
| 20 | `20-invoice-details` | `getInvoiceDetails` | `/selectInvoiceDetail` | `invcNo` of the sale |
| 21 | `21-sales-list` | `getSalesTransactions` | `/selectSalesTransactions` | |
| 22 | `22-customer-list` | `getCustomerList` | `/selectCustomerList` | OSCU offers this; nPanel rarely used it |
| 23 | `23-taxpayer` | `getTaxPayerInfo` | `/selectTaxpayerInfo` | |
| 24 | `24-customer-pin` | `getCustomerByPin` | `/customerPinInfo` | Spec search-by-PIN |
| 25 | `25-notice-list` | `getNoticeList` | `/selectNoticeList` | Spec notices path |
| 26 | `26-credit-note` | `sendCreditNote` | `/sendSalesTransaction` | Go Live. Next `invcNo`, `rfdDt` Nairobi time **after** original `sdcDateTime`, `rfdRsnCd=06` |

Source of the numbered list: `gava-connect-order.ts`. Live payloads: `live.ts`. Identity: `fixtures.ts` (Application Test Pin, not secrets).

## Unit files

| File | Locks |
|---|---|
| `00-urls.test.ts` | sandbox/prod Gava + classic hosts, every path suffix |
| `01-unwrap.test.ts` | `responseBody`, `001`/`902`, HTTP 400 empty, omit nulls |
| `02-item-code.test.ts` | no X, 2-char qty in `itemCd` |
| `03-tax.test.ts` | VAT-inclusive `splyAmt === prc * qty` |
| `04-dates-receipt.test.ts` | Nairobi stamps, receipt URL |
| `05-order.test.ts` | every OSCU key appears in the live order; I/O before composition |
