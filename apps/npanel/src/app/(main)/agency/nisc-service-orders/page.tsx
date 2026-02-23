"use client";

import * as React from "react";
import { Plus, RefreshCw, Search, Receipt, RotateCcw, EllipsisVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { trpc } from "@/utils/trpc";
import { CreateOrderSheet } from "./_components/create-order-sheet";
import { ViewOrderSheet } from "./_components/view-order-sheet";

const STATUS_VARIANTS: Record<string, string> = {
	PENDING: "secondary",
	PROCESSING: "default",
	COMPLETED: "default",
	FAILED: "destructive",
	PARTIAL: "secondary",
};

function EmptyState({
	title,
	description,
	action,
}: {
	title: string;
	description: string;
	action?: React.ReactNode;
}) {
	return (
		<div className="flex flex-col items-center justify-center py-12 text-center">
			<p className="text-lg font-semibold mb-2">{title}</p>
			<p className="text-muted-foreground mb-4">{description}</p>
			{action}
		</div>
	);
}

export default function NiscServiceOrdersPage() {
	const [isCreateOpen, setIsCreateOpen] = React.useState(false);
	const [selectedOrderId, setSelectedOrderId] = React.useState<string | null>(null);
	const [searchQuery, setSearchQuery] = React.useState("");

	const utils = trpc.useUtils();
	const { data, isLoading, error, refetch } = trpc.niscServiceOrders.getAll.useQuery(
		{ limit: 50 },
		{ placeholderData: (prev) => prev }
	);

	const retryMutation = trpc.niscServiceOrders.retry.useMutation({
		onSuccess: () => {
			toast.success("Order re-queued for processing");
			utils.niscServiceOrders.getAll.invalidate();
		},
		onError: (e) => toast.error(e.message || "Retry failed"),
	});

	const filteredOrders = React.useMemo(() => {
		if (!data?.orders) return [];
		if (!searchQuery.trim()) return data.orders;
		const q = searchQuery.toLowerCase().trim();
		return data.orders.filter(
			(o) =>
				o.orderNumber.toLowerCase().includes(q) ||
				o.user?.name?.toLowerCase().includes(q) ||
				o.team?.name?.toLowerCase().includes(q) ||
				o.status.toLowerCase().includes(q)
		);
	}, [data?.orders, searchQuery]);

	const handleSuccess = React.useCallback(() => {
		refetch();
		setIsCreateOpen(false);
	}, [refetch]);

	if (isLoading) {
		return (
			<div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
				<div className="w-full max-w-7xl mx-auto">
					<div className="flex flex-col gap-2">
						<Skeleton className="h-5 w-40" />
						<Skeleton className="h-4 w-72" />
					</div>
					<div className="mt-6 flex items-center justify-between gap-4">
						<Skeleton className="h-10 flex-1 max-w-sm" />
						<Skeleton className="h-10 w-32" />
					</div>
					<div className="mt-6 space-y-2">
						{[...Array(3)].map((_, i) => (
							<Skeleton key={i} className="h-12 w-full" />
						))}
					</div>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
				<div className="w-full max-w-7xl mx-auto flex flex-col items-center justify-center py-12 text-center">
					<p className="text-destructive mb-4">{error.message || "Failed to load orders"}</p>
					<Button onClick={() => refetch()} variant="outline">
						Try Again
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
			<div className="w-full max-w-7xl mx-auto">
				<div className="flex flex-col gap-2">
					<h1 className="text-base font-semibold tracking-tight">Nisc Service Orders</h1>
					<p className="text-xs text-muted-foreground">
						Create and manage NISC product orders. Orders are processed in the background.
					</p>
				</div>

				<div className="mt-6 flex items-center justify-between gap-4">
					<div className="relative flex-1 max-w-sm">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
						<Input
							placeholder="Search by order number, user, team, status..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="pl-9"
						/>
					</div>
					<Button variant="outline" size="icon" onClick={() => refetch()} title="Refresh">
						<RefreshCw className="h-4 w-4" />
					</Button>
					<Button onClick={() => setIsCreateOpen(true)}>
						<Plus className="mr-2 h-4 w-4" />
						Create order
					</Button>
				</div>

				<div className="mt-6">
					{!data?.orders.length ? (
						<EmptyState
							title="No orders yet"
							description="Create a NISC service order to get started."
							action={
								<Button onClick={() => setIsCreateOpen(true)}>
									<Plus className="mr-2 h-4 w-4" />
									Create order
								</Button>
							}
						/>
					) : filteredOrders.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-12 text-center">
							<p className="text-lg font-semibold mb-2">No orders match your search</p>
							<p className="text-muted-foreground mb-4">Try a different search term.</p>
							<Button variant="outline" onClick={() => setSearchQuery("")}>
								Clear search
							</Button>
						</div>
					) : (
						<div className="overflow-hidden rounded-lg border bg-card shadow-sm">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead className="pl-6">Order #</TableHead>
										<TableHead>User / Team</TableHead>
										<TableHead>Products</TableHead>
										<TableHead>Total</TableHead>
										<TableHead>Status</TableHead>
										<TableHead>Date</TableHead>
										<TableHead className="w-12 pr-6" />
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredOrders.map((order) => (
										<TableRow
											key={order.id}
											className="cursor-pointer"
											onClick={() => setSelectedOrderId(order.id)}
										>
											<TableCell className="pl-6">
												<div className="flex items-center gap-2">
													<Receipt className="h-4 w-4 text-muted-foreground" />
													<span className="font-medium">{order.orderNumber}</span>
												</div>
											</TableCell>
											<TableCell>
												{order.user?.name ?? order.team?.name ?? "—"}
											</TableCell>
											<TableCell>
												{order.orderItems
													.map((i) => `${i.productName} – ${i.planName ?? "—"}`)
													.join(", ")}
											</TableCell>
											<TableCell>
												{order.total
													? `${order.currency} ${Number(order.total).toFixed(2)}`
													: "—"}
											</TableCell>
											<TableCell>
												<Badge variant={STATUS_VARIANTS[order.status] as any ?? "secondary"}>
													{order.status}
												</Badge>
											</TableCell>
											<TableCell>
												{new Date(order.createdAt).toLocaleDateString()}
											</TableCell>
											<TableCell onClick={(e) => e.stopPropagation()} className="pr-6">
												<TooltipProvider>
													<Tooltip>
														<TooltipTrigger asChild>
															<DropdownMenu>
																<DropdownMenuTrigger asChild>
																	<Button variant="ghost" size="icon" className="h-8 w-8">
																		<span className="sr-only">Actions</span>
																		<EllipsisVertical className="h-4 w-4" />
																	</Button>
																</DropdownMenuTrigger>
																<DropdownMenuContent align="end" className="w-40">
																	<DropdownMenuItem onSelect={() => setSelectedOrderId(order.id)}>
																		View details
																	</DropdownMenuItem>
																	{(order.status === "FAILED" || order.status === "PARTIAL") && (
																		<DropdownMenuItem
																			onSelect={() => retryMutation.mutate({ niscOrderId: order.id })}
																			disabled={retryMutation.isPending}
																		>
																			<RotateCcw className="mr-2 h-4 w-4" />
																			Retry
																		</DropdownMenuItem>
																	)}
																</DropdownMenuContent>
															</DropdownMenu>
														</TooltipTrigger>
														<TooltipContent>Actions</TooltipContent>
													</Tooltip>
												</TooltipProvider>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					)}
				</div>
			</div>

			<ViewOrderSheet
				open={!!selectedOrderId}
				onOpenChange={(open) => !open && setSelectedOrderId(null)}
				orderId={selectedOrderId}
				onRetrySuccess={() => refetch()}
			/>

			<CreateOrderSheet
				open={isCreateOpen}
				onOpenChange={setIsCreateOpen}
				onSuccess={handleSuccess}
			/>
		</div>
	);
}
