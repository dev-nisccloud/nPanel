"use client";

import * as React from "react";
import { Eye, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { DigitaxPageShell } from "./agency.digitax/_components/digitax-page-shell";
import { DigitaxListToolbar } from "./agency.digitax/_components/digitax-list-toolbar";
import {
	DigitaxTableSkeleton,
	DigitaxTableEmpty,
	DigitaxTableWrapper,
	DigitaxNoSearchResults,
} from "./agency.digitax/_components/digitax-table-states";
import { extractDigitaxArray, formatDigitaxDate } from "./agency.digitax/_components/digitax-utils";

export default function DigitaxNoticesPage() {
	const [searchQuery, setSearchQuery] = React.useState("");

	const { data: noticesData, isLoading, refetch, isFetching } = trpc.digitax.notices.getAll.useQuery({
		page_size: 20,
	});

	const notices = React.useMemo(() => extractDigitaxArray<Record<string, unknown>>(noticesData), [noticesData]);

	const filteredNotices = React.useMemo(() => {
		if (!searchQuery.trim()) return notices;
		const query = searchQuery.toLowerCase().trim();
		return notices.filter((n) =>
			String(n.subject ?? "").toLowerCase().includes(query) ||
			String(n.content ?? "").toLowerCase().includes(query)
		);
	}, [notices, searchQuery]);

	const columns = ["Subject", "Date", "Preview"];

	if (isLoading) {
		return (
			<DigitaxPageShell
				title="Compliance notices"
				description="Official communications and compliance updates from KRA eTIMS."
			>
				<DigitaxTableSkeleton columns={columns} />
			</DigitaxPageShell>
		);
	}

	return (
		<DigitaxPageShell
			title="Compliance notices"
			description="Official communications and compliance updates from KRA eTIMS."
		>
			{!notices.length ? (
				<DigitaxTableEmpty
					title="No active notices"
					description="You are all caught up with KRA compliance alerts."
				/>
			) : (
				<>
					<DigitaxListToolbar
						searchQuery={searchQuery}
						onSearchChange={setSearchQuery}
						searchPlaceholder="Search notices..."
						onRefresh={() => refetch()}
						isFetching={isFetching}
					/>
					<div className="mt-6">
						<DigitaxTableWrapper>
							<TableHeader>
								<TableRow>
									<TableHead className="pl-6">Subject</TableHead>
									<TableHead>Date</TableHead>
									<TableHead>Preview</TableHead>
									<TableHead className="w-12" />
								</TableRow>
							</TableHeader>
							<TableBody>
								{filteredNotices.length === 0 ? (
									<DigitaxNoSearchResults colSpan={4} query={searchQuery} />
								) : (
									filteredNotices.map((notice) => (
										<TableRow key={String(notice.id)}>
											<TableCell className="pl-6 font-medium">{String(notice.subject ?? "-")}</TableCell>
											<TableCell>{formatDigitaxDate(String(notice.date ?? ""))}</TableCell>
											<TableCell className="max-w-md truncate text-muted-foreground">
												{String(notice.content ?? "-")}
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
															View notice
														</DropdownMenuItem>
													</DropdownMenuContent>
												</DropdownMenu>
											</TableCell>
										</TableRow>
									))
								)}
							</TableBody>
						</DigitaxTableWrapper>
					</div>

					<p className="mt-4 text-xs text-muted-foreground">
						eTIMS notices issued to your business are synced here. Review them promptly to stay compliant with regulatory changes.
					</p>
				</>
			)}
		</DigitaxPageShell>
	);
}
