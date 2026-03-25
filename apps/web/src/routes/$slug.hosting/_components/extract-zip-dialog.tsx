"use client";

import * as React from "react";
import { Archive, AlertCircle, CheckCircle2, XCircle, Loader2, FolderOpen } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { trpc } from "@/utils/trpc";
import { FileManagerItem } from "./file-manager-schema";
import { hostingDetailSchema } from "./hosting-detail-schema";

interface ExtractZipDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: FileManagerItem;
  hostingData: z.infer<typeof hostingDetailSchema>;
  currentPath: string;
  onSuccess?: () => void;
}

type ExtractionStatus = "idle" | "downloading" | "extracting" | "uploading" | "completed" | "error";

export function ExtractZipDialog({
  open,
  onOpenChange,
  file,
  hostingData,
  currentPath,
  onSuccess,
}: ExtractZipDialogProps) {
  // Default unzipped folder name = zip filename without .zip
  const defaultFolderName = React.useMemo(
    () => (file?.name ? file.name.replace(/\.zip$/i, "").trim() || "extracted" : "extracted"),
    [file?.name]
  );
  const [folderName, setFolderName] = React.useState<string>(defaultFolderName);
  const [overwrite, setOverwrite] = React.useState(false);
  const [status, setStatus] = React.useState<ExtractionStatus>("idle");
  const [progress, setProgress] = React.useState(0);
  const [statusMessage, setStatusMessage] = React.useState("");
  const [extractedFiles, setExtractedFiles] = React.useState<string[]>([]);
  const [failedFiles, setFailedFiles] = React.useState<string[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  // Get FTP credentials
  const getFtpCredentials = () => {
    const ftpLogin = hostingData.hosting?.vrt_hst?.property?.find(
      prop => prop.name === "ftp_login"
    )?.value;
    const ftpPassword = hostingData.hosting?.vrt_hst?.property?.find(
      prop => prop.name === "ftp_password"
    )?.value;

    if (!ftpLogin || !ftpPassword) {
      throw new Error("FTP credentials not found in hosting data");
    }

    return {
      host: process.env.NEXT_PUBLIC_FTP_HOST || "orion.nisccloud.com",
      port: parseInt(process.env.NEXT_PUBLIC_FTP_PORT || "21"),
      user: String(ftpLogin),
      password: String(ftpPassword),
      secure: true,
      timeout: 300000, // 5 minutes for large extractions
    };
  };

  // Extract zip mutation
  const extractZip = trpc.plesk.ftp.extractZip.useMutation({
    onMutate: () => {
      setStatus("downloading");
      setProgress(0);
      setStatusMessage("Downloading zip file...");
      setError(null);
      setExtractedFiles([]);
      setFailedFiles([]);
    },
    onSuccess: (data) => {
      setStatus("completed");
      setProgress(100);
      setStatusMessage(data.message);
      setExtractedFiles(data.files || []);
      setFailedFiles(data.failedFiles || []);
      
      toast.success("Extraction completed", {
        description: data.message,
      });
      
      // Call onSuccess callback to refresh file list
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 1000);
      }
    },
    onError: (error) => {
      console.error('Error extracting zip:', error);
      setStatus("error");
      setProgress(0);
      setError(error.message || "Failed to extract zip file");
      setStatusMessage("Extraction failed");
      
      toast.error("Extraction failed", {
        description: error.message || "Please try again.",
      });
    },
  });

  // Reset state when dialog opens/closes
  React.useEffect(() => {
    if (open) {
      setFolderName(defaultFolderName);
      setOverwrite(false);
      setStatus("idle");
      setProgress(0);
      setStatusMessage("");
      setExtractedFiles([]);
      setFailedFiles([]);
      setError(null);
    }
  }, [open, currentPath, defaultFolderName]);

  // Simulate progress updates (since we don't have real-time progress from server)
  React.useEffect(() => {
    if (status === "downloading" || status === "extracting" || status === "uploading") {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev; // Don't go to 100% until completion
          return prev + Math.random() * 5; // Increment by 0-5%
        });
      }, 500);

      return () => clearInterval(interval);
    }
  }, [status]);

  const handleExtract = () => {
    if (!file) return;

    // Sanitize folder name: trim, remove slashes
    const sanitized = folderName.trim().replace(/[/\\]+/g, "").trim() || defaultFolderName;
    const extractToPath =
      currentPath === "/"
        ? `/${sanitized}`.replace(/\/+/g, "/")
        : `${currentPath}/${sanitized}`.replace(/\/+/g, "/");

    const credentials = getFtpCredentials();

    extractZip.mutate({
      credentials,
      zipPath: file.path,
      extractTo: extractToPath,
      overwrite,
      maxSize: 500 * 1024 * 1024, // 500MB limit
    });
  };

  const handleClose = () => {
    if (status === "downloading" || status === "extracting" || status === "uploading") {
      // Don't allow closing during extraction
      toast.warning("Please wait for extraction to complete");
      return;
    }
    onOpenChange(false);
  };

  const formatFileSize = (bytes: number | undefined) => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const isProcessing = status === "downloading" || status === "extracting" || status === "uploading";
  const canClose = !isProcessing;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Archive className="h-5 w-5 text-primary" />
            Extract Zip File
          </DialogTitle>
          <DialogDescription>
            Extract contents of <span className="font-mono font-semibold">{file.name}</span> to a directory
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* File Info */}
          <div className="rounded-lg border bg-muted/50 p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Archive className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{file.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {formatFileSize(file.size)}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground font-mono">
                  {file.path}
                </p>
              </div>
            </div>
          </div>

          {/* Extraction Settings - Only show when idle */}
          {status === "idle" && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Current folder</Label>
                <div className="flex items-center gap-2 mt-1.5 rounded-md border bg-muted/50 px-3 py-2">
                  <FolderOpen className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm font-mono text-muted-foreground truncate">
                    {currentPath || "/"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Contents will be extracted into a new folder inside this directory.
                </p>
              </div>

              <div>
                <Label htmlFor="folder-name" className="text-sm font-medium">
                  Unzipped folder name
                </Label>
                <Input
                  id="folder-name"
                  type="text"
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  className="mt-1.5 font-mono"
                  placeholder={defaultFolderName}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Name of the folder to create. Default is the zip file name without extension.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="overwrite"
                  checked={overwrite}
                  onChange={(e) => setOverwrite(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <label htmlFor="overwrite" className="text-sm font-medium cursor-pointer">
                  Overwrite existing files
                </label>
              </div>
            </div>
          )}

          {/* Progress Section */}
          {isProcessing && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{statusMessage || "Processing..."}</span>
                <span className="text-muted-foreground">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>This may take a while for large files...</span>
              </div>
            </div>
          )}

          {/* Error State */}
          {status === "error" && error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Success State */}
          {status === "completed" && (
            <div className="space-y-3">
              <Alert className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                <AlertDescription className="text-green-800 dark:text-green-200">
                  {statusMessage}
                </AlertDescription>
              </Alert>

              {/* Extracted Files List */}
              {extractedFiles.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">
                      Extracted Files ({extractedFiles.length})
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {extractedFiles.length} files
                    </Badge>
                  </div>
                  <ScrollArea className="h-32 rounded-md border bg-muted/50 p-2">
                    <div className="space-y-1">
                      {extractedFiles.slice(0, 20).map((filePath, index) => (
                        <div key={index} className="text-xs font-mono text-muted-foreground truncate">
                          {filePath}
                        </div>
                      ))}
                      {extractedFiles.length > 20 && (
                        <div className="text-xs text-muted-foreground">
                          ... and {extractedFiles.length - 20} more files
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              )}

              {/* Failed Files List */}
              {failedFiles.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-amber-600">
                      Failed Files ({failedFiles.length})
                    </span>
                    <Badge variant="outline" className="text-xs text-amber-600 border-amber-600">
                      {failedFiles.length} failed
                    </Badge>
                  </div>
                  <ScrollArea className="h-24 rounded-md border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 p-2">
                    <div className="space-y-1">
                      {failedFiles.slice(0, 10).map((filePath, index) => (
                        <div key={index} className="text-xs font-mono text-amber-700 dark:text-amber-300 truncate">
                          {filePath}
                        </div>
                      ))}
                      {failedFiles.length > 10 && (
                        <div className="text-xs text-amber-600">
                          ... and {failedFiles.length - 10} more files
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>
          )}

          {/* Empty State - When no files extracted */}
          {status === "completed" && extractedFiles.length === 0 && failedFiles.length === 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No files were extracted. The zip file might be empty or all files already exist.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          {status === "idle" && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleExtract} disabled={!file}>
                <Archive className="mr-2 h-4 w-4" />
                Extract
              </Button>
            </>
          )}
          {isProcessing && (
            <Button variant="outline" onClick={handleClose} disabled>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Extracting...
            </Button>
          )}
          {status === "completed" && (
            <Button onClick={handleClose}>
              Done
            </Button>
          )}
          {status === "error" && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Close
              </Button>
              <Button onClick={handleExtract}>
                <Archive className="mr-2 h-4 w-4" />
                Retry
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
