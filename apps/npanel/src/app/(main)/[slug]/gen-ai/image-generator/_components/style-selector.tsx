"use client";

import * as React from "react";
import { Sparkles, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

type StylePreset =
  | "3d-model"
  | "analog-film"
  | "anime"
  | "cinematic"
  | "comic-book"
  | "digital-art"
  | "enhance"
  | "fantasy-art"
  | "isometric"
  | "line-art"
  | "low-poly"
  | "modeling-compound"
  | "neon-punk"
  | "origami"
  | "photographic"
  | "pixel-art"
  | "tile-texture";

const STYLE_PRESETS = [
  { value: "photographic", label: "Photographic", category: "photography" as const, image: "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=200&h=200&fit=crop" },
  { value: "cinematic", label: "Cinematic", category: "photography" as const, image: "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=200&h=200&fit=crop" },
  { value: "3d-model", label: "3D Model", category: "artistic" as const, image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&h=200&fit=crop" },
  { value: "anime", label: "Anime", category: "artistic" as const, image: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=200&h=200&fit=crop" },
  { value: "digital-art", label: "Digital Art", category: "artistic" as const, image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=200&h=200&fit=crop" },
  { value: "fantasy-art", label: "Fantasy Art", category: "artistic" as const, image: "https://images.unsplash.com/photo-1536431311719-398b6704d4cc?w=200&h=200&fit=crop" },
  { value: "isometric", label: "Isometric", category: "artistic" as const, image: "https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=200&h=200&fit=crop" },
  { value: "comic-book", label: "Comic Book", category: "artistic" as const, image: "https://images.unsplash.com/photo-1541963463532-d68292c34d19?w=200&h=200&fit=crop" },
  { value: "analog-film", label: "Analog Film", category: "photography" as const, image: "https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=200&h=200&fit=crop" },
  { value: "neon-punk", label: "Neon Punk", category: "artistic" as const, image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=200&h=200&fit=crop" },
  { value: "line-art", label: "Line Art", category: "artistic" as const, image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=200&h=200&fit=crop" },
  { value: "low-poly", label: "Low Poly", category: "artistic" as const, image: "https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=200&h=200&fit=crop" },
  { value: "pixel-art", label: "Pixel Art", category: "artistic" as const, image: "https://images.unsplash.com/photo-1612198188060-c7c2a3b66eae?w=200&h=200&fit=crop" },
  { value: "origami", label: "Origami", category: "artistic" as const, image: "https://images.unsplash.com/photo-1605617377725-38a0d1752c4d?w=200&h=200&fit=crop" },
  { value: "tile-texture", label: "Tile Texture", category: "artistic" as const, image: "https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?w=200&h=200&fit=crop" },
  { value: "enhance", label: "Enhance", category: "photography" as const, image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=200&h=200&fit=crop" },
  { value: "modeling-compound", label: "Modeling Compound", category: "artistic" as const, image: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=200&h=200&fit=crop" },
];

interface StyleSelectorProps {
  selectedStyle: StylePreset | null;
  onStyleSelect: (style: StylePreset | null) => void;
  disabled?: boolean;
}

export function StyleSelector({ selectedStyle, onStyleSelect, disabled }: StyleSelectorProps) {
  const [open, setOpen] = React.useState(false);

  const selectedStyleData = selectedStyle
    ? STYLE_PRESETS.find((s) => s.value === selectedStyle)
    : null;

  return (
    <>
      <Button
        variant="ghost"
        onClick={() => setOpen(true)}
        disabled={disabled}
        className="h-8 gap-1.5 px-2 text-xs rounded-md bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 focus-visible:ring-1 focus-visible:ring-offset-0 focus-visible:ring-blue-500"
      >
        <Sparkles className="h-3.5 w-3.5" />
        {selectedStyleData ? selectedStyleData.label : "Auto style"}
        <ChevronDown className="h-3 w-3 opacity-50" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-7xl w-[95vw] max-h-[90vh] h-[90vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="px-8 pt-8 pb-6 border-b flex-shrink-0">
            <DialogTitle className="text-primary text-2xl font-semibold">Apply visual style</DialogTitle>
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="px-6 py-6">
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
                  {/* No style option */}
                  <button
                    onClick={() => {
                      onStyleSelect(null);
                      setOpen(false);
                    }}
                    className={cn(
                      "relative w-full aspect-square rounded-2xl border-2 transition-all overflow-hidden group",
                      !selectedStyle
                        ? "border-primary ring-2 ring-primary ring-offset-2"
                        : "border-border hover:border-primary"
                    )}
                  >
                    <div className="w-full h-full bg-muted flex items-end justify-center pb-4">
                      <span className="text-base font-semibold text-muted-foreground">No style</span>
                    </div>
                    <div className="hidden md:block absolute top-0 left-0 right-0 bottom-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                        <span className="text-sm font-semibold text-white px-4 py-2 bg-primary rounded-lg shadow-lg whitespace-nowrap">Apply style</span>
                      </div>
                    </div>
                  </button>

                  {STYLE_PRESETS.map((style) => (
                    <button
                      key={style.value}
                      onClick={() => {
                        onStyleSelect(style.value as StylePreset);
                        setOpen(false);
                      }}
                      className={cn(
                        "relative w-full aspect-square rounded-2xl border-2 transition-all overflow-hidden group",
                        selectedStyle === style.value
                          ? "border-primary ring-2 ring-primary ring-offset-2"
                          : "border-border hover:border-primary"
                      )}
                    >
                      <div className="w-full h-full">
                        <img
                          src={style.image}
                          alt={style.label}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex items-end justify-center pb-4 z-0">
                        <span className="text-base font-semibold text-white drop-shadow-lg text-center px-4">{style.label}</span>
                      </div>
                      <div className="hidden md:block absolute top-0 left-0 right-0 bottom-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                          <span className="text-sm font-semibold text-white px-4 py-2 bg-primary rounded-lg shadow-lg whitespace-nowrap">Apply style</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <ScrollBar orientation="vertical" />
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

