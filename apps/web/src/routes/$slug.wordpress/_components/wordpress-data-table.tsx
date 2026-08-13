"use client";

import * as React from "react";
import { Link, useLocation, useNavigate } from "react-router";

import {
  WordPressList,
  WordPressListStatusBadge,
} from "@/components/wordpress/wordpress-list";

import { WordPressPricing } from "./wordpress-pricing";
import { useTeamWordPressSubscriptions } from "./use-team-wordpress-subscriptions";

function getDetailRouteId(subscription: { wordpressInstallationId?: string | null }) {
  return subscription.wordpressInstallationId ?? null;
}

function getStatusBadgeVariant(status: string): "default" | "secondary" | "outline" | "destructive" {
  const upperStatus = String(status).toUpperCase();
  if (upperStatus === "ACTIVE") return "default";
  if (upperStatus === "SUSPENDED") return "destructive";
  return "secondary";
}

function getStatusDisplayText(status: string): string {
  const upperStatus = String(status).toUpperCase();
  if (upperStatus === "ACTIVE") return "Active";
  if (upperStatus === "SUSPENDED") return "Suspended";
  if (upperStatus === "PENDING") return "Pending";
  if (upperStatus === "CANCELLED") return "Cancelled";
  return status;
}

function formatListDate(value: string | Date | null | undefined) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString();
}

export function WordPressDataTable() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const teamSlug = pathname.split("/")[1];
  const { data, isLoading, isError, error, refetch } = useTeamWordPressSubscriptions(teamSlug);
  const [searchQuery, setSearchQuery] = React.useState("");

  const filteredData = React.useMemo(() => {
    if (!searchQuery.trim()) return data;
    const q = searchQuery.toLowerCase();
    return data.filter(
      (subscription) =>
        (subscription.subscriptionName ?? "").toLowerCase().includes(q) ||
        (subscription.primaryDomain ?? "").toLowerCase().includes(q),
    );
  }, [data, searchQuery]);

  if (!isLoading && !isError && data.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <WordPressPricing className="min-h-[min(calc(100dvh-18rem),48rem)]" />
      </div>
    );
  }

  const items = filteredData.map((subscription) => {
    const detailId = getDetailRouteId(subscription);
    const titleText =
      subscription.primaryDomain ?? subscription.subscriptionName ?? subscription.id;
    const subscribed = formatListDate(subscription.subscriptionDate);
    const expires = formatListDate(subscription.expiryDate);
    const statusUpper = String(subscription.status).toUpperCase();

    return {
      key: subscription.id,
      title: detailId ? (
        <Link
          to={`/${teamSlug}/wordpress/${detailId}`}
          className="text-primary hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {titleText}
        </Link>
      ) : (
        <span className="text-muted-foreground">{titleText}</span>
      ),
      trailing: (
        <WordPressListStatusBadge
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
      onClick: detailId
        ? () => navigate(`/${teamSlug}/wordpress/${detailId}`)
        : undefined,
    };
  });

  return (
    <WordPressList
      items={items}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      totalCount={data.length}
      isLoading={isLoading}
      isError={isError}
      error={error as unknown as Error | null}
      onRetry={() => refetch()}
      searchPlaceholder="Search WordPress subscriptions..."
      emptyMessage="No WordPress subscriptions found"
      errorTitle="Failed to load WordPress subscriptions"
    />
  );
}
