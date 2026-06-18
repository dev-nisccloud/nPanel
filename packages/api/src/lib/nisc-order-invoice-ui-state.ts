/**
 * Browser-safe helpers for Nisc order invoice UI (no DB or Node imports).
 */

export type NiscInvoiceBillingSource = "team_billing" | "user_profile";

export type NiscOrderInvoiceMetadata = {
	status: "created" | "skipped";
	invoiceId?: string;
	invoiceNumber?: string;
	source?: NiscInvoiceBillingSource;
	emailed?: boolean;
	kraSynced?: boolean;
	kraStatus?: string;
	kraError?: string;
	reasonCode?: string;
	reasonMessage?: string;
	updatedAt: string;
};

export type NiscOrderInvoiceUiState =
	| {
			status: "linked";
			invoiceId: string;
			invoiceNumber: string | null;
			source?: NiscInvoiceBillingSource;
			emailed?: boolean;
			kraSynced?: boolean;
			kraError?: string;
	  }
	| {
			status: "skipped";
			reasonMessage: string;
			reasonCode?: string;
	  }
	| { status: "pending" };

function parseInvoiceMetadata(metadata: unknown): NiscOrderInvoiceMetadata | null {
	if (!metadata || typeof metadata !== "object") return null;
	const invoice = (metadata as Record<string, unknown>).invoice;
	if (!invoice || typeof invoice !== "object") return null;
	const inv = invoice as Record<string, unknown>;
	if (inv.status !== "created" && inv.status !== "skipped") return null;
	return {
		status: inv.status,
		invoiceId: typeof inv.invoiceId === "string" ? inv.invoiceId : undefined,
		invoiceNumber: typeof inv.invoiceNumber === "string" ? inv.invoiceNumber : undefined,
		source:
			inv.source === "team_billing" || inv.source === "user_profile"
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

export function getNiscOrderInvoiceUiState(order: {
	invoiceId: string | null;
	invoiceNumber: string | null;
	metadata: unknown;
}): NiscOrderInvoiceUiState {
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
