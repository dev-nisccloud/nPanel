"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, ExternalLink, CheckCircle2, Instagram, Users, ImageIcon } from "lucide-react";
import { trpc } from "@/utils/trpc";
import type { InstagramProfile } from "./schemas";
import { useEffect } from "react";

interface PagesListProps {
	onPageSelect?: (pageId: string, pageName?: string) => void;
	selectedPageId?: string | null;
	onRefetchReady?: (refetch: () => void) => void;
}

const PagesListSkeleton = () => (
	<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
		{[...Array(3)].map((_, i) => (
			<Card key={i}>
				<CardHeader>
					<div className="flex items-start justify-between gap-4">
						<div className="flex-1 space-y-2">
							<Skeleton className="h-5 w-32" />
							<Skeleton className="h-4 w-20" />
						</div>
						<Skeleton className="h-12 w-12 rounded-full" />
					</div>
				</CardHeader>
				<CardContent>
					<div className="flex items-center justify-end pt-2">
						<Skeleton className="h-7 w-32" />
					</div>
				</CardContent>
			</Card>
		))}
	</div>
);

export function PagesList({ onPageSelect, selectedPageId, onRefetchReady }: PagesListProps) {
	const {
		data,
		isLoading,
		error,
		refetch,
	} = trpc.socialMediaMarketing.instagram.auth.getProfile.useQuery(undefined, {
		staleTime: 10 * 60 * 1000,
		gcTime: 30 * 60 * 1000,
		refetchOnWindowFocus: false,
		refetchOnReconnect: true,
		refetchOnMount: false,
		retry: (failureCount, error: any) => {
			if (error?.data?.code === "UNAUTHORIZED") return false;
			if (error?.data?.code === "BAD_REQUEST") return false;
			return failureCount < 2;
		},
		retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
	});

	// Expose refetch to parent (only once on mount)
	useEffect(() => {
		if (onRefetchReady) {
			onRefetchReady(() => refetch());
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const profile = data?.data;

	const handlePageClick = React.useCallback(
		(pageId: string, pageName?: string) => {
			onPageSelect?.(pageId, pageName);
		},
		[onPageSelect]
	);

	if (isLoading) {
		return (
			<div className="space-y-4">
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
							{error.message || "Failed to load Instagram account"}
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

	if (!profile) {
		return (
			<Card>
				<CardContent className="pt-6">
					<div className="flex flex-col items-center justify-center py-8 text-center">
						<p className="text-lg font-semibold mb-2">No account found</p>
						<p className="text-muted-foreground text-sm">
							No Instagram professional account is connected. Please reconnect.
						</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	const accounts: InstagramProfile[] = [profile as InstagramProfile];

	return (
		<div className="space-y-4">
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{accounts.map((account) => {
					const isSelected = selectedPageId === account.id;
					const profileUrl = account.username
						? `https://www.instagram.com/${account.username}`
						: undefined;
					const profileImage = account.profile_picture_url;

					return (
						<Card
							key={account.id}
							className={`cursor-pointer transition-all hover:shadow-md relative ${
								isSelected ? "ring-2 ring-primary" : ""
							}`}
							onClick={() => handlePageClick(account.id, account.username || account.name)}
						>
							{/* Active/Selected Indicator */}
							{isSelected && (
								<div className="absolute top-2 right-2 z-10">
									<div className="flex items-center gap-1.5 bg-primary text-primary-foreground px-2 py-1 rounded-full text-xs font-medium">
										<CheckCircle2 className="h-3 w-3" />
										<span>Active</span>
									</div>
								</div>
							)}

							<CardHeader>
								<div className="flex items-start justify-between gap-4">
									<div className="flex-1 min-w-0">
										<CardTitle className="text-base line-clamp-2 pr-8">
											{account.name || account.username || "Instagram Account"}
										</CardTitle>
										{account.username && (
											<CardDescription className="mt-1">
												@{account.username}
											</CardDescription>
										)}
										{account.account_type && (
											<Badge variant="secondary" className="mt-2 text-xs">
												{account.account_type}
											</Badge>
										)}
									</div>
									{profileImage ? (
										<img
											src={profileImage}
											alt={account.username || "Account"}
											className="h-12 w-12 rounded-full object-cover flex-shrink-0"
										/>
									) : (
										<div className="h-12 w-12 rounded-full bg-gradient-to-br from-pink-500 via-red-500 to-yellow-500 flex items-center justify-center flex-shrink-0">
											<Instagram className="h-6 w-6 text-white" />
										</div>
									)}
								</div>

								{/* Stats row */}
								<div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
									{account.followers_count !== undefined && (
										<div className="flex items-center gap-1">
											<Users className="h-3 w-3" />
											<span>{account.followers_count.toLocaleString()} followers</span>
										</div>
									)}
									{account.media_count !== undefined && (
										<div className="flex items-center gap-1">
											<ImageIcon className="h-3 w-3" />
											<span>{account.media_count.toLocaleString()} posts</span>
										</div>
									)}
								</div>
							</CardHeader>

							<CardContent>
								<div className="flex items-center justify-center pt-2">
									<Button
										variant="ghost"
										size="sm"
										className="h-7 text-xs"
										onClick={(e) => {
											e.stopPropagation();
											if (profileUrl) window.open(profileUrl, "_blank");
										}}
										disabled={!profileUrl}
									>
										<ExternalLink className="mr-1 h-3 w-3" />
										View on Instagram
									</Button>
								</div>
							</CardContent>
						</Card>
					);
				})}
			</div>
		</div>
	);
}
