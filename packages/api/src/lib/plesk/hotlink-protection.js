import { TRPCError } from "@trpc/server";
/** Hostname-only allowlist - blocks URLs, paths, scripts, and private-network abuse in hotlink rules */
const HOSTNAME_REGEX = /^(?=.{1,253}$)(?!-)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.(?!-)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*$/i;
const EXTENSION_REGEX = /^[a-z0-9]{2,10}$/i;
const BLOCKED_HOST_SNIPPETS = [
    "localhost",
    "127.0.0.1",
    "0.0.0.0",
    "::1",
    "169.254.",
    "10.",
    "192.168.",
    "172.16.",
    "172.17.",
    "172.18.",
    "172.19.",
    "172.2",
    "172.30.",
    "172.31.",
];
function normalizeHostname(input) {
    let host = input.trim().toLowerCase();
    if (!host)
        return "";
    try {
        if (host.includes("://")) {
            host = new URL(host).hostname.toLowerCase();
        }
    }
    catch {
        throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Invalid domain: ${input}`,
        });
    }
    host = host.replace(/\.$/, "");
    if (host.startsWith("www."))
        host = host.slice(4);
    return host;
}
function assertSafeHostname(host) {
    if (!host || host.length > 253) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Domain name is invalid or too long" });
    }
    if (host.includes("/") || host.includes("\\") || host.includes("@") || host.includes(":")) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Domain must be a hostname only (no paths or ports)" });
    }
    if (!HOSTNAME_REGEX.test(host)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: `Invalid domain format: ${host}` });
    }
    for (const blocked of BLOCKED_HOST_SNIPPETS) {
        if (host === blocked.replace(/\.$/, "") || host.startsWith(blocked)) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "That domain is not allowed for hotlink protection" });
        }
    }
}
export function sanitizeHotlinkDomains(domains) {
    if (domains.length > 50) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "At most 50 allowed domains" });
    }
    const seen = new Set();
    const out = [];
    for (const raw of domains) {
        const host = normalizeHostname(raw);
        if (!host)
            continue;
        assertSafeHostname(host);
        if (!seen.has(host)) {
            seen.add(host);
            out.push(host);
        }
    }
    return out;
}
export function sanitizeHotlinkExtensions(extensions) {
    if (extensions.length > 30) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "At most 30 file extensions" });
    }
    const seen = new Set();
    const out = [];
    for (const raw of extensions) {
        const ext = raw.trim().toLowerCase().replace(/^\./, "");
        if (!ext)
            continue;
        if (!EXTENSION_REGEX.test(ext)) {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: `Invalid file extension: ${raw}. Use 2–10 alphanumeric characters only.`,
            });
        }
        if (!seen.has(ext)) {
            seen.add(ext);
            out.push(ext);
        }
    }
    return out;
}
/** WP Toolkit expects fileExtensions as array of arrays in some responses */
export function toHotlinkPutBody(domains, fileExtensions) {
    return {
        domains,
        fileExtensions: [fileExtensions],
    };
}
