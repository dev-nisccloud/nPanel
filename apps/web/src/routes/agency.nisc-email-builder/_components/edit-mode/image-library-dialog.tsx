"use client";

import * as React from "react";
import { Check, ImageIcon, Search, Upload } from "lucide-react";
import { toast } from "sonner";

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
import { nativePrimaryScrollbarClassName } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NebSpinner } from "../neb-loading";
import {
	normalizeImageFilesForUpload,
	uploadErrorMessage,
	uploadFiles,
	uploadThingFileUrl,
} from "@/hooks/use-uploadthing";
import { UPLOAD_ENDPOINTS } from "@/lib/uploadthing";
import { cn } from "@/lib/utils";

import { useCreateNebMediaLibraryItem } from "../../_api/use-create-email-builder-library-item";
import {
	useNebMediaLibraryItems,
	type NebMediaLibraryItem,
} from "../../_api/use-neb-media-library-items";
import { MediaLibraryGrid } from "../media-library-grid";

type ImageLibraryDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSelect: (fileUrl: string) => void;
	/** Current image URL in the email (pre-select in grid when possible). */
	currentSrc?: string;
};

export function ImageLibraryDialog({
	open,
	onOpenChange,
	onSelect,
	currentSrc,
}: ImageLibraryDialogProps) {
	const [tab, setTab] = React.useState<"library" | "upload">("library");
	const [search, setSearch] = React.useState("");
	const [selected, setSelected] = React.useState<NebMediaLibraryItem | null>(null);
	const [uploading, setUploading] = React.useState(false);
	const [dragOver, setDragOver] = React.useState(false);
	const fileRef = React.useRef<HTMLInputElement>(null);

	const {
		items,
		status,
		page,
		setPage,
		hasMore,
		isFetchingMore,
		errorMessage,
		refetch,
		prependItem,
	} = useNebMediaLibraryItems({ enabled: open, search });

	const createLibraryItem = useCreateNebMediaLibraryItem();

	React.useEffect(() => {
		if (!open) return;
		setSelected(null);
		setTab("library");
		setSearch("");
	}, [open]);

	React.useEffect(() => {
		if (!open || !currentSrc || selected) return;
		const match = items.find((i) => i.fileUrl === currentSrc);
		if (match) setSelected(match);
	}, [open, currentSrc, items, selected]);

	const handleUseImage = () => {
		if (!selected) return;
		onSelect(selected.fileUrl);
		onOpenChange(false);
	};

	const persistUpload = async (file: File) => {
		setUploading(true);
		try {
			const normalized = normalizeImageFilesForUpload([file]);
			const res = await uploadFiles(UPLOAD_ENDPOINTS.EMAIL_BUILDER_IMAGE, {
				files: normalized,
			});
			const uploaded = res[0];
			if (!uploaded) throw new Error("Upload failed");

			const fileUrl = uploadThingFileUrl(uploaded);
			const created = await createLibraryItem.mutateAsync({
				fileName: uploaded.name ?? file.name,
				fileSize: uploaded.size ?? file.size,
				mimeType: file.type || "image/png",
				fileUrl,
				storageKey: uploaded.key ?? undefined,
				metadata: { source: "nisc-email-builder" },
			});

			const item = created.data;
			prependItem(item);
			setSelected(item);
			setTab("library");
			setPage(1);
			toast.success("Image added to your library");
		} catch (e) {
			toast.error(uploadErrorMessage(e));
		} finally {
			setUploading(false);
		}
	};

	const onFiles = (files: FileList | File[] | null | undefined) => {
		const file = files?.[0];
		if (!file?.type.startsWith("image/")) {
			toast.error("Please choose an image file");
			return;
		}
		void persistUpload(file);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-xl max-h-[min(90dvh,720px)] grid grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden p-0">
				<DialogHeader className="px-6 pt-6 pb-2">
					<DialogTitle>Choose image</DialogTitle>
					<DialogDescription>
						Pick from your library or upload a new image. Your library is shared across
						all email projects.
					</DialogDescription>
				</DialogHeader>

				<Tabs
					value={tab}
					onValueChange={(v) => setTab(v as "library" | "upload")}
					className="flex h-full min-h-0 flex-col gap-2 overflow-hidden px-6 pb-2"
				>
					<TabsList className="w-full grid grid-cols-2 shrink-0">
						<TabsTrigger value="library" className="gap-1.5">
							<ImageIcon className="size-3.5" />
							My library
						</TabsTrigger>
						<TabsTrigger value="upload" className="gap-1.5">
							<Upload className="size-3.5" />
							Upload
						</TabsTrigger>
					</TabsList>

					<TabsContent
						value="library"
						className="mt-1 flex min-h-0 flex-1 flex-col overflow-hidden outline-none data-[state=inactive]:hidden"
					>
						<div className="relative mb-3 shrink-0">
							<Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
							<Input
								placeholder="Search by file name…"
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								className="h-9 pl-8"
							/>
						</div>

						<div
							className={cn(
								"min-h-0 flex-1 overflow-y-auto overflow-x-hidden pr-1",
								nativePrimaryScrollbarClassName,
							)}
						>
							<div className="pr-2 pb-2">
								<MediaLibraryGrid
									items={items}
									status={status}
									columns={4}
									errorMessage={errorMessage}
									onRetry={refetch}
									onUploadClick={() => setTab("upload")}
									hasMore={hasMore}
									isFetchingMore={isFetchingMore}
									onLoadMore={() => setPage(page + 1)}
									renderItem={(item) => {
										const isSelected = selected?.id === item.id;
										return (
											<button
												key={item.id}
												type="button"
												title={item.fileName}
												onClick={() => setSelected(item)}
												className={cn(
													"relative aspect-square rounded-lg overflow-hidden border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
													isSelected
														? "border-primary ring-2 ring-primary/30"
														: "border-transparent hover:border-muted-foreground/30",
												)}
											>
												<img
													src={item.fileUrl}
													alt={item.fileName}
													className="w-full h-full object-cover"
													loading="lazy"
												/>
												{isSelected ? (
													<span className="absolute top-1 right-1 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
														<Check className="size-3" />
													</span>
												) : null}
											</button>
										);
									}}
								/>
							</div>
						</div>
					</TabsContent>

					<TabsContent
						value="upload"
						className="mt-3 shrink-0 pb-2 data-[state=inactive]:hidden"
					>
						<div
							role="button"
							tabIndex={0}
							onKeyDown={(e) => {
								if (e.key === "Enter" || e.key === " ") fileRef.current?.click();
							}}
							onClick={() => !uploading && fileRef.current?.click()}
							onDragOver={(e) => {
								e.preventDefault();
								setDragOver(true);
							}}
							onDragLeave={() => setDragOver(false)}
							onDrop={(e) => {
								e.preventDefault();
								setDragOver(false);
								onFiles(e.dataTransfer.files);
							}}
							className={cn(
								"rounded-xl border-2 border-dashed px-6 py-12 flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors",
								dragOver
									? "border-primary bg-primary/5"
									: "border-muted-foreground/25 bg-muted/20 hover:bg-muted/30",
								uploading && "pointer-events-none opacity-70",
							)}
						>
							<input
								ref={fileRef}
								type="file"
								accept="image/*"
								className="hidden"
								onChange={(e) => {
									onFiles(e.target.files);
									e.target.value = "";
								}}
							/>
							{uploading ? (
								<>
									<NebSpinner context="upload" size={24} className="text-primary" />
									<p className="text-sm text-muted-foreground">Uploading…</p>
								</>
							) : (
								<>
									<Upload className="size-8 text-muted-foreground" />
									<div className="text-center space-y-1">
										<p className="text-sm font-medium">
											Drop an image or click to browse
										</p>
										<p className="text-xs text-muted-foreground">
											JPG, PNG, GIF, WEBP, SVG · Max 16MB
										</p>
									</div>
								</>
							)}
						</div>
						<p className="text-[11px] text-muted-foreground text-center mt-3">
							Uploads are saved to your library automatically.
						</p>
					</TabsContent>
				</Tabs>

				<DialogFooter className="px-6 py-4 border-t gap-2 sm:gap-2">
					<Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
						Cancel
					</Button>
					<Button
						type="button"
						disabled={!selected || uploading}
						onClick={handleUseImage}
					>
						Use image
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
