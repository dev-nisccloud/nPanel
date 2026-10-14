/** True when the public site should be locked to the coming soon page. */
export function isComingSoonEnabled() {
  const value = String(import.meta.env.VITE_IS_COMING_SOON ?? "")
    .trim()
    .toLowerCase();
  return value === "true" || value === "1" || value === "yes";
}
