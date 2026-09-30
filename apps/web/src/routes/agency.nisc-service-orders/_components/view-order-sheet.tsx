"use client";

import * as React from "react";
import { RotateCcw, ChevronRight } from "lucide-react";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/npanel-ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { toast } from "@/components/ui/sonner";
import { trpc } from "@/utils/trpc";
import { ComboboxDropdown, type ComboboxItem } from "@npanel/ui/components/combobox-dropdown";
import { OrderInvoiceSection } from "./order-invoice-section";
import { ORDER_STATUS_VARIANTS, orderStatusBadgeClass } from "./schema";

/** Shallow type for order items in the view to avoid deep tRPC type instantiation. */
type ViewOrderItem = {
	id: string;
	product: { name: string };
	productPlan: { name: string } | null;
	itemSubtotal: string;
	itemCurrency: string | null;
	status: string;
	provisioningError: string | null;
	provisioningErrorDetails: object | null;
};

/** Shallow type for processing logs to avoid deep tRPC type instantiation. */
type ViewProcessingLog = {
	id: string;
	step: string;
	createdAt: string;
	payload: unknown;
};

interface ViewOrderSheetProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	orderId: string | null;
	onRetrySuccess?: () => void;
}

export function ViewOrderSheet({
	open,
	onOpenChange,
	orderId,
	onRetrySuccess,
}: ViewOrderSheetProps) {
	const { data: order, isLoading } = trpc.niscServiceOrders.getById.useQuery(
		{ id: orderId! },
		{ enabled: open && !!orderId }
	);

	const utils = trpc.useUtils();
	const [reassignOpen, setReassignOpen] = React.useState(false);
	const [selectedTeamId, setSelectedTeamId] = React.useState("");
	const [notifyReceipt, setNotifyReceipt] = React.useState(false);
	const [notifyReceived, setNotifyReceived] = React.useState(false);
	const [notifyInvoice, setNotifyInvoice] = React.useState(false);
	const [notifyConfirmation, setNotifyConfirmation] = React.useState(false);
	const [sendInvoiceAnyway, setSendInvoiceAnyway] = React.useState(false);
	const [toEmail, setToEmail] = React.useState("");
	const [toTouched, setToTouched] = React.useState(false);
	const [ccEmail, setCcEmail] = React.useState("");
	const [bccEmail, setBccEmail] = React.useState("");

	React.useEffect(() => {
		setReassignOpen(false);
		setSelectedTeamId("");
		setNotifyReceipt(false);
		setNotifyReceived(false);
		setNotifyInvoice(false);
		setNotifyConfirmation(false);
		setSendInvoiceAnyway(false);
		setToEmail("");
		setToTouched(false);
		setCcEmail("");
		setBccEmail("");
	}, [orderId]);

	const notificationDraft = trpc.niscServiceOrders.getNotificationDraft.useQuery(
		{ id: orderId! },
		{ enabled: open && !!orderId },
	);

	React.useEffect(() => {
		if (toTouched) return;
		if (notificationDraft.data?.to) {
			setToEmail(notificationDraft.data.to);
		}
	}, [notificationDraft.data?.to, toTouched]);

	const { data: teams = [], isLoading: loadingTeams } = trpc.teams.getAll.useQuery(undefined, {
		enabled: open && reassignOpen,
	});

	const retryMutation = trpc.niscServiceOrders.retry.useMutation({
		onSuccess: () => {
			toast.success("Order re-queued for processing");
			onRetrySuccess?.();
		},
		onError: (e: { message?: string }) => toast.error(e.message || "Retry failed"),
	});

	const reassignMutation = trpc.niscServiceOrders.reassignSubscriptions.useMutation({
		onSuccess: (result) => {
			toast.success(
				result.updated > 0
					? `Reassigned the order and ${result.updated} subscription${result.updated === 1 ? "" : "s"} to ${result.teamName}`
					: `Reassigned the order to ${result.teamName}`,
			);
			setReassignOpen(false);
			setSelectedTeamId("");
			if (orderId) {
				void utils.niscServiceOrders.getById.invalidate({ id: orderId });
			}
			onRetrySuccess?.();
			void notificationDraft.refetch();
		},
		onError: (e: { message?: string }) => toast.error(e.message || "Reassign failed"),
	});

	const resendMutation = trpc.niscServiceOrders.resendNotifications.useMutation({
		onSuccess: (result) => {
			const sent = result.results.filter((row) => row.sent);
			const failed = result.results.filter((row) => !row.sent);
			if (sent.length > 0) {
				toast.success(`Sent ${sent.length} notification${sent.length === 1 ? "" : "s"}.`);
			}
			if (failed.length > 0) {
				toast.error(failed.map((row) => row.message).join(" "));
			}
		},
		onError: (e: { message?: string }) => toast.error(e.message || "Failed to send notifications"),
	});

	const teamItems: ComboboxItem[] = React.useMemo(
		() => teams.map((team) => ({ id: team.id, label: team.name })),
		[teams],
	);
	const selectedTeamItem = teamItems.find((item) => item.id === selectedTeamId);

	const canRetry =
		order && (order.status === "FAILED" || order.status === "PARTIAL");

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent className="flex flex-col sm:max-w-lg overflow-y-auto">
				<SheetHeader>
					<SheetTitle>Nisc Order</SheetTitle>
					<SheetDescription>
						Order details and provisioning status
					</SheetDescription>
				</SheetHeader>

				{!orderId ? (
					<p className="text-muted-foreground text-sm">No order selected.</p>
				) : isLoading ? (
					<div className="space-y-4 pt-4">
						<Skeleton className="h-6 w-48" />
						<Skeleton className="h-4 w-full" />
						<Skeleton className="h-20 w-full" />
					</div>
				) : !order ? (
					<p className="text-muted-foreground text-sm w-full">Order not found.</p>
				) : (
					<div className="space-y-6 pt-4 w-full">
						<div className="w-full">
							<p className="text-sm font-medium text-muted-foreground">Order number</p>
							<p className="font-mono">{order.orderNumber}</p>
						</div>
						<div className="w-full space-y-2">
							<div className="flex items-center justify-between gap-2">
								<p className="text-sm font-medium text-muted-foreground">User / Organization</p>
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={() => setReassignOpen((open) => !open)}
								>
									Reassign
								</Button>
							</div>
							<p>{order.user?.name ?? "—"}</p>
							<p className="text-sm text-muted-foreground">
								{order.team?.name ?? "No organization"}
							</p>
							{reassignOpen ? (
								<div className="space-y-2 rounded-md border p-3">
									<p className="text-xs text-muted-foreground">
										Moves this order&apos;s user and organization, its invoice and payment, and every subscription it created.
									</p>
									{loadingTeams ? (
										<Skeleton className="h-10 w-full" />
									) : (
										<ComboboxDropdown
											placeholder="Select an organization…"
											searchPlaceholder="Search organizations"
											items={teamItems}
											selectedItem={selectedTeamItem}
											onSelect={(item) => setSelectedTeamId(item.id)}
											emptyResults="No organizations found"
										/>
									)}
									<Button
										type="button"
										size="sm"
										disabled={
											!selectedTeamId ||
											selectedTeamId === order.team?.id ||
											reassignMutation.isPending
										}
										onClick={() =>
											reassignMutation.mutate({
												niscOrderId: order.id,
												teamId: selectedTeamId,
											})
										}
									>
										{reassignMutation.isPending ? "Reassigning…" : "Assign subscriptions"}
									</Button>
								</div>
							) : null}
						</div>
						<div className="w-full">
							<p className="text-sm font-medium text-muted-foreground">Status</p>
							<Badge
								variant={ORDER_STATUS_VARIANTS[order.status] ?? "secondary"}
								className={orderStatusBadgeClass(order.status)}
							>
								{order.status}
							</Badge>
						</div>
						{order.failureReason && (
							<div className="w-full">
								<p className="text-sm font-medium text-muted-foreground">Failure reason</p>
								<p className="text-sm text-destructive">{order.failureReason}</p>
							</div>
						)}
						<div className="w-full">
							<p className="text-sm font-medium text-muted-foreground mb-2">Items</p>
							<ul className="space-y-2 w-full">
								{(order.orderItems as unknown as ViewOrderItem[]).map((item) => (
									<li
										key={item.id}
										className="flex flex-col rounded border p-3 text-sm"
									>
										<span className="font-medium">
											{item.product.name} – {item.productPlan?.name ?? ""}
										</span>
										<span className="text-muted-foreground">
											{item.itemSubtotal} {item.itemCurrency}  · {item.status}
										</span>
										{item.provisioningError && (
											<span className="text-destructive text-xs mt-1 block">
												{item.provisioningError}
											</span>
										)}
										{item.provisioningErrorDetails != null ? (
											<details className="mt-2">
												<summary className="text-muted-foreground text-xs cursor-pointer hover:text-foreground">
													Provider error details (raw response)
												</summary>
												<pre className="mt-1 p-2 rounded bg-muted/50 overflow-x-auto whitespace-pre-wrap break-words font-mono text-[11px]">
													{JSON.stringify(
														item.provisioningErrorDetails,
														null,
														2
													)}
												</pre>
											</details>
										) : null}
									</li>
								))}
							</ul>
						</div>
						<div className="w-full">
							<p className="text-sm font-medium text-muted-foreground">Total</p>
							<p className="font-medium">
								{order.total} {order.currency}
							</p>
						</div>
						<OrderInvoiceSection
							invoiceId={order.invoiceId ?? null}
							invoiceNumber={order.invoiceNumber ?? null}
							metadata={order.metadata}
						/>
						{order.processingLogs && order.processingLogs.length > 0 && (
							<div className="w-full">
								<Collapsible defaultOpen={false} className="group">
									<CollapsibleTrigger asChild>
										<Button
											type="button"
											variant="ghost"
											className="flex items-center gap-2 p-0 h-auto font-medium text-muted-foreground hover:text-foreground"
										>
											<ChevronRight className="h-4 w-4 shrink-0 transition-transform group-data-[state=open]:rotate-90" />
											Processing log ({order.processingLogs.length} entries)
										</Button>
									</CollapsibleTrigger>
									<CollapsibleContent>
										<ul className="mt-2 space-y-2 border rounded-md divide-y bg-muted/30 max-h-64 overflow-y-auto">
											{(order.processingLogs as unknown as ViewProcessingLog[]).map((log) => (
												<li key={log.id} className="p-2 text-xs">
													<div className="flex items-center gap-2 flex-wrap">
														<span className="font-mono font-medium text-foreground">
															{log.step}
														</span>
														<span className="text-muted-foreground">
															{new Date(log.createdAt).toISOString()}
														</span>
													</div>
													<pre className="mt-1 p-2 rounded bg-muted/50 overflow-x-auto whitespace-pre-wrap break-words font-mono text-[11px]">
														{JSON.stringify(log.payload, null, 2)}
													</pre>
												</li>
											))}
										</ul>
										<p className="text-muted-foreground text-xs mt-1">
											Use this to trace provisioning steps and debug failures.
										</p>
									</CollapsibleContent>
								</Collapsible>
							</div>
						)}
						{canRetry && (
							<Button
								variant="outline"
								onClick={() => retryMutation.mutate({ niscOrderId: order.id })}
								disabled={retryMutation.isPending}
							>
								<RotateCcw className="mr-2 h-4 w-4" />
								{retryMutation.isPending ? "Re-queuing..." : "Retry order"}
							</Button>
						)}
						<div className="w-full space-y-3 border-t pt-4">
							<div>
								<p className="text-sm font-medium text-foreground">Resend notification emails</p>
								<p className="text-xs text-muted-foreground mt-1">
									Selected emails are sent together, in this order: payment receipt, order received, invoice, then order confirmation.
								</p>
							</div>
							<div className="space-y-2">
								<label className="flex items-center gap-2 text-sm">
									<Checkbox
										checked={notifyReceipt}
										onCheckedChange={(checked) => setNotifyReceipt(checked === true)}
									/>
									Payment receipt
								</label>
								<label className="flex items-center gap-2 text-sm">
									<Checkbox
										checked={notifyReceived}
										onCheckedChange={(checked) => setNotifyReceived(checked === true)}
									/>
									Order received
								</label>
								<label className="flex items-center gap-2 text-sm">
									<Checkbox
										checked={notifyInvoice}
										onCheckedChange={(checked) => setNotifyInvoice(checked === true)}
									/>
									Invoice
								</label>
								{notifyInvoice && notificationDraft.data?.kraBlocksSend ? (
									<div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200 space-y-2">
										<p>
											This invoice is not synced with KRA
											{notificationDraft.data.kraStatus
												? ` (${notificationDraft.data.kraStatus})`
												: ""}
											. It is held back until KRA sync succeeds. Choose send anyway to email the current invoice without that sync.
										</p>
										<label className="flex items-center gap-2 text-sm">
											<Checkbox
												checked={sendInvoiceAnyway}
												onCheckedChange={(checked) => setSendInvoiceAnyway(checked === true)}
											/>
											Send anyway
										</label>
									</div>
								) : null}
								{notifyInvoice && notificationDraft.data && !notificationDraft.data.invoiceNumber ? (
									<p className="text-xs text-muted-foreground">This order has no invoice yet.</p>
								) : null}
								<label className="flex items-center gap-2 text-sm">
									<Checkbox
										checked={notifyConfirmation}
										onCheckedChange={(checked) => setNotifyConfirmation(checked === true)}
									/>
									Order confirmation
								</label>
							</div>
							{(notifyReceipt || notifyReceived || notifyInvoice || notifyConfirmation) ? (
								<div className="space-y-3">
									<div className="space-y-1.5">
										<Label htmlFor="resend-to">To</Label>
										<Input
											id="resend-to"
											type="email"
											value={toEmail}
											placeholder="customer@example.com"
											onChange={(event) => {
												setToTouched(true);
												setToEmail(event.target.value);
											}}
										/>
										<p className="text-[11px] text-muted-foreground">
											Prefilled with this order&apos;s notification recipient. You can change it.
										</p>
									</div>
									<div className="space-y-1.5">
										<Label htmlFor="resend-cc">Cc</Label>
										<Input
											id="resend-cc"
											value={ccEmail}
											placeholder="Separate addresses with commas"
											onChange={(event) => setCcEmail(event.target.value)}
										/>
									</div>
									<div className="space-y-1.5">
										<Label htmlFor="resend-bcc">Bcc</Label>
										<Input
											id="resend-bcc"
											value={bccEmail}
											placeholder="Separate addresses with commas"
											onChange={(event) => setBccEmail(event.target.value)}
										/>
									</div>
									<Button
										type="button"
										disabled={!toEmail.trim() || resendMutation.isPending}
										onClick={() => {
											const kinds = [
												notifyReceipt ? "payment_receipt" : null,
												notifyReceived ? "order_received" : null,
												notifyInvoice ? "invoice" : null,
												notifyConfirmation ? "order_confirmation" : null,
											].filter((kind): kind is "payment_receipt" | "order_received" | "invoice" | "order_confirmation" => kind != null);
											resendMutation.mutate({
												niscOrderId: order.id,
												kinds,
												to: toEmail.trim(),
												cc: ccEmail,
												bcc: bccEmail,
												sendInvoiceAnyway,
											});
										}}
									>
										{resendMutation.isPending ? "Sending…" : "Send notifications"}
									</Button>
								</div>
							) : null}
						</div>
					</div>
				)}
			</SheetContent>
		</Sheet>
	);
}
