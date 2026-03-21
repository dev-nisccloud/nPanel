"use client";

import * as React from "react";
import { Download, File, Image as ImageIcon, Video, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/shadcn-io/spinner";

// MIME type constants
const IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "image/bmp",
  "image/tiff",
] as const;

const VIDEO_MIME_TYPES = [
  "video/mp4",
  "video/webm",
  "video/ogg",
  "video/quicktime",
  "video/x-msvideo",
  "video/x-ms-wmv",
] as const;

interface MessageAttachmentProps {
  attachment: {
    id: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    fileUrl: string;
  };
  isUserMessage?: boolean;
}

export function MessageAttachment({ attachment, isUserMessage = false }: MessageAttachmentProps) {
  const [imageError, setImageError] = React.useState(false);
  const [videoError, setVideoError] = React.useState(false);
  const [isImageLoading, setIsImageLoading] = React.useState(true);
  const [isVideoLoading, setIsVideoLoading] = React.useState(true);

  const isImage = IMAGE_MIME_TYPES.includes(attachment.mimeType as any);
  const isVideo = VIDEO_MIME_TYPES.includes(attachment.mimeType as any);
  const isDocument = !isImage && !isVideo;

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = attachment.fileUrl;
    link.download = attachment.fileName;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getFileIcon = () => {
    if (isImage) return ImageIcon;
    if (isVideo) return Video;
    return FileText;
  };

  const FileIcon = getFileIcon();

  return (
    <div className={cn(
      "rounded-lg overflow-hidden border",
      isUserMessage ? "border-primary/30" : "border-border"
    )}>
      {isImage && !imageError ? (
        <div className="relative group">
          <img
            src={attachment.fileUrl}
            alt={attachment.fileName}
            className={cn(
              "w-full max-w-[280px] object-cover",
              isImageLoading && "opacity-0"
            )}
            onLoad={() => setIsImageLoading(false)}
            onError={() => {
              setImageError(true);
              setIsImageLoading(false);
            }}
          />
          {isImageLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted">
              <Spinner size={24} />
            </div>
          )}
          {/* Download overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
            <Button
              size="icon"
              variant="secondary"
              className="h-8 w-8 rounded-full"
              onClick={handleDownload}
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : isVideo && !videoError ? (
        <div className="relative group">
          <video
            src={attachment.fileUrl}
            className="w-full max-w-[280px] max-h-[200px] object-cover rounded-t-lg"
            controls
            onLoadedData={() => setIsVideoLoading(false)}
            onError={() => {
              setVideoError(true);
              setIsVideoLoading(false);
            }}
          >
            Your browser does not support the video tag.
          </video>
          {isVideoLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted rounded-t-lg">
              <Spinner size={24} />
            </div>
          )}
          {/* Download overlay */}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="icon"
              variant="secondary"
              className="h-8 w-8 rounded-full bg-black/50 hover:bg-black/70"
              onClick={handleDownload}
            >
              <Download className="h-4 w-4 text-white" />
            </Button>
          </div>
        </div>
      ) : (
        // Document or error state
        <div className={cn(
          "flex items-center gap-3 p-3",
          isUserMessage ? "bg-primary/10" : "bg-muted"
        )}>
          <div className={cn(
            "h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0",
            isUserMessage ? "bg-primary/20" : "bg-background"
          )}>
            <FileIcon className={cn(
              "h-5 w-5",
              isUserMessage ? "text-primary" : "text-muted-foreground"
            )} />
          </div>
          <div className="flex-1 min-w-0">
            <p className={cn(
              "text-sm font-medium truncate",
              isUserMessage ? "text-primary-foreground" : "text-foreground"
            )}>
              {attachment.fileName}
            </p>
            <p className={cn(
              "text-xs",
              isUserMessage ? "text-primary-foreground/70" : "text-muted-foreground"
            )}>
              {formatFileSize(attachment.fileSize)}
            </p>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 flex-shrink-0"
            onClick={handleDownload}
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
