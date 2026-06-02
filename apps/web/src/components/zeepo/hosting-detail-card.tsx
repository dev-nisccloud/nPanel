"use client";

import * as React from "react";
import {
	Server,
	CheckCircle2,
	XCircle,
	HelpCircle,
	HardDrive,
	Wifi,
	Shield,
	ShieldOff,
	Mail,
	Database,
	Globe,
	AlertTriangle,
	Info,
	Building2,
	LayoutGrid,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { AgentHostingDetailResult, AgentHostingMailAccount } from "@/stores/zeepo-payment-store";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso?: string | null): string {
	if (!iso) return "—";
	try {
		return new Intl.DateTimeFormat("en-KE", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(iso));
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

function StatusBadge({ status }: { status: AgentHostingDetailResult["status"] }) {
	if (status === "Active")
		return (
			<Badge className="gap-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">
				<CheckCircle2 className="h-3 w-3" /> Active
			</Badge>
		);
	if (status === "Suspended")
		return (
			<Badge className="gap-1 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800">
				<XCircle className="h-3 w-3" /> Suspended
			</Badge>
		);
	return (
		<Badge variant="outline" className="gap-1">
			<HelpCircle className="h-3 w-3" /> Unknown
		</Badge>
	);
}

// ── Disk usage bar ─────────────────────────────────────────────────────────────

function DiskBar({ usageBytes, limitBytes }: { usageBytes: number; limitBytes: number }) {
	if (!limitBytes || limitBytes <= 0) return null;
	const pct = Math.min(100, Math.round((usageBytes / limitBytes) * 100));
	const colour = pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-amber-500" : "bg-emerald-500";
	return (
		<div className="space-y-1">
			<div className="flex items-center justify-between text-xs text-muted-foreground">
				<span>{pct}% used</span>
				<span>{usageBytes > 0 ? `${pct}%` : ""}</span>
			</div>
			<div className="w-full h-1.5 rounded-full bg-muted/60">
				<div className={cn("h-full rounded-full transition-all", colour)} style={{ width: `${pct}%` }} />
			</div>
		</div>
	);
}

// ── Stat tile ─────────────────────────────────────────────────────────────────

function StatTile({
	icon,
	label,
	value,
	sub,
}: {
	icon: React.ReactNode;
	label: string;
	value: string;
	sub?: string;
}) {
	return (
		<div className="flex flex-col gap-1 rounded-lg border border-border bg-muted/30 p-3">
			<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
				{icon}
				{label}
			</div>
			<span className="text-base font-semibold">{value}</span>
			{sub && <span className="text-xs text-muted-foreground">{sub}</span>}
		</div>
	);
}

// ── DNS table ─────────────────────────────────────────────────────────────────

function DnsTable({ records }: { records: Array<{ type: string; host: string; value: string; ttl?: number }> }) {
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
							<td className="px-3 py-1.5 font-mono max-w-[160px] truncate" title={r.host}>{r.host || "@"}</td>
							<td className="px-3 py-1.5 font-mono max-w-[180px] truncate" title={r.value}>{r.value}</td>
							<td className="px-3 py-1.5 text-muted-foreground">{r.ttl ?? "—"}</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

// ── Mail account row ───────────────────────────────────────────────────────────

function MailAccountRow({ account }: { account: AgentHostingMailAccount }) {
	return (
		<div className="flex flex-col gap-1 rounded-lg border border-border px-3 py-2">
			<div className="flex items-center justify-between gap-2">
				<span className="text-sm font-medium font-mono truncate">{account.email}</span>
				<Badge
					variant="outline"
					className={cn(
						"text-[10px] shrink-0",
						account.mailboxEnabled
							? "text-emerald-700 dark:text-emerald-400 border-emerald-200"
							: "text-muted-foreground",
					)}
				>
					{account.mailboxEnabled ? "Active" : "Disabled"}
				</Badge>
			</div>
			<div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
				<span>{account.usageFormatted} used / {account.quotaFormatted}</span>
				{account.forwardingEnabled && account.forwardingAddresses.length > 0 && (
					<span>→ {account.forwardingAddresses.join(", ")}</span>
				)}
				{account.autoresponderEnabled && <span className="text-amber-600 dark:text-amber-400">Auto-reply on</span>}
			</div>
			{account.aliases.length > 0 && (
				<div className="text-xs text-muted-foreground">
					Aliases: {account.aliases.join(", ")}
				</div>
			)}
		</div>
	);
}

// ── Info row ──────────────────────────────────────────────────────────────────

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
	return (
		<div className="flex items-center justify-between gap-4 py-1.5">
			<span className="text-xs text-muted-foreground shrink-0 min-w-[120px]">{label}</span>
			<div className="text-sm text-right">{children}</div>
		</div>
	);
}

// ── Section heading ───────────────────────────────────────────────────────────

function SectionHeading({ icon, label }: { icon: React.ReactNode; label: string }) {
	return (
		<div className="flex items-center gap-2 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
			{icon}
			{label}
		</div>
	);
}

// ── Main card ─────────────────────────────────────────────────────────────────

interface ZeepoHostingDetailCardProps {
	result: AgentHostingDetailResult;
}

export function ZeepoHostingDetailCard({ result }: ZeepoHostingDetailCardProps) {
	const days = daysUntil(result.expiryDate);
	const expiringSoon = days !== null && days >= 0 && days <= 30;
	const expired = days !== null && days < 0;

	return (
		<div className="w-full rounded-2xl rounded-bl-md border bg-card shadow-sm overflow-hidden">
			{/* Header */}
			<div className="flex items-start justify-between gap-3 bg-muted/30 px-4 py-3 border-b border-border">
				<div className="flex items-center gap-2 min-w-0">
					<Server className="h-4 w-4 text-primary shrink-0" />
					<span className="text-sm font-semibold truncate">{result.domain}</span>
				</div>
				<div className="flex items-center gap-1.5 shrink-0">
					{result.sslEnabled ? (
						<Badge variant="outline" className="gap-1 text-xs text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">
							<Shield className="h-2.5 w-2.5" /> SSL
						</Badge>
					) : (
						<Badge variant="outline" className="gap-1 text-xs text-muted-foreground">
							<ShieldOff className="h-2.5 w-2.5" /> No SSL
						</Badge>
					)}
					<StatusBadge status={result.status} />
				</div>
			</div>

			{/* Access denied */}
			{result.accessDenied && (
				<div className="flex items-center gap-2 px-4 py-3 text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
					<XCircle className="h-4 w-4 shrink-0" />
					{result.error ?? "You are not authorised to view this hosting subscription."}
				</div>
			)}

			{/* Not found / error */}
			{!result.found && !result.accessDenied && (
				<div className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
					<Info className="h-4 w-4 shrink-0" />
					{result.error ?? "Hosting subscription not found."}
				</div>
			)}

			{result.found && (
				<div className="px-4 py-3 space-y-4">
					{/* Expiry alerts */}
					{expired && (
						<div className="flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-3 py-2 text-xs text-red-700 dark:text-red-400">
							<XCircle className="h-3.5 w-3.5 shrink-0" />
							This hosting subscription has expired.
						</div>
					)}
					{expiringSoon && !expired && (
						<div className="flex items-center gap-2 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 px-3 py-2 text-xs text-orange-700 dark:text-orange-400">
							<AlertTriangle className="h-3.5 w-3.5 shrink-0" />
							Subscription expires in {days} day{days === 1 ? "" : "s"} — renewal recommended.
						</div>
					)}

					{/* Plesk unavailable notice */}
					{result.pleskUnavailable && (
						<div className="flex items-center gap-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
							<AlertTriangle className="h-3.5 w-3.5 shrink-0" />
							Live server stats are currently unavailable — showing billing records only.
						</div>
					)}

					{/* Resource stats (Plesk live) */}
					{!result.pleskUnavailable && (
						<>
							<SectionHeading icon={<LayoutGrid className="h-3 w-3" />} label="Resource Usage" />
							<div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
								<StatTile
									icon={<HardDrive className="h-3 w-3" />}
									label="Disk"
									value={result.diskUsageFormatted}
									sub={`of ${result.diskLimitFormatted}`}
								/>
								<StatTile
									icon={<Wifi className="h-3 w-3" />}
									label="Traffic"
									value={result.trafficFormatted}
								/>
								<StatTile
									icon={<Mail className="h-3 w-3" />}
									label="Mailboxes"
									value={String(result.mailboxCount)}
								/>
								<StatTile
									icon={<Database className="h-3 w-3" />}
									label="Databases"
									value={String(result.databaseCount)}
								/>
							</div>

							{result.diskLimitBytes > 0 && (
								<DiskBar
									usageBytes={result.diskUsageBytes}
									limitBytes={result.diskLimitBytes}
								/>
							)}

							{result.subdomainCount > 0 && (
								<div className="flex items-center justify-between text-xs text-muted-foreground">
									<span className="flex items-center gap-1">
										<Globe className="h-2.5 w-2.5" /> Subdomains
									</span>
									<span>{result.subdomainCount}</span>
								</div>
							)}
						</>
					)}

					<Separator />

					{/* Billing / plan */}
					<div>
						<SectionHeading icon={<Server className="h-3 w-3" />} label="Subscription" />
						<div className="rounded-lg border border-border px-3 py-1 divide-y divide-border">
							{result.planName && (
								<InfoRow label="Plan">
									<span className="text-sm font-medium">{result.planName}</span>
								</InfoRow>
							)}
							{result.hostingType && (
								<InfoRow label="Type">
									<span className="text-sm capitalize">{result.hostingType.replace(/_/g, " ").toLowerCase()}</span>
								</InfoRow>
							)}
							{result.billingCycle && (
								<InfoRow label="Billing cycle">
									<span className="text-sm capitalize">{result.billingCycle.toLowerCase()}</span>
								</InfoRow>
							)}
							<InfoRow label="Expiry date">
								<span
									className={cn(
										"text-sm font-medium",
										expired
											? "text-red-600 dark:text-red-400"
											: expiringSoon
												? "text-orange-600 dark:text-orange-400"
												: "",
									)}
								>
									{formatDate(result.expiryDate)}
									{days !== null && days >= 0 && (
										<span className="text-xs font-normal text-muted-foreground ml-1">(in {days}d)</span>
									)}
								</span>
							</InfoRow>
							{result.nextRenewalDate && (
								<InfoRow label="Next renewal">
									<span className="text-sm">{formatDate(result.nextRenewalDate)}</span>
								</InfoRow>
							)}
							<InfoRow label="Auto-renewal">
								<span
									className={cn(
										"text-sm font-medium",
										result.autoRenew === true
											? "text-emerald-600 dark:text-emerald-400"
											: result.autoRenew === false
												? "text-amber-600 dark:text-amber-400"
												: "",
									)}
								>
									{result.autoRenew === null ? "—" : result.autoRenew ? "On" : "Off"}
								</span>
							</InfoRow>
							{result.teamName && (
								<InfoRow label="Client">
									<span className="flex items-center gap-1 text-sm justify-end">
										<Building2 className="h-3 w-3 text-muted-foreground" />
										{result.teamName}
									</span>
								</InfoRow>
							)}
							{result.createdAt && (
								<InfoRow label="Set up">
									<span className="text-sm">{formatDate(result.createdAt)}</span>
								</InfoRow>
							)}
						</div>
					</div>

					{/* DNS Records */}
					{"dnsRecords" in result && result.dnsRecords !== undefined && (
						<>
							<Separator />
							<div>
								<SectionHeading icon={<Globe className="h-3 w-3" />} label="DNS Records" />
								<DnsTable records={result.dnsRecords} />
							</div>
						</>
					)}

					{/* Mail Accounts */}
					{"mailAccounts" in result && result.mailAccounts !== undefined && (
						<>
							<Separator />
							<div>
								<SectionHeading icon={<Mail className="h-3 w-3" />} label={`Mail Accounts (${result.mailAccounts.length})`} />
								{result.mailAccounts.length === 0 ? (
									<p className="text-xs text-muted-foreground">No mail accounts configured.</p>
								) : (
									<div className="space-y-2">
										{result.mailAccounts.map((acc, i) => (
											<MailAccountRow key={acc.email ?? i} account={acc} />
										))}
									</div>
								)}
							</div>
						</>
					)}

					{/* Subdomains */}
					{"subdomains" in result && result.subdomains !== undefined && (
						<>
							<Separator />
							<div>
								<SectionHeading icon={<Globe className="h-3 w-3" />} label={`Subdomains (${result.subdomains.length})`} />
								{result.subdomains.length === 0 ? (
									<p className="text-xs text-muted-foreground">No subdomains configured.</p>
								) : (
									<div className="rounded-lg border border-border divide-y divide-border">
										{result.subdomains.map((sub, i) => (
											<div key={i} className="flex items-center gap-2 px-3 py-2">
												<Globe className="h-3 w-3 text-muted-foreground shrink-0" />
												<span className="text-sm font-mono">{sub.fqdn}</span>
											</div>
										))}
									</div>
								)}
							</div>
						</>
					)}

					{/* Databases */}
					{"databases" in result && result.databases !== undefined && (
						<>
							<Separator />
							<div>
								<SectionHeading icon={<Database className="h-3 w-3" />} label={`Databases (${result.databases.length})`} />
								{result.databases.length === 0 ? (
									<p className="text-xs text-muted-foreground">No databases found.</p>
								) : (
									<div className="rounded-lg border border-border divide-y divide-border">
										{result.databases.map((db, i) => (
											<div key={i} className="flex items-center justify-between gap-2 px-3 py-2">
												<span className="text-sm font-mono">{db.name}</span>
												<Badge variant="secondary" className="text-[10px] uppercase">{db.type}</Badge>
											</div>
										))}
									</div>
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
