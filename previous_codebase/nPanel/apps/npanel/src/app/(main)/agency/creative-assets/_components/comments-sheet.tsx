"use client";

import * as React from "react";
import type { z } from "zod";
import { X, Send, Lock, Globe, RefreshCw, Edit } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@nPanel/ui/dialog";
import {
	Sheet,
	SheetClose,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/npanel-ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { trpc } from "@/utils/trpc";
import { Spinner } from "@/components/ui/shadcn-io/spinner";

import { creativeAssetVersionSchema } from "./schema";
import { useUserNames } from "./use-user-names";
import { CommentItem, type Comment } from "./comments-dialog";

interface CommentsSheetProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	version: z.infer<typeof creativeAssetVersionSchema>;
}

const WORD_LIMIT = 150;

export function CommentsSheet({ open, onOpenChange, version }: CommentsSheetProps) {
	const [message, setMessage] = React.useState("");
	const [isInternal, setIsInternal] = React.useState(false);
	const [replyDialogOpen, setReplyDialogOpen] = React.useState(false);
	const [editDialogOpen, setEditDialogOpen] = React.useState(false);
	const [replyCommentId, setReplyCommentId] = React.useState<string | null>(null);
	const [editCommentId, setEditCommentId] = React.useState<string | null>(null);
	const [editContent, setEditContent] = React.useState("");
	const [activeCommentId, setActiveCommentId] = React.useState<string | null>(null);
	const textareaRef = React.useRef<HTMLTextAreaElement>(null);
	const scrollAreaRef = React.useRef<HTMLDivElement>(null);
	const replyTextareaRef = React.useRef<HTMLTextAreaElement>(null);
	const editTextareaRef = React.useRef<HTMLTextAreaElement>(null);

	const wordCount = React.useMemo(() => {
		if (!message.trim()) return 0;
		return message.trim().split(/\s+/).filter((w) => w.length > 0).length;
	}, [message]);
	const isOverLimit = wordCount > WORD_LIMIT;
	const wordsOverLimit = isOverLimit ? wordCount - WORD_LIMIT : 0;

	const { data: comments = [], isLoading: isLoadingComments, refetch: refetchComments } =
		trpc.creativeAssets.getComments.useQuery(
			{ versionId: version.id },
			{ enabled: open, staleTime: 0, gcTime: 5 * 60 * 1000 }
		);

	const allUserIds = React.useMemo(() => {
		const ids = new Set<string>();
		for (const c of comments) {
			ids.add(c.userId);
			for (const r of c.replies ?? []) ids.add(r.userId);
		}
		return Array.from(ids);
	}, [comments]);

	const { getUserName, isLoading: isLoadingNames } = useUserNames(allUserIds);

	const addCommentMutation = trpc.creativeAssets.addComment.useMutation({
		onSuccess: async () => {
			setMessage("");
			await refetchComments();
			toast.success("Comment added", { description: "Your comment has been posted successfully." });
		},
		onError: (e) => toast.error("Failed to add comment", { description: e.message ?? "Please try again." }),
	});

	const updateCommentMutation = trpc.creativeAssets.updateComment.useMutation({
		onSuccess: async () => {
			setEditDialogOpen(false);
			setEditCommentId(null);
			setEditContent("");
			await refetchComments();
			toast.success("Comment updated", { description: "Your comment has been updated successfully." });
		},
		onError: (e) => toast.error("Failed to update comment", { description: e.message ?? "Please try again." }),
	});

	React.useEffect(() => {
		const viewport = scrollAreaRef.current?.querySelector('[data-slot="scroll-area-viewport"]');
		if (viewport && comments.length > 0) {
			setTimeout(() => {
				viewport.scrollTop = viewport.scrollHeight;
			}, 100);
		}
	}, [comments.length]);

	React.useEffect(() => {
		if (open && textareaRef.current) {
			setTimeout(() => textareaRef.current?.focus(), 100);
		}
	}, [open]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!message.trim() || isOverLimit) return;
		addCommentMutation.mutate({ versionId: version.id, content: message.trim(), isInternal });
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSubmit(e);
		}
	};

	const handleReply = (commentId: string) => {
		setReplyCommentId(commentId);
		setReplyDialogOpen(true);
	};

	const handleEdit = (commentId: string, content: string) => {
		setEditCommentId(commentId);
		setEditContent(content);
		setEditDialogOpen(true);
	};

	const handleReplySubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!replyCommentId || !replyTextareaRef.current?.value.trim()) return;
		const replyText = replyTextareaRef.current.value.trim();
		const topLevel = comments.find((c) => c.id === replyCommentId);
		const parentIsInternal = topLevel?.isInternal ?? false;
		addCommentMutation.mutate(
			{
				versionId: version.id,
				content: replyText,
				isInternal: parentIsInternal,
				parentCommentId: replyCommentId,
			},
			{
				onSuccess: async () => {
					setReplyDialogOpen(false);
					setReplyCommentId(null);
					if (replyTextareaRef.current) replyTextareaRef.current.value = "";
					await refetchComments();
				},
			}
		);
	};

	const handleEditSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!editCommentId || !editTextareaRef.current?.value.trim()) return;
		updateCommentMutation.mutate({
			commentId: editCommentId,
			content: editTextareaRef.current.value.trim(),
		});
	};

	React.useEffect(() => {
		if (replyDialogOpen && replyTextareaRef.current) setTimeout(() => replyTextareaRef.current?.focus(), 100);
	}, [replyDialogOpen]);
	React.useEffect(() => {
		if (editDialogOpen && editTextareaRef.current) setTimeout(() => editTextareaRef.current?.focus(), 100);
	}, [editDialogOpen]);

	const groupedComments = React.useMemo(() => {
		const groups: Record<string, Comment[]> = {};
		const sorted = [...comments].sort((a, b) => {
			const da = typeof a.createdAt === "string" ? new Date(a.createdAt) : a.createdAt;
			const db = typeof b.createdAt === "string" ? new Date(b.createdAt) : b.createdAt;
			return da.getTime() - db.getTime();
		});
		for (const c of sorted) {
			if (!c.parentCommentId) {
				const d = (typeof c.createdAt === "string" ? new Date(c.createdAt) : c.createdAt).toDateString();
				if (!groups[d]) groups[d] = [];
				groups[d].push(c as Comment);
			}
		}
		return groups;
	}, [comments]);

	const formatTime = (date: Date | string) => {
		try {
			return formatDistanceToNow(typeof date === "string" ? new Date(date) : date, { addSuffix: true });
		} catch {
			return "recently";
		}
	};

	const getUserInitials = (name: string | null | undefined, email: string) => {
		if (name && name !== email) {
			return name
				.split(" ")
				.map((n) => n[0])
				.join("")
				.toUpperCase()
				.slice(0, 2);
		}
		return email[0]?.toUpperCase() ?? "U";
	};

	const isLoading = isLoadingComments || isLoadingNames;
	const isEmpty = !isLoading && comments.length === 0;

	return (
		<>
			<Sheet open={open} onOpenChange={onOpenChange}>
				<SheetContent
					className="sm:max-w-2xl w-full p-0 flex flex-col max-h-[85vh]"
					side="right"
					title="Comments"
				>
					<div className="flex flex-col h-full overflow-hidden">
						<SheetHeader className="px-6 pt-6 pb-4 border-b shrink-0">
							<div className="flex items-start justify-between gap-4">
								<div className="min-w-0 flex-1">
									<SheetTitle className="text-base font-semibold truncate">Comments</SheetTitle>
									<SheetDescription className="text-xs text-muted-foreground truncate mt-1">
										{version.fileName}
									</SheetDescription>
								</div>
								<div className="flex items-center gap-1 shrink-0">
									<Button
										type="button"
										variant="ghost"
										size="icon"
										className="h-8 w-8"
										onClick={() => refetchComments()}
										disabled={isLoadingComments}
										title="Refresh comments"
									>
										<RefreshCw className={`h-4 w-4 ${isLoadingComments ? "animate-spin" : ""}`} />
										<span className="sr-only">Refresh comments</span>
									</Button>
									<SheetClose asChild>
										<Button type="button" variant="ghost" size="icon" className="h-8 w-8" aria-label="Close">
											<X className="h-4 w-4" />
										</Button>
									</SheetClose>
								</div>
							</div>
						</SheetHeader>

						<div className="flex-1 min-h-0 px-4 overflow-hidden flex flex-col" ref={scrollAreaRef}>
							{isLoading ? (
								<div className="flex items-center justify-center flex-1">
									<div className="text-center space-y-2">
										<Spinner size={32} className="mx-auto text-primary" />
										<p className="text-sm text-muted-foreground">Loading comments...</p>
									</div>
								</div>
							) : isEmpty ? (
								<div className="flex flex-col items-center justify-center flex-1 py-12 text-center">
									<p className="text-sm text-muted-foreground mb-1">No comments yet</p>
									<p className="text-xs text-muted-foreground">Start a conversation</p>
								</div>
							) : (
								<ScrollArea className="flex-1">
									<div className="py-4 space-y-4">
										{Object.entries(groupedComments).map(([date, dateComments]) => (
											<div key={date} className="space-y-4">
												<div className="flex items-center gap-2 my-6">
													<Separator className="flex-1" />
													<span className="text-xs text-muted-foreground px-2">
														{new Date(date).toLocaleDateString("en-US", {
															weekday: "long",
															year: "numeric",
															month: "long",
															day: "numeric",
														})}
													</span>
													<Separator className="flex-1" />
												</div>
												{dateComments.map((comment) => (
													<CommentItem
														key={comment.id}
														comment={comment}
														getUserName={getUserName}
														getUserInitials={getUserInitials}
														formatTime={formatTime}
														onReply={handleReply}
														onEdit={handleEdit}
														activeCommentId={activeCommentId}
														onSetActiveComment={setActiveCommentId}
													/>
												))}
											</div>
										))}
									</div>
								</ScrollArea>
							)}
						</div>

						<div className="shrink-0 border-t bg-background">
							<div className="px-4 pt-3 pb-2">
								<Tabs
									value={isInternal ? "internal" : "public"}
									onValueChange={(v) => setIsInternal(v === "internal")}
								>
									<TabsList className="grid w-full grid-cols-2 h-8">
										<TabsTrigger value="public" className="text-xs">
											<Globe className="h-3 w-3 mr-1.5" />
											Public
										</TabsTrigger>
										<TabsTrigger value="internal" className="text-xs">
											<Lock className="h-3 w-3 mr-1.5" />
											Internal
										</TabsTrigger>
									</TabsList>
								</Tabs>
							</div>
							<form onSubmit={handleSubmit} className="px-4 pb-4 pt-2">
								<div className="flex items-end gap-2">
									<div className="flex-1 relative">
										<Textarea
											ref={textareaRef}
											value={message}
											onChange={(e) => setMessage(e.target.value)}
											onKeyDown={handleKeyDown}
											placeholder={`Add a ${isInternal ? "private" : "public"} comment...`}
											className="min-h-[60px] max-h-[200px] resize-none"
											disabled={addCommentMutation.isPending}
										/>
									</div>
									<Button
										type="submit"
										size="icon"
										className="h-[60px] w-[60px] shrink-0"
										disabled={!message.trim() || addCommentMutation.isPending || isOverLimit}
									>
										{addCommentMutation.isPending ? (
											<Spinner size={20} className="text-primary-foreground" />
										) : (
											<Send className="h-5 w-5" />
										)}
										<span className="sr-only">Send</span>
									</Button>
								</div>
								<div className="flex items-center justify-between mt-2 px-1">
									<p className="text-xs text-muted-foreground">
										Press <kbd className="px-1.5 py-0.5 text-xs font-semibold bg-muted rounded">Enter</kbd> to
										send,{" "}
										<kbd className="px-1.5 py-0.5 text-xs font-semibold bg-muted rounded">Shift + Enter</kbd> for
										new line
									</p>
									<span
										className={`text-xs font-medium ${isOverLimit ? "text-destructive" : "text-muted-foreground"}`}
									>
										{isOverLimit ? `-${wordsOverLimit}` : `${wordCount}/${WORD_LIMIT}`}
									</span>
								</div>
							</form>
						</div>
					</div>
				</SheetContent>
			</Sheet>

			<Dialog open={replyDialogOpen} onOpenChange={setReplyDialogOpen}>
				<DialogContent className="max-w-lg w-[90vw] sm:w-full p-6" hideClose>
					<DialogHeader className="mb-4">
						<DialogTitle className="mb-0">Reply to Comment</DialogTitle>
						<DialogDescription className="mt-1.5">Write your reply below.</DialogDescription>
					</DialogHeader>
					<form onSubmit={handleReplySubmit} className="space-y-4">
						<Textarea
							ref={replyTextareaRef}
							placeholder="Write a reply..."
							className="min-h-[140px] max-h-[300px] resize-y text-base"
							disabled={addCommentMutation.isPending}
							onKeyDown={(e) => {
								if (e.key === "Enter" && !e.shiftKey) {
									e.preventDefault();
									handleReplySubmit(e);
								}
							}}
						/>
						<div className="flex items-center justify-end gap-3 pt-4">
							<Button
								type="button"
								variant="outline"
								onClick={() => {
									setReplyDialogOpen(false);
									setReplyCommentId(null);
									if (replyTextareaRef.current) replyTextareaRef.current.value = "";
								}}
								disabled={addCommentMutation.isPending}
							>
								Cancel
							</Button>
							<Button type="submit" disabled={addCommentMutation.isPending}>
								{addCommentMutation.isPending ? (
									<>
										<Spinner size={16} className="mr-2" />
										Sending...
									</>
								) : (
									<>
										<Send className="h-4 w-4 mr-2" />
										Send Reply
									</>
								)}
							</Button>
						</div>
					</form>
				</DialogContent>
			</Dialog>

			<Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
				<DialogContent className="max-w-lg w-[90vw] sm:w-full p-6" hideClose>
					<DialogHeader className="mb-4">
						<DialogTitle className="text-lg mb-0 leading-none">Edit Comment</DialogTitle>
						<DialogDescription className="mt-1.5">Make your changes below.</DialogDescription>
					</DialogHeader>
					<form onSubmit={handleEditSubmit} className="space-y-4">
						<Textarea
							ref={editTextareaRef}
							defaultValue={editContent}
							placeholder="Edit your comment..."
							className="min-h-[140px] max-h-[300px] resize-y text-base"
							disabled={updateCommentMutation.isPending}
							onKeyDown={(e) => {
								if (e.key === "Enter" && !e.shiftKey) {
									e.preventDefault();
									handleEditSubmit(e);
								}
							}}
						/>
						<div className="flex items-center justify-end gap-3 pt-4">
							<Button
								type="button"
								variant="outline"
								onClick={() => {
									setEditDialogOpen(false);
									setEditCommentId(null);
									setEditContent("");
								}}
								disabled={updateCommentMutation.isPending}
							>
								Cancel
							</Button>
							<Button type="submit" disabled={updateCommentMutation.isPending}>
								{updateCommentMutation.isPending ? (
									<>
										<Spinner size={16} className="mr-2" />
										Saving...
									</>
								) : (
									<>
										<Edit className="h-4 w-4 mr-2" />
										Save Changes
									</>
								)}
							</Button>
						</div>
					</form>
				</DialogContent>
			</Dialog>
		</>
	);
}
