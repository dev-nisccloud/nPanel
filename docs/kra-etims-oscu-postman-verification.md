# Gava Connect OSCU — Postman runbook

One file. Run **top to bottom**. Isolated cert tree **`etimsCert.*`** (reads `apps/server/.env.etims-certification` only — not live `.env`, not the DB, not Redis).

Leave **`etims.*`** for real nPanel Settings / invoices.

Restart the API after pulling this so `etimsCert` is mounted.

---

## How to send

**Host:** [https://loverlike-cinderella-signatureless.ngrok-free.dev](https://loverlike-cinderella-signatureless.ngrok-free.dev)

| Kind | HTTP | Input |
|---|---|---|
| Lookup (`get*`, `lookup*`) | **GET** | Put JSON on the URL as `?input={...}`. No body. |
| Save (`initializeDevice`, `save*`, `send*`, `confirm*`) | **POST** | Raw JSON body. No `{ "json": ... }` wrapper. |

Every request:

| Header | Value |
|---|---|
| `ngrok-skip-browser-warning` | `1` |
| `Content-Type` | `application/json` on **POST** only |

Pass: `resultCd` `000`. Empty lookup `001` is also a pass. Init `902` = already installed. Sandbox often returns `data: null` (no `cmcKey`). Still a pass if nPanel reuses a **cert-local** key (POST body, `ETIMS_CERT_CMC_KEY`, or `apps/server/.etims-certification/session.json`). Never the live DB.

Do **not** send integrator PIN `P052377334H` as `tin`. OSCU `tin` / customer PIN is Application Test Pin **`P600004480A`**.

Copy as you go: leaf `itemClsCd` from step 3 (`clsB` example `1010150100`), `invcNo` (start 1), `sarNo` (start 1), sale `intrlData` / `rcptSign` / `sdcDateTime`.

Dates below are **2026-09-14** Africa/Nairobi. If you run later, change every `20260914` / `20260914120000`.

Gava Connect **lists** composition and stock master earlier than this. Ignore that list. Stock I/O is **before** composition and master.

---

## 0 — Confirm cert env

**GET** (no `input`, no body)

```
https://loverlike-cinderella-signatureless.ngrok-free.dev/trpc/etimsCert.auth.getConfiguration
```

Expect `config.kraPin` = `P600004480A`, `branchId` = `00`, `usesDatabase` = `false`. `isInitialized` is `false` until step 1. `hasReusableCmcKey` is `true` once a cert-local key exists (env or session file).

---

## 1 — OSCU initialization

**POST**

```
https://loverlike-cinderella-signatureless.ngrok-free.dev/trpc/etimsCert.initialization.initializeDevice
```

```json
{
  "tin": "P600004480A",
  "bhfId": "00",
  "dvcSrlNo": "KRACUO100069163",
  "isSandbox": true
}
```

Body is optional (`{}` uses the cert file). `kraInitUrl` must end in `/etims-oscu/api/v1/initialize`. Still **POST this to KRA** so Gava scores init.

**`000`:** KRA returns `cmcKey`. nPanel stores it in memory and `apps/server/.etims-certification/session.json` (not `etims_configuration`).

**`902` + `data: null`:** expected on a device that is already installed. Reuse order: POST `cmcKey` → `ETIMS_CERT_CMC_KEY` in `.env.etims-certification` → session file → memory. Response should be `success: true`, `reusedExistingCmcKey: true`.

First time you hit 902 with no stored key, send the known key once:

```json
{
  "tin": "P600004480A",
  "bhfId": "00",
  "dvcSrlNo": "KRACUO100069163",
  "isSandbox": true,
  "cmcKey": "PASTE_PRIOR_000_CMC_KEY"
}
```

Restart the API after this code change, then POST init again.

**Stop until this succeeds.**

---

## 2 — Look up list of code

**GET**

```
https://loverlike-cinderella-signatureless.ngrok-free.dev/trpc/etimsCert.data.getCodeList?input={"lastReqDt":"20180101000000"}
```

No body. Expect code catalog (`000` / `001`).

---

## 3 — Look up item classification

**GET**

```
https://loverlike-cinderella-signatureless.ngrok-free.dev/trpc/etimsCert.data.getItemClassList?input={"lastReqDt":"20180101000000"}
```

No body. Copy four **leaf** 10-digit `itemClsCd` values for tax A / B / C / D. Skip E.

Replace every `PUT_CLS_B_HERE` below with the tax-B leaf (often `1010150100`). Use matching classes for A/C/D items.

---

## 4 — Look up branch list

**GET**

```
https://loverlike-cinderella-signatureless.ngrok-free.dev/trpc/etimsCert.branch.getBranchList?input={"lastReqDt":"20180101000000"}
```

No body. Expect named branches.

---

## 5 — Look up notices list

**GET** (dashboard scores this path, not `getNoticeList`)

```
https://loverlike-cinderella-signatureless.ngrok-free.dev/trpc/etimsCert.data.getNotices?input={"lastReqDt":"20180101000000"}
```

No body.

---

## 6 — Save customer branch

**POST**

```
https://loverlike-cinderella-signatureless.ngrok-free.dev/trpc/etimsCert.branch.saveCustomer
```

```json
{
  "customer": {
    "custNo": "CUST001",
    "custTin": "P600004480A",
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

## 7 — Save branch user account

**POST**

```
https://loverlike-cinderella-signatureless.ngrok-free.dev/trpc/etimsCert.branch.saveBranchUser
```

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

## 8 — Save branch insurances

**POST**

```
https://loverlike-cinderella-signatureless.ngrok-free.dev/trpc/etimsCert.branch.saveBranchInsurance
```

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

## 9 — Look up product list

**GET**

```
https://loverlike-cinderella-signatureless.ngrok-free.dev/trpc/etimsCert.items.getItemList?input={"lastReqDt":"20180101000000"}
```

No body. Empty `001` / “no search result” is OK before save item.

---

## 10 — Save item (parent, tax B)

**POST** — goods, not a service. `itemTyCd` must be `"1"` or `"2"` or stock I/O will fail.

```
https://loverlike-cinderella-signatureless.ngrok-free.dev/trpc/etimsCert.items.saveItem
```

```json
{
  "item": {
    "itemCd": "KE1NTBA0000001",
    "itemClsCd": "PUT_CLS_B_HERE",
    "itemTyCd": "1",
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

### 10b — Save item (child, tax A)

Same URL. Change `itemCd` to `KE1NTBA0000002`, `taxTyCd` to `A`, `itemClsCd` to the tax-A leaf, `itemNm` / `bcd` accordingly. `itemTyCd` stays `"1"`.

---

## 11 — Save stock in/out

**POST** — **before** composition and stock master.

```
https://loverlike-cinderella-signatureless.ngrok-free.dev/trpc/etimsCert.stock.sendStockIO
```

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
    "ocrnDt": "20260914",
    "totItemCnt": 2,
    "totTaxblAmt": 20000,
    "totTaxAmt": 1600,
    "totAmt": 21600,
    "remark": "stock in for composition",
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
      },
      {
        "itemSeq": 2,
        "itemCd": "KE1NTBA0000002",
        "itemClsCd": "PUT_CLS_A_HERE",
        "itemNm": "nPanel Cert Exempt",
        "bcd": null,
        "pkgUnitCd": "NT",
        "pkg": 1,
        "qtyUnitCd": "BA",
        "qty": 10,
        "itemExprDt": null,
        "prc": 1000,
        "splyAmt": 10000,
        "totDcAmt": 0,
        "taxblAmt": 10000,
        "taxTyCd": "A",
        "taxAmt": 0,
        "totAmt": 10000
      }
    ]
  }
}
```

If KRA says expected `sarNo`, retry with that number.

---

## 12 — Save item composition

**POST** — fails `Insufficient Stock` if you skipped step 11.

```
https://loverlike-cinderella-signatureless.ngrok-free.dev/trpc/etimsCert.items.saveItemComposition
```

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

## 13 — Look up imported item list

**GET**

```
https://loverlike-cinderella-signatureless.ngrok-free.dev/trpc/etimsCert.imports.getImportedItems?input={"lastReqDt":"20180101000000"}
```

No body. Empty `001` → skip step 14.

---

## 14 — Update imported items

**POST** — copy `taskCd`, `dclDe`, `hsCd`, `itemSeq` from step 13. Skip if 13 was empty.

```
https://loverlike-cinderella-signatureless.ngrok-free.dev/trpc/etimsCert.imports.confirmImportedItem
```

```json
{
  "item": {
    "taskCd": "FROM_STEP_13",
    "dclDe": "FROM_STEP_13",
    "itemSeq": 1,
    "hsCd": "FROM_STEP_13",
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

## 15 — Save sales transaction

**POST**

```
https://loverlike-cinderella-signatureless.ngrok-free.dev/trpc/etimsCert.sales.sendSalesTransaction
```

```json
{
  "transaction": {
    "trdInvcNo": "NP1",
    "invcNo": 1,
    "orgInvcNo": 0,
    "custTin": "P600004480A",
    "custNm": "Application Test Customer",
    "salesTyCd": "N",
    "rcptTyCd": "S",
    "pmtTyCd": "01",
    "salesSttsCd": "02",
    "cfmDt": "20260914120000",
    "salesDt": "20260914",
    "stockRlsDt": "20260914120000",
    "cnclReqDt": null,
    "cnclDt": null,
    "rfdDt": null,
    "rfdRsnCd": null,
    "totItemCnt": 1,
    "taxblAmtA": 0,
    "taxblAmtB": 1000,
    "taxblAmtC": 0,
    "taxblAmtD": 0,
    "taxblAmtE": 0,
    "taxRtA": 0,
    "taxRtB": 16,
    "taxRtC": 0,
    "taxRtD": 0,
    "taxRtE": 0,
    "taxAmtA": 0,
    "taxAmtB": 160,
    "taxAmtC": 0,
    "taxAmtD": 0,
    "taxAmtE": 0,
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
      "custTin": "P600004480A",
      "custMblNo": "0700000000",
      "rcptPbctDt": "20260914120000",
      "trdeNm": "nPanel 4",
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

`splyAmt` must equal `prc * qty`. `prc` is VAT-inclusive. Copy `intrlData`, `rcptSign`, `sdcDateTime` from the response.

Checklist extras (same URL, new `invcNo` each time): mixed A+B+C+D; two invoices per tax A/B/C/D; discount `dcRt` 10 / `dcAmt` 100.

---

## 16 — Look up purchases-sales list

**GET**

```
https://loverlike-cinderella-signatureless.ngrok-free.dev/trpc/etimsCert.purchases.getPurchaseTransactions?input={"lastReqDt":"20180101000000"}
```

No body. Ignore queued rows for the integrator PIN.

---

## 17 — Save purchases information

**POST** — `invcNo` is the next unused session number (`2` if sale used `1`).

```
https://loverlike-cinderella-signatureless.ngrok-free.dev/trpc/etimsCert.purchases.sendPurchaseTransaction
```

```json
{
  "purchase": {
    "spplrTin": "P600004480A",
    "invcNo": 2,
    "orgInvcNo": 0,
    "spplrBhfId": "00",
    "spplrNm": "Application Test Supplier",
    "spplrInvcNo": 2,
    "regTyCd": "M",
    "pchsTyCd": "N",
    "rcptTyCd": "P",
    "pmtTyCd": "01",
    "pchsSttsCd": "02",
    "cfmDt": "20260914120000",
    "pchsDt": "20260914",
    "wrhsDt": null,
    "cnclReqDt": null,
    "cnclDt": null,
    "rfdDt": null,
    "totItemCnt": 1,
    "taxblAmtA": 0,
    "taxblAmtB": 1000,
    "taxblAmtC": 0,
    "taxblAmtD": 0,
    "taxblAmtE": 0,
    "taxRtA": 0,
    "taxRtB": 16,
    "taxRtC": 0,
    "taxRtD": 0,
    "taxRtE": 0,
    "taxAmtA": 0,
    "taxAmtB": 160,
    "taxAmtC": 0,
    "taxAmtD": 0,
    "taxAmtE": 0,
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

Send three times if the checklist asks for three (`invcNo` / `spplrInvcNo` 2, 3, 4).

---

## 18 — Save stock-master information

**POST** — after step 11. Isolated cert does not seed I/O from the DB.

```
https://loverlike-cinderella-signatureless.ngrok-free.dev/trpc/etimsCert.stock.saveStockMaster
```

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

Repeat for `KE1NTBA0000002` if you I/O’d the child.

---

## 19 — Look up stock movement

**GET**

```
https://loverlike-cinderella-signatureless.ngrok-free.dev/trpc/etimsCert.stock.getStockMovements?input={"lastReqDt":"20180101000000"}
```

No body.

---

## 20 — Look up invoice details

**GET**

```
https://loverlike-cinderella-signatureless.ngrok-free.dev/trpc/etimsCert.sales.getInvoiceDetails?input={"invcNo":1}
```

No body. Use the sale `invcNo` from step 15.

---

## 21 — Look up transaction sales list

**GET**

```
https://loverlike-cinderella-signatureless.ngrok-free.dev/trpc/etimsCert.sales.getSalesTransactions?input={"lastReqDt":"20180101000000"}
```

No body.

---

## 22 — Look up customer list

**GET**

```
https://loverlike-cinderella-signatureless.ngrok-free.dev/trpc/etimsCert.data.getCustomerList?input={"lastReqDt":"20180101000000"}
```

No body.

---

## 23 — Look up tax payer info

**GET**

```
https://loverlike-cinderella-signatureless.ngrok-free.dev/trpc/etimsCert.data.getTaxPayerInfo?input={"lastReqDt":"20180101000000"}
```

No body.

---

## 24 — Look up customer by PIN (OSCU extra)

**GET**

```
https://loverlike-cinderella-signatureless.ngrok-free.dev/trpc/etimsCert.data.lookupCustomer?input={"custmTin":"P600004480A"}
```

No body. Not on the Gava dashboard.

---

## 25 — Look up notice list (spec path)

**GET** — dashboard already scored step 5 (`getNotices`).

```
https://loverlike-cinderella-signatureless.ngrok-free.dev/trpc/etimsCert.data.getNoticeList?input={"lastReqDt":"20180101000000"}
```

No body.

---

## 26 — Save credit note (Go Live)

**POST** — `rfdDt` must be after the original sale `sdcDateTime`. New `invcNo` (e.g. `5` if purchases used 2–4).

```
https://loverlike-cinderella-signatureless.ngrok-free.dev/trpc/etimsCert.sales.sendCreditNote
```

```json
{
  "transaction": {
    "trdInvcNo": "NP-CN1",
    "invcNo": 5,
    "orgInvcNo": 1,
    "custTin": "P600004480A",
    "custNm": "Application Test Customer",
    "salesTyCd": "N",
    "rcptTyCd": "R",
    "pmtTyCd": "01",
    "salesSttsCd": "02",
    "cfmDt": "20260914123000",
    "salesDt": "20260914",
    "stockRlsDt": "20260914123000",
    "cnclReqDt": null,
    "cnclDt": null,
    "rfdDt": "20260914123000",
    "rfdRsnCd": "06",
    "totItemCnt": 1,
    "taxblAmtA": 0,
    "taxblAmtB": 1000,
    "taxblAmtC": 0,
    "taxblAmtD": 0,
    "taxblAmtE": 0,
    "taxRtA": 0,
    "taxRtB": 16,
    "taxRtC": 0,
    "taxRtD": 0,
    "taxRtE": 0,
    "taxAmtA": 0,
    "taxAmtB": 160,
    "taxAmtC": 0,
    "taxAmtD": 0,
    "taxAmtE": 0,
    "totTaxblAmt": 1000,
    "totTaxAmt": 160,
    "totAmt": 1160,
    "prchrAcptcYn": "N",
    "remark": "OSCU verification credit note",
    "regrId": "Admin",
    "regrNm": "Admin",
    "modrId": "Admin",
    "modrNm": "Admin",
    "receipt": {
      "custTin": "P600004480A",
      "custMblNo": "0700000000",
      "rcptPbctDt": "20260914123000",
      "trdeNm": "nPanel 4",
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

Over-value credit note (higher totals than the original) is expected to **fail**.

---

## Invoice contents (not tRPC)

After a signed sale, open the nPanel invoice and confirm PIN, QR, CU number, date, tax, description, SCU ID, internal data, amounts, supplier PIN, discount, credit note, original invoice ref.

---

## If it fails

| Symptom | Fix |
|---|---|
| tRPC error on a lookup | Use **GET** with `?input=` — do not POST |
| Hit `/trpc/etims.`… | Wrong tree. Use **`etimsCert`** |
| `Stock IO is empty` | Step 11 before 18 |
| `Insufficient Stock` on composition | Step 11 before 12 |
| `901 It is not valid device` | Application Test Pin + `bhfId` matching the portal |
| Init URL is `etims-api-sbx` | Cert file `ETIMS_SANDBOX_BASE_URL` must be `https://sbx.kra.go.ke/etims-oscu/api/v1`, then restart |
