/** Strip editor-only artifacts before persisting manually edited HTML. */
export function stripEditorArtifactsFromHtml(html) {
    let out = html;
    // Remove injected editor stylesheet block
    out = out.replace(/<style[^>]*id=["']neb-editor-styles["'][^>]*>[\s\S]*?<\/style>/gi, "");
    // Remove data-neb-id attributes
    out = out.replace(/\s*data-neb-id="[^"]*"/gi, "");
    // Remove editor classes from class attributes
    out = out.replace(/\sclass="([^"]*)"/gi, (_match, classes) => {
        const cleaned = classes
            .split(/\s+/)
            .filter((c) => c &&
            c !== "neb-selected" &&
            c !== "neb-editable" &&
            c !== "neb-editable-hover")
            .join(" ");
        return cleaned ? ` class="${cleaned}"` : "";
    });
    // Remove contenteditable
    out = out.replace(/\s*contenteditable="[^"]*"/gi, "");
    return out.trim();
}
