import React from 'react';
import { AlignVerticalJustifyStart, AlignVerticalJustifyCenter, AlignVerticalJustifyEnd } from 'lucide-react';
import { ToggleGroupItem } from '@/components/ui/toggle-group';
import type { ImageProps } from '@usewaypoint/block-image';
import BaseSidebarPanel from '../helpers/BaseSidebarPanel';
import RadioGroupInput from '../helpers/inputs/RadioGroupInput';
import TextDimensionInput from '../helpers/inputs/TextDimensionInput';
import TextInput from '../helpers/inputs/TextInput';
import MultiStylePropertyPanel from '../helpers/style-inputs/MultiStylePropertyPanel';
import { Button } from '@/components/ui/button';
import { uploadFiles } from '@/hooks/use-uploadthing';
import { UPLOAD_ENDPOINTS } from '@/lib/uploadthing';
import { useCreateEmailBuilderLibraryItem } from '../../../_api/use-create-email-builder-library-item';
import { trpc } from '@/utils/trpc';
import { Spinner } from '@/components/npanel-ui/spinner';
import { Textarea } from '@/components/ui/textarea';

type ImageSidebarPanelProps = {
  data: ImageProps;
  setData: (v: ImageProps) => void;
};

export default function ImageSidebarPanel({ data, setData }: ImageSidebarPanelProps) {
  const createLibraryItem = useCreateEmailBuilderLibraryItem();
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // AI image generation (reuses global image generator pipeline, no reference images)
  const [aiPrompt, setAiPrompt] = React.useState('');
  const [currentGenerationId, setCurrentGenerationId] = React.useState<string | null>(null);
  const startGeneration = trpc.imageGenerator.startGeneration.useMutation();
  const generationQuery = trpc.imageGenerator.getGenerationById.useQuery(
    { id: currentGenerationId ?? '' },
    {
      enabled: !!currentGenerationId,
      // Poll while a generation is active; the effect below will clear the id once it completes.
      refetchInterval: 2000,
    },
  );

  const updateData = (d: ImageProps) => {
    setData(d);
  };

  const clearSelectedFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileSelected = (file: File | null) => {
    clearSelectedFile();

    if (!file) return;

    // Restrict to images only
    if (!file.type.startsWith('image/')) {
      return;
    }

    const url = URL.createObjectURL(file);
    setSelectedFile(file);
    setPreviewUrl(url);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    handleFileSelected(file);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const file = event.dataTransfer.files?.[0] ?? null;
    handleFileSelected(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      const response = await uploadFiles(UPLOAD_ENDPOINTS.EMAIL_BUILDER_IMAGE, {
        files: [selectedFile],
      });

      if (!response || response.length === 0) {
        return;
      }

      const file = response[0];
      const fileUrl = (file.ufsUrl || file.url) as string | undefined;
      if (!fileUrl) {
        return;
      }

      // Update the image URL in the editor
      updateData({
        ...data,
        props: {
          ...data.props,
          url: fileUrl,
        },
      });

      // Persist in email builder library for this user (no team context here yet)
      await createLibraryItem.mutateAsync({
        fileName: file.name ?? selectedFile.name,
        fileSize: file.size ?? selectedFile.size,
        mimeType: file.type ?? selectedFile.type ?? 'image/png',
        fileUrl,
        storageKey: file.key ?? undefined,
      });

      clearSelectedFile();
    } finally {
      setIsUploading(false);
    }
  };

  // When AI generation completes, apply first variation image to block
  React.useEffect(() => {
    if (!generationQuery.data) return;

    const gen = generationQuery.data;
    if (gen.status === 'COMPLETED') {
      const firstCompleted = gen.variations.find((v) => v.status === 'COMPLETED' && v.imageUrl);
      if (firstCompleted?.imageUrl) {
        updateData({
          ...data,
          props: {
            ...data.props,
            url: firstCompleted.imageUrl,
          },
        });
      }
      setCurrentGenerationId(null);
    } else if (gen.status === 'FAILED') {
      setCurrentGenerationId(null);
    }
  }, [generationQuery.data, data]);

  const handleStartAiGeneration = async () => {
    if (!aiPrompt.trim()) return;
    if (startGeneration.isPending) return;

    try {
      const result = await startGeneration.mutateAsync({
        prompt: aiPrompt.trim(),
        // No reference images for email builder usage
        aspectRatio: '4:3',
        outputFormat: 'png',
        resolution: '2K',
        variations: 1,
      });
      setCurrentGenerationId(result.generationId);
    } catch {
      // Errors surfaced via trpc's global handler / toasts
    }
  };

  return (
    <BaseSidebarPanel title="Image block">
      <TextInput
        label="Source URL"
        defaultValue={data.props?.url ?? ''}
        onChange={(v) => {
          const url = v.trim().length === 0 ? null : v.trim();
          updateData({ ...data, props: { ...data.props, url } });
        }}
      />
      <div className="mt-3 space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Or upload an image</p>
        <div
          className="rounded-md border border-dashed border-muted-foreground/40 bg-muted/20 px-3 py-4 cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleInputChange}
          />
          {!selectedFile || !previewUrl ? (
            <div className="w-full min-h-[120px] flex flex-col items-center justify-center gap-2 text-xs text-muted-foreground">
              <span>Click to select an image or drag &amp; drop</span>
              <span className="text-[11px]">JPG, PNG, GIF, WEBP, SVG • Max 16MB</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="w-24 h-24 rounded-md overflow-hidden border bg-background">
                <img
                  src={previewUrl}
                  alt={selectedFile.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-xs font-medium truncate w-full text-center">{selectedFile.name}</p>
              <div className="flex items-center justify-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleUpload();
                  }}
                  disabled={isUploading}
                >
                  {isUploading ? 'Uploading…' : 'Upload image'}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={(event) => {
                    event.stopPropagation();
                    clearSelectedFile();
                  }}
                  disabled={isUploading}
                >
                  Remove
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Or generate with AI</p>
        <div className="space-y-2 rounded-md border border-muted-foreground/20 bg-muted/20 px-3 py-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">AI prompt</label>
            <Textarea
              placeholder="Describe the image you want to generate"
              value={aiPrompt}
              onChange={(event) => setAiPrompt(event.target.value)}
              className="min-h-[72px] resize-y text-xs"
            />
          </div>
          <Button
            type="button"
            size="sm"
            className="w-full justify-center"
            onClick={handleStartAiGeneration}
            disabled={!aiPrompt.trim() || startGeneration.isPending || !!currentGenerationId}
          >
            {startGeneration.isPending || currentGenerationId ? (
              <>
                <Spinner size={16} className="mr-2" />
                Generating image...
              </>
            ) : (
              <>Generate image</>
            )}
          </Button>
          {currentGenerationId && (
            <p className="text-[11px] text-muted-foreground text-center">
              This can take up to a minute. The image will appear in this block and in your
              library once ready.
            </p>
          )}
        </div>
      </div>

      <TextInput
        label="Alt text"
        defaultValue={data.props?.alt ?? ''}
        onChange={(alt) => updateData({ ...data, props: { ...data.props, alt } })}
      />
      <TextInput
        label="Click through URL"
        defaultValue={data.props?.linkHref ?? ''}
        onChange={(v) => {
          const linkHref = v.trim().length === 0 ? null : v.trim();
          updateData({ ...data, props: { ...data.props, linkHref } });
        }}
      />
      <div className="flex gap-2">
        <TextDimensionInput
          label="Width"
          defaultValue={data.props?.width}
          onChange={(width) =>
            updateData({
              ...data,
              props: {
                ...data.props,
                width: width === null ? null : Number(width),
              },
            })
          }
        />
        <TextDimensionInput
          label="Height"
          defaultValue={data.props?.height}
          onChange={(height) =>
            updateData({
              ...data,
              props: {
                ...data.props,
                height: height === null ? null : Number(height),
              },
            })
          }
        />
      </div>
      <RadioGroupInput
        label="Alignment"
        defaultValue={data.props?.contentAlignment ?? 'middle'}
        onChange={(contentAlignment) =>
          updateData({
            ...data,
            props: {
              ...data.props,
              contentAlignment: contentAlignment as 'top' | 'middle' | 'bottom' | null,
            },
          })
        }
      >
        <ToggleGroupItem value="top" aria-label="Top">
          <AlignVerticalJustifyStart className="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem value="middle" aria-label="Middle">
          <AlignVerticalJustifyCenter className="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem value="bottom" aria-label="Bottom">
          <AlignVerticalJustifyEnd className="h-4 w-4" />
        </ToggleGroupItem>
      </RadioGroupInput>
      <MultiStylePropertyPanel
        names={['backgroundColor', 'textAlign', 'padding']}
        value={data.style}
        onChange={(style) => updateData({ ...data, style })}
      />
    </BaseSidebarPanel>
  );
}

