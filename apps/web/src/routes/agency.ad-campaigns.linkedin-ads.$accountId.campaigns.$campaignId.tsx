"use client";

import * as React from "react";
import { useNavigate, useParams } from "react-router";
import { format } from "date-fns";
import { trpc } from "@/utils/trpc";
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, RefreshCw, AlertCircle, Layers, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

function formatNumber(value: number | string | null | undefined): string {
  const num = typeof value === "string" ? parseFloat(value) : Number(value || 0);
  if (Number.isNaN(num)) return "0";
  return num.toLocaleString("en-US", { maximumFractionDigits: num % 1 === 0 ? 0 : 2 });
}

function formatCurrency(value: number | string | null | undefined, currency: string): string {
  const num = typeof value === "string" ? parseFloat(value) : Number(value || 0);
  if (Number.isNaN(num)) return "0";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  } catch {
    return `${currency} ${formatNumber(num)}`;
  }
}

function statusStyles(status?: string | null): { variant: "outline" | "secondary" | "destructive"; className?: string } {
  const value = (status || "").toUpperCase();
  if (value === "ACTIVE") {
    return {
      variant: "outline",
      className:
        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800 rounded-full",
    };
  }
  if (value === "PAUSED" || value === "DRAFT") {
    return {
      variant: "secondary",
      className:
        "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 border-amber-200 dark:border-amber-800 rounded-full",
    };
  }
  if (value === "REMOVED" || value === "ARCHIVED" || value === "CANCELED") {
    return { variant: "destructive", className: "rounded-full" };
  }
  return { variant: "secondary", className: "rounded-full" };
}

export default function LinkedInCampaignDetailsPage() {
  const params = useParams();
  const navigate = useNavigate();
  const utils = trpc.useUtils();

  const accountId = String(params?.accountId || "");
  const campaignId = String(params?.campaignId || "");

  const timeRange = React.useMemo(
    () => ({
      since: format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
      until: format(new Date(), "yyyy-MM-dd"),
    }),
    []
  );

  const {
    data: accountData,
    isLoading: isLoadingAccount,
    isFetching: isFetchingAccount,
    refetch: refetchAccount,
  } = trpc.linkedInAds.accounts.getAccountDetails.useQuery(
    { accountId },
    { enabled: !!accountId, refetchOnWindowFocus: false, retry: 1, staleTime: 0, refetchOnMount: "always" }
  );

  const {
    data: campaignGroupsData,
    isLoading: isLoadingCampaignGroups,
    isFetching: isFetchingCampaignGroups,
    error: campaignGroupError,
    refetch: refetchCampaignGroups,
  } = trpc.linkedInAds.campaignGroups.listCampaignGroups.useQuery(
    { accountId, timeRange },
    { enabled: !!accountId, refetchOnWindowFocus: false, retry: 1, staleTime: 0, refetchOnMount: "always" }
  );

  const campaignGroup = React.useMemo(() => {
    const groups = campaignGroupsData?.data || [];
    return groups.find((group: any) => String(group.id) === campaignId) || null;
  }, [campaignGroupsData, campaignId]);

  const {
    data: campaignsData,
    isLoading: isLoadingCampaigns,
    isFetching: isFetchingCampaigns,
    refetch: refetchCampaigns,
  } = trpc.linkedInAds.campaigns.listCampaigns.useQuery(
    { accountId, campaignGroupId: campaignId, timeRange },
    {
      enabled: !!accountId && !!campaignId && !!campaignGroup,
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 0,
      refetchOnMount: "always",
    }
  );

  const campaigns = campaignsData?.data || [];
  const currency = accountData?.data?.currency || "USD";

  const creativeQueries = trpc.useQueries((t) =>
    campaigns.map((campaign: any) =>
      t.linkedInAds.creatives.listCreatives(
        { accountId, campaignId: String(campaign.id), timeRange },
        {
          enabled: !!accountId && !!campaign?.id,
          refetchOnWindowFocus: false,
          retry: 1,
        }
      )
    )
  );

  const creativesByCampaign = React.useMemo(() => {
    const map: Record<string, any[]> = {};
    campaigns.forEach((campaign: any, idx: number) => {
      map[String(campaign.id)] = creativeQueries[idx]?.data?.data || [];
    });
    return map;
  }, [campaigns, creativeQueries]);

  const isFetchingCreatives = creativeQueries.some((q) => q.isFetching);

  const metrics = React.useMemo(() => {
    let totalImpressions = 0;
    let totalClicks = 0;
    let totalSpend = 0;
    let totalConversions = 0;

    campaigns.forEach((campaign: any) => {
      totalImpressions += Number(campaign?.insights?.impressions || 0);
      totalClicks += Number(campaign?.insights?.clicks || 0);
      totalSpend += Number(campaign?.insights?.spend || 0);
      totalConversions += Number(campaign?.insights?.externalWebsiteConversions || 0);
    });

    const avgCPC = totalClicks > 0 ? totalSpend / totalClicks : 0;
    const avgCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    return { totalImpressions, totalClicks, totalSpend, totalConversions, avgCPC, avgCTR };
  }, [campaigns]);

  const isRefreshing = isFetchingAccount || isFetchingCampaignGroups || isFetchingCampaigns || isFetchingCreatives;

  React.useEffect(() => {
    if (campaignGroupError) {
      toast.error(campaignGroupError.message || "Failed to load LinkedIn campaign details");
    }
  }, [campaignGroupError]);

  const handleRefresh = async () => {
    await Promise.all([refetchAccount(), refetchCampaignGroups(), refetchCampaigns()]);
    await utils.linkedInAds.invalidate();
    toast.success("Campaign data refreshed");
  };

  if (isLoadingAccount || isLoadingCampaignGroups) {
    return (
      <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
        <div className="w-full max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!campaignGroup) {
    return (
      <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
        <div className="w-full max-w-7xl mx-auto">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Card className="border-destructive">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-12 w-12 text-destructive mb-4" />
              <h3 className="text-lg font-semibold mb-2">Failed to Load Campaign</h3>
              <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
                Campaign not found for this account or access is unavailable.
              </p>
              <Button onClick={() => navigate(-1)}>Go Back</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
      <div className="w-full max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="shrink-0">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="min-w-0 flex-1">
              <h1 className="text-base font-semibold tracking-tight truncate">
                {campaignGroup.name || `Campaign ${campaignGroup.id}`}
              </h1>
              <p className="text-xs text-muted-foreground">LinkedIn Ads campaign details</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing} className="rounded-full h-8 gap-2">
            <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
            Refresh
          </Button>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b">
            <h2 className="text-lg font-semibold">Overview</h2>
          </div>

          <Card className="bg-card shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Campaign Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Badge variant={statusStyles(campaignGroup.status).variant} className={statusStyles(campaignGroup.status).className}>
                    {campaignGroup.status || "UNKNOWN"}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Campaign Group ID</p>
                  <p className="text-sm font-medium">{campaignGroup.id}</p>
                </div>
                {campaignGroup.created && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Created</p>
                    <p className="text-sm font-medium">{new Date(campaignGroup.created).toLocaleDateString()}</p>
                  </div>
                )}
                {campaignGroup.lastModified && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Last Modified</p>
                    <p className="text-sm font-medium">{new Date(campaignGroup.lastModified).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <MetricBox label="Impressions" value={formatNumber(metrics.totalImpressions)} />
                <MetricBox label="Clicks" value={formatNumber(metrics.totalClicks)} />
                <MetricBox label="Amount Spent" value={formatCurrency(metrics.totalSpend, currency)} />
                <MetricBox label="Conversions" value={formatNumber(metrics.totalConversions)} />
                <MetricBox label="Avg CPC" value={formatCurrency(metrics.avgCPC, currency)} />
                <MetricBox label="Avg CTR" value={`${metrics.avgCTR.toFixed(2)}%`} />
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <h3 className="text-base font-semibold">Campaigns</h3>
            {isLoadingCampaigns ? (
              <div className="space-y-3">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : campaigns.length === 0 ? (
              <Card className="bg-card shadow-sm">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Layers className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                  <p className="text-sm text-muted-foreground">No campaigns found for this campaign group.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {campaigns.map((campaign: any) => {
                  const creatives = creativesByCampaign[String(campaign.id)] || [];
                  return (
                    <Card key={campaign.id} className="bg-card shadow-sm">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1 min-w-0">
                            <CardTitle className="text-sm truncate">{campaign.name || `Campaign ${campaign.id}`}</CardTitle>
                            <p className="text-xs text-muted-foreground">ID: {campaign.id}</p>
                          </div>
                          <Badge variant={statusStyles(campaign.status).variant} className={statusStyles(campaign.status).className}>
                            {campaign.status || "UNKNOWN"}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                          <MetricMini label="Impr." value={formatNumber(campaign?.insights?.impressions)} />
                          <MetricMini label="Clicks" value={formatNumber(campaign?.insights?.clicks)} />
                          <MetricMini label="Spend" value={formatCurrency(campaign?.insights?.spend, currency)} />
                          <MetricMini label="CTR" value={`${Number(campaign?.insights?.ctr || 0).toFixed(2)}%`} />
                          <MetricMini label="CPC" value={formatCurrency(campaign?.insights?.cpc, currency)} />
                          <MetricMini label="Conv." value={formatNumber(campaign?.insights?.externalWebsiteConversions)} />
                        </div>
                        <Separator />
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <p className="text-sm font-medium">Ads ({creatives.length})</p>
                          </div>
                          {creatives.length === 0 ? (
                            <p className="text-xs text-muted-foreground">No ads found for this campaign.</p>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {creatives.map((creative: any) => (
                                <div key={creative.id} className="rounded-md border p-3">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                      <p className="text-sm font-medium truncate">{creative.name || `Ad ${creative.id}`}</p>
                                      <p className="text-xs text-muted-foreground">ID: {creative.id}</p>
                                    </div>
                                    <Badge variant={statusStyles(creative.status).variant} className={statusStyles(creative.status).className}>
                                      {creative.status || "UNKNOWN"}
                                    </Badge>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold mt-1">{value}</p>
    </div>
  );
}

function MetricMini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border p-2">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-xs font-semibold mt-1">{value}</p>
    </div>
  );
}
