import { IoTriangle } from "react-icons/io5";
import { FaDiamond } from "react-icons/fa6";
import { FaCircle, FaSquare, FaSquareFull, FaRegCircle, FaRegSquare, FaStar, FaRegStar } from "react-icons/fa";
import { ArrowRight, MapPin, MessageCircle, Play } from "lucide-react";

import type { ActiveTool, Editor } from "../_lib/types";
import { ShapeTool } from "./shape-tool";
import { ToolSidebarClose } from "./tool-sidebar-close";
import { ToolSidebarHeader } from "./tool-sidebar-header";

import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ShapeSidebarProps {
  editor: Editor | undefined;
  activeTool: ActiveTool;
  onChangeActiveTool: (tool: ActiveTool) => void;
};

export const ShapeSidebar = ({
  editor,
  activeTool,
  onChangeActiveTool,
}: ShapeSidebarProps) => {
  const onClose = () => {
    onChangeActiveTool("select");
  };

  return (
    <aside
      className={cn(
        "relative z-[40] flex h-full max-h-full min-h-0 w-[360px] shrink-0 flex-col overflow-hidden border-r bg-white",
        activeTool === "shapes" ? "flex" : "hidden",
      )}
    >
      <ToolSidebarHeader
        title="Shapes"
        description="Add shapes to your canvas"
      />
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <ScrollArea className="h-full min-h-0">
          <div className="grid grid-cols-3 gap-4 p-4">
            {/* Basic filled shapes */}
            <ShapeTool
              onClick={() => editor?.addCircle()}
              icon={FaCircle}
            />
            <ShapeTool
              onClick={() => editor?.addSoftRectangle()}
              icon={FaSquare}
            />
            <ShapeTool
              onClick={() => editor?.addRectangle()}
              icon={FaSquareFull}
            />
            <ShapeTool
              onClick={() => editor?.addTriangle()}
              icon={IoTriangle}
            />
            <ShapeTool
              onClick={() => editor?.addInverseTriangle()}
              icon={IoTriangle}
              iconClassName="rotate-180"
            />
            <ShapeTool
              onClick={() => editor?.addDiamond()}
              icon={FaDiamond}
            />

            {/* Outline variants */}
            <ShapeTool
              onClick={() => editor?.addCircleOutline()}
              icon={FaRegCircle}
            />
            <ShapeTool
              onClick={() => editor?.addRectangleOutline()}
              icon={FaRegSquare}
            />
            <ShapeTool
              onClick={() => editor?.addRoundedRectangleOutline()}
              icon={FaSquare}
              iconClassName="rounded-full"
            />

            {/* Dashed variants */}
            <ShapeTool
              onClick={() => editor?.addDashedCircle()}
              icon={FaRegCircle}
              iconClassName="border-2 border-dashed rounded-full"
            />
            <ShapeTool
              onClick={() => editor?.addDashedRectangle()}
              icon={FaRegSquare}
              iconClassName="border-2 border-dashed"
            />
            <ShapeTool
              onClick={() => editor?.addDashedRoundedRectangle()}
              icon={FaRegSquare}
              iconClassName="border-2 border-dashed rounded-full"
            />

            {/* Pills */}
            <ShapeTool
              onClick={() => editor?.addHorizontalPill()}
              icon={FaSquare}
              iconClassName="rounded-full"
            />
            <ShapeTool
              onClick={() => editor?.addVerticalPill()}
              icon={FaSquare}
              iconClassName="rounded-full rotate-90"
            />

            {/* Stars */}
            <ShapeTool
              onClick={() => editor?.addStar()}
              icon={FaStar}
            />
            <ShapeTool
              onClick={() => editor?.addStarOutline()}
              icon={FaRegStar}
            />

            {/* Arrow & callouts */}
            <ShapeTool
              onClick={() => editor?.addArrowRight()}
              icon={ArrowRight}
            />
            <ShapeTool
              onClick={() => editor?.addSpeechBubble()}
              icon={MessageCircle}
            />
            <ShapeTool
              onClick={() => editor?.addMapPin()}
              icon={MapPin}
            />
            <ShapeTool
              onClick={() => editor?.addPlayButton()}
              icon={Play}
            />
          </div>
        </ScrollArea>
      </div>
      <ToolSidebarClose onClick={onClose} />
    </aside>
  );
};
