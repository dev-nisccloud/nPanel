import type { z } from "zod";
export declare function stripCodeFences(raw: string): string;
/**
 * Strip ALL markdown code fences from any position in the string.
 * Handles the case where the model wraps output in code fences even
 * when prefixed with other characters.
 */
export declare function stripAllCodeFences(raw: string): string;
/**
 * Try every `{` in the string as a potential JSON object start.
 * Returns the first candidate that is syntactically balanced.
 */
export declare function extractAllJsonObjects(s: string): string[];
/** @deprecated Use extractAllJsonObjects. Kept for backwards compatibility. */
export declare function extractFirstJsonObject(s: string): string | null;
/**
 * Repair common JSON issues that LLMs produce:
 * 1. Literal newlines inside string values (replace with \n)
 * 2. Trailing commas before } or ]
 */
export declare function repairJson(raw: string): string;
export declare function collectReplicateText(output: unknown): Promise<string>;
export declare function parseJsonFromModel<T>(raw: string, schema: z.ZodType<T>): T;
