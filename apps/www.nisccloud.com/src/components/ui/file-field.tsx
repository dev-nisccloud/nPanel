import { useRef, useState } from "react";
import { FileText, X } from "lucide-react";
import { Label } from "@/components/ui/label.tsx";

function formatBytes(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FileField({
  id,
  name,
  label,
  hint,
  accept,
  required,
}: {
  id: string;
  name: string;
  label: string;
  hint?: string;
  accept?: string;
  required?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);

  function choose() {
    inputRef.current?.click();
  }

  function clear() {
    setFile(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <input
        ref={inputRef}
        id={id}
        name={name}
        type="file"
        accept={accept}
        required={required && !file}
        className="sr-only"
        onChange={(event) => setFile(event.target.files?.[0] ?? null)}
      />
      {file ? (
        <div className="rounded-2xl border border-border bg-background p-4" aria-live="polite">
          <div className="flex items-start gap-3">
            <FileText className="mt-0.5 size-5 shrink-0 text-[#38b6ff] dark:text-[#38b6ff]" aria-hidden />
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-foreground">{file.name}</span>
              <span className="block text-xs text-muted-foreground">{formatBytes(file.size)} selected</span>
            </span>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              className="inline-flex min-h-11 items-center rounded-[10px] border border-border px-4 text-sm font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38b6ff]"
              onClick={choose}
            >
              Choose a different file
            </button>
            <button
              type="button"
              className="inline-flex min-h-11 items-center gap-1 rounded-[10px] border border-destructive/40 px-4 text-sm font-medium text-destructive hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive"
              onClick={clear}
            >
              <X className="size-4" aria-hidden />
              Remove file
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="flex min-h-24 flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-border bg-muted/40 px-4 text-sm text-foreground hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38b6ff]"
          onClick={choose}
        >
          <span className="font-medium">Choose a file</span>
          <span className="text-xs text-muted-foreground">You can remove it before you send the form.</span>
        </button>
      )}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
