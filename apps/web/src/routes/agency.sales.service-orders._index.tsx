"use client";

import * as React from "react";
import { useNavigate } from "react-router";
import { Plus, RefreshCw, Search } from "lucide-react";
import { trpc } from "@/utils/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ServiceOrderCustomersTable } from "./agency.sales.service-orders/_components/customers-table";
import { SERVICE_ORDER_BASE } from "./agency.sales.service-orders/_lib/model";

function EmptyState({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
	return (
		<div className="flex flex-col items-center justify-center py-12 text-center">
			<p className="mb-2 text-lg font-semibold">{title}</p>
			<p className="mb-4 text-muted-foreground">{description}</p>
			{action}
		</div>
	);
}

export default function ServiceOrdersIndex() {
	const navigate = useNavigate();
	const [searchTerm, setSearchTerm] = React.useState("");
	const [debouncedSearch, setDebouncedSearch] = React.useState("");

	React.useEffect(() => {
		const handle = window.setTimeout(() => setDebouncedSearch(searchTerm.trim()), 250);
		return () => window.clearTimeout(handle);
	}, [searchTerm]);

	const { data, isLoading, isFetching, error, refetch } = trpc.salesServiceOrders.listCustomersSummary.useQuery({
		search: debouncedSearch || undefined,
	});
	const customers = data?.customers ?? [];

	if (isLoading) {
		return (
			<div className="@container/main flex flex-col gap-4 px-4 py-4 md:px-6 md:py-6 lg:px-8">
				<Skeleton className="h-5 w-40" />
				<Skeleton className="h-40 w-full" />
			</div>
		);
	}

	if (error) {
		return (
			<div className="@container/main px-4 py-6 md:px-6 lg:px-8">
				<EmptyState
					title="Unable to load service orders"
					description={error.message}
					action={
						<Button className="min-h-11" variant="outline" onClick={() => refetch()}>
							Try again
						</Button>
					}
				/>
			</div>
		);
	}

	return (
		<div className="@container/main flex flex-col gap-4 px-4 py-4 md:gap-6 md:px-6 md:py-6 lg:px-8">
			<div className="mx-auto w-full max-w-7xl">
				<div className="flex flex-col gap-1">
					<h1 className="text-base font-semibold tracking-tight">Service orders</h1>
					<p className="text-xs text-muted-foreground">
						Browse service orders by customer, then open an order to download or send it.
					</p>
				</div>
				<div className="mt-6 flex items-center justify-between gap-4">
					<div className="relative max-w-sm flex-1">
						<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							className="min-h-11 pl-9"
							type="search"
							placeholder="Search customers by name or email"
							value={searchTerm}
							onChange={(event) => setSearchTerm(event.target.value)}
						/>
					</div>
					<div className="flex items-center gap-2">
						<Button variant="outline" size="icon" className="min-h-11 min-w-11" onClick={() => refetch()} disabled={isFetching} title="Refresh">
							<RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
						</Button>
						<Button className="min-h-11" onClick={() => navigate(`${SERVICE_ORDER_BASE}/create`)}>
							<Plus className="mr-2 h-4 w-4" />
							Create service order
						</Button>
					</div>
				</div>
				<div className="mt-6">
					{customers.length === 0 ? (
						<EmptyState
							title={searchTerm.trim() ? "No customers match your search" : "No service orders yet"}
							description={
								searchTerm.trim()
									? `No customers matched "${searchTerm}".`
									: "Create a service order to send a client the services they are buying."
							}
							action={
								!searchTerm.trim() ? (
									<Button className="min-h-11" onClick={() => navigate(`${SERVICE_ORDER_BASE}/create`)}>
										<Plus className="mr-2 h-4 w-4" />
										Create service order
									</Button>
								) : undefined
							}
						/>
					) : (
						<ServiceOrderCustomersTable customers={customers} />
					)}
				</div>
			</div>
		</div>
	);
}
