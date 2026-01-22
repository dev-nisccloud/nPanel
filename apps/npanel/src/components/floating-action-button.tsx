"use client";

import * as React from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

// Mock data for the popup content
const mockData = [
  {
    id: "1",
    title: "Quick Action 1",
    description: "This is a quick action item",
    icon: "⚡",
  },
  {
    id: "2",
    title: "Quick Action 2",
    description: "Another quick action item",
    icon: "🚀",
  },
  {
    id: "3",
    title: "Quick Action 3",
    description: "Yet another quick action",
    icon: "✨",
  },
  {
    id: "4",
    title: "Quick Action 4",
    description: "One more quick action",
    icon: "🎯",
  },
  {
    id: "5",
    title: "Quick Action 5",
    description: "Final quick action item",
    icon: "💡",
  },
];

interface FloatingActionButtonProps {
  className?: string;
}

export function FloatingActionButton({ className }: FloatingActionButtonProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          size="icon"
          className={cn(
            "fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 hover:shadow-xl transition-all duration-200",
            "bg-primary text-primary-foreground hover:bg-primary/90",
            className
          )}
          aria-label="Open quick actions"
        >
          {isOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Plus className="h-6 w-6" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        side="top"
        sideOffset={16}
        className="w-80 p-0"
      >
        <div className="flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <h3 className="font-semibold text-sm">Quick Actions</h3>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <ScrollArea className="h-[600px]">
            <div className="p-2">
              {mockData.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    // Handle action click
                    console.log("Action clicked:", item.title);
                    setIsOpen(false);
                  }}
                  className="w-full text-left px-4 py-3 rounded-lg hover:bg-accent transition-colors mb-1"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl mt-0.5">{item.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {item.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  );
}
