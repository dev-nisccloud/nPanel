"use client";

import * as React from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, ChevronDown, Download, Loader2, Pencil, Send, Trash2 } from "lucide-react";
import { trpc } from "@/utils/trpc";
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { FormProvider, useForm } from "react-hook-form";
import { ServiceOrderPreviewDetails } from "./agency.sales.service-orders/create/_components/form/previewDetails";
import { useData } from "./agency.sales.service-orders/create/hooks/useData";
import { orderToFormValues } from "./agency.sales.service-orders/create/mapOrder";
import type { ServiceOrderDetail } from "@npanel/api/routers/sales-service-orders/schemas";
import { SendServiceOrderDialog } from "./agency.sales.service-orders/_components/send-service-order-dialog";
import {
	ORDER_STATUSES,
	SERVICE_ORDER_BASE,
	customerGroupPath,
} from "./agency.sales.service-orders/_lib/model";
import { downloadServiceOrderPdf } from "./agency.sales.service-orders/_lib/pdf-file";

export default function ServiceOrderViewPage() {
	const navigate = useNavigate();
	const { id = "" } = useParams();
	const utils = trpc.useUtils();
	const order = trpc.salesServiceOrders.getById.useQuery({ id }, { enabled: !!id });
	const [downloading, setDownloading] = React.useState(false);
	const [sendOpen, setSendOpen] = React.useState(false);
	const [deleteOpen, setDeleteOpen] = React.useState(false);

	const updateStatus = trpc.salesServiceOrders.updateStatus.useMutation({
		onSuccess: () => {
			toast.success("Status updated");
			utils.salesServiceOrders.getById.invalidate({ id });
			utils.salesServiceOrders.list.invalidate();
		},
		onError: (error) => toast.error("Could not update status", { description: error.message }),
	});
	const deleteOrder = trpc.salesServiceOrders.deleteOrder.useMutation({
		onSuccess: () => {
			toast.success("Service order deleted");
			navigate(
				order.data
					? customerGroupPath(order.data.customerName, order.data.customerEmail)
					: SERVICE_ORDER_BASE,
			);
		},
		onError: (error) => toast.error("Could not delete the service order", { description: error.message }),
	});

	if (order.isLoading) {
		return (
			<div className="flex min-h-[40vh] items-center justify-center">
				<Spinner className="h-8 w-8" />
			</div>
		);
	}

	if (order.error || !order.data) {
		return (
			<div className="px-4 py-8 text-center md:px-6 lg:px-8">
				<h1 className="mb-2 text-lg font-semibold">Service order not found</h1>
				<p className="mb-4 text-sm text-muted-foreground">{order.error?.message}</p>
				<Button className="min-h-11" variant="outline" onClick={() => navigate(SERVICE_ORDER_BASE)}>
					<ArrowLeft className="mr-2 h-4 w-4" />
					Back to service orders
				</Button>
			</div>
		);
	}

	const current = order.data;
	const backPath = customerGroupPath(current.customerName, current.customerEmail);

	return (
		<div className="@container/main flex flex-col gap-4 px-4 py-4 md:gap-6 md:px-6 md:py-6 lg:px-8">
			<div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div className="flex items-center gap-3">
						<Button className="min-h-11" variant="ghost" onClick={() => navigate(backPath)}>
							<ArrowLeft className="mr-2 h-4 w-4" />
							Back
						</Button>
						<div>
							<h1 className="text-lg font-semibold">{current.orderNumber || "Service order"}</h1>
							<p className="text-sm text-muted-foreground">{current.customerName || "Unassigned customer"}</p>
						</div>
					</div>
					<div className="flex flex-wrap gap-2">
						<Button
							className="min-h-11"
							variant="outline"
							disabled={downloading}
							onClick={async () => {
								try {
									setDownloading(true);
									await downloadServiceOrderPdf(current);
									toast.success("Service order downloaded");
								} catch (error) {
									toast.error("Could not download the PDF", {
										description: error instanceof Error ? error.message : "Try again.",
									});
								} finally {
									setDownloading(false);
								}
							}}
						>
							{downloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
							Download
						</Button>
						<Button className="min-h-11" variant="outline" onClick={() => setSendOpen(true)}>
							<Send className="mr-2 h-4 w-4" />
							Send to email
						</Button>
						<Button className="min-h-11" variant="outline" onClick={() => navigate(`${SERVICE_ORDER_BASE}/${id}/edit`)}>
							<Pencil className="mr-2 h-4 w-4" />
							Edit
						</Button>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button className="min-h-11" variant="outline" disabled={updateStatus.isPending}>
									{ORDER_STATUSES.find((status) => status.value === current.status)?.label ?? current.status}
									<ChevronDown className="ml-2 h-4 w-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								{ORDER_STATUSES.map((status) => (
									<DropdownMenuItem
										key={status.value}
										disabled={current.status === status.value}
										onClick={() => updateStatus.mutate({ id, status: status.value })}
									>
										{status.label}
									</DropdownMenuItem>
								))}
							</DropdownMenuContent>
						</DropdownMenu>
						<Button
							className="min-h-11 text-destructive hover:text-destructive"
							variant="outline"
							onClick={() => setDeleteOpen(true)}
						>
							<Trash2 className="mr-2 h-4 w-4" />
							Delete
						</Button>
					</div>
				</div>
				<div className="flex justify-center items-start">
					<SavedOrderPreview key={`${current.id}-${String(current.updatedAt)}`} order={current} />
				</div>
			</div>
			<SendServiceOrderDialog
				open={sendOpen}
				onOpenChange={setSendOpen}
				serviceOrderId={id}
				defaultEmail={current.billingEmail || current.customerEmail}
				onSent={() => utils.salesServiceOrders.getById.invalidate({ id })}
			/>
			<AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete service order</AlertDialogTitle>
						<AlertDialogDescription>
							Delete {current.orderNumber || "this service order"}? This cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel className="min-h-11">Cancel</AlertDialogCancel>
						<AlertDialogAction
							className="min-h-11 bg-destructive text-destructive-foreground hover:bg-destructive/90"
							onClick={() => deleteOrder.mutate({ serviceOrderId: id })}
						>
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}

function SavedOrderPreview({ order }: { order: ServiceOrderDetail }) {
	const form = useForm({ defaultValues: orderToFormValues(order) });
	return (
		<FormProvider {...form}>
			<SavedOrderPaper />
		</FormProvider>
	);
}

function SavedOrderPaper() {
	const data = useData();
	return <ServiceOrderPreviewDetails {...data} />;
}
