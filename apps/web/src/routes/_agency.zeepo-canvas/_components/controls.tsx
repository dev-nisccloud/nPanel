"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";
import { Controls as ControlsPrimitive } from "./ai-elements/controls";

import { useInteraction } from "../_providers/interaction";
import { MousePointer2, Hand } from "lucide-react";
import { Button } from "./ui/button";

import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

export const ControlsInner = () => {
  const { mode, setMode } = useInteraction();
  
  return (
    // biome-ignore lint/a11y/noNoninteractiveElementInteractions: Prevents ReactFlow double-click zoom
    <div onDoubleClick={(e) => e.stopPropagation()} role="toolbar">
      <ControlsPrimitive
        className="rounded-full [&>button]:rounded-full [&>button]:hover:bg-accent"
        orientation="horizontal"
        position="top-left"
        showInteractive={false}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={mode === "select" ? "default" : "ghost"}
              size="icon"
              className={cn(
                "size-7 rounded-full", 
                mode === "select" ? "bg-[#38b6ff]! text-white cursor-default hover:bg-[#38b6ff]/90!" : "hover:bg-[#38b6ff]/10"
              )}
              onClick={() => setMode("select")}
            >
              <MousePointer2 className={cn("size-3.5", mode === "select" ? "text-white" : "text-foreground")} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Selection Mode (V)</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={mode === "pan" ? "default" : "ghost"}
              size="icon"
              className={cn(
                "size-7 rounded-full", 
                mode === "pan" ? "bg-[#38b6ff]! text-white cursor-default hover:bg-[#38b6ff]/90!" : "hover:bg-[#38b6ff]/10"
              )}
              onClick={() => setMode("pan")}
            >
              <Hand className={cn("size-3.5", mode === "pan" ? "text-white" : "text-foreground")} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Pan Mode (H)</TooltipContent>
        </Tooltip>
      </ControlsPrimitive>
    </div>
  );
};

export const Controls = memo(ControlsInner);
