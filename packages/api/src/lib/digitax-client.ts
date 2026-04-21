import { request } from 'undici';
import { env } from '@npanel/env/server';

export interface DigiTaxError {
  message: string;
  code: string;
  metadata?: Record<string, string>;
}

export interface DigiTaxBranch {
  id: string;
  tax_pin: string;
  branch_office_id: string;
  branch_office_name: string;
  branch_status_code: string;
  county_name: string;
  sub_county_name: string;
  tax_locality_name: string;
  location_description: string;
  manager_name: string;
  manager_contact: number;
  manager_email: string;
  is_head_office?: boolean;
  business_id: string;
}

export interface DigiTaxItem {
  id: string;
  item_class_code: string;
  item_type_code: string;
  item_name: string;
  origin_nation_code: string;
  package_unit_code: string;
  quantity_unit_code: string;
  tax_type_code: string;
  default_unit_price: number;
  etims_item_code: string;
  is_stock_item: boolean;
  stock_quantity: number;
  active: boolean;
  status?: "PENDING" | "FAILED" | "COMPLETE";
  item_bar_code?: string;
  levies?: string[];
}

export interface DigiTaxCustomer {
  id: string;
  customer_name: string;
  email?: string;
  phone?: string;
  customer_tin: string;
  taxpayer_type: "INDIVIDUAL" | "BUSINESS";
}

export interface DigiTaxPurchaseItem {
  id: string;
  quantity: number;
  price: number;
  supply_amount: number;
  discount_rate: number;
  discount_amount: number;
  item_id: string;
}

export interface DigiTaxPurchase {
  id: string;
  registration_type_code: string;
  invoice_number: number;
  purchase_type_code: string;
  receipt_type_code: string;
  payment_type_code: string;
  purchase_status_code: string;
  purchase_date: string;
  trader_invoice_number: string;
  supplier_branch_id: string;
  supplier_name: string;
  supplier_invoice_number: number;
  item_list: DigiTaxPurchaseItem[];
}

export interface DigiTaxSaleItem {
  id: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  taxable_amount: number;
  tax_amount: number;
  tax_rate: number;
  tax_type_code: string;
  discount_rate: number;
  discount_amount: number;
  etims_item_code: string;
  is_stockable: boolean;
  item_id: string;
  item_name?: string;
  item_class_code?: string;
  item_bar_code?: string;
  item_tax_type_code?: string;
  package_unit_quantity?: number;
  item_description?: string;
}

export interface DigiTaxSale {
  id: string;
  date: string;
  time: string;
  trader_invoice_number: string;
  receipt_type_code: string;
  sale_detail_url: string;
  serial_number: string;
  receipt_number: number;
  invoice_number: number;
  customer_id: string;
  customer_name: string;
  customer_tin: string;
  customer_phone_number?: string;
  customer_email?: string;
  internal_data: string;
  receipt_signature: string;
  etims_url: string;
  original_sale_id?: string;
  offline_url?: string;
  status: "PENDING" | "FAILED" | "COMPLETED";
  sales_tax_summary: {
    taxable_amount_a: number;
    taxable_amount_b: number;
    taxable_amount_c: number;
    taxable_amount_d: number;
    taxable_amount_e: number;
    tax_rate_a: number;
    tax_rate_b: number;
    tax_rate_c: number;
    tax_rate_d: number;
    tax_rate_e: number;
    tax_amount_a: number;
    tax_amount_b: number;
    tax_amount_c: number;
    tax_amount_d: number;
    tax_amount_e: number;
    catering_levy_rate?: number;
    service_charge_rate?: number;
    catering_levy_amount?: number;
    service_charge_amount?: number;
  };
  item_list: DigiTaxSaleItem[];
}

export interface DigiTaxNotice {
  id: string;
  notice_number: string;
  notice_date: string;
  title: string;
  detail: string;
  by: string;
  link: string;
}

export interface DigiTaxVerificationDetail {
  invoice_timestamp: string;
  number_of_items: number;
  invoice_number: string;
  verification_date: string;
}

export interface DigiTaxInvoiceVerification {
  status: string;
  created_at: string;
  source: "EXTERNAL" | "INTERNAL";
  data?: DigiTaxVerificationDetail;
}

export interface DigiTaxPagination {
  next?: string;
  previous?: string;
  page_size: number;
}

export class DigiTaxClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(apiKey?: string, baseUrl?: string) {
    this.apiKey = apiKey ?? env.DIGITAX_API_KEY;
    this.baseUrl = baseUrl ?? env.DIGITAX_API_URL;
  }

  private async request<T>(
    method: "GET" | "POST" | "PUT" | "DELETE",
    endpoint: string,
    params?: Record<string, any>,
    body?: any
  ): Promise<T> {
    let url = `${this.baseUrl}${endpoint}`;
    if (params) {
      const searchParams = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      }
      const qs = searchParams.toString();
      if (qs) url += `?${qs}`;
    }

    const res = await request(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": this.apiKey,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const responseText = await res.body.text();
    let data: any;
    try {
      if (responseText) {
        data = JSON.parse(responseText);
      }
    } catch (e) {
      throw new Error(`DigiTax API Error (${endpoint}): ${res.statusCode} - Invalid JSON response: ${responseText}`);
    }

    if (res.statusCode >= 400) {
      const error = data as DigiTaxError;
      throw new Error(`DigiTax API Error (${endpoint}): ${res.statusCode} - ${error.message} (${error.code})`);
    }

    return data as T;
  }

  // Businesses
  async getETimsInfo() {
    return this.request<DigiTaxBranch>("GET", "/etims-info");
  }

  async getBranches() {
    return this.request<{ data: DigiTaxBranch[] }>("GET", "/branches");
  }

  // Items
  async getItems(options?: { before?: string; after?: string; page_size?: number }) {
    return this.request<{ pagination: DigiTaxPagination; data: DigiTaxItem[] }>("GET", "/items", options);
  }

  async createItem(item: Omit<DigiTaxItem, "id" | "etims_item_code" | "active" | "status" | "is_stock_item">) {
    return this.request<DigiTaxItem>("POST", "/items", undefined, {
      ...item,
      active: true,
      is_stock_item: item.item_type_code !== "3",
    });
  }

  async updateItem(itemId: string, item: Partial<Pick<DigiTaxItem, "item_name" | "tax_type_code" | "default_unit_price">>) {
    return this.request<DigiTaxItem>("PUT", `/items/${itemId}`, undefined, item);
  }

  async getItem(itemId: string) {
    return this.request<DigiTaxItem>("GET", `/items/${itemId}`);
  }

  // Customers
  async getCustomers(options?: { before?: string; after?: string; page_size?: number }) {
    return this.request<{ pagination: DigiTaxPagination; data: DigiTaxCustomer[] }>("GET", "/customers", options);
  }

  async saveCustomer(customer: Omit<DigiTaxCustomer, "id" | "taxpayer_type">) {
    return this.request<DigiTaxCustomer>("POST", "/customers", undefined, customer);
  }

  async getCustomer(customerId: string) {
    return this.request<DigiTaxCustomer>("GET", `/customers/${customerId}`);
  }

  async updateCustomer(customerId: string, customer: Omit<DigiTaxCustomer, "id" | "customer_tin" | "taxpayer_type">) {
    return this.request<DigiTaxCustomer>("PUT", `/customers/${customerId}`, undefined, customer);
  }

  // Purchases
  async getPurchases(options?: { before?: string; after?: string; page_size?: number }) {
    return this.request<{ pagination: DigiTaxPagination; meta: { last_updated: string }; data: DigiTaxPurchase[] }>(
      "GET",
      "/purchases",
      options
    );
  }

  async linkItems(purchaseId: string, items: { purchase_item_id: string; item_id: string }[]) {
    return this.request<DigiTaxPurchase>("POST", `/purchases/${purchaseId}/link-items`, undefined, { items });
  }

  // Sales
  async addSale(sale: any) {
    return this.request<DigiTaxSale>("POST", "/sales", undefined, sale);
  }

  async getSales(options?: { start_date?: string; end_date?: string; before?: string; after?: string; page_size?: number }) {
    return this.request<{ pagination: DigiTaxPagination; data: DigiTaxSale[] }>("GET", "/sales", options);
  }

  async getSaleById(saleId: string) {
    return this.request<DigiTaxSale>("GET", `/sales/${saleId}`);
  }

  async getOfflineUrl(businessId: string, traderInvoiceNumber: string) {
    return this.request<any>("GET", `/sale/${businessId}/${traderInvoiceNumber}`);
  }

  async addSaleWithItems(sale: any) {
    return this.request<DigiTaxSale>("POST", "/sales-with-items", undefined, sale);
  }

  async addExpressCreditNote(creditNote: {
    trader_invoice_number: string;
    return_date: string;
    sale_id: string;
    callback_url?: string;
    invoice_details?: string;
  }) {
    return this.request<DigiTaxSale>("POST", "/credit-notes/express", undefined, creditNote);
  }

  // Notices
  async getNotices() {
    return this.request<{ meta: { last_updated: string }; data: DigiTaxNotice[] }>("GET", "/notices");
  }

  // Invoice Verifications
  async verifyInvoice(verification: {
    invoice_number: string;
    amount?: number;
    supplier_pin?: string;
    reference_number?: string;
  }) {
    return this.request<DigiTaxInvoiceVerification>("POST", "/invoice-verifications", undefined, verification);
  }

  async getVerifications(options?: { before?: string; after?: string; page_size?: number }) {
    return this.request<{ pagination: DigiTaxPagination; data: DigiTaxInvoiceVerification[] }>(
      "GET",
      "/invoice-verifications",
      options
    );
  }
}
