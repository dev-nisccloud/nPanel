/* eslint-disable jsx-a11y/alt-text */
import React from "react";
import {
	Page,
	Text,
	View,
	Document,
	StyleSheet,
	Image,
	Link,
	Rect,
	Svg,
	Path,
	Circle,
	G,
	Line,
} from "@react-pdf/renderer";
import { format } from "date-fns";

const styles = StyleSheet.create({
	page: {
		backgroundColor: "#ffffff",
		fontFamily: "Helvetica",
		paddingTop: 50,
		paddingBottom: 65,
		paddingLeft: 0,
		paddingRight: 0,
	},
	coverPage: {
		height: "100%",
		width: "100%",
		display: "flex",
		flexDirection: "column",
		position: "relative",
	},
	logoContainer: {
		position: "absolute",
		top: 40,
		right: 40,
		width: 220,
		height: 90,
	},
	logo: { width: "100%", height: "100%", objectFit: "contain" },
	coverContent: {
		flex: 1,
		display: "flex",
		flexDirection: "column",
		justifyContent: "center",
		alignItems: "center",
		paddingHorizontal: 40,
	},
	campaignTitle: {
		fontSize: 32,
		fontWeight: "bold",
		color: "#ffffff",
		textAlign: "center",
		marginBottom: 10,
	},
	coverSubtitle: {
		fontSize: 10,
		color: "#ffffff",
		textAlign: "center",
		opacity: 0.85,
		lineHeight: 1.4,
		maxWidth: 420,
		marginTop: 6,
	},
	periodText: { fontSize: 14, color: "#ffffff", textAlign: "center", marginBottom: 20, opacity: 0.9 },
	objectiveContainer: { marginTop: 20, padding: 10, backgroundColor: "rgba(255, 255, 255, 0.1)", borderRadius: 8 },
	objectiveText: { fontSize: 12, color: "#ffffff", textAlign: "center", letterSpacing: 0.5 },
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
	sectionTitle: {
		fontSize: 14,
		fontWeight: "bold",
		color: "#1f2937",
		marginBottom: 12,
		marginTop: 15,
		paddingHorizontal: 40,
	},
	subSectionTitle: { fontSize: 11, fontWeight: "bold", color: "#374151", marginBottom: 8, marginTop: 8 },

	metricsGrid: { display: "flex", flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 40, marginBottom: 12 },
	metricCard: {
		width: "31.5%",
		padding: 8,
		backgroundColor: "#f9fafb",
		borderRadius: 4,
		borderLeftWidth: 3,
		borderLeftColor: "#6366f1",
		marginBottom: 6,
	},
	metricLabel: { fontSize: 7, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 3 },
	metricValue: { fontSize: 13, fontWeight: "bold", color: "#111827" },

	tableContainer: { paddingHorizontal: 40, marginBottom: 12 },
	tableHeader: {
		flexDirection: "row",
		borderBottomColor: "#d1d5db",
		borderBottomWidth: 1.5,
		backgroundColor: "#f3f4f6",
		paddingVertical: 6,
		paddingHorizontal: 8,
	},
	tableRow: {
		flexDirection: "row",
		borderBottomColor: "#e5e7eb",
		borderBottomWidth: 0.5,
		paddingVertical: 5,
		paddingHorizontal: 8,
	},
	tableCellName: { width: "70%", fontSize: 8, color: "#374151" },
	tableCellValue: { width: "30%", textAlign: "right", fontSize: 8, color: "#111827", fontWeight: "bold" },

	pageFooter: { position: "absolute", bottom: 20, left: 0, right: 0, textAlign: "center", fontSize: 8, color: "#9ca3af" },
	endPageContent: { flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", backgroundColor: "#F8FAFC" },
	thankYouText: { fontSize: 48, fontWeight: "bold", color: "#1a1a1a", marginBottom: 40, fontFamily: "Helvetica" },
	contactInfoContainer: { padding: 30, backgroundColor: "#ffffff", borderRadius: 16, width: "80%", alignItems: "flex-start", shadowColor: "#000", shadowOpacity: 0.1, shadowOffset: { width: 0, height: 4 }, shadowRadius: 10 },
	contactTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 20, color: "#1a1a1a" },
	contactRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
	contactIcon: { width: 24, height: 24, marginRight: 12, alignItems: "center", justifyContent: "center" },
	contactLink: { fontSize: 12, color: "#0EA5E9", textDecoration: "none" },
});

function fmtDateTime(v?: string | Date | null): string {
	if (!v) return " ";
	try {
		return format(new Date(v), "MMM dd, yyyy • h:mm a");
	} catch {
		return " ";
	}
}

function fmtMs(ms: number | null | undefined): string {
	if (ms == null || !Number.isFinite(ms)) return " ";
	const s = Math.max(0, Math.round(ms / 1000));
	if (s < 60) return `${s}s`;
	const m = Math.floor(s / 60);
	const r = s % 60;
	if (m < 60) return `${m}m ${r}s`;
	const h = Math.floor(m / 60);
	const rm = m % 60;
	return `${h}h ${rm}m`;
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

const SimpleBar = ({ label, value, max, color }: { label: string; value: number; max: number; color: string }) => {
	const pct = max > 0 ? (value / max) * 100 : 0;
	return (
		<View style={{ marginBottom: 10 }}>
			<View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 3 }}>
				<Text style={{ fontSize: 9, color: "#374151", fontWeight: "bold" }}>{label}</Text>
				<Text style={{ fontSize: 9, color: "#111827", fontWeight: "bold" }}>{fmtMs(value)}</Text>
			</View>
			<View style={{ height: 8, width: "100%", backgroundColor: "#f3f4f6", borderRadius: 4 }}>
				<View style={{ height: "100%", width: `${pct}%`, backgroundColor: color, borderRadius: 4 }} />
			</View>
		</View>
	);
};

const ReportCoverPage = (props: any) => {
	const { campaign, primaryColor } = props;

	return (
		<Page size="A4" style={[styles.page, { backgroundColor: primaryColor }]}>
			<View style={styles.coverPage}>
				<View style={styles.logoContainer}>
					<Image src="/nisclogowhite.png" style={styles.logo} />
				</View>
				<View style={styles.coverContent}>
					<Text style={styles.campaignTitle}>{campaign?.name || "Email Marketing Report"}</Text>
					<Text style={styles.periodText}>Nisc Email Marketing • Campaign Report</Text>
					<Text style={styles.coverSubtitle}>
						A concise summary of deliverability and engagement performance to help you evaluate campaign health,
						spot issues early (bounces/complaints), and optimize future sends based on timing and click activity.
					</Text>
				</View>
				<View style={styles.createdByContainer}>
					<Text style={styles.createdByLabel}>Report Generated by:</Text>
					<Text style={styles.createdByText}>Nisc Cloud</Text>
				</View>
				<View style={styles.disclaimerContainer}>
					<Text style={styles.disclaimerText}>
						This report summarizes deliverability and engagement performance for the selected campaign. Individual recipient event timelines are omitted for brevity.
					</Text>
				</View>
			</View>
		</Page>
	);
};

const ReportContentPage = (props: any) => {
	const { campaign, summary, bounceBreakdown, topClickedLinks, report, primaryColor, generatedAt } = props;
	const total = Number(summary?.totalRecipients ?? 0);
	const delivered = Number(summary?.delivered ?? 0);
	const bounced = Number(summary?.bounced ?? 0);
	const opened = Number(summary?.opened ?? 0);
	const clicked = Number(summary?.clicked ?? 0);
	const complained = Number(summary?.complained ?? 0);
	const deliverabilityPct = total > 0 ? Math.round((delivered / total) * 100) : 0;
	const openRatePct = delivered > 0 ? Math.round((opened / delivered) * 100) : 0;
	const clickRatePct = delivered > 0 ? Math.round((clicked / delivered) * 100) : 0;

	const avgDeliveryMs = report?.timing?.avgDeliveryMs ?? null;
	const avgOpenMs = report?.timing?.avgOpenMs ?? null;
	const avgClickMs = report?.timing?.avgClickMs ?? null;
	const maxAvg = Math.max(avgDeliveryMs ?? 0, avgOpenMs ?? 0, avgClickMs ?? 0) || 1;

	const bounceByType = bounceBreakdown?.byType ?? {};
	const bounceTransient = bounceByType.Transient ?? bounceByType.transient ?? 0;
	const bouncePermanent = bounceByType.Permanent ?? bounceByType.permanent ?? 0;

	const metrics = [
		{ label: "Requests", value: `${total}`, color: "#64748b" },
		{ label: "Delivered", value: `${delivered} (${deliverabilityPct}%)`, color: "#10b981" },
		{ label: "Bounced", value: `${bounced}`, color: "#ef4444" },
		{ label: "Opened (Unique)", value: `${opened} (${openRatePct}%)`, color: "#059669" },
		{ label: "Clicked (Unique)", value: `${clicked} (${clickRatePct}%)`, color: primaryColor },
		{ label: "Complaints", value: `${complained}`, color: "#f97316" },
		{ label: "Bounce: Transient", value: `${bounceTransient}`, color: "#ef4444" },
		{ label: "Bounce: Permanent", value: `${bouncePermanent}`, color: "#b91c1c" },
		{ label: "Tracking", value: "Open/Click enabled", color: "#6366f1" },
	];

	return (
		<Page size="A4" style={styles.page}>
			<View style={styles.header} fixed>
				<Text style={[styles.headerTitle, { color: primaryColor }]}>{campaign?.name || "Campaign Report"}</Text>
				<Text style={styles.headerDate}>{fmtDateTime(generatedAt)}</Text>
			</View>

			<Text style={styles.sectionTitle}>Campaign Details</Text>
			<View style={styles.tableContainer} wrap={false}>
				<View style={styles.tableHeader}>
					<Text style={styles.tableCellName}>Field</Text>
					<Text style={styles.tableCellValue}>Value</Text>
				</View>
				{[
					{ k: "Campaign name", v: campaign?.name ?? " " },
					{ k: "Created by", v: campaign?.creator?.name ?? campaign?.creator?.email ?? " " },
					{ k: "Company name", v: campaign?.companyName ?? " " },
					{ k: "Status", v: campaign?.status ?? " " },
					{ k: "Scheduled at", v: fmtDateTime(campaign?.scheduledAt ?? null) },
					{ k: "Sent at", v: fmtDateTime(campaign?.sentAt ?? null) },
					{ k: "Completed at", v: fmtDateTime(campaign?.completedAt ?? null) },
				].map((row, i) => (
					<View key={i} style={styles.tableRow}>
						<Text style={styles.tableCellName}>{row.k}</Text>
						<Text style={styles.tableCellValue}>{String(row.v)}</Text>
					</View>
				))}
			</View>

			<Text style={styles.sectionTitle}>Email Details</Text>
			<View style={styles.tableContainer} wrap={false}>
				<View style={styles.tableHeader}>
					<Text style={styles.tableCellName}>Field</Text>
					<Text style={styles.tableCellValue}>Value</Text>
				</View>
				{[
					{ k: "From name", v: campaign?.fromName ?? " " },
					{ k: "From email", v: campaign?.fromEmail ?? " " },
					{ k: "Subject", v: campaign?.subject ?? " " },
					{ k: "Reply-to", v: campaign?.replyTo ?? " " },
					{ k: "Total recipients", v: campaign?.totalRecipients != null ? String(campaign.totalRecipients) : " " },
				].map((row, i) => (
					<View key={i} style={styles.tableRow}>
						<Text style={styles.tableCellName}>{row.k}</Text>
						<Text style={styles.tableCellValue}>{String(row.v)}</Text>
					</View>
				))}
			</View>

			<Text style={styles.sectionTitle}>Performance Overview</Text>
			<MetricsGrid items={metrics} />

			<Text style={styles.sectionTitle}>Engagement Timing (Averages)</Text>
			<View style={{ paddingHorizontal: 40 }}>
				<SimpleBar label="Avg time to Delivery" value={avgDeliveryMs ?? 0} max={maxAvg} color="#10b981" />
				<SimpleBar label="Avg time to Open" value={avgOpenMs ?? 0} max={maxAvg} color="#059669" />
				<SimpleBar label="Avg time to Click" value={avgClickMs ?? 0} max={maxAvg} color={primaryColor} />
				<Text style={{ fontSize: 8, color: "#6b7280", marginTop: 6 }}>
					These averages show how quickly recipients typically receive and engage with your email. Use them to choose better send times,
					compare performance across campaigns, and identify delays in delivery or slow engagement.
				</Text>
			</View>

			<Text style={styles.sectionTitle}>Top Clicked Links</Text>
			<View style={styles.tableContainer} wrap={false}>
				<View style={styles.tableHeader}>
					<Text style={styles.tableCellName}>URL</Text>
					<Text style={styles.tableCellValue}>Clicks</Text>
				</View>
				{(topClickedLinks ?? []).slice(0, 8).map((row: any, i: number) => (
					<View key={i} style={styles.tableRow}>
						<Text style={styles.tableCellName}>{row?.url || " "}</Text>
						<Text style={styles.tableCellValue}>{String(row?.clicks ?? 0)}</Text>
					</View>
				))}
				{(!topClickedLinks || topClickedLinks.length === 0) && (
					<View style={styles.tableRow}>
						<Text style={styles.tableCellName}>No clicks recorded</Text>
						<Text style={styles.tableCellValue}> </Text>
					</View>
				)}
			</View>

			<Text style={styles.pageFooter} fixed>
				Generated: {fmtDateTime(generatedAt)}
			</Text>
		</Page>
	);
};

// End page kept identical to Meta Ads.
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

export function NiscEmailMarketingReportPDF(props: any) {
	return (
		<Document>
			<ReportCoverPage {...props} />
			<ReportContentPage {...props} />
			<ReportEndPage primaryColor={props.primaryColor} />
		</Document>
	);
}

