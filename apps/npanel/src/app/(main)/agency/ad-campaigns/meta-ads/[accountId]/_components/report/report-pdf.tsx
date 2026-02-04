/* eslint-disable jsx-a11y/alt-text */
import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image, Svg, Path, Line, G, Circle, Rect } from '@react-pdf/renderer';
import { format } from 'date-fns';

// Styles
const styles = StyleSheet.create({
    page: {
        backgroundColor: '#ffffff',
        fontFamily: 'Helvetica',
        paddingTop: 0,
        paddingBottom: 0,
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
        width: 150,
        height: 60,
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
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eeeeee',
        marginBottom: 20,
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 10,
        color: '#666666',
    },
    headerDate: {
        fontSize: 10,
        color: '#999999',
    },
    // Sections
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 10,
        marginTop: 20,
        paddingHorizontal: 20,
    },
    subSectionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#4b5563',
        marginBottom: 8,
        marginTop: 4,
    },
    // Metrics - Strict Grid
    metricsGrid: {
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 20,
        marginBottom: 10,
    },
    metricsGridCompact: {
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 0, // Ad Cards handle padding
        marginBottom: 6,
    },
    metricCard: {
        width: '32%', // Strict 3 columns
        marginRight: '1%',
        marginBottom: 10,
        borderRadius: 6,
        padding: 10,
        backgroundColor: '#f8f9fa',
        borderLeftWidth: 3,
    },
    metricCardCompact: {
        width: '24%', // 4 columns for compact
        marginRight: '1%',
        marginBottom: 6,
        borderRadius: 4,
        padding: 6,
        backgroundColor: '#f8f9fa',
        borderLeftWidth: 2,
    },
    metricLabel: {
        fontSize: 9,
        color: '#666666',
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    metricLabelCompact: {
        fontSize: 7,
        color: '#666666',
        marginBottom: 2,
        textTransform: 'uppercase',
    },
    metricValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1a1a1a',
    },
    metricValueCompact: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#1a1a1a',
    },
    // Full Width Tables
    tableContainer: {
        paddingHorizontal: 20,
        marginBottom: 15,
        width: '100%',
    },
    tableHeader: {
        flexDirection: 'row',
        borderBottomColor: '#cccccc',
        borderBottomWidth: 1,
        backgroundColor: '#f8f9fa',
        alignItems: 'center',
        height: 24,
        fontWeight: 'bold',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomColor: '#eeeeee',
        borderBottomWidth: 1,
        alignItems: 'center',
        height: 24,
    },
    tableCellName: { width: '50%', textAlign: 'left', fontSize: 9, paddingLeft: 8 },
    tableCellValue: { width: '25%', textAlign: 'right', fontSize: 9, paddingRight: 8 },
    // Charts
    chartContainer: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    // Ad Hierarchy
    adSetContainer: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    adSetHeader: {
        backgroundColor: '#f1f5f9',
        padding: 10,
        borderRadius: 4,
        marginBottom: 10,
    },
    adSetTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#0f172a',
        marginBottom: 4,
    },
    adSetMeta: {
        fontSize: 9,
        color: '#64748b',
        marginBottom: 2,
    },
    // Targeting Block (Rich Text Mimic)
    targetingBlock: {
        marginBottom: 15,
        paddingLeft: 10,
        borderLeftWidth: 2,
        borderLeftColor: '#e2e8f0',
    },
    targetingLabel: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#334155',
        marginTop: 6,
        marginBottom: 2,
    },
    targetingContent: {
        fontSize: 9,
        color: '#475569',
        lineHeight: 1.4,
    },
    // Ads List
    adsContainer: {
        marginTop: 15,
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
        paddingTop: 10,
    },
    adCard: {
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 6,
        padding: 10,
    },
    adHeader: {
        flexDirection: 'row',
        marginBottom: 8,
        alignItems: 'flex-start',
    },
    adThumbnail: {
        width: 40,
        height: 40,
        backgroundColor: '#f1f5f9',
        borderRadius: 4,
        marginRight: 10,
    },
    adInfo: {
        flex: 1,
    },
    adName: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#0f172a',
        marginBottom: 2,
    },
    // Footer
    pageFooter: {
        position: 'absolute',
        bottom: 20,
        left: 0,
        right: 0,
        textAlign: 'center',
        fontSize: 9,
        color: '#94a3b8'
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
    contactIcon: { width: 20, height: 20, marginRight: 10, backgroundColor: '#E0F2FE', borderRadius: 10 },
    contactText: { fontSize: 12, color: '#0EA5E9' },
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
}

const formatDate = (dateString: string) => {
    try {
        return format(new Date(dateString), 'MMM dd, yyyy');
    } catch (e) {
        return dateString;
    }
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

// --- Helper Components ---

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
    // 19 Metrics from Dialog
    const getValue = (k: string) => insights?.[k] || 0;
    const num = (v: any) => formatNumber(typeof v === 'string' ? parseFloat(v) : v);
    const curr = (v: any) => formatCurrency(typeof v === 'string' ? parseFloat(v) : v, currency);
    const pct = (v: any) => formatPercentage(typeof v === 'string' ? parseFloat(v) : v);

    // CTR (all) Calculation if missing
    let ctrAll = getValue('ctr');
    let cpcAll = getValue('cpc');

    // Safely parse
    const imp = parseFloat(getValue('impressions') || '0');
    const clicks = parseFloat(getValue('clicks') || '0'); // All clicks
    const spend = parseFloat(getValue('spend') || '0');

    // If API returns link clicks as 'clicks' in some versions, ensure 'clicks' is typically 'all clicks'
    // Calculate manually if needed for parity 
    // Dialog logic:
    // const ctrAll = impressionsNum > 0 && clicksNum > 0 ? (clicksNum / impressionsNum) : null;
    const ctrAllVal = (imp > 0 && clicks > 0) ? (clicks / imp) * 100 : 0;
    const cpcAllVal = (clicks > 0 && spend > 0) ? (spend / clicks) : 0;

    const metricsList = [
        { label: 'Reach', value: num(getValue('reach')), color: 'blue' },
        { label: 'Frequency', value: num(getValue('frequency')), color: 'blue' },
        { label: 'Cost per Result', value: curr(getValue('cost_per_result')), color: 'orange' },
        { label: 'Amount Spent', value: curr(getValue('spend')), color: 'emerald' },
        { label: 'Impressions', value: num(getValue('impressions')), color: 'purple' },
        { label: 'CPM', value: curr(getValue('cpm')), color: 'indigo' },
        { label: 'Link Clicks', value: num(getValue('link_clicks')), color: 'green' },
        { label: 'CPC', value: curr(getValue('cpc')), color: 'orange' },
        { label: 'CTR', value: pct(getValue('ctr')), color: 'indigo' },
        { label: 'Unique Clicks', value: num(getValue('unique_clicks')), color: 'green' },
        { label: 'Unique CTR', value: pct(getValue('unique_ctr')), color: 'indigo' },
        { label: 'Purchase ROAS', value: num(getValue('purchase_roas')), color: 'emerald' },
        { label: 'Clicks (all)', value: num(clicks), color: 'green' },
        { label: 'CTR (all)', value: pct(ctrAllVal), color: 'indigo' }, // Calculated
        { label: 'CPC (all)', value: curr(cpcAllVal), color: 'orange' }, // Calculated
    ];

    if (!insights) return <Text style={{ fontSize: 9, color: '#999' }}>No metrics available</Text>;

    return (
        <View style={compact ? styles.metricsGridCompact : styles.metricsGrid}>
            {metricsList.map((m, i) => (
                <MetricCard
                    key={i}
                    label={m.label}
                    value={m.value}
                    color={m.color === 'blue' ? '#3b82f6' : m.color === 'emerald' ? '#10b981' : m.color === 'orange' ? '#f97316' : '#8b5cf6'}
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
        .slice(0, 10);
    const totalValue = sortedData.reduce((acc, curr) => acc + parseInt(curr[valueKey] || 0), 0);
    const maxValue = Math.max(...sortedData.map(d => parseInt(d[valueKey] || 0)));

    return (
        <View style={styles.tableContainer} break={false}>
            <Text style={styles.subSectionTitle}>{title}</Text>
            <View style={styles.tableHeader}>
                <Text style={styles.tableCellName}>{nameKey.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</Text>
                <Text style={styles.tableCellValue}>Impressions</Text>
                <Text style={{ width: '25%', fontSize: 9, paddingRight: 8, textAlign: 'right' }}>Share</Text>
            </View>
            {sortedData.map((item, index) => {
                const value = parseInt(item[valueKey] || 0);
                const share = totalValue > 0 ? (value / totalValue) * 100 : 0;
                const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;

                return (
                    <View key={index} style={styles.tableRow}>
                        <View style={styles.tableCellName}>
                            <Text>{item[nameKey] || 'Unknown'}</Text>
                        </View>
                        <View style={styles.tableCellValue}>
                            <Text>{formatNumber(value)}</Text>
                        </View>
                        <View style={{ width: '25%', paddingRight: 8, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' }}>
                            <View style={{ width: 50, height: 4, backgroundColor: '#eeeeee', marginRight: 4 }}>
                                <View style={{ width: `${percentage}%`, height: '100%', backgroundColor: primaryColor }} />
                            </View>
                            <Text style={{ fontSize: 8 }}>{share.toFixed(1)}%</Text>
                        </View>
                    </View>
                );
            })}
        </View>
    );
};

// SVG Charts
const GenderPieChart = ({ data }: { data: any[] }) => {
    if (!data || data.length === 0) return null;

    const validData = data
        .filter(d => d.gender !== 'unknown' && parseInt(d.impressions) > 0)
        .map(d => ({ label: d.gender, value: parseInt(d.impressions) }));

    const allZero = validData.every(d => d.value === 0);
    if (allZero) return null;

    const total = validData.reduce((acc, curr) => acc + curr.value, 0);
    let startAngle = 0;
    const colors = ['#3b82f6', '#ec4899', '#a855f7']; // Blue (Male), Pink (Female), Purple

    const size = 100;
    const cx = size / 2;
    const cy = size / 2;
    const r = 40;

    return (
        <View style={[styles.chartContainer, { alignItems: 'center' }]} break={false}>
            <Text style={styles.subSectionTitle}>Gender Distribution</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Svg height={size} width={size}>
                    {validData.map((slice, i) => {
                        const angle = (slice.value / total) * 360;
                        const endAngle = startAngle + angle;
                        const startRad = (startAngle - 90) * Math.PI / 180;
                        const endRad = (endAngle - 90) * Math.PI / 180;
                        const x1 = cx + r * Math.cos(startRad);
                        const y1 = cy + r * Math.sin(startRad);
                        const x2 = cx + r * Math.cos(endRad);
                        const y2 = cy + r * Math.sin(endRad);
                        const largeArc = angle > 180 ? 1 : 0;
                        const pathData = [
                            `M ${cx} ${cy}`,
                            `L ${x1} ${y1}`,
                            `A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`,
                            `Z`
                        ].join(' ');
                        startAngle += angle;
                        return <Path key={i} d={pathData} fill={colors[i % colors.length]} />;
                    })}
                </Svg>
                <View style={{ marginLeft: 20 }}>
                    {validData.map((slice, i) => (
                        <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                            <View style={{ width: 8, height: 8, backgroundColor: colors[i % colors.length], marginRight: 6 }} />
                            <Text style={{ fontSize: 10, width: 50 }}>{slice.label}</Text>
                            <Text style={{ fontSize: 10, fontWeight: 'bold' }}>{((slice.value / total) * 100).toFixed(1)}%</Text>
                        </View>
                    ))}
                </View>
            </View>
        </View>
    );
};

// Dual Line Chart: Impressions vs Link Clicks
const PerformanceTrendChart = ({ data, primaryColor }: { data: any[], primaryColor: string }) => {
    if (!data || data.length === 0) return null;
    const validData = data.filter(d => d.date); // Allow sparse data

    // Safety check
    if (validData.length === 0) return null;

    const height = 150;
    const width = 500;
    const padding = 20;

    // Scales
    const maxImp = Math.max(...validData.map(d => parseInt(d.impressions || '0'))) || 100;
    const maxClicks = Math.max(...validData.map(d => parseInt(d.link_clicks || '0'))) || 10;

    // Points
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
        <View style={styles.chartContainer} break={false}>
            <Text style={styles.subSectionTitle}>Performance Trends (Impressions vs Clicks)</Text>
            <Svg height={height} width="100%">
                <Line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#cbd5e1" strokeWidth={1} />

                {/* Impressions - Blue */}
                {impData.single ? (
                    <Circle cx={impData.single.x} cy={impData.single.y} r={4} fill="#8b5cf6" />
                ) : (
                    <Path d={`M ${impData.points}`} stroke="#8b5cf6" strokeWidth={2} fill="none" />
                )}

                {/* Link Clicks - Green */}
                {clickData.single ? (
                    <Circle cx={clickData.single.x} cy={clickData.single.y} r={4} fill="#22c55e" />
                ) : (
                    <Path d={`M ${clickData.points}`} stroke="#22c55e" strokeWidth={2} fill="none" />
                )}
            </Svg>
            <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 8, gap: 20 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ width: 8, height: 8, backgroundColor: '#8b5cf6', borderRadius: 4, marginRight: 4 }} />
                    <Text style={{ fontSize: 9, color: '#64748b' }}>Impressions</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ width: 8, height: 8, backgroundColor: '#22c55e', borderRadius: 4, marginRight: 4 }} />
                    <Text style={{ fontSize: 9, color: '#64748b' }}>Link Clicks</Text>
                </View>
            </View>
        </View>
    )
}

const DailySpendChart = ({ data, primaryColor }: { data: any[], primaryColor: string }) => {
    if (!data || data.length === 0) return null;
    const validData = data.filter(d => !isNaN(parseFloat(d.spend)));
    const height = 100;
    const width = 500;
    const maxSpend = Math.max(...validData.map(d => parseFloat(d.spend))) || 100;

    // Points
    const getPoints = () => {
        // Area chart path construct... simplified to line for robust PDF rendering
        // Area gradients in ReactPDF are tricky/unsupported. Using filled path with opacity? No opacity support in standard PDF fill often.
        // Sticking to Line for stability.
        if (validData.length === 1) {
            const x = width / 2;
            const y = height - (parseFloat(validData[0].spend) / maxSpend) * (height - 20) - 10;
            return { points: '', single: { x, y } };
        }
        return {
            points: validData.map((d, i) => {
                const x = (i / (validData.length - 1)) * (width - 20) + 10;
                const y = height - (parseFloat(d.spend) / maxSpend) * (height - 20) - 10;
                return `${x},${y}`;
            }).join(' '),
            single: null
        };
    }

    const p = getPoints();

    return (
        <View style={styles.chartContainer} break={false}>
            <Text style={styles.subSectionTitle}>Daily Spend</Text>
            <Svg height={height} width="100%">
                <Line x1={10} y1={height - 10} x2={width - 10} y2={height - 10} stroke="#cbd5e1" strokeWidth={1} />
                {p.single ? (
                    <Circle cx={p.single.x} cy={p.single.y} r={4} fill={primaryColor} />
                ) : (
                    <Path d={`M ${p.points}`} stroke={primaryColor} strokeWidth={2} fill="none" />
                )}
            </Svg>
        </View>
    );
}

const VideoRetentionChart = ({ insights, primaryColor }: { insights: any, primaryColor: string }) => {
    // Flatten logic
    const getValue = (key: string) => {
        const val = insights[key] || (insights[0]?.[key]); // Handle array or object
        if (Array.isArray(val) && val.length > 0) return parseInt(val[0].value || '0');
        if (typeof val === 'number') return val;
        // Sometimes distinct keys in root
        return 0;
    };

    // Specifically for campaign level, insights is object. For daily, it might be array.
    // Ensure we look for keys.
    const videoData = [
        { label: '25%', value: getValue('video_p25_watched_actions') },
        { label: '50%', value: getValue('video_p50_watched_actions') },
        { label: '75%', value: getValue('video_p75_watched_actions') },
        { label: '100%', value: getValue('video_p100_watched_actions') },
    ];

    // Check if any data exists
    if (videoData.every(d => d.value === 0)) return null;

    const maxVal = Math.max(...videoData.map(d => d.value));

    return (
        <View style={styles.chartContainer} break={false}>
            <Text style={styles.subSectionTitle}>Video Retention</Text>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 100, gap: 20, paddingTop: 10 }}>
                {videoData.map((d, i) => (
                    <View key={i} style={{ flex: 1, alignItems: 'center' }}>
                        <Text style={{ fontSize: 8, marginBottom: 4 }}>{formatNumber(d.value)}</Text>
                        <View style={{ width: '60%', height: maxVal > 0 ? (d.value / maxVal) * 80 : 0, backgroundColor: primaryColor, borderRadius: 2 }} />
                        <Text style={{ fontSize: 9, marginTop: 4, fontWeight: 'bold' }}>{d.label}</Text>
                    </View>
                ))}
            </View>
        </View>
    );
};

// Bar Chart for Delivery
const SimpleBarChart = ({ title, data, limit = 5, primaryColor }: any) => {
    if (!data || data.length === 0) return null;
    const sorted = [...data].sort((a, b) => b.value - a.value).slice(0, limit);
    if (sorted.length === 0) return null;
    const max = sorted[0].value || 1;

    return (
        <View style={{ flex: 1, marginRight: 10 }}>
            <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#666', marginBottom: 8, textTransform: 'uppercase' }}>{title}</Text>
            {sorted.map((d, i) => (
                <View key={i} style={{ marginBottom: 6 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
                        <Text style={{ fontSize: 9 }}>{d.label}</Text>
                        <Text style={{ fontSize: 9, fontWeight: 'bold' }}>{formatNumber(d.value)}</Text>
                    </View>
                    <View style={{ height: 6, width: '100%', backgroundColor: '#f1f5f9', borderRadius: 3 }}>
                        <View style={{ height: '100%', width: `${(d.value / max) * 100}%`, backgroundColor: primaryColor, borderRadius: 3 }} />
                    </View>
                </View>
            ))}
        </View>
    )
}

// --- Main Content Components ---

const TargetingSection = ({ adSet }: { adSet: any }) => {
    const { targetingSentenceLines } = adSet;
    const hasSentences = targetingSentenceLines && targetingSentenceLines.length > 0;

    return (
        <View style={styles.targetingBlock}>
            <Text style={{ fontSize: 10, fontWeight: 'bold', marginBottom: 4, color: '#1e293b' }}>Targeting</Text>
            {hasSentences ? (
                targetingSentenceLines.map((line: any, i: number) => (
                    <View key={i} style={{ marginBottom: 6 }}>
                        <Text style={styles.targetingLabel}>{line.content}</Text>
                        <Text style={styles.targetingContent}>
                            {Array.isArray(line.children) ? line.children.join(', ') : ''}
                        </Text>
                    </View>
                ))
            ) : (
                <Text style={{ fontSize: 9, color: '#94a3b8', fontStyle: 'italic' }}>No detailed targeting info available.</Text>
            )}
        </View>
    );
};

const AdsList = ({ ads, currency }: { ads: any[], currency: string }) => {
    if (!ads || ads.length === 0) return null;
    return (
        <View style={styles.adsContainer}>
            <Text style={{ fontSize: 11, fontWeight: 'bold', marginBottom: 8, color: '#334155' }}>Ads ({ads.length})</Text>
            {ads.map((ad, i) => (
                <View key={i} style={styles.adCard} break={false}>
                    <View style={styles.adHeader}>
                        {ad.creative?.thumbnail_url && <Image src={ad.creative.thumbnail_url} style={styles.adThumbnail} />}
                        <View style={styles.adInfo}>
                            <Text style={styles.adName}>{ad.name}</Text>
                            <Text style={{ fontSize: 9, color: '#64748b' }}>{ad.status} • {ad.creative?.title || 'No Title'}</Text>
                        </View>
                    </View>

                    {/* Nested Ad Metrics */}
                    <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#64748b', marginBottom: 4, textTransform: 'uppercase' }}>Ad Performance</Text>
                    <MetricsGrid insights={ad.insights?.[0] || ad.insights || {}} currency={currency} compact />
                </View>
            ))}
        </View>
    );
}

const AdHierarchy = ({ adSets, currency }: { adSets: any[], currency: string }) => {
    return (
        <View style={{ marginTop: 20 }}>
            <Text style={styles.sectionTitle}>Campaign Hierarchy: Ad Sets & Ads</Text>
            {adSets.map((adSet, i) => (
                <View key={i} style={styles.adSetContainer} break={true}>
                    {/* Header */}
                    <View style={styles.adSetHeader}>
                        <Text style={styles.adSetTitle}>Ad Set: {adSet.name}</Text>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Text style={styles.adSetMeta}>Status: {adSet.status}</Text>
                            <Text style={styles.adSetMeta}>
                                Budget: {adSet.daily_budget ? `${adSet.daily_budget} (Daily)` :
                                    adSet.lifetime_budget ? `${adSet.lifetime_budget} (Lifetime)` : 'N/A'}
                            </Text>
                        </View>
                    </View>

                    {/* Ad Set Metrics (Nested) */}
                    <Text style={[styles.subSectionTitle, { marginTop: 0 }]}>Ad Set Performance</Text>
                    <MetricsGrid insights={adSet.insights} currency={currency} />

                    {/* Targeting */}
                    <TargetingSection adSet={adSet} />

                    {/* Ads */}
                    <AdsList ads={adSet.ads} currency={currency} />
                </View>
            ))}
        </View>
    );
}

const ReportContentPage = ({ campaign, insights, dailyPerformance, adSets, breakdowns, timeRange, primaryColor, currency }: any) => {

    // Prepare Delivery Data
    const platformData = breakdowns.platform?.data?.map((d: any) => ({ label: d.publisher_platform, value: parseInt(d.impressions) })) || [];
    const deviceData = breakdowns.device?.data?.map((d: any) => ({ label: d.device_platform, value: parseInt(d.impressions) })) || [];

    return (
        <Page size="A4" style={styles.page}>
            <View style={styles.header}>
                <Text style={[styles.headerTitle, { color: primaryColor, fontWeight: 'bold' }]}>
                    {campaign?.name}
                </Text>
                <Text style={styles.headerDate}>
                    {formatDate(timeRange.since)} - {formatDate(timeRange.until)}
                </Text>
            </View>

            {/* Campaign Metrics */}
            <Text style={styles.sectionTitle}>Campaign Key Performance Indicators</Text>
            {/* Standard Metrics Grid - Top Level */}
            <MetricsGrid insights={insights} currency={currency} />

            {/* Charts Section */}
            <Text style={styles.sectionTitle}>Performance Trends</Text>
            <PerformanceTrendChart data={dailyPerformance} primaryColor={primaryColor} />
            <DailySpendChart data={dailyPerformance} primaryColor={primaryColor} />
            <VideoRetentionChart insights={insights} primaryColor={primaryColor} />

            {/* Delivery Section */}
            <Text style={styles.sectionTitle}>Device & Platform Delivery</Text>
            <View style={{ flexDirection: 'row', paddingHorizontal: 20, marginBottom: 20 }}>
                <SimpleBarChart title="Publisher Platforms" data={platformData} primaryColor={primaryColor} />
                <SimpleBarChart title="Device Types" data={deviceData} primaryColor={primaryColor} />
            </View>

            {/* Gender Pie Chart */}
            {breakdowns.gender?.data && <GenderPieChart data={breakdowns.gender.data} />}

            {/* Audience Breakdowns (Full Rows) */}
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
                `${pageNumber} / ${totalPages}`
            )} fixed />
        </Page>
    );
};

// ... ReportCoverPage and ReportEndPage (Unchanged)
const ReportCoverPage = ({ campaign, timeRange, primaryColor }: { campaign: any, timeRange: any, primaryColor: string }) => (
    <Page size="A4" style={[styles.page, { backgroundColor: primaryColor }]}>
        <View style={styles.coverPage}>
            <View style={styles.logoContainer}>
                <Image src="/nisclogowhite.png" style={styles.logo} />
            </View>
            <View style={styles.coverContent}>
                <Text style={styles.campaignTitle}>{campaign?.name || 'Campaign Report'}</Text>
                <Text style={styles.periodText}>
                    Period: {formatDate(timeRange.since)} - {formatDate(timeRange.until)}
                </Text>
                {campaign?.objective && (
                    <View style={styles.objectiveContainer}>
                        <Text style={styles.objectiveText}>
                            {campaign.objective.replace(/_/g, ' ')}
                        </Text>
                    </View>
                )}
            </View>
            <View style={styles.createdByContainer}>
                <Text style={styles.createdByLabel}>Created By:</Text>
                <Text style={styles.createdByText}>Nisc Cloud Creative Team</Text>
            </View>
            <View style={styles.disclaimerContainer}>
                <Text style={styles.disclaimerText}>
                    Information in this report represents data from the period selected in your date filter
                    ({formatDate(timeRange.since)} - {formatDate(timeRange.until)}).
                </Text>
            </View>
        </View>
    </Page>
);

const ReportEndPage = ({ primaryColor }: { primaryColor: string }) => (
    <Page size="A4" style={styles.endPageContent}>
        <Text style={[styles.thankYouText, { color: primaryColor }]}>Thank you!</Text>
        <View style={styles.contactInfoContainer}>
            <Text style={styles.contactTitle}>For more information</Text>
            <View style={styles.contactRow}>
                <View style={[styles.contactIcon, { backgroundColor: '#E0F2FE' }]} />
                <Text style={styles.contactText}>AppleWood Adams, Ngong Road, Office No 805</Text>
            </View>
            <View style={styles.contactRow}>
                <View style={[styles.contactIcon, { backgroundColor: '#E0F2FE' }]} />
                <Text style={styles.contactText}>+254 777 666 550</Text>
            </View>
            <View style={styles.contactRow}>
                <View style={[styles.contactIcon, { backgroundColor: '#E0F2FE' }]} />
                <Text style={styles.contactText}>enquiries@nisccloud.com</Text>
            </View>
            <View style={styles.contactRow}>
                <View style={[styles.contactIcon, { backgroundColor: '#E0F2FE' }]} />
                <Text style={styles.contactText}>nisccloud.com</Text>
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
