"use client";

import * as React from "react";
import { Mail, Sparkles } from "lucide-react";

import { Spinner } from "@/components/ui/shadcn-io/spinner";

const PHRASES = [
	"Applying your changes to the email…",
	"Updating copy, layout, and styles…",
	"Matching your brand and brief…",
	"Almost there — refining the HTML…",
];

type ChatRevisionOverlayProps = {
	isHydratingImages?: boolean;
};

/** Full-area overlay while AI revises an existing email (chat). */
export function ChatRevisionOverlay({ isHydratingImages }: ChatRevisionOverlayProps) {
	const [idx, setIdx] = React.useState(0);

	React.useEffect(() => {
		const t = setInterval(() => setIdx((i) => (i + 1) % PHRASES.length), 2800);
		return () => clearInterval(t);
	}, []);

	const phrase = isHydratingImages
		? "Generating and uploading new images…"
		: PHRASES[idx];

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
					<Spinner size={16} className="text-primary shrink-0" />
					<p key={phrase} className="text-sm font-medium text-foreground">
						{phrase}
					</p>
				</div>
				<p className="text-xs text-muted-foreground leading-relaxed">
					{isHydratingImages
						? "Image slots are being filled — this usually takes a few minutes."
						: "This usually takes 1–5 minutes depending on complexity. You can keep the tab open."}
				</p>
			</div>
		</div>
	);
}
