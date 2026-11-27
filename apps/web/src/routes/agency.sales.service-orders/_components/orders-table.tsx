"use client";

import * as React from "react";
import { useNavigate } from "react-router";
import { EllipsisVertical, Eye, FileText, Loader2, Mail, Pencil, Trash2 } from "lucide-react";
import { trpc } from "@/utils/trpc";
import { toast } from "@/components/ui/sonner";
import { Badge } from "@/components/ui/badge";
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
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ORDER_STATUSES, SERVICE_ORDER_BASE, formatMoney } from "../_lib/model";
import { SendServiceOrderDialog } from "./send-service-order-dialog";

export type ServiceOrderTableRow = {
	id: string;
	orderNumber?: string | null;
	customerName?: string | null;
	customerEmail?: string | null;
	status: string;
	amount?: string | null;
	subtotal?: string | null;
	currency: string;
};

function statusClass(status: string) {
	if (status === "ACCEPTED") return "border-green-600 bg-green-600 text-white";
	if (status === "DECLINED" || status === "EXPIRED") return "border-destructive bg-destructive text-destructive-foreground";
	if (status === "SENT") return "border-primary bg-primary text-primary-foreground";
	return "";
}

function OrderActions({ order, onRefetch }: { order: ServiceOrderTableRow; onRefetch?: () => void }) {
	const navigate = useNavigate();
	const [sendOpen, setSendOpen] = React.useState(false);
	const [deleteOpen, setDeleteOpen] = React.useState(false);
	const utils = trpc.useUtils();
	const updateStatus = trpc.salesServiceOrders.updateStatus.useMutation({
		onSuccess: () => {
			toast.success("Status updated");
			onRefetch?.();
			utils.salesServiceOrders.list.invalidate();
		},
		onError: (error) => toast.error("Could not update status", { description: error.message }),
	});
	const deleteOrder = trpc.salesServiceOrders.deleteOrder.useMutation({
		onSuccess: () => {
			toast.success("Service order deleted");
			setDeleteOpen(false);
			onRefetch?.();
			utils.salesServiceOrders.list.invalidate();
			utils.salesServiceOrders.listCustomersSummary.invalidate();
		},
		onError: (error) => toast.error("Could not delete the service order", { description: error.message }),
	});
	const busy = updateStatus.isPending || deleteOrder.isPending;

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant="ghost" size="icon" className="min-h-11 min-w-11" disabled={busy} aria-label="Order actions">
						{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <EllipsisVertical className="h-4 w-4" />}
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					<DropdownMenuItem onClick={() => navigate(`${SERVICE_ORDER_BASE}/${order.id}`)}>
						<Eye className="mr-2 h-4 w-4" />
						View
					</DropdownMenuItem>
					<DropdownMenuItem onClick={() => navigate(`${SERVICE_ORDER_BASE}/${order.id}/edit`)}>
						<Pencil className="mr-2 h-4 w-4" />
						Edit
					</DropdownMenuItem>
					<DropdownMenuItem onClick={() => setSendOpen(true)}>
						<Mail className="mr-2 h-4 w-4" />
						Send to email
					</DropdownMenuItem>
					<DropdownMenuSub>
						<DropdownMenuSubTrigger>Change status</DropdownMenuSubTrigger>
						<DropdownMenuSubContent>
							{ORDER_STATUSES.map((status) => (
								<DropdownMenuItem
									key={status.value}
									disabled={order.status === status.value}
									onClick={() => updateStatus.mutate({ id: order.id, status: status.value })}
								>
									{status.label}
								</DropdownMenuItem>
							))}
						</DropdownMenuSubContent>
					</DropdownMenuSub>
					<DropdownMenuSeparator />
					<DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteOpen(true)}>
						<Trash2 className="mr-2 h-4 w-4" />
						Delete
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
			<SendServiceOrderDialog
				open={sendOpen}
				onOpenChange={setSendOpen}
				serviceOrderId={order.id}
				defaultEmail={order.customerEmail}
				onSent={onRefetch}
			/>
			<AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete service order</AlertDialogTitle>
						<AlertDialogDescription>
							Delete {order.orderNumber || "this service order"}? This cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel className="min-h-11">Cancel</AlertDialogCancel>
						<AlertDialogAction
							className="min-h-11 bg-destructive text-destructive-foreground hover:bg-destructive/90"
							onClick={() => deleteOrder.mutate({ serviceOrderId: order.id })}
						>
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}

export function ServiceOrdersTable({
	orders,
	onRefetch,
}: {
	orders: ServiceOrderTableRow[];
	onRefetch?: () => void;
}) {
	const navigate = useNavigate();
	return (
		<div className="overflow-hidden rounded-lg border bg-card shadow-sm">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead className="pl-6">Order</TableHead>
						<TableHead>Customer</TableHead>
						<TableHead>Amount</TableHead>
						<TableHead>Status</TableHead>
						<TableHead className="w-12 pr-6" />
					</TableRow>
				</TableHeader>
				<TableBody>
					{orders.map((order) => {
						const amount = Number(order.amount ?? order.subtotal ?? "");
						return (
							<TableRow key={order.id}>
								<TableCell
									className="cursor-pointer pl-6 font-medium"
									onClick={() => navigate(`${SERVICE_ORDER_BASE}/${order.id}`)}
								>
									<div className="flex items-center gap-2">
										<FileText className="h-4 w-4 text-muted-foreground" />
										{order.orderNumber || "—"}
									</div>
								</TableCell>
								<TableCell>
									<div>{order.customerName || "—"}</div>
									{order.customerEmail ? (
										<div className="text-sm text-muted-foreground">{order.customerEmail}</div>
									) : null}
								</TableCell>
								<TableCell>{Number.isFinite(amount) ? formatMoney(amount, order.currency) : "—"}</TableCell>
								<TableCell>
									<Badge variant="outline" className={statusClass(order.status)}>
										{ORDER_STATUSES.find((status) => status.value === order.status)?.label ?? order.status}
									</Badge>
								</TableCell>
								<TableCell className="pr-6" onClick={(event) => event.stopPropagation()}>
									<OrderActions order={order} onRefetch={onRefetch} />
								</TableCell>
							</TableRow>
						);
					})}
				</TableBody>
			</Table>
		</div>
	);
}
