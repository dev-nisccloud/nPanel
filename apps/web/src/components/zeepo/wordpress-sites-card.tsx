"use client";

import * as React from "react";
import {
	CheckCircle2,
	XCircle,
	HelpCircle,
	Building2,
	AlertTriangle,
	Shield,
	ShieldAlert,
	Globe,
	ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Icons } from "@/components/icons";
import { cn } from "@/lib/utils";
import type {
	AgentWordPressSiteEntry,
	AgentWordPressSitesResult,
} from "@/stores/zeepo-payment-store";

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

function StatusBadge({ status }: { status: AgentWordPressSiteEntry["status"] }) {
	if (status === "Online") {
		return (
			<Badge className="gap-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 text-[10px] px-1.5 py-0.5">
				<CheckCircle2 className="h-2.5 w-2.5" /> Online
			</Badge>
		);
	}
	if (status === "Offline") {
		return (
			<Badge className="gap-1 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800 text-[10px] px-1.5 py-0.5">
				<XCircle className="h-2.5 w-2.5" /> Offline
			</Badge>
		);
	}
	return (
		<Badge variant="outline" className="gap-1 text-[10px] px-1.5 py-0.5">
			<HelpCircle className="h-2.5 w-2.5" /> Unknown
		</Badge>
	);
}

function SecurityBadge({ security }: { security: AgentWordPressSiteEntry["security"] }) {
	if (security === "Secure") {
		return (
			<Badge
				variant="outline"
				className="gap-1 text-[10px] px-1.5 py-0.5 border-emerald-200 text-emerald-700 dark:border-emerald-800 dark:text-emerald-300"
			>
				<Shield className="h-2.5 w-2.5" /> Secure
			</Badge>
		);
	}
	if (security === "Needs attention") {
		return (
			<Badge
				variant="outline"
				className="gap-1 text-[10px] px-1.5 py-0.5 border-amber-200 text-amber-700 dark:border-amber-800 dark:text-amber-300"
			>
				<ShieldAlert className="h-2.5 w-2.5" /> Needs attention
			</Badge>
		);
	}
	return null;
}

function SiteRow({
	entry,
	isAgency,
}: {
	entry: AgentWordPressSiteEntry;
	isAgency: boolean;
}) {
	const days = daysUntil(entry.expiryDate);
	const expiringSoon = days !== null && days >= 0 && days <= 30;
	const expired = days !== null && days < 0;
	const updates =
		(entry.pluginUpdates ?? 0) + (entry.themeUpdates ?? 0);

	return (
		<div className="rounded-lg border border-border p-3 space-y-2 bg-card">
			<div className="flex items-center justify-between gap-2">
				<div className="flex items-center gap-2 min-w-0">
					<Icons.Wordpress className="h-3.5 w-3.5 text-primary shrink-0" />
					<span className="text-sm font-medium truncate">{entry.title}</span>
				</div>
				<div className="flex items-center gap-1.5 shrink-0">
					<Badge variant="outline" className="text-[10px] px-1.5 py-0.5">
						{entry.kind === "wordpress_hosting" ? "WP Hosting" : "On hosting"}
					</Badge>
					<StatusBadge status={entry.status} />
				</div>
			</div>

			<div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
				{entry.domain ? (
					<span className="flex items-center gap-1 font-medium text-foreground/80">
						<Globe className="h-2.5 w-2.5" />
						{entry.domain}
						{entry.isSubdomain ? (
							<span className="font-normal text-muted-foreground">subdomain</span>
						) : null}
					</span>
				) : null}
				{entry.version ? <span>WP {entry.version}</span> : null}
				{entry.phpVersion ? <span>PHP {entry.phpVersion}</span> : null}
				{entry.sslEnabled === true ? <span>SSL</span> : null}
				<SecurityBadge security={entry.security} />
				{entry.infected ? (
					<Badge className="gap-1 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800 text-[10px] px-1.5 py-0.5">
						Infected
					</Badge>
				) : null}
				{updates > 0 ? (
					<span>
						{updates} {updates === 1 ? "update" : "updates"}
					</span>
				) : null}
				{isAgency && entry.teamName ? (
					<span className="flex items-center gap-1">
						<Building2 className="h-2.5 w-2.5" />
						{entry.teamName}
					</span>
				) : null}
				{entry.planName ? <span>{entry.planName}</span> : null}
			</div>

			{entry.url ? (
				<a
					href={entry.url}
					target="_blank"
					rel="noopener noreferrer"
					className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline truncate max-w-full"
				>
					<ExternalLink className="h-2.5 w-2.5 shrink-0" />
					<span className="truncate">{entry.url}</span>
				</a>
			) : null}

			{entry.expiryDate ? (
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
			) : null}
		</div>
	);
}

export function ZeepoWordPressSitesCard({ result }: { result: AgentWordPressSitesResult }) {
	const title = result.domainFilter
		? `WordPress on ${result.domainFilter}`
		: "WordPress Sites";

	return (
		<div className="w-full max-w-full rounded-2xl rounded-bl-md border bg-card shadow-sm overflow-hidden">
			<div className="flex items-center gap-2 border-b bg-muted/30 px-3 py-2.5">
				<Icons.Wordpress className="size-3.5 shrink-0 text-primary" />
				<span className="min-w-0 truncate text-sm font-semibold text-foreground">{title}</span>
				{result.totalCount > 0 ? (
					<span className="shrink-0 rounded-full border border-primary/20 bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
						{result.totalCount} {result.totalCount === 1 ? "site" : "sites"}
					</span>
				) : null}
			</div>

			{result.error ? (
				<p className="py-6 text-center text-sm text-muted-foreground">{result.error}</p>
			) : result.sites.length === 0 ? (
				<p className="py-6 text-center text-sm text-muted-foreground">
					No WordPress sites found for this organisation.
				</p>
			) : (
				<div className="max-h-[28rem] overflow-y-auto p-2.5 sm:p-3 space-y-2">
					{result.sites.map((entry, i) => (
						<SiteRow
							key={`${entry.domain ?? entry.title}-${i}`}
							entry={entry}
							isAgency={result.isAgency}
						/>
					))}
				</div>
			)}
		</div>
	);
}
