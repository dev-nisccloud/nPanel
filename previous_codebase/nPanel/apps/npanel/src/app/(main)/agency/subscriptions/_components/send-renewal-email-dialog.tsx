"use client";

import * as React from "react";
import { Mail, Loader2 } from "lucide-react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/utils/trpc";
import { toast } from "sonner";

interface SendRenewalEmailDialogProps {
	subscriptionId: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function SendRenewalEmailDialog({
	subscriptionId,
	open,
	onOpenChange,
}: SendRenewalEmailDialogProps) {
	const [to, setTo] = React.useState("");
	const [ccOrBccType, setCcOrBccType] = React.useState<"none" | "cc" | "bcc">("none");
	const [ccOrBccEmail, setCcOrBccEmail] = React.useState("");

	const { data: sub } = trpc.clientSubscriptions.getById.useQuery(
		{ id: subscriptionId },
		{ enabled: open && !!subscriptionId }
	);

	const { data: billingSettings } = trpc.teamBilling.getByTeam.useQuery(
		{ teamId: sub?.teamId ?? "" },
		{ enabled: open && !!sub?.teamId }
	);

	React.useEffect(() => {
		if (open && billingSettings?.billingEmail) {
			setTo(billingSettings.billingEmail);
		}
	}, [open, billingSettings?.billingEmail]);

	const sendMutation = trpc.clientSubscriptions.sendRenewalEmail.useMutation({
		onSuccess: () => {
			toast.success("Renewal email sent");
			onOpenChange(false);
			setTo("");
			setCcOrBccType("none");
			setCcOrBccEmail("");
		},
		onError: (e) => toast.error(e.message),
	});

	const handleSend = () => {
		if (!to.trim()) {
			toast.error("Enter recipient email");
			return;
		}
		if ((ccOrBccType === "cc" || ccOrBccType === "bcc") && !ccOrBccEmail.trim()) {
			toast.error("Enter CC or BCC email");
			return;
		}
		sendMutation.mutate({
			subscriptionId,
			to: to.trim(),
			ccOrBcc:
				ccOrBccType !== "none" && ccOrBccEmail.trim()
					? { type: ccOrBccType as "cc" | "bcc", email: ccOrBccEmail.trim() }
					: undefined,
		});
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Mail className="h-5 w-5" />
						Send renewal email reminder
					</DialogTitle>
					<DialogDescription>
						Recipient will get service name, subscription and expiry dates. Grace period: 7 days
						before suspension (domains: immediate). They must log in to the panel to renew.
					</DialogDescription>
				</DialogHeader>
				<div className="space-y-4 py-2">
					<div className="space-y-2">
						<Label htmlFor="renewal-to">To *</Label>
						<Input
							id="renewal-to"
							type="email"
							placeholder="email@example.com"
							value={to}
							onChange={(e) => setTo(e.target.value)}
							disabled={sendMutation.isPending}
						/>
						{sub?.teamId && billingSettings?.billingEmail && (
							<p className="text-xs text-muted-foreground">
								Pre-filled from team billing email. You can change it.
							</p>
						)}
					</div>
					<div className="space-y-2">
						<Label>CC / BCC (optional, choose one)</Label>
						<Select
							value={ccOrBccType}
							onValueChange={(v) => setCcOrBccType(v as "none" | "cc" | "bcc")}
							disabled={sendMutation.isPending}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="none">None</SelectItem>
								<SelectItem value="cc">CC</SelectItem>
								<SelectItem value="bcc">BCC</SelectItem>
							</SelectContent>
						</Select>
						{(ccOrBccType === "cc" || ccOrBccType === "bcc") && (
							<Input
								type="email"
								placeholder={ccOrBccType === "cc" ? "CC email" : "BCC email"}
								value={ccOrBccEmail}
								onChange={(e) => setCcOrBccEmail(e.target.value)}
								disabled={sendMutation.isPending}
							/>
						)}
					</div>
				</div>
				<div className="flex justify-end gap-2 pt-2">
					<Button variant="outline" onClick={() => onOpenChange(false)} disabled={sendMutation.isPending}>
						Cancel
					</Button>
					<Button onClick={handleSend} disabled={sendMutation.isPending}>
						{sendMutation.isPending ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Sending...
							</>
						) : (
							<>
								<Mail className="mr-2 h-4 w-4" />
								Send
							</>
						)}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
