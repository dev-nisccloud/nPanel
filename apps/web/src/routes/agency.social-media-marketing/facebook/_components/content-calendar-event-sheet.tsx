"use client";

import * as React from "react";
import { format } from "date-fns";
import {
	Pen,
	FileText,
	Layers,
	Trash2,
	X,
	CheckCircle2,
	Clock,
	XCircle,
	Image as ImageIcon,
	Video,
	ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetClose,
} from "@/components/ui/sheet";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/utils/trpc";
import { toast } from "@/components/ui/sonner";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
} from "@/components/ui/carousel";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dropzone, DropzoneEmptyState } from "@/components/ui/shadcn-io/dropzone";
import { Progress } from "@/components/ui/progress";
import { uploadFiles } from "@/hooks/use-uploadthing";
import { UPLOAD_ENDPOINTS } from "@/lib/uploadthing";
import { getDicebearUrl } from "@/lib/utils";
import { Plus } from "lucide-react";

interface ContentCalendarPost {
	id: string;
	pageTokenId: string | null;
	pageName: string | null;
	message: string | null;
	scheduledPublishTime: Date | string;
	status: "SCHEDULED" | "PUBLISHED" | "FAILED" | "CANCELLED" | "DRAFT";
	published: boolean;
	publishedAt: Date | string | null;
	publishedPostId: string | null;
	publishedPermalink: string | null;
	lastError: string | null;
	retryCount: number;
	lastRetryAt: Date | string | null;
	createdBy: string;
	creator?: {
		id: string;
		name: string;
		email: string;
		image: string | null;
	};
	createdAt: Date | string;
	updatedAt: Date | string;
	mediaItems?: Array<{
		id: string;
		calendarPostId: string;
		mediaType: "PHOTO" | "VIDEO";
		url: string;
		fileName: string | null;
		fileSize: number | null;
		caption: string | null;
		description: string | null;
		order: number;
		createdAt: Date | string;
		updatedAt: Date | string;
	}>;
}

interface ContentCalendarEventSheetProps {
	post: ContentCalendarPost | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onEdit?: (post: ContentCalendarPost) => void;
	onDelete?: () => void;
	onSuccess?: () => void;
}

function formatDateTime(date: Date | string): string {
	const dateObj = typeof date === 'string' ? new Date(date) : date;
	return format(dateObj, "EEEE, MMMM dd, yyyy 'at' h:mm a");
}

function getStatusBadge(status: ContentCalendarPost["status"]) {
	switch (status) {
		case "SCHEDULED":
			return (
				<Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
					<Clock className="size-3 mr-1" />
					Scheduled
				</Badge>
			);
		case "PUBLISHED":
			return (
				<Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
					<CheckCircle2 className="size-3 mr-1" />
					Published
				</Badge>
			);
		case "FAILED":
			return (
				<Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
					<XCircle className="size-3 mr-1" />
					Failed
				</Badge>
			);
		case "CANCELLED":
			return (
				<Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
					<XCircle className="size-3 mr-1" />
					Cancelled
				</Badge>
			);
		case "DRAFT":
			return (
				<Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
					<FileText className="size-3 mr-1" />
					Draft
				</Badge>
			);
		default:
			return null;
	}
}

function formatFileSize(bytes: number | null | undefined): string {
	if (!bytes || bytes === 0) return "0 Bytes";
	const k = 1024;
	const sizes = ["Bytes", "KB", "MB", "GB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

interface MediaUploadItem {
	id: string;
	file: File;
	url?: string;
	mediaType: "PHOTO" | "VIDEO";
	uploadProgress?: number;
	isUploading?: boolean;
}

/**
 * Normalize progress value from UploadThing to a 0-100 percentage
 */
function normalizeProgress(progress: unknown): number {
	if (typeof progress === "number") {
		return Math.round(Math.min(100, Math.max(0, progress)));
	}
	if (progress && typeof progress === "object") {
		const progressObj = progress as Record<string, unknown>;
		if ("progress" in progressObj && typeof progressObj.progress === "number") {
			const progressValue = progressObj.progress;
			return progressValue > 1
				? Math.round(Math.min(100, Math.max(0, progressValue)))
				: Math.round(Math.min(100, Math.max(0, progressValue * 100)));
		}
		if ("loaded" in progressObj && "totalLoaded" in progressObj) {
			const loaded = Number(progressObj.loaded) || 0;
			const total = Number(progressObj.totalLoaded) || 1;
			if (total > 0) {
				return Math.round(Math.min(100, Math.max(0, (loaded / total) * 100)));
			}
		}
	}
	return 0;
}

export function ContentCalendarEventSheet({
	post,
	open,
	onOpenChange,
	onEdit,
	onDelete,
	onSuccess,
}: ContentCalendarEventSheetProps) {
	const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
	const [editingCaptions, setEditingCaptions] = React.useState<Record<string, string>>({});
	const [editingDescriptions, setEditingDescriptions] = React.useState<Record<string, string>>({});
	const [uploadingMedia, setUploadingMedia] = React.useState<MediaUploadItem[]>([]);

	const utils = trpc.useUtils();
	
	// Fetch the full post data to get current media items
	const { data: fullPostData, refetch: refetchPost } = trpc.socialMediaMarketing.meta.contentCalendar.getById.useQuery(
		{ id: post?.id || "" },
		{
			enabled: !!post?.id && open,
			staleTime: 0, // Always refetch when opened
		}
	);

	// Use full post data if available, otherwise fall back to post prop
	const currentPost = fullPostData || post;
	const deleteMutation = trpc.socialMediaMarketing.meta.contentCalendar.delete.useMutation({
		onSuccess: () => {
			toast.success("Post deleted successfully");
			setDeleteDialogOpen(false);
			onOpenChange(false);
			onDelete?.();
			onSuccess?.();
			// Invalidate queries
			utils.socialMediaMarketing.meta.contentCalendar.getAll.invalidate();
		},
		onError: (error) => {
			toast.error("Failed to delete post", {
				description: error.message,
			});
		},
	});

	const updateMediaItemMutation = trpc.socialMediaMarketing.meta.contentCalendar.updateMediaItem.useMutation({
		onSuccess: (_, variables) => {
			toast.success("Media item updated successfully");
			if (currentPost) {
				refetchPost();
				utils.socialMediaMarketing.meta.contentCalendar.getById.invalidate({ id: currentPost.id });
			}
			utils.socialMediaMarketing.meta.contentCalendar.getAll.invalidate();
		},
		onError: (error) => {
			toast.error("Failed to update media item", {
				description: error.message,
			});
		},
	});

	const deleteMediaItemMutation = trpc.socialMediaMarketing.meta.contentCalendar.deleteMediaItem.useMutation({
		onSuccess: () => {
			toast.success("Media item deleted successfully");
			// Immediately refetch the post data
			if (currentPost) {
				refetchPost();
				utils.socialMediaMarketing.meta.contentCalendar.getById.invalidate({ id: currentPost.id });
			}
			utils.socialMediaMarketing.meta.contentCalendar.getAll.invalidate();
			onSuccess?.();
		},
		onError: (error) => {
			toast.error("Failed to delete media item", {
				description: error.message,
			});
		},
	});

	const updatePostMutation = trpc.socialMediaMarketing.meta.contentCalendar.update.useMutation({
		onSuccess: () => {
			toast.success("Media added successfully");
			// Immediately refetch the post data
			if (currentPost) {
				refetchPost();
				utils.socialMediaMarketing.meta.contentCalendar.getById.invalidate({ id: currentPost.id });
			}
			utils.socialMediaMarketing.meta.contentCalendar.getAll.invalidate();
			setUploadingMedia([]);
			onSuccess?.();
		},
		onError: (error) => {
			toast.error("Failed to add media", {
				description: error.message,
			});
			setUploadingMedia([]);
		},
	});

	const handleDelete = () => {
		if (!currentPost) return;
		deleteMutation.mutate({ id: currentPost.id });
	};

	const handleEdit = () => {
		if (currentPost && onEdit) {
			onEdit(currentPost);
		}
	};

	const handleUpdateCaption = (mediaItemId: string, caption: string) => {
		setEditingCaptions((prev) => ({ ...prev, [mediaItemId]: caption }));
	};

	const handleSaveCaption = (mediaItemId: string) => {
		const caption = editingCaptions[mediaItemId];
		updateMediaItemMutation.mutate({
			mediaItemId,
			caption: caption || undefined,
		});
		setEditingCaptions((prev) => {
			const newState = { ...prev };
			delete newState[mediaItemId];
			return newState;
		});
	};

	const handleUpdateDescription = (mediaItemId: string, description: string) => {
		setEditingDescriptions((prev) => ({ ...prev, [mediaItemId]: description }));
	};

	const handleSaveDescription = (mediaItemId: string) => {
		const description = editingDescriptions[mediaItemId];
		updateMediaItemMutation.mutate({
			mediaItemId,
			description: description || undefined,
		});
		setEditingDescriptions((prev) => {
			const newState = { ...prev };
			delete newState[mediaItemId];
			return newState;
		});
	};

	const handleDeleteMediaItem = (mediaItemId: string) => {
		deleteMediaItemMutation.mutate({ mediaItemId });
	};

	// Initialize editing state when post changes
	React.useEffect(() => {
		if (currentPost?.mediaItems) {
			const captions: Record<string, string> = {};
			const descriptions: Record<string, string> = {};
			currentPost.mediaItems.forEach((item) => {
				if (item.caption) captions[item.id] = item.caption;
				if (item.description) descriptions[item.id] = item.description;
			});
			setEditingCaptions(captions);
			setEditingDescriptions(descriptions);
		}
	}, [currentPost?.id]);

	// Reset uploading media when sheet closes
	React.useEffect(() => {
		if (!open) {
			setUploadingMedia([]);
		}
	}, [open]);

	// Calculate media items and limits (before early return to ensure hooks are always called)
	const allMediaItems = currentPost?.mediaItems?.sort((a, b) => a.order - b.order) || [];
	const hasMedia = allMediaItems.length > 0;
	const photos = allMediaItems.filter((item) => item.mediaType === "PHOTO");
	const videos = allMediaItems.filter((item) => item.mediaType === "VIDEO");
	const canAddPhotos = photos.length < 10 && videos.length === 0;
	const canAddVideo = videos.length === 0 && photos.length === 0;
	const selectedMediaType = photos.length > 0 ? "PHOTO" : videos.length > 0 ? "VIDEO" : null;

	const handleDrop = React.useCallback(
		(acceptedFiles: File[]) => {
			if (!currentPost || currentPost.published) {
				toast.error("Cannot add media to published posts");
				return;
			}

			// Recalculate media items inside the callback to ensure we have the latest data
			const currentAllMediaItems = currentPost.mediaItems?.sort((a, b) => a.order - b.order) || [];
			const currentPhotos = currentAllMediaItems.filter((item) => item.mediaType === "PHOTO");
			const currentVideos = currentAllMediaItems.filter((item) => item.mediaType === "VIDEO");
			const currentSelectedMediaType = currentPhotos.length > 0 ? "PHOTO" : currentVideos.length > 0 ? "VIDEO" : null;

			acceptedFiles.forEach((file) => {
				const isVideo = file.type.startsWith("video/");
				const isImage = file.type.startsWith("image/");

				// Determine media type
				let mediaType: "PHOTO" | "VIDEO";
				if (currentSelectedMediaType) {
					mediaType = currentSelectedMediaType;
					// Validate file type matches existing media type
					if (currentSelectedMediaType === "VIDEO" && !isVideo) {
						toast.error(`File "${file.name}" is not a valid video. Please select video files only.`);
						return;
					}
					if (currentSelectedMediaType === "PHOTO" && !isImage) {
						toast.error(`File "${file.name}" is not a valid image. Please select image files only.`);
						return;
					}
				} else {
					// No existing media, determine from file type
					if (isVideo) {
						mediaType = "VIDEO";
						if (currentVideos.length >= 1) {
							toast.error("Only one video is allowed per post");
							return;
						}
					} else if (isImage) {
						mediaType = "PHOTO";
						if (currentPhotos.length >= 10) {
							toast.error("Maximum 10 photos allowed per post");
							return;
						}
					} else {
						toast.error(`File "${file.name}" is not a valid image or video.`);
						return;
					}
				}

				// Check limits
				if (mediaType === "VIDEO" && currentVideos.length >= 1) {
					toast.error("Only one video is allowed per post");
					return;
				}
				if (mediaType === "PHOTO" && currentPhotos.length >= 10) {
					toast.error("Maximum 10 photos allowed per post");
					return;
				}

				const newItem: MediaUploadItem = {
					id: `upload_${Date.now()}_${Math.random()}`,
					file,
					mediaType,
				};

				setUploadingMedia((prev) => [...prev, newItem]);

				// Upload the file
				uploadFiles(UPLOAD_ENDPOINTS.CONTENT_CALENDAR_MEDIA, {
					files: [file],
					onUploadBegin: () => {
						setUploadingMedia((prev) =>
							prev.map((i) => (i.id === newItem.id ? { ...i, isUploading: true, uploadProgress: 0 } : i))
						);
					},
					onUploadProgress: (progress) => {
						const normalizedProgress = normalizeProgress(progress);
						setUploadingMedia((prev) =>
							prev.map((i) => (i.id === newItem.id ? { ...i, uploadProgress: normalizedProgress } : i))
						);
					},
				})
					.then((response) => {
						if (!response || response.length === 0) {
							throw new Error("No file was uploaded");
						}
						const uploadedFile = response[0];
						const fileUrl = uploadedFile.ufsUrl || uploadedFile.url || "";
						if (!fileUrl) {
							throw new Error("File URL not found in upload response");
						}

						// Update the item with URL
						setUploadingMedia((prev) =>
							prev.map((i) =>
								i.id === newItem.id
									? { ...i, url: fileUrl, isUploading: false, uploadProgress: 100 }
									: i
							)
						);

						// Get all current media items and add the new one
						const currentMediaItems = currentAllMediaItems.map((item) => ({
							url: item.url,
							mediaType: item.mediaType,
							fileName: item.fileName || undefined,
							fileSize: item.fileSize || undefined,
							caption: item.caption || undefined,
							description: item.description || undefined,
							order: item.order,
						}));

						const newMediaItem = {
							url: fileUrl,
							mediaType,
							fileName: file.name,
							fileSize: file.size,
							order: currentMediaItems.length,
						};

						// Update the post with all media items including the new one
						updatePostMutation.mutate({
							id: currentPost.id,
							mediaItems: [...currentMediaItems, newMediaItem],
						});
					})
					.catch((error) => {
						toast.error("Failed to upload file", {
							description: error.message || "Please try again.",
						});
						setUploadingMedia((prev) => prev.filter((i) => i.id !== newItem.id));
					});
			});
		},
		[currentPost, updatePostMutation]
	);

	// Early return after all hooks are defined
	if (!currentPost) return null;

	return (
		<>
			<Sheet open={open} onOpenChange={onOpenChange}>
				<SheetContent
					side="right"
					className="w-full sm:max-w-[560px] overflow-y-auto p-0 border-l border-r border-t [&>button]:hidden"
				>
					<div className="flex flex-col h-full">
						<SheetHeader className="px-4 pt-4 pb-4 border-b border-border">
							<div className="flex items-center justify-between mb-3">
								<div className="flex items-center gap-3">
									<Button
										variant="ghost"
										size="icon"
										className="size-8 hover:bg-muted"
										onClick={handleEdit}
										disabled={currentPost.published}
									>
										<Pen className="size-4 text-muted-foreground" />
									</Button>
									<Button
										variant="ghost"
										size="icon"
										className="size-8 hover:bg-muted"
										disabled
									>
										<FileText className="size-4 text-muted-foreground" />
									</Button>
									<Button
										variant="ghost"
										size="icon"
										className="size-8 hover:bg-muted"
										disabled
									>
										<Layers className="size-4 text-muted-foreground" />
									</Button>
									<Button
										variant="ghost"
										size="icon"
										className="size-8 hover:bg-muted"
										onClick={() => setDeleteDialogOpen(true)}
									>
										<Trash2 className="size-4 text-muted-foreground" />
									</Button>
								</div>
								<SheetClose asChild>
									<Button
										variant="ghost"
										size="icon"
										className="size-6 rounded-full bg-muted hover:bg-muted"
									>
										<X className="size-4 text-muted-foreground" />
									</Button>
								</SheetClose>
							</div>

							<div className="flex flex-col gap-2 mb-4">
								<div className="flex items-center gap-2 flex-wrap">
									{getStatusBadge(currentPost.status)}
									{(currentPost.published || currentPost.status === "PUBLISHED") && currentPost.publishedPermalink && (
										<Button
											variant="default"
											size="sm"
											className="h-7 text-xs font-medium"
											onClick={() => window.open(currentPost.publishedPermalink!, "_blank")}
										>
											<ExternalLink className="size-3 mr-1.5" />
											View Post on Facebook
										</Button>
									)}
								</div>
								<SheetTitle className="text-xl font-semibold text-foreground leading-normal">
									Scheduled Post
								</SheetTitle>
								<div className="flex items-center gap-2 text-[13px] font-medium text-muted-foreground">
									<span>{formatDateTime(currentPost.scheduledPublishTime)}</span>
								</div>
							</div>
						</SheetHeader>

						<div className="flex-1 overflow-y-auto px-4 py-4">
							<div className="flex flex-col gap-4 max-w-[512px] mx-auto">
								{/* Post Content Preview */}
								<div className="border rounded-lg p-4 bg-card">
									{/* Facebook-like preview */}
									<div className="space-y-3">
										{/* Header */}
										<div className="flex items-center gap-2">
											<Avatar className="size-8">
												<AvatarImage
													src={getDicebearUrl(currentPost.pageTokenId || currentPost.id)}
												/>
											</Avatar>
											<div className="flex-1">
												<p className="text-sm font-semibold">{currentPost.pageName || "Page Name"}</p>
												<p className="text-xs text-muted-foreground">
													{format(typeof currentPost.scheduledPublishTime === 'string' ? new Date(currentPost.scheduledPublishTime) : currentPost.scheduledPublishTime, "MMM dd, yyyy 'at' h:mm a")}
												</p>
											</div>
										</div>

										{/* Message */}
										{currentPost.message && (
											<div className="text-sm whitespace-pre-wrap leading-relaxed">
												{currentPost.message}
											</div>
										)}

										{/* Media */}
										{hasMedia && (
											<div className="space-y-2">
												{(() => {
													
													if (photos.length > 0) {
														return (
															<div className="relative">
																{photos.length === 1 ? (
																	<img
																		src={photos[0]!.url}
																		alt={photos[0]!.caption || "Post image"}
																		className="w-full rounded-lg object-cover"
																		style={{ maxHeight: "500px" }}
																	/>
																) : (
																	<Carousel className="w-full">
																		<CarouselContent>
																			{photos.map((photo, index) => (
																				<CarouselItem key={photo.id}>
																					<img
																						src={photo.url}
																						alt={photo.caption || `Post image ${index + 1}`}
																						className="w-full rounded-lg object-cover"
																						style={{ maxHeight: "500px" }}
																					/>
																				</CarouselItem>
																			))}
																		</CarouselContent>
																		<CarouselPrevious />
																		<CarouselNext />
																	</Carousel>
																)}
															</div>
														);
													}
													
													if (videos.length > 0) {
														return (
															<div className="relative">
																<video
																	src={videos[0]!.url}
																	controls
																	className="w-full rounded-lg"
																	style={{ maxHeight: "500px" }}
																>
																	Your browser does not support the video tag.
																</video>
															</div>
														);
													}
													
													return null;
												})()}
											</div>
										)}

										{/* Engagement placeholder */}
										<div className="flex items-center gap-4 pt-2 border-t text-xs text-muted-foreground">
											<span>Like</span>
											<span>Comment</span>
											<span>Share</span>
										</div>
									</div>
								</div>

								{/* Post Details */}
								<div className="space-y-3">
									{(currentPost.published || currentPost.status === "PUBLISHED") && currentPost.publishedPermalink && (
										<div>
											<Button
												variant="default"
												className="w-full"
												onClick={() => window.open(currentPost.publishedPermalink!, "_blank")}
											>
												<ExternalLink className="size-4 mr-2" />
												View Post on Facebook
											</Button>
										</div>
									)}
									{currentPost.message && (
										<div>
											<h4 className="text-sm font-semibold mb-2">Post Copy</h4>
											<p className="text-sm text-muted-foreground whitespace-pre-wrap">
												{currentPost.message}
											</p>
										</div>
									)}

									<div>
										<h4 className="text-sm font-semibold mb-2">Media</h4>
										<ScrollArea className="h-[400px] w-full rounded-md border p-4">
											<div className="space-y-4">
												{allMediaItems.map((item) => {
													const isEditingCaption = editingCaptions.hasOwnProperty(item.id);
													const isEditingDescription = editingDescriptions.hasOwnProperty(item.id);
													const currentCaption = isEditingCaption
														? editingCaptions[item.id]
														: item.caption || "";
													const currentDescription = isEditingDescription
														? editingDescriptions[item.id]
														: item.description || "";

													return (
															<div
																key={item.id}
																className="flex gap-3 p-3 border rounded-lg bg-card"
															>
																{/* Preview */}
																<div className="flex-shrink-0">
																	{item.mediaType === "PHOTO" ? (
																		<img
																			src={item.url}
																			alt={item.caption || item.fileName || "Photo"}
																			className="w-20 h-20 object-cover rounded-md"
																		/>
																	) : (
																		<video
																			src={item.url}
																			className="w-20 h-20 object-cover rounded-md"
																			controls={false}
																		/>
																	)}
																</div>

																{/* File Info and Controls */}
																<div className="flex-1 min-w-0 space-y-2">
																	{/* File Name and Size */}
																	<div className="flex items-start justify-between gap-2">
																		<div className="flex-1 min-w-0">
																			<div className="flex items-center gap-2">
																				{item.mediaType === "PHOTO" ? (
																					<ImageIcon className="size-4 text-muted-foreground shrink-0" />
																				) : (
																					<Video className="size-4 text-muted-foreground shrink-0" />
																				)}
																				<p className="text-sm font-medium truncate">
																					{item.fileName || `Media ${item.order + 1}`}
																				</p>
																			</div>
																			{item.fileSize && (
																				<p className="text-xs text-muted-foreground mt-0.5">
																					{formatFileSize(item.fileSize)}
																				</p>
																			)}
																		</div>
																		{!currentPost.published && (
																			<Button
																				variant="ghost"
																				size="icon"
																				className="h-7 w-7 shrink-0"
																				onClick={() => handleDeleteMediaItem(item.id)}
																				disabled={deleteMediaItemMutation.isPending}
																			>
																				<Trash2 className="h-4 w-4 text-destructive" />
																			</Button>
																		)}
																	</div>

																	{/* Caption/Description */}
																	{item.mediaType === "PHOTO" ? (
																		<div className="space-y-1">
																			<Input
																				placeholder="Add caption (optional)"
																				value={currentCaption}
																				onChange={(e) => handleUpdateCaption(item.id, e.target.value)}
																				onBlur={() => handleSaveCaption(item.id)}
																				onKeyDown={(e) => {
																					if (e.key === "Enter") {
																						e.currentTarget.blur();
																					}
																				}}
																				className="h-8 text-xs"
																				disabled={currentPost.published || updateMediaItemMutation.isPending}
																			/>
																		</div>
																	) : (
																		<div className="space-y-1">
																			<Textarea
																				placeholder="Add description (optional)"
																				value={currentDescription}
																				onChange={(e) => handleUpdateDescription(item.id, e.target.value)}
																				onBlur={() => handleSaveDescription(item.id)}
																				className="h-16 text-xs resize-none"
																				rows={2}
																				disabled={currentPost.published || updateMediaItemMutation.isPending}
																			/>
																		</div>
																	)}
																</div>
															</div>
														);
													})}

												{/* Uploading Media Items */}
												{uploadingMedia.map((item) => (
													<div key={item.id} className="flex gap-3 p-3 border rounded-lg bg-muted/50">
														<div className="flex-shrink-0">
															{item.mediaType === "PHOTO" ? (
																<ImageIcon className="w-20 h-20 text-muted-foreground" />
															) : (
																<Video className="w-20 h-20 text-muted-foreground" />
															)}
														</div>
														<div className="flex-1 min-w-0 space-y-2">
															<div>
																<p className="text-sm font-medium truncate">{item.file.name}</p>
																<p className="text-xs text-muted-foreground">
																	{formatFileSize(item.file.size)}
																</p>
															</div>
															{item.isUploading && (
																<div className="space-y-1">
																	<Progress value={item.uploadProgress || 0} className="h-2" />
																	<p className="text-xs text-muted-foreground">
																		Uploading... {item.uploadProgress || 0}%
																	</p>
																</div>
															)}
														</div>
													</div>
												))}

												{/* Add Media Button - Only show if not published and within limits */}
												{!currentPost.published && (
													<>
														{canAddPhotos && (
															<Dropzone
																onDrop={handleDrop}
																maxFiles={10 - photos.length}
																maxSize={100 * 1024 * 1024}
																accept={{ "image/*": [] }}
																className="w-full border-2 border-dashed"
															>
																<DropzoneEmptyState>
																	<div className="flex flex-col items-center justify-center py-4 text-center">
																		<Plus className="h-6 w-6 text-muted-foreground mb-2" />
																		<p className="text-sm font-medium mb-1">Add Photos</p>
																		<p className="text-xs text-muted-foreground">
																			{photos.length}/10 photos
																		</p>
																	</div>
																</DropzoneEmptyState>
															</Dropzone>
														)}
														{canAddVideo && (
															<Dropzone
																onDrop={handleDrop}
																maxFiles={1}
																maxSize={500 * 1024 * 1024}
																accept={{ "video/*": [] }}
																className="w-full border-2 border-dashed"
															>
																<DropzoneEmptyState>
																	<div className="flex flex-col items-center justify-center py-4 text-center">
																		<Plus className="h-6 w-6 text-muted-foreground mb-2" />
																		<p className="text-sm font-medium mb-1">Add Video</p>
																		<p className="text-xs text-muted-foreground">1 video max</p>
																	</div>
																</DropzoneEmptyState>
															</Dropzone>
														)}
														{!canAddPhotos && !canAddVideo && (
															<div className="p-4 text-center text-sm text-muted-foreground border rounded-lg bg-muted/30">
																{photos.length >= 10
																	? "Maximum 10 photos reached"
																	: videos.length >= 1
																		? "Maximum 1 video reached"
																		: "Cannot add more media"}
															</div>
														)}
													</>
												)}
											</div>
										</ScrollArea>
									</div>

									{currentPost.lastError && (
										<div>
											<h4 className="text-sm font-semibold mb-2 text-red-600">Error</h4>
											<p className="text-sm text-red-600">{currentPost.lastError}</p>
										</div>
									)}
								</div>

								{/* Participants Section */}
								<div className="pt-4 border-t border-border">
									<h4 className="text-sm font-semibold mb-3">Created By</h4>
									{currentPost.creator ? (
										<div className="flex items-start gap-3">
											<Avatar className="size-7 border-[1.4px] border-background shrink-0">
												<AvatarImage
													src={
														currentPost.creator.image ||
														getDicebearUrl(currentPost.creator.id)
													}
												/>
											</Avatar>
											<div className="flex-1 min-w-0">
												<div className="flex items-center gap-1.5 mb-1">
													<p className="text-[13px] font-medium text-foreground leading-[18px]">
														{currentPost.creator.name}
													</p>
												</div>
												<p className="text-xs text-muted-foreground leading-none">
													{currentPost.creator.email}
												</p>
											</div>
											<CheckCircle2 className="size-3 text-green-500 shrink-0" />
										</div>
									) : (
										<div className="flex items-start gap-3">
											<Avatar className="size-7 border-[1.4px] border-background shrink-0">
												<AvatarImage
													src={getDicebearUrl(currentPost.createdBy)}
												/>
											</Avatar>
											<div className="flex-1 min-w-0">
												<p className="text-[13px] font-medium text-foreground leading-[18px]">
													User
												</p>
											</div>
										</div>
									)}
								</div>
							</div>
						</div>
					</div>
				</SheetContent>
			</Sheet>

			{/* Delete Confirmation Dialog */}
			<Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							{currentPost?.published ? "Delete Published Post" : "Delete Scheduled Post"}
						</DialogTitle>
						<DialogDescription>
							{currentPost?.published ? (
								<>
									Are you sure you want to delete this post? This will only delete the record from our database.
									<br />
									<br />
									<strong className="text-foreground">
										The post will remain on Facebook and will not be removed from the Facebook page.
									</strong>
									<br />
									<br />
									This action cannot be undone.
								</>
							) : (
								"Are you sure you want to delete this scheduled post? This action cannot be undone."
							)}
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setDeleteDialogOpen(false)}
							disabled={deleteMutation.isPending}
						>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={handleDelete}
							disabled={deleteMutation.isPending}
						>
							{deleteMutation.isPending ? "Deleting..." : "Delete"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}


