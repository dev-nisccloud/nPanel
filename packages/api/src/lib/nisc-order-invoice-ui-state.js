/**
 * Browser-safe helpers for Nisc order invoice UI (no DB or Node imports).
 */
function parseInvoiceMetadata(metadata) {
    if (!metadata || typeof metadata !== "object")
        return null;
    const invoice = metadata.invoice;
    if (!invoice || typeof invoice !== "object")
        return null;
    const inv = invoice;
    if (inv.status !== "created" && inv.status !== "skipped")
        return null;
    return {
        status: inv.status,
        invoiceId: typeof inv.invoiceId === "string" ? inv.invoiceId : undefined,
        invoiceNumber: typeof inv.invoiceNumber === "string" ? inv.invoiceNumber : undefined,
        source: inv.source === "team_billing" || inv.source === "user_profile"
            ? inv.source
            : undefined,
        emailed: typeof inv.emailed === "boolean" ? inv.emailed : undefined,
        kraSynced: typeof inv.kraSynced === "boolean" ? inv.kraSynced : undefined,
        kraStatus: typeof inv.kraStatus === "string" ? inv.kraStatus : undefined,
        kraError: typeof inv.kraError === "string" ? inv.kraError : undefined,
        reasonCode: typeof inv.reasonCode === "string" ? inv.reasonCode : undefined,
        reasonMessage: typeof inv.reasonMessage === "string" ? inv.reasonMessage : undefined,
        updatedAt: typeof inv.updatedAt === "string" ? inv.updatedAt : new Date().toISOString(),
    };
}
export function getNiscOrderInvoiceUiState(order) {
    if (order.invoiceId) {
        const meta = parseInvoiceMetadata(order.metadata);
        return {
            status: "linked",
            invoiceId: order.invoiceId,
            invoiceNumber: order.invoiceNumber,
            source: meta?.source,
            emailed: meta?.emailed,
            kraSynced: meta?.kraSynced,
            kraError: meta?.kraError,
        };
    }
    const meta = parseInvoiceMetadata(order.metadata);
    if (meta?.status === "skipped" && meta.reasonMessage) {
        return {
            status: "skipped",
            reasonMessage: meta.reasonMessage,
            reasonCode: meta.reasonCode,
        };
    }
    return { status: "pending" };
}
