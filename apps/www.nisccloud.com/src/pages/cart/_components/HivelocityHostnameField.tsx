import * as React from "react";
import { RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import {
  generateDefaultHivelocityHostname,
  HIVELOCITY_DEFAULT_HOSTNAME_DOMAIN,
  isValidHivelocityHostname,
  type HivelocityDefaultHostnameProductType,
} from "@/lib/hivelocity-default-hostname.ts";

interface HivelocityHostnameFieldProps {
  productType: HivelocityDefaultHostnameProductType;
  hostname: string;
  onHostnameChange: (value: string) => void;
}

export function HivelocityHostnameField({ productType, hostname, onHostnameChange }: HivelocityHostnameFieldProps) {
  const [touched, setTouched] = React.useState(false);
  const valid = isValidHivelocityHostname(hostname);
  const showError = touched && !valid;

  return (
    <div>
      <Label htmlFor="hivelocity-hostname" className="text-base font-medium text-foreground">
        Hostname
      </Label>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
        <Input
          id="hivelocity-hostname"
          value={hostname}
          onChange={(e) => onHostnameChange(e.target.value)}
          onBlur={() => setTouched(true)}
          placeholder={`server.${HIVELOCITY_DEFAULT_HOSTNAME_DOMAIN}`}
          aria-invalid={showError}
          aria-describedby="hivelocity-hostname-help"
          className="h-12 rounded-xl text-base"
          autoComplete="off"
          spellCheck={false}
        />
        <button
          type="button"
          onClick={() => {
            onHostnameChange(generateDefaultHivelocityHostname(productType));
            setTouched(false);
          }}
          className="inline-flex h-12 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 text-base font-medium text-foreground transition hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <RefreshCw className="size-4" aria-hidden />
          New name
        </button>
      </div>
      <p id="hivelocity-hostname-help" className={showError ? "mt-2 text-sm text-destructive" : "mt-2 text-sm text-muted-foreground"}>
        {showError
          ? "Enter a full hostname, such as server.yourbusiness.co.ke."
          : "Keep the suggested name or use your own, such as server.yourbusiness.co.ke. You can point DNS at it later in nPanel."}
      </p>
    </div>
  );
}
