"use client";

import * as React from "react";
import { Search, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UploadProgressRing } from "@/components/upload-progress-ring";
import { useAppFileUpload } from "@/hooks/use-app-file-upload";
import {
	normalizeImageFilesForUpload,
	uploadErrorMessage,
} from "@/lib/app-file-upload";
import { STORAGE_PREFIXES } from "@/lib/storage-prefixes";
import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";

import { useCreateNebMediaLibraryItem } from "../_api/use-create-email-builder-library-item";
import { useNebMediaLibraryItems } from "../_api/use-neb-media-library-items";
import { MediaLibraryGrid } from "./media-library-grid";

type ImageLibrarySheetProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

export function ImageLibrarySheet({ open, onOpenChange }: ImageLibrarySheetProps) {
	const [tab, setTab] = React.useState<"library" | "upload">("library");
	const [search, setSearch] = React.useState("");
	const fileRef = React.useRef<HTMLInputElement>(null);
	const { uploadOne, isUploading, progressPercent, progressLabel } = useAppFileUpload();

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
		removeItem,
	} = useNebMediaLibraryItems({ enabled: open, search });

	const createLibraryItem = useCreateNebMediaLibraryItem();
	const deleteItem = trpc.niscEmailBuilder.mediaLibrary.delete.useMutation({
		onSuccess: (_data, variables) => {
			removeItem(variables.id);
			toast.success("Image removed from library");
		},
		onError: (e) => toast.error(e.message),
	});

	React.useEffect(() => {
		if (!open) return;
		setTab("library");
		setSearch("");
	}, [open]);

	const handleUpload = async (file: File) => {
		try {
			const [normalized] = normalizeImageFilesForUpload([file]);
			const uploaded = await uploadOne(normalized, STORAGE_PREFIXES.EMAIL_BUILDER, {
				label: file.name,
			});
			const created = await createLibraryItem.mutateAsync({
				fileName: file.name,
				fileSize: uploaded.size,
				mimeType: normalized.type || "image/png",
				fileUrl: uploaded.publicUrl,
				storageKey: uploaded.key,
				metadata: { source: "nisc-email-builder" },
			});
			prependItem(created.data);
			setTab("library");
			setPage(1);
			toast.success("Image uploaded");
		} catch (e) {
			toast.error(uploadErrorMessage(e));
		}
	};

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent
				side="right"
				className="flex h-full max-h-svh w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-md"
			>
				<SheetHeader className="shrink-0 border-b px-6 py-4">
					<SheetTitle>Media library</SheetTitle>
					<SheetDescription>
						Your images for email marketing. Reuse them in any project.
					</SheetDescription>
				</SheetHeader>

				<Tabs
					value={tab}
					onValueChange={(v) => setTab(v as "library" | "upload")}
					className="flex min-h-0 flex-1 flex-col overflow-hidden px-6"
				>
					<TabsList className="mt-4 w-full shrink-0 grid grid-cols-2">
						<TabsTrigger value="library">My library</TabsTrigger>
						<TabsTrigger value="upload">Upload</TabsTrigger>
					</TabsList>

					<TabsContent
						value="library"
						className="mt-3 flex min-h-0 flex-1 flex-col overflow-hidden data-[state=inactive]:hidden"
					>
						<div className="relative mb-3 shrink-0">
							<Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
							<Input
								placeholder="Search…"
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								className="h-9 pl-8"
							/>
						</div>

						<ScrollArea className="h-0 min-h-0 flex-1">
							<div className="pr-3">
								<MediaLibraryGrid
									items={items}
									status={status}
									errorMessage={errorMessage}
									onRetry={refetch}
									onUploadClick={() => setTab("upload")}
									hasMore={hasMore}
									isFetchingMore={isFetchingMore}
									onLoadMore={() => setPage(page + 1)}
									renderItem={(item) => (
										<div
											key={item.id}
											className="group relative aspect-square overflow-hidden rounded-lg border bg-muted/30"
										>
											<img
												src={item.fileUrl}
												alt={item.fileName}
												className="h-full w-full object-cover"
												loading="lazy"
											/>
											<Button
												type="button"
												variant="destructive"
												size="icon"
												className="absolute top-1 right-1 size-7 opacity-0 transition-opacity group-hover:opacity-100"
												disabled={deleteItem.isPending}
												onClick={() => deleteItem.mutate({ id: item.id })}
											>
												<Trash2 className="size-3.5" />
											</Button>
										</div>
									)}
								/>
							</div>
						</ScrollArea>

						{!hasMore ? <div className="mb-4 shrink-0" /> : null}
					</TabsContent>

					<TabsContent
						value="upload"
						className="mt-3 shrink-0 pb-6 data-[state=inactive]:hidden"
					>
						<div
							role="button"
							tabIndex={0}
							onClick={() => !isUploading && fileRef.current?.click()}
							className={cn(
								"flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed bg-muted/20 px-4 py-10",
								isUploading && "pointer-events-none opacity-90",
							)}
						>
							<input
								ref={fileRef}
								type="file"
								accept="image/*"
								className="hidden"
								onChange={(e) => {
									const f = e.target.files?.[0];
									if (f) void handleUpload(f);
									e.target.value = "";
								}}
							/>
							{isUploading ? (
								<>
									<UploadProgressRing
										percent={progressPercent}
										size={80}
										label={progressLabel}
									/>
									<p className="text-sm text-muted-foreground">Uploading to storage…</p>
								</>
							) : (
								<>
									<Upload className="size-7 text-muted-foreground" />
									<p className="text-sm text-muted-foreground">Click to upload</p>
								</>
							)}
						</div>
					</TabsContent>
				</Tabs>
			</SheetContent>
		</Sheet>
	);
}
