"use client";

import * as React from "react";
import { format, subDays } from "date-fns";

import { MetricPieCard } from "@/components/dashboard/metric-pie-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

type SeriesPoint = { date: string; views: number; viewers: number; engagements: number };

type PageSnapshot = {
  followers: number;
  newFollows: number;
  newFollowsUnique: number;
  unfollowsUnique: number;
  engagedFollowers: number;
  views: number;
  viewers: number;
  viewsOrganic: number;
  viewsPaid: number;
  viewsFollowers: number;
  viewsNonFollowers: number;
  engagements: number;
  pageVisits: number;
  ctaClicks: number;
  directionClicks: number;
  videoViews: number;
  videoOrganic: number;
  videoPaid: number;
  videoAutoplay: number;
  videoClick: number;
  video30s: number;
  videoViewHours: number;
  reactions: { like: number; love: number; haha: number; wow: number; sad: number; angry: number };
  countries: { name: string; followers: number }[];
  newConversations: number;
  blockedConversations: number;
  reportedConversations: number;
  contentEarnings: number;
  approximateEarnings: number;
  series: SeriesPoint[];
};

function seedFrom(pageId: string) {
  let hash = 2166136261;
  for (const char of pageId) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return hash >>> 0;
}

function unit(seed: number, shift: number) {
  return ((seed >> shift) & 255) / 255;
}

function buildSnapshot(pageId: string): PageSnapshot {
  const seed = seedFrom(pageId || "page");
  const scale = 0.45 + unit(seed, 0) * 1.4;
  const viewsBase = Math.round(4200 * scale);
  const series: SeriesPoint[] = Array.from({ length: 30 }, (_, index) => {
    const wave = 0.82 + Math.sin((index + (seed % 9)) / 3.2) * 0.16;
    const views = Math.round(viewsBase * wave);
    return {
      date: format(subDays(new Date(), 29 - index), "yyyy-MM-dd"),
      views,
      viewers: Math.round(views * (0.38 + unit(seed, 4) * 0.08)),
      engagements: Math.round(views * (0.045 + unit(seed, 8) * 0.02)),
    };
  });
  const views = series.reduce((sum, day) => sum + day.views, 0);
  const viewers = series.reduce((sum, day) => sum + day.viewers, 0);
  const engagements = series.reduce((sum, day) => sum + day.engagements, 0);
  const paidShare = 0.12 + unit(seed, 12) * 0.18;
  const followerShare = 0.55 + unit(seed, 16) * 0.2;
  const followers = Math.round(8400 * scale + unit(seed, 2) * 2200);

  return {
    followers,
    newFollows: Math.round(followers * 0.018),
    newFollowsUnique: Math.round(followers * 0.016),
    unfollowsUnique: Math.round(followers * 0.004),
    engagedFollowers: Math.round(followers * 0.11),
    views,
    viewers,
    viewsOrganic: Math.round(views * (1 - paidShare)),
    viewsPaid: Math.round(views * paidShare),
    viewsFollowers: Math.round(views * followerShare),
    viewsNonFollowers: Math.round(views * (1 - followerShare)),
    engagements,
    pageVisits: Math.round(views * 0.07),
    ctaClicks: Math.round(views * 0.008),
    directionClicks: Math.round(40 + unit(seed, 6) * 80),
    videoViews: Math.round(views * 0.22),
    videoOrganic: Math.round(views * 0.16),
    videoPaid: Math.round(views * 0.06),
    videoAutoplay: Math.round(views * 0.15),
    videoClick: Math.round(views * 0.07),
    video30s: Math.round(views * 0.05),
    videoViewHours: Math.round(views * 0.004 * 10) / 10,
    reactions: {
      like: Math.round(engagements * 0.62),
      love: Math.round(engagements * 0.14),
      haha: Math.round(engagements * 0.08),
      wow: Math.round(engagements * 0.07),
      sad: Math.round(engagements * 0.03),
      angry: Math.round(engagements * 0.02),
    },
    countries: [
      { name: "Kenya", followers: Math.round(followers * 0.71) },
      { name: "Uganda", followers: Math.round(followers * 0.09) },
      { name: "Tanzania", followers: Math.round(followers * 0.07) },
      { name: "United States", followers: Math.round(followers * 0.05) },
      { name: "United Kingdom", followers: Math.round(followers * 0.04) },
    ],
    newConversations: Math.round(18 + unit(seed, 10) * 40),
    blockedConversations: Math.round(unit(seed, 14) * 4),
    reportedConversations: Math.round(unit(seed, 18) * 2),
    contentEarnings: Math.round(1200 * scale),
    approximateEarnings: Math.round(980 * scale),
    series,
  };
}

function formatCount(value: number) {
  return value.toLocaleString();
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 px-3 py-2">
      <p className="truncate text-[11px] text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold tabular-nums leading-tight tracking-tight">{value}</p>
    </div>
  );
}

function Meter({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const width = max > 0 ? Math.max(4, Math.round((value / max) * 100)) : 0;
  return (
    <div className="grid grid-cols-[4.75rem_minmax(0,1fr)_3.25rem] items-center gap-2">
      <span className="truncate text-xs text-muted-foreground">{label}</span>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full" style={{ width: `${width}%`, backgroundColor: color }} />
      </div>
      <span className="text-right text-xs tabular-nums">{formatCount(value)}</span>
    </div>
  );
}

function Pair({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );
}

export function FacebookPageAnalytics({ pageId, pageName }: { pageId: string; pageName: string }) {
  const [range, setRange] = React.useState("30d");
  const snapshot = React.useMemo(() => buildSnapshot(pageId), [pageId]);
  const days = range === "7d" ? 7 : 30;
  const series = snapshot.series.slice(-days);
  const periodViews = series.reduce((sum, day) => sum + day.views, 0);
  const periodViewers = series.reduce((sum, day) => sum + day.viewers, 0);
  const periodEngagements = series.reduce((sum, day) => sum + day.engagements, 0);
  const share = snapshot.views === 0 ? 1 : periodViews / snapshot.views;
  const scale = (value: number) => Math.round(value * share);
  const reactionTotal = scale(
    Object.values(snapshot.reactions).reduce((sum, value) => sum + value, 0),
  );

  const reactions = [
    { label: "Like", value: scale(snapshot.reactions.like), color: "#3b82f6" },
    { label: "Love", value: scale(snapshot.reactions.love), color: "#ef4444" },
    { label: "Haha", value: scale(snapshot.reactions.haha), color: "#f59e0b" },
    { label: "Wow", value: scale(snapshot.reactions.wow), color: "#8b5cf6" },
    { label: "Sad", value: scale(snapshot.reactions.sad), color: "#64748b" },
    { label: "Angry", value: scale(snapshot.reactions.angry), color: "#f97316" },
  ];

  return (
    <div className="space-y-3">
      <Card className="gap-0 py-0">
        <CardHeader className="flex flex-row items-center justify-between gap-3 border-b px-4 py-2.5">
          <CardTitle className="text-sm font-medium">
            {pageName}
            <span className="ml-2 font-normal text-muted-foreground">Last {days} days</span>
          </CardTitle>
          <div className="flex items-center">
            <ToggleGroup
              type="single"
              value={range}
              onValueChange={(value) => {
                if (value) setRange(value);
              }}
              variant="outline"
              className="hidden *:data-[slot=toggle-group-item]:!px-3 @md/main:flex"
            >
              <ToggleGroupItem value="30d">30 days</ToggleGroupItem>
              <ToggleGroupItem value="7d">7 days</ToggleGroupItem>
            </ToggleGroup>
            <Select value={range} onValueChange={setRange}>
              <SelectTrigger className="flex w-28 @md/main:hidden" size="sm" aria-label="Select a range">
                <SelectValue placeholder="30 days" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30d">30 days</SelectItem>
                <SelectItem value="7d">7 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 lg:divide-x">
          <MiniStat label="Followers" value={formatCount(snapshot.followers)} />
          <MiniStat label="Views" value={formatCount(periodViews)} />
          <MiniStat label="Viewers" value={formatCount(periodViewers)} />
          <MiniStat label="Engagements" value={formatCount(periodEngagements)} />
          <MiniStat label="Page visits" value={formatCount(scale(snapshot.pageVisits))} />
          <MiniStat label="Video views" value={formatCount(scale(snapshot.videoViews))} />
        </div>
      </Card>

      <div className="grid grid-cols-1 items-start gap-3 lg:grid-cols-2">
        <MetricPieCard
          title="Where views came from"
          description="Organic and paid plays or displays"
          slices={[
            { key: "organic", label: "Organic", value: scale(snapshot.viewsOrganic), color: "#6366f1" },
            { key: "paid", label: "Paid", value: scale(snapshot.viewsPaid), color: "#f59e0b" },
          ]}
          centerValue={formatCount(periodViews)}
          centerLabel="views"
          stats={[
            { label: "Followers", value: formatCount(scale(snapshot.viewsFollowers)) },
            { label: "Non-followers", value: formatCount(scale(snapshot.viewsNonFollowers)) },
            { label: "Unique viewers", value: formatCount(periodViewers) },
            { label: "Page visits", value: formatCount(scale(snapshot.pageVisits)) },
          ]}
          actions={[]}
        />
        <MetricPieCard
          title="Reactions"
          description="Reactions on the Page's posts"
          slices={reactions.map((reaction) => ({
            key: reaction.label.toLowerCase(),
            label: reaction.label,
            value: reaction.value,
            color: reaction.color,
          }))}
          centerValue={formatCount(reactionTotal)}
          centerLabel="reactions"
          stats={reactions.slice(0, 4).map((reaction) => ({
            label: reaction.label,
            value: formatCount(reaction.value),
          }))}
          actions={[]}
        />
      </div>

      <Card className="gap-0 py-0">
          <CardHeader className="px-4 pt-3 pb-1">
            <CardTitle className="text-sm font-medium">Video, audience, and actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-x-6 px-4 pt-1 pb-3 sm:grid-cols-3">
            <div>
              <Pair label="3-second views" value={formatCount(scale(snapshot.videoViews))} />
              <Pair label="30-second views" value={formatCount(scale(snapshot.video30s))} />
              <Pair label="Autoplayed" value={formatCount(scale(snapshot.videoAutoplay))} />
              <Pair label="Clicked to play" value={formatCount(scale(snapshot.videoClick))} />
              <Pair label="Organic" value={formatCount(scale(snapshot.videoOrganic))} />
              <Pair label="Paid" value={formatCount(scale(snapshot.videoPaid))} />
              <Pair label="Watch time" value={`${(snapshot.videoViewHours * share).toFixed(1)} hrs`} />
            </div>
            <div className="space-y-1.5">
              {snapshot.countries.map((country) => (
                <Meter
                  key={country.name}
                  label={country.name}
                  value={country.followers}
                  max={snapshot.followers}
                  color="#6366f1"
                />
              ))}
            </div>
            <div>
              <Pair label="New follows" value={formatCount(scale(snapshot.newFollows))} />
              <Pair label="Unique follows" value={formatCount(scale(snapshot.newFollowsUnique))} />
              <Pair label="Unfollows" value={formatCount(scale(snapshot.unfollowsUnique))} />
              <Pair label="Engaged followers" value={formatCount(snapshot.engagedFollowers)} />
              <Pair label="Button clicks" value={formatCount(scale(snapshot.ctaClicks))} />
              <Pair label="Directions" value={formatCount(scale(snapshot.directionClicks))} />
              <Pair label="New chats" value={formatCount(scale(snapshot.newConversations))} />
              <Pair label="Blocked" value={formatCount(scale(snapshot.blockedConversations))} />
              <Pair label="Reported" value={formatCount(scale(snapshot.reportedConversations))} />
              <Pair label="Content earnings" value={`KES ${formatCount(scale(snapshot.contentEarnings))}`} />
              <Pair label="Approx. earnings" value={`KES ${formatCount(scale(snapshot.approximateEarnings))}`} />
            </div>
          </CardContent>
      </Card>
    </div>
  );
}
