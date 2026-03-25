import { AlertTriangle, Loader, LayoutTemplate } from "lucide-react";

import { ActiveTool, Editor } from "../_lib/types";
import { ToolSidebarClose } from "./tool-sidebar-close";
import { ToolSidebarHeader } from "./tool-sidebar-header";

import { useGetTemplates } from "../_api/use-get-templates";

import { cn } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useConfirm } from "@/hooks/use-confirm";

interface TemplateSidebarProps {
  editor: Editor | undefined;
  activeTool: ActiveTool;
  onChangeActiveTool: (tool: ActiveTool) => void;
}

export const TemplateSidebar = ({
  editor,
  activeTool,
  onChangeActiveTool,
}: TemplateSidebarProps) => {
  const [ConfirmDialog, confirm] = useConfirm(
    "Are you sure?",
    "You are about to replace the current project with this template."
  );

  const { data, isLoading, isError } = useGetTemplates({
    limit: 20,
    page: 1,
  });

  const onClose = () => {
    onChangeActiveTool("select");
  };

  const onClick = async (template: NonNullable<typeof data>["data"][0]) => {
    const ok = await confirm();

    if (ok) {
      editor?.loadJson(template.json);
    }
  };

  return (
    <aside
      className={cn(
        "relative z-[40] flex h-full max-h-full min-h-0 w-[360px] shrink-0 flex-col overflow-hidden border-r bg-white",
        activeTool === "templates" ? "flex" : "hidden"
      )}
    >
      <ConfirmDialog />
      <ToolSidebarHeader
        title="Templates"
        description="Choose from a variety of templates to get started"
      />
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {isLoading && (
        <div className="flex min-h-0 flex-1 items-center justify-center">
          <Loader className="text-muted-foreground size-4 animate-spin" />
        </div>
      )}
      {isError && (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-y-4">
          <AlertTriangle className="text-muted-foreground size-4" />
          <p className="text-muted-foreground text-xs">Failed to fetch templates</p>
        </div>
      )}
      {!isLoading && !isError && (!data?.data || data.data.length === 0) && (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-y-4">
          <div className="text-muted-foreground size-12 rounded-full bg-muted flex items-center justify-center">
            <LayoutTemplate className="size-6" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-sm font-medium text-foreground">No templates available</p>
            <p className="text-xs text-muted-foreground">Templates will appear here when available</p>
          </div>
        </div>
      )}
      {!isLoading && !isError && data?.data && data.data.length > 0 && (
        <ScrollArea className="h-full min-h-0">
        <div className="p-4">
          <div className="grid grid-cols-2 gap-4">
              {data.data.map((template) => {
              return (
                <button
                  style={{
                    aspectRatio: `${template.width}/${template.height}`,
                  }}
                  onClick={() => onClick(template)}
                  key={template.id}
                  className="bg-muted group relative w-full overflow-hidden rounded-sm border transition hover:opacity-75"
                >
                  <img
                    src={template.thumbnailUrl || ""}
                    alt={template.name || "Template"}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  <div className="absolute bottom-0 left-0 w-full truncate bg-black/50 p-1 text-left text-[10px] text-white opacity-0 group-hover:opacity-100">
                    {template.name}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
          <ScrollBar orientation="vertical" />
      </ScrollArea>
      )}
      </div>
      <ToolSidebarClose onClick={onClose} />
    </aside>
  );
};
