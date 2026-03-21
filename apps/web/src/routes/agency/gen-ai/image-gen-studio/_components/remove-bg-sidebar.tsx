import Image from "next/image";
import { AlertTriangle } from "lucide-react";

import { ActiveTool, Editor } from "../_lib/types";
import { ToolSidebarClose } from "./tool-sidebar-close";
import { ToolSidebarHeader } from "./tool-sidebar-header";

import { useRemoveBg } from "../_api/use-remove-bg";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface RemoveBgSidebarProps {
  editor: Editor | undefined;
  activeTool: ActiveTool;
  onChangeActiveTool: (tool: ActiveTool) => void;
}

export const RemoveBgSidebar = ({
  editor,
  activeTool,
  onChangeActiveTool,
}: RemoveBgSidebarProps) => {
  const mutation = useRemoveBg();

  const selectedObject = editor?.selectedObjects[0];

  // @ts-ignore
  const imageSrc = selectedObject?._originalElement?.currentSrc;

  const onClose = () => {
    onChangeActiveTool("select");
  };

  const onClick = () => {
    mutation.mutate(
      { image: imageSrc },
      {
        onSuccess: ({ data }) => {
          editor?.addImage(data);
        },
      }
    );
  };

  return (
    <aside
      className={cn(
        "relative z-[40] flex h-full max-h-full min-h-0 w-[360px] shrink-0 flex-col overflow-hidden border-r bg-white",
        activeTool === "remove-bg" ? "flex" : "hidden",
      )}
    >
      <ToolSidebarHeader
        title="Background removal"
        description="Remove background from image using AI"
      />
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {!imageSrc && (
        <div className="flex flex-1 flex-col items-center justify-center gap-y-4">
          <AlertTriangle className="size-4 text-muted-foreground" />
          <p className="text-muted-foreground text-xs">
            Feature not available for this object
          </p>
        </div>
      )}
      {imageSrc && (
        <ScrollArea className="h-full">
          <div className="space-y-4 p-4">
            <div
              className={cn(
                "relative aspect-square rounded-md overflow-hidden transition bg-muted",
                mutation.isPending && "opacity-50",
              )}
            >
              <Image
                src={imageSrc}
                fill
                alt="Image"
                className="object-cover"
              />
              {mutation.isPending && (
                <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
                  <div className="remove-bg-glitter absolute -inset-1 bg-[linear-gradient(120deg,transparent,rgba(255,255,255,0.9),transparent)] mix-blend-screen" />
                </div>
              )}
            </div>
            <Button
              disabled={mutation.isPending}
              onClick={onClick}
              className="w-full"
            >
              Remove background
            </Button>
          </div>
        </ScrollArea>
      )}
      </div>
      <ToolSidebarClose onClick={onClose} />
    </aside>
  );
};
