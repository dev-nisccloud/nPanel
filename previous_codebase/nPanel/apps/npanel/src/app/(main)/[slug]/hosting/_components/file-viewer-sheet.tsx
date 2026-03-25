"use client";

import * as React from "react";
import { File, X, Download, Copy, Check, Edit, Save, XCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/npanel-ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { trpc } from "@/utils/trpc";
import { FileManagerItem } from "./file-manager-schema";
import { hostingDetailSchema } from "./hosting-detail-schema";

interface FileViewerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: FileManagerItem;
  hostingData: z.infer<typeof hostingDetailSchema>;
}

// Determine if a file is viewable based on its extension
function isViewableFile(file: FileManagerItem): boolean {
  if (file.type !== "file") return false;

  const extension = file.extension?.toLowerCase() || "";

  // Text files
  const textExtensions = ['txt', 'md', 'log', 'csv', 'readme', 'license'];

  // Code files
  const codeExtensions = [
    'js', 'jsx', 'ts', 'tsx', 'json', 'xml', 'html', 'htm', 'css', 'scss', 'sass', 'less',
    'php', 'py', 'java', 'cpp', 'c', 'h', 'hpp', 'go', 'rs', 'rb', 'swift', 'kt', 'scala',
    'sh', 'bash', 'zsh', 'fish', 'ps1', 'bat', 'cmd',
    'yaml', 'yml', 'toml', 'ini', 'conf', 'config', 'env', 'gitignore', 'dockerfile',
    'sql', 'graphql', 'gql', 'vue', 'svelte', 'astro',
    'r', 'm', 'pl', 'pm', 'lua', 'vim', 'clj', 'hs', 'elm', 'ex', 'exs',
  ];

  // Config files
  const configExtensions = ['config', 'conf', 'ini', 'env', 'properties', 'cfg'];

  return textExtensions.includes(extension) ||
    codeExtensions.includes(extension) ||
    configExtensions.includes(extension);
}

// Get language for syntax highlighting (if we add it later)
function getLanguageFromExtension(extension: string | undefined): string {
  if (!extension) return 'text';

  const ext = extension.toLowerCase();
  const languageMap: Record<string, string> = {
    'js': 'javascript',
    'jsx': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    'py': 'python',
    'rb': 'ruby',
    'go': 'go',
    'rs': 'rust',
    'java': 'java',
    'cpp': 'cpp',
    'c': 'c',
    'php': 'php',
    'html': 'html',
    'css': 'css',
    'scss': 'scss',
    'json': 'json',
    'xml': 'xml',
    'yaml': 'yaml',
    'yml': 'yaml',
    'sh': 'bash',
    'bash': 'bash',
    'sql': 'sql',
    'md': 'markdown',
  };

  return languageMap[ext] || 'text';
}

export function FileViewerSheet({
  open,
  onOpenChange,
  file,
  hostingData
}: FileViewerSheetProps) {
  const [fileContent, setFileContent] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  // Edit mode state
  const [isEditMode, setIsEditMode] = React.useState(false);
  const [originalContent, setOriginalContent] = React.useState<string | null>(null);
  const [editedContent, setEditedContent] = React.useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = React.useState(false);
  const [pendingClose, setPendingClose] = React.useState(false);

  const formatFileSize = (bytes: number | undefined) => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

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
      host: process.env.VITE_PUBLIC_FTP_HOST || "orion.nisccloud.com",
      port: parseInt(process.env.VITE_PUBLIC_FTP_PORT || "21"),
      user: String(ftpLogin),
      password: String(ftpPassword),
      secure: true,
      timeout: 30000,
    };
  };

  // Read file content mutation
  const readFile = trpc.plesk.ftp.readFile.useMutation({
    onSuccess: (data) => {
      setFileContent(data.content);
      setOriginalContent(data.content);
      setEditedContent(data.content);
      setHasUnsavedChanges(false);
      setIsLoading(false);
    },
    onError: (error) => {
      console.error('Error reading file:', error);
      toast.error("Failed to load file", {
        description: error.message || "Please try again."
      });
      setIsLoading(false);
      setFileContent(null);
      setOriginalContent(null);
      setEditedContent(null);
    },
  });

  // Upload file mutation (for saving edited content)
  const uploadFile = trpc.plesk.ftp.uploadFile.useMutation({
    onSuccess: () => {
      // Update original content to match edited content
      setOriginalContent(editedContent);
      setFileContent(editedContent);
      setHasUnsavedChanges(false);
      setIsSaving(false);
      setIsEditMode(false);
      toast.success("File saved successfully");
    },
    onError: (error) => {
      console.error('Error saving file:', error);
      toast.error("Failed to save file", {
        description: error.message || "Please try again."
      });
      setIsSaving(false);
    },
  });

  // Load file content when sheet opens
  React.useEffect(() => {
    if (open && file && isViewableFile(file)) {
      setIsLoading(true);
      setFileContent(null);
      setOriginalContent(null);
      setEditedContent(null);
      setHasUnsavedChanges(false);
      setIsEditMode(false);

      const credentials = getFtpCredentials();
      readFile.mutate({
        credentials,
        remotePath: file.path,
        maxSize: 5 * 1024 * 1024, // 5MB limit
      });
    } else if (!open) {
      // Reset when sheet closes
      setFileContent(null);
      setOriginalContent(null);
      setEditedContent(null);
      setHasUnsavedChanges(false);
      setIsEditMode(false);
      setIsLoading(false);
      setPendingClose(false);
      setShowUnsavedDialog(false);
    }
  }, [open, file]);

  // Track changes in edit mode
  React.useEffect(() => {
    if (isEditMode && editedContent !== null && originalContent !== null) {
      setHasUnsavedChanges(editedContent !== originalContent);
    }
  }, [editedContent, originalContent, isEditMode]);

  // Handle content change in edit mode
  const handleContentChange = (value: string) => {
    setEditedContent(value);
  };

  // Handle edit mode toggle
  const handleEditToggle = () => {
    if (isEditMode) {
      // Exiting edit mode - check for unsaved changes
      if (hasUnsavedChanges) {
        setShowUnsavedDialog(true);
      } else {
        setIsEditMode(false);
        setEditedContent(originalContent);
      }
    } else {
      // Entering edit mode
      setIsEditMode(true);
      setEditedContent(fileContent);
    }
  };

  // Handle save
  const handleSave = async () => {
    if (!editedContent || !file) return;

    setIsSaving(true);

    try {
      const credentials = getFtpCredentials();

      // Convert text content to base64 (browser-compatible)
      // Use btoa for browser environment, or Buffer if available
      let base64Content: string;
      if (typeof window !== 'undefined' && typeof btoa !== 'undefined') {
        // Browser environment - use btoa
        base64Content = btoa(unescape(encodeURIComponent(editedContent)));
      } else if (typeof Buffer !== 'undefined') {
        // Node.js environment
        base64Content = Buffer.from(editedContent, 'utf-8').toString('base64');
      } else {
        throw new Error('Unable to encode content to base64');
      }

      // Get parent directory path
      const pathParts = file.path.split('/');
      pathParts.pop(); // Remove filename
      const parentPath = pathParts.join('/') || '/';

      await uploadFile.mutateAsync({
        credentials,
        fileData: base64Content,
        fileName: file.name,
        remotePath: parentPath,
      });
    } catch (error) {
      // Error is already handled in mutation onError
      console.error('Save error:', error);
      setIsSaving(false);
    }
  };

  // Handle cancel (revert changes)
  const handleCancel = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedDialog(true);
    } else {
      setIsEditMode(false);
      setEditedContent(originalContent);
    }
  };

  // Handle discard changes
  const handleDiscardChanges = () => {
    setEditedContent(originalContent);
    setHasUnsavedChanges(false);
    setIsEditMode(false);
    setShowUnsavedDialog(false);
    if (pendingClose) {
      onOpenChange(false);
      setPendingClose(false);
    }
  };

  // Handle close with unsaved changes check
  const handleClose = (shouldClose: boolean) => {
    if (shouldClose) {
      if (hasUnsavedChanges && isEditMode) {
        setPendingClose(true);
        setShowUnsavedDialog(true);
      } else {
        onOpenChange(false);
      }
    }
  };

  // Keyboard shortcuts
  React.useEffect(() => {
    if (!isEditMode || !open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S or Cmd+S to save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (!isSaving && hasUnsavedChanges) {
          handleSave();
        }
      }
      // Esc to cancel
      if (e.key === 'Escape' && !showUnsavedDialog) {
        handleCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditMode, open, hasUnsavedChanges, isSaving, showUnsavedDialog]);

  const handleCopy = () => {
    if (fileContent) {
      navigator.clipboard.writeText(fileContent).then(() => {
        setCopied(true);
        toast.success("File content copied to clipboard");
        setTimeout(() => setCopied(false), 2000);
      }).catch(() => {
        toast.error("Failed to copy to clipboard");
      });
    }
  };

  const handleDownload = () => {
    // Empty handler - download functionality can be implemented later
    toast.info("Download functionality will be implemented separately");
  };

  // Empty handlers for future features
  const handleFindReplace = () => {
    // Empty handler - find/replace functionality can be implemented later
    toast.info("Find & Replace will be implemented in a future update");
  };

  const handleFormatCode = () => {
    // Empty handler - code formatting can be implemented later
    toast.info("Code formatting will be implemented in a future update");
  };

  const handleGoToLine = () => {
    // Empty handler - go to line functionality can be implemented later
    toast.info("Go to Line will be implemented in a future update");
  };

  const language = getLanguageFromExtension(file.extension);

  return (
    <Sheet open={open} onOpenChange={(newOpen) => {
      if (!newOpen) {
        // Sheet is being closed
        handleClose(true);
      } else {
        onOpenChange(newOpen);
      }
    }}>
      <SheetContent
        className="sm:max-w-[90vw] lg:max-w-[85vw] xl:max-w-[80vw] w-full p-0"
        side="right"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <SheetHeader className="px-6 pt-6 pb-4 border-b">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <File className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <SheetTitle className="text-lg font-semibold truncate">
                    {file.name}
                  </SheetTitle>
                  <SheetDescription className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {file.extension?.toUpperCase() || "FILE"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </span>
                    {language !== 'text' && (
                      <Badge variant="secondary" className="text-xs">
                        {language}
                      </Badge>
                    )}
                  </SheetDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!isEditMode && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleCopy}
                      disabled={!fileContent || isLoading}
                      title="Copy to clipboard"
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleDownload}
                      disabled={isLoading}
                      title="Download file"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleEditToggle}
                      disabled={!fileContent || isLoading}
                      title="Edit file"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </>
                )}
                {isEditMode && (
                  <>
                    {hasUnsavedChanges && (
                      <Badge variant="outline" className="text-xs text-amber-600 border-amber-600">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Unsaved
                      </Badge>
                    )}
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleSave}
                      disabled={isSaving || !hasUnsavedChanges || !editedContent}
                      className="gap-2"
                    >
                      {isSaving ? (
                        <>
                          <Spinner size={14} />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          Save
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancel}
                      disabled={isSaving}
                      className="gap-2"
                    >
                      <XCircle className="h-4 w-4" />
                      Cancel
                    </Button>
                  </>
                )}
                <SheetClose asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.preventDefault();
                      handleClose(true);
                    }}
                    disabled={isSaving}
                    title="Close"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </SheetClose>
              </div>
            </div>
          </SheetHeader>

          {/* Content */}
          {/* Content */}
          {/* Content */}
          <div className="flex-1 overflow-hidden relative flex flex-col min-h-0">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Spinner size={32} className="mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">Loading file content...</p>
                </div>
              </div>
            ) : fileContent === null ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <File className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-sm text-muted-foreground">Unable to display file content</p>
                </div>
              </div>
            ) : isEditMode ? (
              <>
                <div className="flex-1 min-h-0 relative w-full">
                  <div className="h-full p-6">
                    <Textarea
                      value={editedContent || ''}
                      onChange={(e) => handleContentChange(e.target.value)}
                      className="w-full h-full font-mono text-sm resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-muted/50 rounded-lg p-4"
                      placeholder="File content will appear here..."
                      disabled={isSaving}
                      spellCheck={false}
                    />
                  </div>
                </div>
                {hasUnsavedChanges && (
                  <div className="border-t px-6 py-4 bg-background z-10 shrink-0">
                    <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-900/50">
                      <div className="flex items-center gap-2 text-sm text-amber-800 dark:text-amber-200">
                        <AlertCircle className="h-4 w-4" />
                        <span>You have unsaved changes.</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground hidden sm:inline">Press Ctrl+S to save</span>
                        <Button size="sm" variant="ghost" onClick={handleDiscardChanges} className="h-7 text-xs hover:bg-amber-100 dark:hover:bg-amber-900/40">Discard</Button>
                        <Button size="sm" onClick={handleSave} disabled={isSaving} className="h-7 text-xs">Save</Button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <ScrollArea className="h-full">
                <div className="p-6">
                  <pre className="text-sm font-mono bg-muted/50 rounded-lg p-4 overflow-x-auto whitespace-pre-wrap break-words">
                    <code>{fileContent}</code>
                  </pre>
                </div>
              </ScrollArea>
            )}
          </div>
        </div>

        {/* Unsaved Changes Dialog */}
        <AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
              <AlertDialogDescription>
                You have unsaved changes to this file. What would you like to do?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => {
                setShowUnsavedDialog(false);
                setPendingClose(false);
              }}>
                Keep Editing
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDiscardChanges}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Discard Changes
              </AlertDialogAction>
              <AlertDialogAction
                onClick={async () => {
                  setShowUnsavedDialog(false);
                  await handleSave();
                  if (pendingClose) {
                    onOpenChange(false);
                    setPendingClose(false);
                  }
                }}
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save & Close"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SheetContent>
    </Sheet>
  );
}

// Export utility function to check if file is viewable
export { isViewableFile };
