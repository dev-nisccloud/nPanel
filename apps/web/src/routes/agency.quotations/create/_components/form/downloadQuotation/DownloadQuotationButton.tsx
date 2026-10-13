"use client";

import { Button } from "@/components/ui/button";
import { CheckCircle2, LoaderIcon, Send } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { useNavigate } from "react-router";
import { useState } from "react";
import { trpc } from "@/utils/trpc";
import { toast } from "@/components/ui/sonner";
import { useData } from "@/routes/agency.quotations/create/hooks/useData";
import { quotationLineItemMetadata, type Item } from "@/routes/agency.quotations/create/types";
import { captureEvent } from "@/lib/posthog";

function roundTotalIfExceeds(amount: number): number {
	const decimalPlaces = (amount.toString().split(".")[1] ?? "").length;
	if (decimalPlaces > 2) return Math.round(amount * 100) / 100;
	return amount;
}

export const DownloadQuotationButton = () => {
	const [status, setStatus] = useState<"submitted" | "submitting" | "not-submitted">("not-submitted");
	const form = useFormContext();
	const navigate = useNavigate();
	const utils = trpc.useUtils();
	const { companyDetails, quotationDetails, quotationTerms, yourDetails } = useData();

	const linkedUserId = form.watch("linkedUserId") as string | undefined;

	const createMutation = trpc.quotations.create.useMutation({
		onSuccess: () => {
			setStatus("submitted");
			captureEvent("quotation_created", {
				line_items_count: (quotationDetails.items || []).length,
				currency: quotationDetails.currency || "KES",
			});
			utils.quotations.getNextQuotationNumber.invalidate();
			toast.success("Quotation created successfully", {
				description: "You can view and download it from the quotations list.",
			});
			setTimeout(() => navigate("/agency/quotations"), 1500);
		},
		onError: (error) => {
			setStatus("not-submitted");
			toast.error("Failed to create quotation", {
				description: error.message ?? "An error occurred.",
			});
		},
	});

	const handleSubmit = async () => {
		try {
			setStatus("submitting");
			const items = quotationDetails.items ?? [];
			const subtotal = items.reduce((sum: number, item: Item) => {
				const amount = item.amount ?? 0;
				const qty = item.qty ?? 1;
				return sum + amount * qty;
			}, 0);
			const discountValue = parseFloat(quotationDetails.discount ?? "0");
			const taxPercentage = quotationDetails.taxPercentage ?? 0;
			const taxAmount = (subtotal - discountValue) * (taxPercentage / 100);
			const totalAmount = roundTotalIfExceeds(subtotal - discountValue + taxAmount);

			const lineItems = items.map((item: Item, index: number) => ({
				position: index,
				name: item.itemDescription ?? "Service",
				description: null,
				quantity: item.qty ?? 1,
				unit: null,
				price: String(item.amount ?? 0),
				discount: null,
				total: String((item.amount ?? 0) * (item.qty ?? 1)),
				metadata: quotationLineItemMetadata(item),
			}));

			const fromDetails = {
				name: yourDetails.yourName,
				email: yourDetails.yourEmail,
				address: yourDetails.yourAddress,
				city: yourDetails.yourCity,
				state: yourDetails.yourState,
				country: yourDetails.yourCountry,
				zip: yourDetails.yourZip,
				taxId: yourDetails.yourTaxId,
			};

			const customerDetails = {
				name: companyDetails.companyName,
				email: companyDetails.email,
				address: companyDetails.companyAddress,
				city: companyDetails.companyCity,
				state: companyDetails.companyState,
				country: companyDetails.companyCountry,
				zip: companyDetails.companyZip,
				taxId: companyDetails.companyTaxId,
			};

			await createMutation.mutateAsync({
				quotationNumber: quotationTerms.quotationNumber ?? undefined,
				customerName: companyDetails.companyName ?? undefined,
				customerEmail: companyDetails.email ?? undefined,
				linkedUserId: linkedUserId || undefined,
				issueDate: quotationTerms.issueDate
					? new Date(quotationTerms.issueDate).toISOString()
					: undefined,
				amount: String(totalAmount),
				subtotal: String(subtotal),
				discount: quotationDetails.discount ?? undefined,
				tax: String(taxAmount),
				taxPercentage: quotationDetails.taxPercentage ?? undefined,
				currency: quotationDetails.currency ?? "KES",
				note: quotationDetails.note ?? undefined,
				lineItems,
				fromDetails: fromDetails as Record<string, unknown>,
				customerDetails: customerDetails as Record<string, unknown>,
				status: "DRAFT",
				// createdBy set by API from session
			});
		} catch (e) {
			console.error(e);
			setStatus("not-submitted");
		}
	};

	return (
		<div className="flex min-h-[calc(100vh-280px)] flex-col items-center justify-center text-center">
			<div className="flex max-w-md flex-col items-center">
				<h2 className="text-2xl font-semibold tracking-tight">Your quotation is ready</h2>
				<p className="text-sm text-muted-foreground pt-2 pb-6">
					Review the details carefully before submitting. The quotation will be saved and you can view or download it from the list.
				</p>
				<Button
					disabled={status === "submitting" || status === "submitted"}
					onClick={handleSubmit}
					type="button"
				>
					{status === "not-submitted" && (
						<>
							<Send /> Submit quotation
						</>
					)}
					{status === "submitting" && (
						<>
							<LoaderIcon className="animate-spin" /> Submitting...
						</>
					)}
					{status === "submitted" && (
						<>
							<CheckCircle2 /> Quotation created
						</>
					)}
				</Button>
			</div>
		</div>
	);
};

