import type { TisTaxBand } from "./tis-receipt-totals";

export type Item = {
  id?: string;
  itemDescription: string;
  amount?: number;
  qty?: number;
  billingCycle?: string;
  /** Product KRA tax band (A–E). Printed with the tax table rate label. */
  etimsTaxTyCd?: string;
};

export type YourDetails = {
  yourEmail?: string;
  yourName?: string;
  yourAddress?: string;
  yourCity?: string;
  yourState?: string;
  yourCountry?: string;
  yourLogo?: string;
  /** Optional logo frame width in pt (height scales with auth 3:1 box). Default matches `pdfBrandingLogoBox`. */
  yourLogoWidth?: number;
  yourTaxId?: string;
  yourZip?: string;
};

export type CompanyDetails = {
  email?: string;
  companyName?: string;
  companyAddress?: string;
  companyCity?: string;
  companyState?: string;
  companyCountry?: string;
  companyTaxId?: string;
  companyZip?: string;
};

export type InvoiceItemDetails = {
  note?: string;
  discount?: string;
  taxRate?: string;
  items: Item[];
  currency?: string;
  /** Smaller, bold line typography (e.g. cron-generated media buying PDFs). */
  compactLineItems?: boolean;
  /** Credit notes: print line totals and grand total as negative (TIS NC sample). */
  negateAmounts?: boolean;
  /** A–E taxable/VAT from the KRA sales payload when the invoice is synced. */
  taxBuckets?: Record<TisTaxBand, { taxable: number; vat: number }>;
};

export type PaymentMethod = "bank" | "mpesa" | "cheque";

export type PaymentDetails = {
  paymentMethod?: PaymentMethod;
  currency?: string;
  /** KRA eTIMS receipt verification URL  the only QR source rendered on PDFs. */
  etimsVerificationUrl?: string;
  /** @deprecated Bank/marketing QR values must not appear on fiscal PDFs. */
  qrCodeValue?: string;
  // Bank transfer fields
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  branchName?: string;
  branchCode?: string;
  swiftCode?: string;
  // MPESA fields
  mpesaPaybillNumber?: string;
  mpesaAccountNumber?: string;
  mpesaInstructions?: string;
  // Cheque fields
  chequeDeliveryAddress?: string;
  chequeInstructions?: string;
};

export type InvoiceTerms = {
  invoiceNumber?: string;
  /** KRA SCU / CU ID (`sdcId`), printed under the invoice number. */
  scuId?: string;
  issueDate?: string | Date;
  /** Full `dd/mm/yyyy hh:mm:ss` from the KRA SCU stamp. Preferred over formatting `issueDate`. */
  issuedAtDisplay?: string;
  dueDate?: string | Date;
  /** Shown on credit notes instead of due date */
  originalInvoiceNumber?: string;
  /** Meta label for the document number row (default: INVOICE NO) */
  numberLabel?: string;
  /** When false, due date row is hidden (credit notes) */
  showDueDate?: boolean;
  /** KRA SCU receipt number of the original sale (credit notes). */
  originalCuInvoiceNo?: string;
  /** Buyer PIN printed near the credit-note header. */
  buyerPin?: string;
  /** Invoice or credit-note status, printed as STATUS under the dates. */
  status?: string;
};

export type { EtimsFiscalFields } from "../lib/etims-fiscal-fields";

