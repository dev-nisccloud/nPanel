// Domain-related types for the domain management table
import type { OpenproviderTld } from './openprovider';

// Domain table row data structure
export interface DomainTableRow {
  id: string;
  extension: string;
  displayName: string;
  minPeriod: number;
  maxPeriod: number;
  canTransfer: boolean;
  canRenew: boolean;
  supportsIdn: boolean;
  supportsDnssec: boolean;
  requiresAuthCode: boolean;
  isPremium: boolean;
  // Registration price for table display
  registrationPrice: {
    product: {
      currency: string;
      price: number;
      formatted: string;
    };
    reseller: {
      currency: string;
      price: number;
      formatted: string;
    };
  } | null;
  description?: string;
  restrictions: string[];
  // Additional fields for table management
  status: 'active' | 'inactive' | 'premium' | 'restricted';
  popularity: 'high' | 'medium' | 'low';
  lastUpdated: string;
  // Full domain data for detailed view
  fullDomainData: OpenproviderTld;
}

// API response types for domain data
export interface DomainApiResponse {
  success: boolean;
  data: {
    results: OpenproviderTld[];
    total: number;
  };
  cached: boolean;
  fetched_at?: string;
  cached_at?: string;
}

// Query parameters for domain fetching
export interface DomainQueryParams {
  limit?: number;
  offset?: number;
  extensions?: string[];
  status?: 'ACT' | 'INACT';
  with_price?: boolean;
  with_description?: boolean;
  with_restrictions?: boolean;
  search?: string;
  sortBy?: 'name' | 'price' | 'premium' | 'popularity';
  sortDirection?: 'asc' | 'desc';
}

// Table state for server-side operations
export interface DomainTableState {
  pagination: {
    pageIndex: number;
    pageSize: number;
  };
  sorting: Array<{
    id: string;
    desc: boolean;
  }>;
  columnFilters: Array<{
    id: string;
    value: unknown;
  }>;
  globalFilter: string;
}

// Error types
export interface DomainApiError {
  code: number;
  message: string;
  details?: Array<{
    field: string;
    message: string;
  }>;
}
