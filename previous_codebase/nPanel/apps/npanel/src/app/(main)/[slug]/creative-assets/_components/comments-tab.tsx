"use client";

import * as React from "react";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, CheckCircle, Globe, Lock } from "lucide-react";
import { formatDate } from "./utils";
import { creativeAssetSchema, creativeAssetCommentSchema } from "./schema";

interface CommentsTabProps {
  asset: z.infer<typeof creativeAssetSchema>;
  onAddComment?: (versionId: string, isInternal: boolean) => void;
}

export function CommentsTab({ asset, onAddComment }: CommentsTabProps) {
  // Get all comments from all versions
  const allComments: z.infer<typeof creativeAssetCommentSchema>[] = [];
  
  asset.versions?.forEach((version) => {
    // In a real app, comments would be loaded from version.comments
    // For now, we'll show a placeholder
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Comments</h3>
          <p className="text-sm text-muted-foreground">
            View and manage comments on versions
          </p>
        </div>
      </div>

      {allComments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No comments yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              Comments will appear here when added to versions
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {allComments.map((comment) => (
            <CommentCard key={comment.id} comment={comment} />
          ))}
        </div>
      )}
    </div>
  );
}

interface CommentCardProps {
  comment: z.infer<typeof creativeAssetCommentSchema>;
}

function CommentCard({ comment }: CommentCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <Badge variant={comment.isInternal ? "secondary" : "default"}>
              {comment.isInternal ? (
                <>
                  <Lock className="mr-1 h-3 w-3" />
                  Internal
                </>
              ) : (
                <>
                  <Globe className="mr-1 h-3 w-3" />
                  Public
                </>
              )}
            </Badge>
            {comment.isResolved && (
              <Badge variant="outline">
                <CheckCircle className="mr-1 h-3 w-3" />
                Resolved
              </Badge>
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            {formatDate(comment.createdAt)}
          </span>
        </div>
        <p className="text-sm">{comment.content}</p>
        {comment.replyCount > 0 && (
          <Button variant="ghost" size="sm" className="mt-2">
            View {comment.replyCount} {comment.replyCount === 1 ? "reply" : "replies"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

