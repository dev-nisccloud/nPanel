"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "@/components/ui/sonner";
import { z } from "zod";
import { Upload, X, Image, Video, File, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { captureEvent } from "@/lib/posthog";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon } from "lucide-react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { Dropzone, DropzoneEmptyState, DropzoneContent } from "@/components/ui/shadcn-io/dropzone";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { uploadFiles } from "@/hooks/use-uploadthing";
import { UPLOAD_ENDPOINTS } from "@/lib/uploadthing";
import { trpc } from "@/utils/trpc";

const FormSchema = z.object({
	message: z.string().optional(),
	scheduledPublishTime: z.date(),
}).refine(
	(data) => {
		// At least message or media must be provided
		return true; // We'll validate media separately
	},
	{
		message: "Either message or at least one media item must be provided",
	}
);

interface MediaItem {
	id: string;
	file: File;
	url?: string;
	mediaType: "PHOTO" | "VIDEO";
	caption?: string;
	description?: string;
	uploadProgress?: number;
	isUploading?: boolean;
}

interface CreateContentCalendarDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	pageTokenId: string;
	onSuccess?: () => void;
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

function formatFileSize(bytes: number): string {
	if (bytes === 0) return "0 Bytes";
	const k = 1024;
	const sizes = ["Bytes", "KB", "MB", "GB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export function CreateContentCalendarDialog({
	open,
	onOpenChange,
	pageTokenId,
	onSuccess,
}: CreateContentCalendarDialogProps) {
	const [isSubmitting, setIsSubmitting] = React.useState(false);
	const [mediaItems, setMediaItems] = React.useState<MediaItem[]>([]);
	const [datePickerOpen, setDatePickerOpen] = React.useState(false);
	const [dateTime, setDateTime] = React.useState<Date | undefined>(new Date());
	const [selectedMediaType, setSelectedMediaType] = React.useState<"PHOTO" | "VIDEO" | null>(null);

	const utils = trpc.useUtils();
	const createMutation = trpc.socialMediaMarketing.meta.contentCalendar.create.useMutation({
		onSuccess: (_data, variables) => {
			const postType =
				variables.mediaItems?.[0]?.mediaType?.toLowerCase() ||
				(variables.message ? "text" : "unknown");
			captureEvent("facebook_content_calendar_created", { posts_count: 1 });
			captureEvent("facebook_post_scheduled", {
				post_type: postType,
				scheduled_date: new Date(variables.scheduledPublishTime).toISOString(),
			});
			toast.success("Content calendar post created successfully!");
			form.reset();
			setMediaItems([]);
			setDateTime(new Date());
			onOpenChange(false);
			onSuccess?.();
		},
		onError: (error) => {
			toast.error("Failed to create post", {
				description: error.message || "Please try again.",
			});
		},
	});

	const form = useForm<z.infer<typeof FormSchema>>({
		resolver: zodResolver(FormSchema),
		defaultValues: {
			message: "",
			scheduledPublishTime: new Date(),
		},
	});

	// Reset form when dialog closes
	React.useEffect(() => {
		if (!open) {
			form.reset();
			setMediaItems([]);
			setDateTime(new Date());
			setSelectedMediaType(null);
		}
	}, [open, form]);

	const handleDrop = React.useCallback((acceptedFiles: File[]) => {
		if (!selectedMediaType) {
			toast.error("Please select a media type (Photo or Video) first");
			return;
		}

		acceptedFiles.forEach((file) => {
			const isVideo = file.type.startsWith("video/");
			const isImage = file.type.startsWith("image/");

			// Validate file type matches selected media type
			if (selectedMediaType === "VIDEO" && !isVideo) {
				toast.error(`File "${file.name}" is not a valid video. Please select video files only.`);
				return;
			}
			if (selectedMediaType === "PHOTO" && !isImage) {
				toast.error(`File "${file.name}" is not a valid image. Please select image files only.`);
				return;
			}

			// Check if we already have a video (only one video allowed)
			if (selectedMediaType === "VIDEO" && mediaItems.length >= 1) {
				toast.error("Only one video is allowed per post");
				return;
			}

			// Check photo limit (up to 10 photos)
			if (selectedMediaType === "PHOTO" && mediaItems.length >= 10) {
				toast.error("Maximum 10 photos allowed per post");
				return;
			}

			const newItem: MediaItem = {
				id: `media_${Date.now()}_${Math.random()}`,
				file,
				mediaType: selectedMediaType,
			};

			setMediaItems((prev) => [...prev, newItem]);
		});
	}, [selectedMediaType, mediaItems]);

	const handleRemoveMedia = React.useCallback((id: string) => {
		setMediaItems((prev) => prev.filter((item) => item.id !== id));
	}, []);

	const handleUpdateMediaCaption = React.useCallback((id: string, caption: string) => {
		setMediaItems((prev) =>
			prev.map((item) =>
				item.id === id
					? { ...item, caption: item.mediaType === "PHOTO" ? caption : item.caption }
					: item
			)
		);
	}, []);

	const handleUpdateMediaDescription = React.useCallback((id: string, description: string) => {
		setMediaItems((prev) =>
			prev.map((item) =>
				item.id === id
					? { ...item, description: item.mediaType === "VIDEO" ? description : item.description }
					: item
			)
		);
	}, []);

	const uploadMediaItem = React.useCallback(async (item: MediaItem): Promise<string> => {
		return new Promise((resolve, reject) => {
			// Update item to show uploading
			setMediaItems((prev) =>
				prev.map((i) => (i.id === item.id ? { ...i, isUploading: true, uploadProgress: 0 } : i))
			);

			// Use CONTENT_CALENDAR_MEDIA endpoint which supports both images and videos
			// Images: up to 10 files, 32MB each
			// Videos: up to 1 file, 500MB
			uploadFiles(UPLOAD_ENDPOINTS.CONTENT_CALENDAR_MEDIA, {
				files: [item.file],
				onUploadBegin: () => {
					setMediaItems((prev) =>
						prev.map((i) => (i.id === item.id ? { ...i, isUploading: true, uploadProgress: 0 } : i))
					);
				},
				onUploadProgress: (progress) => {
					const normalizedProgress = normalizeProgress(progress);
					setMediaItems((prev) =>
						prev.map((i) => (i.id === item.id ? { ...i, uploadProgress: normalizedProgress } : i))
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
					setMediaItems((prev) =>
						prev.map((i) => (i.id === item.id ? { ...i, url: fileUrl, isUploading: false, uploadProgress: 100 } : i))
					);
					resolve(fileUrl);
				})
				.catch((error) => {
					setMediaItems((prev) =>
						prev.map((i) => (i.id === item.id ? { ...i, isUploading: false } : i))
					);
					reject(error);
				});
		});
	}, []);

	const onSubmit = async (data: z.infer<typeof FormSchema>) => {
		// Validate: need at least message or media
		if (!data.message?.trim() && mediaItems.length === 0) {
			toast.error("Either message or at least one media item must be provided");
			return;
		}

		// Validate scheduled time is in the future
		const scheduledTime = dateTime || data.scheduledPublishTime;
		if (scheduledTime <= new Date()) {
			toast.error("Scheduled publish time must be in the future");
			return;
		}

		setIsSubmitting(true);

		try {
			// Upload all media items first
			const uploadedMediaItems = await Promise.all(
				mediaItems.map(async (item) => {
					if (item.url) {
						// Already uploaded
						return {
							url: item.url,
							mediaType: item.mediaType,
							caption: item.caption,
							description: item.description,
							fileName: item.file.name,
							fileSize: item.file.size,
						};
					}
					const url = await uploadMediaItem(item);
					return {
						url,
						mediaType: item.mediaType,
						caption: item.caption,
						description: item.description,
						fileName: item.file.name,
						fileSize: item.file.size,
					};
				})
			);

			// Create calendar post in database only (no Meta API publishing)
			// Publishing to Meta will be handled by a separate scheduler/service
			await createMutation.mutateAsync({
				pageTokenId,
				message: data.message?.trim() || undefined,
				scheduledPublishTime: scheduledTime,
				mediaItems: uploadedMediaItems.length > 0
					? uploadedMediaItems.map((item, index) => ({
							url: item.url,
							mediaType: item.mediaType,
							fileName: item.fileName,
							fileSize: item.fileSize,
							caption: item.caption,
							description: item.description,
							order: index, // Set order based on array index
						}))
					: undefined,
			});
		} catch (error) {
			console.error("Error creating content calendar post:", error);
			// Error is handled by mutation onError
		} finally {
			setIsSubmitting(false);
		}
	};

	const isUploading = mediaItems.some((item) => item.isUploading);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Create Scheduled Post</DialogTitle>
					<DialogDescription>
						Schedule a post for your Facebook page. Add text, photos, or video.
					</DialogDescription>
				</DialogHeader>

				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						{/* Message */}
						<FormField
							control={form.control}
							name="message"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Message (Optional)</FormLabel>
									<FormControl>
										<Textarea
											placeholder="What's on your mind?"
											className="resize-none"
											rows={4}
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						{/* Scheduled Publish Time */}
						<FormField
							control={form.control}
							name="scheduledPublishTime"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Scheduled Publish Time</FormLabel>
									<FormControl>
										<div className="space-y-2">
											<Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
												<PopoverTrigger asChild>
													<Button
														variant="outline"
														className={cn(
															"w-full justify-start text-left font-normal",
															!dateTime && "text-muted-foreground"
														)}
													>
														<CalendarIcon className="mr-2 h-4 w-4" />
														{dateTime ? format(dateTime, "PPP") : <span>Pick a date</span>}
													</Button>
												</PopoverTrigger>
												<PopoverContent className="w-auto p-0" align="start">
													<Calendar
														mode="single"
														selected={dateTime}
														onSelect={(date) => {
															setDateTime(date);
															field.onChange(date);
															setDatePickerOpen(false);
														}}
														disabled={(date) => date < new Date()}
														initialFocus
													/>
												</PopoverContent>
											</Popover>
											<Input
												type="time"
												value={dateTime ? format(dateTime, "HH:mm") : ""}
												onChange={(e) => {
													const time = e.target.value;
													if (time && dateTime) {
														const [hours, minutes] = time.split(":").map(Number);
														const newDate = new Date(dateTime);
														newDate.setHours(hours, minutes);
														setDateTime(newDate);
														field.onChange(newDate);
													}
												}}
											/>
										</div>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						{/* Media Upload */}
						<div className="space-y-2">
							<Label>Media (Optional)</Label>
							
							{/* Media Type Selector */}
							<Select
								value={selectedMediaType || ""}
								onValueChange={(value) => {
									if (mediaItems.length === 0) {
										setSelectedMediaType(value as "PHOTO" | "VIDEO" | null);
									} else {
										toast.error("Please remove all media items before changing media type");
									}
								}}
								disabled={mediaItems.length > 0}
							>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="Select media type (Photo or Video)" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="PHOTO">
										<div className="flex items-center gap-2">
											<Image className="h-4 w-4" />
											<span>Photo (up to 10)</span>
										</div>
									</SelectItem>
									<SelectItem value="VIDEO">
										<div className="flex items-center gap-2">
											<Video className="h-4 w-4" />
											<span>Video (1 max)</span>
										</div>
									</SelectItem>
								</SelectContent>
							</Select>
							{mediaItems.length > 0 && (
								<p className="text-xs text-muted-foreground">
									Media type: {selectedMediaType === "PHOTO" ? "Photos" : "Video"}. Remove all items to change type.
								</p>
							)}

							{/* Dropzone - only show if media type is selected */}
							{selectedMediaType && mediaItems.length === 0 && (
								<Dropzone
									onDrop={handleDrop}
									maxFiles={selectedMediaType === "VIDEO" ? 1 : 10}
									maxSize={100 * 1024 * 1024} // 100MB
									accept={selectedMediaType === "VIDEO" ? { "video/*": [] } : { "image/*": [] }}
									className={cn(
										"w-full border-2 border-dashed transition-colors",
										mediaItems.length > 0 && "border-primary/50"
									)}
								>
									<DropzoneEmptyState>
										<div className="flex flex-col items-center justify-center py-8 text-center">
											<div className="mb-3 p-3 bg-primary/10 rounded-full">
												{selectedMediaType === "VIDEO" ? (
													<Video className="h-6 w-6 text-primary" />
												) : (
													<Image className="h-6 w-6 text-primary" />
												)}
											</div>
											<p className="text-sm font-medium mb-1">
												Upload {selectedMediaType === "VIDEO" ? "Video" : "Photo"}
											</p>
											<p className="text-xs text-muted-foreground">
												Drag and drop or click to select
											</p>
											<p className="text-xs text-muted-foreground mt-1">
												{selectedMediaType === "VIDEO" ? "Video only (1 max)" : "Photos only (up to 10)"}
											</p>
										</div>
									</DropzoneEmptyState>
								</Dropzone>
							)}

							{/* Media Items List */}
							{mediaItems.length > 0 && (
								<div className="space-y-3">
									{mediaItems.map((item, index) => (
										<div key={item.id} className="p-4 bg-muted/50 rounded-lg border">
											<div className="flex items-start gap-3">
												<div className="flex-shrink-0 p-2 bg-background rounded-md">
													{item.mediaType === "VIDEO" ? (
														<Video className="h-5 w-5 text-muted-foreground" />
													) : (
														<Image className="h-5 w-5 text-muted-foreground" />
													)}
												</div>
												<div className="flex-1 min-w-0 space-y-2">
													<div>
														<p className="text-sm font-medium truncate">{item.file.name}</p>
														<p className="text-xs text-muted-foreground">
															{formatFileSize(item.file.size)}
														</p>
													</div>

													{/* Upload Progress */}
													{item.isUploading && (
														<div className="space-y-1">
															<Progress value={item.uploadProgress || 0} className="h-2" />
															<p className="text-xs text-muted-foreground">
																Uploading... {item.uploadProgress || 0}%
															</p>
														</div>
													)}

													{/* Caption for photos */}
													{item.mediaType === "PHOTO" && (
														<Input
															placeholder="Add caption (optional)"
															value={item.caption || ""}
															onChange={(e) => handleUpdateMediaCaption(item.id, e.target.value)}
															className="h-8 text-xs"
														/>
													)}

													{/* Description for videos */}
													{item.mediaType === "VIDEO" && (
														<Textarea
															placeholder="Add description (optional)"
															value={item.description || ""}
															onChange={(e) => handleUpdateMediaDescription(item.id, e.target.value)}
															className="h-16 text-xs resize-none"
															rows={2}
														/>
													)}
												</div>
												<Button
													type="button"
													variant="ghost"
													size="icon"
													className="h-8 w-8"
													onClick={() => handleRemoveMedia(item.id)}
													disabled={item.isUploading}
												>
													<Trash2 className="h-4 w-4" />
												</Button>
											</div>
										</div>
									))}

									{/* Add more media button (only for photos) */}
									{selectedMediaType === "PHOTO" && mediaItems.length > 0 && mediaItems.length < 10 && (
										<Dropzone
											onDrop={handleDrop}
											maxFiles={10 - mediaItems.length}
											maxSize={100 * 1024 * 1024}
											accept={{ "image/*": [] }}
											className="w-full border-2 border-dashed"
										>
											<DropzoneEmptyState>
												<div className="flex items-center justify-center w-full px-4 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md text-sm font-medium transition-colors cursor-pointer">
													<Plus className="mr-2 h-4 w-4" />
													Add more photos ({mediaItems.length}/10)
												</div>
											</DropzoneEmptyState>
										</Dropzone>
									)}
								</div>
							)}
						</div>

						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={() => onOpenChange(false)}
								disabled={isSubmitting || isUploading}
							>
								Cancel
							</Button>
							<Button type="submit" disabled={isSubmitting || isUploading}>
								{(isSubmitting || isUploading) ? (
									<>
										<Spinner className="mr-2 h-4 w-4" />
										{isUploading ? "Uploading..." : "Creating..."}
									</>
								) : (
									"Create Post"
								)}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}

