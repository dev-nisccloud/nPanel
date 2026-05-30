"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { Spinner } from "@/components/npanel-ui/spinner";
import { Input } from "@/components/ui/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { nativePrimaryScrollbarClassName } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export type HivelocityOsTableRow = {
	id: string;
	name: string;
	displayPriceLabel: string;
	originalUsdLabel: string | null;
	originalKesLabel: string | null;
};

type HivelocityOsSelectionTableProps = {
	searchQuery: string;
	onSearchChange: (value: string) => void;
	rows: HivelocityOsTableRow[];
	selectedId: string;
	onSelect: (id: string) => void;
	isLoading?: boolean;
	isError?: boolean;
	/** Appended to price column header, e.g. "/mo" */
	priceColumnHint?: string;
	/** Original USD/KES columns - agency users only */
	showOriginalPriceColumns?: boolean;
};

export function HivelocityOsSelectionTable({
	searchQuery,
	onSearchChange,
	rows,
	selectedId,
	onSelect,
	isLoading = false,
	isError = false,
	priceColumnHint,
	showOriginalPriceColumns = false,
}: HivelocityOsSelectionTableProps) {
	return (
		<div className="rounded-xl border bg-card overflow-hidden">
			<div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<p className="text-sm font-medium text-foreground">Operating system</p>
					<p className="text-xs text-muted-foreground">Choose one to continue</p>
				</div>
				<div className="w-full sm:max-w-xs">
					<Input
						placeholder="Search OS..."
						value={searchQuery}
						onChange={(e) => onSearchChange(e.target.value)}
						aria-label="Search operating systems"
					/>
				</div>
			</div>

			{isLoading ? (
				<div className="flex items-center justify-center py-12">
					<Spinner variant="ellipsis" size={36} className="text-muted-foreground" />
				</div>
			) : isError ? (
				<div className="p-4">
					<p className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
						Failed to load operating systems.
					</p>
				</div>
			) : rows.length === 0 ? (
				<div className="p-4">
					<p className="text-sm text-muted-foreground py-6 text-center">
						No operating systems match your search.
					</p>
				</div>
			) : (
				<div
					className={cn(
						"h-[min(280px,40vh)] shrink-0 border-t bg-card",
						nativePrimaryScrollbarClassName,
					)}
				>
					<Table>
						<TableHeader>
							<TableRow className="hover:bg-transparent">
								<TableHead className="w-10 pl-4 sticky top-0 z-10 bg-card" aria-hidden />
								<TableHead className="sticky top-0 z-10 bg-card">Operating system</TableHead>
								<TableHead className="text-right sticky top-0 z-10 bg-card">
									Price{priceColumnHint ? ` ${priceColumnHint}` : ""}
								</TableHead>
								{showOriginalPriceColumns ? (
									<>
										<TableHead className="text-right sticky top-0 z-10 bg-card">Original (USD)</TableHead>
										<TableHead className="text-right sticky top-0 z-10 bg-card">Original (KES)</TableHead>
									</>
								) : null}
							</TableRow>
						</TableHeader>
						<TableBody>
							{rows.map((row) => {
								const selected = row.id === selectedId;
								return (
									<TableRow
										key={row.id}
										data-state={selected ? "selected" : undefined}
										className={cn(
											"cursor-pointer",
											selected && "bg-muted/60",
										)}
										onClick={() => onSelect(row.id)}
										onKeyDown={(e) => {
											if (e.key === "Enter" || e.key === " ") {
												e.preventDefault();
												onSelect(row.id);
											}
										}}
										tabIndex={0}
										role="radio"
										aria-checked={selected}
									>
										<TableCell className="pl-4">
											<span
												className={cn(
													"flex h-5 w-5 items-center justify-center rounded-full border transition-colors",
													selected
														? "border-primary bg-primary text-primary-foreground"
														: "border-muted-foreground/30 bg-background",
												)}
												aria-hidden
											>
												{selected ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
											</span>
										</TableCell>
										<TableCell className="font-medium text-foreground whitespace-normal max-w-[200px] sm:max-w-none">
											{row.name}
										</TableCell>
										<TableCell className="text-right font-bold text-primary tabular-nums">
											{row.displayPriceLabel}
										</TableCell>
										{showOriginalPriceColumns ? (
											<>
												<TableCell className="text-right text-sm text-green-600 dark:text-green-500 tabular-nums">
													{row.originalUsdLabel ?? "-"}
												</TableCell>
												<TableCell className="text-right text-sm text-green-600 dark:text-green-500 tabular-nums">
													{row.originalKesLabel ?? "-"}
												</TableCell>
											</>
										) : null}
									</TableRow>
								);
							})}
						</TableBody>
					</Table>
				</div>
			)}
		</div>
	);
}
