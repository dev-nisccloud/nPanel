import type { TeamBillingSettings } from "../schemas/team-billing";
import { isTeamBillingComplete } from "../schemas/team-billing";
import type { NiscOrderForInvoice } from "../schemas/nisc-order-invoice";
export { isTeamBillingComplete };
export declare function createInvoiceForNiscOrder(
	_prisma: unknown,
	order: NiscOrderForInvoice,
	billing: TeamBillingSettings,
	createdBy: string,
	options?: { paymentGateway?: string | null },
): Promise<{
	invoiceId: string;
	invoiceNumber: string;
} | null>;
