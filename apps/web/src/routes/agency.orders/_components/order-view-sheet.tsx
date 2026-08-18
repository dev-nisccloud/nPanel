"use client";

import * as React from "react";
import {
    Receipt,
    Building2,
    Calendar,
    CreditCard,
    CheckCircle2,
    XCircle,
    Clock,
    AlertCircle,
    XIcon,
    Package,
    ShieldCheck,
    Info
} from "lucide-react";
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/npanel-ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/utils/trpc";
import { captureEvent } from "@/lib/posthog";

const ORDER_TYPE_NAMES: Record<string, string> = {
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

interface OrderViewSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    orderId: string | null;
}

export function OrderViewSheet({ open, onOpenChange, orderId }: OrderViewSheetProps) {
    const { data: order, isLoading, error } = trpc.orders.getById.useQuery(
        { id: orderId! },
        { enabled: open && !!orderId }
    );

    React.useEffect(() => {
        if (open && orderId) {
            captureEvent("order_viewed", { order_id: orderId });
        }
    }, [open, orderId]);

    const getStatusBadge = (status: string) => {
        const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
            PENDING: "secondary",
            PROCESSING: "default",
            COMPLETED: "default",
            FAILED: "destructive",
            CANCELLED: "outline",
            REFUNDED: "outline",
            PARTIAL: "secondary",
        };

        const icons: Record<string, React.ElementType> = {
            PENDING: Clock,
            PROCESSING: AlertCircle,
            COMPLETED: CheckCircle2,
            FAILED: XCircle,
            CANCELLED: XCircle,
            REFUNDED: AlertCircle,
            PARTIAL: AlertCircle,
        };

        const Icon = icons[status] || Clock;
        const variant = variants[status] || "outline";
        const isSuccess = status === "COMPLETED" || status === "PROCESSING";

        return (
            <Badge
                variant={variant}
                className={`gap-1 ${isSuccess ? "bg-green-600/10 text-green-600 border-green-600/20" : ""}`}
            >
                <Icon className="h-3 w-3" />
                {status}
            </Badge>
        );
    };

    const getItemStatusBadge = (status: string) => {
        const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
            PENDING: "outline",
            PROVISIONING: "secondary",
            PROVISIONED: "default",
            FAILED: "destructive",
            SKIPPED: "outline",
        };

        const Icon = status === "PROVISIONED" ? CheckCircle2 : status === "FAILED" ? XCircle : Clock;
        const variant = variants[status] || "outline";

        return (
            <Badge variant={variant} className="gap-1 text-[10px] h-5">
                <Icon className="h-3 w-3" />
                {status}
            </Badge>
        );
    };

    if (!open) return null;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-2xl p-0 flex flex-col">
                <SheetHeader className="p-6 border-b flex flex-row items-center justify-between space-y-0">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-primary/10 rounded-full">
                            <Receipt className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <SheetTitle className="flex items-center gap-2">
                                {isLoading ? "Loading Order..." : order?.orderNumber || "Order Details"}
                            </SheetTitle>
                            <SheetDescription>
                                {isLoading ? "Fetching order information..." : "Complete overview of the service order"}
                            </SheetDescription>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {!isLoading && order && getStatusBadge(order.status)}
                        <SheetClose asChild>
                            <Button size="icon" variant="ghost" className="h-8 w-8 p-0">
                                <XIcon className="h-5 w-5" />
                            </Button>
                        </SheetClose>
                    </div>
                </SheetHeader>

                <ScrollArea className="flex-1 min-h-0 pr-4">
                    <div className="px-6 py-6 space-y-6">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <Spinner size={32} />
                            </div>
                        ) : error || !order ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <p className="text-destructive mb-4">{error?.message || "Order not found"}</p>
                                <Button onClick={() => onOpenChange(false)} variant="outline">
                                    Close
                                </Button>
                            </div>
                        ) : (
                            <>
                                {/* Order Overview */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <Info className="h-5 w-5" />
                                            Order Overview
                                        </CardTitle>
                                        <CardDescription>Primary order and payment details</CardDescription>
                                    </CardHeader>
                                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-1">
                                            <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Service Type</span>
                                            <p className="text-sm font-medium">
                                                <Badge variant="outline">{ORDER_TYPE_NAMES[order.type] || order.type}</Badge>
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Associated Organization</span>
                                            <div className="flex items-center gap-2 pt-1">
                                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                                <p className="text-sm font-medium">{order.team?.name || "N/A"}</p>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Order Date</span>
                                            <div className="flex items-center gap-2 pt-1">
                                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                                <p className="text-sm font-medium">
                                                    {new Date(order.createdAt).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                        {order.completedAt && (
                                            <div className="space-y-1">
                                                <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Completed Date</span>
                                                <div className="flex items-center gap-2 pt-1">
                                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                                    <p className="text-sm font-medium">
                                                        {new Date(order.completedAt).toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                        <div className="space-y-1 md:col-span-2">
                                            <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Financial Breakdown</span>
                                            <div className="mt-2 p-3 bg-muted/30 rounded-lg space-y-2 border">
                                                {order.subtotal && (
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-muted-foreground">Subtotal</span>
                                                        <span>{order.currency} {parseFloat(order.subtotal).toFixed(2)}</span>
                                                    </div>
                                                )}
                                                {order.isTaxable && order.taxAmount && (
                                                    <div className="flex justify-between text-sm text-muted-foreground border-b pb-2">
                                                        <span>Tax ({order.taxPercentage}%)</span>
                                                        <span>{order.currency} {parseFloat(order.taxAmount).toFixed(2)}</span>
                                                    </div>
                                                )}
                                                <div className="flex justify-between font-bold text-base pt-1">
                                                    <div className="flex items-center gap-2">
                                                        <CreditCard className="h-4 w-4" />
                                                        <span>Total Amount</span>
                                                    </div>
                                                    <span>{order.currency} {parseFloat(order.total || "0").toFixed(2)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Order Items */}
                                {order.orderItems && order.orderItems.length > 0 && (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                <Package className="h-5 w-5" />
                                                Order Items
                                            </CardTitle>
                                            <CardDescription>Individual services and provisioning status</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-4">
                                                {order.orderItems.map((item) => (
                                                    <div key={item.id} className="p-4 border rounded-lg bg-muted/20 space-y-3">
                                                        <div className="flex items-start justify-between">
                                                            <div className="space-y-1">
                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                    <span className="font-semibold text-sm">
                                                                        {item.niscServicePlan?.name || "Service Plan"}
                                                                    </span>
                                                                    {item.status && getItemStatusBadge(item.status)}
                                                                </div>
                                                                {item.domainName && (
                                                                    <p className="text-xs text-muted-foreground">
                                                                        Target: <span className="text-primary font-medium">{item.domainName}</span>
                                                                    </p>
                                                                )}
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-xs text-muted-foreground font-semibold uppercase">Price</p>
                                                                <p className="text-sm font-bold">
                                                                    {item.itemCurrency} {parseFloat(item.itemPrice).toFixed(2)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        {item.provisioningError && (
                                                            <div className="text-xs text-destructive mt-1 p-2 bg-destructive/10 rounded flex gap-2 items-start border border-destructive/20">
                                                                <XCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                                                <span><strong>Provisioning Error:</strong> {item.provisioningError}</span>
                                                            </div>
                                                        )}
                                                        {item.hostingSubscription && (
                                                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                                                <ShieldCheck className="h-3 w-3" />
                                                                <span>Plesk: {item.hostingSubscription.pleskName || "N/A"}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                            </>
                        )}
                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}
