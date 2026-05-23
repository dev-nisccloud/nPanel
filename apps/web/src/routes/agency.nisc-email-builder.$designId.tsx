"use client";

import * as React from "react";
import { Link, useParams } from "react-router";
import { ArrowLeft, Download, CheckCircle2, Pencil } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";
import {
	BriefForm,
	type BriefFormValues,
} from "./agency.nisc-email-builder/_components/brief-form";
import { padBrandColors } from "./agency.nisc-email-builder/_components/brand-color-editor";
import { ChatPanel } from "./agency.nisc-email-builder/_components/chat-panel";
import {
	PreviewTabs,
	type DesignVariation,
} from "./agency.nisc-email-builder/_components/preview-tabs";

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
	const utils = trpc.useUtils();

	const [chatInput, setChatInput] = React.useState("");
	const [brief, setBrief] = React.useState<BriefFormValues>({
		companyName: "",
		goal: "",
		audience: "",
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
				toast.message("Creative design started", {
					description: data.brandPreview.warnings.join(" "),
				});
			} else if (data.brandPreview?.logoUrl || data.brandPreview?.brandColors?.length) {
				toast.success("Brand applied — generating your creative design…");
			} else {
				toast.success("Generating your creative design…");
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

	const sendMessage = trpc.niscEmailBuilder.chat.sendMessage.useMutation({
		onSuccess: () => {
			setChatInput("");
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
	const showBrief = safeMessages.length === 0 && !hasCreative && !isBusy;

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
		setBrief((prev) => ({
			...prev,
			companyName: typeof b.companyName === "string" ? b.companyName : prev.companyName,
			goal: typeof b.goal === "string" ? b.goal : prev.goal,
			audience: typeof b.audience === "string" ? b.audience : prev.audience,
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
		if (!brief.goal.trim() || !brief.audience.trim()) {
			toast.error("Goal and audience are required");
			return;
		}
		startBuild.mutate({
			designId,
			brief: {
				companyName: brief.companyName || undefined,
				goal: brief.goal,
				audience: brief.audience,
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
		sendMessage.mutate({ designId, message: chatInput.trim() });
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
	};

	if (designQuery.isLoading) {
		return (
			<div className="flex h-[60vh] items-center justify-center">
				<Spinner size={24} />
			</div>
		);
	}

	if (designQuery.isError || !design) {
		return (
			<div className="flex flex-col items-center justify-center gap-4 py-16">
				<p className="text-sm text-muted-foreground">Design not found</p>
				<Button asChild variant="secondary">
					<Link to="/agency/nisc-email-builder">Back</Link>
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
		<div className="flex flex-col h-[calc(100vh-3rem)] -m-4 md:-m-6">
			<header className="flex items-center gap-3 border-b px-4 py-3 shrink-0 bg-background">
				<Button variant="ghost" size="icon" asChild>
					<Link to="/agency/nisc-email-builder">
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
					onClick={() => void handleDownloadHtml()}
				>
					<Download className="size-3.5 mr-1.5" />
					Export HTML
				</Button>
			</header>

			<div className="flex flex-1 min-h-0">
				<aside className="w-full max-w-md shrink-0 flex flex-col min-h-0">
					{showBrief ? (
						<div className="p-4 overflow-y-auto flex-1">
							<BriefForm
								values={brief}
								onChange={(patch) => setBrief((b) => ({ ...b, ...patch }))}
								onSubmit={handleStartBrief}
								isSubmitting={startBuild.isPending || isBusy}
							/>
						</div>
					) : (
						<ChatPanel
							messages={safeMessages}
							chatInput={chatInput}
							onChatInputChange={setChatInput}
							onSend={handleSend}
							disabled={isBusy || (!hasCreative && !hasHtml)}
							isSending={sendMessage.isPending}
							placeholder={
								phase === "AWAITING_APPROVAL"
									? "Ask for changes to the design…"
									: "Ask for changes to the email…"
							}
							footer={chatFooter}
						/>
					)}
				</aside>

				<main className="flex-1 flex flex-col min-w-0 min-h-0">
					<PreviewTabs
						creativeDesignUrl={design.creativeDesignUrl}
						htmlContent={design.htmlContent}
						isDesigning={phase === "DESIGNING" || (isBusy && !hasCreative)}
						isBuilding={phase === "BUILDING" || design.aiStatus === "HYDRATING_IMAGES"}
						previewWidth={previewWidth}
						onPreviewWidthChange={setPreviewWidth}
						variations={designVariations}
						selectedVariationId={selectedVariationId}
						onSelectVariation={handleSelectVariation}
						onGenerateVariation={handleGenerateVariation}
						isGeneratingVariation={generateVariation.isPending}
					/>
				</main>
			</div>
		</div>
	);
}
