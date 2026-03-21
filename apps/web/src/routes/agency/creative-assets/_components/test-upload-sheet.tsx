"use client";

import * as React from "react";
import { Upload, XIcon, FileText, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/npanel-ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UPLOAD_ENDPOINTS } from "@/lib/uploadthing";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { uploadFiles } from "@/hooks/use-uploadthing";

interface TestUploadSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface LogEntry {
  id: string;
  type: "info" | "success" | "error" | "warning";
  timestamp: Date;
  message: string;
  data?: any;
}

export function TestUploadSheet({ open, onOpenChange }: TestUploadSheetProps) {
  const [selectedEndpoint, setSelectedEndpoint] = React.useState<keyof typeof UPLOAD_ENDPOINTS>("CREATIVE_ASSET_VERSION");
  const [selectedFiles, setSelectedFiles] = React.useState<File[]>([]);
  const [logs, setLogs] = React.useState<LogEntry[]>([]);
  const [isUploading, setIsUploading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const endpointName = UPLOAD_ENDPOINTS[selectedEndpoint];

  // Clear logs when sheet opens
  React.useEffect(() => {
    if (open) {
      setLogs([]);
      setSelectedFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      addLog("info", "Test Upload Sheet Opened", { endpoint: endpointName });
    }
  }, [open, endpointName]);

  const addLog = (type: LogEntry["type"], message: string, data?: any) => {
    const logEntry: LogEntry = {
      id: `log-${Date.now()}-${Math.random()}`,
      type,
      timestamp: new Date(),
      message,
      data,
    };
    setLogs((prev) => [...prev, logEntry]);
    console.log(`[UploadThing Test] ${type.toUpperCase()}:`, message, data || "");
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(files);
    addLog("info", "Files Selected", { 
      count: files.length,
      files: files.map(f => ({ name: f.name, size: f.size, type: f.type }))
    });
  };

  const handleRemoveFile = (index: number) => {
    const removedFile = selectedFiles[index];
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    addLog("info", "File Removed", { file: removedFile.name });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error("Please select at least one file");
      return;
    }

    // Check endpoint file count limits
    const maxFileCount = endpointName === "creativeAssetVersion" ? 1 : 
                         endpointName === "imageUploader" ? 5 :
                         endpointName === "documentUploader" ? 5 : 10;
    
    if (selectedFiles.length > maxFileCount) {
      toast.error(`This endpoint only allows ${maxFileCount} file(s) at a time`);
      addLog("error", "File count exceeds limit", { 
        selected: selectedFiles.length, 
        max: maxFileCount 
      });
      return;
    }

    setIsUploading(true);
    
    try {
      const filesInfo = selectedFiles.map(f => ({ 
        name: f.name, 
        size: f.size, 
        type: f.type 
      }));
      
      addLog("info", "Starting Upload", { 
        endpoint: endpointName,
        fileCount: selectedFiles.length,
        files: filesInfo
      });
      
      console.log("=== STARTING UPLOAD ===");
      console.log("Endpoint:", endpointName);
      console.log("Files:", filesInfo);
      console.log("=== END UPLOAD START ===");

      const response = await uploadFiles(endpointName, {
        files: selectedFiles,
        onUploadBegin: () => {
          addLog("info", "Upload Begun");
          console.log("=== UPLOAD BEGUN ===");
        },
        onUploadProgress: (progress) => {
          // Progress structure: { file: File, progress: number (0-1 decimal), loaded: number, totalLoaded: number }
          let progressPercent = 0;
          
          if (typeof progress === "number") {
            // Already a percentage (0-100)
            progressPercent = Math.round(Math.min(100, Math.max(0, progress)));
          } else if (progress && typeof progress === "object") {
            // Check if progress.progress exists and is a decimal (0-1)
            if ("progress" in progress && typeof progress.progress === "number") {
              const progressValue = progress.progress;
              // If value is > 1, it's already a percentage; otherwise it's a decimal (0-1)
              if (progressValue > 1) {
                // Already a percentage, just clamp it
                progressPercent = Math.round(Math.min(100, Math.max(0, progressValue)));
              } else {
                // Decimal (0-1), convert to percentage
                progressPercent = Math.round(Math.min(100, Math.max(0, progressValue * 100)));
              }
            } else if ("loaded" in progress && "totalLoaded" in progress) {
              // Calculate from loaded/totalLoaded if progress.progress not available
              const loaded = Number(progress.loaded) || 0;
              const total = Number(progress.totalLoaded) || 1;
              progressPercent = Math.round(Math.min(100, Math.max(0, (loaded / total) * 100)));
            }
          }
          
          addLog("info", `Upload Progress: ${progressPercent}%`, { 
            progress: progressPercent,
            loaded: typeof progress === "object" && "loaded" in progress ? progress.loaded : undefined,
            total: typeof progress === "object" && "totalLoaded" in progress ? progress.totalLoaded : undefined,
            rawProgress: typeof progress === "object" && "progress" in progress ? progress.progress : progress
          });
          console.log("=== UPLOAD PROGRESS ===", {
            progressPercent,
            rawProgress: progress,
            progressValue: typeof progress === "object" && "progress" in progress ? progress.progress : progress
          });
        },
      });

      addLog("success", "Upload Completed Successfully", response);
      toast.success("File uploaded successfully!");
      
      console.log("=== UPLOAD COMPLETE - FULL RESPONSE ===");
      console.log(JSON.stringify(response, null, 2));
      console.log("=== END RESPONSE ===");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      addLog("error", "Upload Error", { error: errorMessage, fullError: error });
      toast.error("Upload failed", {
        description: errorMessage,
      });
      console.error("=== UPLOAD ERROR ===");
      console.error(error);
      console.error("=== END ERROR ===");
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto w-full sm:max-w-2xl">
        <SheetHeader className="mb-6 flex justify-between items-center flex-row">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-full">
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <div>
              <SheetTitle className="text-2xl font-bold">Test UploadThing</SheetTitle>
              <SheetDescription className="text-base">
                Test file uploads and view detailed logs
              </SheetDescription>
            </div>
          </div>
          <SheetClose asChild>
            <Button
              size="icon"
              variant="ghost"
              className="p-0 m-0 size-auto hover:bg-transparent"
            >
              <XIcon className="size-5" />
            </Button>
          </SheetClose>
        </SheetHeader>

        <div className="px-1 pb-1 space-y-6">
          {/* Endpoint Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Upload Configuration
              </CardTitle>
              <CardDescription>Select an upload endpoint to test</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Endpoint</label>
                <Select
                  value={selectedEndpoint}
                  onValueChange={(value) => {
                    setSelectedEndpoint(value as keyof typeof UPLOAD_ENDPOINTS);
                    addLog("info", "Endpoint changed", { 
                      endpoint: UPLOAD_ENDPOINTS[value as keyof typeof UPLOAD_ENDPOINTS] 
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(UPLOAD_ENDPOINTS).map(([key, value]) => (
                      <SelectItem key={key} value={key}>
                        {key.replace(/_/g, " ")} - {value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="rounded-lg border p-3 bg-muted/50">
                <p className="text-xs font-medium mb-1">Selected Endpoint:</p>
                <p className="text-sm font-mono">{endpointName}</p>
              </div>

            </CardContent>
          </Card>

          {/* File Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Select Files</CardTitle>
              <CardDescription>Choose files to upload</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Select Files
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileSelect}
                />
                {selectedFiles.length > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedFiles([]);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = "";
                      }
                    }}
                    disabled={isUploading}
                  >
                    Clear All
                  </Button>
                )}
              </div>

              {selectedFiles.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Selected Files ({selectedFiles.length}):</p>
                  <ScrollArea className="h-32 rounded-md border p-2">
                    <div className="space-y-2">
                      {selectedFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between rounded-lg border p-2 bg-muted/50"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{file.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(file.size)} • {file.type || "Unknown type"}
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 shrink-0"
                            onClick={() => handleRemoveFile(index)}
                            disabled={isUploading}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upload Button */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Upload</CardTitle>
              <CardDescription>Start the upload process</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleUpload}
                disabled={selectedFiles.length === 0 || isUploading}
                className="w-full"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Files
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Logs Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Upload Logs</CardTitle>
                  <CardDescription>Detailed logs of all upload operations</CardDescription>
                </div>
                {logs.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setLogs([]);
                      addLog("info", "Logs cleared");
                    }}
                  >
                    Clear Logs
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px] w-full rounded-md border p-4">
                {logs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-8">
                    <p className="text-sm text-muted-foreground">No logs yet</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Start an upload to see logs here
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {logs.map((log) => (
                      <div
                        key={log.id}
                        className="rounded-lg border p-3 space-y-1 bg-background"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                log.type === "success"
                                  ? "default"
                                  : log.type === "error"
                                  ? "destructive"
                                  : log.type === "warning"
                                  ? "secondary"
                                  : "outline"
                              }
                              className="text-xs"
                            >
                              {log.type.toUpperCase()}
                            </Badge>
                            <span className="text-sm font-medium">{log.message}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {log.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                        {log.data && (
                          <details className="mt-2">
                            <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                              View Data
                            </summary>
                            <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto max-h-60">
                              {JSON.stringify(log.data, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        <SheetFooter className="gap-2 sm:gap-0 mt-6">
          <SheetClose asChild>
            <Button type="button" variant="outline">
              Close
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

