"use client";

import * as React from "react";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { cn } from "@/lib/utils";
import type { FileCodeEditorProps } from "./file-code-editor.types";

export { getMonacoLanguageFromExtension } from "./file-code-editor-language";
export type { FileCodeEditorProps };

const LazyFileCodeEditor = React.lazy(
  () => import("./file-code-editor.inner"),
);

/** Monaco editor for hosting file manager — lazy-loaded to keep SSR/bundles clean. */
export function FileCodeEditor(props: FileCodeEditorProps) {
  return (
    <React.Suspense
      fallback={
        <div
          className={cn(
            "flex h-full w-full items-center justify-center rounded-lg border bg-muted/30",
            props.className,
          )}
        >
          <Spinner size={24} />
        </div>
      }
    >
      <LazyFileCodeEditor {...props} />
    </React.Suspense>
  );
}
