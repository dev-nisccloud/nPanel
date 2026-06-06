"use client";

import * as React from "react";
import {
	Globe,
	CheckCircle2,
	XCircle,
	Clock,
	AlertTriangle,
	Lock,
	Server,
	Wifi,
	Database,
	Info,
	ShieldOff,
	Shield,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type {
	AgentDomainDetailResult,
	AgentDomainDetailDnsRecord,
} from "@/stores/zeepo-payment-store";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso?: string | null): string {
	if (!iso) return "-";
	try {
		return new Intl.DateTimeFormat("en-KE", {
			day: "2-digit",
			month: "short",
			year: "numeric",
		}).format(new Date(iso));
	} catch {
		return iso;
	}
}

function daysUntil(iso?: string | null): number | null {
	if (!iso) return null;
	try {
		return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
	} catch {
		return null;
	}
}

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status?: string }) {
	if (!status) return null;
	const s = status.toUpperCase();
	if (s === "ACTIVE") {
		return (
			<Badge className="gap-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">
				<CheckCircle2 className="h-3 w-3" /> Active
			</Badge>
		);
	}
	if (s === "EXPIRED") {
		return (
			<Badge className="gap-1 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800">
				<XCircle className="h-3 w-3" /> Expired
			</Badge>
		);
	}
	if (s === "PENDING") {
		return (
			<Badge className="gap-1 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800">
				<Clock className="h-3 w-3" /> Pending
			</Badge>
		);
	}
	if (s === "SUSPENDED") {
		return (
			<Badge className="gap-1 bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200 dark:border-orange-800">
				<AlertTriangle className="h-3 w-3" /> Suspended
			</Badge>
		);
	}
	return <Badge variant="outline">{status}</Badge>;
}

// ── Expiry row helper (coloured by urgency) ───────────────────────────────────

function ExpiryValue({ iso }: { iso?: string | null }) {
	const days = daysUntil(iso);
	const formatted = formatDate(iso);
	if (days === null) return <span className="text-sm">{formatted}</span>;
	if (days < 0)
		return <span className="text-sm font-medium text-red-600 dark:text-red-400">{formatted} (expired)</span>;
	if (days <= 30)
		return (
			<span className="text-sm font-medium text-orange-600 dark:text-orange-400">
				{formatted}{" "}
				<span className="text-xs font-normal">(in {days}d)</span>
			</span>
		);
	if (days <= 90)
		return (
			<span className="text-sm font-medium text-amber-600 dark:text-amber-400">
				{formatted}{" "}
				<span className="text-xs font-normal">(in {days}d)</span>
			</span>
		);
	return (
		<span className="text-sm">
			{formatted}{" "}
			<span className="text-xs text-muted-foreground">(in {days}d)</span>
		</span>
	);
}

// ── Labelled row ──────────────────────────────────────────────────────────────

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
	return (
		<div className="flex items-start justify-between gap-4 py-1">
			<span className="text-xs text-muted-foreground shrink-0 min-w-[110px]">{label}</span>
			<div className="text-sm text-right">{children}</div>
		</div>
	);
}

// ── Section heading ───────────────────────────────────────────────────────────

function SectionHeading({
	icon,
	label,
}: {
	icon: React.ReactNode;
	label: string;
}) {
	return (
		<div className="flex items-center gap-2 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
			{icon}
			{label}
		</div>
	);
}

// ── DNS table ─────────────────────────────────────────────────────────────────

function DnsTable({ records }: { records: AgentDomainDetailDnsRecord[] }) {
	if (!records.length) return <p className="text-xs text-muted-foreground">No DNS records found.</p>;
	return (
		<div className="overflow-x-auto rounded border border-border">
			<table className="w-full text-xs">
				<thead>
					<tr className="border-b border-border bg-muted/40">
						<th className="px-3 py-2 text-left font-medium text-muted-foreground">Type</th>
						<th className="px-3 py-2 text-left font-medium text-muted-foreground">Host</th>
						<th className="px-3 py-2 text-left font-medium text-muted-foreground">Value</th>
						<th className="px-3 py-2 text-left font-medium text-muted-foreground">TTL</th>
					</tr>
				</thead>
				<tbody>
					{records.map((r, i) => (
						<tr key={i} className={cn("border-b border-border last:border-0", i % 2 === 0 ? "" : "bg-muted/20")}>
							<td className="px-3 py-1.5 font-mono font-medium">{r.type}</td>
							<td className="px-3 py-1.5 font-mono max-w-[180px] truncate" title={r.host}>{r.host || "@"}</td>
							<td className="px-3 py-1.5 font-mono max-w-[200px] truncate" title={r.value}>{r.value}</td>
							<td className="px-3 py-1.5 text-muted-foreground">{r.ttl ?? "-"}</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

// ── Main card ─────────────────────────────────────────────────────────────────

interface ZeepoDomainDetailCardProps {
	result: AgentDomainDetailResult;
}

export function ZeepoDomainDetailCard({ result }: ZeepoDomainDetailCardProps) {
	const days = daysUntil(result.expiryDate);
	const isExpiringSoon = days !== null && days >= 0 && days <= 30;
	const isExpired = days !== null && days < 0;


	return (
		<div className="w-full rounded-2xl rounded-bl-md border bg-card shadow-sm overflow-hidden">
			{/* Header */}
			<div className="flex items-start justify-between gap-3 bg-muted/30 px-4 py-3 border-b border-border">
				<div className="flex items-center gap-2 min-w-0">
					<Globe className="h-4 w-4 text-primary shrink-0" />
					<span className="text-sm font-semibold truncate">{result.domain}</span>
				</div>
				<div className="flex items-center gap-1.5 shrink-0">
					{result.isLocked && (
						<Badge variant="outline" className="gap-1 text-xs">
							<Lock className="h-2.5 w-2.5" /> Locked
						</Badge>
					)}
					<StatusBadge status={result.status} />
				</div>
			</div>

			{/* Access denied */}
			{result.accessDenied && (
				<div className="flex items-center gap-2 px-4 py-3 text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
					<ShieldOff className="h-4 w-4 shrink-0" />
					{result.error ?? "You are not authorised to view this domain."}
				</div>
			)}

			{/* Error / not found */}
			{!result.found && !result.accessDenied && (
				<div className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
					<Info className="h-4 w-4 shrink-0" />
					{result.error ?? "Domain not found."}
				</div>
			)}

			{result.found && (
				<div className="px-4 py-3 space-y-3">
					{/* Expiry alert banners */}
					{isExpired && (
						<div className="flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-3 py-2 text-xs text-red-700 dark:text-red-400">
							<XCircle className="h-3.5 w-3.5 shrink-0" />
							This domain has expired. Please renew it as soon as possible.
						</div>
					)}
					{isExpiringSoon && (
						<div className="flex items-center gap-2 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 px-3 py-2 text-xs text-orange-700 dark:text-orange-400">
							<AlertTriangle className="h-3.5 w-3.5 shrink-0" />
							Domain expires in {days} day{days === 1 ? "" : "s"} - renewal recommended.
						</div>
					)}

					{/* Overview */}
					<div>
						<SectionHeading icon={<Globe className="h-3 w-3" />} label="Overview" />
						<div className="rounded-lg border border-border px-3 py-1 divide-y divide-border">
							<InfoRow label="Expiry date">
								<ExpiryValue iso={result.expiryDate} />
							</InfoRow>
							<InfoRow label="Registered">
								<span className="text-sm">{formatDate(result.registrationDate)}</span>
							</InfoRow>
							{result.renewalDate && (
								<InfoRow label="Renewal date">
									<span className="text-sm">{formatDate(result.renewalDate)}</span>
								</InfoRow>
							)}
							<InfoRow label="Auto-renewal">
								<span
									className={cn(
										"text-sm font-medium",
										result.autoRenewal
											? "text-emerald-600 dark:text-emerald-400"
											: "text-amber-600 dark:text-amber-400",
									)}
								>
									{result.autoRenewal === undefined ? "-" : result.autoRenewal ? "On" : "Off"}
								</span>
							</InfoRow>
							{(result.registrantHandle || result.registrantName) && (
								<InfoRow label="Registrant">
									<span className="text-sm">
										{result.registrantName ?? result.registrantHandle ?? "-"}
									</span>
								</InfoRow>
							)}
							{result.adminHandle && (
								<InfoRow label="Admin contact">
									<span className="text-sm">{result.adminHandle}</span>
								</InfoRow>
							)}
							{result.isDnssecEnabled !== undefined && (
								<InfoRow label="DNSSEC">
									<span className="flex items-center gap-1 text-sm justify-end">
										{result.isDnssecEnabled ? (
											<><Shield className="h-3 w-3 text-emerald-500" /> Enabled</>
										) : (
											<><ShieldOff className="h-3 w-3 text-muted-foreground" /> Disabled</>
										)}
									</span>
								</InfoRow>
							)}
						</div>
					</div>

					<Separator />

					{/* Hosting */}
					<div>
						<SectionHeading icon={<Server className="h-3 w-3" />} label="Hosting" />
						<div
							className={cn(
								"flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm",
								result.hasHosting
									? "border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20"
									: "border-border bg-muted/30",
							)}
						>
							{result.hasHosting ? (
								<>
									<CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
									<span className="font-medium text-emerald-700 dark:text-emerald-300">
										Hosting active
									</span>
									{result.hostingPlanName && (
										<Badge variant="secondary" className="ml-auto text-xs">
											{result.hostingPlanName}
										</Badge>
									)}
								</>
							) : (
								<>
									<XCircle className="h-4 w-4 text-muted-foreground shrink-0" />
									<span className="text-muted-foreground">No hosting plan connected</span>
								</>
							)}
						</div>
					</div>

					{/* Nameservers (only when included) */}
					{"nameservers" in result && result.nameservers !== undefined && (
						<>
							<Separator />
							<div>
								<SectionHeading icon={<Wifi className="h-3 w-3" />} label="Nameservers" />
								{result.nameservers.length === 0 ? (
									<p className="text-xs text-muted-foreground">No nameservers on record.</p>
								) : (
									<div className="rounded-lg border border-border divide-y divide-border">
										{result.nameservers.map((ns, i) => (
											<div key={i} className="flex items-center gap-2 px-3 py-1.5">
												<span className="text-xs text-muted-foreground w-4">{i + 1}.</span>
												<span className="text-sm font-mono">{ns}</span>
											</div>
										))}
									</div>
								)}
							</div>
						</>
					)}

					{/* DNS records (only when included) */}
					{"dnsRecords" in result && (
						<>
							<Separator />
							<div>
								<SectionHeading icon={<Database className="h-3 w-3" />} label="DNS Records" />
								{result.dnsNote ? (
									<div className="flex items-start gap-2 rounded-lg bg-muted/40 border border-border px-3 py-2 text-xs text-muted-foreground">
										<Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
										{result.dnsNote}
									</div>
								) : (
									<DnsTable records={result.dnsRecords ?? []} />
								)}
							</div>
						</>
					)}
				</div>
			)}

			{/* Footer */}
			<div className="border-t border-border bg-muted/20 px-4 py-2 text-[10px] text-muted-foreground">
				Checked {new Intl.DateTimeFormat("en-KE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(result.checkedAt))}
			</div>
		</div>
	);
}
