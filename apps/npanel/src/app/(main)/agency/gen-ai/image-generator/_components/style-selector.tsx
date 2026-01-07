"use client";

import * as React from "react";
import { Sparkles, Search, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
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
  const [searchQuery, setSearchQuery] = React.useState("");
  const [activeTab, setActiveTab] = React.useState<"all" | "photography" | "artistic">("all");

  const filteredStyles = React.useMemo(() => {
    let styles = STYLE_PRESETS;

    // Filter by category
    if (activeTab !== "all") {
      styles = styles.filter((style) => style.category === activeTab);
    }

    // Filter by search
    if (searchQuery) {
      styles = styles.filter((style) =>
        style.label.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return styles;
  }, [activeTab, searchQuery]);

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
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <div className="flex items-center justify-between">
              <DialogTitle>Apply visual style</DialogTitle>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Search className="h-4 w-4" />
                  <kbd className="px-2 py-1 text-xs font-semibold bg-muted rounded">⌘ K</kbd>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="flex flex-col flex-1 overflow-hidden">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col overflow-hidden">
              <div className="px-6 pt-4 border-b">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="photography">Photography</TabsTrigger>
                  <TabsTrigger value="artistic">Artistic</TabsTrigger>
                  <TabsTrigger value="my-styles" disabled>My styles</TabsTrigger>
                </TabsList>
              </div>

              <div className="px-6 py-4">
                <Input
                  placeholder="Search styles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="mb-4"
                />
              </div>

              <TabsContent value={activeTab} className="flex-1 overflow-y-auto px-6 pb-6 m-0">
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {/* None option */}
                  <button
                    onClick={() => {
                      onStyleSelect(null);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all hover:border-primary",
                      !selectedStyle
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted"
                    )}
                  >
                    <div className="w-full aspect-square rounded-md bg-muted flex items-center justify-center">
                      <span className="text-xs text-muted-foreground">None</span>
                    </div>
                    <span className="text-xs font-medium">None</span>
                  </button>

                  {filteredStyles.map((style) => (
                    <button
                      key={style.value}
                      onClick={() => {
                        onStyleSelect(style.value as StylePreset);
                        setOpen(false);
                      }}
                      className={cn(
                        "flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all hover:border-primary",
                        selectedStyle === style.value
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-muted"
                      )}
                    >
                      <div className="w-full aspect-square rounded-md overflow-hidden">
                        <img
                          src={style.image}
                          alt={style.label}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="text-xs font-medium text-center">{style.label}</span>
                    </button>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

