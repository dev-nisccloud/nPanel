"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Loader, TriangleAlert } from "lucide-react";
import { use } from "react";
import { usePathname } from "next/navigation";

import { useGetProject } from "../../../../../gen-ai/image-gen-studio/_api/use-get-project";
import { Button } from "@/components/ui/button";

// Dynamically import Editor to prevent SSR (Fabric.js is browser-only)
const Editor = dynamic(
  async () => {
    const mod = await import("../../../../../gen-ai/image-gen-studio/_components/editor");
    return { default: mod.Editor };
  },
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full flex-col items-center justify-center">
        <Loader className="text-muted-foreground size-6 animate-spin" />
      </div>
    ),
  }
);

interface EditorProjectIdPageProps {
  params: Promise<{
    slug: string;
    projectId: string;
  }>;
}

const EditorProjectIdPage = ({ params }: EditorProjectIdPageProps) => {
  const { projectId, slug } = use(params);
  const pathname = usePathname();
  const { data, isLoading, isError } = useGetProject(projectId);

  // Extract team slug from pathname (first segment after /)
  const teamSlug = pathname.split("/")[1] || slug;

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
          <Link href={`/${teamSlug}/gen-ai/image-gen-studio`}>Back to Dashboard</Link>
        </Button>
      </div>
    );
  }

  return <Editor initialData={data.data} />;
};

export default EditorProjectIdPage;


