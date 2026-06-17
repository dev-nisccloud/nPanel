"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

interface DigitaxTableSkeletonProps {
	columns: string[];
	rowCount?: number;
}

export function DigitaxTableSkeleton({ columns, rowCount = 5 }: DigitaxTableSkeletonProps) {
	return (
		<div className="overflow-hidden rounded-lg border bg-card shadow-sm">
			<Table>
				<TableHeader>
					<TableRow>
						{columns.map((col, i) => (
							<TableHead key={col} className={i === 0 ? "pl-6" : undefined}>
								{col}
							</TableHead>
						))}
						<TableHead className="w-12" />
					</TableRow>
				</TableHeader>
				<TableBody>
					{[...Array(rowCount)].map((_, i) => (
						<TableRow key={i}>
							{columns.map((col, j) => (
								<TableCell key={col} className={j === 0 ? "pl-6" : undefined}>
									<Skeleton className="h-4 w-28" />
								</TableCell>
							))}
							<TableCell />
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}

interface DigitaxTableMessageProps {
	message: string;
	action?: React.ReactNode;
}

export function DigitaxTableError({ message, action }: DigitaxTableMessageProps) {
	return (
		<div className="overflow-hidden rounded-lg border bg-card">
			<div className="flex flex-col items-center justify-center py-12 px-4 text-center">
				<p className="text-sm text-muted-foreground mb-4">{message}</p>
				{action}
			</div>
		</div>
	);
}

export function DigitaxTableEmpty({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
	return (
		<div className="overflow-hidden rounded-lg border bg-card">
			<div className="flex flex-col items-center justify-center py-12 px-4 text-center">
				<p className="text-lg font-semibold mb-1">{title}</p>
				<p className="text-sm text-muted-foreground">{description}</p>
				{action ? <div className="mt-4">{action}</div> : null}
			</div>
		</div>
	);
}

export function DigitaxTableWrapper({ children }: { children: React.ReactNode }) {
	return (
		<div className="overflow-hidden rounded-lg border bg-card shadow-sm">
			<Table>{children}</Table>
		</div>
	);
}

export function DigitaxNoSearchResults({ colSpan, query }: { colSpan: number; query: string }) {
	return (
		<TableRow>
			<TableCell colSpan={colSpan} className="text-center py-8 text-muted-foreground">
				No results match &quot;{query}&quot;
			</TableCell>
		</TableRow>
	);
}
