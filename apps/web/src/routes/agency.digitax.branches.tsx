"use client";

import * as React from "react";
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
import { DigitaxPageShell } from "./agency.digitax/_components/digitax-page-shell";
import { DigitaxListToolbar } from "./agency.digitax/_components/digitax-list-toolbar";
import {
	DigitaxTableSkeleton,
	DigitaxTableEmpty,
	DigitaxTableWrapper,
	DigitaxNoSearchResults,
} from "./agency.digitax/_components/digitax-table-states";
import { getDigitaxStatusBadgeClass } from "./agency.digitax/_components/digitax-utils";

export default function DigitaxBranchesPage() {
	const [searchQuery, setSearchQuery] = React.useState("");

	const { data: branchesData, isLoading, refetch, isFetching } = trpc.digitax.branches.getBranches.useQuery();

	const branches = React.useMemo(() => {
		const rawData = branchesData?.data;
		if (Array.isArray(rawData)) return rawData as Record<string, unknown>[];
		if (Array.isArray((rawData as Record<string, unknown> | undefined)?.data)) {
			return (rawData as Record<string, unknown>).data as Record<string, unknown>[];
		}
		if (typeof rawData === "object" && rawData !== null && "branch_office_id" in rawData) {
			return [rawData as Record<string, unknown>];
		}
		return [];
	}, [branchesData]);

	const filteredBranches = React.useMemo(() => {
		if (!searchQuery.trim()) return branches;
		const query = searchQuery.toLowerCase().trim();
		return branches.filter((b) =>
			String(b.branch_office_name ?? "").toLowerCase().includes(query) ||
			String(b.branch_office_id ?? "").toLowerCase().includes(query) ||
			String(b.county_name ?? "").toLowerCase().includes(query) ||
			String(b.tax_locality_name ?? "").toLowerCase().includes(query)
		);
	}, [branches, searchQuery]);

	const columns = ["Branch", "Location", "Manager", "Contact", "Status"];

	if (isLoading) {
		return (
			<DigitaxPageShell
				title="Entity branches"
				description="Manage branch locations and eTIMS registration status."
			>
				<DigitaxTableSkeleton columns={columns} />
			</DigitaxPageShell>
		);
	}

	return (
		<DigitaxPageShell
			title="Entity branches"
			description="Manage branch locations and eTIMS registration status."
		>
			{!branches.length ? (
				<DigitaxTableEmpty
					title="No branches found"
					description="Branch locations registered with eTIMS will appear here."
				/>
			) : (
				<>
					<DigitaxListToolbar
						searchQuery={searchQuery}
						onSearchChange={setSearchQuery}
						searchPlaceholder="Search locations..."
						onRefresh={() => refetch()}
						isFetching={isFetching}
					/>
					<div className="mt-6">
						<DigitaxTableWrapper>
							<TableHeader>
								<TableRow>
									<TableHead className="pl-6">Branch</TableHead>
									<TableHead>Location</TableHead>
									<TableHead>Manager</TableHead>
									<TableHead>Contact</TableHead>
									<TableHead>Status</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{filteredBranches.length === 0 ? (
									<DigitaxNoSearchResults colSpan={5} query={searchQuery} />
								) : (
									filteredBranches.map((branch) => {
										const isHeadOffice = Boolean(branch.is_head_office);
										const status = isHeadOffice ? "HEAD_OFFICE" : "BRANCH";
										return (
											<TableRow key={String(branch.branch_office_id)}>
												<TableCell className="pl-6">
													<div className="flex flex-col">
														<span className="font-medium">{String(branch.branch_office_name ?? "Main HQ")}</span>
														<span className="text-xs text-muted-foreground">
															ID: {String(branch.branch_office_id ?? "-")} · PIN: {String(branch.tax_pin ?? "-")}
														</span>
													</div>
												</TableCell>
												<TableCell>
													<div className="flex flex-col">
														<span>{String(branch.county_name ?? "-")}</span>
														<span className="text-xs text-muted-foreground">
															{String(branch.sub_county_name ?? "")}
															{branch.tax_locality_name ? `, ${String(branch.tax_locality_name)}` : ""}
														</span>
													</div>
												</TableCell>
												<TableCell>{String(branch.manager_name ?? "-")}</TableCell>
												<TableCell>
													<div className="flex flex-col text-sm">
														<span>{String(branch.manager_contact ?? "-")}</span>
														<span className="text-xs text-muted-foreground">{String(branch.manager_email ?? "-")}</span>
													</div>
												</TableCell>
												<TableCell>
													<Badge variant="outline" className={getDigitaxStatusBadgeClass(status)}>
														{isHeadOffice ? "Head office" : "Branch"}
													</Badge>
												</TableCell>
											</TableRow>
										);
									})
								)}
							</TableBody>
						</DigitaxTableWrapper>
					</div>
				</>
			)}
		</DigitaxPageShell>
	);
}
