"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { toast } from "@/components/ui/sonner";
import { trpc } from "@/utils/trpc";

import {
	bytesFromFileMegabytes,
	bytesFromPlanGigabytes,
	errorMessage,
	formatPlanBytes,
	gigabytesFromPlanBytes,
	megabytesFromFileBytes,
} from "./format";

const BUCKET_NAME = /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/;
const MAX_SIZE_GB = 11000;
const MAX_FILE_MB = 5 * 1024;

function bucketNameFromTyping(value: string): string {
	return value.toLowerCase().replace(/^\s+/, "").replace(/\s+/g, "-").replace(/-+/g, "-");
}

function formatSizeChoice(gigabytes: number): string {
	if (gigabytes >= 1000) {
		const terabytes = gigabytes / 1000;
		return `${Number.isInteger(terabytes) ? terabytes.toFixed(0) : terabytes.toFixed(1)} TB`;
	}
	return `${gigabytes} GB`;
}

function formatFileChoice(megabytes: number): string {
	if (megabytes >= 1024) {
		const gigabytes = megabytes / 1024;
		return `${Number.isInteger(gigabytes) ? gigabytes.toFixed(0) : gigabytes.toFixed(1)} GB`;
	}
	return `${megabytes} MB`;
}

export function InternalBucketDialog({
	open,
	onOpenChange,
	onCreated,
	existing = null,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onCreated?: (resourceId: string) => void;
	existing?: { id: string; quotaBytes: string; maxObjectBytes: string } | null;
}) {
	const utils = trpc.useUtils();
	const [bucketName, setBucketName] = React.useState("");
	const [label, setLabel] = React.useState("");
	const [gigabytes, setGigabytes] = React.useState(10);
	const [sizeText, setSizeText] = React.useState("10");
	const [fileMegabytes, setFileMegabytes] = React.useState(100);
	const [fileText, setFileText] = React.useState("100");
	const quotaBytes = bytesFromPlanGigabytes(gigabytes);
	const existingId = existing?.id;
	const existingQuota = existing?.quotaBytes;
	const existingMax = existing?.maxObjectBytes;
	const editing = Boolean(existingId);
	const capacity = trpc.niscStorage.capacity.useQuery(
		{ quotaBytes: quotaBytes ?? "0", resourceId: existingId },
		{ enabled: open && Boolean(quotaBytes) },
	);
	const create = trpc.niscStorage.createInternal.useMutation({
		onSuccess: async (created) => {
			await utils.niscStorage.list.invalidate();
			toast.success(`Created ${created.bucketName ?? bucketName}`);
			onCreated?.(created.id);
			onOpenChange(false);
		},
		onError: (error) => toast.error(errorMessage(error)),
	});
	const update = trpc.niscStorage.updateInternal.useMutation({
		onSuccess: async () => {
			await utils.niscStorage.list.invalidate();
			if (existingId) await utils.niscStorage.get.invalidate({ resourceId: existingId });
			toast.success("Bucket limits updated.");
			onOpenChange(false);
		},
		onError: (error) => toast.error(errorMessage(error)),
	});

	React.useEffect(() => {
		if (!open) return;
		if (existingId && existingQuota && existingMax) {
			const nextGigabytes = gigabytesFromPlanBytes(existingQuota);
			const nextMegabytes = megabytesFromFileBytes(existingMax);
			setGigabytes(nextGigabytes);
			setSizeText(String(nextGigabytes));
			setFileMegabytes(nextMegabytes);
			setFileText(String(nextMegabytes));
			return;
		}
		setBucketName("");
		setLabel("");
		setGigabytes(10);
		setSizeText("10");
		setFileMegabytes(100);
		setFileText("100");
	}, [open, existingId, existingQuota, existingMax]);

	const name = bucketName;
	const nameError = name && !BUCKET_NAME.test(name) ? "Use 3 to 63 lowercase letters, numbers, and hyphens." : null;
	const fileBytes = bytesFromFileMegabytes(fileMegabytes);
	const tooBig = Boolean(quotaBytes && fileBytes && BigInt(fileBytes) > BigInt(quotaBytes));
	const fits = capacity.data?.fits;
	const fileMax = Math.max(1, Math.min(MAX_FILE_MB, Math.floor(Number(quotaBytes ?? "0") / (1024 * 1024)) || 1));
	const typedSize = Number(sizeText);
	const typedFile = Number(fileText);
	const sizeReady = typedSize === gigabytes && typedSize >= 1 && typedSize <= MAX_SIZE_GB;
	const fileReady = typedFile === fileMegabytes && typedFile >= 1 && typedFile <= fileMax;
	const saving = create.isPending || update.isPending;
	const canSave = Boolean(
		quotaBytes && !tooBig && sizeReady && fileReady && fits !== false && !saving && (editing || (name && !nameError)),
	);

	const applySize = (next: number) => {
		const clamped = Number.isFinite(next) ? Math.min(MAX_SIZE_GB, Math.max(1, Math.round(next))) : gigabytes;
		setGigabytes(clamped);
		setSizeText(String(clamped));
	};

	const applyFile = (next: number, max = fileMax) => {
		const clamped = Number.isFinite(next) ? Math.min(max, Math.max(1, Math.round(next))) : Math.min(fileMegabytes, max);
		setFileMegabytes(clamped);
		setFileText(String(clamped));
	};

	React.useEffect(() => {
		if (fileMegabytes <= fileMax) return;
		setFileMegabytes(fileMax);
		setFileText(String(fileMax));
	}, [fileMax, fileMegabytes]);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{editing ? "Bucket limits" : "Internal bucket"}</DialogTitle>
					<DialogDescription>
						{editing
							? "Change this bucket's size or the largest file it accepts. The name stays the same."
							: "A bucket for Nisc Cloud use. It is not on a customer plan. Choose the name and size before it is created."}
					</DialogDescription>
				</DialogHeader>
				<div className="grid gap-4">
					{editing ? null : (
					<>
					<div className="grid gap-1.5">
						<Label htmlFor="internal-bucket-name">Bucket name</Label>
						<Input
							id="internal-bucket-name"
							value={bucketName}
							onChange={(event) => setBucketName(bucketNameFromTyping(event.target.value))}
							autoComplete="off"
							className="min-h-11"
							placeholder="nisc-internal"
						/>
						{nameError ? <p className="text-xs text-destructive">{nameError}</p> : null}
					</div>
					<div className="grid gap-1.5">
						<Label htmlFor="internal-bucket-label">Label</Label>
						<Input
							id="internal-bucket-label"
							value={label}
							onChange={(event) => setLabel(event.target.value)}
							className="min-h-11"
							placeholder="Optional name in the list"
						/>
					</div>
					</>
					)}
					<div className="grid gap-2">
						<div className="flex items-center justify-between gap-3">
							<Label htmlFor="internal-bucket-size">Bucket size</Label>
							<p className="text-sm font-medium tabular-nums">{formatSizeChoice(gigabytes)}</p>
						</div>
						<Slider
							min={1}
							max={MAX_SIZE_GB}
							step={1}
							value={[gigabytes]}
							onValueChange={(value) => applySize(value[0] ?? 1)}
							className="py-3"
							aria-label="Bucket size"
						/>
						<div className="flex items-center gap-2">
							<Input
								id="internal-bucket-size"
								inputMode="numeric"
								autoComplete="off"
								value={sizeText}
								onChange={(event) => {
									const digits = event.target.value.replace(/\D/g, "");
									setSizeText(digits);
									const next = Number(digits);
									if (Number.isInteger(next) && next >= 1 && next <= MAX_SIZE_GB) setGigabytes(next);
								}}
								onBlur={() => applySize(Number(sizeText))}
								className="min-h-11 w-28 text-right tabular-nums"
								aria-label="Bucket size in gigabytes"
							/>
							<span className="text-sm text-muted-foreground">GB</span>
						</div>
						<p className="text-xs text-muted-foreground">Type a size in GB, or use the slider. 1 GB to 11 TB. It shows TB from 1 TB.</p>
					</div>
					<div className="grid gap-2">
						<div className="flex items-center justify-between gap-3">
							<Label htmlFor="internal-bucket-file">File limit</Label>
							<p className="text-sm font-medium tabular-nums">{formatFileChoice(Math.min(fileMegabytes, fileMax))}</p>
						</div>
						<Slider
							min={1}
							max={fileMax}
							step={1}
							value={[Math.min(fileMegabytes, fileMax)]}
							onValueChange={(value) => applyFile(value[0] ?? 1)}
							className="py-3"
							aria-label="File limit"
						/>
						<div className="flex items-center gap-2">
							<Input
								id="internal-bucket-file"
								inputMode="numeric"
								autoComplete="off"
								value={fileText}
								onChange={(event) => {
									const digits = event.target.value.replace(/\D/g, "");
									setFileText(digits);
									const next = Number(digits);
									if (Number.isInteger(next) && next >= 1 && next <= fileMax) setFileMegabytes(next);
								}}
								onBlur={() => applyFile(Number(fileText))}
								className="min-h-11 w-28 text-right tabular-nums"
								aria-label="File limit in megabytes"
							/>
							<span className="text-sm text-muted-foreground">MB</span>
						</div>
						<p className="text-xs text-muted-foreground">Type a limit in MB, or use the slider. Up to 5 GB, and no larger than the bucket. It shows GB from 1 GB.</p>
					</div>
					{tooBig ? <p className="text-xs text-destructive">The file limit has to fit inside the bucket.</p> : null}
					<p className="text-xs text-muted-foreground">
						{capacity.isFetching
							? "Checking remaining space…"
							: capacity.data
								? `${formatPlanBytes(capacity.data.remainingBytes)} left of ${formatPlanBytes(capacity.data.commercialBytes)}.`
								: "Checking the remaining space."}
						{fits === false ? " This size is larger than the space left." : ""}
					</p>
				</div>
				<DialogFooter className="gap-2">
					<Button variant="outline" className="min-h-11" onClick={() => onOpenChange(false)}>
						Cancel
					</Button>
					<Button
						className="min-h-11"
						disabled={!canSave}
						onClick={() => {
							if (!quotaBytes || !fileBytes || !canSave) return;
							if (existingId) {
								update.mutate({ resourceId: existingId, quotaBytes, maxObjectBytes: fileBytes });
								return;
							}
							create.mutate({
								bucketName: name,
								label: label.trim() || undefined,
								quotaBytes,
								maxObjectBytes: fileBytes,
							});
						}}
					>
						{saving ? (editing ? "Saving…" : "Creating…") : editing ? "Save limits" : "Create bucket"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
