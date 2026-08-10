/**
 * Compose → session handoff for Zeepo AI.
 * Survives navigation via module memory + sessionStorage.
 *
 * Do NOT gate auto-send with a process-wide "claimed" flag across React Strict Mode
 * remounts  the first mount's setState is discarded, which left the UI stuck on
 * "Connecting to Zeepo…". Remounts re-check the server and only send if empty.
 */

export type ZeepoAiHandoffPayload = {
  content: string;
  searchEnabled?: boolean;
  skillId?: string;
  attachmentIds?: string[];
  fromCompose?: boolean;
};

const memory = new Map<string, ZeepoAiHandoffPayload>();

function storageKey(sessionId: string) {
  return `zeepo-ai-handoff:${sessionId}`;
}

export function stashZeepoAiHandoff(sessionId: string, payload: ZeepoAiHandoffPayload) {
  const next: ZeepoAiHandoffPayload = {
    ...payload,
    content: payload.content.trim(),
    fromCompose: true,
  };
  if (!next.content) return;
  memory.set(sessionId, next);
  try {
    sessionStorage.setItem(storageKey(sessionId), JSON.stringify(next));
  } catch {
    /* private mode / quota */
  }
}

export function readZeepoAiHandoff(sessionId: string): ZeepoAiHandoffPayload | null {
  const mem = memory.get(sessionId);
  if (mem?.content) return mem;
  try {
    const raw = sessionStorage.getItem(storageKey(sessionId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ZeepoAiHandoffPayload;
    if (!parsed?.content?.trim()) return null;
    memory.set(sessionId, parsed);
    return parsed;
  } catch {
    return null;
  }
}

export function clearZeepoAiHandoff(sessionId: string) {
  memory.delete(sessionId);
  try {
    sessionStorage.removeItem(storageKey(sessionId));
  } catch {
    /* ignore */
  }
}
