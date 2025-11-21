"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, ExternalLink, Heart, MessageCircle, Share2, Calendar } from "lucide-react";
import { trpc } from "@/utils/trpc";
import { toast } from "sonner";
import type { PageContentItem, ContentType } from "./schemas";

interface PageContentProps {
	pageId: string;
	pageName?: string;
}

// Skeleton component for loading state
const ContentSkeleton = () => (
	<div className="space-y-4">
		{[...Array(3)].map((_, i) => (
			<Card key={i}>
				<CardHeader>
					<div className="flex items-start justify-between">
						<div className="flex-1 space-y-2">
							<Skeleton className="h-5 w-3/4" />
							<Skeleton className="h-4 w-1/2" />
						</div>
						<Skeleton className="h-8 w-8 rounded-full" />
					</div>
				</CardHeader>
				<CardContent>
					<div className="space-y-2">
						<Skeleton className="h-4 w-full" />
						<Skeleton className="h-4 w-full" />
						<Skeleton className="h-4 w-3/4" />
					</div>
					<div className="flex items-center gap-4 mt-4">
						<Skeleton className="h-4 w-16" />
						<Skeleton className="h-4 w-16" />
						<Skeleton className="h-4 w-16" />
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

export function PageContent({ pageId, pageName }: PageContentProps) {
	const [contentType, setContentType] = React.useState<ContentType>("posts");

	const {
		data,
		isLoading,
		isFetching,
		error,
		refetch,
	} = trpc.socialMediaMarketing.meta.content.getContent.useQuery(
		{
			pageId,
			contentType,
			useStoredToken: true,
			limit: 25,
		},
		{
			enabled: !!pageId,
			refetchOnWindowFocus: false,
			retry: 1,
		}
	);

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
						{pageName ? `${pageName} Content` : "Page Content"}
					</h3>
					<p className="text-sm text-muted-foreground">
						View and manage posts, photos, videos, and events
					</p>
				</div>
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

			<Tabs value={contentType} onValueChange={(value) => setContentType(value as ContentType)}>
				<TabsList className="grid w-full grid-cols-4">
					<TabsTrigger value="posts">Posts</TabsTrigger>
					<TabsTrigger value="photos">Photos</TabsTrigger>
					<TabsTrigger value="videos">Videos</TabsTrigger>
					<TabsTrigger value="events">Events</TabsTrigger>
				</TabsList>

				<TabsContent value={contentType} className="mt-4">
					{content.length === 0 ? (
						<Card>
							<CardContent className="pt-6">
								<div className="flex flex-col items-center justify-center py-8 text-center">
									<p className="text-lg font-semibold mb-2">No {contentType} found</p>
									<p className="text-muted-foreground text-sm">
										This page doesn't have any {contentType} yet.
									</p>
								</div>
							</CardContent>
						</Card>
					) : (
						<div className="space-y-4">
							{content.map((item: PageContentItem) => {
								const likesCount = item.likes?.summary?.total_count || 0;
								const commentsCount = item.comments?.summary?.total_count || 0;
								const sharesCount = item.shares?.count || 0;
								const postUrl = item.permalink_url || `https://facebook.com/${item.id}`;

								return (
									<Card key={item.id}>
										<CardHeader>
											<div className="flex items-start justify-between">
												<div className="flex-1">
													<CardTitle className="text-base">
														{item.type ? item.type.charAt(0).toUpperCase() + item.type.slice(1) : "Post"}
													</CardTitle>
													<CardDescription className="mt-1">
														<div className="flex items-center gap-2">
															<Calendar className="h-3 w-3" />
															{formatDate(item.created_time)}
														</div>
													</CardDescription>
												</div>
												{item.status_type && (
													<Badge variant="outline" className="text-xs">
														{item.status_type}
													</Badge>
												)}
											</div>
										</CardHeader>
										<CardContent>
											<div className="space-y-4">
												{(item.message || item.story) && (
													<p className="text-sm whitespace-pre-wrap">
														{item.message || item.story}
													</p>
												)}

												<div className="flex items-center gap-4 text-sm text-muted-foreground">
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

												<div className="flex items-center gap-2 pt-2 border-t">
													<Button
														variant="ghost"
														size="sm"
														className="h-8 text-xs"
														onClick={() => window.open(postUrl, "_blank")}
													>
														<ExternalLink className="mr-1 h-3 w-3" />
														View on Facebook
													</Button>
												</div>
											</div>
										</CardContent>
									</Card>
								);
							})}
						</div>
					)}
				</TabsContent>
			</Tabs>
		</div>
	);
}


