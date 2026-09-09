"use client";

import * as React from "react";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { trpc } from "@/utils/trpc";
import { toast } from "@/components/ui/sonner";

function formatLogDate(v: string | Date): string {
	const d = v instanceof Date ? v : new Date(v);
	return Number.isNaN(d.getTime()) ? "" : d.toLocaleString();
}

function actorLabel(entry: {
	actorName: string | null;
	actorEmail: string | null;
	actorUserId: string;
}): string {
	return entry.actorName?.trim() || entry.actorEmail?.trim() || entry.actorUserId;
}

interface SubscriptionZeepoAiTokensPanelProps {
	subscriptionId: string;
}

export function SubscriptionZeepoAiTokensPanel({
	subscriptionId,
}: SubscriptionZeepoAiTokensPanelProps) {
	const utils = trpc.useUtils();
	const [amount, setAmount] = React.useState("");
	const [reason, setReason] = React.useState("");

	const walletQuery = trpc.clientSubscriptions.getZeepoAiWallet.useQuery(
		{ subscriptionId },
		{ enabled: !!subscriptionId },
	);
	const logsQuery = trpc.clientSubscriptions.listZeepoAiWalletLogs.useQuery(
		{ subscriptionId, limit: 50 },
		{ enabled: !!subscriptionId },
	);

	const adjustWallet = trpc.clientSubscriptions.adjustZeepoAiWallet.useMutation({
		onSuccess: (result) => {
			setAmount("");
			setReason("");
			void utils.clientSubscriptions.getZeepoAiWallet.invalidate();
			void utils.clientSubscriptions.listZeepoAiWalletLogs.invalidate();
			void utils.zeepoAi.billing.getTokenBalance.invalidate();
			toast.success(
				result.direction === "CREDIT"
					? `Added ${result.tokens} tokens (${result.balanceBefore} → ${result.balanceAfter})`
					: `Removed ${result.tokens} tokens (${result.balanceBefore} → ${result.balanceAfter})`,
			);
		},
		onError: (e) => toast.error(e.message),
	});

	const parsedAmount = Number.parseFloat(amount);
	const tokens =
		Number.isFinite(parsedAmount) && parsedAmount > 0 ? parsedAmount : null;
	const note = reason.trim() || undefined;
	const currentBalance = walletQuery.data?.tokens ?? 0;
	const canRemove = tokens != null && tokens <= currentBalance;

	const submit = (direction: "add" | "remove") => {
		if (tokens == null) {
			toast.error("Enter a token amount greater than zero");
			return;
		}
		adjustWallet.mutate({
			subscriptionId,
			tokens,
			direction,
			reason: note,
		});
	};

	return (
		<section className="space-y-2">
			<h3 className="text-sm font-medium text-muted-foreground">Zeepo AI tokens</h3>
			<div className="rounded-lg border bg-card p-4 space-y-4">
				<div className="flex justify-between items-center gap-2 text-sm">
					<span className="text-muted-foreground">Current balance</span>
					{walletQuery.isLoading ? (
						<Spinner size={16} />
					) : (
						<span className="font-medium tabular-nums">
							{walletQuery.data?.tokensLabel ?? "0"} tokens
						</span>
					)}
				</div>

				<div className="space-y-2">
					<Label htmlFor={`zeepo-ai-token-amount-${subscriptionId}`}>Amount</Label>
					<Input
						id={`zeepo-ai-token-amount-${subscriptionId}`}
						type="number"
						min={1}
						step={1}
						placeholder="e.g. 100"
						value={amount}
						onChange={(e) => setAmount(e.target.value)}
						disabled={adjustWallet.isPending}
					/>
				</div>

				<div className="space-y-2">
					<Label htmlFor={`zeepo-ai-token-reason-${subscriptionId}`}>
						Note <span className="text-muted-foreground font-normal">(optional)</span>
					</Label>
					<Textarea
						id={`zeepo-ai-token-reason-${subscriptionId}`}
						placeholder="Why tokens were added or removed"
						className="resize-none"
						rows={2}
						value={reason}
						onChange={(e) => setReason(e.target.value)}
						disabled={adjustWallet.isPending}
					/>
				</div>

				<div className="flex flex-wrap gap-2">
					<Button
						type="button"
						size="sm"
						onClick={() => submit("add")}
						disabled={adjustWallet.isPending || tokens == null}
					>
						{adjustWallet.isPending ? (
							<Spinner size={14} className="mr-2" />
						) : (
							<Plus className="mr-2 h-4 w-4" />
						)}
						Add tokens
					</Button>
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={() => submit("remove")}
						disabled={adjustWallet.isPending || tokens == null || !canRemove}
					>
						<Minus className="mr-2 h-4 w-4" />
						Remove tokens
					</Button>
				</div>
			</div>

			<div className="rounded-lg border bg-card p-4 space-y-3">
				<h4 className="text-sm font-medium">Token history</h4>
				{logsQuery.isLoading ? (
					<div className="flex justify-center py-6">
						<Spinner size={18} />
					</div>
				) : !logsQuery.data?.length ? (
					<p className="text-sm text-muted-foreground">No token adjustments yet.</p>
				) : (
					<ul className="space-y-3">
						{logsQuery.data.map((entry) => (
							<li key={entry.id} className="rounded-md border p-3 space-y-1">
								<div className="flex items-start justify-between gap-2">
									<p className="text-sm font-medium">
										{entry.direction === "CREDIT" ? "Added" : "Removed"} {entry.tokens}{" "}
										tokens
									</p>
									<span className="text-xs text-muted-foreground shrink-0">
										{formatLogDate(entry.createdAt)}
									</span>
								</div>
								<p className="text-xs text-muted-foreground">
									{entry.balanceBefore} → {entry.balanceAfter} · {actorLabel(entry)}
								</p>
								{entry.reason ? (
									<p className="text-sm text-muted-foreground">{entry.reason}</p>
								) : null}
							</li>
						))}
					</ul>
				)}
			</div>
		</section>
	);
}
