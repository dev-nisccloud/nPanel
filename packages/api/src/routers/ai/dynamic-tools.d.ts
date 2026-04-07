import type { FunctionCatalogEntry } from './catalog-types';
/**
 * Generate AI tool structure from catalog entry
 */
export declare function generateToolFromCatalogEntry(entry: FunctionCatalogEntry, caller: any): any;
/**
 * Generate all tools from catalog entries
 */
export declare function generateToolsFromCatalog(entries: FunctionCatalogEntry[], caller: any): Record<string, any>;
/**
 * Filter catalog entries by access level
 */
export declare function filterCatalogByAccess(entries: FunctionCatalogEntry[], userRole: string | undefined): FunctionCatalogEntry[];
/**
 * Create a summary of available tools for the system prompt
 */
export declare function createToolsSummary(allowedFunctions: FunctionCatalogEntry[], allCategories?: {
    name: string;
    description: string;
    subcategories: string[];
}[]): string;
