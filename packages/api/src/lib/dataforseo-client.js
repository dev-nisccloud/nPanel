import { TRPCError } from "@trpc/server";
import { env } from "@npanel/env/server";
const DATAFORSEO_BASE_URL = "https://api.dataforseo.com";
function getCredentials() {
    const login = env.DATAFORSEO_LOGIN?.trim();
    const password = env.DATAFORSEO_PASSWORD?.trim();
    if (!login || !password)
        return null;
    return { login, password };
}
export function isDataForSeoConfigured() {
    return getCredentials() !== null;
}
export function assertDataForSeoConfigured() {
    if (!isDataForSeoConfigured()) {
        throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "DataForSEO is not configured. Set DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD (Dashboard → API Access).",
        });
    }
}
function authHeader() {
    const creds = getCredentials();
    if (!creds) {
        assertDataForSeoConfigured();
        throw new Error("unreachable");
    }
    const token = Buffer.from(`${creds.login}:${creds.password}`).toString("base64");
    return `Basic ${token}`;
}
function inferApiFamily(path) {
    const p = path.replace(/^\//, "");
    const first = p.split("/")[0] ?? "unknown";
    return first;
}
export async function dataForSeoRequest(path, options = {}) {
    assertDataForSeoConfigured();
    const method = options.method ?? (options.body !== undefined ? "POST" : "GET");
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    const url = `${DATAFORSEO_BASE_URL}${normalizedPath}`;
    const resp = await fetch(url, {
        method,
        headers: {
            Authorization: authHeader(),
            "Content-Type": "application/json",
            Accept: "application/json",
        },
        ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
    });
    const text = await resp.text();
    let json = null;
    try {
        json = text.length ? JSON.parse(text) : null;
    }
    catch {
        json = null;
    }
    if (!resp.ok) {
        const message = json?.status_message ||
            (typeof json === "object" && json && "message" in json
                ? String(json.message)
                : null) ||
            `DataForSEO HTTP ${resp.status}`;
        if (resp.status === 401 || resp.status === 403) {
            throw new TRPCError({ code: "UNAUTHORIZED", message });
        }
        if (resp.status === 429) {
            throw new TRPCError({ code: "TOO_MANY_REQUESTS", message });
        }
        throw new TRPCError({ code: "BAD_GATEWAY", message });
    }
    if (!json) {
        throw new TRPCError({
            code: "BAD_GATEWAY",
            message: "DataForSEO returned an empty or invalid response",
        });
    }
    if (typeof json.status_code === "number" && json.status_code >= 40000) {
        throw new TRPCError({
            code: "BAD_GATEWAY",
            message: json.status_message || `DataForSEO error ${json.status_code}`,
        });
    }
    const task = Array.isArray(json.tasks) ? json.tasks[0] : undefined;
    if (task && typeof task.status_code === "number" && task.status_code >= 40000) {
        throw new TRPCError({
            code: "BAD_REQUEST",
            message: task.status_message || `DataForSEO task error ${task.status_code}`,
        });
    }
    const units = Math.max(1, task?.result_count ?? json.tasks_count ?? 1);
    const costEstimate = typeof task?.cost === "number"
        ? task.cost
        : typeof json.cost === "number"
            ? json.cost
            : null;
    if (options.usage?.onUsage) {
        await options.usage.onUsage({
            api: inferApiFamily(normalizedPath),
            endpoint: normalizedPath,
            units,
            costEstimate,
            meta: { status_code: json.status_code, task_id: task?.id },
        });
    }
    return json;
}
/** POST helper that returns the first task result array (or null). */
export async function dataForSeoLiveResult(path, tasks, usage) {
    const envelope = await dataForSeoRequest(path, { method: "POST", body: tasks, usage });
    const result = envelope.tasks?.[0]?.result;
    return Array.isArray(result) ? result : null;
}
export function normalizeDomain(input) {
    return input
        .trim()
        .replace(/^https?:\/\//i, "")
        .replace(/^www\./i, "")
        .replace(/\/.*$/, "")
        .toLowerCase();
}
