"use client";

import * as React from "react";
import { Server, Search, RefreshCw, AlertCircle, Plus } from "lucide-react";
import { skipToken } from "@tanstack/react-query";

import { trpc } from "@/utils/trpc";
import { HIVELOCITY_FACILITIES_QUERY_OPTIONS } from "@/lib/hivelocity-query-options";
import { resolveClientErrorMessage } from "@/lib/public-error-message";
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
	/** Which device type to display - drives which tRPC procedure is called. */
	type: HivelocityServerType;
	/** URL prefix for server detail links (no trailing slash). Default `/agency` for agency UI. */
	resourceBasePath?: string;
	/** Customer team routes: list only devices linked via the team's Nisc subscriptions for this product class. */
	teamSlug?: string;
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

function ServersTableError({
	onRetry,
	errorMessage,
}: {
	onRetry: () => void;
	errorMessage?: string;
}) {
	return (
		<div className="flex flex-col items-center justify-center py-16 text-center">
			<AlertCircle className="mb-4 h-10 w-10 text-muted-foreground" />
			<h3 className="mb-1 text-base font-semibold">Failed to load servers</h3>
			<p className="mb-4 text-sm text-muted-foreground max-w-xs">
				{resolveClientErrorMessage({ message: errorMessage }, "Unable to load servers right now. Please try again.")}
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

function emptyStateDescription(type: HivelocityServerType, teamScoped: boolean | undefined): string {
	if (teamScoped) {
		if (type === "vps") {
			return "No VPS instances are linked to your organization yet. Purchase VPS hosting to manage them here, or change your search or filters.";
		}
		if (type === "vds") {
			return "No VDS servers are linked to your organization yet. Purchase VDS hosting to manage them here, or change your search or filters.";
		}
		return "No dedicated servers are linked to your organization yet. Purchase dedicated servers hosting to manage them here, or change your search or filters.";
	}
	if (type === "vps") {
		return "No VPS instances are provisioned yet, or none match your search or filters.";
	}
	if (type === "vds") {
		return "No VDS servers are provisioned yet, or none match your search or filters.";
	}
	return "No dedicated servers are provisioned yet, or none match your search or filters.";
}

function ServersTableEmpty({ type, teamScoped }: { type: HivelocityServerType; teamScoped?: boolean }) {
	const label =
		type === "vps" ? "VPS instances" : type === "vds" ? "VDS servers" : "dedicated servers";
	const description = emptyStateDescription(type, teamScoped);
	return (
		<div className="flex flex-col items-center justify-center py-16 text-center">
			<Server className="mb-4 h-10 w-10 text-muted-foreground" />
			<h3 className="mb-2 text-base font-semibold">No {label} found</h3>
			<p
				className="text-sm text-muted-foreground max-w-md w-full mx-auto px-4 text-center line-clamp-3 text-balance break-words"
				title={description}
			>
				{description}
			</p>
		</div>
	);
}

// ---------------------------------------------------------------------------
// Unified Table (account-wide getMyAllResources vs team-scoped getTeamMyResources)
// ---------------------------------------------------------------------------

function normalizeResourceBasePath(base: string | undefined): string {
		const b = (base ?? "/agency").replace(/\/$/, "");
		return b || "/agency";
}

function formatMs(ms: number | undefined): string {
	return typeof ms === "number" && Number.isFinite(ms) ? `${ms}ms` : "—";
}

/** Dev-only: distinguish upstream API latency from our processing. */
function ServersTimingDebug({ timing }: { timing: Record<string, unknown> | undefined }) {
	if (!import.meta.env.DEV || !timing) return null;

	const hivelocity = timing.hivelocity as
		| { device?: { durationMs?: number; responseBytes?: number }; vps?: { durationMs?: number; responseBytes?: number }; parallelMs?: number }
		| undefined;
	const counts = timing.counts as { deviceRows?: number; vpsRows?: number; merged?: number } | undefined;
	const db = timing.db as { teamLookupMs?: number; accessCheckMs?: number; subscriptionLookupMs?: number } | undefined;

	return (
		<details className="rounded-md border border-dashed bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
			<summary className="cursor-pointer font-medium text-foreground">Load timing (debug)</summary>
			<div className="mt-2 space-y-1 font-mono">
				<p>Total: {formatMs(timing.totalMs as number)}</p>
				{hivelocity ? (
					<>
						<p>Provider GET /device/: {formatMs(hivelocity.device?.durationMs)} ({hivelocity.device?.responseBytes ?? 0} bytes, {counts?.deviceRows ?? 0} rows)</p>
						<p>VPS rows from device list: {counts?.vpsRows ?? 0}</p>
						<p>Fetch wall time: {formatMs(hivelocity.parallelMs)}</p>
					</>
				) : null}
				<p>Merge/normalize: {formatMs(timing.mergeMs as number)} ({counts?.merged ?? 0} merged)</p>
				{typeof timing.scopeMs === "number" ? <p>Team scope filter: {formatMs(timing.scopeMs as number)}</p> : null}
				{db ? (
					<p>
						DB: team {formatMs(db.teamLookupMs)}, access {formatMs(db.accessCheckMs)}, subscriptions {formatMs(db.subscriptionLookupMs)}
					</p>
				) : null}
				<p>Filter/sort: {formatMs(timing.filterMs as number)} ({timing.filteredCount ?? 0} after filter)</p>
				<p>Paginate: {formatMs(timing.paginateMs as number)} ({timing.returnedCount ?? 0} returned)</p>
				{/* <p className="pt-1 text-[11px] not-italic">
					Server lists use GET /device/ only (Hivelocity docs: bare-metal + virtual devices). GET /vps/ is used on detail pages only.
				</p> */}
			</div>
		</details>
	);
}

export function HivelocityServersTable({ type, resourceBasePath, teamSlug }: HivelocityServersTableProps) {
	const navigate = useNavigate();
	const base = normalizeResourceBasePath(resourceBasePath);
	const [searchDraft, setSearchDraft] = React.useState("");
	const [search, setSearch] = React.useState("");
	const [facilityCode, setFacilityCode] = React.useState("");

	const teamSlugTrim = teamSlug?.trim() ?? "";
	const isTeamScoped = teamSlugTrim.length > 0;
	const hideSubscriptionColumn = isTeamScoped;

	const facilitiesQuery = trpc.hivelocity.getFacilities.useQuery(undefined, HIVELOCITY_FACILITIES_QUERY_OPTIONS);
	const facilityOptions = React.useMemo(() => {
		const list = facilitiesQuery.data?.data ?? [];
		return [...list].sort((a, b) => a.title.localeCompare(b.title));
	}, [facilitiesQuery.data]);

	const listInput = React.useMemo(
		() => ({
			search: search || undefined,
			facilityCode: facilityCode || undefined,
			limit: 100,
			cursor: 0,
		}),
		[search, facilityCode],
	);

	const accountQuery = trpc.hivelocity.getMyAllResources.useQuery(
		{
			...listInput,
			type: type === "dedicated" || type === "vds" || type === "vps" ? type : "all",
		},
		{ enabled: !isTeamScoped },
	);

	const teamQuery = trpc.hivelocity.getTeamMyResources.useQuery(
		isTeamScoped
			? {
					teamSlug: teamSlugTrim,
					type: type === "dedicated" || type === "vds" || type === "vps" ? type : "vps",
					...listInput,
				}
			: skipToken,
	);

	const query = isTeamScoped ? teamQuery : accountQuery;

	const items = query.data?.data?.items ?? [];
	const handleSearch = () => setSearch(searchDraft.trim());

	const handleRowClick = (resourceId: string | number) => {
		const path =
			type === "vps"
				? `${base}/vps/${resourceId}`
				: type === "vds"
					? `${base}/vds/${resourceId}`
					: `${base}/dedicated-servers/${resourceId}`;
		navigate(path);
	};

	if (query.isLoading) return <ServersTableSkeleton />;
	if (query.isError) {
		return (
			<ServersTableError
				onRetry={() => query.refetch()}
				errorMessage={query.error?.message}
			/>
		);
	}

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
							<TableHead>Created</TableHead>
							{!hideSubscriptionColumn ? (
								<TableHead className="pr-6 text-right">Subscription</TableHead>
							) : null}
						</TableRow>
					</TableHeader>
					<TableBody>
						{items.length === 0 ? (
							<TableRow>
								<TableCell colSpan={hideSubscriptionColumn ? 5 : 6} className="py-0">
									<ServersTableEmpty type={type} teamScoped={isTeamScoped} />
								</TableCell>
							</TableRow>
						) : (
							<ServersTableRows
								items={items}
								type={type}
								resourceBasePath={base}
								onRowClick={handleRowClick}
								hideSubscriptionColumn={hideSubscriptionColumn}
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

			<ServersTimingDebug timing={(query.data as { timing?: Record<string, unknown> } | undefined)?.timing} />
		</div>
	);
}

// ---------------------------------------------------------------------------
// Rows Component (with Subscription Linking)
// ---------------------------------------------------------------------------

function ServersTableRows({
	items,
	type,
	resourceBasePath,
	onRowClick,
	hideSubscriptionColumn,
}: {
	items: any[];
	type: HivelocityServerType;
	resourceBasePath: string;
	onRowClick: (id: string | number) => void;
	hideSubscriptionColumn?: boolean;
}) {
	const [linkDevice, setLinkDevice] = React.useState<{ id: string | number; name: string } | null>(null);

	const deviceIds = React.useMemo(() => items.map((it) => it.deviceId ?? it.id), [items]);
	const { data: linkedIds = [] } = trpc.clientSubscriptions.getHivelocityDeviceIdsWithLinkedSubscription.useQuery(
		{ hivelocityDeviceIds: deviceIds },
		{ enabled: !hideSubscriptionColumn && deviceIds.length > 0 },
	);
	const linkedSet = React.useMemo(() => new Set(linkedIds.map(String)), [linkedIds]);

	return (
		<>
			{items.map((resource: any) => {
				const isVps = resource.resourceType === "vps";
				const resourceId = resource.deviceId ?? resource.id;
				const isLinked = linkedSet.has(String(resourceId));
				const isPanelSuspended = resource.panelSuspended === true;

				if (isPanelSuspended) {
					const detailPath =
						type === "vps"
							? `${resourceBasePath}/vps/${resourceId}`
							: type === "vds"
								? `${resourceBasePath}/vds/${resourceId}`
								: `${resourceBasePath}/dedicated-servers/${resourceId}`;

					return (
						<TableRow
							key={resourceId}
							className="transition-colors hover:bg-muted/50 cursor-pointer bg-amber-50/40 dark:bg-amber-950/10"
							onClick={() => onRowClick(resourceId)}
						>
							<TableCell className="pl-6 font-medium">
								<Link
									to={detailPath}
									className="text-primary hover:underline break-words"
									onClick={(e) => e.stopPropagation()}
								>
									{resource.serviceLabel || "Suspended service"}
								</Link>
							</TableCell>
							<TableCell>
								<Badge className="bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200 border-amber-200 dark:border-amber-800 text-xs font-medium">
									Suspended
								</Badge>
							</TableCell>
							<TableCell className="text-sm text-muted-foreground">—</TableCell>
							<TableCell className="text-sm text-muted-foreground">—</TableCell>
							<TableCell className="text-sm text-muted-foreground">—</TableCell>
						</TableRow>
					);
				}

				// Location handling
				let locationLabel = "-";
				const loc = resource.location as any;
				if (loc?.facility_title || loc?.facility) {
					locationLabel = loc.facility_title && loc.facility 
						? `${loc.facility_title} (${loc.facility})`
						: loc.facility_title || loc.facility || "-";
				} else if (isVps) {
					locationLabel = resource.facilityCode || "-";
				}

				return (
					<TableRow
						key={resourceId}
						className="transition-colors hover:bg-muted/50 cursor-pointer"
						onClick={() => onRowClick(resourceId)}
					>
						<TableCell className="pl-6 font-medium">
							<div className="flex flex-col gap-0.5 py-1">
								<Link
									to={
										type === "vps"
											? `${resourceBasePath}/vps/${resourceId}`
											: type === "vds"
												? `${resourceBasePath}/vds/${resourceId}`
												: `${resourceBasePath}/dedicated-servers/${resourceId}`
									}
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
							{resource.primaryIp || "-"}
						</TableCell>
						<TableCell className="text-sm">
							{locationLabel}
						</TableCell>
						<TableCell className="text-sm text-muted-foreground">
							{resource.createdDate || "-"}
						</TableCell>
						{!hideSubscriptionColumn ? (
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
														onClick={() =>
															setLinkDevice({ id: resourceId, name: resource.name || resource.hostname })
														}
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
						) : null}
					</TableRow>
				);
			})}

			{linkDevice && !hideSubscriptionColumn && (
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
