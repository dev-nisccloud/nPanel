"use client";

import { RefreshCw } from "lucide-react";
import { useNavigate } from "react-router";

import { OnlineBadge, formatSignedInAt } from "@/components/online-status";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { authClient } from "@/lib/auth-client";
import { trpc } from "@/utils/trpc";

const ROLE_LABEL: Record<string, string> = {
	CUSTOMER: "Customer",
	AGENCY_USER: "Staff",
	AGENCY_ADMIN: "Admin",
	AGENCY_SUPER_ADMIN: "Super admin",
};

export default function OnlineUsersPage() {
	const navigate = useNavigate();
	const { data: session, isPending } = authClient.useSession();
	const isStaff = ((session?.user as { role?: string } | undefined)?.role ?? "").includes("AGENCY");

	const { data, isLoading, error, refetch, isFetching } = trpc.userPresence.snapshot.useQuery(
		undefined,
		{ enabled: isStaff, refetchInterval: 60_000 },
	);

	if (isPending || (isStaff && isLoading)) {
		return (
			<div className="flex min-h-[40vh] items-center justify-center">
				<Spinner variant="ellipsis" className="text-primary" />
			</div>
		);
	}

	if (!isStaff) {
		return (
			<div className="mx-auto flex min-h-[40vh] max-w-lg flex-col items-center justify-center px-6 text-center">
				<p className="text-sm text-muted-foreground">Only Nisc HQ staff can see who is signed in.</p>
			</div>
		);
	}

	if (error) {
		return (
			<div className="@container/main flex flex-col gap-4 px-4 py-6 md:px-6 lg:px-8">
				<div className="mx-auto flex w-full max-w-7xl flex-col items-center py-12 text-center">
					<p className="mb-4 text-destructive">{error.message || "Could not load sign-in activity"}</p>
					<Button variant="outline" onClick={() => refetch()}>
						Try again
					</Button>
				</div>
			</div>
		);
	}

	const people = data?.people ?? [];
	const online = people.filter((person) => person.isOnline);

	return (
		<div className="@container/main flex flex-col gap-4 px-4 py-4 md:gap-6 md:px-6 md:py-6 lg:px-8">
			<div className="mx-auto w-full max-w-7xl">
				<div className="flex items-start justify-between gap-4">
					<div className="flex flex-col gap-2">
						<h1 className="text-base font-semibold tracking-tight">Who is signed in</h1>
						<p className="text-xs text-muted-foreground">
							Online means nPanel is open and the session was used in the last{" "}
							{data?.onlineWindowMinutes ?? 5} minutes. Last login is the last time they entered
							their password or Google account.
						</p>
					</div>
					<Button variant="outline" size="icon" onClick={() => refetch()} disabled={isFetching} title="Refresh">
						<RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
					</Button>
				</div>

				<p className="mt-4 text-sm">
					<span className="font-medium">{data?.onlineCount ?? 0}</span>
					<span className="text-muted-foreground"> signed in now</span>
				</p>

				<div className="mt-4 overflow-hidden rounded-lg border bg-card shadow-sm">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="pl-6">Name</TableHead>
								<TableHead>Email</TableHead>
								<TableHead>Account</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Last active</TableHead>
								<TableHead className="pr-6">Last login</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{people.length === 0 ? (
								<TableRow>
									<TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
										No recent sign-ins yet.
									</TableCell>
								</TableRow>
							) : (
								people.map((person) => (
									<TableRow
										key={person.id}
										className={person.role === "CUSTOMER" ? "cursor-pointer" : undefined}
										onClick={() => {
											if (person.role === "CUSTOMER") navigate(`/hq/clients/${person.id}`);
										}}
									>
										<TableCell className="pl-6 font-medium">{person.name}</TableCell>
										<TableCell className="text-muted-foreground">{person.email}</TableCell>
										<TableCell>{ROLE_LABEL[person.role] ?? person.role}</TableCell>
										<TableCell>{person.isOnline ? <OnlineBadge /> : <span className="text-sm text-muted-foreground">Away</span>}</TableCell>
										<TableCell className="text-sm text-muted-foreground">
											{formatSignedInAt(person.lastActiveAt)}
										</TableCell>
										<TableCell className="pr-6 text-sm text-muted-foreground">
											{formatSignedInAt(person.lastLoginAt)}
										</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</div>
				{online.length === 0 ? (
					<p className="mt-3 text-xs text-muted-foreground">Nobody has nPanel open right now. Recent sign-ins are still listed above.</p>
				) : null}
			</div>
		</div>
	);
}
