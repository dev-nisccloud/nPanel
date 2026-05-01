import { useReactFlow } from "@xyflow/react";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { useState } from "react";

import {
  Dropzone,
  DropzoneContent,
  DropzoneEmptyState,
} from "@/routes/_agency.zeepo-canvas/_components/kibo-ui/dropzone";
import { NodeLayout } from "@/routes/_agency.zeepo-canvas/_components/nodes/layout";
import { Skeleton } from "@/components/ui/skeleton";
import { handleError } from "@/routes/_agency.zeepo-canvas/_lib/error/handle";
import { uploadFile } from "@/routes/_agency.zeepo-canvas/_lib/upload";
import type { ImageNodeProps } from ".";

type ImagePrimitiveProps = ImageNodeProps & {
  title: string;
};

export const ImagePrimitive = ({
  data,
  id,
  type,
  title,
}: ImagePrimitiveProps) => {
  const { updateNodeData } = useReactFlow();
  const [files, setFiles] = useState<File[] | undefined>();
  const [isUploading, setIsUploading] = useState(false);

  const handleDrop = async (droppedFiles: File[]) => {
    if (isUploading) {
      return;
    }

    try {
      if (!droppedFiles.length) {
        throw new Error("No file selected");
      }

      setIsUploading(true);
      setFiles(droppedFiles);
      const [file] = droppedFiles;
      const { url, type: contentType } = await uploadFile(file);

      updateNodeData(id, {
        content: {
          url,
          type: contentType,
        },
      });

      updateNodeData(id, {
        description: "Uploaded image",
      });
    } catch (error) {
      handleError("Error uploading image", error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <NodeLayout data={data} id={id} title={title} type={type}>
      {isUploading ? (
        <Skeleton className="flex aspect-video w-full animate-pulse items-center justify-center">
          <Spinner className="text-muted-foreground" size={16} variant="bars" />
        </Skeleton>
      ) : null}
      {!isUploading && data.content && (
        <img
          alt="Image"
          className="h-auto w-full"
          height={data.height ?? 1000}
          src={data.content.url}
          width={data.width ?? 1000}
        />
      )}
      {!(isUploading || data.content) && (
        <Dropzone
          accept={{
            "image/*": [],
          }}
          className="rounded-none border-none bg-transparent p-0 shadow-none hover:bg-transparent dark:bg-transparent dark:hover:bg-transparent"
          maxFiles={1}
          maxSize={1024 * 1024 * 10}
          minSize={1024}
          multiple={false}
          onDrop={handleDrop}
          onError={console.error}
          src={files}
        >
          <DropzoneEmptyState className="p-4" />
          <DropzoneContent />
        </Dropzone>
      )}
    </NodeLayout>
  );
};
