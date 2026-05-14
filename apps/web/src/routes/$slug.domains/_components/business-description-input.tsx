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
          {/* Business Description Textarea */}
          <div className="space-y-3">
            <style dangerouslySetInnerHTML={{ __html: `
              @keyframes ai-textarea-border {
                0%   { border-color: rgba(124,58,237,0.7); box-shadow: 0 0 8px 1px rgba(124,58,237,0.3); }
                33%  { border-color: rgba(37,99,235,0.7);  box-shadow: 0 0 8px 1px rgba(37,99,235,0.3);  }
                66%  { border-color: rgba(6,182,212,0.7);  box-shadow: 0 0 8px 1px rgba(6,182,212,0.3);  }
                100% { border-color: rgba(124,58,237,0.7); box-shadow: 0 0 8px 1px rgba(124,58,237,0.3); }
              }
              @keyframes aitab-float {
                0%, 100% { transform: translateY(0)    scale(1);    }
                50%       { transform: translateY(-3px) scale(1.2); }
              }
              @keyframes aitab-hue {
                0%   { color: #7c3aed; }
                33%  { color: #2563eb; }
                66%  { color: #06b6d4; }
                100% { color: #7c3aed; }
              }
              .ai-textarea-wrap {
                position: relative;
                border-radius: 12px;
                padding: 2px;
                background: transparent;
                border: 2px solid rgba(124,58,237,0.7);
                animation: ai-textarea-border 6s linear infinite;
                transition: all 0.5s ease;
              }
              .ai-textarea-wrap:focus-within {
                box-shadow: 0 0 15px 3px rgba(124,58,237,0.4);
              }
              .ai-textarea-wrap textarea {
                border: none !important;
                box-shadow: none !important;
                background: transparent !important;
                min-height: 4.5rem !important;
                transition: min-height 0.7s cubic-bezier(0.4, 0, 0.2, 1) !important;
                resize: none !important;
              }
              .ai-textarea-wrap:focus-within textarea,
              .ai-textarea-wrap.has-value textarea {
                min-height: 10rem !important;
              }
              .aitab-icon {
                display: inline-flex;
                align-items: center;
                flex-shrink: 0;
                animation: aitab-float 2.5s ease-in-out infinite, aitab-hue 6s linear infinite;
              }
            `}} />
            <div className={`ai-textarea-wrap ${value.trim() ? 'has-value' : ''}`}>
              <div className="absolute bottom-4 right-4 pointer-events-none z-10 aitab-icon">
                <Sparkles className="h-7 w-7" />
              </div>
              <textarea
                placeholder="Describe your business, products, or services... For example: 'A modern coffee shop specializing in artisanal blends and sustainable practices, located in downtown Seattle'"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full p-4 text-base rounded-lg placeholder:text-gray-400 bg-white"
                maxLength={500}
              />
              <div className="absolute bottom-3 right-3 text-xs text-gray-400 bg-white/80 px-1 rounded">
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
