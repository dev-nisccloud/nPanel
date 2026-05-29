/** Normalize user input to #rrggbb or null if invalid. */
export function normalizeHex(input: string): string | null {
	const s = input.trim();
	if (/^#[0-9a-fA-F]{6}$/.test(s)) return s.toLowerCase();
	if (/^#[0-9a-fA-F]{3}$/.test(s)) {
		const h = s.slice(1);
		return `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`.toLowerCase();
	}
	return null;
}

/** Coerce rgb/short hex to #rrggbb for the picker UI. */
export function coerceHexColor(value: string, fallback = "#000000"): string {
	if (!value || value === "transparent") return fallback;
	if (value.startsWith("#")) {
		if (value.length === 4) {
			const h = value.slice(1);
			return `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`.toLowerCase();
		}
		return value.length === 7 ? value.toLowerCase() : fallback;
	}
	const m = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
	if (!m) return fallback;
	const r = Number(m[1]);
	const g = Number(m[2]);
	const b = Number(m[3]);
	return `#${[r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("")}`;
}
