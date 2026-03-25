"use client";

import * as React from "react";
import { Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImagePickerProps {
  onImagesSelected: (files: File[]) => void;
  maxImages: number;
}

export function ImagePicker({ onImagesSelected, maxImages }: ImagePickerProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const validFiles = files.slice(0, maxImages);
      onImagesSelected(validFiles);
    }
    // Reset input so same file can be selected again
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="hidden"
        disabled={maxImages <= 0}
      />
      <Button
        variant="outline"
        size="icon"
        onClick={handleClick}
        disabled={maxImages <= 0}
        title="Upload images (max 3)"
      >
        <ImageIcon className="h-4 w-4" />
      </Button>
    </>
  );
}

