"use client";

import * as React from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Plus, Search } from "lucide-react";
import { trpc } from "@/utils/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ServiceOrdersTable } from "./agency.sales.service-orders/_components/orders-table";
import { SERVICE_ORDER_BASE } from "./agency.sales.service-orders/_lib/model";

function isValidKey(key: string) {
	return key === "unassigned" || key.startsWith("email:") || key.startsWith("name:");
}

export default function CustomerServiceOrdersPage() {
	const navigate = useNavigate();
	const { customerKey: customerKeyParam } = useParams<{ customerKey: string }>();
	const [searchTerm, setSearchTerm] = React.useState("");
	const customerGroupKey = React.useMemo(() => {
		if (!customerKeyParam) return null;
		try {
			return decodeURIComponent(customerKeyParam);
		} catch {
			return customerKeyParam;
		}
	}, [customerKeyParam]);
	const invalid = !customerGroupKey || !isValidKey(customerGroupKey);

	const customers = trpc.salesServiceOrders.listCustomersSummary.useQuery({}, { enabled: !invalid });
	const orders = trpc.salesServiceOrders.list.useQuery(
		{ customerGroupKey: customerGroupKey ?? undefined, search: searchTerm.trim() || undefined, limit: 100 },
		{ enabled: !invalid },
	);

	const customer = customers.data?.customers.find((row) => row.customerGroupKey === customerGroupKey);
	const title =
		customer?.customerName ||
		(customerGroupKey === "unassigned"
			? "Unassigned"
			: customerGroupKey?.startsWith("email:")
				? customerGroupKey.slice("email:".length)
				: customerGroupKey?.slice("name:".length));

	if (invalid) {
		return (
			<div className="px-4 py-8 md:px-6 lg:px-8">
				<p className="mb-4 text-sm text-muted-foreground">That customer link is not valid.</p>
				<Button className="min-h-11" variant="outline" onClick={() => navigate(SERVICE_ORDER_BASE)}>
					<ArrowLeft className="mr-2 h-4 w-4" />
					Back to service orders
				</Button>
			</div>
		);
	}

	return (
		<div className="@container/main flex flex-col gap-4 px-4 py-4 md:gap-6 md:px-6 md:py-6 lg:px-8">
			<div className="mx-auto w-full max-w-7xl">
				<Button className="min-h-11 px-0" variant="ghost" onClick={() => navigate(SERVICE_ORDER_BASE)}>
					<ArrowLeft className="mr-2 h-4 w-4" />
					Service orders
				</Button>
				<div className="mt-2 flex flex-col gap-1">
					<h1 className="text-base font-semibold tracking-tight">{title}</h1>
					{customer?.customerEmail ? (
						<p className="text-xs text-muted-foreground">{customer.customerEmail}</p>
					) : null}
				</div>
				<div className="mt-6 flex items-center justify-between gap-4">
					<div className="relative max-w-sm flex-1">
						<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							className="min-h-11 pl-9"
							type="search"
							placeholder="Search orders"
							value={searchTerm}
							onChange={(event) => setSearchTerm(event.target.value)}
						/>
					</div>
					<Button className="min-h-11" onClick={() => navigate(`${SERVICE_ORDER_BASE}/create`)}>
						<Plus className="mr-2 h-4 w-4" />
						Create service order
					</Button>
				</div>
				<div className="mt-6">
					{orders.isLoading ? (
						<Skeleton className="h-40 w-full" />
					) : orders.error ? (
						<p className="text-sm text-muted-foreground">{orders.error.message}</p>
					) : (orders.data?.orders.length ?? 0) === 0 ? (
						<p className="text-sm text-muted-foreground">No service orders for this customer yet.</p>
					) : (
						<ServiceOrdersTable orders={orders.data?.orders ?? []} onRefetch={() => orders.refetch()} />
					)}
				</div>
			</div>
		</div>
	);
}
