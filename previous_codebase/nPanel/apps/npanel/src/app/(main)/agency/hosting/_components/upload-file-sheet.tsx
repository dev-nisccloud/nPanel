"use client";

import * as React from "react";
import { Upload, XIcon, Plus, FileText, Image, Archive, File, CheckCircle2, AlertCircle, Trash2 } from "lucide-react";

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
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { Dropzone, DropzoneEmptyState, DropzoneContent } from "@/components/ui/shadcn-io/dropzone";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface UploadFileSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hostingData: any; // Will be typed properly later
  uploadFile: (file: File, remotePath: string) => Promise<void>;
  currentPath: string;
  isUploading: boolean;
  onSuccess?: () => void;
}

const getFileIcon = (file: File) => {
  const type = file.type;
  if (type.startsWith('image/')) return <Image className="h-5 w-5 text-blue-500" />;
  if (type.includes('pdf')) return <FileText className="h-5 w-5 text-red-500" />;
  if (type.includes('zip') || type.includes('rar')) return <Archive className="h-5 w-5 text-orange-500" />;
  return <File className="h-5 w-5 text-gray-500" />;
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

export function UploadFileSheet({ 
  open, 
  onOpenChange, 
  hostingData, 
  uploadFile, 
  currentPath, 
  isUploading, 
  onSuccess 
}: UploadFileSheetProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [files, setFiles] = React.useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = React.useState<Record<string, number>>({});
  const [uploadStatus, setUploadStatus] = React.useState<Record<string, 'pending' | 'uploading' | 'success' | 'error'>>({});

  const handleDrop = React.useCallback((acceptedFiles: File[], fileRejections: any[]) => {
    // Handle file rejections (size, type, etc.)
    if (fileRejections.length > 0) {
      fileRejections.forEach(rejection => {
        const { file, errors } = rejection;
        errors.forEach((error: any) => {
          if (error.code === 'file-too-large') {
            toast.error(`File "${file.name}" is too large`, {
              description: `Maximum file size is 50MB. Your file is ${formatFileSize(file.size)}.`
            });
          } else if (error.code === 'file-invalid-type') {
            toast.error(`File "${file.name}" has an unsupported format`, {
              description: "Please select images, PDFs, archives, or text files."
            });
          } else if (error.code === 'too-many-files') {
            toast.error("Too many files selected", {
              description: "Maximum 10 files can be uploaded at once."
            });
          } else {
            toast.error(`File "${file.name}" was rejected`, {
              description: error.message || "Please check the file and try again."
            });
          }
        });
      });
    }
    
    // Handle accepted files
    if (acceptedFiles.length > 0) {
      setFiles(prevFiles => [...prevFiles, ...acceptedFiles]);
      
      // Initialize status and progress for new files
      acceptedFiles.forEach(file => {
        setUploadStatus(prev => ({ ...prev, [file.name]: 'pending' }));
        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));
      });
      
      toast.success(`${acceptedFiles.length} file${acceptedFiles.length > 1 ? 's' : ''} selected`, {
        description: "Ready to upload to your hosting account."
      });
    }
  }, []);

  const removeFile = (fileName: string) => {
    setFiles(prev => prev.filter(file => file.name !== fileName));
    setUploadStatus(prev => {
      const newStatus = { ...prev };
      delete newStatus[fileName];
      return newStatus;
    });
    setUploadProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[fileName];
      return newProgress;
    });
  };

  const handleSubmit = async () => {
    if (files.length === 0) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Initialize all files as uploading
      const initialStatus = { ...uploadStatus };
      files.forEach(file => {
        initialStatus[file.name] = 'uploading';
      });
      setUploadStatus(initialStatus);

      // Upload each file
      for (const file of files) {
        try {
          setUploadStatus(prev => ({ ...prev, [file.name]: 'uploading' }));
          
          // Simulate progress for UI feedback
          for (let progress = 0; progress <= 90; progress += 10) {
            setUploadProgress(prev => ({ ...prev, [file.name]: progress }));
            await new Promise(resolve => setTimeout(resolve, 50));
          }
          
          // Upload the file
          await uploadFile(file, currentPath);
          
          // Complete progress
          setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
          setUploadStatus(prev => ({ ...prev, [file.name]: 'success' }));
          
        } catch (error) {
          console.error(`Error uploading ${file.name}:`, error);
          setUploadStatus(prev => ({ ...prev, [file.name]: 'error' }));
        }
      }
      
      // Wait a bit to show success state
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Reset form and close sheet
      setFiles([]);
      setUploadStatus({});
      setUploadProgress({});
      onOpenChange(false);
      onSuccess?.();
      
    } catch (error) {
      console.error("Error uploading files:", error);
      // Set all files to error state
      const errorStatus = { ...uploadStatus };
      files.forEach(file => {
        errorStatus[file.name] = 'error';
      });
      setUploadStatus(errorStatus);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFiles([]);
    setUploadStatus({});
    setUploadProgress({});
    onOpenChange(false);
  };

  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  const hasFiles = files.length > 0;
  const allUploaded = hasFiles && files.every(file => uploadStatus[file.name] === 'success');
  const hasErrors = hasFiles && files.some(file => uploadStatus[file.name] === 'error');

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader className="mb-6 flex justify-between items-center flex-row">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-full">
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <div>
              <SheetTitle className="text-2xl font-bold">Upload Files</SheetTitle>
              <SheetDescription className="text-base">
                Upload files to your hosting account
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

        <div className="px-1 pb-1">
          <div className="space-y-6">
            {/* Upload Area */}
            <Card className="border-dashed border-2 border-muted-foreground/25 hover:border-primary/50 transition-colors">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  File Upload
                </CardTitle>
                <CardDescription>
                  Drag and drop files or click to browse. Supports images, documents, and archives.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Dropzone
                  onDrop={handleDrop}
                  accept={{
                    'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'],
                    'text/*': ['.txt', '.html', '.css', '.js', '.json', '.xml', '.md'],
                    'application/pdf': ['.pdf'],
                    'application/zip': ['.zip'],
                    'application/x-rar-compressed': ['.rar'],
                    'application/x-7z-compressed': ['.7z'],
                  }}
                  maxSize={50 * 1024 * 1024} // 50MB
                  maxFiles={10}
                  src={[]} // Always empty to show empty state
                  className="transition-all duration-200 border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 hover:bg-primary/5"
                >
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="mb-3 p-3 bg-primary/10 rounded-full">
                      <Upload className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-base font-semibold">Click to select files</h3>
                  </div>
                </Dropzone>
              </CardContent>
            </Card>

            {/* Upload Summary */}
            {hasFiles ? (
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Upload Summary
                    </CardTitle>
                    <Badge variant="outline" className="text-xs">
                      {files.length} file{files.length !== 1 ? 's' : ''} • {formatFileSize(totalSize)}
                    </Badge>
                  </div>
                  <CardDescription>
                    Files ready to upload to your hosting account
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {files.map((file, index) => {
                      const status = uploadStatus[file.name] || 'pending';
                      const progress = uploadProgress[file.name] || 0;
                      
                      return (
                        <div 
                          key={index} 
                          className={cn(
                            "flex items-center justify-between p-3 rounded-lg border transition-all duration-200",
                            status === 'success' && "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800",
                            status === 'error' && "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800",
                            status === 'uploading' && "bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800",
                            status === 'pending' && "bg-muted/50 border-muted"
                          )}
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {getFileIcon(file)}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium truncate" title={file.name}>
                                  {file.name}
                                </span>
                                {status === 'success' && <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />}
                                {status === 'error' && <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {formatFileSize(file.size)}
                              </div>
                              {status === 'uploading' && (
                                <Progress value={progress} className="mt-2 h-1" />
                              )}
                            </div>
                          </div>
                          
                          {status === 'pending' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFile(file.name)}
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Upload Status Summary */}
                  {isSubmitting && (
                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
                        <Spinner variant="ellipsis" size="sm" />
                        <span>Uploading files to your hosting account...</span>
                      </div>
                    </div>
                  )}
                  
                  {allUploaded && !isSubmitting && (
                    <div className="mt-4 p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                      <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-300">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>All files uploaded successfully!</span>
                      </div>
                    </div>
                  )}
                  
                  {hasErrors && !isSubmitting && (
                    <div className="mt-4 p-3 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
                      <div className="flex items-center gap-2 text-sm text-red-700 dark:text-red-300">
                        <AlertCircle className="h-4 w-4" />
                        <span>Some files failed to upload. Please try again.</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="border-dashed border-2 border-muted-foreground/25">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="mb-4 p-3 bg-muted/50 rounded-full">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No files selected</h3>
                  <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                    Drag and drop files into the upload area above, or click to browse your computer.
                  </p>
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline">Images</Badge>
                    <Badge variant="outline">PDFs</Badge>
                    <Badge variant="outline">Archives</Badge>
                    <Badge variant="outline">Text files</Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Upload Guidelines */}
            <Card className="bg-muted/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Upload Guidelines</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Maximum file size: <strong>50MB per file</strong></li>
                  <li>• Maximum files: 10 files per upload</li>
                  <li>• Supported formats: Images, PDFs, Archives, Text files</li>
                  <li>• Files will be uploaded to the current directory</li>
                  <li>• Large files may take longer to upload</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <SheetFooter className="flex gap-2 mt-6">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={handleSubmit}
              disabled={isSubmitting || !hasFiles || allUploaded}
              className="min-w-[120px]"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <Spinner variant="ellipsis" className="text-primary-foreground" size="sm" />
                  <span>Uploading...</span>
                </div>
              ) : allUploaded ? (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Complete</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  <span>Upload Files</span>
                </div>
              )}
            </Button>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  );
}
