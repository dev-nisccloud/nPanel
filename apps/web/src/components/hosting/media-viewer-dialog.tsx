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
import { hostingDetailSchema } from "@/components/hosting/hosting-detail-schema";
import { captureEvent } from "@/lib/posthog";
import { useFtpErrorMessage } from "@/components/hosting/ftp-error-message";
import { cn } from "@/lib/utils";

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

export type MediaPreviewFile = {
  name: string;
  path: string;
  type: string;
  size?: number;
  extension?: string;
};

function extensionOf(file: MediaPreviewFile): string {
  const fromExtension = file.extension?.toLowerCase().trim();
  if (fromExtension) return fromExtension;
  const dotIndex = file.name.lastIndexOf(".");
  if (dotIndex <= 0 || dotIndex === file.name.length - 1) return "";
  return file.name.slice(dotIndex + 1).toLowerCase();
}

export function isViewableMediaFile(file: MediaPreviewFile): boolean {
  if (file.type !== "file") return false;
  const ext = extensionOf(file);
  return IMAGE_EXTENSIONS.includes(ext) || VIDEO_EXTENSIONS.includes(ext);
}

function isImageFile(file: MediaPreviewFile): boolean {
  return file.type === "file" && IMAGE_EXTENSIONS.includes(extensionOf(file));
}

function isVideoFile(file: MediaPreviewFile): boolean {
  return file.type === "file" && VIDEO_EXTENSIONS.includes(extensionOf(file));
}

interface MediaViewerDialogProps<T extends MediaPreviewFile> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: T | null;
  hostingData: z.infer<typeof hostingDetailSchema>;
  onDownload: (item: T) => void;
}

export function MediaViewerDialog<T extends MediaPreviewFile>({
  open,
  onOpenChange,
  file,
  hostingData,
  onDownload,
}: MediaViewerDialogProps<T>) {
  const ftpErrorText = useFtpErrorMessage();
  const [src, setSrc] = React.useState<string | null>(null);
  const [mediaReady, setMediaReady] = React.useState(false);
  const [mediaFailed, setMediaFailed] = React.useState(false);

  const getFtpPort = () => {
    const parsed = Number.parseInt(import.meta.env.VITE_PUBLIC_FTP_PORT || "21", 10);
    return Number.isFinite(parsed) ? parsed : 21;
  };

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
      host: import.meta.env.VITE_PUBLIC_FTP_HOST ?? "orion.nisccloud.com",
      port: getFtpPort(),
      user: String(ftpLogin),
      password: String(ftpPassword),
      secure: true,
      timeout: 30000,
    };
  };

  const previewFile = trpc.plesk.ftp.previewFile.useMutation();

  React.useEffect(() => {
    if (!open || !file) {
      setSrc(null);
      setMediaReady(false);
      setMediaFailed(false);
      return;
    }

    const tooLarge = file.size != null && file.size > MAX_PREVIEW_BYTES;
    if (tooLarge) {
      setSrc(null);
      setMediaReady(false);
      setMediaFailed(false);
      return;
    }

    let cancelled = false;
    setSrc(null);
    setMediaReady(false);
    setMediaFailed(false);

    let credentials: ReturnType<typeof getFtpCredentials>;
    try {
      credentials = getFtpCredentials();
    } catch (error) {
      toast.error("Failed to load file", { description: ftpErrorText(error) });
      setMediaFailed(true);
      return;
    }

    const ext = extensionOf(file) || "unknown";
    previewFile.mutate(
      { credentials, remotePath: file.path },
      {
        onSuccess: (result) => {
          if (cancelled) return;
          captureEvent("file_viewed", { file_type: ext });
          setSrc(result.url);
        },
        onError: (error) => {
          if (cancelled) return;
          setMediaFailed(true);
          toast.error("Failed to load file", { description: ftpErrorText(error) });
        },
      },
    );

    return () => {
      cancelled = true;
    };
    // Credentials come from the open hosting record. Re-run only when the preview target changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, file?.path]);

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleDownload = () => {
    if (file) onDownload(file);
  };

  const tooLarge = file != null && file.size != null && file.size > MAX_PREVIEW_BYTES;
  const isImage = file ? isImageFile(file) : false;
  const isVideo = file ? isVideoFile(file) : false;
  const waitingForTicket = open && file != null && !tooLarge && !src && !mediaFailed;
  const waitingForMedia = Boolean(src) && !mediaReady && !mediaFailed;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[85vh] w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl"
        showCloseButton={false}
      >
        <DialogHeader className="flex shrink-0 flex-row items-center justify-between gap-4 border-b px-4 py-3">
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
            <Button variant="ghost" size="icon" onClick={handleClose} title="Close">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="relative flex min-h-[28rem] flex-1 items-center justify-center overflow-auto bg-muted/30 p-4">
          {!file ? (
            <p className="text-sm text-muted-foreground">No file selected</p>
          ) : tooLarge ? (
            <div className="py-8 text-center">
              <p className="mb-4 text-sm text-muted-foreground">
                File is too large to preview (over 100MB).
              </p>
              <Button variant="outline" onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </div>
          ) : mediaFailed ? (
            <p className="text-sm text-destructive">Failed to load file. Try downloading instead.</p>
          ) : (
            <>
              {(waitingForTicket || waitingForMedia) && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                  <Spinner size={32} />
                  <p className="text-sm text-muted-foreground">Loading...</p>
                </div>
              )}
              {src && isImage ? (
                <img
                  src={src}
                  alt={file.name}
                  onLoad={() => setMediaReady(true)}
                  onError={() => {
                    setMediaFailed(true);
                    setMediaReady(false);
                  }}
                  className={cn(
                    "h-auto max-h-[70vh] w-auto max-w-full rounded object-contain",
                    !mediaReady && "invisible",
                  )}
                />
              ) : null}
              {src && isVideo ? (
                <video
                  src={src}
                  controls
                  onLoadedData={() => setMediaReady(true)}
                  onError={() => {
                    setMediaFailed(true);
                    setMediaReady(false);
                  }}
                  className={cn(
                    "max-h-[70vh] w-full max-w-full rounded",
                    !mediaReady && "invisible",
                  )}
                >
                  Your browser does not support the video tag.
                </video>
              ) : null}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
