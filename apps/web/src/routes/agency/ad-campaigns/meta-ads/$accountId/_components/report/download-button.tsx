"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { Spinner } from "@/components/npanel-ui/spinner";
import { pdf, Font } from "@react-pdf/renderer";
import { toast } from "sonner";
import { CampaignReportPDF } from "./report-pdf";

// Font registration state (copied from invoices to ensure availability)
let fontsRegistered = false;
let fontsRegistering = false;

const registerFonts = async (): Promise<boolean> => {
    if (fontsRegistered) return true;
    if (fontsRegistering) {
        return new Promise((resolve) => {
            const checkInterval = setInterval(() => {
                if (fontsRegistered) {
                    clearInterval(checkInterval);
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
                        new Uint8Array(fontData).reduce(
                            (data, byte) => data + String.fromCharCode(byte),
                            ""
                        )
                    );
                    return {
                        src: `data:font/truetype;base64,${base64}`,
                        fontWeight: weight as "normal" | "bold",
                    };
                } catch (error) {
                    console.warn(`Failed to load font ${name}:`, error);
                    return null;
                }
            })
        );

        const validFonts = fonts.filter((font) => font !== null);

        if (validFonts.length > 0) {
            Font.register({
                family: "Geist",
                fonts: validFonts,
            });
            fontsRegistered = true;
            return true;
        }
        return false;
    } catch (error) {
        console.error("Failed to register fonts:", error);
        return false;
    } finally {
        fontsRegistering = false;
    }
};

interface DownloadReportButtonProps {
    campaign: any;
    insights: any;
    dailyPerformance: any[];
    hourlyPerformance: any[];
    engagementActions: any[];
    adSets: any[];
    breakdowns: {
        gender: any;
        platform: any;
        device: any;
        region: any;
        placement: any;
    };
    timeRange: {
        since: string;
        until: string;
    };
    currency: string;
    accountName?: string;
}

export function DownloadReportButton({
    campaign,
    insights,
    dailyPerformance,
    hourlyPerformance,
    engagementActions,
    adSets,
    breakdowns,
    timeRange,
    currency,
    accountName
}: DownloadReportButtonProps) {
    const [isGenerating, setIsGenerating] = useState(false);

    const handleDownload = async () => {
        try {
            setIsGenerating(true);

            // 1. Register Fonts
            await registerFonts();

            // 2. Get Primary Color from Theme
            // We use a small delay to ensure DOM is ready if needed, mostly for safety
            const primaryColor = getComputedStyle(document.documentElement)
                .getPropertyValue('--primary')
                .trim();

            // HSL to Hex conversion might be needed if --primary is HSL.
            // Assuming --primary is standard HSL "deg sat% light%" format in Tailwind/Shadcn
            // Simple converter or fallback to a standard hex if distinct. 
            // For now, let's try to use the HSL string directly or a robust fallback color if it fails in PDF.
            // React-PDF doesn't support CSS variables or HSL well. We need a HEX converter or assume a specific format.
            // If the variable is e.g. "222.2 47.4% 11.2%", we need to wrap it in `hsl(...)`?
            // React-PDF supports hex (e.g. #FFFFFF) best. 
            // Strategy: Convert HSL to Hex or use a hardcoded fallback if parsing fails.

            let safePrimaryColor = '#0f172a'; // Default slate-900

            if (primaryColor) {
                // Basic HSL to Hex logic could go here, or we trust visual testing. 
                // For simplicity in this iteration, keeping it robust:
                // If primaryColor starts with #, use it. If it's space separated numbers, wrap in hsl().
                if (primaryColor.startsWith('#')) {
                    safePrimaryColor = primaryColor;
                } else {
                    // Assume HSL values "H S L" -> hsl(H, S, L)
                    // Note: React-PDF might not fully support HSL. Let's try to pass the raw string if it works, 
                    // but usually it's safer to have a hex. 
                    // Let's assume the user has a Hex theme or we provide a conversion.
                    // Actually, Shadcn themes usually use HSL values for --primary.
                    // We will wrap it in `hsl()` string which might work in some PDF engines,
                    // but safer to use a known color if unsure. 
                    // Let's implement a quick HSL->Hex or just use `hsl(${primaryColor})` and hope React-PDF supports it (v2+ does support some CSS colors).
                    safePrimaryColor = `hsl(${primaryColor})`;
                }
            }

            // 3. Generate PDF
            const blob = await pdf(
                <CampaignReportPDF
                    campaign={campaign}
                    insights={insights}
                    dailyPerformance={dailyPerformance}
                    hourlyPerformance={hourlyPerformance}
                    engagementActions={engagementActions}
                    adSets={adSets}
                    breakdowns={breakdowns}
                    timeRange={timeRange}
                    primaryColor={safePrimaryColor}
                    currency={currency}
                    accountName={accountName}
                />
            ).toBlob();

            // 4. Trigger Download
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${campaign?.name || 'campaign'}_report_${timeRange.since}_${timeRange.until}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast.success("Report downloaded successfully");

        } catch (error) {
            console.error("Failed to generate report:", error);
            toast.error("Failed to generate report");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            disabled={isGenerating}
            className="rounded-full h-8 gap-2 ml-2" /* Pill shaped */
        >
            {isGenerating ? (
                <Spinner className="h-4 w-4" />
            ) : (
                <FileText className="h-4 w-4" />
            )}
            Export Report
        </Button>
    );
}
