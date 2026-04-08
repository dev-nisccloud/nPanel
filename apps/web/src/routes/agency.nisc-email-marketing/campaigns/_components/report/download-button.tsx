"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { pdf, Font } from "@react-pdf/renderer";
import { toast } from "@/components/ui/sonner";
import { NiscEmailMarketingReportPDF } from "./report-pdf";

let fontsRegistered = false;
let fontsRegistering = false;

const registerFonts = async (): Promise<boolean> => {
	if (fontsRegistered) return true;
	if (fontsRegistering) {
		return new Promise((resolve) => {
			const t = setInterval(() => {
				if (fontsRegistered) {
					clearInterval(t);
					resolve(true);
				}
			}, 100);
		});
	}

	fontsRegistering = true;
	try {
		const fontWeights = [
			{ name: "Geist-Regular.ttf", weight: "normal" },
			{ name: "Geist-Bold.ttf", weight: "bold" },
		];

		const fonts = await Promise.all(
			fontWeights.map(async ({ name, weight }) => {
				try {
					const response = await fetch(`/font/${name}`);
					if (!response.ok) return null;
					const fontData = await response.arrayBuffer();
					const base64 = btoa(
						new Uint8Array(fontData).reduce((data, byte) => data + String.fromCharCode(byte), "")
					);
					return { src: `data:font/truetype;base64,${base64}`, fontWeight: weight as "normal" | "bold" };
				} catch {
					return null;
				}
			})
		);

		const validFonts = fonts.filter(Boolean) as Array<{ src: string; fontWeight: "normal" | "bold" }>;
		if (validFonts.length) {
			Font.register({ family: "Geist", fonts: validFonts });
			fontsRegistered = true;
			return true;
		}
		return false;
	} finally {
		fontsRegistering = false;
	}
};

export type NiscEmailMarketingReportPayload = {
	campaign: any;
	summary: any;
	bounceBreakdown: any;
	topClickedLinks: any[];
	report: any;
};

export function DownloadNiscEmReportButton(props: NiscEmailMarketingReportPayload) {
	const [isGenerating, setIsGenerating] = useState(false);

	const handleDownload = async () => {
		try {
			setIsGenerating(true);
			await registerFonts();

			const primaryColorRaw = getComputedStyle(document.documentElement).getPropertyValue("--primary").trim();
			const safePrimaryColor = primaryColorRaw
				? primaryColorRaw.startsWith("#")
					? primaryColorRaw
					: `hsl(${primaryColorRaw})`
				: "#0f172a";

			const generatedAt = new Date().toISOString();
			const blob = await pdf(
				<NiscEmailMarketingReportPDF
					campaign={props.campaign}
					summary={props.summary}
					bounceBreakdown={props.bounceBreakdown}
					topClickedLinks={props.topClickedLinks}
					report={props.report}
					primaryColor={safePrimaryColor}
					generatedAt={generatedAt}
				/>
			).toBlob();

			const url = window.URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;
			const name = props.campaign?.name || "campaign";
			link.download = `${name}_nisc_email_marketing_report.pdf`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			window.URL.revokeObjectURL(url);

			toast.success("Report downloaded successfully");
		} catch (e) {
			console.error(e);
			toast.error("Failed to generate report");
		} finally {
			setIsGenerating(false);
		}
	};

	return (
		<Button
			variant="default"
			size="sm"
			onClick={handleDownload}
			disabled={isGenerating}
			className="rounded-full h-8 gap-2 text-primary-foreground"
		>
			{isGenerating ? <Spinner className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
			Export Report
		</Button>
	);
}

