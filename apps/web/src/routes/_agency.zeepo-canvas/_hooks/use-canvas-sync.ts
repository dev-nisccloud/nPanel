import { useCallback, useEffect } from "react";
import { useReactFlow } from "@xyflow/react";
import { useDebouncedCallback } from "use-debounce";
import { trpc } from "@/utils/trpc";
import { toast } from "sonner";

export const useCanvasSync = (canvasId: string, initialJson?: any) => {
  const { toObject, setNodes, setEdges } = useReactFlow();
  const updateProject = trpc.zeepoCanvas.projects.update.useMutation({
    onError: () => toast.error("Failed to save canvas to cloud"),
  });

  // Load initial data
  useEffect(() => {
    // Try localStorage first for instant load
    const localStr = localStorage.getItem(`zeepo-canvas:${canvasId}`);
    let loaded = false;

    if (localStr) {
      try {
        const localData = JSON.parse(localStr);
        if (localData?.nodes || localData?.edges) {
          setNodes(localData.nodes || []);
          setEdges(localData.edges || []);
          loaded = true;
        }
      } catch (e) {
        console.error("Failed to parse local canvas data");
      }
    }

    // Fallback to database data if local is empty or db is newer
    if (!loaded && initialJson) {
      setNodes(initialJson.nodes || []);
      setEdges(initialJson.edges || []);
    }
  }, [canvasId, initialJson, setNodes, setEdges]);

  // Debounced save to Database (every 3 seconds)
  const saveToCloud = useDebouncedCallback(() => {
    const rfObject = toObject();
    updateProject.mutate({
      id: canvasId,
      canvasJson: rfObject,
    });
  }, 3000);

  // Immediate save to LocalStorage + Debounced Cloud Save
  const save = useCallback(() => {
    const rfObject = toObject();
    localStorage.setItem(`zeepo-canvas:${canvasId}`, JSON.stringify(rfObject));
    saveToCloud();
  }, [canvasId, toObject, saveToCloud]);

  return { save, isSaving: updateProject.isPending };
};
