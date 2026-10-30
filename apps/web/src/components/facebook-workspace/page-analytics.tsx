"use client";

import * as React from "react";
import { format, parseISO, subDays } from "date-fns";
import { Calendar as CalendarIcon, FileText, Info, RefreshCw } from "lucide-react";
import { type DateRange } from "react-day-picker";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";

const activityChartConfig = {
  views: { label: "Views", color: "var(--chart-1)" },
  viewers: { label: "Viewers", color: "var(--chart-2)" },
} satisfies ChartConfig;

const engagementChartConfig = {
  engagements: { label: "Engagements", color: "var(--chart-1)" },
  visits: { label: "Page visits", color: "var(--chart-3)" },
} satisfies ChartConfig;

const audienceChartConfig = {
  newFollows: { label: "New follows", color: "var(--chart-1)" },
  unfollows: { label: "Unfollows", color: "var(--chart-4)" },
} satisfies ChartConfig;

const reactionChartConfig = {
  value: { label: "Reactions", color: "var(--chart-1)" },
} satisfies ChartConfig;

const cachedDetails = {
  staleTime: Number.POSITIVE_INFINITY,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
  retry: false,
} as const;

function formatNumber(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: value % 1 === 0 ? 0 : 1 }).format(value);
}

function formatAxisTick(value: number | string): string {
  const amount = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(amount)) return "";
  const abs = Math.abs(amount);
  if (abs >= 1_000_000) return `${trimScale(amount / 1_000_000)}M`;
  if (abs >= 1_000) return `${trimScale(amount / 1_000)}K`;
  return String(Math.round(amount));
}

function trimScale(value: number): string {
  const rounded = Math.abs(value) >= 10 ? Math.round(value) : Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
}

function verificationLabel(status: string | null): string | null {
  if (!status || status === "not_verified") return null;
  if (status === "blue_verified") return "Verified";
  if (status === "gray_verified") return "Confirmed";
  return status.replace(/_/g, " ");
}

function DetailCells({ items }: { items: Array<{ label: string; value: React.ReactNode }> }) {
  if (items.length === 0) return null;
  return (
    <div className="grid grid-cols-1 divide-y sm:grid-cols-2 sm:divide-x lg:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="px-4 py-3">
          <p className="text-xs text-muted-foreground">{item.label}</p>
          <div className="mt-1 text-sm font-medium text-foreground">{item.value}</div>
        </div>
      ))}
    </div>
  );
}

function ExternalValue({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="break-all text-primary underline-offset-2 hover:underline">
      {label}
    </a>
  );
}

export function FacebookPageAnalytics({
  pageId,
  pageName,
  pictureUrl,
}: {
  pageId: string;
  pageName: string;
  pictureUrl?: string | null;
}) {
  const [pickedRange, setPickedRange] = React.useState<DateRange | undefined>();
  const [isDatePickerOpen, setIsDatePickerOpen] = React.useState(false);
  const timeRange =
    pickedRange?.from && pickedRange?.to
      ? { since: format(pickedRange.from, "yyyy-MM-dd"), until: format(pickedRange.to, "yyyy-MM-dd") }
      : undefined;

  const detailsQuery = trpc.customerOAuth.facebookPages.details.useQuery(
    { pageId, timeRange },
    cachedDetails,
  );
  const showSkeleton = detailsQuery.isLoading || detailsQuery.isFetching;

  const refreshPage = async () => {
    await detailsQuery.refetch();
  };

  const details = detailsQuery.data;
  const profile = details?.profile;
  const insights = details?.insights;
  const posts = details?.posts ?? [];
  const shownRange: DateRange | undefined = pickedRange?.from
    ? pickedRange
    : details?.timeRange
      ? { from: parseISO(details.timeRange.since), to: parseISO(details.timeRange.until) }
      : { from: subDays(new Date(), 29), to: new Date() };

  const name = profile?.name || pageName;
  const photo = profile?.pictureUrl || pictureUrl;
  const verified = verificationLabel(profile?.verificationStatus ?? null);
  const categoryLine = profile?.categories.length
    ? profile.categories.join(", ")
    : profile?.category;

  const aboutBlocks = [
    profile?.about,
    profile?.description && profile.description !== profile.about ? profile.description : null,
    profile?.companyOverview,
    profile?.mission,
    profile?.generalInfo,
    profile?.products,
  ].filter((block): block is string => Boolean(block));

  const daily = (insights?.series ?? []).map((point) => ({
    ...point,
    dateLabel: format(parseISO(point.date), "MMM d"),
  }));
  const reactions = insights
    ? [
        { label: "Like", value: insights.reactions.like },
        { label: "Love", value: insights.reactions.love },
        { label: "Haha", value: insights.reactions.haha },
        { label: "Wow", value: insights.reactions.wow },
        { label: "Sad", value: insights.reactions.sad },
        { label: "Angry", value: insights.reactions.angry },
      ].filter((row) => row.value > 0)
    : [];
  const audienceHasData = daily.some((point) => point.newFollows > 0 || point.unfollows > 0);
  const insightNote = insights && insights.unavailable.length > 0 && insights.views === 0 && insights.engagements === 0
    ? insights.unavailable[0]
    : null;

  const facts = [
    categoryLine ? { label: "Category", value: categoryLine } : null,
    profile?.likes != null ? { label: "Page likes", value: formatNumber(profile.likes) } : null,
    profile?.followers != null ? { label: "Followers", value: formatNumber(profile.followers) } : null,
    profile?.rating != null
      ? {
          label: "Rating",
          value: profile.ratingCount != null
            ? `${formatNumber(profile.rating)} · ${formatNumber(profile.ratingCount)} reviews`
            : formatNumber(profile.rating),
        }
      : null,
    profile?.website ? { label: "Website", value: <ExternalValue href={profile.website} label={profile.website} /> } : null,
    profile?.link && profile.link !== profile.website
      ? { label: "Facebook", value: <ExternalValue href={profile.link} label={profile.link} /> }
      : null,
    profile?.phone ? { label: "Phone", value: profile.phone } : null,
    profile?.whatsapp ? { label: "WhatsApp", value: profile.whatsapp } : null,
    profile?.emails.length ? { label: "Email", value: profile.emails.join(", ") } : null,
    profile?.address ? { label: "Address", value: profile.address } : null,
    profile?.instagramUsername
      ? {
          label: "Instagram",
          value: (
            <ExternalValue
              href={`https://instagram.com/${profile.instagramUsername}`}
              label={`@${profile.instagramUsername}`}
            />
          ),
        }
      : null,
    profile?.founded ? { label: "Founded", value: profile.founded } : null,
    profile?.hours.length
      ? {
          label: "Hours",
          value: (
            <div className="space-y-0.5">
              {profile.hours.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          ),
        }
      : null,
  ].filter((item): item is { label: string; value: React.ReactNode } => item !== null);

  return (
    <div className="min-w-0 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          {photo ? (
            <img src={photo} alt="" referrerPolicy="no-referrer" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
          ) : (
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-base font-semibold text-primary">
              {name.slice(0, 1).toUpperCase()}
            </span>
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight">{name}</h2>
              {verified ? (
                <Badge variant="outline" className="border-sky-200 bg-sky-100 text-sky-800 dark:border-sky-800 dark:bg-sky-900 dark:text-sky-200">
                  {verified}
                </Badge>
              ) : null}
              {profile?.isPublished === false ? <Badge variant="secondary">Unpublished</Badge> : null}
            </div>
            <p className="text-xs text-muted-foreground">
              {[profile?.username ? `@${profile.username}` : null, categoryLine].filter(Boolean).join(" · ") || "Facebook Page"}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-2 rounded-full">
                <CalendarIcon className="h-4 w-4" />
                {shownRange?.from && shownRange.to
                  ? `${format(shownRange.from, "MMM d, yyyy")} – ${format(shownRange.to, "MMM d, yyyy")}`
                  : "Date range"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="range"
                defaultMonth={shownRange?.from}
                selected={shownRange}
                onSelect={(range) => {
                  setPickedRange(range);
                  if (range?.from && range?.to) setIsDatePickerOpen(false);
                }}
                numberOfMonths={2}
                disabled={{ after: new Date() }}
              />
            </PopoverContent>
          </Popover>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-2 rounded-full"
            onClick={() => void refreshPage()}
            disabled={detailsQuery.isFetching}
          >
            <RefreshCw className={cn("h-4 w-4", detailsQuery.isFetching && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {showSkeleton ? (
        <div className="space-y-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-56 w-full" />
        </div>
      ) : detailsQuery.isError && !details ? (
        <div className="rounded-xl border border-dashed px-6 py-10">
          <p className="text-sm font-medium">{name}</p>
          <p className="mt-2 text-sm text-destructive">{detailsQuery.error.message}</p>
        </div>
      ) : (
        <>
          <Card className="gap-0 overflow-hidden py-0">
            {profile?.coverUrl ? (
              <img src={profile.coverUrl} alt="" referrerPolicy="no-referrer" className="h-28 w-full object-cover" />
            ) : null}
            <CardHeader className="border-b bg-muted/30 px-4 py-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Info className="h-4 w-4 text-muted-foreground" />
                Overview
              </CardTitle>
              <CardDescription className="text-xs">About this Page</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {aboutBlocks.length > 0 ? (
                <div className="space-y-3 border-b px-4 py-3">
                  {aboutBlocks.map((block) => (
                    <p key={block} className="text-sm leading-relaxed text-foreground">
                      {block}
                    </p>
                  ))}
                </div>
              ) : null}
              <DetailCells items={facts} />
              {aboutBlocks.length === 0 && facts.length === 0 ? (
                <p className="px-4 py-6 text-sm text-muted-foreground">Facebook did not return profile details for this Page.</p>
              ) : null}
            </CardContent>
          </Card>

          <div className="space-y-6 border-t pt-6">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">Data</h3>
              <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium tracking-wider text-muted-foreground uppercase">
                Daily breakdown
              </span>
            </div>

            {insightNote ? <p className="text-sm text-destructive">{insightNote}</p> : null}

            <Card className="gap-0 overflow-hidden py-0">
              <CardHeader className="border-b bg-muted/30 px-4 py-3">
                <CardTitle className="text-sm font-semibold">Performance</CardTitle>
                <CardDescription className="text-xs">Views, visits, and audience for the selected dates</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <DetailCells
                  items={[
                    { label: "Views", value: formatNumber(insights?.views) },
                    { label: "Viewers", value: formatNumber(insights?.viewers) },
                    { label: "Engagements", value: formatNumber(insights?.engagements) },
                    { label: "Page visits", value: formatNumber(insights?.pageVisits) },
                    { label: "Button clicks", value: formatNumber(insights?.buttonClicks) },
                    { label: "New follows", value: formatNumber(insights?.newFollows) },
                    { label: "Unfollows", value: formatNumber(insights?.unfollows) },
                    insights?.viewsFromAds != null
                      ? { label: "Views from ads", value: formatNumber(insights.viewsFromAds) }
                      : null,
                    insights?.viewsOrganic != null
                      ? { label: "Organic views", value: formatNumber(insights.viewsOrganic) }
                      : null,
                    insights?.viewsFromFollowers != null
                      ? { label: "Views from followers", value: formatNumber(insights.viewsFromFollowers) }
                      : null,
                    insights?.viewsFromNonFollowers != null
                      ? { label: "Views from non-followers", value: formatNumber(insights.viewsFromNonFollowers) }
                      : null,
                  ].filter((item): item is { label: string; value: string } => item !== null)}
                />
              </CardContent>
            </Card>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="bg-card shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Views</CardTitle>
                  <CardDescription className="text-xs">Page content views and unique viewers</CardDescription>
                </CardHeader>
                <CardContent>
                  {daily.length === 0 ? (
                    <p className="py-16 text-center text-xs text-muted-foreground">No daily views for this period.</p>
                  ) : (
                    <ChartContainer config={activityChartConfig} className="h-[250px] w-full">
                      <AreaChart data={daily} margin={{ left: 8, right: 8, top: 8 }}>
                        <CartesianGrid vertical={false} />
                        <XAxis dataKey="dateLabel" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                        <YAxis tickLine={false} axisLine={false} width={48} tickFormatter={formatAxisTick} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Area dataKey="views" stroke="var(--color-views)" fill="var(--color-views)" fillOpacity={0.15} />
                        <Area dataKey="viewers" stroke="var(--color-viewers)" fill="var(--color-viewers)" fillOpacity={0.15} />
                      </AreaChart>
                    </ChartContainer>
                  )}
                </CardContent>
              </Card>
              <Card className="bg-card shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Engagement</CardTitle>
                  <CardDescription className="text-xs">Post engagements and visits to the Page</CardDescription>
                </CardHeader>
                <CardContent>
                  {daily.length === 0 ? (
                    <p className="py-16 text-center text-xs text-muted-foreground">No daily engagement for this period.</p>
                  ) : (
                    <ChartContainer config={engagementChartConfig} className="h-[250px] w-full">
                      <AreaChart data={daily} margin={{ left: 8, right: 8, top: 8 }}>
                        <CartesianGrid vertical={false} />
                        <XAxis dataKey="dateLabel" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                        <YAxis tickLine={false} axisLine={false} width={48} tickFormatter={formatAxisTick} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Area dataKey="engagements" stroke="var(--color-engagements)" fill="var(--color-engagements)" fillOpacity={0.15} />
                        <Area dataKey="visits" stroke="var(--color-visits)" fill="var(--color-visits)" fillOpacity={0.15} />
                      </AreaChart>
                    </ChartContainer>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {audienceHasData ? (
                <Card className="bg-card shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Audience</CardTitle>
                    <CardDescription className="text-xs">New follows and unfollows each day</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={audienceChartConfig} className="h-[220px] w-full">
                      <AreaChart data={daily} margin={{ left: 8, right: 8, top: 8 }}>
                        <CartesianGrid vertical={false} />
                        <XAxis dataKey="dateLabel" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                        <YAxis tickLine={false} axisLine={false} width={48} tickFormatter={formatAxisTick} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Area dataKey="newFollows" stroke="var(--color-newFollows)" fill="var(--color-newFollows)" fillOpacity={0.15} />
                        <Area dataKey="unfollows" stroke="var(--color-unfollows)" fill="var(--color-unfollows)" fillOpacity={0.15} />
                      </AreaChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
              ) : null}
              <Card className="bg-card shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Reactions</CardTitle>
                </CardHeader>
                <CardContent>
                  {reactions.length === 0 ? (
                    <p className="py-10 text-center text-xs text-muted-foreground">No reactions for this period.</p>
                  ) : (
                    <ChartContainer config={reactionChartConfig} className="h-[220px] w-full">
                      <BarChart data={reactions} margin={{ left: 8, right: 8, top: 8 }}>
                        <CartesianGrid vertical={false} />
                        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                        <YAxis tickLine={false} axisLine={false} width={48} tickFormatter={formatAxisTick} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="value" fill="var(--color-value)" radius={4} />
                      </BarChart>
                    </ChartContainer>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card className="gap-0 overflow-hidden py-0">
              <CardHeader className="border-b bg-muted/30 px-4 py-3">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  Recent posts
                </CardTitle>
                <CardDescription className="text-xs">Latest published posts and how people responded</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {posts.length === 0 ? (
                  <p className="px-4 py-6 text-sm text-muted-foreground">No published posts were returned for this Page.</p>
                ) : (
                  <div className="divide-y">
                    {posts.map((post) => (
                      <div key={post.id} className="flex gap-3 px-4 py-3">
                        {post.pictureUrl ? (
                          <img
                            src={post.pictureUrl}
                            alt=""
                            referrerPolicy="no-referrer"
                            className="h-16 w-16 shrink-0 rounded-md object-cover"
                          />
                        ) : null}
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-3 text-sm leading-relaxed">
                            {post.message || "Post without text"}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {[
                              post.createdTime ? format(new Date(post.createdTime), "MMM d, yyyy") : null,
                              post.reactions != null ? `${formatNumber(post.reactions)} reactions` : null,
                              post.comments != null ? `${formatNumber(post.comments)} comments` : null,
                              post.shares != null ? `${formatNumber(post.shares)} shares` : null,
                            ].filter(Boolean).join(" · ")}
                          </p>
                          {post.permalink ? (
                            <a
                              href={post.permalink}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-1 inline-block text-xs text-primary underline-offset-2 hover:underline"
                            >
                              Open post
                            </a>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
