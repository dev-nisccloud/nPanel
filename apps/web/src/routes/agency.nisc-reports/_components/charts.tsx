"use client";

import * as React from "react";
import { BarChart3 } from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LabelList,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { fmtKes } from "./utils";
import { resolveChartColor, seriesChartColor } from "./chart-colors";
import {
  angledBottomMargin,
  categoryAxisWidth,
  CHART_CONTAINER_CLASS,
  CHART_TICK,
  formatChartCategoryLabel,
  labelsFromData,
  maxLabelLength,
} from "./chart-axis";

function buildSeriesConfig(
  keys: { key: string; label: string; colorIndex?: number }[]
): ChartConfig {
  return Object.fromEntries(
    keys.map(({ key, label, colorIndex = 0 }) => [
      key,
      { label, color: seriesChartColor(key, colorIndex) },
    ])
  ) satisfies ChartConfig;
}

function categoryXAxisProps(labelKey: string, labels: string[]) {
  const many = labels.length > 5 || maxLabelLength(labels) > 10;
  return {
    dataKey: labelKey,
    axisLine: false as const,
    tickLine: false as const,
    interval: 0 as const,
    tick: CHART_TICK,
    tickFormatter: formatChartCategoryLabel,
    tickMargin: 8,
    ...(many
      ? {
          angle: -40,
          textAnchor: "end" as const,
          height: 72,
        }
      : {
          height: 40,
        }),
  };
}

export function ChartEmptyState({ height = 250 }: { height?: number }) {
  return (
    <div
      className="flex flex-col items-center justify-center text-center border border-dashed rounded-lg bg-muted/20 w-full"
      style={{ height }}
    >
      <BarChart3 className="h-10 w-10 text-muted-foreground mb-3 opacity-20" />
      <p className="text-sm text-muted-foreground">No data for this period</p>
    </div>
  );
}

export function NiscChartCard({
  title,
  description,
  isLoading,
  height = 280,
  children,
}: {
  title: string;
  description?: string;
  isLoading?: boolean;
  height?: number;
  children: React.ReactNode;
}) {
  return (
    <Card className="border-border/50 shadow-none bg-card">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-1">
          <CardTitle className="text-base">{title}</CardTitle>
          {description && <CardDescription className="text-xs">{description}</CardDescription>}
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        {isLoading ? (
          <Skeleton className="w-full" style={{ height }} />
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}

const revenueTrendConfig = buildSeriesConfig([
  { key: "invoiced", label: "Invoiced" },
  { key: "collected", label: "Collected" },
  { key: "overdue", label: "Overdue" },
]);

export function RevenueTrendAreaChart({
  data,
}: {
  data: { period: string; invoiced: number; collected: number; overdue: number }[];
}) {
  if (!data.length) return <ChartEmptyState height={350} />;
  const chartData = data.map((d) => ({
    period: d.period,
    invoiced: d.invoiced,
    collected: d.collected,
    overdue: d.overdue,
  }));
  const periodLabels = chartData.map((d) => d.period);
  const bottom = angledBottomMargin(periodLabels);
  const many = periodLabels.length > 5;

  return (
    <ChartContainer config={revenueTrendConfig} className={`h-[380px] ${CHART_CONTAINER_CLASS}`}>
      <AreaChart
        accessibilityLayer
        data={chartData}
        margin={{ top: 24, right: 24, left: 8, bottom }}
      >
        <defs>
          <linearGradient id="nisc-fill-invoiced" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-invoiced)" stopOpacity={0.2} />
            <stop offset="95%" stopColor="var(--color-invoiced)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="nisc-fill-collected" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-collected)" stopOpacity={0.25} />
            <stop offset="95%" stopColor="var(--color-collected)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
        <XAxis
          dataKey="period"
          axisLine={false}
          tickLine={false}
          interval={0}
          tick={CHART_TICK}
          tickMargin={8}
          height={many ? 72 : 44}
          {...(many ? { angle: -40, textAnchor: "end" as const } : {})}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={CHART_TICK}
          width={56}
          tickFormatter={(v) => `${(Number(v) / 1000).toFixed(0)}k`}
        />
        <ChartTooltip content={<ChartTooltipContent formatter={(value) => fmtKes(Number(value))} />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Area
          type="monotone"
          dataKey="invoiced"
          stroke="var(--color-invoiced)"
          fill="url(#nisc-fill-invoiced)"
          strokeWidth={2}
          name="Invoiced"
        />
        <Area
          type="monotone"
          dataKey="collected"
          stroke="var(--color-collected)"
          fill="url(#nisc-fill-collected)"
          strokeWidth={2}
          name="Collected"
        />
        <Line
          type="monotone"
          dataKey="overdue"
          stroke="var(--color-overdue)"
          strokeWidth={2}
          dot={{ r: 3 }}
          name="Overdue"
        />
      </AreaChart>
    </ChartContainer>
  );
}

export function StatusPieChart({
  data,
  nameKey = "name",
  valueKey = "value",
}: {
  data: { name: string; value: number }[];
  nameKey?: string;
  valueKey?: string;
}) {
  if (!data.length || data.every((d) => d.value === 0)) return <ChartEmptyState height={280} />;

  const chartData = data.map((d, i) => {
    const fill = resolveChartColor(d.name, i);
    return {
      ...d,
      displayName: formatChartCategoryLabel(d.name),
      fill,
    };
  });

  const config = Object.fromEntries(
    data.map((d, i) => [
      d.name,
      {
        label: formatChartCategoryLabel(d.name),
        color: resolveChartColor(d.name, i),
      },
    ])
  ) satisfies ChartConfig;

  return (
    <ChartContainer config={config} className={`h-[340px] ${CHART_CONTAINER_CLASS}`}>
      <PieChart margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value) => fmtKes(Number(value))}
            />
          }
        />
        <Pie
          data={chartData}
          dataKey={valueKey}
          nameKey={nameKey}
          cx="50%"
          cy="42%"
          innerRadius={48}
          outerRadius={72}
          paddingAngle={0}
          stroke="hsl(var(--background))"
          strokeWidth={1}
        >
          {chartData.map((entry) => (
            <Cell key={entry.name} fill={entry.fill} />
          ))}
        </Pie>
        <ChartLegend
          verticalAlign="bottom"
          layout="horizontal"
          wrapperStyle={{ width: "100%", paddingTop: 12 }}
          content={
            <ChartLegendContent
              nameKey={nameKey}
              className="flex flex-wrap justify-center gap-x-4 gap-y-2 max-w-full [&_*]:whitespace-normal [&_*]:text-center"
            />
          }
        />
      </PieChart>
    </ChartContainer>
  );
}

export function SimpleBarChart({
  data,
  dataKey,
  labelKey,
  formatValue = fmtKes,
  multicolor = true,
}: {
  data: Record<string, string | number>[];
  dataKey: string;
  labelKey: string;
  formatValue?: (n: number) => string;
  multicolor?: boolean;
}) {
  if (!data.length) return <ChartEmptyState height={280} />;

  const labels = labelsFromData(data, labelKey);
  const bottom = angledBottomMargin(labels);
  const config = buildSeriesConfig([{ key: dataKey, label: dataKey, colorIndex: 0 }]);

  return (
    <ChartContainer config={config} className={`h-[300px] ${CHART_CONTAINER_CLASS}`}>
      <BarChart
        accessibilityLayer
        data={data}
        margin={{ top: 28, right: 16, left: 8, bottom }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
        <XAxis {...categoryXAxisProps(labelKey, labels)} />
        <YAxis hide />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(label) => formatChartCategoryLabel(label)}
              formatter={(v) => formatValue(Number(v))}
            />
          }
        />
        <Bar
          dataKey={dataKey}
          radius={[4, 4, 0, 0]}
          fill={multicolor ? undefined : `var(--color-${dataKey})`}
          maxBarSize={48}
        >
          {multicolor &&
            data.map((row, i) => (
              <Cell
                key={i}
                fill={resolveChartColor(String(row[labelKey]), i)}
              />
            ))}
          <LabelList
            dataKey={dataKey}
            position="top"
            formatter={(v: number) => formatValue(Number(v))}
            className="fill-foreground"
            fontSize={10}
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}

export function MrrWaterfallChart({
  items,
}: {
  items: { label: string; value: number }[];
}) {
  if (!items.length) return <ChartEmptyState height={280} />;

  const config = buildSeriesConfig([{ key: "value", label: "MRR", colorIndex: 0 }]);
  const chartData = items.map((i) => ({ label: i.label, value: i.value }));
  const labels = chartData.map((d) => d.label);
  const bottom = angledBottomMargin(labels);

  return (
    <ChartContainer config={config} className={`h-[300px] ${CHART_CONTAINER_CLASS}`}>
      <BarChart
        accessibilityLayer
        data={chartData}
        margin={{ top: 28, right: 16, left: 8, bottom }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
        <XAxis {...categoryXAxisProps("label", labels)} />
        <YAxis hide />
        <ChartTooltip content={<ChartTooltipContent formatter={(v) => fmtKes(Number(v))} />} />
        <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={48}>
          {chartData.map((entry, i) => (
            <Cell
              key={entry.label}
              fill={
                entry.value >= 0
                  ? resolveChartColor(entry.label, i)
                  : "#ef4444"
              }
            />
          ))}
          <LabelList
            dataKey="value"
            position="top"
            formatter={(v: number) => fmtKes(Number(v))}
            className="fill-foreground"
            fontSize={10}
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}

export function FunnelBarChart({
  stages,
}: {
  stages: { stage: string; count: number; amount: number }[];
}) {
  if (!stages.length) return <ChartEmptyState height={300} />;

  const config = buildSeriesConfig([{ key: "count", label: "Quotes", colorIndex: 0 }]);
  const stageLabels = stages.map((s) => formatChartCategoryLabel(s.stage));
  const yWidth = categoryAxisWidth(stageLabels);
  const rowHeight = 36;
  const chartHeight = Math.max(280, stages.length * rowHeight + 48);

  return (
    <ChartContainer config={config} className={`${CHART_CONTAINER_CLASS}`} style={{ height: chartHeight }}>
      <BarChart
        accessibilityLayer
        data={stages}
        layout="vertical"
        margin={{ top: 12, right: 48, left: 8, bottom: 12 }}
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={false} strokeOpacity={0.1} />
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="stage"
          axisLine={false}
          tickLine={false}
          interval={0}
          width={yWidth}
          tick={CHART_TICK}
          tickFormatter={formatChartCategoryLabel}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(label) => formatChartCategoryLabel(label)}
            />
          }
        />
        <Bar dataKey="count" radius={[0, 4, 4, 0]} name="Quotes" maxBarSize={32}>
          {stages.map((stage, i) => (
            <Cell key={stage.stage} fill={resolveChartColor(stage.stage, i)} />
          ))}
          <LabelList
            dataKey="count"
            position="right"
            className="fill-foreground"
            fontSize={11}
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
