"use client";

import * as React from "react";
import { Redo2, Send, Undo2 } from "lucide-react";

import { AiMarkdownRenderer } from "@/components/ai/ai-markdown-renderer";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import { NebSpinner } from "./neb-loading";

export type NebChatMessage = {
	id: string;
	role: string;
	content: string;
	metadata?: Record<string, unknown> | null;
	createdAt: Date | string;
};

type ChatPanelProps = {
	messages?: NebChatMessage[];
	chatInput: string;
	onChatInputChange: (v: string) => void;
	onSend: () => void;
	disabled?: boolean;
	isSending?: boolean;
	placeholder?: string;
	footer?: React.ReactNode;
	aiRevisionUndo?: {
		available: boolean;
		canUndo: boolean;
		canRedo: boolean;
		onUndo: () => void;
		onRedo: () => void;
		isUndoing: boolean;
		isRedoing: boolean;
	};
};

export function ChatPanel({
	messages = [],
	chatInput,
	onChatInputChange,
	onSend,
	disabled,
	isSending,
	placeholder = "Ask for changes…",
	footer,
	aiRevisionUndo,
}: ChatPanelProps) {
	const bottomRef = React.useRef<HTMLDivElement>(null);

	React.useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages.length, messages[messages.length - 1]?.id]);

	return (
		<div className="flex flex-col h-full min-h-0 border-r bg-muted/20">
			<ScrollArea className="flex-1 min-h-0">
				<div className="p-4 space-y-4">
					{messages.map((m) => {
						const creativeUrl =
							typeof m.metadata?.creativeDesignUrl === "string"
								? m.metadata.creativeDesignUrl
								: null;
						const isUser = m.role === "user";

						return (
							<div
								key={m.id}
								className={cn("flex flex-col gap-2 max-w-[95%]", isUser && "ml-auto items-end")}
							>
								{creativeUrl ? (
									<div className="rounded-lg border overflow-hidden bg-card max-w-full">
										<img
											src={creativeUrl}
											alt="Creative design mockup"
											className="w-full h-auto max-h-[280px] object-contain"
										/>
									</div>
								) : null}
								<div
									className={cn(
										"rounded-lg px-3 py-2 text-sm",
										isUser
											? "bg-primary text-primary-foreground"
											: "bg-card border w-full",
									)}
								>
									{isUser ? (
										<p className="whitespace-pre-wrap">{m.content}</p>
									) : (
										<AiMarkdownRenderer content={m.content} />
									)}
								</div>
							</div>
						);
					})}
					<div ref={bottomRef} />
				</div>
			</ScrollArea>

			<div className="p-3 border-t space-y-2 shrink-0 bg-background">
				{footer}
				{aiRevisionUndo?.available ? (
					<div className="flex items-center gap-1.5">
						<Button
							type="button"
							variant="outline"
							size="icon"
							className="size-8"
							disabled={
								!aiRevisionUndo.canUndo ||
								aiRevisionUndo.isUndoing ||
								aiRevisionUndo.isRedoing ||
								disabled
							}
							title="Undo last AI edit"
							onClick={aiRevisionUndo.onUndo}
						>
							{aiRevisionUndo.isUndoing ? (
								<NebSpinner context="button" size={14} />
							) : (
								<Undo2 className="size-3.5" />
							)}
						</Button>
						<Button
							type="button"
							variant="outline"
							size="icon"
							className="size-8"
							disabled={
								!aiRevisionUndo.canRedo ||
								aiRevisionUndo.isUndoing ||
								aiRevisionUndo.isRedoing ||
								disabled
							}
							title="Redo AI edit"
							onClick={aiRevisionUndo.onRedo}
						>
							{aiRevisionUndo.isRedoing ? (
								<NebSpinner context="button" size={14} />
							) : (
								<Redo2 className="size-3.5" />
							)}
						</Button>
						<span className="text-[10px] text-muted-foreground leading-tight">
							Undo/redo AI edits (temporary, ~7 days)
						</span>
					</div>
				) : null}
				<div className="flex gap-2">
					<Textarea
						placeholder={placeholder}
						value={chatInput}
						onChange={(e) => onChatInputChange(e.target.value)}
						rows={2}
						className="resize-none"
						disabled={disabled}
						onKeyDown={(e) => {
							if (e.key === "Enter" && !e.shiftKey) {
								e.preventDefault();
								onSend();
							}
						}}
					/>
					<Button
						size="icon"
						className="shrink-0"
						disabled={disabled || isSending || !chatInput.trim()}
						onClick={onSend}
					>
						{isSending ? (
							<NebSpinner context="chat" size={16} />
						) : (
							<Send className="size-4" />
						)}
					</Button>
				</div>
			</div>
		</div>
	);
}
