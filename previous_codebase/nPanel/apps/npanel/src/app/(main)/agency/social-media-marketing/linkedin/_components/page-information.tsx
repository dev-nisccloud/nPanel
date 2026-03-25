"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, Globe, Phone, Mail, MapPin, Users, TrendingUp, MessageCircle, Heart, Share2, Eye, Play, UserPlus, ThumbsUp, Smile, Send } from "lucide-react";
import { trpc } from "@/utils/trpc";
import { Button } from "@/components/ui/button";
import { useLinkedInCacheInvalidation } from "./use-linkedin-cache-invalidation";
import { useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface PageInformationProps {
	pageId: string;
	pageName?: string;
}

// Skeleton component for loading state
const InformationSkeleton = () => (
	<div className="space-y-6">
		<Card>
			<CardHeader>
				<Skeleton className="h-6 w-48" />
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
					<Skeleton className="h-4 w-full" />
					<Skeleton className="h-4 w-3/4" />
					<div className="grid grid-cols-2 gap-4 mt-4">
						<Skeleton className="h-20" />
						<Skeleton className="h-20" />
					</div>
				</div>
			</CardContent>
		</Card>
		<Card>
			<CardHeader>
				<Skeleton className="h-6 w-48" />
			</CardHeader>
			<CardContent>
				<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
					{[...Array(4)].map((_, i) => (
						<Skeleton key={i} className="h-24" />
					))}
				</div>
			</CardContent>
		</Card>
	</div>
);

export function PageInformation({ pageId, pageName }: PageInformationProps) {
	const { invalidateOrganizationQueries } = useLinkedInCacheInvalidation();

	// All hooks must be at the top level, before any conditional returns
	const [publishDialogOpen, setPublishDialogOpen] = React.useState(false);
	const [testMessage, setTestMessage] = React.useState("Test post from nPanel - " + new Date().toLocaleString());
	const [photoUrls, setPhotoUrls] = React.useState<string[]>([""]);
	const [videoUrl, setVideoUrl] = React.useState("");

	const {
		data: pageData,
		isLoading: isLoadingPage,
		isFetching: isFetchingPage,
		error: pageError,
		refetch: refetchPage,
	} = trpc.socialMediaMarketing.linkedin.pages.getOrganization.useQuery(
		{
			orgId: pageId,
			useStoredToken: true,
		},
		{
			enabled: !!pageId,
			staleTime: 5 * 60 * 1000, // 5 minutes - page details change moderately
			gcTime: 20 * 60 * 1000, // 20 minutes - keep in cache
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

	// LinkedIn doesn't have the same analytics structure as Meta
	// For now, we'll skip insights or implement LinkedIn-specific analytics later
	const insightsData = React.useMemo(() => ({ data: [] }), []);
	const isLoadingInsights = false;
	const isFetchingInsights = false;
	const insightsError: any = null;
	const refetchInsights = React.useCallback(() => {}, []);

	const publishPostMutation = trpc.socialMediaMarketing.linkedin.content.publishPost.useMutation({
		onSuccess: (data) => {
			toast.success("Post published successfully!", {
				description: data.data?.postId ? `Post ID: ${data.data.postId}` : undefined,
			});
			setPublishDialogOpen(false);
			setTestMessage("Test post from nPanel - " + new Date().toLocaleString());
			setPhotoUrls([""]);
			setVideoUrl("");
		},
		onError: (error) => {
			toast.error("Failed to publish post", {
				description: error.message,
			});
		},
	});

	// Invalidate cache when token errors are detected
	useEffect(() => {
		if (pageError) {
			const errorData = pageError.data as any;
			if (errorData?.code === "UNAUTHORIZED" || errorData?.cause?.requiresTokenRefresh) {
				invalidateOrganizationQueries(pageId);
			}
		}
		if (insightsError) {
			const errorData = insightsError.data as any;
			if (errorData?.code === "UNAUTHORIZED" || errorData?.cause?.requiresTokenRefresh) {
				invalidateOrganizationQueries(pageId);
			}
		}
	}, [pageError, insightsError, pageId, invalidateOrganizationQueries]);

	const organization = pageData?.data;
	const insights: any[] = []; // LinkedIn analytics not implemented yet

	const handleRefresh = React.useCallback(() => {
		refetchPage();
		refetchInsights();
	}, [refetchPage, refetchInsights]);

	const handlePublishTestPost = React.useCallback(() => {
		// Validate: need at least message, photos, or video
		const hasMessage = testMessage.trim().length > 0;
		const validPhotoUrls = photoUrls.filter(url => url.trim().length > 0);
		const hasVideo = videoUrl.trim().length > 0;

		if (!hasMessage && validPhotoUrls.length === 0 && !hasVideo) {
			toast.error("Please enter a message, at least one photo URL, or a video URL");
			return;
		}

		const photos = validPhotoUrls.length > 0 
			? validPhotoUrls.map(url => ({ url: url.trim() }))
			: undefined;

		const video = hasVideo 
			? { file_url: videoUrl.trim() }
			: undefined;

		publishPostMutation.mutate({
			orgId: pageId,
			commentary: testMessage.trim() || undefined,
			photos: photos ? photos.map(p => ({ url: p.url })) : undefined,
			video: video ? { url: video.file_url } : undefined,
			useStoredToken: true,
		});
	}, [pageId, testMessage, photoUrls, videoUrl, publishPostMutation]);

	const addPhotoUrlField = React.useCallback(() => {
		setPhotoUrls([...photoUrls, ""]);
	}, [photoUrls]);

	const removePhotoUrlField = React.useCallback((index: number) => {
		setPhotoUrls(photoUrls.filter((_, i) => i !== index));
	}, [photoUrls]);

	const updatePhotoUrl = React.useCallback((index: number, url: string) => {
		const newUrls = [...photoUrls];
		newUrls[index] = url;
		setPhotoUrls(newUrls);
	}, [photoUrls]);

	if (isLoadingPage) {
		return (
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<Skeleton className="h-8 w-48" />
					<Skeleton className="h-10 w-24" />
				</div>
				<InformationSkeleton />
			</div>
		);
	}

	if (pageError) {
		return (
			<Card>
				<CardContent className="pt-6">
					<div className="flex flex-col items-center justify-center py-8 text-center">
						<p className="text-destructive mb-4">
							{pageError.message || "Failed to load page information"}
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

	if (!organization) {
		return (
			<Card>
				<CardContent className="pt-6">
					<div className="flex flex-col items-center justify-center py-8 text-center">
						<p className="text-lg font-semibold mb-2">Organization not found</p>
						<p className="text-muted-foreground text-sm">
							Unable to load information for this organization.
						</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	// Extract latest insight values
	const getLatestValue = (metricData: any) => {
		if (!metricData?.values || metricData.values.length === 0) return null;
		const latest = metricData.values[metricData.values.length - 1];
		return latest?.value || null;
	};

	const pageViews = insights?.find((m: any) => m.name === 'page_views_total');
	const postEngagements = insights?.find((m: any) => m.name === 'page_post_engagements');
	const impressionsUnique = insights?.find((m: any) => m.name === 'page_impressions_unique');
	const postsImpressions = insights?.find((m: any) => m.name === 'page_posts_impressions');
	const postsImpressionsUnique = insights?.find((m: any) => m.name === 'page_posts_impressions_unique');
	const videoViews = insights?.find((m: any) => m.name === 'page_video_views');
	const dailyFollows = insights?.find((m: any) => m.name === 'page_daily_follows');

	const pageViewsValue = pageViews ? getLatestValue(pageViews) : null;
	const postEngagementsValue = postEngagements ? getLatestValue(postEngagements) : null;
	const impressionsUniqueValue = impressionsUnique ? getLatestValue(impressionsUnique) : null;
	const postsImpressionsValue = postsImpressions ? getLatestValue(postsImpressions) : null;
	const postsImpressionsUniqueValue = postsImpressionsUnique ? getLatestValue(postsImpressionsUnique) : null;
	const videoViewsValue = videoViews ? getLatestValue(videoViews) : null;
	const dailyFollowsValue = dailyFollows ? getLatestValue(dailyFollows) : null;

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h3 className="text-lg font-semibold">
						{pageName ? `${pageName} Information` : "Organization Information"}
					</h3>
					<p className="text-sm text-muted-foreground">
						View organization details and analytics
					</p>
				</div>
				<div className="flex items-center gap-2">
					<Dialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
						<DialogTrigger asChild>
							<Button
								variant="default"
								size="sm"
								className="gap-2"
							>
								<Send className="h-4 w-4" />
								Test Publish Post
							</Button>
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>Publish Test Post</DialogTitle>
								<DialogDescription>
									Create and publish a test post to verify the publishing functionality.
								</DialogDescription>
							</DialogHeader>
							<div className="space-y-4 py-4">
								<div className="space-y-2">
									<Label htmlFor="message">Message (Optional)</Label>
									<Textarea
										id="message"
										placeholder="Enter your post message..."
										value={testMessage}
										onChange={(e) => setTestMessage(e.target.value)}
										rows={4}
									/>
								</div>

								<div className="space-y-2">
									<div className="flex items-center justify-between">
										<Label>Photo URLs</Label>
										<Button
											type="button"
											variant="ghost"
											size="sm"
											onClick={addPhotoUrlField}
											className="h-7 text-xs"
										>
											+ Add Photo URL
										</Button>
									</div>
									{photoUrls.map((url, index) => (
										<div key={index} className="flex items-center gap-2">
											<Input
												type="url"
												placeholder="https://example.com/image.jpg"
												value={url}
												onChange={(e) => updatePhotoUrl(index, e.target.value)}
											/>
											{photoUrls.length > 1 && (
												<Button
													type="button"
													variant="ghost"
													size="icon"
													onClick={() => removePhotoUrlField(index)}
													className="h-9 w-9"
												>
													×
												</Button>
											)}
										</div>
									))}
								</div>

								<div className="space-y-2">
									<Label htmlFor="videoUrl">Video URL (Optional)</Label>
									<Input
										id="videoUrl"
										type="url"
										placeholder="https://example.com/video.mp4"
										value={videoUrl}
										onChange={(e) => setVideoUrl(e.target.value)}
									/>
								</div>

								<p className="text-xs text-muted-foreground">
									Note: This will publish a real post to your LinkedIn organization. Media URLs must be publicly accessible.
								</p>
							</div>
							<DialogFooter>
								<Button
									variant="outline"
									onClick={() => setPublishDialogOpen(false)}
									disabled={publishPostMutation.isPending}
								>
									Cancel
								</Button>
								<Button
									onClick={handlePublishTestPost}
									disabled={publishPostMutation.isPending || (!testMessage.trim() && photoUrls.filter(url => url.trim()).length === 0 && !videoUrl.trim())}
								>
									{publishPostMutation.isPending ? "Publishing..." : "Publish Post"}
								</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>
					<Button
						variant="outline"
						size="icon"
						onClick={handleRefresh}
						disabled={isFetchingPage || isFetchingInsights}
						title="Refresh information"
					>
						<RefreshCw className={`h-4 w-4 ${isFetchingPage || isFetchingInsights ? "animate-spin" : ""}`} />
					</Button>
				</div>
			</div>

			{/* About Information Section */}
			<Card>
				<CardHeader>
					<CardTitle>About</CardTitle>
					<CardDescription>Basic information about this page</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						{organization.localizedName && (
							<div>
								<p className="text-sm font-medium mb-1">Name</p>
								<p className="text-sm text-muted-foreground">{organization.localizedName}</p>
							</div>
						)}

						{organization.vanityName && (
							<div>
								<p className="text-sm font-medium mb-1">Vanity Name</p>
								<p className="text-sm text-muted-foreground">{organization.vanityName}</p>
							</div>
						)}

						{organization.id && (
							<div className="pt-4 border-t">
								<p className="text-sm font-medium mb-1">Organization ID</p>
								<p className="text-sm text-muted-foreground">{organization.id}</p>
							</div>
						)}
					</div>
				</CardContent>
			</Card>

			{/* Analytics/Engagement Metrics Section */}
			<Card>
				<CardHeader>
					<CardTitle>Analytics & Engagement</CardTitle>
					<CardDescription>Page performance metrics</CardDescription>
				</CardHeader>
				<CardContent>
					{isLoadingInsights ? (
						<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
							{[...Array(12)].map((_, i) => (
								<Skeleton key={i} className="h-24" />
							))}
						</div>
					) : insightsError ? (
						<div className="text-center py-4">
							<p className="text-sm text-muted-foreground">
								Unable to load analytics. {insightsError.message}
							</p>
						</div>
					) : insights.length === 0 ? (
						<div className="text-center py-4">
							<p className="text-sm text-muted-foreground">
								LinkedIn analytics are not yet implemented. This feature will be available in a future update.
							</p>
						</div>
					) : (
						<div className="space-y-4">
							{/* Primary Metrics Row */}
							<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
								{/* Followers Count - LinkedIn doesn't provide this directly */}
								<div className="p-4 rounded-lg border bg-card">
									<div className="flex items-center gap-2 mb-2">
										<Users className="h-4 w-4 text-muted-foreground" />
										<p className="text-xs font-medium text-muted-foreground">Followers</p>
									</div>
									<p className="text-2xl font-bold">
										N/A
									</p>
									<p className="text-xs text-muted-foreground mt-1">LinkedIn API limitation</p>
								</div>

								{/* Page Views */}
								<div className="p-4 rounded-lg border bg-card">
									<div className="flex items-center gap-2 mb-2">
										<Eye className="h-4 w-4 text-muted-foreground" />
										<p className="text-xs font-medium text-muted-foreground">Page Views</p>
									</div>
									<p className="text-2xl font-bold">
										{pageViewsValue ? pageViewsValue.toLocaleString() : 'N/A'}
									</p>
									<p className="text-xs text-muted-foreground mt-1">Last day</p>
								</div>

								{/* Reach (Unique Impressions) */}
								<div className="p-4 rounded-lg border bg-card">
									<div className="flex items-center gap-2 mb-2">
										<TrendingUp className="h-4 w-4 text-muted-foreground" />
										<p className="text-xs font-medium text-muted-foreground">Reach</p>
									</div>
									<p className="text-2xl font-bold">
										{impressionsUniqueValue ? impressionsUniqueValue.toLocaleString() : 'N/A'}
									</p>
									<p className="text-xs text-muted-foreground mt-1">Unique, last day</p>
								</div>

								{/* Post Engagements */}
								<div className="p-4 rounded-lg border bg-card">
									<div className="flex items-center gap-2 mb-2">
										<MessageCircle className="h-4 w-4 text-muted-foreground" />
										<p className="text-xs font-medium text-muted-foreground">Post Engagements</p>
									</div>
									<p className="text-2xl font-bold">
										{postEngagementsValue ? postEngagementsValue.toLocaleString() : 'N/A'}
									</p>
									<p className="text-xs text-muted-foreground mt-1">Last day</p>
								</div>
							</div>

							{/* Secondary Metrics Row */}
							<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
								{/* Post Impressions */}
								<div className="p-4 rounded-lg border bg-card">
									<div className="flex items-center gap-2 mb-2">
										<Eye className="h-4 w-4 text-muted-foreground" />
										<p className="text-xs font-medium text-muted-foreground">Post Impressions</p>
									</div>
									<p className="text-2xl font-bold">
										{postsImpressionsValue ? postsImpressionsValue.toLocaleString() : 'N/A'}
									</p>
									<p className="text-xs text-muted-foreground mt-1">Last day</p>
								</div>

								{/* Post Reach (Unique) */}
								<div className="p-4 rounded-lg border bg-card">
									<div className="flex items-center gap-2 mb-2">
										<TrendingUp className="h-4 w-4 text-muted-foreground" />
										<p className="text-xs font-medium text-muted-foreground">Post Reach</p>
									</div>
									<p className="text-2xl font-bold">
										{postsImpressionsUniqueValue ? postsImpressionsUniqueValue.toLocaleString() : 'N/A'}
									</p>
									<p className="text-xs text-muted-foreground mt-1">Unique, last day</p>
								</div>

								{/* Video Views */}
								<div className="p-4 rounded-lg border bg-card">
									<div className="flex items-center gap-2 mb-2">
										<Play className="h-4 w-4 text-muted-foreground" />
										<p className="text-xs font-medium text-muted-foreground">Video Views</p>
									</div>
									<p className="text-2xl font-bold">
										{videoViewsValue ? videoViewsValue.toLocaleString() : 'N/A'}
									</p>
									<p className="text-xs text-muted-foreground mt-1">Last day</p>
								</div>
							</div>

							{/* Additional Metrics Row */}
							<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
								{/* New Follows */}
								<div className="p-4 rounded-lg border bg-card">
									<div className="flex items-center gap-2 mb-2">
										<UserPlus className="h-4 w-4 text-muted-foreground" />
										<p className="text-xs font-medium text-muted-foreground">New Follows</p>
									</div>
									<p className="text-2xl font-bold">
										{dailyFollowsValue ? dailyFollowsValue.toLocaleString() : 'N/A'}
									</p>
									<p className="text-xs text-muted-foreground mt-1">Last day</p>
								</div>
							</div>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}

