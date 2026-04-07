import { smartFormat } from './response-formatter';
/**
 * Parse tRPC path and execute the procedure
 */
async function executeTrpcProcedure(path, input, caller) {
    const parts = path.split('.');
    let current = caller;
    for (const part of parts) {
        if (!current[part]) {
            throw new Error(`tRPC procedure not found: ${path}`);
        }
        current = current[part];
    }
    if (typeof current === 'function') {
        return await current(input);
    }
    throw new Error(`Invalid tRPC procedure: ${path}`);
}
/**
 * Recurse through schema to remove non-standard keys and fix types for OpenAI compatibility
 */
function sanitizeSchema(schema) {
    if (!schema || typeof schema !== 'object')
        return schema;
    const sanitized = { ...schema };
    // OpenAI doesn't allow 'enum' as a type, it must be 'string' with the 'enum' keyword
    if (sanitized.type === 'enum') {
        sanitized.type = 'string';
    }
    // Remove non-standard keywords that cause OpenAI validation errors
    const nonStandardKeywords = ['optional', 'access', 'subcategory', 'category', 'status'];
    for (const key of nonStandardKeywords) {
        delete sanitized[key];
    }
    // Process properties recursively
    if (sanitized.properties && typeof sanitized.properties === 'object') {
        const cleanedProps = {};
        for (const [key, value] of Object.entries(sanitized.properties)) {
            cleanedProps[key] = sanitizeSchema(value);
        }
        sanitized.properties = cleanedProps;
    }
    // Process items recursively
    if (sanitized.items) {
        sanitized.items = sanitizeSchema(sanitized.items);
    }
    return sanitized;
}
/**
 * Generate AI tool structure from catalog entry
 */
export function generateToolFromCatalogEntry(entry, caller) {
    return {
        description: entry.description,
        parameters: sanitizeSchema(entry.inputSchema),
        execute: async (input) => {
            try {
                console.log(`[AI Tool] Executing ${entry.id} with input:`, input);
                const result = await executeTrpcProcedure(entry.id, input, caller);
                console.log(`[AI Tool] ${entry.id} completed successfully`);
                return smartFormat(result, {
                    functionName: entry.id
                });
            }
            catch (error) {
                console.error(`[AI Tool] Error executing ${entry.id}:`, error);
                return {
                    error: true,
                    message: error instanceof Error ? error.message : 'Unknown error occurred',
                    functionId: entry.id,
                };
            }
        },
    };
}
/**
 * Generate all tools from catalog entries
 */
export function generateToolsFromCatalog(entries, caller) {
    const tools = {};
    for (const entry of entries) {
        const toolName = entry.id
            .split('.')
            .map((part, index) => {
            if (index === 0)
                return part;
            return part.charAt(0).toUpperCase() + part.slice(1);
        })
            .join('');
        tools[toolName] = generateToolFromCatalogEntry(entry, caller);
    }
    return tools;
}
/**
 * Filter catalog entries by access level
 */
export function filterCatalogByAccess(entries, userRole) {
    return entries.filter((entry) => {
        switch (entry.access) {
            case 'public': return true;
            case 'protected': return !!userRole;
            case 'agency-only': return userRole?.includes('AGENCY');
            case 'team-scoped': return !!userRole;
            default: return false;
        }
    });
}
/**
 * Create a summary of available tools for the system prompt
 */
export function createToolsSummary(allowedFunctions, allCategories) {
    const byCategory = new Map();
    for (const entry of allowedFunctions) {
        if (!byCategory.has(entry.category)) {
            byCategory.set(entry.category, []);
        }
        byCategory.get(entry.category).push(entry);
    }
    const lines = [];
    lines.push('Available API Functions (Live Tools):');
    lines.push('');
    // List categories with live tools
    for (const [category, funcs] of byCategory) {
        lines.push(`${category} (${funcs.length} tools):`);
        const bySubcategory = new Map();
        for (const func of funcs) {
            if (!bySubcategory.has(func.subcategory)) {
                bySubcategory.set(func.subcategory, []);
            }
            bySubcategory.get(func.subcategory).push(func);
        }
        for (const [subcategory, subFuncs] of bySubcategory) {
            lines.push(`  - ${subcategory}: ${subFuncs.map(f => f.id.split('.').pop()).join(', ')}`);
        }
        lines.push('');
    }
    // List Documentation-Only categories if requested
    if (allCategories) {
        const documentationOnlyLineIds = [];
        for (const cat of allCategories) {
            if (!byCategory.has(cat.name)) {
                documentationOnlyLineIds.push(`${cat.name} (Coming Soon/Doc-Only)`);
            }
        }
        if (documentationOnlyLineIds.length > 0) {
            lines.push('Other Documented Capabilities (Currently restricted or in development):');
            documentationOnlyLineIds.forEach(line => lines.push(`- ${line}`));
            lines.push('NOTE: If a user asks for these, inform them that while the feature exists in documentation, the specific API tools are not currently available for this chat session.');
            lines.push('');
        }
    }
    return lines.join('\n');
}
