import type { FunctionCatalog, FunctionCatalogEntry, IndexedCatalog, ValidationResult, AccessLevel } from './catalog-types';
/**
 * Load and parse the function catalog from JSON file
 */
export declare function loadFunctionCatalog(): FunctionCatalog;
/**
 * Build indexed catalog for fast lookups
 */
export declare function buildIndexedCatalog(catalog: FunctionCatalog): IndexedCatalog;
/**
 * Validate catalog structure and content
 */
export declare function validateCatalog(catalog: FunctionCatalog): ValidationResult;
/**
 * Get function by ID from indexed catalog
 */
export declare function getFunctionById(indexedCatalog: IndexedCatalog, functionId: string): FunctionCatalogEntry | undefined;
/**
 * Get all functions in a category
 */
export declare function getFunctionsByCategory(indexedCatalog: IndexedCatalog, category: string): FunctionCatalogEntry[];
/**
 * Get all functions with specific access level
 */
export declare function getFunctionsByAccess(indexedCatalog: IndexedCatalog, access: AccessLevel): FunctionCatalogEntry[];
/**
 * Search functions by keyword in description or ID
 */
export declare function searchFunctions(indexedCatalog: IndexedCatalog, keyword: string): FunctionCatalogEntry[];
/**
 * Get catalog statistics
 */
export declare function getCatalogStats(catalog: FunctionCatalog): {
    totalFunctions: number;
    byCategory: Record<string, number>;
    byAccess: Record<string, number>;
    byType: Record<string, number>;
};
/**
 * Get cached indexed catalog (loads and indexes on first call)
 */
export declare function getCachedCatalog(): IndexedCatalog;
/**
 * Clear cached catalog (useful for testing or hot-reload)
 */
export declare function clearCatalogCache(): void;
