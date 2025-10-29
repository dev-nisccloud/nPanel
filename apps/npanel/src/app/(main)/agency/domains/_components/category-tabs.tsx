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
import { getTldExtensionsByCategory } from "@nPanel/utils";

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
      <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-1 h-auto p-1">
        {categories.map((category) => {
          const Icon = category.icon;
          return (
            <TabsTrigger 
              key={category.value}
              value={category.value} 
              className="flex flex-col items-center gap-1 py-2 px-2 text-xs"
            >
              <Icon className="h-3 w-3" />
              <span className="hidden sm:inline">{category.label}</span>
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
}
