"use client";

import { useRouter } from "next/navigation";
import { Loader, TriangleAlert } from "lucide-react";

import { useGetTemplates } from "../_api/use-get-templates";
import { useCreateProject } from "../_api/use-create-project";

import { TemplateCard } from "./template-card";

export const TemplatesSection = () => {
  const router = useRouter();
  const mutation = useCreateProject();

  const { data, isLoading, isError } = useGetTemplates({ page: 1, limit: 4 });

  const onClick = (template: NonNullable<typeof data>["data"][0]) => {
    mutation.mutate(
      {
        name: `${template.name} project`,
        json: template.json,
        width: template.width,
        height: template.height,
      },
      {
        onSuccess: (data) => {
          router.push(`/gen-ai/image-gen-studio/editor/${data.data.id}`);
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Start from a template</h3>
        <div className="flex h-32 items-center justify-center">
          <Loader className="text-muted-foreground size-6 animate-spin" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Start from a template</h3>
        <div className="flex h-32 flex-col items-center justify-center gap-y-4">
          <TriangleAlert className="text-muted-foreground size-6" />
          <p>Failed to load templates</p>
        </div>
      </div>
    );
  }

  if (!data?.data.length) {
    return null;
  }

  return (
    <div>
      <h3 className="text-lg font-semibold">Start from a template</h3>
      <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
        {data?.data.map((template) => (
          <TemplateCard
            key={template.id}
            title={template.name}
            imageSrc={template.thumbnailUrl || ""}
            onClick={() => onClick(template)}
            disabled={mutation.isPending}
            description={`${template.width} x ${template.height} px`}
            width={template.width}
            height={template.height}
          />
        ))}
      </div>
    </div>
  );
};
