/* eslint-disable jsx-a11y/alt-text */
import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image, Svg, Path, Line, G, Circle, Rect, Link } from '@react-pdf/renderer';
import { format } from 'date-fns';

// Styles - Completely redesigned for better spacing and professional appearance
const styles = StyleSheet.create({
    page: {
        backgroundColor: '#ffffff',
        fontFamily: 'Helvetica',
        paddingTop: 50,
        paddingBottom: 65,
        paddingLeft: 0,
        paddingRight: 0,
    },
    // Cover Page (Unchanged)
    coverPage: {
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
    },
    logoContainer: {
        position: 'absolute',
        top: 40,
        right: 40,
        width: 220,
        height: 90,
    },
    logo: {
        width: '100%',
        height: '100%',
        objectFit: 'contain',
    },
    coverContent: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    campaignTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#ffffff',
        textAlign: 'center',
        marginBottom: 10,
    },
    periodText: {
        fontSize: 14,
        color: '#ffffff',
        textAlign: 'center',
        marginBottom: 20,
        opacity: 0.9,
    },
    objectiveContainer: {
        marginTop: 20,
        padding: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 8,
    },
    accountNameContainer: {
        marginTop: 10,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    accountNameText: {
        fontSize: 14,
        color: '#ffffff',
        fontWeight: 'bold',
        opacity: 0.9,
    },
    objectiveText: {
        fontSize: 12,
        color: '#ffffff',
        textAlign: 'center',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    createdByContainer: {
        position: 'absolute',
        bottom: 120,
        left: 0,
        right: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
    },
    createdByLabel: {
        fontSize: 10,
        color: '#ffffff',
        opacity: 0.8,
        marginBottom: 4,
    },
    createdByText: {
        fontSize: 14,
        color: '#ffffff',
        fontWeight: 'bold',
    },
    disclaimerContainer: {
        position: 'absolute',
        bottom: 40,
        left: 40,
        right: 40,
    },
    disclaimerText: {
        fontSize: 8,
        color: '#ffffff',
        opacity: 0.6,
        textAlign: 'center',
        lineHeight: 1.4,
    },
    // Header
    header: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#ffffff',
    },
    headerTitle: {
        fontSize: 9,
        color: '#4b5563',
        fontWeight: 'bold',
    },
    headerDate: {
        fontSize: 8,
        color: '#9ca3af',
    },
    // Sections
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 12,
        marginTop: 15,
        paddingHorizontal: 40,
    },
    subSectionTitle: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#374151',
        marginBottom: 8,
        marginTop: 8,
    },
    // NEW: Compact 3-column Metric Cards
    metricsGrid: {
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 40,
        marginBottom: 12,
    },
    metricCard: {
        width: '31.5%',
        padding: 8,
        backgroundColor: '#f9fafb',
        borderRadius: 4,
        borderLeftWidth: 3,
        borderLeftColor: '#6366f1',
        marginBottom: 6,
    },
    metricLabel: {
        fontSize: 7,
        color: '#6b7280',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 3,
    },
    metricValue: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#111827',
    },
    // Compact metrics for nested sections (ads, ad sets)
    metricsGridCompact: {
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 6,
    },
    metricCardCompact: {
        width: '24%',
        padding: 4,
        backgroundColor: '#f3f4f6',
        borderRadius: 3,
        borderLeftWidth: 2,
        borderLeftColor: '#8b5cf6',
        marginBottom: 4,
    },
    metricLabelCompact: {
        fontSize: 6,
        color: '#6b7280',
        textTransform: 'uppercase',
        marginBottom: 2,
    },
    metricValueCompact: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    // Tables
    tableContainer: {
        paddingHorizontal: 40,
        marginBottom: 12,
    },
    tableHeader: {
        flexDirection: 'row',
        borderBottomColor: '#d1d5db',
        borderBottomWidth: 1.5,
        backgroundColor: '#f3f4f6',
        paddingVertical: 6,
        paddingHorizontal: 8,
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomColor: '#e5e7eb',
        borderBottomWidth: 0.5,
        paddingVertical: 5,
        paddingHorizontal: 8,
    },
    tableCellName: {
        width: '50%',
        fontSize: 8,
        color: '#374151',
    },
    tableCellValue: {
        width: '25%',
        textAlign: 'right',
        fontSize: 8,
        color: '#1f2937',
        fontWeight: 'bold',
    },
    // Charts
    chartContainer: {
        paddingHorizontal: 40,
        marginBottom: 15,
    },
    // NEW: Streamlined Ad Hierarchy
    adSetContainer: {
        paddingHorizontal: 40,
        marginBottom: 15,
    },
    adSetHeader: {
        backgroundColor: '#f3f4f6',
        padding: 10,
        borderRadius: 4,
        borderLeftWidth: 4,
        borderLeftColor: '#6366f1',
        marginBottom: 8,
    },
    adSetTitle: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 3,
    },
    adSetMeta: {
        fontSize: 7,
        color: '#6b7280',
        marginBottom: 1,
    },
    // Targeting - More compact
    targetingBlock: {
        marginBottom: 10,
        paddingLeft: 8,
        borderLeftWidth: 2,
        borderLeftColor: '#e5e7eb',
    },
    targetingLabel: {
        fontSize: 8,
        fontWeight: 'bold',
        color: '#374151',
        marginTop: 4,
        marginBottom: 2,
    },
    targetingContent: {
        fontSize: 7,
        color: '#6b7280',
        lineHeight: 1.3,
    },
    // Ads List - Simplified
    adsContainer: {
        marginTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
        paddingTop: 8,
    },
    adRow: {
        marginBottom: 8,
        padding: 8,
        backgroundColor: '#fafafa',
        borderRadius: 3,
        borderWidth: 0.5,
        borderColor: '#e5e7eb',
    },
    adName: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 2,
    },
    adMeta: {
        fontSize: 7,
        color: '#6b7280',
        marginBottom: 4,
    },
    // Footer
    pageFooter: {
        position: 'absolute',
        bottom: 20,
        left: 0,
        right: 0,
        textAlign: 'center',
        fontSize: 8,
        color: '#9ca3af',
    },
    endPageContent: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
    },
    thankYouText: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 40,
        fontFamily: 'Helvetica',
    },
    contactInfoContainer: {
        padding: 30,
        backgroundColor: '#ffffff',
        borderRadius: 16,
        width: '80%',
        alignItems: 'flex-start',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 10,
    },
    contactTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, color: '#1a1a1a' },
    contactRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    contactIcon: { width: 24, height: 24, marginRight: 12, alignItems: 'center', justifyContent: 'center' },
    contactText: { fontSize: 12, color: '#0EA5E9', textDecoration: 'none' },
    contactLink: { fontSize: 12, color: '#0EA5E9', textDecoration: 'none' },
});

interface MetaAdsReportProps {
    campaign: any;
    insights: any;
    dailyPerformance: any[];
    adSets: any[];
    breakdowns: {
        gender: any;
        platform: any;
        device: any;
        region: any;
        placement: any;
    };
    timeRange: {
        since: string;
        until: string;
    };
    primaryColor: string;
    currency: string;
    accountName?: string;
}

const formatDate = (dateString: string) => {
    try {
        if (!dateString) return '';
        return format(new Date(dateString), 'MMM dd, yyyy');
    } catch (e) {
        return dateString;
    }
};

const formatCampaignPeriod = (campaign: any, timeRange: any) => {
    const start = campaign?.start_time || timeRange.since;
    const end = campaign?.stop_time || campaign?.end_time;

    if (start && end) {
        return `${formatDate(start)} - ${formatDate(end)}`;
    } else if (start) {
        return `${formatDate(start)} - Ongoing`;
    }
    return `${formatDate(timeRange.since)} - ${formatDate(timeRange.until)}`;
};

const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
};

const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short" }).format(num);
};

const formatPercentage = (num: number) => {
    return num < 1 ? `${(num * 100).toFixed(2)}%` : `${num.toFixed(2)}%`;
};

// --- Helper Components - REDESIGNED ---

const MetricCard = ({ label, value, color, compact = false }: { label: string, value: string, color: string, compact?: boolean }) => (
    <View style={[
        compact ? styles.metricCardCompact : styles.metricCard,
        { borderLeftColor: color }
    ]}>
        <Text style={compact ? styles.metricLabelCompact : styles.metricLabel}>{label}</Text>
        <Text style={compact ? styles.metricValueCompact : styles.metricValue}>{value}</Text>
    </View>
);

const MetricsGrid = ({ insights, currency, compact = false }: { insights: any, currency: string, compact?: boolean }) => {
    const getValue = (k: string) => insights?.[k] || 0;
    const num = (v: any) => formatNumber(typeof v === 'string' ? parseFloat(v) : v);
    const curr = (v: any) => formatCurrency(typeof v === 'string' ? parseFloat(v) : v, currency);
    const pct = (v: any) => formatPercentage(typeof v === 'string' ? parseFloat(v) : v);

    const imp = parseFloat(getValue('impressions') || '0');
    const clicks = parseFloat(getValue('clicks') || '0');
    const spend = parseFloat(getValue('spend') || '0');

    const ctrAllVal = (imp > 0 && clicks > 0) ? (clicks / imp) * 100 : 0;
    const cpcAllVal = (clicks > 0 && spend > 0) ? (spend / clicks) : 0;

    // Color palette for different metric types
    const colors = {
        blue: '#3b82f6',
        purple: '#8b5cf6',
        green: '#10b981',
        orange: '#f97316',
        indigo: '#6366f1',
    };

    // Full metrics for campaign level
    const fullMetricsList = [
        { label: 'Impressions', value: num(getValue('impressions')), color: colors.purple },
        { label: 'Reach', value: num(getValue('reach')), color: colors.blue },
        { label: 'Frequency', value: num(getValue('frequency')), color: colors.blue },
        { label: 'Amount Spent', value: curr(getValue('spend')), color: colors.green },
        { label: 'CPM', value: curr(getValue('cpm')), color: colors.indigo },
        { label: 'Cost per Result', value: curr(getValue('cost_per_result')), color: colors.orange },
        { label: 'Link Clicks', value: num(getValue('link_clicks')), color: colors.green },
        { label: 'CPC (Link)', value: curr(getValue('cpc')), color: colors.orange },
        { label: 'CTR (Link)', value: pct(getValue('ctr')), color: colors.indigo },
        { label: 'Unique Clicks', value: num(getValue('unique_clicks')), color: colors.green },
        { label: 'Unique CTR', value: pct(getValue('unique_ctr')), color: colors.indigo },
        { label: 'Clicks (All)', value: num(clicks), color: colors.green },
        { label: 'CTR (All)', value: pct(ctrAllVal), color: colors.indigo },
        { label: 'CPC (All)', value: curr(cpcAllVal), color: colors.orange },
        { label: 'Purchase ROAS', value: num(getValue('purchase_roas')), color: colors.green },
    ];

    // Compact metrics for nested sections (ad sets and ads) - only 8 key metrics
    const compactMetricsList = [
        { label: 'Impressions', value: num(getValue('impressions')), color: colors.purple },
        { label: 'Reach', value: num(getValue('reach')), color: colors.blue },
        { label: 'Spent', value: curr(getValue('spend')), color: colors.green },
        { label: 'CPM', value: curr(getValue('cpm')), color: colors.indigo },
        { label: 'Link Clicks', value: num(getValue('link_clicks')), color: colors.green },
        { label: 'CPC', value: curr(getValue('cpc')), color: colors.orange },
        { label: 'CTR', value: pct(getValue('ctr')), color: colors.indigo },
        { label: 'ROAS', value: num(getValue('purchase_roas')), color: colors.green },
    ];

    const metricsList = compact ? compactMetricsList : fullMetricsList;

    if (!insights) return <Text style={{ fontSize: 8, color: '#9ca3af' }}>No metrics available</Text>;

    return (
        <View style={compact ? styles.metricsGridCompact : styles.metricsGrid}>
            {metricsList.map((m, i) => (
                <MetricCard
                    key={i}
                    label={m.label}
                    value={m.value}
                    color={m.color}
                    compact={compact}
                />
            ))}
        </View>
    );
}

const BreakdownTable = ({ title, data, primaryColor, nameKey = 'name', valueKey = 'value' }: any) => {
    if (!data || data.length === 0) return null;
    const sortedData = [...data]
        .sort((a, b) => (parseInt(b[valueKey] || 0) - parseInt(a[valueKey] || 0)))
        .slice(0, 8); // Reduced from 10 to 8 for better spacing
    const totalValue = sortedData.reduce((acc, curr) => acc + parseInt(curr[valueKey] || 0), 0);
    const maxValue = Math.max(...sortedData.map(d => parseInt(d[valueKey] || 0)));

    return (
        <View style={styles.tableContainer} wrap={false}>
            <Text style={styles.subSectionTitle}>{title}</Text>
            <View style={styles.tableHeader}>
                <Text style={styles.tableCellName}>{nameKey.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</Text>
                <Text style={styles.tableCellValue}>Impressions</Text>
                <Text style={{ width: '25%', fontSize: 8, textAlign: 'right' }}>Share</Text>
            </View>
            {sortedData.map((item, index) => {
                const value = parseInt(item[valueKey] || 0);
                const share = totalValue > 0 ? (value / totalValue) * 100 : 0;
                const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;

                return (
                    <View key={index} style={styles.tableRow}>
                        <Text style={styles.tableCellName}>{item[nameKey] || 'Unknown'}</Text>
                        <Text style={styles.tableCellValue}>{formatNumber(value)}</Text>
                        <View style={{ width: '25%', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' }}>
                            <View style={{ width: 40, height: 3, backgroundColor: '#e5e7eb', marginRight: 4, borderRadius: 2 }}>
                                <View style={{ width: `${percentage}%`, height: '100%', backgroundColor: primaryColor, borderRadius: 2 }} />
                            </View>
                            <Text style={{ fontSize: 7, color: '#6b7280' }}>{share.toFixed(1)}%</Text>
                        </View>
                    </View>
                );
            })}
        </View>
    );
};

// SVG Charts - Optimized sizes
const GenderPieChart = ({ data }: { data: any[] }) => {
    if (!data || data.length === 0) return null;

    const validData = data
        .filter(d => d.gender !== 'unknown' && parseInt(d.impressions) > 0)
        .map(d => ({ label: d.gender, value: parseInt(d.impressions) }));

    const allZero = validData.every(d => d.value === 0);
    if (allZero || validData.length === 0) return null;

    const total = validData.reduce((acc, curr) => acc + curr.value, 0);
    let startAngle = 0;
    const colors = ['#3b82f6', '#ec4899', '#a855f7'];

    const size = 100;
    const cx = size / 2;
    const cy = size / 2;
    const outerRadius = 35;
    const innerRadius = 25;

    return (
        <View style={[styles.chartContainer, { alignItems: 'center' }]} wrap={false}>
            <Text style={styles.subSectionTitle}>Gender Distribution</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
                <Svg height={size} width={size}>
                    {validData.map((slice, i) => {
                        const angle = (slice.value / total) * 360;
                        const endAngle = startAngle + angle;
                        const startRad = (startAngle - 90) * Math.PI / 180;
                        const endRad = (endAngle - 90) * Math.PI / 180;

                        const x1_out = cx + outerRadius * Math.cos(startRad);
                        const y1_out = cy + outerRadius * Math.sin(startRad);
                        const x2_out = cx + outerRadius * Math.cos(endRad);
                        const y2_out = cy + outerRadius * Math.sin(endRad);

                        const x1_in = cx + innerRadius * Math.cos(endRad);
                        const y1_in = cy + innerRadius * Math.sin(endRad);
                        const x2_in = cx + innerRadius * Math.cos(startRad);
                        const y2_in = cy + innerRadius * Math.sin(startRad);

                        const largeArc = angle > 180 ? 1 : 0;

                        const pathData = [
                            `M ${x1_out} ${y1_out}`,
                            `A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x2_out} ${y2_out}`,
                            `L ${x1_in} ${y1_in}`,
                            `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x2_in} ${y2_in}`,
                            `Z`
                        ].join(' ');

                        startAngle += angle;
                        return <Path key={i} d={pathData} fill={colors[i % colors.length]} />;
                    })}
                    {/* Center Text for total (similar to UI) */}
                    <Text
                        x={cx}
                        y={cy + 3}
                        textAnchor="middle"
                        style={{ fontSize: 8, fontWeight: 'bold' }}
                        fill="#111827"
                    >
                        {formatNumber(total)}
                    </Text>
                </Svg>
                <View style={{ marginLeft: 20 }}>
                    {validData.map((slice, i) => (
                        <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
                            <View style={{ width: 8, height: 8, backgroundColor: colors[i % colors.length], marginRight: 6, borderRadius: 2 }} />
                            <Text style={{ fontSize: 9, color: '#374151', width: 50, textTransform: 'capitalize' }}>{slice.label.toLowerCase()}</Text>
                            <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#111827' }}>{((slice.value / total) * 100).toFixed(1)}%</Text>
                        </View>
                    ))}
                </View>
            </View>
        </View>
    );
};

// Performance Trend Chart - Optimized
const PerformanceTrendChart = ({ data, primaryColor }: { data: any[], primaryColor: string }) => {
    if (!data || data.length === 0) return null;
    const validData = data.filter(d => d.date);
    if (validData.length === 0) return null;

    const height = 120; // Reduced from 150
    const width = 480; // Slightly reduced
    const padding = 15;

    const maxImp = Math.max(...validData.map(d => parseInt(d.impressions || '0'))) || 100;
    const maxClicks = Math.max(...validData.map(d => parseInt(d.link_clicks || '0'))) || 10;

    const getPoints = (key: string, max: number) => {
        if (validData.length === 1) {
            const val = parseInt(validData[0][key] || '0');
            const x = width / 2;
            const y = height - (val / max) * (height - 2 * padding) - padding;
            return { points: '', single: { x, y } };
        }
        return {
            points: validData.map((d, i) => {
                const x = (i / (validData.length - 1)) * (width - 2 * padding) + padding;
                const val = parseInt(d[key] || '0');
                const y = height - (val / max) * (height - 2 * padding) - padding;
                return `${x},${y}`;
            }).join(' '),
            single: null
        }
    };

    const impData = getPoints('impressions', maxImp);
    const clickData = getPoints('link_clicks', maxClicks);

    return (
        <View style={styles.chartContainer} wrap={false}>
            <Text style={styles.subSectionTitle}>Performance Trends</Text>
            <Svg height={height} width="100%">
                <Line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#d1d5db" strokeWidth={1} />
                <Line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#d1d5db" strokeWidth={1} />

                <Text x={5} y={padding + 5} style={{ fontSize: 7 }} fill="#6b7280">{formatNumber(maxImp)}</Text>
                <Text x={5} y={height - padding - 5} style={{ fontSize: 7 }} fill="#6b7280">0</Text>

                {impData.single ? (
                    <Circle cx={impData.single.x} cy={impData.single.y} r={3} fill="#8b5cf6" />
                ) : (
                    <Path d={`M ${impData.points}`} stroke="#8b5cf6" strokeWidth={1.5} fill="none" />
                )}

                {clickData.single ? (
                    <Circle cx={clickData.single.x} cy={clickData.single.y} r={3} fill="#10b981" />
                ) : (
                    <Path d={`M ${clickData.points}`} stroke="#10b981" strokeWidth={1.5} fill="none" />
                )}
            </Svg>
            <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 6 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 15 }}>
                    <View style={{ width: 6, height: 6, backgroundColor: '#8b5cf6', borderRadius: 3, marginRight: 3 }} />
                    <Text style={{ fontSize: 7, color: '#6b7280' }}>Impressions</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ width: 6, height: 6, backgroundColor: '#10b981', borderRadius: 3, marginRight: 3 }} />
                    <Text style={{ fontSize: 7, color: '#6b7280' }}>Link Clicks</Text>
                </View>
            </View>
        </View>
    )
}

const DailySpendChart = ({ data, primaryColor }: { data: any[], primaryColor: string }) => {
    if (!data || data.length === 0) return null;
    const validData = data.filter(d => !isNaN(parseFloat(d.spend)));
    if (validData.length === 0) return null;

    const height = 100;
    const width = 480;
    const maxSpend = Math.max(...validData.map(d => parseFloat(d.spend))) || 100;

    const marginL = 45;
    const marginR = 20;
    const marginB = 30;
    const marginT = 15;

    const points = validData.map((d, i) => {
        const x = (i / (validData.length > 1 ? validData.length - 1 : 1)) * (width - marginL - marginR) + marginL;
        const y = height - (parseFloat(d.spend) / maxSpend) * (height - marginB - marginT) - marginB;
        return { x, y, value: parseFloat(d.spend) };
    });

    return (
        <View style={styles.chartContainer} wrap={false}>
            <Text style={styles.subSectionTitle}>Daily Spend</Text>
            <Svg height={height} width="100%">
                {/* Axes and Grid lines */}
                <Line x1={marginL} y1={height - marginB + 5} x2={width - marginR + 5} y2={height - marginB + 5} stroke="#d1d5db" strokeWidth={1} />
                <Line x1={marginL} y1={marginT - 5} x2={marginL} y2={height - marginB + 5} stroke="#d1d5db" strokeWidth={1} />

                {/* Y Axis Labels (Spend) */}
                <Text x={5} y={marginT} style={{ fontSize: 6 }} fill="#9ca3af">{formatNumber(maxSpend)}</Text>
                <Text x={5} y={height - marginB} style={{ fontSize: 6 }} fill="#9ca3af">0</Text>
                <G transform={`translate(12, ${height / 2}) rotate(-90)`}>
                    <Text x={0} y={0} style={{ fontSize: 7, fontWeight: 'bold' }} fill="#6b7280">Spend</Text>
                </G>

                {points.length > 1 && (
                    <Path
                        d={`M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`}
                        stroke={primaryColor}
                        strokeWidth={1.5}
                        fill="none"
                        strokeDasharray="4 4"
                    />
                )}
                {points.map((p, i) => (
                    <G key={i}>
                        <Circle
                            cx={p.x}
                            cy={p.y}
                            r={8}
                            fill={primaryColor}
                        />
                        <Text
                            x={p.x}
                            y={p.y + 3}
                            textAnchor="middle"
                            style={{ fontSize: 6, fontWeight: 'bold' }}
                            fill="#ffffff"
                        >
                            {Math.round(p.value).toString()}
                        </Text>

                        {/* X Axis Labels (Dates) */}
                        {(i === 0 || i === Math.floor(points.length / 2) || i === points.length - 1) && (
                            <Text
                                x={p.x}
                                y={height - 10}
                                textAnchor="middle"
                                style={{ fontSize: 6 }}
                                fill="#9ca3af"
                            >
                                {validData[i].date ? format(new Date(validData[i].date), 'MMM dd') : ''}
                            </Text>
                        )}
                    </G>
                ))}
            </Svg>
        </View>
    );
};

const VideoRetentionChart = ({ insights, primaryColor }: { insights: any, primaryColor: string }) => {
    const getValue = (key: string) => {
        const val = insights[key] || (insights[0]?.[key]);
        if (Array.isArray(val) && val.length > 0) return parseInt(val[0].value || '0');
        if (typeof val === 'number') return val;
        return 0;
    };

    const videoData = [
        { label: '25%', value: getValue('video_p25_watched_actions') },
        { label: '50%', value: getValue('video_p50_watched_actions') },
        { label: '75%', value: getValue('video_p75_watched_actions') },
        { label: '100%', value: getValue('video_p100_watched_actions') },
    ];

    if (videoData.every(d => d.value === 0)) return null;

    const maxVal = Math.max(...videoData.map(d => d.value));

    return (
        <View style={styles.chartContainer} wrap={false}>
            <Text style={styles.subSectionTitle}>Video Retention</Text>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 80, paddingTop: 8 }}>
                {videoData.map((d, i) => (
                    <View key={i} style={{ flex: 1, alignItems: 'center', marginHorizontal: 7.5 }}>
                        <Text style={{ fontSize: 7, marginBottom: 3 }}>{formatNumber(d.value)}</Text>
                        <View style={{ width: '70%', height: maxVal > 0 ? (d.value / maxVal) * 60 : 0, backgroundColor: primaryColor, borderRadius: 2 }} />
                        <Text style={{ fontSize: 8, marginTop: 3, fontWeight: 'bold' }}>{d.label}</Text>
                    </View>
                ))}
            </View>
        </View>
    );
};

// Simple Bar Chart for Delivery
const SimpleBarChart = ({ title, data, limit = 5, primaryColor }: any) => {
    if (!data || data.length === 0) return null;
    const sorted = [...data].sort((a, b) => b.value - a.value).slice(0, limit);
    if (sorted.length === 0) return null;
    const max = sorted[0].value || 1;

    return (
        <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#6b7280', marginBottom: 6, textTransform: 'uppercase' }}>{title}</Text>
            {sorted.map((d, i) => (
                <View key={i} style={{ marginBottom: 5 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
                        <Text style={{ fontSize: 8, color: '#374151' }}>{d.label}</Text>
                        <Text style={{ fontSize: 8, fontWeight: 'bold', color: '#1f2937' }}>{formatNumber(d.value)}</Text>
                    </View>
                    <View style={{ height: 4, width: '100%', backgroundColor: '#e5e7eb', borderRadius: 2 }}>
                        <View style={{ height: '100%', width: `${(d.value / max) * 100}%`, backgroundColor: primaryColor, borderRadius: 2 }} />
                    </View>
                </View>
            ))}
        </View>
    )
}

// --- Main Content Components - REDESIGNED ---

const TargetingSection = ({ adSet }: { adSet: any }) => {
    const { targetingSentenceLines } = adSet;
    const hasSentences = targetingSentenceLines && targetingSentenceLines.length > 0;

    return (
        <View style={styles.targetingBlock} wrap={false}>
            <Text style={{ fontSize: 9, fontWeight: 'bold', marginBottom: 4, color: '#1f2937' }}>Targeting</Text>
            {hasSentences ? (
                targetingSentenceLines.slice(0, 4).map((line: any, i: number) => ( // Limit to 4 items
                    <View key={i} style={{ marginBottom: 4 }}>
                        <Text style={styles.targetingLabel}>{line.content}</Text>
                        <Text style={styles.targetingContent}>
                            {Array.isArray(line.children) ? line.children.slice(0, 5).join(', ') : ''}
                            {Array.isArray(line.children) && line.children.length > 5 ? '...' : ''}
                        </Text>
                    </View>
                ))
            ) : (
                <Text style={{ fontSize: 7, color: '#9ca3af', fontStyle: 'italic' }}>No targeting info available.</Text>
            )}
        </View>
    );
};

const AdsList = ({ ads, currency }: { ads: any[], currency: string }) => {
    if (!ads || ads.length === 0) return null;
    return (
        <View style={styles.adsContainer}>
            <Text style={{ fontSize: 10, fontWeight: 'bold', marginBottom: 6, color: '#374151' }} wrap={false}>Ads ({ads.length})</Text>
            {ads.slice(0, 2).map((ad, i) => ( // Limit to 2 ads per ad set for space
                <View key={i} style={styles.adRow}>
                    <View wrap={false}>
                        <Text style={styles.adName}>{ad.name}</Text>
                        <Text style={styles.adMeta}>{ad.status} • {ad.creative?.title || 'No Title'}</Text>
                    </View>
                    <MetricsGrid insights={ad.insights?.[0] || ad.insights || {}} currency={currency} compact />
                </View>
            ))}
            {ads.length > 2 && (
                <Text style={{ fontSize: 7, color: '#6b7280', fontStyle: 'italic', marginTop: 4 }}>
                    + {ads.length - 2} more ads
                </Text>
            )}
        </View>
    );
}

const AdHierarchy = ({ adSets, currency }: { adSets: any[], currency: string }) => {
    return (
        <View style={{ marginTop: 15 }}>
            <Text style={styles.sectionTitle}>Campaign Hierarchy: Ad Sets & Ads</Text>
            {adSets.map((adSet, i) => (
                <View key={i} style={styles.adSetContainer} break={i > 0}>
                    <View style={styles.adSetHeader} wrap={false}>
                        <Text style={styles.adSetTitle}>{adSet.name}</Text>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 }}>
                            <Text style={styles.adSetMeta}>Status: {adSet.status}</Text>
                            <Text style={styles.adSetMeta}>
                                Budget: {adSet.daily_budget ? `${adSet.daily_budget} (Daily)` :
                                    adSet.lifetime_budget ? `${adSet.lifetime_budget} (Lifetime)` : 'N/A'}
                            </Text>
                        </View>
                    </View>

                    <Text style={[styles.subSectionTitle, { marginTop: 6, paddingHorizontal: 0 }]} wrap={false}>Ad Set Performance</Text>
                    <MetricsGrid insights={adSet.insights} currency={currency} compact />

                    <TargetingSection adSet={adSet} />

                    <AdsList ads={adSet.ads} currency={currency} />
                </View>
            ))}
        </View>
    );
}

const ReportContentPage = ({ campaign, insights, dailyPerformance, adSets, breakdowns, timeRange, primaryColor, currency }: any) => {
    const platformData = breakdowns.platform?.data?.map((d: any) => ({ label: d.publisher_platform, value: parseInt(d.impressions) })) || [];
    const deviceData = breakdowns.device?.data?.map((d: any) => ({ label: d.device_platform, value: parseInt(d.impressions) })) || [];

    return (
        <Page size="A4" style={styles.page}>
            <View style={styles.header} fixed>
                <Text style={[styles.headerTitle, { color: primaryColor }]}>
                    {campaign?.name || 'Campaign Report'}
                </Text>
                <Text style={styles.headerDate}>
                    {formatCampaignPeriod(campaign, timeRange)}
                </Text>
            </View>

            {/* Campaign Metrics */}
            <Text style={styles.sectionTitle}>Campaign Performance Overview</Text>
            <MetricsGrid insights={insights} currency={currency} />

            {/* Charts Section */}
            <Text style={styles.sectionTitle}>Performance Trends</Text>
            <PerformanceTrendChart data={dailyPerformance} primaryColor={primaryColor} />
            <DailySpendChart data={dailyPerformance} primaryColor={primaryColor} />
            <VideoRetentionChart insights={insights} primaryColor={primaryColor} />

            {/* Delivery Section */}
            <Text style={styles.sectionTitle}>Device & Platform Delivery</Text>
            <View style={{ paddingHorizontal: 40, marginBottom: 15, flexDirection: 'row' }} wrap={false}>
                <SimpleBarChart title="Publisher Platforms" data={platformData} primaryColor={primaryColor} />
                <SimpleBarChart title="Device Types" data={deviceData} primaryColor={primaryColor} />
            </View>

            {/* Gender Pie Chart */}
            {breakdowns.gender?.data && <GenderPieChart data={breakdowns.gender.data} />}

            {/* Audience Breakdowns */}
            <Text style={styles.sectionTitle}>Audience & Delivery</Text>

            {breakdowns.region?.data && (
                <BreakdownTable
                    title="Top Regions"
                    data={breakdowns.region.data}
                    nameKey="region"
                    valueKey="impressions"
                    primaryColor={primaryColor}
                />
            )}

            {breakdowns.age?.data && (
                <BreakdownTable
                    title="Age Demographics"
                    data={breakdowns.age.data}
                    nameKey="age"
                    valueKey="impressions"
                    primaryColor={primaryColor}
                />
            )}

            {breakdowns.placement?.data && (
                <BreakdownTable
                    title="Top Placements"
                    data={breakdowns.placement.data}
                    nameKey="platform_position"
                    valueKey="impressions"
                    primaryColor={primaryColor}
                />
            )}

            {/* Detailed Ad Hierarchy */}
            <AdHierarchy adSets={adSets} currency={currency} />

            <Text style={styles.pageFooter} render={({ pageNumber, totalPages }) => (
                `Page ${pageNumber} of ${totalPages}`
            )} fixed />
        </Page>
    );
};

// Cover and End Pages (Unchanged)
const ReportCoverPage = (props: { campaign: any, timeRange: any, primaryColor: string, accountName?: string }) => {
    const { campaign, timeRange, primaryColor } = props;
    return (
        <Page size="A4" style={[styles.page, { backgroundColor: primaryColor }]}>
            <View style={styles.coverPage}>
                <View style={styles.logoContainer}>
                    <Image src="/nisclogowhite.png" style={styles.logo} />
                </View>
                <View style={styles.coverContent}>
                    <Text style={styles.campaignTitle}>{campaign?.name || 'Campaign Report'}</Text>
                    <Text style={styles.periodText}>
                        Period: {formatCampaignPeriod(campaign, timeRange)}
                    </Text>
                    {props.accountName && (
                        <View style={styles.accountNameContainer}>
                            <Text style={{ fontSize: 12, color: '#ffffff', opacity: 0.8, marginRight: 6 }}>Ad Account:</Text>
                            <Text style={styles.accountNameText}>{props.accountName}</Text>
                        </View>
                    )}
                    {campaign?.objective && (
                        <View style={styles.objectiveContainer}>
                            <Text style={styles.objectiveText}>
                                {campaign.objective.replace(/_/g, ' - ')}
                            </Text>
                        </View>
                    )}
                </View>
                <View style={styles.createdByContainer}>
                    <Text style={styles.createdByLabel}>Report Generated by:</Text>
                    <Text style={styles.createdByText}>Nisc Cloud</Text>
                </View>
                <View style={styles.disclaimerContainer}>
                    <Text style={styles.disclaimerText}>
                        This report provides a comprehensive overview of the campaign's performance from its
                        inception on {formatDate(timeRange.since)} until {formatDate(timeRange.until)}.
                    </Text>
                </View>
            </View>
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
                <Text style={styles.contactText}>AppleWood Adams, Ngong Road, Office No 805</Text>
            </View>
            <View style={styles.contactRow}>
                <View style={[styles.contactIcon]}>
                    <Svg width={20} height={20} viewBox="0 0 24 24" stroke="#ffffff" strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round">
                        <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </Svg>
                </View>
                <Link src="tel:+254777666550" style={styles.contactLink}>+254 777 666 550</Link>
            </View>
            <View style={styles.contactRow}>
                <View style={[styles.contactIcon]}>
                    <Svg width={20} height={20} viewBox="0 0 24 24" stroke="#ffffff" strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round">
                        <Path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <Path d="M22 6l-10 7L2 6" />
                    </Svg>
                </View>
                <Link src="mailto:enquiries@nisccloud.com" style={styles.contactLink}>enquiries@nisccloud.com</Link>
            </View>
            <View style={styles.contactRow}>
                <View style={[styles.contactIcon]}>
                    <Svg width={20} height={20} viewBox="0 0 24 24" stroke="#ffffff" strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round">
                        <Circle cx={12} cy={12} r={10} />
                        <Line x1={2} y1={12} x2={22} y2={12} />
                        <Path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                    </Svg>
                </View>
                <Link src="https://www.nisccloud.com" style={styles.contactLink}>www.nisccloud.com</Link>
            </View>
        </View>
    </Page>
);

export const CampaignReportPDF = (props: MetaAdsReportProps) => (
    <Document>
        <ReportCoverPage {...props} />
        <ReportContentPage {...props} />
        <ReportEndPage primaryColor={props.primaryColor} />
    </Document>
);
