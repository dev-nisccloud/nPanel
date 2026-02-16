"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useIsMobile } from "@/hooks/use-mobile";

// Mock data for Total Visitors (www.nisccloud.com)
const visitorsData = [
  { date: "2024-04-01", visitors: 222 },
  { date: "2024-04-02", visitors: 97 },
  { date: "2024-04-03", visitors: 167 },
  { date: "2024-04-04", visitors: 242 },
  { date: "2024-04-05", visitors: 373 },
  { date: "2024-04-06", visitors: 301 },
  { date: "2024-04-07", visitors: 245 },
  { date: "2024-04-08", visitors: 409 },
  { date: "2024-04-09", visitors: 59 },
  { date: "2024-04-10", visitors: 261 },
  { date: "2024-04-11", visitors: 327 },
  { date: "2024-04-12", visitors: 292 },
  { date: "2024-04-13", visitors: 342 },
  { date: "2024-04-14", visitors: 137 },
  { date: "2024-04-15", visitors: 120 },
  { date: "2024-04-16", visitors: 138 },
  { date: "2024-04-17", visitors: 446 },
  { date: "2024-04-18", visitors: 364 },
  { date: "2024-04-19", visitors: 243 },
  { date: "2024-04-20", visitors: 89 },
  { date: "2024-04-21", visitors: 137 },
  { date: "2024-04-22", visitors: 224 },
  { date: "2024-04-23", visitors: 138 },
  { date: "2024-04-24", visitors: 387 },
  { date: "2024-04-25", visitors: 215 },
  { date: "2024-04-26", visitors: 75 },
  { date: "2024-04-27", visitors: 383 },
  { date: "2024-04-28", visitors: 122 },
  { date: "2024-04-29", visitors: 315 },
  { date: "2024-04-30", visitors: 454 },
];

// Mock data for Email Marketing
const emailMarketingData = [
  { date: "2024-04-01", sent: 150, opened: 120, clicked: 45 },
  { date: "2024-04-02", sent: 180, opened: 145, clicked: 52 },
  { date: "2024-04-03", sent: 120, opened: 98, clicked: 38 },
  { date: "2024-04-04", sent: 260, opened: 210, clicked: 78 },
  { date: "2024-04-05", sent: 290, opened: 235, clicked: 89 },
  { date: "2024-04-06", sent: 340, opened: 275, clicked: 102 },
  { date: "2024-04-07", sent: 180, opened: 145, clicked: 54 },
  { date: "2024-04-08", sent: 320, opened: 258, clicked: 96 },
  { date: "2024-04-09", sent: 110, opened: 88, clicked: 33 },
  { date: "2024-04-10", sent: 190, opened: 152, clicked: 57 },
  { date: "2024-04-11", sent: 350, opened: 282, clicked: 105 },
  { date: "2024-04-12", sent: 210, opened: 168, clicked: 63 },
  { date: "2024-04-13", sent: 380, opened: 306, clicked: 114 },
  { date: "2024-04-14", sent: 220, opened: 176, clicked: 66 },
  { date: "2024-04-15", sent: 170, opened: 136, clicked: 51 },
  { date: "2024-04-16", sent: 190, opened: 152, clicked: 57 },
  { date: "2024-04-17", sent: 360, opened: 290, clicked: 108 },
  { date: "2024-04-18", sent: 410, opened: 330, clicked: 123 },
  { date: "2024-04-19", sent: 180, opened: 145, clicked: 54 },
  { date: "2024-04-20", sent: 150, opened: 120, clicked: 45 },
  { date: "2024-04-21", sent: 200, opened: 160, clicked: 60 },
  { date: "2024-04-22", sent: 170, opened: 136, clicked: 51 },
  { date: "2024-04-23", sent: 230, opened: 184, clicked: 69 },
  { date: "2024-04-24", sent: 290, opened: 233, clicked: 87 },
  { date: "2024-04-25", sent: 250, opened: 200, clicked: 75 },
  { date: "2024-04-26", sent: 130, opened: 104, clicked: 39 },
  { date: "2024-04-27", sent: 420, opened: 338, clicked: 126 },
  { date: "2024-04-28", sent: 180, opened: 145, clicked: 54 },
  { date: "2024-04-29", sent: 240, opened: 192, clicked: 72 },
  { date: "2024-04-30", sent: 380, opened: 306, clicked: 114 },
];

const visitorsChartConfig = {
  visitors: {
    label: "Visitors",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

const emailChartConfig = {
  sent: {
    label: "Sent",
    color: "var(--chart-1)",
  },
  opened: {
    label: "Opened",
    color: "var(--chart-2)",
  },
  clicked: {
    label: "Clicked",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

function VisitorsChart() {
  const isMobile = useIsMobile();
  const [timeRange, setTimeRange] = React.useState("30d");

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7d");
    }
  }, [isMobile]);

  const filteredData = React.useMemo(() => {
    return visitorsData.filter((item) => {
      const date = new Date(item.date);
      const referenceDate = new Date("2024-04-30");
      let daysToSubtract = 30;
      if (timeRange === "7d") {
        daysToSubtract = 7;
      }
      const startDate = new Date(referenceDate);
      startDate.setDate(startDate.getDate() - daysToSubtract);
      return date >= startDate;
    });
  }, [timeRange]);

  if (!filteredData) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Total Visitors</CardTitle>
        <CardDescription>www.nisccloud.com</CardDescription>
        <div className="flex items-center justify-end">
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={setTimeRange}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex"
          >
            <ToggleGroupItem value="30d">Last 30 days</ToggleGroupItem>
            <ToggleGroupItem value="7d">Last 7 days</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Select a value"
            >
              <SelectValue placeholder="Last 30 days" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="30d" className="rounded-lg">
                Last 30 days
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                Last 7 days
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer config={visitorsChartConfig} className="aspect-auto h-[250px] w-full">
          <AreaChart data={filteredData || []}>
            <defs>
              <linearGradient id="fillVisitors" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-visitors)" stopOpacity={1.0} />
                <stop offset="95%" stopColor="var(--color-visitors)" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
              }}
            />
            <ChartTooltip
              cursor={false}
              defaultIndex={isMobile ? -1 : 10}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    });
                  }}
                  indicator="dot"
                />
              }
            />
            <Area dataKey="visitors" type="natural" fill="url(#fillVisitors)" stroke="var(--color-visitors)" />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

function EmailMarketingChart() {
  const isMobile = useIsMobile();
  const [timeRange, setTimeRange] = React.useState("30d");

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7d");
    }
  }, [isMobile]);

  const filteredData = React.useMemo(() => {
    return emailMarketingData.filter((item) => {
      const date = new Date(item.date);
      const referenceDate = new Date("2024-04-30");
      let daysToSubtract = 30;
      if (timeRange === "7d") {
        daysToSubtract = 7;
      }
      const startDate = new Date(referenceDate);
      startDate.setDate(startDate.getDate() - daysToSubtract);
      return date >= startDate;
    });
  }, [timeRange]);

  if (!filteredData) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Email Marketing</CardTitle>
        <CardDescription>Email campaign performance</CardDescription>
        <div className="flex items-center justify-end">
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={setTimeRange}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex"
          >
            <ToggleGroupItem value="30d">Last 30 days</ToggleGroupItem>
            <ToggleGroupItem value="7d">Last 7 days</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Select a value"
            >
              <SelectValue placeholder="Last 30 days" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="30d" className="rounded-lg">
                Last 30 days
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                Last 7 days
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer config={emailChartConfig} className="aspect-auto h-[250px] w-full">
          <AreaChart data={filteredData || []}>
            <defs>
              <linearGradient id="fillSent" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-sent)" stopOpacity={1.0} />
                <stop offset="95%" stopColor="var(--color-sent)" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="fillOpened" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-opened)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-opened)" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="fillClicked" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-clicked)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-clicked)" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
              }}
            />
            <ChartTooltip
              cursor={false}
              defaultIndex={isMobile ? -1 : 10}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    });
                  }}
                  indicator="dot"
                />
              }
            />
            <Area dataKey="clicked" type="natural" fill="url(#fillClicked)" stroke="var(--color-clicked)" stackId="a" />
            <Area dataKey="opened" type="natural" fill="url(#fillOpened)" stroke="var(--color-opened)" stackId="a" />
            <Area dataKey="sent" type="natural" fill="url(#fillSent)" stroke="var(--color-sent)" stackId="a" />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export function DashboardCharts() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <VisitorsChart />
      <EmailMarketingChart />
    </div>
  );
}
