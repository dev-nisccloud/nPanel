"use client";

import * as React from "react";
import { Worker, Viewer, ScrollMode } from "@react-pdf-viewer/core";
import "@react-pdf-viewer/core/lib/styles/index.css";
import { Spinner } from "@/components/ui/shadcn-io/spinner";

interface PDFRendererProps {
  fileUrl: string;
  fileName?: string;
}

/**
 * PDF renderer using @react-pdf-viewer/core
 * Provides clean, header-free PDF viewing with vertical scrolling
 */
export function PDFRenderer({ fileUrl, fileName }: PDFRendererProps) {
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    setIsLoading(true);
  }, [fileUrl]);

  const handleDocumentLoad = React.useCallback(() => {
    setIsLoading(false);
  }, []);

  return (
    <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
      <div
        className="w-full h-full relative"
        style={{
          height: "100%",
          width: "100%",
        }}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
            <div className="text-center space-y-2">
              <Spinner size={32} className="mx-auto text-primary" />
              <p className="text-sm text-muted-foreground">
                Loading {fileName || "PDF"}...
              </p>
            </div>
          </div>
        )}
        <div
          className="w-full h-full"
          style={{
            height: "100%",
            width: "100%",
            overflow: "auto"
          }}
        >
          <Viewer
            fileUrl={fileUrl}
            defaultScale={1.0}
            scrollMode={ScrollMode.Vertical}
            onDocumentLoad={handleDocumentLoad}
          />
        </div>
      </div>
    </Worker>
  );
}

// PDF MIME type
export const PDF_MIME_TYPE = "application/pdf" as const;

