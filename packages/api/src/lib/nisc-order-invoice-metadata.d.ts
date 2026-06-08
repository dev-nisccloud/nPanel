import type { NiscOrderInvoiceMetadata } from "./nisc-order-invoice-ui-state";
export type { NiscOrderInvoiceMetadata, NiscOrderInvoiceUiState } from "./nisc-order-invoice-ui-state";
export { getNiscOrderInvoiceUiState } from "./nisc-order-invoice-ui-state";
export declare function persistNiscOrderInvoiceMetadata(niscOrderId: string, invoiceMeta: Omit<NiscOrderInvoiceMetadata, "updatedAt">): Promise<void>;
