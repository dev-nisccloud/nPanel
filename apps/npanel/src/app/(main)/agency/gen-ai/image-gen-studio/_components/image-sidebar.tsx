import Link from "next/link";
import { AlertTriangle, Loader, Search } from "lucide-react";
import { useState, useCallback } from "react";

import { ActiveTool, Editor } from "../_lib/types";
import { ToolSidebarClose } from "./tool-sidebar-close";
import { ToolSidebarHeader } from "./tool-sidebar-header";

import { useGetImages } from "../_api/use-get-images";

import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ImageSidebarProps {
  editor: Editor | undefined;
  activeTool: ActiveTool;
  onChangeActiveTool: (tool: ActiveTool) => void;
}

export const ImageSidebar = ({ editor, activeTool, onChangeActiveTool }: ImageSidebarProps) => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeSearchQuery, setActiveSearchQuery] = useState<string | undefined>(undefined);
  const { data, isLoading, isError, loadMore, hasMore, isLoadingMore, resetSearch } = useGetImages(activeSearchQuery);

  const onClose = () => {
    onChangeActiveTool("select");
  };

  const handleSearch = useCallback(() => {
    const query = searchQuery.trim();
    if (query.length > 0) {
      setActiveSearchQuery(query);
      resetSearch();
    } else {
      setActiveSearchQuery(undefined);
      resetSearch();
    }
  }, [searchQuery, resetSearch]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  }, [handleSearch]);

  return (
    <aside
      className={cn(
        "relative z-[40] flex h-full max-h-full min-h-0 w-[360px] shrink-0 flex-col overflow-hidden border-r bg-white",
        activeTool === "images" ? "flex" : "hidden"
      )}
    >
      <ToolSidebarHeader title="Images" description="Add images to your canvas" />
      <div className="px-4 pt-2 pb-3 border-b">
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Search images..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyPress}
            className="flex-1"
          />
          <Button
            onClick={handleSearch}
            size="icon"
            variant="outline"
            className="shrink-0"
          >
            <Search className="size-4" />
          </Button>
        </div>
      </div>
      {isLoading && (
        <div className="flex min-h-0 flex-1 items-center justify-center">
          <Loader className="size-4 text-muted-foreground animate-spin" />
        </div>
      )}
      {isError && (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-y-4">
          <AlertTriangle className="size-4 text-muted-foreground" />
          <p className="text-muted-foreground text-xs">Failed to fetch images</p>
        </div>
      )}
      {!isLoading && !isError && (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <ScrollArea className="h-full min-h-0">
            <div className="p-4">
              {data?.data && data.data.length > 0 ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    {data.data.map((image) => (
                      <button
                        type="button"
                        onClick={() => editor?.addImage(image.urls.regular)}
                        key={image.id}
                        className="relative h-[100px] w-full group overflow-hidden rounded-sm border bg-muted transition hover:opacity-75"
                      >
                        <img
                          src={image?.urls?.small ?? image?.urls?.thumb}
                          alt={image.alt_description ?? "Image"}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                        <Link
                          target="_blank"
                          rel="noopener noreferrer"
                          href={image.links.html}
                          className="absolute left-0 bottom-0 w-full truncate bg-black/50 p-1 text-left text-[10px] text-white opacity-0 group-hover:opacity-100 hover:underline"
                        >
                          {image.user.name}
                        </Link>
                      </button>
                    ))}
                  </div>
                  {hasMore && data.data.length > 0 && (
                    <div className="mt-4 flex justify-center">
                      <Button
                        onClick={loadMore}
                        disabled={isLoadingMore}
                        variant="outline"
                        size="sm"
                        className="w-full"
                      >
                        {isLoadingMore ? (
                          <>
                            <Loader className="size-4 mr-2 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          "Load More"
                        )}
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-center py-8">
                  <p className="text-muted-foreground text-xs">No images available</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      )}
      <ToolSidebarClose onClick={onClose} />
    </aside>
  );
};
