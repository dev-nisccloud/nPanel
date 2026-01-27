"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import type { EditorRef } from "react-email-editor";
import { ArrowLeft, Eye, EyeOff, FileDown, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const EmailEditor = dynamic(
  () => import("react-email-editor").then((mod) => mod.default),
  { ssr: false }
);

export default function EmailBuilderPage() {
  const emailEditorRef = React.useRef<EditorRef>(null);
  const [preview, setPreview] = React.useState(false);
  const [isReady, setIsReady] = React.useState(false);

  const saveDesign = React.useCallback(() => {
    const unlayer = emailEditorRef.current?.editor;
    if (!unlayer) {
      toast.error("Editor is not ready yet.");
      return;
    }
    unlayer.saveDesign((design: unknown) => {
      console.log("saveDesign", design);
      toast.success("Design JSON saved. Check the browser console.");
    });
  }, []);

  const exportHtml = React.useCallback(() => {
    const unlayer = emailEditorRef.current?.editor;
    if (!unlayer) {
      toast.error("Editor is not ready yet.");
      return;
    }
    unlayer.exportHtml((data: { design: unknown; html: string }) => {
      const { design, html } = data;
      console.log("exportHtml", { design, html });
      toast.success("HTML exported. Check the browser console.");
    });
  }, []);

  const togglePreview = React.useCallback(() => {
    const unlayer = emailEditorRef.current?.editor;
    if (!unlayer) {
      toast.error("Editor is not ready yet.");
      return;
    }
    if (preview) {
      unlayer.hidePreview();
      setPreview(false);
    } else {
      unlayer.showPreview({ device: "desktop" });
      setPreview(true);
    }
  }, [preview]);

  const onReady = React.useCallback(() => {
    setIsReady(true);
  }, []);

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b bg-background px-4 py-3">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/agency/email-marketing" title="Back to Email Marketing">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">
              Email Builder
            </h1>
            <p className="text-xs text-muted-foreground">
              Drag-and-drop editor to design emails
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={togglePreview}
            disabled={!isReady}
          >
            {preview ? (
              <>
                <EyeOff className="mr-2 h-4 w-4" />
                Hide Preview
              </>
            ) : (
              <>
                <Eye className="mr-2 h-4 w-4" />
                Show Preview
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={saveDesign}
            disabled={!isReady}
          >
            <Save className="mr-2 h-4 w-4" />
            Save Design
          </Button>
          <Button size="sm" onClick={exportHtml} disabled={!isReady}>
            <FileDown className="mr-2 h-4 w-4" />
            Export HTML
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1">
        <EmailEditor
          ref={emailEditorRef}
          onReady={onReady}
          minHeight={560}
          options={{
            version: "latest",
            appearance: {
              theme: "modern_light",
            },
          }}
        />
      </div>
    </div>
  );
}
