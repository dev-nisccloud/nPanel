"use client";

import * as React from "react";
import { FilePlus2, Lock, Unlock } from "lucide-react";
import { Link, useNavigate } from "react-router";

import { Button } from "@/components/ui/button";
import {
  HostingStatusBadge,
  HostingSubscriptionsList,
} from "@/components/hosting/hosting-subscriptions-list";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { trpc } from "@/utils/trpc";

import { CreateSubscriptionForHostingDialog } from "./create-subscription-for-hosting-dialog";
import { HostingSubscriptionSuspendDialog } from "./hosting-subscription-suspend-dialog";
import {
  getStatusBadgeVariant,
  getStatusDisplayText,
  isHostingSubscriptionSuspended,
} from "./hosting-utils";
import { useHostingSubscriptionSuspend } from "./use-hosting-subscription-suspend";
import { useHostingSubscriptions } from "./use-hosting-subscriptions";

const CREATE_SUBSCRIPTION_TOOLTIP_LINKED =
  "This service already has a subscription attached. You need to suspend or disable the current subscription to link it to a new one.";

export function HostingDataTable() {
  const navigate = useNavigate();
  const { data, isLoading, isError, error, refetch } = useHostingSubscriptions();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [createSubscriptionFor, setCreateSubscriptionFor] = React.useState<{
    pleskSubscriptionId: string | number;
    subscriptionName: string;
  } | null>(null);

  const suspendActions = useHostingSubscriptionSuspend({
    onSuccess: () => refetch(),
  });

  const pleskIds = React.useMemo(() => data.map((s) => String(s.id)), [data]);
  const { data: pleskIdsWithLinked = [] } =
    trpc.clientSubscriptions.getPleskSubscriptionIdsWithLinkedSubscription.useQuery(
      { pleskSubscriptionIds: pleskIds },
      { enabled: pleskIds.length > 0 },
    );
  const pleskIdsWithLinkedSet = React.useMemo(
    () => new Set(pleskIdsWithLinked),
    [pleskIdsWithLinked],
  );

  const filteredData = React.useMemo(() => {
    if (!searchQuery.trim()) return data;
    return data.filter((subscription) =>
      subscription.subscriptionName.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [data, searchQuery]);

  const items = filteredData.map((subscription) => {
    const hasLinked = pleskIdsWithLinkedSet.has(String(subscription.id));
    const isSuspended = isHostingSubscriptionSuspended(subscription.status);

    return {
      key: String(subscription.id),
      title: (
        <Link
          to={`/agency/hosting/${subscription.id}`}
          className="text-primary hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {subscription.subscriptionName}
        </Link>
      ),
      trailing: (
        <HostingStatusBadge
          label={getStatusDisplayText(subscription.status)}
          variant={getStatusBadgeVariant(subscription.status)}
          isActive={subscription.status === 0}
        />
      ),
      actions: (
        <>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 px-2.5 text-xs"
                    disabled={hasLinked}
                    onClick={() =>
                      setCreateSubscriptionFor({
                        pleskSubscriptionId: subscription.id,
                        subscriptionName: subscription.subscriptionName,
                      })
                    }
                  >
                    <FilePlus2 className="mr-1 h-3.5 w-3.5" />
                    Create
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                {hasLinked
                  ? CREATE_SUBSCRIPTION_TOOLTIP_LINKED
                  : "Create a Nisc subscription and link it to an organization."}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {isSuspended ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 px-2.5 text-xs"
              onClick={() =>
                suspendActions.requestUnsuspend(
                  subscription.id,
                  subscription.subscriptionName,
                )
              }
            >
              <Unlock className="mr-1 h-3.5 w-3.5" />
              Reactivate
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 px-2.5 text-xs text-destructive hover:text-destructive"
              onClick={() =>
                suspendActions.requestSuspend(
                  subscription.id,
                  subscription.subscriptionName,
                )
              }
            >
              <Lock className="mr-1 h-3.5 w-3.5" />
              Suspend
            </Button>
          )}
        </>
      ),
      onClick: () => navigate(`/agency/hosting/${subscription.id}`),
    };
  });

  return (
    <>
      <HostingSubscriptionsList
        items={items}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        totalCount={data.length}
        isLoading={isLoading}
        isError={isError}
        error={error as Error | null}
        onRetry={() => refetch()}
        toolbarActions={
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setCreateSubscriptionFor({ pleskSubscriptionId: "", subscriptionName: "" })
            }
          >
            <FilePlus2 className="mr-2 h-4 w-4" />
            Create subscription
          </Button>
        }
      />

      <CreateSubscriptionForHostingDialog
        open={createSubscriptionFor !== null}
        onOpenChange={(open) => !open && setCreateSubscriptionFor(null)}
        pleskSubscriptionId={
          createSubscriptionFor?.pleskSubscriptionId !== ""
            ? createSubscriptionFor?.pleskSubscriptionId
            : undefined
        }
        subscriptionName={createSubscriptionFor?.subscriptionName}
        onSuccess={() => setCreateSubscriptionFor(null)}
      />

      <HostingSubscriptionSuspendDialog
        dialog={suspendActions.dialog}
        isPending={suspendActions.isPending}
        onOpenChange={suspendActions.setDialogOpen}
        onConfirm={suspendActions.confirm}
      />
    </>
  );
}
