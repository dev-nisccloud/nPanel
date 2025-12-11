"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/utils/trpc";
import { toast } from "sonner";
import { Facebook, Building2, Globe, Calendar, DollarSign } from "lucide-react";
import { useRouter } from "next/navigation";
import type { MetaAdsAccount } from "./schemas";

export function AccountsList() {
	const router = useRouter();
	const {
		data: accountsData,
		isLoading,
		error,
		refetch,
	} = trpc.metaAds.accounts.listAdAccounts.useQuery(undefined, {
		refetchOnWindowFocus: false,
		retry: 1,
	});

	React.useEffect(() => {
		if (error) {
			toast.error(error.message || "Failed to load Meta ad accounts");
		}
	}, [error]);

	const accounts = accountsData?.data || [];

	const handleAccountClick = (accountId: string) => {
		router.push(`/agency/ad-campaigns/meta-ads/${accountId}`);
	};

	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Meta Ad Accounts</CardTitle>
					<CardDescription>Loading your accessible Meta ad accounts...</CardDescription>
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
					<CardTitle>Meta Ad Accounts</CardTitle>
					<CardDescription>No accessible Meta ad accounts found.</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex flex-col items-center justify-center py-8 text-center">
						<Facebook className="h-12 w-12 text-muted-foreground mb-4" />
						<p className="text-sm text-muted-foreground">
							No Meta ad accounts are accessible with your current integration.
						</p>
						<p className="text-xs text-muted-foreground mt-2">
							Make sure you have access to at least one Meta ad account.
						</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Meta Ad Accounts</CardTitle>
				<CardDescription>
					{accounts.length} {accounts.length === 1 ? "account" : "accounts"} accessible
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="space-y-2">
					{accounts.map((account: MetaAdsAccount) => (
						<button
							key={account.accountId}
							onClick={() => handleAccountClick(account.accountId)}
							className="w-full text-left p-4 rounded-lg border transition-colors border-border hover:bg-accent"
						>
							<div className="flex items-start justify-between gap-4">
								<div className="flex items-start gap-3 flex-1">
									<div className="mt-1">
										<Building2 className="h-5 w-5 text-muted-foreground" />
									</div>
									<div className="flex-1 min-w-0">
										<div className="font-medium truncate">
											{account.accountName || `Account ${account.accountId}`}
										</div>
										<div className="text-sm text-muted-foreground mt-1">
											Account ID: {account.accountId}
										</div>
										<div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-1">
											{account.currency && (
												<span>Currency: {account.currency}</span>
											)}
											{account.timezone && (
												<span>Timezone: {account.timezone}</span>
											)}
											{account.amountSpent && (
												<span>Spent: {account.amountSpent}</span>
											)}
										</div>
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


