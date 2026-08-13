"use client";

import * as React from "react";
import { Link, useLocation, useNavigate } from "react-router";

import {
  HostingStatusBadge,
  HostingSubscriptionsList,
} from "@/components/hosting/hosting-subscriptions-list";
import { ViewDetailsButton, VisitSiteButton } from "@/components/ui/list-row-actions";
import { HostingPricing } from "./hosting-pricing";
import { getStatusBadgeVariant, getStatusDisplayText } from "./hosting-utils";
import { useTeamHostingSubscriptions } from "./use-team-hosting-subscriptions";

function getDetailRouteId(subscription: { pleskSubscriptionId?: string | null }) {
  return subscription.pleskSubscriptionId ?? null;
}

function formatListDate(value: string | Date | null | undefined) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString();
}

export function HostingDataTable() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const teamSlug = pathname.split("/")[1];
  const { data, isLoading, isError, error, refetch } = useTeamHostingSubscriptions(teamSlug);
  const [searchQuery, setSearchQuery] = React.useState("");

  const filteredData = React.useMemo(() => {
    if (!searchQuery.trim()) return data;
    const q = searchQuery.toLowerCase();
    return data.filter((subscription) =>
      (subscription.subscriptionName ?? "").toLowerCase().includes(q) ||
      (subscription.primaryDomain ?? "").toLowerCase().includes(q),
    );
  }, [data, searchQuery]);

  if (!isLoading && !isError && data.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <HostingPricing className="min-h-[min(calc(100dvh-18rem),48rem)]" />
      </div>
    );
  }

  const items = filteredData.map((subscription) => {
    const detailId = getDetailRouteId(subscription);
    const titleText =
      subscription.primaryDomain ?? subscription.subscriptionName ?? subscription.id;
    const siteUrl = subscription.primaryDomain ?? subscription.subscriptionName;
    const detailHref = detailId ? `/${teamSlug}/hosting/${detailId}` : null;
    const subscribed = formatListDate(subscription.subscriptionDate);
    const expires = formatListDate(subscription.expiryDate);
    const statusUpper = String(subscription.status).toUpperCase();

    return {
      key: subscription.id,
      title: detailHref ? (
        <Link
          to={detailHref}
          className="text-primary hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {titleText}
        </Link>
      ) : (
        <span className="text-muted-foreground">{titleText}</span>
      ),
      trailing: (
        <HostingStatusBadge
          label={getStatusDisplayText(subscription.status)}
          variant={getStatusBadgeVariant(subscription.status)}
          isActive={statusUpper === "ACTIVE"}
        />
      ),
      description:
        subscribed || expires ? (
          <p>
            {subscribed ? `Subscribed ${subscribed}` : null}
            {subscribed && expires ? " · " : null}
            {expires ? `Expires ${expires}` : null}
          </p>
        ) : undefined,
      actions: (
        <>
          <VisitSiteButton url={siteUrl} />
          {detailHref ? (
            <ViewDetailsButton onClick={() => navigate(detailHref)} />
          ) : null}
        </>
      ),
      onClick: detailHref ? () => navigate(detailHref) : undefined,
    };
  });

  return (
    <HostingSubscriptionsList
      items={items}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      totalCount={data.length}
      isLoading={isLoading}
      isError={isError}
      error={error as unknown as Error | null}
      onRetry={() => refetch()}
    />
  );
}
