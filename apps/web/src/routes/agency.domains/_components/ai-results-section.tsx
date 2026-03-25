"use client";

import * as React from "react";
import { X, CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { Badge } from "@/components/ui/badge";
import { CategoryTabs } from "./category-tabs";
import { AIDomainCard } from "./ai-domain-card";
import { useProgressiveDomainCheck } from "./use-progressive-domain-check";
import type { DomainSearchResult } from "./domain-search";

interface AISuggestion {
  name: string;
  description?: string;
  confidence?: number;
}

interface AIResultsSectionProps {
  suggestions: AISuggestion[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  onClearResults: () => void;
  onAddToCart: (result: DomainSearchResult) => void;
  onRemoveFromCart: (domain: string) => void;
  isDomainInCart: (domain: string) => boolean;
  isGenerating?: boolean;
  error?: string | null;
  checkingCount?: number;
  totalCount?: number;
}

export function AIResultsSection({
  suggestions,
  activeTab,
  onTabChange,
  onClearResults,
  onAddToCart,
  onRemoveFromCart,
  isDomainInCart,
  isGenerating = false,
  error = null,
  checkingCount = 0,
  totalCount = 0,
}: AIResultsSectionProps) {
  const progressiveCheck = useProgressiveDomainCheck();
  const [hasStartedProcessing, setHasStartedProcessing] = React.useState(false);
  
  // Start processing when suggestions are available and not generating
  React.useEffect(() => {
    if (suggestions.length > 0 && !isGenerating && !hasStartedProcessing && !progressiveCheck.isProcessing) {
      setHasStartedProcessing(true);
      
      progressiveCheck.processSuggestionsSequentially(
        suggestions,
        activeTab,
        (suggestionName, results, isComplete) => {
          // Individual suggestion completed
          console.log(`Completed checking ${suggestionName}:`, results.length, 'domains');
        },
        (suggestionName, errorMessage) => {
          // Individual suggestion failed
          console.error(`Failed to check ${suggestionName}:`, errorMessage);
        }
      );
    }
  }, [suggestions, isGenerating, hasStartedProcessing, activeTab, progressiveCheck]);

  // Re-process suggestions when active tab changes (for different TLD extensions)
  React.useEffect(() => {
    if (suggestions.length > 0 && !isGenerating && hasStartedProcessing && !progressiveCheck.isProcessing) {
      // Check if we already have results for this tab
      const hasResultsForTab = suggestions.some(suggestion => 
        progressiveCheck.isSuggestionComplete(suggestion.name, activeTab)
      );
      
      // Only re-process if we don't have cached results for this tab
      if (!hasResultsForTab) {
        progressiveCheck.processSuggestionsSequentially(
          suggestions,
          activeTab,
          (suggestionName, results, isComplete) => {
            // Individual suggestion completed
          },
          (suggestionName, errorMessage) => {
            // Individual suggestion failed
          }
        );
      }
    }
  }, [activeTab]); // Only depend on activeTab change

  // Reset when suggestions change
  React.useEffect(() => {
    if (suggestions.length === 0) {
      setHasStartedProcessing(false);
      progressiveCheck.resetState();
    }
  }, [suggestions.length, progressiveCheck]);

  const actualCheckingCount = progressiveCheck.isProcessing ? progressiveCheck.currentSuggestionIndex + 1 : suggestions.length;
  const actualTotalCount = suggestions.length;

  if (suggestions.length === 0 && !isGenerating && !error) return null;

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">AI Generated Suggestions</h3>
          <p className="text-sm text-gray-600 mt-1">
            {isGenerating 
              ? "Generating domain suggestions..." 
              : error 
                ? "Error generating suggestions"
                : progressiveCheck.isProcessing
                  ? `Checking availability for ${actualCheckingCount}/${actualTotalCount} suggestions...`
                  : `${suggestions.length} domain names generated from your description`
            }
          </p>
          {progressiveCheck.isProcessing && (
            <div className="mt-2 flex items-center gap-2">
              <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800 border-blue-200">
                <Clock className="h-3 w-3 mr-1" />
                Checking domains sequentially
              </Badge>
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(actualCheckingCount / actualTotalCount) * 100}%` }}
                ></div>
              </div>
              <span className="text-xs text-gray-500">{Math.round((actualCheckingCount / actualTotalCount) * 100)}%</span>
            </div>
          )}
        </div>
        {!isGenerating && suggestions.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClearResults}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-4 w-4 mr-2" />
            Clear Results
          </Button>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <X className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Generation Failed</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isGenerating && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-8">
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-3">
              <Spinner variant="ellipsis" className="h-6 w-6 text-blue-600" />
              <div className="text-center">
                <p className="text-sm font-medium text-blue-800">AI is generating domain suggestions...</p>
                <p className="text-xs text-blue-600 mt-1">This may take a few moments</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Tabs */}
      <CategoryTabs value={activeTab} onValueChange={onTabChange} />

      {/* AI Domain Cards */}
              <div className="mt-6 space-y-4">
                {suggestions.map((suggestion, index) => (
                  <AIDomainCard
                    key={`${suggestion.name}-${index}`}
                    suggestion={suggestion}
                    activeTab={activeTab}
                    onAddToCart={onAddToCart}
                    onRemoveFromCart={onRemoveFromCart}
                    isDomainInCart={isDomainInCart}
                    domainResults={progressiveCheck.getResults(suggestion.name, activeTab)}
                    error={progressiveCheck.getError(suggestion.name, activeTab)}
                    isChecking={progressiveCheck.isProcessing && progressiveCheck.currentSuggestionIndex === index}
                    isComplete={progressiveCheck.isSuggestionComplete(suggestion.name, activeTab)}
                  />
                ))}
              </div>
    </div>
  );
}
