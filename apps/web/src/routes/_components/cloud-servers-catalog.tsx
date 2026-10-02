"use client";

import * as React from "react";

import { SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export function CloudServersCatalogLayout({
	title,
	description,
	tabs,
	children,
}: {
	title: string;
	description: string;
	tabs: { value: string; label: string }[];
	children: React.ReactNode;
}) {
	return (
		<div className="-m-4 flex h-[calc(100dvh-3rem)] min-h-0 flex-col overflow-hidden md:-m-6">
			<div className="@container/main mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col px-4 pt-4 md:px-6 md:pt-6 lg:px-8">
				<Tabs defaultValue="plans" className="min-h-0 w-full flex-1 gap-0">
					<header className="flex shrink-0 flex-col gap-4 border-b pb-4 @4xl/main:flex-row @4xl/main:items-end @4xl/main:justify-between">
						<div className="min-w-0 space-y-1">
							<h1 className="text-lg font-semibold tracking-tight">{title}</h1>
							<p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{description}</p>
						</div>
						<TabsList
							className={cn(
								"grid h-9 w-full p-1 @4xl/main:inline-flex @4xl/main:w-auto",
								tabs.length === 3 ? "grid-cols-3" : "grid-cols-2",
							)}
						>
							{tabs.map((tab) => (
								<TabsTrigger key={tab.value} value={tab.value} className="px-3">
									{tab.label}
								</TabsTrigger>
							))}
						</TabsList>
					</header>
					<div className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-5">{children}</div>
				</Tabs>
			</div>
		</div>
	);
}

export function CloudServersPlansSplit({
	filter,
	children,
}: {
	filter?: React.ReactNode;
	children: React.ReactNode;
}) {
	const [open, setOpen] = React.useState(false);

	return (
		<div className="@container">
			<div
				className={cn(
					"flex flex-col gap-4",
					filter && "@4xl:grid @4xl:grid-cols-[16.5rem_minmax(0,1fr)] @4xl:items-start @4xl:gap-6",
				)}
			>
				{filter ? (
					<aside className="@4xl:sticky @4xl:top-0 @4xl:z-10 @4xl:max-h-[calc(100dvh-13rem)] @4xl:self-start @4xl:overflow-y-auto">
						<div className="@4xl:hidden">
							<Button
								type="button"
								variant="outline"
								className="w-full justify-between"
								aria-expanded={open}
								onClick={() => setOpen((value) => !value)}
							>
								<span className="inline-flex items-center gap-2">
									<SlidersHorizontal className="size-4" />
									Filters
								</span>
							</Button>
						</div>
						<div className={cn("mt-3 @4xl:mt-0", !open && "hidden @4xl:block")}>{filter}</div>
					</aside>
				) : null}
				<div className="@container/cards min-w-0">{children}</div>
			</div>
		</div>
	);
}

export function CloudServersPlansStatus({
	isLoading,
	errorMessage,
	filteredEmpty,
	empty,
	emptyMessage,
	onClearFilters,
	children,
}: {
	isLoading: boolean;
	errorMessage?: string | null;
	filteredEmpty: boolean;
	empty: boolean;
	emptyMessage: string;
	onClearFilters: () => void;
	children: React.ReactNode;
}) {
	if (isLoading) {
		return <CloudServersNotice>Loading plans...</CloudServersNotice>;
	}
	if (errorMessage) {
		return <CloudServersNotice>{errorMessage}</CloudServersNotice>;
	}
	if (filteredEmpty) {
		return (
			<CloudServersNotice>
				<p>No plans match your filters.</p>
				<Button type="button" variant="outline" size="sm" onClick={onClearFilters}>
					Clear filters
				</Button>
			</CloudServersNotice>
		);
	}
	if (empty) {
		return <CloudServersNotice>{emptyMessage}</CloudServersNotice>;
	}
	return <>{children}</>;
}

function CloudServersNotice({ children }: { children: React.ReactNode }) {
	return (
		<div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-4 text-center text-sm text-muted-foreground">
			{children}
		</div>
	);
}
