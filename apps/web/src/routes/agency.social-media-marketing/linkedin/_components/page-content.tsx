"use client";

import * as React from "react";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, ExternalLink, Heart, MessageCircle, Share2, Calendar, ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react";
import { trpc } from "@/utils/trpc";
import type { PageContentItem } from "./schemas";
import {
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
} from "@/components/ui/carousel";
import {
	Dialog,
	DialogContent,
	DialogTitle,
} from "@/components/ui/dialog";
import { PageInformation } from "./page-information";
import { useLinkedInCacheInvalidation } from "./use-linkedin-cache-invalidation";
import { useEffect } from "react";
import { CalendarView } from "@/components/calendar/calendar-view";
import { ContentCalendarControls } from "./content-calendar-controls";
import { CreateContentCalendarDialog } from "./create-content-calendar-dialog";
import { ContentCalendarEventSheet } from "./content-calendar-event-sheet";

interface PageContentProps {
	pageId: string;
	pageName?: string;
}

// Skeleton component for loading state
const ContentSkeleton = () => (
	<div className="space-y-4">
		{[...Array(3)].map((_, i) => (
			<Card key={i}>
				<CardContent className="pt-6">
					<div className="space-y-4">
						<Skeleton className="h-4 w-32" />
						<Skeleton className="h-4 w-full" />
						<Skeleton className="h-4 w-3/4" />
						<Skeleton className="h-64 w-full" />
						<div className="flex items-center gap-4">
							<Skeleton className="h-4 w-16" />
							<Skeleton className="h-4 w-16" />
							<Skeleton className="h-4 w-16" />
						</div>
					</div>
				</CardContent>
			</Card>
		))}
	</div>
);

const formatDate = (dateString?: string) => {
	if (!dateString) return "Unknown date";
	try {
		const date = new Date(dateString);
		return date.toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	} catch {
		return dateString;
	}
};

// Component to render text with hashtag styling
const PostText = ({ text, isExpanded, onToggle }: { text: string; isExpanded: boolean; onToggle: () => void }) => {
	// Check if text exceeds 4 lines (approximately 4 * 1.5rem = 6rem)
	const textRef = React.useRef<HTMLDivElement>(null);
	const [shouldShowToggle, setShouldShowToggle] = React.useState(false);

	React.useEffect(() => {
		if (textRef.current) {
			const lineHeight = 24; // Approximate line height in pixels
			const maxHeight = lineHeight * 4; // 4 lines
			const actualHeight = textRef.current.scrollHeight;
			setShouldShowToggle(actualHeight > maxHeight);
		}
	}, [text]);

	// Split text and identify hashtags
	const renderTextWithHashtags = (text: string) => {
		// Split by spaces and process each word
		// Use regex to split while preserving spaces
		const parts = text.split(/(\s+)/);

		return parts.map((part, index) => {
			// Check if part starts with # and has more characters
			if (part.startsWith('#') && part.length > 1 && !part.includes(' ')) {
				return (
					<span key={index} className="text-primary font-medium">
						{part}
					</span>
				);
			}
			return <span key={index}>{part}</span>;
		});
	};

	return (
		<div className="space-y-2">
			<div
				ref={textRef}
				className={`text-sm whitespace-pre-wrap leading-relaxed ${!isExpanded && shouldShowToggle
					? 'line-clamp-4'
					: ''
					}`}
				style={{
					maxHeight: !isExpanded && shouldShowToggle ? '6rem' : 'none',
					overflow: !isExpanded && shouldShowToggle ? 'hidden' : 'visible',
				}}
			>
				{renderTextWithHashtags(text)}
			</div>
			{shouldShowToggle && (
				<Button
					variant="ghost"
					size="sm"
					onClick={onToggle}
					className="h-auto p-0 text-xs text-primary hover:text-primary/80 font-medium"
				>
					{isExpanded ? "Show less" : "Read more"}
				</Button>
			)}
		</div>
	);
};

// Media carousel component
const MediaCarousel = ({ mediaItems, postId }: { mediaItems: any[]; postId: string }) => {
	const [fullscreenOpen, setFullscreenOpen] = React.useState(false);
	const [fullscreenIndex, setFullscreenIndex] = React.useState(0);
	const [api, setApi] = React.useState<any>();
	const [fullscreenApi, setFullscreenApi] = React.useState<any>();
	const [currentIndex, setCurrentIndex] = React.useState(0);

	React.useEffect(() => {
		if (!api) return;
		setCurrentIndex(api.selectedScrollSnap());
		api.on("select", () => {
			setCurrentIndex(api.selectedScrollSnap());
		});
	}, [api]);

	React.useEffect(() => {
		if (!fullscreenApi) return;
		fullscreenApi.scrollTo(fullscreenIndex);
	}, [fullscreenApi, fullscreenIndex]);

	const openFullscreen = (index: number) => {
		setFullscreenIndex(index);
		setFullscreenOpen(true);
	};

	const MEDIA_HEIGHT = "500px"; // Fixed height for all media

	const hasMultipleItems = mediaItems.length > 1;

	return (
		<>
			<div className="relative w-full overflow-hidden" style={{ height: MEDIA_HEIGHT, maxWidth: '100%' }}>
				{hasMultipleItems ? (
					<Carousel
						setApi={setApi}
						className="w-full h-full max-w-full"
						opts={{
							align: "start",
							loop: false,
							slidesToScroll: 1,
							dragFree: false,
						}}
					>
						<CarouselContent className="h-full -ml-0 w-full">
							{mediaItems.map((mediaItem: any, index: number) => {
								const mediaType = mediaItem.media_type || mediaItem.type;
								const isVideo = mediaType === 'video' || mediaType === 'video_autoplay';
								const isPhoto = mediaType === 'photo' || !isVideo;

								const imageSrc = mediaItem.media?.image?.src || mediaItem.url;
								const videoSrc = mediaItem.media?.source;

								return (
									<CarouselItem key={index} className="pl-0 basis-full shrink-0 grow-0 h-full w-full min-w-full max-w-full">
										<div className="relative w-full h-full rounded-lg overflow-hidden border bg-black/5">
											{isVideo && videoSrc ? (
												<video
													src={videoSrc}
													controls
													className="w-full h-full object-contain"
													poster={imageSrc}
												>
													Your browser does not support the video tag.
												</video>
											) : isPhoto && imageSrc ? (
												<img
													src={imageSrc}
													alt={`Post media ${index + 1}`}
													className="w-full h-full object-contain"
													onError={(e) => {
														e.currentTarget.style.display = "none";
													}}
												/>
											) : null}
										</div>
									</CarouselItem>
								);
							})}
						</CarouselContent>
						<CarouselPrevious className="left-2 z-10" />
						<CarouselNext className="right-2 z-10" />
						{/* Fullscreen button */}
						<Button
							variant="secondary"
							size="icon"
							className="absolute bottom-2 right-2 h-8 w-8 rounded-full bg-black/50 hover:bg-black/70 text-white border-0 z-10"
							onClick={() => openFullscreen(currentIndex)}
						>
							<Maximize2 className="h-4 w-4" />
						</Button>
						{/* Media counter */}
						<div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-2 py-1 rounded-full z-10">
							{currentIndex + 1} / {mediaItems.length}
						</div>
					</Carousel>
				) : (
					// Single media item
					<div className="relative w-full h-full rounded-lg overflow-hidden border bg-black/5">
						{mediaItems[0] && (() => {
							const mediaItem = mediaItems[0];
							const mediaType = mediaItem.media_type || mediaItem.type;
							const isVideo = mediaType === 'video' || mediaType === 'video_autoplay';
							const isPhoto = mediaType === 'photo' || !isVideo;

							const imageSrc = mediaItem.media?.image?.src || mediaItem.url;
							const videoSrc = mediaItem.media?.source;

							return (
								<>
									{isVideo && videoSrc ? (
										<video
											src={videoSrc}
											controls
											className="w-full h-full object-contain"
											poster={imageSrc}
										>
											Your browser does not support the video tag.
										</video>
									) : isPhoto && imageSrc ? (
										<img
											src={imageSrc}
											alt="Post media"
											className="w-full h-full object-contain"
											onError={(e) => {
												e.currentTarget.style.display = "none";
											}}
										/>
									) : null}
									{/* Fullscreen button for single item */}
									<Button
										variant="secondary"
										size="icon"
										className="absolute bottom-2 right-2 h-8 w-8 rounded-full bg-black/50 hover:bg-black/70 text-white border-0 z-10"
										onClick={() => openFullscreen(0)}
									>
										<Maximize2 className="h-4 w-4" />
									</Button>
								</>
							);
						})()}
					</div>
				)}
			</div>

			{/* Fullscreen Dialog */}
			<Dialog open={fullscreenOpen} onOpenChange={setFullscreenOpen}>
				<DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full p-0 bg-black/95 border-0" showCloseButton={false}>
					<DialogTitle className="sr-only">
						{hasMultipleItems
							? `Fullscreen media viewer - Item ${fullscreenIndex + 1} of ${mediaItems.length}`
							: 'Fullscreen media viewer'
						}
					</DialogTitle>
					<div className="relative w-full h-full flex items-center justify-center">
						<Button
							variant="ghost"
							size="icon"
							className="absolute top-4 right-4 z-50 text-white hover:bg-white/20 h-10 w-10 bg-black/30 backdrop-blur-sm"
							onClick={() => setFullscreenOpen(false)}
						>
							<X className="h-6 w-6" />
						</Button>

						{hasMultipleItems ? (
							<>
								<Button
									variant="ghost"
									size="icon"
									className="absolute left-4 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20 h-12 w-12 bg-black/30 backdrop-blur-sm border border-white/20"
									onClick={() => {
										const newIndex = fullscreenIndex > 0 ? fullscreenIndex - 1 : mediaItems.length - 1;
										setFullscreenIndex(newIndex);
									}}
								>
									<ChevronLeft className="h-8 w-8" />
								</Button>
								<Button
									variant="ghost"
									size="icon"
									className="absolute right-4 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20 h-12 w-12 bg-black/30 backdrop-blur-sm border border-white/20"
									onClick={() => {
										const newIndex = fullscreenIndex < mediaItems.length - 1 ? fullscreenIndex + 1 : 0;
										setFullscreenIndex(newIndex);
									}}
								>
									<ChevronRight className="h-8 w-8" />
								</Button>
								<div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 bg-black/50 backdrop-blur-sm text-white text-sm px-4 py-2 rounded-full border border-white/20">
									{fullscreenIndex + 1} / {mediaItems.length}
								</div>
							</>
						) : null}

						<div className="w-full h-full flex items-center justify-center p-4">
							{mediaItems[fullscreenIndex] && (() => {
								const mediaItem = mediaItems[fullscreenIndex];
								const mediaType = mediaItem.media_type || mediaItem.type;
								const isVideo = mediaType === 'video' || mediaType === 'video_autoplay';
								const isPhoto = mediaType === 'photo' || !isVideo;

								const imageSrc = mediaItem.media?.image?.src || mediaItem.url;
								const videoSrc = mediaItem.media?.source;

								return (
									<>
										{isVideo && videoSrc ? (
											<video
												src={videoSrc}
												controls
												className="max-w-full max-h-full w-auto h-auto object-contain"
												poster={imageSrc}
												autoPlay
											>
												Your browser does not support the video tag.
											</video>
										) : isPhoto && imageSrc ? (
											<img
												src={imageSrc}
												alt={`Post media ${fullscreenIndex + 1}`}
												className="max-w-full max-h-full w-auto h-auto object-contain"
												onError={(e) => {
													e.currentTarget.style.display = "none";
												}}
											/>
										) : null}
									</>
								);
							})()}
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
};

// Post item component to manage its own state
const PostItem = ({ item }: { item: PageContentItem }) => {
	const [isTextExpanded, setIsTextExpanded] = React.useState(false);
	const likesCount = item.likes?.summary?.total_count || 0;
	const commentsCount = item.comments?.summary?.total_count || 0;
	const sharesCount = item.shares?.count || 0;
	const postUrl = item.permalink_url || item.link || `https://linkedin.com/feed/update/${item.id}`;
	const postText = item.message || item.story || "";

	// Collect all media items from attachments
	const mediaItems: any[] = [];

	if (item.attachments?.data) {
		item.attachments.data.forEach((attachment: any) => {
			// Add main attachment if it has media
			if (attachment.media) {
				mediaItems.push(attachment);
			}

			// Add subattachments (for albums/carousels)
			if (attachment.subattachments?.data) {
				mediaItems.push(...attachment.subattachments.data);
			}
		});
	}

	// If no attachments but we have full_picture, add it as a single media item
	if (mediaItems.length === 0 && item.full_picture) {
		mediaItems.push({
			media_type: 'photo',
			type: 'photo',
			media: {
				image: {
					src: item.full_picture,
				},
			},
		});
	}

	return (
		<Card>
			<CardContent className="pt-6">
				<div className="space-y-4">
					{/* Date at top */}
					<div className="flex items-center gap-2 text-sm text-muted-foreground">
						<Calendar className="h-4 w-4" />
						{formatDate(item.created_time)}
					</div>

					{/* Post text with read more/less */}
					{postText && (
						<PostText
							text={postText}
							isExpanded={isTextExpanded}
							onToggle={() => setIsTextExpanded(!isTextExpanded)}
						/>
					)}

					{/* Media carousel */}
					{mediaItems.length > 0 && (
						<MediaCarousel mediaItems={mediaItems} postId={item.id} />
					)}

					{/* Engagement metrics */}
					<div className="flex items-center gap-4 text-sm text-muted-foreground pt-2 border-t">
						{likesCount > 0 && (
							<div className="flex items-center gap-1">
								<Heart className="h-4 w-4" />
								<span>{likesCount.toLocaleString()}</span>
							</div>
						)}
						{commentsCount > 0 && (
							<div className="flex items-center gap-1">
								<MessageCircle className="h-4 w-4" />
								<span>{commentsCount.toLocaleString()}</span>
							</div>
						)}
						{sharesCount > 0 && (
							<div className="flex items-center gap-1">
								<Share2 className="h-4 w-4" />
								<span>{sharesCount.toLocaleString()}</span>
							</div>
						)}
					</div>

					{/* View on LinkedIn button */}
					<div className="flex items-center gap-2 pt-2 border-t">
						<Button
							variant="ghost"
							size="sm"
							className="h-8 text-xs"
							onClick={() => window.open(postUrl, "_blank")}
						>
							<ExternalLink className="mr-1 h-3 w-3" />
							View on LinkedIn
						</Button>
					</div>
				</div>
			</CardContent>
		</Card>
	);
};

export function PageContent({ pageId, pageName }: PageContentProps) {
	const { invalidateOrganizationQueries } = useLinkedInCacheInvalidation();
	const [statusFilter, setStatusFilter] = React.useState<"all" | "SCHEDULED" | "PUBLISHED" | "FAILED" | "CANCELLED" | "DRAFT">("all");
	const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
	const [selectedPost, setSelectedPost] = React.useState<any>(null);
	const [eventSheetOpen, setEventSheetOpen] = React.useState(false);
	const [pageTokenId, setPageTokenId] = React.useState<string | null>(null);

	// Get organization token ID from organization ID
	const { data: pageTokenData } = trpc.socialMediaMarketing.linkedin.pages.getPageTokenId.useQuery(
		{ pageId },
		{
			enabled: !!pageId,
			staleTime: 10 * 60 * 1000, // 10 minutes
			gcTime: 30 * 60 * 1000,
		}
	);

	React.useEffect(() => {
		if (pageTokenData?.data?.pageTokenId) {
			setPageTokenId(pageTokenData.data.pageTokenId);
		}
	}, [pageTokenData]);

	// Get content calendar posts
	const {
		data: calendarData,
		isLoading: isLoadingCalendar,
		refetch: refetchCalendar,
	} = trpc.socialMediaMarketing.linkedin.contentCalendar.getAll.useQuery(
		{
			pageTokenId: pageTokenId || undefined,
			status: statusFilter !== "all" ? statusFilter : undefined,
			limit: 100,
		},
		{
			enabled: !!pageTokenId,
			staleTime: 1 * 60 * 1000, // 1 minute
			gcTime: 5 * 60 * 1000,
		}
	);

	const {
		data,
		isLoading,
		isFetching,
		error,
		refetch,
	} = trpc.socialMediaMarketing.linkedin.content.getContent.useQuery(
		{
			orgId: pageId,
			useStoredToken: true,
			limit: 25,
		},
		{
			enabled: !!pageId,
			staleTime: 2 * 60 * 1000, // 2 minutes - posts change frequently
			gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache
			refetchOnWindowFocus: false,
			refetchOnReconnect: true,
			refetchOnMount: false, // Don't refetch if data exists in cache
			retry: (failureCount, error: any) => {
				// Don't retry on authentication errors
				if (error?.data?.code === "UNAUTHORIZED") return false;
				// Don't retry on bad request errors
				if (error?.data?.code === "BAD_REQUEST") return false;
				// Retry up to 2 times for other errors
				return failureCount < 2;
			},
			retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
		}
	);

	// Invalidate cache when token errors are detected
	useEffect(() => {
		if (error) {
			const errorData = error.data as any;
			if (errorData?.code === "UNAUTHORIZED" || errorData?.cause?.requiresTokenRefresh) {
				invalidateOrganizationQueries(pageId);
			}
		}
	}, [error, pageId, invalidateOrganizationQueries]);

	const content = data?.data || [];

	const handleRefresh = React.useCallback(() => {
		refetch();
	}, [refetch]);

	if (isLoading) {
		return (
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<Skeleton className="h-8 w-48" />
					<Skeleton className="h-10 w-24" />
				</div>
				<ContentSkeleton />
			</div>
		);
	}

	if (error) {
		return (
			<Card>
				<CardContent className="pt-6">
					<div className="flex flex-col items-center justify-center py-8 text-center">
						<p className="text-destructive mb-4">
							{error.message || "Failed to load page content"}
						</p>
						<Button onClick={handleRefresh} variant="outline" size="sm">
							<RefreshCw className="mr-2 h-4 w-4" />
							Try Again
						</Button>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<div>
					<h3 className="text-lg font-semibold">
						{pageName ? `${pageName}` : "Page"}
					</h3>
					<p className="text-sm text-muted-foreground">
						View page information and feed
					</p>
				</div>
			</div>

			<Tabs defaultValue="information" className="w-full">
				<TabsList className="grid w-full grid-cols-3">
					<TabsTrigger value="information">General Information</TabsTrigger>
					<TabsTrigger value="calendar">Content Calendar</TabsTrigger>
					<TabsTrigger value="feed">Feed</TabsTrigger>
				</TabsList>

				<TabsContent value="information" className="mt-4">
					<PageInformation pageId={pageId} pageName={pageName} />
				</TabsContent>

				<TabsContent value="calendar" className="mt-4">
					<div className="w-full space-y-4">
						<ContentCalendarControls
							statusFilter={statusFilter}
							setStatusFilter={setStatusFilter}
							onCreateClick={() => setCreateDialogOpen(true)}
						/>
						<div className="flex-1 overflow-hidden w-full">
							{isLoadingCalendar ? (
								<div className="flex items-center justify-center py-12">
									<Skeleton className="h-8 w-48" />
								</div>
							) : (
								<CalendarView
									events={calendarData?.posts?.map((post) => ({
										id: post.id,
										title: post.message || "Scheduled Post",
										date: format(new Date(post.scheduledPublishTime), "yyyy-MM-dd"),
										startTime: format(new Date(post.scheduledPublishTime), "HH:mm"),
										endTime: format(new Date(post.scheduledPublishTime), "HH:mm"),
										participants: [post.createdBy],
										meetingLink: undefined,
										timezone: undefined,
										postData: post,
									})) || []}
									onEventClick={(event: any) => {
										if (event.postData) {
											setSelectedPost(event.postData);
											setEventSheetOpen(true);
										}
									}}
								/>
							)}
						</div>
					</div>
					{!pageTokenId && (
						<Card>
							<CardContent className="pt-6">
								<div className="flex flex-col items-center justify-center py-8 text-center">
									<p className="text-lg font-semibold mb-2">Organization Token Not Found</p>
									<p className="text-muted-foreground text-sm">
										Unable to load content calendar. Please refresh the organizations list.
									</p>
								</div>
							</CardContent>
						</Card>
					)}
					{pageTokenId && (
						<>
							<CreateContentCalendarDialog
								open={createDialogOpen}
								onOpenChange={setCreateDialogOpen}
								pageTokenId={pageTokenId}
								onSuccess={() => {
									refetchCalendar();
								}}
							/>
							<ContentCalendarEventSheet
								post={selectedPost}
								open={eventSheetOpen}
								onOpenChange={setEventSheetOpen}
								onEdit={(post) => {
									// TODO: Implement edit functionality
									console.log("Edit post:", post);
								}}
								onDelete={() => {
									refetchCalendar();
								}}
							/>
						</>
					)}
				</TabsContent>

				<TabsContent value="feed" className="mt-4">
					<div className="space-y-4">
						<div className="flex items-center justify-end">
							<Button
								variant="outline"
								size="icon"
								onClick={handleRefresh}
								disabled={isFetching}
								title="Refresh content"
							>
								<RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
							</Button>
						</div>

						{content.length === 0 ? (
							<Card>
								<CardContent className="pt-6">
									<div className="flex flex-col items-center justify-center py-8 text-center">
										<p className="text-lg font-semibold mb-2">No posts found</p>
										<p className="text-muted-foreground text-sm">
											This page doesn't have any posts yet.
										</p>
									</div>
								</CardContent>
							</Card>
						) : (
							<div className="space-y-4">
								{content.map((item: PageContentItem) => (
									<PostItem key={item.id} item={item} />
								))}
							</div>
						)}
					</div>
				</TabsContent>
			</Tabs>
		</div>
	);
}
