"use client";

import * as React from "react";
import { Search, Loader2, CheckCircle, XCircle, AlertCircle, Globe, DollarSign, Clock } from "lucide-react";
import { useQuery } from '@tanstack/react-query';

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";

import type { OpenproviderDomainCheckResult } from "@/types/openprovider";

// Popular TLDs list
const POPULAR_TLDS = [
  { value: 'com', label: '.com', description: 'Commercial (Most Popular)' },
  { value: 'org', label: '.org', description: 'Organization' },
  { value: 'net', label: '.net', description: 'Network' },
  { value: 'io', label: '.io', description: 'Tech/Startup' },
  { value: 'co', label: '.co', description: 'Company' },
  { value: 'dev', label: '.dev', description: 'Developer' },
  { value: 'ai', label: '.ai', description: 'Artificial Intelligence' },
  { value: 'me', label: '.me', description: 'Personal' },
  { value: 'pro', label: '.pro', description: 'Professional' },
  { value: 'biz', label: '.biz', description: 'Business' },
  { value: 'info', label: '.info', description: 'Information' },
  { value: 'app', label: '.app', description: 'Applications' },
  { value: 'tech', label: '.tech', description: 'Technology' },
  { value: 'online', label: '.online', description: 'Online Services' },
  { value: 'site', label: '.site', description: 'Website' },
  { value: 'store', label: '.store', description: 'E-commerce' },
  { value: 'blog', label: '.blog', description: 'Blogging' },
  { value: 'news', label: '.news', description: 'News' },
  { value: 'tv', label: '.tv', description: 'Television' },
  { value: 'live', label: '.live', description: 'Live Streaming' },
  { value: 'work', label: '.work', description: 'Workplace' },
  { value: 'space', label: '.space', description: 'Creative Space' },
  { value: 'world', label: '.world', description: 'Global' },
  { value: 'today', label: '.today', description: 'Current Events' },
  { value: 'xyz', label: '.xyz', description: 'Universal' }
];

interface DomainSearchProps {
  // No props needed for now
}

export function DomainSearch({}: DomainSearchProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [searchMode, setSearchMode] = React.useState<"popular" | "custom">("popular");
  const [selectedTlds, setSelectedTlds] = React.useState<string[]>([]);
  const [customExtensions, setCustomExtensions] = React.useState<string[]>([]);
  const [extensionInput, setExtensionInput] = React.useState("");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [isSearching, setIsSearching] = React.useState(false);
  const [tldPopoverOpen, setTldPopoverOpen] = React.useState(false);

  // State for accumulated results
  const [allResults, setAllResults] = React.useState<OpenproviderDomainCheckResult[]>([]);
  const [paginationInfo, setPaginationInfo] = React.useState<any>(null);

  // Domain search query
  const {
    data: searchResults,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['domain-search', searchQuery, searchMode, selectedTlds, customExtensions, currentPage],
    queryFn: async () => {
      if (!searchQuery.trim()) return null;

      const requestBody: any = {
        name: searchQuery.trim(),
        with_price: true,
        with_whois: true,
      };

      // Determine which extensions to use based on search mode
      const extensionsToUse = searchMode === "popular" ? selectedTlds : customExtensions;
      
      if (extensionsToUse.length > 0) {
        requestBody.extensions = extensionsToUse;
      }

      const response = await fetch('/api/openprovider/domains/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to search domains');
      }

      return response.json();
    },
    enabled: false, // Only run when manually triggered
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Update accumulated results when new data comes in
  React.useEffect(() => {
    if (searchResults?.data?.results) {
      if (currentPage === 1) {
        // First page - replace all results
        setAllResults(searchResults.data.results);
      } else {
        // Subsequent pages - append results
        setAllResults(prev => [...prev, ...searchResults.data.results]);
      }
      setPaginationInfo(searchResults.meta?.pagination);
    }
  }, [searchResults, currentPage]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setCurrentPage(1);
    setAllResults([]); // Clear previous results
    await refetch();
    setIsSearching(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const addCustomExtension = () => {
    const input = extensionInput.trim();
    if (!input) return;

    // Handle multiple extensions separated by commas
    const newExtensions = input
      .split(',')
      .map(ext => ext.trim())
      .filter(ext => ext && !customExtensions.includes(ext));

    if (newExtensions.length > 0) {
      setCustomExtensions([...customExtensions, ...newExtensions]);
      setExtensionInput("");
    }
  };

  const removeCustomExtension = (extension: string) => {
    setCustomExtensions(customExtensions.filter(ext => ext !== extension));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'free':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'active':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'reserved':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'in use':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'free':
        return 'default';
      case 'active':
        return 'destructive';
      case 'reserved':
        return 'secondary';
      case 'in use':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const formatPrice = (price: number | undefined, currency: string | undefined) => {
    if (price === undefined || currency === undefined) {
      return 'N/A';
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(price);
  };

  // No load more needed for popular TLDs - we show all selected extensions at once

  return (
    <div className="w-full space-y-6">
      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Domain Search
          </CardTitle>
          <CardDescription>
            Search for domain availability and pricing across different extensions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Input */}
          <div className="space-y-2">
            <Label htmlFor="domain-search">Domain Name</Label>
            <div className="flex gap-2">
              <Input
                id="domain-search"
                placeholder="Enter domain name (e.g., example)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
              />
              <Button 
                onClick={handleSearch} 
                disabled={!searchQuery.trim() || isLoading || isSearching}
                className="px-6"
              >
                {(isLoading || isSearching) ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                Search
              </Button>
            </div>
          </div>

          {/* Search Mode Selection */}
          <div className="space-y-2">
            <Label>Search Mode</Label>
            <Select value={searchMode} onValueChange={(value: "popular" | "custom") => setSearchMode(value)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select search mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popular">Popular Extensions</SelectItem>
                <SelectItem value="custom">Custom Extensions</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Popular TLDs Multi-Select */}
          {searchMode === "popular" && (
            <div className="space-y-2">
              <Label>Select Popular Extensions</Label>
              <Popover open={tldPopoverOpen} onOpenChange={setTldPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={tldPopoverOpen}
                    className="w-full justify-between"
                  >
                    {selectedTlds.length > 0 
                      ? `${selectedTlds.length} extension(s) selected`
                      : "Select extensions..."
                    }
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search extensions..." />
                    <CommandEmpty>No extensions found.</CommandEmpty>
                    <CommandGroup className="max-h-64 overflow-auto">
                      {POPULAR_TLDS.map((tld) => (
                        <CommandItem
                          key={tld.value}
                          value={tld.value}
                          onSelect={() => {
                            setSelectedTlds(prev => 
                              prev.includes(tld.value)
                                ? prev.filter(item => item !== tld.value)
                                : [...prev, tld.value]
                            );
                          }}
                        >
                          <Checkbox
                            checked={selectedTlds.includes(tld.value)}
                            className="mr-2"
                          />
                          <div className="flex flex-col">
                            <span className="font-medium">{tld.label}</span>
                            <span className="text-xs text-muted-foreground">{tld.description}</span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
              {selectedTlds.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedTlds.map((tld) => (
                    <Badge key={tld} variant="secondary" className="px-2 py-1">
                      .{tld}
                      <button
                        onClick={() => setSelectedTlds(prev => prev.filter(item => item !== tld))}
                        className="ml-1 hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Custom Extensions Input */}
          {searchMode === "custom" && (
            <div className="space-y-2">
              <Label>Custom Extensions (e.g., com, org, net)</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter extension(s) (e.g., com or com,org,net)"
                  value={extensionInput}
                  onChange={(e) => setExtensionInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addCustomExtension()}
                  className="flex-1"
                />
                <Button onClick={addCustomExtension} variant="outline" disabled={!extensionInput.trim()}>
                  Add
                </Button>
              </div>
              {customExtensions.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {customExtensions.map((ext) => (
                    <Badge key={ext} variant="secondary" className="px-2 py-1">
                      .{ext}
                      <button
                        onClick={() => removeCustomExtension(ext)}
                        className="ml-1 hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error State */}
      {isError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error instanceof Error ? error.message : 'An error occurred while searching domains'}
          </AlertDescription>
        </Alert>
      )}

      {/* Search Results */}
      {allResults.length > 0 && (
        <div className="space-y-4">
          {/* Results Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Search Results</h3>
              <p className="text-sm text-muted-foreground">
                Found {allResults.length} domains
                {paginationInfo && (
                  <span> (Page {paginationInfo.current_page} of {paginationInfo.total_pages})</span>
                )}
              </p>
            </div>
            <Button variant="outline" onClick={() => handleSearch()}>
              <Search className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Results Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allResults.map((result: OpenproviderDomainCheckResult, index: number) => (
              <Card key={`${result.domain}-${index}`} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-mono">{result.domain}</CardTitle>
                    {getStatusIcon(result.status)}
                  </div>
                  <CardDescription className="flex items-center gap-2">
                    <Globe className="h-3 w-3" />
                    {result.reason && (
                      <span className="text-xs text-muted-foreground">
                        {result.reason}
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Status Badge */}
                  <div className="flex items-center gap-2">
                    <Badge variant={getStatusBadgeVariant(result.status)} className="capitalize">
                      {result.status}
                    </Badge>
                    {result.is_premium && (
                      <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                        Premium
                      </Badge>
                    )}
                  </div>

                  {/* Pricing */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="h-3 w-3 text-green-600" />
                      <span className="font-medium">Pricing</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">Product:</span>
                        <div className="font-mono">
                          {formatPrice(result.price?.product?.price, result.price?.product?.currency)}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Reseller:</span>
                        <div className="font-mono">
                          {formatPrice(result.price?.reseller?.price, result.price?.reseller?.currency)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Premium Pricing (if available) */}
                  {result.premium && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="h-3 w-3 text-yellow-600" />
                        <span className="font-medium">Premium Pricing</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground">Product:</span>
                          <div className="font-mono">
                            {formatPrice(result.premium?.product?.price, result.premium?.product?.currency)}
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Reseller:</span>
                          <div className="font-mono">
                            {formatPrice(result.premium?.reseller?.price, result.premium?.reseller?.currency)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Load More Button */}
          {/* No pagination needed for popular TLDs */}
        </div>
      )}

      {/* Empty State */}
      {allResults.length === 0 && !isLoading && !isSearching && searchResults && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Search className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Results Found</h3>
            <p className="text-muted-foreground text-center">
              Try searching with a different domain name or check your search criteria.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
