"use client";

import * as React from "react";
import {
	Server,
	Cpu,
	HardDrive,
	CheckCircle2,
	XCircle,
	HelpCircle,
	Building2,
	AlertTriangle,
	Clock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type {
	AgentCloudServerEntry,
	AgentCloudServersResult,
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

function formatPrice(amount: string | null, currency: string | null): string | null {
	if (amount == null || amount === "") return null;
	const n = Number.parseFloat(amount);
	if (!Number.isFinite(n)) return null;
	const cur = currency ?? "KES";
	try {
		return new Intl.NumberFormat(cur === "KES" ? "en-KE" : "en-US", {
			style: "currency",
			currency: cur,
			maximumFractionDigits: 0,
		}).format(n);
	} catch {
		return `${cur} ${Math.ceil(n).toLocaleString()}`;
	}
}

const KIND_LABEL: Record<AgentCloudServerEntry["kind"], string> = {
	vps: "VPS",
	vds: "VDS",
	dedicated: "Dedicated",
};

function KindIcon({ kind }: { kind: AgentCloudServerEntry["kind"] }) {
	if (kind === "vds") return <Cpu className="h-3.5 w-3.5 text-primary shrink-0" />;
	if (kind === "dedicated") return <HardDrive className="h-3.5 w-3.5 text-primary shrink-0" />;
	return <Server className="h-3.5 w-3.5 text-primary shrink-0" />;
}

function StatusBadge({ status }: { status: AgentCloudServerEntry["status"] }) {
	if (status === "Active") {
		return (
			<Badge className="gap-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 text-[10px] px-1.5 py-0.5">
				<CheckCircle2 className="h-2.5 w-2.5" /> Active
			</Badge>
		);
	}
	if (status === "Suspended") {
		return (
			<Badge className="gap-1 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800 text-[10px] px-1.5 py-0.5">
				<XCircle className="h-2.5 w-2.5" /> Suspended
			</Badge>
		);
	}
	if (status === "Pending") {
		return (
			<Badge className="gap-1 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800 text-[10px] px-1.5 py-0.5">
				<Clock className="h-2.5 w-2.5" /> Pending
			</Badge>
		);
	}
	return (
		<Badge variant="outline" className="gap-1 text-[10px] px-1.5 py-0.5">
			<HelpCircle className="h-2.5 w-2.5" /> Unknown
		</Badge>
	);
}

function ServerRow({
	entry,
	isAgency,
}: {
	entry: AgentCloudServerEntry;
	isAgency: boolean;
}) {
	const days = daysUntil(entry.expiryDate);
	const expiringSoon = days !== null && days >= 0 && days <= 30;
	const expired = days !== null && days < 0;
	const price = formatPrice(entry.price, entry.currency);

	return (
		<div className="rounded-lg border border-border p-3 space-y-2 bg-card">
			<div className="flex items-center justify-between gap-2">
				<div className="flex items-center gap-2 min-w-0">
					<KindIcon kind={entry.kind} />
					<span className="text-sm font-medium truncate">{entry.name}</span>
				</div>
				<div className="flex items-center gap-1.5 shrink-0">
					<Badge variant="outline" className="text-[10px] px-1.5 py-0.5">
						{KIND_LABEL[entry.kind]}
					</Badge>
					<StatusBadge status={entry.status} />
				</div>
			</div>

			<div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
				{entry.hostname && entry.hostname !== entry.name ? (
					<span className="font-medium text-foreground/80">{entry.hostname}</span>
				) : null}
				{entry.location ? <span>{entry.location}</span> : null}
				{isAgency && entry.teamName ? (
					<span className="flex items-center gap-1">
						<Building2 className="h-2.5 w-2.5" />
						{entry.teamName}
					</span>
				) : null}
				{entry.billingCycle ? (
					<span className="capitalize">{entry.billingCycle.toLowerCase()}</span>
				) : null}
				{price ? <span className="text-foreground/80">{price}</span> : null}
			</div>

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

export function ZeepoCloudServersCard({ result }: { result: AgentCloudServersResult }) {
	const title =
		result.kind === "vps"
			? "VPS Servers"
			: result.kind === "vds"
				? "VDS Servers"
				: result.kind === "dedicated"
					? "Dedicated Servers"
					: "Cloud Servers";

	return (
		<div className="w-full max-w-full rounded-2xl rounded-bl-md border bg-card shadow-sm overflow-hidden">
			<div className="flex items-center gap-2 border-b bg-muted/30 px-3 py-2.5">
				<Server className="size-3.5 shrink-0 text-primary" />
				<span className="min-w-0 truncate text-sm font-semibold text-foreground">{title}</span>
				{result.totalCount > 0 ? (
					<span className="shrink-0 rounded-full border border-primary/20 bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
						{result.totalCount} {result.totalCount === 1 ? "server" : "servers"}
					</span>
				) : null}
			</div>

			{result.error ? (
				<p className="py-6 text-center text-sm text-muted-foreground">{result.error}</p>
			) : result.servers.length === 0 ? (
				<p className="py-6 text-center text-sm text-muted-foreground">
					No servers found for this organisation.
				</p>
			) : (
				<div className="max-h-[28rem] overflow-y-auto p-2.5 sm:p-3 space-y-2">
					{result.servers.map((entry, i) => (
						<ServerRow
							key={`${entry.kind}-${entry.hostname ?? entry.name}-${i}`}
							entry={entry}
							isAgency={result.isAgency}
						/>
					))}
				</div>
			)}
		</div>
	);
}
