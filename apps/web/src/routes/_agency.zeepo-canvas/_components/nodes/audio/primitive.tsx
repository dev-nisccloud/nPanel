import { useReactFlow } from "@xyflow/react";
import { useState } from "react";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import {
  Dropzone,
  DropzoneContent,
  DropzoneEmptyState,
} from "@/routes/_agency.zeepo-canvas/_components/kibo-ui/dropzone";
import { NodeLayout } from "@/routes/_agency.zeepo-canvas/_components/nodes/layout";
import { Skeleton } from "@/components/ui/skeleton";
import { handleError } from "@/routes/_agency.zeepo-canvas/_lib/error/handle";
import { uploadFile } from "@/routes/_agency.zeepo-canvas/_lib/upload";
import type { AudioNodeProps } from ".";

type AudioPrimitiveProps = AudioNodeProps & {
  title: string;
};

export const AudioPrimitive = ({
  data,
  id,
  type,
  title,
}: AudioPrimitiveProps) => {
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
    } catch (error) {
      handleError("Error uploading audio", error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <NodeLayout data={data} id={id} title={title} type={type}>
      {isUploading ? (
        <Skeleton className="flex w-full min-w-[300px] animate-pulse items-center justify-center p-4">
          <Spinner className="text-muted-foreground" size={16} variant="bars" />
        </Skeleton>
      ) : null}
      {!isUploading && data.content && (
        <div className="p-4 bg-muted/20">
          <audio
            controls
            className="w-full"
            src={data.content.url}
          />
        </div>
      )}
      {!(isUploading || data.content) && (
        <Dropzone
          accept={{
            "audio/*": [],
          }}
          className="rounded-none border-none bg-transparent shadow-none hover:bg-transparent dark:bg-transparent dark:hover:bg-transparent"
          maxFiles={1}
          maxSize={1024 * 1024 * 20}
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
