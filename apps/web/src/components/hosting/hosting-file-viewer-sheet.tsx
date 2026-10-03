"use client";

import * as React from "react";
import {
  File,
  X,
  Download,
  Copy,
  Check,
  Save,
  AlertCircle,
  Eye,
  Pencil,
} from "lucide-react";
import { toast } from "@/components/ui/sonner";

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
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  FileCodeEditor,
  getMonacoLanguageFromExtension,
} from "@/components/hosting/file-code-editor";
import { putFtpFile, readFtpText } from "@/components/hosting/ftp-transfer";
import { trpc } from "@/utils/trpc";
import { useFtpErrorMessage } from "@/components/hosting/ftp-error-message";

export type HostingFileViewerFile = {
  name: string;
  path: string;
  type: string;
  size?: number;
  extension?: string;
};

export type HostingFtpCredentials = {
  host: string;
  port: number;
  user: string;
  password: string;
  secure: boolean;
  timeout: number;
};

function getExtension(file: HostingFileViewerFile): string {
  const fromField = file.extension?.toLowerCase().trim();
  if (fromField) return fromField;
  const dotIndex = file.name.lastIndexOf(".");
  if (dotIndex <= 0 || dotIndex === file.name.length - 1) return "";
  return file.name.slice(dotIndex + 1).toLowerCase();
}

export function isViewableHostingFile(file: HostingFileViewerFile): boolean {
  if (file.type !== "file") return false;

  const extension = getExtension(file);

  const textExtensions = ["txt", "md", "log", "csv", "readme", "license"];
  const codeExtensions = [
    "js",
    "jsx",
    "ts",
    "tsx",
    "json",
    "xml",
    "html",
    "htm",
    "css",
    "scss",
    "sass",
    "less",
    "php",
    "py",
    "java",
    "cpp",
    "c",
    "h",
    "hpp",
    "go",
    "rs",
    "rb",
    "swift",
    "kt",
    "scala",
    "sh",
    "bash",
    "zsh",
    "fish",
    "ps1",
    "bat",
    "cmd",
    "yaml",
    "yml",
    "toml",
    "ini",
    "conf",
    "config",
    "env",
    "gitignore",
    "dockerfile",
    "sql",
    "graphql",
    "gql",
    "vue",
    "svelte",
    "astro",
    "r",
    "m",
    "pl",
    "pm",
    "lua",
    "vim",
    "clj",
    "hs",
    "elm",
    "ex",
    "exs",
  ];
  const configExtensions = ["config", "conf", "ini", "env", "properties", "cfg"];

  return (
    textExtensions.includes(extension) ||
    codeExtensions.includes(extension) ||
    configExtensions.includes(extension)
  );
}

type HostingFileViewerSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: HostingFileViewerFile;
  getCredentials: () => HostingFtpCredentials;
};

export function HostingFileViewerSheet({
  open,
  onOpenChange,
  file,
  getCredentials,
}: HostingFileViewerSheetProps) {
  const ftpErrorText = useFtpErrorMessage();
  const ftpErrorTextRef = React.useRef(ftpErrorText);
  ftpErrorTextRef.current = ftpErrorText;
  const [fileContent, setFileContent] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [isEditMode, setIsEditMode] = React.useState(false);
  const [originalContent, setOriginalContent] = React.useState<string | null>(
    null,
  );
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
    return `${Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const readFile = trpc.plesk.ftp.readFile.useMutation();
  const uploadFile = trpc.plesk.ftp.uploadFile.useMutation();

  React.useEffect(() => {
    if (!(open && file && isViewableHostingFile(file))) {
      if (!open) {
        setFileContent(null);
        setOriginalContent(null);
        setEditedContent(null);
        setHasUnsavedChanges(false);
        setIsEditMode(false);
        setIsLoading(false);
        setPendingClose(false);
        setShowUnsavedDialog(false);
      }
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setFileContent(null);
    setOriginalContent(null);
    setEditedContent(null);
    setHasUnsavedChanges(false);
    setIsEditMode(false);

    void (async () => {
      try {
        const credentials = getCredentials();
        const prepared = await readFile.mutateAsync({
          credentials,
          remotePath: file.path,
          maxSize: 5 * 1024 * 1024,
        });
        const content = await readFtpText(prepared.url);
        if (cancelled) return;
        setFileContent(content);
        setOriginalContent(content);
        setEditedContent(content);
        setHasUnsavedChanges(false);
      } catch (error) {
        if (cancelled) return;
        console.error("Error reading file:", error);
        toast.error("Failed to load file", {
          description: ftpErrorTextRef.current(error),
        });
        setFileContent(null);
        setOriginalContent(null);
        setEditedContent(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // Intentionally only re-fetch when the sheet opens for a file
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, file?.path]);

  const switchToViewMode = React.useCallback(() => {
    if (hasUnsavedChanges) {
      setShowUnsavedDialog(true);
      return;
    }
    setIsEditMode(false);
    setEditedContent(originalContent);
  }, [hasUnsavedChanges, originalContent]);

  const switchToEditMode = React.useCallback(() => {
    if (!fileContent || isLoading || isSaving) return;
    setIsEditMode(true);
    setEditedContent(fileContent);
    setHasUnsavedChanges(false);
  }, [fileContent, isLoading, isSaving]);

  const handleModeChange = (value: string) => {
    if (!value) return;
    if (value === "edit") {
      switchToEditMode();
    } else {
      switchToViewMode();
    }
  };

  const handleContentChange = (value: string) => {
    setEditedContent(value);
    setHasUnsavedChanges(value !== originalContent);
  };

  const handleSave = async () => {
    if (editedContent === null || !file) return;

    setIsSaving(true);

    try {
      const credentials = getCredentials();
      const body = new Blob([editedContent], { type: "text/plain;charset=utf-8" });
      const pathParts = file.path.split("/");
      pathParts.pop();
      const parentPath = pathParts.join("/") || "/";

      const prepared = await uploadFile.mutateAsync({
        credentials,
        fileName: file.name,
        remotePath: parentPath,
        size: body.size,
      });
      await putFtpFile(prepared.url, body);
      setOriginalContent(editedContent);
      setFileContent(editedContent);
      setHasUnsavedChanges(false);
      setIsEditMode(false);
      toast.success("File saved successfully");
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save file", {
        description: ftpErrorTextRef.current(error),
      });
    } finally {
      setIsSaving(false);
    }
  };

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

  const handleClose = (shouldClose: boolean) => {
    if (!shouldClose) return;
    if (hasUnsavedChanges && isEditMode) {
      setPendingClose(true);
      setShowUnsavedDialog(true);
    } else {
      onOpenChange(false);
    }
  };

  React.useEffect(() => {
    if (!isEditMode || !open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (!isSaving && hasUnsavedChanges) {
          void handleSave();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isEditMode, open, hasUnsavedChanges, isSaving, editedContent]);

  const handleCopy = () => {
    const content = isEditMode ? editedContent : fileContent;
    if (!content) return;
    navigator.clipboard
      .writeText(content)
      .then(() => {
        setCopied(true);
        toast.success("File content copied to clipboard");
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {
        toast.error("Failed to copy to clipboard");
      });
  };

  const handleDownload = () => {
    const content = isEditMode ? editedContent : fileContent;
    if (content === null) return;

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = file.name;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const language = getMonacoLanguageFromExtension(getExtension(file));
  const editorValue = isEditMode
    ? (editedContent ?? "")
    : (fileContent ?? "");

  return (
    <Sheet
      open={open}
      onOpenChange={(newOpen) => {
        if (!newOpen) {
          handleClose(true);
        } else {
          onOpenChange(newOpen);
        }
      }}
    >
      <SheetContent size="editor" className="p-0" side="right">
        <div className="flex h-full flex-col">
          <SheetHeader className="border-b px-6 pb-4 pt-6">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <File className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <SheetTitle className="truncate">
                    {file.name}
                  </SheetTitle>
                  <SheetDescription className="mt-1 flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {getExtension(file).toUpperCase() || "FILE"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </span>
                    {language !== "plaintext" && (
                      <Badge variant="secondary" className="text-xs">
                        {language}
                      </Badge>
                    )}
                  </SheetDescription>
                </div>
              </div>

              <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                <ToggleGroup
                  type="single"
                  value={isEditMode ? "edit" : "view"}
                  onValueChange={handleModeChange}
                  variant="outline"
                  size="sm"
                  disabled={!fileContent || isLoading || isSaving}
                  className="border"
                >
                  <ToggleGroupItem
                    value="view"
                    aria-label="View mode"
                    className="gap-1.5 px-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:hover:bg-primary/90 data-[state=on]:hover:text-primary-foreground"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    View
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="edit"
                    aria-label="Edit mode"
                    className="gap-1.5 px-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:hover:bg-primary/90 data-[state=on]:hover:text-primary-foreground"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </ToggleGroupItem>
                </ToggleGroup>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  disabled={!fileContent || isLoading}
                  className="gap-1.5"
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-green-600" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  <span className="hidden sm:inline">Copy</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  disabled={!fileContent || isLoading}
                  className="gap-1.5"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Download</span>
                </Button>

                {isEditMode && (
                  <>
                    {hasUnsavedChanges && (
                      <Badge
                        variant="outline"
                        className="border-amber-600 text-xs text-amber-600"
                      >
                        <AlertCircle className="mr-1 h-3 w-3" />
                        Unsaved
                      </Badge>
                    )}
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => void handleSave()}
                      disabled={
                        isSaving || !hasUnsavedChanges || editedContent === null
                      }
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

          <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
            {isLoading ? (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <Spinner size={32} className="mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">
                    Loading file content...
                  </p>
                </div>
              </div>
            ) : fileContent === null ? (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <File className="mx-auto mb-4 h-12 w-12 text-muted-foreground opacity-50" />
                  <p className="text-sm text-muted-foreground">
                    Unable to display file content
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="relative min-h-0 w-full flex-1 p-4">
                  <FileCodeEditor
                    value={editorValue}
                    language={language}
                    readOnly={!isEditMode}
                    onChange={handleContentChange}
                    disabled={isSaving}
                  />
                </div>
                {isEditMode && hasUnsavedChanges && (
                  <div className="z-10 shrink-0 border-t bg-background px-6 py-3">
                    <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/50 dark:bg-amber-950/20">
                      <div className="flex items-center gap-2 text-sm text-amber-800 dark:text-amber-200">
                        <AlertCircle className="h-4 w-4" />
                        <span>You have unsaved changes.</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="hidden text-xs text-muted-foreground sm:inline">
                          Press Ctrl+S to save
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleDiscardChanges}
                          className="h-7 text-xs hover:bg-amber-100 dark:hover:bg-amber-900/40"
                        >
                          Discard
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => void handleSave()}
                          disabled={isSaving}
                          className="h-7 text-xs"
                        >
                          Save
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
              <AlertDialogDescription>
                You have unsaved changes to this file. What would you like to do?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                onClick={() => {
                  setShowUnsavedDialog(false);
                  setPendingClose(false);
                }}
              >
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
