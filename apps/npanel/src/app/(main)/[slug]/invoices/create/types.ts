export type Item = {
  id?: string;
  itemDescription: string;
  amount?: number;
  qty?: number;
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
  items: Item[];
  currency?: string;
};

export type PaymentMethod = "bank" | "mpesa" | "cheque";

export type PaymentDetails = {
  paymentMethod?: PaymentMethod;
  currency?: string;
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
};

