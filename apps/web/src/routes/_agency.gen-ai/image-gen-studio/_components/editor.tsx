"use client";

import * as fabric from "fabric";
import debounce from "lodash.debounce";
import { useCallback, useEffect, useRef, useState } from "react";

import type { ResponseType } from "../_api/use-get-project";
import { useUpdateProject } from "../_api/use-update-project";
import { useRemoveBg } from "../_api/use-remove-bg";

import type { ActiveTool } from "../_lib/types";
import { selectionDependentTools } from "../_lib/constants";
import { Navbar } from "./navbar";
import { Footer } from "./footer";
import { useEditor } from "../_hooks/use-editor";
import { Sidebar } from "./sidebar";
import { Toolbar } from "./toolbar";
import { ShapeSidebar } from "./shape-sidebar";
import { FillColorSidebar } from "./fill-color-sidebar";
import { StrokeColorSidebar } from "./stroke-color-sidebar";
import { StrokeWidthSidebar } from "./stroke-width-sidebar";
import { OpacitySidebar } from "./opacity-sidebar";
import { TextSidebar } from "./text-sidebar";
import { FontSidebar } from "./font-sidebar";
import { ImageSidebar } from "./image-sidebar";
import { UploadsSidebar } from "./uploads-sidebar";
import { FilterSidebar } from "./filter-sidebar";
import { DrawSidebar } from "./draw-sidebar";
import { AiSidebar } from "./ai-sidebar";
import { TemplateSidebar } from "./template-sidebar";
import { SettingsSidebar } from "./settings-sidebar";

interface EditorProps {
  initialData: NonNullable<ResponseType>;
}

export const Editor = ({ initialData }: EditorProps) => {
  const { mutate } = useUpdateProject();
  const removeBgMutation = useRemoveBg();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSave = useCallback(
    debounce(
      (values: { json: string; height: number; width: number }) => {
        mutate({ id: initialData.id, ...values });
      },
      500
    ),
    [mutate, initialData.id]
  );

  const [activeTool, setActiveTool] = useState<ActiveTool>("select");
  const [removeBgOverlayRect, setRemoveBgOverlayRect] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);

  const onClearSelection = useCallback(() => {
    if (selectionDependentTools.includes(activeTool)) {
      setActiveTool("select");
    }
  }, [activeTool]);

  const { init, editor } = useEditor({
    defaultState: initialData.json,
    defaultWidth: initialData.width,
    defaultHeight: initialData.height,
    clearSelectionCallback: onClearSelection,
    saveCallback: debouncedSave,
  });
  const handleRemoveBackground = useCallback(() => {
    if (!editor || removeBgMutation.isPending) return;

    const selectedObject = editor.selectedObjects[0] as any;
    const imageSrc = selectedObject?._originalElement?.currentSrc;

    if (!imageSrc) {
      return;
    }

    // Compute the on-canvas bounding box for the selected image
    const aCoords = selectedObject?.aCoords;
    if (aCoords?.tl && aCoords?.br) {
      const left = aCoords.tl.x;
      const top = aCoords.tl.y;
      const width = aCoords.br.x - aCoords.tl.x;
      const height = aCoords.br.y - aCoords.tl.y;
      setRemoveBgOverlayRect({ left, top, width, height });
    } else {
      setRemoveBgOverlayRect(null);
    }

    removeBgMutation.mutate(
      { image: imageSrc },
      {
        onSuccess: ({ data }) => {
          editor.addImage(data);
        },
        onSettled: () => {
          setRemoveBgOverlayRect(null);
        },
      }
    );
  }, [editor, removeBgMutation]);


  const onChangeActiveTool = useCallback((tool: ActiveTool) => {
    if (tool === "draw") {
      editor?.enableDrawingMode();
    }

    if (activeTool === "draw") {
      editor?.disableDrawingMode();
    }

    if (tool === activeTool) {
      return setActiveTool("select");
    }

    setActiveTool(tool);
  }, [activeTool, editor]);

  const canvasRef = useRef(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    // Ensure container has dimensions before initializing
    if (containerRef.current.offsetWidth === 0 || containerRef.current.offsetHeight === 0) {
      // Wait for next frame for container to have dimensions
      requestAnimationFrame(() => {
        if (!canvasRef.current || !containerRef.current) return;
        if (containerRef.current.offsetWidth === 0 || containerRef.current.offsetHeight === 0) return;

        const canvas = new fabric.Canvas(canvasRef.current, {
          controlsAboveOverlay: true,
          preserveObjectStacking: true,
        });

        init({
          initialCanvas: canvas,
          initialContainer: containerRef.current,
        });
      });
      return;
    }

    const canvas = new fabric.Canvas(canvasRef.current, {
      controlsAboveOverlay: true,
      preserveObjectStacking: true,
    });

    init({
      initialCanvas: canvas,
      initialContainer: containerRef.current,
    });

    return () => {
      canvas.dispose();
    };
  }, [init]);

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden">
      <Navbar
        id={initialData.id}
        name={initialData.name}
        editor={editor}
        activeTool={activeTool}
        onChangeActiveTool={onChangeActiveTool}
      />
      <div className="flex h-0 min-h-0 min-w-0 flex-1 overflow-hidden">
        <Sidebar
          activeTool={activeTool}
          onChangeActiveTool={onChangeActiveTool}
        />
        <ShapeSidebar
          editor={editor}
          activeTool={activeTool}
          onChangeActiveTool={onChangeActiveTool}
        />
        <FillColorSidebar
          editor={editor}
          activeTool={activeTool}
          onChangeActiveTool={onChangeActiveTool}
        />
        <StrokeColorSidebar
          editor={editor}
          activeTool={activeTool}
          onChangeActiveTool={onChangeActiveTool}
        />
        <StrokeWidthSidebar
          editor={editor}
          activeTool={activeTool}
          onChangeActiveTool={onChangeActiveTool}
        />
        <OpacitySidebar
          editor={editor}
          activeTool={activeTool}
          onChangeActiveTool={onChangeActiveTool}
        />
        <TextSidebar
          editor={editor}
          activeTool={activeTool}
          onChangeActiveTool={onChangeActiveTool}
        />
        <FontSidebar
          editor={editor}
          activeTool={activeTool}
          onChangeActiveTool={onChangeActiveTool}
        />
        <ImageSidebar
          editor={editor}
          activeTool={activeTool}
          onChangeActiveTool={onChangeActiveTool}
        />
        <UploadsSidebar
          editor={editor}
          activeTool={activeTool}
          onChangeActiveTool={onChangeActiveTool}
        />
        <TemplateSidebar
          editor={editor}
          activeTool={activeTool}
          onChangeActiveTool={onChangeActiveTool}
        />
        <FilterSidebar
          editor={editor}
          activeTool={activeTool}
          onChangeActiveTool={onChangeActiveTool}
        />
        <AiSidebar
          editor={editor}
          activeTool={activeTool}
          onChangeActiveTool={onChangeActiveTool}
        />
        <DrawSidebar
          editor={editor}
          activeTool={activeTool}
          onChangeActiveTool={onChangeActiveTool}
        />
        <SettingsSidebar
          editor={editor}
          activeTool={activeTool}
          onChangeActiveTool={onChangeActiveTool}
        />
        <main className="relative flex max-h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-muted">
          <Toolbar
            editor={editor}
            activeTool={activeTool}
            onChangeActiveTool={onChangeActiveTool}
            onRemoveBackground={handleRemoveBackground}
            isRemovingBackground={removeBgMutation.isPending}
            key={JSON.stringify(editor?.canvas.getActiveObject())}
          />
          <div className="min-h-0 min-w-0 flex-1 overflow-hidden bg-muted" ref={containerRef}>
            <div className="relative h-full w-full">
              <canvas ref={canvasRef} className="block" />
              {removeBgMutation.isPending && removeBgOverlayRect && (
                <div
                  className="pointer-events-none absolute z-10 overflow-hidden"
                  style={{
                    left: `${removeBgOverlayRect.left}px`,
                    top: `${removeBgOverlayRect.top}px`,
                    width: `${removeBgOverlayRect.width}px`,
                    height: `${removeBgOverlayRect.height}px`,
                  }}
                >
                  <div className="remove-bg-glitter absolute -inset-1 bg-[linear-gradient(120deg,transparent,rgba(255,255,255,0.9),transparent)] mix-blend-screen" />
                </div>
              )}
            </div>
          </div>
          <Footer editor={editor} />
        </main>
      </div>
    </div>
  );
};
