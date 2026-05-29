"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";

import { Spinner, type SpinnerProps } from "@/components/ui/shadcn-io/spinner";
import { cn } from "@/lib/utils";

/** Spinner variants by context — matches patterns used elsewhere in nPanel (Zeepo, forms). */
export const NEB_SPINNER = {
	page: "ring",
	panel: "circle-filled",
	ai: "infinite",
	button: "pinwheel",
	inline: "circle",
	upload: "bars",
	chat: "ellipsis",
	step: "default",
} as const satisfies Record<string, NonNullable<SpinnerProps["variant"]>>;

type NebSpinnerProps = Omit<SpinnerProps, "variant"> & {
	context?: keyof typeof NEB_SPINNER;
	variant?: SpinnerProps["variant"];
};

export function NebSpinner({
	context = "inline",
	variant,
	className,
	...props
}: NebSpinnerProps) {
	return (
		<Spinner
			variant={variant ?? NEB_SPINNER[context]}
			className={className}
			{...props}
		/>
	);
}

const DEFAULT_ROTATE_MS = 5_500;

/**
 * Cycles status copy on a calm interval. Avoid `key` remounts — they feel like rapid double flashes.
 */
export function useRotatingPhrase(
	phrases: readonly string[],
	intervalMs = DEFAULT_ROTATE_MS,
	enabled = true,
) {
	const [idx, setIdx] = React.useState(0);

	React.useEffect(() => {
		setIdx(0);
	}, [phrases]);

	React.useEffect(() => {
		if (!enabled || phrases.length <= 1) return;
		const id = window.setInterval(() => {
			setIdx((i) => (i + 1) % phrases.length);
		}, intervalMs);
		return () => window.clearInterval(id);
	}, [phrases, intervalMs, enabled]);

	return phrases[idx] ?? phrases[0] ?? "";
}

type NebRotatingPhraseProps = {
	phrases: readonly string[];
	intervalMs?: number;
	enabled?: boolean;
	className?: string;
};

export function NebRotatingPhrase({
	phrases,
	intervalMs,
	enabled = true,
	className,
}: NebRotatingPhraseProps) {
	const phrase = useRotatingPhrase(phrases, intervalMs, enabled);

	return (
		<p
			className={cn(
				"text-sm font-medium text-foreground transition-opacity duration-500",
				className,
			)}
		>
			{phrase}
		</p>
	);
}

type ChatBootstrapPanelProps = {
	isHydratingImages?: boolean;
};

const CHAT_BOOTSTRAP_PHRASES = [
	"Saving your brief…",
	"Analysing your brand and campaign goal…",
	"Starting your email build…",
	"Preparing your workspace…",
] as const;

/** Shown in the chat column while the first messages are being created after brief submit. */
export function ChatBootstrapPanel({ isHydratingImages }: ChatBootstrapPanelProps) {
	const phrases = isHydratingImages
		? (["Generating and uploading your image assets…"] as const)
		: CHAT_BOOTSTRAP_PHRASES;

	return (
		<div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 p-6 text-center bg-muted/20">
			<div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
				<Sparkles className="size-6" />
			</div>
			<div className="flex flex-col items-center gap-1.5 max-w-xs">
				<div className="flex items-center gap-2">
					<NebSpinner context="chat" size={14} className="text-primary shrink-0" />
					<NebRotatingPhrase phrases={phrases} enabled={!isHydratingImages} />
				</div>
				<p className="text-xs text-muted-foreground leading-relaxed">
					{isHydratingImages
						? "Image slots are being filled — this usually takes a few minutes."
						: "Your conversation will appear here in a moment. The preview panel shows build progress."}
				</p>
			</div>
		</div>
	);
}
