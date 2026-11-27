"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { trpc } from "@/utils/trpc";
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { serviceOrderPdfBase64 } from "../_lib/pdf-file";

export function SendServiceOrderDialog({
	open,
	onOpenChange,
	serviceOrderId,
	defaultEmail,
	onSent,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	serviceOrderId: string;
	defaultEmail?: string | null;
	onSent?: () => void;
}) {
	const [email, setEmail] = React.useState(defaultEmail ?? "");
	const [sending, setSending] = React.useState(false);
	React.useEffect(() => {
		if (open) setEmail(defaultEmail ?? "");
	}, [defaultEmail, open]);

	const getById = trpc.salesServiceOrders.getById.useQuery({ id: serviceOrderId }, { enabled: false });
	const sendEmail = trpc.salesServiceOrders.sendEmail.useMutation();

	const handleSend = async () => {
		const toEmail = email.trim();
		if (!toEmail) {
			toast.error("Enter the recipient email address.");
			return;
		}
		try {
			setSending(true);
			const { data: order } = await getById.refetch();
			if (!order) throw new Error("Service order not found");
			const pdfBase64 = await serviceOrderPdfBase64(order);
			await sendEmail.mutateAsync({ serviceOrderId, toEmail, pdfBase64 });
			toast.success("Service order sent", { description: `Email sent to ${toEmail}.` });
			onOpenChange(false);
			onSent?.();
		} catch (error) {
			toast.error("Could not send the service order", {
				description: error instanceof Error ? error.message : "Try again.",
			});
		} finally {
			setSending(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Send service order</DialogTitle>
					<DialogDescription>The client receives the order as a PDF attachment.</DialogDescription>
				</DialogHeader>
				<label className="flex flex-col gap-1.5 text-sm">
					<span className="font-medium">Recipient email</span>
					<Input
						className="min-h-11"
						type="email"
						value={email}
						onChange={(event) => setEmail(event.target.value)}
					/>
				</label>
				<DialogFooter>
					<Button type="button" variant="outline" className="min-h-11" onClick={() => onOpenChange(false)} disabled={sending}>
						Cancel
					</Button>
					<Button type="button" className="min-h-11" onClick={handleSend} disabled={sending}>
						{sending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
						Send order
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
