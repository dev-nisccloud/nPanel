"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { trpc } from "@/utils/trpc";
import {
	CREDIT_NOTE_REASONS,
	creditNoteReasonLabel,
} from "@/routes/agency.kra-etims/sales/_components/issue-etims-credit-note-sheet";

const formSchema = z.object({
	rfdRsnCd: z.enum(["01", "02", "03", "04", "05", "06"]),
	reason: z.string().max(500).optional(),
	note: z.string().max(2000).optional(),
});

type FormData = z.infer<typeof formSchema>;

type IssueCreditNoteDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	invoiceId: string;
	invoiceNumber?: string | null;
	invoiceAmount?: string | null;
	currency?: string | null;
	customerName?: string | null;
	onSuccess?: (creditNoteId: string) => void;
};

function formatMoney(currency: string, amount: string | null | undefined): string {
	const n = amount != null ? Number(amount) : NaN;
	const safe = Number.isFinite(n) ? n : 0;
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency,
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(safe);
}

export function IssueCreditNoteDialog({
	open,
	onOpenChange,
	invoiceId,
	invoiceNumber,
	invoiceAmount,
	currency = "KES",
	customerName,
	onSuccess,
}: IssueCreditNoteDialogProps) {
	const utils = trpc.useUtils();
	const [confirmOpen, setConfirmOpen] = React.useState(false);
	const [pendingSubmit, setPendingSubmit] = React.useState<FormData | null>(null);

	const form = useForm<FormData>({
		resolver: zodResolver(formSchema),
		defaultValues: { rfdRsnCd: "06", reason: "", note: "" },
	});

	React.useEffect(() => {
		if (!open) {
			setConfirmOpen(false);
			setPendingSubmit(null);
			form.reset({ rfdRsnCd: "06", reason: "", note: "" });
		}
	}, [open, form]);

	const issueMutation = trpc.invoicing.issueCreditNote.useMutation({
		onSuccess: (creditNote) => {
			toast.success("Credit note issued", {
				description: `${creditNote.creditNumber} submitted to KRA eTIMS.`,
			});
			utils.invoicing.getById.invalidate({ id: invoiceId });
			utils.invoicing.listCreditNotes.invalidate();
			setConfirmOpen(false);
			setPendingSubmit(null);
			onOpenChange(false);
			form.reset();
			onSuccess?.(creditNote.id);
		},
		onError: (error) => {
			toast.error("Failed to issue credit note", { description: error.message });
		},
	});

	const submitCreditNote = (values: FormData) => {
		issueMutation.mutate({
			invoiceId,
			rfdRsnCd: values.rfdRsnCd,
			reason: values.reason?.trim() || undefined,
			note: values.note?.trim() || undefined,
		});
	};

	const onFormSubmit = (values: FormData) => {
		setPendingSubmit(values);
		setConfirmOpen(true);
	};

	const displayInvoice = invoiceNumber || invoiceId;
	const displayCurrency = currency || "KES";
	const displayAmount = formatMoney(displayCurrency, invoiceAmount);

	return (
		<>
			<AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Issue credit note to KRA?</AlertDialogTitle>
						<AlertDialogDescription asChild>
							<div className="space-y-3 text-sm text-muted-foreground">
								<p>
									You are about to issue a <strong className="text-foreground">full credit note</strong>{" "}
									against invoice{" "}
									<span className="font-mono font-semibold text-foreground">{displayInvoice}</span>
									{customerName ? (
										<>
											{" "}
											for{" "}
											<span className="font-semibold text-foreground">{customerName}</span>
										</>
									) : null}
									.
								</p>
								<p>
									Amount:{" "}
									<span className="font-semibold text-foreground">{displayAmount}</span>
									{" "}(full invoice amount)
								</p>
								{pendingSubmit ? (
									<p>
										KRA refund reason:{" "}
										<span className="font-semibold text-foreground">
											{creditNoteReasonLabel(pendingSubmit.rfdRsnCd)}
										</span>
									</p>
								) : null}
								<ul className="list-disc space-y-1 pl-5 text-xs">
									<li>Only one credit note can be issued per invoice.</li>
									<li>
										The credit note will be submitted to KRA eTIMS immediately (
										<code className="text-xs">rcptTyCd=R</code>).
									</li>
									<li>This action cannot be undone from nPanel once registered with KRA.</li>
								</ul>
							</div>
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={issueMutation.isPending}>Go back</AlertDialogCancel>
						<AlertDialogAction
							disabled={issueMutation.isPending || !pendingSubmit}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
							onClick={(e) => {
								e.preventDefault();
								if (!pendingSubmit) return;
								submitCreditNote(pendingSubmit);
							}}
						>
							{issueMutation.isPending ? (
								<>
									<Spinner className="mr-2 h-4 w-4" />
									Issuing…
								</>
							) : (
								"Confirm & issue credit note"
							)}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<Dialog open={open} onOpenChange={onOpenChange}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Issue credit note</DialogTitle>
						<DialogDescription>
							Issue a full credit note ({displayAmount}) for invoice {displayInvoice}. The
							original invoice must already be synced to KRA eTIMS.
						</DialogDescription>
					</DialogHeader>

					<Form {...form}>
						<form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-4">
							<FormField
								control={form.control}
								name="rfdRsnCd"
								render={({ field }) => (
									<FormItem>
										<FormLabel>KRA refund reason</FormLabel>
										<Select onValueChange={field.onChange} value={field.value}>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Select reason" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{CREDIT_NOTE_REASONS.map((r) => (
													<SelectItem key={r.code} value={r.code}>
														{r.code} — {r.label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="reason"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Reason (optional)</FormLabel>
										<FormControl>
											<Textarea {...field} rows={2} placeholder="Internal reason summary" />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="note"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Note on document (optional)</FormLabel>
										<FormControl>
											<Textarea {...field} rows={2} placeholder="Shown on the credit note" />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<DialogFooter>
								<Button
									type="button"
									variant="outline"
									onClick={() => onOpenChange(false)}
									disabled={issueMutation.isPending}
								>
									Cancel
								</Button>
								<Button type="submit" disabled={issueMutation.isPending}>
									Continue
								</Button>
							</DialogFooter>
						</form>
					</Form>
				</DialogContent>
			</Dialog>
		</>
	);
}
