"use client";

import * as React from "react";
import { Heart, ExternalLink, Copy, CheckCircle, XCircle, Clock, Star } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { Icons } from "@/components/icons";
import { toast } from "sonner";
import { 
  getPopularTlds,
  getBusinessTlds,
  getEducationTlds,
  getInternationalTlds,
  getTechnologyTlds,
  getSocialPersonalTlds,
  getProfessionalServicesTlds,
  getMediaEntertainmentTlds,
  getEcommerceShoppingTlds,
  getIndustrySectorTlds,
  getLifestyleHobbiesTlds,
  getCountryCodeTlds,
  getAllTldExtensions
} from "@nPanel/utils";
import type { DomainSearchResult } from "./domain-search";

interface AISuggestion {
  name: string;
  description?: string;
  confidence?: number;
}

interface AIDomainCardProps {
  suggestion: AISuggestion;
  activeTab: string;
  onAddToCart: (result: DomainSearchResult) => void;
  onRemoveFromCart: (domain: string) => void;
  isDomainInCart: (domain: string) => boolean;
  domainResults?: DomainSearchResult[];
  error?: string;
  isChecking?: boolean;
  isComplete?: boolean;
}

// Get extensions for current tab using TLD utility
const getCurrentTabExtensions = (tab: string) => {
  switch (tab) {
    case "popular": 
      return getPopularTlds().map(ext => `.${ext}`);
    case "business": 
      return getBusinessTlds().map(ext => `.${ext}`);
    case "education": 
      return getEducationTlds().map(ext => `.${ext}`);
    case "international": 
      return getInternationalTlds().map(ext => `.${ext}`);
    case "technology": 
      return getTechnologyTlds().map(ext => `.${ext}`);
    case "socialpersonal": 
      return getSocialPersonalTlds().map(ext => `.${ext}`);
    case "professionalservices": 
      return getProfessionalServicesTlds().map(ext => `.${ext}`);
    case "mediaentertainment": 
      return getMediaEntertainmentTlds().map(ext => `.${ext}`);
    case "ecommerceshopping": 
      return getEcommerceShoppingTlds().map(ext => `.${ext}`);
    case "industrysector": 
      return getIndustrySectorTlds().map(ext => `.${ext}`);
    case "lifestylehobbies": 
      return getLifestyleHobbiesTlds().map(ext => `.${ext}`);
    case "countrycodes": 
      return getCountryCodeTlds().map(ext => `.${ext}`);
    default: 
      return getPopularTlds().map(ext => `.${ext}`);
  }
};

const formatPrice = (price?: number, currency?: string) => {
  if (!price) return "N/A";
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
  }).format(price);
};

const getStatusBadge = (status: string) => {
  // Show status as-is from API, red for unavailable, green for available
  const isAvailable = status === 'free';
  
  return (
    <Badge 
      variant={isAvailable ? "default" : "destructive"} 
      className={`text-xs border flex items-center gap-1 ${
        isAvailable 
          ? 'bg-green-100 text-green-800 border-green-200' 
          : 'bg-red-100 text-red-800 border-red-200'
      }`}
    >
      {isAvailable ? (
        <CheckCircle className="h-3 w-3" />
      ) : (
        <XCircle className="h-3 w-3" />
      )}
      {status === 'free' ? 'Available' : status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}
    </Badge>
  );
};

export function AIDomainCard({ 
  suggestion, 
  activeTab, 
  onAddToCart, 
  onRemoveFromCart, 
  isDomainInCart, 
  domainResults = [], 
  error, 
  isChecking = false, 
  isComplete = false 
}: AIDomainCardProps) {
  const [copiedDomain, setCopiedDomain] = React.useState<string | null>(null);

  // Show toast for errors instead of displaying them in UI
  React.useEffect(() => {
    if (error) {
      toast.error(`Failed to check domains for ${suggestion.name}: ${error}`);
    }
  }, [error, suggestion.name]);

  const copyToClipboard = async (domain: string) => {
    try {
      await navigator.clipboard.writeText(domain);
      setCopiedDomain(domain);
      setTimeout(() => setCopiedDomain(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const availableCount = domainResults.filter(r => r.status === 'free').length;
  const totalCount = domainResults.length;

  return (
    <Card className="border border-gray-200 hover:border-gray-300 transition-all duration-200 hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h4 className="text-xl font-bold text-gray-900 truncate">{suggestion.name}</h4>
              {suggestion.confidence && (
                <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800 border-blue-200">
                  <Star className="h-3 w-3 mr-1" />
                  {Math.round(suggestion.confidence * 100)}% match
                </Badge>
              )}
            </div>
            {suggestion.description && (
              <p className="text-sm text-gray-600 mb-2">{suggestion.description}</p>
            )}
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4 text-green-600" />
                {availableCount} available
              </span>
              <span className="flex items-center gap-1">
                <XCircle className="h-4 w-4 text-red-600" />
                {totalCount - availableCount} taken
              </span>
              <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} category
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-red-500 transition-colors"
          >
            <Heart className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

              <CardContent className="pt-0">
                {isChecking ? (
                  <div className="space-y-3">
                    {[...Array(6)].map((_, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg animate-pulse">
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                        <div className="h-8 bg-gray-200 rounded w-16"></div>
                      </div>
                    ))}
                  </div>
                ) : domainResults.length > 0 ? (
                  <div className="space-y-3">
                    {domainResults.map((result, index) => (
                      <div
                        key={`${result.domain}-${index}`}
                        className="group flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all duration-200 border border-transparent hover:border-gray-200"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-base text-gray-900 truncate">
                                  {result.domain}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(result.domain)}
                                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  {copiedDomain === result.domain ? (
                                    <CheckCircle className="h-3 w-3 text-green-600" />
                                  ) : (
                                    <Copy className="h-3 w-3 text-gray-400" />
                                  )}
                                </Button>
                              </div>
                            </div>
                            {getStatusBadge(result.status)}
                          </div>
                          
                          <div className="flex items-center justify-between">
                            {result.status === 'free' && result.price ? (
                              <div className="text-sm font-medium text-gray-700">
                                {result.price.calculated ? (
                                  <>
                                    {/* Show converted price if available, otherwise show calculated price */}
                                    {(result.price.calculated as any).convertedPrice ? (
                                      formatPrice((result.price.calculated as any).convertedPrice, (result.price.calculated as any).displayCurrency)
                                    ) : (
                                      formatPrice(result.price.calculated.finalPrice, result.price.calculated.currency)
                                    )}
                                  </>
                                ) : (
                                  formatPrice(result.price.reseller?.price, result.price.reseller?.currency)
                                )}
                              </div>
                            ) : result.reason ? (
                              <div className="text-sm text-gray-500 italic">
                                {result.reason}
                              </div>
                            ) : (
                              <div className="text-sm text-gray-500">
                                Not available
                              </div>
                            )}
                            
                            {result.status === 'free' && (
                              <Button
                                size="sm"
                                variant={isDomainInCart(result.domain) ? "destructive" : "default"}
                                onClick={() => {
                                  if (isDomainInCart(result.domain)) {
                                    onRemoveFromCart(result.domain);
                                  } else {
                                    onAddToCart(result);
                                  }
                                }}
                                className="ml-2 flex-shrink-0 h-8"
                              >
                                {isDomainInCart(result.domain) ? (
                                  <>
                                    <Icons.Cart className="h-3 w-3 mr-1" />
                                    Remove
                                  </>
                                ) : (
                                  <>
                                    <Icons.Cart className="h-3 w-3 mr-1" />
                                    Add to Cart
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p>No domains found for this category</p>
                  </div>
                )}

        {/* Enhanced Footer */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      {isChecking ? (
                        <span className="flex items-center gap-1">
                          <Spinner variant="ellipsis" className="h-3 w-3" />
                          Checking availability...
                        </span>
                      ) : isComplete ? (
                        <span className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3 text-green-600" />
                          Real-time availability
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-gray-400" />
                          Waiting to check...
                        </span>
                      )}
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                        {isChecking ? 'Checking...' : isComplete ? 'Updated just now' : 'Pending'}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs"
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      View Details
                    </Button>
                  </div>
                </div>
      </CardContent>
    </Card>
  );
}
