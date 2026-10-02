"use client";

import * as React from "react";
import { Plus, RefreshCw } from "lucide-react";
import { skipToken } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router";

import { trpc } from "@/utils/trpc";
import { HIVELOCITY_FACILITIES_QUERY_OPTIONS } from "@/lib/hivelocity-query-options";
import { resolveClientErrorMessage } from "@/lib/public-error-message";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ViewDetailsButton } from "@/components/ui/list-row-actions";
import { CleanListCell } from "@/components/ui/clean-list";
import {
	SearchableCleanList,
	type SearchableCleanListItem,
} from "@/components/ui/searchable-clean-list";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { CreateSubscriptionForHivelocityDialog } from "../agency.vps/_components/create-subscription-for-hivelocity-dialog";

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

function normalizeResourceBasePath(base: string | undefined): string {
	const b = (base ?? "/agency").replace(/\/$/, "");
	return b || "/agency";
}

function detailPathFor(
	type: HivelocityServerType,
	resourceBasePath: string,
	resourceId: string | number,
) {
	if (type === "vps") return `${resourceBasePath}/vps/${resourceId}`;
	if (type === "vds") return `${resourceBasePath}/vds/${resourceId}`;
	return `${resourceBasePath}/dedicated-servers/${resourceId}`;
}

function getStatusBadge(status: unknown) {
	const raw = typeof status === "object" && status !== null
		? (status as { status?: unknown }).status
		: status;
	const s = String(raw || "unknown").toLowerCase();

	if (["active", "on", "running", "online"].includes(s)) {
		return (
			<Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800 text-xs font-medium">
				{String(raw)}
			</Badge>
		);
	}

	if (["inactive", "off", "stopped", "failed", "offline", "cancelled"].includes(s)) {
		return (
			<Badge className="bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200 border-red-200 dark:border-red-800 text-xs font-medium">
				{String(raw)}
			</Badge>
		);
	}

	return (
		<Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200 border-amber-200 dark:border-amber-800 text-xs font-medium capitalize">
			{String(raw)}
		</Badge>
	);
}

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

function locationLabelFor(resource: {
	location?: { facility_title?: string; facility?: string } | null;
	facilityCode?: string;
	resourceType?: string;
}): string {
	const loc = resource.location;
	if (loc?.facility_title || loc?.facility) {
		return loc.facility_title && loc.facility
			? `${loc.facility_title} (${loc.facility})`
			: loc.facility_title || loc.facility || "-";
	}
	if (resource.resourceType === "vps") {
		return resource.facilityCode || "-";
	}
	return "-";
}

function formatMs(ms: number | undefined): string {
	return typeof ms === "number" && Number.isFinite(ms) ? `${ms}ms` : "-";
}

/** Dev-only: distinguish upstream API latency from our processing. */
function ServersTimingDebug({ timing }: { timing: Record<string, unknown> | undefined }) {
	if (!import.meta.env.DEV || !timing) return null;

	const hivelocity = timing.hivelocity as
		| {
				device?: { durationMs?: number; responseBytes?: number };
				vps?: { durationMs?: number; responseBytes?: number };
				parallelMs?: number;
		  }
		| undefined;
	const counts = timing.counts as { deviceRows?: number; vpsRows?: number; merged?: number } | undefined;
	const db = timing.db as {
		teamLookupMs?: number;
		accessCheckMs?: number;
		subscriptionLookupMs?: number;
	} | undefined;

	return (
		<details className="rounded-md border border-dashed bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
			<summary className="cursor-pointer font-medium text-foreground">Load timing (debug)</summary>
			<div className="mt-2 space-y-1 font-mono">
				<p>Total: {formatMs(timing.totalMs as number)}</p>
				{hivelocity ? (
					<>
						<p>
							Provider GET /device/: {formatMs(hivelocity.device?.durationMs)} (
							{hivelocity.device?.responseBytes ?? 0} bytes, {counts?.deviceRows ?? 0} rows)
						</p>
						<p>VPS rows from device list: {counts?.vpsRows ?? 0}</p>
						<p>Fetch wall time: {formatMs(hivelocity.parallelMs)}</p>
					</>
				) : null}
				<p>
					Merge/normalize: {formatMs(timing.mergeMs as number)} ({counts?.merged ?? 0} merged)
				</p>
				{typeof timing.scopeMs === "number" ? (
					<p>Team scope filter: {formatMs(timing.scopeMs as number)}</p>
				) : null}
				{db ? (
					<p>
						DB: team {formatMs(db.teamLookupMs)}, access {formatMs(db.accessCheckMs)}, subscriptions{" "}
						{formatMs(db.subscriptionLookupMs)}
					</p>
				) : null}
				<p>
					Filter/sort: {formatMs(timing.filterMs as number)} ({timing.filteredCount ?? 0} after filter)
				</p>
				<p>
					Paginate: {formatMs(timing.paginateMs as number)} ({timing.returnedCount ?? 0} returned)
				</p>
			</div>
		</details>
	);
}

// ---------------------------------------------------------------------------
// Unified CleanList (account-wide getMyAllResources vs team-scoped getTeamMyResources)
// ---------------------------------------------------------------------------

export function HivelocityServersTable({ type, resourceBasePath, teamSlug }: HivelocityServersTableProps) {
	const navigate = useNavigate();
	const base = normalizeResourceBasePath(resourceBasePath);
	const [searchQuery, setSearchQuery] = React.useState("");
	const [search, setSearch] = React.useState("");
	const [facilityCode, setFacilityCode] = React.useState("");
	const [linkDevice, setLinkDevice] = React.useState<{ id: string | number; name: string } | null>(
		null,
	);

	const teamSlugTrim = teamSlug?.trim() ?? "";
	const isTeamScoped = teamSlugTrim.length > 0;
	const hideSubscriptionActions = isTeamScoped;

	React.useEffect(() => {
		const handle = window.setTimeout(() => {
			setSearch(searchQuery.trim());
		}, 300);
		return () => window.clearTimeout(handle);
	}, [searchQuery]);

	const facilitiesQuery = trpc.hivelocity.getFacilities.useQuery(
		undefined,
		HIVELOCITY_FACILITIES_QUERY_OPTIONS,
	);
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

	const deviceIds = React.useMemo(
		() => items.map((it: { deviceId?: string | number; id?: string | number }) => it.deviceId ?? it.id),
		[items],
	);
	const { data: linkedIds = [] } =
		trpc.clientSubscriptions.getHivelocityDeviceIdsWithLinkedSubscription.useQuery(
			{ hivelocityDeviceIds: deviceIds },
			{ enabled: !hideSubscriptionActions && deviceIds.length > 0 },
		);
	const linkedSet = React.useMemo(() => new Set(linkedIds.map(String)), [linkedIds]);

	const listItems: SearchableCleanListItem[] = items.map((resource: any) => {
		const isVps = resource.resourceType === "vps";
		const resourceId = resource.deviceId ?? resource.id;
		const detailHref = detailPathFor(type, base, resourceId);
		const isLinked = linkedSet.has(String(resourceId));
		const isPanelSuspended = resource.panelSuspended === true;

		if (isPanelSuspended) {
			const titleText = resource.serviceLabel || "Suspended service";
			return {
				key: String(resourceId),
				title: (
					<Link
						to={detailHref}
						className="text-foreground hover:underline"
						onClick={(e) => e.stopPropagation()}
					>
						{titleText}
					</Link>
				),
				cells: {
					ip: <CleanListCell></CleanListCell>,
					location: <CleanListCell></CleanListCell>,
					status: (
						<Badge className="bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200 border-amber-200 dark:border-amber-800 text-xs font-medium">
							Suspended
						</Badge>
					),
				},
				description: <p>Service suspended  open details to review or reactivate.</p>,
				actions: <ViewDetailsButton onClick={() => navigate(detailHref)} />,
				onClick: () => navigate(detailHref),
			};
		}

		const titleText = resource.name || resource.hostname || String(resourceId);
		const locationLabel = locationLabelFor(resource);
		const ip = resource.primaryIp || "-";
		const created = resource.createdDate || "-";

		return {
			key: String(resourceId),
			title: (
				<Link
					to={detailHref}
					className="text-foreground hover:underline"
					onClick={(e) => e.stopPropagation()}
				>
					{titleText}
				</Link>
			),
			cells: {
				ip: <CleanListCell mono>{ip}</CleanListCell>,
				location: (
					<CleanListCell>
						{locationLabel}
						{created && created !== "-" ? ` · ${created}` : ""}
					</CleanListCell>
				),
				status: (
					<span className="inline-flex flex-wrap items-center gap-1">
						{getStatusBadge(isVps ? resource.status : resource.powerStatus)}
						{resource.status && resource.status !== "active" && !isVps
							? getStatusBadge(resource.status)
							: null}
						{!hideSubscriptionActions && isLinked ? (
							<Badge
								variant="outline"
								className="bg-green-50 text-green-700 border-green-200 gap-1.5 py-0.5 px-2"
							>
								<span className="h-1.5 w-1.5 rounded-full bg-green-600" />
								Linked
							</Badge>
						) : null}
					</span>
				),
			},
			description:
				resource.hostname && resource.hostname !== resource.name ? (
					<p className="truncate">{resource.hostname}</p>
				) : undefined,
			actions: (
				<>
					<ViewDetailsButton onClick={() => navigate(detailHref)} />
					{!hideSubscriptionActions && !isLinked ? (
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									<span className="inline-flex">
										<Button
											type="button"
											variant="outline"
											size="sm"
											className="h-7 px-2.5 text-xs"
											onClick={() =>
												setLinkDevice({
													id: resourceId,
													name: resource.name || resource.hostname,
												})
											}
										>
											<Plus className="mr-1 h-3.5 w-3.5" />
											Link
										</Button>
									</span>
								</TooltipTrigger>
								<TooltipContent side="top" className="max-w-xs">
									Link this device to a customer subscription for billing.
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					) : null}
				</>
			),
			onClick: () => navigate(detailHref),
		};
	});

	const totalCount = query.data?.data?.total ?? items.length;

	return (
		<div className="space-y-3">
			<SearchableCleanList
				items={listItems}
				searchQuery={searchQuery}
				onSearchChange={setSearchQuery}
				totalCount={totalCount}
				isLoading={query.isLoading}
				isError={query.isError}
				error={
					query.error
						? new Error(
								resolveClientErrorMessage(
									{ message: query.error.message },
									"Unable to load servers right now. Please try again.",
								),
							)
						: null
				}
				onRetry={() => query.refetch()}
				searchPlaceholder="Search hostname, IP, type…"
				emptyMessage={emptyStateDescription(type, isTeamScoped)}
				errorTitle="Failed to load servers"
				columns={[
					{ key: "name", label: "Name" },
					{ key: "ip", label: "IP", className: "min-w-0 w-40 shrink-0", hideBelow: "@lg" },
					{ key: "location", label: "Location", className: "min-w-0 flex-1", hideBelow: "@xl" },
					{ key: "status", label: "Status", className: "w-36 shrink-0", hideBelow: "@2xl" },
					{ key: "actions", label: "Actions", align: "end" },
				]}
				toolbarActions={
					<>
						<Select
							value={facilityCode || "all"}
							onValueChange={(v) => setFacilityCode(v === "all" ? "" : v)}
						>
							<SelectTrigger className="h-9 w-44 text-sm">
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
							variant="outline"
							size="icon"
							onClick={() => query.refetch()}
							aria-label="Refresh"
							title="Refresh"
							disabled={query.isFetching}
						>
							<RefreshCw className={`h-4 w-4 ${query.isFetching ? "animate-spin" : ""}`} />
						</Button>
					</>
				}
			/>

			{query.data?.data && query.data.data.total > items.length ? (
				<p className="text-center text-xs text-muted-foreground">
					Showing {items.length} of {query.data.data.total} resources
				</p>
			) : null}

			<ServersTimingDebug
				timing={(query.data as { timing?: Record<string, unknown> } | undefined)?.timing}
			/>

			{linkDevice && !hideSubscriptionActions ? (
				<CreateSubscriptionForHivelocityDialog
					open={!!linkDevice}
					onOpenChange={(open) => !open && setLinkDevice(null)}
					deviceId={linkDevice.id}
					deviceName={linkDevice.name}
					serviceType={type}
				/>
			) : null}
		</div>
	);
}
