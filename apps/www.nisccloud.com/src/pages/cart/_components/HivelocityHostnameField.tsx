import * as React from "react";
import { RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Button } from "@/components/ui/button.tsx";
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

export function HivelocityHostnameField({
  productType,
  hostname,
  onHostnameChange,
}: HivelocityHostnameFieldProps) {
  const [touched, setTouched] = React.useState(false);
  const valid = isValidHivelocityHostname(hostname);

  const handleRegenerate = () => {
    onHostnameChange(generateDefaultHivelocityHostname(productType));
    setTouched(false);
  };

  return (
    <div className="rounded-xl border border-border bg-white p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Label htmlFor="hivelocity-hostname" className="text-sm font-semibold text-foreground">
            Server hostname
            <span className="text-destructive ml-0.5">*</span>
          </Label>
          <p className="text-xs text-muted-foreground mt-1">
            We suggest a hostname under {HIVELOCITY_DEFAULT_HOSTNAME_DOMAIN}.
            You can keep it or enter your own FQDN.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0 gap-1.5"
          onClick={handleRegenerate}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          New suggestion
        </Button>
      </div>

      <Input
        id="hivelocity-hostname"
        value={hostname}
        onChange={(e) => {
          onHostnameChange(e.target.value);
          if (touched) setTouched(true);
        }}
        onBlur={() => setTouched(true)}
        placeholder="server-vps.nisccloud.com"
        className="h-11 rounded-xl font-mono text-sm"
        autoComplete="off"
        spellCheck={false}
      />

      {touched && !valid ? (
        <p className="text-xs text-destructive">
          Enter a valid hostname (e.g. my-server-vps.nisccloud.com).
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          Used during server provisioning. You can change DNS later in nPanel.
        </p>
      )}
    </div>
  );
}
