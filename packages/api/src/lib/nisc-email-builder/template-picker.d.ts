import Replicate from "replicate";
import type { NebBrief } from "./types";
export type TemplateInfo = {
    filename: string;
    name: string;
    category: string;
    description: string;
    tags: string[];
    useCases: string;
};
/**
 * Catalog of all available reference templates.
 * Update this list whenever new templates are added to sample-templates/.
 */
export declare const TEMPLATE_CATALOG: TemplateInfo[];
/**
 * AI-powered template picker using Haiku for fast, cheap classification.
 * Falls back to keyword matching if the AI call fails.
 */
export declare function pickTemplates(brief: NebBrief, replicate: Replicate): Promise<TemplateInfo[]>;
/**
 * Load and compress template HTML files from the sample-templates directory.
 * Returns an array of { name, filename, html } objects.
 */
export declare function loadTemplateHtml(templates: TemplateInfo[]): Array<{
    name: string;
    filename: string;
    html: string;
}>;
