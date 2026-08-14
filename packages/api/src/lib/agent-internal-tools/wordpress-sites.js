/**
 * WordPress sites for Zeepo AI.
 *
 * Agency admin+ → every WordPress install on Nisc Cloud servers, with team labels.
 * Customers and AGENCY_USER → sites they own (linked instance / WP hosting
 * subscription) OR WordPress on hosting they own, including subdomains
 * (blog.ashut.com if they own ashut.com). Same cascade as the WordPress details page.
 *
 * Never returns credentials, filesystem paths, Plesk owner IDs, or panel URLs.
 */
import { eq, inArray } from "@npanel/db";
import { db } from "@npanel/db";
import { hostingSubscription, wordPressInstance } from "@npanel/db/schema/hosting";
import { niscClientSubscription } from "@npanel/db/schema/products";
import { team as teamTable } from "@npanel/db/schema/teams";
const MAX_SITES = 80;
function normalizeHost(raw) {
    let h = raw.trim().toLowerCase();
    h = h.replace(/^https?:\/\//, "");
    const slash = h.indexOf("/");
    if (slash !== -1)
        h = h.slice(0, slash);
    const colon = h.indexOf(":");
    if (colon !== -1)
        h = h.slice(0, colon);
    if (h.startsWith("www."))
        h = h.slice(4);
    return h;
}
function fqdnLooksLikeDomain(s) {
    return /^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}$/i.test(s.trim());
}
function installationHostFromPayload(installation) {
    if (!installation || typeof installation !== "object")
        return "";
    const inst = installation;
    const dom = inst.domain;
    if (dom && typeof dom === "object") {
        const name = dom.name;
        if (typeof name === "string" && name.trim())
            return normalizeHost(name);
    }
    const url = inst.url;
    if (typeof url === "string" && url.trim()) {
        try {
            const u = new URL(url.includes("://") ? url : `https://${url}`);
            return normalizeHost(u.hostname);
        }
        catch {
            return normalizeHost(url);
        }
    }
    return "";
}
function installationIdFromPayload(installation) {
    if (!installation || typeof installation !== "object")
        return null;
    const id = installation.id;
    if (typeof id === "number" && Number.isInteger(id) && id > 0)
        return id;
    if (typeof id === "string" && /^\d+$/.test(id)) {
        const n = Number.parseInt(id, 10);
        return n > 0 ? n : null;
    }
    return null;
}
function mapBillingStatus(raw) {
    const s = (raw ?? "").toUpperCase();
    if (s === "ACTIVE")
        return "Active";
    if (s === "SUSPENDED")
        return "Suspended";
    if (s === "PENDING")
        return "Pending";
    return "Unknown";
}
function isWordPressHostingProduct(serviceType, name) {
    const st = (serviceType ?? "").toLowerCase();
    const n = (name ?? "").toLowerCase();
    return st === "wordpress_hosting" || n.includes("wordpress hosting") || n.includes("wordpress managed");
}
function readWordpressInstallationId(refs) {
    if (!refs || typeof refs !== "object" || Array.isArray(refs))
        return null;
    const v = refs.wordpressInstallationId;
    if (typeof v === "number" && Number.isInteger(v) && v > 0)
        return v;
    if (typeof v === "string" && /^\d+$/.test(v)) {
        const n = Number.parseInt(v, 10);
        return n > 0 ? n : null;
    }
    return null;
}
function publicUrlFromPayload(installation, host, sslEnabled) {
    if (!installation || typeof installation !== "object") {
        return host ? `${sslEnabled === false ? "http" : "https"}://${host}` : null;
    }
    const url = installation.url;
    if (typeof url === "string" && /^https?:\/\//i.test(url.trim())) {
        try {
            const u = new URL(url.trim());
            if (u.username || u.password)
                return `${u.protocol}//${u.host}`;
            const path = u.pathname === "/" ? "" : u.pathname.replace(/\/+$/, "");
            return `${u.protocol}//${u.host}${path}`;
        }
        catch {
            /* fall through */
        }
    }
    if (!host)
        return null;
    return `${sslEnabled === false ? "http" : "https"}://${host}`;
}
function sslEnabledFromPayload(installation) {
    if (!installation || typeof installation !== "object")
        return null;
    const dom = installation.domain;
    if (!dom || typeof dom !== "object")
        return null;
    const ssl = dom.ssl;
    if (ssl && typeof ssl === "object") {
        const enabled = ssl.enabled;
        if (typeof enabled === "boolean")
            return enabled;
        const cert = ssl.certificate;
        if (cert && typeof cert === "object") {
            const installed = cert.installed;
            if (typeof installed === "boolean")
                return installed;
        }
    }
    const redirect = dom.sslRedirectEnabled;
    if (typeof redirect === "boolean")
        return redirect;
    return null;
}
function mapLiveStatus(installation) {
    if (!installation || typeof installation !== "object")
        return "Unknown";
    const status = installation.status;
    if (!status || typeof status !== "object")
        return "Unknown";
    const alive = status.alive;
    if (alive === true)
        return "Online";
    if (alive === false)
        return "Offline";
    return "Unknown";
}
function mapSecurity(installation) {
    if (!installation || typeof installation !== "object")
        return "Unknown";
    const features = installation.features;
    if (!features || typeof features !== "object")
        return "Unknown";
    const security = features.security;
    if (!security || typeof security !== "object")
        return "Unknown";
    const s = security.status;
    if (s === "secureRecommended")
        return "Secure";
    if (typeof s === "string" && s.trim())
        return "Needs attention";
    return "Unknown";
}
function readFeatureNumber(installation, path) {
    let cur = installation;
    for (const key of path) {
        if (!cur || typeof cur !== "object")
            return null;
        cur = cur[key];
    }
    return typeof cur === "number" && Number.isFinite(cur) ? cur : null;
}
function readFeatureString(installation, path) {
    let cur = installation;
    for (const key of path) {
        if (!cur || typeof cur !== "object")
            return null;
        cur = cur[key];
    }
    return typeof cur === "string" && cur.trim() ? cur.trim() : null;
}
function readStatusFlag(installation, key) {
    if (!installation || typeof installation !== "object")
        return null;
    const status = installation.status;
    if (!status || typeof status !== "object")
        return null;
    const v = status[key];
    return typeof v === "boolean" ? v : null;
}
async function fetchWpToolkitInstallations() {
    if (!process.env.PLESK_REST_ENDPOINT) {
        return {
            installations: [],
            error: "Couldn't load WordPress sites right now. Please try again.",
        };
    }
    try {
        const { sendPleskRestRequest } = await import("../plesk/rest-client");
        const { data, isAuthError, isHostUnreachable, statusCode } = await sendPleskRestRequest("/v1/installations", "GET");
        if (isHostUnreachable || isAuthError || statusCode < 200 || statusCode >= 300 || !data) {
            return {
                installations: [],
                error: "Couldn't load WordPress sites right now. Please try again.",
            };
        }
        return { installations: Array.isArray(data) ? data : [data] };
    }
    catch {
        return {
            installations: [],
            error: "Couldn't load WordPress sites right now. Please try again.",
        };
    }
}
function matchesDomainFilter(host, url, domainFilter) {
    const d = normalizeHost(domainFilter);
    if (!d)
        return true;
    if (host === d || host.endsWith(`.${d}`))
        return true;
    if (url && url.toLowerCase().includes(d))
        return true;
    return false;
}
export async function agentGetWordPressSites(params) {
    const checkedAt = new Date().toISOString();
    const domainFilter = params.domain?.trim() ? normalizeHost(params.domain) : null;
    const empty = (error) => ({
        _tool: "get_wordpress_sites",
        isAgency: params.isAgency,
        teamName: params.teamName,
        domainFilter,
        sites: [],
        totalCount: 0,
        onlineCount: 0,
        needsAttentionCount: 0,
        checkedAt,
        error,
    });
    if (!params.isAgency && !params.teamId) {
        return empty("Team context is required.");
    }
    const [niscSubs, hostingSubs, wpLinks, fetched] = await Promise.all([
        db.query.niscClientSubscription.findMany({
            ...(params.isAgency
                ? {}
                : { where: eq(niscClientSubscription.teamId, params.teamId) }),
            columns: {
                teamId: true,
                primaryDomain: true,
                name: true,
                status: true,
                expiryDate: true,
                wpInstallationId: true,
                serviceRefs: true,
            },
            with: {
                product: { columns: { name: true, serviceType: true } },
                productPlan: { columns: { name: true } },
            },
        }),
        db.query.hostingSubscription.findMany({
            ...(params.isAgency
                ? {}
                : { where: eq(hostingSubscription.teamId, params.teamId) }),
            columns: {
                teamId: true,
                primaryDomain: true,
                pleskName: true,
                status: true,
                expiryDate: true,
            },
            with: {
                hostingPlan: { columns: { name: true } },
            },
        }),
        db.query.wordPressInstance.findMany({
            ...(params.isAgency
                ? {}
                : { where: eq(wordPressInstance.teamId, params.teamId) }),
            columns: { installationId: true, teamId: true },
        }),
        fetchWpToolkitInstallations(),
    ]);
    if (fetched.error)
        return empty(fetched.error);
    const ownedDomains = [];
    const linkedById = new Map();
    const addLinked = (row) => {
        const existing = linkedById.get(row.installationId);
        if (!existing || (row.isWordPressHosting && !existing.isWordPressHosting)) {
            linkedById.set(row.installationId, row);
        }
    };
    for (const sub of niscSubs) {
        const product = sub.product;
        const productPlan = sub.productPlan;
        const wpHosting = isWordPressHostingProduct(product?.serviceType, product?.name);
        const planName = productPlan?.name ?? product?.name ?? null;
        const status = mapBillingStatus(sub.status);
        const expiryDate = sub.expiryDate?.toISOString() ?? null;
        if (typeof sub.wpInstallationId === "number" && sub.wpInstallationId > 0) {
            addLinked({
                installationId: sub.wpInstallationId,
                teamId: sub.teamId,
                planName,
                status,
                expiryDate,
                isWordPressHosting: wpHosting,
            });
        }
        const fromRefs = readWordpressInstallationId(sub.serviceRefs);
        if (fromRefs) {
            addLinked({
                installationId: fromRefs,
                teamId: sub.teamId,
                planName,
                status,
                expiryDate,
                isWordPressHosting: wpHosting,
            });
        }
        if (sub.primaryDomain?.trim()) {
            ownedDomains.push({
                host: normalizeHost(sub.primaryDomain),
                teamId: sub.teamId,
                planName,
                status,
                expiryDate,
                isWordPressHosting: wpHosting,
            });
        }
        if (typeof sub.name === "string" && fqdnLooksLikeDomain(sub.name)) {
            ownedDomains.push({
                host: normalizeHost(sub.name),
                teamId: sub.teamId,
                planName,
                status,
                expiryDate,
                isWordPressHosting: wpHosting,
            });
        }
    }
    for (const row of hostingSubs) {
        const planName = row.hostingPlan?.name ?? null;
        const status = mapBillingStatus(row.status);
        const expiryDate = row.expiryDate?.toISOString() ?? null;
        if (row.primaryDomain?.trim()) {
            ownedDomains.push({
                host: normalizeHost(row.primaryDomain),
                teamId: row.teamId,
                planName,
                status,
                expiryDate,
                isWordPressHosting: false,
            });
        }
        if (row.pleskName?.trim() && fqdnLooksLikeDomain(row.pleskName)) {
            ownedDomains.push({
                host: normalizeHost(row.pleskName),
                teamId: row.teamId,
                planName,
                status,
                expiryDate,
                isWordPressHosting: false,
            });
        }
    }
    for (const link of wpLinks) {
        if (typeof link.installationId === "number" && link.installationId > 0) {
            addLinked({
                installationId: link.installationId,
                teamId: link.teamId,
                planName: null,
                status: null,
                expiryDate: null,
                isWordPressHosting: false,
            });
        }
    }
    const teamIds = [
        ...new Set([
            ...niscSubs.map((s) => s.teamId),
            ...hostingSubs.map((s) => s.teamId),
            ...wpLinks.map((s) => s.teamId),
        ].filter((id) => Boolean(id))),
    ];
    const teamNameById = new Map();
    if (params.isAgency && teamIds.length > 0) {
        const teams = await db
            .select({ id: teamTable.id, name: teamTable.name })
            .from(teamTable)
            .where(inArray(teamTable.id, teamIds));
        for (const t of teams)
            teamNameById.set(t.id, t.name);
    }
    const pickOwner = (installationId, host) => {
        if (installationId != null && linkedById.has(installationId)) {
            const linked = linkedById.get(installationId);
            const domainHit = ownedDomains.find((d) => host === d.host || host.endsWith(`.${d.host}`));
            return {
                teamId: linked.teamId ?? domainHit?.teamId ?? null,
                planName: linked.planName ?? domainHit?.planName ?? null,
                status: linked.status ?? domainHit?.status ?? null,
                expiryDate: linked.expiryDate ?? domainHit?.expiryDate ?? null,
                isWordPressHosting: linked.isWordPressHosting || Boolean(domainHit?.isWordPressHosting),
                matchedBase: domainHit?.host ?? null,
            };
        }
        const matches = ownedDomains.filter((d) => d.host && (host === d.host || host.endsWith(`.${d.host}`)));
        if (matches.length === 0)
            return null;
        matches.sort((a, b) => {
            const aExact = host === a.host ? 1 : 0;
            const bExact = host === b.host ? 1 : 0;
            if (bExact !== aExact)
                return bExact - aExact;
            if (Number(b.isWordPressHosting) !== Number(a.isWordPressHosting)) {
                return Number(b.isWordPressHosting) - Number(a.isWordPressHosting);
            }
            return b.host.length - a.host.length;
        });
        const best = matches[0];
        return {
            teamId: best.teamId,
            planName: best.planName,
            status: best.status,
            expiryDate: best.expiryDate,
            isWordPressHosting: best.isWordPressHosting,
            matchedBase: best.host,
        };
    };
    const sites = [];
    for (const raw of fetched.installations) {
        const host = installationHostFromPayload(raw);
        const installationId = installationIdFromPayload(raw);
        const owner = params.isAgency
            ? pickOwner(installationId, host) ?? {
                teamId: null,
                planName: null,
                status: null,
                expiryDate: null,
                isWordPressHosting: false,
                matchedBase: null,
            }
            : pickOwner(installationId, host);
        if (!params.isAgency && !owner)
            continue;
        const sslEnabled = sslEnabledFromPayload(raw);
        const url = publicUrlFromPayload(raw, host, sslEnabled);
        if (domainFilter && !matchesDomainFilter(host, url, domainFilter))
            continue;
        const inst = raw && typeof raw === "object" ? raw : {};
        const titleRaw = (typeof inst.displayTitle === "string" && inst.displayTitle.trim()) ||
            (typeof inst.title === "string" && inst.title.trim()) ||
            host ||
            "WordPress site";
        const matchedBase = owner?.matchedBase ?? null;
        const isSubdomain = Boolean(host && matchedBase && host !== matchedBase && host.endsWith(`.${matchedBase}`));
        const security = mapSecurity(raw);
        const liveStatus = mapLiveStatus(raw);
        sites.push({
            title: titleRaw,
            domain: host || null,
            url,
            version: typeof inst.version === "string" && inst.version.trim() ? inst.version.trim() : null,
            phpVersion: readFeatureString(raw, ["features", "php", "handler", "version"]),
            sslEnabled,
            status: liveStatus,
            infected: readStatusFlag(raw, "infected"),
            unsupported: readStatusFlag(raw, "unsupported"),
            multisite: readStatusFlag(raw, "multisite"),
            security,
            pluginUpdates: readFeatureNumber(raw, ["features", "updates", "amountOfPluginsWithUpdates"]),
            themeUpdates: readFeatureNumber(raw, ["features", "updates", "amountOfThemesWithUpdates"]),
            availableWpVersion: readFeatureString(raw, ["features", "updates", "availableVersion"]),
            kind: owner?.isWordPressHosting ? "wordpress_hosting" : "on_hosting",
            isSubdomain,
            planName: owner?.planName ?? null,
            billingStatus: owner?.status ?? null,
            expiryDate: owner?.expiryDate ?? null,
            teamName: params.isAgency
                ? (owner?.teamId ? (teamNameById.get(owner.teamId) ?? null) : null)
                : params.teamName,
        });
    }
    sites.sort((a, b) => (a.domain ?? a.title).localeCompare(b.domain ?? b.title));
    const limited = sites.slice(0, MAX_SITES);
    return {
        _tool: "get_wordpress_sites",
        isAgency: params.isAgency,
        teamName: params.teamName,
        domainFilter,
        sites: limited,
        totalCount: limited.length,
        onlineCount: limited.filter((s) => s.status === "Online").length,
        needsAttentionCount: limited.filter((s) => s.security === "Needs attention" || s.infected === true || s.status === "Offline").length,
        checkedAt,
    };
}
