"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { trpc } from "@/utils/trpc";
import { toast } from "@/components/ui/sonner";

const PROGRESS_STATUS_LABELS: Record<string, string> = {
	NOT_STARTED: "Not started",
	IN_PROGRESS: "In progress",
	ON_HOLD: "On hold",
	COMPLETED: "Completed",
	BLOCKED: "Blocked",
};

function progressBadgeClass(status: string): string {
	const colors: Record<string, string> = {
		NOT_STARTED: "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-200",
		IN_PROGRESS: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200 border-blue-200 dark:border-blue-800",
		ON_HOLD: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800",
		COMPLETED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200 border-green-200 dark:border-green-800",
		BLOCKED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200 border-red-200 dark:border-red-800",
	};
	return colors[status] ?? "";
}

export function isOneTimeService(billingCycle: string | null | undefined): boolean {
	return billingCycle === "ONE_TIME";
}

interface SubscriptionProgressPanelProps {
	subscriptionId: string;
	progressPercent: number | null;
	progressStatus: string | null;
	canEdit: boolean;
}

export function SubscriptionProgressPanel({
	subscriptionId,
	progressPercent,
	progressStatus,
	canEdit,
}: SubscriptionProgressPanelProps) {
	const utils = trpc.useUtils();
	const percent = progressPercent ?? 0;
	const status = progressStatus ?? "NOT_STARTED";
	const [draftPercent, setDraftPercent] = React.useState(percent);
	const [draftStatus, setDraftStatus] = React.useState(status);

	React.useEffect(() => {
		setDraftPercent(percent);
		setDraftStatus(status);
	}, [percent, status]);

	const updateProgress = trpc.clientSubscriptions.updateProgress.useMutation({
		onSuccess: () => {
			void utils.clientSubscriptions.getById.invalidate({ id: subscriptionId });
			void utils.clientSubscriptions.listForAgency.invalidate();
			toast.success("Progress updated");
		},
		onError: (e) => toast.error(e.message),
	});

	const dirty = draftPercent !== percent || draftStatus !== status;

	return (
		<section className="space-y-2">
			<h3 className="text-sm font-medium text-muted-foreground">Progress</h3>
			<div className="rounded-lg border bg-card p-4 space-y-4">
				<div className="flex items-center justify-between gap-2">
					<span className="text-sm text-muted-foreground">Status</span>
					{canEdit ? (
						<Select
							value={draftStatus}
							onValueChange={setDraftStatus}
							disabled={updateProgress.isPending}
						>
							<SelectTrigger className="w-[180px]">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="NOT_STARTED">Not started</SelectItem>
								<SelectItem value="IN_PROGRESS">In progress</SelectItem>
								<SelectItem value="ON_HOLD">On hold</SelectItem>
								<SelectItem value="COMPLETED">Completed</SelectItem>
								<SelectItem value="BLOCKED">Blocked</SelectItem>
							</SelectContent>
						</Select>
					) : (
						<Badge variant="outline" className={progressBadgeClass(status)}>
							{PROGRESS_STATUS_LABELS[status] ?? status}
						</Badge>
					)}
				</div>

				<div className="space-y-2">
					<div className="flex items-center justify-between gap-2 text-sm">
						<span className="text-muted-foreground">Completion</span>
						<span className="font-medium">{canEdit ? draftPercent : percent}%</span>
					</div>
					<Progress value={canEdit ? draftPercent : percent} />
					{canEdit ? (
						<Input
							type="number"
							min={0}
							max={100}
							value={draftPercent}
							onChange={(e) => {
								const n = Number.parseInt(e.target.value, 10);
								setDraftPercent(Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : 0);
							}}
							disabled={updateProgress.isPending}
						/>
					) : null}
				</div>

				{canEdit ? (
					<div className="flex justify-end">
						<Button
							size="sm"
							disabled={!dirty || updateProgress.isPending}
							onClick={() =>
								updateProgress.mutate({
									id: subscriptionId,
									progressPercent: draftPercent,
									progressStatus: draftStatus as
										| "NOT_STARTED"
										| "IN_PROGRESS"
										| "ON_HOLD"
										| "COMPLETED"
										| "BLOCKED",
								})
							}
						>
							{updateProgress.isPending ? (
								<>
									<Spinner size={14} className="mr-2" />
									Saving...
								</>
							) : (
								"Save progress"
							)}
						</Button>
					</div>
				) : null}
			</div>
		</section>
	);
}
