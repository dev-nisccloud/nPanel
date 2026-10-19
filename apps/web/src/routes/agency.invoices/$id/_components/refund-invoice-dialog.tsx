"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

const KRA_REFUND_REASON_CODES = [
	{ value: "01", label: "01 - Refund" },
	{ value: "02", label: "02 - Return" },
	{ value: "03", label: "03 - Price adjustment" },
	{ value: "04", label: "04 - Error correction" },
	{ value: "05", label: "05 - Discount" },
	{ value: "06", label: "06 - Other" },
] as const;

const refundFormSchema = z.object({
	reason: z.string().min(1, "Refund reason is required"),
	note: z.string().optional(),
	rfdRsnCd: z.enum(["01", "02", "03", "04", "05", "06"]).optional(),
});

type RefundFormValues = z.infer<typeof refundFormSchema>;

interface RefundInvoiceDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	invoiceId: string;
	invoiceNumber: string | null | undefined;
	invoiceAmount: string | null | undefined;
	currency: string | null | undefined;
	customerName: string | null | undefined;
	/** Whether the invoice was synced to KRA eTIMS */
	wasKraSynced: boolean;
	onSuccess?: () => void;
}

export function RefundInvoiceDialog({
	open,
	onOpenChange,
	invoiceId,
	invoiceNumber,
	invoiceAmount,
	currency,
	customerName,
	wasKraSynced,
	onSuccess,
}: RefundInvoiceDialogProps) {
	const utils = trpc.useUtils();

	const form = useForm<RefundFormValues>({
		resolver: zodResolver(refundFormSchema),
		defaultValues: {
			reason: "",
			note: "",
			rfdRsnCd: wasKraSynced ? "01" : undefined,
		},
	});

	const refundMutation = trpc.invoicing.refundInvoice.useMutation({
		onSuccess: () => {
			captureEvent("invoice_refunded", {
				invoiceId,
				wasKraSynced,
			});
			toast.success("Invoice refunded", {
				description: wasKraSynced
					? "Invoice marked as refunded and KRA credit note created."
					: "Invoice marked as refunded.",
			});
			utils.invoicing.getById.invalidate({ id: invoiceId });
			utils.invoicing.list.invalidate();
			onOpenChange(false);
			form.reset();
			onSuccess?.();
		},
		onError: (error) => {
			toast.error("Failed to refund invoice", {
				description: error.message || "An error occurred while refunding the invoice.",
			});
		},
	});

	const handleSubmit = (values: RefundFormValues) => {
		refundMutation.mutate({
			invoiceId,
			reason: values.reason,
			note: values.note || null,
			rfdRsnCd: wasKraSynced ? values.rfdRsnCd : undefined,
		});
	};

	React.useEffect(() => {
		if (open) {
			form.reset({
				reason: "",
				note: "",
				rfdRsnCd: wasKraSynced ? "01" : undefined,
			});
		}
	}, [open, wasKraSynced, form]);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>Refund Invoice</DialogTitle>
					<DialogDescription>
						{wasKraSynced ? (
							<>
								This invoice was synced to KRA eTIMS. Refunding will mark the invoice as
								<strong> REFUNDED</strong> and create a credit note that will be submitted to KRA.
							</>
						) : (
							<>
								This will mark invoice <strong>{invoiceNumber || "this invoice"}</strong> as{" "}
								<strong>REFUNDED</strong>.
							</>
						)}
					</DialogDescription>
				</DialogHeader>

				<Form {...form}>
					<form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
						<div className="space-y-4">
							<div className="grid grid-cols-2 gap-2 text-sm">
								<div className="text-muted-foreground">Invoice</div>
								<div className="font-medium">{invoiceNumber || "—"}</div>
								<div className="text-muted-foreground">Customer</div>
								<div className="font-medium">{customerName || "—"}</div>
								<div className="text-muted-foreground">Amount</div>
								<div className="font-medium">
									{currency} {invoiceAmount || "0.00"}
								</div>
								<div className="text-muted-foreground">KRA Status</div>
								<div className="font-medium">{wasKraSynced ? "Synced" : "Not synced"}</div>
							</div>

							<FormField
								control={form.control}
								name="reason"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Refund Reason *</FormLabel>
										<FormControl>
											<Input
												{...field}
												placeholder="e.g., Customer request, Duplicate payment, Service not delivered"
											/>
										</FormControl>
										<FormDescription>
											Brief explanation for why this invoice is being refunded
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>

							{wasKraSynced && (
								<FormField
									control={form.control}
									name="rfdRsnCd"
									render={({ field }) => (
										<FormItem>
											<FormLabel>KRA Refund Reason Code *</FormLabel>
											<Select
												onValueChange={field.onChange}
												value={field.value}
											>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder="Select KRA reason code" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{KRA_REFUND_REASON_CODES.map((code) => (
														<SelectItem key={code.value} value={code.value}>
															{code.label}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
											<FormDescription>
												Official KRA eTIMS refund reason code for the credit note
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>
							)}

							<FormField
								control={form.control}
								name="note"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Additional Notes (Optional)</FormLabel>
										<FormControl>
											<Textarea
												{...field}
												placeholder="Any additional details about this refund..."
												rows={3}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={() => onOpenChange(false)}
								disabled={refundMutation.isPending}
							>
								Cancel
							</Button>
							<Button type="submit" disabled={refundMutation.isPending} variant="destructive">
								{refundMutation.isPending ? (
									<>
										<Spinner className="mr-2 h-4 w-4" />
										Refunding...
									</>
								) : (
									"Refund Invoice"
								)}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
