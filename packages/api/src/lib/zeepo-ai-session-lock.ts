/**
 * In-process lock so two tabs cannot stream the same Zeepo AI session at once.
 * Releases on finally or after TTL (covers crashed turns).
 */

const DEFAULT_TTL_MS = 35 * 60 * 1000;

type LockEntry = {
	ownerId: string;
	expiresAt: number;
};

const locks = new Map<string, LockEntry>();

export function tryAcquireZeepoAiSessionLock(
	sessionId: string,
	ownerId: string,
	ttlMs = DEFAULT_TTL_MS,
): boolean {
	const now = Date.now();
	const existing = locks.get(sessionId);
	if (existing && existing.expiresAt > now && existing.ownerId !== ownerId) {
		return false;
	}
	locks.set(sessionId, { ownerId, expiresAt: now + ttlMs });
	return true;
}

export function releaseZeepoAiSessionLock(sessionId: string, ownerId: string): void {
	const existing = locks.get(sessionId);
	if (!existing) return;
	if (existing.ownerId === ownerId) locks.delete(sessionId);
}

export function refreshZeepoAiSessionLock(
	sessionId: string,
	ownerId: string,
	ttlMs = DEFAULT_TTL_MS,
): void {
	const existing = locks.get(sessionId);
	if (!existing || existing.ownerId !== ownerId) return;
	existing.expiresAt = Date.now() + ttlMs;
}
