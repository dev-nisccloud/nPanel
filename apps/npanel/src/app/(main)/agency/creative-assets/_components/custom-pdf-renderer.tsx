"use client";

import * as React from "react";
import { Worker, Viewer, ScrollMode } from "@react-pdf-viewer/core";
import "@react-pdf-viewer/core/lib/styles/index.css";
import type { DocRenderer } from "@cyntler/react-doc-viewer";

/**
 * Custom PDF renderer using @react-pdf-viewer/core
 * This provides a clean, header-free PDF viewer without the header bar issues
 */
export const CustomPDFRenderer: DocRenderer = ({ mainState }) => {
  const { currentDocument } = mainState;

  if (!currentDocument) {
    return null;
  }

  // Get the PDF URL from fileData or uri
  // fileData can be a string (URL), Uint8Array, or the document URI
  let fileUrl: string | Uint8Array | null = null;

  if (currentDocument.fileData) {
    if (typeof currentDocument.fileData === "string") {
      fileUrl = currentDocument.fileData;
    } else if (currentDocument.fileData instanceof Uint8Array) {
      fileUrl = currentDocument.fileData;
    }
  } else if (currentDocument.uri) {
    fileUrl = currentDocument.uri;
  }

  if (!fileUrl) {
    return null;
  }

  return (
    <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
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
        />
      </div>
    </Worker>
  );
};

// Register file types for this renderer - higher weight means it takes priority
CustomPDFRenderer.fileTypes = ["pdf", "application/pdf"];
CustomPDFRenderer.weight = 10;

