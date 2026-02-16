import { readFileSync } from 'fs';
import { join } from 'path';
import type {
    FunctionCatalog,
    FunctionCatalogEntry,
    IndexedCatalog,
    ValidationResult,
    ValidationError,
    ValidationWarning,
    AccessLevel,
    ProcedureType
} from './catalog-types';

/**
 * Load and parse the function catalog from JSON file
 */
export function loadFunctionCatalog(): FunctionCatalog {
    try {
        const catalogPath = join(__dirname, 'ai_function_catalog.json');
        const catalogContent = readFileSync(catalogPath, 'utf-8');
        const catalog = JSON.parse(catalogContent) as FunctionCatalog;

        return catalog;
    } catch (error) {
        console.error('[AI Catalog] Failed to load function catalog:', error);
        // Return empty catalog as fallback
        return {
            version: '1.0.0',
            lastUpdated: new Date().toISOString(),
            functions: [],
        };
    }
}

/**
 * Build indexed catalog for fast lookups
 */
export function buildIndexedCatalog(catalog: FunctionCatalog): IndexedCatalog {
    const byId = new Map<string, FunctionCatalogEntry>();
    const byCategory = new Map<string, FunctionCatalogEntry[]>();
    const byAccess = new Map<AccessLevel, FunctionCatalogEntry[]>();
    const byType = new Map<ProcedureType, FunctionCatalogEntry[]>();

    for (const func of catalog.functions) {
        // Index by ID
        byId.set(func.id, func);

        // Index by category
        if (!byCategory.has(func.category)) {
            byCategory.set(func.category, []);
        }
        byCategory.get(func.category)!.push(func);

        // Index by access level
        if (!byAccess.has(func.access)) {
            byAccess.set(func.access, []);
        }
        byAccess.get(func.access)!.push(func);

        // Index by type
        if (!byType.has(func.type)) {
            byType.set(func.type, []);
        }
        byType.get(func.type)!.push(func);
    }

    return {
        catalog,
        byId,
        byCategory,
        byAccess,
        byType,
    };
}

/**
 * Validate catalog structure and content
 */
export function validateCatalog(catalog: FunctionCatalog): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Check version
    if (!catalog.version) {
        errors.push({ message: 'Catalog version is missing' });
    }

    // Check functions array
    if (!Array.isArray(catalog.functions)) {
        errors.push({ message: 'Catalog functions must be an array' });
        return { valid: false, errors, warnings };
    }

    // Track duplicate IDs
    const seenIds = new Set<string>();

    // Validate each function
    for (const func of catalog.functions) {
        // Check required fields
        if (!func.id) {
            errors.push({ message: 'Function is missing required field: id' });
            continue;
        }

        // Check for duplicates
        if (seenIds.has(func.id)) {
            errors.push({
                functionId: func.id,
                message: `Duplicate function ID: ${func.id}`,
            });
        }
        seenIds.add(func.id);

        // Validate ID format (should match tRPC path)
        if (!func.id.includes('.')) {
            warnings.push({
                functionId: func.id,
                field: 'id',
                message: 'Function ID should follow tRPC path format (e.g., "router.procedure")',
            });
        }

        // Check other required fields
        const requiredFields = ['category', 'subcategory', 'type', 'access', 'description'];
        for (const field of requiredFields) {
            if (!func[field as keyof FunctionCatalogEntry]) {
                errors.push({
                    functionId: func.id,
                    field,
                    message: `Missing required field: ${field}`,
                });
            }
        }

        // Validate type
        if (func.type && !['query', 'mutation'].includes(func.type)) {
            errors.push({
                functionId: func.id,
                field: 'type',
                message: `Invalid type: ${func.type}. Must be 'query' or 'mutation'`,
            });
        }

        // Validate access level
        const validAccessLevels: AccessLevel[] = ['public', 'protected', 'agency-only', 'team-scoped'];
        if (func.access && !validAccessLevels.includes(func.access)) {
            errors.push({
                functionId: func.id,
                field: 'access',
                message: `Invalid access level: ${func.access}`,
            });
        }

        // Check schemas
        if (!func.inputSchema) {
            warnings.push({
                functionId: func.id,
                field: 'inputSchema',
                message: 'Missing input schema',
            });
        }

        if (!func.outputSchema) {
            warnings.push({
                functionId: func.id,
                field: 'outputSchema',
                message: 'Missing output schema',
            });
        }

        // Check description length
        if (func.description && func.description.length < 10) {
            warnings.push({
                functionId: func.id,
                field: 'description',
                message: 'Description is too short (should be at least 10 characters)',
            });
        }
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings,
    };
}

/**
 * Get function by ID from indexed catalog
 */
export function getFunctionById(
    indexedCatalog: IndexedCatalog,
    functionId: string
): FunctionCatalogEntry | undefined {
    return indexedCatalog.byId.get(functionId);
}

/**
 * Get all functions in a category
 */
export function getFunctionsByCategory(
    indexedCatalog: IndexedCatalog,
    category: string
): FunctionCatalogEntry[] {
    return indexedCatalog.byCategory.get(category) || [];
}

/**
 * Get all functions with specific access level
 */
export function getFunctionsByAccess(
    indexedCatalog: IndexedCatalog,
    access: AccessLevel
): FunctionCatalogEntry[] {
    return indexedCatalog.byAccess.get(access) || [];
}

/**
 * Search functions by keyword in description or ID
 */
export function searchFunctions(
    indexedCatalog: IndexedCatalog,
    keyword: string
): FunctionCatalogEntry[] {
    const lowerKeyword = keyword.toLowerCase();
    return indexedCatalog.catalog.functions.filter(
        (func) =>
            func.id.toLowerCase().includes(lowerKeyword) ||
            func.description.toLowerCase().includes(lowerKeyword) ||
            func.category.toLowerCase().includes(lowerKeyword) ||
            func.subcategory.toLowerCase().includes(lowerKeyword)
    );
}

/**
 * Get catalog statistics
 */
export function getCatalogStats(catalog: FunctionCatalog) {
    const stats = {
        totalFunctions: catalog.functions.length,
        byCategory: {} as Record<string, number>,
        byAccess: {} as Record<string, number>,
        byType: {} as Record<string, number>,
    };

    for (const func of catalog.functions) {
        // Count by category
        stats.byCategory[func.category] = (stats.byCategory[func.category] || 0) + 1;

        // Count by access
        stats.byAccess[func.access] = (stats.byAccess[func.access] || 0) + 1;

        // Count by type
        stats.byType[func.type] = (stats.byType[func.type] || 0) + 1;
    }

    return stats;
}

// Singleton instance for caching
let cachedIndexedCatalog: IndexedCatalog | null = null;

/**
 * Get cached indexed catalog (loads and indexes on first call)
 */
export function getCachedCatalog(): IndexedCatalog {
    if (!cachedIndexedCatalog) {
        const catalog = loadFunctionCatalog();
        cachedIndexedCatalog = buildIndexedCatalog(catalog);

        // Validate on load
        const validation = validateCatalog(catalog);
        if (!validation.valid) {
            console.error('[AI Catalog] Validation errors:', validation.errors);
        }
        if (validation.warnings.length > 0) {
            console.warn('[AI Catalog] Validation warnings:', validation.warnings);
        }
    }
    return cachedIndexedCatalog;
}

/**
 * Clear cached catalog (useful for testing or hot-reload)
 */
export function clearCatalogCache(): void {
    cachedIndexedCatalog = null;
}
