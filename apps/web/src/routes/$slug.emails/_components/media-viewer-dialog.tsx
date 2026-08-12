"use client";

import * as React from "react";
import { X, Download } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { trpc } from "@/utils/trpc";
import { type FileManagerItem } from "./file-manager-schema";
import { hostingDetailSchema } from "@/components/hosting/hosting-detail-schema";
import { captureEvent } from "@/lib/posthog";

// Max file size for preview (100MB) - larger files show "too large" message
const MAX_PREVIEW_BYTES = 100 * 1024 * 1024;

const IMAGE_EXTENSIONS = [
  "jpg",
  "jpeg",
  "png",
  "gif",
  "webp",
  "svg",
  "bmp",
  "ico",
  "apng",
  "avif",
];
const VIDEO_EXTENSIONS = [
  "mp4",
  "webm",
  "ogg",
  "ogv",
  "mov",
  "avi",
  "mkv",
  "m4v",
  "3gp",
];

export function isViewableMediaFile(file: FileManagerItem): boolean {
  if (file.type !== "file") return false;
  const ext = file.extension?.toLowerCase() ?? "";
  return (
    IMAGE_EXTENSIONS.includes(ext) || VIDEO_EXTENSIONS.includes(ext)
  );
}

function isImageFile(file: FileManagerItem): boolean {
  if (file.type !== "file") return false;
  return IMAGE_EXTENSIONS.includes(file.extension?.toLowerCase() ?? "");
}

function isVideoFile(file: FileManagerItem): boolean {
  if (file.type !== "file") return false;
  return VIDEO_EXTENSIONS.includes(file.extension?.toLowerCase() ?? "");
}

interface MediaViewerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: FileManagerItem | null;
  hostingData: z.infer<typeof hostingDetailSchema>;
  onDownload: (item: FileManagerItem) => void;
}

function bufferToBlob(data: { data?: number[]; type?: string }): Blob {
  const bytes = data?.data;
  if (!bytes || !Array.isArray(bytes)) {
    throw new Error("Invalid file data");
  }
  return new Blob([new Uint8Array(bytes)]);
}

export function MediaViewerDialog({
  open,
  onOpenChange,
  file,
  hostingData,
  onDownload,
}: MediaViewerDialogProps) {
  const [objectUrl, setObjectUrl] = React.useState<string | null>(null);

  const getFtpCredentials = () => {
    const ftpLogin = hostingData.hosting?.vrt_hst?.property?.find(
      (p) => p.name === "ftp_login"
    )?.value;
    const ftpPassword = hostingData.hosting?.vrt_hst?.property?.find(
      (p) => p.name === "ftp_password"
    )?.value;
    if (!ftpLogin || !ftpPassword) {
      throw new Error("FTP credentials not found");
    }
    return {
      host: process.env.VITE_PUBLIC_FTP_HOST ?? "orion.nisccloud.com",
      port: parseInt(process.env.VITE_PUBLIC_FTP_PORT ?? "21", 10),
      user: String(ftpLogin),
      password: String(ftpPassword),
      secure: true,
      timeout: 30000,
    };
  };

  const downloadFileMutation = trpc.plesk.ftp.downloadFile.useMutation({
    onSuccess: (result, variables) => {
      const name = variables?.path || variables?.filePath || file?.name || "";
      const ext = String(name).includes(".") ? String(name).split(".").pop()?.toLowerCase() || "unknown" : "unknown";
      captureEvent("file_viewed", { file_type: ext });
      try {
        const blob = bufferToBlob(result.data as unknown as { data?: number[]; type?: string });
        const url = window.URL.createObjectURL(blob);
        setObjectUrl(url);
      } catch (e) {
        console.error("Failed to create object URL", e);
        toast.error("Failed to load media");
      }
    },
    onError: (error) => {
      toast.error("Failed to load file", { description: error.message });
    },
  });

  // Revoke previous object URL when dialog or file changes
  React.useEffect(() => {
    if (!open || !file) {
      setObjectUrl((prev) => {
        if (prev) {
          window.URL.revokeObjectURL(prev);
        }
        return null;
      });
      return;
    }
    setObjectUrl((prev) => {
      if (prev) window.URL.revokeObjectURL(prev);
      return null;
    });
    const tooLarge =
      file.size != null && file.size > MAX_PREVIEW_BYTES;
    if (tooLarge) return;
    const credentials = getFtpCredentials();
    downloadFileMutation.mutate({
      credentials,
      remotePath: file.path,
    });
  }, [open, file?.path]);

  // Cleanup object URL on unmount
  React.useEffect(() => {
    return () => {
      setObjectUrl((prev) => {
        if (prev) window.URL.revokeObjectURL(prev);
        return null;
      });
    };
  }, []);

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleDownload = () => {
    if (file) {
      onDownload(file);
    }
  };

  const tooLarge =
    file != null &&
    file.size != null &&
    file.size > MAX_PREVIEW_BYTES;
  const isLoading =
    open &&
    file != null &&
    !tooLarge &&
    (downloadFileMutation.isPending || (downloadFileMutation.isSuccess && !objectUrl));
  const isImage = file ? isImageFile(file) : false;
  const isVideo = file ? isVideoFile(file) : false;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[95vw] max-h-[95vh] w-full overflow-hidden flex flex-col p-0 gap-0"
        showCloseButton={false}
      >
        <DialogHeader className="flex flex-row items-center justify-between gap-4 border-b px-4 py-3 shrink-0">
          <DialogTitle className="truncate text-base font-semibold">
            {file?.name ?? "Media"}
          </DialogTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDownload}
              disabled={!file}
              title="Download"
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              title="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 min-h-0 flex items-center justify-center bg-muted/30 p-4 overflow-auto">
          {!file ? (
            <p className="text-sm text-muted-foreground">No file selected</p>
          ) : tooLarge ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground mb-4">
                File is too large to preview (over 100MB).
              </p>
              <Button variant="outline" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          ) : isLoading ? (
            <div className="flex flex-col items-center gap-3">
              <Spinner size={32} />
              <p className="text-sm text-muted-foreground">Loading...</p>
            </div>
          ) : downloadFileMutation.isError ? (
            <p className="text-sm text-destructive">
              Failed to load file. Try downloading instead.
            </p>
          ) : objectUrl && isImage ? (
            <img
              src={objectUrl}
              alt={file.name}
              className="max-w-full max-h-[80vh] w-auto h-auto object-contain rounded"
            />
          ) : objectUrl && isVideo ? (
            <video
              src={objectUrl}
              controls
              className="max-w-full max-h-[80vh] w-auto rounded"
            >
              Your browser does not support the video tag.
            </video>
          ) : objectUrl ? (
            <p className="text-sm text-muted-foreground">Unsupported media type</p>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
