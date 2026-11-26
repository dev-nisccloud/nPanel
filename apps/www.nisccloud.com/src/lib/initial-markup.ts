/**
 * The HTML already in #root when the bundle starts: a prerendered page, or the static splash.
 * The route fallback shows it until the first lazy page is ready, so a refresh never swaps
 * visible content for a loader.
 */
let markup: string | null = null;

export function rememberInitialMarkup(html: string) {
  markup = html.trim() ? html : null;
}

export function initialMarkup() {
  return markup;
}

export function releaseInitialMarkup() {
  markup = null;
}
