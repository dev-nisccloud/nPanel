"use client";

import * as React from "react";
import { z } from "zod";
import { X, MoreVertical, Download, Share2, MessageSquare } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@npanel/ui/components/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { creativeAssetVersionSchema } from "./schema";
import { formatFileSize } from "./utils";
import { CommentsDialog } from "./comments-dialog";
import { CustomDocumentViewer } from "./document-viewers/custom-document-viewer";

interface VersionDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  version: z.infer<typeof creativeAssetVersionSchema>;
}

export function VersionDetailDialog({
  open,
  onOpenChange,
  version,
}: VersionDetailDialogProps) {
  const [isCommentsOpen, setIsCommentsOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[99vw] w-[99vw] h-[85vh] p-0 gap-0 overflow-hidden"
        hideClose
      >
        {/* Accessibility: Hidden title and description for screen readers */}
        <DialogTitle className="sr-only">
          View File Preview: {version.fileName}
        </DialogTitle>
        <DialogDescription className="sr-only">
          Preview of {version.fileName} ({formatFileSize(version.fileSize)}, {version.mimeType})
        </DialogDescription>

        {/* File Preview - Full Dialog */}
        <div className="flex flex-col h-full overflow-hidden">
          {/* Header with Action Menu */}
          <div className="flex-shrink-0 px-4 py-3 bg-background border-b flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {/* Action Menu - Top Left */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                    <span className="sr-only">Actions</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={() => setIsCommentsOpen(true)}>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    View Comments
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={async () => {
                      if (version.fileUrl) {
                        try {
                          // Fetch the file as a blob to ensure proper download
                          const response = await fetch(version.fileUrl);
                          const blob = await response.blob();
                          
                          // Create a blob URL and trigger download
                          const blobUrl = window.URL.createObjectURL(blob);
                          const link = document.createElement("a");
                          link.href = blobUrl;
                          link.download = version.fileName || "download";
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                          
                          // Clean up the blob URL after a delay
                          setTimeout(() => {
                            window.URL.revokeObjectURL(blobUrl);
                          }, 100);
                        } catch (error) {
                          console.error("Failed to download file:", error);
                          // Fallback to opening in new tab if download fails
                          window.open(version.fileUrl, "_blank");
                        }
                      }
                    }}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Share2 className="mr-2 h-4 w-4" />
                    Share
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              {/* File Info */}
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-sm truncate">{version.fileName}</h3>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(version.fileSize)} • {version.mimeType}
                </p>
              </div>
            </div>
            
            {/* Close Button */}
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

          {/* Preview Area - Custom Document Viewer */}
          <div className="flex-1 min-h-0 w-full h-full bg-white overflow-hidden">
            {version.fileUrl ? (
              <CustomDocumentViewer
                fileUrl={version.fileUrl}
                fileName={version.fileName}
                mimeType={version.mimeType}
              />
            ) : (
              <div className="flex items-center justify-center w-full h-full">
                <div className="text-center space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    Unable to preview file
                  </p>
                  <p className="text-xs text-muted-foreground">
                    File URL is not available
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
      
      {/* Comments Dialog */}
      <CommentsDialog
        open={isCommentsOpen}
        onOpenChange={setIsCommentsOpen}
        version={version}
      />
    </Dialog>
  );
}

