"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { trpc } from "@/utils/trpc";
import { toast } from "@/components/ui/sonner";
import type { GoogleAdsAccount } from "./schemas";
import { Badge } from "@/components/ui/badge";
import { TrendingUp } from "lucide-react";

interface AccountsListProps {
	onAccountSelect?: (accountId: string, accountName?: string) => void;
	selectedAccountId?: string | null;
}

export function AccountsList({ onAccountSelect, selectedAccountId }: AccountsListProps) {
	const {
		data: accountsData,
		isLoading,
		error,
		refetch,
	} = trpc.googleAds.accounts.listAccessibleAccounts.useQuery(undefined, {
		refetchOnWindowFocus: false,
		retry: 1,
	});

	const accounts = accountsData?.data as GoogleAdsAccount[] | undefined;

	React.useEffect(() => {
		if (error) {
			toast.error(error.message || "Failed to load Google Ads accounts");
		}
	}, [error]);

	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Google Ads Accounts</CardTitle>
					<CardDescription>Loading your accessible Google Ads accounts...</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex items-center justify-center py-8">
						<Spinner size={32} />
					</div>
				</CardContent>
			</Card>
		);
	}

	if (!accounts || accounts.length === 0) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Google Ads Accounts</CardTitle>
					<CardDescription>No accessible Google Ads accounts found</CardDescription>
				</CardHeader>
				<CardContent>
					<p className="text-sm text-muted-foreground">
						If you have Google Ads accounts, make sure they are accessible with your connected Google account.
					</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Google Ads Accounts</CardTitle>
				<CardDescription>
					{accounts.length} account{accounts.length !== 1 ? "s" : ""} accessible
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="space-y-2">
					{accounts.map((account) => (
						<button
							key={account.customerId}
							onClick={() => onAccountSelect?.(account.customerId, account.accountName || undefined)}
							className={`w-full text-left p-4 rounded-lg border transition-colors ${
								selectedAccountId === account.customerId
									? "border-primary bg-primary/5"
									: "border-border hover:bg-accent"
							}`}
						>
							<div className="flex items-start justify-between gap-4">
								<div className="flex items-start gap-3 flex-1">
									<div className="mt-1">
										<TrendingUp className="h-5 w-5 text-muted-foreground" />
									</div>
									<div className="flex-1 min-w-0">
										<div className="font-medium truncate">
											{account.accountName || account.customerId}
										</div>
										<div className="text-sm text-muted-foreground mt-1">
											Customer ID: {account.customerId}
										</div>
										{account.currencyCode && (
											<div className="text-xs text-muted-foreground mt-1">
												Currency: {account.currencyCode}
											</div>
										)}
									</div>
								</div>
								{account.status && (
									<Badge
										variant={
											account.status === "ACTIVE"
												? "default"
												: account.status === "PAUSED"
													? "secondary"
													: "destructive"
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


