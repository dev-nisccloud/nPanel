/**
 * Enhanced brand color extraction using multiple strategies:
 * 1. Logo image analysis (most accurate for brand colors)
 * 2. Visual DOM sampling (actual rendered prominence)
 * 3. Improved CSS variable parsing
 * 4. K-means clustering for deduplication
 *
 * Install: npm install node-vibrant sharp
 */
import { Vibrant } from "node-vibrant/node";
import sharp from "sharp";
/**
 * Extract colors from logo image using Vibrant algorithm
 * This is the most reliable source for brand colors
 */
export async function extractColorsFromLogo(logoUrl) {
    try {
        const response = await fetch(logoUrl, {
            signal: AbortSignal.timeout(8000),
            headers: {
                "User-Agent": "nPanel-NiscEmailBuilder/1.0 (+https://nisccloud.com)",
            },
        });
        if (!response.ok) {
            console.warn(`[brand-color] Failed to fetch logo: ${response.status}`);
            return [];
        }
        const buffer = await response.arrayBuffer();
        const imageBuffer = Buffer.from(buffer);
        // Convert to PNG using sharp first to normalize format
        const processedBuffer = await sharp(imageBuffer)
            .resize(400, 400, { fit: "inside", withoutEnlargement: true })
            .png()
            .toBuffer();
        // Use Vibrant for smart color extraction
        const palette = await Vibrant.from(processedBuffer).getPalette();
        const colors = [];
        // Vibrant colors are great for primary/accent
        if (palette.Vibrant) {
            colors.push(swatchToColorWithSource(palette.Vibrant, "logo", 100));
        }
        if (palette.DarkVibrant) {
            colors.push(swatchToColorWithSource(palette.DarkVibrant, "logo", 95));
        }
        if (palette.LightVibrant) {
            colors.push(swatchToColorWithSource(palette.LightVibrant, "logo", 90));
        }
        // Muted colors can be secondary
        if (palette.Muted) {
            colors.push(swatchToColorWithSource(palette.Muted, "logo", 80));
        }
        if (palette.DarkMuted) {
            colors.push(swatchToColorWithSource(palette.DarkMuted, "logo", 75));
        }
        const filtered = colors.filter((c) => !isBoringColor(c.hex));
        if (filtered.length > 0) {
            console.log(`[brand-color] ✅ Extracted ${filtered.length} colors from logo`);
        }
        return filtered;
    }
    catch (error) {
        console.warn("[brand-color] Logo extraction failed:", error instanceof Error ? error.message : error);
        return [];
    }
}
function swatchToColorWithSource(swatch, source, priority) {
    return {
        hex: swatch.hex,
        rgb: swatch.rgb,
        priority,
        source: `${source} (${swatch.population} pixels)`,
        context: source,
    };
}
/**
 * Enhanced boring color detection
 */
function isBoringColor(hex) {
    const h = hex.replace("#", "");
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;
    // Near-white
    if (diff < 15 && max > 235)
        return true;
    // Near-black
    if (diff < 15 && max < 30)
        return true;
    // Near-gray (low saturation, mid-range)
    if (diff < 20 && max > 150 && max < 240)
        return true;
    // Very low saturation
    const saturation = max === 0 ? 0 : diff / max;
    if (saturation < 0.08)
        return true;
    return false;
}
/**
 * Calculate perceptual color distance (CIEDE2000 approximation)
 */
function colorDistance(rgb1, rgb2) {
    // Convert to LAB color space for perceptual distance
    const lab1 = rgbToLab(rgb1);
    const lab2 = rgbToLab(rgb2);
    const deltaL = lab1[0] - lab2[0];
    const deltaA = lab1[1] - lab2[1];
    const deltaB = lab1[2] - lab2[2];
    return Math.sqrt(deltaL * deltaL + deltaA * deltaA + deltaB * deltaB);
}
function rgbToLab(rgb) {
    // RGB to XYZ
    let [r, g, b] = rgb.map((v) => {
        v = v / 255;
        return v > 0.04045 ? Math.pow((v + 0.055) / 1.055, 2.4) : v / 12.92;
    });
    const x = r * 0.4124564 + g * 0.3575761 + b * 0.1804375;
    const y = r * 0.2126729 + g * 0.7151522 + b * 0.072175;
    const z = r * 0.0193339 + g * 0.119192 + b * 0.9503041;
    // XYZ to LAB
    const xn = 0.95047;
    const yn = 1.0;
    const zn = 1.08883;
    const fx = x / xn > 0.008856 ? Math.pow(x / xn, 1 / 3) : 7.787 * (x / xn) + 16 / 116;
    const fy = y / yn > 0.008856 ? Math.pow(y / yn, 1 / 3) : 7.787 * (y / yn) + 16 / 116;
    const fz = z / zn > 0.008856 ? Math.pow(z / zn, 1 / 3) : 7.787 * (z / zn) + 16 / 116;
    const L = 116 * fy - 16;
    const A = 500 * (fx - fy);
    const B = 200 * (fy - fz);
    return [L, A, B];
}
/**
 * Cluster similar colors using k-means-like approach
 */
export function clusterColors(colors, threshold = 20) {
    if (colors.length === 0)
        return [];
    const clusters = [];
    for (const color of colors) {
        let foundCluster = false;
        for (const cluster of clusters) {
            const representative = cluster[0];
            if (colorDistance(color.rgb, representative.rgb) < threshold) {
                cluster.push(color);
                foundCluster = true;
                break;
            }
        }
        if (!foundCluster) {
            clusters.push([color]);
        }
    }
    // Return the highest priority color from each cluster
    return clusters.map((cluster) => {
        cluster.sort((a, b) => b.priority - a.priority);
        return cluster[0];
    });
}
/**
 * Calculate color saturation (0-1)
 */
export function colorSaturation(rgb) {
    const [r, g, b] = rgb.map((v) => v / 255);
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    if (max === 0)
        return 0;
    return (max - min) / max;
}
/**
 * Calculate color brightness (0-1)
 */
export function colorBrightness(rgb) {
    const [r, g, b] = rgb;
    return (r * 299 + g * 587 + b * 114) / 255000;
}
/**
 * Assign semantic roles to colors based on their properties
 */
export function assignColorRoles(colors) {
    if (colors.length === 0) {
        return {
            primary: null,
            accent: null,
            secondary: null,
            confidence: { primary: 0, accent: 0, secondary: 0 },
            sources: { primary: "none", accent: "none", secondary: "none" },
        };
    }
    // Sort by priority first
    const sorted = [...colors].sort((a, b) => b.priority - a.priority);
    // Primary: Highest priority, high saturation (brand's main color)
    const primaryCandidates = sorted.filter((c) => colorSaturation(c.rgb) > 0.3 && c.context === "logo");
    const primary = primaryCandidates[0] || sorted[0];
    // Accent: Different hue from primary, high saturation (CTA color)
    const used = new Set([primary?.hex]);
    const accentCandidates = sorted.filter((c) => {
        if (used.has(c.hex))
            return false;
        if (colorSaturation(c.rgb) < 0.4)
            return false;
        if (primary && colorDistance(c.rgb, primary.rgb) < 30)
            return false;
        return true;
    });
    const accent = accentCandidates[0];
    if (accent)
        used.add(accent.hex);
    // Secondary: Different from primary and accent
    const secondaryCandidates = sorted.filter((c) => {
        if (used.has(c.hex))
            return false;
        if (primary && colorDistance(c.rgb, primary.rgb) < 25)
            return false;
        if (accent && colorDistance(c.rgb, accent.rgb) < 25)
            return false;
        return true;
    });
    const secondary = secondaryCandidates[0];
    // Calculate confidence scores (0-1)
    const maxPriority = Math.max(...colors.map((c) => c.priority));
    const confidence = {
        primary: primary ? primary.priority / maxPriority : 0,
        accent: accent ? accent.priority / maxPriority : 0,
        secondary: secondary ? secondary.priority / maxPriority : 0,
    };
    return {
        primary: primary?.hex || null,
        accent: accent?.hex || null,
        secondary: secondary?.hex || null,
        confidence,
        sources: {
            primary: primary?.source || "none",
            accent: accent?.source || "none",
            secondary: secondary?.source || "none",
        },
    };
}
/**
 * Main entry point: extract brand colors from all available sources
 */
export async function extractBrandColors(params) {
    const allColors = [...params.cssColors];
    // 1. Extract from logo (highest priority)
    if (params.logoUrl) {
        const logoColors = await extractColorsFromLogo(params.logoUrl);
        allColors.push(...logoColors);
    }
    // 2. Cluster similar colors to remove duplicates
    const clustered = clusterColors(allColors, 20);
    // 3. Assign semantic roles
    const palette = assignColorRoles(clustered);
    return palette;
}
