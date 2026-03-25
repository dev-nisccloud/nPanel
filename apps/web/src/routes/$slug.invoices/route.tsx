"use client";

import * as React from "react";
import { useLocation } from "react-router";
import { RefreshCw, Search } from "lucide-react";

import { trpc } from "@/utils/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

import { InvoicesTable } from "./_components/invoices-table";
import type { InvoiceSummary } from "@/routes/agency.invoices/create/api/schemas";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

const InvoicesTableSkeleton: React.FC = () => (
	<div className="overflow-hidden rounded-lg border bg-card shadow-sm">
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead className="pl-6">Invoice #</TableHead>
					<TableHead>Customer</TableHead>
					<TableHead>Amount</TableHead>
					<TableHead>Status</TableHead>
					<TableHead>Due</TableHead>
					<TableHead className="w-12 pr-6"></TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{[...Array(5)].map((_, i) => (
					<TableRow key={i}>
						<TableCell className="pl-6"><Skeleton className="h-4 w-28" /></TableCell>
						<TableCell><Skeleton className="h-4 w-36" /></TableCell>
						<TableCell><Skeleton className="h-4 w-20" /></TableCell>
						<TableCell><Skeleton className="h-4 w-20" /></TableCell>
						<TableCell><Skeleton className="h-4 w-24" /></TableCell>
						<TableCell className="pr-6"><Skeleton className="h-8 w-8" /></TableCell>
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

export default function InvoiceIndex() {
	const { pathname } = useLocation();
	const teamSlug = pathname.split("/")[1];
	const [searchTerm, setSearchTerm] = React.useState("");

	const { data: teamData, isLoading: isTeamLoading } = trpc.teams.getTeamIdBySlug.useQuery(
		{ slug: teamSlug },
		{ enabled: !!teamSlug, staleTime: 5 * 60 * 1000 }
	);

	const {
		data,
		isLoading: isInvoicesLoading,
		isFetching,
		error,
		refetch,
	} = trpc.invoicing.list.useQuery(
		{ limit: 100, teamId: teamData?.id ?? undefined },
		{ enabled: !!teamData?.id }
	);

	const isLoading = isTeamLoading || isInvoicesLoading;
	const invoices = data?.invoices ?? [];

	const filteredInvoices = React.useMemo(() => {
		if (!searchTerm.trim()) {
			return invoices;
		}
		const query = searchTerm.toLowerCase();
		return invoices.filter((invoice: InvoiceSummary) => {
			const number = invoice.invoiceNumber?.toLowerCase() ?? "";
			const customerName = invoice.customerName?.toLowerCase() ?? "";
			const customerEmail = invoice.customerEmail?.toLowerCase() ?? "";
			const status = invoice.status.toLowerCase();
			return (
				number.includes(query) ||
				customerName.includes(query) ||
				customerEmail.includes(query) ||
				status.includes(query)
			);
		});
	}, [invoices, searchTerm]);

	if (isLoading || !teamSlug) {
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
						<InvoicesTableSkeleton />
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
						title="Unable to load invoices"
						description={error.message ?? "Something went wrong while fetching invoices."}
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
					<h1 className="text-base font-semibold tracking-tight">Invoices</h1>
					<p className="text-xs text-muted-foreground">
						View and manage invoices issued to your company.
					</p>
				</div>

				<div className="mt-6">
					<div className="flex items-center justify-between gap-4">
						<div className="relative flex-1 max-w-sm">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
							<Input
								type="search"
								placeholder="Search invoices by number, customer, or status..."
								value={searchTerm}
								onChange={(event) => setSearchTerm(event.target.value)}
								className="pl-9"
							/>
						</div>
						<div className="flex items-center gap-2">
							<Button
								variant="outline"
								size="icon"
								onClick={() => refetch()}
								disabled={isFetching}
								title="Refresh invoices"
							>
								<RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
							</Button>
						</div>
					</div>
				</div>

				<div className="mt-6">
					{invoices.length === 0 ? (
						<EmptyState
							title="You do not have any invoices yet"
							description="Invoices issued to your company will appear here once they are created."
						/>
					) : filteredInvoices.length === 0 ? (
						<EmptyState
							title="No invoices match your search"
							description={`We couldn't find invoices for "${searchTerm}". Try updating your search.`}
						/>
					) : (
						<InvoicesTable invoices={filteredInvoices as InvoiceSummary[]} onRefetch={refetch} />
					)}
				</div>
			</div>
		</div>
	);
}


