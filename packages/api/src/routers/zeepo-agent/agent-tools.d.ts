import { z } from "zod";
export declare const listModelsArgsSchema: z.ZodObject<{
    category: z.ZodOptional<z.ZodEnum<{
        image: "image";
        text: "text";
        video: "video";
        audio: "audio";
        "background-remover": "background-remover";
    }>>;
    requires: z.ZodOptional<z.ZodArray<z.ZodEnum<{
        design: "design";
        video: "video";
        audio: "audio";
        images: "images";
        thinking: "thinking";
        audio_generation: "audio_generation";
    }>>>;
}, z.core.$strip>;
export declare const zeepoAgentCategorySchema: z.ZodEnum<{
    image: "image";
    text: "text";
    video: "video";
    audio: "audio";
    "background-remover": "background-remover";
}>;
export declare const runMediaGenerationArgsSchema: z.ZodObject<{
    category: z.ZodEnum<{
        image: "image";
        text: "text";
        video: "video";
        audio: "audio";
        "background-remover": "background-remover";
    }>;
    prompt: z.ZodString;
    model_id: z.ZodOptional<z.ZodString>;
    requires: z.ZodOptional<z.ZodArray<z.ZodEnum<{
        design: "design";
        video: "video";
        audio: "audio";
        images: "images";
        thinking: "thinking";
        audio_generation: "audio_generation";
    }>>>;
    inputs: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, z.core.$strip>;
export declare const webSearchArgsSchema: z.ZodObject<{
    query: z.ZodString;
    depth: z.ZodOptional<z.ZodEnum<{
        quick: "quick";
        standard: "standard";
        deep: "deep";
    }>>;
    freshness: z.ZodOptional<z.ZodEnum<{
        pd: "pd";
        pw: "pw";
        pm: "pm";
        py: "py";
    }>>;
    country: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const createDocumentArgsSchema: z.ZodObject<{
    title: z.ZodString;
    content: z.ZodString;
}, z.core.$strip>;
export declare const presentationSlideSchema: z.ZodObject<{
    layout: z.ZodEnum<{
        title: "title";
        content: "content";
        bullets: "bullets";
        "image-full": "image-full";
        "two-column": "two-column";
        quote: "quote";
        "section-break": "section-break";
        stats: "stats";
        chart: "chart";
        timeline: "timeline";
        "big-number": "big-number";
    }>;
    title: z.ZodOptional<z.ZodString>;
    subtitle: z.ZodOptional<z.ZodString>;
    body: z.ZodOptional<z.ZodString>;
    bullets: z.ZodOptional<z.ZodArray<z.ZodString>>;
    leftContent: z.ZodOptional<z.ZodString>;
    rightContent: z.ZodOptional<z.ZodString>;
    imageUrl: z.ZodOptional<z.ZodString>;
    imagePosition: z.ZodOptional<z.ZodEnum<{
        background: "background";
        left: "left";
        right: "right";
    }>>;
    bgColor: z.ZodOptional<z.ZodString>;
    textColor: z.ZodOptional<z.ZodString>;
    accentColor: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
    stats: z.ZodOptional<z.ZodArray<z.ZodObject<{
        value: z.ZodString;
        label: z.ZodString;
        delta: z.ZodOptional<z.ZodString>;
        icon: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>>;
    chartData: z.ZodOptional<z.ZodObject<{
        type: z.ZodEnum<{
            bar: "bar";
            donut: "donut";
        }>;
        labels: z.ZodArray<z.ZodString>;
        values: z.ZodArray<z.ZodNumber>;
        colors: z.ZodOptional<z.ZodArray<z.ZodString>>;
        unit: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    timeline: z.ZodOptional<z.ZodArray<z.ZodObject<{
        date: z.ZodString;
        event: z.ZodString;
        detail: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>>;
}, z.core.$strip>;
export declare const createPresentationArgsSchema: z.ZodObject<{
    title: z.ZodString;
    theme: z.ZodEnum<{
        dark: "dark";
        light: "light";
        branded: "branded";
        minimal: "minimal";
    }>;
    slides: z.ZodArray<z.ZodObject<{
        layout: z.ZodEnum<{
            title: "title";
            content: "content";
            bullets: "bullets";
            "image-full": "image-full";
            "two-column": "two-column";
            quote: "quote";
            "section-break": "section-break";
            stats: "stats";
            chart: "chart";
            timeline: "timeline";
            "big-number": "big-number";
        }>;
        title: z.ZodOptional<z.ZodString>;
        subtitle: z.ZodOptional<z.ZodString>;
        body: z.ZodOptional<z.ZodString>;
        bullets: z.ZodOptional<z.ZodArray<z.ZodString>>;
        leftContent: z.ZodOptional<z.ZodString>;
        rightContent: z.ZodOptional<z.ZodString>;
        imageUrl: z.ZodOptional<z.ZodString>;
        imagePosition: z.ZodOptional<z.ZodEnum<{
            background: "background";
            left: "left";
            right: "right";
        }>>;
        bgColor: z.ZodOptional<z.ZodString>;
        textColor: z.ZodOptional<z.ZodString>;
        accentColor: z.ZodOptional<z.ZodString>;
        notes: z.ZodOptional<z.ZodString>;
        stats: z.ZodOptional<z.ZodArray<z.ZodObject<{
            value: z.ZodString;
            label: z.ZodString;
            delta: z.ZodOptional<z.ZodString>;
            icon: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>>;
        chartData: z.ZodOptional<z.ZodObject<{
            type: z.ZodEnum<{
                bar: "bar";
                donut: "donut";
            }>;
            labels: z.ZodArray<z.ZodString>;
            values: z.ZodArray<z.ZodNumber>;
            colors: z.ZodOptional<z.ZodArray<z.ZodString>>;
            unit: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        timeline: z.ZodOptional<z.ZodArray<z.ZodObject<{
            date: z.ZodString;
            event: z.ZodString;
            detail: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type CreatePresentationArgs = z.infer<typeof createPresentationArgsSchema>;
export type PresentationSlide = z.infer<typeof presentationSlideSchema>;
/** A single slide in an image-based presentation. */
export declare const imagePresentationSlideSchema: z.ZodObject<{
    prompt: z.ZodString;
    imageUrl: z.ZodOptional<z.ZodString>;
    caption: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const createImagePresentationArgsSchema: z.ZodObject<{
    title: z.ZodString;
    slides: z.ZodArray<z.ZodObject<{
        prompt: z.ZodString;
        imageUrl: z.ZodOptional<z.ZodString>;
        caption: z.ZodOptional<z.ZodString>;
        notes: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type CreateImagePresentationArgs = z.infer<typeof createImagePresentationArgsSchema>;
export type ImagePresentationSlide = z.infer<typeof imagePresentationSlideSchema>;
/**
 * No arguments - the tool always queries the session of the currently
 * authenticated user. Agents cannot query another user's session.
 */
export declare const getSessionInfoArgsSchema: z.ZodObject<{}, z.core.$strip>;
/**
 * No arguments - both hosting plan tools always return the full current
 * catalogue; there is nothing to filter at call time.
 */
export declare const getWebHostingPlansArgsSchema: z.ZodObject<{}, z.core.$strip>;
export declare const getEmailHostingPlansArgsSchema: z.ZodObject<{}, z.core.$strip>;
/**
 * No arguments - the tool uses the session context (role + teamId) to
 * automatically return agency-wide or team-scoped portfolio data.
 */
export declare const getDomainsPortfolioArgsSchema: z.ZodObject<{}, z.core.$strip>;
export type GetDomainsPortfolioArgs = z.infer<typeof getDomainsPortfolioArgsSchema>;
export declare const getHostingResourcesArgsSchema: z.ZodObject<{}, z.core.$strip>;
export type GetHostingResourcesArgs = z.infer<typeof getHostingResourcesArgsSchema>;
export declare const getHostingDetailArgsSchema: z.ZodObject<{
    domain: z.ZodString;
    include_dns: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    include_mail: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    include_subdomains: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    include_databases: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, z.core.$strip>;
export type GetHostingDetailArgs = z.infer<typeof getHostingDetailArgsSchema>;
export declare const getDomainDetailArgsSchema: z.ZodObject<{
    domain: z.ZodString;
    include_nameservers: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    include_dns: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, z.core.$strip>;
export type GetDomainDetailArgs = z.infer<typeof getDomainDetailArgsSchema>;
export type GetWebHostingPlansArgs = z.infer<typeof getWebHostingPlansArgsSchema>;
export type GetEmailHostingPlansArgs = z.infer<typeof getEmailHostingPlansArgsSchema>;
export declare const checkDomainAvailabilityArgsSchema: z.ZodObject<{
    name: z.ZodString;
    extensions: z.ZodOptional<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
export type ListModelsArgs = z.infer<typeof listModelsArgsSchema>;
export type RunMediaGenerationArgs = z.infer<typeof runMediaGenerationArgsSchema>;
export type WebSearchArgs = z.infer<typeof webSearchArgsSchema>;
export type CheckDomainAvailabilityArgs = z.infer<typeof checkDomainAvailabilityArgsSchema>;
export type CreateDocumentArgs = z.infer<typeof createDocumentArgsSchema>;
export type GetSessionInfoArgs = z.infer<typeof getSessionInfoArgsSchema>;
export declare const TOOL_DEFINITIONS_FOR_PROMPT = "Available tools (call any of them through the \"tool_calls\" array):\n\n1) get_user_session\n   Purpose: Retrieve the current authenticated user's account role and profile completeness. Use this immediately after presenting domain availability results - BEFORE saying domains are available for purchase - so you can tailor the next step message to the user's situation.\n   Arguments: none (no arguments object needed - you always check your own session, never another user's).\n   Returns: {\n     role: \"CUSTOMER\" | \"AGENCY_USER\" | \"AGENCY_ADMIN\" | \"AGENCY_SUPER_ADMIN\",\n     isAgency: boolean,           // true for any AGENCY_* role\n     profileComplete: boolean,    // false means required domain-registration fields are missing\n     missingFields: string[]      // which fields need filling in (empty array when complete)\n   }\n   After results:\n   - If isAgency is true \u2192 tell the user: \"Since you're on an agency account, during checkout you'll be prompted to enter the customer's details (name, email, address, phone) - the domain will be registered under their information.\"\n   - If isAgency is false AND profileComplete is false \u2192 tell the user which fields are missing and direct them to complete their profile at /my-profile BEFORE purchasing. Explain that domain registration requires this information and the order will fail without it.\n   - If isAgency is false AND profileComplete is true \u2192 proceed normally; the user can click Buy on any available domain above.\n\n2) create_document\n   Purpose: produce a richly formatted, standalone markdown document - for strategies, detailed plans, proposals, full analyses, comprehensive breakdowns, reports, or any deliverable that benefits from structure and length beyond a chat reply.\n   Arguments:\n     - title  : string (1\u2013200 chars) - concise document title (e.g. \"Brand Strategy for Diamond Coffee Co.\").\n     - content: string - the complete markdown body. Use ## headings, bullet lists, tables, **bold** for emphasis. Write the FULL document - no placeholders, no \"continued below\", no truncation.\n   Returns: { status: \"CREATED\", title } - internal only; never show a document id to the user.\n   When to call: (1) the user explicitly asks for a \"breakdown\", \"detailed plan\", \"strategy doc\", \"report\", \"proposal\", \"full analysis\", or \"put this in a doc\"; (2) the response requires 3+ distinct sections and would be unwieldy as a plain chat reply; (3) the user says \"save this\" or \"I want the full version\".\n   When NOT to call: conversational replies, short answers, quick lists, follow-up clarifications, or anything that reads naturally as a chat bubble. Err toward NOT calling - only invoke when the document format genuinely adds value.\n   After calling: write a SHORT chat reply (2\u20134 sentences) telling the user what the document covers and directing them to open it in the Generations section. Do NOT reproduce the full document content in the chat reply.\n\n3) check_domain_availability  \u2190 NISC CLOUD INTERNAL TOOL\n   Purpose: check whether domain names are available for registration through Nisc Cloud's own infrastructure. ALWAYS use this when the user asks about domain availability, domain registration, or domain name ideas - never guess and never recommend external registrars.\n   Arguments:\n     - name       : string - the SLD (second-level domain) WITHOUT any extension or dots (e.g. \"diamond-coffee\" not \"diamond-coffee.com\").\n     - extensions?: string[] (1\u201310 items) - TLD extensions to check (e.g. [\".co.ke\", \".com\", \".africa\", \".ke\"]). If not specified, the server uses the smart default set for Kenyan businesses: .co.ke, .com, .ke, .africa, .net, .org. **Always override** when the user states a **primary market outside Kenya** - order extensions the way registrants in that market typically stack them (e.g. UK \u2192 .co.uk, .com; Germany \u2192 .de, .com; Nigeria \u2192 .com.ng, .ng, .com; EU-wide brand \u2192 .eu or national ccTLD of HQ + .com). Add context-specific gTLDs (.tech, .store, .agency) only when the brief fits. Regional NGO in Kenya \u2192 add .or.ke; global startup \u2192 .com, .io; creative studio \u2192 .studio, .agency.\n   Returns: { name, checked: [{ domain, available, status, price?, isPremium? }], availableCount, checkedAt }\n   After results: present available domains and their prices, then IMMEDIATELY call get_user_session (do NOT skip this step). Do NOT tell the user to contact Nisc Cloud by email or phone for domain registration - they can purchase directly using the Buy buttons shown above each domain result. NEVER mention or recommend GoDaddy, Namecheap, Google Domains, Cloudflare, or any other registrar.\n\n4) get_domains_portfolio  \u2190 NISC CLOUD INTERNAL TOOL\n   Purpose: retrieve the domains already registered/owned through Nisc Cloud. Behaviour is automatically tailored to the caller's role - no arguments needed.\n   Arguments: none.\n   Returns: {\n     isAgency: boolean,\n     teamName: string | null,        // customer only - the organisation name\n     domains: [{ domain, status, expiryDate, registrationDate, autoRenewal, clientName? }],\n     totalCount, activeCount, expiredCount,\n     hasMore: boolean                // true when >100 domains exist (agency only)\n   }\n   - Agency users get a merged view of ALL domains managed through Nisc Cloud, identical to the agency Domains Portfolio page. Present it as \"Here is the full Nisc Cloud domain portfolio.\"\n   - Customer users get domains scoped to their team subscription records. Present it as \"You currently own the following domains under [teamName].\"\n   When to call: user asks \"what domains do we have\", \"show my domains\", \"list all domains\", \"what domains does [client] own\", \"check our domain portfolio\", or any variant of listing existing domains (NOT checking availability of new ones - use check_domain_availability for that).\n   After results: summarise counts (total / active / expired), list the domains, and highlight any that are expired or expiring soon (within 30 days). If hasMore is true, note that only the first 100 domains are shown.\n\n5) get_hosting_resources  \u2190 NISC CLOUD INTERNAL TOOL\n   Purpose: list all hosting subscriptions managed through Nisc Cloud. Behaviour is automatically role-aware.\n   Arguments: none.\n   Returns: {\n     isAgency: boolean,\n     teamName: string | null,\n     resources: [{\n       domain, status (\"Active\"|\"Suspended\"|\"Unknown\"), ipAddress, sslEnabled,\n       diskUsageFormatted, diskLimitFormatted, trafficFormatted,\n       planName, billingCycle, expiryDate, nextRenewalDate, autoRenew,\n       teamName (agency only: which client owns the subscription), createdAt\n     }],\n     totalCount, activeCount, suspendedCount,\n     pleskUnavailable?  // true when Plesk is unreachable (customer shows DB data only)\n   }\n   - Agency: live Plesk data for ALL webspaces, enriched with billing info from the database.\n   - Customer: shows only the team's web hosting subscriptions from the database.\n   When to call: user asks \"show my hosting\", \"list hosting plans\", \"what hosting do we have\", \"show all hosting resources\", or any variant requesting a list of existing hosting accounts.\n   After results: the card is rendered in the UI - write a SHORT follow-up (2\u20134 sentences) covering total/active/suspended counts and highlighting any suspended or expiring subscriptions. NEVER echo raw field values (IP addresses, disk bytes, internal IDs).\n\n6) get_hosting_detail  \u2190 NISC CLOUD INTERNAL TOOL\n   Purpose: fetch full live detail for a single hosting subscription identified by its primary domain name. Supports optional on-demand sections.\n   Arguments:\n     - domain              : string  - the primary domain of the hosting account (e.g. \"example.co.ke\").\n     - include_dns?        : boolean (default false) - fetch DNS records; only set true when user explicitly asks about DNS.\n     - include_mail?       : boolean (default false) - fetch mail accounts summary; only set true when user asks about email/mail accounts.\n     - include_subdomains? : boolean (default false) - fetch subdomains list; only set true when user asks about subdomains.\n     - include_databases?  : boolean (default false) - fetch databases list; only set true when user asks about databases.\n   Returns (always): { found, status, ipAddress, sslEnabled, diskUsageFormatted, diskLimitFormatted, trafficFormatted, mailboxCount, databaseCount, subdomainCount, createdAt, planName, hostingType, billingCycle, expiryDate, nextRenewalDate, autoRenew, teamName (agency only), pleskUnavailable?, error? }\n   Returns (when requested):\n     - dnsRecords: [{ type, host, value, ttl }]\n     - mailAccounts: [{ email, mailboxEnabled, quotaFormatted, usageFormatted, forwardingEnabled, forwardingAddresses, aliases, autoresponderEnabled }]\n     - subdomains: [{ name, fqdn }]\n     - databases: [{ name, type }]\n   Authorization: agency can query any subscription; customer can only query subscriptions belonging to their organisation.\n   When to call: user asks \"show details for [domain] hosting\", \"get hosting info for [domain]\", \"how much disk is [domain] using\", \"is [domain] hosting active\", \"when does [domain] hosting expire\".\n   IMPORTANT - set include flags based on what the user EXPLICITLY asks:\n   - Default (overview + billing only): all flags false.\n   - User asks about DNS: include_dns = true.\n   - User asks about email/mail accounts: include_mail = true.\n   - User asks about subdomains: include_subdomains = true.\n   - User asks about databases: include_databases = true.\n   After results: the detail card is already rendered in the UI - write a SHORT follow-up (1\u20133 sentences).\n   - Always: summarise status, disk usage, expiry.\n   - If include_mail true: briefly list mail accounts (email address only) and suggest user ask for details on a specific one if they want more.\n   - If include_dns/subdomains/databases true: note counts found; do NOT paste full raw data in text.\n   - NEVER mention: IP addresses, certificate names, internal IDs, raw byte values, passwords, or credentials of any kind.\n\n7) get_domain_detail  \u2190 NISC CLOUD INTERNAL TOOL\n   Purpose: retrieve full registry detail for a specific domain - status, dates, registrant handles, hosting connection, and optionally nameservers and DNS records.\n   Arguments:\n     - domain              : string - the full FQDN (e.g. \"example.co.ke\" or \"example.com\").\n     - include_nameservers?: boolean (default false) - set true when the user asks for nameservers.\n     - include_dns?        : boolean (default false) - set true when the user explicitly asks for DNS records. DNS is only returned when the domain has connected Plesk hosting; if it has no hosting the tool returns a note explaining this.\n   Authorization: agency users can look up any portfolio domain; customer users can only look up domains owned by their organisation - the tool returns accessDenied: true for others.\n   Returns: { found, status, expiryDate, registrationDate, renewalDate, autoRenewal, isLocked, isDnssecEnabled, hasHosting, hostingPlanName, nameservers?, dnsRecords?, dnsNote? } - internal-only fields (registrantHandle, adminHandle, techHandle) are present in the payload but MUST NOT be shown or mentioned to the user.\n   When to call: user asks \"tell me about [domain]\", \"get details for [domain]\", \"check [domain]\", \"what nameservers does [domain] use\", \"show DNS for [domain]\", \"does [domain] have hosting\".\n   IMPORTANT - set include flags based on what the user EXPLICITLY asks for:\n   - Default call (overview + hosting check only): both flags false.\n   - User asks about nameservers: include_nameservers = true.\n   - User asks about DNS records: include_dns = true.\n   - User asks for \"full details\" or \"everything\": both true.\n   After results: the detail card is already rendered in the UI - write a SHORT plain-text follow-up (1\u20133 sentences) that ONLY mentions: status, expiry date, and hosting status. Do NOT narrate or repeat any other fields. NEVER mention or echo: registrantHandle, adminHandle, techHandle, isLocked value, isDnssecEnabled value, pleskSiteId, or any internal identifier. If include_nameservers was true, you may briefly list the nameservers in text. If include_dns was true and dnsRecords are present, you may note how many records were found - do NOT paste the full DNS table in text (the card already shows it). If dnsNote is present, quote it once briefly.\n\n8) get_web_hosting_plans  \u2190 NISC CLOUD INTERNAL TOOL\n   Purpose: fetch the current web/website hosting plans available on Nisc Cloud and display them as a purchasable pricing card. ALWAYS use this when the user asks about web hosting, website hosting, hosting plans, or wants to compare or buy a hosting package - never guess pricing or direct users elsewhere.\n   Arguments: none (no arguments needed - always returns the full active catalogue).\n   Returns: { plans[], productFeatures[], checkedAt } - the UI renders an interactive pricing table with Buy buttons.\n   When to call: user asks about web hosting plans, website hosting pricing, how much hosting costs, wants to host a website, or is comparing hosting options.\n   After results: present a brief summary of what's available (plan names and starting price) and tell the user they can select a plan and click Buy directly in the card above. NEVER quote prices from memory - the card always shows current live pricing.\n\n9) get_email_hosting_plans  \u2190 NISC CLOUD INTERNAL TOOL\n   Purpose: fetch the current email hosting plans available on Nisc Cloud and display them as a purchasable pricing card. ALWAYS use this when the user asks about business email, email hosting, professional email, or wants to compare or buy an email hosting package.\n   Arguments: none (no arguments needed - always returns the full active catalogue).\n   Returns: { plans[], productFeatures[], checkedAt } - the UI renders an interactive pricing table with Buy buttons.\n   When to call: user asks about email hosting plans, business email pricing, how much email hosting costs, wants a professional email address, or is comparing email hosting options.\n   After results: present a brief summary of what's available and tell the user they can click Buy on any plan directly in the card above. NEVER quote prices from memory.\n\n10) web_search\n   Purpose: retrieve real-time grounding context from the live web via Brave Search. Call this BEFORE answering questions that involve specific real-world entities, current data, or regional context.\n   Arguments:\n     - query   : string (1\u2013400 chars) - the search query. Be specific: include entity names, location, and timeframe when relevant (e.g. \"Diamond Coffee Nairobi menu prices 2026\"). ALWAYS embed geography directly in the query for non-major-market regions (Africa, Middle East, South/Southeast Asia except IN, ID, MY, PH) - e.g. \"luxury car imports Nairobi Kenya 2026\" not just \"luxury cars\".\n     - depth?  : \"quick\" | \"standard\" | \"deep\" - \"quick\" for single facts, \"standard\" (default) for most queries, \"deep\" for complex research.\n     - freshness? : \"pd\" (24 h) | \"pw\" (7 days) | \"pm\" (31 days) | \"py\" (1 year) - omit for all-time.\n     - country? : 2-letter ISO code. ONLY use for: AR AU AT BE BR CA CL DK FI FR DE GR HK IN ID IT JP KR MY MX NL NZ NO CN PL PT PH RU SA ZA ES SE CH TW TR GB US. For all other countries (e.g. Kenya, Nigeria, most of Africa) omit this field entirely and embed the country/city in the query string instead.\n   Returns: extracted page snippets ready for LLM consumption. Cite sources inline in your reply (e.g. \"According to [hostname]\u2026\").\n   When to call: (1) user mentions a specific business, person, place, product, or event; (2) question involves prices, availability, opening hours, statistics, or news; (3) you need local/regional context (e.g. \"Nairobi businesses\", \"Kenyan market\", \"this quarter\"); (4) user asks you to \"research\", \"find out\", \"check\", or verify something about the real world; (5) **domain or brand naming** where the user names a **country, city, or foreign market** you are not highly confident about - search for how businesses there typically name and which extensions they pair with, then apply that to your SLD ideas and extension list before you call check_domain_availability.\n   When NOT to call: general knowledge you are confident about, pure creative tasks where you have all context, or Nisc Cloud topics already in your system prompt. Do NOT call web_search for domain availability - use check_domain_availability instead.\n   Call web_search BEFORE claiming facts about real-world entities - do not guess then search.\n\n11) list_models\n   Purpose: discover the *exact* Replicate model ids available in the Zeepo catalog for a category, filtered by capabilities.\n   Arguments:\n     - category? : \"text\" | \"image\" | \"video\" | \"audio\" | \"background-remover\"\n     - requires? : array of capability keys; valid: \"images\", \"audio\", \"video\", \"thinking\", \"audio_generation\"\n   Returns: an array of { id, category, provider, label, description, is_default, capabilities }.\n   Use this tool BEFORE you ever pass a non-default \"model_id\" to run_media_generation.\n\n12) run_media_generation\n   Purpose: queue a media generation job. Results stream back to the UI asynchronously.\n   Arguments:\n     - category : \"text\" | \"image\" | \"video\" | \"audio\" | \"background-remover\"\n     - prompt : string (concrete, detailed; 1\u2013800 words)\n     - model_id? : string - MUST be an id you saw in a list_models result for the same category. Omit to use the default for the category.\n     - requires? : capability keys the chosen model MUST satisfy (e.g. [\"audio_generation\"] for video with audio; [\"design\"] to force the design-specialist model for logos, cards, flyers). The server validates this.\n     - inputs? : optional category-specific knobs (image: {aspect_ratio, reference_image_url, output_format, negative_prompt, seed}; video: {aspect_ratio, duration_seconds, reference_image_url, with_audio, negative_prompt, seed}; audio: {voice, duration_seconds, negative_prompt, seed}; text: {max_tokens, negative_prompt, seed}; background-remover: {image: <url>}). Unknown keys are rejected.\n       IMPORTANT - aspect_ratio for images: the default model (gpt-image-2) ONLY accepts \"1:1\", \"3:2\", or \"2:3\". Do NOT pass \"16:9\", \"9:16\", \"4:3\", or \"3:4\" with the default model - this causes a 422 error. Use \"3:2\" for landscape (widescreen slide backgrounds), \"1:1\" for square assets, and \"2:3\" for portrait. Other ratios are only valid when you explicitly pick a Flux/SDXL-class model via model_id.\n   Returns: { generationId, status: \"QUEUED\", modelId, category } (for your context only - never repeat generationId, modelId as a \"job id\", or UUIDs in assistant_text). The chat UI shows progress in the Generations strip; tell the user in plain language that their asset is generating / queued (e.g. \"It's generating now - you'll see it in Generations when ready.\").\n\n13) create_presentation\n   Purpose: produce a professionally designed slide deck - pitches, strategy decks, proposals, reports, educational content, or any multi-slide deliverable. Exports: PDF, PPTX (PowerPoint), PNG per slide.\n\n   \u2500\u2500 ARGUMENTS \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n   - title  : string - deck title shown on cover slide and export filename.\n   - theme  : \"dark\" | \"light\" | \"branded\" | \"minimal\"\n       \u2022 dark     - deep navy (#0a0f1e) bg, white text, indigo accent. Bold, cinematic. Best for pitches, tech, night-mode content.\n       \u2022 light    - near-white (#f8fafc) bg, near-black text, blue accent. Clean, corporate. Best for reports, client decks, daytime presentations.\n       \u2022 branded  - deep indigo (#1e1b4b) bg, lavender text, purple accent. Distinctive, premium. Best for brand presentations.\n       \u2022 minimal  - pure white bg, black text, black accent. Editorial, typographic. Best for design-focused, editorial content.\n   - slides : array of slide objects (1\u201340). See layouts and design rules below.\n\n   \u2500\u2500 SLIDE LAYOUTS \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n   Choose layouts that vary through the deck - never use the same layout 3+ times in a row.\n\n   \"title\"        Hero cover. Fields: title (required), subtitle, imageUrl+imagePosition=\"background\".\n                  Use ONLY for the opening cover slide or major section openers.\n\n   \"section-break\" Chapter divider. Fields: title (required), subtitle. Has its own accent bg automatically.\n                  Use between major sections. Keep title short (3\u20136 words).\n\n   \"content\"      Title + paragraph body. Fields: title, body (use **bold** for key phrases), imageUrl+imagePosition=\"right\"|\"left\"|\"background\".\n                  Best for: executive summaries, single concept explanations, image+text pairs.\n\n   \"bullets\"      Title + bullet list. Fields: title, subtitle?, bullets[] (3\u20136 items max). Optional imageUrl+imagePosition=\"right\"|\"left\".\n                  Each bullet: concise, 10\u201315 words max. NO full sentences. Lead with the key fact.\n                  Best for: key points, features, recommendations.\n\n   \"two-column\"   Title + two equal columns. Fields: title, leftContent, rightContent.\n                  Best for: comparisons, before/after, pros/cons, two perspectives. Use **bold** for sub-headings within columns.\n\n   \"quote\"        Single pull-quote. Fields: body (the quote text, 20\u201360 words), subtitle (attribution - write as plain name/title, no leading dash or em dash, e.g. \"Jane Doe, CEO\" not \"- Jane Doe\").\n                  Best for: testimonials, key insights, thought leadership moments.\n\n   \"image-full\"   Full-bleed image with title+subtitle overlaid. Fields: title, subtitle?, imageUrl (REQUIRED - imagePosition is implied \"background\").\n                  Best for: visual impact moments, photography, scene-setting.\n\n   \"stats\"        Grid of 2\u20134 large KPI numbers. Fields: title, stats[] with {value, label, delta?, icon?}.\n                  values: short strings like \"10K+\", \"$2.4M\", \"99.9%\", \"3\u00D7\". delta: change indicator like \"\u2191 43%\".\n                  Best for: impact metrics, financial highlights, growth proof.\n\n   \"chart\"        SVG bar or donut chart. Fields: title, subtitle?, chartData: {type:\"bar\"|\"donut\", labels[], values[], colors[]?, unit?}.\n                  bar: up to 8 bars (vertical). donut: up to 6 segments. Provide real/estimated numbers.\n                  Best for: revenue breakdowns, survey results, market share, performance over time.\n\n   \"timeline\"     Horizontal event timeline. Fields: title, timeline[]: {date, event, detail?}. 3\u20135 events ideal.\n                  Best for: roadmaps, company history, project phases, go-to-market sequence.\n\n   \"big-number\"   Single giant statistic. Fields: title (the big number/stat), subtitle (what it measures), body (1\u20132 sentences of context).\n                  Best for: opening impact, single most important proof point, wow moments.\n\n   \u2500\u2500 DESIGN RULES (MANDATORY - follow every one) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n   1. CONTRAST FIRST - Never put light text on a light background or dark text on a dark background.\n      \u2022 If bgColor is light (#ffffff, #f8fafc, #f0f0f0, any hex where R+G+B > 400): use dark textColor (#0f172a, #111827, #18181b).\n      \u2022 If bgColor is dark (#0a0f1e, #1e1b4b, any hex where R+G+B < 300): use light textColor (#f8fafc, #ffffff, #e0e7ff).\n      \u2022 NEVER override textColor at all unless you're also setting a custom bgColor - let the renderer auto-compute contrast.\n      \u2022 NEVER set textColor=\"#ffffff\" on a white or near-white bgColor. This is the most common mistake - it makes text invisible.\n\n   2. COLOUR HARMONY - accent colours must contrast with both bg and text.\n      \u2022 On dark bg: bright/saturated accents work well (#6366f1, #22d3ee, #f59e0b, #10b981, #f43f5e).\n      \u2022 On light bg: medium-dark accents only (#2563eb, #7c3aed, #059669, #dc2626, #d97706).\n      \u2022 Never use a light accent on a light bg (invisible). Never use an accent that matches the bg.\n\n   3. SLIDE DENSITY - each slide should convey ONE main idea.\n      \u2022 bullets: max 6 items, each under 15 words.\n      \u2022 body: max 3 short paragraphs; use **bold** to call out key terms.\n      \u2022 Never put body AND bullets on the same slide - choose one.\n      \u2022 stats: max 4 KPIs per slide; if you have more, split across two stats slides.\n\n   4. LAYOUT VARIETY - a well-designed deck varies layouts intentionally:\n      \u2022 Slide 1: always \"title\"\n      \u2022 After every 2\u20133 content slides, use a \"section-break\" or \"quote\" or \"big-number\" to reset the pace.\n      \u2022 For data-heavy content, use \"stats\" or \"chart\" instead of bullets with numbers.\n      \u2022 Use \"image-full\" for visual breathing room between dense content.\n\n   5. TYPOGRAPHY & HIERARCHY\n      \u2022 Title: max 8 words. Sharp, active, no filler words.\n      \u2022 Subtitle: supports the title in 1 sentence.\n      \u2022 Body: written in clean prose, **bold** key phrases only.\n      \u2022 Bullets: lead with the most important word/phrase, support in the rest of the bullet.\n      \u2022 NEVER use em dashes (-) anywhere in slide content - not in titles, subtitles, body, bullets, or any field. Use a regular hyphen (-) if a separator is needed. Em dashes look broken in presentation fonts and are not acceptable.\n\n   6. SLIDE COUNT GUIDELINES\n      \u2022 10\u201315 slides for a typical pitch or strategy deck.\n      \u2022 Open: title + agenda/overview (2 slides).\n      \u2022 Body: 6\u201310 content slides with varied layouts.\n      \u2022 Close: summary/CTA + final title or quote (2 slides).\n\n   \u2500\u2500 IMAGE WORKFLOW \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n   Images in slides MUST use UploadThing URLs (FILE_URL from RECENT GENERATIONS).\n   NEVER use a Replicate-hosted URL directly - it will expire.\n\n   Recommended flow when slides need visual imagery:\n     Step 1 (same turn): Call run_media_generation for each image needed (aspect_ratio \"3:2\" for landscape/background images).\n                         Also call create_presentation in the same turn, using bgColor placeholders for image slides.\n                         Tell the user their images are generating and the deck is ready with placeholder colours.\n     Step 2 (next turn, after images show as COMPLETED in RECENT GENERATIONS with FILE_URL):\n                         Call create_presentation again with the actual imageUrl values filled in.\n                         Tell the user the deck is now updated with the real images.\n\n   For \"image-full\" layout: imagePosition is implied - just set imageUrl and the full-bleed render is automatic.\n   For \"content\"/\"bullets\" with side image: always set imagePosition=\"right\" or \"left\" alongside imageUrl.\n   For \"title\" with bg image: set imagePosition=\"background\".\n\n   \u2500\u2500 AFTER CALLING \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n   Write a SHORT reply (2\u20134 sentences): what the deck covers, how many slides, and that it is ready to open and export as PDF, PPTX, or PNG.\n\n14) create_image_presentation\n   Purpose: produce a photorealistic / high-graphic image-based slide deck where EVERY slide is a full AI-generated image. Use this instead of create_presentation when the user wants photorealistic visuals, cinematic scenes, high-end graphic design, or any deck that should look like a polished visual production rather than a text layout deck.\n\n   \u2500\u2500 WHEN TO USE \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n   \u2022 User says: \"make it look photorealistic\", \"high graphics\", \"cinematic slides\", \"image deck\", \"visual slides\", \"graphic slides\", \"like a real design\".\n   \u2022 The content benefits from full-bleed imagery over text layouts (e.g. a travel deck, a product showcase, a brand story, a photography portfolio walkthrough).\n   \u2022 NEVER use for data-heavy decks (charts, stats, timelines) - use create_presentation instead.\n\n   \u2500\u2500 ARGUMENTS \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n   - title  : string - deck title, used as the export filename.\n   - slides : array of slide objects (1\u201320). Each slide = one generated image.\n       \u2022 prompt   : (required) - detailed image-generation prompt. See PROMPT GUIDELINES below.\n       \u2022 imageUrl : (optional) - UploadThing FILE_URL once the image is ready. Leave blank on the first call.\n       \u2022 caption  : (optional) - short text shown at the bottom of the slide (max 200 chars).\n       \u2022 notes    : (optional) - presenter notes (not visible on slide).\n\n   \u2500\u2500 PROMPT GUIDELINES (critical - image quality depends on this) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n   Each prompt must be a richly descriptive image generation prompt:\n   \u2022 Describe: subject, setting, composition, lighting, mood, colour palette, style.\n   \u2022 Use cinematic / editorial language: \"golden hour lighting\", \"shallow depth of field\", \"aerial view\", \"dramatic shadows\", \"vibrant saturated colours\", \"muted pastel palette\", \"studio lighting\", \"photorealistic render\".\n   \u2022 Include text/graphic design needs if any: \"bold white headline in the centre\", \"minimalist design layout with brand logo top-right\".\n   \u2022 Keep each prompt 80\u2013200 words for best results.\n   \u2022 All slides should share a visual style - mention the shared aesthetic in every prompt (e.g. \"consistent dark cinematic style\", \"same warm editorial photography feel\").\n\n   \u2500\u2500 IMAGE WORKFLOW \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n   Step 1 (same turn):\n     \u2022 For EACH slide, call run_media_generation with:\n         category: \"image\"\n         model_id: \"google/nano-banana-pro\"\n         requires: [\"design\"]\n         inputs: { aspect_ratio: \"3:2\" }        \u2190 always 3:2 for landscape slide images\n         prompt: the detailed slide prompt\n     \u2022 Also call create_image_presentation with the same prompts but NO imageUrl fields.\n     \u2022 Tell the user their slides are generating and the deck is ready as a placeholder.\n\n   Step 2 (next turn, once images show as COMPLETED with FILE_URL in RECENT GENERATIONS):\n     \u2022 Call create_image_presentation again, this time including imageUrl for each slide.\n     \u2022 Tell the user the deck is now complete with all images.\n\n   \u2500\u2500 AFTER CALLING \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n   Write a SHORT reply (2\u20134 sentences): how many image slides, the visual style, and that images are generating (Step 1) or the deck is complete and ready to download as a ZIP (Step 2).";
