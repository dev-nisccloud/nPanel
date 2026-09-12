"use client";

import * as React from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Loader2, Mail, Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/sonner";
import { trpc } from "@/utils/trpc";
import { captureEvent } from "@/lib/posthog";
import {
	OrganizationGroupsList,
	groupItemsByOrganization,
} from "@/components/ui/organization-groups-list";
import { SubscriptionViewSheet } from "./agency.subscriptions/_components/subscription-view-sheet";
import { CreateSubscriptionSheet } from "./agency.subscriptions/_components/create-subscription-sheet";
import { SendRenewalEmailDialog } from "./agency.subscriptions/_components/send-renewal-email-dialog";
import { RenewalReminderCronMonitor } from "./agency.subscriptions/_components/renewal-reminder-cron-monitor";

export default function SubscriptionsIndexPage() {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const [searchQuery, setSearchQuery] = React.useState("");
	const [viewSubscriptionId, setViewSubscriptionId] = React.useState<string | null>(null);
	const [sheetOpen, setSheetOpen] = React.useState(false);
	const [createSheetOpen, setCreateSheetOpen] = React.useState(false);
	const [renewalEmailSubscriptionId, setRenewalEmailSubscriptionId] = React.useState<string | null>(null);
	const [runCronOpen, setRunCronOpen] = React.useState(false);
	const utils = trpc.useUtils();

	const {
		data: list,
		isLoading,
		isError,
		error,
		refetch,
		isFetching,
	} = trpc.clientSubscriptions.listForAgency.useQuery({
		limit: 200,
		offset: 0,
	});

	const groups = React.useMemo(
		() =>
			groupItemsByOrganization(
				list ?? [],
				(sub) => ({ teamId: sub.teamId ?? null, teamName: sub.teamName }),
				(sub) => sub.createdAt ?? sub.subscriptionDate,
			),
		[list],
	);

	const cronStatus = trpc.clientSubscriptions.getRenewalReminderCronStatus.useQuery();
	const cronEnabled = cronStatus.data?.enabled ?? true;
	const setCronEnabled = trpc.clientSubscriptions.setRenewalReminderCronEnabled.useMutation({
		onSuccess: (data) => {
			void utils.clientSubscriptions.getRenewalReminderCronStatus.invalidate();
			void utils.clientSubscriptions.listRenewalReminderCronActivity.invalidate();
			toast.success(data.enabled ? "Cron is on" : "Cron is off");
		},
		onError: (e) => toast.error(e.message),
	});

	const runRenewalCron = trpc.clientSubscriptions.runRenewalReminderCron.useMutation({
		onSuccess: (data) => {
			captureEvent("subscription_renewal_reminder_cron_run", {
				queued: data.queued,
				sent: data.inline?.sent ?? null,
				run_id: data.runId,
			});
			void utils.clientSubscriptions.getRenewalReminderCronStatus.invalidate();
			void utils.clientSubscriptions.listRenewalReminderCronRuns.invalidate();
			if (data.queued) {
				toast.success("Renewal reminders queued", {
					description: "Track progress in Cron logs.",
				});
			} else if (data.inline) {
				toast.success("Renewal reminders finished", {
					description: `Sent ${data.inline.sent}, skipped ${data.inline.skipped}, failed ${data.inline.failed} (scanned ${data.inline.scanned}).`,
				});
			} else {
				toast.success("Renewal reminder job started");
			}
			setRunCronOpen(false);
		},
		onError: (e) => toast.error(e.message),
	});

	React.useEffect(() => {
		const id = searchParams.get("subscriptionId");
		if (id) {
			setViewSubscriptionId(id);
			setSheetOpen(true);
		}
	}, [searchParams]);

	return (
		<div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
			<div className="w-full max-w-7xl mx-auto">
				<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<h1 className="text-base font-semibold tracking-tight">Subscriptions</h1>
						<p className="text-xs text-muted-foreground">
							Browse subscriptions by organization, then open individual services.
						</p>
					</div>
					<div className="flex flex-wrap items-center gap-2">
						<RenewalReminderCronMonitor />
						<div className="flex items-center gap-2 rounded-md border px-2 py-1">
							<Switch
								checked={cronEnabled}
								loading={setCronEnabled.isPending}
								onCheckedChange={(checked) =>
									setCronEnabled.mutate({ enabled: checked })
								}
								aria-label={cronEnabled ? "Cron on" : "Cron off"}
							/>
							<span className="text-sm">{cronEnabled ? "On" : "Off"}</span>
						</div>
						<AlertDialog open={runCronOpen} onOpenChange={setRunCronOpen}>
							<AlertDialogTrigger asChild>
								<Button
									size="sm"
									variant="outline"
									disabled={runRenewalCron.isPending || !cronEnabled}
									title={!cronEnabled ? "Cron is off" : undefined}
								>
									{runRenewalCron.isPending ? (
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									) : (
										<Mail className="mr-2 h-4 w-4" />
									)}
									Run renewal reminders
								</Button>
							</AlertDialogTrigger>
							<AlertDialogContent>
								<AlertDialogHeader>
									<AlertDialogTitle>Run renewal reminder emails?</AlertDialogTitle>
									<AlertDialogDescription>
										This will send reminder emails now.
									</AlertDialogDescription>
								</AlertDialogHeader>
								<AlertDialogFooter>
									<AlertDialogCancel disabled={runRenewalCron.isPending}>
										Cancel
									</AlertDialogCancel>
									<AlertDialogAction
										disabled={runRenewalCron.isPending}
										onClick={(e) => {
											e.preventDefault();
											runRenewalCron.mutate({});
										}}
									>
										{runRenewalCron.isPending ? (
											<>
												<Loader2 className="mr-2 h-4 w-4 animate-spin" />
												Running…
											</>
										) : (
											"Run now"
										)}
									</AlertDialogAction>
								</AlertDialogFooter>
							</AlertDialogContent>
						</AlertDialog>
						<Button size="sm" onClick={() => setCreateSheetOpen(true)}>
							<Plus className="mr-2 h-4 w-4" />
							Create subscription
						</Button>
					</div>
				</div>

				<div className="mt-6">
					<OrganizationGroupsList
						groups={groups}
						searchQuery={searchQuery}
						onSearchChange={setSearchQuery}
						itemLabel="subscription"
						isLoading={isLoading}
						isError={isError}
						error={(error as Error) ?? null}
						onRetry={() => refetch()}
						onOpenGroup={(group) =>
							navigate(`/agency/subscriptions/organizations/${group.routeId}`)
						}
						toolbarActions={
							<Button
								variant="outline"
								size="icon"
								onClick={() => refetch()}
								disabled={isFetching}
								title="Refresh"
							>
								<RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
							</Button>
						}
					/>
				</div>
			</div>

			<SubscriptionViewSheet
				subscriptionId={viewSubscriptionId}
				open={sheetOpen}
				onOpenChange={(open) => {
					setSheetOpen(open);
					if (!open) setViewSubscriptionId(null);
				}}
				onSendRenewalEmail={setRenewalEmailSubscriptionId}
			/>

			<CreateSubscriptionSheet
				open={createSheetOpen}
				onOpenChange={setCreateSheetOpen}
			/>

			{renewalEmailSubscriptionId && (
				<SendRenewalEmailDialog
					subscriptionId={renewalEmailSubscriptionId}
					open={!!renewalEmailSubscriptionId}
					onOpenChange={(open) => !open && setRenewalEmailSubscriptionId(null)}
				/>
			)}
		</div>
	);
}
