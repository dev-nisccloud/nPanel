"use client";

import * as React from "react";
import { Plus, RefreshCw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
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
import { OrdersList } from "./_components/orders-list";
import { AddOrderSheet } from "./_components/add-order-sheet";

const EmptyState = ({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) => (
	<div className="flex flex-col items-center justify-center py-12 text-center">
		<p className="text-lg font-semibold mb-2">{title}</p>
		<p className="text-muted-foreground mb-4">{description}</p>
		{action}
	</div>
);

export default function OrdersPage() {
	// ALL HOOKS MUST BE AT THE TOP LEVEL - BEFORE ANY CONDITIONAL RETURNS
	const [isAddOrderOpen, setIsAddOrderOpen] = React.useState(false);
	const [searchQuery, setSearchQuery] = React.useState("");
	const [deleteDialog, setDeleteDialog] = React.useState<{
		open: boolean;
		orderId: string | null;
		orderNumber: string;
	}>({
		open: false,
		orderId: null,
		orderNumber: "",
	});

	const { data, isLoading, error, refetch } = trpc.orders.getAll.useQuery(
		{ limit: 50 },
		{
			placeholderData: (previousData) => previousData,
		}
	);

	const utils = trpc.useUtils();

	// Filter orders based on search query - MUST be before conditional returns
	const filteredOrders = React.useMemo(() => {
		if (!data?.orders) return [];
		if (!searchQuery.trim()) return data.orders;

		const query = searchQuery.toLowerCase().trim();
		return data.orders.filter((order) => {
			return (
				order.orderNumber.toLowerCase().includes(query) ||
				order.team?.name.toLowerCase().includes(query) ||
				order.type.toLowerCase().includes(query) ||
				order.status.toLowerCase().includes(query) ||
				order.total?.toLowerCase().includes(query)
			);
		});
	}, [data?.orders, searchQuery]);

	const handleSuccess = React.useCallback(() => {
		utils.orders.getAll.invalidate();
		setIsAddOrderOpen(false);
	}, [utils]);

	const handleDelete = React.useCallback((orderId: string) => {
		const order = data?.orders.find((o) => o.id === orderId);
		if (order) {
			setDeleteDialog({
				open: true,
				orderId: orderId,
				orderNumber: order.orderNumber,
			});
		}
	}, [data?.orders]);

	const deleteOrderMutation = trpc.orders.delete.useMutation({
		onSuccess: () => {
			toast.success("Order deleted successfully");
			utils.orders.getAll.invalidate();
			setDeleteDialog({
				open: false,
				orderId: null,
				orderNumber: "",
			});
		},
		onError: (error) => {
			toast.error(error.message || "Failed to delete order");
		},
	});

	const confirmDelete = React.useCallback(() => {
		if (deleteDialog.orderId) {
			deleteOrderMutation.mutate({ orderId: deleteDialog.orderId });
		}
	}, [deleteDialog.orderId, deleteOrderMutation]);

	// NOW we can do conditional returns
	if (isLoading) {
		return (
			<div className="@container/main flex flex-col gap-4 md:gap-6">
				<div className="flex flex-col gap-2">
					<Skeleton className="h-8 w-48" />
					<Skeleton className="h-4 w-96" />
				</div>
				<div className="flex items-center justify-between gap-4">
					<Skeleton className="h-10 flex-1 max-w-sm" />
					<div className="flex items-center gap-2">
						<Skeleton className="h-10 w-10" />
						<Skeleton className="h-10 w-32" />
					</div>
				</div>
				<div className="space-y-2">
					{[...Array(3)].map((_, i) => (
						<Skeleton key={i} className="h-32 w-full" />
					))}
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="@container/main flex flex-col gap-4 md:gap-6">
				<div className="flex flex-col items-center justify-center py-12 text-center">
					<p className="text-destructive mb-4">{error.message || "Failed to load orders"}</p>
					<Button onClick={() => refetch()} variant="outline">
						Try Again
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="@container/main flex flex-col gap-4 md:gap-6">
			<div className="flex flex-col gap-2">
				<h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
				<p className="text-muted-foreground">
					Manage your orders, track their status, and handle payments.
				</p>
			</div>

			{/* Search, Refresh, and Create Button on same row */}
			<div className="flex items-center justify-between gap-4">
				<div className="relative flex-1 max-w-sm">
					<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
					<Input
						type="text"
						placeholder="Search orders by number, team, type..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="pl-9"
					/>
				</div>
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="icon"
						onClick={() => refetch()}
						disabled={isLoading}
						title="Refresh"
					>
						<RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
					</Button>
					<Button onClick={() => setIsAddOrderOpen(true)}>
						<Plus className="mr-2 h-4 w-4" />
						Create Order
					</Button>
				</div>
			</div>

			{!data || data.orders.length === 0 ? (
				<EmptyState
					title="No orders found"
					description="Get started by creating your first order for a team."
					action={
						<Button onClick={() => setIsAddOrderOpen(true)}>
							<Plus className="mr-2 h-4 w-4" />
							Create Order
						</Button>
					}
				/>
			) : filteredOrders.length === 0 ? (
				<div className="flex flex-col items-center justify-center py-12 text-center">
					<p className="text-lg font-semibold mb-2">No orders found</p>
					<p className="text-muted-foreground mb-4">
						No orders match your search query "{searchQuery}".
					</p>
					<Button
						variant="outline"
						onClick={() => setSearchQuery("")}
					>
						Clear Search
					</Button>
				</div>
			) : (
				<OrdersList orders={filteredOrders.map(order => ({
					...order,
					metadata: order.metadata ?? null,
					processedAt: order.processedAt ? (typeof order.processedAt === 'string' ? new Date(order.processedAt) : order.processedAt) : null,
					completedAt: order.completedAt ? (typeof order.completedAt === 'string' ? new Date(order.completedAt) : order.completedAt) : null,
					createdAt: typeof order.createdAt === 'string' ? new Date(order.createdAt) : order.createdAt,
					updatedAt: typeof order.updatedAt === 'string' ? new Date(order.updatedAt) : order.updatedAt,
					orderItems: order.orderItems?.map(item => ({
						...item,
						metadata: item.metadata ?? null,
						createdAt: typeof item.createdAt === 'string' ? new Date(item.createdAt) : item.createdAt,
						updatedAt: typeof item.updatedAt === 'string' ? new Date(item.updatedAt) : item.updatedAt,
					})),
				}))} onDelete={handleDelete} />
			)}

			<AddOrderSheet
				open={isAddOrderOpen}
				onOpenChange={setIsAddOrderOpen}
				onSuccess={handleSuccess}
			/>

			{/* Delete Confirmation Dialog */}
			<AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete Order</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete order <strong>{deleteDialog.orderNumber}</strong>? This action cannot be undone.
							{data?.orders.find((o) => o.id === deleteDialog.orderId)?.status === "COMPLETED" && (
								<span className="block mt-2 text-destructive">
									Warning: This order is completed. If it has an active hosting subscription, you must terminate it first.
								</span>
							)}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={confirmDelete}
							disabled={deleteOrderMutation.isPending}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							{deleteOrderMutation.isPending ? "Deleting..." : "Delete"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
