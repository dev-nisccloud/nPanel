const FORBIDDEN_TAGS = /<script\b|<iframe\b|<form\b|javascript:/gi;
export function stripDangerousHtml(html) {
    return html
        .replace(FORBIDDEN_TAGS, "")
        .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");
}
export function htmlToPlainText(html) {
    return html
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/p>/gi, "\n\n")
        .replace(/<\/tr>/gi, "\n")
        .replace(/<\/h[1-6]>/gi, "\n\n")
        .replace(/<[^>]+>/g, "")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}
export function validateEmailHtml(html) {
    const errors = [];
    const warnings = [];
    if (!html.trim()) {
        errors.push("HTML is empty");
        return { ok: false, errors, warnings };
    }
    if (FORBIDDEN_TAGS.test(html)) {
        errors.push("HTML contains forbidden elements (script, iframe, form, or javascript: URLs)");
    }
    if (!/<!DOCTYPE\s+html/i.test(html) && !/<html[\s>]/i.test(html)) {
        warnings.push("Missing DOCTYPE or <html> - wrapping recommended");
    }
    if (!/<table[\s>]/i.test(html)) {
        warnings.push("No <table> found - Outlook may render poorly");
    }
    const imgTags = html.match(/<img\b[^>]*>/gi) ?? [];
    for (const tag of imgTags) {
        if (!/\salt\s*=/i.test(tag)) {
            warnings.push("An image is missing alt text");
        }
    }
    const hasLink = /<a\s+[^>]*href\s*=/i.test(html);
    if (!hasLink) {
        warnings.push("No links found - add at least one CTA <a href>");
    }
    return { ok: errors.length === 0, errors, warnings };
}
export function processEmailHtml(rawHtml) {
    const cleaned = stripDangerousHtml(rawHtml.trim());
    const validation = validateEmailHtml(cleaned);
    const text = htmlToPlainText(cleaned);
    return { html: cleaned, text, validation };
}
export function patchImagePlaceholders(html, replacements) {
    let out = html;
    for (const [key, url] of Object.entries(replacements)) {
        const token = `{{NEB_IMG:${key}}}`;
        out = out.split(token).join(url);
    }
    return out;
}
