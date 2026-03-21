import type { OpenproviderTld } from '@/types/openprovider';

/**
 * Utility functions for Openprovider API integration
 */

/**
 * Format TLD data for display purposes
 * @param tld - TLD object from Openprovider API
 * @returns Formatted TLD data
 */
export function formatTldForDisplay(tld: OpenproviderTld) {
  return {
    extension: tld.name,
    displayName: tld.name.toUpperCase(),
    minPeriod: tld.min_period,
    maxPeriod: tld.max_period,
    canTransfer: tld.transfer_available,
    canRenew: tld.renew_available,
    supportsIdn: tld.supported_idn_scripts && tld.supported_idn_scripts.length > 0,
    supportsDnssec: tld.dnssec_allowed,
    requiresAuthCode: tld.is_transfer_auth_code_required,
    isPremium: !!(tld.prices?.reseller_price?.promotion_details),
    registrationPrice: tld.prices?.create_price ? {
      product: {
        currency: tld.prices.create_price.product.currency,
        price: tld.prices.create_price.product.price,
        formatted: `${tld.prices.create_price.product.currency} ${tld.prices.create_price.product.price.toFixed(2)}`,
      },
      reseller: {
        currency: tld.prices.create_price.reseller.currency,
        price: tld.prices.create_price.reseller.price,
        formatted: `${tld.prices.create_price.reseller.currency} ${tld.prices.create_price.reseller.price.toFixed(2)}`,
      },
    } : null,
    description: `TLD for ${tld.name} domains`,
    restrictions: tld.supported_idn_scripts?.map(script => script.description) || [],
  } as {
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
    description: string;
    restrictions: string[];
  };
}

/**
 * Filter TLDs based on search criteria
 * @param tlds - Array of TLD objects
 * @param searchTerm - Search term to filter by
 * @param options - Filter options
 * @returns Filtered array of TLDs
 */
export function filterTlds(
  tlds: OpenproviderTld[],
  searchTerm?: string,
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
) {
  return tlds.filter(tld => {
    // Search term filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesExtension = tld.name.toLowerCase().includes(searchLower);
      const description = `TLD for ${tld.name} domains`;
      const matchesDescription = description.toLowerCase().includes(searchLower);
      
      if (!matchesExtension && !matchesDescription) {
        return false;
      }
    }

    // Premium filter
    const isPremium = !!(tld.prices?.reseller_price?.promotion_details);
    if (options.includePremium === false && isPremium) {
      return false;
    }
    if (options.includeNonPremium === false && !isPremium) {
      return false;
    }

    // Price filters
    if (tld.prices?.create_price) {
      if (options.minPrice !== undefined && tld.prices.create_price.reseller.price < options.minPrice) {
        return false;
      }
      if (options.maxPrice !== undefined && tld.prices.create_price.reseller.price > options.maxPrice) {
        return false;
      }
      if (options.currency && tld.prices.create_price.reseller.currency !== options.currency) {
        return false;
      }
    }

    // Feature filters
    if (options.canTransfer !== undefined && tld.transfer_available !== options.canTransfer) {
      return false;
    }
    if (options.canRenew !== undefined && tld.renew_available !== options.canRenew) {
      return false;
    }
    if (options.supportsDnssec !== undefined && tld.dnssec_allowed !== options.supportsDnssec) {
      return false;
    }

    return true;
  });
}

/**
 * Sort TLDs by various criteria
 * @param tlds - Array of TLD objects
 * @param sortBy - Sort criteria
 * @param direction - Sort direction
 * @returns Sorted array of TLDs
 */
export function sortTlds(
  tlds: OpenproviderTld[],
  sortBy: 'name' | 'price' | 'premium' | 'popularity' = 'name',
  direction: 'asc' | 'desc' = 'asc'
) {
  return [...tlds].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'price':
        const priceA = a.prices?.create_price?.reseller.price || 0;
        const priceB = b.prices?.create_price?.reseller.price || 0;
        comparison = priceA - priceB;
        break;
      case 'premium':
        const premiumA = !!(a.prices?.reseller_price?.promotion_details) ? 1 : 0;
        const premiumB = !!(b.prices?.reseller_price?.promotion_details) ? 1 : 0;
        comparison = premiumA - premiumB;
        break;
      case 'popularity':
        // This would need to be implemented based on your popularity data
        // For now, sort by name as fallback
        comparison = a.name.localeCompare(b.name);
        break;
    }

    return direction === 'desc' ? -comparison : comparison;
  });
}

/**
 * Get popular TLD extensions (commonly used ones)
 * @returns Array of popular TLD extensions
 */
export function getPopularTldExtensions(): string[] {
  return [
    '.com',
    '.net',
    '.org',
    '.info',
    '.biz',
    '.co',
    '.io',
    '.me',
    '.us',
    '.uk',
    '.de',
    '.fr',
    '.es',
    '.it',
    '.nl',
    '.be',
    '.ch',
    '.at',
    '.se',
    '.no',
    '.dk',
    '.fi',
    '.pl',
    '.cz',
    '.hu',
    '.ro',
    '.bg',
    '.hr',
    '.si',
    '.sk',
    '.lt',
    '.lv',
    '.ee',
    '.eu',
  ];
}

/**
 * Check if a TLD extension is popular
 * @param extension - TLD extension to check
 * @returns True if the extension is popular
 */
export function isPopularTld(extension: string): boolean {
  return getPopularTldExtensions().includes(extension.toLowerCase());
}

/**
 * Validate domain name format
 * @param domainName - Domain name to validate
 * @returns True if domain name is valid
 */
export function isValidDomainName(domainName: string): boolean {
  const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/;
  return domainRegex.test(domainName) && domainName.length <= 63;
}

/**
 * Validate TLD extension format
 * @param extension - TLD extension to validate
 * @returns True if extension is valid
 */
export function isValidTldExtension(extension: string): boolean {
  const tldRegex = /^\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/;
  return tldRegex.test(extension);
}

/**
 * Combine domain name and extension
 * @param domainName - Domain name
 * @param extension - TLD extension
 * @returns Combined domain
 */
export function combineDomain(domainName: string, extension: string): string {
  const cleanName = domainName.toLowerCase().trim();
  const cleanExt = extension.toLowerCase().trim();
  
  if (!cleanExt.startsWith('.')) {
    return `${cleanName}.${cleanExt}`;
  }
  
  return `${cleanName}${cleanExt}`;
}

/**
 * Extract domain name and extension from full domain
 * @param fullDomain - Full domain (e.g., "example.com")
 * @returns Object with domain name and extension
 */
export function parseDomain(fullDomain: string): { name: string; extension: string } | null {
  const parts = fullDomain.toLowerCase().split('.');
  if (parts.length < 2) {
    return null;
  }
  
  const extension = `.${parts[parts.length - 1]}`;
  const name = parts.slice(0, -1).join('.');
  
  return { name, extension };
}
