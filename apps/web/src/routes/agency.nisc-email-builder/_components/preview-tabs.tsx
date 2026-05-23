"use client";

import * as React from "react";
import { ImageIcon, Mail, Plus, CheckCircle2, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export type DesignVariation = {
	id: string;
	url: string;
	notes?: string;
};

type PreviewTabsProps = {
	creativeDesignUrl: string | null | undefined;
	htmlContent: string | null | undefined;
	isDesigning: boolean;
	isBuilding: boolean;
	previewWidth: "desktop" | "mobile";
	onPreviewWidthChange: (w: "desktop" | "mobile") => void;
	variations?: DesignVariation[];
	selectedVariationId?: string | null;
	onSelectVariation?: (variationId: string) => void;
	onGenerateVariation?: () => void;
	isGeneratingVariation?: boolean;
};

const DESIGN_PHRASES = [
	"Crafting your visual identity…",
	"Laying out your email canvas…",
	"Applying brand colours and hierarchy…",
	"Composing the creative concept…",
	"Perfecting the design details…",
];

function DesigningLoader() {
	const [phraseIdx, setPhraseIdx] = React.useState(0);

	React.useEffect(() => {
		const t = setInterval(() => {
			setPhraseIdx((i) => (i + 1) % DESIGN_PHRASES.length);
		}, 2600);
		return () => clearInterval(t);
	}, []);

	return (
		<div className="flex flex-col items-center gap-6 py-16 max-w-sm">
			<div className="w-[260px] rounded-xl border bg-background shadow-lg overflow-hidden">
				<div className="h-10 bg-muted/60 flex items-center justify-center">
					<Skeleton className="h-4 w-24" />
				</div>
				<div className="relative bg-muted h-28 flex items-center justify-center overflow-hidden">
					<div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
					<Skeleton className="h-24 w-full rounded-none" />
				</div>
				<div className="p-4 space-y-2.5">
					<Skeleton className="h-4 w-3/4" />
					<Skeleton className="h-3 w-full" />
					<Skeleton className="h-3 w-5/6" />
					<div className="pt-1">
						<Skeleton className="h-8 w-28 rounded-md" />
					</div>
					<div className="pt-1 space-y-1.5">
						<Skeleton className="h-2.5 w-full" />
						<Skeleton className="h-2.5 w-4/5" />
						<Skeleton className="h-2.5 w-3/5" />
					</div>
				</div>
				<div className="h-7 bg-muted/40 flex items-center justify-center">
					<Skeleton className="h-2 w-32" />
				</div>
			</div>
			<div className="flex flex-col items-center gap-2">
				<div className="flex items-center gap-2">
					<Spinner size={14} className="text-primary" />
					<p key={phraseIdx} className="text-sm font-medium text-foreground">
						{DESIGN_PHRASES[phraseIdx]}
					</p>
				</div>
				<p className="text-xs text-muted-foreground text-center">
					Your personalised design will appear here when ready.
				</p>
			</div>
		</div>
	);
}

function BuildingLoader() {
	return (
		<div className="flex flex-col items-center gap-5 py-16 max-w-sm">
			<div className="w-[260px] rounded-xl border bg-background shadow-lg overflow-hidden opacity-70">
				<div className="h-10 bg-muted/60 flex items-center justify-center">
					<Skeleton className="h-3 w-20" />
				</div>
				<div className="p-4 space-y-2">
					<Skeleton className="h-3 w-3/4" />
					<Skeleton className="h-3 w-full" />
					<Skeleton className="h-3 w-5/6" />
					<Skeleton className="h-7 w-24 rounded-md mt-1" />
				</div>
				<div className="h-6 bg-muted/40 flex items-center justify-center">
					<Skeleton className="h-2 w-28" />
				</div>
			</div>
			<div className="flex flex-col items-center gap-2">
				<div className="flex items-center gap-2">
					<Spinner size={14} className="text-primary" />
					<p className="text-sm font-medium">Assembling your HTML email…</p>
				</div>
				<p className="text-xs text-muted-foreground text-center">
					Adding live links, images, and brand styling.
				</p>
			</div>
		</div>
	);
}

/**
 * Variation toolbar — rendered between tab header and the preview image.
 * Shown any time a creative design exists (even just 1 variation).
 */
function VariationToolbar({
	variations,
	selectedVariationId,
	onSelectVariation,
	onGenerateVariation,
	isGeneratingVariation,
	isDesigning,
}: {
	variations: DesignVariation[];
	selectedVariationId: string | null | undefined;
	onSelectVariation?: (id: string) => void;
	onGenerateVariation?: () => void;
	isGeneratingVariation?: boolean;
	isDesigning?: boolean;
}) {
	const thumbsRef = React.useRef<HTMLDivElement>(null);

	const selectedIdx = variations.findIndex((v) => v.id === selectedVariationId);
	const canPrev = selectedIdx > 0;
	const canNext = selectedIdx < variations.length - 1;

	const go = (delta: -1 | 1) => {
		const next = variations[selectedIdx + delta];
		if (next) onSelectVariation?.(next.id);
	};

	// Scroll the selected thumbnail into view whenever it changes
	React.useEffect(() => {
		if (!thumbsRef.current || selectedIdx < 0) return;
		const el = thumbsRef.current.children[selectedIdx] as HTMLElement | undefined;
		el?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
	}, [selectedIdx]);

	const isBusy = isDesigning || isGeneratingVariation;

	return (
		<div className="shrink-0 border-b bg-background px-3 py-2 flex items-center gap-2">
			{/* prev / next arrows */}
			<Button
				variant="ghost"
				size="icon"
				className="h-7 w-7 shrink-0"
				disabled={!canPrev || isBusy}
				onClick={() => go(-1)}
				title="Previous variation"
			>
				<ChevronLeft className="size-4" />
			</Button>

			{/* thumbnail row */}
			<div
				ref={thumbsRef}
				className="flex gap-2 overflow-x-auto flex-1 min-w-0 scrollbar-none"
			>
				{variations.map((v, idx) => {
					const isActive = v.id === selectedVariationId;
					return (
						<button
							key={v.id}
							type="button"
							onClick={() => onSelectVariation?.(v.id)}
							title={`Variation ${idx + 1}${isActive ? " — selected for build" : ""}`}
							className={cn(
								"group relative shrink-0 rounded-lg overflow-hidden border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
								isActive
									? "border-primary shadow-md ring-1 ring-primary/30"
									: "border-transparent opacity-60 hover:opacity-100 hover:border-border",
							)}
						>
							<img
								src={v.url}
								alt={`Design ${idx + 1}`}
								className="w-10 h-14 object-cover object-top"
								draggable={false}
							/>
							{/* number badge */}
							<span className="absolute top-0.5 left-1 text-[9px] font-bold text-white drop-shadow-sm leading-none">
								{idx + 1}
							</span>
							{/* selected indicator */}
							{isActive && (
								<div className="absolute bottom-0.5 right-0.5">
									<CheckCircle2 className="size-3 text-primary drop-shadow" />
								</div>
							)}
						</button>
					);
				})}

				{/* Ghost thumbnail while a new variation is generating */}
				{isDesigning && (
					<div className="shrink-0 w-10 h-14 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center bg-muted/30">
						<Spinner size={10} className="text-muted-foreground" />
					</div>
				)}
			</div>

			<Button
				variant="ghost"
				size="icon"
				className="h-7 w-7 shrink-0"
				disabled={!canNext || isBusy}
				onClick={() => go(1)}
				title="Next variation"
			>
				<ChevronRight className="size-4" />
			</Button>

			{/* counter */}
			{variations.length > 0 && (
				<span className="shrink-0 text-xs text-muted-foreground tabular-nums whitespace-nowrap">
					{selectedIdx >= 0 ? selectedIdx + 1 : "—"} / {variations.length}
				</span>
			)}

			<div className="w-px h-4 bg-border shrink-0" />

			{/* generate new variation */}
			<Button
				variant="outline"
				size="sm"
				className="shrink-0 gap-1.5 h-7 text-xs font-medium"
				onClick={onGenerateVariation}
				disabled={isBusy}
				title="Ask AI for a different creative direction"
			>
				{isBusy ? (
					<Spinner size={10} />
				) : (
					<Sparkles className="size-3" />
				)}
				{isDesigning ? "Generating…" : "New variation"}
			</Button>
		</div>
	);
}

export function PreviewTabs({
	creativeDesignUrl,
	htmlContent,
	isDesigning,
	isBuilding,
	previewWidth,
	onPreviewWidthChange,
	variations = [],
	selectedVariationId,
	onSelectVariation,
	onGenerateVariation,
	isGeneratingVariation,
}: PreviewTabsProps) {
	const hasHtml = Boolean(htmlContent?.trim());
	const [tab, setTab] = React.useState(hasHtml ? "email" : "creative");

	React.useEffect(() => {
		if (hasHtml) setTab("email");
	}, [hasHtml]);

	// Show toolbar if there is at least one design (even while the first is generating,
	// we might already have a prior one), or if we have a creativeDesignUrl at all.
	const showToolbar = variations.length > 0 || Boolean(creativeDesignUrl) || isDesigning;

	return (
		<Tabs value={tab} onValueChange={setTab} className="flex flex-col flex-1 min-h-0">
			{/* ── top bar ── */}
			<div className="flex items-center justify-between border-b bg-background px-4 py-2 shrink-0">
				<TabsList>
					<TabsTrigger value="creative" className="gap-1.5">
						<ImageIcon className="size-3.5" />
						Creative design
						{variations.length > 1 && (
							<span className="ml-1 rounded-full bg-primary/15 text-primary text-[10px] font-semibold px-1.5 py-px leading-none">
								{variations.length}
							</span>
						)}
					</TabsTrigger>
					<TabsTrigger value="email" className="gap-1.5" disabled={!hasHtml}>
						<Mail className="size-3.5" />
						Email preview
					</TabsTrigger>
				</TabsList>
				{hasHtml && (
					<div className="flex gap-1">
						<Button
							variant={previewWidth === "desktop" ? "secondary" : "ghost"}
							size="sm"
							onClick={() => onPreviewWidthChange("desktop")}
						>
							Desktop
						</Button>
						<Button
							variant={previewWidth === "mobile" ? "secondary" : "ghost"}
							size="sm"
							onClick={() => onPreviewWidthChange("mobile")}
						>
							Mobile
						</Button>
					</div>
				)}
			</div>

			{/* ── creative tab ── */}
			<TabsContent
				value="creative"
				className="flex-1 m-0 min-h-0 data-[state=inactive]:hidden flex flex-col"
			>
				{/* Variation toolbar — always visible once any design exists */}
				{showToolbar && (
					<VariationToolbar
						variations={variations}
						selectedVariationId={selectedVariationId}
						onSelectVariation={onSelectVariation}
						onGenerateVariation={onGenerateVariation}
						isGeneratingVariation={isGeneratingVariation}
						isDesigning={isDesigning}
					/>
				)}

				{/* Preview area */}
				<div className="flex-1 overflow-auto p-6 flex justify-center items-start bg-zinc-100 dark:bg-zinc-900">
					{isDesigning && !creativeDesignUrl ? (
						<DesigningLoader />
					) : creativeDesignUrl ? (
						<div className="relative max-w-lg w-full">
							<div className="rounded-lg border bg-white shadow-lg overflow-hidden">
								<img
									src={creativeDesignUrl}
									alt="Email creative design"
									className="w-full h-auto"
								/>
							</div>

							{/* While new variation is loading, show an overlay progress bar */}
							{isDesigning && (
								<div className="absolute inset-x-0 top-0 h-0.5 bg-primary/20 overflow-hidden rounded-t-lg">
									<div className="h-full bg-primary animate-[shimmer_1.4s_ease-in-out_infinite] w-1/3" />
								</div>
							)}
						</div>
					) : (
						<div className="text-center text-sm text-muted-foreground py-20 max-w-sm">
							<ImageIcon className="size-10 mx-auto mb-3 opacity-40" />
							<p>Your creative design will appear here once you submit the brief.</p>
						</div>
					)}
				</div>
			</TabsContent>

			{/* ── email tab ── */}
			<TabsContent value="email" className="flex-1 m-0 min-h-0 data-[state=inactive]:hidden">
				<div className="flex-1 overflow-auto p-6 flex justify-center bg-zinc-100 dark:bg-zinc-900 h-full">
					{isBuilding && !hasHtml ? (
						<BuildingLoader />
					) : hasHtml ? (
						<iframe
							title="Email preview"
							srcDoc={htmlContent!}
							className={cn(
								"bg-white border shadow-sm rounded-sm min-h-[480px] h-full",
								previewWidth === "desktop" ? "w-[640px]" : "w-[375px]",
							)}
							sandbox="allow-same-origin"
						/>
					) : null}
				</div>
			</TabsContent>
		</Tabs>
	);
}
