"use client";

import * as React from "react";
import { Check } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

import { MOCK_FACEBOOK_PAGES } from "./mock-data";

export function FacebookPagesTab() {
  const [selectedPageId, setSelectedPageId] = React.useState(MOCK_FACEBOOK_PAGES[0]?.id ?? "");

  return (
    <div className="min-w-0 space-y-6">
      <div className="min-w-0 overflow-x-auto pb-1">
        <div className="flex w-max gap-4 px-1 py-1">
          {MOCK_FACEBOOK_PAGES.map((page) => {
            const selected = page.id === selectedPageId;
            return (
              <button
                key={page.id}
                type="button"
                onClick={() => setSelectedPageId(page.id)}
                className="flex w-[88px] shrink-0 flex-col items-center gap-2"
              >
                <span
                  className={cn(
                    "relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border shadow-sm transition-all",
                    selected ? "border-primary" : "border-muted/60 grayscale",
                  )}
                  style={{ backgroundColor: page.color }}
                >
                  {selected ? (
                    <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-background text-primary">
                      <Check className="h-3 w-3" />
                    </span>
                  ) : null}
                </span>
                <span
                  className={cn(
                    "w-full truncate text-center text-xs font-medium",
                    selected ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {page.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <Tabs defaultValue="analytics" className="w-full">
        <TabsList className="w-fit">
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="calendar">Content calendar</TabsTrigger>
        </TabsList>
        <TabsContent value="analytics" />
        <TabsContent value="posts" />
        <TabsContent value="calendar" />
      </Tabs>
    </div>
  );
}
