/**
 * Register Geist fonts for agency invoice PDFs (server-side).
 * Mirrors agency.invoices.$id.tsx `registerFonts` using files from apps/web/public/font.
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
let fontsRegistered = false;
const fontWeights = [
    { name: "Geist-Thin.ttf", weight: "thin" },
    { name: "Geist-UltraLight.ttf", weight: "ultralight" },
    { name: "Geist-Light.ttf", weight: "light" },
    { name: "Geist-Regular.ttf", weight: "normal" },
    { name: "Geist-Medium.ttf", weight: "medium" },
    { name: "Geist-SemiBold.ttf", weight: "semibold" },
    { name: "Geist-Bold.ttf", weight: "bold" },
    { name: "Geist-UltraBlack.ttf", weight: "ultrabold" },
];
function resolveFontDir() {
    const here = path.dirname(fileURLToPath(import.meta.url));
    const candidates = [
        path.resolve(here, "../../../apps/web/public/font"),
        path.resolve(here, "../../../../apps/web/public/font"),
        path.resolve(process.cwd(), "apps/web/public/font"),
    ];
    for (const dir of candidates) {
        if (fs.existsSync(path.join(dir, "Geist-Regular.ttf")))
            return dir;
    }
    return candidates[0];
}
export async function registerAgencyInvoicePdfFonts() {
    if (fontsRegistered)
        return true;
    const { Font } = await import("@react-pdf/renderer");
    const fontDir = resolveFontDir();
    const fonts = fontWeights
        .map(({ name, weight }) => {
        const filePath = path.join(fontDir, name);
        if (!fs.existsSync(filePath))
            return null;
        const data = fs.readFileSync(filePath);
        const base64 = data.toString("base64");
        return {
            src: `data:font/truetype;base64,${base64}`,
            fontWeight: weight,
        };
    })
        .filter((f) => f !== null);
    if (fonts.length === 0)
        return false;
    Font.register({
        family: "Geist",
        fonts,
    });
    fontsRegistered = true;
    return true;
}
