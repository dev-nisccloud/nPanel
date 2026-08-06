"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { pdf, Font } from "@react-pdf/renderer";
import { toast } from "@/components/ui/sonner";
import { captureEvent } from "@/lib/posthog";
import { GoogleAdsCampaignReportPDF } from "./report-pdf";

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
                    const base64 = btoa(new Uint8Array(fontData).reduce((data, byte) => data + String.fromCharCode(byte), ""));
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

export type GoogleAdsCampaignReportPayload = {
    customerId: string;
    campaign: any;
    accountName?: string;
    currency: string;
    timeRange: { since: string; until: string };
    campaignTargeting?: Array<{ label: string; content: string }>;
    adGroups: any[];
    dailyPerformance: any[];
    breakdowns: {
        gender?: any;
        device?: any;
        region?: any;
        age_range?: any;
        search_terms?: any;
    };
    keywordsPerformance?: any;
    networkBreakdown?: any;
    timeOfDayBreakdown?: any;
    adGroupTargetingById?: Record<string, any>;
    adsByAdGroupId?: Record<string, any[]>;
};

export function DownloadGoogleAdsReportButton(props: GoogleAdsCampaignReportPayload) {
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

            const blob = await pdf(
                <GoogleAdsCampaignReportPDF
                    customerId={props.customerId}
                    campaign={props.campaign}
                    accountName={props.accountName}
                    currency={props.currency}
                    timeRange={props.timeRange}
                    campaignTargeting={props.campaignTargeting || []}
                    adGroups={props.adGroups || []}
                    dailyPerformance={props.dailyPerformance || []}
                    breakdowns={props.breakdowns || {}}
                    keywordsPerformance={props.keywordsPerformance}
                    networkBreakdown={props.networkBreakdown}
                    timeOfDayBreakdown={props.timeOfDayBreakdown}
                    adGroupTargetingById={props.adGroupTargetingById || {}}
                    adsByAdGroupId={props.adsByAdGroupId || {}}
                    primaryColor={safePrimaryColor}
                />
            ).toBlob();

            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            const name = props.campaign?.name || "campaign";
            link.download = `${name}_google_ads_report_${props.timeRange.since}_${props.timeRange.until}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            captureEvent("google_ads_report_downloaded", {
                report_type: "campaign_pdf",
                date_range: `${props.timeRange.since}_${props.timeRange.until}`,
            });
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

