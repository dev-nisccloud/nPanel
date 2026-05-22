"use client";

import * as React from "react";
import type { z } from "zod";
import { X, Download, MessageSquare, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import {
	Sheet,
	SheetClose,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/npanel-ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";

import { creativeAssetVersionSchema } from "./schema";
import { formatFileSize } from "./utils";
import { CustomDocumentViewer } from "./document-viewers/custom-document-viewer";
import { CommentsSheet } from "./comments-sheet";
import { VersionAiAnalysisSheet } from "./version-ai-analysis-sheet";

function isImageMimeType(mimeType: string | undefined | null): boolean {
	if (!mimeType) return false;
	return mimeType.toLowerCase().startsWith("image/");
}

interface VersionDetailSheetProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	version: z.infer<typeof creativeAssetVersionSchema>;
}

export function VersionDetailSheet({
	open,
	onOpenChange,
	version,
}: VersionDetailSheetProps) {
	const [isCommentsOpen, setIsCommentsOpen] = React.useState(false);
	const [aiAnalysisSheetOpen, setAiAnalysisSheetOpen] = React.useState(false);

	const utils = trpc.useUtils();

	const runAiAnalysisMutation = trpc.creativeAssets.runAiImageAnalysis.useMutation({
		onSuccess: () => {
			void utils.creativeAssets.listAiImageAnalyses.invalidate({ versionId: version.id });
		},
		onError: (err) => {
			toast.error(err.message || "AI analysis failed");
			void utils.creativeAssets.listAiImageAnalyses.invalidate({ versionId: version.id });
		},
	});

	const supportsAiImageAnalysis = isImageMimeType(version.mimeType);

	const analysesQuery = trpc.creativeAssets.listAiImageAnalyses.useQuery(
		{ versionId: version.id },
		{ enabled: open && supportsAiImageAnalysis },
	);

	const hasCompletedAnalysis = React.useMemo(() => {
		for (const row of analysesQuery.data ?? []) {
			if (row.status === "COMPLETED") return true;
		}
		return false;
	}, [analysesQuery.data]);

	React.useEffect(() => {
		if (!open) {
			setAiAnalysisSheetOpen(false);
		}
	}, [open]);

	const handleOpenAiAnalysis = React.useCallback(() => {
		if (!supportsAiImageAnalysis) return;
		setAiAnalysisSheetOpen(true);
	}, [supportsAiImageAnalysis]);

	const handleRunAiAnalysisAgain = React.useCallback(() => {
		runAiAnalysisMutation.mutate({ creativeAssetVersionId: version.id });
	}, [version.id, runAiAnalysisMutation]);

	const handleDownload = React.useCallback(async () => {
		if (!version.fileUrl) return;
		try {
			const response = await fetch(version.fileUrl);
			const blob = await response.blob();
			const blobUrl = window.URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = blobUrl;
			link.download = version.fileName ?? "download";
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			setTimeout(() => window.URL.revokeObjectURL(blobUrl), 100);
		} catch {
			window.open(version.fileUrl, "_blank");
		}
	}, [version.fileUrl, version.fileName]);

	return (
		<>
			<style
				dangerouslySetInnerHTML={{
					__html: `
            /* Same color cycle as AI domain search / Zeepo — glow is on the button edge (no nested frame). */
            @keyframes creative-version-ai-glow {
              0%   { box-shadow: 0 0 0 2px rgba(124,58,237,0.78), 0 0 22px 8px rgba(124,58,237,0.34), 0 0 44px 18px rgba(124,58,237,0.14); }
              33%  { box-shadow: 0 0 0 2px rgba(37,99,235,0.78),  0 0 22px 8px rgba(37,99,235,0.34),  0 0 44px 18px rgba(37,99,235,0.14);  }
              66%  { box-shadow: 0 0 0 2px rgba(6,182,212,0.78),  0 0 22px 8px rgba(6,182,212,0.34),  0 0 44px 18px rgba(6,182,212,0.14);  }
              100% { box-shadow: 0 0 0 2px rgba(124,58,237,0.78), 0 0 22px 8px rgba(124,58,237,0.34), 0 0 44px 18px rgba(124,58,237,0.14); }
            }
            @keyframes creative-version-ai-spark-float {
              0%, 100% { transform: translateY(0) scale(1); }
              50%       { transform: translateY(-3px) scale(1.15); }
            }
            @keyframes creative-version-ai-spark-hue {
              0%   { color: #7c3aed; }
              33%  { color: #2563eb; }
              66%  { color: #06b6d4; }
              100% { color: #7c3aed; }
            }
            .creative-version-ai-btn--active {
              border: 0 !important;
              box-shadow: none;
              animation: creative-version-ai-glow 6s linear infinite;
            }
            .creative-version-ai-btn--active:focus-visible {
              outline: 2px solid var(--ring);
              outline-offset: 3px;
            }
            .creative-version-ai-btn--inactive {
              animation: none !important;
              box-shadow: none !important;
              opacity: 0.65;
            }
            .creative-version-ai-btn--active .creative-version-ai-spark {
              color: hsl(var(--primary-foreground));
              animation: creative-version-ai-spark-float 2.5s ease-in-out infinite,
                creative-version-ai-spark-hue 6s linear infinite;
            }
            .creative-version-ai-btn--inactive .creative-version-ai-spark {
              animation: none !important;
              color: hsl(var(--muted-foreground));
            }
          `,
				}}
			/>
			<Sheet open={open} onOpenChange={onOpenChange}>
				<SheetContent
					className="sm:max-w-[90vw] lg:max-w-[85vw] xl:max-w-[80vw] w-full p-0 flex flex-col"
					side="right"
					title={`View file: ${version.fileName}`}
				>
					<div className="flex flex-col h-full overflow-hidden">
						{/* Header - actions as buttons like hosting file-viewer-sheet */}
						<SheetHeader className="px-6 pt-6 pb-4 border-b shrink-0">
							<div className="flex items-start justify-between gap-4">
								<div className="flex items-center gap-3 flex-1 min-w-0">
									<div className="flex-1 min-w-0">
										<SheetTitle className="text-lg font-semibold truncate">
											{version.fileName}
										</SheetTitle>
										<SheetDescription className="flex items-center gap-2 mt-1 flex-wrap">
											<Badge variant="outline" className="text-xs">
												{version.mimeType}
											</Badge>
											<span className="text-xs text-muted-foreground">
												{formatFileSize(version.fileSize)}
											</span>
										</SheetDescription>
									</div>
								</div>
								<div className="flex items-center gap-2 shrink-0">
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={() => setIsCommentsOpen(true)}
										className="gap-2"
									>
										<MessageSquare className="h-4 w-4" />
										View comments
									</Button>
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={handleDownload}
										className="gap-2"
									>
										<Download className="h-4 w-4" />
										Download
									</Button>
									<SheetClose asChild>
										<Button variant="ghost" size="icon" aria-label="Close">
											<X className="h-4 w-4" />
										</Button>
									</SheetClose>
								</div>
							</div>
						</SheetHeader>

						{/* Preview area */}
						<div className="flex-1 min-h-0 w-full bg-white overflow-hidden">
							{version.fileUrl ? (
								<CustomDocumentViewer
									fileUrl={version.fileUrl}
									fileName={version.fileName}
									mimeType={version.mimeType}
								/>
							) : (
								<div className="flex items-center justify-center w-full h-full">
									<div className="text-center space-y-2">
										<p className="text-sm font-medium text-muted-foreground">
											Unable to preview file
										</p>
										<p className="text-xs text-muted-foreground">
											File URL is not available
										</p>
									</div>
								</div>
							)}
						</div>

						<div className="shrink-0 border-t bg-background px-6 py-3 flex justify-end">
							<Tooltip>
								<TooltipTrigger asChild>
									<span
										tabIndex={-1}
										className={cn("inline-flex rounded-xl outline-none", !supportsAiImageAnalysis && "cursor-not-allowed")}
									>
										<Button
											type="button"
											variant="default"
											disabled={!supportsAiImageAnalysis}
											onClick={handleOpenAiAnalysis}
											className={cn(
												"h-10 gap-2 rounded-xl px-4 border-0 shadow-none",
												supportsAiImageAnalysis ? "creative-version-ai-btn--active" : "creative-version-ai-btn--inactive",
											)}
											aria-label={
												hasCompletedAnalysis ? "View AI analysis" : "Run AI analysis"
											}
										>
											<Sparkles className="h-4 w-4 shrink-0 creative-version-ai-spark" aria-hidden />
											<span className="text-sm font-medium">
												{hasCompletedAnalysis ? "View AI analysis" : "Run AI analysis"}
											</span>
										</Button>
									</span>
								</TooltipTrigger>
								<TooltipContent side="top" align="end" sideOffset={8} className="max-w-[280px] text-left leading-snug">
									{supportsAiImageAnalysis ? (
										<p>
											{hasCompletedAnalysis
												? "Open the latest AI scores, rationale, and run history for this version. Start a new run from the analysis panel when you need a fresh pass."
												: "Open the analysis panel and run AI vision on this image when you are ready. Results are saved so you can compare runs over time."}
										</p>
									) : (
										<p>
											AI analysis currently supports image files only. PDFs, video, Office documents, and
											other types will be supported in future versions.
										</p>
									)}
								</TooltipContent>
							</Tooltip>
						</div>
					</div>
				</SheetContent>
			</Sheet>

			<VersionAiAnalysisSheet
				open={aiAnalysisSheetOpen}
				onOpenChange={setAiAnalysisSheetOpen}
				isLoading={runAiAnalysisMutation.isPending}
				onRunNewAnalysis={
					supportsAiImageAnalysis ? handleRunAiAnalysisAgain : undefined
				}
				versionId={version.id}
				internalVersionNumber={version.internalVersionNumber}
				fileName={version.fileName}
			/>

			<CommentsSheet
				open={isCommentsOpen}
				onOpenChange={setIsCommentsOpen}
				version={version}
			/>
		</>
	);
}
