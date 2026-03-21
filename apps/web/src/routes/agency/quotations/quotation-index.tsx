"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, RefreshCw, Search } from "lucide-react";
import { trpc } from "@/utils/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { QuotationsTable } from "./_components/quotations-table";
import type { QuotationTableRow } from "./_components/quotations-table";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

const QuotationsTableSkeleton: React.FC = () => (
	<div className="overflow-hidden rounded-lg border bg-card shadow-sm">
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead className="pl-6">Quotation #</TableHead>
					<TableHead>Customer</TableHead>
					<TableHead>Amount</TableHead>
					<TableHead>Status</TableHead>
					<TableHead className="w-12 pr-6" />
				</TableRow>
			</TableHeader>
			<TableBody>
				{[...Array(5)].map((_, i) => (
					<TableRow key={i}>
						<TableCell className="pl-6"><Skeleton className="h-4 w-28" /></TableCell>
						<TableCell><Skeleton className="h-4 w-36" /></TableCell>
						<TableCell><Skeleton className="h-4 w-20" /></TableCell>
						<TableCell><Skeleton className="h-4 w-20" /></TableCell>
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

export default function QuotationIndex() {
	const router = useRouter();
	const [searchTerm, setSearchTerm] = React.useState("");

	const { data, isLoading, isFetching, error, refetch } = trpc.quotations.list.useQuery(
		{ limit: 100 },
	);

	const quotations = data?.quotations ?? [];

	const filteredQuotations = React.useMemo(() => {
		if (!searchTerm.trim()) return quotations;
		const query = searchTerm.toLowerCase();
		return quotations.filter((q: QuotationTableRow) => {
			const number = q.quotationNumber?.toLowerCase() ?? "";
			const customerName = q.customerName?.toLowerCase() ?? "";
			const customerEmail = q.customerEmail?.toLowerCase() ?? "";
			const status = q.status.toLowerCase();
			return (
				number.includes(query) ||
				customerName.includes(query) ||
				customerEmail.includes(query) ||
				status.includes(query)
			);
		});
	}, [quotations, searchTerm]);

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
						<QuotationsTableSkeleton />
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
						Create and manage quotations with manual company details.
					</p>
				</div>

				<div className="mt-6">
					<div className="flex items-center justify-between gap-4">
						<div className="relative flex-1 max-w-sm">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
							<Input
								type="search"
								placeholder="Search by number, customer, or status..."
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
								title="Refresh quotations"
							>
								<RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
							</Button>
							<Button onClick={() => router.push("/agency/quotations/create")}>
								<Plus className="mr-2 h-4 w-4" />
								Create Quotation
							</Button>
						</div>
					</div>
				</div>

				<div className="mt-6">
					{quotations.length === 0 ? (
						<EmptyState
							title="No quotations yet"
							description="Create a quotation to get started."
							action={
								<Button onClick={() => router.push("/agency/quotations/create")}>
									<Plus className="mr-2 h-4 w-4" />
									Create Quotation
								</Button>
							}
						/>
					) : filteredQuotations.length === 0 ? (
						<EmptyState
							title="No quotations match your search"
							description={`We couldn't find quotations for "${searchTerm}". Try updating your search.`}
						/>
					) : (
						<QuotationsTable quotations={filteredQuotations} onRefetch={refetch} />
					)}
				</div>
			</div>
		</div>
	);
}
