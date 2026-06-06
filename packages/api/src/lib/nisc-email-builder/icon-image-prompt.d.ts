/**
 * Builds Imagen prompts for email icons. backgroundColor hex is metadata only -
 * never echoed as #RRGGBB in the prompt (models often render it as visible text).
 */
/** Human-readable fill for image gen - no hex strings. */
export declare function hexToPlainBackgroundDescription(hex: string): string;
export declare function buildIconImagePrompt(params: {
    prompt: string;
    backgroundColorHex?: string;
    compRefLine?: string;
}): string;
