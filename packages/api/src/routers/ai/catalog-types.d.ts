/**
 * Type definitions for the AI Function Catalog
 *
 * The catalog provides structured metadata about all available tRPC API operations
 * that the AI can call during chat interactions.
 */
/**
 * Schema definition for function inputs/outputs
 * Supports basic JSON Schema-like structure
 */
export interface SchemaDefinition {
    type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';
    properties?: Record<string, SchemaProperty>;
    items?: SchemaProperty;
    required?: string[];
    description?: string;
}
/**
 * Individual property within a schema
 */
export interface SchemaProperty {
    type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null' | 'enum';
    description?: string;
    optional?: boolean;
    default?: any;
    enum?: string[];
    properties?: Record<string, SchemaProperty>;
    items?: SchemaProperty;
}
/**
 * Example usage of a function
 */
export interface FunctionExample {
    description: string;
    input: Record<string, any>;
    output: any;
}
/**
 * Access control level for a function
 */
export type AccessLevel = 'public' | 'protected' | 'agency-only' | 'team-scoped';
/**
 * Type of tRPC procedure
 */
export type ProcedureType = 'query' | 'mutation';
/**
 * Complete catalog entry for a single API function
 */
export interface FunctionCatalogEntry {
    /** Unique identifier matching tRPC path (e.g., "plesk.subscriptions.list") */
    id: string;
    /** High-level category (e.g., "Plesk Integration", "Marketing Services") */
    category: string;
    /** Subcategory within the category (e.g., "Subscriptions Management") */
    subcategory: string;
    /** Type of tRPC procedure */
    type: ProcedureType;
    /** Access control level */
    access: AccessLevel;
    /** Human-readable description of what the function does */
    description: string;
    /** Input parameter schema */
    inputSchema: SchemaDefinition;
    /** Output/return value schema */
    outputSchema: SchemaDefinition;
    /** Optional usage examples */
    examples?: FunctionExample[];
    /** Optional notes or warnings */
    notes?: string[];
}
/**
 * Complete function catalog structure
 */
export interface FunctionCatalog {
    /** Catalog version for compatibility tracking */
    version: string;
    /** Last updated timestamp */
    lastUpdated: string;
    /** All available functions */
    functions: FunctionCatalogEntry[];
    /** Metadata about categories */
    categories?: {
        name: string;
        description: string;
        subcategories: string[];
    }[];
}
/**
 * Indexed catalog for fast lookups
 */
export interface IndexedCatalog {
    /** Original catalog */
    catalog: FunctionCatalog;
    /** Function lookup by ID */
    byId: Map<string, FunctionCatalogEntry>;
    /** Functions grouped by category */
    byCategory: Map<string, FunctionCatalogEntry[]>;
    /** Functions grouped by access level */
    byAccess: Map<AccessLevel, FunctionCatalogEntry[]>;
    /** Functions grouped by type */
    byType: Map<ProcedureType, FunctionCatalogEntry[]>;
}
/**
 * Result of catalog validation
 */
export interface ValidationResult {
    valid: boolean;
    errors: ValidationError[];
    warnings: ValidationWarning[];
}
export interface ValidationError {
    functionId?: string;
    field?: string;
    message: string;
}
export interface ValidationWarning {
    functionId?: string;
    field?: string;
    message: string;
}
