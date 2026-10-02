"use client";

import * as React from "react";
import { HelpCircle, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function DedicatedCatalogControls({
	searchDraft,
	onSearchDraftChange,
	onSearch,
	includeCustom,
	onIncludeCustomChange,
	facilityCode,
	onFacilityCodeChange,
	facilityOptions,
}: {
	searchDraft: string;
	onSearchDraftChange: (value: string) => void;
	onSearch: () => void;
	includeCustom: "false" | "true";
	onIncludeCustomChange: (value: "false" | "true") => void;
	facilityCode: string;
	onFacilityCodeChange: (value: string) => void;
	facilityOptions: { code: string; title: string }[];
}) {
	const searchId = React.useId();
	const locationId = React.useId();
	const catalogLabelId = React.useId();

	return (
		<section aria-label="Catalog" className="@container rounded-xl border bg-card p-3 sm:p-4">
			<div className="grid grid-cols-1 items-end gap-4 @3xl:grid-cols-[minmax(0,1fr)_minmax(15rem,18rem)] @5xl:grid-cols-[minmax(0,1.4fr)_16rem_auto]">
				<form
					className="min-w-0 @3xl:col-span-2 @5xl:col-span-1"
					onSubmit={(event) => {
						event.preventDefault();
						onSearch();
					}}
				>
					<Label htmlFor={searchId} className="text-xs font-medium text-muted-foreground">
						Search
					</Label>
					<div className="mt-1.5 flex gap-2">
						<div className="relative min-w-0 flex-1">
							<Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
							<Input
								id={searchId}
								className="pl-9"
								placeholder="CPU, RAM, storage, bandwidth, or product id"
								value={searchDraft}
								onChange={(event) => onSearchDraftChange(event.target.value)}
							/>
						</div>
						<Button type="submit" variant="outline">
							Search
						</Button>
					</div>
				</form>

				<div className="min-w-0">
					<Label htmlFor={locationId} className="text-xs font-medium text-muted-foreground">
						Location
					</Label>
					<Select value={facilityCode} onValueChange={onFacilityCodeChange}>
						<SelectTrigger id={locationId} className="mt-1.5 w-full">
							<SelectValue placeholder="All locations" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All locations</SelectItem>
							{facilityOptions.map((facility) => (
								<SelectItem key={facility.code} value={facility.code}>
									{facility.title}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<div className="min-w-0">
					<div className="mb-1.5 flex items-center gap-1.5">
						<p id={catalogLabelId} className="text-xs font-medium text-muted-foreground">
							Catalog
						</p>
						<Tooltip>
							<TooltipTrigger asChild>
								<button type="button" className="text-muted-foreground hover:text-foreground" aria-label="About custom configurations">
									<HelpCircle className="size-3.5" />
								</button>
							</TooltipTrigger>
							<TooltipContent>Includes custom-built dedicated server configurations in the catalog.</TooltipContent>
						</Tooltip>
					</div>
					<div
						role="group"
						aria-labelledby={catalogLabelId}
						className="grid h-9 grid-cols-2 gap-1 rounded-lg border bg-muted/40 p-1"
					>
						{(
							[
								{ value: "false", label: "Standard" },
								{ value: "true", label: "Include custom" },
							] as const
						).map((option) => {
							const selected = includeCustom === option.value;
							return (
								<button
									key={option.value}
									type="button"
									aria-pressed={selected}
									onClick={() => onIncludeCustomChange(option.value)}
										className={cn(
										"whitespace-nowrap rounded-md px-2.5 text-sm font-medium transition-colors",
										selected
											? "bg-background text-foreground shadow-sm"
											: "text-muted-foreground hover:text-foreground",
									)}
								>
									{option.label}
								</button>
							);
						})}
					</div>
				</div>
			</div>
		</section>
	);
}
