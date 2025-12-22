"use client";

import * as React from "react";
import { Spinner } from "@/components/ui/shadcn-io/spinner";

interface MSOfficeRendererProps {
  fileUrl: string;
  fileName?: string;
}

/**
 * MS Office renderer using Microsoft Office Online Viewer
 * Supports: Word (.doc, .docx), Excel (.xls, .xlsx), PowerPoint (.ppt, .pptx)
 */
export function MSOfficeRenderer({ fileUrl, fileName }: MSOfficeRendererProps) {
  const iframeRef = React.useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [hasError, setHasError] = React.useState(false);

  // Encode the file URL for use in Office Online Viewer
  const viewerUrl = React.useMemo(() => {
    try {
      return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`;
    } catch {
      return null;
    }
  }, [fileUrl]);

  React.useEffect(() => {
    setIsLoading(true);
    setHasError(false);
  }, [fileUrl]);

  const handleLoad = React.useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleError = React.useCallback(() => {
    setIsLoading(false);
    setHasError(true);
  }, []);

  if (!viewerUrl) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-muted">
        <div className="text-center space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            Invalid file URL
          </p>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-muted">
        <div className="text-center space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            Unable to load document
          </p>
          <p className="text-xs text-muted-foreground">
            The document may be unavailable or access may be restricted
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-white">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
          <div className="text-center space-y-2">
            <Spinner size={32} className="mx-auto text-primary" />
            <p className="text-sm text-muted-foreground">
              Loading {fileName || "document"}...
            </p>
          </div>
        </div>
      )}
      <iframe
        ref={iframeRef}
        title={fileName ? `Preview of ${fileName}` : "Office document preview"}
        src={viewerUrl}
        className="w-full h-full border-0"
        onLoad={handleLoad}
        onError={handleError}
        allow="fullscreen"
        loading="lazy"
      />
    </div>
  );
}

// MIME types supported by MS Office Online Viewer
export const MS_OFFICE_MIME_TYPES = [
  // Word documents
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  // Excel documents
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
  // PowerPoint documents
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
] as const;

