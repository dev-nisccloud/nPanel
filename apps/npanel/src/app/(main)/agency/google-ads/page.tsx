"use client";

import * as React from "react";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { trpc } from "@/utils/trpc";
import { ConnectGoogleAds } from "./_components/connect-google-ads";
import { AccountsList } from "./_components/accounts-list";
import type { StoredCredentials } from "./_components/schemas";
import { Button } from "@/components/ui/button";
import { RefreshCw, LogOut } from "lucide-react";
import { toast } from "sonner";

export default function GoogleAdsPage() {
	const [selectedAccountId, setSelectedAccountId] = React.useState<string | null>(null);
	const [selectedAccountName, setSelectedAccountName] = React.useState<string | null>(null);

	const {
		data: credentialsData,
		isLoading: isLoadingCredentials,
		error: credentialsError,
		refetch: refetchCredentials,
	} = trpc.googleAds.auth.getStoredCredentials.useQuery(undefined, {
		refetchOnWindowFocus: false,
		retry: 1,
	});

	const credentials = credentialsData?.data as StoredCredentials | null | undefined;
	const isConnected = credentials && !credentials.isExpired && credentials.status === "ACTIVE";

	const revokeTokenMutation = trpc.googleAds.auth.revokeToken.useMutation({
		onSuccess: () => {
			toast.success("Google Ads account disconnected successfully");
			refetchCredentials();
		},
		onError: (error) => {
			toast.error(error.message || "Failed to disconnect Google Ads account");
		},
	});

	const handleDisconnect = React.useCallback(() => {
		if (confirm("Are you sure you want to disconnect your Google Ads account?")) {
			revokeTokenMutation.mutate();
		}
	}, [revokeTokenMutation]);

	const handleAccountSelect = React.useCallback((accountId: string, accountName?: string) => {
		setSelectedAccountId(accountId);
		setSelectedAccountName(accountName || null);
	}, []);

	const handleConnected = React.useCallback(() => {
		refetchCredentials();
	}, [refetchCredentials]);

	const handleRefetchAccounts = React.useCallback(() => {
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
			<div className="flex items-start justify-between gap-4">
				<div className="flex flex-col gap-2">
					<h1 className="text-2xl font-semibold tracking-tight">Google Ads</h1>
					<p className="text-muted-foreground">
						Manage your Google Ads campaigns, keywords, and performance from one place.
					</p>
				</div>
				{isConnected && (
					<div className="flex items-center gap-2">
						<Button
							variant="outline"
							size="icon"
							onClick={handleRefetchAccounts}
							disabled={revokeTokenMutation.isPending}
							title="Refresh accounts"
						>
							<RefreshCw className="h-4 w-4" />
						</Button>
						<Button
							variant="outline"
							size="icon"
							onClick={handleDisconnect}
							disabled={revokeTokenMutation.isPending}
							title="Disconnect account"
						>
							<LogOut className="h-4 w-4" />
						</Button>
					</div>
				)}
			</div>

			{!isConnected ? (
				<div className="flex flex-col items-center justify-center py-12">
					<ConnectGoogleAds onConnected={handleConnected} />
					{credentialsError && (
						<div className="mt-4 text-sm text-muted-foreground">
							{credentialsError.message}
						</div>
					)}
				</div>
			) : (
				<div className="space-y-6">
					<AccountsList
						onAccountSelect={(accountId, accountName) => {
							handleAccountSelect(accountId, accountName);
						}}
						selectedAccountId={selectedAccountId}
					/>

					{selectedAccountId && (
						<div className="p-4 border rounded-lg">
							<h3 className="font-semibold mb-2">
								Selected Account: {selectedAccountName || selectedAccountId}
							</h3>
							<p className="text-sm text-muted-foreground">
								Account details and management features will be available here in future phases.
							</p>
						</div>
					)}
				</div>
			)}
		</div>
	);
}


