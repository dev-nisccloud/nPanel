"use client";

import * as React from "react";
import { Database, ExternalLink, RefreshCw, Trash2, Upload, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { UploadProgressRing } from "@/components/upload-progress-ring";
import { toast } from "@/components/ui/sonner";
import { type BatchUploadProgress, useObjectStorageUpload } from "@/hooks/use-object-storage-upload";
import { formatBytes } from "@/lib/object-storage-client";
import { trpc } from "@/utils/trpc";

type UploadedFileResult = {
	key: string;
	publicUrl: string;
	fileName: string;
	size: number;
};

export default function StorageTestPage() {
	const fileInputRef = React.useRef<HTMLInputElement>(null);
	const [selectedFiles, setSelectedFiles] = React.useState<File[]>([]);
	const [batchProgress, setBatchProgress] = React.useState<BatchUploadProgress | null>(null);
	const [lastUploads, setLastUploads] = React.useState<UploadedFileResult[]>([]);

	const configQuery = trpc.objectStorage.getConfig.useQuery();
	const listQuery = trpc.objectStorage.listTestObjects.useQuery(undefined, {
		enabled: configQuery.data?.configured === true,
	});

	const { uploadMany, isUploading } = useObjectStorageUpload();
	const deleteObject = trpc.objectStorage.deleteObject.useMutation({
		onSuccess: () => {
			toast.success("Object deleted");
			void listQuery.refetch();
		},
		onError: (err) => toast.error("Delete failed", { description: err.message }),
	});

	const totalSelectedBytes = React.useMemo(
		() => selectedFiles.reduce((sum, file) => sum + file.size, 0),
		[selectedFiles],
	);

	const handleFilesSelected = (fileList: FileList | null) => {
		if (!fileList?.length) return;
		setSelectedFiles((prev) => {
			const existing = new Set(prev.map((f) => `${f.name}:${f.size}:${f.lastModified}`));
			const next = [...prev];
			for (const file of Array.from(fileList)) {
				const id = `${file.name}:${file.size}:${file.lastModified}`;
				if (!existing.has(id)) {
					existing.add(id);
					next.push(file);
				}
			}
			return next;
		});
		if (fileInputRef.current) fileInputRef.current.value = "";
	};

	const removeSelectedFile = (index: number) => {
		setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
	};

	const clearSelection = () => {
		setSelectedFiles([]);
		if (fileInputRef.current) fileInputRef.current.value = "";
	};

	const handleUpload = async () => {
		if (selectedFiles.length === 0) {
			toast.error("Choose at least one file");
			return;
		}

		try {
			setBatchProgress(null);
			const results = await uploadMany(selectedFiles, {
				onProgress: setBatchProgress,
			});

			setLastUploads(
				results.map((result, index) => ({
					key: result.key,
					publicUrl: result.publicUrl,
					fileName: selectedFiles[index]?.name ?? result.key.split("/").pop() ?? "file",
					size: result.size,
				})),
			);
			clearSelection();
			toast.success(
				results.length === 1 ? "Upload complete" : `${results.length} files uploaded`,
			);
			void listQuery.refetch();
		} catch (error) {
			const message = error instanceof Error ? error.message : "Upload failed";
			toast.error("Upload failed", { description: message });
		} finally {
			setBatchProgress(null);
		}
	};

	return (
		<div className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-6">
			<div>
				<h1 className="text-2xl font-semibold tracking-tight">Object Storage Test</h1>
				<p className="text-muted-foreground mt-1 text-sm">
					Upload one or more files to MinIO via presigned URLs. This page validates the S3-compatible
					storage setup before replacing UploadThing.
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-base">
						<Database className="h-4 w-4" />
						Connection
					</CardTitle>
					<CardDescription>
						Server reads <code className="text-xs">S3_*</code> env vars from{" "}
						<code className="text-xs">apps/server/.env</code>.
					</CardDescription>
				</CardHeader>
				<CardContent>
					{configQuery.isLoading ? (
						<div className="flex items-center gap-2 text-sm text-muted-foreground">
							<Spinner variant="ellipsis" className="text-primary h-4 w-4" />
							Checking configuration…
						</div>
					) : configQuery.data?.configured ? (
						<dl className="grid gap-2 text-sm sm:grid-cols-2">
							<div>
								<dt className="text-muted-foreground">Endpoint</dt>
								<dd className="font-mono text-xs break-all">{configQuery.data.endpoint}</dd>
							</div>
							<div>
								<dt className="text-muted-foreground">Bucket</dt>
								<dd className="font-mono text-xs">{configQuery.data.bucket}</dd>
							</div>
							<div className="sm:col-span-2">
								<dt className="text-muted-foreground">Public base URL</dt>
								<dd className="font-mono text-xs break-all">{configQuery.data.publicBaseUrl}</dd>
							</div>
						</dl>
					) : (
						<div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
							<p className="font-medium">Storage not configured on the API server</p>
							<p className="mt-2 text-xs leading-relaxed opacity-90">
								Add these to <code>apps/server/.env</code> and restart the server:
							</p>
							<pre className="mt-2 overflow-x-auto rounded bg-black/5 p-3 text-[11px] leading-relaxed dark:bg-black/30">
{`S3_ENDPOINT=https://storage.nisccloud.com
S3_ACCESS_KEY=<MINIO_ROOT_USER>
S3_SECRET_KEY=<MINIO_ROOT_PASSWORD>
S3_BUCKET=npanel-uploads
S3_REGION=us-east-1
S3_PUBLIC_BASE_URL=https://storage.nisccloud.com/npanel-uploads`}
							</pre>
						</div>
					)}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle className="text-base">Upload test</CardTitle>
					<CardDescription>
						Select multiple files, then upload each via presigned URL (one at a time, sequentially).
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<input
						ref={fileInputRef}
						type="file"
						multiple
						className="block w-full text-sm file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90"
						disabled={!configQuery.data?.configured || isUploading}
						onChange={(e) => handleFilesSelected(e.target.files)}
					/>

					{selectedFiles.length > 0 ? (
						<div className="space-y-3">
							<div className="flex items-center justify-between gap-2 text-sm">
								<p className="text-muted-foreground">
									<span className="text-foreground font-medium">{selectedFiles.length}</span>{" "}
									{selectedFiles.length === 1 ? "file" : "files"} selected (
									{formatBytes(totalSelectedBytes)} total)
								</p>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									disabled={isUploading}
									onClick={clearSelection}
								>
									Clear all
								</Button>
							</div>
							<ul className="divide-y rounded-md border max-h-48 overflow-y-auto">
								{selectedFiles.map((file, index) => (
									<li key={`${file.name}:${file.size}:${file.lastModified}`} className="flex items-center gap-2 p-2 text-sm">
										<div className="min-w-0 flex-1">
											<p className="truncate font-medium">{file.name}</p>
											<p className="text-muted-foreground text-xs">{formatBytes(file.size)}</p>
										</div>
										<Button
											type="button"
											variant="ghost"
											size="icon"
											className="shrink-0 h-8 w-8"
											disabled={isUploading}
											onClick={() => removeSelectedFile(index)}
										>
											<X className="h-4 w-4" />
										</Button>
									</li>
								))}
							</ul>
						</div>
					) : null}

					{isUploading && batchProgress ? (
						<div className="flex flex-col items-center gap-2 py-2">
							<UploadProgressRing
								percent={batchProgress.overallPercent}
								size={96}
								label={`${batchProgress.fileIndex + 1} of ${batchProgress.totalCount}: ${batchProgress.fileName}`}
							/>
							<p className="text-muted-foreground text-xs">
								Current file: {batchProgress.filePercent}%
							</p>
						</div>
					) : null}

					<Button
						onClick={() => void handleUpload()}
						disabled={!configQuery.data?.configured || selectedFiles.length === 0 || isUploading}
					>
						{isUploading ? (
							<>
								<Spinner variant="ellipsis" className="mr-2 h-4 w-4" />
								Uploading…
							</>
						) : (
							<>
								<Upload className="mr-2 h-4 w-4" />
								Upload {selectedFiles.length > 1 ? `${selectedFiles.length} files` : "to MinIO"}
							</>
						)}
					</Button>

					{lastUploads.length > 0 ? (
						<div className="rounded-md border bg-muted/30 p-4 text-sm space-y-3">
							<p className="font-medium">
								Last batch ({lastUploads.length} {lastUploads.length === 1 ? "file" : "files"})
							</p>
							<ul className="divide-y rounded-md border bg-background">
								{lastUploads.map((item) => (
									<li key={item.key} className="flex items-start justify-between gap-3 p-3">
										<div className="min-w-0 flex-1">
											<p className="truncate font-medium">{item.fileName}</p>
											<p className="text-muted-foreground mt-0.5 text-xs">{formatBytes(item.size)}</p>
											<p className="text-muted-foreground mt-1 break-all font-mono text-[11px]">{item.key}</p>
										</div>
										<Button variant="outline" size="sm" className="shrink-0" asChild>
											<a href={item.publicUrl} target="_blank" rel="noreferrer">
												<ExternalLink className="mr-2 h-3.5 w-3.5" />
												Open
											</a>
										</Button>
									</li>
								))}
							</ul>
						</div>
					) : null}
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0">
					<div>
						<CardTitle className="text-base">Your test uploads</CardTitle>
						<CardDescription>Objects under storage-test/&lt;your-user-id&gt;/</CardDescription>
					</div>
					<Button
						variant="outline"
						size="sm"
						onClick={() => void listQuery.refetch()}
						disabled={listQuery.isFetching || !configQuery.data?.configured}
					>
						<RefreshCw className={`mr-2 h-3.5 w-3.5 ${listQuery.isFetching ? "animate-spin" : ""}`} />
						Refresh
					</Button>
				</CardHeader>
				<CardContent>
					{listQuery.isLoading ? (
						<div className="flex justify-center py-8">
							<Spinner variant="ellipsis" className="text-primary" />
						</div>
					) : listQuery.data?.length ? (
						<ul className="divide-y rounded-md border">
							{listQuery.data.map((item) => (
								<li key={item.key} className="flex items-start justify-between gap-3 p-3 text-sm">
									<div className="min-w-0 flex-1">
										<p className="truncate font-mono text-xs">{item.key.split("/").pop()}</p>
										<p className="text-muted-foreground mt-1 text-xs">
											{formatBytes(item.size)}
											{item.lastModified ? ` · ${new Date(item.lastModified).toLocaleString()}` : ""}
										</p>
										<a
											href={item.publicUrl}
											target="_blank"
											rel="noreferrer"
											className="text-primary mt-1 inline-flex items-center gap-1 text-xs hover:underline"
										>
											Open
											<ExternalLink className="h-3 w-3" />
										</a>
									</div>
									<Button
										variant="ghost"
										size="icon"
										className="shrink-0 text-destructive hover:text-destructive"
										disabled={deleteObject.isPending}
										onClick={() => deleteObject.mutate({ key: item.key })}
									>
										<Trash2 className="h-4 w-4" />
									</Button>
								</li>
							))}
						</ul>
					) : (
						<p className="text-muted-foreground py-8 text-center text-sm">No test uploads yet.</p>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
