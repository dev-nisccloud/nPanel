# KRA eTIMS API – Integration Reference

Detailed technical reference for integrating with the Kenya Revenue Authority (KRA) eTIMS OSCU/VSCU API. Based on the [official KRA eTIMS Sandbox API documentation](https://developer.go.ke/apis/KRA-ETIMS-SBX) and this project’s implementation.

---

## 1. Overview

### 1.1 Purpose

eTIMS (Electronic Tax Invoice Management System) is KRA’s system for:

- **OSCU** (Offline Sales Control Unit) / **VSCU** (Virtual Sales Control Unit) device initialization
- Tax invoice submission and management
- Item master data, code lists, and basic data management
- Purchase and stock reporting

This document covers **request/response structures**, **common headers**, **result codes**, and **endpoint behaviour** so integrators can implement and debug flows correctly.

### 1.2 Process Flow Categories

KRA groups OSCU/VSCU functionality into eight categories. This doc focuses on:

1. **Initialization** (send only) – device registration and `cmcKey` retrieval  
2. **Basic Data Management** (get only) – code lists, item classification, branch list, notices, taxpayer/customer info  
3. **Item Master Data** – save/select items and compositions  
4. **Sales / Invoicing** – send and query sales transactions  
5. **Purchases** – purchase transaction info  
6. **Stock** – stock movements and master data  
7. **Other** – customer info, user account, insurance (as used in this codebase)

---

## 2. Environments, Base URLs & Authentication

### 2.1 Environments

| Environment | OSCU/VSCU Base URL | Token URL |
|-------------|--------------------|-----------|
| **Sandbox** | `https://sbx.kra.go.ke/etims-oscu/api/v1` | `https://sbx.kra.go.ke/v1/token/generate` |
| **Production** | `https://ra.kra.go.ke/etims-oscu/api/v1` | `https://ra.kra.go.ke/v1/token/generate` |

Project config uses env vars (e.g. `ETIMS_SANDBOX_BASE_URL`, `ETIMS_PRODUCTION_BASE_URL`, `ETIMS_*_TOKEN_URL`) with these URLs as defaults.

### 2.2 Authentication (OAuth 2.0 Client Credentials)

**Step 1 – Obtain access token**

- **Method:** `GET`
- **URL:** `{TOKEN_URL}?grant_type=client_credentials`
- **Headers:**
  - `Authorization: Basic <base64(consumerKey:consumerSecret)>`
- **Success response (HTTP 200):**

```json
{
  "access_token": "<string>",
  "token_type": "Bearer",
  "expires_in": "3600"
}
```

**Step 2 – Use token on OSCU/VSCU APIs**

- **Authorization:** `Bearer <access_token>`
- **apigee_app_id:** Your eTIMS application consumer key (same as `consumerKey` used for token).

---

## 3. Common Request Headers

For all OSCU/VSCU API calls **after** token generation:

| Header | Required | Description |
|--------|----------|-------------|
| `Content-Type` | Yes | `application/json` |
| `Authorization` | Yes | `Bearer <access_token>` |
| `apigee_app_id` | Yes | Consumer key (application identifier) |
| `tin` | Yes | Taxpayer KRA PIN (e.g. `P052377334H`, `A123456789Z`) |
| `bhfId` | Yes | Branch ID (e.g. `00`, `01`) |
| `cmcKey` | Yes* | Communication key from initialization. **Not** sent on `/initialize` itself. |

\*Required for all endpoints except `/initialize`.

---

## 4. Response Structure

### 4.1 Two Response Shapes

The API can return either a **flat** body (as in official docs) or a **wrapped** envelope. Implementations should support both.

**A. Flat (documentation-style)**

```json
{
  "resultCd": "000",
  "resultMsg": "It is succeeded",
  "resultDt": "20200226143124",
  "data": {
    "info": { }
  }
}
```

**B. Wrapped (seen in production/sandbox)**

```json
{
  "responseHeader": {
    "responseCode": 200,
    "responseRefID": "b24e02e1-9f75-42c8-b2e9-fa9339230e98",
    "customerMessage": "Successful",
    "debugMessage": "Successful"
  },
  "responseBody": {
    "resultCd": "000",
    "resultMsg": "Successful",
    "resultDt": "20260303174236",
    "data": {
      "info": { }
    }
  }
}
```

### 4.2 Normalising the Response

To handle both shapes:

1. Let `body = response.responseBody ?? response`.
2. Read result and payload from `body`:
   - `body.resultCd`
   - `body.resultMsg`
   - `body.resultDt`
   - `body.data` / `body.data.info` (as per endpoint).
3. Use `response.responseHeader.customerMessage` or `debugMessage` as fallback for user-facing messages.

### 4.3 Standard Result Fields

| Field | Type | Description |
|-------|------|-------------|
| `resultCd` | String | Result code. `"000"` = success; other values = error (e.g. `"902"` = device already installed). |
| `resultMsg` | String | Human-readable message (e.g. "It is succeeded", "This device is installed"). |
| `resultDt` | String | Result date/time in `yyyyMMddHHmmss` (e.g. `20200226143124`). |
| `data` | Object | Response payload; often under `data.info` for entity details. |

**Success:** Treat as success only when `resultCd === "000"`. Any other non-empty `resultCd` should be treated as failure.

### 4.4 Common Result Codes (examples)

| resultCd | Meaning | Typical handling |
|----------|---------|------------------|
| `000` | Success | Proceed; read `data` / `data.info`. |
| `902` | This device is installed | Initialization only: device already registered; do not expect `cmcKey` in response. Return clear message and/or PRECONDITION_FAILED. |

Other codes should be mapped per KRA documentation and surfaced to the user.

---

## 5. Initialization (Send Only)

### 5.1 Purpose

Maps **KRA PIN**, **Branch ID**, and **Device Serial Number** to the OSCU/VSCU and returns the **communication key (`cmcKey`)** required for all subsequent eTIMS API calls.

**Note:** For VSCU/OSCU initialization, registration and approval of the eTIMS type must already be completed with KRA.

### 5.2 Endpoint

- **Path suffix:** `/initialize`
- **Method:** `POST`
- **Headers:** `Authorization`, `apigee_app_id`, `Content-Type`, `tin`, `bhfId`. **Do not** send `cmcKey` (not yet available).

### 5.3 Request Body

```json
{
  "tin": "A123456789Z",
  "bhfId": "00",
  "dvcSrlNo": "dvcv1130"
}
```

| Parameter | Description | Type | Example |
|-----------|-------------|------|---------|
| `tin` | KRA PIN | String | `A123456789Z` |
| `bhfId` | Branch ID | String | `00` |
| `dvcSrlNo` | Device Serial Number | String | `dvcv1130` |

### 5.4 Success Response (resultCd "000")

**Flat shape (docs):**

```json
{
  "resultCd": "000",
  "resultMsg": "It is succeeded",
  "resultDt": "20200226143124",
  "data": {
    "info": {
      "tin": "A123456789Z",
      "taxprNm": "Taxpayer1130",
      "bsnsActv": "business",
      "bhfId": "00",
      "bhfNm": "Headquater",
      "bhfOpenDt": "20200226",
      "prvncNm": "NAIROBI CITY",
      "dstrtNm": "WESTLANDS",
      "sctrNm": "WON",
      "locDesc": "Westlands Towers",
      "hqYn": "Y",
      "mgrNm": "manage1130_00",
      "mgrTelNo": "0789001130",
      "mgrEmail": "manage113000@test.com",
      "dvcId": "9999911300000001",
      "sdcId": "KRACU013000001",
      "mrcNo": "WIS01000150",
      "cmcKey": "f0b9831bd2334874b7ec815e40347bc4"
    }
  }
}
```

**Important:** `cmcKey` is at **`data.info.cmcKey`** (flat) or **`responseBody.data.info.cmcKey`** (wrapped). It must be stored and sent in the `cmcKey` header for all subsequent requests.

### 5.5 Response Parameter Definition (Success)

| Name | Description | Type |
|------|-------------|------|
| `tin` | Taxpayer Identification Number | String |
| `taxprNm` | Taxpayer Name | String |
| `bsnsActv` | Business Activity | String |
| `bhfId` | Branch Office ID | String |
| `bhfNm` | Branch Office Name | String |
| `bhfOpenDt` | Branch Registration Date | String |
| `prvncNm` | County Name | String |
| `dstrtNm` | District Name | String |
| `sctrNm` | Sector Name | String |
| `locDesc` | Location Description | String |
| `hqYn` | Headquarter Branch Indicator (Y/N) | String |
| `mgrNm` | Manager Name | String |
| `mgrTelNo` | Manager Telephone Number | String |
| `mgrEmail` | Manager Email Address | String |
| `dvcId` | Device ID | String |
| `sdcId` | SDC ID | String |
| `mrcNo` | MRC Number | String |
| **`cmcKey`** | **Communication KEY** | **String** |

### 5.6 Error Response (e.g. resultCd "902")

When the device is already installed, the API may return HTTP 200 with a non-success body, e.g.:

```json
{
  "responseHeader": {
    "responseCode": 200,
    "responseRefID": "b24e02e1-9f75-42c8-b2e9-fa9339230e98",
    "customerMessage": "This device is installed",
    "debugMessage": "This device is installed"
  },
  "responseBody": {
    "resultCd": "902",
    "resultMsg": "This device is installed",
    "resultDt": "20260303174239",
    "data": null
  }
}
```

There is no `cmcKey` in this case. Integrators should detect `resultCd !== "000"` (and specifically `902`) and return a clear message (e.g. PRECONDITION_FAILED: "This eTIMS device is already installed. If you need to use it here, contact KRA/support to reset the device.").

---

## 6. Basic Data Management (Get Only)

These endpoints return standard codes and reference data required for building invoice and item data. **Consistency of data with eTIMS is essential** when sending invoices.

**Common headers for all:** `tin`, `bhfId`, `cmcKey` (plus `Authorization`, `apigee_app_id`, `Content-Type`).

### 6.1 Get Code List

- **Path suffix:** `/selectCodeList` (or `/select-code-list` per docs)
- **Method:** `POST`
- **Request body example:**

```json
{
  "tin": "A123456789Z",
  "bhfId": "00",
  "lastReqDt": "20220101010101"
}
```

| Parameter | Description | Type | Example |
|-----------|-------------|------|---------|
| `tin` | KRA PIN | String | `A123456789Z` |
| `bhfId` | Branch ID | String | `00` |
| `lastReqDt` | Last Request Date and Time | String | `20220101010101` |

### 6.2 Get Item Classification List

- **Path suffix:** `/selectItemClass` (or `/select-item-class`, `/selectItemClsList` per docs)
- **Method:** `POST`
- **Request body example:**

```json
{
  "tin": "P051402944X",
  "bhfId": "00",
  "lastReqDt": "20180523000000"
}
```

### 6.3 Branch List

- **Path suffix:** `/branchList` (client uses `branchList`; docs may show `/branch-list` or `/selectBhfList`)
- **Method:** `POST`
- **Request body example:**

```json
{
  "tin": "P051402944X",
  "bhfId": "00",
  "lastReqDt": "20180520000000"
}
```

### 6.4 Get Notice List

- **Path suffix:** `/selectNoticeList` (docs: `/selectNoticeList` or `/selectNotices`)
- **Method:** `POST`
- **Request body example:**

```json
{
  "tin": "P051402944X",
  "bhfId": "00",
  "lastReqDt": "20180523000000"
}
```

### 6.5 Get Taxpayer Info

- **Path suffix:** `/selectTaxpayerInfo`
- **Method:** `POST`
- **Request body:** `tin`, `bhfId`, `lastReqDt` (same pattern as above).

### 6.6 Get Customer PIN / Customer List

- **Path suffix:** `/selectCustomer` or `/customerPinInfo` (as in this project)
- **Method:** `POST`
- **Request body example:**

```json
{
  "tin": "P051402944X",
  "bhfId": "00",
  "custmTin": "A123456789Z"
}
```

| Parameter | Description | Type |
|-----------|-------------|------|
| `custmTin` | Customer PIN | String |

---

## 7. Item Master Data

### 7.1 Save Item

- **Path suffix:** `/saveItem`
- **Method:** `POST`
- **Headers:** Include `cmcKey`.
- **Request body:** Item payload as per KRA schema (item code, classification, name, tax type, units, etc.).

### 7.2 Select Item Info

- **Path suffix:** `/itemInfo` (client: `itemInfo`)
- **Method:** `POST`
- **Request body:** `tin`, `bhfId`, `lastReqDt`.

### 7.3 Save Item Composition

- **Path suffix:** `/saveItemComposition`
- **Method:** `POST`
- **Request body:** Composition payload.

### 7.4 Imported Item Info / Converted Info

- **Path suffix:** `/importedItemInfo`, `/importedItemConvertedInfo` (or save equivalent)
- **Method:** `POST`
- **Request body:** `tin`, `bhfId`, `lastReqDt` for select; conversion object for save.

---

## 8. Sales / Invoicing

### 8.1 Send Sales Transaction

- **Path suffix:** `/sendSalesTransaction`
- **Method:** `POST`
- **Headers:** `tin`, `bhfId`, `cmcKey`, `Authorization`, `apigee_app_id`, `Content-Type`.
- **Request body:** Single sales transaction object (see below).

**Sales transaction structure (as used in this project):**

- **Header:** `invcNo`, `orgInvcNo`, `custTin`, `custNm`, `salesTyCd`, `rcptTyCd`, `pmtTyCd`, `salesSttsCd`, `cfmDt`, `salesDt`, `totItemCnt`, tax amounts by type (A–E), `totTaxblAmt`, `totTaxAmt`, `totAmt`, `prchrAcptcYn`, `remark`, `regrId`, `regrNm`, `modrId`, `modrNm`, optional cancel/refund fields.
- **Receipt block:** `custTin`, `custMblNo`, `rptNo`, `rcptPbctDt`, `trdeNm`, `adrs`, `topMsg`, `btmMsg`, `prchrAcptcYn`.
- **Line items:** `itemList[]` with `itemSeq`, `itemCd`, `itemClsCd`, `itemNm`, `bcd`, `pkgUnitCd`, `pkg`, `qtyUnitCd`, `qty`, `prc`, `splyAmt`, `dcRt`, `dcAmt`, `taxTyCd`, `taxblAmt`, `taxAmt`, `totAmt`.

Tax type codes (e.g. A, B, C, D, E) and date formats must align with KRA code lists and specifications.

### 8.2 Select Sales Transactions

- **Path suffix:** `/selectSalesTransactions`
- **Method:** `POST`
- **Request body:** `tin`, `bhfId`, `lastReqDt`.

### 8.3 Select Invoice Detail

- **Path suffix:** `/selectInvoiceDetail`
- **Method:** `POST`
- **Request body:** `tin`, `bhfId`, `invcNo`.

---

## 9. Purchases

### 9.1 Get Purchase Transaction Info

- **Path suffix:** `/getPurchaseTransactionInfo`
- **Method:** `POST`
- **Request body:** `tin`, `bhfId`, `lastReqDt`.

### 9.2 Send Purchase Transaction Info

- **Path suffix:** `/sendPurchaseTransactionInfo`
- **Method:** `POST`
- **Request body:** Purchase info payload as per KRA schema.

---

## 10. Stock

### 10.1 Select Stock Move List

- **Path suffix:** `/selectStockMoveLists`
- **Method:** `POST`
- **Request body:** `tin`, `bhfId`, `lastReqDt`.

### 10.2 Insert Stock I/O

- **Path suffix:** `/insert/stockIO`
- **Method:** `POST`
- **Request body:** Stock I/O payload.

### 10.3 Save Stock Master

- **Path suffix:** `/save/stockMaster`
- **Method:** `POST`
- **Request body:** Stock master payload.

---

## 11. Other Endpoints (This Project)

| Path suffix | Method | Purpose |
|-------------|--------|---------|
| `/branchSendCustomerInfo` | POST | Send customer info |
| `/branchUserAccount` | POST | Branch user account |
| `/branchInsuranceInfo` | POST | Branch insurance info |

Headers and body structures follow the same pattern: `tin`, `bhfId`, `cmcKey` in headers; endpoint-specific body.

---

## 12. Date/Time and Code Conventions

- **lastReqDt / resultDt:** Use `yyyyMMddHHmmss` (e.g. `20220101010101`, `20200226143124`).
- **Sales/invoice dates:** Follow KRA format (often `yyyyMMdd` or full datetime as specified).
- **Tax type codes:** A, B, C, D, E as per KRA code list; ensure item and invoice data use consistent codes from `/selectCodeList` and item classification.

---

## 13. Error Handling Summary

1. **HTTP level:** Non-200 responses indicate transport or gateway errors; parse JSON body if present for details.
2. **Application level:** Always check `resultCd` (from `body` = `response.responseBody ?? response`). Only `resultCd === "000"` is success.
3. **Initialization:** If `resultCd === "902"`, do not expect `cmcKey`; return a clear “device already installed” message and do not overwrite existing config with null.
4. **User-facing messages:** Prefer `resultMsg` or `responseHeader.customerMessage` / `debugMessage` for display; avoid exposing raw payloads.

---

## 14. References

- [KRA eTIMS Sandbox API (developer.go.ke)](https://developer.go.ke/apis/KRA-ETIMS-SBX)
- Project implementation: `packages/api/src/lib/etims-client.ts`, `packages/api/src/routers/etims/` (initialization, data, items, sales, stock, etc.).
