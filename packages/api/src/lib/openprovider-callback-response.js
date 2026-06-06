/** Parse OpenProvider misc.php callback body, e.g. `status=Ok; message= ...` */
export function parseOpenProviderCallbackResponse(raw, fallbackMessage) {
    const pairs = {};
    for (const part of raw.split(";")) {
        const trimmed = part.trim();
        if (!trimmed)
            continue;
        const eqIndex = trimmed.indexOf("=");
        if (eqIndex === -1)
            continue;
        const key = trimmed.slice(0, eqIndex).trim();
        const value = trimmed.slice(eqIndex + 1).trim();
        pairs[key] = value;
    }
    const status = (pairs.status ?? "Error");
    const message = pairs.message?.trim() || fallbackMessage;
    return { status, message };
}
