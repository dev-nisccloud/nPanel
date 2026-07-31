"use client";

import { useEffect, useRef } from "react";
import Editor, { loader, type OnMount } from "@monaco-editor/react";
import { useTheme } from "@/components/theme-provider";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { cn } from "@/lib/utils";
import type { FileCodeEditorProps } from "./file-code-editor.types";

// Pin CDN build so every client loads the same Monaco revision (cached after first open)
loader.config({
  paths: {
    vs: "https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs",
  },
});

type MonacoEditorLike = {
  layout: () => void;
  updateOptions: (options: Record<string, unknown>) => void;
};

export default function FileCodeEditorInner({
  value,
  language = "plaintext",
  readOnly = false,
  onChange,
  className,
  disabled = false,
}: FileCodeEditorProps) {
  const { resolvedTheme } = useTheme();
  const theme = resolvedTheme === "dark" ? "vs-dark" : "light";
  const editorRef = useRef<MonacoEditorLike | null>(null);
  const isEditable = !readOnly && !disabled;

  const handleMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    // Hosting file edits don't need TS/JS language-service diagnostics
    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: true,
      noSyntaxValidation: true,
      noSuggestionDiagnostics: true,
    });
    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: true,
      noSyntaxValidation: true,
      noSuggestionDiagnostics: true,
    });

    editor.layout();
  };

  useEffect(() => {
    editorRef.current?.updateOptions({
      readOnly: !isEditable,
      renderLineHighlight: isEditable ? "line" : "none",
      quickSuggestions: isEditable,
      parameterHints: { enabled: isEditable },
      hover: { enabled: isEditable },
      contextmenu: isEditable,
    });
  }, [isEditable]);

  return (
    <div
      className={cn(
        "h-full w-full overflow-hidden rounded-lg border bg-muted/30",
        className,
      )}
    >
      <Editor
        height="100%"
        language={language}
        theme={theme}
        value={value}
        onChange={(next) => {
          if (isEditable && onChange) {
            onChange(next ?? "");
          }
        }}
        onMount={handleMount}
        keepCurrentModel
        loading={
          <div className="flex h-full items-center justify-center">
            <Spinner size={24} />
          </div>
        }
        options={{
          readOnly: !isEditable,
          minimap: { enabled: false },
          smoothScrolling: false,
          cursorBlinking: "blink",
          bracketPairColorization: { enabled: false },
          guides: { indentation: false, bracketPairs: false },
          matchBrackets: "near",
          renderLineHighlight: isEditable ? "line" : "none",
          renderValidationDecorations: "off",
          occurrencesHighlight: false,
          selectionHighlight: false,
          links: false,
          colorDecorators: false,
          codeLens: false,
          folding: true,
          foldingHighlight: false,
          showFoldingControls: "mouseover",
          overviewRulerLanes: 0,
          overviewRulerBorder: false,
          hideCursorInOverviewRuler: true,
          fontSize: 13,
          fontFamily:
            "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
          lineNumbers: "on",
          lineNumbersMinChars: 3,
          glyphMargin: false,
          scrollBeyondLastLine: false,
          wordWrap: "on",
          automaticLayout: true,
          tabSize: 2,
          padding: { top: 12, bottom: 12 },
          scrollbar: {
            verticalScrollbarSize: 10,
            horizontalScrollbarSize: 10,
            useShadows: false,
            alwaysConsumeMouseWheel: false,
          },
          find: {
            addExtraSpaceOnTop: false,
            autoFindInSelection: "never",
          },
          quickSuggestions: isEditable,
          parameterHints: { enabled: isEditable },
          hover: { enabled: isEditable },
          contextmenu: isEditable,
          unicodeHighlight: {
            ambiguousCharacters: false,
          },
          suggest: {
            showWords: false,
          },
        }}
      />
    </div>
  );
}
