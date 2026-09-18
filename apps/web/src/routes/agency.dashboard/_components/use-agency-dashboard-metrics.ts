"use client";

import { trpc } from "@/utils/trpc";

const REALTIME_QUERY_OPTIONS = {
	placeholderData: (prev: unknown) => prev,
	refetchOnWindowFocus: false,
	refetchOnMount: true,
} as const;

const ALL_TIME_REPORT_FILTERS = {
	from: new Date(2000, 0, 1),
	to: new Date(),
};

export type CountValue = number | null;

type DomainEntry = { expiryDate?: string };

function countOrNull(isError: boolean, value: number | undefined): CountValue {
	if (isError) return null;
	return value ?? 0;
}

function formatOpBalance(isError: boolean, amount: number | undefined): string {
	if (isError) return "N/A";
	return `$${(amount ?? 0).toFixed(2)}`;
}

function formatKenicBalance(opts: {
	isLoading: boolean;
	isError: boolean;
	balance?: number;
	currency?: string;
}): { display: string; unavailable: boolean } {
	if (opts.isLoading) return { display: "…", unavailable: false };
	if (opts.isError || opts.balance == null) {
		return { display: "Coming soon", unavailable: true };
	}
	const currency = opts.currency ?? "KES";
	if (currency === "KES") {
		return {
			display: `KES ${opts.balance.toLocaleString("en-KE", {
				minimumFractionDigits: 2,
				maximumFractionDigits: 2,
			})}`,
			unavailable: false,
		};
	}
	return {
		display: `${currency} ${opts.balance.toFixed(2)}`,
		unavailable: false,
	};
}

export function useAgencyDashboardMetrics() {
	const openProviderDomains = trpc.openProvider.domains.list.useQuery(
		{ limit: 1000, offset: 0, with_customer_info: false },
		{ ...REALTIME_QUERY_OPTIONS, retry: false },
	);

	const kenicDomains = trpc.kenic.domainList.list.useQuery(
		{},
		{ ...REALTIME_QUERY_OPTIONS, retry: false },
	);

	const tickets = trpc.tickets.getSummary.useQuery(undefined, REALTIME_QUERY_OPTIONS);
	const invoices = trpc.niscReports.invoices.statusSummaryWithKra.useQuery(
		ALL_TIME_REPORT_FILTERS,
		REALTIME_QUERY_OPTIONS,
	);
	const quotations = trpc.quotations.getSummary.useQuery(undefined, REALTIME_QUERY_OPTIONS);
	const openProviderBalance = trpc.openProvider.reseller.getBalance.useQuery(undefined, {
		...REALTIME_QUERY_OPTIONS,
		retry: false,
	});
	const kenicBalance = trpc.kenic.balance.getBalance.useQuery(undefined, {
		...REALTIME_QUERY_OPTIONS,
		retry: false,
	});
	const mediaBuying = trpc.agencyDashboard.getMediaBuyingPlatforms.useQuery(
		undefined,
		REALTIME_QUERY_OPTIONS,
	);
	const hosting = trpc.agencyDashboard.getHostingSubscriptions.useQuery(
		undefined,
		REALTIME_QUERY_OPTIONS,
	);
	const accounts = trpc.agencyDashboard.getAccountCounts.useQuery(
		undefined,
		REALTIME_QUERY_OPTIONS,
	);
	const transactions = trpc.paymentTransactions.getSummary.useQuery(
		undefined,
		REALTIME_QUERY_OPTIONS,
	);
	const orders = trpc.niscServiceOrders.getSummary.useQuery(
		undefined,
		REALTIME_QUERY_OPTIONS,
	);

	const now = new Date();
	const soon = new Date(now);
	soon.setDate(soon.getDate() + 30);

	const openProviderList = (openProviderDomains.data?.data ?? []) as DomainEntry[];
	const kenicList = (kenicDomains.data?.data ?? []) as DomainEntry[];
	const mergedDomains = [...openProviderList, ...kenicList];

	const openProviderTotal = openProviderDomains.isError
		? null
		: (openProviderDomains.data?.meta?.total ?? openProviderList.length);
	const kenicTotal = kenicDomains.isError ? null : kenicList.length;
	const domainsUnavailable = openProviderTotal === null && kenicTotal === null;

	const domainsTotal = domainsUnavailable ? null : (openProviderTotal ?? 0) + (kenicTotal ?? 0);
	const domainsExpired = domainsUnavailable
		? null
		: mergedDomains.filter((d) => d.expiryDate && new Date(d.expiryDate) < now).length;
	const domainsExpiringSoon = domainsUnavailable
		? null
		: mergedDomains.filter((d) => {
				if (!d.expiryDate) return false;
				const expiry = new Date(d.expiryDate);
				return expiry >= now && expiry <= soon;
			}).length;
	const domainsActive =
		domainsTotal === null || domainsExpired === null ? null : domainsTotal - domainsExpired;

	const kc = formatKenicBalance({
		isLoading: kenicBalance.isLoading,
		isError: kenicBalance.isError,
		balance: kenicBalance.data?.balance,
		currency: kenicBalance.data?.currency,
	});

	return {
		domains: {
			total: domainsTotal,
			active: domainsActive,
			expired: domainsExpired,
			expiringSoon: domainsExpiringSoon,
			isLoading: openProviderDomains.isLoading || kenicDomains.isLoading,
			isError: openProviderDomains.isError || kenicDomains.isError,
			openProviderError: openProviderDomains.isError,
			kenicError: kenicDomains.isError,
		},
		hosting: {
			total: countOrNull(hosting.isError, hosting.data?.total),
			active: countOrNull(hosting.isError, hosting.data?.active),
			suspended: countOrNull(hosting.isError, hosting.data?.suspended),
			isLoading: hosting.isLoading,
			isError: hosting.isError,
		},
		balances: {
			op: formatOpBalance(openProviderBalance.isError, openProviderBalance.data?.balance),
			opLoading: openProviderBalance.isLoading,
			opError: openProviderBalance.isError,
			kc: kc.display,
			kcLoading: kenicBalance.isLoading,
			kcUnavailable: kc.unavailable,
		},
		invoices: {
			total: countOrNull(invoices.isError, invoices.data?.total),
			kraSynced: countOrNull(invoices.isError, invoices.data?.kraSynced),
			notSynced: countOrNull(invoices.isError, invoices.data?.kraNotSynced),
			isLoading: invoices.isLoading,
			isError: invoices.isError,
		},
		quotations: {
			total: countOrNull(quotations.isError, quotations.data?.total),
			pending: countOrNull(quotations.isError, quotations.data?.pending),
			closed: countOrNull(quotations.isError, quotations.data?.closed),
			isLoading: quotations.isLoading,
			isError: quotations.isError,
		},
		transactions: {
			total: countOrNull(transactions.isError, transactions.data?.total),
			success: countOrNull(transactions.isError, transactions.data?.success),
			failed: countOrNull(transactions.isError, transactions.data?.failed),
			isLoading: transactions.isLoading,
			isError: transactions.isError,
		},
		orders: {
			total: countOrNull(orders.isError, orders.data?.total),
			completed: countOrNull(orders.isError, orders.data?.completed),
			failed: countOrNull(orders.isError, orders.data?.failed),
			isLoading: orders.isLoading,
			isError: orders.isError,
		},
		tickets: {
			total: countOrNull(tickets.isError, tickets.data?.total),
			open: countOrNull(tickets.isError, tickets.data?.openTotal),
			closed: countOrNull(tickets.isError, tickets.data?.closedTotal),
			isLoading: tickets.isLoading,
			isError: tickets.isError,
		},
		accounts: {
			customers: countOrNull(accounts.isError, accounts.data?.customers.total),
			customerActive: countOrNull(accounts.isError, accounts.data?.customers.active),
			customerInactive: countOrNull(accounts.isError, accounts.data?.customers.inactive),
			agency: countOrNull(accounts.isError, accounts.data?.agency.total),
			agencyActive: countOrNull(accounts.isError, accounts.data?.agency.active),
			agencyInactive: countOrNull(accounts.isError, accounts.data?.agency.inactive),
			isLoading: accounts.isLoading,
			isError: accounts.isError,
		},
		mediaBuying: {
			platforms: mediaBuying.data?.platforms ?? [],
			totalConnected: countOrNull(mediaBuying.isError, mediaBuying.data?.totalConnected),
			isLoading: mediaBuying.isLoading,
			isError: mediaBuying.isError,
		},
	};
}

export type AgencyDashboardMetrics = ReturnType<typeof useAgencyDashboardMetrics>;
