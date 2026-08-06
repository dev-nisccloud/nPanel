"use client";

import * as React from "react";
import { Link, useParams } from "react-router";
import { ArrowLeft, Download, CheckCircle2, Images, Pencil } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { captureEvent } from "@/lib/posthog";
import { trpc } from "@/utils/trpc";
import {
	BriefForm,
	type BriefFormValues,
	getResolvedBriefAudience,
	getResolvedBriefGoal,
} from "./agency.nisc-email-builder/_components/brief-form";
import { padBrandColors } from "./agency.nisc-email-builder/_components/brand-color-editor";
import {
	inferAudienceSelection,
	inferGoalSelection,
	NEB_BRIEF_OTHER,
	NEB_EMAIL_AUDIENCES,
	NEB_EMAIL_GOALS,
} from "@npanel/api/lib/nisc-email-builder/brief-options";
import { ChatPanel } from "./agency.nisc-email-builder/_components/chat-panel";
import {
	ChatBootstrapPanel,
	NebSpinner,
} from "./agency.nisc-email-builder/_components/neb-loading";
import { ImageLibrarySheet } from "./agency.nisc-email-builder/_components/image-library-sheet";
import {
	PreviewTabs,
	type DesignVariation,
} from "./agency.nisc-email-builder/_components/preview-tabs";
import { useNiscEmailMarketingRoute } from "@/components/nisc-email-marketing/nisc-email-marketing-route-context";

// ── Status badge ──────────────────────────────────────────────────────────────

type PhaseKey =
	| "BRIEF"
	| "DESIGNING"
	| "AWAITING_APPROVAL"
	| "BUILDING"
	| "READY"
	| "FAILED"
	| string;

type AiStatusKey = "IDLE" | "GENERATING" | "HYDRATING_IMAGES" | "FAILED" | string;

const PHASE_CONFIG: Record<string, { label: string; dot: string; text: string }> = {
	BRIEF:             { label: "Draft",            dot: "bg-zinc-400",      text: "text-zinc-600 dark:text-zinc-400" },
	DESIGNING:         { label: "Designing",         dot: "bg-blue-400 animate-pulse", text: "text-blue-600 dark:text-blue-400" },
	AWAITING_APPROVAL: { label: "Awaiting approval", dot: "bg-amber-400",     text: "text-amber-600 dark:text-amber-400" },
	BUILDING:          { label: "Building",          dot: "bg-violet-400 animate-pulse", text: "text-violet-600 dark:text-violet-400" },
	READY:             { label: "Ready",             dot: "bg-emerald-400",   text: "text-emerald-600 dark:text-emerald-400" },
	FAILED:            { label: "Failed",            dot: "bg-red-400",       text: "text-red-600 dark:text-red-400" },
};

const AI_STATUS_CONFIG: Record<string, { label: string; dot: string; text: string }> = {
	GENERATING:      { label: "Generating",       dot: "bg-blue-400 animate-pulse",    text: "text-blue-600 dark:text-blue-400" },
	HYDRATING_IMAGES:{ label: "Adding images",    dot: "bg-violet-400 animate-pulse",  text: "text-violet-600 dark:text-violet-400" },
	FAILED:          { label: "Failed",           dot: "bg-red-400",                   text: "text-red-600 dark:text-red-400" },
};

function StatusBadge({ phase, aiStatus }: { phase: PhaseKey; aiStatus: AiStatusKey }) {
	// AI status overrides phase label when active
	const active = aiStatus !== "IDLE" ? AI_STATUS_CONFIG[aiStatus] : null;
	const config =
		active ??
		PHASE_CONFIG[phase] ??
		{ label: phase.replace(/_/g, " ").toLowerCase(), dot: "bg-zinc-400", text: "text-zinc-500" };

	return (
		<span className={cn("inline-flex items-center gap-1.5 text-xs font-medium", config.text)}>
			<span className={cn("size-1.5 rounded-full shrink-0", config.dot)} />
			{config.label}
		</span>
	);
}

// ── Inline name editor ────────────────────────────────────────────────────────

function InlineNameEditor({
	designId,
	initialName,
}: {
	designId: string;
	initialName: string;
}) {
	const utils = trpc.useUtils();
	const [editing, setEditing] = React.useState(false);
	const [value, setValue] = React.useState(initialName);
	const inputRef = React.useRef<HTMLInputElement>(null);

	React.useEffect(() => {
		setValue(initialName);
	}, [initialName]);

	React.useEffect(() => {
		if (editing) inputRef.current?.select();
	}, [editing]);

	const updateMeta = trpc.niscEmailBuilder.design.updateMeta.useMutation({
		onSuccess: () => void utils.niscEmailBuilder.design.get.invalidate({ designId }),
		onError: (e) => {
			toast.error(e.message);
			setValue(initialName);
		},
	});

	const commit = () => {
		setEditing(false);
		const trimmed = value.trim();
		if (!trimmed) { setValue(initialName); return; }
		if (trimmed === initialName) return;
		updateMeta.mutate({ designId, name: trimmed });
	};

	if (editing) {
		return (
			<Input
				ref={inputRef}
				value={value}
				onChange={(e) => setValue(e.target.value)}
				onBlur={commit}
				onKeyDown={(e) => {
					if (e.key === "Enter") commit();
					if (e.key === "Escape") { setValue(initialName); setEditing(false); }
				}}
				className="h-7 text-sm font-semibold px-1.5 py-0 w-52 max-w-full"
			/>
		);
	}

	return (
		<button
			type="button"
			onClick={() => setEditing(true)}
			className="group flex items-center gap-1.5 min-w-0 hover:text-foreground transition-colors"
			title="Click to rename"
		>
			<span className="font-semibold truncate text-sm">{value}</span>
			<Pencil className="size-3 opacity-0 group-hover:opacity-50 shrink-0 transition-opacity" />
		</button>
	);
}

export default function NiscEmailBuilderEditorPage() {
	const { designId } = useParams() as { designId: string };
	const route = useNiscEmailMarketingRoute();
	const utils = trpc.useUtils();

	const [chatInput, setChatInput] = React.useState("");
	const [mediaLibraryOpen, setMediaLibraryOpen] = React.useState(false);
	const [brief, setBrief] = React.useState<BriefFormValues>({
		companyName: "",
		goalPreset: NEB_EMAIL_GOALS[0].value,
		goalCustom: "",
		audiencePreset: NEB_EMAIL_AUDIENCES[0].value,
		audienceCustom: "",
		tone: "Professional",
		emailType: "promotional",
		instructions: "",
		websiteUrl: "",
		logoUrl: "",
		brandColors: [],
		companyContext: "",
		webSearchFound: false,
	});
	const [previewWidth, setPreviewWidth] = React.useState<"desktop" | "mobile">("desktop");
	const [selectedVariationId, setSelectedVariationId] = React.useState<string | null>(null);
	const latestHtmlRef = React.useRef("");

	const designQuery = trpc.niscEmailBuilder.design.get.useQuery(
		{ designId },
		{
			refetchInterval: (q) => {
				const s = q.state.data?.aiStatus;
				const phase = q.state.data?.workflowPhase;
				if (
					s === "GENERATING" ||
					s === "HYDRATING_IMAGES" ||
					phase === "DESIGNING" ||
					phase === "BUILDING"
				) {
					return 2000;
				}
				return false;
			},
		},
	);

	const startBuild = trpc.niscEmailBuilder.chat.startBuild.useMutation({
		onSuccess: (data) => {
			if (data.brandPreview?.warnings?.length && !data.brandPreview.logoUrl) {
				toast.message("Building your email…", {
					description: data.brandPreview.warnings.join(" "),
				});
			} else if (data.brandPreview?.logoUrl || data.brandPreview?.brandColors?.length) {
				toast.success("Brand detected - building your email…");
			} else {
				toast.success("Building your email…");
			}
			void utils.niscEmailBuilder.design.get.invalidate({ designId });
		},
		onError: (e) => toast.error(e.message),
	});

	const generateVariation = trpc.niscEmailBuilder.chat.generateVariation.useMutation({
		onSuccess: () => {
			toast.success("Generating a new variation…");
			void utils.niscEmailBuilder.design.get.invalidate({ designId });
		},
		onError: (e) => toast.error(e.message),
	});

	const selectVariation = trpc.niscEmailBuilder.chat.selectVariation.useMutation({
		onSuccess: () => {
			void utils.niscEmailBuilder.design.get.invalidate({ designId });
		},
		onError: (e) => toast.error(e.message),
	});

	const approveBuild = trpc.niscEmailBuilder.chat.approveBuild.useMutation({
		onSuccess: () => {
			toast.success("Building your HTML email from the approved design…");
			void utils.niscEmailBuilder.design.get.invalidate({ designId });
		},
		onError: (e) => toast.error(e.message),
	});

	const retryHtmlBuild = trpc.niscEmailBuilder.chat.retryHtmlBuild.useMutation({
		onSuccess: () => {
			toast.success("Regenerating HTML from your creative design…");
			void utils.niscEmailBuilder.design.get.invalidate({ designId });
		},
		onError: (e) => toast.error(e.message),
	});

	const sendMessage = trpc.niscEmailBuilder.chat.sendMessage.useMutation({
		onSuccess: (data) => {
			setChatInput("");
			if (data.intent === "full_revamp") {
				toast.message("Rebuilding your email from the brief…");
			}
			void utils.niscEmailBuilder.design.get.invalidate({ designId });
		},
		onError: (e) => toast.error(e.message),
	});

	const exportQuery = trpc.niscEmailBuilder.design.exportHtml.useQuery(
		{ designId },
		{ enabled: false },
	);

	const design = designQuery.data;
	const messages = design?.session?.messages ?? [];
	const safeMessages = Array.isArray(messages) ? messages : [];
	const isBusy =
		design?.aiStatus === "GENERATING" || design?.aiStatus === "HYDRATING_IMAGES";
	const phase = design?.workflowPhase ?? "BRIEF";
	const hasCreative = Boolean(design?.creativeDesignUrl);
	const hasHtml = Boolean(design?.htmlContent?.trim());
	const isAiRevising =
		hasHtml && isBusy && phase === "READY";

	React.useEffect(() => {
		if (design?.htmlContent?.trim()) {
			latestHtmlRef.current = design.htmlContent;
		}
	}, [design?.htmlContent]);

	const revisionUndoState = trpc.niscEmailBuilder.chat.getRevisionUndoState.useQuery(
		{ designId },
		{
			enabled: hasHtml,
			refetchInterval: isBusy ? 2000 : false,
		},
	);

	const undoAiRevision = trpc.niscEmailBuilder.chat.undoAiRevision.useMutation({
		onSuccess: () => {
			toast.success("Reverted to previous email");
			void utils.niscEmailBuilder.design.get.invalidate({ designId });
			void utils.niscEmailBuilder.chat.getRevisionUndoState.invalidate({ designId });
		},
		onError: (e) => toast.error(e.message),
	});

	const redoAiRevision = trpc.niscEmailBuilder.chat.redoAiRevision.useMutation({
		onSuccess: () => {
			toast.success("Restored newer version");
			void utils.niscEmailBuilder.design.get.invalidate({ designId });
			void utils.niscEmailBuilder.chat.getRevisionUndoState.invalidate({ designId });
		},
		onError: (e) => toast.error(e.message),
	});

	const hasStartedBuild =
		startBuild.isPending ||
		isBusy ||
		phase !== "BRIEF" ||
		hasCreative ||
		hasHtml ||
		safeMessages.length > 0;

	// Brief form only before the user has kicked off a build.
	const showBrief = !hasStartedBuild;

	// After submit, messages may lag behind - avoid an empty chat column.
	const showChatBootstrap =
		hasStartedBuild && safeMessages.length === 0 && !showBrief;

	// Extract variations from design metadata
	const designVariations: DesignVariation[] = React.useMemo(() => {
		const meta = design?.metadata;
		if (!meta || typeof meta !== "object") return [];
		const list = (meta as Record<string, unknown>).designVariations;
		if (!Array.isArray(list)) return [];
		return list as DesignVariation[];
	}, [design?.metadata]);

	// Keep selectedVariationId in sync with the design's active creativeDesignUrl
	React.useEffect(() => {
		if (!design?.creativeDesignUrl || designVariations.length === 0) return;
		const match = designVariations.find((v) => v.url === design.creativeDesignUrl);
		if (match) setSelectedVariationId(match.id);
	}, [design?.creativeDesignUrl, designVariations]);

	const briefHydratedRef = React.useRef(false);
	React.useEffect(() => {
		if (!showBrief || briefHydratedRef.current || !design?.brief) return;
		const b = design.brief as Record<string, unknown>;
		briefHydratedRef.current = true;
		const goalSel =
			typeof b.goal === "string"
				? inferGoalSelection(b.goal)
				: { preset: NEB_EMAIL_GOALS[0].value, custom: "" };
		const audienceSel =
			typeof b.audience === "string"
				? inferAudienceSelection(b.audience)
				: { preset: NEB_EMAIL_AUDIENCES[0].value, custom: "" };
		setBrief((prev) => ({
			...prev,
			companyName: typeof b.companyName === "string" ? b.companyName : prev.companyName,
			goalPreset: goalSel.preset,
			goalCustom: goalSel.custom,
			audiencePreset: audienceSel.preset,
			audienceCustom: audienceSel.custom,
			tone: typeof b.tone === "string" ? b.tone : prev.tone,
			emailType: typeof b.emailType === "string" ? b.emailType : prev.emailType,
			instructions: typeof b.instructions === "string" ? b.instructions : prev.instructions,
			websiteUrl: typeof b.websiteUrl === "string" ? b.websiteUrl : prev.websiteUrl,
			logoUrl: typeof b.logoUrl === "string" ? b.logoUrl : prev.logoUrl,
			brandColors: Array.isArray(b.brandColors)
				? padBrandColors(b.brandColors as string[])
				: prev.brandColors,
			companyContext:
				typeof b.companyContext === "string"
					? b.companyContext
					: typeof design.metadata === "object" &&
							design.metadata &&
							typeof (design.metadata as Record<string, unknown>).companyContext ===
								"string"
						? ((design.metadata as Record<string, unknown>).companyContext as string)
						: prev.companyContext,
			webSearchFound:
				b.webSearchFound === true ||
				(design.metadata &&
					typeof design.metadata === "object" &&
					(design.metadata as Record<string, unknown>).webSearchFound === true),
		}));
	}, [design?.brief, design?.metadata, showBrief]);

	const handleStartBrief = () => {
		const goal = getResolvedBriefGoal(brief);
		const audience = getResolvedBriefAudience(brief);
		if (!goal.trim()) {
			toast.error(
				brief.goalPreset === NEB_BRIEF_OTHER
					? "Enter a custom campaign goal"
					: "Select a campaign goal",
			);
			return;
		}
		if (!audience.trim()) {
			toast.error(
				brief.audiencePreset === NEB_BRIEF_OTHER
					? "Enter a custom target audience"
					: "Select a target audience",
			);
			return;
		}
		startBuild.mutate({
			designId,
			brief: {
				companyName: brief.companyName || undefined,
				goal,
				audience,
				tone: brief.tone,
				emailType: brief.emailType,
				instructions: brief.instructions || undefined,
				websiteUrl: brief.websiteUrl.trim() || undefined,
				logoUrl: brief.logoUrl.trim() || undefined,
				brandColors: brief.brandColors.length
					? padBrandColors(brief.brandColors).filter(Boolean)
					: undefined,
				companyContext: brief.companyContext.trim() || undefined,
				webSearchFound: brief.webSearchFound || undefined,
			},
		});
	};

	const handleSend = () => {
		if (!chatInput.trim()) return;
		const currentHtml =
			latestHtmlRef.current.trim() || design?.htmlContent?.trim() || "";
		sendMessage.mutate({
			designId,
			message: chatInput.trim(),
			...(currentHtml ? { currentHtml } : {}),
		});
	};

	const handleSelectVariation = (variationId: string) => {
		setSelectedVariationId(variationId);
		selectVariation.mutate({ designId, variationId });
	};

	const handleGenerateVariation = () => {
		generateVariation.mutate({ designId });
	};

	const handleDownloadHtml = async () => {
		const res = await exportQuery.refetch();
		const html = res.data?.html;
		if (!html) {
			toast.error("No HTML to export yet");
			return;
		}
		const blob = new Blob([html], { type: "text/html" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `${design?.name ?? "email"}.html`;
		a.click();
		URL.revokeObjectURL(url);
		captureEvent("email_design_exported", { export_format: "html" });
	};

	if (designQuery.isLoading) {
		return (
			<div className="flex h-[60vh] items-center justify-center">
				<NebSpinner context="page" size={28} className="text-primary" />
			</div>
		);
	}

	if (designQuery.isError || !design) {
		return (
			<div className="flex flex-col items-center justify-center gap-4 py-16">
				<p className="text-sm text-muted-foreground">Design not found</p>
				<Button asChild variant="secondary">
					<Link to={route.emailBuilderBasePath}>Back</Link>
				</Button>
			</div>
		);
	}

	const chatFooter =
		phase === "AWAITING_APPROVAL" && hasCreative && !hasHtml ? (
			<Button
				className="w-full"
				disabled={isBusy || approveBuild.isPending}
				onClick={() => approveBuild.mutate({ designId })}
			>
				<CheckCircle2 className="size-4 mr-2" />
				Approve & build email
			</Button>
		) : null;

	return (
		<div className="flex min-h-0 flex-1 flex-col overflow-hidden">
			<header className="flex items-center gap-3 border-b px-4 py-3 shrink-0 bg-background">
				<Button variant="ghost" size="icon" asChild>
					<Link to={route.emailBuilderBasePath}>
						<ArrowLeft className="size-4" />
					</Link>
				</Button>
				<div className="flex-1 min-w-0 flex flex-col gap-0.5">
					<InlineNameEditor designId={designId} initialName={design.name} />
					<StatusBadge phase={phase} aiStatus={design.aiStatus} />
				</div>
				<Button
					variant="outline"
					size="sm"
					disabled={!hasHtml}
					onClick={() => setMediaLibraryOpen(true)}
				>
					<Images className="size-3.5 mr-1.5" />
					Media library
				</Button>
				<Button
					variant="outline"
					size="sm"
					disabled={!hasHtml}
					onClick={() => void handleDownloadHtml()}
				>
					<Download className="size-3.5 mr-1.5" />
					Export HTML
				</Button>
			</header>

			<ImageLibrarySheet
				open={mediaLibraryOpen}
				onOpenChange={setMediaLibraryOpen}
			/>

			<div className="flex min-h-0 flex-1 overflow-hidden">
				<aside className="flex min-h-0 w-full max-w-md shrink-0 flex-col overflow-hidden">
					{showBrief ? (
						<div className="p-4 overflow-y-auto flex-1">
							<BriefForm
								values={brief}
								onChange={(patch) => setBrief((b) => ({ ...b, ...patch }))}
								onSubmit={handleStartBrief}
								isSubmitting={startBuild.isPending || isBusy}
							/>
						</div>
					) : showChatBootstrap ? (
						<ChatBootstrapPanel
							isHydratingImages={design.aiStatus === "HYDRATING_IMAGES"}
						/>
					) : (
						<ChatPanel
							messages={safeMessages}
							chatInput={chatInput}
							onChatInputChange={setChatInput}
							onSend={handleSend}
							disabled={isBusy || (!hasHtml && phase !== "AWAITING_APPROVAL")}
							isSending={sendMessage.isPending}
							placeholder={
								phase === "AWAITING_APPROVAL"
									? "Ask for changes to the design…"
									: hasHtml
										? "Describe edits to this email (e.g. change headline, add section)…"
										: "Ask for changes to the email…"
							}
							footer={chatFooter}
							aiRevisionUndo={
								hasHtml && revisionUndoState.data
									? {
											available: revisionUndoState.data.available,
											canUndo: revisionUndoState.data.canUndo,
											canRedo: revisionUndoState.data.canRedo,
											onUndo: () => undoAiRevision.mutate({ designId }),
											onRedo: () => redoAiRevision.mutate({ designId }),
											isUndoing: undoAiRevision.isPending,
											isRedoing: redoAiRevision.isPending,
										}
									: undefined
							}
						/>
					)}
				</aside>

				<main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
				<PreviewTabs
					designId={designId}
					creativeDesignUrl={design.creativeDesignUrl}
					htmlContent={design.htmlContent}
					canEdit={hasHtml && phase === "READY" && !isBusy}
					isDesigning={
						phase === "DESIGNING" ||
						(startBuild.isPending && !hasCreative)
					}
					isBuilding={
						phase === "BUILDING" ||
						(startBuild.isPending && !hasHtml)
					}
					isAiRevising={isAiRevising}
					isHydratingImages={design.aiStatus === "HYDRATING_IMAGES"}
					onLatestHtmlChange={(html) => {
						latestHtmlRef.current = html;
					}}
						previewWidth={previewWidth}
						onPreviewWidthChange={setPreviewWidth}
						variations={designVariations}
						selectedVariationId={selectedVariationId}
						onSelectVariation={handleSelectVariation}
						onGenerateVariation={handleGenerateVariation}
						isGeneratingVariation={generateVariation.isPending}
						onRetryHtmlBuild={
							hasCreative && hasHtml
								? () => retryHtmlBuild.mutate({ designId })
								: undefined
						}
						isRetryingHtml={retryHtmlBuild.isPending}
					/>
				</main>
			</div>
		</div>
	);
}
