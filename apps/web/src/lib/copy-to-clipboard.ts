/**
 * Copy text to the clipboard. Uses the async Clipboard API when available,
 * with a textarea + execCommand fallback for incognito and other restricted contexts.
 */
function copyViaExecCommand(text: string): boolean {
  if (typeof document === "undefined") return false;

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.style.top = "0";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  textarea.setSelectionRange(0, text.length);

  let success = false;
  try {
    success = document.execCommand("copy");
  } catch {
    success = false;
  }

  document.body.removeChild(textarea);
  return success;
}

export async function copyTextToClipboard(text: string): Promise<boolean> {
  if (!text) return false;

  // Run sync fallback first so copy stays inside the click user-gesture (incognito blocks async Clipboard API).
  if (copyViaExecCommand(text)) return true;

  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }

  return false;
}
