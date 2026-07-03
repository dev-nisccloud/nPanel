"use client";

import * as React from "react";
import {
	Activity,
	AlertCircle,
	Building2,
	Check,
	Copy,
	ExternalLink,
	Globe,
	Lock,
	Mail,
	MapPin,
	Phone,
	Search,
	Server,
	Shield,
	ShieldOff,
	User,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { trpc } from "@/utils/trpc";

// ── Type ─────────────────────────────────────────────────────────────────────

type WhoisData = NonNullable<ReturnType<typeof trpc.whois.lookup.useQuery>["data"]>;

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string | null | undefined): string {
	if (!iso) return "—";
	return new Date(iso).toLocaleDateString("en-GB", {
		day: "2-digit",
		month: "short",
		year: "numeric",
	});
}

function daysUntil(iso: string | null | undefined): number | null {
	if (!iso) return null;
	return Math.ceil((new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function safeHostname(url: string): string {
	try {
		const u = url.startsWith("http") ? url : `https://${url}`;
		return new URL(u).hostname;
	} catch {
		return url;
	}
}

/** Strip protocol and path so users can paste full URLs */
function sanitizeDomainInput(raw: string): string {
	return raw
		.trim()
		.toLowerCase()
		.replace(/^https?:\/\//i, "")
		.replace(/\/.*$/, "")
		.replace(/\s/g, "");
}

// ── Expiry chip ───────────────────────────────────────────────────────────────

function ExpiryChip({ iso }: { iso: string | null | undefined }) {
	const days = daysUntil(iso);
	if (days === null) return null;
	if (days < 0)
		return (
			<Badge className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 text-xs shrink-0">
				Expired
			</Badge>
		);
	if (days < 30)
		return (
			<Badge className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 text-xs shrink-0">
				{days}d left
			</Badge>
		);
	if (days < 90)
		return (
			<Badge className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 text-xs shrink-0">
				{days}d left
			</Badge>
		);
	return (
		<Badge className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs shrink-0">
			{days}d left
		</Badge>
	);
}

// ── EPP status color ──────────────────────────────────────────────────────────

function getStatusColor(status: string): string {
	const s = status.toLowerCase();
	if (s === "active")
		return "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-transparent";
	if (s.includes("prohibited") || s.includes("lock"))
		return "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-transparent";
	if (s.includes("pending") || s.includes("hold"))
		return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-transparent";
	if (s.includes("delete") || s.includes("expired"))
		return "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-transparent";
	return "";
}

// ── Copy button ───────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
	const [copied, setCopied] = React.useState(false);
	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(text);
			setCopied(true);
			setTimeout(() => setCopied(false), 1500);
		} catch {
			/* ignore */
		}
	};
	return (
		<button
			type="button"
			onClick={handleCopy}
			className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
			title="Copy"
		>
			{copied ? (
				<Check className="h-3.5 w-3.5 text-green-500" />
			) : (
				<Copy className="h-3.5 w-3.5" />
			)}
		</button>
	);
}

// ── Info row ──────────────────────────────────────────────────────────────────

function InfoRow({
	label,
	value,
	mono = false,
	copyable = false,
}: {
	label: string;
	value: string | null | undefined;
	mono?: boolean;
	copyable?: boolean;
}) {
	if (!value) return null;
	return (
		<div className="flex items-center justify-between gap-4 py-2 border-b border-border last:border-0">
			<span className="text-xs text-muted-foreground shrink-0">{label}</span>
			<div className="flex items-center gap-1.5 min-w-0">
				<span
					className={`text-xs font-medium truncate ${mono ? "font-mono" : ""}`}
					title={value}
				>
					{value}
				</span>
				{copyable && <CopyButton text={value} />}
			</div>
		</div>
	);
}

// ── Section heading ───────────────────────────────────────────────────────────

function SectionHeading({
	icon: Icon,
	label,
}: {
	icon: React.ElementType;
	label: string;
}) {
	return (
		<div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
			<Icon className="h-3.5 w-3.5" />
			{label}
		</div>
	);
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function WhoisSkeleton() {
	return (
		<div className="flex flex-col gap-4 mt-2 animate-in fade-in duration-300">
			{/* Overview card */}
			<Card className="border shadow-sm">
				<CardContent className="p-6">
					<div className="flex items-start justify-between mb-4">
						<div className="flex flex-col gap-2">
							<Skeleton className="h-6 w-52" />
							<div className="flex gap-2">
								<Skeleton className="h-5 w-20 rounded-full" />
								<Skeleton className="h-5 w-28 rounded-full" />
							</div>
						</div>
						<Skeleton className="h-6 w-24 rounded-md" />
					</div>
					<Skeleton className="h-px w-full mb-4" />
					<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
						{[...Array(4)].map((_, i) => (
							<div key={i} className="flex flex-col gap-1.5">
								<Skeleton className="h-3 w-20" />
								<Skeleton className="h-4 w-28" />
							</div>
						))}
					</div>
				</CardContent>
			</Card>
			{/* Info grid */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
				{[...Array(4)].map((_, i) => (
					<Card key={i} className="border shadow-sm">
						<CardHeader className="pb-2 pt-4 px-5">
							<Skeleton className="h-3.5 w-24" />
						</CardHeader>
						<CardContent className="px-5 pb-4 pt-0 flex flex-col gap-2">
							{[...Array(3)].map((_, j) => (
								<div key={j} className="flex justify-between py-1.5 border-b border-border last:border-0">
									<Skeleton className="h-3 w-20" />
									<Skeleton className="h-3 w-32" />
								</div>
							))}
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}

// ── Contact block ─────────────────────────────────────────────────────────────

function ContactBlock({
	contact,
}: {
	contact: {
		name: string | null;
		organization: string | null;
		email: string | null;
		phone: string | null;
		street: string | null;
		city: string | null;
		country: string | null;
	} | null;
}) {
	const hasData = contact && (contact.name || contact.organization || contact.email);

	if (!hasData) {
		return (
			<div className="flex flex-col items-center justify-center py-6 text-center">
				<div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center mb-2">
					<Lock className="h-4 w-4 text-muted-foreground" />
				</div>
				<p className="text-xs font-medium text-foreground">Redacted for privacy</p>
				<p className="text-xs text-muted-foreground mt-0.5 max-w-[200px]">
					Registrant data is not publicly available under GDPR or registry policy.
				</p>
			</div>
		);
	}

	return (
		<div className="divide-y divide-border">
			<InfoRow label="Name" value={contact.name} />
			<InfoRow label="Organization" value={contact.organization} />
			<InfoRow label="Email" value={contact.email} copyable />
			<InfoRow label="Phone" value={contact.phone} />
			<InfoRow label="City" value={contact.city} />
			<InfoRow label="Country" value={contact.country} />
		</div>
	);
}

function DomainEventsList({ events }: { events: WhoisData["events"] }) {
	const list = (
		<div className="divide-y divide-border/60">
			{events.map((ev, i) => (
				<div
					key={i}
					className="flex items-start justify-between gap-3 py-1.5 first:pt-0 last:pb-0"
				>
					<div className="min-w-0 flex-1">
						<p className="text-xs font-medium capitalize leading-tight">{ev.action}</p>
						{ev.actor && (
							<p className="mt-0.5 truncate text-[11px] leading-tight text-muted-foreground">
								{ev.actor}
							</p>
						)}
					</div>
					<time className="shrink-0 pt-px text-[11px] tabular-nums leading-tight text-muted-foreground">
						{formatDate(ev.date)}
					</time>
				</div>
			))}
		</div>
	);

	if (events.length > 6) {
		return <ScrollArea className="max-h-40 pr-2">{list}</ScrollArea>;
	}

	return list;
}

function DnssecRecordsList({ records }: { records: WhoisData["dsData"] }) {
	const list = (
		<div className="divide-y divide-border/60">
			{records.map((ds, i) => (
				<div key={i} className="py-1.5 first:pt-0 last:pb-0">
					<div className="flex items-start justify-between gap-3">
						<p className="text-xs font-medium leading-tight tabular-nums">
							Tag {ds.keyTag} · Alg {ds.algorithm} · Type {ds.digestType}
						</p>
						<CopyButton text={ds.digest} />
					</div>
					<p
						className="mt-0.5 truncate font-mono text-[11px] leading-tight text-muted-foreground"
						title={ds.digest}
					>
						{ds.digest}
					</p>
				</div>
			))}
		</div>
	);

	if (records.length > 4) {
		return <ScrollArea className="max-h-40 pr-2">{list}</ScrollArea>;
	}

	return list;
}

// ── Results ───────────────────────────────────────────────────────────────────

function WhoisResults({ data }: { data: WhoisData }) {
	if (data.error) {
		const isNotFound = data.error.toLowerCase().includes("not found");
		return (
			<div className="animate-in fade-in duration-300">
				<Alert
					variant={isNotFound ? "default" : "destructive"}
					className={isNotFound ? "border-border" : ""}
				>
					<AlertCircle className="h-4 w-4" />
					<AlertDescription className="flex flex-col gap-0.5">
						<span className="font-medium">
							{isNotFound ? "Domain not found" : "Lookup failed"}
						</span>
						<span className="text-xs opacity-80">{data.error}</span>
					</AlertDescription>
				</Alert>
			</div>
		);
	}

	const isActive = data.status.some((s) => s.toLowerCase() === "active");

	// Separate "active" from the protection/lock statuses for the header display
	const protectionStatuses = data.status.filter((s) => s.toLowerCase() !== "active");

	return (
		<div className="flex flex-col gap-4 animate-in fade-in duration-300">
			{/* ── Overview banner ──────────────────────────────────────────────── */}
			<Card className="border shadow-sm">
				<CardContent className="p-6">
					<div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
						{/* Domain name + all status badges */}
						<div className="flex flex-col gap-2.5 min-w-0">
							<div className="flex items-center gap-2 flex-wrap">
								<Globe className="h-4 w-4 text-muted-foreground shrink-0" />
								<span className="font-semibold text-lg font-mono tracking-tight truncate">
									{data.domain}
								</span>
								{data.unicodeName && data.unicodeName !== data.domain && (
									<span className="text-xs text-muted-foreground">
										({data.unicodeName})
									</span>
								)}
							</div>

							{/* Status badges row — registered + all EPP status codes */}
							<div className="flex flex-wrap items-center gap-1.5">
								{isActive ? (
									<Badge className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs border-transparent">
										Active
									</Badge>
								) : (
									<Badge variant="secondary" className="text-xs">
										Not registered
									</Badge>
								)}
								{protectionStatuses.map((s) => (
									<Badge
										key={s}
										variant="secondary"
										className={`text-xs ${getStatusColor(s)}`}
									>
										{s}
									</Badge>
								))}
								{data.handle && (
									<Badge
										variant="outline"
										className="text-xs font-mono text-muted-foreground ml-1"
									>
										{data.handle}
									</Badge>
								)}
							</div>
						</div>

					</div>

					<Separator className="my-4" />

					{/* Quick stats */}
					<div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-3">
						<div className="flex flex-col gap-0.5">
							<span className="text-xs text-muted-foreground">Registered</span>
							<span className="text-sm font-medium">{formatDate(data.registrationDate)}</span>
						</div>
						<div className="flex flex-col gap-0.5">
							<span className="text-xs text-muted-foreground">Expires</span>
							<div className="flex items-center gap-1.5 flex-wrap">
								<span className="text-sm font-medium">{formatDate(data.expiryDate)}</span>
								<ExpiryChip iso={data.expiryDate} />
							</div>
						</div>
						<div className="flex flex-col gap-0.5">
							<span className="text-xs text-muted-foreground">Last updated</span>
							<span className="text-sm font-medium">{formatDate(data.updatedDate)}</span>
						</div>
						<div className="flex flex-col gap-0.5">
							<span className="text-xs text-muted-foreground">DNSSEC</span>
							{data.dnssec === "signedDelegation" ? (
								<Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs border-transparent w-fit gap-1">
									<Shield className="h-3 w-3" /> Signed
								</Badge>
							) : data.dnssec === "unsigned" ? (
								<Badge
									variant="outline"
									className="text-xs w-fit gap-1 text-muted-foreground"
								>
									<ShieldOff className="h-3 w-3" /> Unsigned
								</Badge>
							) : (
								<span className="text-sm text-muted-foreground">—</span>
							)}
						</div>
					</div>
				</CardContent>
			</Card>

			{/* ── Info grid ─────────────────────────────────────────────────────── */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
				{/* Registrar */}
				{data.registrar && (
					<Card className="border shadow-sm">
						<CardHeader className="pb-2 pt-5 px-5">
							<SectionHeading icon={Building2} label="Registrar" />
						</CardHeader>
						<CardContent className="px-5 pb-5 pt-1">
							<p
								className="text-sm font-semibold mb-3 truncate"
								title={data.registrar.name ?? ""}
							>
								{data.registrar.name ?? "—"}
							</p>
							<div className="divide-y divide-border">
								<InfoRow label="Handle" value={data.registrar.handle} mono copyable />
								<InfoRow label="IANA ID" value={data.registrar.ianaId} />

								{/* Direct contact info (enriched from entity fetch) */}
								{data.registrar.email && (
									<div className="flex items-center justify-between gap-4 py-2 border-b border-border last:border-0">
										<span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
											<Mail className="h-3 w-3" /> Email
										</span>
										<div className="flex items-center gap-1.5 min-w-0">
											<span
												className="text-xs font-medium truncate"
												title={data.registrar.email}
											>
												{data.registrar.email}
											</span>
											<CopyButton text={data.registrar.email} />
										</div>
									</div>
								)}
								{data.registrar.phone && (
									<div className="flex items-center justify-between gap-4 py-2 border-b border-border last:border-0">
										<span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
											<Phone className="h-3 w-3" /> Phone
										</span>
										<div className="flex items-center gap-1.5 min-w-0">
											<span className="text-xs font-medium">{data.registrar.phone}</span>
											<CopyButton text={data.registrar.phone} />
										</div>
									</div>
								)}
								{(data.registrar.street || data.registrar.city || data.registrar.postalCode) && (
									<div className="flex items-start justify-between gap-4 py-2 border-b border-border last:border-0">
										<span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
											<MapPin className="h-3 w-3" /> Address
										</span>
										<div className="text-xs font-medium text-right space-y-0.5 min-w-0">
											{data.registrar.street && (
												<p className="truncate">{data.registrar.street}</p>
											)}
											{(data.registrar.city || data.registrar.postalCode) && (
												<p className="text-muted-foreground">
													{[data.registrar.city, data.registrar.postalCode]
														.filter(Boolean)
														.join(", ")}
												</p>
											)}
											{data.registrar.country && (
												<p className="text-muted-foreground">{data.registrar.country}</p>
											)}
										</div>
									</div>
								)}

								{/* Separator before abuse section if we have direct contact above */}
								{(data.registrar.email ||
									data.registrar.phone ||
									data.registrar.street) &&
									(data.registrar.abuseEmail || data.registrar.abusePhone) && (
										<div className="pt-1 pb-0.5">
											<p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">
												Abuse Contact
											</p>
										</div>
									)}

								<InfoRow label="Abuse email" value={data.registrar.abuseEmail} copyable />
								<InfoRow label="Abuse phone" value={data.registrar.abusePhone} copyable />

								{/* Website */}
								{data.registrar.url &&
									!data.registrar.url.includes("/entity/") && (
										<div className="flex items-center justify-between gap-4 py-2 last:border-0">
											<span className="text-xs text-muted-foreground shrink-0">
												Website
											</span>
											<a
												href={
													data.registrar.url.startsWith("http")
														? data.registrar.url
														: `https://${data.registrar.url}`
												}
												target="_blank"
												rel="noopener noreferrer"
												className="text-xs text-primary hover:underline underline-offset-2 flex items-center gap-1 truncate min-w-0"
											>
												{safeHostname(data.registrar.url)}
												<ExternalLink className="h-3 w-3 shrink-0" />
											</a>
										</div>
									)}
							</div>
						</CardContent>
					</Card>
				)}

				{/* Registrant */}
				<Card className="border shadow-sm">
					<CardHeader className="pb-2 pt-5 px-5">
						<SectionHeading icon={User} label="Registrant" />
					</CardHeader>
					<CardContent className="px-5 pb-5 pt-1">
						<ContactBlock contact={data.registrant} />
					</CardContent>
				</Card>

				{/* Nameservers */}
				<Card className="border shadow-sm">
					<CardHeader className="pb-2 pt-5 px-5">
						<SectionHeading icon={Server} label="Nameservers" />
					</CardHeader>
					<CardContent className="px-5 pb-5 pt-1">
						{data.nameservers.length > 0 ? (
							<div className="flex flex-col">
								{data.nameservers.map((ns, i) => (
									<div
										key={ns}
										className="flex items-center justify-between py-2 border-b border-border last:border-0 gap-3"
									>
										<div className="flex items-center gap-2 min-w-0">
											<span className="text-xs text-muted-foreground w-4 text-right shrink-0">
												{i + 1}.
											</span>
											<span className="text-xs font-mono font-medium truncate">{ns}</span>
										</div>
										<CopyButton text={ns} />
									</div>
								))}
							</div>
						) : (
							<div className="flex flex-col items-center justify-center py-6 text-center">
								<div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center mb-2">
									<Server className="h-4 w-4 text-muted-foreground" />
								</div>
								<p className="text-xs font-medium text-foreground">No nameservers found</p>
								<p className="text-xs text-muted-foreground mt-0.5">
									This domain may not have active DNS delegation.
								</p>
							</div>
						)}
					</CardContent>
				</Card>

				{/* Admin / tech contacts — only rendered when present (uncommon for gTLDs) */}
				{data.adminContact && (
					<Card className="border shadow-sm">
						<CardHeader className="pb-2 pt-5 px-5">
							<SectionHeading icon={User} label="Admin Contact" />
						</CardHeader>
						<CardContent className="px-5 pb-5 pt-1">
							<ContactBlock contact={data.adminContact} />
						</CardContent>
					</Card>
				)}
				{data.techContact && (
					<Card className="border shadow-sm">
						<CardHeader className="pb-2 pt-5 px-5">
							<SectionHeading icon={User} label="Tech Contact" />
						</CardHeader>
						<CardContent className="px-5 pb-5 pt-1">
							<ContactBlock contact={data.techContact} />
						</CardContent>
					</Card>
				)}
			</div>

			{/* ── DNSSEC DS records (only when signed + records available) ──────── */}
			{data.dnssec === "signedDelegation" && data.dsData.length > 0 && (
				<Card className="border shadow-sm">
					<CardContent className="p-4">
						<SectionHeading icon={Shield} label="DNSSEC — DS Records" />
						<div className="mt-2.5">
							<DnssecRecordsList records={data.dsData} />
						</div>
					</CardContent>
				</Card>
			)}

			{/* ── Domain events ──────────────────────────────────────────────────── */}
			{data.events.length > 0 && (
				<Card className="border shadow-sm">
					<CardContent className="p-4">
						<SectionHeading icon={Activity} label="Domain Events" />
						<div className="mt-2.5">
							<DomainEventsList events={data.events} />
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}

// ── Page ──────────────────────────────────────────────────────────────────────

const EXAMPLE_DOMAINS = ["google.com", "safaricom.co.ke", "cloudflare.com", "bbc.co.uk"];

export default function WhoisCheckerPage() {
	const inputRef = React.useRef<HTMLInputElement>(null);
	const [inputValue, setInputValue] = React.useState("");
	const [queriedDomain, setQueriedDomain] = React.useState<string | null>(null);

	const { data, isLoading, isFetching, isError, error } = trpc.whois.lookup.useQuery(
		{ domain: queriedDomain ?? "" },
		{
			enabled: !!queriedDomain,
			refetchOnWindowFocus: false,
			retry: 1,
			staleTime: 5 * 60 * 1000,
		},
	);

	const handleSearch = () => {
		const clean = sanitizeDomainInput(inputValue);
		if (!clean) return;
		setQueriedDomain(clean);
		// Sync input to cleaned value
		if (clean !== inputValue) setInputValue(clean);
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") handleSearch();
	};

	const setExample = (domain: string) => {
		setInputValue(domain);
		setQueriedDomain(domain);
	};

	const handleNewSearch = () => {
		setInputValue("");
		setQueriedDomain(null);
		requestAnimationFrame(() => inputRef.current?.focus());
	};

	const isSearching = isLoading || isFetching;

	return (
		<div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
			<div className="w-full max-w-4xl mx-auto flex flex-col gap-6">
				{/* ── Header ──────────────────────────────────────────────────────── */}
				<div className="flex flex-col gap-1">
					<h1 className="text-base font-semibold tracking-tight">WHOIS Checker</h1>
					<p className="text-xs text-muted-foreground">
					Look up registration details for any domain worldwide.
				</p>
				</div>

				{/* ── Search card ─────────────────────────────────────────────────── */}
				<Card className="border-0 shadow-lg">
					<CardContent className="p-6">
						<div className="flex gap-2">
							<div className="relative flex-1">
								<Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
								<Input
									ref={inputRef}
									className="pl-9 h-12 text-base"
									placeholder="Enter a domain, e.g. google.com or safaricom.co.ke"
									value={inputValue}
									onChange={(e) => setInputValue(e.target.value)}
									onKeyDown={handleKeyDown}
									autoComplete="off"
									autoCorrect="off"
									autoCapitalize="none"
									spellCheck={false}
								/>
							</div>
							<Button
								className="h-12 px-6 shrink-0"
								onClick={handleSearch}
								disabled={!inputValue.trim() || isSearching}
							>
								{isSearching ? (
									<>
										<Spinner size={16} className="mr-2" />
										Looking up…
									</>
								) : (
									<>
										<Search className="mr-2 h-4 w-4" />
										Lookup
									</>
								)}
							</Button>
						</div>

						{/* Example domains */}
						<div className="flex items-center gap-2 mt-3 flex-wrap">
							<span className="text-xs text-muted-foreground">Try:</span>
							{EXAMPLE_DOMAINS.map((ex) => (
								<button
									key={ex}
									type="button"
									onClick={() => setExample(ex)}
									className="text-xs text-primary hover:underline underline-offset-2 transition-colors"
								>
									{ex}
								</button>
							))}
						</div>
					</CardContent>
				</Card>

				{/* ── tRPC transport error ─────────────────────────────────────────── */}
				{isError && !isLoading && (
					<Alert variant="destructive">
						<AlertCircle className="h-4 w-4" />
						<AlertDescription>
							{error?.message ?? "An error occurred while performing the lookup."}
						</AlertDescription>
					</Alert>
				)}

				{/* ── Loading skeleton ─────────────────────────────────────────────── */}
				{isSearching && !data && <WhoisSkeleton />}

				{/* ── Results ─────────────────────────────────────────────────────── */}
				{!isSearching && data && (
					<>
						<WhoisResults data={data} />
						<div className="flex justify-center pb-4">
							<Button variant="outline" size="sm" onClick={handleNewSearch}>
								<Search className="mr-1.5 h-3.5 w-3.5" />
								Check another domain
							</Button>
						</div>
					</>
				)}

				{/* ── Initial / empty state ────────────────────────────────────────── */}
				{!queriedDomain && !isSearching && (
					<div className="flex flex-col items-center justify-center py-16 text-center">
						<div className="relative mb-5">
							<Globe className="h-16 w-16 text-muted-foreground/20" />
							<div className="absolute -bottom-1 -right-0.5 h-7 w-7 rounded-full bg-background border border-border flex items-center justify-center shadow-sm">
								<Search className="h-3.5 w-3.5 text-muted-foreground" />
							</div>
						</div>
						<p className="text-sm font-medium text-foreground mb-1">Enter a domain to begin</p>
						<p className="text-xs text-muted-foreground max-w-xs">
							Supports any TLD with an RDAP server — .com, .net, .co.ke, .ke, .co.uk, and 590+
							more.
						</p>
					</div>
				)}
			</div>
		</div>
	);
}
