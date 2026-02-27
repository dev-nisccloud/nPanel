import { 
  ActiveTool, 
  Editor,
  fonts, 
} from "../_lib/types";
import { ToolSidebarClose } from "./tool-sidebar-close";
import { ToolSidebarHeader } from "./tool-sidebar-header";

import { cn } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

interface FontSidebarProps {
  editor: Editor | undefined;
  activeTool: ActiveTool;
  onChangeActiveTool: (tool: ActiveTool) => void;
};

export const FontSidebar = ({
  editor,
  activeTool,
  onChangeActiveTool,
}: FontSidebarProps) => {
  const value = editor?.getActiveFontFamily();

  const onClose = () => {
    onChangeActiveTool("select");
  };

  return (
    <aside
      className={cn(
        "relative z-[40] flex h-full max-h-full min-h-0 w-[360px] shrink-0 flex-col overflow-hidden border-r bg-white",
        activeTool === "font" ? "flex" : "hidden",
      )}
    >
      <ToolSidebarHeader
        title="Font"
        description="Change the text font"
      />
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <ScrollArea className="h-full min-h-0">
          <div className="p-4 space-y-1">
          {fonts.map((font) => (
            <Button
              key={font}
              variant="secondary"
              size="lg"
              className={cn(
                "w-full h-16 justify-start text-left",
                value === font && "border-2 border-blue-500",
              )}
              style={{
                fontFamily: font,
                fontSize: "16px",
                padding: "8px 16px"
              }}
              onClick={() => editor?.changeFontFamily(font)}
            >
              {font}
            </Button>
          ))}
        </div>
      </ScrollArea>
      </div>
      <ToolSidebarClose onClick={onClose} />
    </aside>
  );
};
