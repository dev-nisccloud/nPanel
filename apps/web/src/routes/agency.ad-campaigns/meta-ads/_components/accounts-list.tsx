"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/utils/trpc";
import { toast } from "@/components/ui/sonner";
import { Facebook, Building2, Globe, Calendar, DollarSign } from "lucide-react";
import { useNavigate } from "react-router";
import type { MetaAdsAccount } from "./schemas";
import { cn } from "@/lib/utils";

const getStatusStyles = (status?: string) => {
	if (!status) return { variant: "secondary" as const, className: "" };
	const upperStatus = status.toUpperCase();
	if (upperStatus === "ACTIVE") {
		return {
			variant: "outline" as const,
			className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800 font-sans rounded-full",
		};
	}
	if (upperStatus === "DISABLED" || upperStatus === "CLOSED") return { variant: "destructive" as const, className: "" };
	return { variant: "secondary" as const, className: "" };
};

export function AccountsList() {
	const navigate = useNavigate();
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
		navigate(`/agency/ad-campaigns/meta-ads/${accountId}`);
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
					{(accounts as any[]).map((account: any) => (
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
										variant={getStatusStyles(account.status).variant}
										className={cn("text-[10px] px-2 py-0.5 font-bold uppercase", getStatusStyles(account.status).className)}
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


