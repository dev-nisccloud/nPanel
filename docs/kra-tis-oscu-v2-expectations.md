# KRA expectations of nPanel (TIS) and `kra-etims-oscu`

**Draft** — mapped from *Technical Specification of Trader Invoicing System (TIS) for Online and Virtual Sales Control Unit (OSCU & VSCU) v2.0* (KRA, April 2023, 28 pages, PUBLIC / ISO 9001:2015).

Source file: `C:\Users\somuo\Downloads\TIS-for-OSCU--VSCU-Technical-Specifications-v2.0.pdf`  
Related: OSCU REST communication protocol (what Gava Connect actually scored) is covered in `docs/KRA_eTIMS_OSCU_Developer_Guide.md` and implemented in `apps/kra-etims-oscu`.

This is a working draft of **what KRA expects of us**, split by:

| Layer | Role in KRA language | In this repo |
|---|---|---|
| **TIS** | Trader Invoicing System — invoicing, stock, receipts, journals, reports | **nPanel** (web + API + PDFs) |
| **OSCU / VSCU** | Control unit that signs receipts and talks to the Authority | KRA-hosted OSCU we call over HTTPS. The **`kra-etims-oscu` library** is our TIS→OSCU client |

nPanel must not issue a tax invoice unless OSCU has signed it. The library must send every OSCU function correctly. nPanel must then **print, stock, journal, and report** as this TIS spec requires.

---

## 1. How to read the April 2023 PDF vs what we run today

The PDF mixes three things:

1. **Legal TIS behaviour** (receipts, stock, X/Z/PLU reports, no sale without OSCU). This still applies to nPanel.
2. **A local XML command set** (`SEND_RECEIPT`, `RECV_RECEIPT`, 1000 ms timeout, SOAP/REST “or any protocol”). That is the **device / VSCU serial protocol**.
3. **Payload tags** (`SEND_ITEM`, `SEND_PURCHASE`, `RECV_IMPORT_ITEM`, …) that describe the **same business objects** we already send as JSON to Gava Connect.

What scored on Gava Connect is **not** the XML envelope. It is:

- OAuth client credentials
- `POST https://sbx.kra.go.ke/etims-oscu/api/v1/{path}` (sandbox) or `https://ra.kra.go.ke/etims-oscu/api/v1/{path}` (production)
- Headers `Authorization`, `apigee_app_id`, `tin`, `bhfId`, `cmcKey` (except init)
- JSON bodies with `resultCd` `000` / `001` / `902`

**Draft position:** keep the TIS functional rules from this PDF; implement TIS↔Authority data exchange through the REST library, not the XML `<CMD>` dialect, unless KRA later requires a local VSCU process.

The PDF’s sample `itemCd` values still contain `XXX` (`KE2BEXUXXX0000001`). That format **failed** Apigee (“Incorrect QtyUnitCd Prefix”). Live codes are `KE` + type + pkg + qty + 7 digits with **no X**, and a **2-character** qty unit in the code (`KE1NTBA0000001`).

---

## 2. Architecture KRA defined

```
Taxpayer / cashier
        │
        ▼
   TIS (nPanel)     ← this spec (receipts, stock, reports, PIN, journals)
        │  signed sale / purchase / item / stock
        ▼
   OSCU / VSCU      ← kra-etims-oscu talks to KRA’s OSCU API
        │
        ▼
   Authority eTIMS  (sandbox or production)
```

Definitions that matter:

- **eTIMS** = TIS + OSCU/VSCU connected together.
- **Receipt** = tax invoice or receipt for goods/services.
- **Signature** = receipt data used by KRA for integrity (`rcptSign` + `intrlData`).
- **Internal data** = encrypted control-unit payload that must be printed.
- **Remote verification** = two-way talk with KRA’s server (OSCU). QR / URL is how a buyer checks a receipt.

TIS may be a cash register, POS, or **any computer invoicing software**. nPanel qualifies as TIS.

**Hard rule (PDF §2):** TIS shall not receive import/purchase data or **produce invoices** unless connected to a functional OSCU/VSCU assigned to the **same PIN**. OSCU keeps outbound transaction data irrevocably and returns the encrypted value that **must** be printed.

---

## 3. Receipt types KRA expects (TIS labels)

Each issued document is **receipt type × transaction type**. TIS must assign a **receipt label** OSCU can interpret:

| Receipt type | Transaction | Label | OSCU REST today | nPanel |
|---|---|---|---|---|
| NORMAL | SALE | **NS** | `salesTyCd=N`, `rcptTyCd=S` | Agency invoice → `sendSalesTransaction` |
| NORMAL | CREDIT NOTE | **NC** | `rcptTyCd=R`, `orgInvcNo`, `rfdDt`, `rfdRsnCd` | Credit note → `sendCreditNote` |
| COPY | SALE | **CS** | `salesTyCd=C` | **Gap** — reprints are not labelled COPY |
| COPY | CREDIT NOTE | **CC** | copy + `R` | **Gap** |
| TRAINING | SALE / CN | **TS / TC** | `salesTyCd=T` | **Gap** |
| PROFORMA | SALE | **PS** | `salesTyCd=P` | Proforma invoices exist as TIS docs; **must not** look like a signed NS and must not print SCU signatures (PDF §5.3.6) |

PDF §4.2.3 also lists **DEBIT NOTE**. The label table has no debit-note row. OSCU REST we certified only has sale (`S`) and credit note (`R`). Treat debit notes as **unspecified for OSCU JSON** until KRA clarifies; do not invent a label.

Copies, training, and proforma must be **clearly distinguishable**: the word COPY / TRAINING / PROFORMA under the header **and** as a watermark, and below totals in **at least 2× larger** type:

> THIS IS NOT AN OFFICIAL RECEIPT

---

## 4. Signing flow KRA expects (every NS / NC)

Before the printer/PDF is allowed to finish:

1. TIS sends receipt data to OSCU (date/time, PIN, optional buyer PIN, receipt number, type, tax rates, totals with tax, tax amounts).
2. OSCU replies with: SCU ID, SCU date/time, receipt label, **per-type counter**, **all-receipts counter**, digital signatures (not for TRAINING / PROFORMA).
3. TIS prints that block in the designated place.
4. TIS then sends the **complete journal text** of NS and NC to OSCU (`EJ_DATA` in the XML spec). REST equivalent is not a separate Gava path we used; journal is implied by the sales payload + local electronic journal.

**nPanel must not emit a customer PDF/print of a NORMAL sale or credit note until `sendSalesTransaction` / `sendCreditNote` has returned `rcptSign`.** That matches PDF §10.

Library mapping of the OSCU response:

| TIS spec field | REST field we store | Print |
|---|---|---|
| SCU ID | init `info.sdcId` (e.g. `KRACU…`) | Required; **partial** on PDF today |
| SCU date/time | `sdcDateTime` | Footer |
| Receipt counter per type | `curRcptNo` | Required; **partial** |
| Receipt counter of all receipts | `totRcptNo` | Required; **partial** |
| Internal data | `intrlData` | Footer (not yet dashed every 4 chars) |
| Receipt signature | `rcptSign` | Footer (not yet dashed every 4 chars) |

---

## 5. What must appear on a NORMAL tax invoice (NS)

PDF §3 + sample p.8. Layout is at the trader’s discretion; **fields are not**.

### Seller / buyer

| # | Requirement | Owner | nPanel today |
|---|---|---|---|
| a | Taxpayer name | TIS | Company name on PDF |
| b | PIN | TIS | PIN on PDF when configured |
| c | Address of sale | TIS | Company address |
| d | Buyer PIN (optional) | TIS | Customer PIN when captured |
| e | Receipt type + transaction type | TIS | Invoice vs credit note titles; labels NS/NC not printed |
| f | Uninterrupted ascending receipt number **per type** | TIS + OSCU | TIS `INV-` / `CN-` **and** KRA `invcNo` (session counter). Do not conflate them |
| m | TIS date/time | TIS | Issue date |

### Lines and money (2 decimal places)

| # | Requirement | Owner | nPanel today |
|---|---|---|---|
| g | Items/services: description, qty, price, cancellations/corrections | TIS | Line items |
| h | Total sales amount | TIS | Totals |
| i–j | Tax rates and VAT | TIS | Tax breakdown; bands A–E |
| k | Means of payment | TIS | Payment method |
| | Discount % and amount; show **negative** discount total | TIS | Discounts exist; confirm negative presentation |
| | Item count (excluding voids) | TIS | **Gap** as explicit “ITEMS NUMBER” |
| | Tax table: Exempt, 16%, 0%, Non-VAT, 8% | TIS | Partial (not the full 5-row SCU table on every receipt) |

Tax print rules (PDF §6.21–6.22):

- Every programmed rate **> 0** must appear on **every** receipt even if unused.
- A **zero** rate is printed **only** when a line uses that rate.
- Cert sheet we ran skipped tax **E** (`useYn` N). If E is enabled for the taxpayer, it must appear.

### SCU Information block (PDF §6.23) — mandatory uniform layout

Printed under the heading **“SCU Information”**:

1. OSCU/VSCU date and time as `Date: dd/mm/yyyy Time: hh:mm:ss`
2. `CU ID: KRACU04XXXXXXXX` (from init `sdcId`)
3. `CU INVOICE NO.: {CU ID}/{sequential}` e.g. `KRACU0100000001/1`
4. Receipt counter `A/B RT` (`curRcptNo` / `totRcptNo` and receipt label)
5. Internal data **with a dash every 4th character** (sample: `TE68-SLA2-34J5-EAV3-N569-88LJ-Q7`)
6. Receipt signature **with a dash every 4th character** (sample: `V249-J39C-FJ48-HE2W`)
7. QR code
8. Official **KRA logo** on every receipt regardless of type (§6.28)

**QR — two wordings in the same PDF:**

- §6.23.8: `invoice_date(ddmmyyyy)#time(hhmmss)#cu number#cu_receipt_number#internal_data#receipt_signature`
- Sample p.8: `https://etims.kra.go.ke/common/link/etims/receipt/indexEtimsReceiptData?{KRA-PIN+BHF-ID+RcpSignture}`

**What we used successfully (Go Live):** the **URL** form, sandbox host `etims-sbx.kra.go.ke`, query = `tin + bhfId + rcptSign` with **no separators**. Library: `buildReceiptVerifyUrl`. Do not put bank/payment QRs on fiscal PDFs.

TIS information (optional category): TIS receipt number + TIS date/time + commercial footer.

### Credit note (NC) extras (PDF §14)

- Title **CREDIT NOTE**
- **Original CU invoice number**
- Statement that it is approved only for the original sales receipt
- **All amounts negative**
- User justification in a **credit-note log book** (recipient name, reason, original receipt)
- Same SCU block as NS
- OSCU: `orgInvcNo` = original KRA `invcNo`; `rfdDt` Africa/Nairobi **after** original `sdcDateTime`; `rfdRsnCd` (e.g. `06` Refund)
- Original sale may be cancelled **only once**, always referencing the original SCU receipt number (§6.16)
- Corrections happen **before** approve; after signing, only a credit note (§12)

Library already builds this (`buildCreditNote`, `creditNoteRefundDt`). nPanel Go Live CN PDF has the fiscal footer; it still needs original CU invoice no., dashed signature, CU ID line, and a stored CN log.

---

## 6. TIS operational rules (nPanel product, not the HTTP library)

These are **system** expectations. The library cannot satisfy them by itself.

| Spec | Expectation | Draft status on nPanel |
|---|---|---|
| §6.1 | Software that implements this document | In progress (invoicing + eTIMS module) |
| §6.2 | PIN change only with **full reset** of that PIN’s data | **Gap** (multi-tenant; treat as agency eTIMS re-init + data isolation) |
| §6.3 | Consecutive journal numbers per receipt type; after reset continue from last **transmitted** invoice | Partial (`invcNo` from KRA; TIS numbers separate) |
| §6.4 | Display amounts with **2 decimal places** | Yes |
| §6.5 | **Z daily report** (00:00:00–23:59:59) and **X daily report** (since last Z) | **Gap** |
| §6.6 | Unique **TIS software version** inspectable by KRA officers | **Gap** (expose nPanel version on eTIMS settings) |
| §6.7–6.8 | Issue receipts **only** if OSCU is healthy; detect and show OSCU errors | Partial (sync errors exist; no hard block on unsigned “tax invoice”) |
| §6.9 | No undocumented functions; **English** documentation with the product | This draft + user docs |
| §6.10 | Inventory in/out and independent stock reports | Partial (stock I/O + master via eTIMS; TIS warehouse UX) |
| §6.11 | Cash deposits and withdrawals | **Gap** as eTIMS-aware till functions |
| §6.12 | Multiple payment means (`01`–`07`) | Partial |
| §6.13 | Paper or **electronic journal** of every print; TIS must not run without it | **Gap** as a dedicated immutable journal |
| §6.14 | Cannot register a sale without printing a receipt | Partial (PDF after save) |
| §6.15 | Cannot register an amount without identifying the good/service | Yes (line items required) |
| §6.16 | No silent edit of a signed sale; cancel once via CN | Partial (CN flow exists) |
| §6.17 | **Only one original**; reprint = COPY + watermark | **Gap** |
| §6.18–6.19 | Send prescribed data; print OSCU response | Library + fiscal footer |
| §6.20 | Service mode: PIN, legal name/address, clock, tax rates A–E | eTIMS settings (init); clock = Nairobi |
| §6.25 | Item counter on receipt | **Gap** |
| §6.27 | Recover last print line after power/paper failure | N/A for cloud PDF; apply to any future hardware POS |
| §6.29 | **Do not sell goods** if stock &lt; qty; **services** may sell without stock | **Gap** to enforce using OSCU remaining qty |
| §6.30 | Closing stock for a given date | **Gap** (stock master is current `rsdQty`) |
| §7 | Host hardware KEBS / safety | N/A for SaaS; applies if we ship a POS device |
| §8 | Other accessories must not interrupt TIS | Ops / hosting |

### X and Z daily reports (PDF §15–17)

Both reports need at least:

- Trade name, PIN, date/time, TIS designation, report type (X vs Z)
- NS totals incl. tax, NS count
- NC totals incl. tax, NC count
- Taxable and tax amounts **per rate**, split NS vs NC
- Opening deposit, items sold
- Copy / training / proforma counts and amounts
- Totals by **payment method** (NS vs NC)
- All discounts; other reductions; incomplete sales count
- If a day was skipped, the next Z covers the **entire** gap since the previous Z

**Owner:** nPanel reports. Library can supply sales list / invoice details as source data; it does not generate X/Z.

### PLU report (PDF §18)

Per item, for a user-chosen date range: item code, name, unit price, tax rate, qty sold, **remaining stock**, company name/PIN, TIS designation.

**Owner:** nPanel. Needs item master + sales lines + stock master.

---

## 7. What KRA expects of the library (`kra-etims-oscu`)

The library is the **OSCU adapter**: auth, hosts, every function, payload builders, fiscal extract, receipt URL. It is **not** the TIS (no PDF, no X/Z, no watermark, no stock UX).

### 7.1 Environments (what we run, not the XML sample)

| Env | OSCU base | Token |
|---|---|---|
| Sandbox (Gava) | `https://sbx.kra.go.ke/etims-oscu/api/v1` | `https://sbx.kra.go.ke/v1/token/generate` |
| Production (Gava) | `https://ra.kra.go.ke/etims-oscu/api/v1` | `https://ra.kra.go.ke/v1/token/generate` |

Classic `etims-api*.kra.go.ke` does **not** update the Gava Connect dashboard. Default the library to Gava.

Receipt verify host: sandbox `https://etims-sbx.kra.go.ke`, production `https://etims.kra.go.ke`.

### 7.2 Map PDF `<CMD>` tags → REST functions we already expose

| PDF command (p.19–28) | Meaning | Library method | Gava path |
|---|---|---|---|
| (activation) | Device + `cmcKey` | `initializeDevice` | `/initialize` |
| `RECV_SYSCODECLS` / `RECV_SYSCODE` | Code tables | `getCodeList` | `/selectCodeList` |
| (item class) | Classification tree | `getItemClassList` | `/selectItemClass` |
| `RECV_TAXPAYER` | Taxpayer / location | `getTaxPayerInfo`, `getCustomerByPin` | `/selectTaxpayerInfo`, `/customerPinInfo` |
| Notices | KRA notices | `getNotices` **and** `getNoticeList` | `/selectNotices`, `/selectNoticeList` |
| Branches | Branch list | `getBranchList` | `/branchList` |
| Customers / users / insurance | Branch send | `saveCustomer`, `saveBranchUser`, `saveBranchInsurance` | `/branchSendCustomerInfo`, `/branchUserAccount`, `/branchInsuranceInfo` |
| `SEND_ITEM` / `RECV_ITEM` | Item master | `saveItem`, `getItemList` | `/saveItem`, `/itemInfo` |
| (composition / BOM) | Item composition | `saveItemComposition` | `/saveItemComposition` |
| `RECV_IMPORT_ITEM` / `SEND_IMPORT_ITEM` | Customs | `getImportedItems`, `confirmImportedItem` | `/importedItemInfo`, `/importedItemConvertedInfo` |
| `SEND_RECEIPT` / `SEND_RECEIPTITEM` | Signed sale / CN | `sendSalesTransaction`, `sendCreditNote` | `/sendSalesTransaction` |
| Sales lookup | Invoice + list | `getInvoiceDetails`, `getSalesTransactions` | `/selectInvoiceDetail`, `/selectSalesTransactions` |
| `RECV_PURCHASE` / `SEND_PURCHASE` / items | Purchases | `getPurchaseTransactions`, `sendPurchaseTransaction` | `/getPurchaseTransactionInfo`, `/sendPurchaseTransactionInfo` |
| `SEND_INVENTORY` | Remaining qty | `saveStockMaster` | `/save/stockMaster` |
| Stock movements / I/O | In/out events | `getStockMovements`, `sendStockIO` | `/selectStockMoveLists`, `/insert/stockIO` |
| `SEND_RECEIPT` journal | EJ text | No dedicated REST path in Gava run; keep a TIS journal in nPanel |
| `STATUS` / `ID_REQUEST` / `DATE_TIME_REQUEST` | Local VSCU health | REST: treat token + init + `resultCd` as health; local VSCU XML is out of scope unless we ship VSCU |

XML commands we **do not** reimplement unless a hardware VSCU is in the path: `RECV_RECEIPT`, `SIGNATURE_REQUEST`, `COUNTERS_REQUEST`, `EJ_DATA`, 1000 ms retry. Those assume a box on the LAN. OSCU-over-internet uses HTTP timeouts and `resultCd` instead.

### 7.3 Library rules already proven (keep)

- Empty list = HTTP 400 / `resultCd` `001` → success
- Init `902` → reuse stored `cmcKey`
- Omit null JSON fields
- `itemCd` without `X`; qty unit 2 chars inside the code
- Sales line: `splyAmt === prc * qty` with **VAT-inclusive** `prc`
- Dates `yyyyMMddHHmmss` / `yyyyMMdd` in **Africa/Nairobi**
- Session `invcNo` / `sarNo` independent of `INV-` / `CN-`
- Stock I/O (`sarTyCd` `06` adjustment in) **before** composition and stock master
- Consumer secret **never** in a frontend; `createKraOscuBrowserClient` + `oscuProxyFetchHandler`
- Decimal money: two places, `.` separator (PDF §21.4.1). Library `roundMoney`. Display dates on the **receipt** use `dd/mm/yyyy`; API bodies stay `yyyyMMdd`.

### 7.4 Library extras this PDF implies

| Expectation | Draft |
|---|---|
| Format `intrlData` / `rcptSign` with dash every 4 chars for print | Helper in library (TIS PDF uses it); nPanel footer should call it |
| CU invoice no. `{sdcId}/{curRcptNo}` | Helper: needs init `sdcId` stored on TIS |
| Receipt label NS/NC/CS/… from `salesTyCd`+`rcptTyCd` | Helper |
| Tax table A–E always present on sale payload | `taxBuckets` / `mergeTaxHeaders` already |
| Sync cadence “maximum 15 min” (PDF p.18) | nPanel job: pull codes, purchases, imports, stock moves; not inside the HTTP client |
| TIS waits for one OSCU reply before the next message (§21) | Serialize signing per device/PIN in nPanel |
| Error codes 11–99 in XML | Map to REST `resultCd` (`901` invalid device, `902` already installed, `910` param, …) in `RESULT_CODES` |

Do **not** put TIS reports, watermarks, KRA logo, or journals in the library.

---

## 8. Split of responsibility (draft)

```
                    KRA TIS spec                          KRA OSCU API
                    (this PDF)                            (Gava REST)
                          │                                     │
          ┌───────────────┴────────────────┐                    │
          │ nPanel (TIS)                   │     kra-etims-oscu │
          │  invoices, CN, stock UI        │◄───────────────────┤
          │  PDF / print / QR / logo       │  token, paths,     │
          │  X/Z/PLU, journal, version     │  payloads, unwrap  │
          │  block unsigned tax invoices   │  fiscal extract    │
          │  COPY/TRAINING/PROFORMA        │  receipt URL       │
          └────────────────────────────────┘                    │
```

**Frontends** (React, etc.) only call the library through nPanel’s proxy. Secrets and `cmcKey` stay on the server.

---

## 9. Gap list (honest)

### Must-have for a KRA officer looking at a printed invoice

1. Heading **SCU Information** (not only a thin footer).
2. `CU ID` + `CU INVOICE NO. {id}/{n}`.
3. Dashed `intrlData` and `rcptSign`.
4. Counter `curRcptNo` / `totRcptNo` (and label NS/NC).
5. SCU date as `dd/mm/yyyy hh:mm:ss`.
6. Official KRA logo.
7. Full tax table (A–E rules above) + item count.
8. Credit note: original CU invoice no., negative amounts, CN log.
9. Refuse to present a document as a tax invoice until OSCU has signed it.

### Must-have TIS controls

10. Reprint = COPY + watermark + “THIS IS NOT AN OFFICIAL RECEIPT”.
11. Goods sale blocked when remaining stock &lt; qty; services allowed.
12. X / Z daily reports and PLU report.
13. Electronic journal of every NS/NC (immutable).
14. Visible TIS software version for inspectors.
15. Periodic pull (≤ 15 min) of codes, purchases, imports, HQ stock moves.

### Already in good shape

- REST OSCU coverage in `kra-etims-oscu` (init through stock, plus PIN lookup and both notice paths).
- Gava Connect certification order and hard-won payload rules.
- nPanel invoice/CN PDF fiscal footer + verification URL QR (Go Live).
- eTIMS routers: init, codes, items, imports, sales, purchases, stock, branch.

### Out of scope unless we ship a local VSCU

- 1000 ms LAN timeout, XML `SEND_RECEIPT` string, hardware error codes 11–13 (memory), KEBS device approval.

---

## 10. Suggested next implementation slices

1. **Library:** print helpers (`dashEvery4`, `cuInvoiceNo`, `receiptLabel`, `formatSdcDisplayDdMmYyyy`) — used by any TIS, including nPanel.
2. **nPanel PDF:** SCU Information block + logo + dashed fields + CU invoice no. + tax table + item count; CN original CU no.
3. **nPanel gating:** no “tax invoice” PDF/email until `kraStatus` synced; reprints marked COPY.
4. **nPanel stock:** block goods qty against last `rsdQty` / I/O.
5. **nPanel reports:** X, Z, PLU from signed sales + stock master.
6. **nPanel journal:** append-only NS/NC text (PDF §5.5 / `EJ_DATA` intent).
7. **Keep** using Gava REST; do not rebuild the XML client.

---

## 11. Source note

The PDF has a text layer (headers/footers “Page n of 28”); content was taken from that layer (OCR-equivalent). Page 11 is a layout graphic with no extra body text. Numbering in the PDF jumps (§9 missing; receipt spec starts at §10). Sample English spelling “indexEti msReceptData” is the PDF’s; the working URL path is `indexEtimsReceiptData`.
