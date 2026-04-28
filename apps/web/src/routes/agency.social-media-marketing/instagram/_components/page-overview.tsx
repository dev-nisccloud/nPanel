"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, Users, UserCheck, ImageIcon, ExternalLink, Instagram } from "lucide-react";
import { trpc } from "@/utils/trpc";

interface PageOverviewProps {
	pageId: string;
	pageName?: string;
}

const OverviewSkeleton = () => (
	<div className="space-y-6">
		<Card>
			<CardHeader>
				<div className="flex items-start gap-4">
					<Skeleton className="h-20 w-20 rounded-full" />
					<div className="flex-1 space-y-2">
						<Skeleton className="h-6 w-48" />
						<Skeleton className="h-4 w-32" />
						<Skeleton className="h-4 w-full" />
					</div>
				</div>
			</CardHeader>
		</Card>
		<div className="grid grid-cols-2 md:grid-cols-3 gap-4">
			{[...Array(3)].map((_, i) => (
				<Skeleton key={i} className="h-24" />
			))}
		</div>
		<Card>
			<CardHeader>
				<Skeleton className="h-5 w-36" />
			</CardHeader>
			<CardContent>
				<div className="space-y-3">
					{[...Array(4)].map((_, i) => (
						<Skeleton key={i} className="h-4 w-full" />
					))}
				</div>
			</CardContent>
		</Card>
	</div>
);

export function PageOverview({ pageId, pageName }: PageOverviewProps) {
	const {
		data,
		isLoading,
		isFetching,
		error,
		refetch,
	} = trpc.socialMediaMarketing.instagram.auth.getProfile.useQuery(undefined, {
		enabled: !!pageId,
		staleTime: 5 * 60 * 1000,
		gcTime: 20 * 60 * 1000,
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

	const profile = data?.data;

	if (isLoading) {
		return (
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<Skeleton className="h-8 w-48" />
					<Skeleton className="h-10 w-10" />
				</div>
				<OverviewSkeleton />
			</div>
		);
	}

	if (error) {
		return (
			<Card>
				<CardContent className="pt-6">
					<div className="flex flex-col items-center justify-center py-8 text-center">
						<p className="text-destructive mb-4">
							{error.message || "Failed to load account overview"}
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
						<p className="text-lg font-semibold mb-2">Account not found</p>
						<p className="text-muted-foreground text-sm">
							Unable to load information for this account.
						</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	const profileUrl = profile.username
		? `https://www.instagram.com/${profile.username}`
		: undefined;

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<div>
					<h3 className="text-lg font-semibold">
						{pageName || profile.name || profile.username || "Account Overview"}
					</h3>
					<p className="text-sm text-muted-foreground">
						View account information and profile details
					</p>
				</div>
				<Button
					variant="outline"
					size="icon"
					onClick={() => refetch()}
					disabled={isFetching}
					title="Refresh overview"
				>
					<RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
				</Button>
			</div>

			<Tabs defaultValue="overview" className="w-full">
				<TabsList className="grid w-full grid-cols-1">
					<TabsTrigger value="overview">Overview</TabsTrigger>
				</TabsList>

				<TabsContent value="overview" className="mt-4">
					<div className="space-y-6">
						{/* Profile Card */}
						<Card>
							<CardHeader>
								<div className="flex items-start gap-4">
									{profile.profile_picture_url ? (
										<img
											src={profile.profile_picture_url}
											alt={profile.username || "Profile"}
											className="h-20 w-20 rounded-full object-cover flex-shrink-0"
										/>
									) : (
										<div className="h-20 w-20 rounded-full bg-gradient-to-br from-pink-500 via-red-500 to-yellow-500 flex items-center justify-center flex-shrink-0">
											<Instagram className="h-10 w-10 text-white" />
										</div>
									)}
									<div className="flex-1 min-w-0">
										<div className="flex items-center gap-2 flex-wrap">
											<CardTitle className="text-xl">
												{profile.name || profile.username || "Instagram Account"}
											</CardTitle>
											{profile.account_type && (
												<Badge variant="secondary">{profile.account_type}</Badge>
											)}
										</div>
										{profile.username && (
											<CardDescription className="mt-1 text-base">
												@{profile.username}
											</CardDescription>
										)}
										{profile.biography && (
											<p className="text-sm text-muted-foreground mt-2 line-clamp-3">
												{profile.biography}
											</p>
										)}
										{profileUrl && (
											<Button
												variant="link"
												size="sm"
												className="px-0 h-auto mt-1 text-xs"
												onClick={() => window.open(profileUrl, "_blank")}
											>
												<ExternalLink className="mr-1 h-3 w-3" />
												View on Instagram
											</Button>
										)}
									</div>
								</div>
							</CardHeader>
						</Card>

						{/* Stats Cards */}
						<div className="grid grid-cols-2 md:grid-cols-3 gap-4">
							{profile.followers_count !== undefined && (
								<div className="p-4 rounded-lg border bg-card">
									<div className="flex items-center gap-2 mb-2">
										<Users className="h-4 w-4 text-muted-foreground" />
										<p className="text-xs font-medium text-muted-foreground">Followers</p>
									</div>
									<p className="text-2xl font-bold">
										{profile.followers_count.toLocaleString()}
									</p>
								</div>
							)}
							{profile.follows_count !== undefined && (
								<div className="p-4 rounded-lg border bg-card">
									<div className="flex items-center gap-2 mb-2">
										<UserCheck className="h-4 w-4 text-muted-foreground" />
										<p className="text-xs font-medium text-muted-foreground">Following</p>
									</div>
									<p className="text-2xl font-bold">
										{profile.follows_count.toLocaleString()}
									</p>
								</div>
							)}
							{profile.media_count !== undefined && (
								<div className="p-4 rounded-lg border bg-card">
									<div className="flex items-center gap-2 mb-2">
										<ImageIcon className="h-4 w-4 text-muted-foreground" />
										<p className="text-xs font-medium text-muted-foreground">Posts</p>
									</div>
									<p className="text-2xl font-bold">
										{profile.media_count.toLocaleString()}
									</p>
								</div>
							)}
						</div>

						{/* Account Details */}
						<Card>
							<CardHeader>
								<CardTitle className="text-base">Account Details</CardTitle>
								<CardDescription>
									Technical information about this Instagram account
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="space-y-3">
									{profile.account_type && (
										<div className="flex items-center justify-between text-sm">
											<span className="text-muted-foreground">Account Type</span>
											<span className="font-medium capitalize">
												{profile.account_type.toLowerCase().replace(/_/g, " ")}
											</span>
										</div>
									)}
									{profile.username && (
										<div className="flex items-center justify-between text-sm">
											<span className="text-muted-foreground">Username</span>
											<span className="font-medium">@{profile.username}</span>
										</div>
									)}
									{profile.user_id && (
										<div className="flex items-center justify-between text-sm">
											<span className="text-muted-foreground">User ID</span>
											<span className="font-mono text-xs">{profile.user_id}</span>
										</div>
									)}
									{profile.id && (
										<div className="flex items-center justify-between text-sm">
											<span className="text-muted-foreground">App-Scoped ID</span>
											<span className="font-mono text-xs">{profile.id}</span>
										</div>
									)}
								</div>
							</CardContent>
						</Card>
					</div>
				</TabsContent>
			</Tabs>
		</div>
	);
}
