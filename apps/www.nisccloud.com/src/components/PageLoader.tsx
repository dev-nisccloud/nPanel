import { useEffect } from "react";
import { initialMarkup, releaseInitialMarkup } from "@/lib/initial-markup.ts";
import { finishPageLoader, startPageLoader } from "@/lib/page-loader.ts";

/**
 * Route fallback. It does not draw a second bar. The one bar sits outside #root
 * and is finished when this fallback unmounts, which is when the page is ready.
 */
export default function PageLoader() {
  useEffect(() => {
    startPageLoader();
    return () => finishPageLoader();
  }, []);
  const html = initialMarkup();
  if (html) return <div className="contents" dangerouslySetInnerHTML={{ __html: html }} />;
  return null;
}

/** Rendered beside the routes; its effect runs once the first real page has committed. */
export function InitialPageReady() {
  useEffect(() => {
    releaseInitialMarkup();
    finishPageLoader();
  }, []);
  return null;
}
