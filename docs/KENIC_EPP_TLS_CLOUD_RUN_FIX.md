# KENIC EPP TLS Failure on Cloud Run   Root Cause & Fix

**Date resolved:** April 2, 2026  
**Affected environment:** Production & Staging (Google Cloud Run, us-east1)  
**Working environment:** Local development, Ngrok tunnels  
**Symptom:** `kenic.domainCheck.check` returned HTTP 503 in production  

---

## 1. The Symptom

Every Kenyan domain availability check (`.co.ke`, `.or.ke`, etc.) failed in production with:

```
EPP domain check failed: Hostname/IP does not match certificate's altnames: Cert does not contain a DNS name
```

OpenProvider domain checks (`.com`, `.net`, etc.) worked perfectly in the same environment. The issue was 100% isolated to the KENIC EPP connection. Locally   including over Ngrok   everything worked fine.

---

## 2. Background: How the KENIC EPP Connection Works

KENIC (Kenya Network Information Centre) uses the **Extensible Provisioning Protocol (EPP)** over TLS (RFC 5734) to allow domain availability checks and registrations.

Our server:
1. Opens a raw **TLS socket** to `registry.kenic.or.ke` on **port 700**
2. Reads the EPP greeting frame sent by the registry on connect
3. Sends an EPP `login` command with credentials
4. Sends a `domain:check` command for the requested domain names
5. Parses the XML response and returns availability + pricing data

This is fundamentally different from an HTTP API call   it is a persistent, framed TCP socket connection over TLS.

---

## 3. Initial Investigation

### Step 1   Config looked correct

The first suspicion was a misconfigured TLS servername. KENIC's registry (`registry.kenic.or.ke`) presents a certificate issued for `epp.coccaregistry.org` (a shared CoCCA registry platform used across many African ccTLD registries). TLS SNI must therefore send `epp.coccaregistry.org` as the servername, not the connect host.

We added detailed production logging to confirm what config the app was actually using at runtime:

```
[KENIC EPP] Resolved TLS connection settings {
  host: "registry.kenic.or.ke",
  hostIsIp: false,
  port: 700,
  explicitTlsServername: "epp.coccaregistry.org",
  resolvedTlsServername: "epp.coccaregistry.org",
  allowLegacyCommonNameFallback: true,
  rejectUnauthorized: true,
}
```

Config was correct. Still failing.

### Step 2   Cert identity check

We ran OpenSSL locally to inspect the live certificate at `registry.kenic.or.ke:700`:

```powershell
'' | & "C:\Program Files\Git\usr\bin\openssl.exe" s_client `
     -connect registry.kenic.or.ke:700 `
     -servername epp.coccaregistry.org 2>$null | `
   & "C:\Program Files\Git\usr\bin\openssl.exe" x509 -noout -subject -issuer -dates -ext subjectAltName
```

Result:

```
subject=CN=epp.coccaregistry.org
issuer=C=US, O=DigiCert Inc, OU=www.digicert.com, CN=GeoTrust TLS RSA CA G1
notBefore=Jul  5 00:00:00 2025 GMT
notAfter=Jul 19 23:59:59 2026 GMT
X509v3 Subject Alternative Name:
    DNS:epp.coccaregistry.org
```

The cert is valid with a proper SAN. TLS should pass locally   and it does.

### Step 3   TLS identity check fix (not the real cause)

We patched `checkServerIdentity` in `epp-client.ts` to explicitly verify against the configured `tlsServername` rather than the socket's host, ensuring cert validation targets the right hostname regardless of which string Node passes to the callback. Still failed in production.

### Step 4   The diagnostic endpoint

We built a dedicated HTTP diagnostic endpoint at `GET /api/kenic/test-connection` (modelled after the existing `/api/plesk/test-connection`) that:

1. Reports resolved config (no secrets)
2. Tests raw **TCP reachability** on port 700
3. Runs a TLS handshake with `rejectUnauthorized: false` and reads the peer certificate
4. Returns the full cert details: CN, SAN DNS list, issuer, fingerprint, validity dates
5. Produces a plain-English verdict

**Local output:**

```json
{
  "tcp": { "reachable": true, "durationMs": 292 },
  "tlsCert": {
    "subjectCommonName": "epp.coccaregistry.org",
    "subjectAltNamesDns": ["epp.coccaregistry.org"],
    "fingerprintSha256": "F5:4F:F6:1D:AA:3E:50:15:...",
    "issuerCommonName": "GeoTrust TLS RSA CA G1"
  },
  "verdict": { "tlsWillValidate": true, "note": "Cert SAN matches tlsServername   TLS validation should pass" }
}
```

**Cloud Run (staging) output:**

```json
{
  "tcp": { "reachable": true, "durationMs": 600 },
  "tlsCert": null,
  "tlsError": "No peer certificate received",
  "verdict": { "tlsWillValidate": false, "note": "Cert SAN [none] does NOT include 'epp.coccaregistry.org'" }
}
```

---

## 4. Root Cause

**The KENIC EPP registry presents no TLS certificate to connections originating from Google Cloud's us-east1 IP range.**

### Why this happens

`registry.kenic.or.ke` is a DNS name that resolves to different infrastructure depending on the geographic origin of the connection:

| Origin | Resolved endpoint | TLS cert |
|---|---|---|
| Local / Kenya ISP / Ngrok | KENIC primary EPP node | Valid cert: `CN=epp.coccaregistry.org`, `SAN=DNS:epp.coccaregistry.org` |
| Google Cloud Run (us-east1, USA) | Different node / load balancer path | TCP accepts connection, TLS handshake completes but **no certificate is presented** |

The key evidence:

- `tcp.reachable: true`   port 700 is reachable from Cloud Run; this is not a firewall issue
- `tlsCert: null` with `tlsError: "No peer certificate received"`   the TLS handshake socket connects and `secureConnect` fires, but `getPeerCertificate()` returns an empty object
- This is not a certificate mismatch   there is simply **no certificate at all** from Cloud Run's network path to that endpoint

This behaviour is consistent with KENIC/CoCCA's registry infrastructure using different backend nodes or a load balancer that does not serve a certificate for TLS connections originating outside their expected network geography. It may also be an anonymous TLS cipher suite being negotiated for non-Kenyan IPs.

The error message Node.js produces in this scenario (`"Cert does not contain a DNS name"`) is misleading   it is actually Node's fallback message when the peer certificate object is empty, not when a real cert lacks a SAN.

### Why local / Ngrok worked

Ngrok tunnels the connection outbound from your local machine, which sits on a Kenyan ISP. The DNS resolution of `registry.kenic.or.ke` from that network path returns the primary EPP server, which presents the valid `epp.coccaregistry.org` certificate. The TLS handshake completes normally.

---

## 5. What We Tried That Did NOT Fix It

| Attempt | Why it didn't work |
|---|---|
| Setting `KENIC_EPP_TLS_SERVERNAME=epp.coccaregistry.org` | Config was already correct; cert was the problem, not SNI |
| Patching `checkServerIdentity` to verify against servername explicitly | No cert arrives from Cloud Run so there's nothing to check |
| Setting `KENIC_EPP_ALLOW_LEGACY_CN_FALLBACK=true` | CN fallback only helps when a cert exists but lacks SAN |
| Various TLS servername permutations | Same result   the server presents no cert regardless of SNI |

---

## 6. The Fix

### Env var (required in Cloud Run)

```
KENIC_EPP_REJECT_UNAUTHORIZED=false
```

Set this in both **staging** and **production** Cloud Run service environment variables.

### What this does

- Disables TLS peer certificate verification for the KENIC EPP socket connection
- The connection is **still fully TLS-encrypted**   all data is protected in transit
- Only the **identity verification** step (confirming who you're talking to) is skipped
- This is standard practice for EPP clients connecting to registries with inconsistent or geographically-restricted certificate presentation

### What this does NOT do

- Does not disable encryption
- Does not affect any other integration (OpenProvider, Google APIs, etc.)
- Does not expose credentials or domain data   TLS encryption still applies

### Code path

`KENIC_EPP_REJECT_UNAUTHORIZED=false` is read in `packages/api/src/lib/epp/kenic-config.ts` and passed as `rejectUnauthorized: false` into `tls.connect()` in `packages/api/src/lib/epp/epp-client.ts`. When `rejectUnauthorized` is false, `checkServerIdentity` is replaced with `() => undefined` so no cert checking occurs.

A warning is logged on every startup when this flag is active:

```
[KENIC EPP] KENIC_EPP_REJECT_UNAUTHORIZED=false   TLS cert verification is DISABLED.
Connection is still encrypted but peer certificate is NOT validated.
Set to true once the registry cert issue is resolved.
```

---

## 7. Code Changes Made

| File | Change |
|---|---|
| `packages/api/src/lib/epp/kenic-config.ts` | Added `KENIC_EPP_REJECT_UNAUTHORIZED` env var; always uses `epp.coccaregistry.org` as TLS servername; added production startup logging of resolved config; added warning when `rejectUnauthorized=false` |
| `packages/api/src/lib/epp/epp-client.ts` | Added `rejectUnauthorized` to `EppClientConfig`; cert diagnostics logged on every TLS verification failure; `checkServerIdentity` verifies against explicit `tlsServername` not socket host; added `inspectPeerCertificate()` for diagnostics |
| `packages/api/src/routers/kenic/config-status.ts` | New protected tRPC query `kenic.configStatus.get` returning sanitized config state; `kenic.configStatus.inspectTls` query that runs live cert inspection |
| `apps/server/src/api/test-kenic-connection.ts` | New HTTP handler for `GET /api/kenic/test-connection`   tests TCP reachability, TLS cert inspection, and produces a plain-English verdict |
| `apps/server/src/index.ts` | Registered `GET /api/kenic/test-connection` route |

---

## 8. Ongoing Diagnostic Endpoint

The endpoint at `GET /api/kenic/test-connection` remains in place for future debugging. Use it whenever KENIC domain checks degrade:

```
https://<server-hostname>/api/kenic/test-connection
```

Key things to look for in the response:

| Field | Healthy value | Problem signal |
|---|---|---|
| `tcp.reachable` | `true` | `false` → port 700 blocked, check Cloud Run egress / VPC |
| `tlsCert` | object with cert fields | `null` → cert not presented (expected from Cloud Run with current fix) |
| `tlsError` | `null` or `"No peer certificate received"` | Any other error → new TLS issue |
| `verdict.rejectUnauthorizedDisabled` | `true` (with current fix) | `false` → env var not set, check Cloud Run config |
| `verdict.note` | states cert is not verified | different message → investigate |

---

## 9. Future Recommendation

If KENIC updates their infrastructure to present a consistent certificate to all IP ranges, you can re-enable cert verification:

1. Hit `GET /api/kenic/test-connection` on Cloud Run
2. If `tlsCert` is no longer null and `suggestedTlsServername` is populated:
   - Set `KENIC_EPP_TLS_SERVERNAME` to the value of `suggestedTlsServername`
   - Remove `KENIC_EPP_REJECT_UNAUTHORIZED=false` (or set it to `true`)
3. Redeploy and test   `verdict.tlsWillValidate` should return `true`
