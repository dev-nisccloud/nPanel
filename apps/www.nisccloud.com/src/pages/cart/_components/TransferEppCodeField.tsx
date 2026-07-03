import * as React from "react";
import { Eye, EyeOff, Key } from "lucide-react";
import { Input } from "@/components/ui/input.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Label } from "@/components/ui/label.tsx";

interface TransferEppCodeFieldProps {
  domain: string;
  value: string;
  onChange: (value: string) => void;
}

export function TransferEppCodeField({ domain, value, onChange }: TransferEppCodeFieldProps) {
  const [showCode, setShowCode] = React.useState(false);

  return (
    <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Key className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-base font-bold text-foreground">Authorization code (EPP code)</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Required to transfer <span className="font-medium text-foreground">{domain}</span>. Get this code
            from your current registrar.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="transfer-epp-code" className="text-sm font-medium">
          EPP / auth code
        </Label>
        <div className="relative">
          <Input
            id="transfer-epp-code"
            type={showCode ? "text" : "password"}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Enter authorization code from current registrar"
            className="pr-10"
            autoComplete="off"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
            onClick={() => setShowCode((prev) => !prev)}
            aria-label={showCode ? "Hide authorization code" : "Show authorization code"}
          >
            {showCode ? (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Eye className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          You must enter a valid authorization code before continuing to checkout.
        </p>
      </div>
    </div>
  );
}
