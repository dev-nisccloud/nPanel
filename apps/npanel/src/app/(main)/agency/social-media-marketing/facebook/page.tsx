"use client";

import * as React from "react";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { trpc } from "@/utils/trpc";
import { ConnectFacebook } from "./_components/connect-facebook";
import { PagesList } from "./_components/pages-list";
import { PageContent } from "./_components/page-content";
import type { StoredCredentials } from "./_components/schemas";

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

	const handlePageSelect = React.useCallback((pageId: string, pageName?: string) => {
		setSelectedPageId(pageId);
		setSelectedPageName(pageName || null);
	}, []);

	const handleConnected = React.useCallback(() => {
		refetchCredentials();
	}, [refetchCredentials]);

	if (isLoadingCredentials) {
		return (
			<div className="@container/main flex flex-col gap-4 md:gap-6">
				<div className="flex items-center justify-center py-12">
					<Spinner size={32} />
				</div>
			</div>
		);
	}

	return (
		<div className="@container/main flex flex-col gap-4 md:gap-6">
			<div className="flex flex-col gap-2">
				<h1 className="text-2xl font-semibold tracking-tight">Facebook</h1>
				<p className="text-muted-foreground">
					Manage your Facebook pages, posts, and content from one place.
				</p>
			</div>

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
					/>

					{selectedPageId && (
						<PageContent pageId={selectedPageId} pageName={selectedPageName || undefined} />
					)}
				</div>
			)}
		</div>
	);
}

