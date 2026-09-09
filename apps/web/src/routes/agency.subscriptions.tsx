"use client";

import * as React from "react";
import { useSearchParams } from "react-router";
import { Loader2, Mail, Plus } from "lucide-react";
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
import { toast } from "@/components/ui/sonner";
import { trpc } from "@/utils/trpc";
import { captureEvent } from "@/lib/posthog";
import { SubscriptionsTable } from "./agency.subscriptions/_components/subscriptions-table";
import { SubscriptionViewSheet } from "./agency.subscriptions/_components/subscription-view-sheet";
import { SubscriptionEditSheet } from "./agency.subscriptions/_components/subscription-edit-sheet";
import { CreateSubscriptionSheet } from "./agency.subscriptions/_components/create-subscription-sheet";
import { SendRenewalEmailDialog } from "./agency.subscriptions/_components/send-renewal-email-dialog";
import { RenewalReminderCronMonitor } from "./agency.subscriptions/_components/renewal-reminder-cron-monitor";

export default function SubscriptionsPage() {
	const [searchParams] = useSearchParams();
	const [viewSubscriptionId, setViewSubscriptionId] = React.useState<string | null>(null);
	const [sheetOpen, setSheetOpen] = React.useState(false);
	const [editSubscriptionId, setEditSubscriptionId] = React.useState<string | null>(null);
	const [editSheetOpen, setEditSheetOpen] = React.useState(false);
	const [createSheetOpen, setCreateSheetOpen] = React.useState(false);
	const [renewalEmailSubscriptionId, setRenewalEmailSubscriptionId] = React.useState<string | null>(null);
	const [runCronOpen, setRunCronOpen] = React.useState(false);
	const utils = trpc.useUtils();

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

	// Open view sheet when landing with ?subscriptionId=xxx (e.g. from hosting client subscriptions)
	React.useEffect(() => {
		const id = searchParams.get("subscriptionId");
		if (id) {
			setViewSubscriptionId(id);
			setSheetOpen(true);
		}
	}, [searchParams]);

	const handleViewSubscription = (id: string) => {
		setViewSubscriptionId(id);
		setSheetOpen(true);
	};

	const handleEditSubscription = (id: string) => {
		setEditSubscriptionId(id);
		setEditSheetOpen(true);
	};

	const handleSendRenewalEmail = (id: string) => {
		setRenewalEmailSubscriptionId(id);
	};

	return (
		<div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
			<div className="w-full max-w-7xl mx-auto">
				<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<h1 className="text-base font-semibold tracking-tight">Subscriptions</h1>
						<p className="text-xs text-muted-foreground">
							View your subscriptions and services
						</p>
					</div>
					<div className="flex flex-wrap items-center gap-2">
						<RenewalReminderCronMonitor />
						<AlertDialog open={runCronOpen} onOpenChange={setRunCronOpen}>
							<AlertDialogTrigger asChild>
								<Button
									size="sm"
									variant="outline"
									disabled={runRenewalCron.isPending}
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
										Scans all subscriptions that are expired or due within 7 days and
										sends reminder emails to each team&apos;s billing address. Already
										reminded in the last day are skipped. This is the same job that
										runs daily at 00:00 UTC.
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
					<SubscriptionsTable
						onViewSubscription={handleViewSubscription}
						onEditSubscription={handleEditSubscription}
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
				onSendRenewalEmail={handleSendRenewalEmail}
			/>

			<SubscriptionEditSheet
				subscriptionId={editSubscriptionId}
				open={editSheetOpen}
				onOpenChange={(open) => {
					setEditSheetOpen(open);
					if (!open) setEditSubscriptionId(null);
				}}
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
