"use client";

import * as React from "react";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { trpc } from "@/utils/trpc";
import { ConnectFacebook } from "./agency.social-media-marketing/facebook/_components/connect-facebook";
import { PagesList } from "./agency.social-media-marketing/facebook/_components/pages-list";
import { PageContent } from "./agency.social-media-marketing/facebook/_components/page-content";
import type { StoredCredentials } from "./agency.social-media-marketing/facebook/_components/schemas";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export default function FacebookPage() {
	const [selectedPageId, setSelectedPageId] = React.useState<string | null>(null);
	const [selectedPageName, setSelectedPageName] = React.useState<string | null>(null);

	const {
		data: credentialsData,
		isLoading: isLoadingCredentials,
		error: credentialsError,
		refetch: refetchCredentials,
	} = trpc.socialMediaMarketing.meta.auth.getStoredCredentials.useQuery(undefined, {
		refetchOnWindowFocus: false,
		retry: 1,
	});

	const credentials = credentialsData?.data as StoredCredentials | null | undefined;
	const isConnected = credentials && !credentials.isExpired && credentials.status === "ACTIVE";

	const refetchPagesRef = React.useRef<(() => void) | null>(null);
	const [isFetchingPages, setIsFetchingPages] = React.useState(false);

	const handlePageSelect = React.useCallback((pageId: string, pageName?: string) => {
		setSelectedPageId(pageId);
		setSelectedPageName(pageName || null);
	}, []);

	const handleConnected = React.useCallback(() => {
		refetchCredentials();
	}, [refetchCredentials]);

	const handleRefetchPages = React.useCallback(async () => {
		if (refetchPagesRef.current) {
			setIsFetchingPages(true);
			try {
				await refetchPagesRef.current();
			} finally {
				setIsFetchingPages(false);
			}
		}
	}, []);

	if (isLoadingCredentials) {
		return (
			<div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
				<div className="w-full max-w-7xl mx-auto">
					<div className="flex items-center justify-center py-12">
						<Spinner size={32} />
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
			<div className="w-full max-w-7xl mx-auto">
				<div className="flex items-start justify-between gap-4">
					<div className="flex flex-col gap-2">
						<h1 className="text-base font-semibold tracking-tight">Facebook</h1>
						<p className="text-xs text-muted-foreground">
							Manage your Facebook pages, posts, and content from one place.
						</p>
					</div>
					{isConnected && (
						<Button
							variant="outline"
							size="icon"
							onClick={handleRefetchPages}
							disabled={isFetchingPages || !refetchPagesRef.current}
							title="Refresh pages"
						>
							<RefreshCw className={`h-4 w-4 ${isFetchingPages ? "animate-spin" : ""}`} />
						</Button>
					)}
				</div>

				<div className="mt-6">
					{!isConnected ? (
						<div className="flex flex-col items-center justify-center py-12">
							<ConnectFacebook onConnected={handleConnected} />
							{credentialsError && (
								<div className="mt-4 text-sm text-muted-foreground">
									{credentialsError.message}
								</div>
							)}
						</div>
					) : (
						<div className="space-y-6">
							<PagesList
								onPageSelect={(pageId, pageName) => {
									handlePageSelect(pageId, pageName);
								}}
								selectedPageId={selectedPageId}
								onRefetchReady={(refetch) => {
									refetchPagesRef.current = refetch;
								}}
							/>

							{selectedPageId && (
								<PageContent pageId={selectedPageId} pageName={selectedPageName || undefined} />
							)}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
