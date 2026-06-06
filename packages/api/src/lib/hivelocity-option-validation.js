/**
 * Server-side guard: Hivelocity allows at most one option per upgrade category group.
 */
import { hivelocityRequest } from "./hivelocity-client";
const MULTI_SELECT_GROUP_KEYWORDS = [];
function isMultiSelectGroup(groupName) {
    const g = groupName.trim().toLowerCase();
    return MULTI_SELECT_GROUP_KEYWORDS.some((k) => g.includes(k));
}
export async function assertHivelocityOptionIdsExclusive(productId, optionIds) {
    if (!optionIds.length)
        return;
    const raw = await hivelocityRequest(`/product/${productId}/options`, {
        requireApiKey: true,
        query: { groupBy: "upgrade" },
    });
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
        return;
    }
    const selected = new Set(optionIds.map(Number));
    const conflicts = [];
    for (const [groupName, rowsRaw] of Object.entries(raw)) {
        if (groupName.trim().toLowerCase() === "operating system")
            continue;
        if (isMultiSelectGroup(groupName))
            continue;
        if (!Array.isArray(rowsRaw))
            continue;
        const picked = rowsRaw.filter((row) => {
            const id = Number(row.id);
            return Number.isFinite(id) && selected.has(id);
        });
        if (picked.length <= 1)
            continue;
        const names = picked.map((r) => `${r.name ?? r.id} (${r.id})`).join(", ");
        conflicts.push(`Multiple options in "${groupName}": ${names}`);
    }
    if (conflicts.length) {
        throw new Error(`Incompatible Hivelocity option selection. ${conflicts.join(" ")}`);
    }
}
