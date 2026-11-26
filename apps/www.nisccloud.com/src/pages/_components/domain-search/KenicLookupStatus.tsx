import * as React from "react";
import { RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";

/** Delay after which a still-running registry check explains the wait. */
const SLOW_AFTER_MS = 6_000;

/** Live status line while a KeNIC check is running; explains the wait once it gets long. */
export function KenicSlowNotice({ domain }: { domain: string }) {
  const [slow, setSlow] = React.useState(false);
  React.useEffect(() => {
    setSlow(false);
    const t = setTimeout(() => setSlow(true), SLOW_AFTER_MS);
    return () => clearTimeout(t);
  }, [domain]);
  return (
    <p role="status" aria-live="polite" className="mt-3 text-xs text-muted-foreground">
      {slow
        ? `Still checking ${domain} with the KeNIC registry. Kenyan domains can take up to a minute to confirm.`
        : `Checking ${domain} with the KeNIC registry...`}
    </p>
  );
}

/** Shown when the registry could not confirm availability. Never implies the domain is free. */
export function KenicRetryCard({ domain, onRetry }: { domain: string; onRetry: () => void }) {
  return (
    <div className="bg-card border border-border rounded-lg p-4 md:p-5 min-h-[200px] flex flex-col" role="alert">
      <div className="font-bold text-base text-primary mb-1 truncate" title={domain}>
        {domain}
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        We could not confirm availability with the KeNIC registry just now, so this domain cannot be added yet.
      </p>
      <Button variant="outline" size="sm" className="mt-auto gap-2 self-start" onClick={onRetry}>
        <RotateCw className="h-4 w-4" aria-hidden /> Check again
      </Button>
    </div>
  );
}
