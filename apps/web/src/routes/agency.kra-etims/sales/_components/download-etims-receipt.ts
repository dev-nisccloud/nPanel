"use client";

import * as React from "react";
import { toast } from "@/components/ui/sonner";
import { trpc } from "@/utils/trpc";
import { registerFonts } from "@/routes/agency.invoices/_components/invoices-list";
import {
	buildCreditNoteDetailFromEtimsSale,
	buildInvoiceDetailFromEtimsSale,
	mergeEtimsSaleWithDetails,
	overlayEtimsSaleFiscalOnCreditNote,
	overlayEtimsSaleFiscalOnInvoice,
	unwrapEtimsInvoiceDetails,
} from "@npanel/api/agency-invoice-pdf/etims-sale-to-invoice-detail";
import { isCreditNote, type EtimsSaleRecord } from "./etims-sale-utils";

function triggerPdfDownload(blob: Blob, filename: string) {
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
}

export function useEtimsReceiptDownload(opts: {
	kraPin?: string | null;
	branchId?: string | null;
	isSandbox?: boolean;
	salesList: EtimsSaleRecord[];
}) {
	const utils = trpc.useUtils();
	const [downloadingInvcNo, setDownloadingInvcNo] = React.useState<number | null>(null);

	const download = React.useCallback(
		async (sale: EtimsSaleRecord) => {
			const invcNo = Number(sale.invcNo);
			if (!Number.isFinite(invcNo)) {
				toast.error("This record has no invoice number.");
				return;
			}

			try {
				setDownloadingInvcNo(invcNo);

				let saleForPdf: Record<string, unknown> = sale;
				const existingItems = Array.isArray(sale.itemList) ? sale.itemList : [];
				if (existingItems.length === 0) {
					try {
						const detailsRes = await utils.etims.sales.getInvoiceDetails.fetch({ invcNo });
						saleForPdf = mergeEtimsSaleWithDetails(
							sale,
							unwrapEtimsInvoiceDetails(detailsRes),
						);
					} catch {
						// List row is enough for a header-only receipt if KRA details fail.
					}
				}

				const ctx = {
					kraPin: opts.kraPin,
					branchId: opts.branchId,
					isSandbox: opts.isSandbox,
					originalSale:
						opts.salesList.find((row) => Number(row.invcNo) === Number(sale.orgInvcNo)) ?? null,
				};

				const kraInvoiceNumber = String(invcNo);
				const creditNote = isCreditNote(sale);

				await registerFonts();

				if (creditNote) {
					let detail = null;
					try {
						detail = await utils.invoicing.getCreditNoteByKraInvoiceNumber.fetch({
							kraInvoiceNumber,
						});
					} catch {
						detail = null;
					}
					const creditNoteDetail = detail
						? overlayEtimsSaleFiscalOnCreditNote(detail, saleForPdf, ctx)
						: buildCreditNoteDetailFromEtimsSale(saleForPdf, ctx);

					const [{ pdf }, { buildAgencyCreditNotePdfDocument }] = await Promise.all([
						import("@react-pdf/renderer"),
						import("@/lib/build-agency-credit-note-pdf-document"),
					]);
					const doc = await buildAgencyCreditNotePdfDocument(creditNoteDetail);
					const blob = await pdf(doc).toBlob();
					triggerPdfDownload(blob, `${creditNoteDetail.creditNumber || `CN-${invcNo}`}.pdf`);
					toast.success("Credit note downloaded");
					return;
				}

				let invoice = null;
				try {
					invoice = await utils.invoicing.getByKraInvoiceNumber.fetch({ kraInvoiceNumber });
				} catch {
					invoice = null;
				}
				const invoiceDetail = invoice
					? overlayEtimsSaleFiscalOnInvoice(invoice, saleForPdf, ctx)
					: buildInvoiceDetailFromEtimsSale(saleForPdf, ctx);

				const [{ pdf }, { buildAgencyInvoicePdfDocument }] = await Promise.all([
					import("@react-pdf/renderer"),
					import("@/lib/build-agency-invoice-pdf-document"),
				]);
				const doc = await buildAgencyInvoicePdfDocument(invoiceDetail);
				const blob = await pdf(doc).toBlob();
				triggerPdfDownload(blob, `${invoiceDetail.invoiceNumber || `INV-${invcNo}`}.pdf`);
				toast.success("Invoice downloaded");
			} catch (error) {
				console.error(error);
				toast.error("Failed to download PDF", {
					description: error instanceof Error ? error.message : "Unknown error",
				});
			} finally {
				setDownloadingInvcNo(null);
			}
		},
		[opts.branchId, opts.isSandbox, opts.kraPin, opts.salesList, utils],
	);

	return { download, downloadingInvcNo };
}
