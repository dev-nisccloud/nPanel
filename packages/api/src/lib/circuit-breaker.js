const circuits = new Map();
const DEFAULT_FAILURE_THRESHOLD = 5;
const DEFAULT_OPEN_MS = 30_000;
function getState(name) {
    let state = circuits.get(name);
    if (!state) {
        state = { failures: 0, openedAt: null };
        circuits.set(name, state);
    }
    return state;
}
function failureThreshold() {
    const raw = process.env.CIRCUIT_BREAKER_FAILURE_THRESHOLD;
    const n = raw ? Number(raw) : DEFAULT_FAILURE_THRESHOLD;
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : DEFAULT_FAILURE_THRESHOLD;
}
function openMs() {
    const raw = process.env.CIRCUIT_BREAKER_OPEN_MS;
    const n = raw ? Number(raw) : DEFAULT_OPEN_MS;
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : DEFAULT_OPEN_MS;
}
export class CircuitOpenError extends Error {
    circuitName;
    constructor(circuitName) {
        super(`Circuit breaker open: ${circuitName}`);
        this.circuitName = circuitName;
        this.name = "CircuitOpenError";
    }
}
/** In-process circuit breaker for external HTTP/XML services (Plesk, etc.). */
export async function withCircuitBreaker(name, fn) {
    const state = getState(name);
    const now = Date.now();
    if (state.openedAt != null) {
        if (now - state.openedAt < openMs()) {
            throw new CircuitOpenError(name);
        }
        state.openedAt = null;
        state.failures = 0;
    }
    try {
        const result = await fn();
        state.failures = 0;
        return result;
    }
    catch (error) {
        state.failures += 1;
        if (state.failures >= failureThreshold()) {
            state.openedAt = now;
            console.error(`[circuit-breaker] opened: ${name} after ${state.failures} failures`);
        }
        throw error;
    }
}
