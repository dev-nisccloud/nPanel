"use client";

import { useReactFlow } from "@xyflow/react";
import { SaveIcon, ChevronLeftIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/utils/trpc";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { useInteraction } from "../_providers/interaction";

interface CanvasHeaderProps {
  canvasId: string;
  initialName: string;
}

export const CanvasHeader = ({ canvasId, initialName }: CanvasHeaderProps) => {
  const [name, setName] = useState(initialName);
  const navigate = useNavigate();
  const { toObject } = useReactFlow();
  const { isDirty, setIsDirty } = useInteraction();
  
  const updateProject = trpc.zeepoCanvas.projects.update.useMutation({
    onSuccess: () => {
      toast.success("Project saved successfully");
      setIsDirty(false);
    },
    onError: (error) => {
      toast.error(`Failed to save project: ${error.message}`);
    }
  });

  const handleSave = () => {
    const { nodes, edges } = toObject();
    updateProject.mutate({
      id: canvasId,
      name,
      canvasJson: { nodes, edges },
    });
  };

  useEffect(() => {
    setName(initialName);
  }, [initialName]);

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b bg-background px-4">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="size-8 rounded-full"
          onClick={() => navigate("/agency/zeepo-canvas")}
        >
          <ChevronLeftIcon className="size-4" />
        </Button>
        
        <Input
          className="h-9 w-[300px] border-none bg-transparent font-semibold shadow-none focus-visible:ring-1 focus-visible:ring-primary"
          onChange={(e) => {
            setName(e.target.value);
            setIsDirty(true);
          }}
          placeholder="Project Name"
          value={name}
        />
      </div>
      
      <div className="flex items-center gap-2">
        <Button 
          disabled={updateProject.isPending || !isDirty} 
          onClick={handleSave}
          size="sm"
          className="gap-2"
        >
          {updateProject.isPending ? (
            <Spinner className="text-primary-foreground" size={14} variant="bars" />
          ) : (
            <SaveIcon className="size-4" />
          )}
          {updateProject.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </header>
  );
};
