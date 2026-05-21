/**
 * Client-safe invoice state for Nisc order UI (no @npanel/api / DB imports).
 */

export type NiscInvoiceBillingSource = "team_billing" | "user_profile";

type NiscOrderInvoiceMetadata = {
	status: "created" | "skipped";
	source?: NiscInvoiceBillingSource;
	emailed?: boolean;
	reasonCode?: string;
	reasonMessage?: string;
};

export type NiscOrderInvoiceUiState =
	| {
			status: "linked";
			invoiceId: string;
			invoiceNumber: string | null;
			source?: NiscInvoiceBillingSource;
			emailed?: boolean;
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
		source:
			inv.source === "team_billing" || inv.source === "user_profile"
				? inv.source
				: undefined,
		emailed: typeof inv.emailed === "boolean" ? inv.emailed : undefined,
		reasonCode: typeof inv.reasonCode === "string" ? inv.reasonCode : undefined,
		reasonMessage: typeof inv.reasonMessage === "string" ? inv.reasonMessage : undefined,
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
