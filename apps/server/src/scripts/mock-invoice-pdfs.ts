/**
 * Write sample invoice PDFs in the current layout. Nothing is saved to the database.
 *
 * Bill-from and the logo are the real Nisc Cloud details. Bill-to, line items, and
 * SCU fields are mock.
 *
 * Run from apps/server:
 *   bun run src/scripts/mock-invoice-pdfs.ts
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { COMPANY_LOGO_URL } from "@npanel/api/lib/company-branding";
import { generateInvoicePdfBuffer } from "@npanel/api/lib/generate-invoice-pdf";
import { NISC_INVOICE_BANK_PAYMENT_DETAILS, NISC_INVOICE_FROM_DETAILS } from "@npanel/api/lib/nisc-order-auto-invoice";
import type { InvoiceDetail } from "@npanel/api/routers/invoicing/schemas";

const TIN = NISC_INVOICE_FROM_DETAILS.taxId;
const BHF_ID = "00";

type MockLine = {
	name: string;
	description: string;
	quantity: number;
	price: number;
};

function money(lines: MockLine[], taxRate: number): { subtotal: number; tax: number; total: number } {
	const subtotal = lines.reduce((sum, line) => sum + line.quantity * line.price, 0);
	const tax = Math.round(subtotal * (taxRate / 100) * 100) / 100;
	return { subtotal, tax, total: Math.round((subtotal + tax) * 100) / 100 };
}

function mockInvoice(opts: {
	invoiceNumber: string;
	status: string;
	lines: MockLine[];
	receiptNo: string;
	signature: string;
	internalData: string;
	issuedAt: Date;
}): InvoiceDetail {
	const taxRate = 16;
	const totals = money(opts.lines, taxRate);
	const due = new Date(opts.issuedAt);
	due.setDate(due.getDate() + 14);
	const pad = (n: number) => String(n).padStart(2, "0");
	const sdcDateTime = `${opts.issuedAt.getFullYear()}${pad(opts.issuedAt.getMonth() + 1)}${pad(opts.issuedAt.getDate())}${pad(opts.issuedAt.getHours())}${pad(opts.issuedAt.getMinutes())}${pad(opts.issuedAt.getSeconds())}`;

	return {
		invoiceNumber: opts.invoiceNumber,
		status: opts.status,
		currency: "KES",
		issueDate: opts.issuedAt,
		dueDate: due,
		taxPercentage: taxRate,
		subtotal: String(totals.subtotal),
		tax: String(totals.tax),
		amount: String(totals.total),
		customerName: "Harambee Sample Traders Ltd",
		customerEmail: "accounts@example-traders.test",
		fromDetails: {
			...NISC_INVOICE_FROM_DETAILS,
			logoUrl: COMPANY_LOGO_URL,
		},
		customerDetails: {
			name: "Harambee Sample Traders Ltd",
			email: "accounts@example-traders.test",
			address: "P.O. Box 10001",
			city: "Mombasa",
			state: "80100",
			country: "Kenya",
			taxId: "P000000000A",
		},
		paymentDetails: { ...NISC_INVOICE_BANK_PAYMENT_DETAILS },
		lineItems: opts.lines.map((line, index) => ({
			id: `mock-line-${index + 1}`,
			position: index,
			name: line.name,
			description: line.description,
			quantity: line.quantity,
			price: String(line.price),
			total: String(line.quantity * line.price),
		})),
		kraStatus: "SYNCED",
		kraSignature: opts.signature,
		kraReceiptNumber: opts.receiptNo,
		kraVerifiedDate: opts.issuedAt,
		kraSyncPayload: { tin: TIN, bhfId: BHF_ID },
		kraSyncResponse: {
			tin: TIN,
			bhfId: BHF_ID,
			sdcId: "KRACU0400000001",
			rcptSign: opts.signature,
			intrlData: opts.internalData,
			curRcptNo: opts.receiptNo,
			totRcptNo: opts.receiptNo,
			sdcDateTime,
		},
	} as unknown as InvoiceDetail;
}

const shortLines: MockLine[] = [
	{
		name: "Website care plan",
		description: "Monthly maintenance — 01-10-2026 to 31-10-2026",
		quantity: 1,
		price: 15000,
	},
	{
		name: "Domain renewal",
		description: "example-traders.test — 1 year",
		quantity: 1,
		price: 2500,
	},
];

const longLines: MockLine[] = [
	["Business email", "10 mailboxes — October 2026", 10, 450],
	["Web hosting", "Cloud starter — nisc-sample.co.ke", 1, 3200],
	["SSL certificate", "Wildcard — 1 year", 1, 8500],
	["Domain registration", "nisc-sample.co.ke — 1 year", 1, 1800],
	["Domain registration", "nisc-sample.com — 1 year", 1, 2200],
	["Backup storage", "100 GB offsite — October 2026", 1, 1500],
	["SEO report", "Monthly visibility report", 1, 7500],
	["Social creative set", "8 static posts", 1, 12000],
	["Landing page", "Campaign page design and build", 1, 28000],
	["Support retainer", "8 hours — October 2026", 8, 3500],
].map(([name, description, quantity, price]) => ({
	name: String(name),
	description: String(description),
	quantity: Number(quantity),
	price: Number(price),
}));

async function main() {
	const outDir = path.resolve(process.cwd(), "tmp/mock-invoice-pdfs");
	await mkdir(outDir, { recursive: true });

	const samples = [
		{
			file: "invoice-unpaid-few-lines.pdf",
			invoice: mockInvoice({
				invoiceNumber: "INV-SAMPLE-01",
				status: "UNPAID",
				lines: shortLines,
				receiptNo: "12",
				signature: "SAMPLE0SIGN0AAA1",
				internalData: "SAMPLE-INTERNAL-DATA-0001-AAAA",
				issuedAt: new Date(2026, 8, 29, 9, 15, 0),
			}),
		},
		{
			file: "invoice-many-lines.pdf",
			invoice: mockInvoice({
				invoiceNumber: "INV-SAMPLE-02",
				status: "PAID",
				lines: longLines,
				receiptNo: "48",
				signature: "SAMPLE0SIGN0BBB2",
				internalData: "SAMPLE-INTERNAL-DATA-0002-BBBB",
				issuedAt: new Date(2026, 8, 29, 14, 40, 0),
			}),
		},
	];

	for (const sample of samples) {
		const buffer = await generateInvoicePdfBuffer(sample.invoice);
		const filePath = path.join(outDir, sample.file);
		await writeFile(filePath, buffer);
		console.log(`${sample.file}  ${filePath}`);
	}
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
