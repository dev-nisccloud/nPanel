"use client";

import * as React from "react";
import { AI_DOMAIN_SUGGESTION_COUNT } from "@npanel/api/lib/ai-domain-search-constants";

interface AISuggestion {
  name: string;
  description?: string;
  confidence?: number;
}

interface AIGenerationResponse {
  success: boolean;
  suggestions: string[];
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  error?: string;
}

export function useAIDomainGeneration() {
  const [businessDescription, setBusinessDescription] = React.useState("");
  const [aiSuggestions, setAiSuggestions] = React.useState<AISuggestion[]>([]);
  const [aiActiveTab, setAiActiveTab] = React.useState("popular");
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [checkingCount, setCheckingCount] = React.useState(0);
  const [totalCount, setTotalCount] = React.useState(0);

  // AI Generation handler with real API
  const handleGenerateAI = React.useCallback(async () => {
    if (!businessDescription.trim()) return;
    
    setIsGenerating(true);
    setError(null);
    
    try {
      const response = await fetch('/api/ai/generate-domains', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessDescription: businessDescription.trim(),
          count: AI_DOMAIN_SUGGESTION_COUNT,
        }),
      });

      const data: AIGenerationResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate domain suggestions');
      }

      // Convert API response to AISuggestion format
      const suggestions: AISuggestion[] = data.suggestions.map((name, index) => ({
        name: name.toLowerCase().replace(/\s+/g, ''), // Remove spaces and make lowercase
        description: `AI-generated suggestion ${index + 1}`,
        confidence: Math.max(0.7, 1 - (index * 0.05)), // Decreasing confidence
      }));

      setAiSuggestions(suggestions);
      setTotalCount(suggestions.length);
      setCheckingCount(0);
    } catch (err) {
      console.error('AI generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate suggestions');
      
      // Fallback to mock suggestions on error
      const fallbackSuggestions: AISuggestion[] = [
        { name: "innovate", description: "Innovation-focused", confidence: 0.9 },
        { name: "creativestudio", description: "Creative solutions", confidence: 0.85 },
        { name: "digitalhub", description: "Digital platform", confidence: 0.8 },
        { name: "nexus", description: "Connection point", confidence: 0.75 },
        { name: "pinnacle", description: "Peak performance", confidence: 0.7 },
        { name: "vertex", description: "Strategic point", confidence: 0.65 },
        { name: "launchpad", description: "Growth launch", confidence: 0.6 },
        { name: "brightpath", description: "Clear direction", confidence: 0.55 },
        { name: "corestack", description: "Tech foundation", confidence: 0.5 },
        { name: "flowstate", description: "Smooth operations", confidence: 0.45 },
        { name: "northline", description: "Guidance brand", confidence: 0.4 },
        { name: "sparkworks", description: "Creative energy", confidence: 0.35 },
      ].slice(0, AI_DOMAIN_SUGGESTION_COUNT);
      setAiSuggestions(fallbackSuggestions);
      setTotalCount(fallbackSuggestions.length);
      setCheckingCount(0);
    } finally {
      setIsGenerating(false);
    }
  }, [businessDescription]);

  const clearSuggestions = React.useCallback(() => {
    setAiSuggestions([]);
    setError(null);
    setCheckingCount(0);
    setTotalCount(0);
  }, []);

  return {
    businessDescription,
    setBusinessDescription,
    aiSuggestions,
    aiActiveTab,
    setAiActiveTab,
    isGenerating,
    error,
    checkingCount,
    totalCount,
    setCheckingCount,
    handleGenerateAI,
    clearSuggestions,
  };
}
