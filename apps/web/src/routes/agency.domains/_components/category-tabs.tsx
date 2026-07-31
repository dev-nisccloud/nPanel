"use client";

import * as React from "react";
import { 
  Globe, 
  Building, 
  GraduationCap, 
  Cpu, 
  Briefcase, 
  Play, 
  Heart, 
  Grid3X3,
  Users,
  ShoppingCart,
  Wrench,
  Flag
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { getTldExtensionsByCategory } from "@/utils";

interface CategoryTabsProps {
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
}

// Map category names to icons
const categoryIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  "Popular": Globe,
  "Business": Building,
  "Education": GraduationCap,
  "International": Flag,
  "Technology": Cpu,
  "Social & Personal": Users,
  "Professional & Services": Briefcase,
  "Media & Entertainment": Play,
  "E-commerce & Shopping": ShoppingCart,
  "Industry & Sector": Wrench,
  "Lifestyle & Hobbies": Heart,
  "Country Codes": Flag,
};

// Get categories from TLD utility
const tldCategories = getTldExtensionsByCategory();

// Create categories array with proper mapping
const categories = tldCategories.map(category => ({
  value: category.name.toLowerCase().replace(/[^a-z]/g, ''), // Convert to simple key
  icon: categoryIconMap[category.name] || Grid3X3,
  label: category.name,
  originalName: category.name,
}));

export function CategoryTabs({ value, onValueChange, className }: CategoryTabsProps) {
  return (
    <Tabs value={value} onValueChange={onValueChange} className={className}>
      <div className="relative w-full">
        {/* ScrollArea with visible horizontal scrollbar on all screen sizes */}
        <ScrollArea className="w-full -mx-4 px-4 sm:mx-0 sm:px-0">
          <TabsList className="inline-flex h-auto w-max min-w-full sm:min-w-0 gap-2 sm:gap-2.5 md:gap-3 p-2 sm:p-2.5 pb-2.5 mb-1.5 bg-muted/50 rounded-lg border border-border/50">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <TabsTrigger 
                  key={category.value}
                  value={category.value} 
                  className="flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 px-4 sm:px-5 md:px-6 text-xs sm:text-sm font-medium min-w-[70px] sm:min-w-[90px] md:min-w-[110px] lg:min-w-[130px] transition-all duration-200 hover:bg-primary/10 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm rounded-md whitespace-nowrap flex-shrink-0"
                >
                  <Icon className="h-4 w-4 sm:h-4 sm:w-4 md:h-5 md:w-5 flex-shrink-0" />
                  <span className="text-[10px] sm:text-xs md:text-sm leading-tight text-center">
                    {/* Show abbreviated text on mobile, full on larger screens */}
                    <span className="block sm:hidden">
                      {category.label.length > 8 ? category.label.substring(0, 6) + '..' : category.label}
                    </span>
                    <span className="hidden sm:block md:hidden">
                      {category.label.length > 12 ? category.label.substring(0, 10) + '..' : category.label}
                    </span>
                    <span className="hidden md:block">
                      {category.label}
                    </span>
                  </span>
                </TabsTrigger>
              );
            })}
          </TabsList>
          <ScrollBar orientation="horizontal" className="mt-0.5" />
        </ScrollArea>
      </div>
    </Tabs>
  );
}

