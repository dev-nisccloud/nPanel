"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { trpc } from "@/utils/trpc";
import { toast } from "@/components/ui/sonner";
import { ShoppingCart, Building2, Globe, Calendar } from "lucide-react";
import { useNavigate } from "react-router";
import type { GoogleAdsAccount } from "./schemas";

export function AccountsList() {
	const navigate = useNavigate();
	const {
		data: accountsData,
		isLoading,
		error,
		refetch,
	} = trpc.googleAds.accounts.listAccessibleAccounts.useQuery(undefined, {
		refetchOnWindowFocus: false,
		retry: 1,
	});

	React.useEffect(() => {
		if (error) {
			toast.error(error.message || "Failed to load Google Ads accounts");
		}
	}, [error]);

	const accounts = accountsData?.data || [];

	const handleAccountClick = (customerId: string) => {
		// Remove dashes from customer ID for URL (format: XXX-XXX-XXXX -> XXXXXXXXXX)
		const customerIdWithoutDashes = customerId.replace(/-/g, '');
		navigate(`/agency/ad-campaigns/google-ads/${customerIdWithoutDashes}`);
	};

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

	if (accounts.length === 0) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Google Ads Accounts</CardTitle>
					<CardDescription>No accessible Google Ads accounts found.</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex flex-col items-center justify-center py-8 text-center">
						<ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
						<p className="text-sm text-muted-foreground">
							No Google Ads accounts are accessible with your current integration.
						</p>
						<p className="text-xs text-muted-foreground mt-2">
							Make sure you have access to at least one Google Ads account.
						</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Google Ads Accounts</CardTitle>
				<CardDescription>
					{accounts.length} {accounts.length === 1 ? "account" : "accounts"} accessible
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
					{accounts.map((account: GoogleAdsAccount) => (
						<button
							key={account.customerId}
							onClick={() => handleAccountClick(account.customerId)}
							className="w-full text-left flex items-start gap-4 rounded-lg border p-4 hover:bg-accent/50 transition-colors"
						>
							<div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
								<Building2 className="h-5 w-5 text-primary" />
							</div>
							<div className="flex-1 space-y-1">
								<div className="flex items-center gap-2">
									<h3 className="font-semibold">
										{account.accountName || `Account ${account.customerId}`}
									</h3>
									{account.status && (
										<span
											className={`rounded-full px-2 py-0.5 text-xs font-medium ${
												account.status === "ACTIVE"
													? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
													: account.status === "PAUSED"
														? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
														: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
											}`}
										>
											{account.status}
										</span>
									)}
								</div>
								<div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
									<div className="flex items-center gap-1">
										<ShoppingCart className="h-3 w-3" />
										<span>ID: {account.customerId}</span>
									</div>
									{account.currencyCode && (
										<div className="flex items-center gap-1">
											<Globe className="h-3 w-3" />
											<span>{account.currencyCode}</span>
										</div>
									)}
									{account.timeZone && (
										<div className="flex items-center gap-1">
											<Calendar className="h-3 w-3" />
											<span>{account.timeZone}</span>
										</div>
									)}
								</div>
							</div>
						</button>
					))}
				</div>
			</CardContent>
		</Card>
	);
}

