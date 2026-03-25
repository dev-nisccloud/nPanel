"use client";

import * as React from "react";
import { Calendar, Building2, CreditCard, CheckCircle2, XCircle, Clock, AlertCircle, MoreHorizontal, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { type Order } from "./schema";

interface OrdersListProps {
	orders: Order[];
	onDelete?: (orderId: string) => void;
}

export function OrdersList({ orders, onDelete }: OrdersListProps) {
	const [openMenuId, setOpenMenuId] = React.useState<string | null>(null);

	const handleDelete = (e: React.MouseEvent, orderId: string) => {
		e.stopPropagation();
		e.preventDefault();
		setOpenMenuId(null);
		if (onDelete) {
			setTimeout(() => onDelete(orderId), 0);
		}
	};
	const getStatusBadge = (status: Order["status"]) => {
		const variants: Record<Order["status"], "default" | "secondary" | "destructive" | "outline"> = {
			PENDING: "secondary",
			PROCESSING: "default",
			COMPLETED: "default",
			FAILED: "destructive",
			CANCELLED: "outline",
			REFUNDED: "outline",
			PARTIAL: "secondary",
		};

		const icons: Record<Order["status"], typeof CheckCircle2> = {
			PENDING: Clock,
			PROCESSING: AlertCircle,
			COMPLETED: CheckCircle2,
			FAILED: XCircle,
			CANCELLED: XCircle,
			REFUNDED: AlertCircle,
			PARTIAL: AlertCircle,
		};

		const Icon = icons[status];

		return (
			<Badge variant={variants[status]} className="gap-1">
				<Icon className="h-3 w-3" />
				{status}
			</Badge>
		);
	};

	const getTypeDisplayName = (type: Order["type"]) => {
		const names: Record<Order["type"], string> = {
			DOMAIN_REGISTRATION: "Domain Registration",
			DOMAIN_RENEWAL: "Domain Renewal",
			DOMAIN_TRANSFER: "Domain Transfer",
			HOSTING_SUBSCRIPTION: "Hosting Subscription",
			HOSTING_RENEWAL: "Hosting Renewal",
			HOSTING_UPGRADE: "Hosting Upgrade",
			EMAIL_HOSTING: "Email Hosting",
			SSL_CERTIFICATE: "SSL Certificate",
			BACKUP_SERVICE: "Backup Service",
			CUSTOM_SERVICE: "Custom Service",
		};
		return names[type] || type;
	};

	return (
		<div className="space-y-2">
			{orders.map((order) => (
				<div
					key={order.id}
					className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
				>
					<div className="flex items-start justify-between">
						<div className="flex-1 space-y-3">
							{/* Header */}
							<div className="flex items-center gap-3 flex-wrap">
								<h3 className="font-semibold text-lg">{order.orderNumber}</h3>
								{getStatusBadge(order.status)}
								<Badge variant="outline">{getTypeDisplayName(order.type)}</Badge>
							</div>
						</div>
						{/* Action Menu */}
						{onDelete && (
							<div onClick={(e) => e.stopPropagation()}>
								<DropdownMenu open={openMenuId === order.id} onOpenChange={(open) => setOpenMenuId(open ? order.id : null)}>
									<DropdownMenuTrigger asChild>
										<Button
											variant="ghost"
											size="sm"
											className="h-8 w-8 p-0"
											onClick={(e) => e.stopPropagation()}
										>
											<MoreHorizontal className="h-4 w-4" />
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end" className="w-48" onClick={(e) => e.stopPropagation()}>
										<DropdownMenuItem
											onSelect={(e) => {
												e.preventDefault();
												handleDelete(e as any, order.id);
											}}
											className="text-destructive focus:text-destructive"
										>
											<Trash2 className="mr-2 h-4 w-4" />
											Delete Order
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</div>
						)}
					</div>
					<div className="flex-1 space-y-3 mt-3">
						{/* Details Grid */}
						<div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
								<div className="space-y-1">
									<div className="flex items-center gap-2 text-muted-foreground">
										<Building2 className="h-4 w-4" />
										<span>Team</span>
									</div>
									<p className="font-medium">{order.team?.name || "N/A"}</p>
								</div>

								<div className="space-y-1">
									<div className="flex items-center gap-2 text-muted-foreground">
										<Calendar className="h-4 w-4" />
										<span>Created</span>
									</div>
									<p className="font-medium">
										{new Date(order.createdAt).toLocaleDateString()}
									</p>
								</div>

								<div className="space-y-1">
									<div className="flex items-center gap-2 text-muted-foreground">
										<CreditCard className="h-4 w-4" />
										<span>Total</span>
									</div>
									<div className="space-y-1">
										{order.subtotal && (
											<p className="text-xs text-muted-foreground">
												Subtotal: {order.currency} {parseFloat(order.subtotal).toFixed(2)}
											</p>
										)}
										{order.isTaxable && order.taxAmount && order.taxPercentage !== null && (
											<p className="text-xs text-muted-foreground">
												Tax ({order.taxPercentage}%): {order.currency} {parseFloat(order.taxAmount).toFixed(2)}
											</p>
										)}
									<p className="font-medium">
										{order.total
											? `${order.currency} ${parseFloat(order.total).toFixed(2)}`
											: "N/A"}
									</p>
									</div>
								</div>

							{order.completedAt && (
								<div className="space-y-1">
									<div className="flex items-center gap-2 text-muted-foreground">
										<CheckCircle2 className="h-4 w-4" />
										<span>Completed</span>
									</div>
									<p className="font-medium">
										{new Date(order.completedAt).toLocaleDateString()}
									</p>
								</div>
							)}
						</div>

						{/* Order Items */}
						{order.orderItems && order.orderItems.length > 0 && (
							<div className="pt-2 border-t">
								<p className="text-sm text-muted-foreground mb-2 font-medium">Order Items</p>
								<div className="space-y-2">
									{order.orderItems.map((item) => {
										const getItemStatusBadge = (status: string) => {
											const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
												PENDING: "outline",
												PROVISIONING: "secondary",
												PROVISIONED: "default",
												FAILED: "destructive",
												SKIPPED: "outline",
											};

											const icons: Record<string, typeof CheckCircle2> = {
												PENDING: Clock,
												PROVISIONING: AlertCircle,
												PROVISIONED: CheckCircle2,
												FAILED: XCircle,
												SKIPPED: AlertCircle,
											};

											const Icon = icons[status] || Clock;
											const variant = variants[status] || "outline";

											return (
												<Badge variant={variant} className="gap-1">
													<Icon className="h-3 w-3" />
													{status}
												</Badge>
											);
										};

										return (
											<div key={item.id} className="p-3 bg-muted/50 rounded-lg border">
												<div className="flex items-start justify-between gap-2">
													<div className="flex-1 space-y-1">
														<div className="flex items-center gap-2 flex-wrap">
															<span className="font-medium text-sm">
																{item.niscServicePlan?.name || "Unknown Plan"}
															</span>
															{item.status && getItemStatusBadge(item.status)}
														</div>
														{item.niscServicePlan && (
															<span className="text-xs text-muted-foreground">
																Type: {item.niscServicePlan.planType}
															</span>
														)}
														{item.domainName && (
															<div className="text-xs text-muted-foreground">
																Domain: {item.domainName}
															</div>
														)}
														{item.provisioningError && (
															<div className="text-xs text-destructive mt-1 p-2 bg-destructive/10 rounded">
																<strong>Error:</strong> {item.provisioningError}
															</div>
														)}
														{item.hostingSubscription && (
															<div className="text-xs text-muted-foreground mt-1">
																Plesk: {item.hostingSubscription.pleskName || "N/A"}
															</div>
														)}
													</div>
													<div className="text-right text-sm">
														<div className="text-muted-foreground">Price</div>
														<div className="font-medium">
															{item.itemCurrency} {parseFloat(item.itemPrice).toFixed(2)}
														</div>
													</div>
												</div>
											</div>
										);
									})}
								</div>
							</div>
						)}

						{/* Legacy Hosting Subscription Info (for backward compatibility) */}
						{order.hostingSubscription && !order.orderItems && (
							<div className="pt-2 border-t">
								<p className="text-sm text-muted-foreground mb-1">Hosting Details</p>
								<div className="flex items-center gap-4 text-sm">
									{order.hostingSubscription.primaryDomain && (
										<span className="font-medium">
											Domain: {order.hostingSubscription.primaryDomain}
										</span>
									)}
									{order.hostingSubscription.pleskName && (
										<span className="text-muted-foreground">
											Plesk: {order.hostingSubscription.pleskName}
										</span>
									)}
								</div>
							</div>
						)}
					</div>
				</div>
			))}
		</div>
	);
}
