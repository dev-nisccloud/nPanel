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
	Building2,
	AlertTriangle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { AgentHostingResourcesResult, AgentHostingResourceEntry } from "@/stores/zeepo-payment-store";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso?: string | null): string {
	if (!iso) return "-";
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

function StatusBadge({ status }: { status: AgentHostingResourceEntry["status"] }) {
	if (status === "Active")
		return (
			<Badge className="gap-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 text-[10px] px-1.5 py-0.5">
				<CheckCircle2 className="h-2.5 w-2.5" /> Active
			</Badge>
		);
	if (status === "Suspended")
		return (
			<Badge className="gap-1 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800 text-[10px] px-1.5 py-0.5">
				<XCircle className="h-2.5 w-2.5" /> Suspended
			</Badge>
		);
	return (
		<Badge variant="outline" className="gap-1 text-[10px] px-1.5 py-0.5">
			<HelpCircle className="h-2.5 w-2.5" /> Unknown
		</Badge>
	);
}

// ── Disk usage bar ─────────────────────────────────────────────────────────────

function DiskBar({ usageBytes, limitBytes }: { usageBytes: number; limitBytes: number }) {
	if (!limitBytes || limitBytes <= 0) return null;
	const pct = Math.min(100, Math.round((usageBytes / limitBytes) * 100));
	const colour = pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-amber-500" : "bg-emerald-500";
	return (
		<div className="w-full h-1 rounded-full bg-muted/60 mt-1">
			<div className={cn("h-full rounded-full transition-all", colour)} style={{ width: `${pct}%` }} />
		</div>
	);
}

// ── Single resource row ───────────────────────────────────────────────────────

function ResourceRow({ entry, isAgency }: { entry: AgentHostingResourceEntry; isAgency: boolean }) {
	const days = daysUntil(entry.expiryDate);
	const expiringSoon = days !== null && days >= 0 && days <= 30;
	const expired = days !== null && days < 0;

	return (
		<div className="rounded-lg border border-border p-3 space-y-2 bg-card">
			{/* Top row */}
			<div className="flex items-center justify-between gap-2">
				<div className="flex items-center gap-2 min-w-0">
					<Server className="h-3.5 w-3.5 text-primary shrink-0" />
					<span className="text-sm font-medium truncate">{entry.domain ?? "-"}</span>
				</div>
				<div className="flex items-center gap-1.5 shrink-0">
					{entry.sslEnabled ? (
						<Shield className="h-3 w-3 text-emerald-500" title="SSL enabled" />
					) : (
						<ShieldOff className="h-3 w-3 text-muted-foreground" title="SSL disabled" />
					)}
					<StatusBadge status={entry.status} />
				</div>
			</div>

			{/* Plan / client */}
			<div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
				{entry.planName && (
					<span className="font-medium text-foreground/80">{entry.planName}</span>
				)}
				{isAgency && entry.teamName && (
					<span className="flex items-center gap-1">
						<Building2 className="h-2.5 w-2.5" />
						{entry.teamName}
					</span>
				)}
				{entry.billingCycle && <span className="capitalize">{entry.billingCycle.toLowerCase()}</span>}
			</div>

			{/* Disk usage (when available) */}
			{entry.diskUsageBytes > 0 && (
				<div className="space-y-0.5">
					<div className="flex items-center justify-between text-xs text-muted-foreground">
						<span className="flex items-center gap-1"><HardDrive className="h-2.5 w-2.5" /> Disk</span>
						<span>{entry.diskUsageFormatted} / {entry.diskLimitFormatted}</span>
					</div>
					<DiskBar usageBytes={entry.diskUsageBytes} limitBytes={entry.diskLimitBytes} />
				</div>
			)}

			{/* Traffic */}
			{entry.trafficBytes > 0 && (
				<div className="flex items-center justify-between text-xs text-muted-foreground">
					<span className="flex items-center gap-1"><Wifi className="h-2.5 w-2.5" /> Traffic</span>
					<span>{entry.trafficFormatted}</span>
				</div>
			)}

			{/* Expiry */}
			{entry.expiryDate && (
				<div
					className={cn(
						"flex items-center gap-1.5 text-xs rounded px-2 py-1",
						expired
							? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"
							: expiringSoon
								? "bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400"
								: "text-muted-foreground",
					)}
				>
					{(expired || expiringSoon) && <AlertTriangle className="h-2.5 w-2.5 shrink-0" />}
					<span>
						{expired ? "Expired" : expiringSoon ? `Expires in ${days}d` : "Expires"}&nbsp;
						{formatDate(entry.expiryDate)}
					</span>
				</div>
			)}
		</div>
	);
}

// ── Main card ─────────────────────────────────────────────────────────────────

interface ZeepoHostingResourcesCardProps {
	result: AgentHostingResourcesResult;
}

export function ZeepoHostingResourcesCard({ result }: ZeepoHostingResourcesCardProps) {
	return (
		<div className="w-full rounded-2xl rounded-bl-md border bg-card shadow-sm overflow-hidden">
			{/* Header */}
			<div className="flex items-center justify-between gap-3 bg-muted/30 px-4 py-3 border-b border-border">
				<div className="flex items-center gap-2">
					<Server className="h-4 w-4 text-primary" />
					<span className="text-sm font-semibold">
						{result.isAgency ? "Hosting Resources" : `Hosting - ${result.teamName ?? "Your Organisation"}`}
					</span>
				</div>
				<div className="flex items-center gap-1.5">
					<Badge variant="secondary" className="text-xs">{result.totalCount} total</Badge>
					{result.activeCount > 0 && (
						<Badge className="text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200">
							{result.activeCount} active
						</Badge>
					)}
					{result.suspendedCount > 0 && (
						<Badge className="text-xs bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200">
							{result.suspendedCount} suspended
						</Badge>
					)}
				</div>
			</div>

			{/* Plesk unavailable notice */}
			{result.pleskUnavailable && (
				<div className="flex items-center gap-2 px-4 py-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800">
					<AlertTriangle className="h-3.5 w-3.5 shrink-0" />
					Live server stats are unavailable - showing billing records only.
				</div>
			)}

			{/* Customer context */}
			{!result.isAgency && result.teamName && (
				<div className="flex items-center gap-2 px-4 py-2 text-xs text-muted-foreground border-b border-border bg-muted/20">
					<Building2 className="h-3 w-3 shrink-0" />
					Showing hosting subscriptions for <span className="font-medium text-foreground ml-1">{result.teamName}</span>
				</div>
			)}

			{/* Empty state */}
			{result.totalCount === 0 ? (
				<div className="flex flex-col items-center gap-2 py-10 text-sm text-muted-foreground">
					<Server className="h-8 w-8 opacity-30" />
					<span>No hosting subscriptions found.</span>
				</div>
			) : (
				<div className="p-3 space-y-2">
					{result.resources.map((entry, i) => (
						<React.Fragment key={entry.domain ?? i}>
							{i > 0 && result.isAgency && <Separator className="my-1" />}
							<ResourceRow entry={entry} isAgency={result.isAgency} />
						</React.Fragment>
					))}
				</div>
			)}

			{/* Footer */}
			<div className="border-t border-border bg-muted/20 px-4 py-2 text-[10px] text-muted-foreground">
				Checked {new Intl.DateTimeFormat("en-KE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(result.checkedAt))}
			</div>
		</div>
	);
}
