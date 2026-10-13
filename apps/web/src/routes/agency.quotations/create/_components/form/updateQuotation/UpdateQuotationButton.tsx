"use client";

import { Button } from "@/components/ui/button";
import { CheckCircle2, LoaderIcon, Save } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { useNavigate } from "react-router";
import { useState } from "react";
import { trpc } from "@/utils/trpc";
import { toast } from "@/components/ui/sonner";
import { useData } from "@/routes/agency.quotations/create/hooks/useData";
import { quotationLineItemMetadata, type Item } from "@/routes/agency.quotations/create/types";
import { captureEvent } from "@/lib/posthog";

const UUID_PATTERN =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string | undefined): value is string {
	return !!value && UUID_PATTERN.test(value);
}

function roundTotalIfExceeds(amount: number): number {
	const decimalPlaces = (amount.toString().split(".")[1] ?? "").length;
	if (decimalPlaces > 2) return Math.round(amount * 100) / 100;
	return amount;
}

export interface UpdateQuotationButtonProps {
	quotationId: string;
}

export function UpdateQuotationButton({ quotationId }: UpdateQuotationButtonProps) {
	const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
	const form = useFormContext();
	const navigate = useNavigate();
	const utils = trpc.useUtils();
	const { companyDetails, quotationDetails, quotationTerms, yourDetails } = useData();

	const updateMutation = trpc.quotations.update.useMutation({
		onSuccess: () => {
			setStatus("saved");
			captureEvent("quotation_edited");
			toast.success("Quotation updated successfully");
			utils.quotations.list.invalidate();
			utils.quotations.getById.invalidate({ id: quotationId });
			setTimeout(() => navigate(`/agency/quotations/${quotationId}`), 1000);
		},
		onError: (error) => {
			setStatus("idle");
			toast.error("Failed to update quotation", {
				description: error.message ?? "An error occurred.",
			});
		},
	});

	const handleSave = async () => {
		try {
			setStatus("saving");
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
				id: isUuid(item.id) ? item.id : undefined,
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

			await updateMutation.mutateAsync({
				id: quotationId,
				customerName: companyDetails.companyName ?? undefined,
				customerEmail: companyDetails.email ?? undefined,
				issueDate: quotationTerms.issueDate
					? new Date(quotationTerms.issueDate).toISOString()
					: undefined,
				amount: String(totalAmount),
				subtotal: String(subtotal),
				discount: quotationDetails.discount || undefined,
				tax: String(taxAmount),
				taxPercentage: quotationDetails.taxPercentage ?? undefined,
				currency: quotationDetails.currency ?? "KES",
				note: quotationDetails.note || undefined,
				lineItems,
				fromDetails: fromDetails as Record<string, unknown>,
				customerDetails: customerDetails as Record<string, unknown>,
				// quotationNumber is read-only in edit; pass current value so it stays unchanged
				quotationNumber: quotationTerms.quotationNumber ?? undefined,
			});
		} catch (e) {
			console.error(e);
			setStatus("idle");
		}
	};

	return (
		<div className="flex min-h-[calc(100vh-280px)] flex-col items-center justify-center text-center">
			<div className="flex max-w-md flex-col items-center">
				<h2 className="text-2xl font-semibold tracking-tight">Save your changes</h2>
				<p className="text-sm text-muted-foreground pt-2 pb-6">
					Review the details above and click below to update the quotation. The quotation number cannot be changed.
				</p>
				<Button
					disabled={status === "saving" || status === "saved"}
					onClick={handleSave}
					type="button"
				>
					{status === "idle" && (
						<>
							<Save /> Save changes
						</>
					)}
					{status === "saving" && (
						<>
							<LoaderIcon className="animate-spin" /> Saving...
						</>
					)}
					{status === "saved" && (
						<>
							<CheckCircle2 /> Updated
						</>
					)}
				</Button>
			</div>
		</div>
	);
}

