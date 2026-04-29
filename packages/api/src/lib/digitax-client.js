import { request } from 'undici';
import { env } from '@npanel/env/server';
export class DigiTaxClient {
    baseUrl;
    apiKey;
    constructor(apiKey, baseUrl) {
        this.apiKey = apiKey ?? env.DIGITAX_API_KEY;
        this.baseUrl = baseUrl ?? env.DIGITAX_API_URL;
    }
    async request(method, endpoint, params, body) {
        let url = `${this.baseUrl}${endpoint}`;
        if (params) {
            const searchParams = new URLSearchParams();
            for (const [key, value] of Object.entries(params)) {
                if (value !== undefined && value !== null) {
                    searchParams.append(key, value.toString());
                }
            }
            const qs = searchParams.toString();
            if (qs)
                url += `?${qs}`;
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
        let data;
        try {
            if (responseText) {
                data = JSON.parse(responseText);
            }
        }
        catch (e) {
            throw new Error(`DigiTax API Error (${endpoint}): ${res.statusCode} - Invalid JSON response: ${responseText}`);
        }
        if (res.statusCode >= 400) {
            const error = data;
            throw new Error(`DigiTax API Error (${endpoint}): ${res.statusCode} - ${error.message} (${error.code})`);
        }
        return data;
    }
    // Businesses
    async getETimsInfo() {
        return this.request("GET", "/etims-info");
    }
    async getBranches() {
        return this.request("GET", "/branches");
    }
    // Items
    async getItems(options) {
        return this.request("GET", "/items", options);
    }
    async createItem(item) {
        return this.request("POST", "/items", undefined, {
            ...item,
            active: true,
            is_stock_item: item.item_type_code !== "3",
        });
    }
    async updateItem(itemId, item) {
        return this.request("PUT", `/items/${itemId}`, undefined, item);
    }
    async deleteItem(itemId) {
        return this.request("DELETE", `/items/${itemId}`);
    }
    async getItem(itemId) {
        return this.request("GET", `/items/${itemId}`);
    }
    // Customers
    async getCustomers(options) {
        return this.request("GET", "/customers", options);
    }
    async saveCustomer(customer) {
        return this.request("POST", "/customers", undefined, customer);
    }
    async getCustomer(customerId) {
        return this.request("GET", `/customers/${customerId}`);
    }
    async deleteCustomer(customerId) {
        return this.request("DELETE", `/customers/${customerId}`);
    }
    async updateCustomer(customerId, customer) {
        return this.request("PUT", `/customers/${customerId}`, undefined, customer);
    }
    // Purchases
    async getPurchases(options) {
        return this.request("GET", "/purchases", options);
    }
    async getPurchaseById(purchaseId) {
        return this.request("GET", `/purchases/${purchaseId}`);
    }
    async linkItems(purchaseId, items) {
        return this.request("POST", `/purchases/${purchaseId}/link-items`, undefined, { items });
    }
    // Sales
    async addSale(sale) {
        return this.request("POST", "/sales", undefined, sale);
    }
    async getSales(options) {
        return this.request("GET", "/sales", options);
    }
    async getSaleById(saleId) {
        return this.request("GET", `/sales/${saleId}`);
    }
    async getOfflineUrl(businessId, traderInvoiceNumber) {
        return this.request("GET", `/sale/${businessId}/${traderInvoiceNumber}`);
    }
    async addSaleWithItems(sale) {
        return this.request("POST", "/sales-with-items", undefined, sale);
    }
    async addExpressCreditNote(creditNote) {
        return this.request("POST", "/credit-notes/express", undefined, creditNote);
    }
    // Notices
    async getNotices() {
        return this.request("GET", "/notices");
    }
    // Invoice Verifications
    async verifyInvoice(verification) {
        return this.request("POST", "/invoice-verifications", undefined, verification);
    }
    async getVerifications(options) {
        return this.request("GET", "/invoice-verifications", options);
    }
}
