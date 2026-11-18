import { Server } from "lucide-react";
import { cn } from "@/lib/utils.ts";

export type TransferNameserverMode = "keep" | "nisc";

type Option = { value: TransferNameserverMode; label: string; hint: string };

const OPTIONS: Option[] = [
  {
    value: "keep",
    label: "Keep current nameservers",
    hint: "Your website and email stay exactly where they are.",
  },
  {
    value: "nisc",
    label: "Use Nisc Cloud nameservers",
    hint: "Choose this if your website or email will be hosted with us.",
  },
];

type TransferNameserverChoiceProps = {
  domain: string;
  value: TransferNameserverMode;
  recommended: TransferNameserverMode;
  onChange: (value: TransferNameserverMode) => void;
};

export function TransferNameserverChoice({
  domain,
  value,
  recommended,
  onChange,
}: TransferNameserverChoiceProps) {
  const active = OPTIONS.find((o) => o.value === value) ?? OPTIONS[0]!;
  return (
    <fieldset className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <legend className="sr-only">Nameservers for {domain} after the transfer</legend>
      <div className="mb-3 flex items-start gap-2">
        <Server className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
        <div>
          <p className="text-sm font-semibold text-foreground">Nameservers after the transfer</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{active.hint}</p>
        </div>
      </div>
      <div role="radiogroup" className="grid gap-2 sm:grid-cols-2">
        {OPTIONS.map((option) => {
          const checked = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={checked}
              onClick={() => onChange(option.value)}
              className={cn(
                "flex min-h-11 items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors motion-reduce:transition-none",
                checked
                  ? "border-primary bg-primary/5 font-semibold text-foreground"
                  : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground",
              )}
            >
              <span className="flex items-center gap-2">
                <span
                  className={cn(
                    "flex size-4 shrink-0 items-center justify-center rounded-full border",
                    checked ? "border-primary" : "border-muted-foreground/40",
                  )}
                  aria-hidden
                >
                  {checked && <span className="size-2 rounded-full bg-primary" />}
                </span>
                {option.label}
              </span>
              {option.value === recommended && (
                <span className="shrink-0 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                  Recommended
                </span>
              )}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
