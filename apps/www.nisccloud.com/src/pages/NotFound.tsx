import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button.tsx";
import { usePageMeta } from "@/lib/seo.ts";
import { NOT_FOUND_META } from "@/lib/route-meta.ts";

const SUGGESTIONS: [string, string][] = [
  ["Cloud products", "/hosting"],
  ["Business solutions", "/services"],
  ["Pricing", "/pricing"],
  ["Help centre", "/help"],
  ["Contact", "/contact"],
];

export default function NotFound() {
  const location = useLocation();
  usePageMeta(NOT_FOUND_META);

  useEffect(() => {
    if (import.meta.env.DEV) {
      console.warn("404: no route for", location.pathname);
    }
  }, [location.pathname]);

  return (
    <main id="main-content" className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center space-y-6">
        <div className="space-y-2">
          <p className="font-mono text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground">404</p>
          <h1 className="type-h2">Page not found</h1>
        </div>
        <p className="text-lg text-muted-foreground max-w-md mx-auto">
          The page you requested does not exist or has moved. Try one of these instead.
        </p>
        <nav aria-label="Suggested pages" className="flex flex-wrap justify-center gap-2">
          {SUGGESTIONS.map(([label, href]) => (
            <Link
              key={href}
              to={href}
              className="rounded-[10px] border border-border bg-card px-3.5 py-2 text-sm font-semibold text-foreground transition-colors hover:border-primary/40 hover:text-primary"
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="pt-2">
          <Button asChild className="rounded-[10px]">
            <Link to="/">Return to Home</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
