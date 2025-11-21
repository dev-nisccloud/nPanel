"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, ExternalLink, Users, Globe } from "lucide-react";
import { trpc } from "@/utils/trpc";
import { toast } from "sonner";
import type { FacebookPage } from "./schemas";

interface PagesListProps {
	onPageSelect?: (pageId: string, pageName?: string) => void;
	selectedPageId?: string | null;
}

// Skeleton component for loading state
const PagesListSkeleton = () => (
	<div className="space-y-4">
		{[...Array(3)].map((_, i) => (
			<Card key={i}>
				<CardHeader>
					<div className="flex items-start justify-between">
						<div className="flex-1 space-y-2">
							<Skeleton className="h-5 w-48" />
							<div className="flex items-center gap-2">
								<Skeleton className="h-4 w-20" />
								<Skeleton className="h-4 w-24" />
							</div>
						</div>
						<Skeleton className="h-8 w-8 rounded-full" />
					</div>
				</CardHeader>
				<CardContent>
					<div className="space-y-2">
						<Skeleton className="h-4 w-full" />
						<Skeleton className="h-4 w-3/4" />
					</div>
				</CardContent>
			</Card>
		))}
	</div>
);

export function PagesList({ onPageSelect, selectedPageId }: PagesListProps) {
	const {
		data,
		isLoading,
		isFetching,
		error,
		refetch,
	} = trpc.socialMediaMarketing.meta.pages.getPages.useQuery(
		{ useStoredToken: true },
		{
			refetchOnWindowFocus: false,
			retry: 1,
		}
	);

	const pages = data?.data || [];

	const handlePageClick = React.useCallback(
		(pageId: string, pageName?: string) => {
			onPageSelect?.(pageId, pageName);
		},
		[onPageSelect]
	);

	if (isLoading) {
		return (
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<Skeleton className="h-8 w-48" />
					<Skeleton className="h-10 w-24" />
				</div>
				<PagesListSkeleton />
			</div>
		);
	}

	if (error) {
		return (
			<Card>
				<CardContent className="pt-6">
					<div className="flex flex-col items-center justify-center py-8 text-center">
						<p className="text-destructive mb-4">
							{error.message || "Failed to load Facebook pages"}
						</p>
						<Button onClick={() => refetch()} variant="outline" size="sm">
							<RefreshCw className="mr-2 h-4 w-4" />
							Try Again
						</Button>
					</div>
				</CardContent>
			</Card>
		);
	}

	if (pages.length === 0) {
		return (
			<Card>
				<CardContent className="pt-6">
					<div className="flex flex-col items-center justify-center py-8 text-center">
						<p className="text-lg font-semibold mb-2">No pages found</p>
						<p className="text-muted-foreground text-sm">
							You don't have any Facebook pages connected to this account.
						</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<div>
					<h3 className="text-lg font-semibold">Your Facebook Pages</h3>
					<p className="text-sm text-muted-foreground">
						Select a page to view and manage its content
					</p>
				</div>
				<Button
					variant="outline"
					size="icon"
					onClick={() => refetch()}
					disabled={isFetching}
					title="Refresh pages"
				>
					<RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
				</Button>
			</div>

			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{pages.map((page: FacebookPage) => {
					const isSelected = selectedPageId === page.id;
					const pageUrl = page.link || `https://facebook.com/${page.id}`;
					const pageImage = page.picture?.data?.url;
					const fanCount = page.fan_count || 0;
					const followersCount = page.followers_count || 0;

					return (
						<Card
							key={page.id}
							className={`cursor-pointer transition-all hover:shadow-md ${
								isSelected ? "ring-2 ring-primary" : ""
							}`}
							onClick={() => handlePageClick(page.id, page.name)}
						>
							<CardHeader>
								<div className="flex items-start justify-between gap-4">
									<div className="flex-1 min-w-0">
										<CardTitle className="text-base line-clamp-2">
											{page.name || "Unnamed Page"}
										</CardTitle>
										{page.category && (
											<CardDescription className="mt-1">
												{page.category}
											</CardDescription>
										)}
									</div>
									{pageImage && (
										<img
											src={pageImage}
											alt={page.name || "Page"}
											className="h-12 w-12 rounded-full object-cover flex-shrink-0"
										/>
									)}
								</div>
							</CardHeader>
							<CardContent>
								<div className="space-y-3">
									{page.description && (
										<p className="text-sm text-muted-foreground line-clamp-2">
											{page.description}
										</p>
									)}

									<div className="flex items-center gap-4 text-xs text-muted-foreground">
										{fanCount > 0 && (
											<div className="flex items-center gap-1">
												<Users className="h-3 w-3" />
												<span>{fanCount.toLocaleString()} fans</span>
											</div>
										)}
										{followersCount > 0 && (
											<div className="flex items-center gap-1">
												<Users className="h-3 w-3" />
												<span>{followersCount.toLocaleString()} followers</span>
											</div>
										)}
									</div>

									<div className="flex items-center gap-2 pt-2">
										{page.verification_status === "verified" && (
											<Badge variant="default" className="text-xs">
												Verified
											</Badge>
										)}
										<Button
											variant="ghost"
											size="sm"
											className="h-7 text-xs"
											onClick={(e) => {
												e.stopPropagation();
												window.open(pageUrl, "_blank");
											}}
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
		</div>
	);
}

