import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { z } from "zod";
import Replicate from "replicate";
import { NEB_TEMPLATE_PICKER_MODEL } from "./constants";
import { runAnthropicOnReplicate } from "./replicate-llm";
const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = join(__dirname, "sample-templates");
/**
 * Catalog of all available reference templates.
 * Update this list whenever new templates are added to sample-templates/.
 */
export const TEMPLATE_CATALOG = [
    {
        filename: "agency_1.html",
        name: "Agency / Professional Services",
        category: "agency",
        description: "Bold agency email with services showcase, expertise highlights, credentials, and a project inquiry CTA. Strong visual hierarchy with dark sections.",
        tags: [
            "agency",
            "consulting",
            "professional services",
            "b2b",
            "marketing agency",
            "design agency",
            "branding",
            "digital agency",
            "law firm",
            "accounting",
        ],
        useCases: "Best for: agencies, consulting firms, B2B services, professional services, creative studios, law firms",
    },
    {
        filename: "announcement_1.html",
        name: "Product / Feature Announcement",
        category: "announcement",
        description: "Clean, modern announcement email with compelling headline, feature highlights, launch details, and an action CTA. Works for both product and company news.",
        tags: [
            "announcement",
            "launch",
            "new feature",
            "new product",
            "product release",
            "update",
            "news",
            "event",
            "webinar",
            "partnership",
            "milestone",
        ],
        useCases: "Best for: product launches, feature releases, company news, event announcements, webinars, milestones",
    },
    {
        filename: "beauty_personal_care_1.html",
        name: "Beauty & Personal Care – Minimalist",
        category: "beauty",
        description: "Elegant minimalist beauty email with a product spotlight, clean white space, soft color palette, and a refined CTA. Premium feel.",
        tags: [
            "beauty",
            "skincare",
            "cosmetics",
            "personal care",
            "wellness",
            "spa",
            "luxury",
            "self-care",
            "organic",
            "natural beauty",
            "fragrance",
        ],
        useCases: "Best for: skincare brands, beauty products, wellness, spa services, natural beauty, luxury personal care",
    },
    {
        filename: "beauty_personal_care_2.html",
        name: "Beauty & Personal Care – Premium Multi-Product",
        category: "beauty",
        description: "Premium beauty email with multi-product grid layout, rich imagery, seasonal promotion banner, and multiple CTAs. Great for product collections.",
        tags: [
            "beauty",
            "skincare",
            "cosmetics",
            "personal care",
            "seasonal",
            "collection",
            "multi-product",
            "sale",
            "promotion",
            "luxury beauty",
            "makeup",
        ],
        useCases: "Best for: beauty brands with multiple products, seasonal beauty promotions, gift sets, collections",
    },
    {
        filename: "beauty_personal_care_3.html",
        name: "Beauty & Personal Care – Bold Campaign",
        category: "beauty",
        description: "Bold, campaign-style beauty email with striking visuals, collection showcase, editorial layout, and strong CTA. High-impact design.",
        tags: [
            "beauty",
            "campaign",
            "collection launch",
            "new arrivals",
            "cosmetics",
            "makeup",
            "editorial",
            "bold",
            "vibrant",
            "influencer",
        ],
        useCases: "Best for: beauty campaigns, new collection launches, makeup brands, influencer collaborations, editorial beauty",
    },
    {
        filename: "ecommerce_1.html",
        name: "E-commerce – Promotional Sale",
        category: "ecommerce",
        description: "High-conversion sale email with discount banner, urgency countdown, product showcase grid, and clear buy-now CTA. Drives immediate action.",
        tags: [
            "ecommerce",
            "sale",
            "discount",
            "promotion",
            "shop",
            "product",
            "retail",
            "offer",
            "deal",
            "flash sale",
            "clearance",
            "percent off",
        ],
        useCases: "Best for: retail promotions, flash sales, discount offers, seasonal sales, product promotions",
    },
    {
        filename: "ecommerce_2.html",
        name: "E-commerce – New Arrivals",
        category: "ecommerce",
        description: "New arrivals email with product grid, featured items, category sections, and shop-now CTA. Clean retail layout.",
        tags: [
            "ecommerce",
            "new arrivals",
            "new products",
            "shop",
            "retail",
            "collection",
            "inventory",
            "fashion",
            "apparel",
            "accessories",
            "catalog",
        ],
        useCases: "Best for: new product arrivals, seasonal collections, retail newsletters, fashion brands, product catalogs",
    },
    {
        filename: "ecommerce_furniture.html",
        name: "E-commerce – Furniture & Home Decor",
        category: "ecommerce",
        description: "Lifestyle-focused home goods email with room scenes, product features, interior inspiration, and design appeal. Warm, aspirational tone.",
        tags: [
            "furniture",
            "home decor",
            "interior design",
            "lifestyle",
            "home goods",
            "design",
            "living room",
            "bedroom",
            "kitchen",
            "outdoor",
            "renovation",
        ],
        useCases: "Best for: furniture brands, home decor, interior design products, lifestyle home goods, renovation services",
    },
    {
        filename: "finance_1.html",
        name: "Finance – Investment / Wealth Management",
        category: "finance",
        description: "Professional finance email with key stats, trust signals, investment highlights, market data, and wealth management CTA. Trustworthy and authoritative.",
        tags: [
            "finance",
            "investment",
            "wealth management",
            "banking",
            "financial services",
            "fintech",
            "savings",
            "returns",
            "portfolio",
            "stocks",
            "crypto",
            "trading",
        ],
        useCases: "Best for: financial services, investment platforms, banking, fintech apps, wealth management, trading",
    },
    {
        filename: "finance_2.html",
        name: "Finance – Institutional / Corporate Finance",
        category: "finance",
        description: "Institutional finance email with report highlights, market insights, professional data presentation, and corporate-grade trust signals.",
        tags: [
            "finance",
            "institutional",
            "corporate",
            "insurance",
            "banking",
            "wealth management",
            "quarterly report",
            "market update",
            "newsletter",
            "accounting",
            "tax",
        ],
        useCases: "Best for: institutional finance, corporate banking, insurance, professional finance newsletters, quarterly reports",
    },
    {
        filename: "transactional_1.html",
        name: "Transactional – Order Confirmation / Notification",
        category: "transactional",
        description: "Clean transactional email with order details, summary table, status updates, itemized breakdown, and next-steps. Functional yet polished.",
        tags: [
            "transactional",
            "order",
            "receipt",
            "confirmation",
            "notification",
            "invoice",
            "booking",
            "shipping",
            "delivery",
            "password reset",
            "account",
            "welcome email",
            "onboarding",
        ],
        useCases: "Best for: order confirmations, booking receipts, account notifications, shipping updates, invoices, welcome emails",
    },
];
const pickerResponseSchema = z.object({
    reasoning: z.string(),
    selected: z.array(z.string()).min(1).max(3),
});
/**
 * Keyword-based fallback picker - scores templates by how many
 * tags appear in the brief text and returns the top 1-2.
 */
function keywordPick(brief) {
    const text = [
        brief.companyName,
        brief.goal,
        brief.audience,
        brief.emailType,
        brief.tone,
        brief.instructions,
    ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
    const scored = TEMPLATE_CATALOG.map((t) => ({
        template: t,
        score: t.tags.filter((tag) => text.includes(tag.toLowerCase())).length,
    })).sort((a, b) => b.score - a.score);
    const [first, second, third] = scored;
    const results = [first.template];
    // Add 2nd if it has a meaningful score close to the first
    if (second && second.score > 0 && first.score - second.score <= 2) {
        results.push(second.template);
    }
    // Add 3rd if it also has a meaningful score close to the second
    if (results.length === 2 &&
        third &&
        third.score > 0 &&
        (results[1] ? scored.find((s) => s.template === results[1]).score - third.score <= 2 : false)) {
        results.push(third.template);
    }
    return results;
}
/**
 * AI-powered template picker using Haiku for fast, cheap classification.
 * Falls back to keyword matching if the AI call fails.
 */
export async function pickTemplates(brief, replicate) {
    const catalogList = TEMPLATE_CATALOG.map((t) => `- ${t.filename}: ${t.name} - ${t.description} | ${t.useCases}`).join("\n");
    const briefText = [
        brief.companyName && `Company: ${brief.companyName}`,
        brief.goal && `Goal: ${brief.goal}`,
        brief.audience && `Audience: ${brief.audience}`,
        brief.emailType && `Email type: ${brief.emailType}`,
        brief.tone && `Tone: ${brief.tone}`,
        brief.instructions && `Instructions: ${brief.instructions}`,
    ]
        .filter(Boolean)
        .join("\n");
    try {
        const raw = await runAnthropicOnReplicate({
            replicate,
            model: NEB_TEMPLATE_PICKER_MODEL,
            systemPrompt: `You are a template selector for an AI email builder.
Given a user's campaign brief, identify the best 1-3 reference templates from the catalog.
These templates are given to the HTML generator as a combined design quality benchmark and structural reference - more templates give it richer pattern variety to draw from.

Rules:
- ALWAYS select at least 1 template (the single best match)
- When a category has multiple templates (e.g. beauty has 3, ecommerce has 3, finance has 2), prefer selecting all templates from that category so the generator sees the full range of that style
- Select templates from a second category ONLY when it adds meaningfully different layout patterns
- If the brief doesn't perfectly match any template, pick the closest ones - the AI will adapt them
- Transactional emails (orders, receipts, notifications, account) → always include transactional_1.html
- Finance/investment/banking → include both finance templates for range
- E-commerce/retail/shopping → include the most relevant ecommerce templates (up to all 3)
- Beauty/wellness/personal care → include the most relevant beauty templates (up to all 3)
- Maximum 3 templates total

Respond ONLY with valid JSON:
{
  "reasoning": "1-2 sentences explaining your selection",
  "selected": ["filename1.html", "filename2.html", "filename3.html"]
}`,
            userPrompt: `Available templates:\n${catalogList}\n\n━━━ USER BRIEF ━━━\n${briefText}\n\nSelect the best 1-3 templates for this brief.`,
            maxTokens: 1024,
        });
        // Strip markdown fences if the model wrapped the JSON
        const cleaned = raw
            .replace(/^```(?:json)?\n?/i, "")
            .replace(/\n?```$/i, "")
            .trim();
        const parsed = pickerResponseSchema.parse(JSON.parse(cleaned));
        const resolved = parsed.selected
            .map((filename) => TEMPLATE_CATALOG.find((t) => t.filename === filename))
            .filter((t) => t !== undefined);
        if (resolved.length === 0)
            throw new Error("No valid templates resolved");
        console.log(`[TemplatePicker] Selected: ${resolved.map((t) => t.filename).join(", ")} - ${parsed.reasoning}`);
        return resolved;
    }
    catch (err) {
        console.warn("[TemplatePicker] AI pick failed, falling back to keyword match:", err);
        return keywordPick(brief);
    }
}
/**
 * Strip HTML comments and collapse whitespace to reduce token usage
 * while preserving all HTML structure and CSS.
 */
function compressHtml(html) {
    return html
        .replace(/<!--[\s\S]*?-->/g, "")
        .replace(/[ \t]+/g, " ")
        .replace(/\n\s*\n\s*\n/g, "\n\n")
        .trim();
}
/**
 * Load and compress template HTML files from the sample-templates directory.
 * Returns an array of { name, filename, html } objects.
 */
export function loadTemplateHtml(templates) {
    return templates.map((t) => {
        const filePath = join(TEMPLATES_DIR, t.filename);
        const raw = readFileSync(filePath, "utf-8");
        return {
            name: t.name,
            filename: t.filename,
            html: compressHtml(raw),
        };
    });
}
