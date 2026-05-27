"use client";

import * as React from "react";
import { CheckCircle2, ExternalLink, Globe, RefreshCw, XCircle } from "lucide-react";
import { Spinner } from "@/components/npanel-ui/spinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ComboboxDropdown, type ComboboxItem } from "@npanel/ui/components/combobox-dropdown";
import { trpc } from "@/utils/trpc";
import {
	buildHostnameWithCustomDomain,
	HIVELOCITY_DEFAULT_HOSTNAME_DOMAIN,
} from "@/lib/hivelocity-default-hostname";

type DomainComboboxItem = ComboboxItem & {
	primaryDomain: string;
	subtitle?: string | null;
};

function isValidHostname(value: string): boolean {
	if (!value.trim()) return false;
	return /^([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/i.test(value.trim());
}

function isDomainProductName(name: string): boolean {
	return /domain/i.test(name);
}

type HivelocityHostnameSectionProps = {
	enabled: boolean;
	hostname: string;
	onHostnameChange: (value: string) => void;
	defaultHostname: string;
	isAgencySide: boolean;
	teamSlug?: string;
	teamId?: string;
	buyDomainHref?: string;
};

export function HivelocityHostnameSection({
	enabled,
	hostname,
	onHostnameChange,
	defaultHostname,
	isAgencySide,
	teamSlug,
	teamId,
	buyDomainHref,
}: HivelocityHostnameSectionProps) {
	const [selectedDomainId, setSelectedDomainId] = React.useState<string | undefined>();
	const [isRestoringDefault, setIsRestoringDefault] = React.useState(false);

	React.useEffect(() => {
		if (enabled) {
			setSelectedDomainId(undefined);
			setIsRestoringDefault(false);
		}
	}, [enabled, defaultHostname]);

	const agencyQuery = trpc.clientSubscriptions.listForAgency.useQuery(
		{ limit: 200 },
		{ enabled: enabled && isAgencySide, staleTime: 60_000 },
	);

	const teamDomainsQuery = trpc.clientSubscriptions.listForTeamDomains.useQuery(
		{ teamSlug: teamSlug ?? "" },
		{ enabled: enabled && !isAgencySide && !!teamSlug, staleTime: 60_000 },
	);

	const teamIdDomainsQuery = trpc.clientSubscriptions.getDomainSubscriptions.useQuery(
		{ teamId: teamId! },
		{ enabled: enabled && !isAgencySide && !!teamId && !teamSlug, staleTime: 60_000 },
	);

	const domainOptions = React.useMemo((): DomainComboboxItem[] => {
		if (isAgencySide) {
			return (agencyQuery.data ?? [])
				.filter(
					(s) =>
						s.primaryDomain?.trim() &&
						isDomainProductName(s.productName) &&
						s.status !== "CANCELLED" &&
						s.status !== "EXPIRED",
				)
				.map((s) => ({
					id: s.id,
					label: s.primaryDomain!.trim(),
					primaryDomain: s.primaryDomain!.trim(),
					subtitle: s.subscriptionName ?? s.teamName ?? s.userName ?? null,
				}));
		}

		if (teamSlug) {
			return (teamDomainsQuery.data ?? [])
				.filter((s) => s.primaryDomain?.trim() && s.status !== "CANCELLED" && s.status !== "EXPIRED")
				.map((s) => ({
					id: s.id,
					label: s.primaryDomain!.trim(),
					primaryDomain: s.primaryDomain!.trim(),
					subtitle: s.subscriptionName ?? s.productPlanName ?? null,
				}));
		}

		return (teamIdDomainsQuery.data ?? [])
			.filter((s) => s.primaryDomain?.trim())
			.map((s) => ({
				id: s.id,
				label: s.primaryDomain!.trim(),
				primaryDomain: s.primaryDomain!.trim(),
				subtitle: s.name ?? null,
			}));
	}, [isAgencySide, agencyQuery.data, teamSlug, teamDomainsQuery.data, teamIdDomainsQuery.data]);

	const isLoadingDomains = isAgencySide
		? agencyQuery.isLoading
		: teamSlug
			? teamDomainsQuery.isLoading
			: teamIdDomainsQuery.isLoading;

	const isDomainError = isAgencySide
		? agencyQuery.isError
		: teamSlug
			? teamDomainsQuery.isError
			: teamIdDomainsQuery.isError;

	const refetchDomains = () => {
		if (isAgencySide) void agencyQuery.refetch();
		else if (teamSlug) void teamDomainsQuery.refetch();
		else void teamIdDomainsQuery.refetch();
	};

	const selectedDomainItem = domainOptions.find((d) => d.id === selectedDomainId);

	const hostnameValid = isValidHostname(hostname);

	const handleUseDefault = () => {
		setIsRestoringDefault(true);
		setSelectedDomainId(undefined);
		onHostnameChange(defaultHostname);
		window.setTimeout(() => setIsRestoringDefault(false), 200);
	};

	const handleDomainSelect = (item: DomainComboboxItem) => {
		setSelectedDomainId(item.id);
		onHostnameChange(buildHostnameWithCustomDomain(defaultHostname, item.primaryDomain));
	};

	const handleHostnameInput = (value: string) => {
		onHostnameChange(value);
		if (selectedDomainId) {
			const selected = domainOptions.find((d) => d.id === selectedDomainId);
			if (selected) {
				const expected = buildHostnameWithCustomDomain(defaultHostname, selected.primaryDomain);
				if (value.trim().toLowerCase() !== expected.toLowerCase()) {
					setSelectedDomainId(undefined);
				}
			}
		}
	};

	const domainsBrowseHref = isAgencySide
		? "/agency/domains"
		: buyDomainHref ?? (teamSlug ? `/${teamSlug}/domains` : undefined);

	const domainsCtaLabel = "Browse domains";

	return (
		<div className="rounded-xl border bg-card p-4 space-y-4">
			<div className="flex items-start justify-between gap-3">
				<div>
					<p className="text-sm font-medium text-foreground">Hostname</p>
					<p className="text-xs text-muted-foreground mt-0.5">
						Fully qualified domain name (FQDN). Pick a domain subscription or use our default hostname.
					</p>
				</div>
				{defaultHostname ? (
					<Button
						type="button"
						variant="outline"
						size="sm"
						className="shrink-0 h-8 text-xs"
						disabled={isRestoringDefault}
						onClick={handleUseDefault}
					>
						{isRestoringDefault ? (
							<>
								<Spinner size={14} className="mr-1.5" />
								Resetting…
							</>
						) : (
							"Use default"
						)}
					</Button>
				) : null}
			</div>

			<div className="space-y-2">
				<Label className="text-xs text-muted-foreground">Domain from subscriptions</Label>
				{isLoadingDomains ? (
					<div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2.5 text-sm text-muted-foreground">
						<Spinner size={18} />
						Loading your domain subscriptions…
					</div>
				) : isDomainError ? (
					<div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 space-y-2">
						<p className="text-sm text-destructive">Could not load domain subscriptions.</p>
						<Button type="button" variant="outline" size="sm" onClick={refetchDomains}>
							<RefreshCw className="h-3.5 w-3.5 mr-1.5" />
							Try again
						</Button>
					</div>
				) : domainOptions.length === 0 ? (
					<div className="rounded-lg border bg-muted/30 p-3 space-y-2">
						<p className="text-sm text-muted-foreground">
							No domain subscriptions found. Register a domain first, or use the default hostname below.
						</p>
						{domainsBrowseHref ? (
							<Button type="button" variant="outline" size="sm" asChild>
								<a
									href={domainsBrowseHref}
									target="_blank"
									rel="noopener noreferrer"
									className="inline-flex items-center gap-1.5"
								>
									{domainsCtaLabel}
									<ExternalLink className="h-3.5 w-3.5" />
								</a>
							</Button>
						) : null}
					</div>
				) : (
					<ComboboxDropdown
						items={domainOptions}
						selectedItem={selectedDomainItem}
						onSelect={handleDomainSelect}
						placeholder="Select a domain subscription…"
						searchPlaceholder="Search domains…"
						emptyResults="No matching domains"
						renderListItem={({ item, isChecked }) => (
							<div className="flex flex-col gap-0.5 py-0.5">
								<span className="font-medium">{item.label}</span>
								{item.subtitle ? (
									<span className="text-xs text-muted-foreground">{item.subtitle}</span>
								) : null}
								{isChecked ? (
									<span className="text-[10px] uppercase tracking-wide text-primary">Selected</span>
								) : null}
							</div>
						)}
					/>
				)}
			</div>

			<div className="space-y-2">
				<Label htmlFor="hivelocity-hostname" className="text-xs text-muted-foreground">
					Hostname (FQDN)
				</Label>
				<div className="relative">
					<Input
						id="hivelocity-hostname"
						type="text"
						placeholder={`e.g. server.${HIVELOCITY_DEFAULT_HOSTNAME_DOMAIN}`}
						value={hostname}
						onChange={(e) => handleHostnameInput(e.target.value)}
						className={cnInputState(hostname.trim(), hostnameValid)}
					/>
					{hostname.trim() ? (
						hostnameValid ? (
							<CheckCircle2
								className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-primary"
								aria-hidden
							/>
						) : (
							<XCircle
								className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-destructive"
								aria-hidden
							/>
						)
					) : null}
				</div>
				{!hostname.trim() ? (
					<p className="text-xs text-muted-foreground">Required for provisioning.</p>
				) : hostnameValid ? (
					<p className="text-xs text-muted-foreground">Looks good.</p>
				) : (
					<p className="text-xs text-destructive">Enter a valid FQDN (e.g. server.example.com)</p>
				)}
			</div>

			{domainsBrowseHref ? (
				<div className="rounded-lg border border-dashed bg-muted/20 px-4 py-3">
					<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<div className="flex items-start gap-2 min-w-0">
							<Globe className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
							<div>
								<p className="text-sm font-medium text-foreground">Need a domain for this hostname?</p>
								<p className="text-xs text-muted-foreground mt-0.5">
									Register or manage domains, then return here to pick one.
								</p>
							</div>
						</div>
						<Button type="button" variant="outline" size="sm" className="shrink-0" asChild>
							<a
								href={domainsBrowseHref}
								target="_blank"
								rel="noopener noreferrer"
								className="inline-flex items-center gap-1.5"
							>
								{domainsCtaLabel}
								<ExternalLink className="h-3.5 w-3.5" />
							</a>
						</Button>
					</div>
				</div>
			) : null}
		</div>
	);
}

function cnInputState(hasValue: boolean, valid: boolean): string {
	if (!hasValue) return "pr-10";
	return valid
		? "pr-10 border-primary/50 focus-visible:ring-primary/30"
		: "pr-10 border-destructive focus-visible:ring-destructive/30";
}
