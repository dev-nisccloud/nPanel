"use client";

import * as React from "react";
import { Loader2, Search, Trash2, Upload } from "lucide-react";
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

import { useCreateNebMediaLibraryItem } from "../_api/use-create-email-builder-library-item";

type LibraryItem = {
	id: string;
	fileName: string;
	fileUrl: string;
};

type ImageLibrarySheetProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

export function ImageLibrarySheet({ open, onOpenChange }: ImageLibrarySheetProps) {
	const [tab, setTab] = React.useState<"library" | "upload">("library");
	const [search, setSearch] = React.useState("");
	const [debouncedSearch, setDebouncedSearch] = React.useState("");
	const [page, setPage] = React.useState(1);
	const [allItems, setAllItems] = React.useState<LibraryItem[]>([]);
	const [uploading, setUploading] = React.useState(false);
	const fileRef = React.useRef<HTMLInputElement>(null);

	const utils = trpc.useUtils();
	const createLibraryItem = useCreateNebMediaLibraryItem();
	const deleteItem = trpc.niscEmailBuilder.mediaLibrary.delete.useMutation({
		onSuccess: (_data, variables) => {
			setAllItems((prev) => prev.filter((i) => i.id !== variables.id));
			void utils.niscEmailBuilder.mediaLibrary.list.invalidate();
			toast.success("Image removed from library");
		},
		onError: (e) => toast.error(e.message),
	});

	React.useEffect(() => {
		const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
		return () => clearTimeout(t);
	}, [search]);

	React.useEffect(() => {
		if (!open) return;
		setPage(1);
		setAllItems([]);
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
		{ enabled: open },
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

	const handleUpload = async (file: File) => {
		setUploading(true);
		try {
			const res = await uploadFiles(UPLOAD_ENDPOINTS.EMAIL_BUILDER_IMAGE, {
				files: normalizeImageFilesForUpload([file]),
			});
			const uploaded = res[0];
			if (!uploaded) throw new Error("Upload failed");
			await createLibraryItem.mutateAsync({
				fileName: uploaded.name ?? file.name,
				fileSize: uploaded.size ?? file.size,
				mimeType: file.type || "image/png",
				fileUrl: uploadThingFileUrl(uploaded),
				storageKey: uploaded.key ?? undefined,
				metadata: { source: "nisc-email-builder" },
			});
			setTab("library");
			setPage(1);
			toast.success("Image uploaded");
		} catch (e) {
			toast.error(uploadErrorMessage(e));
		} finally {
			setUploading(false);
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
								{listQuery.isLoading && page === 1 ? (
									<div className="flex justify-center py-12">
										<Spinner size={20} />
									</div>
								) : allItems.length === 0 ? (
									<p className="py-12 text-center text-sm text-muted-foreground">
										No images in your library yet.
									</p>
								) : (
									<div className="grid grid-cols-3 gap-2 pb-2">
										{allItems.map((item) => (
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
										))}
									</div>
								)}
							</div>
						</ScrollArea>

						{listQuery.data?.nextPage ? (
							<Button
								type="button"
								variant="ghost"
								size="sm"
								className="mb-4 mt-2 shrink-0"
								disabled={listQuery.isFetching}
								onClick={() => setPage((p) => p + 1)}
							>
								{listQuery.isFetching ? (
									<Loader2 className="size-3.5 animate-spin" />
								) : (
									"Load more"
								)}
							</Button>
						) : (
							<div className="mb-4 shrink-0" />
						)}
					</TabsContent>

					<TabsContent
						value="upload"
						className="mt-3 shrink-0 pb-6 data-[state=inactive]:hidden"
					>
						<div
							role="button"
							tabIndex={0}
							onClick={() => !uploading && fileRef.current?.click()}
							className={cn(
								"flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed bg-muted/20 px-4 py-10",
								uploading && "pointer-events-none opacity-70",
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
							{uploading ? (
								<Spinner size={22} />
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
