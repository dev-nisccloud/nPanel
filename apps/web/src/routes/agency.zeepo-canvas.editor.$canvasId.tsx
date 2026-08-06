import { useParams, Navigate } from "react-router";
import { useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { trpc } from "@/utils/trpc";
import { Loader2 } from "lucide-react";
import { captureEvent } from "@/lib/posthog";

import { Canvas } from "./_agency.zeepo-canvas/_components/canvas";
import { Controls } from "./_agency.zeepo-canvas/_components/controls";
import { Reasoning } from "./_agency.zeepo-canvas/_components/reasoning";
import { Toolbar } from "./_agency.zeepo-canvas/_components/toolbar";
import { ModelsProvider } from "./_agency.zeepo-canvas/_providers/models";
import { ReactFlowProvider } from "./_agency.zeepo-canvas/_providers/react-flow";
import { InteractionProvider } from "./_agency.zeepo-canvas/_providers/interaction";
import { CanvasHeader } from "./_agency.zeepo-canvas/_components/header";

export default function ZeepoCanvasEditorPage() {
  const { canvasId } = useParams<{ canvasId: string }>();
  const { data: session, isPending: isAuthPending } = authClient.useSession();

  const { data: projectData, isLoading: isProjectLoading, error } = trpc.zeepoCanvas.projects.get.useQuery(
    { id: canvasId! },
    { enabled: !!canvasId }
  );

  useEffect(() => {
    if (!canvasId || !projectData?.data) return;
    captureEvent("zeepo_canvas_project_opened", { project_id: canvasId });
  }, [canvasId, projectData?.data?.id]);

  if (isAuthPending || isProjectLoading) {
    return (
      <div className="flex h-[calc(100vh-theme(spacing.12))] w-full items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!session?.user) {
    return <Navigate to="/auth/login" replace />;
  }

  if (error || !projectData) {
    return (
      <div className="flex h-[calc(100vh-theme(spacing.12))] w-full items-center justify-center bg-background">
        <p className="text-destructive">Failed to load canvas: {error?.message || "Not found"}</p>
      </div>
    );
  }

  return (
    <ModelsProvider>
      <ReactFlowProvider>
        <InteractionProvider>
          <div className="flex flex-col w-full h-full">
            <CanvasHeader canvasId={canvasId!} initialName={projectData.data.name} />
            <div className="flex h-[calc(100vh-theme(spacing.12)-theme(spacing.14))] w-full items-stretch overflow-hidden">
              <div className="relative flex-1">
                <Canvas canvasId={canvasId!} initialData={projectData.data.canvasJson as any}>
                  <Controls />
                  <Toolbar />
                </Canvas>
              </div>
              <Reasoning />
            </div>
          </div>
        </InteractionProvider>
      </ReactFlowProvider>
    </ModelsProvider>
  );
}
