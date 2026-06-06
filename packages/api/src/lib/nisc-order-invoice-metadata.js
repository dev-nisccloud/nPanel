import { db, eq } from "@npanel/db";
import { niscOrder } from "@npanel/db/schema/nisc-orders";
export { getNiscOrderInvoiceUiState } from "./nisc-order-invoice-ui-state";
export async function persistNiscOrderInvoiceMetadata(niscOrderId, invoiceMeta) {
    const row = await db.query.niscOrder.findFirst({
        where: eq(niscOrder.id, niscOrderId),
        columns: { metadata: true },
    });
    const existing = row?.metadata && typeof row.metadata === "object"
        ? row.metadata
        : {};
    await db
        .update(niscOrder)
        .set({
        metadata: {
            ...existing,
            invoice: {
                ...invoiceMeta,
                updatedAt: new Date().toISOString(),
            },
        },
        updatedAt: new Date(),
    })
        .where(eq(niscOrder.id, niscOrderId));
}
