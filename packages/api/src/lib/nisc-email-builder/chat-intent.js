const FULL_REVAMP_PATTERNS = [
    /\b(start over|from scratch|completely new|brand new email|full revamp|full redesign)\b/i,
    /\b(rebuild|regenerate|redo)\b.{0,40}\b(entire|whole|complete|full)\b/i,
    /\bnew email\b/i,
    /\bignore\b.{0,30}\b(current|existing|previous)\b/i,
];
/** Default: edit existing HTML. Full revamp only when the user clearly asks for it. */
export function classifyChatIntent(message) {
    const trimmed = message.trim();
    if (!trimmed)
        return "edit";
    for (const pattern of FULL_REVAMP_PATTERNS) {
        if (pattern.test(trimmed))
            return "full_revamp";
    }
    return "edit";
}
