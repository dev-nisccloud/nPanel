"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/shadcn-io/spinner";

interface BusinessDescriptionInputProps {
  value: string;
  onChange: (value: string) => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

export function BusinessDescriptionInput({ 
  value, 
  onChange, 
  onGenerate, 
  isGenerating 
}: BusinessDescriptionInputProps) {
  return (
    <Card className="border-0 shadow-lg">
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Business Description Textarea */}
          <div className="space-y-3">
            <div className="relative">
              <textarea
                placeholder="Describe your business, products, or services... For example: 'A modern coffee shop specializing in artisanal blends and sustainable practices, located in downtown Seattle'"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full h-32 md:h-40 p-4 text-base border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 placeholder:text-gray-400 bg-white"
                maxLength={500}
              />
              <div className="absolute bottom-3 right-3 text-xs text-gray-400 bg-white px-1 rounded">
                {value.length}/500
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Be as specific as possible about your business, target audience, location, or unique selling points for better suggestions.
            </p>
          </div>
          
          {/* Generate Button */}
          <div className="flex justify-center">
            <Button 
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white h-12 px-8 shadow-lg"
              disabled={!value.trim() || isGenerating}
              onClick={onGenerate}
            >
              <div className="flex items-center gap-2">
                {isGenerating ? (
                  <>
                    <Spinner variant="ellipsis" className="h-4 w-4" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Generate Domain Ideas</span>
                  </>
                )}
              </div>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
