"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { CiFileOn } from "react-icons/ci";
import { BsCloudCheck, BsCloudSlash } from "react-icons/bs";
import { useFilePicker } from "use-file-picker";
import { useMutationState } from "@tanstack/react-query";
import {
  ChevronDown,
  Download,
  Loader,
  MousePointerClick,
  Redo2,
  Undo2,
  ArrowLeft
} from "lucide-react";
import debounce from "lodash.debounce";

// UserButton will be replaced with nPanel's auth component

import { ActiveTool, Editor } from "../_lib/types";
import { useUpdateProject } from "../_api/use-update-project";

import { cn } from "@/lib/utils";
import { Hint } from "@/components/hint";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavbarProps {
  id: string;
  name: string;
  editor: Editor | undefined;
  activeTool: ActiveTool;
  onChangeActiveTool: (tool: ActiveTool) => void;
};

export const Navbar = ({
  id,
  name: initialName,
  editor,
  activeTool,
  onChangeActiveTool,
}: NavbarProps) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [projectName, setProjectName] = useState(initialName);
  const inputRef = useRef<HTMLInputElement>(null);
  const { mutate: updateProject, isPending: isUpdatingName } = useUpdateProject();

  // Update local state when prop changes
  useEffect(() => {
    setProjectName(initialName);
  }, [initialName]);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditingName && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditingName]);

  // Debounced save function for name updates
  const debouncedSaveName = useRef(
    debounce((newName: string) => {
      updateProject({ id, name: newName });
    }, 500)
  ).current;

  const handleNameChange = (newName: string) => {
    setProjectName(newName);
    debouncedSaveName(newName);
  };

  const handleNameBlur = () => {
    setIsEditingName(false);
    // Ensure we save the final value
    if (projectName !== initialName) {
      updateProject({ id, name: projectName });
    }
  };

  const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    } else if (e.key === "Escape") {
      setProjectName(initialName);
      setIsEditingName(false);
    }
  };

  const data = useMutationState({
    filters: {
      mutationKey: ["project"],
    },
    select: (mutation) => mutation.state.status,
  });

  const currentStatus = data[data.length - 1];

  const isError = currentStatus === "error";
  const isPending = currentStatus === "pending";

  // TODO: Future developers - This file dropdown was commented out to replace with inline filename editing
  // If you need to restore the file open functionality, uncomment this section
  // const { openFilePicker } = useFilePicker({
  //   accept: ".json",
  //   onFilesSuccessfullySelected: ({ plainFiles }: any) => {
  //     if (plainFiles && plainFiles.length > 0) {
  //       const file = plainFiles[0];
  //       const reader = new FileReader();
  //       reader.readAsText(file, "UTF-8");
  //       reader.onload = () => {
  //         editor?.loadJson(reader.result as string);
  //       };
  //     }
  //   },
  // });

  return (
    <nav className="flex h-[68px] min-w-0 shrink-0 items-center gap-x-4 border-b bg-background p-4">
      {/* Back Button */}
      <Link href="/agency/gen-ai/image-gen-studio">
        <Button size="icon" variant="ghost" className="h-8 w-8">
          <ArrowLeft className="size-4" />
        </Button>
      </Link>

      <Separator orientation="vertical" className="h-6" />

      <div className="w-full flex items-center gap-x-1 h-full">
        {/* Filename Input Field (Canva-style) */}
        <div className="flex items-center gap-x-2 min-w-0">
          {isEditingName ? (
            <div className="flex items-center gap-x-2 min-w-[200px]">
              <Input
                ref={inputRef}
                value={projectName}
                onChange={(e) => handleNameChange(e.target.value)}
                onBlur={handleNameBlur}
                onKeyDown={handleNameKeyDown}
                className="h-8 text-sm"
                disabled={isUpdatingName}
              />
              {isUpdatingName && (
                <Loader className="size-4 animate-spin text-muted-foreground shrink-0" />
              )}
            </div>
          ) : (
            <button
              onClick={() => setIsEditingName(true)}
              className="px-2 py-1 text-sm font-medium hover:bg-muted rounded transition-colors min-w-0 truncate max-w-[200px]"
              title="Click to rename"
            >
              {projectName}
            </button>
          )}
        </div>

        {/* TODO: Future developers - File dropdown commented out, replaced with inline filename editing above
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="ghost">
              File
              <ChevronDown className="size-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-60">
            <DropdownMenuItem
              onClick={() => openFilePicker()}
              className="flex items-center gap-x-2"
            >
              <CiFileOn className="size-8" />
              <div>
                <p>Open</p>
                <p className="text-xs text-muted-foreground">
                  Open a JSON file
                </p>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        */}
        <Separator orientation="vertical" className="mx-2" />
        <Hint label="Select" side="bottom" sideOffset={10}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onChangeActiveTool("select")}
            className={cn(activeTool === "select" && "bg-gray-100")}
          >
            <MousePointerClick className="size-4" />
          </Button>
        </Hint>
        <Hint label="Undo" side="bottom" sideOffset={10}>
          <Button
            disabled={!editor?.canUndo()}
            variant="ghost"
            size="icon"
            onClick={() => editor?.onUndo()}
          >
            <Undo2 className="size-4" />
          </Button>
        </Hint>
        <Hint label="Redo" side="bottom" sideOffset={10}>
          <Button
            disabled={!editor?.canRedo()}
            variant="ghost"
            size="icon"
            onClick={() => editor?.onRedo()}
          >
            <Redo2 className="size-4" />
          </Button>
        </Hint>
        <Separator orientation="vertical" className="mx-2" />
        {isPending && (
          <div className="flex items-center gap-x-2">
            <Loader className="size-4 animate-spin text-muted-foreground" />
            <div className="text-xs text-muted-foreground">
              Saving...
            </div>
          </div>
        )}
        {!isPending && isError && (
          <div className="flex items-center gap-x-2">
            <BsCloudSlash className="size-[20px] text-muted-foreground" />
            <div className="text-xs text-muted-foreground">
              Failed to save
            </div>
          </div>
        )}
        {!isPending && !isError && (
          <div className="flex items-center gap-x-2">
            <BsCloudCheck className="size-[20px] text-muted-foreground" />
            <div className="text-xs text-muted-foreground">
              Saved
            </div>
          </div>
        )}
        <div className="ml-auto flex items-center gap-x-4">
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="default" className="rounded-full">
                Export
                <Download className="size-4 ml-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-60">
              {/* JSON export - commented out for now, may be needed in the future */}
              {/* <DropdownMenuItem
                className="flex items-center gap-x-2"
                onClick={() => editor?.saveJson()}
              >
                <CiFileOn className="size-8" />
                <div>
                  <p>JSON</p>
                  <p className="text-xs text-muted-foreground">
                    Save for later editing
                  </p>
                </div>
              </DropdownMenuItem> */}
              <DropdownMenuItem
                className="flex items-center gap-x-2"
                onClick={() => editor?.savePng()}
              >
                <CiFileOn className="size-8" />
                <div>
                  <p>PNG</p>
                  <p className="text-xs text-muted-foreground">
                    Best for sharing on the web
                  </p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="flex items-center gap-x-2"
                onClick={() => editor?.saveJpg()}
              >
                <CiFileOn className="size-8" />
                <div>
                  <p>JPG</p>
                  <p className="text-xs text-muted-foreground">
                    Best for printing
                  </p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="flex items-center gap-x-2"
                onClick={() => editor?.saveSvg()}
              >
                <CiFileOn className="size-8" />
                <div>
                  <p>SVG</p>
                  <p className="text-xs text-muted-foreground">
                    Best for editing in vector software
                  </p>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {/* User button handled by nPanel layout */}
        </div>
      </div>
    </nav>
  );
};
