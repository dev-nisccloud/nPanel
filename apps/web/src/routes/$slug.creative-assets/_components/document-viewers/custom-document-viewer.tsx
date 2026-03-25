"use client";

import * as React from "react";
import { PDFRenderer, PDF_MIME_TYPE } from "./pdf-renderer";
import { MSOfficeRenderer, MS_OFFICE_MIME_TYPES } from "./ms-office-renderer";
import { ImageRenderer, IMAGE_MIME_TYPES } from "./image-renderer";
import { VideoRenderer, VIDEO_MIME_TYPES } from "./video-renderer";

interface CustomDocumentViewerProps {
  fileUrl: string;
  fileName?: string;
  mimeType: string;
}

/**
 * Custom Document Viewer Component
 * 
 * Intelligently renders different document types:
 * - PDF: Uses @react-pdf-viewer/core
 * - MS Office (Word, Excel, PowerPoint): Uses Office Online Viewer
 * - Images: Custom image renderer with zoom support
 * - Videos: Custom video player with controls
 * - Other: Shows unsupported message
 */
export function CustomDocumentViewer({
  fileUrl,
  fileName,
  mimeType,
}: CustomDocumentViewerProps) {
  const renderer = React.useMemo(() => {
    // PDF
    if (mimeType === PDF_MIME_TYPE) {
      return (
        <PDFRenderer 
          fileUrl={fileUrl} 
          fileName={fileName}
        />
      );
    }

    // MS Office Documents (Word, Excel, PowerPoint)
    if (MS_OFFICE_MIME_TYPES.includes(mimeType as typeof MS_OFFICE_MIME_TYPES[number])) {
      return (
        <MSOfficeRenderer 
          fileUrl={fileUrl} 
          fileName={fileName}
        />
      );
    }

    // Images
    if (IMAGE_MIME_TYPES.includes(mimeType as typeof IMAGE_MIME_TYPES[number])) {
      return (
        <ImageRenderer 
          fileUrl={fileUrl} 
          fileName={fileName}
          mimeType={mimeType}
        />
      );
    }

    // Videos
    if (VIDEO_MIME_TYPES.includes(mimeType as typeof VIDEO_MIME_TYPES[number])) {
      return (
        <VideoRenderer 
          fileUrl={fileUrl} 
          fileName={fileName}
          mimeType={mimeType}
        />
      );
    }

    // Unsupported file type
    return (
      <div className="flex items-center justify-center w-full h-full bg-muted">
        <div className="text-center space-y-2 max-w-md px-4">
          <p className="text-sm font-medium text-muted-foreground">
            Preview not available
          </p>
          <p className="text-xs text-muted-foreground">
            This file type ({mimeType}) is not supported for preview.
          </p>
          <p className="text-xs text-muted-foreground">
            Please download the file to view it.
          </p>
        </div>
      </div>
    );
  }, [fileUrl, fileName, mimeType]);

  return (
    <div className="w-full h-full">
      {renderer}
    </div>
  );
}

