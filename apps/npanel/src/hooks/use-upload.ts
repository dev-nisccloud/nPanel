"use client";

import { useState } from "react";

interface UploadFileParams {
  file: File;
  path: string[];
  bucket: string;
}

interface UploadResult {
  url: string;
}

export function useUpload() {
  const [isLoading, setIsLoading] = useState(false);

  const uploadFile = async ({ file, path, bucket }: UploadFileParams): Promise<UploadResult> => {
    setIsLoading(true);
    
    try {
      // Simulate file upload delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create a local object URL for the file
      const url = URL.createObjectURL(file);
      
      // For now, we'll return the local object URL
      // In the future, you can replace this with actual server upload logic
      console.log("File uploaded locally:", {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        path,
        bucket,
        url
      });
      
      return { url };
    } catch (error) {
      console.error("Upload failed:", error);
      throw new Error("Upload failed");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    uploadFile,
    isLoading,
  };
}
