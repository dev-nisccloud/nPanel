"use client";

import * as React from "react";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { trpc } from "@/utils/trpc";
import { ConnectLinkedInAds } from "./agency.ad-campaigns/linkedin-ads/_components/connect-linkedin-ads";
import { AccountsList } from "./agency.ad-campaigns/linkedin-ads/_components/accounts-list";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import type { StoredCredentials } from "./agency.ad-campaigns/linkedin-ads/_components/schemas";

export default function LinkedInAdsPage() {
	const {
		data: credentialsData,
		isLoading: isLoadingCredentials,
		error: credentialsError,
		refetch: refetchCredentials,
	} = trpc.linkedInAds.auth.getStoredCredentials.useQuery(undefined, {
		refetchOnWindowFocus: false,
		retry: 1,
	});

	const credentials = credentialsData?.data as StoredCredentials | null | undefined;
	const isConnected = credentials?.connected === true;

	const handleRefetchAccounts = React.useCallback(() => {
		refetchCredentials();
	}, [refetchCredentials]);

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
						<h1 className="text-base font-semibold tracking-tight">LinkedIn Ads</h1>
						<p className="text-xs text-muted-foreground">
							Manage your LinkedIn ad campaigns, ad sets, and ads from one place.
						</p>
					</div>
					{isConnected && (
						<div className="flex items-center gap-2">
							<Button
								variant="outline"
								size="icon"
								onClick={handleRefetchAccounts}
								title="Refresh accounts"
							>
								<RefreshCw className="h-4 w-4" />
							</Button>
						</div>
					)}
				</div>

				<div className="mt-6">
					{!isConnected ? (
						<div className="flex flex-col items-center justify-center py-12">
							<ConnectLinkedInAds onConnected={handleRefetchAccounts} />
							{credentialsError && (
								<div className="mt-4 text-sm text-muted-foreground">
									{credentialsError.message}
								</div>
							)}
						</div>
					) : (
						<div className="space-y-6">
							<AccountsList />
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
