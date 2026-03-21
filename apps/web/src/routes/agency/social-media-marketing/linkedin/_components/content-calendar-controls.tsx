"use client";

import { useState } from "react";
import {
	Search,
	Settings,
	Calendar as CalendarIcon,
	SlidersHorizontal,
	Check,
	Plus,
	Clock,
	CheckCircle2,
	XCircle,
	FileX,
	FileText,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCalendarStore } from "@/stores/calendar-store";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type StatusFilter = "all" | "SCHEDULED" | "PUBLISHED" | "FAILED" | "CANCELLED" | "DRAFT";

interface ContentCalendarControlsProps {
	statusFilter: StatusFilter;
	setStatusFilter: (filter: StatusFilter) => void;
	onCreateClick: () => void;
}

export function ContentCalendarControls({
	statusFilter,
	setStatusFilter,
	onCreateClick,
}: ContentCalendarControlsProps) {
	const {
		searchQuery,
		setSearchQuery,
		goToToday,
		goToDate,
		currentWeekStart,
	} = useCalendarStore();
	const [datePickerOpen, setDatePickerOpen] = useState(false);
	const [filterOpen, setFilterOpen] = useState(false);
	const weekStart = format(currentWeekStart, "MMM dd");
	const weekEnd = format(
		new Date(currentWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000),
		"MMM dd yyyy"
	);

	const hasActiveFilters = statusFilter !== "all";

	return (
		<div className="px-3 md:px-6 py-4 border-b border-border">
			<div className="flex items-center gap-2 md:gap-3 flex-wrap">
				<div className="relative flex-1 min-w-[200px] max-w-[280px] shrink-0">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
					<Input
						placeholder="Search posts..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="pl-9 pr-9 h-8 bg-background"
					/>
					<Button
						variant="ghost"
						size="icon"
						className="absolute right-1 top-1/2 -translate-y-1/2 size-6"
					>
						<Settings className="size-3.5" />
					</Button>
				</div>

				<Button
					variant="outline"
					className="h-8 px-3 shrink-0"
					onClick={goToToday}
				>
					Today
				</Button>

				<Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
					<PopoverTrigger asChild>
						<Button
							variant="outline"
							className={cn(
								"h-8 px-3 gap-2 justify-start text-left font-normal shrink-0",
								"hover:bg-accent"
							)}
						>
							<CalendarIcon className="size-4 text-muted-foreground" />
							<span className="text-xs text-foreground">
								{weekStart} - {weekEnd}
							</span>
						</Button>
					</PopoverTrigger>
					<PopoverContent className="w-auto p-0" align="start">
						<Calendar
							mode="single"
							selected={currentWeekStart}
							onSelect={(date) => {
								if (date) {
									goToDate(date);
									setDatePickerOpen(false);
								}
							}}
							initialFocus
						/>
					</PopoverContent>
				</Popover>

				<div className="ml-auto" />

				<Popover open={filterOpen} onOpenChange={setFilterOpen}>
					<PopoverTrigger asChild>
						<Button
							variant="outline"
							className={cn("h-8 px-3 gap-2", hasActiveFilters && "bg-accent")}
						>
							<SlidersHorizontal className="size-4" />
							<span className="hidden sm:inline text-xs">Filter</span>
							{hasActiveFilters && (
								<span className="size-1.5 rounded-full bg-primary" />
							)}
						</Button>
					</PopoverTrigger>
					<PopoverContent
						className="p-4 w-[288px]! min-w-[288px]! max-w-[288px]!"
						align="end"
					>
						<div className="space-y-4 w-full">
							<div>
								<h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
									<FileText className="size-4 text-muted-foreground" />
									Status
								</h4>
								<div className="space-y-1">
									<Button
										variant="ghost"
										size="sm"
										className="w-full justify-between h-9 px-3"
										onClick={() => setStatusFilter("all")}
									>
										<span className="text-sm">All posts</span>
										{statusFilter === "all" && (
											<Check className="size-4 text-primary" />
										)}
									</Button>
									<Button
										variant="ghost"
										size="sm"
										className="w-full justify-between h-9 px-3"
										onClick={() => setStatusFilter("SCHEDULED")}
									>
										<div className="flex items-center gap-2.5">
											<Clock className="size-4 text-blue-500" />
											<span className="text-sm">Scheduled</span>
										</div>
										{statusFilter === "SCHEDULED" && (
											<Check className="size-4 text-primary" />
										)}
									</Button>
									<Button
										variant="ghost"
										size="sm"
										className="w-full justify-between h-9 px-3"
										onClick={() => setStatusFilter("PUBLISHED")}
									>
										<div className="flex items-center gap-2.5">
											<CheckCircle2 className="size-4 text-green-500" />
											<span className="text-sm">Published</span>
										</div>
										{statusFilter === "PUBLISHED" && (
											<Check className="size-4 text-primary" />
										)}
									</Button>
									<Button
										variant="ghost"
										size="sm"
										className="w-full justify-between h-9 px-3"
										onClick={() => setStatusFilter("FAILED")}
									>
										<div className="flex items-center gap-2.5">
											<XCircle className="size-4 text-red-500" />
											<span className="text-sm">Failed</span>
										</div>
										{statusFilter === "FAILED" && (
											<Check className="size-4 text-primary" />
										)}
									</Button>
									<Button
										variant="ghost"
										size="sm"
										className="w-full justify-between h-9 px-3"
										onClick={() => setStatusFilter("CANCELLED")}
									>
										<div className="flex items-center gap-2.5">
											<FileX className="size-4 text-muted-foreground" />
											<span className="text-sm">Cancelled</span>
										</div>
										{statusFilter === "CANCELLED" && (
											<Check className="size-4 text-primary" />
										)}
									</Button>
									<Button
										variant="ghost"
										size="sm"
										className="w-full justify-between h-9 px-3"
										onClick={() => setStatusFilter("DRAFT")}
									>
										<div className="flex items-center gap-2.5">
											<FileText className="size-4 text-muted-foreground" />
											<span className="text-sm">Draft</span>
										</div>
										{statusFilter === "DRAFT" && (
											<Check className="size-4 text-primary" />
										)}
									</Button>
								</div>
							</div>

							{hasActiveFilters && (
								<>
									<Separator />
									<Button
										variant="outline"
										size="sm"
										className="w-full h-9"
										onClick={() => setStatusFilter("all")}
									>
										Clear filter
									</Button>
								</>
							)}
						</div>
					</PopoverContent>
				</Popover>

				<Button
					onClick={onCreateClick}
					className="h-8 px-3 gap-2 shrink-0 bg-foreground text-background hover:bg-foreground/90"
				>
					<Plus className="size-4" />
					<span className="hidden sm:inline text-xs">Create Post</span>
				</Button>
			</div>
		</div>
	);
}



