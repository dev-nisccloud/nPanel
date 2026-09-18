"use client";

import { useLocation } from "react-router";

import { trpc } from "@/utils/trpc";

const REALTIME_QUERY_OPTIONS = {
	placeholderData: (prev: unknown) => prev,
	refetchOnWindowFocus: false,
	refetchOnMount: true,
} as const;

const SETTLED_INVOICE_STATUSES = new Set(["PAID", "CANCELLED", "WRITTEN_OFF"]);

export function useCustomerDashboardMetrics() {
	const { pathname } = useLocation();
	const teamSlug = pathname?.split("/")[1] ?? "";

	const domainsQuery = trpc.clientSubscriptions.getTeamLiveDomainsSummary.useQuery(
		{ teamSlug },
		{ ...REALTIME_QUERY_OPTIONS, enabled: Boolean(teamSlug) },
	);

	const teamQuery = trpc.teams.getTeamIdBySlug.useQuery(
		{ slug: teamSlug },
		{ enabled: Boolean(teamSlug), staleTime: 5 * 60 * 1000 },
	);

	const teamId = teamQuery.data?.id;

	const invoicesQuery = trpc.invoicing.list.useQuery(
		{ teamId: teamId ?? undefined, limit: 100 },
		{ ...REALTIME_QUERY_OPTIONS, enabled: Boolean(teamId) },
	);

	const hostingQuery = trpc.clientSubscriptions.getTeamHostingSummary.useQuery(
		{ teamSlug },
		{ ...REALTIME_QUERY_OPTIONS, enabled: Boolean(teamSlug) },
	);

	const subscriptionsQuery = trpc.clientSubscriptions.getTeamSubscriptionSummary.useQuery(
		{ teamSlug },
		{ ...REALTIME_QUERY_OPTIONS, enabled: Boolean(teamSlug) },
	);

	const invoices = invoicesQuery.data?.invoices ?? [];
	const invoicesTotal = invoicesQuery.data?.total ?? 0;
	const invoicesPaid = invoices.filter((invoice) => invoice.status === "PAID").length;
	const invoicesUnpaid = invoices.filter(
		(invoice) => !SETTLED_INVOICE_STATUSES.has(invoice.status),
	).length;
	const invoicesOverdue = invoices.filter((invoice) => invoice.status === "OVERDUE").length;

	return {
		teamSlug,
		teamId: teamId ?? null,
		domains: {
			total: domainsQuery.data?.total ?? null,
			active: domainsQuery.data?.active ?? null,
			expired: domainsQuery.data?.expired ?? null,
			isLoading: domainsQuery.isLoading,
		},
		invoices: {
			total: invoicesQuery.isLoading ? null : invoicesTotal,
			paid: invoicesQuery.isLoading ? null : invoicesPaid,
			unpaid: invoicesQuery.isLoading ? null : invoicesUnpaid,
			overdue: invoicesQuery.isLoading ? null : invoicesOverdue,
			isLoading: teamQuery.isLoading || invoicesQuery.isLoading,
		},
		hosting: {
			total: hostingQuery.data?.total ?? null,
			active: hostingQuery.data?.active ?? null,
			inactive: hostingQuery.data?.other ?? null,
			isLoading: hostingQuery.isLoading,
		},
		subscriptions: {
			total: subscriptionsQuery.data?.total ?? null,
			active: subscriptionsQuery.data?.active ?? null,
			other: subscriptionsQuery.data?.other ?? null,
			isLoading: subscriptionsQuery.isLoading,
		},
	};
}

export type CustomerDashboardMetrics = ReturnType<typeof useCustomerDashboardMetrics>;
