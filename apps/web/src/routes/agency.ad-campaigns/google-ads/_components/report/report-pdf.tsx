/* eslint-disable jsx-a11y/alt-text */
import React from "react";
import { Document, Page, Text, View, StyleSheet, Image, Link, Svg, Path, Circle, Line, Rect, G } from "@react-pdf/renderer";
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
    tableCellName: { width: "70%", fontSize: 8, color: "#374151", lineHeight: 1.25 },
    tableCellValue: { width: "30%", textAlign: "right", fontSize: 8, color: "#111827", fontWeight: "bold", lineHeight: 1.25 },
    tableCellWrap: { flexWrap: "wrap" },
    tableCellValueLeft: { textAlign: "left", fontWeight: "normal" },

    gridRow: { paddingHorizontal: 40, flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
    gridCol: { width: "48%", marginBottom: 10 },
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
    if (!Number.isFinite(n)) return " ";
    return new Intl.NumberFormat("en-US", { notation: "compact", compactDisplay: "short" }).format(n);
}

function fmtMoney(v: any, currency: string): string {
    const n = typeof v === "string" ? parseFloat(v) : Number(v);
    if (!Number.isFinite(n)) return " ";
    return new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

function asNumber(v: any): number {
    const n = typeof v === "string" ? parseFloat(v) : Number(v);
    return Number.isFinite(n) ? n : 0;
}

function safeShort(s: any): string {
    if (s == null) return " ";
    const v = String(s);
    return v.length ? v : " ";
}

function unwrapArray(v: any): any[] {
    if (!v) return [];
    if (Array.isArray(v)) return v;
    if (Array.isArray(v.data)) return v.data;
    if (Array.isArray(v.data?.data)) return v.data.data;
    if (Array.isArray(v?.result?.data)) return v.result.data;
    return [];
}

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

const BreakdownTable = ({ title, rows, nameKey, valueKey }: { title: string; rows: any[]; nameKey: string; valueKey: string }) => {
    if (!rows || rows.length === 0) return null;
    const sorted = [...rows].sort((a, b) => Number(b[valueKey] || 0) - Number(a[valueKey] || 0)).slice(0, 10);
    return (
        <View style={styles.tableContainer}>
            <Text style={{ fontSize: 11, fontWeight: "bold", color: "#374151", marginBottom: 8 }}>{title}</Text>
            <View style={styles.tableHeader}>
                <Text style={[styles.tableCellName, styles.tableCellWrap]}>{nameKey.replace(/_/g, " ")}</Text>
                <Text style={styles.tableCellValue}>Impr.</Text>
            </View>
            {sorted.map((r, i) => (
                <View key={i} style={styles.tableRow}>
                    <Text style={[styles.tableCellName, styles.tableCellWrap]}>{String(r[nameKey] ?? "Unknown")}</Text>
                    <Text style={styles.tableCellValue}>{fmtNum(r[valueKey] ?? 0)}</Text>
                </View>
            ))}
        </View>
    );
};

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
    return (
        <View style={styles.tableContainer}>
            <Text style={{ fontSize: 11, fontWeight: "bold", color: "#374151", marginBottom: 8 }}>{title}</Text>
            <View style={styles.tableHeader}>
                <Text style={[styles.tableCellName, styles.tableCellWrap]}>{headerLeft}</Text>
                <Text style={styles.tableCellValue}>{headerRight}</Text>
            </View>
            {rows.map((r, i) => (
                <View key={i} style={styles.tableRow}>
                    <Text style={[styles.tableCellName, styles.tableCellWrap]}>{r.left}</Text>
                    <Text style={styles.tableCellValue}>{r.right}</Text>
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
        .slice(0, 8);

    if (!rows.length) return null;

    return (
        <View style={styles.tableContainer}>
            <Text style={{ fontSize: 11, fontWeight: "bold", color: "#374151", marginBottom: 8 }}>{title}</Text>
            <View style={styles.tableHeader}>
                <Text style={[styles.tableCellName, styles.tableCellWrap, { width: "44%" }]}>Ad</Text>
                <Text style={[styles.tableCellValue, { width: "14%" }]}>Clicks</Text>
                <Text style={[styles.tableCellValue, { width: "14%" }]}>Impr.</Text>
                <Text style={[styles.tableCellValue, { width: "14%" }]}>Spend</Text>
                <Text style={[styles.tableCellValue, { width: "14%" }]}>Conv.</Text>
            </View>
            {rows.map((a, i) => (
                <View key={i} style={styles.tableRow}>
                    <Text style={[styles.tableCellName, styles.tableCellWrap, { width: "44%" }]}>
                        {safeShort(a?.name || `Ad ${a?.id}`)}
                    </Text>
                    <Text style={[styles.tableCellValue, { width: "14%" }]}>{fmtNum(a?.insights?.clicks || 0)}</Text>
                    <Text style={[styles.tableCellValue, { width: "14%" }]}>{fmtNum(a?.insights?.impressions || 0)}</Text>
                    <Text style={[styles.tableCellValue, { width: "14%" }]}>{fmtMoney(a?.insights?.cost || 0, currency)}</Text>
                    <Text style={[styles.tableCellValue, { width: "14%" }]}>{fmtNum(a?.insights?.conversions || 0)}</Text>
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
    const rows = (targetingRows || []).slice(0, 8);
    if (!rows.length) return null;

    return (
        <View style={styles.tableContainer}>
            <Text style={{ fontSize: 11, fontWeight: "bold", color: "#374151", marginBottom: 8 }}>{title}</Text>
            <View style={styles.tableHeader}>
                <Text style={[styles.tableCellName, styles.tableCellWrap]}>Criterion</Text>
                <Text style={[styles.tableCellValue, styles.tableCellWrap]}>Value</Text>
            </View>
            {rows.map((t, i) => (
                <View key={i} style={styles.tableRow}>
                    <Text style={[styles.tableCellName, styles.tableCellWrap]}>{safeShort(t.label)}</Text>
                    <Text style={[styles.tableCellValue, styles.tableCellWrap, styles.tableCellValueLeft]}>{safeShort(t.content)}</Text>
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
    const globalMax = Math.max(
        1,
        ...series.map((s) => maxFor(s.key))
    );

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

const HourlyBarChart = ({ title, rows, primaryColor }: { title: string; rows: any[]; primaryColor: string }) => {
    if (!rows || rows.length === 0) return null;

    const hours = Array.from({ length: 24 }, (_, h) => ({ hour: h, impressions: 0 }));
    for (const r of rows) {
        const h = Number(r?.hour);
        if (Number.isFinite(h) && h >= 0 && h < 24) {
            hours[h].impressions += Number(r?.impressions || 0);
        }
    }

    const width = 480;
    const height = 140;
    const paddingL = 40;
    const paddingR = 15;
    const paddingT = 20;
    const paddingB = 35;
    const max = Math.max(...hours.map((h) => h.impressions), 1);
    const slot = (width - paddingL - paddingR) / 24;

    return (
        <View style={styles.chartContainer} wrap={false}>
            <Text style={{ fontSize: 11, fontWeight: "bold", color: "#374151", marginBottom: 8 }}>{title}</Text>
            <Svg height={height} width="100%">
                <Line x1={paddingL} y1={height - paddingB} x2={width - paddingR} y2={height - paddingB} stroke="#d1d5db" strokeWidth={0.8} />
                {hours.map((d, i) => {
                    const barW = Math.max(2, slot - 2);
                    const x = paddingL + i * slot + 1;
                    const barH = (d.impressions / max) * (height - paddingB - paddingT);
                    const y = height - paddingB - barH;
                    return <Rect key={i} x={x} y={y} width={barW} height={barH} fill={primaryColor} opacity={0.8} rx={1} />;
                })}
                {hours.map((_, i) => {
                    if (i % 4 !== 0 && i !== 23) return null;
                    const x = paddingL + i * slot + slot / 2;
                    return (
                        <Text key={i} x={x} y={height - 18} textAnchor="middle" style={{ fontSize: 6 }} fill="#9ca3af">
                            {i}
                        </Text>
                    );
                })}
            </Svg>
        </View>
    );
};

const DayOfWeekBarChart = ({ title, rows, primaryColor }: { title: string; rows: any[]; primaryColor: string }) => {
    if (!rows || rows.length === 0) return null;

    const order = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];
    const map = new Map<string, number>();
    for (const r of rows) {
        const k = String(r?.dayOfWeek || "UNKNOWN");
        map.set(k, (map.get(k) || 0) + Number(r?.impressions || 0));
    }
    const data = order.map((d) => ({ day: d, impressions: map.get(d) || 0 }));
    const max = Math.max(...data.map((d) => d.impressions), 1);

    return (
        <View style={styles.chartContainer} wrap={false}>
            <Text style={{ fontSize: 11, fontWeight: "bold", color: "#374151", marginBottom: 8 }}>{title}</Text>
            <View style={{ paddingHorizontal: 40 }}>
                {data.map((d, i) => {
                    const pct = (d.impressions / max) * 100;
                    return (
                        <View key={i} style={{ marginBottom: 6 }}>
                            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 2 }}>
                                <Text style={{ fontSize: 8, color: "#374151", fontWeight: "bold" }}>{d.day.slice(0, 3)}</Text>
                                <Text style={{ fontSize: 8, color: "#111827", fontWeight: "bold" }}>{fmtNum(d.impressions)}</Text>
                            </View>
                            <View style={{ height: 6, width: "100%", backgroundColor: "#f3f4f6", borderRadius: 3 }}>
                                <View style={{ height: "100%", width: `${pct}%`, backgroundColor: primaryColor, borderRadius: 3 }} />
                            </View>
                        </View>
                    );
                })}
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
        .slice(0, 8);
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

const VerticalBarBreakdown = ({
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
        .filter((d) => d.value > 0 && d.name.toLowerCase() !== "unknown")
        .slice(0, 8);
    if (!data.length) return null;
    const max = Math.max(...data.map((d) => d.value), 1);

    const width = 480;
    const height = 160;
    const paddingL = 24;
    const paddingR = 10;
    const paddingT = 18;
    const paddingB = 44;
    const slot = (width - paddingL - paddingR) / data.length;
    const barW = Math.max(10, slot - 10);

    return (
        <View style={styles.chartContainer} wrap={false}>
            <Text style={{ fontSize: 11, fontWeight: "bold", color: "#374151", marginBottom: 8 }}>{title}</Text>
            <Svg height={height} width="100%">
                <Line x1={paddingL} y1={height - paddingB} x2={width - paddingR} y2={height - paddingB} stroke="#d1d5db" strokeWidth={0.8} />
                {data.map((d, i) => {
                    const barH = (d.value / max) * (height - paddingB - paddingT);
                    const x = paddingL + i * slot + (slot - barW) / 2;
                    const y = height - paddingB - barH;
                    return <Rect key={i} x={x} y={y} width={barW} height={barH} fill={barColor} rx={2} />;
                })}
                {data.map((d, i) => {
                    const x = paddingL + i * slot + slot / 2;
                    return (
                        <Text key={i} x={x} y={height - 24} textAnchor="middle" style={{ fontSize: 6 }} fill="#6b7280">
                            {d.name.length > 10 ? `${d.name.slice(0, 10)}…` : d.name}
                        </Text>
                    );
                })}
            </Svg>
        </View>
    );
};

const ReportCoverPage = (props: any) => {
    const { campaign, timeRange, primaryColor, accountName } = props;
    return (
        <Page size="A4" style={[styles.page, { backgroundColor: primaryColor }]}>
            <View style={styles.coverPage}>
                <View style={styles.logoContainer}>
                    <Image src="/nisclogowhite.png" style={styles.logo} />
                </View>
                <View style={styles.coverContent}>
                    <Text style={styles.campaignTitle}>{campaign?.name || "Google Ads Report"}</Text>
                    <Text style={styles.periodText}>
                        Period: {fmtDate(timeRange.since)} - {fmtDate(timeRange.until)}
                    </Text>
                    {accountName ? <Text style={styles.accountNameText}>Account: {accountName}</Text> : null}
                    <Text style={styles.coverSubtitle}>
                        A clean summary of campaign performance, targeting, and audience delivery to help you evaluate outcomes and optimize future spend.
                    </Text>
                </View>
                <View style={styles.createdByContainer}>
                    <Text style={styles.createdByLabel}>Report Generated by:</Text>
                    <Text style={styles.createdByText}>Nisc Cloud</Text>
                </View>
                <View style={styles.disclaimerContainer}>
                    <Text style={styles.disclaimerText}>
                        This report summarizes performance for the selected time range. Some Google Ads metrics vary by channel type and reporting availability.
                    </Text>
                </View>
            </View>
        </Page>
    );
};

const ReportContentPage = (props: any) => {
    const {
        campaign,
        timeRange,
        currency,
        campaignTargeting,
        adGroups,
        dailyPerformance,
        breakdowns,
        primaryColor,
        keywordsPerformance,
        networkBreakdown,
        timeOfDayBreakdown,
        adGroupTargetingById,
        adsByAdGroupId,
    } = props;
    const insights = campaign?.insights || {};
    const keywordsRows = unwrapArray(keywordsPerformance);
    const searchTermsRows = unwrapArray(breakdowns?.search_terms);
    const networkRows = unwrapArray(networkBreakdown);
    const timeRows = unwrapArray(timeOfDayBreakdown);

    const metrics = [
        { label: "Impressions", value: fmtNum(insights.impressions || 0), color: "#8b5cf6" },
        { label: "Clicks", value: fmtNum(insights.clicks || 0), color: "#10b981" },
        { label: "Spend", value: fmtMoney(insights.cost || 0, currency), color: "#059669" },
        { label: "CTR", value: `${Number(insights.ctr || 0).toFixed(2)}%`, color: "#6366f1" },
        { label: "Conversions", value: fmtNum(insights.conversions || 0), color: "#f97316" },
        { label: "Conv. Value", value: fmtMoney(insights.conversions_value || 0, currency), color: "#0ea5e9" },
        { label: "Interactions", value: fmtNum(insights.interactions || 0), color: "#a855f7" },
        { label: "Interaction Rate", value: insights.interaction_rate ? `${Number(insights.interaction_rate).toFixed(2)}%` : " ", color: "#7c3aed" },
        { label: "Avg CPC", value: fmtMoney(insights.cpc || 0, currency), color: "#fb923c" },
    ];

    return (
        <Page size="A4" style={styles.page}>
            <View style={styles.header} fixed>
                <Text style={[styles.headerTitle, { color: primaryColor }]}>{campaign?.name || "Google Ads Campaign Report"}</Text>
                <Text style={styles.headerDate}>
                    {fmtDate(timeRange.since)} - {fmtDate(timeRange.until)}
                </Text>
            </View>

            <Text style={styles.sectionTitle}>Campaign Performance Overview</Text>
            <MetricsGrid items={metrics} />

            <Text style={styles.sectionTitle}>Targeting Summary</Text>
            <View style={styles.tableContainer}>
                <View style={styles.tableHeader}>
                    <Text style={[styles.tableCellName, styles.tableCellWrap]}>Criterion</Text>
                    <Text style={[styles.tableCellValue, styles.tableCellWrap]}>Value</Text>
                </View>
                {(campaignTargeting || []).slice(0, 12).map((t: any, i: number) => (
                    <View key={i} style={styles.tableRow}>
                        <Text style={[styles.tableCellName, styles.tableCellWrap]}>{safeShort(t.label)}</Text>
                        <Text style={[styles.tableCellValue, styles.tableCellWrap, styles.tableCellValueLeft]}>{safeShort(t.content)}</Text>
                    </View>
                ))}
                {(!campaignTargeting || campaignTargeting.length === 0) && (
                    <View style={styles.tableRow}>
                        <Text style={[styles.tableCellName, styles.tableCellWrap]}>No targeting data available</Text>
                        <Text style={styles.tableCellValue}> </Text>
                    </View>
                )}
            </View>

            <Text style={styles.sectionTitle}>Ad Groups</Text>
            <View style={styles.tableContainer}>
                <View style={styles.tableHeader}>
                    <Text style={[styles.tableCellName, styles.tableCellWrap, { width: "55%" }]}>Ad group</Text>
                    <Text style={[styles.tableCellValue, { width: "15%" }]}>Clicks</Text>
                    <Text style={[styles.tableCellValue, { width: "15%" }]}>Impr.</Text>
                    <Text style={[styles.tableCellValue, { width: "15%" }]}>Spend</Text>
                </View>
                {(adGroups || []).slice(0, 12).map((g: any, i: number) => (
                    <View key={i} style={styles.tableRow}>
                        <Text style={[styles.tableCellName, styles.tableCellWrap, { width: "55%" }]}>{safeShort(g?.name || `Ad Group ${g?.id}`)}</Text>
                        <Text style={[styles.tableCellValue, { width: "15%" }]}>{fmtNum(g?.insights?.clicks || 0)}</Text>
                        <Text style={[styles.tableCellValue, { width: "15%" }]}>{fmtNum(g?.insights?.impressions || 0)}</Text>
                        <Text style={[styles.tableCellValue, { width: "15%" }]}>{fmtMoney(g?.insights?.cost || 0, currency)}</Text>
                    </View>
                ))}
                {(!adGroups || adGroups.length === 0) && (
                    <View style={styles.tableRow}>
                        <Text style={[styles.tableCellName, styles.tableCellWrap]}>No ad groups found</Text>
                        <Text style={styles.tableCellValue}> </Text>
                    </View>
                )}
            </View>

            {/* Ad group → ad breakdowns (report hierarchy) */}
            <Text style={styles.sectionTitle}>Ad Groups & Ads</Text>
            {(adGroups || []).slice(0, 8).map((g: any, idx: number) => {
                const id = String(g?.id || "");
                const groupTargeting = (adGroupTargetingById?.[id]?.data || []) as Array<{ label: string; content: string }>;
                const groupAds = (adsByAdGroupId?.[id] || []) as any[];

                return (
                    <View key={id || idx}>
                        <Text style={[styles.subSectionTitle, { paddingHorizontal: 40 }]}>
                            {safeShort(g?.name || `Ad Group ${id}`)}
                        </Text>
                        {groupTargeting?.length ? (
                            <TargetingMiniTable title="Ad Group Targeting" targetingRows={groupTargeting} />
                        ) : null}
                        <AdsTable title="Ads (Top)" ads={groupAds} currency={currency} />
                    </View>
                );
            })}

            <Text style={styles.sectionTitle}>Audience & Delivery</Text>
            <View style={styles.gridRow}>
                {breakdowns?.gender?.data ? (
                    <View style={styles.gridCol}>
                        <BreakdownTable title="Gender" rows={breakdowns.gender.data} nameKey="gender" valueKey="impressions" />
                    </View>
                ) : null}
                {breakdowns?.device?.data ? (
                    <View style={styles.gridCol}>
                        <BreakdownTable title="Devices" rows={breakdowns.device.data} nameKey="device" valueKey="impressions" />
                    </View>
                ) : null}
                {breakdowns?.age_range?.data ? (
                    <View style={styles.gridCol}>
                        <BreakdownTable title="Age Groups" rows={breakdowns.age_range.data} nameKey="age_range" valueKey="impressions" />
                    </View>
                ) : null}
                {breakdowns?.region?.data ? (
                    <View style={styles.gridCol}>
                        <BreakdownTable title="Regions" rows={breakdowns.region.data} nameKey="region" valueKey="impressions" />
                    </View>
                ) : null}
            </View>

            {/* Graphs (match campaign details page) */}
            <Text style={styles.sectionTitle}>Audience & Delivery (Charts)</Text>
            {breakdowns?.gender?.data ? (
                <PieBreakdownChart
                    title="Gender"
                    rows={unwrapArray(breakdowns.gender)}
                    nameKey="gender"
                    valueKey="impressions"
                    colors={["#3b82f6", "#ec4899", "#a855f7", "#22c55e", "#f97316"]}
                />
            ) : null}
            {breakdowns?.device?.data ? (
                <HorizontalBarBreakdown
                    title="Devices"
                    rows={unwrapArray(breakdowns.device)}
                    nameKey="device"
                    valueKey="impressions"
                    barColor="#10b981"
                />
            ) : null}
            {breakdowns?.age_range?.data ? (
                <VerticalBarBreakdown
                    title="Age Groups"
                    rows={unwrapArray(breakdowns.age_range)}
                    nameKey="age_range"
                    valueKey="impressions"
                    barColor="#8b5cf6"
                />
            ) : null}
            {networkBreakdown?.data?.data ? (
                <PieBreakdownChart
                    title="Network Breakdown"
                    rows={unwrapArray(networkBreakdown)}
                    nameKey="network"
                    valueKey="impressions"
                    colors={["#6366f1", "#22c55e", "#f97316", "#a855f7", "#3b82f6"]}
                />
            ) : null}

            <Text style={styles.sectionTitle}>Daily Activity</Text>
            <DailyLineChart
                title="Daily Spend"
                data={dailyPerformance || []}
                series={[{ key: "spend", label: "Spend", color: primaryColor }]}
            />
            <DailyLineChart
                title="Daily Impressions & Clicks"
                data={dailyPerformance || []}
                series={[
                    { key: "impressions", label: "Impressions", color: "#8b5cf6" },
                    { key: "clicks", label: "Clicks", color: "#10b981" },
                ]}
                sharedScale
            />

            {networkRows.length ? (
                <BreakdownTable title="Network Breakdown" rows={networkRows} nameKey="network" valueKey="impressions" />
            ) : null}

            {keywordsRows.length ? (
                <View style={styles.tableContainer}>
                    <Text style={{ fontSize: 11, fontWeight: "bold", color: "#374151", marginBottom: 8 }}>
                        Keywords & Search Intent (Top Keywords)
                    </Text>
                    <View style={styles.tableHeader}>
                        <Text style={[styles.tableCellName, styles.tableCellWrap, { width: "40%" }]}>Keyword</Text>
                        <Text style={[styles.tableCellValue, { width: "12%" }]}>Impr.</Text>
                        <Text style={[styles.tableCellValue, { width: "12%" }]}>Clicks</Text>
                        <Text style={[styles.tableCellValue, { width: "12%" }]}>CTR</Text>
                        <Text style={[styles.tableCellValue, { width: "12%" }]}>Spend</Text>
                        <Text style={[styles.tableCellValue, { width: "12%" }]}>Conv.</Text>
                    </View>
                    {keywordsRows.slice(0, 12).map((k: any, i: number) => (
                        <View key={i} style={styles.tableRow}>
                            <Text style={[styles.tableCellName, styles.tableCellWrap, { width: "40%" }]}>
                                {safeShort(k.keyword)}{k.matchType ? ` • ${safeShort(k.matchType)}` : ""}
                            </Text>
                            <Text style={[styles.tableCellValue, { width: "12%" }]}>{fmtNum(k.impressions || 0)}</Text>
                            <Text style={[styles.tableCellValue, { width: "12%" }]}>{fmtNum(k.clicks || 0)}</Text>
                            <Text style={[styles.tableCellValue, { width: "12%" }]}>{safeShort(k.ctr)}%</Text>
                            <Text style={[styles.tableCellValue, { width: "12%" }]}>{fmtMoney(k.spend || 0, currency)}</Text>
                            <Text style={[styles.tableCellValue, { width: "12%" }]}>{fmtNum(k.conversions || 0)}</Text>
                        </View>
                    ))}
                </View>
            ) : null}

            {searchTermsRows.length ? (
                <SimpleTable
                    title="Search Terms / Intent (Top)"
                    headerLeft="Search term"
                    headerRight="Impr."
                    rows={searchTermsRows.map((t: any) => ({
                        left: safeShort(t.term),
                        right: fmtNum(t.impressions || 0),
                    }))}
                />
            ) : null}

            {searchTermsRows.length ? (
                <SimpleTable
                    title="Search Performance (Top Terms)"
                    headerLeft="Term"
                    headerRight="Clicks"
                    rows={searchTermsRows.map((t: any) => ({
                        left: `${safeShort(t.term)}  •  Impr: ${fmtNum(t.impressions || 0)}  •  Spend: ${fmtMoney(t.spend || 0, currency)}`,
                        right: fmtNum(t.clicks || 0),
                    }))}
                />
            ) : null}

            {timeRows.length ? (
                <>
                    <Text style={styles.sectionTitle}>Hourly Distribution</Text>
                    <HourlyBarChart title="Impressions by Hour" rows={timeRows} primaryColor={primaryColor} />
                    <Text style={styles.sectionTitle}>Day Distribution</Text>
                    <DayOfWeekBarChart title="Impressions by Day of Week" rows={timeRows} primaryColor={primaryColor} />
                </>
            ) : null}

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

export function GoogleAdsCampaignReportPDF(props: any) {
    return (
        <Document>
            <ReportCoverPage {...props} />
            <ReportContentPage {...props} />
            <ReportEndPage primaryColor={props.primaryColor} />
        </Document>
    );
}

