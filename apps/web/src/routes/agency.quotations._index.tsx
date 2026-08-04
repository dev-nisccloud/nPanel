"use client";

import * as React from "react";
import { useNavigate } from "react-router";
import { Plus, RefreshCw, Search } from "lucide-react";
import { trpc } from "@/utils/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { QuotationCustomersTable } from "./agency.quotations/_components/quotation-customers-table";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

const CustomersTableSkeleton: React.FC = () => (
	<div className="overflow-hidden rounded-lg border bg-card shadow-sm">
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead className="pl-6">Customer</TableHead>
					<TableHead>Quotations</TableHead>
					<TableHead>Open</TableHead>
					<TableHead>Last quotation</TableHead>
					<TableHead className="w-12 pr-6" />
				</TableRow>
			</TableHeader>
			<TableBody>
				{[...Array(5)].map((_, i) => (
					<TableRow key={i}>
						<TableCell className="pl-6"><Skeleton className="h-4 w-40" /></TableCell>
						<TableCell><Skeleton className="h-4 w-10" /></TableCell>
						<TableCell><Skeleton className="h-4 w-10" /></TableCell>
						<TableCell><Skeleton className="h-4 w-24" /></TableCell>
						<TableCell className="pr-6"><Skeleton className="h-4 w-4" /></TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	</div>
);

const EmptyState: React.FC<{
	title: string;
	description: string;
	action?: React.ReactNode;
}> = ({ title, description, action }) => (
	<div className="flex flex-col items-center justify-center py-12 text-center">
		<p className="text-lg font-semibold mb-2">{title}</p>
		<p className="text-muted-foreground mb-4">{description}</p>
		{action}
	</div>
);

export default function QuotationIndex() {
	const navigate = useNavigate();
	const [searchTerm, setSearchTerm] = React.useState("");
	const [debouncedSearch, setDebouncedSearch] = React.useState("");

	React.useEffect(() => {
		const handle = window.setTimeout(() => setDebouncedSearch(searchTerm.trim()), 250);
		return () => window.clearTimeout(handle);
	}, [searchTerm]);

	const { data, isLoading, isFetching, error, refetch } =
		trpc.quotations.listCustomersSummary.useQuery({
			search: debouncedSearch || undefined,
		});

	const customers = data?.customers ?? [];

	if (isLoading) {
		return (
			<div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
				<div className="w-full max-w-7xl mx-auto">
					<div className="flex flex-col gap-2">
						<Skeleton className="h-5 w-32" />
						<Skeleton className="h-4 w-72" />
					</div>
					<div className="mt-6 flex items-center justify-between gap-4">
						<Skeleton className="h-10 flex-1 max-w-sm" />
						<div className="flex items-center gap-2">
							<Skeleton className="h-10 w-10" />
							<Skeleton className="h-10 w-32" />
						</div>
					</div>
					<div className="mt-6">
						<CustomersTableSkeleton />
					</div>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
				<div className="w-full max-w-7xl mx-auto">
					<EmptyState
						title="Unable to load quotations"
						description={error.message ?? "Something went wrong while fetching quotations."}
						action={
							<Button onClick={() => refetch()} variant="outline">
								Try again
							</Button>
						}
					/>
				</div>
			</div>
		);
	}

	return (
		<div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
			<div className="w-full max-w-7xl mx-auto">
				<div className="flex flex-col gap-2">
					<h1 className="text-base font-semibold tracking-tight">Quotations</h1>
					<p className="text-xs text-muted-foreground">
						Browse quotations by customer, then open individual quotes.
					</p>
				</div>

				<div className="mt-6">
					<div className="flex items-center justify-between gap-4">
						<div className="relative flex-1 max-w-sm">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
							<Input
								type="search"
								placeholder="Search customers by name or email..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="pl-9"
							/>
						</div>
						<div className="flex items-center gap-2">
							<Button
								variant="outline"
								size="icon"
								onClick={() => refetch()}
								disabled={isFetching}
								title="Refresh customers"
							>
								<RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
							</Button>
							<Button onClick={() => navigate("/agency/quotations/create")}>
								<Plus className="mr-2 h-4 w-4" />
								Create Quotation
							</Button>
						</div>
					</div>
				</div>

				<div className="mt-6">
					{customers.length === 0 ? (
						<EmptyState
							title={searchTerm.trim() ? "No customers match your search" : "No quotations yet"}
							description={
								searchTerm.trim()
									? `We couldn't find customers for "${searchTerm}". Try updating your search.`
									: "Create a quotation to get started."
							}
							action={
								!searchTerm.trim() ? (
									<Button onClick={() => navigate("/agency/quotations/create")}>
										<Plus className="mr-2 h-4 w-4" />
										Create Quotation
									</Button>
								) : undefined
							}
						/>
					) : (
						<QuotationCustomersTable customers={customers} />
					)}
				</div>
			</div>
		</div>
	);
}
