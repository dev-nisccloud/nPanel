# KRA eTIMS Online Sales Control Unit (OSCU)   Complete Developer Guide

> **Document Source:** KRA OSCU Requirements & Communication Protocols v2.0 (April 2023)  
> **Issuing Authority:** Kenya Revenue Authority (KRA)   Domestic Taxes Department  
> **Classification:** PUBLIC

---

## Table of Contents

1. [Overview & Introduction](#1-overview--introduction)
2. [Environments & API Endpoints](#2-environments--api-endpoints)
3. [Onboarding & Application Process](#3-onboarding--application-process)
4. [Technical Architecture](#4-technical-architecture)
5. [OSCU Function Categories](#5-oscu-function-categories)
6. [API Reference   All Endpoints](#6-api-reference--all-endpoints)
   - 6.1 [Device Initialization](#61-device-initialization)
   - 6.2 [Code Information](#62-code-information)
   - 6.3 [Customer (Taxpayer) Search](#63-customer-taxpayer-search)
   - 6.4 [Notice Search](#64-notice-search)
   - 6.5 [Item Classification Search](#65-item-classification-search)
   - 6.6 [Item Save](#66-item-save)
   - 6.7 [Item Search (List)](#67-item-search-list)
   - 6.8 [Branch Search](#68-branch-search)
   - 6.9 [Branch Customer Save](#69-branch-customer-save)
   - 6.10 [Branch User Save](#610-branch-user-save)
   - 6.11 [Branch Insurance Save](#611-branch-insurance-save)
   - 6.12 [Import Item Search](#612-import-item-search)
   - 6.13 [Import Item Update](#613-import-item-update)
   - 6.14 [Sales Transaction Save](#614-sales-transaction-save)
   - 6.15 [Purchase Sales Search](#615-purchase-sales-search)
   - 6.16 [Purchase Save](#616-purchase-save)
   - 6.17 [Stock Movement Search](#617-stock-movement-search)
   - 6.18 [Stock IO Save](#618-stock-io-save)
   - 6.19 [Stock Master Save](#619-stock-master-save)
7. [Code Definitions & Lookup Tables](#7-code-definitions--lookup-tables)
   - 7.1 [Tax Type](#71-tax-type)
   - 7.2 [Taxpayer Status](#72-taxpayer-status)
   - 7.3 [Product Type](#73-product-type)
   - 7.4 [Countries Code](#74-countries-code)
   - 7.5 [Packaging Unit](#75-packaging-unit)
   - 7.6 [Unit of Quantity](#76-unit-of-quantity)
   - 7.7 [Currency](#77-currency)
   - 7.8 [Transaction Type](#78-transaction-type)
   - 7.9 [Sales Receipt Type](#79-sales-receipt-type)
   - 7.10 [Payment Method](#710-payment-method)
   - 7.11 [Transaction Progress](#711-transaction-progress)
   - 7.12 [Registration Type](#712-registration-type)
   - 7.13 [Purchase Receipt Type](#713-purchase-receipt-type)
   - 7.14 [Stock In/Out](#714-stock-inout)
   - 7.15 [Import Item Status](#715-import-item-status)
   - 7.16 [Credit Note Reason](#716-credit-note-reason)
   - 7.17 [API Response Codes](#717-api-response-codes)
   - 7.18 [Item Code Structure](#718-item-code-structure)
8. [Data Flow & Integration Patterns](#8-data-flow--integration-patterns)
9. [Error Handling Strategy](#9-error-handling-strategy)
10. [Common Integration Scenarios](#10-common-integration-scenarios)
11. [Quick Reference Cheat Sheet](#11-quick-reference-cheat-sheet)

---

## 1. Overview & Introduction

### What is OSCU?

The **Online Sales Control Unit (OSCU)** is KRA's communication middleware that sits between a trader's private **Trader Invoicing System (TIS)** and the **KRA eTIMS API server**. It handles:

- Sending and receiving business data (sales, purchases, stock, items, etc.) to/from eTIMS
- Encryption and signature management via an internal module called **SKMM** (Signature & Key Management Module)
- Device authentication and communication key management

Think of OSCU as a secure gateway adapter: your TIS speaks to OSCU, and OSCU speaks to KRA.

```
┌─────────────┐         ┌──────────────┐         ┌──────────────────┐
│  Your TIS   │ ──────► │ OSCU Library │ ──────► │ KRA eTIMS Server │
│ Application │ ◄────── │  (Java/.NET) │ ◄────── │   (Production /  │
│             │         │  + SKMM      │         │    Sandbox)      │
└─────────────┘         └──────────────┘         └──────────────────┘
```

> **Important Note for non-Java developers:** If you are not using the OSCU Java Library, you can **connect directly to the eTIMS API server** without passing through OSCU Library. The API uses standard JSON over HTTPS, so any HTTP client in any language will work.

### Key Terms

| Term | Meaning |
|------|---------|
| **TIS** | Trader Invoicing System   your business software (ERP, POS, accounting system, etc.) |
| **OSCU** | Online Sales Control Unit   the KRA middleware/library |
| **eTIMS** | Electronic Tax Invoice Management System   KRA's central server |
| **SKMM** | Signature & Key Management Module   handles crypto inside OSCU |
| **PIN** | KRA Tax Identification Number (also called `tin` in the API) |
| **bhfId** | Branch Office ID   `"00"` = head office, `"01"` through `"99"` = branches |
| **cmcKey** | Communication Key   issued by KRA on device initialization, required in every API call |
| **intrlData** | Internal Data   a 26-character value returned after sales registration, printed on receipts |
| **rcptSign** | Receipt Signature   16-character value returned after sales registration, printed on receipts |

---

## 2. Environments & API Endpoints

OSCU has two operating environments. **Never mix production credentials with the sandbox environment.**

| Environment | Purpose | Base URL |
|-------------|---------|----------|
| **Production** | Live taxpayer data, real fiscal obligations | `https://etims-api.kra.go.ke/etims-api/` |
| **Test / Sandbox** | Development and testing, no real fiscal impact | `https://etims-api-sbx.kra.go.ke/etims-api/` |

### Interface Details

| Property | Value |
|----------|-------|
| Data Format | **JSON** |
| Protocol | **HTTPS** |
| HTTP Method | **POST** (for all endpoints in this spec) |

### How to Build a Full Endpoint URL

Append the endpoint path to the base URL. For example:

```
Production:  https://etims-api.kra.go.ke/etims-api/selectInitOsdcInfo
Sandbox:     https://etims-api-sbx.kra.go.ke/etims-api/selectInitOsdcInfo
```

---

## 3. Onboarding & Application Process

Before any API call can be made, the taxpayer must complete the following steps:

### Step 1   Register on eTIMS Taxpayer Portal
- Navigate to the eTIMS Taxpayer Portal
- **Sign up** for an account

### Step 2   Apply for OSCU Service
- Go to: **Service Request > eTIMS**
- Select **OSCU** as the service type
- Submit the equipment use application

### Step 3   KRA Officer Approval
- A KRA officer reviews and **approves** the application
- KRA registers the device in their system

### Step 4   Install and Initialize
- Install the OSCU library (Java) on your server   **or** use direct HTTP calls
- Call the **Device Initialization** endpoint (`/selectInitOsdcInfo`) with your:
  - **KRA PIN** (`tin`)
  - **Branch ID** (`bhfId`)
  - **Device Serial Number** (`dvcSrlNo`)
- If successful, eTIMS returns:
  - Taxpayer details
  - Branch details
  - Device ID, Sales Control Unit ID, MRC No
  - **Communication Key** (`cmcKey`)   **store this securely; you need it in every subsequent request**

### Step 5   Begin Operations
- Use the `cmcKey` in all subsequent API calls
- Maintain a `lastReqDt` (last request date-time) for each data type to support incremental sync

---

## 4. Technical Architecture

### Runtime Policies (Must Follow)

1. **Internet connectivity is always required.** OSCU communicates with KRA servers in real-time; there is no offline mode.
2. **All data exchange uses JSON** over HTTPS.
3. **Incremental sync pattern:** Most GET operations accept a `lastReqDt` parameter. The server returns only records created or modified after that date-time. Your TIS must:
   - Store the `lastReqDt` per data type
   - After a successful response, update `lastReqDt` to the current response's `resultDt`
   - Use this updated value in the next call

```
First call:  lastReqDt = "20180101000000"  → Server returns all records since 2018-01-01
After sync:  Store resultDt = "20230420143124"
Next call:   lastReqDt = "20230420143124"  → Server returns only NEW records
```

### Date/Time Formats

| Format | Example | Used For |
|--------|---------|---------|
| `yyyyMMddHHmmss` | `20230420143124` | `lastReqDt`, `resultDt`, timestamps |
| `yyyyMMdd` | `20230420` | Sale dates, purchase dates, occurrence dates |

### Required Fields in Almost Every Request

These four fields appear in virtually every API request:

| Field | Description | Max Length |
|-------|-------------|-----------|
| `tin` | KRA PIN of the taxpayer | 11 chars |
| `bhfId` | Branch ID (`"00"` = head office) | 2 chars |
| `cmcKey` | Communication Key from initialization | 255 chars |
| `lastReqDt` | Last sync date-time (for GET operations) | 14 chars |

---

## 5. OSCU Function Categories

All OSCU functions are organized into **8 categories**:

| # | Category | Direction | Description |
|---|----------|-----------|-------------|
| 1 | **Device Initialization** | Send only | Authenticate and register your device with KRA |
| 2 | **Code Data** | Get only | Retrieve standard codes (tax types, units, countries, etc.) |
| 3 | **Branch Information** | Get & Send | Manage branch offices, customers, users, insurance |
| 4 | **Item Information** | Get & Send | Register and retrieve product/item catalog |
| 5 | **Imported Items** | Get & Send | Handle customs-declared imports |
| 6 | **Sales Management** | Send only | Submit sales transactions and invoices |
| 7 | **Purchase Information** | Get & Send | Retrieve seller's invoices and confirm purchases |
| 8 | **Stock Information** | Get & Send | Track inventory movements and balances |

### Complete Function List

| Category | Class | Method | URL Path | Description |
|----------|-------|--------|----------|-------------|
| Initialization | DeviceVerificationExcute | verification | `/selectInitOsdcInfo` | Authenticate device, get cmcKey |
| Code Data | CodeExcute | search | `/selectCodeList` | Get standard code lists |
| Code Data | ItemExcute | searchCls | `/selectItemClsList` | Get item classification list |
| Code Data | CustomerExcute | search | `/selectCustomer` | Get taxpayer/customer info by PIN |
| Code Data | BhfExcute | search | `/selectBhfList` | Get branch list |
| Code Data | NoticeExcute | search | `/selectNoticeList` | Get KRA notices |
| Branch Info | BhfExcute | saveCustomer | `/saveBhfCustomer` | Save branch customer |
| Branch Info | BhfExcute | saveUser | `/saveBhfUser` | Save branch user account |
| Branch Info | BhfExcute | saveInsurance | `/saveBhfInsurance` | Save branch insurance (pharmacy only) |
| Item Mgmt | ItemExcute | search | `/selectItemList` | Get item list |
| Item Mgmt | ItemExcute | save | `/saveItem` | Register/update an item |
| Item Mgmt | ItemExcute | saveComposition | *(save)* | Save item BOM composition |
| Import Item | ImportItemExcute | search | `/selectImportItemList` | Get imported items from customs |
| Import Item | ImportItemExcute | update | `/updateImportItem` | Approve/reject imported item |
| Sales | TrnsSalesExcute | save | `/saveTrnsSalesOsdc` | Submit sales transaction + invoice |
| Purchase | TrnsPurchaseExcute | saerchPurchaseSales | `/selectTrnsPurchaseSalesList` | Get seller's invoices for purchase confirmation |
| Purchase | TrnsPurchaseExcute | save | `/insertTrnsPurchase` | Confirm/save a purchase |
| Stock | StockExcute | getMoveList | `/selectStockMoveList` | Get stock movement list from head office |
| Stock | StockExcute | saveIO | `/insertStockIO` | Save stock in/out transaction |
| Stock | StockExcute | saveMaster | `/saveStockMaster` | Save inventory master (remaining qty) |

---

## 6. API Reference   All Endpoints

### General Response Structure

Every API response shares this top-level structure:

```json
{
  "resultCd": "000",
  "resultMsg": "It is succeeded",
  "resultDt": "20230420143124",
  "data": { ... }
}
```

| Field | Description |
|-------|-------------|
| `resultCd` | 3-character result code. `"000"` = success. See [Section 7.17](#717-api-response-codes) for all codes. |
| `resultMsg` | Human-readable result message |
| `resultDt` | Server date-time when response was generated (`yyyyMMddHHmmss`) |
| `data` | Payload object (null for write operations that don't return data) |

---

### 6.1 Device Initialization

**URL:** `POST /selectInitOsdcInfo`

This is the **first call you must make**. It authenticates your device and returns the `cmcKey` needed for all subsequent calls.

#### Request Body

```json
{
  "tin": "A123456789Z",
  "bhfId": "00",
  "dvcSrlNo": "dvcv1130"
}
```

| Field | Type | Required | Max Length | Description |
|-------|------|----------|-----------|-------------|
| `tin` | CHAR | ✅ | 11 | KRA PIN |
| `bhfId` | CHAR | ✅ | 2 | Branch ID (`"00"` for head office) |
| `dvcSrlNo` | CHAR | ✅ | 100 | Device Serial Number |

#### Response Payload

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

**Taxpayer Info (`InitTaxpayer`):**

| Field | Description | Length |
|-------|-------------|--------|
| `tin` | PIN | 11 |
| `taxprNm` | Taxpayer Name | 60 |
| `bsnsActv` | Business Activity | 100 |

**Branch Info (`InitBranch`):**

| Field | Description | Length |
|-------|-------------|--------|
| `bhfId` | Branch Office ID | 2 |
| `bhfNm` | Branch Office Name | 60 |
| `bhfOpenDt` | Branch Registration Date | 8 |
| `prvncNm` | County Name | 100 |
| `dstrtNm` | Sub-County Name | 100 |
| `sctrNm` | Tax Locality Name | 100 |
| `locDesc` | Location Description | 100 |
| `hqYn` | Is Head Quarter? (`Y`/`N`) | 1 |
| `mgrNm` | Manager Name | 60 |
| `mgrTelNo` | Manager Contact Number | 20 |
| `mgrEmail` | Manager Email | 50 |

**Device Info (`InitDevice`):**

| Field | Description | Length |
|-------|-------------|--------|
| `dvcId` | Device ID | 20 |
| `sdcId` | Sales Control Unit ID | 18 |
| `mrcNo` | MRC No | 11 |
| `cmcKey` | **Communication Key   store this!** | 255 |

> ⚠️ **Critical:** Save `cmcKey` securely. It must be included in every subsequent API request.

---

### 6.2 Code Information

**URL:** `POST /selectCodeList`

Retrieves all standard code classifications and their detail codes managed by KRA. Use `lastReqDt` to only fetch codes that have changed since your last sync.

#### Request Body

```json
{
  "tin": "A123456789Z",
  "bhfId": "00",
  "cmcKey": "YOUR_CMC_KEY",
  "lastReqDt": "20180520000000"
}
```

#### Response Structure

```json
{
  "resultCd": "000",
  "data": {
    "clsList": [
      {
        "cdCls": "04",
        "cdClsNm": "Taxation Type",
        "cdClsDesc": null,
        "useYn": "Y",
        "userDfnNm1": "Tax Rate",
        "userDfnNm2": null,
        "userDfnNm3": null,
        "dtlList": [
          {
            "cd": "A",
            "cdNm": "A-EX",
            "cdDesc": "Exempt",
            "useYn": "Y",
            "srtOrd": 1,
            "userDfnCd1": "0",
            "userDfnCd2": null,
            "userDfnCd3": null
          }
        ]
      }
    ]
  }
}
```

**Code Classification Object:**

| Field | Description | Length |
|-------|-------------|--------|
| `cdCls` | Code Class identifier | 2 |
| `cdClsNm` | Code Class Name | 60 |
| `cdClsDesc` | Code Class Description | 500 |
| `userDfnNm1/2/3` | Custom label names | 60 |
| `useYn` | Active flag (`Y`/`N`) | 1 |
| `dtlList` | Array of individual codes |   |

**Code Detail Object:**

| Field | Description | Length |
|-------|-------------|--------|
| `cd` | Code value (the actual code to use in transactions) | 5 |
| `cdNm` | Code Name | 60 |
| `cdDesc` | Code Description | 500 |
| `srtOrd` | Sort Order | 5 |
| `userDfnCd1/2/3` | User-defined extra data (e.g., tax rate percentage) | 20 |
| `useYn` | Active flag | 1 |

> 💡 **Tip:** For tax codes, `userDfnCd1` holds the tax rate percentage (e.g., `"16"` for 16% VAT). Parse this to get the actual rate value.

---

### 6.3 Customer (Taxpayer) Search

**URL:** `POST /selectCustomer`

Look up a taxpayer's registration details using their PIN. Use this to validate customer PINs before recording them on invoices.

#### Request Body

```json
{
  "tin": "A123456789Z",
  "bhfId": "00",
  "cmcKey": "YOUR_CMC_KEY",
  "custmTin": "A123456789Z"
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `custmTin` | ✅ | The PIN of the customer you want to look up |

#### Response Data

| Field | Description | Length |
|-------|-------------|--------|
| `tin` | Taxpayer PIN | 11 |
| `taxprNm` | Taxpayer Name | 60 |
| `taxprSttsCd` | Taxpayer Status Code (see [7.2](#72-taxpayer-status)) | 5 |
| `prvncNm` | County Name | 100 |
| `dstrtNm` | Sub-County Name | 100 |
| `sctrNm` | Tax Locality Name | 100 |
| `locDesc` | Location Description | 100 |

---

### 6.4 Notice Search

**URL:** `POST /selectNoticeList`

Retrieves KRA notices and announcements relevant to your TIS. Poll this periodically to display important KRA messages to users.

#### Request Body

```json
{
  "tin": "A123456789Z",
  "bhfId": "00",
  "cmcKey": "YOUR_CMC_KEY",
  "lastReqDt": "20200218191141"
}
```

#### Response Data (per notice)

| Field | Description | Length |
|-------|-------------|--------|
| `noticeNo` | Notice Number (NUMBER) |   |
| `title` | Notice Title | 1000 |
| `cont` | Notice Content (full text) | 4000 |
| `dtlUrl` | Detail URL for more info | 200 |
| `regrNm` | Author/Registrant Name | 60 |
| `regDt` | Registration Date-Time | 14 |

---

### 6.5 Item Classification Search

**URL:** `POST /selectItemClsList`

Retrieves KRA's official item classification codes (HS Code hierarchy). You need these `itemClsCd` values when registering items.

#### Request Body

```json
{
  "tin": "A123456789Z",
  "bhfId": "00",
  "cmcKey": "YOUR_CMC_KEY",
  "lastReqDt": "20180523000000"
}
```

#### Response Data (per classification)

| Field | Description | Length |
|-------|-------------|--------|
| `itemClsCd` | Item Classification Code | 10 |
| `itemClsNm` | Item Classification Name | 200 |
| `itemClsLvl` | Hierarchy Level (NUMBER) |   |
| `taxTyCd` | Associated Tax Type Code (see [7.1](#71-tax-type)) | 5 |
| `mjrTgYn` | Is Major Target? (`Y`/`N`) | 1 |
| `useYn` | Active flag | 1 |

> 💡 The classification hierarchy has levels 1–5. Levels 4 and 5 are leaf nodes with associated `taxTyCd` values. Use level 4 or 5 codes when registering items.

---

### 6.6 Item Save

**URL:** `POST /saveItem`

Registers a new item or updates an existing item in the eTIMS system. Items must be registered before they can appear on sales invoices.

#### Request Body

```json
{
  "tin": "A123456789Z",
  "bhfId": "00",
  "cmcKey": "YOUR_CMC_KEY",
  "itemClsCd": "5059690800",
  "itemCd": "KE1NTXU0000006",
  "itemTyCd": "1",
  "itemNm": "Test Raw Material Item",
  "itemStdNm": null,
  "orgnNatCd": "KE",
  "pkgUnitCd": "NT",
  "qtyUnitCd": "U",
  "taxTyCd": "B",
  "btchNo": null,
  "bcd": null,
  "dftPrc": 3500,
  "grpPrcL1": 3500,
  "grpPrcL2": 3500,
  "grpPrcL3": 3500,
  "grpPrcL4": 3500,
  "grpPrcL5": null,
  "addInfo": null,
  "sftyQty": null,
  "isrcAplcbYn": "N",
  "useYn": "Y",
  "regrId": "admin",
  "regrNm": "Administrator",
  "modrId": "admin",
  "modrNm": "Administrator"
}
```

#### Field Reference (Request)

| Field | Type | Required | Description | Reference |
|-------|------|----------|-------------|-----------|
| `itemClsCd` | CHAR(10) | ✅ | Item Classification Code from KRA | [6.5](#65-item-classification-search) |
| `itemCd` | CHAR(20) | ✅ | Unique Item Code you generate | [7.18](#718-item-code-structure) |
| `itemTyCd` | CHAR(5) | ✅ | Product Type Code | [7.3](#73-product-type) |
| `itemNm` | CHAR(200) | ✅ | Item Name |  |
| `itemStdNm` | CHAR(200) | ❌ | Standard/Generic Name |  |
| `orgnNatCd` | CHAR(5) | ✅ | Country of Origin | [7.4](#74-countries-code) |
| `pkgUnitCd` | CHAR(5) | ✅ | Packaging Unit Code | [7.5](#75-packaging-unit) |
| `qtyUnitCd` | CHAR(5) | ✅ | Quantity Unit Code | [7.6](#76-unit-of-quantity) |
| `taxTyCd` | CHAR(5) | ✅ | Tax Type Code | [7.1](#71-tax-type) |
| `btchNo` | CHAR(10) | ❌ | Batch Number |  |
| `bcd` | CHAR(20) | ❌ | Barcode |  |
| `dftPrc` | NUMBER(18,2) | ✅ | Default Unit Price |  |
| `grpPrcL1`–`L5` | NUMBER(18,2) | ❌ | Group pricing tiers (up to 5) |  |
| `addInfo` | CHAR(7) | ❌ | Additional Information |  |
| `sftyQty` | NUMBER(13,2) | ❌ | Safety/Minimum Stock Quantity |  |
| `isrcAplcbYn` | CHAR(1) | ✅ | Insurance Applicable (`Y`/`N`) |  |
| `useYn` | CHAR(1) | ✅ | Active (`Y`) or Inactive (`N`) |  |
| `regrId` | CHAR(20) | ✅ | Registering User ID |  |
| `regrNm` | CHAR(60) | ✅ | Registering User Name |  |
| `modrId` | CHAR(20) | ✅ | Modifying User ID |  |
| `modrNm` | CHAR(60) | ✅ | Modifying User Name |  |

#### Response

```json
{
  "resultCd": "000",
  "resultMsg": "It is succeeded",
  "resultDt": "20200226193918",
  "data": null
}
```

---

### 6.7 Item Search (List)

**URL:** `POST /selectItemList`

Retrieves items previously registered in eTIMS. Use this to restore your item catalog after a system rebuild.

#### Request Body

```json
{
  "tin": "A123456789Z",
  "bhfId": "00",
  "cmcKey": "YOUR_CMC_KEY",
  "lastReqDt": "20160523000000"
}
```

> **Note:** `bhfId = "00"` retrieves head office items. `bhfId = "01"` through `"99"` retrieves branch items.

#### Response Data (per item)

Returns the same fields as Item Save, plus:

| Field | Description |
|-------|-------------|
| `regBhfId` | Branch ID that registered this item |
| `rraModYn` | Was Item Classification Code modified by KRA? (`Y`/`N`) |

---

### 6.8 Branch Search

**URL:** `POST /selectBhfList`

Retrieves branch office information for the taxpayer. Useful for multi-branch setups.

#### Request Body

```json
{
  "tin": "A123456789Z",
  "bhfId": "00",
  "cmcKey": "YOUR_CMC_KEY",
  "lastReqDt": "20191130000000"
}
```

#### Response Data (per branch)

| Field | Description | Length |
|-------|-------------|--------|
| `bhfId` | Branch Office ID | 2 |
| `bhfNm` | Branch Office Name | 60 |
| `bhfSttsCd` | Branch Status Code | 5 |
| `prvncNm` | County | 100 |
| `dstrtNm` | Sub-County | 100 |
| `sctrNm` | Tax Locality | 100 |
| `locDesc` | Location Description | 100 |
| `mgrNm` | Manager Name | 60 |
| `mgrTelNo` | Manager Phone | 20 |
| `mgrEmail` | Manager Email | 100 |
| `hqYn` | Is Head Office? (`Y`/`N`) | 1 |

---

### 6.9 Branch Customer Save

**URL:** `POST /saveBhfCustomer`

Saves customer records associated with a branch. This enables customer data recovery and cross-branch customer management.

#### Request Body

```json
{
  "tin": "A123456789Z",
  "bhfId": "00",
  "cmcKey": "YOUR_CMC_KEY",
  "custNo": "999991113",
  "custTin": "A123456789Z",
  "custNm": "Customer Name",
  "adrs": null,
  "telNo": null,
  "email": null,
  "faxNo": null,
  "useYn": "Y",
  "remark": null,
  "regrId": "admin",
  "regrNm": "Administrator",
  "modrId": "admin",
  "modrNm": "Administrator"
}
```

| Field | Required | Max Length | Description |
|-------|----------|-----------|-------------|
| `custNo` | ✅ | 9 | Your internal customer number |
| `custTin` | ✅ | 11 | Customer's KRA PIN |
| `custNm` | ✅ | 60 | Customer Name |
| `adrs` | ❌ | 300 | Address |
| `telNo` | ❌ | 20 | Phone |
| `email` | ❌ | 50 | Email |
| `faxNo` | ❌ | 20 | Fax |
| `remark` | ❌ | 1000 | Notes |

---

### 6.10 Branch User Save

**URL:** `POST /saveBhfUser`

Registers branch employee accounts in eTIMS.

#### Request Body

```json
{
  "tin": "A123456789Z",
  "bhfId": "00",
  "cmcKey": "YOUR_CMC_KEY",
  "userId": "userId3",
  "userNm": "User Name",
  "pwd": "hashed_password",
  "adrs": null,
  "cntc": null,
  "authCd": null,
  "remark": null,
  "useYn": "Y",
  "regrId": "admin",
  "regrNm": "Administrator",
  "modrId": "admin",
  "modrNm": "Administrator"
}
```

| Field | Required | Max Length | Description |
|-------|----------|-----------|-------------|
| `userId` | ✅ | 20 | User login ID |
| `userNm` | ✅ | 60 | Full Name |
| `pwd` | ✅ | 255 | Password (hashed) |
| `adrs` | ❌ | 200 | Address |
| `cntc` | ❌ | 20 | Contact number |
| `authCd` | ❌ | 100 | Authority/permission code |
| `remark` | ❌ | 2000 | Notes |

---

### 6.11 Branch Insurance Save

**URL:** `POST /saveBhfInsurance`

> ⚠️ **Pharmacy only.** Used by pharmacy branches to register insurance companies they accept.

#### Request Body

```json
{
  "tin": "A123456789Z",
  "bhfId": "00",
  "cmcKey": "YOUR_CMC_KEY",
  "isrccCd": "ISRCC01",
  "isrccNm": "Insurance Company Name",
  "isrcRt": 20,
  "useYn": "Y",
  "regrId": "admin",
  "regrNm": "Administrator",
  "modrId": "admin",
  "modrNm": "Administrator"
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `isrccCd` | ✅ | Insurance Company Code (max 10) |
| `isrccNm` | ✅ | Insurance Company Name (max 100) |
| `isrcRt` | ✅ | Premium Rate (NUMBER, max 3 digits) |

---

### 6.12 Import Item Search

**URL:** `POST /selectImportItemList`

Retrieves import declarations for the taxpayer from KRA's customs system. These come from import declarations filed with customs and can be used to create stock entries.

> **Head Office role only.** Branch offices cannot call this.

#### Request Body

```json
{
  "tin": "A123456789Z",
  "bhfId": "00",
  "cmcKey": "YOUR_CMC_KEY",
  "lastReqDt": "20190524000000"
}
```

#### Response Data (per imported item)

| Field | Description | Length |
|-------|-------------|--------|
| `taskCd` | Task Code (customs reference) | 50 |
| `dclDe` | Declaration Date | 8 |
| `itemSeq` | Item Sequence number | NUMBER(10) |
| `dclNo` | Declaration Number | 50 |
| `hsCd` | HS Harmonized Code | 17 |
| `itemNm` | Item Name | 500 |
| `orgnNatCd` | Origin Nation Code | 5 |
| `exptNatCd` | Export Nation Code | 5 |
| `pkg` | Package quantity | NUMBER(13,2) |
| `pkgUnitCd` | Package Unit Code | 5 |
| `qty` | Quantity | NUMBER(13,2) |
| `qtyUnitCd` | Quantity Unit Code | 5 |
| `totWt` | Gross Weight | NUMBER(13,2) |
| `netWt` | Net Weight | NUMBER(13,2) |
| `spplrNm` | Supplier Name | 500 |
| `agntNm` | Agent Name | 500 |
| `invcFcurAmt` | Invoice Amount in Foreign Currency | NUMBER(18,2) |
| `invcFcurCd` | Foreign Currency Code | 5 |
| `invcFcurExcrt` | Exchange Rate | NUMBER(18,2) |

---

### 6.13 Import Item Update

**URL:** `POST /updateImportItem`

After reviewing an imported item from customs, you must confirm or reject it using this endpoint. Approved items get added to your stock.

#### Request Body

```json
{
  "tin": "A123456789Z",
  "bhfId": "00",
  "cmcKey": "YOUR_CMC_KEY",
  "taskCd": "2231943",
  "dclDe": "20191217",
  "itemSeq": 1,
  "hsCd": "1231531231",
  "itemClsCd": "5022110801",
  "itemCd": "KE1NTXU0000001",
  "imptItemSttsCd": "1",
  "remark": "remark",
  "modrId": "admin",
  "modrNm": "Administrator"
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `taskCd` | ✅ | Task Code from import search |
| `dclDe` | ✅ | Declaration Date |
| `itemSeq` | ✅ | Item Sequence from import search |
| `hsCd` | ✅ | HS Code |
| `itemClsCd` | ✅ | KRA Item Classification Code to map to |
| `itemCd` | ✅ | Your item code to map to |
| `imptItemSttsCd` | ✅ | Status (see [7.15](#715-import-item-status)) |
| `remark` | ❌ | Notes (max 400) |

---

### 6.14 Sales Transaction Save

**URL:** `POST /saveTrnsSalesOsdc`

**The most important endpoint.** Submits a completed sales transaction and its line items to KRA. Upon success, KRA returns the receipt signature data that must be printed on the customer invoice.

> ⚠️ **Order matters:** Stock in/out records must have their corresponding sales invoice registered FIRST.

#### Request Body Structure

The request has three sections:
1. **Transaction header**   top-level fields
2. **Receipt info** (`receipt` object)
3. **Item list** (`itemList` array)

```json
{
  "tin": "A123456789Z",
  "bhfId": "00",
  "cmcKey": "YOUR_CMC_KEY",
  "trdInvcNo": "123",
  "invcNo": 1,
  "orgInvcNo": 0,
  "custTin": "A123456789Z",
  "custNm": "Customer Name",
  "salesTyCd": "N",
  "rcptTyCd": "S",
  "pmtTyCd": "01",
  "salesSttsCd": "02",
  "cfmDt": "20200127210300",
  "salesDt": "20200127",
  "stockRlsDt": "20200127210300",
  "cnclReqDt": null,
  "cnclDt": null,
  "rfdDt": null,
  "rfdRsnCd": null,
  "totItemCnt": 2,
  "taxblAmtA": 0,
  "taxblAmtB": 10500,
  "taxblAmtC": 0,
  "taxblAmtD": 0,
  "taxblAmtE": 0,
  "taxRtA": 0,
  "taxRtB": 16,
  "taxRtC": 0,
  "taxRtD": 0,
  "taxRtE": 0,
  "taxAmtA": 0,
  "taxAmtB": 1602,
  "taxAmtC": 0,
  "taxAmtD": 0,
  "taxAmtE": 0,
  "totTaxblAmt": 10500,
  "totTaxAmt": 1602,
  "totAmt": 10500,
  "prchrAcptcYn": "N",
  "remark": null,
  "regrId": "admin",
  "regrNm": "Administrator",
  "modrId": "admin",
  "modrNm": "Administrator",
  "receipt": {
    "custTin": "A123456789Z",
    "custMblNo": null,
    "rcptPbctDt": "20201118120300",
    "trdeNm": null,
    "adrs": null,
    "topMsg": null,
    "btmMsg": null,
    "prchrAcptcYn": "N"
  },
  "itemList": [
    {
      "itemSeq": 1,
      "itemCd": "KE1NTXU0000001",
      "itemClsCd": "5059690800",
      "itemNm": "Test Item 1",
      "bcd": null,
      "pkgUnitCd": "NT",
      "pkg": 2,
      "qtyUnitCd": "U",
      "qty": 2,
      "prc": 3500,
      "splyAmt": 7000,
      "dcRt": 0,
      "dcAmt": 0,
      "isrccCd": null,
      "isrccNm": null,
      "isrcRt": null,
      "isrcAmt": null,
      "taxTyCd": "B",
      "taxblAmt": 7000,
      "taxAmt": 1068,
      "totAmt": 7000
    }
  ]
}
```

#### Transaction Header Fields

| Field | Type | Required | Description | Reference |
|-------|------|----------|-------------|-----------|
| `trdInvcNo` | CHAR(50) | ✅ | Your internal invoice number/reference |  |
| `invcNo` | NUMBER(38) | ✅ | Sequential invoice number |  |
| `orgInvcNo` | NUMBER(38) | ✅ | Original invoice (for credit notes; use `0` for new sales) |  |
| `custTin` | CHAR(11) | ❌ | Customer KRA PIN |  |
| `custNm` | CHAR(60) | ❌ | Customer Name |  |
| `rcptTyCd` | CHAR(5) | ✅ | Receipt Type (`S`=Sale, `R`=Credit Note) | [7.9](#79-sales-receipt-type) |
| `pmtTyCd` | CHAR(5) | ❌ | Payment Method | [7.10](#710-payment-method) |
| `salesSttsCd` | CHAR(5) | ✅ | Transaction Progress/Status | [7.11](#711-transaction-progress) |
| `cfmDt` | CHAR(14) | ✅ | Validated/Confirmed Date-Time (`yyyyMMddHHmmss`) |  |
| `salesDt` | CHAR(8) | ✅ | Sale Date (`yyyyMMdd`) |  |
| `stockRlsDt` | CHAR(14) | ❌ | Stock Release Date-Time |  |
| `cnclReqDt` | CHAR(14) | ❌ | Cancellation Requested Date-Time |  |
| `cnclDt` | CHAR(14) | ❌ | Cancelled Date-Time |  |
| `rfdDt` | CHAR(14) | ❌ | Credit Note Date-Time |  |
| `rfdRsnCd` | CHAR(5) | ❌ | Credit Note Reason | [7.16](#716-credit-note-reason) |
| `totItemCnt` | NUMBER(10) | ✅ | Total number of line items |  |
| `taxblAmtA`–`E` | NUMBER(18,2) | ✅ | Taxable amount per tax band |  |
| `taxRtA`–`E` | NUMBER(7,2) | ✅ | Tax rate per band (e.g., `16` for 16%) |  |
| `taxAmtA`–`E` | NUMBER(18,2) | ✅ | Tax amount per band |  |
| `totTaxblAmt` | NUMBER(18,2) | ✅ | Total taxable amount |  |
| `totTaxAmt` | NUMBER(18,2) | ✅ | Total tax amount |  |
| `totAmt` | NUMBER(18,2) | ✅ | Total invoice amount |  |
| `prchrAcptcYn` | CHAR(1) | ✅ | Purchase acceptance required? (`Y`/`N`) |  |

#### Receipt Object Fields

| Field | Description | Length |
|-------|-------------|--------|
| `custTin` | Customer PIN | 11 |
| `custMblNo` | Customer Mobile Number | 20 |
| `rcptPbctDt` | Receipt Published Date-Time | 14 |
| `trdeNm` | Trade Name | 20 |
| `adrs` | Address | 200 |
| `topMsg` | Top message on receipt | 20 |
| `btmMsg` | Bottom message on receipt | 20 |
| `prchrAcptcYn` | Purchase acceptance (`Y`/`N`) | 1 |

#### Item Line Object Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `itemSeq` | NUMBER(3) | ✅ | Line item sequence (1, 2, 3...) |
| `itemCd` | CHAR(20) | ✅ | Item Code |
| `itemClsCd` | CHAR(10) | ❌ | Item Classification Code |
| `itemNm` | CHAR(200) | ✅ | Item Name |
| `bcd` | CHAR(20) | ❌ | Barcode |
| `pkgUnitCd` | CHAR(5) | ✅ | Packaging Unit Code |
| `pkg` | NUMBER(13,2) | ✅ | Package quantity |
| `qtyUnitCd` | CHAR(5) | ✅ | Quantity Unit Code |
| `qty` | NUMBER(13,2) | ✅ | Quantity sold |
| `prc` | NUMBER(18,2) | ✅ | Unit Price |
| `splyAmt` | NUMBER(18,2) | ✅ | Supply Amount (qty × prc before discount) |
| `dcRt` | NUMBER(5,2) | ✅ | Discount Rate (0 if none) |
| `dcAmt` | NUMBER(18,2) | ✅ | Discount Amount (0 if none) |
| `isrccCd` | CHAR(10) | ❌ | Insurance Company Code |
| `isrccNm` | CHAR(100) | ❌ | Insurance Company Name |
| `isrcRt` | NUMBER(3) | ❌ | Insurance Rate |
| `isrcAmt` | NUMBER(18,2) | ❌ | Insurance Amount |
| `taxTyCd` | CHAR(5) | ✅ | Tax Type Code |
| `taxblAmt` | NUMBER(18,2) | ✅ | Taxable Amount for this line |
| `taxAmt` | NUMBER(18,2) | ✅ | Tax Amount for this line |
| `totAmt` | NUMBER(18,2) | ✅ | Total Amount for this line |

#### Success Response   Critical Fields

```json
{
  "resultCd": "000",
  "resultDt": "20200226194328",
  "data": {
    "curRcptNo": "1",
    "totRcptNo": "1",
    "intrlData": "EAHSAV6ECUUXSY6PCCJYAUP6MI",
    "rcptSign": "QUII27MATATSHFRB",
    "sdcDateTime": "20210502115145"
  }
}
```

| Field | Description | Must Print? |
|-------|-------------|-------------|
| `curRcptNo` | Current Receipt Number | ✅ Yes |
| `totRcptNo` | Total Receipts issued so far | ✅ Yes |
| `intrlData` | Internal Data (26 chars)   KRA control data | ✅ Yes |
| `rcptSign` | Receipt Signature (16 chars) | ✅ Yes |
| `sdcDateTime` | Control Unit Date-Time | ✅ Yes |

> ⚠️ **All five response fields above MUST be printed on the customer invoice/receipt** for fiscal compliance.

---

### 6.15 Purchase Sales Search

**URL:** `POST /selectTrnsPurchaseSalesList`

As a buyer, use this to retrieve sales invoices that suppliers have registered against your PIN. This forms the basis of your purchase records.

> **Head Office role only.**

#### Request Body

```json
{
  "tin": "A123456789Z",
  "bhfId": "00",
  "cmcKey": "YOUR_CMC_KEY",
  "lastReqDt": "20190524000000"
}
```

#### Response Data

Returns a list of supplier sales transactions. Each entry includes the full transaction data the supplier submitted, including line items. Key fields:

| Field | Description |
|-------|-------------|
| `spplrTin` | Supplier's KRA PIN |
| `spplrNm` | Supplier Name |
| `spplrBhfId` | Supplier Branch ID |
| `spplrInvcNo` | Supplier's Invoice Number |
| `rcptTyCd` | Receipt Type |
| `pmtTyCd` | Payment Type |
| `cfmDt` | Validated Date |
| `salesDt` | Sale Date |
| `totAmt` | Total Amount |
| `itemList[]` | Line items (same structure as sales item list) |

---

### 6.16 Purchase Save

**URL:** `POST /insertTrnsPurchase`

Confirm a purchase based on a supplier's registered sale. Call this after reviewing records from [6.15](#615-purchase-sales-search).

> **Head Office role only.**

#### Request Body (abbreviated)

```json
{
  "tin": "A123456789Z",
  "bhfId": "00",
  "cmcKey": "YOUR_CMC_KEY",
  "invcNo": 1,
  "orgInvcNo": 0,
  "spplrTin": "A123456789Z",
  "spplrBhfId": null,
  "spplrNm": null,
  "spplrInvcNo": null,
  "regTyCd": "M",
  "pchsTyCd": "N",
  "rcptTyCd": "P",
  "pmtTyCd": "01",
  "pchsSttsCd": "02",
  "cfmDt": "20200127210300",
  "pchsDt": "20200127",
  "wrhsDt": "",
  "totItemCnt": 2,
  "taxblAmtB": 10500,
  "taxRtB": 16,
  "taxAmtB": 1890,
  "totTaxblAmt": 10500,
  "totTaxAmt": 1890,
  "totAmt": 10500,
  "regrId": "admin",
  "regrNm": "Administrator",
  "modrId": "admin",
  "modrNm": "Administrator",
  "itemList": [ ... ]
}
```

| Field | Required | Description | Reference |
|-------|----------|-------------|-----------|
| `invcNo` | ✅ | Your purchase invoice number |  |
| `orgInvcNo` | ✅ | Original invoice (0 for new) |  |
| `spplrTin` | ❌ | Supplier PIN |  |
| `regTyCd` | ✅ | Registration Type (A=Auto, M=Manual) | [7.12](#712-registration-type) |
| `pchsTyCd` | ✅ | Purchase Transaction Type | [7.8](#78-transaction-type) |
| `rcptTyCd` | ✅ | Purchase Receipt Type | [7.13](#713-purchase-receipt-type) |
| `pmtTyCd` | ✅ | Payment Method | [7.10](#710-payment-method) |
| `pchsSttsCd` | ✅ | Purchase Status Code | [7.11](#711-transaction-progress) |
| `cfmDt` | ❌ | Confirmed date-time |  |
| `pchsDt` | ✅ | Purchase Date (`yyyyMMdd`) |  |
| `wrhsDt` | ❌ | Warehousing Date |  |

**Item list** mirrors the sales item list structure but adds:

| Field | Description |
|-------|-------------|
| `spplrItemClsCd` | Supplier's item classification code |
| `spplrItemCd` | Supplier's item code |
| `spplrItemNm` | Supplier's item name |
| `itemExprDt` | Item Expiry Date (`yyyyMMdd`) |

---

### 6.17 Stock Movement Search

**URL:** `POST /selectStockMoveList`

Branch offices use this to request and receive stock transfers from the head office.

#### Request Body

```json
{
  "tin": "A123456789Z",
  "bhfId": "00",
  "cmcKey": "YOUR_CMC_KEY",
  "lastReqDt": "20180524000000"
}
```

#### Response Data (per movement)

| Field | Description |
|-------|-------------|
| `custTin` | Customer (recipient branch) PIN |
| `custBhfId` | Customer Branch ID |
| `sarNo` | Stored-and-Released Number |
| `ocrnDt` | Occurrence Date |
| `totItemCnt` | Item count |
| `totTaxblAmt` | Total Supply Price |
| `totTaxAmt` | Total VAT |
| `totAmt` | Total Amount |
| `itemList[]` | Line items with qty, price, tax details |

---

### 6.18 Stock IO Save

**URL:** `POST /insertStockIO`

Records every inventory movement (stock in or stock out). This must be called whenever inventory levels change.

> ⚠️ **Prerequisite:** Every stock in/out record must have its corresponding **sales invoice registered first** in eTIMS.

#### Request Body

```json
{
  "tin": "A123456789Z",
  "bhfId": "00",
  "cmcKey": "YOUR_CMC_KEY",
  "sarNo": 2,
  "orgSarNo": 2,
  "regTyCd": "M",
  "custTin": "A123456789Z",
  "custNm": null,
  "custBhfId": null,
  "sarTyCd": "11",
  "ocrnDt": "20200126",
  "totItemCnt": 2,
  "totTaxblAmt": 70000,
  "totTaxAmt": 10677.96,
  "totAmt": 70000,
  "remark": null,
  "regrId": "admin",
  "regrNm": "Administrator",
  "modrId": "admin",
  "modrNm": "Administrator",
  "itemList": [
    {
      "itemSeq": 1,
      "itemCd": "KE1NTXU0000001",
      "itemClsCd": "5059690800",
      "itemNm": "Test Item 1",
      "bcd": null,
      "pkgUnitCd": "NT",
      "pkg": 10,
      "qtyUnitCd": "U",
      "qty": 10,
      "itemExprDt": null,
      "prc": 3500,
      "splyAmt": 35000,
      "totDcAmt": 0,
      "taxblAmt": 35000,
      "taxTyCd": "B",
      "taxAmt": 5338.98,
      "totAmt": 35000
    }
  ]
}
```

| Field | Required | Description | Reference |
|-------|----------|-------------|-----------|
| `sarNo` | ✅ | Unique stock-and-release number |  |
| `orgSarNo` | ✅ | Original SAR number (same as `sarNo` for new entries) |  |
| `regTyCd` | ✅ | Registration Type | [7.12](#712-registration-type) |
| `custTin` | ❌ | Customer PIN |  |
| `custBhfId` | ❌ | Customer Branch ID |  |
| `sarTyCd` | ✅ | Stock In/Out Type | [7.14](#714-stock-inout) |
| `ocrnDt` | ✅ | Occurrence Date (`yyyyMMdd`) |  |

---

### 6.19 Stock Master Save

**URL:** `POST /saveStockMaster`

Updates the inventory master record (remaining/current quantity) for an item. Call this after any stock change to keep KRA's inventory snapshot current.

> ⚠️ **Prerequisite:** Stock inventory information must have its corresponding stock in/out record sent first.

#### Request Body

```json
{
  "tin": "A123456789Z",
  "bhfId": "00",
  "cmcKey": "YOUR_CMC_KEY",
  "itemCd": "KE1NTXU0000002",
  "rsdQty": 10,
  "regrId": "admin",
  "regrNm": "Administrator",
  "modrId": "admin",
  "modrNm": "Administrator"
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `itemCd` | ✅ | Item Code |
| `rsdQty` | ✅ | Remaining (current) quantity NUMBER(13,2) |

---

## 7. Code Definitions & Lookup Tables

### 7.1 Tax Type

**Code Classification:** `04`

| Code | Name | Description |
|------|------|-------------|
| `A` | A | Exempt (0%) |
| `B` | B-16.00% | Standard VAT 16% |
| `C` | C | Zero-rated (0%) |
| `D` | D | Non-VAT |
| `E` | E | Special rate 8% |

> Use `taxTyCd` on items and transaction lines to indicate which tax band applies.

---

### 7.2 Taxpayer Status

**Code Classification:** `15`

| Code | Name |
|------|------|
| `A` | Active |
| `D` | Inactive |

---

### 7.3 Product Type

**Code Classification:** `24`

| Code | Name | Description |
|------|------|-------------|
| `1` | Raw Material | Raw Material |
| `2` | Finished Product | Finished Product |
| `3` | Service | Service (no stock tracked) |

---

### 7.4 Countries Code

**Code Classification:** `05`   Full list of 252 countries. Key values relevant to Kenya:

| Code | Country |
|------|---------|
| `KE` | KENYA |
| `US` | UNITED STATES |
| `GB` | GREAT BRITAIN (UK) |
| `CN` | CHINA |
| `IN` | INDIA |
| `ZA` | SOUTH AFRICA |
| `TZ` | TANZANIA |
| `UG` | UGANDA |
| `AE` | UNITED ARAB EMIRATES |
| `DE` | GERMANY |
| `JP` | JAPAN |
| `KR` | SOUTH KOREA |
| `FR` | FRANCE |
| `IT` | ITALY |

*Full list of all 252 country codes available in Section 4.4 of the original document.*

---

### 7.5 Packaging Unit

**Code Classification:** `17`   52 packaging units. Key values:

| Code | Name |
|------|------|
| `AM` | Ampoule |
| `BA` | Barrel |
| `BG` | Bag |
| `BL` | Bale |
| `CA` | Can |
| `CT` | Carton |
| `CTN` | Container |
| `DR` | Drum |
| `JR` | Jar |
| `NT` | Net |
| `OU` | Non-Exterior Packaging Unit |
| `RO` | Roll |
| `TY` | Tank, cylindrical |

*Full list of all 52 packaging unit codes in Section 4.6 of the original document.*

---

### 7.6 Unit of Quantity

**Code Classification:** `10`   43 units. Key values:

| Code | Name |
|------|------|
| `U` | Pieces/Item [Number]   most common |
| `KG` | Kilo-Gramme |
| `L` | Litre |
| `M` | Metre |
| `M2` | Square Metre |
| `M3` | Cubic Metre |
| `TNE` | Tonne (metric ton) |
| `DZ` | Dozen |
| `SET` | Set |
| `BX` | Box |
| `PA` | Packet |
| `GRM` | Gram |
| `LTR` | Litre |

*Full list of all 43 unit codes in Section 4.7 of the original document.*

---

### 7.7 Currency

**Code Classification:** `33`   179 currencies. Key values:

| Code | Currency |
|------|---------|
| `KES` | Kenyan Shilling |
| `USD` | United States Dollar |
| `EUR` | Euro |
| `GBP` | Pound Sterling |
| `TZS` | Tanzanian Shilling |
| `UGX` | Ugandan Shilling |
| `AED` | UAE Dirham |
| `CNY` | Chinese Yuan |
| `INR` | Indian Rupee |

*Full list of 179 currency codes in Section 4.8 of the original document.*

---

### 7.8 Transaction Type

**Code Classification:** `14`

| Code | Name | Description |
|------|------|-------------|
| `C` | Copy | Copy of a transaction |
| `N` | Normal | Normal sale/purchase |
| `P` | Proforma | Proforma invoice |
| `T` | Training | Training/test transaction |

---

### 7.9 Sales Receipt Type

**Code Classification:** `37`

| Code | Name |
|------|------|
| `S` | Sale (normal sale) |
| `R` | Credit Note after Sale |

---

### 7.10 Payment Method

**Code Classification:** `07`

| Code | Name | Description |
|------|------|-------------|
| `01` | CASH | Cash payment |
| `02` | CREDIT | Credit/deferred payment |
| `03` | CASH/CREDIT | Mixed |
| `04` | BANK CHECK | Bank cheque |
| `05` | DEBIT & CREDIT CARD | Card payment |
| `06` | MOBILE MONEY | M-Pesa, Airtel Money, etc. |
| `07` | OTHER | Other means |

---

### 7.11 Transaction Progress

**Code Classification:** `11`   Used for both `salesSttsCd` and `pchsSttsCd`

| Code | Name |
|------|------|
| `01` | Wait for Approval |
| `02` | Approved |
| `03` | Cancel Requested |
| `04` | Cancelled |
| `05` | Credit Note Generated |
| `06` | Transferred |

> For most normal sales, use `salesSttsCd = "02"` (Approved).

---

### 7.12 Registration Type

**Code Classification:** `31`

| Code | Name |
|------|------|
| `A` | Automatic (system-generated) |
| `M` | Manual (user-initiated) |

---

### 7.13 Purchase Receipt Type

**Code Classification:** `38`

| Code | Name |
|------|------|
| `P` | Purchase |
| `R` | Credit Note after Purchase |

---

### 7.14 Stock In/Out

**Code Classification:** `12`   Stock Movement Types

**Incoming (stock increases):**

| Code | Name |
|------|------|
| `01` | Import |
| `02` | Purchase |
| `03` | Return |
| `04` | Stock Movement |
| `05` | Processing |
| `06` | Adjustment |

**Outgoing (stock decreases):**

| Code | Name |
|------|------|
| `11` | Sale |
| `12` | Return |
| `13` | Stock Movement |
| `14` | Processing |
| `15` | Discarding |
| `16` | Adjustment |

---

### 7.15 Import Item Status

**Code Classification:** `26`

| Code | Name |
|------|------|
| `1` | Unsent |
| `2` | Waiting |
| `3` | Approved |
| `4` | Cancelled |

---

### 7.16 Credit Note Reason

**Code Classification:** `32`

| Code | Reason |
|------|--------|
| `01` | Missing Quantity |
| `02` | Missing Data |
| `03` | Damaged |
| `04` | Wasted |
| `05` | Raw Material Shortage |
| `06` | Refund |

---

### 7.17 API Response Codes

| Code | Origin | Description |
|------|--------|-------------|
| `000` | Server | ✅ Success |
| `001` | Server | No search result |
| `891` | Client | Error creating Request URL |
| `892` | Client | Error creating Request Header |
| `893` | Client | Error creating Request Body |
| `894` | Client | Server communication error |
| `895` | Client | Unallowed Request Method |
| `896` | Client | Request Status error |
| `899` | Client | General client error |
| `900` | Server | No header information |
| `901` | Server | Invalid device |
| `902` | Server | Device already installed |
| `903` | Server | Only OSCU device can be verified |
| `910` | Server | Request parameter error |
| `911` | Server | No request body |
| `912` | Server | Request Method error |
| `921` | Server | Cannot receive declared sales/invoice data |
| `922` | Server | Invoice data must come after sales data |
| `990` | Server | Maximum views exceeded |
| `991` | Server | Error during registration |
| `992` | Server | Error during modification |
| `993` | Server | Error during deletion |
| `994` | Server | Overlapping/duplicate data |
| `995` | Server | No downloaded file |
| `999` | Server | Unknown error   contact KRA |

---

### 7.18 Item Code Structure

The `itemCd` field follows a strict format and must be unique per item. You generate this code yourself.

**Format:** `[CountryCode][ProductType][PkgUnit][QtyUnit][SequenceNumber]`

**Example:** `KE2NTBA0000012`

| Part | Example | Meaning |
|------|---------|---------|
| `KE` | `KE` | Country of Origin (Kenya)   2 chars |
| `2` | `2` | Product Type (Finished Product)   1 char |
| `NT` | `NT` | Packaging Unit (Net)   2 chars |
| `BA` | `BA` | Quantity Unit (Barrel)   2 chars |
| `0000012` | `0000012` | Sequential number, increments from `0000001`   7 chars |

**Total length:** 14 characters

**Generation logic in pseudocode:**

```python
def generate_item_code(country_code, product_type, pkg_unit, qty_unit, sequence):
    seq_str = str(sequence).zfill(7)  # zero-pad to 7 digits
    return f"{country_code}{product_type}{pkg_unit}{qty_unit}{seq_str}"

# Examples:
# generate_item_code("KE", "1", "NT", "U", 1)   → "KE1NTU0000001"
# generate_item_code("KE", "2", "CT", "KG", 5)  → "KE2CTKG0000005"
```

---

## 8. Data Flow & Integration Patterns

### 8.1 Initial Setup Flow

```
1. Apply for OSCU on eTIMS portal
2. KRA approves → install/configure
3. POST /selectInitOsdcInfo → receive cmcKey
4. Store cmcKey securely
5. POST /selectCodeList → download all code tables
6. POST /selectItemClsList → download item classifications
7. POST /saveItem (repeat for each product)
8. System ready for transactions
```

### 8.2 Normal Sales Flow

```
Customer buys goods
    │
    ▼
TIS calculates invoice totals (tax amounts per band)
    │
    ▼
POST /saveTrnsSalesOsdc → receive {intrlData, rcptSign, curRcptNo, sdcDateTime}
    │
    ▼
Print all KRA fields on receipt/invoice
    │
    ▼
POST /insertStockIO (sarTyCd="11" = Sale outgoing)
    │
    ▼
POST /saveStockMaster (update remaining qty)
```

### 8.3 Purchase Confirmation Flow

```
Supplier registers their sale → their data appears in eTIMS
    │
    ▼
POST /selectTrnsPurchaseSalesList (with your PIN) → get supplier invoices
    │
    ▼
Review each invoice
    │
    ▼
POST /insertTrnsPurchase (regTyCd="A" for auto, "M" for manual)
    │
    ▼
POST /insertStockIO (sarTyCd="02" = Purchase incoming)
    │
    ▼
POST /saveStockMaster (update remaining qty)
```

### 8.4 Import Processing Flow

```
Import declaration filed at customs (external process)
    │
    ▼
POST /selectImportItemList → customs data appears
    │
    ▼
Map imported item to your item catalog (itemCd, itemClsCd)
    │
    ▼
POST /updateImportItem (imptItemSttsCd="3" = Approved)
    │
    ▼
POST /insertStockIO (sarTyCd="01" = Import incoming)
    │
    ▼
POST /saveStockMaster
```

### 8.5 Credit Note Flow

```
Customer returns goods / issue credit note
    │
    ▼
POST /saveTrnsSalesOsdc with:
  rcptTyCd = "R"          (Credit Note after Sale)
  orgInvcNo = [original invoice number]
  rfdDt = [credit note date]
  rfdRsnCd = [reason code]
  totAmt = [negative or positive credit amount]
    │
    ▼
POST /insertStockIO (sarTyCd="03" = Return incoming)
    │
    ▼
POST /saveStockMaster
```

### 8.6 Code Sync Strategy

Run a periodic sync job to keep local code tables current:

```javascript
async function syncCodes(lastSyncDate) {
    const response = await post('/selectCodeList', {
        tin, bhfId, cmcKey,
        lastReqDt: lastSyncDate
    });
    
    if (response.resultCd === '000') {
        // Update local DB with response.data.clsList
        updateLocalCodes(response.data.clsList);
        // Save response.resultDt as new lastSyncDate
        saveLastSyncDate('codes', response.resultDt);
    }
}
```

---

## 9. Error Handling Strategy

### Always Check `resultCd` First

```javascript
async function callOSCU(endpoint, payload) {
    const response = await fetch(BASE_URL + endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    
    const data = await response.json();
    
    if (data.resultCd !== '000') {
        // Handle error
        if (data.resultCd === '001') {
            // No results   not necessarily an error
            return [];
        }
        if (data.resultCd === '901') {
            // Invalid device   re-initialize
            await reinitializeDevice();
        }
        if (data.resultCd === '994') {
            // Duplicate data   ignore or log
            console.warn('Duplicate data, ignoring:', data.resultMsg);
        }
        throw new Error(`eTIMS Error ${data.resultCd}: ${data.resultMsg}`);
    }
    
    return data;
}
```

### Specific Error Scenarios

| Scenario | Code | Action |
|----------|------|--------|
| No results for a date range | `001` | Normal   store `resultDt` as new sync point |
| Device rejected | `901` | Re-register device with KRA |
| Device already registered | `902` | Do not re-initialize; use stored cmcKey |
| Duplicate invoice | `994` | Invoice already submitted; do not resubmit |
| Sales data order issue | `922` | Ensure sales transaction is saved before invoice |
| Unknown error | `999` | Log full request/response, contact KRA |

### Retry Strategy

- **Network failures (HTTP 5xx):** Retry with exponential backoff (e.g., 1s, 2s, 4s, max 3 retries)
- **Client errors (codes 891–899):** Fix the request structure; do not retry blindly
- **Server errors (codes 990–999):** Log and alert; only retry `999` with caution
- **Duplicate (994):** Never retry; treat as success for idempotency

---

## 10. Common Integration Scenarios

### Scenario 1: POS System Integration

For a Point-of-Sale system, the critical path is:

1. **Startup:** Sync code tables if `lastSyncDate` is > 24 hours ago
2. **Item lookup:** Use local item cache (synced from `/selectItemList`)
3. **At sale:** Call `/saveTrnsSalesOsdc` synchronously before printing receipt
4. **Print:** Include `intrlData`, `rcptSign`, `curRcptNo`, `totRcptNo`, `sdcDateTime` on receipt
5. **Background:** Call `/insertStockIO` and `/saveStockMaster` asynchronously

### Scenario 2: ERP/Accounting System Integration

1. **Daily sync:** Run `/selectTrnsPurchaseSalesList` to get unprocessed supplier invoices
2. **Auto-match:** Match supplier invoices to your purchase orders
3. **Confirm:** Call `/insertTrnsPurchase` for matched invoices
4. **Stock update:** Update inventory via `/insertStockIO` + `/saveStockMaster`
5. **Reporting:** Use local data for management reports

### Scenario 3: Multi-Branch Setup

- Head office (`bhfId="00"`) manages item catalog and sends stock to branches
- Branches (`bhfId="01"`, `"02"`, etc.) receive stock via `/selectStockMoveList`
- Each branch has its own device initialization with its own `cmcKey`
- Sales are submitted by each branch independently with their `bhfId`
- Head office consolidates purchase information

### Scenario 4: Service Business (No Physical Stock)

- Set `itemTyCd = "3"` (Service) for all items
- Skip all stock IO calls   services have no inventory
- Sales flow remains the same: `/saveTrnsSalesOsdc` is still required
- Use `taxTyCd = "A"` (Exempt) or `"B"` (16%) as appropriate to your service

---

## 11. Quick Reference Cheat Sheet

### API Endpoints Summary

| Action | URL | Key Input | Key Output |
|--------|-----|-----------|------------|
| Initialize device | `/selectInitOsdcInfo` | PIN, branch, serial | `cmcKey` |
| Get code lists | `/selectCodeList` | `lastReqDt` | Code tables |
| Get item classes | `/selectItemClsList` | `lastReqDt` | HS Code tree |
| Look up customer | `/selectCustomer` | `custmTin` | Customer details |
| Get branches | `/selectBhfList` | `lastReqDt` | Branch list |
| Get notices | `/selectNoticeList` | `lastReqDt` | KRA notices |
| Register item | `/saveItem` | Full item object | result only |
| Get items | `/selectItemList` | `lastReqDt` | Item catalog |
| Save branch customer | `/saveBhfCustomer` | Customer data | result only |
| Save branch user | `/saveBhfUser` | User data | result only |
| Save insurance | `/saveBhfInsurance` | Insurance data | result only |
| Get imports | `/selectImportItemList` | `lastReqDt` | Customs data |
| Confirm import | `/updateImportItem` | Task/item codes | result only |
| **Submit sale** | `/saveTrnsSalesOsdc` | Full transaction | **intrlData, rcptSign** |
| Get purchases | `/selectTrnsPurchaseSalesList` | `lastReqDt` | Supplier invoices |
| Confirm purchase | `/insertTrnsPurchase` | Purchase data | result only |
| Get stock moves | `/selectStockMoveList` | `lastReqDt` | Stock transfers |
| Save stock IO | `/insertStockIO` | Stock event | result only |
| Save stock master | `/saveStockMaster` | `itemCd`, `rsdQty` | result only |

### Tax Band Reference

| Band | Code | Rate | Use Case |
|------|------|------|---------|
| A | `A` | 0% | Exempt items |
| B | `B` | 16% | Standard taxable goods |
| C | `C` | 0% | Zero-rated items |
| D | `D` | 0% | Non-VAT items |
| E | `E` | 8% | Special rate items |

### Tax Calculation Formula

```
Supply Amount = qty × unit_price
Taxable Amount = Supply Amount - Discount Amount
Tax Amount = Taxable Amount × (Tax Rate / (100 + Tax Rate))
Total Amount = Supply Amount - Discount Amount (inclusive pricing)

For line total verification:
totAmt = taxblAmt  (when price is VAT-inclusive)
taxAmt = totAmt - (totAmt / (1 + taxRate/100))
```

### Required Fields Cheat Sheet (Every Request)

```json
{
  "tin": "11-char KRA PIN",
  "bhfId": "00",
  "cmcKey": "255-char key from initialization"
}
```

Plus `lastReqDt` for all GET operations.

### Date Format Quick Reference

```
Full timestamp:  yyyyMMddHHmmss  →  20230420143124
Date only:       yyyyMMdd        →  20230420
```

### Item Code Generation

```
Format: [CC][PT][PU][QU][NNNNNNN]
CC = Country Code (2 chars)  e.g., KE
PT = Product Type (1 char)   e.g., 1, 2, 3
PU = Packaging Unit (2 chars) e.g., NT, CT, DR
QU = Qty Unit (2 chars)      e.g., U, KG, LTR
NNNNNNN = 7-digit sequence   e.g., 0000001

Example: KE1NTU0000001
```

### Sequence of Operations (First Time Setup)

```
1.  /selectInitOsdcInfo     → get cmcKey
2.  /selectCodeList         → cache code tables
3.  /selectItemClsList      → cache HS codes
4.  /selectBhfList          → cache branch info
5.  /saveItem (×N)          → register all products
6.  /saveBhfCustomer (×N)   → register customers
7.  System is READY
```

### Sequence for Each Sale

```
1.  Calculate invoice (locally)
2.  /saveTrnsSalesOsdc      → get receipt signature
3.  Print receipt with KRA data
4.  /insertStockIO          → record stock movement
5.  /saveStockMaster        → update inventory balance
```

---

*This guide is based on KRA OSCU Requirements & Communication Protocols Version 2.0, published April 2023. Always refer to the latest KRA documentation for any changes to tax rates, endpoints, or compliance requirements. For technical support, contact KRA eTIMS support or your KRA account manager.*
