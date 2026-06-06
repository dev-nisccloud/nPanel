/** Apply HTML to the design and current version (used for undo/redo restore). */
export declare function applyRevisionHtmlToDesign(params: {
    designId: string;
    html: string;
    changeSummary?: string;
}): Promise<{
    html: string;
    text: string;
}>;
