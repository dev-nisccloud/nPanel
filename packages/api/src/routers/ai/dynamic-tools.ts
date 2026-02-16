import { z } from 'zod';
import { tool } from 'ai';
import type { FunctionCatalogEntry, SchemaDefinition, SchemaProperty } from './catalog-types';
// import type { AppRouter } from '../index';
// import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';
import { smartFormat } from './response-formatter';

/**
 * Convert catalog schema definition to Zod schema
 */
function schemaToZod(schema: SchemaDefinition): z.ZodTypeAny {
    switch (schema.type) {
        case 'object':
            if (!schema.properties) {
                return z.object({});
            }

            const shape: Record<string, z.ZodTypeAny> = {};
            for (const [key, prop] of Object.entries(schema.properties)) {
                shape[key] = propertyToZod(prop);
            }

            return z.object(shape);

        case 'array':
            if (!schema.items) {
                return z.array(z.any());
            }
            return z.array(propertyToZod(schema.items));

        case 'string':
            return z.string();

        case 'number':
            return z.number();

        case 'boolean':
            return z.boolean();

        case 'null':
            return z.null();

        default:
            return z.any();
    }
}

/**
 * Convert schema property to Zod type
 */
function propertyToZod(prop: SchemaProperty): z.ZodTypeAny {
    let zodType: z.ZodTypeAny;

    switch (prop.type) {
        case 'object':
            if (!prop.properties) {
                zodType = z.object({});
            } else {
                const shape: Record<string, z.ZodTypeAny> = {};
                for (const [key, nestedProp] of Object.entries(prop.properties)) {
                    shape[key] = propertyToZod(nestedProp);
                }
                zodType = z.object(shape);
            }
            break;

        case 'array':
            if (!prop.items) {
                zodType = z.array(z.any());
            } else {
                zodType = z.array(propertyToZod(prop.items));
            }
            break;

        case 'enum':
            if (prop.enum && prop.enum.length > 0) {
                zodType = z.enum(prop.enum as [string, ...string[]]);
            } else {
                zodType = z.string();
            }
            break;

        case 'string':
            zodType = z.string();
            break;

        case 'number':
            zodType = z.number();
            break;

        case 'boolean':
            zodType = z.boolean();
            break;

        case 'null':
            zodType = z.null();
            break;

        default:
            zodType = z.any();
    }

    // Add description if available
    if (prop.description) {
        zodType = zodType.describe(prop.description);
    }

    // Make optional if specified
    if (prop.optional) {
        zodType = zodType.optional();
    }

    // Add default value if specified
    if (prop.default !== undefined) {
        zodType = zodType.default(prop.default);
    }

    return zodType;
}

/**
 * Parse tRPC path and execute the procedure
 * Example: "plesk.subscriptions.list" -> caller.plesk.subscriptions.list()
 */
async function executeTrpcProcedure(
    path: string,
    input: any,
    caller: any
): Promise<any> {
    const parts = path.split('.');

    // Navigate through the caller object
    let current = caller;
    for (const part of parts) {
        if (!current[part]) {
            throw new Error(`tRPC procedure not found: ${path}`);
        }
        current = current[part];
    }

    // Execute the procedure
    if (typeof current === 'function') {
        return await current(input);
    }

    throw new Error(`Invalid tRPC procedure: ${path}`);
}

/**
 * Generate AI SDK tool from catalog entry
 */
export function generateToolFromCatalogEntry(
    entry: FunctionCatalogEntry,
    caller: any
): ReturnType<typeof tool> {
    // Convert input schema to Zod
    const inputSchema = schemaToZod(entry.inputSchema);

    return tool({
        description: entry.description,
        parameters: inputSchema as any,
        execute: async (input: any) => {
            try {
                console.log(`[AI Tool] Executing ${entry.id} with input:`, input);

                // Execute the tRPC procedure
                const result = await executeTrpcProcedure(entry.id, input, caller);

                console.log(`[AI Tool] ${entry.id} completed successfully`);

                // Format the result for the AI
                return smartFormat(result, {
                    functionName: entry.id
                });
            } catch (error) {
                console.error(`[AI Tool] Error executing ${entry.id}:`, error);

                // Return structured error
                return {
                    error: true,
                    message: error instanceof Error ? error.message : 'Unknown error occurred',
                    functionId: entry.id,
                };
            }
        },
    } as any);
}

/**
 * Generate all tools from catalog entries
 */
export function generateToolsFromCatalog(
    entries: FunctionCatalogEntry[],
    caller: any
): Record<string, ReturnType<typeof tool>> {
    const tools: Record<string, ReturnType<typeof tool>> = {};

    for (const entry of entries) {
        // Convert dot notation to camelCase for tool name
        // e.g., "plesk.subscriptions.list" -> "pleskSubscriptionsList"
        const toolName = entry.id
            .split('.')
            .map((part, index) => {
                if (index === 0) return part;
                return part.charAt(0).toUpperCase() + part.slice(1);
            })
            .join('');

        tools[toolName] = generateToolFromCatalogEntry(entry, caller);
    }

    return tools;
}

/**
 * Filter catalog entries by access level
 * Only include functions the user has permission to access
 */
export function filterCatalogByAccess(
    entries: FunctionCatalogEntry[],
    userRole: string | undefined
): FunctionCatalogEntry[] {
    return entries.filter((entry) => {
        switch (entry.access) {
            case 'public':
                return true;

            case 'protected':
                return !!userRole; // Any authenticated user

            case 'agency-only':
                return userRole?.includes('AGENCY');

            case 'team-scoped':
                return !!userRole; // Any authenticated user with team membership

            default:
                return false;
        }
    });
}

/**
 * Create a summary of available tools for the system prompt
 */
export function createToolsSummary(entries: FunctionCatalogEntry[]): string {
    const byCategory = new Map<string, FunctionCatalogEntry[]>();

    for (const entry of entries) {
        if (!byCategory.has(entry.category)) {
            byCategory.set(entry.category, []);
        }
        byCategory.get(entry.category)!.push(entry);
    }

    const lines: string[] = [];
    lines.push('Available API Functions:');
    lines.push('');

    for (const [category, funcs] of byCategory) {
        lines.push(`${category} (${funcs.length} functions):`);

        // Group by subcategory
        const bySubcategory = new Map<string, FunctionCatalogEntry[]>();
        for (const func of funcs) {
            if (!bySubcategory.has(func.subcategory)) {
                bySubcategory.set(func.subcategory, []);
            }
            bySubcategory.get(func.subcategory)!.push(func);
        }

        for (const [subcategory, subFuncs] of bySubcategory) {
            lines.push(`  - ${subcategory}: ${subFuncs.map(f => f.id.split('.').pop()).join(', ')}`);
        }
        lines.push('');
    }

    return lines.join('\n');
}
