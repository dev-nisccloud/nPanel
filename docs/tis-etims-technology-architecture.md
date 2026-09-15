# Technology Architecture Document

## Integration Between Trader Invoicing System (TIS) and Electronic Tax Invoice Management System (eTIMS)

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Overview](#2-system-overview)
3. [Architecture Design](#3-architecture-design)
4. [Integration Components](#4-integration-components)
5. [Data Flow and Processes](#5-data-flow-and-processes)
6. [Security Architecture](#6-security-architecture)
7. [Transaction Processing](#7-transaction-processing)
8. [Compliance and Regulatory Requirements](#8-compliance-and-regulatory-requirements)
9. [Error Handling and Recovery](#9-error-handling-and-recovery)
10. [Operational Considerations](#10-operational-considerations)
11. [Appendices](#11-appendices)

---

## 1. Executive Summary

### 1.1 Purpose

This document outlines the technology architecture for the integration between the Trader Invoicing System (TIS) and the Kenya Revenue Authority's (KRA) Electronic Tax Invoice Management System (eTIMS). The integration enables real-time transmission of tax invoices, credit notes, stock movements, and purchase transactions to the tax authority for fiscal compliance and revenue assurance.

### 1.2 Scope

The architecture covers:
- Device initialization and authentication with KRA eTIMS
- Sales transaction processing and digital signing
- Credit note issuance and refund management
- Stock management and inventory control
- Purchase transaction recording
- Master data synchronization
- Receipt verification and QR code generation

### 1.3 Objectives

| Objective | Description |
|-----------|-------------|
| **Fiscal Compliance** | Ensure all taxable transactions are reported to KRA in real-time |
| **Transaction Integrity** | Guarantee authenticity through digital signatures from the Online Sales Control Unit (OSCU) |
| **Data Accuracy** | Maintain consistent tax calculations across all transaction types |
| **Operational Continuity** | Provide reliable integration with minimal downtime |
| **Audit Trail** | Maintain complete records for regulatory inspection |

---

## 2. System Overview

### 2.1 eTIMS Ecosystem

The Electronic Tax Invoice Management System comprises three key components:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           eTIMS ECOSYSTEM                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────────┐  │
│   │                  │    │                  │    │                      │  │
│   │  Trader          │───►│  Online Sales    │───►│  KRA Authority       │  │
│   │  Invoicing       │    │  Control Unit    │    │  eTIMS Server        │  │
│   │  System (TIS)    │◄───│  (OSCU)          │◄───│                      │  │
│   │                  │    │                  │    │                      │  │
│   └──────────────────┘    └──────────────────┘    └──────────────────────┘  │
│                                                                              │
│   Invoicing, Stock,        Signs Receipts,        Central Repository,       │
│   Reports, Journals        Validates Data         Verification Services     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Component Definitions

| Component | Role | Responsibility |
|-----------|------|----------------|
| **TIS (Trader Invoicing System)** | Business application for invoicing and stock management | Invoice creation, tax calculation, receipt printing, reporting, electronic journal |
| **OSCU (Online Sales Control Unit)** | KRA-hosted control unit | Transaction signing, signature generation, counter management, receipt validation |
| **Authority eTIMS** | KRA central server | Transaction storage, verification services, compliance monitoring |

### 2.3 Integration Principle

**Critical Rule:** The TIS shall not issue a tax invoice or credit note to a customer unless the OSCU has successfully signed the transaction and returned the required fiscal data. This ensures every tax document is authenticated and recorded by the tax authority.

---

## 3. Architecture Design

### 3.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         INTEGRATION ARCHITECTURE                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌────────────────────────────────────────────────────────────────────┐    │
│   │                      TIS APPLICATION LAYER                          │    │
│   │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌───────────┐  │    │
│   │  │ Invoice     │  │ Credit Note │  │ Stock       │  │ Reports   │  │    │
│   │  │ Management  │  │ Processing  │  │ Management  │  │ & Journal │  │    │
│   │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └─────┬─────┘  │    │
│   └─────────┼────────────────┼────────────────┼───────────────┼────────┘    │
│             │                │                │               │              │
│   ┌─────────▼────────────────▼────────────────▼───────────────▼────────┐    │
│   │                    eTIMS INTEGRATION LAYER                          │    │
│   │  ┌─────────────────────────────────────────────────────────────┐   │    │
│   │  │  Authentication  │  Payload Builder  │  Response Handler    │   │    │
│   │  │  & Token Mgmt    │  & Validation     │  & Fiscal Extract    │   │    │
│   │  └─────────────────────────────────────────────────────────────┘   │    │
│   └─────────────────────────────────┬──────────────────────────────────┘    │
│                                     │                                        │
│   ┌─────────────────────────────────▼──────────────────────────────────┐    │
│   │                    SECURE COMMUNICATION LAYER                       │    │
│   │              TLS 1.2+ Encrypted HTTPS Connection                    │    │
│   └─────────────────────────────────┬──────────────────────────────────┘    │
│                                     │                                        │
└─────────────────────────────────────┼────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          KRA eTIMS INFRASTRUCTURE                            │
│  ┌────────────────────┐  ┌────────────────────┐  ┌────────────────────────┐ │
│  │ OAuth Token        │  │ OSCU REST API      │  │ Receipt Verification   │ │
│  │ Generation         │  │ Endpoints          │  │ Portal                 │ │
│  └────────────────────┘  └────────────────────┘  └────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Integration Environments

| Environment | Purpose | API Endpoint Domain |
|-------------|---------|---------------------|
| **Sandbox** | Development, testing, and certification | `sbx.kra.go.ke` |
| **Production** | Live transaction processing | `ra.kra.go.ke` |

### 3.3 Authentication Flow

```
┌───────────┐                    ┌───────────────┐                 ┌───────────┐
│    TIS    │                    │  KRA OAuth    │                 │   OSCU    │
│           │                    │  Server       │                 │   API     │
└─────┬─────┘                    └───────┬───────┘                 └─────┬─────┘
      │                                  │                               │
      │  1. Request Token                │                               │
      │  (Client Credentials)            │                               │
      │─────────────────────────────────►│                               │
      │                                  │                               │
      │  2. Access Token                 │                               │
      │  (Bearer Token + Expiry)         │                               │
      │◄─────────────────────────────────│                               │
      │                                  │                               │
      │  3. API Request                                                  │
      │  (Bearer Token + Headers)                                        │
      │─────────────────────────────────────────────────────────────────►│
      │                                                                  │
      │  4. Response                                                     │
      │  (Transaction Data + Signatures)                                 │
      │◄─────────────────────────────────────────────────────────────────│
      │                                                                  │
```

---

## 4. Integration Components

### 4.1 Device Initialization

Before any transaction can be processed, the TIS must initialize communication with the OSCU:

| Step | Process | Outcome |
|------|---------|---------|
| 1 | Submit device serial number, taxpayer PIN, and branch ID | Device registration |
| 2 | Receive Communication Key (cmcKey) | Secure session establishment |
| 3 | Receive Sales Control Unit ID (sdcId) | Device identification for receipts |
| 4 | Store credentials securely | Ready for transaction processing |

**Initialization Response Codes:**

| Code | Meaning | Action |
|------|---------|--------|
| `000` | Successful initialization | Store cmcKey and proceed |
| `902` | Device already installed | Reuse previously stored cmcKey |
| `901` | Invalid device | Verify PIN and branch ID |

### 4.2 Master Data Functions

| Function | Direction | Purpose |
|----------|-----------|---------|
| **Code List Lookup** | KRA → TIS | Retrieve standardized codes (tax types, payment methods, etc.) |
| **Item Classification** | KRA → TIS | Retrieve HS codes and item classification hierarchy |
| **Branch List** | KRA → TIS | Retrieve registered branch locations |
| **Taxpayer Information** | KRA → TIS | Retrieve taxpayer profile and registration details |
| **Customer PIN Lookup** | KRA → TIS | Validate customer PIN for B2B transactions |
| **Notices** | KRA → TIS | Retrieve KRA announcements and compliance notices |

### 4.3 Item Management

| Function | Direction | Purpose |
|----------|-----------|---------|
| **Save Item** | TIS → KRA | Register new items in the eTIMS item master |
| **Item List** | KRA → TIS | Retrieve registered items |
| **Item Composition** | TIS → KRA | Register Bill of Materials (BOM) for composite items |
| **Import Items** | KRA → TIS | Retrieve items cleared through customs |
| **Confirm Import** | TIS → KRA | Convert imported items to local inventory |

**Item Code Structure:**

```
KE 1 NT BA 0000001
│  │ │  │  └────── 7-digit sequential number (per prefix)
│  │ │  └───────── Quantity unit code (2 characters)
│  │ └──────────── Packaging unit code (2 characters)
│  └────────────── Item type (1=Raw, 2=Finished, 3=Service)
└───────────────── Country code (KE=Kenya)
```

### 4.4 Transaction Functions

| Function | Direction | Purpose |
|----------|-----------|---------|
| **Send Sales Transaction** | TIS → KRA | Submit signed invoice for tax reporting |
| **Send Credit Note** | TIS → KRA | Submit signed credit note for refund reporting |
| **Get Sales Transactions** | KRA → TIS | Retrieve sales history |
| **Get Invoice Details** | KRA → TIS | Retrieve specific invoice details |
| **Send Purchase Transaction** | TIS → KRA | Record purchase from suppliers |
| **Get Purchase Transactions** | KRA → TIS | Retrieve purchase list from suppliers |

### 4.5 Stock Management Functions

| Function | Direction | Purpose |
|----------|-----------|---------|
| **Send Stock I/O** | TIS → KRA | Report stock movements (receipts, adjustments, transfers) |
| **Save Stock Master** | TIS → KRA | Report current stock levels |
| **Get Stock Movements** | KRA → TIS | Retrieve stock movement history |

---

## 5. Data Flow and Processes

### 5.1 Sales Transaction Flow

```
┌────────────────────────────────────────────────────────────────────────────┐
│                         SALES TRANSACTION PROCESS                           │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌───────────┐ │
│  │   Create    │────►│  Calculate  │────►│   Submit    │────►│  Receive  │ │
│  │   Invoice   │     │   Tax       │     │   to OSCU   │     │  Signature│ │
│  └─────────────┘     └─────────────┘     └─────────────┘     └─────┬─────┘ │
│                                                                     │       │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐           │       │
│  │   Issue     │◄────│  Generate   │◄────│   Store     │◄──────────┘       │
│  │   Receipt   │     │   QR Code   │     │   Response  │                   │
│  └─────────────┘     └─────────────┘     └─────────────┘                   │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

**Sales Transaction Data Requirements:**

| Category | Required Fields |
|----------|-----------------|
| **Header** | Invoice number, customer PIN, transaction date, transaction type |
| **Tax Summary** | Taxable amounts (A-E), tax rates, tax amounts, totals |
| **Line Items** | Item code, classification, name, quantity, unit price, tax type |
| **Receipt** | Customer mobile, publication date, trade name, address |

### 5.2 Credit Note Flow

```
┌────────────────────────────────────────────────────────────────────────────┐
│                          CREDIT NOTE PROCESS                                │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌───────────┐ │
│  │  Reference  │────►│  Create     │────►│  Validate   │────►│  Submit   │ │
│  │  Original   │     │  Credit     │     │  Refund     │     │  to OSCU  │ │
│  │  Invoice    │     │  Note       │     │  Amount     │     │           │ │
│  └─────────────┘     └─────────────┘     └─────────────┘     └─────┬─────┘ │
│                                                                     │       │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐           │       │
│  │   Issue     │◄────│  Update     │◄────│  Receive    │◄──────────┘       │
│  │   Credit    │     │  Journal    │     │  Signature  │                   │
│  │   Note      │     │             │     │             │                   │
│  └─────────────┘     └─────────────┘     └─────────────┘                   │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

**Credit Note Requirements:**

| Requirement | Description |
|-------------|-------------|
| **Original Reference** | Must reference the original invoice number (`orgInvcNo`) |
| **Refund Date** | Must be after the original invoice date |
| **Refund Reason** | Must include standardized reason code (`rfdRsnCd`) |
| **Amount Validation** | Cannot exceed original invoice amount |
| **Single Cancellation** | An original invoice can only be cancelled once |

### 5.3 Stock Management Flow

```
┌────────────────────────────────────────────────────────────────────────────┐
│                        STOCK MANAGEMENT PROCESS                             │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                         ┌─────────────────┐                                 │
│                         │  Stock In/Out   │                                 │
│                         │  Transaction    │                                 │
│                         └────────┬────────┘                                 │
│                                  │                                          │
│         ┌────────────────────────┼────────────────────────┐                 │
│         │                        │                        │                 │
│         ▼                        ▼                        ▼                 │
│  ┌─────────────┐         ┌─────────────┐         ┌─────────────┐           │
│  │  Stock      │         │  Stock      │         │  Stock      │           │
│  │  Receipt    │         │  Adjustment │         │  Transfer   │           │
│  │  (sarTyCd)  │         │  (sarTyCd)  │         │  (sarTyCd)  │           │
│  └──────┬──────┘         └──────┬──────┘         └──────┬──────┘           │
│         │                        │                        │                 │
│         └────────────────────────┼────────────────────────┘                 │
│                                  │                                          │
│                                  ▼                                          │
│                         ┌─────────────────┐                                 │
│                         │  Update Stock   │                                 │
│                         │  Master         │                                 │
│                         └─────────────────┘                                 │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

**Stock Adjustment Reference (sarNo) Sequencing:**

Stock movements require sequential numbering. If the system returns an expected sequence number, retry with that number.

---

## 6. Security Architecture

### 6.1 Authentication Security

| Layer | Mechanism | Purpose |
|-------|-----------|---------|
| **Transport** | TLS 1.2+ | Encrypt all data in transit |
| **Application** | OAuth 2.0 Client Credentials | Authenticate API requests |
| **Session** | Communication Key (cmcKey) | Maintain secure device session |
| **Request** | Request signing headers | Validate request integrity |

### 6.2 Required Request Headers

| Header | Purpose |
|--------|---------|
| `Authorization` | Bearer token from OAuth |
| `apigee_app_id` | Registered application identifier |
| `tin` | Taxpayer Identification Number |
| `bhfId` | Branch identifier |
| `cmcKey` | Communication key (post-initialization) |
| `Content-Type` | `application/json` |

### 6.3 Credential Management

| Credential | Storage | Refresh |
|------------|---------|---------|
| **Client ID** | Secure server-side configuration | Static |
| **Client Secret** | Secure server-side configuration | Static |
| **Access Token** | Memory/secure cache | Before expiry |
| **cmcKey** | Secure persistent storage | On device re-initialization |

### 6.4 Security Principles

1. **Client secrets never exposed** to frontend applications
2. **Proxy pattern** for frontend-initiated requests through secure backend
3. **Token refresh** before expiry to prevent request failures
4. **Secure storage** of cmcKey with appropriate encryption
5. **Environment isolation** between sandbox and production

---

## 7. Transaction Processing

### 7.1 Receipt Types

| Type Code | Transaction | Label | Description |
|-----------|-------------|-------|-------------|
| `N` + `S` | Normal Sale | **NS** | Standard tax invoice |
| `N` + `R` | Normal Credit Note | **NC** | Standard credit note |
| `C` + `S` | Copy Sale | **CS** | Reprint of sale (watermarked) |
| `C` + `R` | Copy Credit Note | **CC** | Reprint of credit note (watermarked) |
| `T` + `S` | Training Sale | **TS** | Training mode transaction |
| `P` + `S` | Proforma | **PS** | Quotation (no fiscal signature) |

### 7.2 Tax Categories

| Tax Code | Description | Rate |
|----------|-------------|------|
| **A** | Exempt | 0% |
| **B** | Standard VAT | 16% |
| **C** | Zero-rated | 0% |
| **D** | Non-VAT | 0% |
| **E** | Excise (where applicable) | 8% |

**Tax Calculation Rules:**

- All programmed tax rates > 0% must appear on every receipt
- Zero rates appear only when used in the transaction
- Tax amounts calculated to 2 decimal places
- `prc` (price) fields are VAT-inclusive
- `splyAmt` must equal `prc × qty`

### 7.3 Payment Methods

| Code | Method |
|------|--------|
| `01` | Cash |
| `02` | Credit |
| `03` | Cheque |
| `04` | Bank Transfer |
| `05` | Debit & Credit Card |
| `06` | Mobile Money |
| `07` | Other |

### 7.4 OSCU Response Fields

| Field | Purpose | Usage |
|-------|---------|-------|
| `sdcId` | Sales Control Unit ID | Print on receipt (CU ID) |
| `sdcDateTime` | OSCU signing timestamp | Print on receipt |
| `curRcptNo` | Current receipt counter (per type) | Print as receipt counter |
| `totRcptNo` | Total receipt counter (all types) | Print with `curRcptNo` |
| `intrlData` | Internal encrypted data | Print with dashes every 4 characters |
| `rcptSign` | Receipt signature | Print with dashes every 4 characters, use in QR |
| `invcNo` | KRA invoice number | Reference for credit notes |

---

## 8. Compliance and Regulatory Requirements

### 8.1 Receipt Printing Requirements

Every fiscal receipt must include:

**Seller/Buyer Information:**
- Taxpayer name and PIN
- Address of sale location
- Buyer PIN (for B2B transactions)
- Receipt type label (NS, NC, etc.)
- Uninterrupted ascending receipt number

**Transaction Details:**
- Item descriptions with quantity, price, and tax
- Discount percentage and amount (shown as negative)
- Item count (excluding voids)
- Total amount with tax breakdown
- Payment method

**SCU Information Block (Mandatory):**

```
┌─────────────────────────────────────────────────────┐
│                   SCU Information                    │
├─────────────────────────────────────────────────────┤
│ Date: dd/mm/yyyy    Time: hh:mm:ss                  │
│ CU ID: KRACU04XXXXXXXX                              │
│ CU INVOICE NO.: KRACU04XXXXXXXX/1                   │
│ Receipt Counter: 1/1 NS                             │
│ Internal Data: TE68-SLA2-34J5-EAV3-N569-88LJ-Q7    │
│ Receipt Signature: V249-J39C-FJ48-HE2W              │
│ [QR CODE]                                           │
│ [KRA LOGO]                                          │
└─────────────────────────────────────────────────────┘
```

### 8.2 QR Code Content

The QR code encodes the KRA receipt verification URL:

```
https://etims.kra.go.ke/common/link/etims/receipt/indexEtimsReceiptData?{PIN}{bhfId}{rcptSign}
```

| Component | Description |
|-----------|-------------|
| `PIN` | Taxpayer PIN (11 characters) |
| `bhfId` | Branch ID (2 characters) |
| `rcptSign` | Receipt signature from OSCU |

### 8.3 Credit Note Requirements

| Requirement | Description |
|-------------|-------------|
| **Title** | Clearly marked as "CREDIT NOTE" |
| **Original Reference** | Include original CU invoice number |
| **Approval Statement** | State that it applies only to the referenced receipt |
| **Negative Amounts** | All amounts displayed as negative |
| **Reason Code** | Include standardized refund reason |
| **Journal Entry** | Record in credit note log with recipient and reason |

### 8.4 Copy and Reprint Rules

| Document Type | Requirement |
|---------------|-------------|
| **Copy** | "COPY" watermark + "THIS IS NOT AN OFFICIAL RECEIPT" (2× larger font) |
| **Training** | "TRAINING" watermark + disclaimer text |
| **Proforma** | "PROFORMA" watermark + no fiscal signatures |

### 8.5 Operational Reports

**X Report (Daily Summary):**
- Generated on demand
- Covers period since last Z report
- Shows totals by transaction type, tax rate, and payment method

**Z Report (End of Day):**
- Generated at close of business
- Covers 00:00:00 to 23:59:59
- Resets daily counters
- Required even if no transactions occurred
- If skipped, next Z covers entire gap

**PLU Report (Product Sales):**
- Item-level sales analysis
- Shows quantity sold and remaining stock
- Covers user-specified date range

---

## 9. Error Handling and Recovery

### 9.1 Response Code Categories

| Code Range | Category | Action |
|------------|----------|--------|
| `000` | Success | Process response normally |
| `001` | Empty result | Success (no matching data) |
| `9xx` | System/validation errors | Handle per specific code |

### 9.2 Common Error Codes

| Code | Message | Resolution |
|------|---------|------------|
| `000` | Successful | Process normally |
| `001` | No search result | Accept as valid empty response |
| `901` | Invalid device | Verify PIN, branch ID, and serial number |
| `902` | Device already installed | Reuse stored cmcKey |
| `910` | Parameter error | Validate request payload |
| `920` | Invalid item code sequence | Use next sequential number |
| `930` | Insufficient stock | Ensure stock I/O before composition |
| `940` | Missing purchase record | Verify supplier invoice exists |

### 9.3 Recovery Procedures

**Token Expiry:**
1. Detect 401 response or token expiry
2. Request new token using client credentials
3. Retry original request with new token

**Network Failure:**
1. Queue transaction locally
2. Retry with exponential backoff
3. Alert if retry limit exceeded
4. Do not issue receipt until confirmed

**cmcKey Loss:**
1. Re-initialize device
2. Expect `902` response
3. Provide previously stored cmcKey
4. Resume normal operations

### 9.4 Transaction Integrity

| Scenario | Handling |
|----------|----------|
| **OSCU timeout** | Retry transaction; do not issue receipt |
| **Duplicate submission** | Check for existing transaction by reference |
| **Partial response** | Do not issue receipt; alert for investigation |
| **Invoice counter mismatch** | Query sales list; reconcile sequence |

---

## 10. Operational Considerations

### 10.1 Synchronization Schedule

| Data Type | Frequency | Direction |
|-----------|-----------|-----------|
| Code lists | Daily or on-demand | KRA → TIS |
| Item classification | Daily or on-demand | KRA → TIS |
| Purchase transactions | Every 15 minutes maximum | KRA → TIS |
| Import items | Every 15 minutes maximum | KRA → TIS |
| Stock movements | Every 15 minutes maximum | KRA → TIS |
| Notices | Daily | KRA → TIS |

### 10.2 Date and Time Handling

| Format | Usage |
|--------|-------|
| `yyyyMMddHHmmss` | API request timestamps |
| `yyyyMMdd` | Date-only fields |
| `dd/mm/yyyy hh:mm:ss` | Receipt display format |

**Time Zone:** All timestamps in Africa/Nairobi (EAT, UTC+3)

### 10.3 Decimal Precision

| Field Type | Precision | Format |
|------------|-----------|--------|
| Monetary amounts | 2 decimal places | `0.00` |
| Tax rates | Integer percentage | `16` (not `0.16`) |
| Quantities | As appropriate | Variable |

### 10.4 Stock Control Rules

| Item Type | Stock Validation |
|-----------|------------------|
| **Goods** | Cannot sell if `remaining stock < quantity` |
| **Services** | May sell without stock validation |

### 10.5 Electronic Journal

The TIS must maintain an immutable electronic journal of:
- All Normal Sales (NS)
- All Credit Notes (NC)
- Timestamps and user identifiers
- Complete transaction details

Journal entries cannot be edited or deleted.

---

## 11. Appendices

### Appendix A: API Endpoint Reference

| Function | Method | Endpoint Path |
|----------|--------|---------------|
| Generate Token | POST | `/v1/token/generate` |
| Initialize Device | POST | `/etims-oscu/api/v1/initialize` |
| Get Code List | POST | `/etims-oscu/api/v1/selectCodeList` |
| Get Item Classification | POST | `/etims-oscu/api/v1/selectItemClass` |
| Get Branch List | POST | `/etims-oscu/api/v1/branchList` |
| Get Taxpayer Info | POST | `/etims-oscu/api/v1/selectTaxpayerInfo` |
| Get Customer by PIN | POST | `/etims-oscu/api/v1/customerPinInfo` |
| Get Notices | POST | `/etims-oscu/api/v1/selectNotices` |
| Save Customer | POST | `/etims-oscu/api/v1/branchSendCustomerInfo` |
| Save Branch User | POST | `/etims-oscu/api/v1/branchUserAccount` |
| Save Branch Insurance | POST | `/etims-oscu/api/v1/branchInsuranceInfo` |
| Save Item | POST | `/etims-oscu/api/v1/saveItem` |
| Get Item List | POST | `/etims-oscu/api/v1/itemInfo` |
| Save Item Composition | POST | `/etims-oscu/api/v1/saveItemComposition` |
| Get Imported Items | POST | `/etims-oscu/api/v1/importedItemInfo` |
| Confirm Import | POST | `/etims-oscu/api/v1/importedItemConvertedInfo` |
| Send Sales Transaction | POST | `/etims-oscu/api/v1/sendSalesTransaction` |
| Get Sales Transactions | POST | `/etims-oscu/api/v1/selectSalesTransactions` |
| Get Invoice Details | POST | `/etims-oscu/api/v1/selectInvoiceDetail` |
| Send Purchase | POST | `/etims-oscu/api/v1/sendPurchaseTransactionInfo` |
| Get Purchase Transactions | POST | `/etims-oscu/api/v1/getPurchaseTransactionInfo` |
| Send Stock I/O | POST | `/etims-oscu/api/v1/insert/stockIO` |
| Save Stock Master | POST | `/etims-oscu/api/v1/save/stockMaster` |
| Get Stock Movements | POST | `/etims-oscu/api/v1/selectStockMoveLists` |

### Appendix B: Stock Adjustment Types (sarTyCd)

| Code | Description |
|------|-------------|
| `01` | Stock receipt from purchase |
| `02` | Stock receipt from import |
| `03` | Stock receipt from return |
| `04` | Stock out for sale |
| `05` | Stock out for disposal |
| `06` | Stock adjustment (in) |
| `07` | Stock adjustment (out) |
| `08` | Stock transfer out |
| `09` | Stock transfer in |

### Appendix C: Refund Reason Codes (rfdRsnCd)

| Code | Reason |
|------|--------|
| `01` | Contract cancelled |
| `02` | Return of goods |
| `03` | Correction of errors |
| `04` | Price adjustment |
| `05` | Goods not delivered |
| `06` | Refund |
| `07` | Others |

### Appendix D: Transaction Status Codes

| Code | Status |
|------|--------|
| `01` | Wait for approval |
| `02` | Approved (completed) |
| `03` | Credit note issued |
| `04` | Cancelled |

### Appendix E: Certification Checklist Summary

| Category | Requirements |
|----------|--------------|
| **Initialization** | Device init, code lookup, classification, notices |
| **Branch Management** | Customer save, user save, insurance save |
| **Item Management** | Item save (multiple tax types), composition, import handling |
| **Stock** | Stock I/O, stock master |
| **Sales** | Multiple invoices per tax type, discounts, mixed tax |
| **Purchases** | Multiple purchase transactions |
| **Credit Notes** | Proper refund with original reference |
| **Verification** | QR code, receipt printing, CU information block |

---