// Domain API client for fetching and managing domain data
import type { DomainApiResponse, DomainQueryParams, DomainTableRow } from '@/types/domain';
import { formatTldForDisplay } from './openprovider-utils';

// API base URL
const API_BASE_URL = process.env.VITE_PUBLIC_API_URL || 'http://localhost:3000';

class DomainApiError extends Error {
  constructor(
    public code: number,
    public message: string,
    public details?: Array<{ field: string; message: string }>
  ) {
    super(message);
    this.name = 'DomainApiError';
  }
}

/**
 * Fetch domains from the Openprovider API
 */
export async function fetchDomains(
  params: DomainQueryParams = {},
  authToken?: string
): Promise<DomainApiResponse> {
  try {
    const searchParams = new URLSearchParams();

    // Add query parameters
    if (params.limit) searchParams.set('limit', params.limit.toString());
    if (params.offset) searchParams.set('offset', params.offset.toString());
    if (params.extensions?.length) searchParams.set('extensions', params.extensions.join(','));
    if (params.status) searchParams.set('status', params.status);
    if (params.with_price !== undefined) searchParams.set('with_price', params.with_price.toString());
    if (params.with_description !== undefined) searchParams.set('with_description', params.with_description.toString());
    if (params.with_restrictions !== undefined) searchParams.set('with_restrictions', params.with_restrictions.toString());

    const url = `${API_BASE_URL}/api/openprovider/tlds?${searchParams.toString()}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
      },
      // Add cache control for better performance
      cache: 'force-cache',
      next: { revalidate: 3600 }, // Revalidate every hour
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new DomainApiError(
        response.status,
        errorData.error?.message || `HTTP ${response.status}`,
        errorData.error?.details
      );
    }

    const data: DomainApiResponse = await response.json();

    if (!data.success) {
      throw new DomainApiError(
        500,
        'Unknown API error'
      );
    }

    return data;
  } catch (error) {
    if (error instanceof DomainApiError) {
      throw error;
    }

    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new DomainApiError(0, 'Network error: Unable to connect to the server');
    }

    throw new DomainApiError(500, 'An unexpected error occurred');
  }
}

/**
 * Transform Openprovider TLD data to DomainTableRow format
 */
export function transformTldToTableRow(tld: any, index: number): DomainTableRow {
  const formatted = formatTldForDisplay(tld);

  return {
    id: `${tld.name}-${index}`,
    extension: formatted.extension,
    displayName: formatted.displayName,
    minPeriod: formatted.minPeriod,
    maxPeriod: formatted.maxPeriod,
    canTransfer: formatted.canTransfer,
    canRenew: formatted.canRenew,
    supportsIdn: formatted.supportsIdn,
    supportsDnssec: formatted.supportsDnssec,
    requiresAuthCode: formatted.requiresAuthCode,
    isPremium: formatted.isPremium,
    registrationPrice: formatted.registrationPrice,
    description: formatted.description,
    restrictions: formatted.restrictions,
    status: tld.is_premium ? 'premium' : 'active',
    popularity: getPopularityLevel(tld.name),
    lastUpdated: new Date().toISOString(),
    fullDomainData: tld,
  };
}

/**
 * Determine popularity level based on TLD extension
 */
function getPopularityLevel(extension: string): 'high' | 'medium' | 'low' {
  const highPopular = ['.com', '.net', '.org', '.info', '.biz', '.co', '.io'];
  const mediumPopular = ['.me', '.us', '.uk', '.de', '.fr', '.es', '.it', '.nl', '.be', '.ch', '.at'];

  const ext = extension.toLowerCase();

  if (highPopular.includes(ext)) return 'high';
  if (mediumPopular.includes(ext)) return 'medium';
  return 'low';
}

/**
 * Filter domain table rows based on search criteria
 */
function filterDomainRows(
  rows: DomainTableRow[],
  searchTerm: string,
  options: {
    includePremium?: boolean;
    includeNonPremium?: boolean;
    minPrice?: number;
    maxPrice?: number;
    currency?: string;
    canTransfer?: boolean;
    canRenew?: boolean;
    supportsDnssec?: boolean;
  } = {}
): DomainTableRow[] {
  return rows.filter(row => {
    // Search term filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesExtension = row.extension.toLowerCase().includes(searchLower);
      const matchesDescription = row.description?.toLowerCase().includes(searchLower) || false;

      if (!matchesExtension && !matchesDescription) {
        return false;
      }
    }

    // Premium filter
    if (options.includePremium === false && row.isPremium) {
      return false;
    }
    if (options.includeNonPremium === false && !row.isPremium) {
      return false;
    }

    // Price filters
    if (row.registrationPrice) {
      if (options.minPrice !== undefined && row.registrationPrice.reseller.price < options.minPrice) {
        return false;
      }
      if (options.maxPrice !== undefined && row.registrationPrice.reseller.price > options.maxPrice) {
        return false;
      }
      if (options.currency && row.registrationPrice.reseller.currency !== options.currency) {
        return false;
      }
    }

    // Feature filters
    if (options.canTransfer !== undefined && row.canTransfer !== options.canTransfer) {
      return false;
    }
    if (options.canRenew !== undefined && row.canRenew !== options.canRenew) {
      return false;
    }
    if (options.supportsDnssec !== undefined && row.supportsDnssec !== options.supportsDnssec) {
      return false;
    }

    return true;
  });
}

/**
 * Sort domain table rows by various criteria
 */
function sortDomainRows(
  rows: DomainTableRow[],
  sortBy: 'name' | 'price' | 'premium' | 'popularity' = 'name',
  direction: 'asc' | 'desc' = 'asc'
): DomainTableRow[] {
  return [...rows].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'name':
        comparison = a.extension.localeCompare(b.extension);
        break;
      case 'price':
        const priceA = a.registrationPrice?.reseller.price || 0;
        const priceB = b.registrationPrice?.reseller.price || 0;
        comparison = priceA - priceB;
        break;
      case 'premium':
        const premiumA = a.isPremium ? 1 : 0;
        const premiumB = b.isPremium ? 1 : 0;
        comparison = premiumA - premiumB;
        break;
      case 'popularity':
        const popularityOrder = { high: 3, medium: 2, low: 1 };
        comparison = popularityOrder[a.popularity] - popularityOrder[b.popularity];
        break;
    }

    return direction === 'desc' ? -comparison : comparison;
  });
}

/**
 * Process and filter domain data for table display
 */
export function processDomainData(
  tlds: any[],
  params: DomainQueryParams = {}
): DomainTableRow[] {
  // Transform to table rows
  let rows = tlds.map((tld, index) => transformTldToTableRow(tld, index));

  // Apply client-side filtering if needed
  if (params.search) {
    rows = filterDomainRows(rows, params.search, {
      includePremium: true,
      includeNonPremium: true,
    });
  }

  // Apply sorting
  if (params.sortBy) {
    rows = sortDomainRows(rows, params.sortBy, params.sortDirection || 'asc');
  }

  return rows;
}

/**
 * Get authentication token from localStorage or cookies
 */
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;

  // Try localStorage first
  const token = localStorage.getItem('openprovider_token');
  if (token) return token;

  // Try cookies as fallback
  const cookies = document.cookie.split(';');
  const tokenCookie = cookies.find(cookie =>
    cookie.trim().startsWith('openprovider_token=')
  );

  if (tokenCookie) {
    return tokenCookie.split('=')[1];
  }

  return null;
}

/**
 * Store authentication token
 */
export function setAuthToken(token: string): void {
  if (typeof window === 'undefined') return;

  localStorage.setItem('openprovider_token', token);
  // Also set as cookie for server-side access
  document.cookie = `openprovider_token=${token}; path=/; max-age=${60 * 60 * 24 * 7}`; // 7 days
}

/**
 * Clear authentication token
 */
export function clearAuthToken(): void {
  if (typeof window === 'undefined') return;

  localStorage.removeItem('openprovider_token');
  document.cookie = 'openprovider_token=; path=/; max-age=0';
}
