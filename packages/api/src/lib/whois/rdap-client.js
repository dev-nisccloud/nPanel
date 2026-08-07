/**
 * RDAP client for domain WHOIS lookups.
 *
 * Uses the IANA bootstrap registry (https://data.iana.org/rdap/dns.json) to
 * resolve the correct RDAP server per TLD, then fetches and normalises the
 * response into a single consistent shape.
 *
 * Types are derived from real responses collected from:
 *   - Verisign  (.com / .net)   gTLD, ICANN-compliant, registrant GDPR-redacted
 *   - Nominet   (.co.uk / .uk)  ccTLD, redacted array + richer nameserver objects
 *   - KENIC     (.ke / .co.ke)  ccTLD via https://rdap.kenic.or.ke/
 *
 * KENIC quirks:
 *   • Bootstrap maps only "ke"; all sub-TLDs (.co.ke, .or.ke …) share the same server
 *   • Registrar entity in the domain response has NO vcardArray  the full vcard
 *     lives at the entity href. We detect this and do a second fetch to enrich the
 *     registrar with address, phone, and email. Only fires for same-origin entity URLs
 *     to avoid cross-registry requests on gTLDs.
 *   • Domain link uses rel:"related" instead of rel:"self"
 *   • Extra event actions: "reregistration", "transfer", "registrar expiration"
 */
const BOOTSTRAP_TTL_MS = 24 * 60 * 60 * 1_000;
const BOOTSTRAP_URL = "https://data.iana.org/rdap/dns.json";
const RDAP_HEADERS = {
    Accept: "application/rdap+json, application/json",
    "User-Agent": "nPanel/1.0 RDAP-Whois",
};
let bootstrapCache = null;
async function fetchBootstrap() {
    const now = Date.now();
    if (bootstrapCache && now - bootstrapCache.fetchedAt < BOOTSTRAP_TTL_MS) {
        return bootstrapCache.services;
    }
    const res = await fetch(BOOTSTRAP_URL, {
        headers: { "User-Agent": "nPanel/1.0 RDAP-Whois" },
        signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok)
        throw new Error(`RDAP bootstrap fetch failed: ${res.status}`);
    const data = (await res.json());
    bootstrapCache = { services: data.services, fetchedAt: now };
    return data.services;
}
export async function resolveRdapBaseUrl(tld) {
    const services = await fetchBootstrap();
    const lower = tld.toLowerCase().replace(/^\./, "");
    for (const [tlds, urls] of services) {
        if (tlds.some((t) => t.toLowerCase() === lower))
            return urls[0] ?? null;
    }
    return null;
}
// ---- jCard (RFC 7095) helpers -----------------------------------------------
function vcardProp(props, name) {
    for (const p of props) {
        if (p[0] === name) {
            const val = p[3];
            if (typeof val === "string")
                return val || null;
            if (Array.isArray(val))
                return val.filter(Boolean).join(", ") || null;
        }
    }
    return null;
}
/**
 * adr value: ["poBox", "ext", street, city, region, postalCode, country]
 */
function vcardAdr(props) {
    for (const p of props) {
        if (p[0] === "adr") {
            const val = p[3];
            if (Array.isArray(val) && val.length >= 7) {
                return {
                    street: typeof val[2] === "string" ? val[2] || null : null,
                    city: typeof val[3] === "string" ? val[3] || null : null,
                    postalCode: typeof val[5] === "string" ? val[5] || null : null,
                    country: typeof val[6] === "string" ? val[6] || null : null,
                };
            }
        }
    }
    return { street: null, city: null, postalCode: null, country: null };
}
function parseVcard(entity) {
    const vcardArray = entity.vcardArray;
    if (!vcardArray || !Array.isArray(vcardArray[1])) {
        return {
            name: null,
            organization: null,
            email: null,
            phone: null,
            street: null,
            city: null,
            country: null,
        };
    }
    const props = vcardArray[1];
    const adr = vcardAdr(props);
    return {
        name: vcardProp(props, "fn"),
        organization: vcardProp(props, "org"),
        email: vcardProp(props, "email"),
        phone: vcardProp(props, "tel"),
        street: adr.street,
        city: adr.city,
        country: adr.country,
    };
}
// ---- Registrar entity enrichment --------------------------------------------
/**
 * When the registrar entity in the domain response has no vcardArray (KENIC pattern),
 * we look for a same-origin RDAP entity URL in the entity's links and return it for
 * a follow-up fetch. Returns null for gTLDs where the vcard is already inline.
 */
function extractRegistrarEntityUrl(entity, baseUrl) {
    // Already have inline vcard  no extra fetch needed
    if (entity.vcardArray)
        return null;
    const links = entity.links ?? [];
    const entityLink = links.find((l) => l.type === "application/rdap+json" && l.href.includes("/entity/"));
    if (!entityLink)
        return null;
    // Only fetch from the same origin as the RDAP server we used for the domain 
    // prevents unintended cross-registry requests.
    try {
        const linkOrigin = new URL(entityLink.href).origin;
        const baseOrigin = new URL(baseUrl).origin;
        if (linkOrigin !== baseOrigin)
            return null;
    }
    catch {
        return null;
    }
    return entityLink.href;
}
/**
 * Fetch a KENIC registrar entity URL and return the enriched contact fields.
 * Fails silently  the caller merges these into the base registrar object.
 */
async function fetchRegistrarEntityEnrichment(url) {
    try {
        const res = await fetch(url, {
            headers: RDAP_HEADERS,
            signal: AbortSignal.timeout(8_000),
        });
        if (!res.ok)
            return null;
        const entity = (await res.json());
        if (!entity.vcardArray || !Array.isArray(entity.vcardArray[1]))
            return null;
        const props = entity.vcardArray[1];
        const adr = vcardAdr(props);
        return {
            email: vcardProp(props, "email"),
            phone: vcardProp(props, "tel"),
            street: adr.street,
            city: adr.city,
            postalCode: adr.postalCode,
            country: adr.country,
        };
    }
    catch {
        return null;
    }
}
// ---- Entity parser ----------------------------------------------------------
function parseEntities(entities, baseUrl) {
    let registrar = null;
    let registrarEntityUrl = null;
    let registrant = null;
    let adminContact = null;
    let techContact = null;
    for (const entity of entities) {
        const roles = entity.roles ?? [];
        if (roles.includes("registrar")) {
            const nested = entity.entities ?? [];
            // Name: try inline vcardArray first; fall back to nested abuse entity fn (KENIC)
            let name = null;
            let email = null;
            let phone = null;
            let street = null;
            let city = null;
            let postalCode = null;
            let country = null;
            if (entity.vcardArray) {
                const props = entity.vcardArray[1];
                name = vcardProp(props, "fn");
                email = vcardProp(props, "email");
                phone = vcardProp(props, "tel");
                const adr = vcardAdr(props);
                street = adr.street;
                city = adr.city;
                postalCode = adr.postalCode;
                country = adr.country;
            }
            else if (nested.length > 0 && nested[0]?.vcardArray) {
                // KENIC: registrar name is on the nested abuse entity
                name = vcardProp(nested[0].vcardArray[1], "fn");
            }
            // Registrar website URL
            const links = entity.links ?? [];
            let url = links.find((l) => l.rel === "about" || l.rel === "self")?.href ?? null;
            if (!url && entity.vcardArray) {
                url = vcardProp(entity.vcardArray[1], "url");
            }
            // IANA registrar ID (gTLDs only)
            const publicIds = entity.publicIds ?? [];
            const ianaId = publicIds.find((p) => p.type === "IANA Registrar ID")?.identifier ?? null;
            // Abuse contact
            let abuseEmail = null;
            let abusePhone = null;
            for (const n of nested) {
                if ((n.roles ?? []).includes("abuse") && n.vcardArray) {
                    const props = n.vcardArray[1];
                    abuseEmail = vcardProp(props, "email");
                    abusePhone = vcardProp(props, "tel");
                }
            }
            registrar = {
                name,
                handle: entity.handle ?? null,
                ianaId,
                url,
                email,
                phone,
                street,
                city,
                postalCode,
                country,
                abuseEmail,
                abusePhone,
            };
            // Check if we should fetch enriched entity data (KENIC: no inline vcard)
            registrarEntityUrl = extractRegistrarEntityUrl(entity, baseUrl);
        }
        if (roles.includes("registrant"))
            registrant = parseVcard(entity);
        if (roles.includes("administrative"))
            adminContact = parseVcard(entity);
        if (roles.includes("technical"))
            techContact = parseVcard(entity);
    }
    return { registrar, registrarEntityUrl, registrant, adminContact, techContact };
}
// ---- Event parser -----------------------------------------------------------
// Actions that are internal/duplicative and don't add value in the events timeline
const HIDDEN_EVENT_ACTIONS = new Set(["last update of RDAP database", "registrar expiration"]);
function parseEvents(rawEvents) {
    let registrationDate = null;
    let expiryDate = null;
    let updatedDate = null;
    let transferDate = null;
    for (const e of rawEvents) {
        switch (e.eventAction) {
            case "registration":
                registrationDate = e.eventDate;
                break;
            case "expiration":
            case "registrar expiration":
                if (!expiryDate || e.eventAction === "expiration")
                    expiryDate = e.eventDate;
                break;
            case "last changed":
                updatedDate = e.eventDate;
                break;
            case "transfer":
                transferDate = e.eventDate;
                break;
        }
    }
    // Build the displayable event log  filter noise, sort newest first
    const events = rawEvents
        .filter((e) => !HIDDEN_EVENT_ACTIONS.has(e.eventAction))
        .map((e) => ({
        action: e.eventAction,
        date: e.eventDate,
        actor: e.eventActor ?? null,
    }))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return { registrationDate, expiryDate, updatedDate, transferDate, events };
}
// ---- TLD helpers ------------------------------------------------------------
function tldVariants(domain) {
    const parts = domain.toLowerCase().split(".");
    return Array.from({ length: parts.length - 1 }, (_, i) => parts.slice(i + 1).join("."));
}
function cleanNsName(ldhName) {
    return ldhName.toLowerCase().replace(/\.$/, "");
}
// ---- Main lookup ------------------------------------------------------------
export async function rdapLookup(domain) {
    const lower = domain.toLowerCase().trim();
    const empty = {
        domain: lower,
        handle: null,
        unicodeName: null,
        source: "rdap",
        registrationDate: null,
        expiryDate: null,
        updatedDate: null,
        transferDate: null,
        status: [],
        registrar: null,
        registrant: null,
        adminContact: null,
        techContact: null,
        nameservers: [],
        dnssec: null,
        dsData: [],
        events: [],
        rdapUrl: null,
        error: null,
    };
    try {
        let baseUrl = null;
        for (const tld of tldVariants(lower)) {
            baseUrl = await resolveRdapBaseUrl(tld);
            if (baseUrl)
                break;
        }
        if (!baseUrl)
            return { ...empty, error: "No RDAP server found for this TLD" };
        const lookupUrl = `${baseUrl.replace(/\/$/, "")}/domain/${encodeURIComponent(lower)}`;
        const res = await fetch(lookupUrl, {
            headers: RDAP_HEADERS,
            signal: AbortSignal.timeout(15_000),
        });
        if (res.status === 404)
            return { ...empty, error: "Domain not found" };
        if (!res.ok)
            return { ...empty, error: `RDAP server returned HTTP ${res.status}` };
        const data = (await res.json());
        const { events, ...parsedDates } = parseEvents(data.events ?? []);
        const { registrar, registrarEntityUrl, registrant, adminContact, techContact } = parseEntities(data.entities ?? [], baseUrl);
        // ── Registrar entity enrichment (KENIC: fetch full entity for address/phone/email) ──
        let enrichedRegistrar = registrar;
        if (registrar && registrarEntityUrl) {
            const enrichment = await fetchRegistrarEntityEnrichment(registrarEntityUrl);
            if (enrichment) {
                enrichedRegistrar = { ...registrar, ...enrichment };
            }
        }
        const nameservers = (data.nameservers ?? [])
            .map((ns) => cleanNsName(ns.ldhName))
            .filter(Boolean);
        const secureDns = data.secureDNS;
        const dnssec = secureDns?.delegationSigned === true
            ? "signedDelegation"
            : secureDns?.delegationSigned === false
                ? "unsigned"
                : null;
        const dsData = (secureDns?.dsData ?? []).map((d) => ({
            keyTag: d.keyTag,
            algorithm: d.algorithm,
            digestType: d.digestType,
            digest: d.digest.toLowerCase(),
        }));
        const links = data.links ?? [];
        const rdapUrl = links.find((l) => l.rel === "self")?.href ??
            links.find((l) => l.rel === "related")?.href ??
            lookupUrl;
        return {
            domain: lower,
            handle: data.handle ?? null,
            unicodeName: data.unicodeName ?? null,
            source: "rdap",
            ...parsedDates,
            status: data.status ?? [],
            registrar: enrichedRegistrar,
            registrant,
            adminContact,
            techContact,
            nameservers,
            dnssec,
            dsData,
            events,
            rdapUrl,
            error: null,
        };
    }
    catch (err) {
        if (err instanceof Error && err.name === "TimeoutError") {
            return { ...empty, error: "RDAP server timed out" };
        }
        return { ...empty, error: err instanceof Error ? err.message : "RDAP lookup failed" };
    }
}
