"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, ExternalLink, CheckCircle2 } from "lucide-react";
import { trpc } from "@/utils/trpc";
import { toast } from "sonner";
import type { LinkedInOrganization } from "./schemas";
import { useLinkedInCacheInvalidation } from "./use-linkedin-cache-invalidation";
import { useEffect } from "react";

interface OrganizationsListProps {
	onPageSelect?: (pageId: string, pageName?: string) => void;
	selectedPageId?: string | null;
	onRefetchReady?: (refetch: () => void) => void;
}

// Skeleton component for loading state
const OrganizationsListSkeleton = () => (
	<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
		{[...Array(6)].map((_, i) => (
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

export function OrganizationsList({ onPageSelect, selectedPageId, onRefetchReady }: OrganizationsListProps) {
	const { invalidateOrganizationsList } = useLinkedInCacheInvalidation();

	const {
		data,
		isLoading,
		isFetching,
		error,
		refetch,
	} = trpc.socialMediaMarketing.linkedin.pages.getOrganizations.useQuery(
		{ useStoredToken: true },
		{
			staleTime: 10 * 60 * 1000, // 10 minutes - organizations list changes infrequently
			gcTime: 30 * 60 * 1000, // 30 minutes - keep in cache longer
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
				invalidateOrganizationsList();
			}
		}
	}, [error, invalidateOrganizationsList]);

	// Expose refetch function to parent (only once on mount)
	useEffect(() => {
		if (onRefetchReady) {
			onRefetchReady(() => refetch());
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []); // Only run once on mount

	const organizations = data?.data || [];

	const handleOrganizationClick = React.useCallback(
		(pageId: string, pageName?: string) => {
			onPageSelect?.(pageId, pageName);
		},
		[onPageSelect]
	);

	if (isLoading) {
		return (
			<div className="space-y-4">
				<OrganizationsListSkeleton />
			</div>
		);
	}

	if (error) {
		return (
			<Card>
				<CardContent className="pt-6">
					<div className="flex flex-col items-center justify-center py-8 text-center">
						<p className="text-destructive mb-4">
							{error.message || "Failed to load LinkedIn organizations"}
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

	if (organizations.length === 0) {
		return (
			<Card>
				<CardContent className="pt-6">
					<div className="flex flex-col items-center justify-center py-8 text-center">
						<p className="text-lg font-semibold mb-2">No organizations found</p>
						<p className="text-muted-foreground text-sm">
							You don't have any LinkedIn organizations connected to this account.
						</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="space-y-4">
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{organizations.map((org: LinkedInOrganization) => {
					const isSelected = selectedPageId === org.id;
					const orgUrl = org.username 
						? `https://www.linkedin.com/company/${org.username}`
						: `https://www.linkedin.com/company/${org.id}`;
					const orgImage = org.picture;

					return (
						<Card
							key={org.id}
							className={`cursor-pointer transition-all hover:shadow-md relative ${
								isSelected ? "ring-2 ring-primary" : ""
							}`}
							onClick={() => handleOrganizationClick(org.id, org.name)}
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
											{org.name || "Unnamed Organization"}
										</CardTitle>
										{org.username && (
											<CardDescription className="mt-1">
												@{org.username}
											</CardDescription>
										)}
									</div>
									{orgImage && (
										<img
											src={orgImage}
											alt={org.name || "Organization"}
											className="h-12 w-12 rounded-full object-cover flex-shrink-0"
										/>
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
											window.open(orgUrl, "_blank");
										}}
									>
										<ExternalLink className="mr-1 h-3 w-3" />
										View on LinkedIn
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




