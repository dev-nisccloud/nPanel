/** Trigger a browser download for a Blob. */
export function downloadBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Filename-safe slug from a title. */
export function slugifyFilename(title: string, fallback = "download"): string {
  return (
    title
      .replace(/[^a-z0-9 \-_]/gi, "")
      .trim()
      .replace(/\s+/g, "-")
      .toLowerCase() || fallback
  );
}
