"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/utils/trpc";
import { toast } from "sonner";
import { Linkedin, Building2, Globe, DollarSign } from "lucide-react";
import { useRouter } from "next/navigation";
import type { LinkedInAdsAccount } from "./schemas";

export function AccountsList() {
	const router = useRouter();
	const {
		data: accountsData,
		isLoading,
		error,
		refetch,
	} = trpc.linkedInAds.accounts.listAdAccounts.useQuery(undefined, {
		refetchOnWindowFocus: false,
		retry: 1,
	});

	React.useEffect(() => {
		if (error) {
			toast.error(error.message || "Failed to load LinkedIn ad accounts");
		}
	}, [error]);

	const accounts = accountsData?.data || [];

	const handleAccountClick = (accountId: string) => {
		// Extract numeric ID from URN if needed
		const numericId = accountId.replace(/[^0-9]/g, '');
		router.push(`/agency/ad-campaigns/linkedin-ads/${numericId || accountId}`);
	};

	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>LinkedIn Ad Accounts</CardTitle>
					<CardDescription>Loading your accessible LinkedIn ad accounts...</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex items-center justify-center py-8">
						<Spinner size={32} />
					</div>
				</CardContent>
			</Card>
		);
	}

	if (accounts.length === 0) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>LinkedIn Ad Accounts</CardTitle>
					<CardDescription>No accessible LinkedIn ad accounts found.</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex flex-col items-center justify-center py-8 text-center">
						<Linkedin className="h-12 w-12 text-muted-foreground mb-4" />
						<p className="text-sm text-muted-foreground">
							No LinkedIn ad accounts are accessible with your current integration.
						</p>
						<p className="text-xs text-muted-foreground mt-2">
							Make sure you have access to at least one LinkedIn ad account.
						</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>LinkedIn Ad Accounts</CardTitle>
				<CardDescription>
					{accounts.length} {accounts.length === 1 ? "account" : "accounts"} accessible
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="space-y-2">
					{accounts.map((account: LinkedInAdsAccount) => (
						<button
							key={account.id}
							onClick={() => handleAccountClick(account.id)}
							className="w-full text-left p-4 rounded-lg border transition-colors border-border hover:bg-accent"
						>
							<div className="flex items-start justify-between gap-4">
								<div className="flex items-start gap-3 flex-1">
									<div className="mt-1">
										<Building2 className="h-5 w-5 text-muted-foreground" />
									</div>
									<div className="flex-1 min-w-0">
										<div className="font-medium truncate">
											{account.name || `Account ${account.id}`}
										</div>
										<div className="text-sm text-muted-foreground mt-1">
											Account ID: {account.id}
										</div>
										<div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-1">
											{account.currency && (
												<span>Currency: {account.currency}</span>
											)}
											{account.timezone && (
												<span>Timezone: {account.timezone}</span>
											)}
											{account.type && (
												<span>Type: {account.type}</span>
											)}
										</div>
										{account.servingStatuses && account.servingStatuses.length > 0 && (
											<div className="flex flex-wrap gap-1 mt-2">
												{account.servingStatuses.map((status, idx) => (
													<Badge key={idx} variant="outline" className="text-xs">
														{status}
													</Badge>
												))}
											</div>
										)}
									</div>
								</div>
								{account.status && (
									<Badge
										variant={
											account.status === "ACTIVE"
												? "default"
												: account.status === "DISABLED" || account.status === "CLOSED"
													? "destructive"
													: "secondary"
										}
									>
										{account.status}
									</Badge>
								)}
							</div>
						</button>
					))}
				</div>
			</CardContent>
		</Card>
	);
}

