"use client";

import * as React from "react";
import { memo, type ReactNode } from "react";
import { Handle, NodeResizer, Position, type NodeProps } from "@xyflow/react";
import { cn } from "@/lib/utils";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

export type MediaBuyingEomFlowNodeData = {
  label: ReactNode;
  /** Start: source only. End: target only. Default: both handles (horizontal flow). */
  flowRole?: "start" | "end" | "default";
  status?: "loading" | "success" | "error";
};

export const MEDIA_BUYING_EOM_NODE_TYPE = "mediaBuyingEomResizable" as const;

function ResizableFlowNodeInner({ data, selected }: NodeProps<MediaBuyingEomFlowNodeData>) {
  const role = data.flowRole ?? "default";
  const status = data.status;
  const [resizeMode, setResizeMode] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!resizeMode) return;
    const onPointerDown = (ev: PointerEvent) => {
      const el = rootRef.current;
      if (!el) return;
      const target = ev.target as Node | null;
      if (!target) return;
      if (el.contains(target)) return;
      setResizeMode(false);
    };
    window.addEventListener("pointerdown", onPointerDown, { capture: true });
    return () => {
      window.removeEventListener("pointerdown", onPointerDown, { capture: true } as any);
    };
  }, [resizeMode]);

  return (
    <div ref={rootRef} className="relative h-full w-full min-h-[2.5rem] min-w-[200px]">
      <NodeResizer
        color="var(--primary)"
        isVisible={resizeMode}
        minWidth={200}
        minHeight={48}
      />
      {role !== "start" && (
        <Handle
          type="target"
          position={Position.Left}
          className="!size-2.5 !border-2 !border-background !bg-primary"
        />
      )}
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div className="relative h-full">
            {status && (
              <div
                className={cn(
                  "pointer-events-none absolute right-0 top-0 z-20 translate-x-[40%] -translate-y-[40%]",
                  "mb-eom-status-badge",
                  selected && "mb-eom-status-badge--selected"
                )}
              >
                <div className="mb-eom-status-badge__inner">
                  {status === "success" ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                  ) : status === "error" ? (
                    <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                  ) : (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  )}
                </div>
              </div>
            )}

            <div
              className={cn(
                "mb-eom-node-shell relative h-full overflow-hidden rounded-xl",
                selected && "mb-eom-node-shell--selected",
                resizeMode && "mb-eom-node-shell--resize-mode"
              )}
            >
              <div
                className={cn(
                  "nowheel relative z-10 flex h-full min-h-0 min-w-0 flex-col overflow-auto rounded-[calc(var(--radius)+2px)] border bg-card px-3 py-2 text-sm text-card-foreground shadow-sm",
                  selected
                    ? "border-transparent ring-1 ring-ring/35 ring-offset-1 ring-offset-background"
                    : "border-border"
                )}
              >
                <div className="min-h-0 min-w-0">{data.label}</div>
              </div>
            </div>
          </div>
        </ContextMenuTrigger>

        <ContextMenuContent>
          <ContextMenuItem
            inset
            onSelect={(e) => {
              setResizeMode((v) => !v);
            }}
          >
            {resizeMode ? "Disable resize mode" : "Enable resize mode"}
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
      {role !== "end" && (
        <Handle
          type="source"
          position={Position.Right}
          className="!size-2.5 !border-2 !border-background !bg-primary"
        />
      )}
    </div>
  );
}

const ResizableFlowNode = memo(ResizableFlowNodeInner);

export default ResizableFlowNode;

export const mediaBuyingEomNodeTypes = {
  [MEDIA_BUYING_EOM_NODE_TYPE]: ResizableFlowNode,
};
