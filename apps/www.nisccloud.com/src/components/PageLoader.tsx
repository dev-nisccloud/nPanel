import { useEffect } from "react";
import { initialMarkup, releaseInitialMarkup } from "@/lib/initial-markup.ts";

/**
 * Route fallback. On the first load it keeps showing the page the server already sent;
 * after that it is a thin line that only appears when a page takes longer than 300ms.
 */
export default function PageLoader() {
  const html = initialMarkup();
  if (html) return <div className="contents" dangerouslySetInnerHTML={{ __html: html }} />;
  return (
    <div className="app-loader" role="status" aria-busy="true">
      <div className="app-loader__bar" />
      <span className="sr-only">Loading page</span>
    </div>
  );
}

/** Rendered beside the routes; its effect runs once the first real page has committed. */
export function InitialPageReady() {
  useEffect(() => {
    releaseInitialMarkup();
  }, []);
  return null;
}
