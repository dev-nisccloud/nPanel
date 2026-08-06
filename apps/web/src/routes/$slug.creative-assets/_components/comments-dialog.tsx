"use client";

import * as React from "react";
import { z } from "zod";
import { X, Send, Lock, Globe, Reply, Edit, MoreVertical, RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader } from "@npanel/ui/components/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "@/components/ui/sonner";
import { trpc } from "@/utils/trpc";
import { Spinner } from "@/components/ui/shadcn-io/spinner";

import { creativeAssetVersionSchema } from "./schema";
import { useUserNames } from "./use-user-names";
import { captureEvent } from "@/lib/posthog";

interface CommentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  version: z.infer<typeof creativeAssetVersionSchema>;
}

// Comment type from API (dates are Date objects)
type Comment = {
  id: string;
  creativeAssetVersionId: string;
  userId: string;
  content: string;
  isInternal: boolean;
  parentCommentId: string | null;
  mentions: string[];
  replyCount: number;
  createdAt: Date | string;
  updatedAt: Date | string;
  editedAt?: Date | string | null;
  replies?: Comment[];
};

// Individual Comment Item Component (to allow hooks)
interface CommentItemProps {
  comment: Comment;
  getUserName: (userId: string) => string;
  getUserInitials: (name: string | null | undefined, email: string) => string;
  formatTime: (date: Date | string) => string;
  onReply: (commentId: string) => void;
  onEdit: (commentId: string, content: string) => void;
  activeCommentId: string | null;
  onSetActiveComment: (commentId: string | null) => void;
}

function CommentItem({ comment, getUserName, getUserInitials, formatTime, onReply, onEdit, activeCommentId, onSetActiveComment }: CommentItemProps) {
  const [isHovered, setIsHovered] = React.useState(false);
  
  const isActive = activeCommentId === comment.id;
  const userName = getUserName(comment.userId);
  const userInitials = getUserInitials(userName, comment.userId);

  return (
    <div 
      className="flex gap-3 group relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Avatar */}
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback className="text-xs">
          {userInitials}
            </AvatarFallback>
          </Avatar>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1">
        {/* Header */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold">
            {userName}
              </span>
              <Badge
                variant={comment.isInternal ? "secondary" : "outline"}
                className="h-5 text-xs"
              >
                {comment.isInternal ? (
                  <>
                    <Lock className="h-3 w-3 mr-1" />
                    Internal
                  </>
                ) : (
                  <>
                    <Globe className="h-3 w-3 mr-1" />
                    Public
                  </>
                )}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {formatTime(comment.createdAt)}
              </span>
          {comment.editedAt && (
                <span className="text-xs text-muted-foreground italic">
                  (edited)
                </span>
              )}
            </div>

        {/* Message */}
        <div 
          className="text-sm text-foreground whitespace-pre-wrap break-words md:cursor-default cursor-pointer"
          onClick={(e) => {
            // On mobile, set this comment as active when clicking the message
            // If clicking the same comment, close it; otherwise, open this one
            if (window.innerWidth < 768) {
              e.stopPropagation();
              onSetActiveComment(isActive ? null : comment.id);
            }
          }}
        >
          {comment.content}
        </div>

        {/* Action Buttons and View Replies */}
        <div className="flex items-center gap-2 mt-2">
          {/* View Replies Button */}
          {comment.replies && comment.replies.length > 0 && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-muted-foreground hover:text-foreground"
                >
                  <Reply className="h-3 w-3 mr-1.5" />
                  View {comment.replyCount} {comment.replyCount === 1 ? "reply" : "replies"}
                </Button>
              </PopoverTrigger>
              <PopoverContent 
                className="w-80 max-h-96 p-0" 
                align="start"
                side="right"
              >
                <div className="p-3 border-b">
                  <h4 className="text-sm font-semibold">Replies</h4>
                </div>
                <ScrollArea className="max-h-80">
                  <div className="p-3 space-y-3">
                    {comment.replies.map((reply) => {
                      const replyUserName = getUserName(reply.userId);
                      const replyUserInitials = getUserInitials(replyUserName, reply.userId);
                      return (
                        <div key={reply.id} className="flex gap-3">
                          <Avatar className="h-6 w-6 shrink-0">
                            <AvatarFallback className="text-xs">
                              {replyUserInitials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold">
                                {replyUserName}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {formatTime(reply.createdAt)}
                              </span>
                            </div>
                            <div className="text-sm text-foreground whitespace-pre-wrap break-words">
                              {reply.content}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </PopoverContent>
            </Popover>
          )}

          {/* Action Icons - Show on hover (desktop) or when this comment is active (mobile) */}
          {(isHovered || isActive) && (
            <div className="flex items-center gap-1 ml-auto">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={() => {
                  onSetActiveComment(null);
                  onReply(comment.id);
                }}
                title="Reply"
              >
                <Reply className="h-3.5 w-3.5" />
                <span className="sr-only">Reply</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={() => {
                  onSetActiveComment(null);
                  onEdit(comment.id, comment.content);
                }}
                title="Edit"
              >
                <Edit className="h-3.5 w-3.5" />
                <span className="sr-only">Edit</span>
              </Button>
            </div>
          )}

          {/* Mobile: Touch to show actions (only on mobile when not hovered/active) */}
          {!isHovered && !isActive && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground md:hidden ml-auto"
              onClick={() => onSetActiveComment(comment.id)}
              title="More actions"
            >
              <MoreVertical className="h-3.5 w-3.5" />
              <span className="sr-only">More actions</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export function CommentsDialog({
  open,
  onOpenChange,
  version,
}: CommentsDialogProps) {
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
  const utils = trpc.useUtils();
  
  // Word limit configuration
  const WORD_LIMIT = 150;
  
  // Calculate word count
  const wordCount = React.useMemo(() => {
    if (!message.trim()) return 0;
    return message.trim().split(/\s+/).filter(word => word.length > 0).length;
  }, [message]);
  
  const isOverLimit = wordCount > WORD_LIMIT;
  const wordsOverLimit = isOverLimit ? wordCount - WORD_LIMIT : 0;

  // Fetch comments
  const { data: comments = [], isLoading: isLoadingComments, refetch: refetchComments } = trpc.creativeAssets.getComments.useQuery(
    { versionId: version.id },
    {
      enabled: open,
      staleTime: 0, // Always fetch fresh data
      gcTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  // Collect all user IDs from comments and replies
  const allUserIds = React.useMemo(() => {
    const userIds = new Set<string>();
    comments.forEach((comment) => {
      userIds.add(comment.userId);
      comment.replies?.forEach((reply) => {
        userIds.add(reply.userId);
      });
    });
    return Array.from(userIds);
  }, [comments]);

  // Fetch user names
  const { getUserName, isLoading: isLoadingNames } = useUserNames(allUserIds);

  // Mutations with immediate refetch
  const addCommentMutation = trpc.creativeAssets.addComment.useMutation({
    onSuccess: async (_data, variables) => {
      captureEvent("creative_asset_commented", {
        comment_length: variables.content.length,
      });
      setMessage("");
      // Immediately refetch comments to get fresh data
      await refetchComments();
      toast.success("Comment added", {
        description: "Your comment has been posted successfully.",
      });
    },
    onError: (error) => {
      toast.error("Failed to add comment", {
        description: error.message || "Please try again.",
      });
    },
  });

  const updateCommentMutation = trpc.creativeAssets.updateComment.useMutation({
    onSuccess: async () => {
      setEditDialogOpen(false);
      setEditCommentId(null);
      setEditContent("");
      // Immediately refetch comments to get fresh data
      await refetchComments();
      toast.success("Comment updated", {
        description: "Your comment has been updated successfully.",
      });
    },
    onError: (error) => {
      toast.error("Failed to update comment", {
        description: error.message || "Please try again.",
      });
    },
  });

  const deleteCommentMutation = trpc.creativeAssets.deleteComment.useMutation({
    onSuccess: async () => {
      // Immediately refetch comments to get fresh data
      await refetchComments();
      toast.success("Comment deleted", {
        description: "Your comment has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast.error("Failed to delete comment", {
        description: error.message || "Please try again.",
      });
    },
  });

  // Auto-scroll to bottom when new comments arrive (newest messages at bottom)
  React.useEffect(() => {
    if (scrollAreaRef.current && comments.length > 0) {
      setTimeout(() => {
        const viewport = scrollAreaRef.current?.querySelector('[data-slot="scroll-area-viewport"]');
        if (viewport) {
          viewport.scrollTop = viewport.scrollHeight;
        }
      }, 100);
    }
  }, [comments.length]);

  // Focus textarea when dialog opens
  React.useEffect(() => {
    if (open && textareaRef.current) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || isOverLimit) return;

    addCommentMutation.mutate({
      versionId: version.id,
        content: message.trim(),
        isInternal,
      });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Handle reply to comment
  const handleReply = (commentId: string) => {
    setReplyCommentId(commentId);
    setReplyDialogOpen(true);
  };

  // Handle edit comment
  const handleEdit = (commentId: string, content: string) => {
    setEditCommentId(commentId);
    setEditContent(content);
    setEditDialogOpen(true);
  };

  // Submit reply
  const handleReplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyCommentId || !replyTextareaRef.current?.value.trim()) return;

    const replyText = replyTextareaRef.current.value.trim();
    
    // Find the parent comment to inherit its visibility
    // If replying to a top-level comment, get it directly
    const topLevelComment = comments.find(c => c.id === replyCommentId);
    
    // Replies inherit the parent comment's visibility
    const parentIsInternal = topLevelComment?.isInternal ?? false;
    
    addCommentMutation.mutate({
      versionId: version.id,
      content: replyText,
      isInternal: parentIsInternal,
      parentCommentId: replyCommentId,
    }, {
      onSuccess: async () => {
      setReplyDialogOpen(false);
      setReplyCommentId(null);
      if (replyTextareaRef.current) {
        replyTextareaRef.current.value = "";
      }
        // Immediately refetch comments to get fresh data (including the new reply)
        await refetchComments();
      },
    });
  };

  // Submit edit
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCommentId || !editTextareaRef.current?.value.trim()) return;

    const editedText = editTextareaRef.current.value.trim();
    
    updateCommentMutation.mutate({
      commentId: editCommentId,
      content: editedText,
    });
  };

  // Focus textarea when dialogs open
  React.useEffect(() => {
    if (replyDialogOpen && replyTextareaRef.current) {
      setTimeout(() => {
        replyTextareaRef.current?.focus();
      }, 100);
    }
  }, [replyDialogOpen]);

  React.useEffect(() => {
    if (editDialogOpen && editTextareaRef.current) {
      setTimeout(() => {
        editTextareaRef.current?.focus();
      }, 100);
    }
  }, [editDialogOpen]);

  // Group comments by date (oldest first, newest last)
  const groupedComments = React.useMemo(() => {
    const groups: Record<string, Comment[]> = {};
    // Sort comments: top-level comments first (oldest to newest), then order replies
    const sortedComments = [...comments].sort((a, b) => {
      const dateA = typeof a.createdAt === "string" ? new Date(a.createdAt) : a.createdAt;
      const dateB = typeof b.createdAt === "string" ? new Date(b.createdAt) : b.createdAt;
      return dateA.getTime() - dateB.getTime();
    });

    sortedComments.forEach((comment) => {
      // Only process top-level comments (no parentCommentId)
      if (!comment.parentCommentId) {
      const dateObj = typeof comment.createdAt === "string" 
        ? new Date(comment.createdAt) 
        : comment.createdAt;
      const date = dateObj.toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(comment as Comment);
      }
    });
    return groups;
  }, [comments]);

  const formatTime = (date: Date | string) => {
    try {
      const dateObj = typeof date === "string" ? new Date(date) : date;
      return formatDistanceToNow(dateObj, { addSuffix: true });
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-2xl w-[calc(100vw-2rem)] h-[85vh] p-0 gap-0 flex flex-col overflow-hidden"
        hideClose
      >
        {/* Header */}
        <div className="flex-shrink-0 px-4 py-3 bg-background border-b flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-base font-semibold truncate">
                Comments
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground truncate">
                {version.fileName}
              </DialogDescription>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => refetchComments()}
              disabled={isLoadingComments}
              title="Refresh comments"
            >
              <RefreshCw className={`h-4 w-4 ${isLoadingComments ? "animate-spin" : ""}`} />
              <span className="sr-only">Refresh comments</span>
            </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
          </div>
        </div>

        {/* Comments List */}
        <div className="flex-1 min-h-0 px-4" ref={scrollAreaRef}>
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-2">
                <Spinner size={32} className="mx-auto text-primary" />
                <p className="text-sm text-muted-foreground">Loading comments...</p>
              </div>
            </div>
          ) : isEmpty ? (
            <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                <p className="text-sm text-muted-foreground mb-1">No comments yet</p>
                <p className="text-xs text-muted-foreground">Start a conversation</p>
              </div>
            ) : (
            <ScrollArea className="h-full">
              <div className="py-4 space-y-4">
                {Object.entries(groupedComments).map(([date, dateComments]) => (
                <div key={date} className="space-y-4">
                  {/* Date separator */}
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

                  {/* Comments */}
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

        {/* Message Input */}
        <div className="flex-shrink-0 border-t bg-background">
          {/* Comment Type Tabs */}
          <div className="px-4 pt-3 pb-2">
            <Tabs value={isInternal ? "internal" : "public"} onValueChange={(value) => setIsInternal(value === "internal")}>
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

          {/* Input Area */}
          <form onSubmit={handleSubmit} className="px-4 pb-4 pt-2">
            <div className="flex items-end gap-2">
              {/* Message Input */}
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

              {/* Send Button */}
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
            
            {/* Word Count Counter */}
            <div className="flex items-center justify-between mt-2 px-1">
              <p className="text-xs text-muted-foreground">
                Press <kbd className="px-1.5 py-0.5 text-xs font-semibold bg-muted rounded">Enter</kbd> to send,{" "}
                <kbd className="px-1.5 py-0.5 text-xs font-semibold bg-muted rounded">Shift + Enter</kbd> for new line
              </p>
              <span className={`text-xs font-medium ${isOverLimit ? 'text-destructive' : 'text-muted-foreground'}`}>
                {isOverLimit ? `-${wordsOverLimit}` : `${wordCount}/${WORD_LIMIT}`}
              </span>
            </div>
          </form>
        </div>
      </DialogContent>

      {/* Reply Dialog */}
      <Dialog open={replyDialogOpen} onOpenChange={setReplyDialogOpen}>
        <DialogContent className="max-w-lg w-[90vw] sm:w-full p-6" hideClose>
          <DialogHeader className="mb-4">
            <DialogTitle className="mb-0">Reply to Comment</DialogTitle>
            
            <DialogDescription className="mt-1.5">
              Write your reply below.
            </DialogDescription>
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
                  if (replyTextareaRef.current) {
                    replyTextareaRef.current.value = "";
                  }
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

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg w-[90vw] sm:w-full p-6" hideClose>
          <DialogHeader className="mb-4">
            <DialogTitle className="text-lg mb-0 leading-none">Edit Comment</DialogTitle>
            <DialogDescription className="mt-1.5">
              Make your changes below.
            </DialogDescription>
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
    </Dialog>
  );
}

