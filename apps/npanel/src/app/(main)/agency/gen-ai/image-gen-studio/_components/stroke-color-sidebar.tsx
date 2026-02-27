import { ActiveTool, Editor, STROKE_COLOR } from "../_lib/types";
import { ToolSidebarClose } from "./tool-sidebar-close";
import { ToolSidebarHeader } from "./tool-sidebar-header";
import { ColorPicker } from "./color-picker";

import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface StrokeColorSidebarProps {
  editor: Editor | undefined;
  activeTool: ActiveTool;
  onChangeActiveTool: (tool: ActiveTool) => void;
};

export const StrokeColorSidebar = ({
  editor,
  activeTool,
  onChangeActiveTool,
}: StrokeColorSidebarProps) => {
  const value = editor?.getActiveStrokeColor() || STROKE_COLOR;

  const onClose = () => {
    onChangeActiveTool("select");
  };

  const onChange = (value: string) => {
    editor?.changeStrokeColor(value);
  };

  return (
    <aside
      className={cn(
        "relative z-[40] flex h-full max-h-full min-h-0 w-[360px] shrink-0 flex-col overflow-hidden border-r bg-white",
        activeTool === "stroke-color" ? "flex" : "hidden",
      )}
    >
      <ToolSidebarHeader
        title="Stroke color"
        description="Add stroke color to your element"
      />
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <ScrollArea className="h-full">
          <div className="space-y-6 p-4">
          <ColorPicker
            value={value}
            onChange={onChange}
          />
        </div>
        </ScrollArea>
      </div>
      <ToolSidebarClose onClick={onClose} />
    </aside>
  );
};
