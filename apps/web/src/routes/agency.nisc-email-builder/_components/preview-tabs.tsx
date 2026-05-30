"use client";

import * as React from "react";
import {
	ImageIcon,
	Mail,
	Pencil,
	Eye,
	Plus,
	CheckCircle2,
	ChevronLeft,
	ChevronRight,
	Sparkles,
	Check,
	ImagePlus,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

import { ChatRevisionOverlay } from "./chat-revision-overlay";
import { NebRotatingPhrase, NebSpinner } from "./neb-loading";
import { buildNoScrollSrcDoc } from "./edit-mode/email-edit-canvas";
import { EmailEditView } from "./edit-mode/email-edit-view";

export type DesignVariation = {
	id: string;
	url: string;
	notes?: string;
};

type PreviewTabsProps = {
	designId: string;
	creativeDesignUrl: string | null | undefined;
	htmlContent: string | null | undefined;
	isDesigning: boolean;
	isBuilding: boolean;
	canEdit?: boolean;
	/** True when image slots are being generated (HYDRATING_IMAGES). */
	isHydratingImages?: boolean;
	previewWidth: "desktop" | "mobile";
	onPreviewWidthChange: (w: "desktop" | "mobile") => void;
	variations?: DesignVariation[];
	selectedVariationId?: string | null;
	onSelectVariation?: (variationId: string) => void;
	onGenerateVariation?: () => void;
	isGeneratingVariation?: boolean;
	/** Regenerate HTML from approved creative (when email already exists). */
	onRetryHtmlBuild?: () => void;
	isRetryingHtml?: boolean;
	/** Chat AI is revising existing HTML - show overlay, not initial build loader */
	isAiRevising?: boolean;
	onLatestHtmlChange?: (html: string) => void;
};

const DESIGN_PHRASES = [
	"Crafting your visual identity…",
	"Laying out your email canvas…",
	"Applying brand colours and hierarchy…",
	"Composing the creative concept…",
	"Perfecting the design details…",
];

function DesigningLoader() {
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
					<NebSpinner context="ai" size={14} className="text-primary shrink-0" />
					<NebRotatingPhrase phrases={DESIGN_PHRASES} />
				</div>
				<p className="text-xs text-muted-foreground text-center">
					Your personalised design will appear here when ready.
				</p>
			</div>
		</div>
	);
}

const BUILD_PHRASES = [
	"Analysing your brief and campaign goal…",
	"Crafting a bespoke layout for your brand…",
	"Applying your colours and typography…",
	"Building responsive sections and structure…",
	"Writing on-brand copy and visual hierarchy…",
	"Polishing every detail of your email…",
];

type BuildStep = {
	label: string;
	sublabel?: string;
	status: "done" | "active" | "pending";
	icon: React.ReactNode;
};

function StepBadge({ step }: { step: BuildStep }) {
	return (
		<div
			className={cn(
				"flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
				step.status === "done" &&
					"border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400",
				step.status === "active" &&
					"border-violet-200 bg-violet-50 text-violet-700 shadow-sm dark:border-violet-800 dark:bg-violet-950 dark:text-violet-300",
				step.status === "pending" &&
					"border-border bg-muted/40 text-muted-foreground",
			)}
		>
			<span className="shrink-0">
				{step.status === "done" && <Check className="size-3" />}
				{step.status === "active" && <NebSpinner context="step" size={11} />}
				{step.status === "pending" && step.icon}
			</span>
			<span>{step.label}</span>
		</div>
	);
}

function BuildingLoader({
	creativeDesignUrl,
	isHydratingImages,
}: {
	creativeDesignUrl?: string | null;
	isHydratingImages?: boolean;
}) {
	const phrase = isHydratingImages
		? "Generating and uploading your image assets…"
		: null;

	const steps: BuildStep[] = [
		{
			label: "Design concept ready",
			status: "done",
			icon: <Check className="size-3" />,
		},
		{
			label: isHydratingImages ? "HTML built" : "Building HTML",
			sublabel: isHydratingImages ? undefined : "Tables, copy & layout",
			status: isHydratingImages ? "done" : "active",
			icon: <Mail className="size-3 opacity-40" />,
		},
		{
			label: isHydratingImages ? "Adding images" : "Image assets",
			sublabel: isHydratingImages ? "Generating & uploading" : undefined,
			status: isHydratingImages ? "active" : "pending",
			icon: <ImagePlus className="size-3 opacity-40" />,
		},
	];

	return (
		<div className="flex flex-col items-center gap-7 py-12 max-w-md w-full px-4">
			{/* Step badges */}
			<div className="flex flex-wrap justify-center gap-2">
				{steps.map((step) => (
					<StepBadge key={step.label} step={step} />
				))}
			</div>

			{/* Skeleton preview */}
			{creativeDesignUrl ? (
				<div className="relative w-full max-w-[220px] rounded-xl border bg-white shadow-md overflow-hidden opacity-90">
					<img
						src={creativeDesignUrl}
						alt="Approved creative"
						className="w-full h-auto max-h-[280px] object-cover object-top"
					/>
					<div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent pointer-events-none" />
					<div className="absolute bottom-2 left-0 right-0 flex justify-center">
						<span className="text-[10px] font-medium bg-background/90 border rounded-full px-2 py-0.5 text-muted-foreground">
							Approved design
						</span>
					</div>
				</div>
			) : (
				<div className="w-[260px] rounded-xl border bg-background shadow-lg overflow-hidden opacity-70">
					<div className="h-10 bg-muted/60 flex items-center justify-center">
						<Skeleton className="h-3 w-20" />
					</div>
					<div className="p-4 space-y-2">
						<Skeleton className="h-3 w-3/4" />
						<Skeleton className="h-3 w-full" />
						<Skeleton className="h-7 w-24 rounded-md mt-1" />
					</div>
				</div>
			)}

			{/* Current action */}
			<div className="flex flex-col items-center gap-1.5 text-center">
				<div className="flex items-center gap-2">
					<NebSpinner context="ai" size={14} className="text-primary shrink-0" />
					{phrase ? (
						<p className="text-sm font-medium text-foreground">{phrase}</p>
					) : (
						<NebRotatingPhrase phrases={BUILD_PHRASES} />
					)}
				</div>
				<p className="text-xs text-muted-foreground max-w-xs">
					{isHydratingImages
						? "Generating and placing your image assets."
						: "Building your production-ready email from your brief and brand."}
				</p>
			</div>
		</div>
	);
}

/**
 * Variation toolbar - rendered between tab header and the preview image.
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
							title={`Variation ${idx + 1}${isActive ? " - selected for build" : ""}`}
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
						<NebSpinner context="inline" size={10} className="text-muted-foreground" />
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
					{selectedIdx >= 0 ? selectedIdx + 1 : "-"} / {variations.length}
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
					<NebSpinner context="button" size={10} />
				) : (
					<Sparkles className="size-3" />
				)}
				{isDesigning ? "Generating…" : "New variation"}
			</Button>
		</div>
	);
}

/**
 * Renders the email HTML in an iframe that automatically expands to fit the
 * full content height - no empty gray space, no internal scroll bar.
 */
function AutoSizeIframe({ html, width }: { html: string; width: number }) {
	const iframeRef = React.useRef<HTMLIFrameElement>(null);
	const [height, setHeight] = React.useState(600);
	const loadedHtmlRef = React.useRef(html);

	const [srcDoc, setSrcDoc] = React.useState(() => buildNoScrollSrcDoc(html));
	const [iframeKey, setIframeKey] = React.useState(0);

	React.useEffect(() => {
		if (html === loadedHtmlRef.current) return;
		loadedHtmlRef.current = html;
		setSrcDoc(buildNoScrollSrcDoc(html));
		setIframeKey((k) => k + 1);
	}, [html]);

	const measure = React.useCallback(() => {
		const doc = iframeRef.current?.contentDocument;
		if (!doc) return;
		const h = Math.max(
			doc.documentElement?.scrollHeight ?? 0,
			doc.body?.scrollHeight ?? 0,
			400,
		);
		setHeight(h);
	}, []);

	return (
		<iframe
			key={iframeKey}
			ref={iframeRef}
			title="Email preview"
			srcDoc={srcDoc}
			onLoad={measure}
			style={{ height: `${height}px`, width: `${width}px` }}
			className="bg-white border shadow-sm rounded-sm block shrink-0"
			sandbox="allow-same-origin"
		/>
	);
}

export function PreviewTabs({
	designId,
	creativeDesignUrl,
	htmlContent,
	isDesigning,
	isBuilding,
	canEdit = false,
	isHydratingImages,
	previewWidth,
	onPreviewWidthChange,
	variations = [],
	selectedVariationId,
	onSelectVariation,
	onGenerateVariation,
	isGeneratingVariation,
	onRetryHtmlBuild,
	isRetryingHtml,
	isAiRevising = false,
	onLatestHtmlChange,
}: PreviewTabsProps) {
	const hasHtml = Boolean(htmlContent?.trim());
	const showEmailLoader = isBuilding;
	const [emailViewMode, setEmailViewMode] = React.useState<"preview" | "edit">("preview");
	const [editDirty, setEditDirty] = React.useState(false);
	/** Live HTML from edit canvas - keeps preview tab in sync before refetch completes */
	const [livePreviewHtml, setLivePreviewHtml] = React.useState<string | null>(null);
	const previewHtml = livePreviewHtml ?? htmlContent ?? "";

	React.useEffect(() => {
		if (previewHtml.trim()) onLatestHtmlChange?.(previewHtml);
	}, [previewHtml, onLatestHtmlChange]);
	const {
		open: sidebarOpen,
		setOpen: setSidebarOpen,
		openMobile,
		setOpenMobile,
		isMobile,
	} = useSidebar();

	const setViewMode = (mode: "preview" | "edit") => {
		if (mode === "preview" && editDirty) {
			const ok = window.confirm(
				"You have unsaved edits. Discard them and switch to preview?",
			);
			if (!ok) return;
		}
		setEmailViewMode(mode);
	};

	React.useEffect(() => {
		if (!canEdit) setEmailViewMode("preview");
	}, [canEdit]);

	React.useEffect(() => {
		if (emailViewMode === "edit") return;
		setLivePreviewHtml(null);
	}, [emailViewMode, htmlContent]);

	// Collapse agency nav sidebar in edit mode (same pattern as Zeepo preview panels).
	React.useEffect(() => {
		if (emailViewMode !== "edit") return;
		if (isMobile) {
			if (openMobile) setOpenMobile(false);
			return;
		}
		if (sidebarOpen) setSidebarOpen(false);
	}, [
		emailViewMode,
		isMobile,
		sidebarOpen,
		openMobile,
		setSidebarOpen,
		setOpenMobile,
	]);

	// Only show the Creative design tab for legacy designs that have (or are generating) a mockup
	const showCreativeTab = isDesigning || Boolean(creativeDesignUrl) || variations.length > 0;

	const [tab, setTab] = React.useState(showCreativeTab && !hasHtml ? "creative" : "email");

	React.useEffect(() => {
		if (hasHtml) setTab("email");
	}, [hasHtml]);

	// Switch to email preview as soon as HTML build starts
	React.useEffect(() => {
		if (isBuilding) setTab("email");
	}, [isBuilding]);

	// If creative tab is hidden and we somehow land on it, redirect to email
	React.useEffect(() => {
		if (!showCreativeTab && tab === "creative") setTab("email");
	}, [showCreativeTab, tab]);

	// Show toolbar if there is at least one design (even while the first is generating,
	// we might already have a prior one), or if we have a creativeDesignUrl at all.
	const showToolbar = variations.length > 0 || Boolean(creativeDesignUrl) || isDesigning;

	return (
		<Tabs
			value={tab}
			onValueChange={setTab}
			className="flex min-h-0 flex-1 flex-col overflow-hidden"
		>
			{/* ── top bar ── */}
			<div className="flex items-center justify-between border-b bg-background px-4 py-2 shrink-0">
				<TabsList>
					{showCreativeTab && (
						<TabsTrigger value="creative" className="gap-1.5">
							<ImageIcon className="size-3.5" />
							Creative design
							{variations.length > 1 && (
								<span className="ml-1 rounded-full bg-primary/15 text-primary text-[10px] font-semibold px-1.5 py-px leading-none">
									{variations.length}
								</span>
							)}
						</TabsTrigger>
					)}
					<TabsTrigger
						value="email"
						className="gap-1.5"
						disabled={!hasHtml && !isBuilding}
					>
						<Mail className="size-3.5" />
						Email preview
						{isBuilding ? (
							<NebSpinner context="inline" size={10} className="ml-0.5 text-primary" />
						) : null}
					</TabsTrigger>
				</TabsList>
				<div className="flex items-center gap-2">
					{hasHtml && canEdit && !isBuilding ? (
						<div className="flex gap-0.5 rounded-md border p-0.5 mr-1">
							<Button
								variant={emailViewMode === "preview" ? "secondary" : "ghost"}
								size="sm"
								className="h-7 gap-1.5 text-xs"
								onClick={() => setViewMode("preview")}
							>
								<Eye className="size-3.5" />
								Preview
							</Button>
							<Button
								variant={emailViewMode === "edit" ? "secondary" : "ghost"}
								size="sm"
								className="h-7 gap-1.5 text-xs"
								onClick={() => setViewMode("edit")}
							>
								<Pencil className="size-3.5" />
								Edit
								{editDirty ? (
									<span className="size-1.5 rounded-full bg-amber-500" />
								) : null}
							</Button>
						</div>
					) : null}
					{hasHtml && onRetryHtmlBuild && creativeDesignUrl ? (
						<Button
							variant="outline"
							size="sm"
							className="gap-1.5 h-8 text-xs"
							disabled={isBuilding || isRetryingHtml}
							onClick={onRetryHtmlBuild}
						>
							{isBuilding ? (
								<NebSpinner context="button" size={12} />
							) : (
								<Sparkles className="size-3.5" />
							)}
							{isBuilding ? "Rebuilding…" : "Regenerate HTML"}
						</Button>
					) : null}
					{(hasHtml || showEmailLoader) && !isBuilding ? (
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
					) : null}
				</div>
			</div>

		{/* ── creative tab - only rendered for legacy designs with a mockup ── */}
		{showCreativeTab && <TabsContent
			value="creative"
			className="flex-1 m-0 min-h-0 data-[state=inactive]:hidden flex flex-col"
		>
				{/* Variation toolbar - always visible once any design exists */}
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
						<p>Creative design previews appear here when generated from the legacy flow.</p>
					</div>
					)}
				</div>
		</TabsContent>}

		{/* ── email tab ── */}
		<TabsContent
			value="email"
			className="flex-1 m-0 min-h-0 data-[state=inactive]:hidden flex flex-col relative"
		>
			{isAiRevising ? (
				<ChatRevisionOverlay isHydratingImages={isHydratingImages} />
			) : null}
			{showEmailLoader ? (
				<div className="flex-1 overflow-auto min-h-0">
					<div className="min-h-full py-6 px-4 flex flex-col items-center bg-zinc-100 dark:bg-zinc-900">
						<BuildingLoader
							creativeDesignUrl={creativeDesignUrl}
							isHydratingImages={isHydratingImages}
						/>
					</div>
				</div>
			) : hasHtml && emailViewMode === "edit" && canEdit ? (
				<div className="flex min-h-0 flex-1 flex-col overflow-hidden">
					<EmailEditView
						designId={designId}
						htmlContent={htmlContent!}
						previewWidth={previewWidth}
						onDirtyChange={setEditDirty}
						onDraftHtmlChange={setLivePreviewHtml}
						onSaved={() => setLivePreviewHtml(null)}
					/>
				</div>
			) : hasHtml ? (
				<div className="flex-1 overflow-auto min-h-0">
					<div className="min-h-full py-6 px-4 flex flex-col items-center bg-zinc-100 dark:bg-zinc-900">
						<AutoSizeIframe
							html={previewHtml}
							width={previewWidth === "desktop" ? 640 : 375}
						/>
					</div>
				</div>
			) : (
				<div className="flex-1 overflow-auto min-h-0">
					<div className="min-h-full py-6 px-4 flex flex-col items-center bg-zinc-100 dark:bg-zinc-900">
						<div className="text-center text-sm text-muted-foreground py-20 max-w-sm">
							<Mail className="size-10 mx-auto mb-3 opacity-40" />
							<p>Submit your brief to generate the HTML email preview.</p>
						</div>
					</div>
				</div>
			)}
		</TabsContent>
		</Tabs>
	);
}
