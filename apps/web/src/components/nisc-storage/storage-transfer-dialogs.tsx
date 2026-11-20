"use client";

import * as React from "react";
import { Trash2, Upload } from "lucide-react";

import { UploadProgressRing } from "@/components/upload-progress-ring";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Dropzone } from "@/components/ui/shadcn-io/dropzone";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";

import { holdActiveTransfer } from "@/lib/active-transfer";

import { contentTypeFor, errorMessage, fileNameError, formatFileBytes } from "./format";

const MAX_FILES = 20;
const UPLOAD_RETRIES = 3;
const UPLOAD_BATCH = 3;

function uploadWasAborted(error: unknown) {
	return error instanceof DOMException && error.name === "AbortError";
}

/** Quota, size, and name clashes will fail the same way on every try. */
function retryWouldNotHelp(error: unknown) {
	const message = errorMessage(error).toLowerCase();
	return (
		message.includes("already in this folder") ||
		message.includes("larger than") ||
		message.includes("quota") ||
		message.includes("not allowed")
	);
}

function uploadLimit(maxObjectBytes: number, quotaBytes: string, usedBytes: string) {
	const quota = Number(quotaBytes);
	const used = Number(usedBytes);
	const remaining = Number.isFinite(quota) && Number.isFinite(used) ? Math.max(0, quota - used) : null;
	const fileCap = maxObjectBytes > 0 ? maxObjectBytes : null;
	if (remaining === null && fileCap === null) return null;
	if (fileCap !== null && (remaining === null || fileCap < remaining)) {
		return { bytes: fileCap, kind: "file" as const };
	}
	return { bytes: remaining ?? 0, kind: remaining === 0 ? ("full" as const) : ("space" as const) };
}

function rejectedFileMessage(name: string, limit: ReturnType<typeof uploadLimit>) {
	if (!limit || limit.kind === "full") return `${name} was not added. This bucket has no space left.`;
	if (limit.kind === "space") {
		return `${name} is larger than the ${formatFileBytes(limit.bytes)} left in this bucket.`;
	}
	return `${name} is larger than this bucket's ${formatFileBytes(limit.bytes)} file limit.`;
}

type Phase = "choose" | "uploading" | "cancelling";

function putFile(
	url: string,
	file: File,
	contentType: string,
	onProgress: (loaded: number) => void,
	signal: AbortSignal,
): Promise<void> {
	return new Promise((resolve, reject) => {
		if (signal.aborted) {
			reject(new DOMException("Aborted", "AbortError"));
			return;
		}
		const xhr = new XMLHttpRequest();
		const abort = () => {
			xhr.abort();
			reject(new DOMException("Aborted", "AbortError"));
		};
		signal.addEventListener("abort", abort, { once: true });
		xhr.open("PUT", url);
		xhr.withCredentials = true;
		xhr.setRequestHeader("Content-Type", contentType);
		xhr.upload.onprogress = (event) => {
			onProgress(event.loaded > 0 ? event.loaded : 0);
		};
		xhr.onload = () => {
			signal.removeEventListener("abort", abort);
			if (signal.aborted) return;
			if (xhr.status >= 200 && xhr.status < 300) resolve();
			else {
				let message = `${file.name} was not stored.`;
				try {
					const parsed = JSON.parse(xhr.responseText) as { message?: string };
					if (parsed.message) message = parsed.message;
				} catch {
					// The panel returns JSON. A proxy error may not.
				}
				reject(new Error(message));
			}
		};
		xhr.onerror = () => {
			signal.removeEventListener("abort", abort);
			if (!signal.aborted) reject(new Error(`${file.name} was not stored.`));
		};
		xhr.send(file);
	});
}

export function StorageUploadDialog({
	open,
	onOpenChange,
	resourceId,
	prefix,
	maxObjectBytes,
	quotaBytes,
	usedBytes,
	initialFiles,
	onUploaded,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	resourceId: string;
	prefix: string;
	maxObjectBytes: number;
	quotaBytes: string;
	usedBytes: string;
	initialFiles: File[];
	onUploaded: () => void;
}) {
	const utils = trpc.useUtils();
	const [files, setFiles] = React.useState<File[]>([]);
	const [phase, setPhase] = React.useState<Phase>("choose");
	const [percent, setPercent] = React.useState(0);
	const [label, setLabel] = React.useState<string | undefined>();
	const [note, setNote] = React.useState("Uploading to this bucket…");
	const [sentText, setSentText] = React.useState<string | null>(null);
	const wasOpen = React.useRef(false);
	const cancelRequested = React.useRef(false);
	const abortRef = React.useRef<AbortController | null>(null);
	const locked = phase !== "choose";

	React.useEffect(() => {
		if (!locked) return;
		return holdActiveTransfer();
	}, [locked]);
	const limit = uploadLimit(maxObjectBytes, quotaBytes, usedBytes);

	const explainRejection = (file: File) => {
		toast.error(rejectedFileMessage(file.name, limit));
	};

	React.useEffect(() => {
		if (open && !wasOpen.current) {
			const kept: File[] = [];
			for (const file of initialFiles) {
				if (limit && file.size > limit.bytes) explainRejection(file);
				else kept.push(file);
			}
			setFiles(kept);
			setPhase("choose");
			setPercent(0);
			setLabel(undefined);
			setNote("Uploading to this bucket…");
			cancelRequested.current = false;
		}
		wasOpen.current = open;
	}, [open, initialFiles]);

	const duplicate = files.some((file, index) => files.findIndex((other) => other.name === file.name) !== index);
	const totalSize = files.reduce((sum, file) => sum + file.size, 0);

	const addFiles = (incoming: File[]) => {
		if (locked) return;
		setFiles((current) => {
			const room = MAX_FILES - current.length;
			if (room <= 0) {
				toast.error(`Upload up to ${MAX_FILES} files at a time.`);
				return current;
			}
			const batch = incoming.slice(0, room);
			if (batch.length < incoming.length) toast.error(`Only ${room} more file${room === 1 ? "" : "s"} can be added.`);
			const accepted: File[] = [];
			for (const file of batch) {
				const nameError = fileNameError(file.name);
				if (nameError) {
					toast.error(`${file.name}: ${nameError}`);
					continue;
				}
				if (file.size <= 0) {
					toast.error(`${file.name} is empty.`);
					continue;
				}
				if (limit && file.size > limit.bytes) {
					explainRejection(file);
					continue;
				}
				accepted.push(file);
			}
			return [...current, ...accepted];
		});
	};

	const rollback = async (sent: { key: string; completed: boolean }[]) => {
		setPhase("cancelling");
		setLabel("Removing sent files");
		for (const item of sent) {
			if (item.completed) {
				await utils.client.niscStorage.deleteObject.mutate({ resourceId, key: item.key });
				continue;
			}
			await utils.client.niscStorage.cancelUpload.mutate({ resourceId, key: item.key }).catch(async () => {
				await utils.client.niscStorage.deleteObject.mutate({ resourceId, key: item.key }).catch(() => undefined);
			});
		}
	};

	const releaseUnfinished = async (key: string) => {
		await utils.client.niscStorage.cancelUpload.mutate({ resourceId, key }).catch(async () => {
			await utils.client.niscStorage.deleteObject.mutate({ resourceId, key }).catch(() => undefined);
		});
	};

	const startUpload = async () => {
		if (files.length === 0 || duplicate || locked) return;
		cancelRequested.current = false;
		const controller = new AbortController();
		abortRef.current = controller;
		setPhase("uploading");
		setPercent(0);
		setSentText(null);
		setNote("Uploading to this bucket…");
		const sent: { key: string; completed: boolean }[] = [];
		const total = files.reduce((sum, file) => sum + file.size, 0);
		let doneBytes = 0;
		let storedCount = 0;
		let rolledBack = false;
		const failed: { file: File; message: string }[] = [];
		const undo = async () => {
			if (rolledBack) return;
			rolledBack = true;
			await rollback(sent);
		};
		const stop = () => {
			if (cancelRequested.current) throw new DOMException("Aborted", "AbortError");
		};
		const moving = new Map<string, number>();
		let lastPaint = 0;
		const paint = (force = false) => {
			const now = Date.now();
			if (!force && now - lastPaint < 100) return;
			lastPaint = now;
			let active = 0;
			for (const loaded of moving.values()) active += loaded;
			const sentBytes = doneBytes + active;
			if (total > 0) setPercent(Math.min(100, (sentBytes / total) * 100));
			setSentText(`${formatFileBytes(sentBytes)} of ${formatFileBytes(total)}`);
			const names = [...moving.keys()];
			setLabel(names.length <= 1 ? names[0] : `${names.length} files`);
		};
		try {
			let round = files.map((file) => ({ file, attempt: 0 }));
			while (round.length > 0) {
				const again: typeof round = [];
				let cursor = 0;
				setNote(round.some((item) => item.attempt > 0) ? "Retrying files that did not store…" : "Uploading to this bucket…");
				const uploadOne = async (item: (typeof round)[number]) => {
					stop();
					const file = item.file;
					if (item.attempt > 0) setLabel(`Retry ${item.attempt} of ${UPLOAD_RETRIES}: ${file.name}`);
					let key: string | null = null;
					try {
						const created = await utils.client.niscStorage.createUploadUrl.mutate({
							resourceId,
							prefix,
							fileName: file.name.trim(),
							contentType: contentTypeFor(file),
							fileSize: file.size,
						});
						key = created.key;
						sent.push({ key, completed: false });
						stop();
						moving.set(file.name, 0);
						paint(true);
						await putFile(
							created.uploadUrl,
							file,
							contentTypeFor(file),
							(loaded) => {
								moving.set(file.name, Math.min(loaded, file.size));
								paint();
							},
							controller.signal,
						);
						stop();
						await utils.client.niscStorage.completeUpload.mutate({ resourceId, key: created.key });
						moving.delete(file.name);
						const row = sent.find((entry) => entry.key === key);
						if (row) row.completed = true;
						storedCount += 1;
						doneBytes += file.size;
						paint(true);
					} catch (error) {
						moving.delete(file.name);
						paint(true);
						if (cancelRequested.current || uploadWasAborted(error)) {
							throw new DOMException("Aborted", "AbortError");
						}
						if (key) {
							await releaseUnfinished(key);
							const index = sent.findIndex((entry) => entry.key === key && !entry.completed);
							if (index >= 0) sent.splice(index, 1);
						}
						const message = errorMessage(error);
						if (retryWouldNotHelp(error) || item.attempt >= UPLOAD_RETRIES) failed.push({ file, message });
						else again.push({ file, attempt: item.attempt + 1 });
					}
				};
				const workers = Array.from({ length: Math.min(UPLOAD_BATCH, round.length) }, async () => {
					while (cursor < round.length) {
						const item = round[cursor];
						cursor += 1;
						if (!item) return;
						await uploadOne(item);
					}
				});
				const settled = await Promise.allSettled(workers);
				if (
					cancelRequested.current ||
					settled.some((result) => result.status === "rejected" && uploadWasAborted(result.reason))
				) {
					throw new DOMException("Aborted", "AbortError");
				}
				round = again;
			}
			if (storedCount > 0) {
				toast.success(storedCount === 1 ? "Uploaded 1 file" : `Uploaded ${storedCount} files`);
				onUploaded();
			}
			if (failed.length > 0) {
				toast.error(
					failed.length === 1 ? failed[0]!.message : `${failed.length} files were not stored after 3 tries.`,
					failed.length === 1 ? undefined : { description: failed.map((item) => item.file.name).join(", ") },
				);
				setFiles(failed.map((item) => item.file));
				setPhase("choose");
				setPercent(0);
				setLabel(undefined);
				setNote("Uploading to this bucket…");
				return;
			}
			setPercent(100);
			onOpenChange(false);
		} catch (error) {
			if (cancelRequested.current || uploadWasAborted(error)) {
				try {
					await undo();
					toast.success("Upload cancelled. Sent files were removed.");
					onUploaded();
				} catch (cleanupError) {
					toast.error(errorMessage(cleanupError));
				}
				setPhase("choose");
				setPercent(0);
				setLabel(undefined);
				setNote("Uploading to this bucket…");
				return;
			}
			toast.error(errorMessage(error));
			if (sent.some((item) => item.completed)) onUploaded();
			setPhase("choose");
			setPercent(0);
			setLabel(undefined);
			setNote("Uploading to this bucket…");
		} finally {
			abortRef.current = null;
		}
	};

	const requestCancel = () => {
		if (phase === "cancelling") return;
		if (phase !== "uploading") {
			onOpenChange(false);
			return;
		}
		cancelRequested.current = true;
		abortRef.current?.abort();
		setPhase("cancelling");
		setLabel("Removing sent files");
	};

	return (
		<Dialog open={open} onOpenChange={(next) => (locked && !next ? undefined : onOpenChange(next))}>
			<DialogContent
				showCloseButton={!locked}
				onEscapeKeyDown={(event) => {
					if (locked) event.preventDefault();
				}}
				onPointerDownOutside={(event) => {
					if (locked) event.preventDefault();
				}}
				onInteractOutside={(event) => {
					if (locked) event.preventDefault();
				}}
			>
				<DialogHeader>
					<DialogTitle>Upload files</DialogTitle>
					<DialogDescription>
						{locked
							? "This stays open until the upload finishes or the sent files are removed."
							: "Drop files here, take any of them off the list, or add more. They go into the folder you have open."}
					</DialogDescription>
				</DialogHeader>
				{locked ? (
					<div className="flex flex-col items-center gap-2 px-4 py-8">
						<UploadProgressRing percent={percent} size={88} strokeWidth={5} label={label} />
						<p className="text-center text-xs text-muted-foreground">
							{phase === "cancelling" ? "Removing files that already went up…" : sentText ?? note}
						</p>
					</div>
				) : (
					<div className="grid gap-3">
						<Dropzone
							onDrop={(accepted, rejections) => {
								let reportedCount = false;
								for (const rejection of rejections) {
									const codes = rejection.errors.map((error) => error.code);
									if (codes.includes("file-too-large")) explainRejection(rejection.file);
									else if (codes.includes("too-many-files")) reportedCount = true;
									else toast.error(rejection.errors[0]?.message ?? `${rejection.file.name} was not added.`);
								}
								if (reportedCount) toast.error(`Upload up to ${MAX_FILES} files at a time.`);
								addFiles(accepted);
							}}
							maxSize={limit && limit.bytes > 0 ? limit.bytes : undefined}
							validator={
								limit?.bytes === 0
									? () => ({ code: "file-too-large", message: "This bucket has no space left." })
									: undefined
							}
							maxFiles={Math.max(1, MAX_FILES - files.length)}
							disabled={files.length >= MAX_FILES}
							src={files.length > 0 ? files : undefined}
							className={cn("h-auto min-h-0 w-full", files.length > 0 ? "py-4" : "py-8")}
						>
							<div className="flex flex-col items-center gap-2 text-center">
								<div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
									<Upload className="size-5 text-primary" />
								</div>
								<p className="text-sm font-medium">
									{files.length > 0 ? "Drop more files or click to add" : "Drop files here or click to browse"}
								</p>
								<p className="text-[11px] text-muted-foreground">
									Up to {MAX_FILES} files
									{limit && limit.kind === "file" ? `. Larger than ${formatFileBytes(limit.bytes)} is rejected` : ""}
									{limit && limit.kind === "space" ? `. Larger than the ${formatFileBytes(limit.bytes)} left is rejected` : ""}
									{limit?.kind === "full" ? ". This bucket has no space left" : ""}
								</p>
							</div>
						</Dropzone>
						{files.length > 0 ? (
							<ScrollArea className="max-h-48 rounded-md border">
								<ul className="divide-y">
									{files.map((file, index) => (
										<li key={`${file.name}:${file.size}:${file.lastModified}:${index}`} className="flex items-center gap-2 px-3 py-2">
											<div className="min-w-0 flex-1">
												<p className="truncate text-sm font-medium">{file.name}</p>
												<p className="text-xs text-muted-foreground">{formatFileBytes(file.size)}</p>
											</div>
											<Button
												type="button"
												variant="ghost"
												className="size-11 shrink-0 text-muted-foreground hover:text-destructive"
												aria-label={`Remove ${file.name}`}
												onClick={() => setFiles((current) => current.filter((_, itemIndex) => itemIndex !== index))}
											>
												<Trash2 className="size-4" />
											</Button>
										</li>
									))}
								</ul>
							</ScrollArea>
						) : null}
						{duplicate ? <p className="text-xs text-destructive">Two files in this list use the same name. Remove one of them.</p> : null}
						{files.length > 0 ? (
							<p className="text-xs text-muted-foreground">
								{files.length} file{files.length === 1 ? "" : "s"} · {formatFileBytes(totalSize)}
							</p>
						) : null}
					</div>
				)}
				<DialogFooter className="gap-2">
					<Button type="button" variant="outline" className="min-h-11" disabled={phase === "cancelling"} onClick={requestCancel}>
						{locked ? "Cancel upload" : "Cancel"}
					</Button>
					{locked ? (
						<Button type="button" className="min-h-11 min-w-32" disabled>
							<span className="flex items-center gap-2">
								<UploadProgressRing percent={percent} size={22} strokeWidth={2.5} className="gap-0 [&_span]:text-[8px]" />
								{phase === "cancelling" ? "Cancelling…" : note.startsWith("Retry") ? "Retrying…" : "Uploading…"}
							</span>
						</Button>
					) : (
						<Button type="button" className="min-h-11" disabled={files.length === 0 || duplicate} onClick={() => void startUpload()}>
							Upload files
						</Button>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

export function StorageDownloadDialog({
	open,
	title,
	detail,
	percent,
}: {
	open: boolean;
	title: string;
	detail: string;
	percent: number;
}) {
	React.useEffect(() => {
		if (!open) return;
		return holdActiveTransfer();
	}, [open]);

	return (
		<Dialog open={open} onOpenChange={() => undefined}>
			<DialogContent
				showCloseButton={false}
				onEscapeKeyDown={(event) => event.preventDefault()}
				onPointerDownOutside={(event) => event.preventDefault()}
				onInteractOutside={(event) => event.preventDefault()}
			>
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription>{detail}</DialogDescription>
				</DialogHeader>
				<div className="flex flex-col items-center gap-2 px-4 py-8">
					<UploadProgressRing percent={percent} size={88} strokeWidth={5} label={title} />
				</div>
			</DialogContent>
		</Dialog>
	);
}
