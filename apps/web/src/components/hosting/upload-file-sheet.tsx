"use client";

import * as React from "react";
import {
	AlertCircle,
	Archive,
	CheckCircle2,
	File,
	FileText,
	Image,
	Plus,
	Trash2,
	Upload,
	XIcon,
} from "lucide-react";

import { UploadProgressRing } from "@/components/upload-progress-ring";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dropzone } from "@/components/ui/shadcn-io/dropzone";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Sheet,
	SheetClose,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "@/components/npanel-ui/sheet";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

const MAX_FILES = 10;
const MAX_FILE_SIZE = 50 * 1024 * 1024;

const ACCEPT = {
	"image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"],
	"text/*": [".txt", ".html", ".css", ".js", ".json", ".xml", ".md"],
	"application/pdf": [".pdf"],
	"application/zip": [".zip"],
	"application/x-rar-compressed": [".rar"],
	"application/x-7z-compressed": [".7z"],
} as const;

interface UploadFileSheetProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	hostingData: unknown;
	uploadFile: (file: File, remotePath: string) => Promise<void>;
	currentPath: string;
	isUploading: boolean;
	onSuccess?: () => void;
}

type UploadStatus = "pending" | "uploading" | "success" | "error";

function getFileIcon(file: File) {
	const type = file.type;
	if (type.startsWith("image/")) return <Image className="size-4 shrink-0 text-blue-500" />;
	if (type.includes("pdf")) return <FileText className="size-4 shrink-0 text-red-500" />;
	if (type.includes("zip") || type.includes("rar"))
		return <Archive className="size-4 shrink-0 text-orange-500" />;
	return <File className="size-4 shrink-0 text-muted-foreground" />;
}

function formatFileSize(bytes: number) {
	if (bytes === 0) return "0 B";
	const k = 1024;
	const sizes = ["B", "KB", "MB", "GB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
}

function fileKey(file: File, index: number) {
	return `${file.name}:${file.size}:${file.lastModified}:${index}`;
}

export function UploadFileSheet({
	open,
	onOpenChange,
	uploadFile,
	currentPath,
	onSuccess,
}: UploadFileSheetProps) {
	const [isSubmitting, setIsSubmitting] = React.useState(false);
	const [files, setFiles] = React.useState<File[]>([]);
	const [uploadStatus, setUploadStatus] = React.useState<Record<string, UploadStatus>>({});
	const [overallProgress, setOverallProgress] = React.useState(0);
	const [currentFileLabel, setCurrentFileLabel] = React.useState<string | undefined>();

	const resetState = React.useCallback(() => {
		setFiles([]);
		setUploadStatus({});
		setOverallProgress(0);
		setCurrentFileLabel(undefined);
		setIsSubmitting(false);
	}, []);

	const handleDrop = React.useCallback((acceptedFiles: File[], fileRejections: unknown[]) => {
		if (fileRejections.length > 0) {
			for (const rejection of fileRejections as Array<{
				file: File;
				errors: Array<{ code?: string; message?: string }>;
			}>) {
				const { file, errors } = rejection;
				for (const error of errors) {
					if (error.code === "file-too-large") {
						toast.error(`"${file.name}" is too large`, {
							description: `Max 50MB. This file is ${formatFileSize(file.size)}.`,
						});
					} else if (error.code === "file-invalid-type") {
						toast.error(`"${file.name}" is not supported`, {
							description: "Use images, PDFs, archives, or text files.",
						});
					} else if (error.code === "too-many-files") {
						toast.error("Too many files", { description: `Max ${MAX_FILES} per upload.` });
					} else {
						toast.error(`"${file.name}" was rejected`, {
							description: error.message ?? "Check the file and try again.",
						});
					}
				}
			}
		}

		if (acceptedFiles.length === 0) return;

		setFiles((prev) => {
			const remaining = MAX_FILES - prev.length;
			if (remaining <= 0) {
				toast.error(`Maximum ${MAX_FILES} files per upload`);
				return prev;
			}
			const nextBatch = acceptedFiles.slice(0, remaining);
			if (nextBatch.length < acceptedFiles.length) {
				toast.error(`Only ${remaining} more file${remaining === 1 ? "" : "s"} can be added`);
			}
			const merged = [...prev, ...nextBatch];
			setUploadStatus((status) => {
				const next = { ...status };
				for (const file of nextBatch) next[file.name] = "pending";
				return next;
			});
			return merged;
		});
	}, []);

	const removeFile = (index: number) => {
		setFiles((prev) => {
			const file = prev[index];
			if (file) {
				setUploadStatus((status) => {
					const next = { ...status };
					delete next[file.name];
					return next;
				});
			}
			return prev.filter((_, i) => i !== index);
		});
	};

	const handleSubmit = async () => {
		if (files.length === 0) return;

		setIsSubmitting(true);
		setOverallProgress(0);

		let successCount = 0;
		try {
			for (let i = 0; i < files.length; i++) {
				const file = files[i]!;
				setCurrentFileLabel(`${i + 1} of ${files.length}: ${file.name}`);
				setUploadStatus((prev) => ({ ...prev, [file.name]: "uploading" }));
				setOverallProgress(Math.round((i / files.length) * 100));

				try {
					await uploadFile(file, currentPath);
					successCount += 1;
					setUploadStatus((prev) => ({ ...prev, [file.name]: "success" }));
				} catch (error) {
					console.error(`Error uploading ${file.name}:`, error);
					setUploadStatus((prev) => ({ ...prev, [file.name]: "error" }));
				}

				setOverallProgress(Math.round(((i + 1) / files.length) * 100));
			}

			if (successCount === files.length) {
				await new Promise((resolve) => setTimeout(resolve, 400));
				resetState();
				onOpenChange(false);
				onSuccess?.();
			}
		} finally {
			setIsSubmitting(false);
			setCurrentFileLabel(undefined);
		}
	};

	const handleClose = () => {
		if (isSubmitting) return;
		resetState();
		onOpenChange(false);
	};

	const totalSize = files.reduce((sum, file) => sum + file.size, 0);
	const hasFiles = files.length > 0;
	const allUploaded = hasFiles && files.every((file) => uploadStatus[file.name] === "success");
	const hasErrors = hasFiles && files.some((file) => uploadStatus[file.name] === "error");
	const remainingSlots = Math.max(0, MAX_FILES - files.length);

	return (
		<Sheet open={open} onOpenChange={(next) => (next ? onOpenChange(true) : handleClose())}>
			<SheetContent className="overflow-y-auto sm:max-w-md">
				<SheetHeader className="mb-3 flex flex-row items-start justify-between gap-3 space-y-0">
					<div className="min-w-0">
						<SheetTitle>Upload files</SheetTitle>
						<SheetDescription>
							Add files to the current directory on your hosting account.
						</SheetDescription>
					</div>
					<SheetClose asChild>
						<Button
							size="icon"
							variant="ghost"
							className="size-8 shrink-0"
							disabled={isSubmitting}
						>
							<XIcon className="size-4" />
						</Button>
					</SheetClose>
				</SheetHeader>

				<div className="space-y-3 px-0.5 pb-1">
					{/* Combined dropzone + file list */}
					<div className="overflow-hidden rounded-xl border border-dashed border-muted-foreground/30 bg-muted/10">
						{isSubmitting ? (
							<div className="flex flex-col items-center gap-2 px-4 py-8">
								<UploadProgressRing
									percent={overallProgress}
									size={88}
									strokeWidth={5}
									label={currentFileLabel}
								/>
								<p className="text-center text-xs text-muted-foreground">
									Uploading to hosting…
								</p>
							</div>
						) : (
							<Dropzone
								onDrop={handleDrop}
								accept={ACCEPT}
								maxSize={MAX_FILE_SIZE}
								maxFiles={remainingSlots || 1}
								disabled={isSubmitting || remainingSlots === 0}
								src={hasFiles ? files : undefined}
								className={cn(
									"h-auto min-h-0 w-full rounded-none border-0 bg-transparent p-0 shadow-none",
									"hover:bg-muted/20 focus-visible:ring-0",
									hasFiles ? "items-stretch" : "py-8",
								)}
							>
								{hasFiles ? (
									<div className="w-full p-3 text-left">
										<div className="mb-2 flex items-center justify-between gap-2">
											<p className="text-xs font-medium text-foreground">
												{files.length} file{files.length === 1 ? "" : "s"} selected
											</p>
											<Badge variant="secondary" className="text-[10px] font-normal">
												{formatFileSize(totalSize)}
											</Badge>
										</div>

										<ScrollArea className="max-h-40 rounded-md border border-border/60 bg-background/80">
											<ul className="divide-y divide-border/60">
												{files.map((file, index) => {
													const status = uploadStatus[file.name] ?? "pending";
													return (
														<li
															key={fileKey(file, index)}
															className={cn(
																"flex items-center gap-2 px-2.5 py-2",
																status === "success" && "bg-green-500/5",
																status === "error" && "bg-destructive/5",
															)}
														>
															{getFileIcon(file)}
															<div className="min-w-0 flex-1">
																<p className="truncate text-xs font-medium" title={file.name}>
																	{file.name}
																</p>
																<p className="text-[10px] text-muted-foreground">
																	{formatFileSize(file.size)}
																</p>
															</div>
															{status === "success" ? (
																<CheckCircle2 className="size-3.5 shrink-0 text-green-600" />
															) : status === "error" ? (
																<AlertCircle className="size-3.5 shrink-0 text-destructive" />
															) : (
																<Button
																	type="button"
																	variant="ghost"
																	size="icon"
																	className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
																	onClick={(e) => {
																		e.stopPropagation();
																		removeFile(index);
																	}}
																>
																	<Trash2 className="size-3.5" />
																</Button>
															)}
														</li>
													);
												})}
											</ul>
										</ScrollArea>

										{remainingSlots > 0 ? (
											<p className="mt-2.5 text-center text-[11px] text-muted-foreground">
												Drop more files here or click to browse ({remainingSlots} remaining)
											</p>
										) : (
											<p className="mt-2.5 text-center text-[11px] text-muted-foreground">
												Maximum {MAX_FILES} files reached
											</p>
										)}
									</div>
								) : (
									<div className="flex w-full flex-col items-center gap-2 px-4 text-center">
										<div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
											<Upload className="size-5 text-primary" />
										</div>
										<div>
											<p className="text-sm font-medium">Drop files here or click to browse</p>
											<p className="mt-1 text-[11px] text-muted-foreground">
												Images, PDFs, archives, and text files · up to 50MB each
											</p>
										</div>
										<div className="mt-1 flex flex-wrap justify-center gap-1">
											{["Images", "PDFs", "Archives", "Text"].map((label) => (
												<Badge key={label} variant="outline" className="text-[10px] font-normal">
													{label}
												</Badge>
											))}
										</div>
									</div>
								)}
							</Dropzone>
						)}
					</div>

					{hasErrors && !isSubmitting ? (
						<div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
							<AlertCircle className="mt-0.5 size-3.5 shrink-0" />
							<span>Some files failed to upload. Remove failed items or try again.</span>
						</div>
					) : null}

					{allUploaded && !isSubmitting ? (
						<div className="flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/5 px-3 py-2 text-xs text-green-700 dark:text-green-400">
							<CheckCircle2 className="size-3.5 shrink-0" />
							<span>All files uploaded successfully.</span>
						</div>
					) : null}

					<p className="text-[11px] leading-relaxed text-muted-foreground">
						Max <strong>50MB</strong> per file, up to <strong>{MAX_FILES} files</strong> per upload.
						Files go to the current folder. Large uploads may take longer.
					</p>
				</div>

				<SheetFooter className="mt-4 gap-2 sm:gap-2">
					<Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
						Cancel
					</Button>
					<Button
						type="button"
						onClick={() => void handleSubmit()}
						disabled={isSubmitting || !hasFiles || allUploaded}
						className="min-w-[128px]"
					>
						{isSubmitting ? (
							<span className="flex items-center gap-2">
								<UploadProgressRing
									percent={overallProgress}
									size={22}
									strokeWidth={2.5}
									className="gap-0 [&_span]:text-[8px]"
								/>
								Uploading…
							</span>
						) : allUploaded ? (
							<span className="flex items-center gap-1.5">
								<CheckCircle2 className="size-4" />
								Complete
							</span>
						) : (
							<span className="flex items-center gap-1.5">
								<Plus className="size-4" />
								Upload files
							</span>
						)}
					</Button>
				</SheetFooter>
			</SheetContent>
		</Sheet>
	);
}
