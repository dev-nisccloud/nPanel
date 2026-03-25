"use client";

import * as React from "react";
import { Send, Loader2 } from "lucide-react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/utils/trpc";
import { toast } from "sonner";
import { transformQuotationToPreviewData } from "@/app/(main)/agency/quotations/[id]/_utils/transformQuotationData";

let fontsRegistered = false;
let fontsRegistering = false;

const registerFonts = async (): Promise<boolean> => {
	if (fontsRegistered) return true;
	if (fontsRegistering) {
		return new Promise((resolve) => {
			const interval = setInterval(() => {
				if (fontsRegistered) {
					clearInterval(interval);
					resolve(true);
				}
			}, 100);
		});
	}
	fontsRegistering = true;
	try {
		const { Font } = await import("@react-pdf/renderer");
		const fontWeights = [
			{ name: "Geist-Thin.ttf", weight: "thin" },
			{ name: "Geist-UltraLight.ttf", weight: "ultralight" },
			{ name: "Geist-Light.ttf", weight: "light" },
			{ name: "Geist-Regular.ttf", weight: "normal" },
			{ name: "Geist-Medium.ttf", weight: "medium" },
			{ name: "Geist-SemiBold.ttf", weight: "semibold" },
			{ name: "Geist-Bold.ttf", weight: "bold" },
			{ name: "Geist-UltraBlack.ttf", weight: "ultrabold" },
		];
		const fonts = await Promise.all(
			fontWeights.map(async ({ name, weight }) => {
				try {
					const res = await fetch(`/font/${name}`);
					if (!res.ok) return null;
					const buf = await res.arrayBuffer();
					const base64 = btoa(
						new Uint8Array(buf).reduce((data, byte) => data + String.fromCharCode(byte), ""),
					);
					return {
						src: `data:font/truetype;base64,${base64}`,
						fontWeight: weight as "thin" | "ultralight" | "light" | "normal" | "medium" | "semibold" | "bold" | "ultrabold",
					};
				} catch {
					return null;
				}
			}),
		);
		const valid = fonts.filter((f): f is NonNullable<typeof f> => f != null);
		if (valid.length > 0) {
			Font.register({ family: "Geist", fonts: valid });
			fontsRegistered = true;
			return true;
		}
		return false;
	} catch (err) {
		console.error("Failed to register fonts:", err);
		return false;
	} finally {
		fontsRegistering = false;
	}
};

export interface SendQuotationDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	quotationId: string;
	defaultEmail?: string | null;
	onSent?: () => void;
}

export function SendQuotationDialog({
	open,
	onOpenChange,
	quotationId,
	defaultEmail,
	onSent,
}: SendQuotationDialogProps) {
	const [email, setEmail] = React.useState(defaultEmail ?? "");
	React.useEffect(() => {
		if (open && defaultEmail) setEmail(defaultEmail);
	}, [open, defaultEmail]);

	const getById = trpc.quotations.getById.useQuery({ id: quotationId }, { enabled: false });
	const sendMutation = trpc.quotations.sendQuotationEmail.useMutation({
		onSuccess: () => {
			toast.success("Quotation sent", { description: `Email sent to ${email}.` });
			onOpenChange(false);
			onSent?.();
		},
		onError: (e) => toast.error("Failed to send email", { description: e.message }),
	});

	const [isSending, setIsSending] = React.useState(false);

	const handleSend = async () => {
		const toSend = email.trim();
		if (!toSend) {
			toast.error("Email required", { description: "Enter the recipient email address." });
			return;
		}
		try {
			setIsSending(true);
			const { data: quotation } = await getById.refetch();
			if (!quotation) throw new Error("Quotation not found");
			await registerFonts();
			const previewData = transformQuotationToPreviewData(quotation);
			const [
				{ Document, Page },
				{ pdf },
				{ QuotationPdfDetails: QuotationPdf },
				{ pdfContainers },
			] = await Promise.all([
				import("@react-pdf/renderer"),
				import("@react-pdf/renderer"),
				import("@/app/(main)/agency/quotations/create/_components/form/quotationPdfDetails"),
				import("@/lib/pdfStyles"),
			]);
			const blob = await pdf(
				<Document>
					<Page size="A4" style={pdfContainers.page}>
						<QuotationPdf
							yourDetails={previewData.yourDetails}
							companyDetails={previewData.companyDetails}
							quotationDetails={previewData.quotationDetails}
							quotationTerms={previewData.quotationTerms}
						/>
					</Page>
				</Document>,
			).toBlob();
			const pdfBase64 = await new Promise<string>((resolve, reject) => {
				const reader = new FileReader();
				reader.onloadend = () =>
					resolve((reader.result as string).split(",")[1] ?? "");
				reader.onerror = reject;
				reader.readAsDataURL(blob);
			});
			await sendMutation.mutateAsync({
				quotationId,
				toEmail: toSend,
				pdfBase64,
			});
		} catch (err) {
			if (!sendMutation.isError) {
				toast.error("Failed to send", {
					description: err instanceof Error ? err.message : "An error occurred",
				});
			}
		} finally {
			setIsSending(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Send quotation by email</DialogTitle>
					<DialogDescription>
						Enter the recipient email address. The quotation will be sent as a PDF attachment.
					</DialogDescription>
				</DialogHeader>
				<div className="grid gap-4 py-4">
					<div className="grid gap-2">
						<Label htmlFor="send-quotation-email">Email address</Label>
						<Input
							id="send-quotation-email"
							type="email"
							placeholder="recipient@example.com"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							disabled={isSending}
						/>
					</div>
				</div>
				<DialogFooter>
					<Button
						type="button"
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={isSending}
					>
						Cancel
					</Button>
					<Button type="button" onClick={handleSend} disabled={isSending}>
						{isSending ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Sending...
							</>
						) : (
							<>
								<Send className="mr-2 h-4 w-4" />
								Send
							</>
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
