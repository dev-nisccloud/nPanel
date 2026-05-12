"use client";

import * as React from "react";
import { AlertCircle, Sparkles } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { CurrencyProvider } from "./currency-context";
import { DomainSearchResults } from "./domain-search-results";
import { useDomainSearch } from "./use-domain-search";
import { trpc, type RouterOutputs } from "@/utils/trpc";

const MIN_DESCRIPTION_LENGTH = 40;

type NameSuggestion =
  RouterOutputs["aiDomainSearch"]["generateNameIdeas"]["suggestions"][number];

export function AiDomainSearch() {
  return (
    <CurrencyProvider>
      <AiDomainSearchInner />
    </CurrencyProvider>
  );
}

function AiDomainSearchInner() {
  const [description, setDescription] = React.useState("");
  const [suggestions, setSuggestions] = React.useState<NameSuggestion[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);

  const domainSearch = useDomainSearch();

  const generateIdeas = trpc.aiDomainSearch.generateNameIdeas.useMutation({
    onMutate: () => {
      setSuggestions([]);
    },
    onSuccess: (data) => {
      setSuggestions(data.suggestions);
    },
  });

  const trimmedDescription = description.trim();
  const canGenerate =
    trimmedDescription.length >= MIN_DESCRIPTION_LENGTH && !generateIdeas.isPending;

  const showDomainSearchBlock = Boolean(domainSearch.searchQueryName);

  const handleSearchDomainFromRow = (domainLabel: string) => {
    const result = domainSearch.triggerSearch(domainLabel);
    if (result.started && result.changed) {
      setIsSearching(true);
    }
  };

  const handleGenerate = () => {
    if (!canGenerate) return;
    generateIdeas.mutate({ businessDescription: trimmedDescription });
  };

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="text-center space-y-1">
              <h2 className="text-base font-semibold tracking-tight">AI Domain Search</h2>
              <p className="text-xs text-muted-foreground max-w-2xl mx-auto">
                Describe your business in detail. We will suggest brand names and registrable domain labels
                you can check below.
              </p>
            </div>

            {domainSearch.error && (
              <Alert variant="destructive" className="max-w-2xl mx-auto">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{domainSearch.error}</AlertDescription>
              </Alert>
            )}

            {generateIdeas.isError && (
              <Alert variant="destructive" className="max-w-2xl mx-auto">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{generateIdeas.error.message}</AlertDescription>
              </Alert>
            )}

            <div className="max-w-2xl mx-auto space-y-3">
              <Textarea
                placeholder="Enter a detailed description of your business: what you offer, who you serve, your tone and values, location or market, and any words or themes you want reflected in your domain."
                className="min-h-[12rem] resize-y text-base leading-relaxed"
                aria-label="Business description for AI domain search"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={generateIdeas.isPending}
              />
              <p className="text-xs text-muted-foreground text-center">
                At least {MIN_DESCRIPTION_LENGTH} characters required for AI suggestions.
              </p>
              <div className="flex justify-end">
                <Button
                  type="button"
                  size="lg"
                  className="h-12 px-8"
                  disabled={!canGenerate}
                  onClick={handleGenerate}
                >
                  {generateIdeas.isPending ? (
                    <>
                      <Spinner variant="ellipsis" className="h-4 w-4 mr-2" />
                      Generating ideas...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Search
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {(generateIdeas.isPending || suggestions.length > 0) && (
        <div className="max-w-7xl mx-auto w-full space-y-3">
          <div className="flex items-center gap-2 px-1">
            <Sparkles className="h-4 w-4 text-muted-foreground" aria-hidden />
            <h3 className="text-sm font-semibold tracking-tight">AI-generated name ideas</h3>
          </div>
          {generateIdeas.isPending ? (
            <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 list-none p-0 m-0">
              {Array.from({ length: 6 }, (_, i) => (
                <li key={i} className="min-w-0">
                  <Card className="border border-border/80 shadow-sm h-full flex flex-col">
                    <CardContent className="p-5 flex flex-col flex-1 gap-4">
                      <div className="space-y-2">
                        <Skeleton className="h-3 w-28" />
                        <Skeleton className="h-7 w-full max-w-[14rem]" />
                      </div>
                      <div className="space-y-2 pt-2 border-t border-border/60">
                        <Skeleton className="h-3 w-36" />
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-4/5" />
                      </div>
                      <div className="space-y-2 pt-2 border-t border-border/60">
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-7 w-full max-w-[12rem]" />
                      </div>
                      <div className="mt-auto pt-4 border-t border-border/60 flex justify-end">
                        <Skeleton className="h-9 w-32 rounded-md" />
                      </div>
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          ) : (
            <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 list-none p-0 m-0">
              {suggestions.map((row, index) => (
                <li key={`${index}-${row.domainName}`} className="min-w-0">
                  <Card className="border border-border/80 shadow-sm h-full flex flex-col">
                    <CardContent className="p-5 flex flex-col flex-1 gap-0">
                      <div className="space-y-4 flex-1">
                        <div className="space-y-1.5">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            AI business name
                          </p>
                          <p className="text-lg font-semibold tracking-tight text-primary leading-snug">
                            {row.businessName}
                          </p>
                        </div>
                        <div className="space-y-1.5 pt-1 border-t border-border/60">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            AI business description
                          </p>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {row.businessDescription}
                          </p>
                        </div>
                        <div className="space-y-1.5 pt-1 border-t border-border/60">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            AI domain name
                          </p>
                          <p className="text-lg font-semibold tracking-tight text-primary leading-snug break-words">
                            {row.domainName}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-border/60 flex justify-end shrink-0">
                        <Button
                          type="button"
                          size="sm"
                          className="shrink-0"
                          title="Open Domain Search to check availability and pricing for this domain"
                          disabled={isSearching}
                          onClick={() => handleSearchDomainFromRow(row.domainName)}
                        >
                          {isSearching ? (
                            <>
                              <Spinner variant="ellipsis" className="h-4 w-4 mr-2" />
                              Searching...
                            </>
                          ) : (
                            "Search domain"
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {showDomainSearchBlock && (
        <div className="max-w-7xl mx-auto w-full">
          <DomainSearchResults
            searchQuery={domainSearch.searchQueryName}
            rawSearchQuery={domainSearch.rawSearchQueryForResults}
            error={domainSearch.error}
            isDomainInCart={domainSearch.isDomainInCart}
            onAddToCart={domainSearch.handleAddToCart}
            onRemoveFromCart={domainSearch.handleRemoveFromCart}
            onLoadingChange={setIsSearching}
          />
        </div>
      )}
    </div>
  );
}
