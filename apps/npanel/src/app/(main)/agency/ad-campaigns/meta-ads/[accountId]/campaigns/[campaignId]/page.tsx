"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/utils/trpc";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { AnimatePresence, motion, useMotionValueEvent, useSpring } from "framer-motion";
import { JetBrains_Mono } from "next/font/google";

const jetBrainsMono = JetBrains_Mono({
    subsets: ["latin"],
    weight: ["400", "500", "600", "700"],
});
import {
    ArrowLeft,
    Target,
    Layers,
    FileText,
    CalendarIcon,
    TrendingUp,
    MapPin,
    Users,
    Heart,
    Crosshair,
    ChevronDown,
    ChevronUp,
    BarChart3,
    PieChart as PieChartIcon,
    Activity,
    AlertCircle,
    RefreshCw,
    Clock,
    MousePointer2
} from "lucide-react";
import { cn } from "@/lib/utils";
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
    Label,
    ReferenceLine,
} from "recharts";
import { DownloadReportButton } from "../../_components/report/download-button";

// ---------------------------------------------------------------------------
// Helper Functions (from dialog)
// ---------------------------------------------------------------------------

function parseTargeting(targeting: any): {
    location: string[];
    age: { min: number | null; max: number | null };
    interests: string[];
    audience: string[];
    hasAny: boolean;
} {
    const location: string[] = [];
    const interests: string[] = [];
    const audience: string[] = [];

    if (!targeting || typeof targeting !== "object") {
        return { location: [], age: { min: null, max: null }, interests: [], audience: [], hasAny: false };
    }

    // Location: geo_locations (countries, regions, cities)
    const geo = targeting.geo_locations;
    if (geo && typeof geo === "object") {
        if (Array.isArray(geo.countries)) {
            location.push(...geo.countries);
        }
        if (Array.isArray(geo.regions)) {
            geo.regions.forEach((r: any) => {
                const name = r.name ?? r.key ?? String(r);
                if (name && !location.includes(name)) location.push(name);
            });
        }
        if (Array.isArray(geo.cities)) {
            geo.cities.forEach((c: any) => {
                const name = c.name ?? c.key ?? String(c);
                if (name && !location.includes(name)) location.push(name);
            });
        }
    }

    // Age
    const ageMin = targeting.age_min != null ? Number(targeting.age_min) : null;
    const ageMax = targeting.age_max != null ? Number(targeting.age_max) : null;
    const age = {
        min: Number.isFinite(ageMin) ? ageMin : null,
        max: Number.isFinite(ageMax) ? ageMax : null,
    };

    // Interests
    if (Array.isArray(targeting.interests)) {
        targeting.interests.forEach((i: any) => {
            const name = i?.name ?? i?.id ?? String(i);
            if (name && !interests.includes(name)) interests.push(name);
        });
    }
    const flex = targeting.flexible_spec;
    if (Array.isArray(flex)) {
        flex.forEach((group: any) => {
            if (Array.isArray(group?.interests)) {
                group.interests.forEach((i: any) => {
                    const name = i?.name ?? i?.id ?? String(i);
                    if (name && !interests.includes(name)) interests.push(name);
                });
            }
        });
    }

    // Audience
    if (Array.isArray(targeting.custom_audiences)) {
        targeting.custom_audiences.forEach((a: any) => {
            const name = a?.name ?? a?.id ?? String(a);
            if (name && !audience.includes(name)) audience.push(name);
        });
    }
    if (Array.isArray(flex)) {
        flex.forEach((group: any) => {
            if (Array.isArray(group?.custom_audiences)) {
                group.custom_audiences.forEach((a: any) => {
                    const name = a?.name ?? a?.id ?? String(a);
                    if (name && !audience.includes(name)) audience.push(name);
                });
            }
        });
    }

    const hasAny =
        location.length > 0 ||
        age.min != null ||
        age.max != null ||
        interests.length > 0 ||
        audience.length > 0;

    return { location, age, interests, audience, hasAny };
}

function formatAgeRange(age: { min: number | null; max: number | null }): string {
    if (age.min == null && age.max == null) return "";
    if (age.min != null && age.max != null) return `${age.min} – ${age.max}`;
    if (age.min != null) return `${age.min}+`;
    if (age.max != null) return `Up to ${age.max}`;
    return "";
}

function formatPlacementLabel(placement: string): string {
    const p = placement.toLowerCase();
    const parts = p.split('_');

    let platform = '';
    if (p.includes('facebook')) platform = 'FB';
    else if (p.includes('instagram')) platform = 'IG';
    else if (p.includes('messenger')) platform = 'Msg';
    else if (p.includes('audience_network')) platform = 'AN';

    let pos = placement;
    if (p.includes('feed')) pos = 'Feed';
    else if (p.includes('story')) pos = 'Stories';
    else if (p.includes('reels')) pos = 'Reels';
    else if (p.includes('search')) pos = 'Search';
    else if (p.includes('right_column')) pos = 'Right Column';
    else if (p.includes('instant_article')) pos = 'Articles';
    else if (p.includes('suggested_video')) pos = 'Video';
    else if (p.includes('marketplace')) pos = 'Marketplace';

    if (pos === placement && parts.length > 1) {
        pos = parts.slice(1).join(' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    return platform ? `${platform}: ${pos}` : pos;
}

function formatRegionLabel(region: string | null | undefined): string {
    if (!region || region.toLowerCase().includes('unknown')) return 'Other / Uncategorized';
    return region
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

function parseObjective(objective: string): string {
    if (!objective) return 'Unknown';
    return objective
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

function getStatusStyles(status: string): { variant: "default" | "secondary" | "outline" | "destructive"; className?: string } {
    const s = status?.toUpperCase();
    switch (s) {
        case 'ACTIVE':
            return {
                variant: 'outline',
                className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800 font-sans rounded-full'
            };
        case 'PAUSED':
            return {
                variant: 'secondary',
                className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800 font-sans rounded-full'
            };
        case 'ARCHIVED':
        case 'DELETED':
            return {
                variant: 'destructive',
                className: 'font-sans rounded-full'
            };
        default:
            return {
                variant: 'secondary',
                className: 'font-sans rounded-full'
            };
    }
}

// ---------------------------------------------------------------------------
// Evil Charts Specific Components & Patterns
// ---------------------------------------------------------------------------

const DottedBackgroundPattern = ({ id = "default-pattern-dots" }: { id?: string }) => {
    return (
        <pattern
            id={id}
            x="0"
            y="0"
            width="10"
            height="10"
            patternUnits="userSpaceOnUse"
        >
            <circle
                className="dark:text-muted/40 text-muted"
                cx="2"
                cy="2"
                r="1"
                fill="currentColor"
            />
        </pattern>
    );
};

const HatchedBackgroundPattern = ({ config }: { config: ChartConfig }) => {
    const items = Object.entries(config).map(([key, value]) => ({ key, color: value.color as string }));
    return (
        <>
            {items.map(({ key, color }) => (
                <pattern
                    key={key}
                    id={`hatched-background-pattern-${key}`}
                    x="0"
                    y="0"
                    width="6.81"
                    height="6.81"
                    patternUnits="userSpaceOnUse"
                    patternTransform="rotate(-45)"
                    overflow="visible"
                >
                    <g overflow="visible" className="will-change-transform">
                        <animateTransform
                            attributeName="transform"
                            type="translate"
                            from="0 0"
                            to="6 0"
                            dur="1s"
                            repeatCount="indefinite"
                        />
                        <rect width="10" height="10" opacity={0.05} fill={color} />
                        <rect width="1" height="10" fill={color} />
                    </g>
                </pattern>
            ))}
        </>
    );
};

const CustomHatchedBar = (
    props: any
) => {
    const { fill, x, y, width, height, dataKey } = props;

    return (
        <>
            <rect
                rx={4}
                x={x}
                y={y}
                width={width}
                height={height}
                stroke="none"
                fill={`url(#hatched-bar-pattern-${dataKey})`}
            />
            <defs>
                <pattern
                    key={dataKey}
                    id={`hatched-bar-pattern-${dataKey}`}
                    x="0"
                    y="0"
                    width="5"
                    height="5"
                    patternUnits="userSpaceOnUse"
                    patternTransform="rotate(-45)"
                >
                    <rect width="10" height="10" opacity={0.5} fill={fill}></rect>
                    <rect width="1" height="10" fill={fill}></rect>
                </pattern>
            </defs>
        </>
    );
};

const CustomGradientBar = (
    props: any
) => {
    const { fill, x, y, width, height, dataKey, index } = props;
    const id = `gradient-bar-pattern-${dataKey}-${index}`;

    return (
        <>
            <rect
                x={x}
                y={y}
                width={width}
                height={height}
                stroke="none"
                fill={`url(#${id})`}
            />
            <rect x={x} y={y} width={2} height={height} stroke="none" fill={fill} />
            <defs>
                <linearGradient
                    id={id}
                    x1="0"
                    y1="0"
                    x2="1"
                    y2="0"
                >
                    <stop offset="0%" stopColor={fill} stopOpacity={0.5} />
                    <stop offset="100%" stopColor={fill} stopOpacity={0} />
                </linearGradient>
            </defs>
        </>
    );
};

const CustomizedDot = (
    props: any
) => {
    const { cx, cy, stroke, value } = props;

    return (
        <g>
            <circle cx={cx} cy={cy} r={12} fill={stroke} />
            <text
                className="dark:text-black text-white"
                x={cx}
                y={cy}
                textAnchor="middle"
                dy={3}
                fontSize={9}
                fontWeight={700}
                fill="currentColor"
            >
                {Math.round(value || 0).toString()}
            </text>
        </g>
    );
};

const MonospaceCustomBar = (props: any & { setActiveIndex: (index?: number) => void; activeIndex?: number }) => {
    const { fill, x, y, width, height, index, activeIndex, value } = props;

    const xPos = Number(x || 0);
    const realWidth = Number(width || 0);
    const isActive = index === activeIndex;
    const collapsedWidth = 6;
    const barX = isActive ? xPos : xPos + (realWidth - collapsedWidth) / 2;
    const textX = xPos + realWidth / 2;

    return (
        <g onMouseEnter={() => props.setActiveIndex(index)}>
            <motion.rect
                style={{
                    willChange: "transform, width",
                }}
                y={y}
                initial={{ width: collapsedWidth, x: barX }}
                animate={{ width: isActive ? realWidth : collapsedWidth, x: barX }}
                transition={{
                    duration: activeIndex === index ? 0.5 : 1,
                    type: "spring",
                }}
                height={height}
                fill={fill}
                rx={4}
            />
            {isActive && (
                <motion.text
                    style={{
                        willChange: "transform, opacity",
                    }}
                    className={jetBrainsMono.className}
                    key={index}
                    initial={{ opacity: 0, y: -10, filter: "blur(3px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, y: -10, filter: "blur(3px)" }}
                    transition={{ duration: 0.1 }}
                    x={textX}
                    y={Number(y) - 5}
                    textAnchor="middle"
                    fill={fill}
                    fontSize={10}
                    fontWeight={700}
                >
                    {value}%
                </motion.text>
            )}
        </g>
    );
};



// ---------------------------------------------------------------------------
// Chart Components
// ---------------------------------------------------------------------------

function VideoRetentionChart({ data }: { data: any[] }) {
    const [activeIndex, setActiveIndex] = React.useState<number | undefined>(undefined);

    const aggregates = React.useMemo(() => {
        let p25 = 0, p50 = 0, p75 = 0, p100 = 0;

        data.forEach(item => {
            p25 += parseInt(item.video_p25_watched_actions?.[0]?.value || '0');
            p50 += parseInt(item.video_p50_watched_actions?.[0]?.value || '0');
            p75 += parseInt(item.video_p75_watched_actions?.[0]?.value || '0');
            p100 += parseInt(item.video_p100_watched_actions?.[0]?.value || '0');
        });

        const max = Math.max(p25, 1);
        return [
            { name: '25%', value: p25, percentage: 100, fill: "var(--chart-1)" },
            { name: '50%', value: p50, percentage: Math.round((p50 / max) * 100), fill: "var(--chart-2)" },
            { name: '75%', value: p75, percentage: Math.round((p75 / max) * 100), fill: "var(--chart-3)" },
            { name: '100%', value: p100, percentage: Math.round((p100 / max) * 100), fill: "var(--chart-4)" },
        ];
    }, [data]);

    const config = {
        percentage: { label: "Retention" },
    } satisfies ChartConfig;

    return (
        <ChartContainer config={config} className="h-[250px] w-full">
            <BarChart
                data={aggregates}
                margin={{ top: 25, right: 30, left: 0, bottom: 5 }}
                onMouseLeave={() => setActiveIndex(undefined)}
            >
                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fontWeight: 500 }}
                />
                <YAxis hide />
                <ChartTooltip
                    cursor={{ fill: 'transparent' }}
                    content={<ChartTooltipContent hideLabel />}
                />
                <Bar
                    dataKey="percentage"
                    fill="var(--chart-1)"
                    shape={
                        <MonospaceCustomBar
                            setActiveIndex={setActiveIndex}
                            activeIndex={activeIndex}
                        />
                    }
                >
                    {aggregates.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                </Bar>
            </BarChart>
        </ChartContainer>
    );
}

function TopPlacementsChart({ breakdown, config }: { breakdown: any, config: ChartConfig }) {
    const [activeIndex, setActiveIndex] = React.useState<number | null>(null);

    const chartData = React.useMemo(() => {
        if (!breakdown?.data) return [];
        return breakdown.data
            .sort((a: any, b: any) => parseInt(b.impressions || '0') - parseInt(a.impressions || '0'))
            .slice(0, 10)
            .map((item: any) => ({
                placement: formatPlacementLabel(`${item.publisher_platform || ''}_${item.platform_position || ''}`),
                value: parseInt(item.impressions || '0'),
            }));
    }, [breakdown]);

    return (
        <ChartContainer config={config} className="h-full w-full">
            <BarChart
                accessibilityLayer
                data={chartData}
                margin={{ left: 10, right: 10, top: 20, bottom: 40 }}
                onMouseLeave={() => setActiveIndex(null)}
            >
                <rect
                    x="0"
                    y="0"
                    width="100%"
                    height="100%"
                    fill="url(#placement-pattern-dots)"
                />
                <defs>
                    <DottedBackgroundPattern id="placement-pattern-dots" />
                </defs>
                <XAxis
                    dataKey="placement"
                    type="category"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 9 }}
                    angle={-45}
                    textAnchor="end"
                    interval={0}
                />
                <YAxis type="number" hide />
                <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                />
                <Bar
                    dataKey="value"
                    radius={[4, 4, 0, 0]}
                    barSize={24}
                >
                    {chartData.map((_: any, index: number) => (
                        <Cell
                            key={`cell-${index}`}
                            className="duration-200"
                            fill={`var(--chart-${(index % 5) + 1})`}
                            fillOpacity={activeIndex === null ? 1 : activeIndex === index ? 1 : 0.3}
                            onMouseEnter={() => setActiveIndex(index)}
                        />
                    ))}
                </Bar>
            </BarChart>
        </ChartContainer>
    );
}

const REGION_CHART_MARGIN = 40;

function ValueLineRegionChart({ breakdown, config }: { breakdown: any, config: ChartConfig }) {
    const [activeIndex, setActiveIndex] = React.useState<number | undefined>(undefined);

    const chartData = React.useMemo(() => {
        if (!breakdown?.data) return [];

        // Detect data types for intelligent formatting
        const firstItem = breakdown.data[0];
        const isAgeData = firstItem?.age !== undefined;
        const isRegionData = firstItem?.region !== undefined;

        return breakdown.data
            .filter((item: any) => {
                const val = parseInt(item.impressions || item.value || '0');
                return val > 0;
            })
            .sort((a: any, b: any) => {
                const valA = parseInt(a.impressions || a.value || '0');
                const valB = parseInt(b.impressions || b.value || '0');
                return valB - valA;
            })
            .slice(0, 10)
            .map((item: any) => {
                // Priority: Explicit label -> Age -> Formatted Region -> Fallback
                let label = item.label;
                if (!label) {
                    if (isAgeData) label = item.age;
                    else if (isRegionData) label = formatRegionLabel(item.region);
                    else label = "Other / Uncategorized";
                }

                return {
                    label,
                    impressions: parseInt(item.impressions || item.value || '0'),
                };
            });
    }, [breakdown]);

    const maxValueIndex = React.useMemo(() => {
        if (chartData.length === 0) return { index: 0, value: 0 };
        // if user is moving mouse over bar then set value to the bar value
        if (activeIndex !== undefined) {
            return { index: activeIndex, value: chartData[activeIndex].impressions };
        }
        // if no active index then set value to max value
        return chartData.reduce(
            (max: { index: number; value: number }, data: any, index: number) => {
                return data.impressions > max.value ? { index, value: data.impressions } : max;
            },
            { index: 0, value: 0 }
        );
    }, [activeIndex, chartData]);

    const maxValueIndexSpring = useSpring(maxValueIndex.value, {
        stiffness: 100,
        damping: 20,
    });

    const [springyValue, setSpringyValue] = React.useState(maxValueIndex.value);

    useMotionValueEvent(maxValueIndexSpring, "change", (latest: any) => {
        setSpringyValue(Math.round(Number(latest)));
    });

    React.useEffect(() => {
        maxValueIndexSpring.set(maxValueIndex.value);
    }, [maxValueIndex.value, maxValueIndexSpring]);

    if (chartData.length === 0) return null;

    return (
        <ChartContainer config={config} className="h-full w-full">
            <BarChart
                accessibilityLayer
                data={chartData}
                onMouseLeave={() => setActiveIndex(undefined)}
                margin={{ left: REGION_CHART_MARGIN, right: 10, top: 20, bottom: 60 }}
            >
                <XAxis
                    dataKey="label"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    tick={{ fontSize: 9 }}
                    angle={-45}
                    textAnchor="end"
                    interval={0}
                />
                <YAxis hide />
                <Bar dataKey="impressions" fill="var(--chart-1)" radius={[4, 4, 0, 0]}>
                    {chartData.map((_: any, index: number) => (
                        <Cell
                            className="duration-200"
                            opacity={index === maxValueIndex.index ? 1 : 0.2}
                            key={index}
                            onMouseEnter={() => setActiveIndex(index)}
                        />
                    ))}
                </Bar>
                <ReferenceLine
                    opacity={0.4}
                    y={springyValue}
                    stroke="var(--secondary-foreground)"
                    strokeWidth={1}
                    strokeDasharray="3 3"
                    label={<CustomReferenceLabel value={maxValueIndex.value} />}
                />
            </BarChart>
        </ChartContainer>
    );
}

const CustomReferenceLabel = (props: any) => {
    const { viewBox, value } = props;
    const x = viewBox?.x ?? 0;
    const y = viewBox?.y ?? 0;

    const width = React.useMemo(() => {
        const characterWidth = 8;
        const padding = 10;
        return value.toString().length * characterWidth + padding;
    }, [value]);

    return (
        <>
            <rect
                x={x - REGION_CHART_MARGIN}
                y={y - 9}
                width={width}
                height={18}
                fill="var(--secondary-foreground)"
                rx={4}
            />
            <text
                fontWeight={600}
                x={x - REGION_CHART_MARGIN + 6}
                y={y + 4}
                fill="var(--primary-foreground)"
                fontSize={10}
            >
                {value}
            </text>
        </>
    );
};


// ---------------------------------------------------------------------------
// Hourly Performance Distribution Component
// ---------------------------------------------------------------------------

function HourlyPerformanceDistribution({ data, config }: { data: any[], config: ChartConfig }) {
    const chartData = React.useMemo(() => {
        // Meta returns a 24-hour profile when aggregated by 'all_days'
        const stats = Array(24).fill(0).map((_, i) => ({
            hour: i,
            label: `${i.toString().padStart(2, '0')}:00`,
            impressions: 0
        }));

        data.forEach(item => {
            const hourField = item.hourly_stats_aggregated_by_audience_time_zone;
            if (hourField) {
                const hour = parseInt(hourField.split(':')[0]);
                if (!isNaN(hour) && hour >= 0 && hour < 24) {
                    stats[hour].impressions += parseInt(item.impressions || '0');
                }
            }
        });

        return stats;
    }, [data]);

    return (
        <div className="space-y-4">
            <ChartContainer config={config} className="h-[250px] w-full">
                <BarChart accessibilityLayer data={chartData} margin={{ top: 20, right: 10, left: 10, bottom: 20 }}>
                    <rect
                        x="0"
                        y="0"
                        width="100%"
                        height="100%"
                        fill="url(#hourly-pattern-dots)"
                    />
                    <defs>
                        <DottedBackgroundPattern id="hourly-pattern-dots" />
                    </defs>
                    <XAxis
                        dataKey="label"
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 9 }}
                        interval={2}
                    />
                    <YAxis hide />
                    <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent hideLabel />}
                    />
                    <Bar
                        dataKey="impressions"
                        fill="var(--chart-1)"
                        shape={<CustomHatchedBar />}
                        radius={4}
                    />
                </BarChart>
            </ChartContainer>
            <div className="flex justify-between text-[10px] text-muted-foreground px-2">
                <span>Morning</span>
                <span>Afternoon</span>
                <span>Evening</span>
                <span>Night</span>
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Conversion Funnel Component
// ---------------------------------------------------------------------------

function ConversionFunnel({ insights }: { insights: any }) {
    const funnelData = React.useMemo(() => {
        if (!insights) return null;

        const impressions = parseInt(insights.impressions || '0');
        const clicks = parseInt(insights.inline_link_clicks || '0') ||
            (insights.actions?.find((a: any) => a.action_type === 'link_click')?.value || 0);

        // Conversions: Priority to leads, then general actions
        const leads = parseInt(insights.actions?.find((a: any) => a.action_type === 'lead')?.value || '0');
        const purchases = parseInt(insights.actions?.find((a: any) => a.action_type === 'purchase')?.value || '0');
        const conversions = leads || purchases || 0;

        const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
        const convRate = clicks > 0 ? (conversions / clicks) * 100 : 0;

        return [
            { label: 'Impressions', value: impressions, color: 'var(--chart-2)', subtext: 'Total reach' },
            { label: 'Link Clicks', value: clicks, color: 'var(--chart-1)', subtext: `${ctr.toFixed(2)}% CTR` },
            { label: 'Conversions', value: conversions, color: 'var(--chart-5)', subtext: `${convRate.toFixed(2)}% Conv.` },
        ];
    }, [insights]);

    if (!funnelData) return null;

    const maxVal = funnelData[0].value || 1;

    return (
        <div className="space-y-6 py-4">
            {funnelData.map((step, i) => (
                <div key={step.label} className="relative">
                    <div className="flex justify-between items-end mb-1 px-1">
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{step.label}</span>
                        <span className="text-sm font-mono font-bold">{step.value.toLocaleString()}</span>
                    </div>
                    <div className="h-10 w-full bg-muted/30 rounded-md overflow-hidden relative group">
                        <div
                            className="h-full transition-all duration-500 ease-out relative"
                            style={{
                                width: `${(step.value / maxVal) * 100}%`,
                                backgroundColor: step.color,
                                opacity: 0.8
                            }}
                        >
                            <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
                        </div>
                        <div className="absolute inset-y-0 right-3 flex items-center">
                            <Badge variant="outline" className="bg-background/80 backdrop-blur-sm text-[10px] py-0 h-5 border-none shadow-sm">
                                {step.subtext}
                            </Badge>
                        </div>
                    </div>
                    {i < funnelData.length - 1 && (
                        <div className="flex justify-center -my-2 relative z-10">
                            <div className="bg-background p-1 rounded-full border shadow-sm">
                                <ChevronDown className="h-3 w-3 text-muted-foreground" />
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

// ---------------------------------------------------------------------------
// Metrics Display Component
// ---------------------------------------------------------------------------

function MetricsDisplay({
    insights,
    currency,
    budget,
    compact = false
}: {
    insights: any;
    currency: string;
    budget?: string | null;
    compact?: boolean;
}) {
    const formatCurrency = (amount: string | number | null | undefined) => {
        if (amount === null || amount === undefined || amount === '' || amount === 'null') return '—';
        const num = typeof amount === 'string' ? parseFloat(amount) : amount;
        if (isNaN(num)) return '—';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(num);
    };

    const formatNumber = (num: string | number | null | undefined) => {
        if (num === null || num === undefined || num === '' || num === 'null') return '—';
        const n = typeof num === 'string' ? parseFloat(num) : num;
        if (isNaN(n)) return '—';
        return new Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short" }).format(n);
    };

    const formatPercentage = (num: string | number | null | undefined) => {
        if (num === null || num === undefined || num === '' || num === 'null') return '—';
        const n = typeof num === 'string' ? parseFloat(num) : num;
        if (isNaN(n)) return '—';
        return n < 1 ? `${(n * 100).toFixed(2)}%` : `${n.toFixed(2)}%`;
    };

    const labelSize = compact ? 'text-[10px]' : 'text-[11px]';
    const valueSize = compact ? 'text-xs' : 'text-sm';
    const cardPadding = compact ? 'p-2' : 'p-3';

    // Calculate derived metrics
    const impressionsNum = insights?.impressions ? (typeof insights.impressions === 'string' ? parseFloat(insights.impressions) : insights.impressions) : 0;
    const clicksNum = insights?.clicks ? (typeof insights.clicks === 'string' ? parseFloat(insights.clicks) : insights.clicks) : 0;
    const spendNum = insights?.spend ? (typeof insights.spend === 'string' ? parseFloat(insights.spend) : insights.spend) : 0;

    // CTR (all) = (clicks / impressions) * 100
    const ctrAll = impressionsNum > 0 && clicksNum > 0 ? (clicksNum / impressionsNum) : null;

    // CPC (all) = spend / clicks
    const cpcAll = clicksNum > 0 && spendNum > 0 ? (spendNum / clicksNum) : null;

    // Format budget as currency if provided
    const formatBudgetDisplay = (budgetValue: string | null | undefined): string => {
        if (!budgetValue || budgetValue === '' || budgetValue === '-') return '-';
        const num = typeof budgetValue === 'string' ? parseFloat(budgetValue) : budgetValue;
        if (isNaN(num)) return '-';
        return formatCurrency(num);
    };

    const formatRanking = (ranking: string | undefined | null) => {
        if (!ranking || ranking === 'UNKNOWN') return '-';
        const label = ranking.replace(/_/g, ' ');
        const isAbove = ranking.includes('ABOVE');
        const isBelow = ranking.includes('BELOW');

        return (
            <span className={cn(
                "font-bold uppercase tracking-tighter text-[10px]",
                isAbove ? "text-emerald-600 dark:text-emerald-400" :
                    isBelow ? "text-rose-600 dark:text-rose-400" :
                        "text-amber-600 dark:text-amber-400"
            )}>
                {label}
            </span>
        );
    };

    // Note: 'clicks' in the API often refers to "All Clicks" while 'link_clicks' is specific

    // Extract lead count from actions array or use API provided value
    // Lead action types: 'lead', 'onsite_conversion.lead_grouped', 'offsite_conversion.fb_pixel_lead'
    const leadCount = (() => {
        if (insights.leads) {
            const val = parseFloat(insights.leads);
            return isNaN(val) ? null : val;
        }

        if (!insights.actions || !Array.isArray(insights.actions)) return null;

        const leadActions = insights.actions.filter((action: any) =>
            action.action_type === 'lead' ||
            action.action_type === 'onsite_conversion.lead_grouped' ||
            action.action_type === 'offsite_conversion.fb_pixel_lead'
        );

        if (leadActions.length === 0) return null;

        // Sum all lead actions
        const total = leadActions.reduce((sum: number, action: any) =>
            sum + parseInt(action.value || '0'), 0
        );

        return total > 0 ? total : null;
    })();

    // Calculate Cost per Lead if we have leads, or use API provided value
    const costPerLead = (() => {
        if (insights.cost_per_lead) {
            const val = parseFloat(insights.cost_per_lead);
            return isNaN(val) ? null : val;
        }

        return leadCount && leadCount > 0 && spendNum > 0
            ? spendNum / leadCount
            : null;
    })();

    // We try to use the order from the dialog:
    // Reach, Frequency, Cost per Result, Budget, Amount Spent, Impressions, CPM, Link Clicks, CPC, CTR, Unique Clicks, Unique CTR, ROAS, Rankings..., All Clicks, All CTR, All CPC
    // For lead campaigns, add Leads and Cost per Lead after Cost per Result

    const metrics = [
        { label: 'Reach', value: formatNumber(insights.reach), color: 'blue' },
        { label: 'Frequency', value: formatNumber(insights.frequency), color: 'blue' },
        { label: 'Cost per Result', value: formatCurrency(insights.cost_per_result), color: 'orange' },
        // Add lead metrics for lead generation campaigns
        ...(leadCount !== null ? [
            { label: 'Leads', value: formatNumber(leadCount), color: 'emerald' },
            { label: 'Cost per Lead', value: costPerLead !== null ? formatCurrency(costPerLead) : '—', color: 'orange' },
        ] : []),
        { label: 'Budget', value: formatBudgetDisplay(budget), color: 'purple' },
        { label: 'Amount Spent', value: formatCurrency(insights.spend), color: 'emerald' },
        { label: 'Impressions', value: formatNumber(insights.impressions), color: 'purple' },
        { label: 'CPM', value: formatCurrency(insights.cpm), color: 'indigo' },
        { label: 'Link Clicks', value: formatNumber(insights.link_clicks || insights.inline_link_clicks), color: 'green' },
        { label: 'CPC', value: formatCurrency(insights.cpc), color: 'orange' },
        { label: 'CTR', value: formatPercentage(insights.ctr), color: 'indigo' },
        { label: 'Unique Clicks', value: formatNumber(insights.unique_clicks), color: 'green' },
        { label: 'Unique CTR', value: formatPercentage(insights.unique_ctr), color: 'indigo' },
        { label: 'Purchase ROAS', value: formatNumber(insights.purchase_roas), color: 'emerald' },
        { label: 'Quality Ranking', value: formatRanking(insights.quality_ranking), color: 'orange' },
        { label: 'Engagement Ranking', value: formatRanking(insights.engagement_rate_ranking), color: 'orange' },
        { label: 'Conversion Ranking', value: formatRanking(insights.conversion_rate_ranking), color: 'orange' },
        { label: 'Clicks (all)', value: formatNumber(insights.clicks), color: 'green' },
        { label: 'CTR (all)', value: formatPercentage(ctrAll !== null ? ctrAll : insights.ctr), color: 'indigo' }, // Fallback to ctr if calculation fails? actually dialog calc used ctrAll
        { label: 'CPC (all)', value: cpcAll !== null ? formatCurrency(cpcAll) : '—', color: 'orange' },
    ];

    const colorClasses: Record<string, { bg: string; border: string; label: string; value: string }> = {
        blue: {
            bg: 'bg-blue-50 dark:bg-blue-950/30',
            border: 'border-blue-200 dark:border-blue-900',
            label: 'text-blue-700 dark:text-blue-300',
            value: 'text-blue-900 dark:text-blue-100',
        },
        orange: {
            bg: 'bg-orange-50 dark:bg-orange-950/30',
            border: 'border-orange-200 dark:border-orange-900',
            label: 'text-orange-700 dark:text-orange-300',
            value: 'text-orange-900 dark:text-orange-100',
        },
        purple: {
            bg: 'bg-purple-50 dark:bg-purple-950/30',
            border: 'border-purple-200 dark:border-purple-900',
            label: 'text-purple-700 dark:text-purple-300',
            value: 'text-purple-900 dark:text-purple-100',
        },
        emerald: {
            bg: 'bg-emerald-50 dark:bg-emerald-950/30',
            border: 'border-emerald-200 dark:border-emerald-900',
            label: 'text-emerald-700 dark:text-emerald-300',
            value: 'text-emerald-900 dark:text-emerald-100',
        },
        green: {
            bg: 'bg-green-50 dark:bg-green-950/30',
            border: 'border-green-200 dark:border-green-900',
            label: 'text-green-700 dark:text-green-300',
            value: 'text-green-900 dark:text-green-100',
        },
        indigo: {
            bg: 'bg-indigo-50 dark:bg-indigo-950/30',
            border: 'border-indigo-200 dark:border-indigo-900',
            label: 'text-indigo-700 dark:text-indigo-300',
            value: 'text-indigo-900 dark:text-indigo-100',
        },
    };

    return (
        <div className="flex flex-wrap gap-3">
            {metrics.map((metric, index) => {
                const colors = colorClasses[metric.color] || colorClasses.blue;
                return (
                    <div
                        key={index}
                        className={`flex-1 min-w-[140px] max-w-[200px] ${cardPadding} rounded-md ${colors.bg} border ${colors.border}`}
                    >
                        <div className={`${labelSize} ${colors.label} font-medium mb-1`}>
                            {metric.label}
                        </div>
                        <div className={`${valueSize} font-semibold ${colors.value} break-words`}>
                            {metric.value}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ---------------------------------------------------------------------------
// Targeting Field Component
// ---------------------------------------------------------------------------

function TargetingField({
    label,
    content,
    icon: Icon,
    emptyMessage,
}: {
    label: string;
    content: string;
    icon?: React.ComponentType<{ className?: string }>;
    emptyMessage: string;
}) {
    const [expanded, setExpanded] = React.useState(false);
    const ref = React.useRef<HTMLParagraphElement>(null);
    const [showToggle, setShowToggle] = React.useState(false);

    React.useEffect(() => {
        const el = ref.current;
        if (!el || !content) return;
        if (!expanded && el.scrollHeight > el.clientHeight) {
            setShowToggle(true);
        }
    }, [content, expanded]);

    const hasContent = content.trim().length > 0;
    const displayContent = hasContent ? content : emptyMessage;
    const isPlaceholder = !hasContent;

    return (
        <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-[13px] font-semibold text-primary">
                {Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
                {label}
            </div>
            <p
                ref={ref}
                className={`text-sm tracking-wide ${!expanded ? "line-clamp-3" : ""} ${isPlaceholder ? "text-muted-foreground italic" : ""}`}
            >
                {displayContent}
            </p>
            {showToggle && hasContent && (
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 text-primary hover:bg-primary/10 text-xs font-medium"
                    onClick={() => setExpanded((e) => !e)}
                >
                    {expanded ? (
                        <>
                            <ChevronUp className="h-3.5 w-3.5 mr-0.5" />
                            Show less
                        </>
                    ) : (
                        <>
                            <ChevronDown className="h-3.5 w-3.5 mr-0.5" />
                            Show more
                        </>
                    )}
                </Button>
            )}
        </div>
    );
}

// ---------------------------------------------------------------------------
// Ad Set Item Component
// ---------------------------------------------------------------------------

function AdSetSkeleton() {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-48 mb-2" />
                <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-4 border-b">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="space-y-1">
                            <Skeleton className="h-3 w-20" />
                            <Skeleton className="h-4 w-24" />
                        </div>
                    ))}
                </div>
                <div>
                    <Skeleton className="h-4 w-40 mb-3" />
                    <div className="flex flex-wrap gap-3">
                        {[...Array(13)].map((_, i) => (
                            <Skeleton key={i} className="h-16 flex-1 min-w-[140px] max-w-[200px] rounded-md" />
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function AdSkeleton() {
    return (
        <Card className="bg-muted/50">
            <CardContent className="p-4">
                <Skeleton className="h-4 w-32 mb-3" />
                <div className="flex flex-wrap gap-2">
                    {[...Array(13)].map((_, i) => (
                        <Skeleton key={i} className="h-12 flex-1 min-w-[100px] rounded" />
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

// ---------------------------------------------------------------------------
// Ad Set Item Component
// ---------------------------------------------------------------------------

interface AdSetItemProps {
    adSet: any;
    getStatusStyles: (status: string) => { variant: "default" | "secondary" | "outline" | "destructive"; className?: string; bg?: string; text?: string; border?: string };
    timeRange?: {
        since: string;
        until: string;
    };
    currency?: string;
    ads?: any[];
    targetingSentenceLines?: any[];
    isLoadingAds?: boolean;
    adsError?: any;
}

function AdSetItem({
    adSet,
    getStatusStyles,
    timeRange,
    currency = 'USD',
    ads = [],
    targetingSentenceLines = [],
    isLoadingAds = false,
    adsError = null
}: AdSetItemProps) {
    const [isExpanded, setIsExpanded] = React.useState(false);

    const targetingInfo = parseTargeting(adSet.targeting);
    const hasTargeting = targetingInfo.hasAny || targetingSentenceLines.length > 0;

    const statusStyles = getStatusStyles(adSet.status);

    return (
        <Card className="overflow-hidden bg-card">
            <CardHeader className="pb-3 border-b bg-muted/10">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                            <Layers className="h-4 w-4 text-muted-foreground shrink-0" />
                            <CardTitle className="text-base truncate">{adSet.name}</CardTitle>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            {adSet.status && (
                                <Badge variant={statusStyles.variant} className={statusStyles.className}>
                                    {adSet.status}
                                </Badge>
                            )}
                            <span className="text-muted-foreground/60">|</span>
                            <span>ID: {adSet.id}</span>
                            {(adSet.daily_budget || adSet.lifetime_budget) && (
                                <>
                                    <span className="text-muted-foreground/60">|</span>
                                    {adSet.daily_budget && (
                                        <span className="flex items-center gap-1">
                                            <Target className="h-3 w-3" />
                                            Daily: {adSet.daily_budget}
                                        </span>
                                    )}
                                    {adSet.lifetime_budget && (
                                        <span className="flex items-center gap-1">
                                            <Target className="h-3 w-3" />
                                            Lifetime: {adSet.lifetime_budget}
                                        </span>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="shrink-0 h-8 w-8 p-0"
                    >
                        {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                        ) : (
                            <ChevronDown className="h-4 w-4" />
                        )}
                        <span className="sr-only">Toggle details</span>
                    </Button>
                </div>
            </CardHeader>

            <div className={cn("grid transition-all", isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
                <div className="overflow-hidden">
                    <CardContent className="space-y-8 pt-6">
                        {/* Ad Set Info Grid */}
                        {(adSet.daily_budget || adSet.lifetime_budget || adSet.bid_amount || adSet.start_time) && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-6 border-b">
                                {adSet.daily_budget && (
                                    <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground">Daily Budget</p>
                                        <p className="text-sm font-medium">{adSet.daily_budget}</p>
                                    </div>
                                )}
                                {adSet.lifetime_budget && (
                                    <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground">Lifetime Budget</p>
                                        <p className="text-sm font-medium">{adSet.lifetime_budget}</p>
                                    </div>
                                )}
                                {adSet.bid_amount && (
                                    <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground">Bid Amount</p>
                                        <p className="text-sm font-medium">{adSet.bid_amount}</p>
                                    </div>
                                )}
                                {adSet.start_time && (
                                    <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground">Start Date</p>
                                        <p className="text-sm font-medium">
                                            {new Date(adSet.start_time).toLocaleDateString()}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Ad Set Metrics */}
                        {adSet.insights && (
                            <div className="space-y-3">
                                <h4 className="text-sm font-medium text-muted-foreground">Ad Set Performance</h4>
                                <MetricsDisplay insights={adSet.insights} currency={currency} budget={adSet.daily_budget || adSet.lifetime_budget} />
                            </div>
                        )}

                        <Separator />

                        {/* Targeting Information */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                                <Crosshair className="h-4 w-4" />
                                <h3>Targeting</h3>
                            </div>

                            {!adSet.targeting && targetingSentenceLines.length === 0 ? (
                                <div className="rounded-lg border border-dashed bg-muted/30 px-4 py-3 text-center">
                                    <p className="text-xs text-muted-foreground tracking-wide">
                                        Targeting data unavailable for this ad set.
                                    </p>
                                </div>
                            ) : targetingSentenceLines.length > 0 ? (
                                <div className="rounded-lg border bg-muted/20 px-4 py-3 space-y-4">
                                    {targetingSentenceLines.map((line: any, idx: number) => (
                                        <TargetingField
                                            key={idx}
                                            label={line.content ?? ""}
                                            content={Array.isArray(line.children) ? line.children.join(", ") : ""}
                                            emptyMessage="—"
                                        />
                                    ))}
                                </div>
                            ) : hasTargeting ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <TargetingField
                                        label="Location"
                                        content={targetingInfo.location.join(", ")}
                                        icon={MapPin}
                                        emptyMessage="No location set"
                                    />
                                    <TargetingField
                                        label="Age range"
                                        content={formatAgeRange(targetingInfo.age)}
                                        icon={Users}
                                        emptyMessage="No age restriction"
                                    />
                                    <div className="sm:col-span-2">
                                        <TargetingField
                                            label="Interests"
                                            content={targetingInfo.interests.join(", ")}
                                            icon={Heart}
                                            emptyMessage="No interests specified"
                                        />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <TargetingField
                                            label="Audience (custom / lookalike)"
                                            content={targetingInfo.audience.join(", ")}
                                            icon={Target}
                                            emptyMessage="No custom audience"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="rounded-lg border border-dashed bg-muted/30 px-4 py-3 text-center">
                                    <p className="text-xs text-muted-foreground tracking-wide">
                                        No targeting criteria for this ad set.
                                    </p>
                                </div>
                            )}
                        </div>

                        <Separator />

                        {/* Ads */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-medium text-muted-foreground">Ads {ads.length > 0 && `(${ads.length})`}</h4>
                            </div>

                            {isLoadingAds ? (
                                <div className="space-y-3">
                                    <AdSkeleton />
                                    <AdSkeleton />
                                </div>
                            ) : adsError ? (
                                <div className="flex flex-col items-center justify-center py-6 text-center border rounded-lg border-destructive/20 bg-destructive/5">
                                    <p className="text-xs text-destructive mb-1">
                                        {adsError.message || "Failed to load ads"}
                                    </p>
                                    <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => { }}>Retry</Button>
                                </div>
                            ) : ads.length > 0 ? (
                                <div className="space-y-3">
                                    {ads.map((ad: any) => {
                                        const adStatusStyles = getStatusStyles(ad.status);
                                        return (
                                            <Card key={ad.id} className="overflow-hidden bg-muted/30 border-muted">
                                                <CardContent className="p-4">
                                                    <div className="flex items-start gap-4 mb-4">
                                                        {ad.creative?.thumbnail_url ? (
                                                            <div className="h-16 w-16 rounded-md overflow-hidden border bg-background shrink-0 shadow-sm relative group">
                                                                <img
                                                                    src={ad.creative.thumbnail_url}
                                                                    alt={ad.name}
                                                                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div className="h-16 w-16 rounded-md border bg-muted flex items-center justify-center shrink-0">
                                                                <FileText className="h-6 w-6 text-muted-foreground/40" />
                                                            </div>
                                                        )}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-1.5">
                                                                <p className="font-semibold text-sm truncate leading-tight">{ad.name}</p>
                                                                {ad.status && (
                                                                    <Badge variant="outline" className={cn("text-[10px] uppercase font-bold tracking-wider py-0 h-5", adStatusStyles.bg, adStatusStyles.text, adStatusStyles.border)}>
                                                                        {ad.status}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            {ad.creative?.title && (
                                                                <p className="text-xs font-medium text-foreground mb-0.5 line-clamp-1">
                                                                    "{ad.creative.title}"
                                                                </p>
                                                            )}
                                                            {ad.creative?.body && (
                                                                <p className="text-xs text-muted-foreground line-clamp-1 leading-relaxed">
                                                                    {ad.creative.body}
                                                                </p>
                                                            )}
                                                            <div className="mt-2 flex items-center gap-3">
                                                                <p className="text-[10px] font-mono text-muted-foreground/60">ID: {ad.id}</p>
                                                                {ad.creative?.image_url && (
                                                                    <a
                                                                        href={ad.creative.image_url}
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                        className="text-[10px] text-primary hover:underline font-medium inline-flex items-center gap-0.5"
                                                                    >
                                                                        View Creative <ArrowLeft className="h-2 w-2 rotate-135" />
                                                                    </a>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Ad Metrics */}
                                                    {ad.insights ? (
                                                        <div className="bg-background/50 rounded-md p-2">
                                                            <MetricsDisplay insights={ad.insights} currency={currency} compact />
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-wrap gap-2">
                                                            {[...Array(6)].map((_, i) => (
                                                                <Skeleton key={i} className="h-10 flex-1 min-w-[80px] rounded" />
                                                            ))}
                                                        </div>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-8 text-center border border-dashed rounded-lg">
                                    <FileText className="h-8 w-8 text-muted-foreground/30 mb-2" />
                                    <p className="text-sm text-muted-foreground">
                                        No ads found for this ad set
                                    </p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </div>
            </div>
        </Card>
    );
}

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------

export default function CampaignDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const utils = trpc.useUtils();
    const accountId = params?.accountId as string;
    const campaignId = params?.campaignId as string;

    // Fetch campaign details
    const {
        data: campaignData,
        isLoading: isLoadingCampaign,
        isFetching: isFetchingCampaign,
        error: campaignError,
        refetch: refetchCampaign,
    } = trpc.metaAds.campaigns.getCampaignDetails.useQuery(
        { accountId, campaignId },
        {
            enabled: !!accountId && !!campaignId,
            refetchOnWindowFocus: false,
            retry: 1,
            staleTime: 0,
            refetchOnMount: 'always'
        }
    );

    // Fetch account details for currency
    const {
        data: accountData,
        isLoading: isLoadingAccount,
        isFetching: isFetchingAccount,
        refetch: refetchAccount,
    } = trpc.metaAds.accounts.getAccountDetails.useQuery(
        { accountId },
        {
            enabled: !!accountId,
            refetchOnWindowFocus: false,
            retry: 1,
            staleTime: 0,
            refetchOnMount: 'always'
        }
    );

    const campaign = campaignData?.data;
    const account = accountData?.data;
    const currency = account?.currency || campaign?.currency || 'USD';

    // Default time range (lifespan or last 30 days)
    const timeRange = React.useMemo(() => {
        if (campaign?.start_time) {
            return {
                since: campaign.start_time.split('T')[0],
                until: format(new Date(), 'yyyy-MM-dd'),
            };
        }
        return {
            since: format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
            until: format(new Date(), 'yyyy-MM-dd'),
        };
    }, [campaign?.start_time]);

    // Fetch ad sets
    const {
        data: adSetsData,
        isLoading: isLoadingAdSets,
        isFetching: isFetchingAdSets,
        refetch: refetchAdSets,
    } = trpc.metaAds.adSets.listAdSets.useQuery(
        { campaignId, timeRange },
        {
            enabled: !!campaignId && !!campaign,
            refetchOnWindowFocus: false,
            staleTime: 0,
            refetchOnMount: 'always'
        }
    );

    // Fetch insights
    const { data: dailyPerformance, isLoading: isLoadingDaily, isFetching: isFetchingDaily, refetch: refetchDaily } = trpc.metaAds.insights.getDailyPerformance.useQuery(
        { entityId: campaignId, level: 'campaign', timeRange },
        { enabled: !!campaignId && !!campaign, refetchOnWindowFocus: false, staleTime: 0, refetchOnMount: 'always' }
    );

    const { data: genderBreakdown, isLoading: isLoadingGender, isFetching: isFetchingGender, refetch: refetchGender } = trpc.metaAds.insights.getBreakdowns.useQuery(
        { entityId: campaignId, level: 'campaign', timeRange, breakdown: 'gender' },
        { enabled: !!campaignId && !!campaign, refetchOnWindowFocus: false, staleTime: 0, refetchOnMount: 'always' }
    );

    const { data: platformBreakdown, isLoading: isLoadingPlatform, isFetching: isFetchingPlatform, refetch: refetchPlatform } = trpc.metaAds.insights.getBreakdowns.useQuery(
        { entityId: campaignId, level: 'campaign', timeRange, breakdown: 'publisher_platform' },
        { enabled: !!campaignId && !!campaign, refetchOnWindowFocus: false, staleTime: 0, refetchOnMount: 'always' }
    );

    const { data: deviceBreakdown, isLoading: isLoadingDevice, isFetching: isFetchingDevice, refetch: refetchDevice } = trpc.metaAds.insights.getBreakdowns.useQuery(
        { entityId: campaignId, level: 'campaign', timeRange, breakdown: 'device_platform' },
        { enabled: !!campaignId && !!campaign, refetchOnWindowFocus: false, staleTime: 0, refetchOnMount: 'always' }
    );

    const { data: regionBreakdown, isLoading: isLoadingRegion, isFetching: isFetchingRegion, refetch: refetchRegion } = trpc.metaAds.insights.getBreakdowns.useQuery(
        { entityId: campaignId, level: 'campaign', timeRange, breakdown: 'region' },
        { enabled: !!campaignId && !!campaign, refetchOnWindowFocus: false, staleTime: 0, refetchOnMount: 'always' }
    );

    const { data: placementBreakdown, isLoading: isLoadingPlacement, isFetching: isFetchingPlacement, refetch: refetchPlacement } = trpc.metaAds.insights.getBreakdowns.useQuery(
        { entityId: campaignId, level: 'campaign', timeRange, breakdown: 'platform_position' },
        { enabled: !!campaignId && !!campaign, refetchOnWindowFocus: false, staleTime: 0, refetchOnMount: 'always' }
    );

    const { data: ageBreakdown, isLoading: isLoadingAge, isFetching: isFetchingAge, refetch: refetchAge } = trpc.metaAds.insights.getBreakdowns.useQuery(
        { entityId: campaignId, level: 'campaign', timeRange, breakdown: 'age' },
        { enabled: !!campaignId && !!campaign, refetchOnWindowFocus: false, staleTime: 0, refetchOnMount: 'always' }
    );

    const { data: hourlyPerformance, isLoading: isLoadingHourly, isFetching: isFetchingHourly, refetch: refetchHourly } = trpc.metaAds.insights.getBreakdowns.useQuery(
        { entityId: campaignId, level: 'campaign', timeRange, breakdown: 'hourly_stats_aggregated_by_audience_time_zone' },
        { enabled: !!campaignId && !!campaign, refetchOnWindowFocus: false, staleTime: 0, refetchOnMount: 'always' }
    );

    const isRefreshing = isFetchingCampaign || isFetchingAccount || isFetchingAdSets || isFetchingDaily || isFetchingGender || isFetchingPlatform || isFetchingDevice || isFetchingRegion || isFetchingPlacement || isFetchingAge || isFetchingHourly;

    const handleRefresh = async () => {
        await utils.metaAds.invalidate();
        toast.success("Campaign data refreshed");
    };

    const adSets = adSetsData?.data || [];

    // Fetch ads in bulk for the campaign
    const {
        data: adsData,
        isLoading: isLoadingAds,
        isFetching: isFetchingAds,
    } = trpc.metaAds.ads.listCampaignAds.useQuery(
        { accountId, campaignId, timeRange },
        {
            enabled: !!campaignId && !!campaign,
            refetchOnWindowFocus: false,
            staleTime: 0,
            refetchOnMount: 'always'
        }
    );

    const allAds = adsData?.data || [];

    // Group ads by ad set ID
    const adsByAdSet = React.useMemo(() => {
        const map: Record<string, any[]> = {};
        allAds.forEach(ad => {
            const adsetId = ad.adset_id ? String(ad.adset_id) : null;
            if (adsetId) {
                if (!map[adsetId]) map[adsetId] = [];
                map[adsetId].push(ad);
            }
        });
        return map;
    }, [allAds]);

    // Fetch targeting sentence lines in bulk
    const adSetIds = React.useMemo(() => adSets.map((a: any) => a.id), [adSets]);
    const {
        data: bulkTargetingData,
        isLoading: isLoadingTargeting
    } = trpc.metaAds.adSets.getBulkTargetingSentenceLines.useQuery(
        { adSetIds },
        { enabled: adSetIds.length > 0, refetchOnWindowFocus: false }
    );

    const targetingByAdSet = bulkTargetingData?.data || {};

    // Process Engagement Actions for the bar chart
    const engagementActionsData = React.useMemo(() => {
        if (!campaign?.insights?.actions) return null;

        const actionLabels: Record<string, string> = {
            'post_reaction': 'Reactions',
            'comment': 'Comments',
            'post': 'Shares',
            'link_click': 'Clicks',
            'video_view': 'Video Views',
            'onsite_conversion.post_save': 'Saves',
            'landing_page_view': 'Page Views'
        };

        const processed = (campaign.insights.actions as any[])
            .filter((a: any) => actionLabels[a.action_type])
            .map((a: any) => ({
                label: actionLabels[a.action_type],
                impressions: parseInt(a.value || '0')
            }))
            .sort((a, b) => b.impressions - a.impressions);

        return processed.length > 0 ? { data: processed } : null;
    }, [campaign]);

    // Chart configs
    const performanceChartConfig = {
        spend: { label: "Spend", color: "var(--chart-3)" },
        impressions: { label: "Impressions", color: "var(--chart-2)" },
        link_clicks: { label: "Link Clicks", color: "var(--chart-1)" },
    } satisfies ChartConfig;

    const breakdownChartConfig = {
        value: { label: "Impressions" },
        male: { label: "Male", color: "var(--chart-1)" },
        female: { label: "Female", color: "var(--chart-2)" },
        unknown: { label: "Unknown", color: "var(--chart-3)" },
        facebook: { label: "Facebook", color: "var(--chart-1)" },
        instagram: { label: "Instagram", color: "var(--chart-2)" },
        messenger: { label: "Messenger", color: "var(--chart-3)" },
        audience_network: { label: "Audience Network", color: "var(--chart-4)" },
        feed: { label: "Feed", color: "var(--chart-1)" },
        stories: { label: "Stories", color: "var(--chart-2)" },
        reels: { label: "Reels", color: "var(--chart-3)" },
        other: { label: "Other", color: "var(--chart-4)" },
    } satisfies ChartConfig;

    // Prepare PDF data
    const pdfData = React.useMemo(() => {
        const processedAdSets = adSets.map((adSet: any) => ({
            ...adSet,
            targetingInfo: parseTargeting(adSet.targeting),
            targetingSentenceLines: targetingByAdSet[adSet.id] || [],
            ads: adsByAdSet[adSet.id] || [],
        }));

        const capitalize = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s;

        const processedBreakdowns = {
            gender: genderBreakdown ? {
                ...genderBreakdown,
                data: genderBreakdown.data.map((item: any) => ({ ...item, gender: capitalize(item.gender) }))
            } : undefined,
            platform: platformBreakdown ? {
                ...platformBreakdown,
                data: platformBreakdown.data.map((item: any) => ({ ...item, publisher_platform: capitalize(item.publisher_platform) }))
            } : undefined,
            device: deviceBreakdown ? {
                ...deviceBreakdown,
                data: deviceBreakdown.data.map((item: any) => ({ ...item, device_platform: capitalize(item.device_platform) }))
            } : undefined,
            region: regionBreakdown ? {
                ...regionBreakdown,
                data: regionBreakdown.data.map((item: any) => ({
                    ...item,
                    region: formatRegionLabel(item.region),
                })),
            } : undefined,
            placement: placementBreakdown ? {
                ...placementBreakdown,
                data: placementBreakdown.data.map((item: any) => ({
                    ...item,
                    platform_position: formatPlacementLabel(item.platform_position),
                })),
            } : undefined,
        };

        return {
            adSets: processedAdSets,
            breakdowns: processedBreakdowns,
            dailyPerformance: dailyPerformance?.data || [],
            hourlyPerformance: hourlyPerformance?.data || [],
            engagementActions: engagementActionsData?.data || [],
        };
    }, [adSets, genderBreakdown, platformBreakdown, deviceBreakdown, regionBreakdown, placementBreakdown, dailyPerformance, hourlyPerformance, engagementActionsData, adsByAdSet, targetingByAdSet]);

    // Loading state
    if (isLoadingCampaign || isLoadingAccount) {
        return (
            <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
                <div className="w-full max-w-7xl mx-auto space-y-6">
                    <Skeleton className="h-10 w-48" />
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-64 w-full" />
                    <Skeleton className="h-96 w-full" />
                </div>
            </div>
        );
    }

    // Error state
    if (campaignError || !campaign) {
        return (
            <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
                <div className="w-full max-w-7xl mx-auto">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.back()}
                        className="mb-4"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>
                    <Card className="border-destructive">
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
                            <h3 className="text-lg font-semibold mb-2">Failed to Load Campaign</h3>
                            <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
                                {campaignError?.message || "Campaign not found or you don't have access to it."}
                            </p>
                            <div className="flex gap-2">
                                <Button onClick={() => refetchCampaign()} variant="outline">
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Retry
                                </Button>
                                <Button onClick={() => router.back()}>
                                    Go Back
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    const statusStyles = getStatusStyles(campaign.status);

    return (
        <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
            <div className="w-full max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.back()}
                            className="shrink-0"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back
                        </Button>
                        <div className="min-w-0 flex-1">
                            <h1 className="text-xl font-bold truncate">{campaign.name}</h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                            className="rounded-full h-8 gap-2"
                        >
                            <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                            Refresh
                        </Button>
                        {campaign.insights && (
                            <DownloadReportButton
                                campaign={campaign}
                                insights={campaign.insights}
                                dailyPerformance={pdfData.dailyPerformance}
                                hourlyPerformance={pdfData.hourlyPerformance}
                                engagementActions={pdfData.engagementActions}
                                adSets={pdfData.adSets}
                                breakdowns={pdfData.breakdowns}
                                timeRange={timeRange}
                                currency={currency}
                                accountName={account?.name}
                            />
                        )}
                    </div>
                </div>

                {/* SECTION 1: OVERVIEW (Info, Metrics, Ad Sets) */}
                <div className="space-y-6">
                    <div className="flex items-center gap-2 pb-2 border-b">
                        <h2 className="text-lg font-semibold">Overview</h2>
                    </div>

                    {/* Campaign Info */}
                    <Card className="bg-card shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-base">Campaign Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground">Status</p>
                                    {campaign?.status && (
                                        <Badge
                                            variant={getStatusStyles(campaign.status).variant}
                                            className={getStatusStyles(campaign.status).className}
                                        >
                                            {campaign.status}
                                        </Badge>
                                    )}
                                </div>
                                {campaign.objective && (
                                    <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground">Objective</p>
                                        <p className="text-sm font-medium">{parseObjective(campaign.objective)}</p>
                                    </div>
                                )}
                                {campaign.start_time && (
                                    <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground">Start Date</p>
                                        <p className="text-sm font-medium">
                                            {new Date(campaign.start_time).toLocaleDateString()}
                                        </p>
                                    </div>
                                )}
                                {campaign.stop_time && (
                                    <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground">End Date</p>
                                        <p className="text-sm font-medium">
                                            {new Date(campaign.stop_time).toLocaleDateString()}
                                        </p>
                                    </div>
                                )}
                            </div>
                            {(campaign.daily_budget || campaign.lifetime_budget || (campaign as any).budget_remaining) && (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t">
                                    {campaign.daily_budget && (
                                        <div className="space-y-1">
                                            <p className="text-xs text-muted-foreground">Daily Budget</p>
                                            <p className="text-sm font-medium">{campaign.daily_budget}</p>
                                        </div>
                                    )}
                                    {campaign.lifetime_budget && (
                                        <div className="space-y-1">
                                            <p className="text-xs text-muted-foreground">Lifetime Budget</p>
                                            <p className="text-sm font-medium">{campaign.lifetime_budget}</p>
                                        </div>
                                    )}
                                    {(campaign as any).budget_remaining && (
                                        <div className="space-y-1">
                                            <p className="text-xs text-muted-foreground">Budget Remaining</p>
                                            <p className="text-sm font-medium">{(campaign as any).budget_remaining}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Campaign Metrics */}
                    {campaign.insights && (
                        <Card className="bg-card shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-base">Performance Metrics</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <MetricsDisplay
                                    insights={campaign.insights}
                                    currency={currency}
                                    budget={campaign.daily_budget || campaign.lifetime_budget || null}
                                />
                            </CardContent>
                        </Card>
                    )}

                    {/* Ad Sets */}
                    <div className="space-y-4">
                        <h3 className="text-base font-semibold">Ad Sets</h3>
                        {isLoadingAdSets ? (
                            <div className="space-y-3">
                                <Skeleton className="h-24 w-full" />
                                <Skeleton className="h-24 w-full" />
                            </div>
                        ) : adSets.length === 0 ? (
                            <Card className="bg-card shadow-sm">
                                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                                    <Layers className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                                    <p className="text-sm text-muted-foreground">
                                        No ad sets found for this campaign.
                                    </p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-4">
                                {adSets.map((adSet: any) => (
                                    <AdSetItem
                                        key={adSet.id}
                                        adSet={adSet}
                                        timeRange={timeRange}
                                        currency={currency}
                                        getStatusStyles={getStatusStyles}
                                        targetingSentenceLines={targetingByAdSet[String(adSet.id)]}
                                        isLoadingAds={isLoadingAds}
                                        ads={adsByAdSet[String(adSet.id)]}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* SECTION 2: PERFORMANCE TRENDS */}
                <div className="space-y-6 pt-6 border-t">
                    <div className="flex items-center gap-2 pb-2">
                        <h2 className="text-lg font-semibold">Performance Trends</h2>
                        <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium bg-muted px-2 py-0.5 rounded">Daily Breakdown</span>
                    </div>

                    {/* Daily Performance Chart */}
                    <Card className="bg-card shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <div className="space-y-1">
                                <CardTitle className="text-base">Impressions & Clicks</CardTitle>
                                <CardDescription className="text-xs">
                                    Daily performance for the selected period
                                </CardDescription>
                            </div>
                            <Activity className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent className="pt-4">
                            {isLoadingDaily ? (
                                <div className="h-[350px] flex items-center justify-center">
                                    <Skeleton className="h-[300px] w-full" />
                                </div>
                            ) : dailyPerformance?.data && dailyPerformance.data.length > 0 ? (
                                <ChartContainer config={performanceChartConfig} className="h-[350px] w-full">
                                    <AreaChart
                                        accessibilityLayer
                                        data={dailyPerformance.data
                                            .sort((a: any, b: any) => (a.date_start || '').localeCompare(b.date_start || ''))
                                            .map((item: any) => {
                                                const linkClicks = parseInt(item.inline_link_clicks || '0') ||
                                                    (item.actions?.find((a: any) => a.action_type === 'link_click')?.value || 0);
                                                return {
                                                    date: item.date_start ? format(parseISO(item.date_start), 'MMM dd') : '—',
                                                    spend: parseFloat(item.spend || '0'),
                                                    impressions: parseInt(item.impressions || '0'),
                                                    link_clicks: parseInt(linkClicks.toString()),
                                                };
                                            })}
                                        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                                    >
                                        <defs>
                                            <HatchedBackgroundPattern config={performanceChartConfig} />
                                            <linearGradient id="fillSpend" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="var(--color-spend)" stopOpacity={0.1} />
                                                <stop offset="95%" stopColor="var(--color-spend)" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                                        <XAxis
                                            dataKey="date"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 10 }}
                                            dy={10}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 10 }}
                                            dx={-10}
                                        />
                                        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                                        <ChartLegend content={<ChartLegendContent />} />
                                        <Area
                                            dataKey="impressions"
                                            type="natural"
                                            fill="url(#hatched-background-pattern-impressions)"
                                            fillOpacity={0.4}
                                            stroke="var(--color-impressions)"
                                            stackId="a"
                                            strokeWidth={1.5}
                                            name="Impressions"
                                        />
                                        <Area
                                            dataKey="link_clicks"
                                            type="natural"
                                            fill="url(#hatched-background-pattern-link_clicks)"
                                            fillOpacity={0.4}
                                            stroke="var(--color-link_clicks)"
                                            stackId="a"
                                            strokeWidth={1.5}
                                            name="Link Clicks"
                                        />
                                    </AreaChart>
                                </ChartContainer>
                            ) : (
                                <div className="h-[350px] flex flex-col items-center justify-center text-center border border-dashed rounded-lg bg-muted/20">
                                    <BarChart3 className="h-10 w-10 text-muted-foreground mb-3 opacity-20" />
                                    <p className="text-sm text-muted-foreground">No trend data available for this range</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Daily Spend Chart */}
                        <Card className="bg-card shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <div className="space-y-1">
                                    <CardTitle className="text-base">Daily Spend</CardTitle>
                                    <CardDescription className="text-xs">
                                        Campaign spend over time
                                    </CardDescription>
                                </div>
                                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent className="pt-4">
                                {isLoadingDaily ? (
                                    <div className="h-[250px] flex items-center justify-center">
                                        <Skeleton className="h-[200px] w-full" />
                                    </div>
                                ) : dailyPerformance?.data && dailyPerformance.data.length > 0 ? (
                                    <ChartContainer config={performanceChartConfig} className="h-[250px] w-full">
                                        <LineChart
                                            accessibilityLayer
                                            data={dailyPerformance.data
                                                .sort((a: any, b: any) => (a.date_start || '').localeCompare(b.date_start || ''))
                                                .map((item: any) => ({
                                                    date: item.date_start ? format(parseISO(item.date_start), 'MMM dd') : '—',
                                                    spend: parseFloat(item.spend || '0'),
                                                }))}
                                            margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                                        >
                                            <rect
                                                x="0"
                                                y="0"
                                                width="100%"
                                                height="100%"
                                                fill="url(#spend-pattern-dots)"
                                            />
                                            <defs>
                                                <DottedBackgroundPattern id="spend-pattern-dots" />
                                            </defs>
                                            <CartesianGrid vertical={false} strokeOpacity={0.1} />
                                            <XAxis
                                                dataKey="date"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fontSize: 9 }}
                                            />
                                            <YAxis hide />
                                            <ChartTooltip
                                                cursor={false}
                                                content={<ChartTooltipContent hideLabel />}
                                            />
                                            <Line
                                                dataKey="spend"
                                                type="linear"
                                                stroke="var(--color-spend)"
                                                strokeDasharray="4 4"
                                                dot={<CustomizedDot />}
                                                activeDot={() => <></>}
                                                name="Spend"
                                            />
                                        </LineChart>
                                    </ChartContainer>
                                ) : (
                                    <div className="h-[250px] flex flex-col items-center justify-center text-center border border-dashed rounded-lg bg-muted/20">
                                        <p className="text-xs text-muted-foreground">No spend data available</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Video Retention */}
                        <Card className="bg-card shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <div className="space-y-1">
                                    <CardTitle className="text-base">Video Retention</CardTitle>
                                    <CardDescription className="text-xs">
                                        Watch time engagement
                                    </CardDescription>
                                </div>
                                <FileText className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent className="pt-4">
                                {isLoadingDaily ? (
                                    <div className="h-[250px] flex items-center justify-center">
                                        <Skeleton className="h-[200px] w-full" />
                                    </div>
                                ) : dailyPerformance?.data && dailyPerformance.data.some((d: any) => d.video_p25_watched_actions) ? (
                                    <VideoRetentionChart data={dailyPerformance.data} />
                                ) : (
                                    <div className="h-[250px] flex flex-col items-center justify-center text-center border border-dashed rounded-lg bg-muted/20">
                                        <p className="text-xs text-muted-foreground">No video funnel data</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Gender Distribution */}
                        <Card className="bg-card shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <div className="space-y-1">
                                    <CardTitle className="text-base">Gender Distribution</CardTitle>
                                    <CardDescription className="text-xs">Impressions by gender</CardDescription>
                                </div>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent className="pt-4">
                                {isLoadingGender ? (
                                    <div className="h-[250px] flex items-center justify-center">
                                        <Skeleton className="h-32 w-32 rounded-full" />
                                    </div>
                                ) : genderBreakdown?.data && genderBreakdown.data.length > 0 ? (
                                    <ChartContainer
                                        config={breakdownChartConfig}
                                        className="[&_.recharts-text]:fill-background mx-auto aspect-square h-[250px] w-full"
                                    >
                                        <PieChart>
                                            <Pie
                                                data={genderBreakdown.data
                                                    .filter((item: any) => item.gender?.toLowerCase() !== 'unknown' && parseInt(item.impressions || '0') > 0)
                                                    .map((item: any, index: number) => ({
                                                        gender: item.gender,
                                                        value: parseInt(item.impressions || '0'),
                                                        fill: `var(--chart-${(index % 5) + 1})`
                                                    }))}
                                                dataKey="value"
                                                nameKey="gender"
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={45}
                                                outerRadius={65}
                                                paddingAngle={5}
                                                cornerRadius={6}
                                            >
                                                <Label
                                                    content={({ viewBox }) => {
                                                        if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                                            const total = genderBreakdown.data
                                                                .filter((item: any) => item.gender !== 'unknown' && parseInt(item.impressions || '0') > 0)
                                                                .reduce((acc: number, curr: any) => acc + parseInt(curr.impressions || '0'), 0);
                                                            return (
                                                                <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                                                                    <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-sm font-bold">
                                                                        {total > 1000 ? `${(total / 1000).toFixed(1)}k` : total}
                                                                    </tspan>
                                                                </text>
                                                            );
                                                        }
                                                    }}
                                                />
                                            </Pie>
                                            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                                            <ChartLegend
                                                className="mt-4"
                                                content={<ChartLegendContent />}
                                            />
                                        </PieChart>
                                    </ChartContainer>
                                ) : (
                                    <div className="h-[250px] flex flex-col items-center justify-center text-center border border-dashed rounded-lg bg-muted/20">
                                        <p className="text-xs text-muted-foreground">No gender data</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* SECTION 3: DELIVERY & PLACEMENT */}
                <div className="space-y-6 pt-6 border-t">
                    <div className="flex items-center gap-2 pb-2">
                        <h2 className="text-lg font-semibold">Delivery & Placement</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Top Placements */}
                        <Card className="bg-card shadow-sm">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base">Top Placements</CardTitle>
                                <CardDescription className="text-xs">Impressions by position</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[350px]">
                                <TopPlacementsChart breakdown={placementBreakdown} config={breakdownChartConfig} />
                            </CardContent>
                        </Card>

                        {/* Platform & Device */}
                        <Card className="bg-card shadow-sm">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base">Platform & Device Breakdown</CardTitle>
                                <CardDescription className="text-xs">Impressions by device and publisher</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[350px] space-y-6">
                                {/* Platform Mini Chart */}
                                <div className="h-[140px]">
                                    <p className="text-[10px] font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Publisher Platforms</p>
                                    {isLoadingPlatform ? (
                                        <Skeleton className="h-full w-full" />
                                    ) : platformBreakdown?.data && platformBreakdown.data.length > 0 ? (
                                        <ChartContainer config={breakdownChartConfig} className="h-full w-full">
                                            <BarChart
                                                accessibilityLayer
                                                data={platformBreakdown.data
                                                    .filter((item: any) => (item.publisher_platform || '').toLowerCase() !== 'unknown' && parseInt(item.impressions || '0') > 0)
                                                    .map((item: any) => ({
                                                        platform: item.publisher_platform,
                                                        value: parseInt(item.impressions || '0'),
                                                    }))}
                                                margin={{ left: 10, right: 10, top: 10, bottom: 20 }}
                                            >
                                                <XAxis
                                                    dataKey="platform"
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tick={{ fontSize: 9 }}
                                                />
                                                <YAxis hide />
                                                <ChartTooltip
                                                    cursor={false}
                                                    content={<ChartTooltipContent hideLabel />}
                                                />
                                                <Bar
                                                    dataKey="value"
                                                    radius={[4, 4, 0, 0]}
                                                    shape={<CustomHatchedBar />}
                                                >
                                                    {platformBreakdown.data
                                                        .filter((item: any) => (item.publisher_platform || '').toLowerCase() !== 'unknown' && parseInt(item.impressions || '0') > 0)
                                                        .map((entry: any, index: number) => (
                                                            <Cell key={`cell-${index}`} fill={`var(--chart-${(index % 5) + 1})`} />
                                                        ))}
                                                </Bar>
                                            </BarChart>
                                        </ChartContainer>
                                    ) : (
                                        <div className="h-full flex items-center justify-center text-xs text-muted-foreground border border-dashed rounded-lg bg-muted/20">
                                            No platform data
                                        </div>
                                    )}
                                </div>

                                <Separator />

                                {/* Device Mini Chart */}
                                <div className="h-[140px]">
                                    <p className="text-[10px] font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Device Types</p>
                                    {isLoadingDevice ? (
                                        <Skeleton className="h-full w-full" />
                                    ) : deviceBreakdown?.data && deviceBreakdown.data.length > 0 ? (
                                        <ChartContainer config={breakdownChartConfig} className="h-full w-full">
                                            <BarChart
                                                accessibilityLayer
                                                data={deviceBreakdown.data
                                                    .filter((item: any) => (item.device_platform || '').toLowerCase() !== 'unknown' && parseInt(item.impressions || '0') > 0)
                                                    .map((item: any) => ({
                                                        device: item.device_platform,
                                                        value: parseInt(item.impressions || '0'),
                                                    }))}
                                                margin={{ left: 10, right: 10, top: 10, bottom: 20 }}
                                            >
                                                <XAxis
                                                    dataKey="device"
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tick={{ fontSize: 9 }}
                                                />
                                                <YAxis hide />
                                                <ChartTooltip
                                                    cursor={false}
                                                    content={<ChartTooltipContent hideLabel />}
                                                />
                                                <Bar
                                                    dataKey="value"
                                                    radius={[4, 4, 0, 0]}
                                                    shape={<CustomHatchedBar />}
                                                >
                                                    {deviceBreakdown.data
                                                        .filter((item: any) => (item.device_platform || '').toLowerCase() !== 'unknown' && parseInt(item.impressions || '0') > 0)
                                                        .map((entry: any, index: number) => (
                                                            <Cell key={`cell-${index}`} fill={`var(--chart-${(index % 5) + 1})`} />
                                                        ))}
                                                </Bar>
                                            </BarChart>
                                        </ChartContainer>
                                    ) : (
                                        <div className="h-full flex items-center justify-center text-xs text-muted-foreground border border-dashed rounded-lg bg-muted/20">
                                            No device data
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Performance Breakdown Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                        {/* Hourly Performance */}
                        <Card className="bg-card shadow-sm">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base">Hourly Performance</CardTitle>
                                <CardDescription className="text-xs">Impressions distribution by hour of day</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-4">
                                {isLoadingHourly ? (
                                    <div className="space-y-4 pt-4">
                                        <Skeleton className="h-[200px] w-full" />
                                    </div>
                                ) : hourlyPerformance?.data && hourlyPerformance.data.length > 0 ? (
                                    <HourlyPerformanceDistribution data={hourlyPerformance.data} config={breakdownChartConfig} />
                                ) : (
                                    <div className="h-[200px] flex flex-col items-center justify-center text-center border border-dashed rounded-lg bg-muted/20">
                                        <Clock className="h-8 w-8 text-muted-foreground mb-2 opacity-20" />
                                        <p className="text-sm text-muted-foreground">No hourly data available</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Conversion Funnel */}
                        <Card className="bg-card shadow-sm">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base">Conversion Funnel</CardTitle>
                                <CardDescription className="text-xs">Customer journey from reach to conversion</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-4">
                                {campaign?.insights ? (
                                    <ConversionFunnel insights={campaign.insights} />
                                ) : (
                                    <div className="h-[200px] flex flex-col items-center justify-center text-center border border-dashed rounded-lg bg-muted/20">
                                        <Activity className="h-8 w-8 text-muted-foreground mb-2 opacity-20" />
                                        <p className="text-sm text-muted-foreground">No funnel data available</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* SECTION 4: DISTRIBUTIONS */}
                <div className="space-y-6 pt-6 border-t">
                    <div className="flex items-center gap-2 pb-2">
                        <h2 className="text-lg font-semibold">Distributions</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Age Distribution */}
                        <Card className="bg-card shadow-sm">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base">Age Distribution</CardTitle>
                                <CardDescription className="text-xs">Performance by age group</CardDescription>
                            </CardHeader>
                            <CardContent className="min-h-[400px]">
                                {isLoadingAge ? (
                                    <div className="space-y-4 pt-4">
                                        {[...Array(5)].map((_, i) => (
                                            <Skeleton key={i} className="h-10 w-full" />
                                        ))}
                                    </div>
                                ) : ageBreakdown?.data && ageBreakdown.data.length > 0 ? (
                                    <ValueLineRegionChart breakdown={ageBreakdown} config={breakdownChartConfig} />
                                ) : (
                                    <div className="h-[300px] flex flex-col items-center justify-center text-center border border-dashed rounded-lg bg-muted/20">
                                        <Users className="h-8 w-8 text-muted-foreground mb-2 opacity-20" />
                                        <p className="text-sm text-muted-foreground">No age data available</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Region Breakdown */}
                        <Card className="bg-card shadow-sm">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base">Top Regions</CardTitle>
                                <CardDescription className="text-xs">Performance by geographic region</CardDescription>
                            </CardHeader>
                            <CardContent className="min-h-[400px]">
                                {isLoadingRegion ? (
                                    <div className="space-y-4 pt-4">
                                        {[...Array(5)].map((_, i) => (
                                            <Skeleton key={i} className="h-10 w-full" />
                                        ))}
                                    </div>
                                ) : regionBreakdown?.data && regionBreakdown.data.length > 0 ? (
                                    <ValueLineRegionChart breakdown={regionBreakdown} config={breakdownChartConfig} />
                                ) : (
                                    <div className="h-[300px] flex flex-col items-center justify-center text-center border border-dashed rounded-lg bg-muted/20">
                                        <MapPin className="h-8 w-8 text-muted-foreground mb-2 opacity-20" />
                                        <p className="text-sm text-muted-foreground">No geographic data available</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Engagement Actions Breakdown */}
                        <Card className="bg-card shadow-sm">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base">Engagement Actions</CardTitle>
                                <CardDescription className="text-xs">Social interactions and engagements</CardDescription>
                            </CardHeader>
                            <CardContent className="min-h-[400px]">
                                {engagementActionsData ? (
                                    <ValueLineRegionChart breakdown={engagementActionsData} config={breakdownChartConfig} />
                                ) : (
                                    <div className="h-[300px] flex flex-col items-center justify-center text-center border border-dashed rounded-lg bg-muted/20">
                                        <MousePointer2 className="h-8 w-8 text-muted-foreground mb-2 opacity-20" />
                                        <p className="text-sm text-muted-foreground">No engagement data available</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
