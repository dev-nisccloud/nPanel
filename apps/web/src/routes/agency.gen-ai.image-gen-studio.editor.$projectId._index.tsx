"use client";

import * as React from "react";
import { Link, useParams } from "react-router";
import { Loader, TriangleAlert } from "lucide-react";
 
import { useGetProject } from "./_agency.gen-ai/image-gen-studio/_api/use-get-project";
import { Button } from "@/components/ui/button";
 
const Editor = React.lazy(async () => {
  const mod = await import("./_agency.gen-ai/image-gen-studio/_components/editor");
  return { default: mod.Editor };
});
 
const editorFallback = (
  <div className="flex h-full flex-col items-center justify-center">
    <Loader className="text-muted-foreground size-6 animate-spin" />
  </div>
);
 
const EditorProjectIdPage = () => {
  const { projectId } = useParams();
  const { data, isLoading, isError } = useGetProject(projectId as string);

  if (isLoading || !data) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <Loader className="text-muted-foreground size-6 animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-y-5">
        <TriangleAlert className="text-muted-foreground size-6" />
        <p className="text-muted-foreground text-sm">Failed to fetch project</p>
        <Button asChild variant="secondary">
          <Link to="/agency/gen-ai/image-gen-studio">Back to Dashboard</Link>
        </Button>
      </div>
    );
  }

  return (
    <React.Suspense fallback={editorFallback}>
      <Editor initialData={data.data} />
    </React.Suspense>
  );
};

export default EditorProjectIdPage;
