"use client";

import * as React from "react";
import { format } from "date-fns";
import { ChevronsUpDown, HardDrive } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useOptionalAgencyPermissions } from "@/contexts/agency-permissions-context";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/sonner";
import { trpc } from "@/utils/trpc";

import { DeleteBucketDialog } from "./delete-bucket-dialog";
import { errorMessage, formatPlanBytes } from "./format";
import { InternalBucketDialog } from "./internal-bucket-dialog";
import { StorageBrowser, StorageFilesSkeleton } from "./storage-browser";
import { StoragePricing } from "./storage-pricing";

type BucketItem = {
	id: string;
	kind: string;
	label: string | null;
	status: string;
	bucketName: string | null;
	planName?: string | null;
	teamName?: string | null;
	quotaBytes: string;
	maxObjectBytes: string;
	deletionScheduledAt?: Date | string | null;
};

function bucketTitle(item: BucketItem): string {
	return item.bucketName || item.label || "Bucket";
}

function bucketDetail(item: BucketItem): string {
	const size = formatPlanBytes(item.quotaBytes);
	const owner = item.kind === "INTERNAL" ? "Internal" : item.teamName || "Team";
	const plan = item.kind === "INTERNAL" ? "No plan" : item.planName || "Plan";
	return item.status === "ACTIVE" ? `${owner} · ${plan} · ${size}` : `${owner} · ${plan} · ${item.status}`;
}

export function NiscStorageScreen({
	mode,
	teamId,
	teamSlug,
	teamLoading = false,
}: {
	mode: "agency" | "customer";
	teamId?: string;
	teamSlug?: string;
	teamLoading?: boolean;
}) {
	const [open, setOpen] = React.useState(false);
	const [search, setSearch] = React.useState("");
	const [debounced, setDebounced] = React.useState("");
	const [extra, setExtra] = React.useState<BucketItem[]>([]);
	const [moreCursor, setMoreCursor] = React.useState<string | null | undefined>(undefined);
	const [selectedId, setSelectedId] = React.useState<string | null>(null);
	const [openBucket, setOpenBucket] = React.useState<BucketItem | null>(null);
	const [internalOpen, setInternalOpen] = React.useState(false);
	const [limitsOpen, setLimitsOpen] = React.useState(false);
	const [deleteOpen, setDeleteOpen] = React.useState(false);
	const agencyPermissions = useOptionalAgencyPermissions();
	const canManageBuckets = mode === "agency" && (agencyPermissions?.can("storage.browse", "write") ?? false);
	const utils = trpc.useUtils();
	const { data: session } = authClient.useSession();
	const isSuperAdmin = (session?.user as { role?: string } | undefined)?.role === "AGENCY_SUPER_ADMIN";
	const cancelDeletion = trpc.niscStorage.cancelDeletion.useMutation();

	React.useEffect(() => {
		const timer = window.setTimeout(() => setDebounced(search.trim()), 300);
		return () => window.clearTimeout(timer);
	}, [search]);

	React.useEffect(() => {
		setExtra([]);
		setMoreCursor(undefined);
	}, [debounced, teamId]);

	const buckets = trpc.niscStorage.list.useQuery(
		{
			teamId: mode === "customer" ? teamId : undefined,
			search: mode === "agency" && debounced ? debounced : undefined,
			liveOnly: true,
		},
		{ enabled: mode === "agency" || Boolean(teamId) },
	);

	const items = React.useMemo(() => {
		const seen = new Set<string>();
		const rows: BucketItem[] = [];
		for (const item of [...(buckets.data?.items ?? []), ...extra]) {
			if (seen.has(item.id) || item.status === "DELETED") continue;
			seen.add(item.id);
			rows.push(item);
		}
		return rows;
	}, [buckets.data?.items, extra]);

	React.useEffect(() => {
		const match = items.find((item) => item.id === selectedId);
		if (match) setOpenBucket(match);
	}, [items, selectedId]);

	React.useEffect(() => {
		if (selectedId || debounced || !items[0]) return;
		setSelectedId(items[0].id);
	}, [items, selectedId, debounced]);

	const selected = openBucket?.id === selectedId ? openBucket : items.find((item) => item.id === selectedId) ?? null;
	const nextCursor = moreCursor === undefined ? buckets.data?.nextCursor ?? null : moreCursor;

	if (mode === "customer" && (teamLoading || buckets.isLoading)) {
		return (
			<div className="flex min-h-0 flex-1 flex-col gap-4">
				<div className="flex flex-col gap-2">
					<h1 className="text-base font-semibold tracking-tight">Cloud Storage</h1>
					<p className="max-w-2xl text-xs text-muted-foreground">Files stored for this team.</p>
				</div>
				<div className="min-h-[28rem] overflow-hidden rounded-lg border bg-card">
					<StorageFilesSkeleton />
				</div>
			</div>
		);
	}
	if (mode === "customer" && !teamId) {
		return (
			<Alert variant="destructive">
				<AlertDescription>This team could not be opened.</AlertDescription>
			</Alert>
		);
	}
	if (buckets.isError) {
		return (
			<Alert variant="destructive">
				<AlertDescription>{buckets.error.message}</AlertDescription>
			</Alert>
		);
	}
	if (mode === "customer" && items.length === 0) {
		return <StoragePricing teamId={teamId} teamSlug={teamSlug} />;
	}

	return (
		<div className="flex min-h-0 flex-1 flex-col gap-4">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<div className="flex flex-col gap-2">
					<h1 className="text-base font-semibold tracking-tight">Cloud Storage</h1>
					<p className="max-w-2xl text-xs text-muted-foreground">
						{mode === "agency"
							? "Every bucket on this server. Open one to work with its files."
							: "Files stored for this team."}
					</p>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					<Popover open={open} onOpenChange={setOpen}>
						<PopoverTrigger asChild>
							<Button
								variant="outline"
								role="combobox"
								aria-expanded={open}
								className="h-auto min-h-11 w-full justify-between py-1.5 sm:w-96"
							>
								<span className="min-w-0 flex-1 text-left">
									{selected ? (
										<>
											<span className="block truncate">{bucketTitle(selected)}</span>
											<span className="block truncate text-xs text-muted-foreground">{bucketDetail(selected)}</span>
										</>
									) : (
										mode === "agency" ? "Choose a bucket" : "Storage"
									)}
								</span>
								<ChevronsUpDown className="size-4 shrink-0 opacity-50" />
							</Button>
						</PopoverTrigger>
						<PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="end">
							<Command shouldFilter={mode === "customer"}>
								<CommandInput
									placeholder={mode === "agency" ? "Search buckets" : "Your buckets"}
									value={mode === "agency" ? search : undefined}
									onValueChange={mode === "agency" ? setSearch : undefined}
								/>
								<CommandList>
									<CommandEmpty>{buckets.isFetching ? "Searching…" : "No buckets match."}</CommandEmpty>
									<CommandGroup>
										{items.map((item) => (
											<CommandItem
												key={item.id}
												value={`${bucketTitle(item)} ${bucketDetail(item)}`}
												className="min-h-11"
												onSelect={() => {
													setSelectedId(item.id);
													setOpen(false);
												}}
											>
												<HardDrive className="size-4" />
												<span className="min-w-0 flex-1">
													<span className="block truncate">{bucketTitle(item)}</span>
													<span className="block truncate text-xs text-muted-foreground">{bucketDetail(item)}</span>
												</span>
												{item.status !== "ACTIVE" ? <Badge variant="outline">{item.status}</Badge> : null}
												<span className={cn("size-2 rounded-full", item.id === selectedId ? "bg-primary" : "bg-transparent")} />
											</CommandItem>
										))}
									</CommandGroup>
									{mode === "agency" && nextCursor ? (
										<div className="p-2">
											<Button
												variant="ghost"
												className="min-h-11 w-full"
												onClick={() => {
													void utils.niscStorage.list
														.fetch({ search: debounced || undefined, liveOnly: true, cursor: nextCursor })
														.then((page) => {
															setExtra((current) => [...current, ...page.items]);
															setMoreCursor(page.nextCursor);
														});
												}}
											>
												More buckets
											</Button>
										</div>
									) : null}
								</CommandList>
							</Command>
						</PopoverContent>
					</Popover>
					{canManageBuckets ? (
						<Button variant="outline" className="min-h-11" onClick={() => setInternalOpen(true)}>
							Internal bucket
						</Button>
					) : null}
					{canManageBuckets && selected?.status === "ACTIVE" ? (
						<Button variant="outline" className="min-h-11" onClick={() => setLimitsOpen(true)}>
							Edit limits
						</Button>
					) : null}
					{canManageBuckets && selected && selected.status !== "PENDING_DELETION" && selected.status !== "DELETED" ? (
						<Button variant="destructive" className="min-h-11" onClick={() => setDeleteOpen(true)}>
							Delete bucket
						</Button>
					) : null}
				</div>
			</div>

			{selected?.status === "PENDING_DELETION" ? (
				<Alert>
					<AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<span>
							Deletion has been started
							{selected.deletionScheduledAt
								? ` and this bucket will be removed on ${format(new Date(selected.deletionScheduledAt), "d MMM yyyy")}`
								: ""}
							.
							{canManageBuckets ? " You can cancel that decision." : ""}
						</span>
						{canManageBuckets ? (
						<span className="flex flex-wrap gap-2">
							<Button
								variant="outline"
								className="min-h-11"
								disabled={cancelDeletion.isPending}
								onClick={() => {
									cancelDeletion.mutate(
										{ resourceId: selected.id },
										{
											onSuccess: async () => {
												toast.success("Deletion cancelled.");
												await utils.niscStorage.list.invalidate();
												await utils.niscStorage.get.invalidate({ resourceId: selected.id });
											},
											onError: (error) => toast.error(errorMessage(error)),
										},
									);
								}}
							>
								{cancelDeletion.isPending ? "Cancelling…" : "Cancel deletion"}
							</Button>
							{isSuperAdmin ? (
								<Button variant="destructive" className="min-h-11" onClick={() => setDeleteOpen(true)}>
									Delete now
								</Button>
							) : null}
						</span>
						) : null}
					</AlertDescription>
				</Alert>
			) : null}

			{mode === "agency" && buckets.isLoading ? (
				<div className="min-h-[28rem] overflow-hidden rounded-lg border bg-card">
					<StorageFilesSkeleton />
				</div>
			) : null}
			{mode === "agency" && !buckets.isLoading && items.length === 0 ? (
				<div className="rounded-lg border border-dashed px-6 py-12 text-center">
					<p className="text-sm font-medium">No buckets yet</p>
					<p className="mt-1 text-sm text-muted-foreground">Create an internal bucket, or provision a plan for a team.</p>
				</div>
			) : null}
			{selected ? <StorageBrowser resourceId={selected.id} mode={mode} /> : null}
			{mode === "agency" && selected ? (
				<DeleteBucketDialog
					open={deleteOpen}
					onOpenChange={setDeleteOpen}
					resourceId={selected.id}
					bucketName={bucketTitle(selected)}
					isSuperAdmin={isSuperAdmin}
					alreadyScheduled={selected.status === "PENDING_DELETION"}
					onDeleted={() => setSelectedId(null)}
				/>
			) : null}
			{canManageBuckets ? (
				<InternalBucketDialog
					open={internalOpen}
					onOpenChange={setInternalOpen}
					onCreated={(resourceId) => {
						setSelectedId(resourceId);
						void utils.niscStorage.list.invalidate();
					}}
				/>
			) : null}
			{canManageBuckets && selected?.status === "ACTIVE" ? (
				<InternalBucketDialog
					open={limitsOpen}
					onOpenChange={setLimitsOpen}
					existing={{
						id: selected.id,
						quotaBytes: selected.quotaBytes,
						maxObjectBytes: selected.maxObjectBytes,
					}}
				/>
			) : null}
		</div>
	);
}
