# KENIC EPP Integration for Local TLDs (.ke)

This document describes how nPanel will integrate with KENIC (Kenya Network Information Centre) to offer .ke and other local TLDs via the Extensible Provisioning Protocol (EPP). It serves as the technical specification and implementation guide.

---

## 1. Overview

### 1.1 Context

- **Current state:** nPanel provisions domains via **OpenProvider**, which exposes a REST API. All domain operations (check, register, transfer, renew) go through `packages/api` OpenProvider client and routers.
- **Goal:** Add support for **KENIC**-managed TLDs (e.g. `.ke`) using their **EPP** interface, so customers can register and manage .ke domains within nPanel.
- **Protocol:** EPP is a stateful, XML-based protocol over TCP with TLS (RFCs 5730–5734, RFC 5910 for DNSSEC). It is **not** REST; it requires an EPP client that connects, logs in, and sends/receives XML commands.

### 1.2 Scope

- Implement an EPP client that connects to KENIC’s EPP server.
- Implement domain operations: check availability, create (register), transfer, renew, update (contacts, nameservers, lock), and optionally DNSSEC.
- Route KENIC TLDs to the KENIC/EPP backend while leaving other TLDs on OpenProvider. Supported KENIC TLDs: **.ke, .co.ke, .or.ke, .ne.ke, .me.ke, .mobi.ke, .info.ke, .sc.ke, .ac.ke** (see §1.3). **.go.ke is not offered** (government TLD; including it in EPP domain check causes 2400).
- Store KENIC credentials and endpoint configuration securely (environment variables); no credentials in this document or in code.

### 1.3 Supported KENIC TLDs

All TLDs provided by KENIC are supported. The canonical list is in code (`packages/api/src/lib/epp/kenic-tlds.ts`):

| TLD | Example |
|-----|---------|
| .ke | example.ke |
| .co.ke | example.co.ke |
| .or.ke | example.or.ke |
| .ne.ke | example.ne.ke |
| .me.ke | example.me.ke |
| .mobi.ke | example.mobi.ke |
| .info.ke | example.info.ke |
| .sc.ke | example.sc.ke |
| .ac.ke | example.ac.ke |

**.go.ke is not supported:** including a .go.ke domain in an EPP domain:check causes the server to return result code 2400 (Command failed). It is excluded from the supported list.

Domain check accepts only domains under these TLDs; use `kenic.tlds.list` to retrieve the list programmatically.

---

## 2. KENIC Technical Details (From Registry)

The following parameters are provided by KENIC. **Credentials must never be committed to the repo;** they are to be stored in environment variables or a secrets manager.

### 2.1 EPP Endpoint

| Item | Value |
|------|--------|
| **Hostname** | `registry.kenic.or.ke` |
| **Port** | `700` |
| **TLS** | Required. Connections must use TLS on this port. |

**TLS certificate (verified in practice):** The server at `registry.kenic.or.ke:700` presents a certificate whose Subject Alternative Name is **`epp.coccaregistry.org`**, not `registry.kenic.or.ke`. This is typical of shared registry platforms (KENIC uses CoCC infrastructure). Node.js TLS verification will therefore fail with: *"Hostname/IP does not match certificate's altnames"*. **Fix:** set the environment variable **`KENIC_EPP_TLS_SERVERNAME=epp.coccaregistry.org`**. The EPP client uses this value for TLS SNI and certificate verification while still connecting to `KENIC_EPP_HOST` (registry.kenic.or.ke). TLS remains secure; we are simply telling the client which hostname to expect on the certificate.

### 2.2 Authentication

| Item | Details |
|------|--------|
| **Method** | Standard EPP `<login>` command with username and password. |
| **Username** | Registrar ID (provided by KENIC; store in env, e.g. `KENIC_EPP_USERNAME`). |
| **Password** | EPP password (provided by KENIC; store in env, e.g. `KENIC_EPP_PASSWORD`). |

**Important:** Do not hardcode the registrar ID or password. Use environment variables (e.g. in production: Cloud Run secrets, GitHub Actions secrets, or your secrets manager).

### 2.3 Client Certificate

- **Mutual TLS:** Not required by KENIC.
- **Server TLS:** Used to authenticate the registry server; EPP login credentials authenticate the client.
- If your security policy later requires client certificates, contact KENIC (support@kenic.or.ke) to discuss options.

### 2.4 Test / Sandbox Environment

- **Current:** Production only. EPP endpoint is `registry.kenic.or.ke:700`.
- **Sandbox:** If you need a separate test environment, KENIC can provide one with a short lead time (e.g. a couple of days). Request via support@kenic.or.ke.

### 2.5 Registry-Specific Behaviour

- KENIC’s implementation follows standard EPP RFCs for **domains**, **hosts**, and **contacts**.
- No custom EPP extensions are specified; implementation can follow RFC 5730 (base), RFC 5731 (domain), RFC 5732 (host), RFC 5733 (contact), and RFC 5910 (DNSSEC) as needed.

### 2.6 Operational Limits

- Keep a **reasonable number of concurrent EPP connections** per registrar.
- Avoid **very high command rates** so the service remains stable for all registrars.
- **Bots scanning the registry** are permanently blacklisted by default.
- If you expect **high volume**, inform KENIC (support@kenic.or.ke) with expected usage so they can confirm suitable limits.

### 2.7 Technical Contact and Resources

| Resource | Value |
|----------|--------|
| **Web portal** | https://registry.kenic.or.ke |
| **Portal login** | Same registrar ID and password as EPP (store in env; do not commit). |
| **Technical support** | support@kenic.or.ke |

Use the web portal for account management and support email for integration questions.

### 2.8 Environment variables reference

All KENIC EPP configuration is driven by environment variables. Store credentials in a secrets manager in production; never commit them.

| Variable | Default | Required | Description |
|----------|---------|----------|-------------|
| `KENIC_EPP_HOST` | `registry.kenic.or.ke` | No | EPP server hostname (TCP connect). |
| `KENIC_EPP_PORT` | `700` | No | EPP server port (TLS). |
| `KENIC_EPP_TIMEOUT_MS` | `30000` | No | Socket and operation timeout in milliseconds. |
| `KENIC_EPP_TLS_SERVERNAME` | *(none)* | **Yes in practice** | Hostname used for TLS SNI and certificate verification. Set to `epp.coccaregistry.org` because the server presents a cert for that name. Omit only if the server ever presents a cert for `registry.kenic.or.ke`. |
| `KENIC_EPP_USERNAME` | *(none)* | Yes for login/commands | Registrar ID (EPP &lt;login&gt; clID). |
| `KENIC_EPP_PASSWORD` | *(none)* | Yes for login/commands | EPP password (EPP &lt;login&gt; pw). |

**Example (minimal for greeting only):**

```env
KENIC_EPP_TLS_SERVERNAME=epp.coccaregistry.org
```

**Example (full, for login and domain operations):**

```env
KENIC_EPP_HOST=registry.kenic.or.ke
KENIC_EPP_PORT=700
KENIC_EPP_TIMEOUT_MS=30000
KENIC_EPP_TLS_SERVERNAME=epp.coccaregistry.org
KENIC_EPP_USERNAME=YourRegistrarId
KENIC_EPP_PASSWORD=YourEppPassword
```

### 2.9 Actual KENIC greeting and capabilities (from live response)

The following was captured from a live connection to `registry.kenic.or.ke:700` (with `KENIC_EPP_TLS_SERVERNAME=epp.coccaregistry.org`). Use this to build the `<login>` command’s `<svcs>` and for any extension elements.

**Server identity**

| Field | Value |
|-------|--------|
| **svID** | `registry.kenic.or.ke` |
| **svDate** | e.g. `2026-02-18T10:16:18.697Z` (server time at greeting) |

**Object types (objURI)** — Declare these in `<login><svcs>` so the server knows we support them:

| objURI | Purpose |
|--------|---------|
| `urn:ietf:params:xml:ns:contact-1.0` | Contact objects (registrant, admin, tech). |
| `urn:ietf:params:xml:ns:domain-1.0` | Domain objects (.ke registration, renew, transfer, etc.). |
| `urn:ietf:params:xml:ns:host-1.0` | Host objects (nameservers). |

**Service extensions (extURI)** — Declare in `<login><svcs><svcExtension>` if we use them:

| extURI | Purpose |
|--------|---------|
| `urn:ietf:params:xml:ns:rgp-1.0` | Redemption Grace Period. |
| `urn:ietf:params:xml:ns:secDNS-1.1` | DNSSEC (RFC 5910). |
| `urn:ietf:params:xml:ns:epp:fee-1.0` | Fee/pricing extension. |
| `https://finance.coccaregistry.org` | Registry-specific finance/pricing. |

**Greeting XML (raw, condensed)** — Root is `<epp>` with `<greeting>`; no `<response>` (greeting is not a command response):

```xml
<?xml version="1.0" encoding="UTF-8"?>
<epp xmlns="urn:ietf:params:xml:ns:epp-1.0" ...>
  <greeting>
    <svID>registry.kenic.or.ke</svID>
    <svDate>2026-02-18T10:16:18.697Z</svDate>
    <svcMenu>
      <version>1.0</version>
      <lang>en</lang>
      <objURI>urn:ietf:params:xml:ns:contact-1.0</objURI>
      <objURI>urn:ietf:params:xml:ns:domain-1.0</objURI>
      <objURI>urn:ietf:params:xml:ns:host-1.0</objURI>
      <svcExtension>
        <extURI>urn:ietf:params:xml:ns:rgp-1.0</extURI>
        <extURI>urn:ietf:params:xml:ns:secDNS-1.1</extURI>
        <extURI>urn:ietf:params:xml:ns:epp:fee-1.0</extURI>
        <extURI>https://finance.coccaregistry.org</extURI>
      </svcExtension>
    </svcMenu>
    <dcp>...</dcp>
  </greeting>
</epp>
```

**Parsed structure (fast-xml-parser with `ignoreAttributes: false`)** — Useful for code that walks the greeting:

- `parsed.epp.greeting.svID` — string
- `parsed.epp.greeting.svDate` — string (ISO date)
- `parsed.epp.greeting.svcMenu.version` — number (1)
- `parsed.epp.greeting.svcMenu.lang` — string (`"en"`)
- `parsed.epp.greeting.svcMenu.objURI` — array of three strings (contact, domain, host URIs)
- `parsed.epp.greeting.svcMenu.svcExtension.extURI` — array of four strings (extension URIs)

**Implications for implementation**

- **Login:** Send `<login>` with `<svcs>` containing the three objURIs and, if needed, `<svcExtension>` with the four extURIs so the server enables domain/contact/host and extensions.
- **Domain operations:** Standard EPP domain, contact, and host commands are supported; no custom object namespaces were observed.
- **Pricing:** The fee extension and `https://finance.coccaregistry.org` can be used later to retrieve or display .ke pricing if the registry supports it in EPP responses.

**Logo and branding (not in EPP):** EPP does not provide TLD logos, registry branding, or marketing assets. For things like a .ke logo or partner badge, use app-level config (e.g. a static URL or bundled asset per TLD) or the registry’s public website/portal. The KENIC portal (https://registry.kenic.or.ke) may offer brand guidelines or assets; integrate those in the UI layer, not via EPP.

---

## 3. Architecture

### 3.1 Registrar Routing

- **OpenProvider (existing):** Used for TLDs that OpenProvider supports (e.g. .com, .net, many ccTLDs). Uses REST API in `packages/api/src/lib/openprovider-client.ts` and `packages/api/src/routers/openprovider/`.
- **KENIC (new):** Used for KENIC TLDs (e.g. `.ke`). Uses EPP client and a dedicated router/service layer.

Routing rule:

- If the TLD is in a configured list of “KENIC TLDs” (e.g. `['ke']`), use the KENIC EPP backend.
- Otherwise, use OpenProvider (existing behaviour).

The list is maintained in `packages/api/src/lib/epp/kenic-tlds.ts`; domain check validates that all requested domains are under a KENIC TLD. Update that file if KENIC adds TLDs.

### 3.2 High-Level Flow

1. **Domain check / register / transfer / renew request** (from frontend or internal order flow).
2. **Resolve TLD** from the domain name (e.g. `example.ke` → `ke`).
3. **Choose backend:** KENIC TLD → EPP client; else → OpenProvider client.
4. **Call the chosen backend** and normalize the response into a common shape where possible (e.g. “available”/“registered”, success/error, dates, auth code).
5. **Persist domain records** in the existing DB; for KENIC domains, store a “registrar” or “provider” field (e.g. `KENIC`) and an external identifier (EPP domain id or name), not only `openProviderId`.

### 3.3 Data Model Considerations

- Current domain model uses `openProviderId` (OpenProvider-centric).
- For KENIC:
  - Add a way to distinguish **registrar** (e.g. `OPENPROVIDER` | `KENIC`).
  - For KENIC domains, store an **external id** (e.g. EPP domain name or id) and optionally an EPP **auth code** for transfers.
- Options:
  - **Option A:** Add `registrar: Enum('OPENPROVIDER','KENIC')` and `externalId` (string). Keep `openProviderId` nullable and use it only for OpenProvider; for KENIC use `externalId`.
  - **Option B:** Generic `provider: string`, `providerId: string` and phase out registrar-specific columns later.

Recommendation: Option A for minimal change and clear semantics.

---

## 4. EPP Protocol Summary

### 4.1 Transport

- **TCP** to `registry.kenic.or.ke:700`.
- **TLS** on the same port (e.g. Node.js `tls.connect(700, host, options)`).
- One **long-lived connection** per process or a small connection pool; reuse for multiple EPP commands where the spec allows (session keep-alive with `<hello>`/greeting and periodic polls if required).

### 4.2 Session Flow

1. **Connect** and perform TLS handshake.
2. **Receive greeting** (server sends XML greeting with capabilities).
3. **Send `<login>`** with client ID (username), password, and optionally `newPW`, `options`, `svcs`, `lang`.
4. **Receive `<response>`** with result code (1000 = success).
5. **Send domain/contact/host commands** as needed (check, create, info, update, transfer, renew, etc.).
6. **Send `<logout>`** when done or to release the session.

Each request is an EPP XML **command**; each response is an EPP XML **response** with a result code and optional extension data.

### 4.3 Key EPP Commands (Domain)

- **domain:check** — Check availability of one or more domain names.
- **domain:create** — Register a domain (with contacts, nameservers, period).
- **domain:info** — Retrieve domain details (required for updates/renew).
- **domain:update** — Update status (lock/unlock), contacts, nameservers, etc.
- **domain:renew** — Extend registration period.
- **domain:transfer** — Transfer in (with auth code), approve, cancel, etc.

Contacts and hosts (nameservers) are often created/updated with **contact:create**, **contact:update**, **host:create**, **host:info**, etc., then referenced in **domain:create** / **domain:update** by id.

### 4.4 Result Codes (RFC 5730)

- `1000` — Command completed successfully.
- `1001` — Command completed successfully; action pending.
- `2xxx` — Command succeeded (e.g. 2303 = object exists).
- `4xxx` — Client-side error (e.g. 4000 = syntax error, 4200 = auth error).
- `5xxx` — Server-side error.

Implementation must parse result codes and map them to success/failure and user-facing or internal error messages.

---

## 5. Client Design: Aligning with Plesk (XML API)

The existing **Plesk** integration in nPanel uses an **XML-over-HTTP** API (often referred to as Plesk XML API or XML-RPC–style). We should design the KENIC EPP client to follow the same **patterns** where possible: a thin transport layer, XML built in the router/service layer, and the same XML parsing and error-handling approach. The main difference is **transport**: EPP uses **TCP + TLS with length-prefixed frames**, not HTTP.

### 5.1 How Plesk Does It (Reference)

**Transport (`packages/api/src/lib/plesk/xml-client.ts`):**

- **HTTP POST** to `PLESK_XML_ENDPOINT` (e.g. `https://host:8443/enterprise/control/agent.php`).
- **Headers:** `Content-Type: text/xml`, auth via `KEY` header (secret key).
- **Body:** Raw XML string. Payload must contain `<packet>` (Plesk’s root).
- **Response:** Raw XML string. Caller is responsible for parsing.
- **Connection:** `undici` `Agent` with connection pool, 30s timeout, optional HEAD reachability check.
- **Result shape:** `{ xml: string | null, isAuthError, isHostUnreachable }`.

**Routers (e.g. `packages/api/src/routers/plesk/subscriptions.ts`, `dns-create.ts`):**

- **Build XML:** Helper functions that return XML strings, e.g. `buildSubscriptionsGetXml()`, `buildDnsCreateXml(siteId, record)`. Use template literals; escape user input for XML (e.g. `replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')`).
- **Send:** `sendPleskXmlRequest(xmlPayload)`.
- **Parse response:** `fast-xml-parser` — `new XMLParser({ ignoreAttributes: false })` then `parser.parse(xml)`.
- **Error handling:** Inspect parsed structure for errors (e.g. `parsed?.packet?.system?.status === 'error'`, `errcode` / `errtext`). Map to `TRPCError` (e.g. `TOO_MANY_REQUESTS` for rate limit, `UNAUTHORIZED` for auth).
- **Return:** Normalized data or `{ raw, parsed }` for flexibility.

**Dependency:** `fast-xml-parser` (already in `packages/api/package.json`).

### 5.2 Applying the Same Patterns to EPP

| Aspect | Plesk | KENIC EPP |
|--------|--------|-----------|
| **Transport** | HTTP POST, single request/response per call | TCP + TLS, EPP framing (4-byte big-endian length + XML). One or more request/response pairs per session. |
| **Client location** | `packages/api/src/lib/plesk/xml-client.ts` | `packages/api/src/lib/epp/epp-client.ts` (or `kenic-epp-client.ts`) |
| **Config from env** | `PLESK_XML_ENDPOINT`, `PLESK_SECRET_KEY` | `KENIC_EPP_HOST`, `KENIC_EPP_PORT`, `KENIC_EPP_USERNAME`, `KENIC_EPP_PASSWORD` |
| **XML building** | In routers, via functions returning strings | Same: in EPP router or a small `epp-xml.ts` helper (build login, domain:check, domain:create, etc. as strings). Use EPP namespaces and root `<epp>` + `<command>`. |
| **XML parsing** | `fast-xml-parser`, `XMLParser({ ignoreAttributes: false })` | **Reuse the same library and options** for EPP responses. EPP uses attributes (e.g. `result code="1000"`), so `ignoreAttributes: false` is required. |
| **Error handling** | Check `packet.system.status`, `errcode`, `errtext`; map to TRPCError | Check `<result code="...">` and optional `<msg>`, map to TRPCError or typed `EppError` (e.g. 4200 → auth, 2303 → domain exists). |
| **Auth** | Header (KEY) | EPP `<login>` command with username/password from env (sent as first command after connection). |

### 5.3 EPP Transport Layer (Difference from Plesk)

- **Node.js APIs:** Use `tls.connect(port, host, options)` (no `undici` for EPP).
- **Framing:** EPP RFC 5730: each message is a 4-byte big-endian unsigned integer (length of the XML in bytes), followed by the UTF-8 XML. So: `write(Buffer.from([length >> 24, length >> 16, length >> 8, length & 0xff])); write(xmlBuffer);` then read 4 bytes, then read `length` bytes for the response.
- **Session:** For simplicity, either (a) one connection per “operation” (connect → greeting → login → single command → logout → disconnect), or (b) a shared connection/session with a mutex or queue to serialize commands. Start with (a) to avoid session state; optimize to (b) later if needed for throughput.
- **Timeouts:** Set socket timeout (e.g. 30s) and handle ECONNRESET / timeouts like Plesk (map to `SERVICE_UNAVAILABLE` or similar).

### 5.4 XML Build/Parse and Error Handling (Same as Plesk)

- **Build EPP commands** in a dedicated module (e.g. `packages/api/src/lib/epp/epp-xml.ts`) with functions like:
  - `buildLoginXml(clid, pw)` → `<epp>...</epp>` with `<login>`.
  - `buildDomainCheckXml(domains: string[])` → `<epp><command><check><domain:check>...</domain:check></check></command></epp>`.
  - Same for create, transfer, renew, info, update; escape any user-supplied strings for XML.
- **Parse EPP responses** in the client or in the router using `fast-xml-parser`:
  - `const parser = new XMLParser({ ignoreAttributes: false }); const parsed = parser.parse(xmlResponse);`
  - Read result code: `parsed?.epp?.response?.result?.['@_code']` or the structure your parser produces for attributes (FXP may use `@_code` for `code`).
  - Read messages: `result?.msg` (can be a string or array depending on parser).
- **Map result codes to errors:** e.g. 4200 → `UNAUTHORIZED`, 2303 → domain taken (return or throw with clear message), 5xxx → `INTERNAL_SERVER_ERROR` with registry message.

This keeps the codebase consistent: one XML library, similar structure (build → send → parse → check errors → return), with only the transport and framing differing for EPP.

---

## 6. Implementation status and findings

This section records what was actually implemented and what was learned during development and testing.

### 6.1 Implemented so far

- **EPP client transport** (`packages/api/src/lib/epp/epp-client.ts`)
  - TLS connection to configurable host/port with optional `tlsServername` for certificate verification.
  - EPP framing: read exactly 4 bytes (big-endian length), then read `length - 4` bytes of XML. No encoding set on the socket so `socket.read()` returns Buffers (see gotchas below).
  - `connectAndReceiveGreeting(config)` — connects, reads one frame (the server greeting), returns `{ xml }`, then closes the socket.
  - Dependencies: Node.js `node:tls` only.
- **KENIC greeting router** (`packages/api/src/routers/kenic/greeting.ts`)
  - Procedure `getGreeting`: reads env (host, port, timeout, tlsServername), calls `connectAndReceiveGreeting`, parses XML with `fast-xml-parser` (`ignoreAttributes: false`), returns `{ raw, parsed, configUsed }` or a parse error payload.
- **Router mount** — `kenic.greeting.getGreeting` is mounted at `api.kenic.greeting.getGreeting` (see app router in `packages/api/src/routers/index.ts`).

### 6.2 Environment variables used (implemented)

| Variable | Used in | Purpose |
|----------|---------|---------|
| `KENIC_EPP_HOST` | greeting router, epp-client | TCP connect hostname. Default `registry.kenic.or.ke`. |
| `KENIC_EPP_PORT` | greeting router, epp-client | TCP port. Default `700`. |
| `KENIC_EPP_TIMEOUT_MS` | greeting router, epp-client | Socket timeout (ms). Default `30000`. |
| `KENIC_EPP_TLS_SERVERNAME` | greeting router, epp-client | TLS SNI and cert verification hostname. Set to `epp.coccaregistry.org` (see §2.1). |

Username/password are not used for the greeting; they will be required for the login procedure.

### 6.3 Testing the greeting in the browser

You can call the greeting procedure via GET (e.g. in the browser or with curl):

```
http://localhost:3001/api/trpc/kenic.greeting.getGreeting?input={}
```

Or with URL-encoded empty object:

```
http://localhost:3001/api/trpc/kenic.greeting.getGreeting?input=%7B%7D
```

Replace `3001` with the port your nPanel app uses. The response includes `result.data.raw` (full greeting XML), `result.data.parsed` (parsed object), and `result.data.configUsed` (host, port, timeoutMs, tlsServername).

### 6.4 Gotchas and fixes (verified during implementation)

1. **TLS certificate hostname mismatch**
   - **Symptom:** `Hostname/IP does not match certificate's altnames: Host: registry.kenic.or.ke. is not in the cert's altnames: DNS:epp.coccaregistry.org`
   - **Cause:** The server presents a certificate for `epp.coccaregistry.org` while we connect to `registry.kenic.or.ke`.
   - **Fix:** Set `KENIC_EPP_TLS_SERVERNAME=epp.coccaregistry.org`. The client uses this for SNI and certificate verification; the TCP connection still goes to `KENIC_EPP_HOST`.

2. **Buffer.concat received string**
   - **Symptom:** `TypeError: The "list[0]" argument must be an instance of Buffer or Uint8Array. Received type string ('')` at `Buffer.concat(chunks, n)` in the EPP client.
   - **Cause:** `socket.setEncoding("utf8")` was set on the TLS socket before reading. With encoding set, `socket.read()` returns strings, not Buffers, so `chunks` contained strings and `Buffer.concat` failed.
   - **Fix:** Do **not** call `socket.setEncoding()` on the socket. Keep the socket in binary mode so `read()` returns Buffers for the length-prefixed frame. Decode to string only after the full payload is read (e.g. `payload.toString("utf8")` before returning the XML).

3. **Number() radix**
   - **Symptom:** TypeScript error "Expected 0-1 arguments, but got 2" when using `Number(process.env.KENIC_EPP_PORT ?? "700", 10)`.
   - **Cause:** `Number()` accepts only one argument; the radix is for `parseInt()`, not `Number()`.
   - **Fix:** Use `Number(process.env.KENIC_EPP_PORT ?? "700")` (and similarly for timeout). `Number()` parses in base 10 by default.

4. **EPP result 2400 ("Command failed") on domain check — root cause**
   - **Symptom:** Domain check returns result code `2400` with message "Command failed".
   - **Cause (verified):** Including the **government TLD .go.ke** in the domain check request causes the server to return 2400. The same request without any .go.ke domain (e.g. 9 domains: .ke, .co.ke, .or.ke, .ne.ke, .me.ke, .mobi.ke, .info.ke, .sc.ke, .ac.ke) with `withFee: true` succeeds.
   - **Fix:** .go.ke is **excluded from our supported TLD list** (§1.3). We do not offer or validate .go.ke; domain check only accepts the other nine TLDs. Batching limits were relaxed (one limit of 10 domains per check for both with and without fee).

### 6.5 Next steps (not yet implemented)

- Login procedure: connect → receive greeting → send `<login>` with objURI/extURI from §2.9 and credentials from env → parse response (result code 1000 = success).
- Domain check, create, transfer, renew, info, update (and contact/host as needed).
- Registrar routing by TLD and data model (registrar + externalId).

---

## 7. Implementation Plan

### 7.1 Phase 1: EPP Client Library

**Location:** e.g. `packages/api/src/lib/epp/` or `packages/epp-client/` (new package if preferred).

**Tasks:**

1. **TLS socket connection** to a configurable host and port (default `registry.kenic.or.ke:700` from env).
2. **Send/receive EPP XML:** implement framing (length-prefixed or XML over socket as per RFC). EPP typically uses a 4-byte big-endian length prefix followed by XML.
3. **Login/logout:** build and send `<login>`, parse response; send `<logout>`.
4. **Domain check:** send `domain:check`, parse response (avail / unavailable per name).
5. **Error handling:** parse EPP result codes and map to typed errors (e.g. auth failure, domain taken, server error).
6. **Keep credentials in env:** e.g. `KENIC_EPP_HOST`, `KENIC_EPP_PORT`, `KENIC_EPP_USERNAME`, `KENIC_EPP_PASSWORD`. No credentials in repo or this doc.

**Dependencies:** Use Node.js built-in `tls` and `net`; XML parsing (e.g. `fast-xml-parser` or similar) for EPP XML. Consider an existing EPP library (e.g. npm “epp” or “epp-client”) if it supports TLS and is maintainable; otherwise implement a minimal client.

### 7.2 Phase 2: KENIC Domain Operations

**Location:** Same EPP client or `packages/api/src/lib/kenic-client.ts` that wraps the EPP client and exposes:

- `checkDomains(domains: string[])` → availability + optional pricing if KENIC returns it.
- `createDomain(params)` → register with registrant/admin/tech contacts and nameservers.
- `transferDomain(params)` → transfer in with auth code.
- `renewDomain(params)` → renew for N years.
- `getDomainInfo(domain)` → domain details (for sync, update, renew).
- `updateDomain(domain, params)` → update nameservers, contacts, lock status.

Map EPP XML requests/responses to/from simple JS/TS types. Implement contact and host creation/update as required by KENIC (standard EPP contact/host objects).

### 7.3 Phase 3: API Router and Registrar Routing

**Location:** `packages/api/src/routers/kenic/` (or `packages/api/src/routers/registrars/kenic.ts`).

**Tasks:**

1. **KENIC router:** Procedures that call the KENIC client (check, create, transfer, renew, info, update). Inputs/outputs aligned with existing domain flows where possible (e.g. domain name, period, contacts, nameservers, auth code for transfer).
2. **Registrar routing:** In the main domain/order flow (or a small “registrar service”):
   - Resolve TLD from domain name.
   - If TLD in KENIC list → call KENIC router (or KENIC service).
   - Else → use existing OpenProvider routers.
3. **Health check:** Add a KENIC health check procedure (connect, login, logout or hello) to verify endpoint and credentials; similar to `openProviderRouter.healthCheck`.

### 7.4 Phase 4: Data Model and Application Flow

**Location:** DB schema (e.g. Prisma in `apps/web` or `packages/db`), domain link/link-to-team and order provisioning logic.

**Tasks:**

1. **Schema:** Add `registrar` (enum or string) and `externalId` (string); keep `openProviderId` for OpenProvider-only. Migrations for existing domains (default `OPENPROVIDER`, `externalId` derived from `openProviderId` if desired).
2. **Domain link flow:** When linking a domain to a team, if it’s a KENIC domain, fetch from KENIC (EPP domain:info) and store with `registrar=KENIC` and `externalId` = domain name (or EPP id).
3. **Order provisioning:** For orders that register or transfer a .ke domain, call KENIC EPP create/transfer and then create/link the domain record with `registrar=KENIC`.
4. **UI:** Domain list and detail views should show registrar (e.g. “KENIC” for .ke) and use the same EPP auth code / transfer code where relevant (already referenced in your app as “EPP code”).

### 7.5 Phase 5: Testing and Operational Hardening

- **Unit tests:** EPP XML build/parse for login, domain check, create, transfer, renew (mock socket or fixture XML).
- **Integration tests:** Against KENIC production only if no sandbox (use a test domain and low rate); or use sandbox when KENIC provides it.
- **Operational limits:** Throttle EPP commands (e.g. one connection per process, or a small pool; limit concurrent checks/creates). Avoid aggressive polling or bulk scans.
- **Logging and monitoring:** Log EPP errors and result codes (do not log passwords); consider metrics for success/failure and latency.

---

## 8. Security

- **Credentials:** Store KENIC EPP username and password only in environment variables or secrets manager. Never commit them to the repo or document them in this file.
- **TLS:** Always use TLS for EPP (port 700). Verify server certificate (default Node.js TLS behaviour).
- **Secrets in builds:** Ensure production builds (e.g. Cloud Run) receive secrets via secure injection (e.g. Secret Manager), not baked into images.
- **Web portal:** The same credentials grant access to https://registry.kenic.or.ke; restrict access to the portal to trusted staff and use strong passwords/2FA if available.

---

## 9. Configuration Checklist

Before going live, ensure:

- [ ] `KENIC_EPP_HOST` (e.g. `registry.kenic.or.ke`) and `KENIC_EPP_PORT` (e.g. `700`) set in the environment.
- [ ] If the server presents a certificate for a different hostname (e.g. shared registry), set `KENIC_EPP_TLS_SERVERNAME` to that hostname (e.g. `epp.coccaregistry.org`) so TLS verification succeeds.
- [ ] `KENIC_EPP_USERNAME` and `KENIC_EPP_PASSWORD` set from secure storage (e.g. Secret Manager), never in code or docs.
- [ ] KENIC TLD list is in code (`packages/api/src/lib/epp/kenic-tlds.ts`); update it if KENIC adds TLDs.
- [ ] Registrar routing in the app uses this list to dispatch .ke to KENIC.
- [ ] Domain schema includes registrar and externalId; existing OpenProvider domains still work.
- [ ] Health check for KENIC runs in your monitoring (e.g. cron or readiness probe).
- [ ] Rate and concurrency are kept reasonable; if volume is high, KENIC is informed (support@kenic.or.ke).

---

## 10. References

- **EPP RFCs:** RFC 5730 (base), 5731 (domain), 5732 (host), 5733 (contact), 5910 (DNSSEC).
- **KENIC:** https://registry.kenic.or.ke — support@kenic.or.ke for technical questions.
- **nPanel OpenProvider integration:** `packages/api/src/lib/openprovider-client.ts`, `packages/api/src/routers/openprovider/`, and `apps/npanel/openprovider.md` for REST API comparison and patterns.
- **nPanel Plesk XML client (pattern to follow):** `packages/api/src/lib/plesk/xml-client.ts` (transport), `packages/api/src/routers/plesk/*.ts` (XML building, `fast-xml-parser`, error handling).

---

## Document History

| Date | Change |
|------|--------|
| Initial | Created from KENIC technical response; architecture and implementation plan for EPP integration. |
| 2026-02-18 | Added §2.8 env vars reference, §2.9 actual KENIC greeting and capabilities (from live response). Added §6 Implementation status and findings: implemented greeting flow, env vars, browser test URL, gotchas (TLS cert hostname, socket encoding/Buffer, Number radix). Renumbered sections 6→7, 7→8, 8→9, 9→10. |
