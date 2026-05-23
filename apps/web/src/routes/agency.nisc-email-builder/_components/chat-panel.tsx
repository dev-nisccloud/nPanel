"use client";

import * as React from "react";
import { Loader2, Send } from "lucide-react";

import { AiMarkdownRenderer } from "@/components/ai/ai-markdown-renderer";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

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
							<Loader2 className="size-4 animate-spin" />
						) : (
							<Send className="size-4" />
						)}
					</Button>
				</div>
			</div>
		</div>
	);
}
