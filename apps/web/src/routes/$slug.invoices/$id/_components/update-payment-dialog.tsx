"use client";

import * as React from "react";
import { DollarSign } from "lucide-react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { trpc } from "@/utils/trpc";
import { toast } from "@/components/ui/sonner";
import { captureEvent } from "@/lib/posthog";

type PaymentType = "COMPLETE" | "PARTIAL";

interface UpdatePaymentDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	invoiceId: string;
	invoiceAmount: string | null;
	currency: string;
	onSuccess?: () => void;
}

export function UpdatePaymentDialog({
	open,
	onOpenChange,
	invoiceId,
	invoiceAmount,
	currency,
	onSuccess,
}: UpdatePaymentDialogProps) {
	const [type, setType] = React.useState<PaymentType>("COMPLETE");
	const [amountPaid, setAmountPaid] = React.useState("");
	const utils = trpc.useUtils();

	const updatePaymentMutation = trpc.invoicing.updatePayment.useMutation({
		onSuccess: (_data, variables) => {
			const amount =
				variables.type === "PARTIAL"
					? Number(variables.amountPaid)
					: Number(invoiceAmount ?? 0);
			captureEvent("invoice_payment_recorded", {
				payment_method: variables.type,
				amount: Number.isFinite(amount) ? amount : 0,
				currency: currency || "KES",
			});
			toast.success("Payment updated");
			onOpenChange(false);
			setType("COMPLETE");
			setAmountPaid("");
			utils.invoicing.getById.invalidate({ id: invoiceId });
			utils.invoicing.list.invalidate();
			onSuccess?.();
		},
		onError: (e) => {
			toast.error(e.message ?? "Failed to update payment");
		},
	});

	const totalAmount = invoiceAmount ?? "0";

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (type === "COMPLETE") {
			updatePaymentMutation.mutate({ invoiceId, type: "COMPLETE" });
		} else {
			const value = amountPaid.trim();
			if (!value) {
				toast.error("Amount paid is required for partial payment");
				return;
			}
			updatePaymentMutation.mutate({ invoiceId, type: "PARTIAL", amountPaid: value });
		}
	};

	const handleOpenChange = (next: boolean) => {
		if (!next) {
			setType("COMPLETE");
			setAmountPaid("");
		}
		onOpenChange(next);
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<DollarSign className="h-5 w-5" />
						Update payment
					</DialogTitle>
					<DialogDescription>
						Record a full or partial payment. This will update the invoice status and add an entry to the
						activity log.
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-2">
						<Label>Payment type</Label>
						<Select
							value={type}
							onValueChange={(v) => setType(v as PaymentType)}
						>
							<SelectTrigger className="w-full">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="COMPLETE">Complete payment</SelectItem>
								<SelectItem value="PARTIAL">Partial payment</SelectItem>
							</SelectContent>
						</Select>
						<p className="text-xs text-muted-foreground">
							{type === "COMPLETE"
								? `Marks the invoice as paid and records ${currency} ${totalAmount} as the total amount paid.`
								: "Record a partial amount received. Invoice status will be set to Partially paid."}
						</p>
					</div>
					{type === "PARTIAL" && (
						<div className="space-y-2">
							<Label htmlFor="amount-paid">Amount paid ({currency})</Label>
							<Input
								id="amount-paid"
								type="text"
								inputMode="decimal"
								placeholder="0.00"
								value={amountPaid}
								onChange={(e) => setAmountPaid(e.target.value)}
								className="w-full"
							/>
						</div>
					)}
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => handleOpenChange(false)}
						>
							Cancel
						</Button>
						<Button
							type="submit"
							disabled={
								updatePaymentMutation.isPending ||
								(type === "PARTIAL" && !amountPaid.trim())
							}
						>
							{updatePaymentMutation.isPending ? (
								<>
									<Spinner size={16} className="mr-2" />
									Updating…
								</>
							) : (
								"Update payment"
							)}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
