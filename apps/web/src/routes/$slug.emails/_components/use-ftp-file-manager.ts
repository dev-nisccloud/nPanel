import { useEffect, useState, useMemo } from "react";
import { TRPCClientError } from "@trpc/client";
import { toast } from "@/components/ui/sonner";
import { z } from "zod";

import { trpc } from "@/utils/trpc";

import { fileManagerItemSchema, fileManagerSchema } from "./file-manager-schema";

// FTP Credentials Schema (matches the tRPC input)
const ftpCredentialsSchema = z.object({
  host: z.string().min(1, "Host is required"),
  port: z.number().min(1).max(65535).default(21),
  user: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  secure: z.boolean().default(true),
  timeout: z.number().min(1000).default(30000),
});

// Transformation function to map FTP API response to FileManagerItem schema
function transformFtpFileToManagerItem(
  ftpFile: {
    name: string;
    type: "file" | "directory";
    size?: number;
    date?: string;
    permissions?: string;
    owner?: string;
    group?: string;
  },
  currentPath: string
): z.infer<typeof fileManagerItemSchema> {
  const fullPath = currentPath === "/" ? `/${ftpFile.name}` : `${currentPath}/${ftpFile.name}`;
  
  // Extract file extension
  const extension = ftpFile.type === "file" ? 
    ftpFile.name.split('.').pop()?.toLowerCase() : 
    undefined;

  return {
    id: `${currentPath}-${ftpFile.name}`, // Unique ID based on path and name
    name: ftpFile.name,
    type: ftpFile.type === "directory" ? "folder" : "file",
    size: ftpFile.size,
    modified: ftpFile.date || new Date().toISOString(),
    permissions: ftpFile.permissions || "644",
    path: fullPath,
    extension,
    mimeType: undefined, // We'll determine this based on extension if needed
  };
}

// Generate breadcrumbs from current path
function generateBreadcrumbs(currentPath: string) {
  if (currentPath === "/") {
    return [{ name: "Root", path: "/" }];
  }

  const parts = currentPath.split("/").filter(part => part !== "");
  const breadcrumbs = [{ name: "Root", path: "/" }];
  
  let path = "";
  for (const part of parts) {
    path += `/${part}`;
    breadcrumbs.push({ name: part, path });
  }
  
  return breadcrumbs;
}

export function useFtpFileManager(
  ftpCredentials: z.infer<typeof ftpCredentialsSchema>,
  initialPath: string = "/"
) {
  const [currentPath, setCurrentPath] = useState(initialPath);
  const [isNavigating, setIsNavigating] = useState(false);
  const utils = trpc.useUtils();

  // Fetch files and directories for current path
  const { 
    data: ftpData, 
    isLoading, 
    isError, 
    error, 
    refetch 
  } = trpc.plesk.ftp.list.useQuery(
    {
      credentials: ftpCredentials,
      path: currentPath,
    },
    {
      staleTime: 0, // Always consider data stale to allow manual refetch
      gcTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      refetchOnMount: true, // Allow refetch on mount
      retry: (failureCount: number, err: any) => {
        // Retry only for specific recoverable errors, up to 3 times
        if (
          err instanceof TRPCClientError &&
          (err.data?.code === "INTERNAL_SERVER_ERROR") &&
          failureCount < 3
        ) {
          return true;
        }
        return false;
      },
      retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    }
  );

  // Handle errors
  useEffect(() => {
    if (isError) {
      if (error instanceof TRPCClientError) {
        switch (error.data?.code) {
          case "INTERNAL_SERVER_ERROR":
            toast.error("FTP Connection Error", {
              description: "Failed to connect to FTP server. Please check your credentials and try again.",
            });
            break;
          default:
            toast.error("FTP Error", {
              description: error.message || "An unexpected error occurred while accessing files.",
            });
        }
      } else {
        toast.error("FTP Error", {
          description: error.message || "An unexpected error occurred.",
        });
      }
    }
  }, [isError, error]);

  // Transform FTP data to FileManager format
  const fileManagerData: z.infer<typeof fileManagerSchema> | undefined = useMemo(() => {
    if (!ftpData?.success || !ftpData.data) {
      return undefined;
    }

    // Transform ALL files without filtering
    const items = ftpData.data.map((file: any) => 
      transformFtpFileToManagerItem(file, currentPath)
    );

    return {
      currentPath,
      items,
      breadcrumbs: generateBreadcrumbs(currentPath),
    };
  }, [ftpData, currentPath]);

  // Navigation functions
  const navigateToPath = async (newPath: string) => {
    if (newPath === currentPath) return;
    
    setIsNavigating(true);
    try {
      // Test if the path exists by trying to list it
      const result = await utils.plesk.ftp.list.fetch({
        credentials: ftpCredentials,
        path: newPath,
      });
      if (result.success) {
        setCurrentPath(newPath);
      }
    } catch (error) {
      toast.error("Navigation Error", {
        description: `Cannot access path: ${newPath}`,
      });
    } finally {
      setIsNavigating(false);
    }
  };

  const navigateUp = () => {
    if (currentPath === "/") return;
    
    const parentPath = currentPath.split("/").slice(0, -1).join("/") || "/";
    navigateToPath(parentPath);
  };

  const navigateToBreadcrumb = (path: string) => {
    navigateToPath(path);
  };

  const refreshCurrentPath = async () => {
    console.log("Refreshing current path:", currentPath);
    console.log("FTP credentials:", ftpCredentials);
    try {
      // Try manual invalidation first
      await utils.plesk.ftp.list.invalidate({
        credentials: ftpCredentials,
        path: currentPath,
      });
      console.log("Query invalidated successfully");
      
      // Then refetch
      const result = await refetch();
      console.log("Refetch result:", result);
    } catch (error) {
      console.error("Refetch error:", error);
    }
  };

  // FTP mutations for delete and rename operations
  const deleteFileMutation = trpc.plesk.ftp.deleteFile.useMutation({
    onSuccess: () => {
      toast.success("File deleted successfully");
      refetch(); // Refresh the current directory
    },
    onError: (error) => {
      toast.error("Failed to delete file", {
        description: error.message,
      });
    },
  });

  const deleteDirectoryMutation = trpc.plesk.ftp.deleteDirectory.useMutation({
    onSuccess: () => {
      toast.success("Directory deleted successfully");
      refetch(); // Refresh the current directory
    },
    onError: (error) => {
      toast.error("Failed to delete directory", {
        description: error.message,
      });
    },
  });

  const renameMutation = trpc.plesk.ftp.rename.useMutation({
    onSuccess: () => {
      toast.success("Item renamed successfully");
      refetch(); // Refresh the current directory
    },
    onError: (error) => {
      toast.error("Failed to rename item", {
        description: error.message,
      });
    },
  });

  const createDirectoryMutation = trpc.plesk.ftp.createDirectory.useMutation({
    onSuccess: () => {
      toast.success("Directory created successfully");
      refetch(); // Refresh the current directory
    },
    onError: (error) => {
      toast.error("Failed to create directory", {
        description: error.message,
      });
    },
  });

  const uploadFileMutation = trpc.plesk.ftp.uploadFile.useMutation({
    onSuccess: () => {
      toast.success("File uploaded successfully");
      refetch(); // Refresh the current directory
    },
    onError: (error) => {
      toast.error("Failed to upload file", {
        description: error.message,
      });
    },
  });

  // Helper functions for file operations
  const deleteItem = async (item: z.infer<typeof fileManagerItemSchema>) => {
    if (item.type === "folder") {
      await deleteDirectoryMutation.mutateAsync({
        credentials: ftpCredentials,
        path: item.path,
      });
    } else {
      await deleteFileMutation.mutateAsync({
        credentials: ftpCredentials,
        path: item.path,
      });
    }
  };

  const renameItem = async (oldPath: string, newPath: string) => {
    await renameMutation.mutateAsync({
      credentials: ftpCredentials,
      oldPath,
      newPath,
    });
  };

  const moveItem = async (oldPath: string, destinationPath: string) => {
    const fileName = oldPath.split('/').pop() || '';
    const newPath = destinationPath.endsWith('/') 
      ? `${destinationPath}${fileName}` 
      : `${destinationPath}/${fileName}`;
    
    await renameMutation.mutateAsync({
      credentials: ftpCredentials,
      oldPath,
      newPath,
    });
  };

  const createFolder = async (folderPath: string) => {
    await createDirectoryMutation.mutateAsync({
      credentials: ftpCredentials,
      path: folderPath,
    });
  };

  const uploadFile = async (file: File, remotePath: string) => {
    // Convert file to base64
    const fileData = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix (e.g., "data:image/png;base64,")
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    await uploadFileMutation.mutateAsync({
      credentials: ftpCredentials,
      fileData,
      fileName: file.name,
      remotePath,
    });
  };

  // Download mutations
  const downloadFileMutation = trpc.plesk.ftp.downloadFile.useMutation({
    onMutate: () => {
      toast.info("Starting file download...");
    },
    onSuccess: (data) => {
      // Trigger file download
      const buffer = Buffer.from(data.data.data);
      const blob = new Blob([buffer]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = data.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success("File downloaded successfully");
    },
    onError: (error) => {
      toast.error("Failed to download file", {
        description: error.message,
      });
    },
  });

  const downloadFolderMutation = trpc.plesk.ftp.downloadFolder.useMutation({
    onMutate: () => {
      toast.info("Starting folder download...", {
        description: "This may take a moment for large folders",
      });
    },
    onSuccess: (data) => {
      // Trigger zip download
      const buffer = Buffer.from(data.data.data);
      const blob = new Blob([buffer]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = data.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success("Folder downloaded successfully");
    },
    onError: (error) => {
      toast.error("Failed to download folder", {
        description: error.message,
      });
    },
  });

  // Download helper functions
  const downloadItem = async (item: z.infer<typeof fileManagerItemSchema>) => {
    if (item.type === "folder") {
      await downloadFolderMutation.mutateAsync({
        credentials: ftpCredentials,
        remotePath: item.path,
        folderName: item.name,
      });
    } else {
      await downloadFileMutation.mutateAsync({
        credentials: ftpCredentials,
        remotePath: item.path,
      });
    }
  };

  return {
    // Data
    data: fileManagerData,
    isLoading: isLoading || isNavigating,
    isError,
    error,
    
    // Navigation
    currentPath,
    navigateToPath,
    navigateUp,
    navigateToBreadcrumb,
    refreshCurrentPath,
    
    // File operations
    deleteItem,
    renameItem,
    moveItem,
    createFolder,
    uploadFile,
    downloadItem,
    isDeleting: deleteFileMutation.isPending || deleteDirectoryMutation.isPending,
    isRenaming: renameMutation.isPending,
    isMoving: renameMutation.isPending, // Same mutation is used for both rename and move
    isCreating: createDirectoryMutation.isPending,
    isUploading: uploadFileMutation.isPending,
    isDownloading: downloadFileMutation.isPending || downloadFolderMutation.isPending,
    
    // Raw data for debugging
    rawData: ftpData,
  };
}
