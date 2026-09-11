# KRA eTIMS OSCU verification — Postman against nPanel

KRA asked us to run each OSCU function **one request at a time**. You hit **this nPanel API**, not KRA.

- **API host:** [https://loverlike-cinderella-signatureless.ngrok-free.dev](https://loverlike-cinderella-signatureless.ngrok-free.dev) (ngrok tunnel to the server on port **8050**)
- **KRA sandbox (Gava Connect):** `https://sbx.kra.go.ke/etims-oscu/api/v1/{path_suffix}` — nPanel calls this after your Postman request. Token URL stays `https://sbx.kra.go.ke/v1/token/generate`
- After **initialize**, nPanel stores `cmcKey` and sends `tin` / `bhfId` / `cmcKey` to KRA for you

Do **not** run `bun run etims:certification` for this checklist.

Set `ETIMS_CERTIFICATION_PUBLIC=1` on the server so Postman does not need a session cookie.

---

## Postman setup

**Base URL**

```
https://loverlike-cinderella-signatureless.ngrok-free.dev
```

Environment variable `npanelUrl` is that same value.

**tRPC method split** (this is why POST failed on getCodeList)

| Kind | HTTP | How to send input |
|---|---|---|
| **Query** (`get*` lists, `getConfiguration`) | **GET** | Query param `input` = JSON. No body. |
| **Mutation** (`initializeDevice`, `save*`, `send*`) | **POST** | Raw JSON body. No `{ "json": ... }` wrapper. |

Every request still needs header `ngrok-skip-browser-warning: 1`. POST also needs `Content-Type: application/json`.

GET lookup URL:

```
https://loverlike-cinderella-signatureless.ngrok-free.dev/trpc/etims.data.getCodeList?input={"lastReqDt":"20180101000000"}
```

POST mutation URL (unchanged):

```
https://loverlike-cinderella-signatureless.ngrok-free.dev/trpc/etims.initialization.initializeDevice
```

Identity used **inside nPanel → KRA** (from init + DB, not from Postman headers).

Sandbox testing uses **`ETIMS_CERT_APP_TEST_PIN` only**. Do **not** send the integrator/cert PIN (`ETIMS_CERT_TIN` / `P052377334H`) on init, sales, customers, or any other request.

| Field | Value |
|---|---|
| Application Test Pin (`tin` and customer PIN) | `P600004455A` |
| Branch | `00` |
| Device serial | `KRACUO100069163` |

---

## 0. Confirm API is up

**GET** `https://loverlike-cinderella-signatureless.ngrok-free.dev/trpc/etims.auth.getConfiguration`

No body. Expect `isInitialized` in the result.

---

## 1. Device initialization

**Checklist:** authenticate on eTIMS using **Application Test Pin, device serial, branch ID** (not the integrator/cert PIN).

**POST** `https://loverlike-cinderella-signatureless.ngrok-free.dev/trpc/etims.initialization.initializeDevice`

nPanel then calls Gava Connect `POST https://sbx.kra.go.ke/etims-oscu/api/v1/initialize` (no `cmcKey` yet).

```json
{
  "tin": "P600004455A",
  "bhfId": "00",
  "dvcSrlNo": "KRACUO100069163",
  "isSandbox": true
}
```

**Stop until this succeeds.** The result must include `kraInitUrl` ending in `/etims-oscu/api/v1/initialize` (not `etims-api-sbx`). Copy `cmcKey` (nPanel also saves it). Later steps use that stored key automatically. Restart the nPanel server after changing `.env` so this URL is picked up.

---

## Lookups (GET, same `input`)

tRPC **queries** must be **GET**. Put the JSON on the query string as `input` (Params tab in Postman: key `input`, value `{"lastReqDt":"20180101000000"}`). Do not POST these.

Example:

**GET** `https://loverlike-cinderella-signatureless.ngrok-free.dev/trpc/etims.data.getCodeList?input={"lastReqDt":"20180101000000"}`

| # | Checklist | GET path | KRA (Gava Connect) |
|---|---|---|---|
| 2 | Get code list | `/trpc/etims.data.getCodeList` | `/selectCodeList` |
| 3 | Get item classification | `/trpc/etims.data.getItemClassList` | `/selectItemClass` |
| 4 prep | Existing items | `/trpc/etims.items.getItemList` | `/itemInfo` |
| 5 | Get imported items | `/trpc/etims.imports.getImportedItems` | `/importedItemInfo` |
| 7 | Get purchases (want 3) | `/trpc/etims.purchases.getPurchaseTransactions` | `/getPurchaseTransactionInfo` |
| 12 | Branch list (want 3 named branches) | `/trpc/etims.branch.getBranchList` | `/branchList` |
| 14 | Receive stock from HQ | `/trpc/etims.stock.getStockMovements` | `/selectStockMoveLists` |
| 15 | Get notices | `/trpc/etims.data.getNoticeList` | `/selectNoticeList` |

Tax codes for items/sales: **A exempt, B 16%, C zero-rated, D non-VAT**. Skip **E (8%)** — struck through on KRA’s sheet.

From step 3, copy four leaf `itemClsCd` values (`clsA`–`clsD`).

---

## 4. Send item information

**POST** `https://loverlike-cinderella-signatureless.ngrok-free.dev/trpc/etims.items.saveItem`

nPanel → KRA `/saveItem`. Create four goods (A/B/C/D) plus a composition child. `itemCd` = `KE` + `1` + `NT` + `BA` + 7-digit seq.

```json
{
  "item": {
      "itemCd": "KE1NTBA0000001",
      "itemClsCd": "PUT_CLS_B_HERE",
      "itemTyCd": "3",
      "itemNm": "nPanel Cert VAT16",
      "itemStdNm": "nPanel Cert VAT16",
      "orgnNatCd": "KE",
      "pkgUnitCd": "NT",
      "qtyUnitCd": "BA",
      "taxTyCd": "B",
      "btchNo": null,
      "bcd": "NPB0001",
      "dftPrc": 1000,
      "grpPrcL1": 1000,
      "grpPrcL2": 1000,
      "grpPrcL3": 1000,
      "grpPrcL4": 1000,
      "grpPrcL5": 0,
      "addInfo": null,
      "sftyQty": 0,
      "isrcAplcbYn": "N",
      "useYn": "Y",
      "regrId": "Admin",
      "regrNm": "Admin",
      "modrId": "Admin",
      "modrNm": "Admin"
  }
}
```

`itemTyCd` `"1"` = raw, `"2"` = finished, `"3"` = service. Use `"1"` if you will stock/compose; `"3"` if sales-only.

Repeat with `taxTyCd` A/C/D and matching classification. Save `itemCdB` / child code.

---

## 6. Convert imported item

Skip if step 5 was empty (`001`).

**POST** `https://loverlike-cinderella-signatureless.ngrok-free.dev/trpc/etims.imports.confirmImportedItem`

```json
{
  "item": {
      "taskCd": "FROM_STEP_5",
      "dclDe": "FROM_STEP_5",
      "itemSeq": 1,
      "hsCd": "FROM_STEP_5",
      "itemClsCd": "PUT_CLS_B_HERE",
      "itemCd": "KE1NTBA0000001",
      "imptItemSttsCd": "3",
      "modrId": "Admin",
      "modrNm": "Admin",
      "remark": "OSCU verification convert"
  }
}
```

---

## 8. Confirm purchase (send 3 times)

**POST** `https://loverlike-cinderella-signatureless.ngrok-free.dev/trpc/etims.purchases.sendPurchaseTransaction`

Change `invcNo` / `spplrInvcNo` each time (101, 102, 103) or use KRA’s queued invoices from step 7.

```json
{
  "purchase": {
      "spplrTin": "P052100681P",
      "invcNo": 101,
      "orgInvcNo": 0,
      "spplrBhfId": "00",
      "spplrNm": "NAMIRI TECHNOLOGY LIMITED",
      "spplrInvcNo": 101,
      "regTyCd": "M",
      "pchsTyCd": "N",
      "rcptTyCd": "P",
      "pmtTyCd": "01",
      "pchsSttsCd": "02",
      "cfmDt": "20260911110000",
      "pchsDt": "20260911",
      "wrhsDt": null,
      "cnclReqDt": null,
      "cnclDt": null,
      "rfdDt": null,
      "totItemCnt": 1,
      "taxblAmtA": 0, "taxblAmtB": 1000, "taxblAmtC": 0, "taxblAmtD": 0, "taxblAmtE": 0,
      "taxRtA": 0, "taxRtB": 16, "taxRtC": 0, "taxRtD": 0, "taxRtE": 0,
      "taxAmtA": 0, "taxAmtB": 160, "taxAmtC": 0, "taxAmtD": 0, "taxAmtE": 0,
      "totTaxblAmt": 1000,
      "totTaxAmt": 160,
      "totAmt": 1160,
      "remark": "purchase 1 of 3",
      "regrId": "Admin",
      "regrNm": "Admin",
      "modrId": "Admin",
      "modrNm": "Admin",
      "itemList": [
        {
          "itemSeq": 1,
          "itemCd": "KE1NTBA0000001",
          "itemClsCd": "PUT_CLS_B_HERE",
          "itemNm": "nPanel Cert VAT16",
          "bcd": null,
          "pkgUnitCd": "NT",
          "pkg": 1,
          "qtyUnitCd": "BA",
          "qty": 1,
          "prc": 1160,
          "splyAmt": 1160,
          "dcRt": 0,
          "dcAmt": 0,
          "taxblAmt": 1000,
          "taxTyCd": "B",
          "taxAmt": 160,
          "totAmt": 1160
        }
      ]
  }
}
```

`splyAmt` must equal `prc * qty`. Dates: a few minutes behind KRA.

---

## 9. Sales + credit notes

**POST** `https://loverlike-cinderella-signatureless.ngrok-free.dev/trpc/etims.sales.sendSalesTransaction`  
**Credit notes:** `https://loverlike-cinderella-signatureless.ngrok-free.dev/trpc/etims.sales.sendCreditNote`

nPanel → KRA `/sendSalesTransaction`. Keep incrementing `invcNo`. Taxpayer `tin` and customer PIN are both `ETIMS_CERT_APP_TEST_PIN` (`P600004455A`).

### Sale (tax B, one line) — duplicate/edit for other variants

```json
{
  "transaction": {
      "trdInvcNo": "NP1",
      "invcNo": 1,
      "orgInvcNo": 0,
      "custTin": "P600004455A",
      "custNm": "Application Test Customer",
      "salesTyCd": "N",
      "rcptTyCd": "S",
      "pmtTyCd": "01",
      "salesSttsCd": "02",
      "cfmDt": "20260911110000",
      "salesDt": "20260911",
      "stockRlsDt": "20260911110000",
      "cnclReqDt": null,
      "cnclDt": null,
      "rfdDt": null,
      "rfdRsnCd": null,
      "totItemCnt": 1,
      "taxblAmtA": 0, "taxblAmtB": 1000, "taxblAmtC": 0, "taxblAmtD": 0, "taxblAmtE": 0,
      "taxRtA": 0, "taxRtB": 16, "taxRtC": 0, "taxRtD": 0, "taxRtE": 0,
      "taxAmtA": 0, "taxAmtB": 160, "taxAmtC": 0, "taxAmtD": 0, "taxAmtE": 0,
      "totTaxblAmt": 1000,
      "totTaxAmt": 160,
      "totAmt": 1160,
      "prchrAcptcYn": "N",
      "remark": "OSCU verification sale",
      "regrId": "Admin",
      "regrNm": "Admin",
      "modrId": "Admin",
      "modrNm": "Admin",
      "receipt": {
        "custTin": "P600004455A",
        "custMblNo": "0700000000",
        "rcptPbctDt": "20260911110000",
        "trdeNm": "nPanel 2",
        "adrs": "Nairobi",
        "topMsg": null,
        "btmMsg": null,
        "prchrAcptcYn": "N"
      },
      "itemList": [
        {
          "itemSeq": 1,
          "itemCd": "KE1NTBA0000001",
          "itemClsCd": "PUT_CLS_B_HERE",
          "itemNm": "nPanel Cert VAT16",
          "bcd": null,
          "pkgUnitCd": "NT",
          "pkg": 1,
          "qtyUnitCd": "BA",
          "qty": 1,
          "prc": 1160,
          "splyAmt": 1160,
          "dcRt": 0,
          "dcAmt": 0,
          "taxTyCd": "B",
          "taxblAmt": 1000,
          "taxAmt": 160,
          "totAmt": 1160
        }
      ]
  }
}
```

| Variant | What to change |
|---|---|
| **9a** ×2 | Four lines A+B+C+D. Totals: taxbl 4000, tax 160, tot 4160. Save first `invcNo`. |
| **9b** | Two invoices **per** tax A, B, C, D (eight sales, one tax each). |
| **9c** | Two B lines, `dcRt` 10 / `dcAmt` 100 each (after discount: taxbl 900, tax 144, tot 1044 per line). |
| **9d** full CN | Path `sendCreditNote`. Same lines as 9a. `rcptTyCd` `R`, `orgInvcNo` = 9a, `rfdDt`, `rfdRsnCd` `"01"`, new `invcNo`. |
| **9e** partial CN | Credit **one** 9a line only. |
| **9f** over-value CN | Same as 9d with **higher** totals. Expect KRA reject — that is the test. |

Copy `intrlData` / `rcptSign` from successful sales for test 19.

---

## 10. Stock in/out

**POST** `https://loverlike-cinderella-signatureless.ngrok-free.dev/trpc/etims.stock.sendStockIO`

```json
{
  "stockData": {
      "sarNo": 1,
      "orgSarNo": 0,
      "regTyCd": "M",
      "custTin": null,
      "custNm": null,
      "custBhfId": null,
      "sarTyCd": "06",
      "ocrnDt": "20260911",
      "totItemCnt": 1,
      "totTaxblAmt": 10000,
      "totTaxAmt": 1600,
      "totAmt": 11600,
      "remark": "stock in",
      "regrId": "Admin",
      "regrNm": "Admin",
      "modrId": "Admin",
      "modrNm": "Admin",
      "itemList": [
        {
          "itemSeq": 1,
          "itemCd": "KE1NTBA0000001",
          "itemClsCd": "PUT_CLS_B_HERE",
          "itemNm": "nPanel Cert VAT16",
          "bcd": null,
          "pkgUnitCd": "NT",
          "pkg": 1,
          "qtyUnitCd": "BA",
          "qty": 10,
          "itemExprDt": null,
          "prc": 1160,
          "splyAmt": 11600,
          "totDcAmt": 0,
          "taxblAmt": 10000,
          "taxTyCd": "B",
          "taxAmt": 1600,
          "totAmt": 11600
        }
      ]
  }
}
```

If KRA says expected `sarNo`, retry with that number.

---

## 11. Stock inventory

**POST** `https://loverlike-cinderella-signatureless.ngrok-free.dev/trpc/etims.stock.saveStockMaster`

```json
{
  "stockMaster": {
      "itemCd": "KE1NTBA0000001",
      "rsdQty": 10,
      "regrId": "Admin",
      "regrNm": "Admin",
      "modrId": "Admin",
      "modrNm": "Admin"
  }
}
```

---

## 13. Branch user

**POST** `https://loverlike-cinderella-signatureless.ngrok-free.dev/trpc/etims.branch.saveBranchUser`

```json
{
  "user": {
      "userId": "npuser01",
      "userNm": "nPanel Cert User",
      "pwd": "CertPass123!",
      "adrs": "Nairobi",
      "cntc": "0700000001",
      "authCd": "1",
      "remark": "OSCU verification",
      "useYn": "Y",
      "regrId": "Admin",
      "regrNm": "Admin",
      "modrId": "Admin",
      "modrNm": "Admin"
  }
}
```

---

## 16. Branch insurance

**POST** `https://loverlike-cinderella-signatureless.ngrok-free.dev/trpc/etims.branch.saveBranchInsurance`

```json
{
  "insurance": {
      "isrccCd": "ISRCC01",
      "isrccNm": "Test Insurance Co",
      "isrcRt": 10,
      "useYn": "Y",
      "regrId": "Admin",
      "regrNm": "Admin",
      "modrId": "Admin",
      "modrNm": "Admin"
  }
}
```

---

## 17. Item composition

**POST** `https://loverlike-cinderella-signatureless.ngrok-free.dev/trpc/etims.items.saveItemComposition`

```json
{
  "composition": {
      "itemCd": "KE1NTBA0000001",
      "cpstItemCd": "KE1NTBA0000002",
      "cpstQty": 1,
      "regrId": "Admin",
      "regrNm": "Admin",
      "modrId": "Admin",
      "modrNm": "Admin"
  }
}
```

---

## 18. Customer (Application Test Pin)

**POST** `https://loverlike-cinderella-signatureless.ngrok-free.dev/trpc/etims.branch.saveCustomer`

```json
{
  "customer": {
      "custNo": "CUST001",
      "custTin": "P600004455A",
      "custNm": "Application Test Customer",
      "adrs": "Nairobi",
      "telNo": "0700000000",
      "email": "cert@nisccloud.com",
      "faxNo": null,
      "useYn": "Y",
      "remark": "OSCU verification",
      "regrId": "Admin",
      "regrNm": "Admin",
      "modrId": "Admin",
      "modrNm": "Admin"
  }
}
```

---

## 19. Invoice contents

Not a Postman path. Open the signed invoice in nPanel and tick PIN, QR, CU number, date, tax rate, description, SCU ID, internal data, amounts, supplier PIN, discount (9c), credit note (9d/9e), original invoice ref, non-fiscal data.

---

## Run order (Gava Connect dashboard)

Follow this order — it is what the dashboard scores:

1. Init — **done**
2. Code list — **done**
3. Item classification — **done**
4. **Branch list** `GET etims.branch.getBranchList` → `/branchList` (`/selectBhfList`)
5. Notices `GET etims.data.getNotices` → `/selectNotices` (not `getNoticeList`)
6. Save customer `POST etims.branch.saveCustomer` → `/branchSendCustomerInfo`
7. Save branch user `POST etims.branch.saveBranchUser` → `/branchUserAccount`
8. Save branch insurance `POST etims.branch.saveBranchInsurance` → `/branchInsuranceInfo`
9. Product list `GET etims.items.getItemList` → `/itemInfo`
10. Save item `POST etims.items.saveItem`
11. Save item composition `POST etims.items.saveItemComposition`
12. Imported items `GET etims.imports.getImportedItems`
13. Update imported item `POST etims.imports.confirmImportedItem`
14. Save sales `POST etims.sales.sendSalesTransaction`
15. Purchase list `GET etims.purchases.getPurchaseTransactions`
16. Save purchase `POST etims.purchases.sendPurchaseTransaction`
17. Save stock master `POST etims.stock.saveStockMaster`
18. Stock movements `GET etims.stock.getStockMovements`
19. Save stock I/O `POST etims.stock.sendStockIO`
20. Invoice details `GET etims.sales.getInvoiceDetails?input={"invcNo":1}`
21. Sales list `GET etims.sales.getSalesTransactions`
22. Customer list `GET etims.data.getCustomerList`
23. Taxpayer info `GET etims.data.getTaxPayerInfo`

---

## Path cheat sheet

| GET `https://loverlike-cinderella-signatureless.ngrok-free.dev/trpc/...` |
|---|
| `etims.auth.getConfiguration` |
| `etims.data.getCodeList?input={"lastReqDt":"20180101000000"}` |
| `etims.data.getItemClassList?input={"lastReqDt":"20180101000000"}` |
| `etims.branch.getBranchList?input={"lastReqDt":"20180101000000"}` |
| `etims.data.getNotices?input={"lastReqDt":"20180101000000"}` |
| `etims.data.getNoticeList?input={"lastReqDt":"20180101000000"}` |
| `etims.items.getItemList?input={"lastReqDt":"20180101000000"}` |
| `etims.imports.getImportedItems?input={"lastReqDt":"20180101000000"}` |
| `etims.purchases.getPurchaseTransactions?input={"lastReqDt":"20180101000000"}` |
| `etims.stock.getStockMovements?input={"lastReqDt":"20180101000000"}` |
| `etims.sales.getSalesTransactions?input={"lastReqDt":"20180101000000"}` |
| `etims.sales.getInvoiceDetails?input={"invcNo":1}` |
| `etims.data.getCustomerList?input={"lastReqDt":"20180101000000"}` |
| `etims.data.getTaxPayerInfo?input={"lastReqDt":"20180101000000"}` |

| POST `https://loverlike-cinderella-signatureless.ngrok-free.dev/trpc/...` (JSON body) |
|---|
| `etims.initialization.initializeDevice` |
| `etims.items.saveItem` |
| `etims.items.saveItemComposition` |
| `etims.imports.confirmImportedItem` |
| `etims.purchases.sendPurchaseTransaction` |
| `etims.sales.sendSalesTransaction` |
| `etims.sales.sendCreditNote` |
| `etims.stock.sendStockIO` |
| `etims.stock.saveStockMaster` |
| `etims.branch.saveCustomer` |
| `etims.branch.saveBranchUser` |
| `etims.branch.saveBranchInsurance` |
