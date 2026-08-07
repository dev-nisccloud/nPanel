/**
 * Enhanced brand color extraction using multiple strategies:
 * 1. Logo image analysis (most accurate for brand colors)
 * 2. Visual DOM sampling (actual rendered prominence)
 * 3. Improved CSS variable parsing
 * 4. K-means clustering for deduplication
 *
 * Install: npm install node-vibrant sharp
 */
export interface EnhancedBrandPalette {
    primary: string | null;
    accent: string | null;
    secondary: string | null;
    confidence: {
        primary: number;
        accent: number;
        secondary: number;
    };
    sources: {
        primary: string;
        accent: string;
        secondary: string;
    };
}
interface ColorWithSource {
    hex: string;
    rgb: [number, number, number];
    priority: number;
    source: string;
    context: "logo" | "css" | "visual" | "meta";
}
/**
 * Extract colors from logo image using Vibrant algorithm
 * This is the most reliable source for brand colors
 */
export declare function extractColorsFromLogo(logoUrl: string): Promise<ColorWithSource[]>;
/**
 * Cluster similar colors using k-means-like approach
 */
export declare function clusterColors(colors: ColorWithSource[], threshold?: number): ColorWithSource[];
/**
 * Calculate color saturation (0-1)
 */
export declare function colorSaturation(rgb: [number, number, number]): number;
/**
 * Calculate color brightness (0-1)
 */
export declare function colorBrightness(rgb: [number, number, number]): number;
/**
 * Assign semantic roles to colors based on their properties
 */
export declare function assignColorRoles(colors: ColorWithSource[]): EnhancedBrandPalette;
/**
 * Main entry point: extract brand colors from all available sources
 */
export declare function extractBrandColors(params: {
    logoUrl?: string;
    cssColors: ColorWithSource[];
}): Promise<EnhancedBrandPalette>;
export {};
