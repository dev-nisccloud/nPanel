import { useReactFlow } from "@xyflow/react";
import { CodeIcon, CopyIcon, EyeIcon, Maximize2Icon, TrashIcon } from "lucide-react";
import { type ReactNode, useState } from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Node,
  NodeContent,
  NodeHeader,
  NodeTitle,
} from "@/routes/_agency.zeepo-canvas/_components/ai-elements/node";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/routes/_agency.zeepo-canvas/_lib/utils";
import { useNodeOperations } from "@/routes/_agency.zeepo-canvas/_providers/node-operations";
import { NodeToolbar } from "./toolbar";

interface NodeLayoutProps {
  children: ReactNode;
  id: string;
  data?: Record<string, unknown> & {
    model?: string;
    source?: string;
    generated?: object;
  };
  title: string;
  type: string;
  toolbar?: {
    tooltip?: string;
    children: ReactNode;
  }[];
  className?: string;
}

export const NodeLayout = ({
  children,
  type,
  id,
  data,
  toolbar,
  title,
  className,
}: NodeLayoutProps) => {
  const { deleteElements, setCenter, getNode, updateNode } = useReactFlow();
  const { duplicateNode } = useNodeOperations();
  const [showData, setShowData] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);

  const handleFocus = () => {
    const node = getNode(id);

    if (!node) {
      return;
    }

    const { x, y } = node.position;
    const width = node.measured?.width ?? 0;

    setCenter(x + width / 2, y, {
      duration: 1000,
    });
  };

  const handleDelete = () => {
    deleteElements({
      nodes: [{ id }],
    });
  };

  const handleShowData = () => {
    setTimeout(() => {
      setShowData(true);
    }, 100);
  };

  const handleSelect = (open: boolean) => {
    if (!open) {
      return;
    }

    const node = getNode(id);

    if (!node) {
      return;
    }

    if (!node.selected) {
      updateNode(id, { selected: true });
    }
  };

  return (
    <>
      {type !== "drop" && Boolean(toolbar?.length) && (
        <NodeToolbar id={id} items={toolbar} />
      )}
      <ContextMenu onOpenChange={handleSelect}>
        <ContextMenuTrigger>
          <Node
            className={cn(
              className,
              "rounded-[28px] bg-transparent shadow-none"
            )}
            handles={{
              target: true,
              source: type !== "video",
            }}
          >
            {type !== "drop" && (
              <NodeHeader className="absolute -top-10 mb-3 flex w-full items-center justify-between border-none bg-transparent p-0!">
                <NodeTitle className="font-mono font-normal text-muted-foreground text-xs">
                  {title}
                </NodeTitle>
                <Button
                  className="size-6 rounded-full bg-background/50 hover:bg-background"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowFullscreen(true);
                  }}
                  size="icon"
                  variant="ghost"
                >
                  <Maximize2Icon size={12} />
                </Button>
              </NodeHeader>
            )}
            <NodeContent className="rounded-[28px] bg-card p-2 ring-1 ring-border">
              <div className="overflow-hidden rounded-3xl bg-card">
                {children}
              </div>
            </NodeContent>
          </Node>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={() => setShowFullscreen(true)}>
            <Maximize2Icon size={12} />
            <span>Fullscreen</span>
          </ContextMenuItem>
          <ContextMenuItem onClick={() => duplicateNode(id)}>
            <CopyIcon size={12} />
            <span>Duplicate</span>
          </ContextMenuItem>
          <ContextMenuItem onClick={handleFocus}>
            <EyeIcon size={12} />
            <span>Focus</span>
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={handleDelete} variant="destructive">
            <TrashIcon size={12} />
            <span>Delete</span>
          </ContextMenuItem>
          {process.env.NODE_ENV === "development" && (
            <>
              <ContextMenuSeparator />
              <ContextMenuItem onClick={handleShowData}>
                <CodeIcon size={12} />
                <span>Show data</span>
              </ContextMenuItem>
            </>
          )}
        </ContextMenuContent>
      </ContextMenu>

      {/* Fullscreen Dialog */}
      <Dialog onOpenChange={setShowFullscreen} open={showFullscreen}>
        <DialogContent className="max-w-[95vw] h-[90vh] flex flex-col p-0 gap-0 overflow-hidden rounded-3xl border-none bg-background shadow-2xl">
          <DialogHeader className="p-6 flex-shrink-0 border-b flex flex-row items-center justify-between gap-4">
            <div>
              <DialogTitle className="text-xl font-bold">{title}</DialogTitle>
              <DialogDescription className="text-sm">
                Full-screen view of your {type} node
              </DialogDescription>
            </div>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-hidden bg-secondary/20">
            {type === "text" ? (
              <ScrollArea className="h-full w-full">
                <div className="mx-auto max-w-4xl p-8 lg:p-12">
                  <div className="rounded-2xl bg-card p-8 shadow-sm ring-1 ring-border">
                    {children}
                  </div>
                </div>
                <ScrollBar orientation="vertical" />
              </ScrollArea>
            ) : (
              <div className="flex h-full w-full items-center justify-center p-8">
                <div className="relative h-full w-full max-w-6xl overflow-hidden rounded-2xl bg-card shadow-2xl ring-1 ring-border">
                  <div className="h-full w-full [&_img]:h-full [&_img]:w-full [&_img]:object-contain [&_video]:h-full [&_video]:w-full [&_video]:object-contain">
                    {children}
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog onOpenChange={setShowData} open={showData}>
        <DialogContent className="sm:max-w-[600px] h-[70vh] flex flex-col p-0 gap-0 overflow-hidden">
          <DialogHeader className="p-6 flex-shrink-0 border-b">
            <DialogTitle>Node data</DialogTitle>
            <DialogDescription>
              Data for node{" "}
              <code className="rounded-sm bg-secondary px-2 py-1 font-mono">
                {id}
              </code>
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-hidden">
            <ScrollArea className="h-full w-full">
              <div className="p-6">
                <pre className="rounded-lg bg-black p-4 text-xs text-white/90 font-mono whitespace-pre-wrap break-all">
                  {JSON.stringify(data, null, 2)}
                </pre>
              </div>
              <ScrollBar orientation="vertical" thumbClassName="bg-primary" />
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
