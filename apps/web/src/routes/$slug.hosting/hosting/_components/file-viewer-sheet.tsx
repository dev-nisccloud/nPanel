"use client";

import { z } from "zod";
import {
  HostingFileViewerSheet,
  isViewableHostingFile,
} from "@/components/hosting/hosting-file-viewer-sheet";
import type { FileManagerItem } from "./file-manager-schema";
import { hostingDetailSchema } from "./hosting-detail-schema";

interface FileViewerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: FileManagerItem;
  hostingData: z.infer<typeof hostingDetailSchema>;
}

export function isViewableFile(file: FileManagerItem): boolean {
  return isViewableHostingFile(file);
}

export function FileViewerSheet({
  open,
  onOpenChange,
  file,
  hostingData,
}: FileViewerSheetProps) {
  return (
    <HostingFileViewerSheet
      open={open}
      onOpenChange={onOpenChange}
      file={file}
      getCredentials={() => {
    const ftpLogin = hostingData.hosting?.vrt_hst?.property?.find(
          (prop) => prop.name === "ftp_login",
    )?.value;
    const ftpPassword = hostingData.hosting?.vrt_hst?.property?.find(
          (prop) => prop.name === "ftp_password",
    )?.value;

    if (!ftpLogin || !ftpPassword) {
      throw new Error("FTP credentials not found in hosting data");
    }

    return {
      host: import.meta.env.VITE_PUBLIC_FTP_HOST || "orion.nisccloud.com",
          port: Number.parseInt(import.meta.env.VITE_PUBLIC_FTP_PORT || "21", 10),
      user: String(ftpLogin),
      password: String(ftpPassword),
      secure: true,
      timeout: 30000,
    };
      }}
    />
  );
}
