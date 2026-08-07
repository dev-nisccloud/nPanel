"use client";

import * as React from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Plus, RefreshCw, Search } from "lucide-react";

import { trpc } from "@/utils/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { InvoiceTeamsTable } from "./agency.invoices/_components/invoice-teams-table";
import { CreditNotesTable } from "./agency.invoices/_components/credit-notes-table";
import type { CreditNoteSummary } from "@npanel/api/routers/invoicing/schemas";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

const TeamsTableSkeleton: React.FC = () => (
	<div className="overflow-hidden rounded-lg border bg-card shadow-sm">
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead className="pl-6">Organization</TableHead>
					<TableHead>Invoices</TableHead>
					<TableHead>Unpaid</TableHead>
					<TableHead>Last invoice</TableHead>
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
	const navigate = useNavigate();
	const [searchParams, setSearchParams] = useSearchParams();
	const activeTab = searchParams.get("tab") === "credit-notes" ? "credit-notes" : "invoices";
	const [searchTerm, setSearchTerm] = React.useState("");
	const [debouncedSearch, setDebouncedSearch] = React.useState("");

	React.useEffect(() => {
		const handle = window.setTimeout(() => setDebouncedSearch(searchTerm.trim()), 250);
		return () => window.clearTimeout(handle);
	}, [searchTerm]);

	const {
		data: teamsData,
		isLoading: isTeamsLoading,
		isFetching: isTeamsFetching,
		error: teamsError,
		refetch: refetchTeams,
	} = trpc.invoicing.listTeamsSummary.useQuery(
		{ search: debouncedSearch || undefined },
		{ enabled: activeTab === "invoices" },
	);

	const {
		data: creditNotesData,
		isLoading: isCreditNotesLoading,
		isFetching: isCreditNotesFetching,
		error: creditNotesError,
		refetch: refetchCreditNotes,
	} = trpc.invoicing.listCreditNotes.useQuery(
		{ limit: 100 },
		{ enabled: activeTab === "credit-notes" },
	);

	const teams = teamsData?.teams ?? [];
	const creditNotes = creditNotesData?.creditNotes ?? [];

	const filteredCreditNotes = React.useMemo(() => {
		if (!searchTerm.trim()) {
			return creditNotes;
		}
		const query = searchTerm.toLowerCase();
		return creditNotes.filter((cn: CreditNoteSummary) => {
			const creditNumber = cn.creditNumber?.toLowerCase() ?? "";
			const invoiceNumber = cn.invoiceNumber?.toLowerCase() ?? "";
			const original = cn.originalInvoiceNumber?.toLowerCase() ?? "";
			const customerName = cn.customerName?.toLowerCase() ?? "";
			return (
				creditNumber.includes(query) ||
				invoiceNumber.includes(query) ||
				original.includes(query) ||
				customerName.includes(query)
			);
		});
	}, [creditNotes, searchTerm]);

	if (isTeamsLoading && activeTab === "invoices") {
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
						<TeamsTableSkeleton />
					</div>
				</div>
			</div>
		);
	}

	if (teamsError && activeTab === "invoices") {
		return (
			<div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
				<div className="w-full max-w-7xl mx-auto">
					<EmptyState
						title="Unable to load invoices"
						description={teamsError.message ?? "Something went wrong while fetching invoices."}
						action={
							<Button onClick={() => refetchTeams()} variant="outline">
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
					<h1 className="text-base font-semibold tracking-tight">Billing</h1>
					<p className="text-xs text-muted-foreground">
						Browse invoices by organization, then open individual invoices.
					</p>
				</div>

				<Tabs
					value={activeTab}
					onValueChange={(value) => {
						setSearchParams(value === "credit-notes" ? { tab: "credit-notes" } : {});
						setSearchTerm("");
					}}
					className="mt-6"
				>
					<TabsList>
						<TabsTrigger value="invoices">Invoices</TabsTrigger>
						<TabsTrigger value="credit-notes">Credit Notes</TabsTrigger>
					</TabsList>

					<div className="mt-6">
						<div className="flex items-center justify-between gap-4">
							<div className="relative flex-1 max-w-sm">
								<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
								<Input
									type="search"
									placeholder={
										activeTab === "credit-notes"
											? "Search credit notes..."
											: "Search organizations..."
									}
									value={searchTerm}
									onChange={(event) => setSearchTerm(event.target.value)}
									className="pl-9"
								/>
							</div>
							<div className="flex items-center gap-2">
								<Button
									variant="outline"
									size="icon"
									onClick={() =>
										activeTab === "credit-notes" ? refetchCreditNotes() : refetchTeams()
									}
									disabled={activeTab === "credit-notes" ? isCreditNotesFetching : isTeamsFetching}
									title="Refresh"
								>
									<RefreshCw
										className={`h-4 w-4 ${(activeTab === "credit-notes" ? isCreditNotesFetching : isTeamsFetching) ? "animate-spin" : ""}`}
									/>
								</Button>
								{activeTab === "invoices" ? (
									<Button onClick={() => navigate("/agency/invoices/create")}>
										<Plus className="mr-2 h-4 w-4" />
										Create Invoice
									</Button>
								) : null}
							</div>
						</div>
					</div>

					<TabsContent value="invoices" className="mt-6">
						{teams.length === 0 ? (
							<EmptyState
								title={searchTerm.trim() ? "No organizations match your search" : "No invoices yet"}
								description={
									searchTerm.trim()
										? `We couldn't find organizations for "${searchTerm}". Try updating your search.`
										: "Create an invoice to start billing your organizations."
								}
								action={
									!searchTerm.trim() ? (
										<Button onClick={() => navigate("/agency/invoices/create")}>
											<Plus className="mr-2 h-4 w-4" />
											Create Invoice
										</Button>
									) : undefined
								}
							/>
						) : (
							<InvoiceTeamsTable teams={teams} />
						)}
					</TabsContent>

					<TabsContent value="credit-notes" className="mt-6">
						{isCreditNotesLoading ? (
							<InvoicesTableSkeleton />
						) : creditNotesError ? (
							<EmptyState
								title="Unable to load credit notes"
								description={creditNotesError.message ?? "Something went wrong."}
								action={
									<Button onClick={() => refetchCreditNotes()} variant="outline">
										Try again
									</Button>
								}
							/>
						) : creditNotes.length === 0 ? (
							<EmptyState
								title="No credit notes yet"
								description="Credit notes appear here after you issue one from a KRA-synced invoice."
							/>
						) : filteredCreditNotes.length === 0 ? (
							<EmptyState
								title="No credit notes match your search"
								description={`We couldn't find credit notes for "${searchTerm}".`}
							/>
						) : (
							<CreditNotesTable
								creditNotes={filteredCreditNotes}
								detailPathPrefix="/agency/invoices/credit-notes"
								onRefetch={refetchCreditNotes}
							/>
						)}
					</TabsContent>
				</Tabs>
			</div>
		</div>
	);
}
