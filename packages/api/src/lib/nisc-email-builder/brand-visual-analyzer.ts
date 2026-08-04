/**
 * Visual brand color analysis using Puppeteer
 * Samples actual rendered colors from DOM elements
 * 
 * This is more accurate than CSS parsing because it captures:
 * - Computed styles (after all CSS cascading)
 * - Actually visible elements
 * - Color usage frequency by viewport area
 */

import type { Page } from "puppeteer";

interface VisualColorSample {
	color: string; // hex
	rgb: [number, number, number];
	frequency: number; // how many times sampled
	contexts: string[]; // element types where found
	priority: number;
}

/**
 * Sample colors from rendered DOM elements
 * Focuses on brand-relevant elements (buttons, headers, nav, hero sections)
 */
export async function analyzeVisualColors(page: Page): Promise<VisualColorSample[]> {
	try {
		const colors = await page.evaluate(() => {
			const colorMap = new Map<string, {
				rgb: [number, number, number];
				count: number;
				contexts: Set<string>;
				totalArea: number;
			}>();

			function rgbToHex(r: number, g: number, b: number): string {
				return "#" + [r, g, b]
					.map((n) => n.toString(16).padStart(2, "0"))
					.join("");
			}

			function parseRgb(colorStr: string): [number, number, number] | null {
				const match = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
				if (!match) return null;
				return [parseInt(match[1]!), parseInt(match[2]!), parseInt(match[3]!)];
			}

			function isBoringColor(rgb: [number, number, number]): boolean {
				const [r, g, b] = rgb;
				const max = Math.max(r, g, b);
				const min = Math.min(r, g, b);
				const diff = max - min;

				// Near-white, near-black, or near-gray
				if (diff < 15 && (max > 235 || max < 30)) return true;
				if (diff < 20 && max > 150 && max < 240) return true;

				return false;
			}

			function sampleElement(
				el: Element,
				contextWeight: number,
				contextName: string,
			): void {
				const computed = window.getComputedStyle(el);
				const rect = el.getBoundingClientRect();
				const area = rect.width * rect.height;

				// Only sample visible elements
				if (area < 100) return; // too small
				if (rect.top > window.innerHeight * 2) return; // too far down

				// Sample background color
				const bgColor = computed.backgroundColor;
				if (bgColor && bgColor !== "rgba(0, 0, 0, 0)" && bgColor !== "transparent") {
					const rgb = parseRgb(bgColor);
					if (rgb && !isBoringColor(rgb)) {
						const hex = rgbToHex(...rgb);
						const existing = colorMap.get(hex) || {
							rgb,
							count: 0,
							contexts: new Set<string>(),
							totalArea: 0,
						};
						existing.count += contextWeight;
						existing.contexts.add(contextName);
						existing.totalArea += area * contextWeight;
						colorMap.set(hex, existing);
					}
				}

				// Sample text color (lower priority)
				const textColor = computed.color;
				if (textColor) {
					const rgb = parseRgb(textColor);
					if (rgb && !isBoringColor(rgb)) {
						const hex = rgbToHex(...rgb);
						const existing = colorMap.get(hex) || {
							rgb,
							count: 0,
							contexts: new Set<string>(),
							totalArea: 0,
						};
						existing.count += contextWeight * 0.3; // text is less important
						existing.contexts.add(`${contextName}-text`);
						existing.totalArea += area * contextWeight * 0.1;
						colorMap.set(hex, existing);
					}
				}

				// Sample border color if prominent
				const borderWidth = parseFloat(computed.borderWidth);
				if (borderWidth > 1) {
					const borderColor = computed.borderColor;
					if (borderColor) {
						const rgb = parseRgb(borderColor);
						if (rgb && !isBoringColor(rgb)) {
							const hex = rgbToHex(...rgb);
							const existing = colorMap.get(hex) || {
								rgb,
								count: 0,
								contexts: new Set<string>(),
								totalArea: 0,
							};
							existing.count += contextWeight * 0.5;
							existing.contexts.add(`${contextName}-border`);
							colorMap.set(hex, existing);
						}
					}
				}
			}

			// Sample in order of brand relevance (highest priority first)

			// 1. Buttons and CTAs (highest priority - where brand accent lives)
			const buttons = document.querySelectorAll(
				'button, [role="button"], a[class*="button"], a[class*="btn"], a[class*="cta"], input[type="submit"]',
			);
			buttons.forEach((btn) => sampleElement(btn, 100, "button"));

			// 2. Header and navigation
			const headers = document.querySelectorAll("header, nav, [role='banner'], [role='navigation']");
			headers.forEach((header) => sampleElement(header, 90, "header"));

			// 3. Hero section / main content
			const heros = document.querySelectorAll(
				'[class*="hero"], [class*="banner"], main > section:first-of-type, [class*="jumbotron"]',
			);
			heros.forEach((hero) => sampleElement(hero, 85, "hero"));

			// 4. Links (often brand color)
			const links = Array.from(document.querySelectorAll("a")).slice(0, 50);
			links.forEach((link) => sampleElement(link, 70, "link"));

			// 5. Headings
			const headings = document.querySelectorAll("h1, h2, h3");
			headings.forEach((h) => sampleElement(h, 60, "heading"));

			// 6. Cards and sections
			const cards = document.querySelectorAll(
				'[class*="card"], [class*="box"], section, article',
			);
			Array.from(cards).slice(0, 20).forEach((card) => sampleElement(card, 40, "card"));

			// Convert map to array
			return Array.from(colorMap.entries()).map(([hex, data]) => ({
				hex,
				rgb: data.rgb,
				count: data.count,
				contexts: Array.from(data.contexts),
				totalArea: data.totalArea,
			}));
		});

		// Calculate priority based on frequency and area
		const samples: VisualColorSample[] = colors.map((c) => {
			// Normalize priority (0-100 scale)
			const maxCount = Math.max(...colors.map((x) => x.count));
			const maxArea = Math.max(...colors.map((x) => x.totalArea));
			
			const countScore = (c.count / maxCount) * 60;
			const areaScore = (c.totalArea / maxArea) * 40;
			const priority = countScore + areaScore;

			return {
				color: c.hex,
				rgb: c.rgb,
				frequency: c.count,
				contexts: c.contexts,
				priority: Math.round(priority),
			};
		});

		// Sort by priority
		samples.sort((a, b) => b.priority - a.priority);

		return samples.slice(0, 15); // top 15 colors
	} catch (error) {
		console.warn("[brand-visual] Visual analysis failed:", error);
		return [];
	}
}

/**
 * Analyze screenshot for dominant colors (fallback method)
 * Use only when DOM analysis isn't possible
 */
export async function analyzeScreenshot(screenshotBuffer: Buffer): Promise<{
	dominantColor: string;
	palette: string[];
}> {
	try {
		const { Vibrant } = await import("node-vibrant/node");
		const palette = await Vibrant.from(screenshotBuffer)
			.quality(5)
			.getPalette();

		const colors: string[] = [];
		
		if (palette.Vibrant) colors.push(palette.Vibrant.hex);
		if (palette.DarkVibrant) colors.push(palette.DarkVibrant.hex);
		if (palette.LightVibrant) colors.push(palette.LightVibrant.hex);
		if (palette.Muted) colors.push(palette.Muted.hex);
		if (palette.DarkMuted) colors.push(palette.DarkMuted.hex);

		return {
			dominantColor: palette.Vibrant?.hex || palette.DarkVibrant?.hex || colors[0] || "#000000",
			palette: colors,
		};
	} catch (error) {
		console.warn("[brand-visual] Screenshot analysis failed:", error);
		return {
			dominantColor: "#000000",
			palette: [],
		};
	}
}
