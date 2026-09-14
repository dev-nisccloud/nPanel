# kra-etims-oscu

Standalone TypeScript client for **KRA eTIMS OSCU** (Online Sales Control Unit). It talks to every function OSCU exposes — initialization through sales, credit notes, purchases, imports, and stock — using the same rules that scored on the Gava Connect dashboard from nPanel.

Use it on **any backend** (Node, Bun, Deno, Cloudflare Workers). Call it from **any frontend** through a small proxy so the consumer secret never ships to the browser.

Zero runtime dependencies. Native `fetch` only.

## Install

This package lives at `apps/kra-etims-oscu` in the nPanel repo. From another app in the workspace:

```ts
import { createKraOscuClient } from "kra-etims-oscu";
```

Copy the folder onto any other backend — `src/` is self-contained.

```bash
cd apps/kra-etims-oscu
bun test          # unit tests, no KRA credentials
bun run test:live # full Gava Connect order (needs consumer key/secret)
```

---

## Environments and URLs

Gava Connect (Developer Platform / Apigee) is what the certification dashboard scores. Classic OSCU (`etims-api*.kra.go.ke`) uses the original spec path names and **does not** update Gava Connect.

| Env | Host | OSCU base | Token |
|---|---|---|---|
| Sandbox | **gava** (default) | `https://sbx.kra.go.ke/etims-oscu/api/v1` | `https://sbx.kra.go.ke/v1/token/generate` |
| Sandbox | classic | `https://etims-api-sbx.kra.go.ke/etims-api` | `https://etims-api-sbx.kra.go.ke/oauth/token` |
| Production | **gava** (default) | `https://ra.kra.go.ke/etims-oscu/api/v1` | `https://ra.kra.go.ke/v1/token/generate` |
| Production | classic | `https://etims-api.kra.go.ke/etims-api` | `https://api.kra.go.ke/v1/token/generate` |

Receipt QR host: sandbox `https://etims-sbx.kra.go.ke`, production `https://etims.kra.go.ke`.  
Path: `/common/link/etims/receipt/indexEtimsReceiptData?{tin}{bhfId}{rcptSign}`

### Auth (every call except init)

1. `GET {tokenUrl}?grant_type=client_credentials` with `Authorization: Basic base64(consumerKey:consumerSecret)`
2. OSCU POST JSON with:
   - `Authorization: Bearer {access_token}`
   - `apigee_app_id` (Gava Connect — required for scoring)
   - `tin`, `bhfId`
   - `cmcKey` — **not** on `/initialize`

Null fields are stripped. KRA often rejects `null`.

---

## Quick start (backend)

```ts
import { createKraOscuClient, buildSale, buildSalesLine, kraDateTime } from "kra-etims-oscu";

const kra = createKraOscuClient({
  environment: "sandbox",          // or "production"
  host: "gava",                    // default; use "classic" only if you must
  consumerKey: process.env.KRA_OSCU_CONSUMER_KEY!,
  consumerSecret: process.env.KRA_OSCU_CONSUMER_SECRET!,
});

const init = await kra.initializeDevice({
  tin: "P600004455A",              // Application Test Pin on sandbox — not the integrator PIN
  bhfId: "00",
  dvcSrlNo: "KRACUO100069163",
  storedCmcKey: process.env.KRA_OSCU_CMC_KEY, // reuse when resultCd is 902
});
// init.kraInitUrl must end in /etims-oscu/api/v1/initialize on Gava Connect

await kra.getCodeList();
await kra.getItemClassList();

const sale = await kra.sendSalesTransaction(
  buildSale({
    trdInvcNo: "INV-0054",
    invcNo: 1,                     // KRA session counter, not your INV- number
    itemList: [
      buildSalesLine({
        itemSeq: 1,
        itemCd: "KE1NTBA0000001",
        itemNm: "Service",
        itemClsCd: "1010150100",
        pkgUnitCd: "NT",
        qtyUnitCd: "BA",
        taxTyCd: "B",
        taxblAmt: 1000,            // exclusive unit amount
        qty: 1,
      }),
    ],
  }),
);
// sale.fiscal = { curRcptNo, totRcptNo, intrlData, rcptSign, sdcDateTime, verificationUrl }
```

Or from env: `createKraOscuClientFromEnv()`.

| Variable | Meaning |
|---|---|
| `KRA_OSCU_ENV` | `sandbox` (default) or `production` |
| `KRA_OSCU_HOST` | `gava` (default) or `classic` |
| `KRA_OSCU_CONSUMER_KEY` / `SECRET` | OAuth app |
| `KRA_OSCU_APIGEE_APP_ID` | defaults to consumer key |
| `KRA_OSCU_TIN` / `BHF_ID` / `CMC_KEY` | optional identity |
| `KRA_OSCU_BASE_URL` / `TOKEN_URL` | override hosts |

---

## Frontend (any framework)

Do **not** put `consumerSecret` in a browser bundle. Run OSCU on your backend and expose a proxy.

**Server (Hono / Next.js / Workers):**

```ts
import { createKraOscuClient, oscuProxyFetchHandler } from "kra-etims-oscu";

const kra = createKraOscuClient({
  environment: "sandbox",
  consumerKey: process.env.KRA_OSCU_CONSUMER_KEY!,
  consumerSecret: process.env.KRA_OSCU_CONSUMER_SECRET!,
});
kra.setIdentity({ tin, bhfId, cmcKey }); // stored server-side after init

export default {
  async fetch(request: Request) {
    if (new URL(request.url).pathname === "/api/kra-oscu") {
      return oscuProxyFetchHandler(kra, request);
    }
  },
};
```

**Browser (React, Vue, Svelte, Angular, …):**

```ts
import { createKraOscuBrowserClient, buildSale, buildSalesLine } from "kra-etims-oscu";

const kra = createKraOscuBrowserClient({
  proxyUrl: "/api/kra-oscu",
  headers: { Authorization: `Bearer ${sessionToken}` },
});

await kra.sendSalesTransaction(buildSale({ /* same builders */ }));
```

The browser client POSTs `{ endpointKey, body, identity? }`. Identity (tin / bhfId / cmcKey) may stay on the server; the consumer secret always does.

---

## Every OSCU function

Eight categories from KRA OSCU Requirements v2.0, plus Gava Connect extras nPanel used.

| Category | Method | Gava Connect path | Classic / spec path |
|---|---|---|---|
| Init | `initializeDevice` | `/initialize` | `/selectInitOsdcInfo` |
| Codes | `getCodeList` | `/selectCodeList` | `/selectCodeList` |
| Codes | `getItemClassList` | `/selectItemClass` | `/selectItemClsList` |
| Codes | `getBranchList` | `/branchList` | `/selectBhfList` |
| Codes | `getNotices` | `/selectNotices` | `/selectNoticeList` |
| Codes | `getNoticeList` | `/selectNoticeList` | `/selectNoticeList` |
| Codes | `getCustomerByPin` | `/customerPinInfo` | `/selectCustomer` |
| Codes | `getCustomerList` | `/selectCustomerList` | `/selectCustomerList` |
| Codes | `getTaxPayerInfo` | `/selectTaxpayerInfo` | `/selectCustomer` |
| Branch | `saveCustomer` | `/branchSendCustomerInfo` | `/saveBhfCustomer` |
| Branch | `saveBranchUser` | `/branchUserAccount` | `/saveBhfUser` |
| Branch | `saveBranchInsurance` | `/branchInsuranceInfo` | `/saveBhfInsurance` |
| Items | `getItemList` | `/itemInfo` | `/selectItemList` |
| Items | `saveItem` | `/saveItem` | `/saveItem` |
| Items | `saveItemComposition` | `/saveItemComposition` | `/saveItemComposition` |
| Imports | `getImportedItems` | `/importedItemInfo` | `/selectImportItemList` |
| Imports | `confirmImportedItem` | `/importedItemConvertedInfo` | `/updateImportItem` |
| Sales | `sendSalesTransaction` | `/sendSalesTransaction` | `/saveTrnsSalesOsdc` |
| Sales | `sendCreditNote` | same | same (`rcptTyCd=R`) |
| Sales | `getSalesTransactions` | `/selectSalesTransactions` | `/selectTrnsSalesList` |
| Sales | `getInvoiceDetails` | `/selectInvoiceDetail` | `/selectInvoiceDetails` |
| Purchases | `getPurchaseTransactions` | `/getPurchaseTransactionInfo` | `/selectTrnsPurchaseSalesList` |
| Purchases | `sendPurchaseTransaction` | `/sendPurchaseTransactionInfo` | `/insertTrnsPurchase` |
| Stock | `getStockMovements` | `/selectStockMoveLists` | `/selectStockMoveList` |
| Stock | `sendStockIO` | `/insert/stockIO` | `/insertStockIO` |
| Stock | `saveStockMaster` | `/save/stockMaster` | `/saveStockMaster` |

Low-level: `kra.call("saveItem", payload)` or `kra.requestRaw(key, body)` (does not throw on `resultCd`).

---

## Hard-won KRA rules (encoded here)

- Empty lists: HTTP 400 “There is no search result” / `resultCd` `001` is **success**, not a failure.
- Init `902` = device already installed. Reuse the stored `cmcKey`.
- `itemCd` = `KE` + type + pkg + qty + 7 digits. **No `X`**. Qty unit in the code must be **2 characters** (`BA`, not `U`).
- Composition needs stock first (I/O, often master). “Insufficient Stock” means you skipped I/O.
- Stock I/O before stock master (“Stock IO is empty”).
- Sales: Gava validates `splyAmt === prc * qty` with **VAT-inclusive** `prc`. Use `buildSalesLine` / `salesLineAmounts`.
- Dates: Africa/Nairobi `yyyyMMddHHmmss` / `yyyyMMdd`. Credit-note `rfdDt` must be **after** the original `sdcDateTime` (UTC local time was rejected as Invalid RfdDt Date).
- Session `invcNo` / `sarNo` are KRA sequential counters, independent of your `INV-` / `CN-` numbers. Parse “Expected: N but found”.
- Skip tax **E** (`useYn` N) on the current cert sheet. Use A exempt, B 16%, C zero-rated, D non-VAT.
- Sandbox OSCU identity is the **Application Test Pin**, not the integrator PIN.
- Omit null JSON fields.

Fiscal fields that **must** print on the invoice/credit note: `curRcptNo`, `totRcptNo`, `intrlData`, `rcptSign`, `sdcDateTime`, plus the QR from `buildReceiptVerifyUrl`.

---

## Builders and lookups

```ts
buildItemCd({ orgnNatCd: "KE", itemTyCd: "1", pkgUnitCd: "NT", qtyUnitCd: "BA", sequence: 1 })
// KE1NTBA0000001

buildCreditNote({ orgInvcNo: 1, rfdRsnCd: "06", originalSdcDateTime: sale.fiscal.sdcDateTime, ... })
```

Static tables from OSCU spec §7: `TAX_TYPE`, `PAYMENT_TYPE`, `STOCK_IO_TYPE`, `CREDIT_NOTE_REASON`, `PACKAGING_UNITS`, `QTY_UNITS`, `CURRENCIES`, `COUNTRIES`, `CODE_CLASS`, `RESULT_CODES`, …  
The **full** live catalogs (252 countries, 52 packaging units, 43 qty units, 179 currencies) come from `getCodeList()` — parse with `flattenCodeList`.

---

## Tests

See [`tests/README.md`](./tests/README.md). Unit tests lock URLs, unwrap, itemCd, tax math, dates, and the live step order. `bun run test:live` walks the same sequence used to certify nPanel, including OSCU functions the dashboard does not list (`getCustomerByPin`, `getNoticeList`, credit note).
