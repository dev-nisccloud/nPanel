/**
 * Builds README.md from inventory.json plus the hand-authored SVG files.
 * Run after export-artworks.ts:  bun design/illustration-library/build-readme.ts
 */
import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";

const root = import.meta.dir;
const inventory = JSON.parse(await Bun.file(join(root, "inventory.json")).text()) as {
  exportedAt: string;
  artworks: {
    id: string;
    title: string;
    category: string;
    source: string;
    kind: string;
    mobile: boolean;
    width?: number;
    height?: number;
    mobileWidth?: number;
    mobileHeight?: number;
  }[];
};

const categories = ["homepage", "cloud", "npanel", "growth", "ai", "industries", "security", "archive"];
const svgByCategory = new Map<string, string[]>();
for (const category of categories) {
  try {
    const files = (await readdir(join(root, category))).filter((f) => f.endsWith(".svg"));
    svgByCategory.set(category, files);
  } catch {
    svgByCategory.set(category, []);
  }
}

const kindLabel: Record<string, string> = {
  "authentic-ui": "Authentic nPanel UI (sanitised, fictional data)",
  conceptual: "Conceptual product composition",
  editorial: "Editorial / creative composition",
};

const date = inventory.exportedAt.slice(0, 10);
const lines: string[] = [];
lines.push("# Nisc Cloud illustration library");
lines.push("");
lines.push(
  "Reusable exports of the website artwork for social media, proposals, decks, brochures, advertising and documentation. Every composition uses fictional organisations (Savanna Bakery, Savanna Industries, Acacia Traders, Jambo Clinic, Kilima Tours, Baobab Media) and contains no real customer data.",
);
lines.push("");
lines.push("## Brand rules baked into the artwork");
lines.push("");
lines.push("- Primary: Nisc Cloud sky blue `#38b6ff` (`--primary`).");
lines.push("- Secondary accent: orange `#fc734d` (`--color-brand-orange`), used only for emphasis, selection and small highlights.");
lines.push("- Typography: DM Sans Variable (UI) and Space Mono (technical labels), both self-hosted via Fontsource (OFL).");
lines.push("- Status colours (green / amber / red) are reserved for real status meaning.");
lines.push("");
lines.push("## How to regenerate");
lines.push("");
lines.push("```bash");
lines.push("bun run dev                                    # Vite on http://localhost:5174");
lines.push("bun design/illustration-library/export-artworks.ts");
lines.push("bun design/illustration-library/build-readme.ts");
lines.push("```");
lines.push("");
lines.push(
  "`export-artworks.ts` renders the development-only route `/__artwork-library` (registered in `src/App.tsx` only when `import.meta.env.DEV` is true) and captures each component at 2× with its intended stage background. The React source stays editable in `src/components/artwork/`.",
);
lines.push("");
lines.push("## Formats");
lines.push("");
lines.push("- `*.webp` — optimised 2× raster for web, decks and social.");
lines.push("- `*@2x.png` — lossless 2× raster for print layouts and design tools.");
lines.push("- `*-mobile.*` — separately composed mobile variant where the layout differs substantially.");
lines.push(
  "- `*.svg` — true vector artwork, hand-authored for the flagship concepts. These are editable in Figma/Illustrator and contain no embedded rasters. React/CSS compositions that depend on layered DOM effects (backdrop blur, box-shadows, variable fonts) are **not** faithfully exportable as standalone SVG and are supplied as PNG/WebP only.",
);
lines.push("");
lines.push("## Inventory");
lines.push("");
lines.push(`Exported ${inventory.artworks.length} compositions on ${date}.`);
lines.push("");

for (const category of categories) {
  const items = inventory.artworks.filter((a) => a.category === category);
  const svgs = svgByCategory.get(category) ?? [];
  if (items.length === 0 && svgs.length === 0) continue;
  lines.push(`### ${category}/`);
  lines.push("");
  lines.push("| Artwork | Source component | Type | Exports | Dimensions |");
  lines.push("| --- | --- | --- | --- | --- |");
  for (const a of items) {
    const exports = [`${a.id}.webp`, `${a.id}@2x.png`];
    if (a.mobile) exports.push(`${a.id}-mobile.webp`, `${a.id}-mobile@2x.png`);
    const matchingSvg = svgs.find((s) => s.replace(".svg", "") === a.id);
    if (matchingSvg) exports.push(matchingSvg);
    const dims = [`${a.width}×${a.height}`];
    if (a.mobileWidth) dims.push(`mobile ${a.mobileWidth}×${a.mobileHeight}`);
    lines.push(
      `| **${a.title}** | \`${a.source}\` | ${kindLabel[a.kind] ?? a.kind} | ${exports.map((e) => `\`${e}\``).join("<br>")} | ${dims.join("<br>")} |`,
    );
  }
  for (const s of svgs.filter((s) => !items.some((a) => a.id === s.replace(".svg", "")))) {
    const size = (await stat(join(root, category, s))).size;
    lines.push(`| **${s.replace(".svg", "")}** (vector concept) | hand-authored SVG | True vector | \`${s}\` | 1200×720 viewBox, ${Math.round(size / 1024)} KB |`);
  }
  lines.push("");
}

lines.push("## Contact sheet");
lines.push("");
lines.push("`contact-sheet.webp` / `contact-sheet.png` show the full collection as rendered on the export route.");
lines.push("");
lines.push("## Archive");
lines.push("");
lines.push("`archive/` holds superseded compositions kept for reference. Nothing in `archive/` should be used in new marketing.");
lines.push("");

await Bun.write(join(root, "README.md"), lines.join("\n"));
console.log(`README.md written with ${inventory.artworks.length} inventory rows.`);
