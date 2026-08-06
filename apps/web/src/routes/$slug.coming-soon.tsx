import * as React from "react";
import { captureEvent } from "@/lib/posthog";
export default function Page() {
  React.useEffect(() => {
    captureEvent("coming_soon_page_viewed", { page_slug: typeof window !== "undefined" ? window.location.pathname : "" });
  }, []);

  return (
    <div className="flex h-full flex-col items-center justify-center space-y-2 text-center">
      <h1 className="text-2xl font-semibold">Page not found.</h1>
      <p className="text-muted-foreground">This page is under development and will be available in future updates.</p>
    </div>
  );
}
