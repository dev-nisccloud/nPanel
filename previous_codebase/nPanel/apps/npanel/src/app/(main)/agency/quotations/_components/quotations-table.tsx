"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { FileText, EllipsisVertical, Trash2, Loader2, Eye, Mail, Pencil } from "lucide-react";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
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
import { trpc } from "@/utils/trpc";
import { toast } from "sonner";
import { SendQuotationDialog } from "./SendQuotationDialog";

/** Quotation list row (dates may be Date server-side or string after tRPC serialization). */
export type QuotationTableRow = {
	id: string;
	quotationNumber?: string | null;
	customerName?: string | null;
	customerEmail?: string | null;
	status: string;
	amount?: string | null;
	subtotal?: string | null;
	currency: string;
	createdAt: string | Date;
	updatedAt: string | Date;
};

export const QUOTATION_STATUSES = [
	{ value: "DRAFT" as const, label: "Draft" },
	{ value: "SENT" as const, label: "Sent" },
	{ value: "ACCEPTED" as const, label: "Accepted" },
	{ value: "DECLINED" as const, label: "Declined" },
	{ value: "EXPIRED" as const, label: "Expired" },
	{ value: "CANCELLED" as const, label: "Cancelled" },
] as const;

const formatCurrency = (amount: string | number | null | undefined, currency: string) => {
	if (amount === null || amount === undefined || amount === "") return " ";
	const n = typeof amount === "number" ? amount : Number(amount);
	if (!Number.isFinite(n)) return " ";
	return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(n);
};

interface QuotationRowActionsProps {
	quotation: QuotationTableRow;
	onRefetch?: () => void;
}

function QuotationRowActions({ quotation, onRefetch }: QuotationRowActionsProps) {
	const router = useRouter();
	const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);
	const [isSendOpen, setIsSendOpen] = React.useState(false);
	const [isDeleting, setIsDeleting] = React.useState(false);
	const [statusChanging, setStatusChanging] = React.useState(false);

	const utils = trpc.useUtils();
	const updateStatusMutation = trpc.quotations.updateStatus.useMutation({
		onSuccess: (_, variables) => {
			toast.success("Status updated", {
				description: `Quotation set to ${QUOTATION_STATUSES.find((s) => s.value === variables.status)?.label ?? variables.status}.`,
			});
			utils.quotations.list.invalidate();
			onRefetch?.();
		},
		onError: (e) => toast.error("Failed to update status", { description: e.message }),
	});
	const deleteMutation = trpc.quotations.deleteQuotation.useMutation({
		onSuccess: () => {
			toast.success("Quotation deleted successfully", {
				description: `Quotation ${quotation.quotationNumber} has been deleted.`,
			});
			utils.quotations.list.invalidate();
			onRefetch?.();
			setIsDeleteOpen(false);
		},
		onError: (e) => toast.error("Failed to delete quotation", { description: e.message }),
	});

	const handleDelete = async () => {
		try {
			setIsDeleting(true);
			setIsDeleteOpen(false);
			await deleteMutation.mutateAsync({ quotationId: quotation.id });
		} catch {
			/* handled in mutation */
		} finally {
			setIsDeleting(false);
		}
	};

	const handleStatusChange = async (status: (typeof QUOTATION_STATUSES)[number]["value"]) => {
		if (status === quotation.status) return;
		try {
			setStatusChanging(true);
			await updateStatusMutation.mutateAsync({ id: quotation.id, status });
		} catch {
			/* handled in mutation */
		} finally {
			setStatusChanging(false);
		}
	};

	const busy = isDeleting || statusChanging;

	return (
		<>
			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger asChild>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="ghost" size="icon" className="h-8 w-8">
									<EllipsisVertical className="h-4 w-4" />
									<span className="sr-only">Actions</span>
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" className="w-48">
								<DropdownMenuItem onClick={() => router.push(`/agency/quotations/${quotation.id}`)} disabled={busy}>
									<Eye className="mr-2 h-4 w-4" />
									View Quotation
								</DropdownMenuItem>
								<DropdownMenuItem onClick={() => router.push(`/agency/quotations/${quotation.id}/edit`)} disabled={busy}>
									<Pencil className="mr-2 h-4 w-4" />
									Edit Quotation
								</DropdownMenuItem>
								<DropdownMenuItem onClick={() => setIsSendOpen(true)} disabled={busy}>
									<Mail className="mr-2 h-4 w-4" />
									Send to email
								</DropdownMenuItem>
								<DropdownMenuSub>
									<DropdownMenuSubTrigger disabled={busy}>Change status</DropdownMenuSubTrigger>
									<DropdownMenuSubContent>
										{QUOTATION_STATUSES.map(({ value, label }) => (
											<DropdownMenuItem
												key={value}
												onClick={() => handleStatusChange(value)}
												disabled={quotation.status === value}
											>
												{label}
											</DropdownMenuItem>
										))}
									</DropdownMenuSubContent>
								</DropdownMenuSub>
								<DropdownMenuSeparator />
								<DropdownMenuItem onClick={() => setIsDeleteOpen(true)} disabled={busy} className="text-destructive focus:text-destructive">
									<Trash2 className="mr-2 h-4 w-4" />
									Delete Quotation
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</TooltipTrigger>
					<TooltipContent>Actions</TooltipContent>
				</Tooltip>
			</TooltipProvider>

			<SendQuotationDialog
				open={isSendOpen}
				onOpenChange={setIsSendOpen}
				quotationId={quotation.id}
				defaultEmail={quotation.customerEmail}
				onSent={onRefetch}
			/>

			<AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete Quotation</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete quotation <strong>{quotation.quotationNumber ?? "this quotation"}</strong>? This action cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDelete}
							disabled={isDeleting}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							{isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Delete Quotation"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}

export interface QuotationsTableProps {
	quotations: QuotationTableRow[];
	onRefetch?: () => void;
}

export function QuotationsTable({ quotations, onRefetch }: QuotationsTableProps) {
	const router = useRouter();

	return (
		<div className="overflow-hidden rounded-lg border bg-card shadow-sm">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead className="pl-6">Quotation #</TableHead>
						<TableHead>Customer</TableHead>
						<TableHead>Amount</TableHead>
						<TableHead>Status</TableHead>
						<TableHead className="w-12 pr-6" />
					</TableRow>
				</TableHeader>
				<TableBody>
					{quotations.map((q) => (
						<TableRow key={q.id}>
							<TableCell
								className="pl-6 cursor-pointer font-medium"
								onClick={() => router.push(`/agency/quotations/${q.id}`)}
							>
								<div className="flex items-center gap-2">
									<FileText className="h-4 w-4 text-muted-foreground" />
									{q.quotationNumber ?? " "}
								</div>
							</TableCell>
							<TableCell>
								<div className="flex flex-col">
									<span>{q.customerName ?? " "}</span>
									{q.customerEmail && <span className="text-muted-foreground text-sm">{q.customerEmail}</span>}
								</div>
							</TableCell>
							<TableCell>{formatCurrency(q.subtotal ?? q.amount, q.currency)}</TableCell>
							<TableCell>
								<Badge
									variant="outline"
									className={
										q.status === "ACCEPTED"
											? "bg-green-600 text-white border-green-600 hover:bg-green-600 hover:text-white"
											: q.status === "DECLINED" || q.status === "EXPIRED"
												? "bg-destructive text-destructive-foreground border-destructive hover:bg-destructive/90 hover:text-destructive-foreground"
												: q.status === "SENT"
													? "bg-primary text-primary-foreground border-primary hover:bg-primary/90 hover:text-primary-foreground"
													: ""
									}
								>
									{q.status.replace("_", " ")}
								</Badge>
							</TableCell>
							<TableCell onClick={(e) => e.stopPropagation()} className="pr-6">
								<QuotationRowActions quotation={q} onRefetch={onRefetch} />
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}
