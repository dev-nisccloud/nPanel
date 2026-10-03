"use client";

import * as React from "react";
import { ChevronRight, ChevronDown, Folder, FolderOpen, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FolderTreeNode {
  path: string;
  name: string;
  children?: FolderTreeNode[];
  /** True after this folder's children have been fetched, including when there are none. */
  childrenLoaded?: boolean;
  isLoading?: boolean;
  isExpanded?: boolean;
}

interface FileManagerFolderTreeProps {
  currentPath: string;
  onPathSelect: (path: string) => void;
  onLoadFolder: (path: string) => Promise<FolderTreeNode[]>;
  className?: string;
}

function findNode(nodes: FolderTreeNode[], path: string): FolderTreeNode | undefined {
  for (const node of nodes) {
    if (node.path === path) return node;
    if (node.children) {
      const found = findNode(node.children, path);
      if (found) return found;
    }
  }
  return undefined;
}

function mapNode(
  nodes: FolderTreeNode[],
  path: string,
  updates: Partial<FolderTreeNode>,
): FolderTreeNode[] {
  return nodes.map((node) => {
    if (node.path === path) return { ...node, ...updates };
    if (!node.children?.length) return node;
    return { ...node, children: mapNode(node.children, path, updates) };
  });
}

export function FileManagerFolderTree({
  currentPath,
  onPathSelect,
  onLoadFolder,
  className,
}: FileManagerFolderTreeProps) {
  const [treeData, setTreeData] = React.useState<FolderTreeNode[]>([
    {
      path: "/",
      name: "Home directory",
      children: [],
      isExpanded: true,
      isLoading: true,
      childrenLoaded: false,
    },
  ]);
  const treeRef = React.useRef(treeData);
  treeRef.current = treeData;
  const onLoadFolderRef = React.useRef(onLoadFolder);
  onLoadFolderRef.current = onLoadFolder;

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const folders = await onLoadFolderRef.current("/");
        if (cancelled) return;
        setTreeData([
          {
            path: "/",
            name: "Home directory",
            children: folders,
            isExpanded: true,
            isLoading: false,
            childrenLoaded: true,
          },
        ]);
      } catch (error) {
        console.error("Failed to load initial folders:", error);
        if (cancelled) return;
        setTreeData((prev) =>
          mapNode(prev, "/", { isLoading: false, childrenLoaded: true, children: [] }),
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const expandFolder = async (path: string) => {
    const node = findNode(treeRef.current, path);
    if (!node) return;

    if (node.childrenLoaded) {
      setTreeData((prev) => mapNode(prev, path, { isExpanded: true }));
      return;
    }

    setTreeData((prev) => mapNode(prev, path, { isExpanded: true, isLoading: true }));
    try {
      const children = await onLoadFolderRef.current(path);
      setTreeData((prev) =>
        mapNode(prev, path, {
          isExpanded: true,
          isLoading: false,
          childrenLoaded: true,
          children,
        }),
      );
    } catch (error) {
      console.error("Failed to load folder:", error);
      setTreeData((prev) => mapNode(prev, path, { isLoading: false, isExpanded: false }));
    }
  };

  const toggleFolder = (path: string) => {
    const node = findNode(treeRef.current, path);
    if (!node || node.isLoading) return;
    if (node.isExpanded) {
      setTreeData((prev) => mapNode(prev, path, { isExpanded: false }));
      return;
    }
    void expandFolder(path);
  };

  const renderNode = (node: FolderTreeNode, level: number = 0) => {
    const isSelected = currentPath === node.path;
    const hasChildren = (node.children?.length ?? 0) > 0;
    const showChevron = node.isLoading || !node.childrenLoaded || hasChildren;

    return (
      <div key={node.path}>
        <div
          className={cn(
            "flex items-center gap-1 rounded-md py-1 pr-2 cursor-pointer hover:bg-muted/60 transition-colors",
            isSelected && "bg-primary/10 text-primary font-medium",
          )}
          style={{ paddingLeft: `${level * 12 + 4}px` }}
          onClick={() => {
            onPathSelect(node.path);
            if (!node.isExpanded) void expandFolder(node.path);
          }}
        >
          <button
            type="button"
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-sm hover:bg-muted"
            aria-label={node.isExpanded ? `Collapse ${node.name}` : `Expand ${node.name}`}
            disabled={!showChevron || node.isLoading}
            onClick={(event) => {
              event.stopPropagation();
              toggleFolder(node.path);
            }}
          >
            {node.isLoading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : showChevron ? (
              node.isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )
            ) : (
              <span className="h-3 w-3" />
            )}
          </button>

          {node.isExpanded ? (
            <FolderOpen className="h-4 w-4 shrink-0 text-primary" />
          ) : (
            <Folder className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}

          <span className="min-w-0 flex-1 truncate text-sm">{node.name}</span>
        </div>

        {node.isExpanded && hasChildren ? (
          <div>{node.children!.map((child) => renderNode(child, level + 1))}</div>
        ) : null}
      </div>
    );
  };

  return (
    <div className={cn("flex h-full min-h-0 flex-col overflow-hidden border bg-muted/30", className)}>
      <div className="shrink-0 border-b bg-background/50 p-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <Folder className="h-4 w-4" />
          Folders
        </h3>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="p-2">{treeData.map((node) => renderNode(node))}</div>
      </div>
    </div>
  );
}
