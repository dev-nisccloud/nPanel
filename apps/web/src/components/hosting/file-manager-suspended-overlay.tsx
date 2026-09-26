"use client";

import { ShieldAlert } from "lucide-react";
import { Link, useLocation } from "react-router";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { trpc } from "@/utils/trpc";

/** Plesk webspace gen_info.status: 0 is active. Any other value is suspended or disabled. */
export function isPleskWebspaceActive(status: number | null | undefined): boolean {
	return (status ?? 0) === 0;
}

function subscriptionPageHref(pathname: string, subscriptionId: string): string | null {
	const id = encodeURIComponent(subscriptionId);
	if (pathname.startsWith("/agency")) {
		return `/agency/subscriptions?subscriptionId=${id}`;
	}
	const teamSlug = pathname.split("/").filter(Boolean)[0];
	if (!teamSlug) return null;
	return `/${teamSlug}/subscriptions?subscriptionId=${id}`;
}

export function FileManagerSuspendedOverlay({
	pleskSubscriptionId,
	domain,
}: {
	pleskSubscriptionId: string | number;
	domain?: string | null;
}) {
	const { pathname } = useLocation();
	const isAgency = pathname.startsWith("/agency");
	const teamSlug = isAgency ? undefined : pathname.split("/").filter(Boolean)[0];

	const linkedQuery = trpc.clientSubscriptions.getLinkedIdByPleskId.useQuery(
		{
			pleskSubscriptionId,
			teamSlug,
			domain: domain ?? undefined,
		},
		{ staleTime: 60_000, refetchOnWindowFocus: false },
	);

	const subscriptionId = linkedQuery.data?.subscriptionId ?? null;
	const renewHref =
		subscriptionId && !linkedQuery.isLoading
			? subscriptionPageHref(pathname, subscriptionId)
			: null;

	return (
		<div className="relative min-h-[28rem] overflow-hidden rounded-lg border bg-muted/30">
			<div className="pointer-events-none absolute inset-0 opacity-40">
				<div className="space-y-3 p-6">
					<div className="h-9 w-72 rounded-md bg-muted" />
					<div className="h-10 rounded-md bg-muted" />
					<div className="h-10 rounded-md bg-muted" />
					<div className="h-10 rounded-md bg-muted" />
					<div className="h-10 rounded-md bg-muted" />
				</div>
			</div>
			<div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 p-6 backdrop-blur-sm">
				<div className="mx-auto flex max-w-md flex-col items-center gap-3 text-center">
					<ShieldAlert className="h-8 w-8 text-destructive" />
					<h3 className="text-base font-semibold tracking-tight">
						Your subscription has been suspended
					</h3>
					<p className="text-sm text-muted-foreground">
						You can&apos;t access the file manager or manage this subscription while it is suspended.
					</p>
					{linkedQuery.isLoading ? (
						<Spinner className="mt-2" />
					) : renewHref ? (
						<Button asChild className="mt-2">
							<Link to={renewHref}>Renew subscription</Link>
						</Button>
					) : null}
				</div>
			</div>
		</div>
	);
}
