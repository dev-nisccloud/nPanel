"use client";

import * as React from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { ArrowLeft, Plus, RefreshCw, Search } from "lucide-react";

import { trpc } from "@/utils/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

import { InvoicesTable } from "./agency.invoices/_components/invoices-table";
import { CreditNotesTable } from "./agency.invoices/_components/credit-notes-table";
import type { InvoiceSummary } from "@/routes/agency.invoices/create/api/schemas";
import type { CreditNoteSummary } from "@npanel/api/routers/invoicing/schemas";

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

const UUID_RE =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default function TeamInvoicesPage() {
	const navigate = useNavigate();
	const { teamId: teamIdParam } = useParams<{ teamId: string }>();
	const [searchParams, setSearchParams] = useSearchParams();
	const activeTab = searchParams.get("tab") === "credit-notes" ? "credit-notes" : "invoices";
	const [searchTerm, setSearchTerm] = React.useState("");

	const isUnassigned = teamIdParam === "unassigned";
	const teamId = !isUnassigned && teamIdParam && UUID_RE.test(teamIdParam) ? teamIdParam : undefined;
	const isInvalidTeam = !isUnassigned && !teamId;

	const listInput = isUnassigned
		? { unassignedOnly: true as const, limit: 100 }
		: { teamId: teamId!, limit: 100 };

	const creditNotesInput = isUnassigned
		? { unassignedOnly: true as const, limit: 100 }
		: { teamId: teamId!, limit: 100 };

	const {
		data: teamsData,
	} = trpc.invoicing.listTeamsSummary.useQuery({}, { enabled: !isInvalidTeam });

	const teamMeta = teamsData?.teams.find((t) =>
		isUnassigned ? t.teamId == null : t.teamId === teamId,
	);
	const teamName = teamMeta?.teamName ?? (isUnassigned ? "Unassigned" : "Team");

	const {
		data,
		isLoading,
		isFetching,
		error,
		refetch,
	} = trpc.invoicing.list.useQuery(listInput, {
		enabled: !isInvalidTeam && activeTab === "invoices",
	});

	const {
		data: creditNotesData,
		isLoading: isCreditNotesLoading,
		isFetching: isCreditNotesFetching,
		error: creditNotesError,
		refetch: refetchCreditNotes,
	} = trpc.invoicing.listCreditNotes.useQuery(creditNotesInput, {
		enabled: !isInvalidTeam && activeTab === "credit-notes",
	});

	const invoices = data?.invoices ?? [];
	const creditNotes = creditNotesData?.creditNotes ?? [];

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

	if (isInvalidTeam) {
		return (
			<div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
				<div className="w-full max-w-7xl mx-auto">
					<EmptyState
						title="Team not found"
						description="This team link is invalid."
						action={
							<Button onClick={() => navigate("/agency/invoices")} variant="outline">
								<ArrowLeft className="mr-2 h-4 w-4" />
								Back to teams
							</Button>
						}
					/>
				</div>
			</div>
		);
	}

	if (isLoading && activeTab === "invoices") {
		return (
			<div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
				<div className="w-full max-w-7xl mx-auto">
					<div className="flex flex-col gap-2">
						<Skeleton className="h-5 w-48" />
						<Skeleton className="h-4 w-64" />
					</div>
					<div className="mt-6">
						<InvoicesTableSkeleton />
					</div>
				</div>
			</div>
		);
	}

	if (error && activeTab === "invoices") {
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
				<div className="flex flex-col gap-3">
					<Button
						variant="ghost"
						size="sm"
						className="w-fit -ml-2 text-muted-foreground"
						onClick={() => navigate("/agency/invoices")}
					>
						<ArrowLeft className="mr-2 h-4 w-4" />
						All teams
					</Button>
					<div className="flex flex-col gap-1">
						<h1 className="text-base font-semibold tracking-tight">{teamName}</h1>
						<p className="text-xs text-muted-foreground">
							Invoices and credit notes for this team.
						</p>
					</div>
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
											: "Search invoices by number, customer, or status..."
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
										activeTab === "credit-notes" ? refetchCreditNotes() : refetch()
									}
									disabled={activeTab === "credit-notes" ? isCreditNotesFetching : isFetching}
									title="Refresh"
								>
									<RefreshCw
										className={`h-4 w-4 ${(activeTab === "credit-notes" ? isCreditNotesFetching : isFetching) ? "animate-spin" : ""}`}
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
						{invoices.length === 0 ? (
							<EmptyState
								title="No invoices for this team"
								description="Create an invoice billed to this team to see it here."
								action={
									<Button onClick={() => navigate("/agency/invoices/create")}>
										<Plus className="mr-2 h-4 w-4" />
										Create Invoice
									</Button>
								}
							/>
						) : filteredInvoices.length === 0 ? (
							<EmptyState
								title="No invoices match your search"
								description={`We couldn't find invoices for "${searchTerm}". Try updating your search.`}
							/>
						) : (
							<InvoicesTable invoices={filteredInvoices as InvoiceSummary[]} onRefetch={refetch} />
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
								title="No credit notes for this team"
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
