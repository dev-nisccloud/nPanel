/** Source of the line item: from product catalog or manual entry */
export type ItemSource = "product" | "manual";

/** Commission / ad account context for COMMISSION pricing plan items */
export type ItemCommissionContext = {
  metaAdsAccountId: string;
  metaAdsAccountName?: string;
  metaAdsCampaignId: string;
  metaAdsCampaignName: string;
  dateRangeSince: string;
  dateRangeUntil: string;
  adSpend: number;
  commissionRatePercent: number;
};

export type Item = {
  id?: string;
  itemDescription: string;
  amount?: number;
  qty?: number;
  /** When source is product, selected product id */
  productId?: string;
  /** When product has plans, selected plan id */
  productPlanId?: string;
  /** When selected plan has COMMISSION pricing, ad account + campaign context */
  commissionContext?: ItemCommissionContext;
  /** Optional billing cycle for the item */
  billingCycle?: string;
};

export type YourDetails = {
  yourEmail?: string;
  yourName?: string;
  yourAddress?: string;
  yourCity?: string;
  yourState?: string;
  yourCountry?: string;
  yourLogo?: string;
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
  taxPercentage?: number;
  taxRate?: string;
  items: Item[];
  currency?: string;
  compactLineItems?: boolean;
  negateAmounts?: boolean;
  taxBuckets?: Record<"A" | "B" | "C" | "D" | "E", { taxable: number; vat: number }>;
};

export type PaymentMethod = "bank" | "mpesa" | "cheque";

export type PaymentDetails = {
  paymentMethod?: PaymentMethod;
  currency?: string;
  /** KRA eTIMS verification URL for PDF QR (when invoice is synced). */
  etimsVerificationUrl?: string;
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
  issueDate?: string | Date;
  dueDate?: string | Date;
  originalInvoiceNumber?: string;
  numberLabel?: string;
  showDueDate?: boolean;
  originalCuInvoiceNo?: string;
  buyerPin?: string;
};

