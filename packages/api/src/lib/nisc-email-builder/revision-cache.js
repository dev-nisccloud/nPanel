import { getRedisClient } from "../redis";
const TTL_SEC = 60 * 60 * 24 * 7; // 7 days
const MAX_STACK = 10;
function undoKey(designId) {
    return `neb:chat:undo:${designId}`;
}
function redoKey(designId) {
    return `neb:chat:redo:${designId}`;
}
export function isRevisionCacheAvailable() {
    return getRedisClient() !== null;
}
export async function getRevisionUndoRedoState(designId) {
    const redis = getRedisClient();
    if (!redis) {
        return { available: false, canUndo: false, canRedo: false };
    }
    const [undoLen, redoLen] = await Promise.all([
        redis.llen(undoKey(designId)),
        redis.llen(redoKey(designId)),
    ]);
    return {
        available: true,
        canUndo: undoLen > 0,
        canRedo: redoLen > 0,
    };
}
export async function pushRevisionUndoSnapshot(designId, html) {
    const redis = getRedisClient();
    if (!redis || !html.trim())
        return;
    const payload = {
        html,
        savedAt: new Date().toISOString(),
    };
    const key = undoKey(designId);
    await redis.lpush(key, JSON.stringify(payload));
    await redis.ltrim(key, 0, MAX_STACK - 1);
    await redis.expire(key, TTL_SEC);
}
export async function clearRevisionRedoStack(designId) {
    const redis = getRedisClient();
    if (!redis)
        return;
    await redis.del(redoKey(designId));
}
export async function popRevisionUndoSnapshot(designId) {
    const redis = getRedisClient();
    if (!redis)
        return null;
    const raw = await redis.lpop(undoKey(designId));
    if (!raw || typeof raw !== "string")
        return null;
    try {
        return JSON.parse(raw);
    }
    catch {
        return null;
    }
}
export async function pushRevisionRedoSnapshot(designId, html) {
    const redis = getRedisClient();
    if (!redis || !html.trim())
        return;
    const payload = {
        html,
        savedAt: new Date().toISOString(),
    };
    const key = redoKey(designId);
    await redis.lpush(key, JSON.stringify(payload));
    await redis.ltrim(key, 0, MAX_STACK - 1);
    await redis.expire(key, TTL_SEC);
}
export async function popRevisionRedoSnapshot(designId) {
    const redis = getRedisClient();
    if (!redis)
        return null;
    const raw = await redis.lpop(redoKey(designId));
    if (!raw || typeof raw !== "string")
        return null;
    try {
        return JSON.parse(raw);
    }
    catch {
        return null;
    }
}
