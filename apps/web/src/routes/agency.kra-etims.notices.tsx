"use client";

import * as React from "react";
import { format, formatDistanceToNowStrict, isValid, parse } from "date-fns";
import { Bell, ExternalLink, RefreshCw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/utils/trpc";
import { ETimsInitializationGuard } from "@/components/etims/etims-initialization-guard";
import { LAST_REQ_DT, unwrapKraList } from "./agency.kra-etims/_lib/etims-kra";

function parseNoticeDate(value?: string | null): Date | null {
	if (!value) return null;
	const raw = String(value).trim();
	if (!raw) return null;

	if (/^\d{14}$/.test(raw)) {
		const parsed = parse(raw, "yyyyMMddHHmmss", new Date());
		return isValid(parsed) ? parsed : null;
	}
	if (/^\d{8}$/.test(raw)) {
		const parsed = parse(raw, "yyyyMMdd", new Date());
		return isValid(parsed) ? parsed : null;
	}

	const parsed = new Date(raw);
	return isValid(parsed) ? parsed : null;
}

function formatNoticeDate(value?: string | null): string {
	const date = parseNoticeDate(value);
	if (!date) return "";
	return `${formatDistanceToNowStrict(date, { addSuffix: true })} (${format(date, "dd MMMM yyyy, hh:mm:ss a")})`;
}

function noticeField(notice: Record<string, unknown>, ...keys: string[]) {
	for (const key of keys) {
		const value = notice[key];
		if (value != null && String(value).trim()) return String(value);
	}
	return "";
}

function kraPortalOrigin(isSandbox: boolean) {
	return isSandbox ? "https://etims-sbx.kra.go.ke" : "https://etims.kra.go.ke";
}

function decodeHtmlEntities(value: string) {
	return value
		.replace(/&amp;/g, "&")
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">");
}

/** KRA `dtlUrl` / body hrefs — never resolve relative paths against nPanel. */
function resolveKraNoticeUrl(raw: string | null | undefined, isSandbox: boolean): string | null {
	if (!raw) return null;
	const value = decodeHtmlEntities(raw.trim());
	if (!value || value === "-" || /^null$/i.test(value)) return null;

	const asUrl = (input: string) => {
		try {
			return new URL(input).href;
		} catch {
			return null;
		}
	};

	if (/^https?:\/\//i.test(value)) return asUrl(value);
	if (value.startsWith("//")) return asUrl(`https:${value}`);

	const hostAndPath = value.replace(/^\/+/, "");
	if (/^([a-z0-9-]+\.)+[a-z]{2,}([/:?#].*)?$/i.test(hostAndPath)) {
		return asUrl(`https://${hostAndPath}`);
	}

	if (value.startsWith("/") || (!/\s/.test(value) && value.includes("/"))) {
		const path = value.startsWith("/") ? value : `/${value}`;
		return asUrl(`${kraPortalOrigin(isSandbox)}${path}`);
	}

	return null;
}

type NoticeBodyPart = { type: "text"; value: string } | { type: "link"; href: string; label: string };

const BARE_URL_RE = /(https?:\/\/[^\s<]+)|((?:www\.)?(?:[a-z0-9-]+\.)*kra\.go\.ke[^\s<]*)/gi;

function linkifyPlainText(text: string, isSandbox: boolean): NoticeBodyPart[] {
	const parts: NoticeBodyPart[] = [];
	const source = decodeHtmlEntities(text);
	let lastIndex = 0;
	for (const match of source.matchAll(BARE_URL_RE)) {
		const index = match.index ?? 0;
		if (index > lastIndex) {
			parts.push({ type: "text", value: source.slice(lastIndex, index) });
		}
		const raw = match[0].replace(/[),.;]+$/, "");
		const href = resolveKraNoticeUrl(raw, isSandbox);
		if (href) parts.push({ type: "link", href, label: raw });
		else parts.push({ type: "text", value: match[0] });
		lastIndex = index + match[0].length;
	}
	if (lastIndex < source.length) {
		parts.push({ type: "text", value: source.slice(lastIndex) });
	}
	return parts.length ? parts : [{ type: "text", value: source }];
}

function noticeBodyParts(text: string, isSandbox: boolean): NoticeBodyPart[] {
	const withBreaks = text.replace(/<br\s*\/?>/gi, "\n").replace(/<\/p>/gi, "\n").replace(/<\/div>/gi, "\n");
	const parts: NoticeBodyPart[] = [];
	const anchorRe = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
	let lastIndex = 0;
	let match: RegExpExecArray | null;
	while ((match = anchorRe.exec(withBreaks))) {
		if (match.index > lastIndex) {
			parts.push(
				...linkifyPlainText(withBreaks.slice(lastIndex, match.index).replace(/<[^>]+>/g, ""), isSandbox),
			);
		}
		const href = resolveKraNoticeUrl(match[1], isSandbox);
		const label = match[2].replace(/<[^>]+>/g, "").trim() || href || match[1];
		if (href) parts.push({ type: "link", href, label });
		else parts.push({ type: "text", value: label });
		lastIndex = match.index + match[0].length;
	}
	if (lastIndex < withBreaks.length) {
		parts.push(...linkifyPlainText(withBreaks.slice(lastIndex).replace(/<[^>]+>/g, ""), isSandbox));
	}
	return parts;
}

function NoticeBody({ text, isSandbox }: { text: string; isSandbox: boolean }) {
	const parts = React.useMemo(() => noticeBodyParts(text, isSandbox), [text, isSandbox]);
	return (
		<div className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
			{parts.map((part, i) =>
				part.type === "link" ? (
					<a
						key={`${part.href}-${i}`}
						href={part.href}
						target="_blank"
						rel="noreferrer"
						className="font-medium text-primary underline underline-offset-2 break-all"
					>
						{part.label}
					</a>
				) : (
					<React.Fragment key={i}>{part.value}</React.Fragment>
				),
			)}
		</div>
	);
}

export default function ETimsNoticesPage() {
	const [searchQuery, setSearchQuery] = React.useState("");
	const { data: etimsConfig } = trpc.etims.auth.getConfiguration.useQuery();
	const isSandbox = Boolean(
		(etimsConfig as { config?: { isSandbox?: boolean } } | undefined)?.config?.isSandbox,
	);

	const { data, isLoading, refetch, isFetching } = trpc.etims.data.getNotices.useQuery({
		lastReqDt: LAST_REQ_DT,
	});
	const noticeListQuery = trpc.etims.data.getNoticeList.useQuery(
		{ lastReqDt: LAST_REQ_DT },
		{ enabled: false },
	);

	const notices = React.useMemo(() => {
		const fromDashboard = unwrapKraList(data, "noticeList", "notices", "itemList");
		const list = fromDashboard.length
			? fromDashboard
			: unwrapKraList(noticeListQuery.data, "noticeList", "notices", "itemList");

		return [...list].sort((a, b) => {
			const aTime = parseNoticeDate(noticeField(a, "regDt", "noticeDt", "cfmDt"))?.getTime() ?? 0;
			const bTime = parseNoticeDate(noticeField(b, "regDt", "noticeDt", "cfmDt"))?.getTime() ?? 0;
			return bTime - aTime;
		});
	}, [data, noticeListQuery.data]);

	const filtered = React.useMemo(() => {
		if (!searchQuery.trim()) return notices;
		const q = searchQuery.toLowerCase().trim();
		return notices.filter((n) =>
			[n.title, n.noticeTitle, n.subject, n.cont, n.content, n.dtls, n.dtlUrl, n.noticeNo, n.regrNm]
				.map((v) => String(v ?? "").toLowerCase())
				.some((v) => v.includes(q)),
		);
	}, [notices, searchQuery]);

	const refresh = async () => {
		await refetch();
		if (!unwrapKraList(data, "noticeList", "notices", "itemList").length) {
			await noticeListQuery.refetch();
		}
	};

	return (
		<ETimsInitializationGuard>
			<div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
				<div className="w-full max-w-3xl mx-auto">
					<div className="flex flex-col gap-2">
						<h1 className="text-base font-semibold tracking-tight">KRA notices</h1>
						<p className="text-xs text-muted-foreground">
							Official eTIMS notices for this device PIN. These are read from KRA, not composed locally.
						</p>
					</div>

					<div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
						<div className="relative flex-1 w-full">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
							<Input
								placeholder="Search notices…"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="pl-9"
							/>
						</div>
						<Button variant="outline" onClick={() => refresh()} disabled={isLoading || isFetching}>
							<RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
							Refresh
						</Button>
					</div>

					<div className="mt-8">
						{isLoading ? (
							<ol className="relative space-y-6 border-l border-border ml-2.5 pl-6">
								{Array.from({ length: 3 }).map((_, i) => (
									<li key={i} className="relative">
										<span className="absolute -left-[31px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-background bg-muted" />
										<div className="rounded-xl border bg-card p-5 space-y-3">
											<Skeleton className="h-4 w-24" />
											<Skeleton className="h-5 w-3/4" />
											<Skeleton className="h-16 w-full" />
										</div>
									</li>
								))}
							</ol>
						) : filtered.length === 0 ? (
							<div className="rounded-xl border bg-card px-6 py-14 text-center">
								<Bell className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
								<h3 className="text-lg font-medium">
									{searchQuery.trim() ? "No matching notices" : "No notices"}
								</h3>
								<p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
									{searchQuery.trim()
										? "Try a different search."
										: "KRA has not issued any notices for this PIN since the last request date."}
								</p>
							</div>
						) : (
							<ol className="relative space-y-6 border-l border-border ml-2.5 pl-6">
								{filtered.map((notice, index) => {
									const title = noticeField(notice, "title", "noticeTitle", "subject") || `Notice ${index + 1}`;
									const body = noticeField(notice, "cont", "content", "dtls");
									const dateLabel = formatNoticeDate(noticeField(notice, "regDt", "noticeDt", "cfmDt"));
									const noticeNo = noticeField(notice, "noticeNo");
									const detailUrl = resolveKraNoticeUrl(noticeField(notice, "dtlUrl"), isSandbox);
									const registrar = noticeField(notice, "regrNm");

									return (
										<li key={noticeNo || String(notice.id ?? index)} className="relative">
											<span className="absolute -left-[31px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-background bg-primary" />
											<article className="rounded-xl border bg-card p-5 shadow-sm">
												<div className="flex flex-wrap items-start justify-between gap-2">
													{dateLabel ? (
														<time className="text-xs text-muted-foreground">{dateLabel}</time>
													) : (
														<span className="text-xs text-muted-foreground">Date not provided</span>
													)}
													{noticeNo ? (
														<Badge variant="secondary" className="font-mono text-[10px]">
															{noticeNo}
														</Badge>
													) : null}
												</div>
												<h2 className="mt-2 text-sm font-semibold leading-snug">{title}</h2>
												{registrar ? (
													<p className="mt-1 text-xs text-muted-foreground">From {registrar}</p>
												) : null}
												{body ? (
													<NoticeBody text={body} isSandbox={isSandbox} />
												) : (
													<p className="mt-3 text-sm text-muted-foreground">No body returned by KRA.</p>
												)}
												{detailUrl ? (
													<a
														href={detailUrl}
														target="_blank"
														rel="noreferrer"
														className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
													>
														Open attached notice
														<ExternalLink className="h-3 w-3" />
													</a>
												) : null}
											</article>
										</li>
									);
								})}
							</ol>
						)}
					</div>
				</div>
			</div>
		</ETimsInitializationGuard>
	);
}
