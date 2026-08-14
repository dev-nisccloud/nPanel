import { z } from "zod";
const capabilityKeySchema = z.enum([
    "images",
    "audio",
    "video",
    "thinking",
    "audio_generation",
    "design",
]);
export const listModelsArgsSchema = z.object({
    category: z
        .enum(["text", "image", "video", "audio", "background-remover"])
        .optional(),
    requires: z.array(capabilityKeySchema).optional(),
});
export const zeepoAgentCategorySchema = z.enum([
    "text",
    "image",
    "video",
    "audio",
    "background-remover",
]);
const sharedInputsSchema = z.object({
    negative_prompt: z.string().max(2000).optional(),
    seed: z.number().int().optional(),
});
/** Per-category whitelisted optional input bag. Unknown keys are dropped. */
const imageInputsSchema = sharedInputsSchema.extend({
    // Note: aspect_ratio support varies by model.
    // gpt-image-2 (design specialist) only accepts "1:1", "3:2", "2:3".
    // Flux/SDXL-class models additionally support "16:9", "9:16", "4:3", "3:4".
    // The server passes the value straight to Replicate; mismatches return 422.
    aspect_ratio: z.enum(["1:1", "3:2", "2:3", "16:9", "9:16", "4:3", "3:4"]).optional(),
    reference_image_url: z.string().url().optional(),
    output_format: z.enum(["png", "jpg", "webp"]).optional(),
    /** Set to "png" when generating design assets (logos, cards) to preserve transparency */
    output_quality: z.number().int().min(50).max(100).optional(),
});
const videoInputsSchema = sharedInputsSchema.extend({
    aspect_ratio: z.enum(["16:9", "9:16", "1:1"]).optional(),
    duration_seconds: z.number().int().min(2).max(20).optional(),
    reference_image_url: z.string().url().optional(),
    with_audio: z.boolean().optional(),
});
const audioInputsSchema = sharedInputsSchema.extend({
    voice: z.string().max(120).optional(),
    duration_seconds: z.number().int().min(2).max(120).optional(),
});
const textInputsSchema = sharedInputsSchema.extend({
    max_tokens: z.number().int().min(64).max(16_000).optional(),
});
const bgRemoverInputsSchema = z.object({
    image: z.string().url(),
});
export const runMediaGenerationArgsSchema = z
    .object({
    category: zeepoAgentCategorySchema,
    prompt: z.string().min(1).max(8000),
    model_id: z.string().max(200).optional(),
    requires: z.array(capabilityKeySchema).optional(),
    inputs: z.record(z.string(), z.unknown()).optional(),
})
    .superRefine((val, ctx) => {
    if (!val.inputs)
        return;
    let inputsSchema;
    switch (val.category) {
        case "image":
            inputsSchema = imageInputsSchema;
            break;
        case "video":
            inputsSchema = videoInputsSchema;
            break;
        case "audio":
            inputsSchema = audioInputsSchema;
            break;
        case "background-remover":
            inputsSchema = bgRemoverInputsSchema;
            break;
        default:
            inputsSchema = textInputsSchema;
            break;
    }
    const parsed = inputsSchema.safeParse(val.inputs);
    if (!parsed.success) {
        ctx.addIssue({
            code: "custom",
            message: `Invalid "inputs" for category "${val.category}": ${parsed.error.message}`,
            path: ["inputs"],
        });
    }
});
export const webSearchArgsSchema = z.object({
    query: z.string().min(1).max(400),
    depth: z.enum(["quick", "standard", "deep"]).optional(),
    freshness: z.enum(["pd", "pw", "pm", "py"]).optional(),
    country: z.string().length(2).toLowerCase().optional(),
});
export const createDocumentArgsSchema = z.object({
    title: z.string().min(1).max(200),
    content: z.string().min(1).max(80000),
});
// ── Presentation slide schemas ────────────────────────────────────────────────
export const presentationSlideSchema = z.object({
    /** Visual layout of this slide. */
    layout: z.enum([
        "title", // Hero cover - title + subtitle centred, optional bg image
        "content", // Title + body paragraph, optional side image
        "bullets", // Title + bullet list, optional side image
        "image-full", // Full-bleed image with gradient text overlay at bottom
        "two-column", // Title + two equal content columns
        "quote", // Large pull-quote, centred, decorative marks
        "section-break", // Accent-colour divider card between sections
        "stats", // Grid of 2–4 large KPI numbers with labels
        "chart", // SVG bar or donut chart with labels
        "timeline", // Horizontal timeline of dated events
        "big-number", // Single giant statistic with context copy
    ]),
    title: z.string().max(200).optional(),
    subtitle: z.string().max(300).optional(),
    /** Paragraph body (plain text or simple markdown **bold** / *italic*). */
    body: z.string().max(2000).optional(),
    /** Bullet-list items (max 7 for readability). */
    bullets: z.array(z.string().max(300)).max(7).optional(),
    /** Left-column content for two-column layout. */
    leftContent: z.string().max(1000).optional(),
    /** Right-column content for two-column layout. */
    rightContent: z.string().max(1000).optional(),
    /**
     * UploadThing image URL for this slide's image / background.
     * MUST be an UploadThing CDN URL (utfs.io / uploadthing.com).
     * Never pass a Replicate-hosted URL here - first call run_media_generation,
     * wait for the generation to complete and appear in SESSION ASSETS, then
     * pass the UploadThing FILE_URL returned there.
     * ALWAYS set imagePosition when setting imageUrl.
     */
    imageUrl: z.string().url().optional(),
    /**
     * Where the image is placed. REQUIRED when imageUrl is set.
     * "background" = full-bleed behind text (use with title, content, bullets, image-full).
     * "right" / "left" = image panel beside content (use with content, bullets).
     */
    imagePosition: z.enum(["background", "right", "left"]).optional(),
    /** Hex slide background colour override (e.g. "#1a1a2e"). */
    bgColor: z.string().max(20).optional(),
    /** Hex text colour override - leave blank and let auto-contrast pick it. */
    textColor: z.string().max(20).optional(),
    /** Hex accent / highlight colour for this slide. */
    accentColor: z.string().max(20).optional(),
    /** Presenter speaker notes (not shown on slide, exported to PPTX). */
    notes: z.string().max(1000).optional(),
    /** Data for the "stats" layout. 2–4 items. */
    stats: z.array(z.object({
        /** Big display value, e.g. "10K+", "$2.4M", "99.9%". */
        value: z.string().max(30),
        /** Short label beneath the value. */
        label: z.string().max(80),
        /** Optional change indicator, e.g. "↑ 43%" or "+120% YoY". */
        delta: z.string().max(40).optional(),
        /** Optional emoji icon beside the value. */
        icon: z.string().max(4).optional(),
    })).min(2).max(4).optional(),
    /** Data for the "chart" layout. */
    chartData: z.object({
        type: z.enum(["bar", "donut"]),
        /** Category labels (one per value). */
        labels: z.array(z.string().max(30)).min(2).max(10),
        /** Numeric values matching labels. */
        values: z.array(z.number()).min(2).max(10),
        /** Optional hex colours per bar/segment. */
        colors: z.array(z.string().max(20)).max(10).optional(),
        /** Optional unit suffix for bar chart value labels, e.g. "K", "%", "M". */
        unit: z.string().max(8).optional(),
    }).optional(),
    /** Events for the "timeline" layout. 3–6 items recommended. */
    timeline: z.array(z.object({
        date: z.string().max(40),
        event: z.string().max(120),
        detail: z.string().max(180).optional(),
    })).min(2).max(6).optional(),
});
export const createPresentationArgsSchema = z.object({
    /** Deck title shown on the cover slide and in the export filename. */
    title: z.string().min(1).max(200),
    /** Visual theme applied to all slides (individual slides can override colours). */
    theme: z.enum(["dark", "light", "branded", "minimal"]),
    /** All slides in order. 1–40 slides. */
    slides: z.array(presentationSlideSchema).min(1).max(40),
});
// ── Image Presentation schemas ────────────────────────────────────────────────
/** A single slide in an image-based presentation. */
export const imagePresentationSlideSchema = z.object({
    /**
     * Detailed image-generation prompt for this slide.
     * Write as a vivid, scene-describing prompt (style, lighting, composition, subject).
     */
    prompt: z.string().min(1).max(800),
    /**
     * UploadThing CDN URL (utfs.io / uploadthing.com) for this slide's image.
     * Leave blank on the first call (images are still generating).
     * Fill in on the second call once the FILE_URL appears in RECENT GENERATIONS.
     */
    imageUrl: z.string().url().optional(),
    /** Short caption displayed at the bottom of the slide (optional). */
    caption: z.string().max(200).optional(),
    /** Presenter notes (not shown on slide). */
    notes: z.string().max(500).optional(),
});
export const createImagePresentationArgsSchema = z.object({
    /** Deck title. Also used as the export filename. */
    title: z.string().min(1).max(200),
    /** Slides in order. Each slide becomes one generated image. 1–20 slides. */
    slides: z.array(imagePresentationSlideSchema).min(1).max(20),
});
/**
 * No arguments - the tool always queries the session of the currently
 * authenticated user. Agents cannot query another user's session.
 */
export const getSessionInfoArgsSchema = z.object({});
/**
 * No arguments - both hosting plan tools always return the full current
 * catalogue; there is nothing to filter at call time.
 */
export const getWebHostingPlansArgsSchema = z.object({});
export const getEmailHostingPlansArgsSchema = z.object({});
export const getWordPressHostingPlansArgsSchema = z.object({});
export const getWordPressSitesArgsSchema = z.object({
    /** Optional domain or parent domain (e.g. ashut.com). Returns that site plus WordPress on its subdomains. */
    domain: z.string().min(3).max(253).optional(),
});
export const getCloudPlansArgsSchema = z.object({
    search: z.string().max(80).optional(),
    limit: z.number().int().min(1).max(24).optional(),
    ram_gb: z.number().positive().max(2048).optional(),
    cores: z.number().int().positive().max(256).optional(),
    cpu: z.enum(["intel", "amd"]).optional(),
    disk_gb: z.number().positive().max(65536).optional(),
    location: z.string().max(80).optional(),
});
export const getCloudServersArgsSchema = z.object({
    type: z.enum(["vps", "vds", "dedicated", "all"]).optional(),
});
/**
 * No arguments - the tool uses the session context (role + teamId) to
 * automatically return agency-wide or team-scoped portfolio data.
 */
export const getDomainsPortfolioArgsSchema = z.object({});
export const getHostingResourcesArgsSchema = z.object({});
export const getHostingDetailArgsSchema = z.object({
    /** The domain / primary domain of the hosting subscription to retrieve. */
    domain: z.string().min(3).max(253),
    /** Include DNS records. Default false - only set true when the user explicitly asks. */
    include_dns: z.boolean().optional().default(false),
    /** Include mail accounts summary. Default false - only set true when the user asks about mail/email accounts. */
    include_mail: z.boolean().optional().default(false),
    /** Include subdomains list. Default false - only set true when the user asks about subdomains. */
    include_subdomains: z.boolean().optional().default(false),
    /** Include databases list. Default false - only set true when the user asks about databases. */
    include_databases: z.boolean().optional().default(false),
});
export const getDomainDetailArgsSchema = z.object({
    /** The full domain name to look up, e.g. "example.co.ke" or "example.com". */
    domain: z.string().min(3).max(253),
    /** Include current nameservers in the response. Default false. */
    include_nameservers: z.boolean().optional().default(false),
    /** Include DNS records (Plesk). Only returned when the domain has connected hosting. Default false. */
    include_dns: z.boolean().optional().default(false),
});
export const checkDomainAvailabilityArgsSchema = z.object({
    name: z
        .string()
        .min(1)
        .max(63)
        .regex(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/i, "Must be a valid SLD (letters, digits, hyphens; no dots or TLD)"),
    extensions: z
        .array(z.string().min(2).max(20))
        .min(1)
        .max(10)
        .optional(),
});
// CreatePresentationArgs and PresentationSlide are exported above with the schema.
export const TOOL_DEFINITIONS_FOR_PROMPT = `Available tools (call any of them through the "tool_calls" array):

1) get_user_session
   Purpose: Retrieve the current authenticated user's account role and profile completeness. Use this immediately after presenting domain availability results - BEFORE saying domains are available for purchase - so you can tailor the next step message to the user's situation.
   Arguments: none (no arguments object needed - you always check your own session, never another user's).
   Returns: {
     role: "CUSTOMER" | "AGENCY_USER" | "AGENCY_ADMIN" | "AGENCY_SUPER_ADMIN",
     isAgency: boolean,           // true for any AGENCY_* role
     profileComplete: boolean,    // false means required domain-registration fields are missing
     missingFields: string[]      // which fields need filling in (empty array when complete)
   }
   After results:
   - If isAgency is true → tell the user: "Since you're on an agency account, during checkout you'll be prompted to enter the customer's details (name, email, address, phone) - the domain will be registered under their information."
   - If isAgency is false AND profileComplete is false → tell the user which fields are missing and direct them to complete their profile at /my-profile BEFORE purchasing. Explain that domain registration requires this information and the order will fail without it.
   - If isAgency is false AND profileComplete is true → proceed normally; the user can click Buy on any available domain above.

2) create_document
   Purpose: produce a richly formatted, standalone markdown document - for strategies, detailed plans, proposals, full analyses, comprehensive breakdowns, reports, or any deliverable that benefits from structure and length beyond a chat reply.
   Arguments:
     - title  : string (1–200 chars) - concise document title (e.g. "Brand Strategy for Diamond Coffee Co.").
     - content: string - the complete markdown body. Use ## headings, bullet lists, tables, **bold** for emphasis. Write the FULL document - no placeholders, no "continued below", no truncation.
   Returns: { status: "CREATED", title } - internal only; never show a document id to the user.
   When to call: (1) the user explicitly asks for a "breakdown", "detailed plan", "strategy doc", "report", "proposal", "full analysis", or "put this in a doc"; (2) the response requires 3+ distinct sections and would be unwieldy as a plain chat reply; (3) the user says "save this" or "I want the full version".
   When NOT to call: conversational replies, short answers, quick lists, follow-up clarifications, or anything that reads naturally as a chat bubble. Err toward NOT calling - only invoke when the document format genuinely adds value.
   After calling: write a SHORT chat reply (2–4 sentences) telling the user what the document covers and directing them to open it in the Generations section. Do NOT reproduce the full document content in the chat reply.

3) check_domain_availability  ← NISC CLOUD INTERNAL TOOL
   Purpose: check whether domain names are available for registration through Nisc Cloud's own infrastructure. ALWAYS use this when the user asks about domain availability, domain registration, or domain name ideas - never guess and never recommend external registrars.
   Arguments:
     - name       : string - the SLD (second-level domain) WITHOUT any extension or dots (e.g. "diamond-coffee" not "diamond-coffee.com").
     - extensions?: string[] (1–10 items) - TLD extensions to check (e.g. [".co.ke", ".com", ".africa", ".ke"]). If not specified, the server uses the smart default set for Kenyan businesses: .co.ke, .com, .ke, .africa, .net, .org. **Always override** when the user states a **primary market outside Kenya** - order extensions the way registrants in that market typically stack them (e.g. UK → .co.uk, .com; Germany → .de, .com; Nigeria → .com.ng, .ng, .com; EU-wide brand → .eu or national ccTLD of HQ + .com). Add context-specific gTLDs (.tech, .store, .agency) only when the brief fits. Regional NGO in Kenya → add .or.ke; global startup → .com, .io; creative studio → .studio, .agency.
   Returns: { name, checked: [{ domain, available, status, price?, isPremium? }], availableCount, checkedAt }
   After results: present available domains and their prices, then IMMEDIATELY call get_user_session (do NOT skip this step). Do NOT tell the user to contact Nisc Cloud by email or phone for domain registration - they can purchase directly using the Buy buttons shown above each domain result. NEVER mention or recommend GoDaddy, Namecheap, Google Domains, Cloudflare, or any other registrar.

4) get_domains_portfolio  ← NISC CLOUD INTERNAL TOOL
   Purpose: retrieve the domains already registered/owned through Nisc Cloud. Behaviour is automatically tailored to the caller's role - no arguments needed.
   Arguments: none.
   Returns: {
     isAgency: boolean,
     teamName: string | null,        // customer only - the organisation name
     domains: [{ domain, status, expiryDate, registrationDate, autoRenewal, clientName? }],
     totalCount, activeCount, expiredCount,
     hasMore: boolean                // true when >100 domains exist (agency only)
   }
   - Agency users get a merged view of ALL domains managed through Nisc Cloud, identical to the agency Domains Portfolio page. Present it as "Here is the full Nisc Cloud domain portfolio."
   - Customer users get domains scoped to their team subscription records. Present it as "You currently own the following domains under [teamName]."
   When to call: user asks "what domains do we have", "show my domains", "list all domains", "what domains does [client] own", "check our domain portfolio", or any variant of listing existing domains (NOT checking availability of new ones - use check_domain_availability for that).
   After results: summarise counts (total / active / expired), list the domains, and highlight any that are expired or expiring soon (within 30 days). If hasMore is true, note that only the first 100 domains are shown.

5) get_hosting_resources  ← NISC CLOUD INTERNAL TOOL
   Purpose: list all hosting subscriptions managed through Nisc Cloud. Behaviour is automatically role-aware.
   Arguments: none.
   Returns: {
     isAgency: boolean,
     teamName: string | null,
     resources: [{
       domain, status ("Active"|"Suspended"|"Unknown"), ipAddress, sslEnabled,
       diskUsageFormatted, diskLimitFormatted, trafficFormatted,
       planName, billingCycle, expiryDate, nextRenewalDate, autoRenew,
       teamName (agency only: which client owns the subscription), createdAt
     }],
     totalCount, activeCount, suspendedCount,
     pleskUnavailable?  // true when Plesk is unreachable (customer shows DB data only)
   }
   - Agency: live Plesk data for ALL webspaces, enriched with billing info from the database.
   - Customer: shows only the team's web hosting subscriptions from the database.
   When to call: user asks "show my hosting", "list hosting plans", "what hosting do we have", "show all hosting resources", or any variant requesting a list of existing hosting accounts.
   After results: the card is rendered in the UI - write a SHORT follow-up (2–4 sentences) covering total/active/suspended counts and highlighting any suspended or expiring subscriptions. NEVER echo raw field values (IP addresses, disk bytes, internal IDs).

6) get_hosting_detail  ← NISC CLOUD INTERNAL TOOL
   Purpose: fetch full live detail for a single hosting subscription identified by its primary domain name. Supports optional on-demand sections.
   Arguments:
     - domain              : string  - the primary domain of the hosting account (e.g. "example.co.ke").
     - include_dns?        : boolean (default false) - fetch DNS records; only set true when user explicitly asks about DNS.
     - include_mail?       : boolean (default false) - fetch mail accounts summary; only set true when user asks about email/mail accounts.
     - include_subdomains? : boolean (default false) - fetch subdomains list; only set true when user asks about subdomains.
     - include_databases?  : boolean (default false) - fetch databases list; only set true when user asks about databases.
   Returns (always): { found, status, ipAddress, sslEnabled, diskUsageFormatted, diskLimitFormatted, trafficFormatted, mailboxCount, databaseCount, subdomainCount, createdAt, planName, hostingType, billingCycle, expiryDate, nextRenewalDate, autoRenew, teamName (agency only), pleskUnavailable?, error? }
   Returns (when requested):
     - dnsRecords: [{ type, host, value, ttl }]
     - mailAccounts: [{ email, mailboxEnabled, quotaFormatted, usageFormatted, forwardingEnabled, forwardingAddresses, aliases, autoresponderEnabled }]
     - subdomains: [{ name, fqdn }]
     - databases: [{ name, type }]
   Authorization: agency can query any subscription; customer can only query subscriptions belonging to their organisation.
   When to call: user asks "show details for [domain] hosting", "get hosting info for [domain]", "how much disk is [domain] using", "is [domain] hosting active", "when does [domain] hosting expire".
   IMPORTANT - set include flags based on what the user EXPLICITLY asks:
   - Default (overview + billing only): all flags false.
   - User asks about DNS: include_dns = true.
   - User asks about email/mail accounts: include_mail = true.
   - User asks about subdomains: include_subdomains = true.
   - User asks about databases: include_databases = true.
   After results: the detail card is already rendered in the UI - write a SHORT follow-up (1–3 sentences).
   - Always: summarise status, disk usage, expiry.
   - If include_mail true: briefly list mail accounts (email address only) and suggest user ask for details on a specific one if they want more.
   - If include_dns/subdomains/databases true: note counts found; do NOT paste full raw data in text.
   - NEVER mention: IP addresses, certificate names, internal IDs, raw byte values, passwords, or credentials of any kind.

7) get_domain_detail  ← NISC CLOUD INTERNAL TOOL
   Purpose: retrieve full registry detail for a specific domain - status, dates, registrant handles, hosting connection, and optionally nameservers and DNS records.
   Arguments:
     - domain              : string - the full FQDN (e.g. "example.co.ke" or "example.com").
     - include_nameservers?: boolean (default false) - set true when the user asks for nameservers.
     - include_dns?        : boolean (default false) - set true when the user explicitly asks for DNS records. DNS is only returned when the domain has connected Plesk hosting; if it has no hosting the tool returns a note explaining this.
   Authorization: agency users can look up any portfolio domain; customer users can only look up domains owned by their organisation - the tool returns accessDenied: true for others.
   Returns: { found, status, expiryDate, registrationDate, renewalDate, autoRenewal, isLocked, isDnssecEnabled, hasHosting, hostingPlanName, nameservers?, dnsRecords?, dnsNote? } - internal-only fields (registrantHandle, adminHandle, techHandle) are present in the payload but MUST NOT be shown or mentioned to the user.
   When to call: user asks "tell me about [domain]", "get details for [domain]", "check [domain]", "what nameservers does [domain] use", "show DNS for [domain]", "does [domain] have hosting".
   IMPORTANT - set include flags based on what the user EXPLICITLY asks for:
   - Default call (overview + hosting check only): both flags false.
   - User asks about nameservers: include_nameservers = true.
   - User asks about DNS records: include_dns = true.
   - User asks for "full details" or "everything": both true.
   After results: the detail card is already rendered in the UI - write a SHORT plain-text follow-up (1–3 sentences) that ONLY mentions: status, expiry date, and hosting status. Do NOT narrate or repeat any other fields. NEVER mention or echo: registrantHandle, adminHandle, techHandle, isLocked value, isDnssecEnabled value, pleskSiteId, or any internal identifier. If include_nameservers was true, you may briefly list the nameservers in text. If include_dns was true and dnsRecords are present, you may note how many records were found - do NOT paste the full DNS table in text (the card already shows it). If dnsNote is present, quote it once briefly.

8) get_web_hosting_plans  ← NISC CLOUD INTERNAL TOOL
   Purpose: fetch the current web/website hosting plans available on Nisc Cloud and display them as a purchasable pricing card. ALWAYS use this when the user asks about web hosting, website hosting, hosting plans, or wants to compare or buy a hosting package - never guess pricing or direct users elsewhere.
   Arguments: none (no arguments needed - always returns the full active catalogue).
   Returns: { plans[], productFeatures[], checkedAt } - the UI renders an interactive pricing table with Buy buttons.
   When to call: user asks about web hosting plans, website hosting pricing, how much hosting costs, wants to host a website, or is comparing hosting options.
   After results: present a brief summary of what's available (plan names and starting price) and tell the user they can select a plan and click Buy directly in the card above. NEVER quote prices from memory - the card always shows current live pricing.

9) get_email_hosting_plans  ← NISC CLOUD INTERNAL TOOL
   Purpose: fetch the current email hosting plans available on Nisc Cloud and display them as a purchasable pricing card. ALWAYS use this when the user asks about business email, email hosting, professional email, or wants to compare or buy an email hosting package.
   Arguments: none (no arguments needed - always returns the full active catalogue).
   Returns: { plans[], productFeatures[], checkedAt } - the UI renders an interactive pricing table with Buy buttons.
   When to call: user asks about email hosting plans, business email pricing, how much email hosting costs, wants a professional email address, or is comparing email hosting options.
   After results: present a brief summary of what's available and tell the user they can click Buy on any plan directly in the card above. NEVER quote prices from memory.

10) web_search
   Purpose: retrieve real-time grounding context from the live web via Brave Search. Call this BEFORE answering questions that involve specific real-world entities, current data, or regional context.
   Arguments:
     - query   : string (1–400 chars) - the search query. Be specific: include entity names, location, and timeframe when relevant (e.g. "Diamond Coffee Nairobi menu prices 2026"). ALWAYS embed geography directly in the query for non-major-market regions (Africa, Middle East, South/Southeast Asia except IN, ID, MY, PH) - e.g. "luxury car imports Nairobi Kenya 2026" not just "luxury cars".
     - depth?  : "quick" | "standard" | "deep" - "quick" for single facts, "standard" (default) for most queries, "deep" for complex research.
     - freshness? : "pd" (24 h) | "pw" (7 days) | "pm" (31 days) | "py" (1 year) - omit for all-time.
     - country? : 2-letter ISO code. ONLY use for: AR AU AT BE BR CA CL DK FI FR DE GR HK IN ID IT JP KR MY MX NL NZ NO CN PL PT PH RU SA ZA ES SE CH TW TR GB US. For all other countries (e.g. Kenya, Nigeria, most of Africa) omit this field entirely and embed the country/city in the query string instead.
   Returns: extracted page snippets ready for LLM consumption. Cite sources inline in your reply (e.g. "According to [hostname]…").
   When to call: (1) user mentions a specific business, person, place, product, or event; (2) question involves prices, availability, opening hours, statistics, or news; (3) you need local/regional context (e.g. "Nairobi businesses", "Kenyan market", "this quarter"); (4) user asks you to "research", "find out", "check", or verify something about the real world; (5) **domain or brand naming** where the user names a **country, city, or foreign market** you are not highly confident about - search for how businesses there typically name and which extensions they pair with, then apply that to your SLD ideas and extension list before you call check_domain_availability.
   When NOT to call: general knowledge you are confident about, pure creative tasks where you have all context, or Nisc Cloud topics already in your system prompt. Do NOT call web_search for domain availability - use check_domain_availability instead.
   Call web_search BEFORE claiming facts about real-world entities - do not guess then search.

11) list_models
   Purpose: discover the *exact* Replicate model ids available in the Zeepo catalog for a category, filtered by capabilities.
   Arguments:
     - category? : "text" | "image" | "video" | "audio" | "background-remover"
     - requires? : array of capability keys; valid: "images", "audio", "video", "thinking", "audio_generation"
   Returns: an array of { id, category, provider, label, description, is_default, capabilities }.
   Use this tool BEFORE you ever pass a non-default "model_id" to run_media_generation.

12) run_media_generation
   Purpose: queue a media generation job. Results stream back to the UI asynchronously.
   Arguments:
     - category : "text" | "image" | "video" | "audio" | "background-remover"
     - prompt : string (concrete, detailed; 1–800 words)
     - model_id? : string - MUST be an id you saw in a list_models result for the same category. Omit to use the default for the category.
     - requires? : capability keys the chosen model MUST satisfy (e.g. ["audio_generation"] for video with audio; ["design"] to force the design-specialist model for logos, cards, flyers). The server validates this.
     - inputs? : optional category-specific knobs (image: {aspect_ratio, reference_image_url, output_format, negative_prompt, seed}; video: {aspect_ratio, duration_seconds, reference_image_url, with_audio, negative_prompt, seed}; audio: {voice, duration_seconds, negative_prompt, seed}; text: {max_tokens, negative_prompt, seed}; background-remover: {image: <url>}). Unknown keys are rejected.
       IMPORTANT - aspect_ratio for images: the default model (gpt-image-2) ONLY accepts "1:1", "3:2", or "2:3". Do NOT pass "16:9", "9:16", "4:3", or "3:4" with the default model - this causes a 422 error. Use "3:2" for landscape (widescreen slide backgrounds), "1:1" for square assets, and "2:3" for portrait. Other ratios are only valid when you explicitly pick a Flux/SDXL-class model via model_id.
   Returns: { generationId, status: "QUEUED", modelId, category } (for your context only - never repeat generationId, modelId as a "job id", or UUIDs in assistant_text). The chat UI shows progress in the Generations strip; tell the user in plain language that their asset is generating / queued (e.g. "It's generating now - you'll see it in Generations when ready.").

13) create_presentation
   Purpose: produce a professionally designed slide deck - pitches, strategy decks, proposals, reports, educational content, or any multi-slide deliverable. Exports: PDF, PPTX (PowerPoint), PNG per slide.

   ── ARGUMENTS ──────────────────────────────────────────────────────────────
   - title  : string - deck title shown on cover slide and export filename.
   - theme  : "dark" | "light" | "branded" | "minimal"
       • dark     - deep navy (#0a0f1e) bg, white text, indigo accent. Bold, cinematic. Best for pitches, tech, night-mode content.
       • light    - near-white (#f8fafc) bg, near-black text, blue accent. Clean, corporate. Best for reports, client decks, daytime presentations.
       • branded  - deep indigo (#1e1b4b) bg, lavender text, purple accent. Distinctive, premium. Best for brand presentations.
       • minimal  - pure white bg, black text, black accent. Editorial, typographic. Best for design-focused, editorial content.
   - slides : array of slide objects (1–40). See layouts and design rules below.

   ── SLIDE LAYOUTS ──────────────────────────────────────────────────────────
   Choose layouts that vary through the deck - never use the same layout 3+ times in a row.

   "title"        Hero cover. Fields: title (required), subtitle, imageUrl+imagePosition="background".
                  Use ONLY for the opening cover slide or major section openers.

   "section-break" Chapter divider. Fields: title (required), subtitle. Has its own accent bg automatically.
                  Use between major sections. Keep title short (3–6 words).

   "content"      Title + paragraph body. Fields: title, body (use **bold** for key phrases), imageUrl+imagePosition="right"|"left"|"background".
                  Best for: executive summaries, single concept explanations, image+text pairs.

   "bullets"      Title + bullet list. Fields: title, subtitle?, bullets[] (3–6 items max). Optional imageUrl+imagePosition="right"|"left".
                  Each bullet: concise, 10–15 words max. NO full sentences. Lead with the key fact.
                  Best for: key points, features, recommendations.

   "two-column"   Title + two equal columns. Fields: title, leftContent, rightContent.
                  Best for: comparisons, before/after, pros/cons, two perspectives. Use **bold** for sub-headings within columns.

   "quote"        Single pull-quote. Fields: body (the quote text, 20–60 words), subtitle (attribution - write as plain name/title, no leading dash or em dash, e.g. "Jane Doe, CEO" not "- Jane Doe").
                  Best for: testimonials, key insights, thought leadership moments.

   "image-full"   Full-bleed image with title+subtitle overlaid. Fields: title, subtitle?, imageUrl (REQUIRED - imagePosition is implied "background").
                  Best for: visual impact moments, photography, scene-setting.

   "stats"        Grid of 2–4 large KPI numbers. Fields: title, stats[] with {value, label, delta?, icon?}.
                  values: short strings like "10K+", "$2.4M", "99.9%", "3×". delta: change indicator like "↑ 43%".
                  Best for: impact metrics, financial highlights, growth proof.

   "chart"        SVG bar or donut chart. Fields: title, subtitle?, chartData: {type:"bar"|"donut", labels[], values[], colors[]?, unit?}.
                  bar: up to 8 bars (vertical). donut: up to 6 segments. Provide real/estimated numbers.
                  Best for: revenue breakdowns, survey results, market share, performance over time.

   "timeline"     Horizontal event timeline. Fields: title, timeline[]: {date, event, detail?}. 3–5 events ideal.
                  Best for: roadmaps, company history, project phases, go-to-market sequence.

   "big-number"   Single giant statistic. Fields: title (the big number/stat), subtitle (what it measures), body (1–2 sentences of context).
                  Best for: opening impact, single most important proof point, wow moments.

   ── DESIGN RULES (MANDATORY - follow every one) ─────────────────────────────
   1. CONTRAST FIRST - Never put light text on a light background or dark text on a dark background.
      • If bgColor is light (#ffffff, #f8fafc, #f0f0f0, any hex where R+G+B > 400): use dark textColor (#0f172a, #111827, #18181b).
      • If bgColor is dark (#0a0f1e, #1e1b4b, any hex where R+G+B < 300): use light textColor (#f8fafc, #ffffff, #e0e7ff).
      • NEVER override textColor at all unless you're also setting a custom bgColor - let the renderer auto-compute contrast.
      • NEVER set textColor="#ffffff" on a white or near-white bgColor. This is the most common mistake - it makes text invisible.

   2. COLOUR HARMONY - accent colours must contrast with both bg and text.
      • On dark bg: bright/saturated accents work well (#6366f1, #22d3ee, #f59e0b, #10b981, #f43f5e).
      • On light bg: medium-dark accents only (#2563eb, #7c3aed, #059669, #dc2626, #d97706).
      • Never use a light accent on a light bg (invisible). Never use an accent that matches the bg.

   3. SLIDE DENSITY - each slide should convey ONE main idea.
      • bullets: max 6 items, each under 15 words.
      • body: max 3 short paragraphs; use **bold** to call out key terms.
      • Never put body AND bullets on the same slide - choose one.
      • stats: max 4 KPIs per slide; if you have more, split across two stats slides.

   4. LAYOUT VARIETY - a well-designed deck varies layouts intentionally:
      • Slide 1: always "title"
      • After every 2–3 content slides, use a "section-break" or "quote" or "big-number" to reset the pace.
      • For data-heavy content, use "stats" or "chart" instead of bullets with numbers.
      • Use "image-full" for visual breathing room between dense content.

   5. TYPOGRAPHY & HIERARCHY
      • Title: max 8 words. Sharp, active, no filler words.
      • Subtitle: supports the title in 1 sentence.
      • Body: written in clean prose, **bold** key phrases only.
      • Bullets: lead with the most important word/phrase, support in the rest of the bullet.
      • NEVER use em dashes (-) anywhere in slide content - not in titles, subtitles, body, bullets, or any field. Use a regular hyphen (-) if a separator is needed. Em dashes look broken in presentation fonts and are not acceptable.

   6. SLIDE COUNT GUIDELINES
      • 10–15 slides for a typical pitch or strategy deck.
      • Open: title + agenda/overview (2 slides).
      • Body: 6–10 content slides with varied layouts.
      • Close: summary/CTA + final title or quote (2 slides).

   ── IMAGE WORKFLOW ──────────────────────────────────────────────────────────
   Images in slides MUST use UploadThing URLs (FILE_URL from RECENT GENERATIONS).
   NEVER use a Replicate-hosted URL directly - it will expire.

   Recommended flow when slides need visual imagery:
     Step 1 (same turn): Call run_media_generation for each image needed (aspect_ratio "3:2" for landscape/background images).
                         Also call create_presentation in the same turn, using bgColor placeholders for image slides.
                         Tell the user their images are generating and the deck is ready with placeholder colours.
     Step 2 (next turn, after images show as COMPLETED in RECENT GENERATIONS with FILE_URL):
                         Call create_presentation again with the actual imageUrl values filled in.
                         Tell the user the deck is now updated with the real images.

   For "image-full" layout: imagePosition is implied - just set imageUrl and the full-bleed render is automatic.
   For "content"/"bullets" with side image: always set imagePosition="right" or "left" alongside imageUrl.
   For "title" with bg image: set imagePosition="background".

   ── AFTER CALLING ───────────────────────────────────────────────────────────
   Write a SHORT reply (2–4 sentences): what the deck covers, how many slides, and that it is ready to open and export as PDF, PPTX, or PNG.

14) create_image_presentation
   Purpose: produce a photorealistic / high-graphic image-based slide deck where EVERY slide is a full AI-generated image. Use this instead of create_presentation when the user wants photorealistic visuals, cinematic scenes, high-end graphic design, or any deck that should look like a polished visual production rather than a text layout deck.

   ── WHEN TO USE ──────────────────────────────────────────────────────────────
   • User says: "make it look photorealistic", "high graphics", "cinematic slides", "image deck", "visual slides", "graphic slides", "like a real design".
   • The content benefits from full-bleed imagery over text layouts (e.g. a travel deck, a product showcase, a brand story, a photography portfolio walkthrough).
   • NEVER use for data-heavy decks (charts, stats, timelines) - use create_presentation instead.

   ── ARGUMENTS ──────────────────────────────────────────────────────────────
   - title  : string - deck title, used as the export filename.
   - slides : array of slide objects (1–20). Each slide = one generated image.
       • prompt   : (required) - detailed image-generation prompt. See PROMPT GUIDELINES below.
       • imageUrl : (optional) - UploadThing FILE_URL once the image is ready. Leave blank on the first call.
       • caption  : (optional) - short text shown at the bottom of the slide (max 200 chars).
       • notes    : (optional) - presenter notes (not visible on slide).

   ── PROMPT GUIDELINES (critical - image quality depends on this) ──────────────
   Each prompt must be a richly descriptive image generation prompt:
   • Describe: subject, setting, composition, lighting, mood, colour palette, style.
   • Use cinematic / editorial language: "golden hour lighting", "shallow depth of field", "aerial view", "dramatic shadows", "vibrant saturated colours", "muted pastel palette", "studio lighting", "photorealistic render".
   • Include text/graphic design needs if any: "bold white headline in the centre", "minimalist design layout with brand logo top-right".
   • Keep each prompt 80–200 words for best results.
   • All slides should share a visual style - mention the shared aesthetic in every prompt (e.g. "consistent dark cinematic style", "same warm editorial photography feel").

   ── IMAGE WORKFLOW ────────────────────────────────────────────────────────────
   Step 1 (same turn):
     • For EACH slide, call run_media_generation with:
         category: "image"
         model_id: "google/nano-banana-pro"
         requires: ["design"]
         inputs: { aspect_ratio: "3:2" }        ← always 3:2 for landscape slide images
         prompt: the detailed slide prompt
     • Also call create_image_presentation with the same prompts but NO imageUrl fields.
     • Tell the user their slides are generating and the deck is ready as a placeholder.

   Step 2 (next turn, once images show as COMPLETED with FILE_URL in RECENT GENERATIONS):
     • Call create_image_presentation again, this time including imageUrl for each slide.
     • Tell the user the deck is now complete with all images.

   ── AFTER CALLING ───────────────────────────────────────────────────────────
   Write a SHORT reply (2–4 sentences): how many image slides, the visual style, and that images are generating (Step 1) or the deck is complete and ready to download as a ZIP (Step 2).`;
