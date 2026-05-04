"use client";

import * as React from "react";
import { Server, Search, RefreshCw, AlertCircle, Plus } from "lucide-react";

import { trpc } from "@/utils/trpc";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Link, useNavigate } from "react-router";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { CreateSubscriptionForHivelocityDialog } from "../agency.vps/_components/create-subscription-for-hivelocity-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type HivelocityServerType = "dedicated" | "vps" | "vds";

interface HivelocityServersTableProps {
	/** Which device type to display — drives which tRPC procedure is called. */
	type: HivelocityServerType;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getStatusBadge(status: any) {
	// Extract string if it's an object (common in Hivelocity API)
	const raw = typeof status === 'object' ? status?.status : status;
	const s = (String(raw || "unknown")).toLowerCase();
	
	// Active / On / Running -> Green
	if (["active", "on", "running", "online"].includes(s)) {
		return (
			<Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800 text-xs font-medium">
				{raw}
			</Badge>
		);
	}

	// Inactive / Off / Stopped / Failed -> Red
	if (["inactive", "off", "stopped", "failed", "offline", "cancelled"].includes(s)) {
		return (
			<Badge className="bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200 border-red-200 dark:border-red-800 text-xs font-medium">
				{raw}
			</Badge>
		);
	}

	// Anything else (provision, pending, maintenance, etc) -> Amber
	return (
		<Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200 border-amber-200 dark:border-amber-800 text-xs font-medium capitalize">
			{raw}
		</Badge>
	);
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function ServersTableSkeleton() {
	return (
		<div className="space-y-3">
			{/* Toolbar skeleton */}
			<div className="flex items-center justify-between">
				<Skeleton className="h-9 w-72" />
				<div className="flex items-center gap-2">
					<Skeleton className="h-9 w-36" />
					<Skeleton className="h-9 w-9" />
				</div>
			</div>
			{/* Table skeleton */}
			<div className="overflow-hidden rounded-lg border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className="pl-6">
								<Skeleton className="h-4 w-24" />
							</TableHead>
							<TableHead>
								<Skeleton className="h-4 w-16" />
							</TableHead>
							<TableHead>
								<Skeleton className="h-4 w-20" />
							</TableHead>
							<TableHead>
								<Skeleton className="h-4 w-28" />
							</TableHead>
							<TableHead>
								<Skeleton className="h-4 w-16" />
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{Array.from({ length: 5 }).map((_, i) => (
							<TableRow key={i}>
								<TableCell className="pl-6">
									<Skeleton className="h-4 w-40" />
								</TableCell>
								<TableCell>
									<Skeleton className="h-5 w-12 rounded-full" />
								</TableCell>
								<TableCell>
									<Skeleton className="h-4 w-28" />
								</TableCell>
								<TableCell>
									<Skeleton className="h-4 w-32" />
								</TableCell>
								<TableCell>
									<Skeleton className="h-4 w-16" />
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}

// ---------------------------------------------------------------------------
// Error state
// ---------------------------------------------------------------------------

function ServersTableError({ onRetry }: { onRetry: () => void }) {
	return (
		<div className="flex flex-col items-center justify-center py-16 text-center">
			<AlertCircle className="mb-4 h-10 w-10 text-muted-foreground" />
			<h3 className="mb-1 text-base font-semibold">Failed to load servers</h3>
			<p className="mb-4 text-sm text-muted-foreground max-w-xs">
				Could not connect to the Hivelocity API. Check your API key in settings and try again.
			</p>
			<Button variant="outline" size="sm" onClick={onRetry}>
				<RefreshCw className="mr-2 h-4 w-4" />
				Retry
			</Button>
		</div>
	);
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function ServersTableEmpty({ type }: { type: HivelocityServerType }) {
	const label =
		type === "vps" ? "VPS instances" : type === "vds" ? "VDS servers" : "dedicated servers";
	return (
		<div className="flex flex-col items-center justify-center py-16 text-center">
			<Server className="mb-4 h-10 w-10 text-muted-foreground" />
			<h3 className="mb-1 text-base font-semibold">No {label} found</h3>
			<p className="text-sm text-muted-foreground max-w-xs">
				No {label} are provisioned in this Hivelocity account, or none match the current search
				and filter.
			</p>
		</div>
	);
}

// ---------------------------------------------------------------------------
// Unified Table (uses getMyAllResources)
// ---------------------------------------------------------------------------

export function HivelocityServersTable({ type }: HivelocityServersTableProps) {
	const navigate = useNavigate();
	const [searchDraft, setSearchDraft] = React.useState("");
	const [search, setSearch] = React.useState("");
	const [facilityCode, setFacilityCode] = React.useState("");

	const facilitiesQuery = trpc.hivelocity.getFacilities.useQuery(undefined);
	const facilityOptions = React.useMemo(() => {
		const list = facilitiesQuery.data?.data ?? [];
		return [...list].sort((a, b) => a.title.localeCompare(b.title));
	}, [facilitiesQuery.data]);

	const query = trpc.hivelocity.getMyAllResources.useQuery({
		search: search || undefined,
		facilityCode: facilityCode || undefined,
		type: type === "dedicated" || type === "vds" || type === "vps" ? type : "all",
		limit: 100,
		cursor: 0,
	});

	const items = query.data?.data?.items ?? [];
	const handleSearch = () => setSearch(searchDraft.trim());

	const handleRowClick = (resourceId: string | number) => {
		const path = type === "vps" ? `/agency/vps/${resourceId}` : 
					 type === "vds" ? `/agency/vds/${resourceId}` : 
					 `/agency/dedicated-servers/${resourceId}`;
		navigate(path);
	};

	if (query.isLoading) return <ServersTableSkeleton />;
	if (query.isError) return <ServersTableError onRetry={() => query.refetch()} />;

	return (
		<div className="space-y-3">
			{/* Toolbar */}
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex items-center gap-2">
					<div className="relative flex-1 min-w-0 sm:w-72">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
						<Input
							className="pl-9"
							placeholder="Search hostname, IP, type…"
							value={searchDraft}
							onChange={(e) => setSearchDraft(e.target.value)}
							onKeyDown={(e) => e.key === "Enter" && handleSearch()}
						/>
					</div>
					<Button variant="outline" size="icon" onClick={handleSearch} aria-label="Search">
						<Search className="h-4 w-4" />
					</Button>
					{(search || facilityCode) && (
						<Badge variant="outline" className="text-muted-foreground">
							{items.length} result{items.length !== 1 ? "s" : ""}
						</Badge>
					)}
				</div>

				<div className="flex items-center gap-2">
					<Select
						value={facilityCode || "all"}
						onValueChange={(v) => setFacilityCode(v === "all" ? "" : v)}
					>
						<SelectTrigger className="w-44 h-9 text-sm">
							<SelectValue placeholder="All locations" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All locations</SelectItem>
							{facilityOptions.map((f) => (
								<SelectItem key={f.code} value={f.code}>
									{f.title}
								</SelectItem>
							))}
						</SelectContent>
					</Select>

					<Button
						variant="ghost"
						size="icon"
						onClick={() => query.refetch()}
						aria-label="Refresh"
						className="h-9 w-9"
					>
						<RefreshCw className="h-4 w-4" />
					</Button>
				</div>
			</div>

			{/* Table */}
			<div className="overflow-hidden rounded-lg border bg-card shadow-sm">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className="pl-6">Hostname / Name</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>Primary IP</TableHead>
							<TableHead>Location</TableHead>
							<TableHead>Billing</TableHead>
							<TableHead>Created</TableHead>
							<TableHead className="pr-6 text-right">Subscription</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{items.length === 0 ? (
							<TableRow>
								<TableCell colSpan={7} className="py-0">
									<ServersTableEmpty type={type} />
								</TableCell>
							</TableRow>
						) : (
							<ServersTableRows 
								items={items} 
								type={type} 
								onRowClick={handleRowClick} 
							/>
						)}
					</TableBody>
				</Table>
			</div>

			{query.data?.data && query.data.data.total > items.length && (
				<p className="text-center text-xs text-muted-foreground">
					Showing {items.length} of {query.data.data.total} resources
				</p>
			)}
		</div>
	);
}

// ---------------------------------------------------------------------------
// Rows Component (with Subscription Linking)
// ---------------------------------------------------------------------------

function ServersTableRows({ 
	items, 
	type, 
	onRowClick 
}: { 
	items: any[], 
	type: HivelocityServerType, 
	onRowClick: (id: string | number) => void 
}) {
	const [linkDevice, setLinkDevice] = React.useState<{ id: string | number; name: string } | null>(null);
	
	const deviceIds = React.useMemo(() => items.map(it => it.deviceId ?? it.id), [items]);
	const { data: linkedIds = [] } = trpc.clientSubscriptions.getHivelocityDeviceIdsWithLinkedSubscription.useQuery(
		{ hivelocityDeviceIds: deviceIds },
		{ enabled: deviceIds.length > 0 }
	);
	const linkedSet = React.useMemo(() => new Set(linkedIds.map(String)), [linkedIds]);

	return (
		<>
			{items.map((resource: any) => {
				const isVps = resource.resourceType === "vps";
				const resourceId = resource.deviceId ?? resource.id;
				const isLinked = linkedSet.has(String(resourceId));

				// Location handling
				let locationLabel = "—";
				const loc = resource.location as any;
				if (loc?.facility_title || loc?.facility) {
					locationLabel = loc.facility_title && loc.facility 
						? `${loc.facility_title} (${loc.facility})`
						: loc.facility_title || loc.facility || "—";
				} else if (isVps) {
					locationLabel = resource.facilityCode || "—";
				}

				// Billing info
				const billing = resource.billingInfo as any;
				const priceLabel = billing?.price != null 
					? `$${billing.price}` 
					: resource.nextBillingValue != null 
						? `$${resource.nextBillingValue}` 
						: "—";
				const periodLabel = billing?.period || "—";

				return (
					<TableRow
						key={resourceId}
						className="transition-colors hover:bg-muted/50 cursor-pointer"
						onClick={() => onRowClick(resourceId)}
					>
						<TableCell className="pl-6 font-medium">
							<div className="flex flex-col gap-0.5 py-1">
								<Link 
									to={type === "vps" ? `/agency/vps/${resourceId}` : 
										type === "vds" ? `/agency/vds/${resourceId}` : 
										`/agency/dedicated-servers/${resourceId}`}
									className="text-primary hover:underline break-words"
									onClick={(e) => e.stopPropagation()}
								>
									{resource.name || resource.hostname}
								</Link>
								{resource.hostname && resource.hostname !== resource.name && (
									<span className="text-xs font-normal text-muted-foreground break-all">
										{resource.hostname}
									</span>
								)}
							</div>
						</TableCell>
						<TableCell>
							<div className="flex flex-col gap-1">
								{getStatusBadge(isVps ? resource.status : resource.powerStatus)}
								{resource.status && resource.status !== "active" && !isVps && (
									getStatusBadge(resource.status)
								)}
							</div>
						</TableCell>
						<TableCell className="font-mono text-xs text-muted-foreground">
							{resource.primaryIp || "—"}
						</TableCell>
						<TableCell className="text-sm">
							{locationLabel}
						</TableCell>
						<TableCell className="text-sm">
							<div className="flex flex-col">
								<span className="font-medium">{priceLabel}</span>
								<span className="text-xs text-muted-foreground capitalize">{periodLabel}</span>
							</div>
						</TableCell>
						<TableCell className="text-sm text-muted-foreground">
							{resource.createdDate || "—"}
						</TableCell>
						<TableCell className="pr-6 text-right" onClick={(e) => e.stopPropagation()}>
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger asChild>
										<span className="inline-block">
											{isLinked ? (
												<Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1.5 py-1 px-3">
													<div className="h-1.5 w-1.5 rounded-full bg-green-600" />
													Linked
												</Badge>
											) : (
												<Button
													size="sm"
													variant="ghost"
													className="h-8 text-primary gap-1.5"
													onClick={() => setLinkDevice({ id: resourceId, name: resource.name || resource.hostname })}
												>
													<Plus className="h-3.5 w-3.5" />
													Link
												</Button>
											)}
										</span>
									</TooltipTrigger>
									<TooltipContent side="left">
										{isLinked 
											? "This device is already linked to a subscription." 
											: "Link this device to a customer subscription for billing."}
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
						</TableCell>
					</TableRow>
				);
			})}

			{linkDevice && (
				<CreateSubscriptionForHivelocityDialog
					open={!!linkDevice}
					onOpenChange={(open) => !open && setLinkDevice(null)}
					deviceId={linkDevice.id}
					deviceName={linkDevice.name}
					serviceType={type}
				/>
			)}
		</>
	);
}
