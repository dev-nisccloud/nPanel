"use client";

import * as React from "react";
import { ShieldCheck, MoreHorizontal, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/utils/trpc";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { VerifyDigitaxInvoiceSheet } from "./agency.digitax/verifications/_components/verify-digitax-invoice-sheet";
import { DigitaxPageShell } from "./agency.digitax/_components/digitax-page-shell";
import { DigitaxListToolbar } from "./agency.digitax/_components/digitax-list-toolbar";
import {
	DigitaxTableSkeleton,
	DigitaxTableEmpty,
	DigitaxTableWrapper,
	DigitaxNoSearchResults,
} from "./agency.digitax/_components/digitax-table-states";
import { extractDigitaxArray, formatDigitaxDate, getDigitaxStatusBadgeClass } from "./agency.digitax/_components/digitax-utils";

export default function DigitaxVerificationsPage() {
	const [searchQuery, setSearchQuery] = React.useState("");
	const [isVerifyOpen, setIsVerifyOpen] = React.useState(false);

	const { data: verificationsData, isLoading, refetch, isFetching } = trpc.digitax.verifications.getAll.useQuery({
		page_size: 20,
	});

	const verifications = React.useMemo(
		() => extractDigitaxArray<Record<string, unknown>>(verificationsData),
		[verificationsData]
	);

	const filteredVerifications = React.useMemo(() => {
		if (!searchQuery.trim()) return verifications;
		const query = searchQuery.toLowerCase().trim();
		return verifications.filter((v) =>
			String(v.invoice_number ?? "").toLowerCase().includes(query) ||
			String(v.vendor_tin ?? "").toLowerCase().includes(query) ||
			String(v.id ?? "").toLowerCase().includes(query)
		);
	}, [verifications, searchQuery]);

	const columns = ["Invoice", "Vendor PIN", "Verified at", "Status"];

	if (isLoading) {
		return (
			<DigitaxPageShell
				title="Verification hub"
				description="Cross-check external invoices and maintain audit logs of eTIMS verifications."
				action={
					<Button size="sm" disabled>
						<ShieldCheck className="mr-2 h-4 w-4" />
						Verify invoice
					</Button>
				}
			>
				<DigitaxTableSkeleton columns={columns} />
			</DigitaxPageShell>
		);
	}

	return (
		<DigitaxPageShell
			title="Verification hub"
			description="Cross-check external invoices and maintain audit logs of eTIMS verifications."
			action={
				<Button size="sm" onClick={() => setIsVerifyOpen(true)}>
					<ShieldCheck className="mr-2 h-4 w-4" />
					Verify invoice
				</Button>
			}
		>
			<VerifyDigitaxInvoiceSheet
				open={isVerifyOpen}
				onOpenChange={setIsVerifyOpen}
				onSuccess={() => refetch()}
			/>

			{!verifications.length ? (
				<DigitaxTableEmpty
					title="No verifications found"
					description="Verified external invoices will appear here for audit history."
					action={
						<Button variant="outline" size="sm" onClick={() => setIsVerifyOpen(true)}>
							Verify invoice
						</Button>
					}
				/>
			) : (
				<>
					<DigitaxListToolbar
						searchQuery={searchQuery}
						onSearchChange={setSearchQuery}
						searchPlaceholder="Search by invoice or vendor PIN..."
						onRefresh={() => refetch()}
						isFetching={isFetching}
					/>
					<div className="mt-6">
						<DigitaxTableWrapper>
							<TableHeader>
								<TableRow>
									<TableHead className="pl-6">Invoice</TableHead>
									<TableHead>Vendor PIN</TableHead>
									<TableHead>Verified at</TableHead>
									<TableHead>Status</TableHead>
									<TableHead className="w-12" />
								</TableRow>
							</TableHeader>
							<TableBody>
								{filteredVerifications.length === 0 ? (
									<DigitaxNoSearchResults colSpan={5} query={searchQuery} />
								) : (
									filteredVerifications.map((v) => {
										const isValid = Boolean(v.is_valid);
										const status = isValid ? "VALIDATED" : "MISMATCH";
										return (
											<TableRow key={String(v.id)}>
												<TableCell className="pl-6 font-medium">
													{String(v.invoice_number ?? "-")}
												</TableCell>
												<TableCell>{String(v.vendor_tin ?? "-")}</TableCell>
												<TableCell>
													{formatDigitaxDate(String(v.created_at ?? ""))}
													{v.time ? ` ${String(v.time)}` : ""}
												</TableCell>
												<TableCell>
													<Badge variant="outline" className={getDigitaxStatusBadgeClass(status)}>
														{status}
													</Badge>
												</TableCell>
												<TableCell>
													<DropdownMenu>
														<DropdownMenuTrigger asChild>
															<Button variant="ghost" size="icon" className="h-8 w-8">
																<MoreHorizontal className="h-4 w-4" />
																<span className="sr-only">Open menu</span>
															</Button>
														</DropdownMenuTrigger>
														<DropdownMenuContent align="end" className="w-40">
															<DropdownMenuItem>
																<Eye className="mr-2 h-4 w-4" />
																View report
															</DropdownMenuItem>
														</DropdownMenuContent>
													</DropdownMenu>
												</TableCell>
											</TableRow>
										);
									})
								)}
							</TableBody>
						</DigitaxTableWrapper>
					</div>

					<p className="mt-4 text-xs text-muted-foreground">
						Every verification is logged for audit purposes. Discrepancies in PIN or invoice amounts are reflected in the validation status.
					</p>
				</>
			)}
		</DigitaxPageShell>
	);
}
