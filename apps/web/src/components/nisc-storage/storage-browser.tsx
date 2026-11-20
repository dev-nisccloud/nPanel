"use client";

import * as React from "react";
import { format } from "date-fns";
import {
	ChevronRight,
	Download,
	FolderPlus,
	Home,
	LayoutGrid,
	List,
	MoreHorizontal,
	Move,
	Pencil,
	RefreshCw,
	Search,
	Trash2,
	Upload,
} from "lucide-react";

import { StorageDownloadDialog, StorageUploadDialog } from "@/components/nisc-storage/storage-transfer-dialogs";
import { DeleteFileDialog, type DeleteFileItem } from "@/components/hosting/delete-file-dialog";
import { FileManagerFolderTree, type FolderTreeNode } from "@/components/hosting/file-manager-folder-tree";
import { FileManagerTypeIcon } from "@/components/hosting/file-manager-icon";
import { NewFolderDialog } from "@/components/hosting/new-folder-dialog";
import { RenameFileDialog } from "@/components/hosting/rename-file-dialog";
import type { FileManagerItem } from "@/components/hosting/file-manager-schema";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";

import {
	errorMessage,
	fileNameError,
	formatFileBytes,
	formatPlanBytes,
	joinPrefix,
	parentPrefix,
	prefixName,
	usagePercent,
} from "./format";

type StorageRow = {
	kind: "folder" | "file";
	name: string;
	key: string;
	size: number;
	modified: string | null;
};

type Page = {
	folders: { prefix: string }[];
	files: { key: string; size: number; lastModified: string | null }[];
	nextToken: string | null;
};

const FILE_NAME_WIDTHS = ["w-36", "w-52", "w-28", "w-44", "w-32", "w-48"] as const;

export function StorageFilesSkeleton({ cards = false, rows = 6 }: { cards?: boolean; rows?: number }) {
	return (
		<div role="status" aria-label="Loading files">
			<span className="sr-only">Loading files</span>
			{cards ? (
				<div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-3 lg:grid-cols-4">
					{Array.from({ length: rows }, (_, index) => (
						<div key={index} className="flex min-h-24 flex-col items-start gap-2 rounded-lg border p-3">
							<Skeleton className="size-5" />
							<Skeleton className={cn("h-4 max-w-full", index % 2 === 0 ? "w-3/4" : "w-1/2")} />
							<Skeleton className="h-3 w-12" />
						</div>
					))}
				</div>
			) : (
				<ul className="divide-y">
					{Array.from({ length: rows }, (_, index) => (
						<li key={index} className="flex items-center gap-2 px-2 py-1">
							<Skeleton className="size-5 shrink-0" />
							<div className="flex min-h-11 min-w-0 flex-1 items-center gap-2">
								<Skeleton className="size-4 shrink-0" />
								<Skeleton className={cn("h-4", FILE_NAME_WIDTHS[index % FILE_NAME_WIDTHS.length])} />
							</div>
							<Skeleton className="hidden h-3 w-14 shrink-0 sm:block" />
							<Skeleton className="hidden h-3 w-28 shrink-0 md:block" />
							<Skeleton className="size-8 shrink-0" />
						</li>
					))}
				</ul>
			)}
		</div>
	);
}

function statusCopy(status: string): string | null {
	if (status === "ACTIVE") return null;
	if (status === "SUSPENDED") return "This storage plan is suspended. Files stay in the bucket, and uploads are turned off.";
	if (status === "PENDING_DELETION") return "Deletion has been started. Files stay in the bucket until it is removed, and uploads are turned off.";
	if (status === "PROVISIONING") return "This bucket is being set up.";
	if (status === "PROVISIONING_FAILED") return "This bucket was not set up. It can be tried again once the setup error is cleared.";
	if (status === "PENDING_DELETION") return "This bucket is being removed.";
	return "This bucket is not available.";
}

function UsageRing({ percent }: { percent: number }) {
	const size = 36;
	const stroke = 3.5;
	const radius = (size - stroke) / 2;
	const shown = Math.min(100, Math.max(0, percent));
	const offset = 2 * Math.PI * radius * (1 - shown / 100);
	const tone =
		shown >= 90 ? "stroke-red-600 dark:stroke-red-400" : shown >= 70 ? "stroke-amber-500" : "stroke-emerald-600";
	return (
		<div className="relative size-11 shrink-0" aria-label={`${Math.round(shown)} percent of storage used`}>
			<svg viewBox={`0 0 ${size} ${size}`} className="size-11 -rotate-90">
				<circle cx={size / 2} cy={size / 2} r={radius} className="fill-none stroke-muted" strokeWidth={stroke} />
				<circle
					cx={size / 2}
					cy={size / 2}
					r={radius}
					className={cn("fill-none", tone)}
					strokeWidth={stroke}
					strokeLinecap="round"
					strokeDasharray={2 * Math.PI * radius}
					strokeDashoffset={offset}
				/>
			</svg>
			<span className="absolute inset-0 flex items-center justify-center text-[10px] font-medium tabular-nums">
				{Math.round(shown)}
			</span>
		</div>
	);
}

export function StorageBrowser({
	resourceId,
	mode,
}: {
	resourceId: string;
	mode: "agency" | "customer";
}) {
	const utils = trpc.useUtils();
	const resource = trpc.niscStorage.get.useQuery({ resourceId });
	const [prefix, setPrefix] = React.useState("");
	const [extraPages, setExtraPages] = React.useState<Page[]>([]);
	const [filter, setFilter] = React.useState("");
	const [view, setView] = React.useState<"list" | "cards">("list");
	const [selected, setSelected] = React.useState<string[]>([]);
	const [folderOpen, setFolderOpen] = React.useState(false);
	const [deleteOpen, setDeleteOpen] = React.useState(false);
	const [moveOpen, setMoveOpen] = React.useState(false);
	const [renameOpen, setRenameOpen] = React.useState(false);
	const [renameTarget, setRenameTarget] = React.useState<StorageRow | null>(null);
	const renameResume = React.useRef<{ prefix: string; name: string; token: string } | null>(null);
	const [moveFolder, setMoveFolder] = React.useState("");
	const [moveName, setMoveName] = React.useState("");
	const [busy, setBusy] = React.useState<string | null>(null);
	const [dragOver, setDragOver] = React.useState(false);
	const [loadingMore, setLoadingMore] = React.useState(false);
	const [uploadOpen, setUploadOpen] = React.useState(false);
	const [uploadSeed, setUploadSeed] = React.useState<File[]>([]);
	const [download, setDownload] = React.useState<{ title: string; detail: string; percent: number } | null>(null);
	const [treeVersion, setTreeVersion] = React.useState(0);

	const status = resource.data?.status ?? "";
	const canList =
		status === "ACTIVE" ||
		(mode === "agency" && (status === "SUSPENDED" || status === "PENDING_DELETION"));
	const canWrite = status === "ACTIVE";
	const listing = trpc.niscStorage.listObjects.useQuery(
		{ resourceId, prefix, maxKeys: 100 },
		{ enabled: canList && Boolean(resource.data) },
	);
	const pages = React.useMemo(
		() => (listing.data ? [listing.data, ...extraPages] : extraPages),
		[listing.data, extraPages],
	);

	React.useEffect(() => {
		setPrefix("");
		setExtraPages([]);
		setSelected([]);
		setFilter("");
	}, [resourceId]);

	React.useEffect(() => {
		setExtraPages([]);
		setSelected([]);
		setFilter("");
	}, [prefix]);

	const rows = React.useMemo<StorageRow[]>(() => {
		const folders = new Map<string, StorageRow>();
		const files = new Map<string, StorageRow>();
		for (const page of pages) {
			for (const folder of page.folders) {
				folders.set(folder.prefix, {
					kind: "folder",
					name: prefixName(folder.prefix),
					key: folder.prefix,
					size: 0,
					modified: null,
				});
			}
			for (const file of page.files) {
				files.set(file.key, {
					kind: "file",
					name: prefixName(file.key),
					key: file.key,
					size: file.size,
					modified: file.lastModified,
				});
			}
		}
		const query = filter.trim().toLowerCase();
		return [...folders.values(), ...files.values()]
			.filter((row) => !query || row.name.toLowerCase().includes(query))
			.sort((a, b) => {
				if (a.kind !== b.kind) return a.kind === "folder" ? -1 : 1;
				return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
			});
	}, [pages, filter]);

	const selectedRows = rows.filter((row) => selected.includes(row.key));
	const crumbs = prefix.split("/").filter(Boolean);
	const quota = resource.data?.quotaBytes ?? "0";
	const used = resource.data?.usedBytes ?? "0";
	const percent = usagePercent(used, quota);
	const nextToken = pages.at(-1)?.nextToken ?? null;
	const notice = resource.data ? statusCopy(resource.data.status) : null;

	const refresh = async () => {
		setExtraPages([]);
		setTreeVersion((version) => version + 1);
		await Promise.all([
			utils.niscStorage.get.invalidate({ resourceId }),
			utils.niscStorage.listObjects.invalidate({ resourceId }),
		]);
	};

	const loadFolderTree = React.useCallback(
		async (path: string): Promise<FolderTreeNode[]> => {
			const folder = path === "/" ? "" : path.replace(/^\/+/, "").replace(/\/+$/, "");
			const collected: FolderTreeNode[] = [];
			let cursor: string | undefined;
			for (let page = 0; page < 20; page += 1) {
				const listed = await utils.niscStorage.listObjects.fetch({
					resourceId,
					prefix: folder,
					maxKeys: 100,
					cursor,
				});
				for (const item of listed.folders) {
					const itemPath = item.prefix.replace(/\/+$/, "");
					collected.push({
						path: `/${itemPath}`,
						name: prefixName(itemPath),
						childrenLoaded: false,
					});
				}
				if (!listed.nextToken) break;
				cursor = listed.nextToken;
			}
			collected.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
			return collected;
		},
		[resourceId, utils.niscStorage.listObjects],
	);

	const openUpload = (files: File[]) => {
		if (!canWrite || uploadOpen) return;
		setUploadSeed(files);
		setUploadOpen(true);
	};

	const removeRows = async (targets: StorageRow[]) => {
		setBusy("Removing");
		try {
			for (const row of targets) {
				if (row.kind === "file") {
					await utils.client.niscStorage.deleteObject.mutate({ resourceId, key: row.key });
					continue;
				}
				let complete = false;
				for (let attempt = 0; attempt < 8 && !complete; attempt += 1) {
					const result = await utils.client.niscStorage.deletePrefix.mutate({ resourceId, prefix: row.key });
					complete = result.complete;
				}
				if (!complete) throw new Error(`${row.name} is only partly removed. Refresh and try again.`);
			}
			toast.success(targets.length === 1 ? `Removed ${targets[0]?.name}` : `Removed ${targets.length} items`);
			setSelected([]);
			setDeleteOpen(false);
			await refresh();
		} catch (error) {
			toast.error(errorMessage(error));
			await refresh();
		} finally {
			setBusy(null);
		}
	};

	const moveFiles = async () => {
		const files = selectedRows.filter((row) => row.kind === "file");
		if (files.length === 0) return;
		const singleName = files.length === 1 ? moveName.trim() : "";
		if (files.length === 1) {
			const nameError = fileNameError(singleName);
			if (nameError) {
				toast.error(nameError);
				return;
			}
		}
		setBusy("Moving");
		try {
			for (const file of files) {
				await utils.client.niscStorage.moveObject.mutate({
					resourceId,
					sourceKey: file.key,
					destinationPrefix: moveFolder,
					destinationName: files.length === 1 ? singleName : file.name,
				});
			}
			toast.success(files.length === 1 ? "Moved 1 file" : `Moved ${files.length} files`);
			setMoveOpen(false);
			setSelected([]);
			await refresh();
		} catch (error) {
			toast.error(errorMessage(error));
			await refresh();
		} finally {
			setBusy(null);
		}
	};

	const openRename = (row: StorageRow) => {
		setRenameTarget(row);
		setRenameOpen(true);
	};

	const confirmRename = async (newName: string) => {
		const target = renameTarget;
		if (!target) return;
		const nameError = fileNameError(newName);
		if (nameError) {
			toast.error(nameError);
			throw new Error(nameError);
		}
		const trimmed = newName.trim();
		setBusy("Renaming");
		try {
			if (target.kind === "file") {
				await utils.client.niscStorage.moveObject.mutate({
					resourceId,
					sourceKey: target.key,
					destinationPrefix: parentPrefix(target.key),
					destinationName: trimmed,
				});
				toast.success("Renamed the file");
			} else {
				const resumed =
					renameResume.current?.prefix === target.key && renameResume.current.name === trimmed
						? renameResume.current.token
						: undefined;
				let continueToken = resumed;
				let destination = target.key;
				let complete = false;
				for (let attempt = 0; attempt < 200 && !complete; attempt += 1) {
					const result = await utils.client.niscStorage.renamePrefix.mutate({
						resourceId,
						prefix: target.key,
						name: trimmed,
						continueToken,
					});
					destination = result.prefix;
					complete = result.complete;
					continueToken = result.continueToken ?? undefined;
					if (!complete && continueToken) {
						renameResume.current = { prefix: target.key, name: trimmed, token: continueToken };
					}
				}
				if (!complete) {
					toast.error("The folder was partly renamed. Rename it again with the same name to finish.");
					throw new Error("The folder was partly renamed.");
				}
				renameResume.current = null;
				setPrefix((current) => {
					if (current === target.key) return destination;
					if (current.startsWith(`${target.key}/`)) return `${destination}${current.slice(target.key.length)}`;
					return current;
				});
				toast.success("Renamed the folder");
			}
			setSelected((current) => current.filter((key) => key !== target.key));
			await refresh();
		} catch (error) {
			if (!(error instanceof Error) || error.message !== "The folder was partly renamed.") {
				toast.error(errorMessage(error));
			}
			throw error;
		} finally {
			setBusy(null);
		}
	};

	const renameItem: FileManagerItem | null = renameTarget
		? {
				id: renameTarget.key,
				name: renameTarget.name,
				type: renameTarget.kind,
				modified: renameTarget.modified ?? new Date().toISOString(),
				permissions: "",
				path: `/${renameTarget.key}`,
			}
		: null;

	const downloadFile = async (key: string, name: string) => {
		setDownload({ title: "Preparing your file", detail: `Getting ${name} ready.`, percent: 12 });
		try {
			const result = await utils.client.niscStorage.createDownloadUrl.mutate({ resourceId, key });
			setDownload({ title: "Preparing your file", detail: "Starting the download.", percent: 100 });
			window.location.assign(result.downloadUrl);
		} catch (error) {
			toast.error(errorMessage(error));
		} finally {
			window.setTimeout(() => setDownload(null), 400);
		}
	};

	const downloadSelection = async () => {
		const keys = selectedRows.filter((row) => row.kind === "file").map((row) => row.key);
		if (keys.length === 0) return;
		if (keys.length > 100) {
			toast.error("Choose up to 100 files for one download.");
			return;
		}
		setDownload({
			title: keys.length === 1 ? "Preparing your file" : "Zipping your files",
			detail: keys.length === 1 ? "Getting the file ready." : "The download starts when the archive is ready.",
			percent: 12,
		});
		try {
			if (keys.length === 1) {
				const result = await utils.client.niscStorage.createDownloadUrl.mutate({ resourceId, key: keys[0]! });
				setDownload({ title: "Preparing your file", detail: "Starting the download.", percent: 100 });
				window.location.assign(result.downloadUrl);
			} else {
				const result = await utils.client.niscStorage.downloadZip.mutate({ resourceId, keys });
				setDownload({ title: "Zipping your files", detail: "Starting the download.", percent: 100 });
				window.location.assign(result.downloadUrl);
			}
		} catch (error) {
			toast.error(errorMessage(error));
		} finally {
			window.setTimeout(() => setDownload(null), 400);
		}
	};

	const extract = async (key: string) => {
		setBusy("Unpacking");
		try {
			const result = await utils.client.niscStorage.extractZip.mutate({
				resourceId,
				key,
				destinationPrefix: prefix,
			});
			toast.success(`Unpacked ${result.extracted} files`);
			await refresh();
		} catch (error) {
			toast.error(errorMessage(error));
		} finally {
			setBusy(null);
		}
	};

	const deleteItems: DeleteFileItem[] = selectedRows.map((row) => ({
		name: row.name,
		path: row.key,
		type: row.kind,
	}));

	if (resource.isLoading) {
		return (
			<div className="flex min-h-0 flex-1 flex-col gap-3">
				<div className="flex flex-wrap items-center gap-2">
					<Skeleton className="h-11 w-56" />
					<div className="ml-auto flex gap-2">
						<Skeleton className="size-11" />
						<Skeleton className="h-11 w-24" />
						<Skeleton className="h-11 w-28" />
					</div>
				</div>
				<div className="flex min-h-[28rem] flex-1 gap-3">
					<div className="hidden w-56 shrink-0 rounded-lg border bg-card p-2 md:flex md:flex-col md:gap-2">
						<Skeleton className="h-11 w-full" />
						<Skeleton className="h-11 w-full" />
						<Skeleton className="h-11 w-4/5" />
					</div>
					<div className="min-w-0 flex-1 overflow-hidden rounded-lg border bg-card">
						<StorageFilesSkeleton />
					</div>
				</div>
			</div>
		);
	}
	if (resource.isError) {
		return (
			<Alert variant="destructive">
				<AlertDescription>{resource.error.message}</AlertDescription>
			</Alert>
		);
	}

	return (
		<div className="flex min-h-0 flex-1 flex-col gap-3">
			{notice ? (
				<Alert>
					<AlertDescription>{notice}</AlertDescription>
				</Alert>
			) : null}
			<section className="flex flex-col gap-2 rounded-lg border bg-card px-3 py-3">
				<div className="flex flex-wrap items-center gap-2">
					<UsageRing percent={percent} />
					<div className="min-w-0">
						<p className="text-sm font-medium tabular-nums">
							{formatPlanBytes(used)}
							<span className="font-normal text-muted-foreground"> of {formatPlanBytes(quota)}</span>
						</p>
						<p className="text-xs text-muted-foreground">
							{resource.data?.kind === "INTERNAL" ? "Internal bucket" : resource.data?.planName ?? "Storage"}
							{mode === "agency" && resource.data?.teamName ? ` · ${resource.data.teamName}` : ""}
							{resource.data?.maxObjectBytes ? ` · ${formatFileBytes(Number(resource.data.maxObjectBytes))} per file` : ""}
						</p>
					</div>
					<div className="relative w-full sm:ml-auto sm:w-56">
						<Search className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
						<Input
							value={filter}
							onChange={(event) => setFilter(event.target.value)}
							placeholder="Filter this folder"
							aria-label="Filter this folder"
							className="min-h-11 pl-8"
						/>
					</div>
					<div className="inline-flex rounded-md border p-0.5" role="group" aria-label="View">
						<Button type="button" variant={view === "list" ? "secondary" : "ghost"} className="size-11" aria-label="List" onClick={() => setView("list")}>
							<List className="size-4" />
						</Button>
						<Button type="button" variant={view === "cards" ? "secondary" : "ghost"} className="size-11" aria-label="Cards" onClick={() => setView("cards")}>
							<LayoutGrid className="size-4" />
						</Button>
					</div>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					{selectedRows.length > 0 ? (
						<>
							<span className="text-xs text-muted-foreground">{selectedRows.length} selected</span>
							<Button variant="outline" className="min-h-11" disabled={!canList || Boolean(busy) || download !== null || selectedRows.every((row) => row.kind === "folder")} onClick={downloadSelection}>
								<Download className="size-4" />
								Download
							</Button>
							<Button
								variant="outline"
								className="min-h-11"
								disabled={!canWrite || Boolean(busy) || selectedRows.length !== 1}
								onClick={() => {
									const row = selectedRows[0];
									if (row) openRename(row);
								}}
							>
								<Pencil className="size-4" />
								Rename
							</Button>
							<Button
								variant="outline"
								className="min-h-11"
								disabled={!canWrite || Boolean(busy) || selectedRows.every((row) => row.kind === "folder")}
								onClick={() => {
									const file = selectedRows.find((row) => row.kind === "file");
									setMoveFolder(prefix);
									setMoveName(selectedRows.filter((row) => row.kind === "file").length === 1 ? file?.name ?? "" : "");
									setMoveOpen(true);
								}}
							>
								<Move className="size-4" />
								Move
							</Button>
							<Button variant="destructive" className="min-h-11" disabled={!canWrite || Boolean(busy)} onClick={() => setDeleteOpen(true)}>
								<Trash2 className="size-4" />
								Remove
							</Button>
						</>
					) : null}
					<div className="ml-auto flex flex-wrap items-center gap-2">
						<Button variant="ghost" className="size-11" aria-label="Refresh" disabled={Boolean(busy)} onClick={() => void refresh()}>
							<RefreshCw className={cn("size-4", busy === "Refreshing" && "animate-spin")} />
						</Button>
						<Button className="min-h-11" disabled={!canWrite || Boolean(busy) || Boolean(download)} onClick={() => openUpload([])}>
							<Upload className="size-4" />
							Upload
						</Button>
						<Button variant="outline" className="min-h-11" disabled={!canWrite || Boolean(busy)} onClick={() => setFolderOpen(true)}>
							<FolderPlus className="size-4" />
							New folder
						</Button>
					</div>
				</div>
				{busy ? <p className="text-xs text-muted-foreground">{busy}</p> : null}
				<div className="flex flex-wrap items-center gap-1 border-t pt-2">
					<Button variant="ghost" className="size-11" aria-label="All files" onClick={() => setPrefix("")}>
						<Home className="size-4" />
					</Button>
					{crumbs.map((crumb, index) => {
						const path = crumbs.slice(0, index + 1).join("/");
						return (
							<React.Fragment key={path}>
								<ChevronRight className="size-3 text-muted-foreground" />
								<Button variant="ghost" className="min-h-11 max-w-40 px-2" onClick={() => setPrefix(path)}>
									<span className="truncate">{crumb}</span>
								</Button>
							</React.Fragment>
						);
					})}
				</div>
			</section>

			{canList ? (
			<div
				className={cn(
					"flex h-[40rem] max-h-[calc(100vh-14rem)] min-h-0 gap-4 overflow-hidden",
					dragOver && canWrite && "rounded-lg ring-2 ring-primary",
				)}
				onDragOver={(event) => {
					event.preventDefault();
					if (canWrite) setDragOver(true);
				}}
				onDragLeave={() => setDragOver(false)}
				onDrop={(event) => {
					event.preventDefault();
					setDragOver(false);
					if (!canWrite) return;
					openUpload(Array.from(event.dataTransfer.files ?? []));
				}}
			>
				<div className="h-full min-h-0 w-64 shrink-0">
					<FileManagerFolderTree
						key={`${resourceId}:${treeVersion}`}
						currentPath={prefix ? `/${prefix}` : "/"}
						expandPath={prefix ? `/${prefix}` : "/"}
						onPathSelect={(path) => setPrefix(path === "/" ? "" : path.replace(/^\/+/, ""))}
						onLoadFolder={loadFolderTree}
						className="h-full overflow-hidden rounded-lg"
					/>
				</div>
				<div className="h-full min-h-0 min-w-0 flex-1 overflow-auto rounded-lg border bg-card">
					{listing.isLoading && pages.length === 0 ? (
						<StorageFilesSkeleton cards={view === "cards"} />
					) : listing.isError ? (
						<Alert variant="destructive" className="m-4">
							<AlertDescription>{listing.error.message}</AlertDescription>
						</Alert>
					) : rows.length === 0 ? (
						<div className="flex h-full min-h-48 flex-col items-center justify-center gap-2 p-6 text-center">
							<p className="text-sm font-medium">This folder is empty</p>
							<p className="max-w-sm text-sm text-muted-foreground">
								{canWrite ? "Upload files or create a folder." : "Nothing is stored here."}
							</p>
						</div>
					) : view === "cards" ? (
						<div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-3 lg:grid-cols-4">
							{rows.map((row) => (
								<button
									key={row.key}
									type="button"
									className={cn(
										"flex min-h-24 flex-col items-start gap-2 rounded-lg border p-3 text-left",
										selected.includes(row.key) && "border-primary bg-primary/5",
									)}
									onClick={() => (row.kind === "folder" ? setPrefix(row.key) : void downloadFile(row.key, row.name))}
								>
									<FileManagerTypeIcon item={{ type: row.kind, name: row.name }} className="size-5" size={20} />
									<span className="line-clamp-2 text-sm">{row.name}</span>
									<span className="text-xs text-muted-foreground">
										{row.kind === "folder" ? "Folder" : formatFileBytes(row.size)}
									</span>
								</button>
							))}
						</div>
					) : (
						<ul className="divide-y">
							{rows.map((row) => (
								<li key={row.key} className="flex items-center gap-2 px-2 py-1">
									<Checkbox
										className="size-5"
										checked={selected.includes(row.key)}
										onCheckedChange={(checked) => {
											setSelected((current) =>
												checked ? [...current, row.key] : current.filter((key) => key !== row.key),
											);
										}}
										aria-label={`Select ${row.name}`}
									/>
									<button
										type="button"
										className="flex min-h-11 min-w-0 flex-1 items-center gap-2 text-left"
										onClick={() => (row.kind === "folder" ? setPrefix(row.key) : void downloadFile(row.key, row.name))}
									>
										<FileManagerTypeIcon item={{ type: row.kind, name: row.name }} className="size-4 shrink-0" size={16} />
										<span className="truncate text-sm">{row.name}</span>
									</button>
									<span className="hidden w-24 shrink-0 text-right text-xs text-muted-foreground sm:block">
										{row.kind === "file" ? formatFileBytes(row.size) : ""}
									</span>
									<span className="hidden w-36 shrink-0 text-right text-xs text-muted-foreground md:block">
										{row.modified ? format(new Date(row.modified), "d MMM yyyy HH:mm") : ""}
									</span>
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button variant="ghost" className="size-11" aria-label={`Actions for ${row.name}`}>
												<MoreHorizontal className="size-4" />
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent align="end">
											{row.kind === "folder" ? (
												<DropdownMenuItem className="min-h-11" onClick={() => setPrefix(row.key)}>
													Open
												</DropdownMenuItem>
											) : (
												<DropdownMenuItem className="min-h-11" onClick={() => void downloadFile(row.key, row.name)}>
													Download
												</DropdownMenuItem>
											)}
											{row.kind === "file" && row.name.toLowerCase().endsWith(".zip") ? (
												<DropdownMenuItem className="min-h-11" disabled={!canWrite} onClick={() => void extract(row.key)}>
													Unpack
												</DropdownMenuItem>
											) : null}
											<DropdownMenuSeparator />
											<DropdownMenuItem className="min-h-11" disabled={!canWrite} onClick={() => openRename(row)}>
												Rename
											</DropdownMenuItem>
											<DropdownMenuItem
												className="min-h-11"
												disabled={!canWrite || row.kind === "folder"}
												onClick={() => {
													setSelected([row.key]);
													setMoveFolder(parentPrefix(row.key));
													setMoveName(row.name);
													setMoveOpen(true);
												}}
											>
												Move
											</DropdownMenuItem>
											<DropdownMenuItem
												className="min-h-11 text-destructive"
												disabled={!canWrite}
												onClick={() => {
													setSelected([row.key]);
													setDeleteOpen(true);
												}}
											>
												Remove
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								</li>
							))}
						</ul>
					)}
					{loadingMore ? <StorageFilesSkeleton cards={view === "cards"} rows={3} /> : null}
					{nextToken ? (
						<div className="border-t p-3">
							<Button
								variant="outline"
								className="min-h-11"
								disabled={listing.isFetching || loadingMore}
								onClick={() => {
									if (!nextToken || loadingMore) return;
									setLoadingMore(true);
									void utils.niscStorage.listObjects
										.fetch({ resourceId, prefix, maxKeys: 100, cursor: nextToken })
										.then((page) => setExtraPages((current) => [...current, page]))
										.finally(() => setLoadingMore(false));
								}}
							>
								Load more
							</Button>
						</div>
					) : null}
				</div>
			</div>
			) : null}

			<RenameFileDialog
				open={renameOpen}
				onOpenChange={setRenameOpen}
				item={renameItem}
				isRenaming={busy === "Renaming"}
				onConfirm={confirmRename}
			/>
			<NewFolderDialog
				open={folderOpen}
				onOpenChange={setFolderOpen}
				isCreating={busy === "Creating folder"}
				currentPath={prefix ? `/${prefix}` : "/"}
				onConfirm={async (folderName) => {
					const nameError = fileNameError(folderName);
					if (nameError) {
						toast.error(nameError);
						throw new Error(nameError);
					}
					setBusy("Creating folder");
					try {
						await utils.client.niscStorage.createFolder.mutate({
							resourceId,
							prefix: joinPrefix(prefix, folderName.trim()),
						});
						toast.success(`Created ${folderName.trim()}`);
						await refresh();
					} catch (error) {
						toast.error(errorMessage(error));
						throw error;
					} finally {
						setBusy(null);
					}
				}}
			/>
			<DeleteFileDialog
				open={deleteOpen}
				onOpenChange={setDeleteOpen}
				item={deleteItems[0] ?? null}
				additionalItems={deleteItems.slice(1)}
				isDeleting={busy === "Removing"}
				onConfirm={() => removeRows(selectedRows)}
			/>
			<StorageUploadDialog
				open={uploadOpen}
				onOpenChange={setUploadOpen}
				resourceId={resourceId}
				prefix={prefix}
				maxObjectBytes={Number(resource.data?.maxObjectBytes ?? "0")}
				quotaBytes={resource.data?.quotaBytes ?? "0"}
				usedBytes={resource.data?.usedBytes ?? "0"}
				initialFiles={uploadSeed}
				onUploaded={() => void refresh()}
			/>
			<StorageDownloadDialog
				open={download !== null}
				title={download?.title ?? "Preparing your file"}
				detail={download?.detail ?? "Getting the download ready."}
				percent={download?.percent ?? 0}
			/>
			<Dialog open={moveOpen} onOpenChange={setMoveOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Move {selectedRows.filter((row) => row.kind === "file").length === 1 ? "file" : "files"}</DialogTitle>
						<DialogDescription>Folders stay where they are. Choose the folder for the selected files.</DialogDescription>
					</DialogHeader>
					<div className="grid gap-3">
						<div className="grid gap-1.5">
							<Label>Folder</Label>
							<Select value={moveFolder || "/"} onValueChange={(value) => setMoveFolder(value === "/" ? "" : value)}>
								<SelectTrigger className="min-h-11">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="/">All files</SelectItem>
									{prefix ? <SelectItem value={prefix}>This folder</SelectItem> : null}
									{parentPrefix(prefix) ? <SelectItem value={parentPrefix(prefix)}>Folder above</SelectItem> : null}
									{rows
										.filter((row) => row.kind === "folder")
										.map((folder) => (
											<SelectItem key={folder.key} value={folder.key}>
												{folder.name}
											</SelectItem>
										))}
								</SelectContent>
							</Select>
						</div>
						{selectedRows.filter((row) => row.kind === "file").length === 1 ? (
							<div className="grid gap-1.5">
								<Label htmlFor="move-file-name">File name</Label>
								<Input id="move-file-name" value={moveName} onChange={(event) => setMoveName(event.target.value)} className="min-h-11" />
							</div>
						) : null}
					</div>
					<DialogFooter className="gap-2">
						<Button variant="outline" className="min-h-11" onClick={() => setMoveOpen(false)}>
							Cancel
						</Button>
						<Button className="min-h-11" disabled={Boolean(busy)} onClick={() => void moveFiles()}>
							{busy === "Moving" ? "Moving…" : "Move"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
