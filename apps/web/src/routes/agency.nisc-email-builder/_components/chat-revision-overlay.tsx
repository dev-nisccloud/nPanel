"use client";

import { Mail, Sparkles } from "lucide-react";

import { NebRotatingPhrase, NebSpinner } from "./neb-loading";

const PHRASES = [
	"Applying your changes to the email…",
	"Updating copy, layout, and styles…",
	"Matching your brand and brief…",
	"Almost there - refining the HTML…",
] as const;

type ChatRevisionOverlayProps = {
	isHydratingImages?: boolean;
};

/** Full-area overlay while AI revises an existing email (chat). */
export function ChatRevisionOverlay({ isHydratingImages }: ChatRevisionOverlayProps) {
	return (
		<div className="absolute inset-0 z-40 flex items-center justify-center bg-background/85 backdrop-blur-[2px]">
			<div className="flex flex-col items-center gap-4 max-w-sm px-6 text-center">
				<div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
					{isHydratingImages ? (
						<Mail className="size-6" />
					) : (
						<Sparkles className="size-6" />
					)}
				</div>
				<div className="flex items-center gap-2">
					<NebSpinner context="ai" size={16} className="text-primary shrink-0" />
					{isHydratingImages ? (
						<p className="text-sm font-medium text-foreground">
							Generating and uploading new images…
						</p>
					) : (
						<NebRotatingPhrase phrases={PHRASES} />
					)}
				</div>
				<p className="text-xs text-muted-foreground leading-relaxed">
					{isHydratingImages
						? "Image slots are being filled - this usually takes a few minutes."
						: "This usually takes 1–5 minutes depending on complexity. You can keep the tab open."}
				</p>
			</div>
		</div>
	);
}
