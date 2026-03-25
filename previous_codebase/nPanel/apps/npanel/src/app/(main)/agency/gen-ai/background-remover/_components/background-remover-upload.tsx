"use client";

import * as React from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { Dropzone, DropzoneContent, DropzoneEmptyState } from "@/components/ui/shadcn-io/dropzone";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { trpc } from "@/utils/trpc";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/shadcn-io/spinner";

type OutputFormat = "webp" | "jpeg" | "png";

interface BackgroundRemoverUploadProps {
  onImageUpload: (file: File) => void;
  onProcess: (imageData: { dataUrl: string; mimeType: string }) => void;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
  disabled?: boolean;
}

export function BackgroundRemoverUpload({
  onImageUpload,
  onProcess,
  isProcessing,
  setIsProcessing,
  disabled,
}: BackgroundRemoverUploadProps) {
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [outputFormat, setOutputFormat] = React.useState<OutputFormat>("png");

  const utils = trpc.useUtils();
  const removeBackgroundMutation = trpc.stabilityAi.removeBackground.useMutation({
    onSuccess: (data) => {
      const imageData = {
        dataUrl: `data:${data.mimeType};base64,${data.image}`,
        mimeType: data.mimeType,
      };
      onProcess(imageData);
      setIsProcessing(false);
      toast.success("Background removed successfully!");
    },
    onError: (error) => {
      setIsProcessing(false);
      toast.error(`Failed to remove background: ${error.message}`);
    },
  });

  const handleDrop = React.useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image file");
        return;
      }

      setSelectedFile(file);
      onImageUpload(file);
    },
    [onImageUpload]
  );

  const handleRemoveFile = React.useCallback(() => {
    setSelectedFile(null);
  }, []);

  const handleProcess = async () => {
    if (!selectedFile) {
      toast.error("Please select an image first");
      return;
    }

    setIsProcessing(true);

    try {
      // Convert file to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Remove data URL prefix (e.g., "data:image/png;base64,")
          const base64Data = result.split(",")[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });

      await removeBackgroundMutation.mutateAsync({
        image: base64,
        outputFormat,
      });
    } catch (error) {
      console.error("Error processing image:", error);
      setIsProcessing(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Dropzone */}
        <div className="space-y-2">
          <Label>Upload Image</Label>
          {!selectedFile ? (
            <Dropzone
              onDrop={handleDrop}
              accept={{
                "image/*": [".png", ".jpg", ".jpeg", ".webp"],
              }}
              maxFiles={1}
              maxSize={10 * 1024 * 1024} // 10MB
              disabled={disabled || isProcessing}
              className="border-2 border-dashed"
            >
              <DropzoneEmptyState>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="mb-4 p-4 bg-primary/10 rounded-full">
                    <Upload className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Drop your image here</h3>
                  <p className="text-sm text-muted-foreground mb-1">
                    or click to browse
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Maximum file size: 10MB
                  </p>
                </div>
              </DropzoneEmptyState>
            </Dropzone>
          ) : (
            <div className="relative border-2 border-dashed rounded-lg p-4">
              <div className="flex items-center gap-4">
                <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                  <img
                    src={URL.createObjectURL(selectedFile)}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleRemoveFile}
                  disabled={disabled || isProcessing}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Output Format Selector */}
        <div className="space-y-2">
          <Label>Output Format</Label>
          <Select
            value={outputFormat}
            onValueChange={(value) => setOutputFormat(value as OutputFormat)}
            disabled={disabled || isProcessing}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="png">PNG</SelectItem>
              <SelectItem value="jpeg">JPEG</SelectItem>
              <SelectItem value="webp">WebP</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Process Button */}
        <Button
          onClick={handleProcess}
          disabled={!selectedFile || disabled || isProcessing}
          className="w-full"
          size="lg"
        >
          {isProcessing ? (
            <>
              <Spinner className="mr-2 h-4 w-4" />
              Processing...
            </>
          ) : (
            <>
              <ImageIcon className="mr-2 h-4 w-4" />
              Remove Background
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}

