"use client";

import { Button } from "@/components/ui/button";
import { CheckCircle2, LoaderIcon, Save } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { useNavigate } from "react-router";
import { useState } from "react";
import { trpc } from "@/utils/trpc";
import { toast } from "@/components/ui/sonner";
import { useData } from "@/routes/agency.quotations/create/hooks/useData";
import type { Item } from "@/routes/agency.quotations/create/types";

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
				position: index,
				name: item.itemDescription ?? "Service",
				description: null,
				quantity: item.qty ?? 1,
				unit: null,
				price: String(item.amount ?? 0),
				discount: null,
				total: String((item.amount ?? 0) * (item.qty ?? 1)),
				metadata: null,
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
		<div className="flex h-[calc(100vh-208px)] justify-center items-center">
			<div>
				<h1 className="text-5xl font-semibold pb-6">Save your changes</h1>
				<p className="text-neutral-500 text-xl pb-7">
					Review the details above and click below to update the quotation. The quotation number cannot be changed.
				</p>
				<Button
					disabled={status === "saving" || status === "saved"}
					onClick={handleSave}
					type="button"
					className="w-full h-12 rounded-lg text-lg"
				>
					{status === "idle" && (
						<>
							<Save className="mr-2 h-6 w-6" /> Save changes
						</>
					)}
					{status === "saving" && (
						<>
							<LoaderIcon className="mr-2 h-6 w-6 animate-spin" /> Saving...
						</>
					)}
					{status === "saved" && (
						<>
							<CheckCircle2 className="mr-2 h-6 w-6" /> Updated
						</>
					)}
				</Button>
			</div>
		</div>
	);
}

