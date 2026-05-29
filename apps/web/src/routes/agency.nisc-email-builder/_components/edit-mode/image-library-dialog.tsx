"use client";

import * as React from "react";
import { Check, ImageIcon, Loader2, Search, Upload } from "lucide-react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import {
	normalizeImageFilesForUpload,
	uploadErrorMessage,
	uploadFiles,
	uploadThingFileUrl,
} from "@/hooks/use-uploadthing";
import { UPLOAD_ENDPOINTS } from "@/lib/uploadthing";
import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";

import { useCreateNebMediaLibraryItem } from "../../_api/use-create-email-builder-library-item";

type LibraryItem = {
	id: string;
	fileName: string;
	fileUrl: string;
	mimeType: string;
	createdAt: Date | string;
};

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
	const [debouncedSearch, setDebouncedSearch] = React.useState("");
	const [page, setPage] = React.useState(1);
	const [allItems, setAllItems] = React.useState<LibraryItem[]>([]);
	const [selected, setSelected] = React.useState<LibraryItem | null>(null);
	const [uploading, setUploading] = React.useState(false);
	const [dragOver, setDragOver] = React.useState(false);
	const fileRef = React.useRef<HTMLInputElement>(null);

	const createLibraryItem = useCreateNebMediaLibraryItem();

	React.useEffect(() => {
		const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
		return () => clearTimeout(t);
	}, [search]);

	React.useEffect(() => {
		if (!open) return;
		setPage(1);
		setAllItems([]);
		setSelected(null);
		setTab("library");
		setSearch("");
		setDebouncedSearch("");
	}, [open]);

	React.useEffect(() => {
		setPage(1);
		setAllItems([]);
	}, [debouncedSearch]);

	const listQuery = trpc.niscEmailBuilder.mediaLibrary.list.useQuery(
		{
			page,
			limit: 40,
			onlyImages: true,
			search: debouncedSearch || undefined,
		},
		{ enabled: open && tab === "library" },
	);

	React.useEffect(() => {
		if (!listQuery.data?.data) return;
		setAllItems((prev) => {
			if (page === 1) return listQuery.data.data;
			const ids = new Set(prev.map((i) => i.id));
			const merged = [...prev];
			for (const item of listQuery.data.data) {
				if (!ids.has(item.id)) merged.push(item);
			}
			return merged;
		});
	}, [listQuery.data, page]);

	React.useEffect(() => {
		if (!open || !currentSrc || selected) return;
		const match = allItems.find((i) => i.fileUrl === currentSrc);
		if (match) setSelected(match);
	}, [open, currentSrc, allItems, selected]);

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
			setAllItems((prev) => [item, ...prev.filter((i) => i.id !== item.id)]);
			setSelected(item);
			setTab("library");
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

	const hasMore = listQuery.data?.nextPage != null;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-xl max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden">
				<DialogHeader className="px-6 pt-6 pb-2 shrink-0">
					<DialogTitle>Choose image</DialogTitle>
					<DialogDescription>
						Pick from your library or upload a new image. Your library is shared across
						all email projects.
					</DialogDescription>
				</DialogHeader>

				<Tabs
					value={tab}
					onValueChange={(v) => setTab(v as "library" | "upload")}
					className="flex min-h-0 flex-1 flex-col overflow-hidden px-6"
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
						className="mt-3 flex min-h-0 flex-1 flex-col overflow-hidden data-[state=inactive]:hidden"
					>
						<div className="relative shrink-0 mb-3">
							<Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
							<Input
								placeholder="Search by file name…"
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								className="h-9 pl-8"
							/>
						</div>

						<ScrollArea className="h-0 min-h-0 flex-1">
							<div className="pr-3">
							{listQuery.isLoading && page === 1 ? (
								<div className="flex items-center justify-center py-16">
									<Spinner size={20} />
								</div>
							) : allItems.length === 0 ? (
								<div className="flex flex-col items-center justify-center py-12 text-center gap-3">
									<ImageIcon className="size-10 text-muted-foreground/40" />
									<div className="space-y-1">
										<p className="text-sm font-medium">No images yet</p>
										<p className="text-xs text-muted-foreground max-w-xs">
											Upload an image to build your library. You can reuse it in any
											email.
										</p>
									</div>
									<Button
										type="button"
										size="sm"
										variant="secondary"
										onClick={() => setTab("upload")}
									>
										Upload image
									</Button>
								</div>
							) : (
								<div className="grid grid-cols-4 gap-2 pb-2">
									{allItems.map((item) => {
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
									})}
								</div>
							)}
							</div>
						</ScrollArea>

						{hasMore ? (
							<Button
								type="button"
								variant="ghost"
								size="sm"
								className="w-full shrink-0 mt-2"
								disabled={listQuery.isFetching}
								onClick={() => setPage((p) => p + 1)}
							>
								{listQuery.isFetching ? (
									<Loader2 className="size-3.5 animate-spin" />
								) : (
									"Load more"
								)}
							</Button>
						) : null}
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
									<Spinner size={24} />
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

				<DialogFooter className="px-6 py-4 border-t shrink-0 gap-2 sm:gap-2">
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
