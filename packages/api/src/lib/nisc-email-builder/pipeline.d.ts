import type { NebValidationReport } from "./types";
export declare function stripDangerousHtml(html: string): string;
export declare function htmlToPlainText(html: string): string;
export declare function validateEmailHtml(html: string): NebValidationReport;
export declare function processEmailHtml(rawHtml: string): {
    html: string;
    text: string;
    validation: NebValidationReport;
};
export declare function patchImagePlaceholders(html: string, replacements: Record<string, string>): string;
