/* eslint-disable jsx-a11y/alt-text */
import React from "react";
import { Document, Page, Text, View, StyleSheet, Image, Link, Svg, Path, Circle, Line, Rect } from "@react-pdf/renderer";
import { format } from "date-fns";

const styles = StyleSheet.create({
    page: { backgroundColor: "#ffffff", fontFamily: "Helvetica", paddingTop: 50, paddingBottom: 65, paddingLeft: 0, paddingRight: 0 },
    coverPage: { height: "100%", width: "100%", display: "flex", flexDirection: "column", position: "relative" },
    logoContainer: { position: "absolute", top: 40, right: 40, width: 220, height: 90 },
    logo: { width: "100%", height: "100%", objectFit: "contain" },
    coverContent: { flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", paddingHorizontal: 40 },
    campaignTitle: { fontSize: 32, fontWeight: "bold", color: "#ffffff", textAlign: "center", marginBottom: 10 },
    periodText: { fontSize: 14, color: "#ffffff", textAlign: "center", marginBottom: 12, opacity: 0.9 },
    coverSubtitle: { fontSize: 10, color: "#ffffff", textAlign: "center", opacity: 0.85, lineHeight: 1.4, maxWidth: 440, marginTop: 6 },
    accountNameText: { fontSize: 12, color: "#ffffff", opacity: 0.9, fontWeight: "bold", marginTop: 8 },
    createdByContainer: { position: "absolute", bottom: 120, left: 0, right: 0, display: "flex", alignItems: "center" },
    createdByLabel: { fontSize: 10, color: "#ffffff", opacity: 0.8, marginBottom: 4 },
    createdByText: { fontSize: 14, color: "#ffffff", fontWeight: "bold" },
    disclaimerContainer: { position: "absolute", bottom: 40, left: 40, right: 40 },
    disclaimerText: { fontSize: 8, color: "#ffffff", opacity: 0.6, textAlign: "center", lineHeight: 1.4 },

    header: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: "#e5e7eb",
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "#ffffff",
    },
    headerTitle: { fontSize: 9, color: "#4b5563", fontWeight: "bold" },
    headerDate: { fontSize: 8, color: "#9ca3af" },
    sectionTitle: { fontSize: 14, fontWeight: "bold", color: "#1f2937", marginBottom: 12, marginTop: 15, paddingHorizontal: 40 },
    subSectionTitle: { fontSize: 11, fontWeight: "bold", color: "#374151", marginBottom: 8, marginTop: 8, paddingHorizontal: 40 },

    metricsGrid: { display: "flex", flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 40, marginBottom: 12 },
    metricCard: { width: "31.5%", padding: 8, backgroundColor: "#f9fafb", borderRadius: 4, borderLeftWidth: 3, borderLeftColor: "#6366f1", marginBottom: 6 },
    metricLabel: { fontSize: 7, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 3 },
    metricValue: { fontSize: 13, fontWeight: "bold", color: "#111827" },

    tableContainer: { paddingHorizontal: 40, marginBottom: 12 },
    tableHeader: { flexDirection: "row", borderBottomColor: "#d1d5db", borderBottomWidth: 1.5, backgroundColor: "#f3f4f6", paddingVertical: 6, paddingHorizontal: 8 },
    tableRow: { flexDirection: "row", borderBottomColor: "#e5e7eb", borderBottomWidth: 0.5, paddingVertical: 5, paddingHorizontal: 8 },
    tableCellName: { width: "55%", fontSize: 8, color: "#374151", lineHeight: 1.25 },
    tableCellValue: { width: "15%", textAlign: "right", fontSize: 8, color: "#111827", fontWeight: "bold", lineHeight: 1.25 },
    tableCellWrap: { flexWrap: "wrap" },
    tableCellValueLeft: { textAlign: "left", fontWeight: "normal" },

    chartContainer: { paddingHorizontal: 40, marginBottom: 12 },

    pageFooter: { position: "absolute", bottom: 20, left: 0, right: 0, textAlign: "center", fontSize: 8, color: "#9ca3af" },
    endPageContent: { flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", backgroundColor: "#F8FAFC" },
    thankYouText: { fontSize: 48, fontWeight: "bold", color: "#1a1a1a", marginBottom: 40, fontFamily: "Helvetica" },
    contactInfoContainer: { padding: 30, backgroundColor: "#ffffff", borderRadius: 16, width: "80%", alignItems: "flex-start", shadowColor: "#000", shadowOpacity: 0.1, shadowOffset: { width: 0, height: 4 }, shadowRadius: 10 },
    contactTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 20, color: "#1a1a1a" },
    contactRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
    contactIcon: { width: 24, height: 24, marginRight: 12, alignItems: "center", justifyContent: "center" },
    contactLink: { fontSize: 12, color: "#0EA5E9", textDecoration: "none" },
});

function fmtDate(dateString: string) {
    try {
        return format(new Date(dateString), "MMM dd, yyyy");
    } catch {
        return dateString;
    }
}

function fmtNum(v: any): string {
    const n = typeof v === "string" ? parseFloat(v) : Number(v);
    if (!Number.isFinite(n)) return "—";
    return new Intl.NumberFormat("en-US", { notation: "compact", compactDisplay: "short" }).format(n);
}

function fmtMoney(v: any, currency: string): string {
    const n = typeof v === "string" ? parseFloat(v) : Number(v);
    if (!Number.isFinite(n)) return "—";
    return new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

function asNumber(v: any): number {
    const n = typeof v === "string" ? parseFloat(v) : Number(v);
    return Number.isFinite(n) ? n : 0;
}

function safeShort(s: any): string {
    if (s == null) return "—";
    const v = String(s);
    return v.length ? v : "—";
}

function unwrapArray(v: any): any[] {
    if (!v) return [];
    if (Array.isArray(v)) return v;
    if (Array.isArray(v.data)) return v.data;
    if (Array.isArray(v.data?.data)) return v.data.data;
    if (Array.isArray(v?.result?.data)) return v.result.data;
    return [];
}

const SimpleTable = ({
    title,
    headerLeft,
    headerRight,
    rows,
}: {
    title: string;
    headerLeft: string;
    headerRight: string;
    rows: Array<{ left: string; right: string }>;
}) => {
    if (!rows.length) return null;
    return (
        <View style={styles.tableContainer} wrap={false}>
            <Text style={{ fontSize: 11, fontWeight: "bold", color: "#374151", marginBottom: 8 }}>{title}</Text>
            <View style={styles.tableHeader}>
                <Text style={[styles.tableCellName, styles.tableCellWrap, { width: "70%" }]}>{headerLeft}</Text>
                <Text style={[styles.tableCellValue, { width: "30%" }]}>{headerRight}</Text>
            </View>
            {rows.map((r, i) => (
                <View key={i} style={styles.tableRow}>
                    <Text style={[styles.tableCellName, styles.tableCellWrap, { width: "70%" }]}>{r.left}</Text>
                    <Text style={[styles.tableCellValue, { width: "30%" }]}>{r.right}</Text>
                </View>
            ))}
        </View>
    );
};

const TargetingMiniTable = ({
    title,
    targetingRows,
}: {
    title: string;
    targetingRows: Array<{ label: string; content: string }>;
}) => {
    const rows = (targetingRows || []).slice(0, 12);
    if (!rows.length) return null;
    return (
        <View style={styles.tableContainer} wrap={false}>
            <Text style={{ fontSize: 11, fontWeight: "bold", color: "#374151", marginBottom: 8 }}>{title}</Text>
            <View style={styles.tableHeader}>
                <Text style={[styles.tableCellName, styles.tableCellWrap, { width: "35%" }]}>Criterion</Text>
                <Text style={[styles.tableCellValue, styles.tableCellWrap, { width: "65%" }]}>Value</Text>
            </View>
            {rows.map((t, i) => (
                <View key={i} style={styles.tableRow}>
                    <Text style={[styles.tableCellName, styles.tableCellWrap, { width: "35%" }]}>{safeShort(t.label)}</Text>
                    <Text style={[styles.tableCellValue, styles.tableCellWrap, styles.tableCellValueLeft, { width: "65%" }]}>
                        {safeShort(t.content)}
                    </Text>
                </View>
            ))}
        </View>
    );
};

const AdsTable = ({
    title,
    ads,
    currency,
}: {
    title: string;
    ads: any[];
    currency: string;
}) => {
    const rows = (ads || [])
        .slice()
        .sort((a, b) => Number(b?.insights?.impressions || 0) - Number(a?.insights?.impressions || 0))
        .slice(0, 10);

    if (!rows.length) return null;

    return (
        <View style={styles.tableContainer} wrap={false}>
            <Text style={{ fontSize: 11, fontWeight: "bold", color: "#374151", marginBottom: 8 }}>{title}</Text>
            <View style={styles.tableHeader}>
                <Text style={[styles.tableCellName, styles.tableCellWrap, { width: "42%" }]}>Ad</Text>
                <Text style={[styles.tableCellValue, { width: "14%" }]}>Clicks</Text>
                <Text style={[styles.tableCellValue, { width: "14%" }]}>Impr.</Text>
                <Text style={[styles.tableCellValue, { width: "16%" }]}>Spend</Text>
                <Text style={[styles.tableCellValue, { width: "14%" }]}>Leads</Text>
            </View>
            {rows.map((a, i) => (
                <View key={i} style={styles.tableRow}>
                    <Text style={[styles.tableCellName, styles.tableCellWrap, { width: "42%" }]}>
                        {safeShort(a?.name || `Ad ${a?.id}`)}
                    </Text>
                    <Text style={[styles.tableCellValue, { width: "14%" }]}>{fmtNum(a?.insights?.clicks || 0)}</Text>
                    <Text style={[styles.tableCellValue, { width: "14%" }]}>{fmtNum(a?.insights?.impressions || 0)}</Text>
                    <Text style={[styles.tableCellValue, { width: "16%" }]}>{fmtMoney(a?.insights?.spend || 0, currency)}</Text>
                    <Text style={[styles.tableCellValue, { width: "14%" }]}>{fmtNum(a?.insights?.oneClickLeads || a?.insights?.leads || 0)}</Text>
                </View>
            ))}
        </View>
    );
};

const DailyLineChart = ({
    title,
    data,
    series,
    sharedScale = false,
}: {
    title: string;
    data: any[];
    series: Array<{ key: string; label: string; color: string }>;
    sharedScale?: boolean;
}) => {
    const valid = (data || []).filter((d) => d?.date);
    if (!valid.length) return null;

    const width = 480;
    const height = 150;
    const paddingL = 45;
    const paddingR = 15;
    const paddingT = 20;
    const paddingB = 28;

    const xs = valid.map((_, i) => (i / Math.max(1, valid.length - 1)) * (width - paddingL - paddingR) + paddingL);
    const maxFor = (k: string) => Math.max(...valid.map((d) => asNumber(d?.[k] ?? 0)), 1);
    const globalMax = Math.max(1, ...series.map((s) => maxFor(s.key)));

    const pathFor = (k: string) => {
        const max = sharedScale ? globalMax : maxFor(k);
        const pts = valid.map((d, i) => {
            const v = asNumber(d?.[k] ?? 0);
            const x = xs[i];
            const y = height - paddingB - (v / max) * (height - paddingB - paddingT);
            return { x, y };
        });
        return `M ${pts.map((p) => `${p.x},${p.y}`).join(" L ")}`;
    };

    return (
        <View style={styles.chartContainer} wrap={false}>
            <Text style={{ fontSize: 11, fontWeight: "bold", color: "#374151", marginBottom: 8 }}>{title}</Text>
            <Svg height={height} width="100%">
                {[0, 0.5, 1].map((lvl, i) => {
                    const y = height - paddingB - lvl * (height - paddingB - paddingT);
                    return <Line key={i} x1={paddingL} y1={y} x2={width - paddingR} y2={y} stroke="#e5e7eb" strokeWidth={0.6} />;
                })}

                {valid.map((d, i) => {
                    const step = Math.ceil(valid.length / 5);
                    if (i % step !== 0 && i !== valid.length - 1) return null;
                    const x = xs[i];
                    return (
                        <Text key={i} x={x} y={height - 10} textAnchor="middle" style={{ fontSize: 6 }} fill="#9ca3af">
                            {d?.date ? format(new Date(d.date), "MMM dd") : ""}
                        </Text>
                    );
                })}

                {series.map((s, idx) => (
                    <Path key={idx} d={pathFor(s.key)} stroke={s.color} strokeWidth={1.6} fill="none" />
                ))}
            </Svg>
            <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 6 }}>
                {series.map((s, i) => (
                    <View key={i} style={{ flexDirection: "row", alignItems: "center", marginRight: 12, marginBottom: 4 }}>
                        <View style={{ width: 8, height: 3, backgroundColor: s.color, marginRight: 6 }} />
                        <Text style={{ fontSize: 7, color: "#6b7280" }}>{s.label}</Text>
                    </View>
                ))}
            </View>
        </View>
    );
};

const CategoryMultiLineChart = ({
    title,
    rows,
    xKey,
    series,
}: {
    title: string;
    rows: any[];
    xKey: string;
    series: Array<{ key: string; label: string; color: string }>;
}) => {
    const data = (rows || [])
        .map((r) => ({ ...r, __x: safeShort(r?.[xKey] ?? "—") }))
        .filter((r) => r.__x && r.__x !== "—");
    if (!data.length) return null;

    const width = 480;
    const height = 170;
    const paddingL = 45;
    const paddingR = 15;
    const paddingT = 20;
    const paddingB = 60;

    const xs = data.map((_, i) => {
        const denom = Math.max(1, data.length - 1);
        return (i / denom) * (width - paddingL - paddingR) + paddingL;
    });

    const maxFor = (k: string) => Math.max(...data.map((d) => asNumber(d?.[k] ?? 0)), 1);
    const globalMax = Math.max(1, ...series.map((s) => maxFor(s.key)));

    const pathFor = (k: string) => {
        const pts = data.map((d, i) => {
            const v = asNumber(d?.[k] ?? 0);
            const x = xs[i];
            const y = height - paddingB - (v / globalMax) * (height - paddingB - paddingT);
            return { x, y };
        });
        return `M ${pts.map((p) => `${p.x},${p.y}`).join(" L ")}`;
    };

    return (
        <View style={styles.chartContainer} wrap={false}>
            <Text style={{ fontSize: 11, fontWeight: "bold", color: "#374151", marginBottom: 8 }}>{title}</Text>
            <Svg height={height} width="100%">
                {[0, 0.5, 1].map((lvl, i) => {
                    const y = height - paddingB - lvl * (height - paddingB - paddingT);
                    return <Line key={i} x1={paddingL} y1={y} x2={width - paddingR} y2={y} stroke="#e5e7eb" strokeWidth={0.6} />;
                })}

                {/* X labels (rotate to fit) */}
                {data.map((d, i) => {
                    const x = xs[i];
                    const label = String(d.__x);
                    const short = label.length > 22 ? `${label.slice(0, 22)}…` : label;
                    return (
                        <Text
                            key={i}
                            x={x}
                            y={height - 10}
                            textAnchor="end"
                            style={{ fontSize: 6 }}
                            fill="#9ca3af"
                            transform={`rotate(-60 ${x} ${height - 10})`}
                        >
                            {short}
                        </Text>
                    );
                })}

                {series.map((s, idx) => (
                    <Path key={idx} d={pathFor(s.key)} stroke={s.color} strokeWidth={1.4} fill="none" />
                ))}
            </Svg>

            <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 6 }}>
                {series.map((s, i) => (
                    <View key={i} style={{ flexDirection: "row", alignItems: "center", marginRight: 12, marginBottom: 4 }}>
                        <View style={{ width: 8, height: 3, backgroundColor: s.color, marginRight: 6 }} />
                        <Text style={{ fontSize: 7, color: "#6b7280" }}>{s.label}</Text>
                    </View>
                ))}
            </View>
        </View>
    );
};

const PieBreakdownChart = ({
    title,
    rows,
    nameKey,
    valueKey,
    colors,
}: {
    title: string;
    rows: any[];
    nameKey: string;
    valueKey: string;
    colors: string[];
}) => {
    if (!rows || rows.length === 0) return null;

    const data = rows
        .map((r) => ({ name: safeShort(r?.[nameKey] ?? "Unknown"), value: Number(r?.[valueKey] || 0) }))
        .filter((d) => d.value > 0)
        .sort((a, b) => b.value - a.value)
        .slice(0, 6);
    if (!data.length) return null;

    const total = data.reduce((a, b) => a + b.value, 0) || 1;
    const size = 120;
    const cx = size / 2;
    const cy = size / 2;
    const outerRadius = 44;
    const innerRadius = 28;

    let startAngle = 0;

    const arcPath = (sa: number, ea: number) => {
        const startRad = (sa - 90) * Math.PI / 180;
        const endRad = (ea - 90) * Math.PI / 180;
        const x1o = cx + outerRadius * Math.cos(startRad);
        const y1o = cy + outerRadius * Math.sin(startRad);
        const x2o = cx + outerRadius * Math.cos(endRad);
        const y2o = cy + outerRadius * Math.sin(endRad);
        const x1i = cx + innerRadius * Math.cos(endRad);
        const y1i = cy + innerRadius * Math.sin(endRad);
        const x2i = cx + innerRadius * Math.cos(startRad);
        const y2i = cy + innerRadius * Math.sin(startRad);
        const largeArc = (ea - sa) > 180 ? 1 : 0;
        return [
            `M ${x1o} ${y1o}`,
            `A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x2o} ${y2o}`,
            `L ${x1i} ${y1i}`,
            `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x2i} ${y2i}`,
            "Z",
        ].join(" ");
    };

    return (
        <View style={styles.chartContainer} wrap={false}>
            <Text style={{ fontSize: 11, fontWeight: "bold", color: "#374151", marginBottom: 8 }}>{title}</Text>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Svg height={size} width={size}>
                    {data.map((d, i) => {
                        const angle = (d.value / total) * 360;
                        const end = startAngle + angle;
                        const path = arcPath(startAngle, end);
                        startAngle = end;
                        return <Path key={i} d={path} fill={colors[i % colors.length]} />;
                    })}
                </Svg>
                <View style={{ marginLeft: 14, flex: 1 }}>
                    {data.map((d, i) => (
                        <View key={i} style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
                            <View style={{ width: 8, height: 8, backgroundColor: colors[i % colors.length], marginRight: 8, borderRadius: 2 }} />
                            <Text style={{ fontSize: 8, color: "#374151", flex: 1 }} wrap>
                                {d.name}
                            </Text>
                            <Text style={{ fontSize: 8, color: "#111827", fontWeight: "bold" }}>
                                {Math.round((d.value / total) * 100)}%
                            </Text>
                        </View>
                    ))}
                </View>
            </View>
        </View>
    );
};

const HorizontalBarBreakdown = ({
    title,
    rows,
    nameKey,
    valueKey,
    barColor,
}: {
    title: string;
    rows: any[];
    nameKey: string;
    valueKey: string;
    barColor: string;
}) => {
    if (!rows || rows.length === 0) return null;
    const data = [...rows]
        .map((r) => ({ name: safeShort(r?.[nameKey] ?? "Unknown"), value: Number(r?.[valueKey] || 0) }))
        .filter((d) => d.value > 0)
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);
    if (!data.length) return null;
    const max = Math.max(...data.map((d) => d.value), 1);

    return (
        <View style={styles.chartContainer} wrap={false}>
            <Text style={{ fontSize: 11, fontWeight: "bold", color: "#374151", marginBottom: 8 }}>{title}</Text>
            {data.map((d, i) => {
                const pct = (d.value / max) * 100;
                return (
                    <View key={i} style={{ marginBottom: 7 }}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 2 }}>
                            <Text style={{ fontSize: 8, color: "#374151", fontWeight: "bold", maxWidth: 320 }} wrap>
                                {d.name}
                            </Text>
                            <Text style={{ fontSize: 8, color: "#111827", fontWeight: "bold" }}>{fmtNum(d.value)}</Text>
                        </View>
                        <View style={{ height: 7, width: "100%", backgroundColor: "#f3f4f6", borderRadius: 4 }}>
                            <View style={{ height: "100%", width: `${pct}%`, backgroundColor: barColor, borderRadius: 4 }} />
                        </View>
                    </View>
                );
            })}
        </View>
    );
};

const MetricCard = ({ label, value, color }: { label: string; value: string; color: string }) => (
    <View style={[styles.metricCard, { borderLeftColor: color }]}>
        <Text style={styles.metricLabel}>{label}</Text>
        <Text style={styles.metricValue}>{value}</Text>
    </View>
);

const MetricsGrid = ({ items }: { items: Array<{ label: string; value: string; color: string }> }) => (
    <View style={styles.metricsGrid}>
        {items.map((m, i) => (
            <MetricCard key={i} label={m.label} value={m.value} color={m.color} />
        ))}
    </View>
);

const ReportCoverPage = (props: any) => {
    const { campaignGroup, timeRange, primaryColor, accountName } = props;
    return (
        <Page size="A4" style={[styles.page, { backgroundColor: primaryColor }]}>
            <View style={styles.coverPage}>
                <View style={styles.logoContainer}>
                    <Image src="/nisclogowhite.png" style={styles.logo} />
                </View>
                <View style={styles.coverContent}>
                    <Text style={styles.campaignTitle}>{campaignGroup?.name || "LinkedIn Ads Report"}</Text>
                    <Text style={styles.periodText}>
                        Period: {fmtDate(timeRange.since)} - {fmtDate(timeRange.until)}
                    </Text>
                    {accountName ? <Text style={styles.accountNameText}>Account: {accountName}</Text> : null}
                    <Text style={styles.coverSubtitle}>
                        A clean summary of campaign group performance with a structured view of ad sets and their targeting.
                    </Text>
                </View>
                <View style={styles.createdByContainer}>
                    <Text style={styles.createdByLabel}>Report Generated by:</Text>
                    <Text style={styles.createdByText}>Nisc Cloud</Text>
                </View>
                <View style={styles.disclaimerContainer}>
                    <Text style={styles.disclaimerText}>
                        This report summarizes LinkedIn Ads performance for the selected time range. Some targeting labels may be abbreviated for readability.
                    </Text>
                </View>
            </View>
        </Page>
    );
};

const ReportContentPage = (props: any) => {
    const { campaignGroup, timeRange, currency, totals, adSets, primaryColor, dailyPerformance, breakdowns, adsByAdSetId } = props;

    const metrics = [
        { label: "Impressions", value: fmtNum(totals?.impressions || 0), color: "#8b5cf6" },
        { label: "Clicks", value: fmtNum(totals?.clicks || 0), color: "#10b981" },
        { label: "Spend", value: fmtMoney(totals?.spend || 0, currency), color: "#059669" },
        { label: "Conversions", value: fmtNum(totals?.conversions || 0), color: "#f97316" },
        { label: "Avg CPC", value: fmtMoney(totals?.avgCpc || 0, currency), color: "#fb923c" },
        { label: "Avg CTR", value: `${Number(totals?.avgCtr || 0).toFixed(2)}%`, color: "#6366f1" },
    ];

    const perfRows = unwrapArray(dailyPerformance);
    const b = breakdowns || {};

    return (
        <Page size="A4" style={styles.page}>
            <View style={styles.header} fixed>
                <Text style={[styles.headerTitle, { color: primaryColor }]}>{campaignGroup?.name || "LinkedIn Ads Campaign Group Report"}</Text>
                <Text style={styles.headerDate}>
                    {fmtDate(timeRange.since)} - {fmtDate(timeRange.until)}
                </Text>
            </View>

            <Text style={styles.sectionTitle}>Campaign Group Overview</Text>
            <MetricsGrid items={metrics} />

            <Text style={styles.sectionTitle}>Performance Trends</Text>
            <DailyLineChart
                title="Daily Activity"
                data={perfRows}
                series={[
                    { key: "impressions", label: "Impressions", color: "#8b5cf6" },
                    { key: "clicks", label: "Clicks", color: "#10b981" },
                    { key: "spend", label: "Spend", color: "#059669" },
                ]}
                sharedScale={false}
            />

            <Text style={styles.sectionTitle}>Breakdowns</Text>
            <PieBreakdownChart
                title="Device Breakdown"
                rows={unwrapArray(b.device)}
                nameKey="pivot"
                valueKey="impressions"
                colors={["#6366f1", "#10b981", "#f97316", "#0ea5e9", "#a855f7", "#64748b"]}
            />
            <HorizontalBarBreakdown
                title="Placement Breakdown"
                rows={unwrapArray(b.placement)}
                nameKey="pivot"
                valueKey="impressions"
                barColor={primaryColor}
            />
            <PieBreakdownChart
                title="Serving Location"
                rows={unwrapArray(b.servingLocation)}
                nameKey="pivot"
                valueKey="impressions"
                colors={["#0ea5e9", "#8b5cf6", "#10b981", "#f97316", "#a855f7", "#64748b"]}
            />

            <Text style={styles.sectionTitle}>Audience Breakdown Charts</Text>
            <CategoryMultiLineChart
                title="Company Size"
                rows={unwrapArray(b.companySize)
                    .slice()
                    .sort((a, b) => Number(b?.impressions || 0) - Number(a?.impressions || 0))
                    .slice(0, 12)}
                xKey="pivot"
                series={[
                    { key: "impressions", label: "Impressions", color: "#8b5cf6" },
                    { key: "clicks", label: "Clicks", color: "#10b981" },
                    { key: "videoViews", label: "Video Views", color: "#0ea5e9" },
                    { key: "leads", label: "Leads", color: "#f97316" },
                    { key: "spend", label: "Spend", color: "#059669" },
                ]}
            />
            <CategoryMultiLineChart
                title="Seniority"
                rows={unwrapArray(b.seniority)
                    .slice()
                    .sort((a, b) => Number(b?.impressions || 0) - Number(a?.impressions || 0))
                    .slice(0, 12)}
                xKey="pivot"
                series={[
                    { key: "impressions", label: "Impressions", color: "#8b5cf6" },
                    { key: "clicks", label: "Clicks", color: "#10b981" },
                    { key: "videoViews", label: "Video Views", color: "#0ea5e9" },
                    { key: "leads", label: "Leads", color: "#f97316" },
                    { key: "spend", label: "Spend", color: "#059669" },
                ]}
            />
            <CategoryMultiLineChart
                title="Job Function"
                rows={unwrapArray(b.jobFunction)
                    .slice()
                    .sort((a, b) => Number(b?.impressions || 0) - Number(a?.impressions || 0))
                    .slice(0, 12)}
                xKey="pivot"
                series={[
                    { key: "impressions", label: "Impressions", color: "#8b5cf6" },
                    { key: "clicks", label: "Clicks", color: "#10b981" },
                    { key: "videoViews", label: "Video Views", color: "#0ea5e9" },
                    { key: "leads", label: "Leads", color: "#f97316" },
                    { key: "spend", label: "Spend", color: "#059669" },
                ]}
            />
            <CategoryMultiLineChart
                title="Industry"
                rows={unwrapArray(b.industry)
                    .slice()
                    .sort((a, b) => Number(b?.impressions || 0) - Number(a?.impressions || 0))
                    .slice(0, 12)}
                xKey="pivot"
                series={[
                    { key: "impressions", label: "Impressions", color: "#8b5cf6" },
                    { key: "clicks", label: "Clicks", color: "#10b981" },
                    { key: "videoViews", label: "Video Views", color: "#0ea5e9" },
                    { key: "leads", label: "Leads", color: "#f97316" },
                    { key: "spend", label: "Spend", color: "#059669" },
                ]}
            />

            <SimpleTable
                title="Company Size (Top)"
                headerLeft="Company Size"
                headerRight="Impressions"
                rows={unwrapArray(b.companySize)
                    .slice()
                    .sort((a, b) => Number(b?.impressions || 0) - Number(a?.impressions || 0))
                    .slice(0, 12)
                    .map((r) => ({ left: safeShort(r?.pivot), right: fmtNum(r?.impressions || 0) }))}
            />
            <SimpleTable
                title="Seniority (Top)"
                headerLeft="Seniority"
                headerRight="Impressions"
                rows={unwrapArray(b.seniority)
                    .slice()
                    .sort((a, b) => Number(b?.impressions || 0) - Number(a?.impressions || 0))
                    .slice(0, 12)
                    .map((r) => ({ left: safeShort(r?.pivot), right: fmtNum(r?.impressions || 0) }))}
            />
            <SimpleTable
                title="Job Function (Top)"
                headerLeft="Job Function"
                headerRight="Impressions"
                rows={unwrapArray(b.jobFunction)
                    .slice()
                    .sort((a, b) => Number(b?.impressions || 0) - Number(a?.impressions || 0))
                    .slice(0, 12)
                    .map((r) => ({ left: safeShort(r?.pivot), right: fmtNum(r?.impressions || 0) }))}
            />
            <SimpleTable
                title="Industry (Top)"
                headerLeft="Industry"
                headerRight="Impressions"
                rows={unwrapArray(b.industry)
                    .slice()
                    .sort((a, b) => Number(b?.impressions || 0) - Number(a?.impressions || 0))
                    .slice(0, 12)
                    .map((r) => ({ left: safeShort(r?.pivot), right: fmtNum(r?.impressions || 0) }))}
            />

            <Text style={styles.sectionTitle}>Ad Sets</Text>
            <View style={styles.tableContainer} wrap={false}>
                <View style={styles.tableHeader}>
                    <Text style={styles.tableCellName}>Ad set</Text>
                    <Text style={styles.tableCellValue}>Clicks</Text>
                    <Text style={styles.tableCellValue}>Impr.</Text>
                    <Text style={styles.tableCellValue}>Spend</Text>
                </View>
                {(adSets || []).slice(0, 12).map((a: any, i: number) => (
                    <View key={i} style={styles.tableRow}>
                        <Text style={[styles.tableCellName, styles.tableCellWrap]}>{a?.name || `Ad Set ${a?.id}`}</Text>
                        <Text style={styles.tableCellValue}>{fmtNum(a?.insights?.clicks || 0)}</Text>
                        <Text style={styles.tableCellValue}>{fmtNum(a?.insights?.impressions || 0)}</Text>
                        <Text style={styles.tableCellValue}>{fmtMoney(a?.insights?.spend || 0, currency)}</Text>
                    </View>
                ))}
                {(!adSets || adSets.length === 0) && (
                    <View style={styles.tableRow}>
                        <Text style={styles.tableCellName}>No ad sets found</Text>
                        <Text style={styles.tableCellValue}>—</Text>
                        <Text style={styles.tableCellValue}>—</Text>
                        <Text style={styles.tableCellValue}>—</Text>
                    </View>
                )}
            </View>

            <Text style={styles.sectionTitle}>Targeting (Top)</Text>
            <View style={styles.tableContainer} wrap={false}>
                <View style={styles.tableHeader}>
                    <Text style={[styles.tableCellName, { width: "35%" }]}>Ad set</Text>
                    <Text style={[styles.tableCellValue, { width: "65%", textAlign: "left", fontWeight: "bold" }]}>Summary</Text>
                </View>
                {(adSets || []).slice(0, 6).map((a: any, i: number) => {
                    const targeting = (a?.targetingSummary || []).slice(0, 3).map((t: any) => `${t.label}: ${t.content}`).join(" | ");
                    return (
                        <View key={i} style={styles.tableRow}>
                            <Text style={[styles.tableCellName, styles.tableCellWrap, { width: "35%" }]}>{a?.name || `Ad Set ${a?.id}`}</Text>
                            <Text style={[styles.tableCellValue, { width: "65%", textAlign: "left", fontWeight: "normal" }]}>
                                {targeting || "—"}
                            </Text>
                        </View>
                    );
                })}
            </View>

            <Text style={styles.sectionTitle}>Ad Sets (Detailed)</Text>
            {(adSets || []).slice(0, 25).map((a: any, idx: number) => {
                const id = String(a?.id || "");
                const ads = (adsByAdSetId || {})[id] || [];
                const setMetrics = [
                    { label: "Impressions", value: fmtNum(a?.insights?.impressions || 0), color: "#8b5cf6" },
                    { label: "Clicks", value: fmtNum(a?.insights?.clicks || 0), color: "#10b981" },
                    { label: "Spend", value: fmtMoney(a?.insights?.spend || 0, currency), color: "#059669" },
                    { label: "Leads", value: fmtNum(a?.insights?.oneClickLeads || 0), color: "#f97316" },
                    { label: "Video Views", value: fmtNum(a?.insights?.videoViews || 0), color: "#0ea5e9" },
                    { label: "Status", value: safeShort(a?.status || "—"), color: "#64748b" },
                ];

                return (
                    <View key={`${id}-${idx}`} wrap={false}>
                        <Text style={styles.subSectionTitle}>{safeShort(a?.name || `Ad Set ${id}`)}</Text>
                        <MetricsGrid items={setMetrics} />
                        {Array.isArray(a?.targetingSummary) && a.targetingSummary.length > 0 ? (
                            <TargetingMiniTable title="Targeting" targetingRows={a.targetingSummary} />
                        ) : null}
                        <AdsTable title="Ads (Top)" ads={ads} currency={currency} />
                    </View>
                );
            })}

            <Text style={styles.pageFooter} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} fixed />
        </Page>
    );
};

const ReportEndPage = ({ primaryColor }: { primaryColor: string }) => (
    <Page size="A4" style={styles.endPageContent}>
        <Text style={[styles.thankYouText, { color: primaryColor }]}>Thank you!</Text>
        <View style={styles.contactInfoContainer}>
            <Text style={styles.contactTitle}>For more information</Text>
            <View style={styles.contactRow}>
                <View style={[styles.contactIcon]}>
                    <Svg width={20} height={20} viewBox="0 0 24 24" stroke="#ffffff" strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round">
                        <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <Circle cx={12} cy={10} r={3} />
                    </Svg>
                </View>
                <Text style={{ fontSize: 12, color: "#0EA5E9" }}>AppleWood Adams, Ngong Road</Text>
            </View>
            <View style={styles.contactRow}>
                <View style={[styles.contactIcon]}>
                    <Svg width={20} height={20} viewBox="0 0 24 24" stroke="#ffffff" strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round">
                        <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </Svg>
                </View>
                <Link src="tel:+254777666550" style={styles.contactLink}>
                    +254 777 666 550
                </Link>
            </View>
            <View style={styles.contactRow}>
                <View style={[styles.contactIcon]}>
                    <Svg width={20} height={20} viewBox="0 0 24 24" stroke="#ffffff" strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round">
                        <Path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <Path d="M22 6l-10 7L2 6" />
                    </Svg>
                </View>
                <Link src="mailto:enquiries@nisccloud.com" style={styles.contactLink}>
                    enquiries@nisccloud.com
                </Link>
            </View>
            <View style={styles.contactRow}>
                <View style={[styles.contactIcon]}>
                    <Svg width={20} height={20} viewBox="0 0 24 24" stroke="#ffffff" strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round">
                        <Circle cx={12} cy={12} r={10} />
                        <Line x1={2} y1={12} x2={22} y2={12} />
                        <Path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                    </Svg>
                </View>
                <Link src="https://www.nisccloud.com" style={styles.contactLink}>
                    www.nisccloud.com
                </Link>
            </View>
        </View>
    </Page>
);

export function LinkedInAdsCampaignGroupReportPDF(props: any) {
    return (
        <Document>
            <ReportCoverPage {...props} />
            <ReportContentPage {...props} />
            <ReportEndPage primaryColor={props.primaryColor} />
        </Document>
    );
}

