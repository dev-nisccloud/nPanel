# Nisc Cloud website: security audit and remediation report

Date: 7 November 2026. Nothing has been committed or deployed.

## Scope, method and limits

**In scope:** the marketing website and storefront (`apps/www.nisccloud.com`), its Bun host (`server.ts`), the Vercel configuration, the shipped JavaScript bundle and its dependencies, and the public behaviour of the nPanel API as the website uses it.

**Standards used:** OWASP Top 10 (2021), OWASP API Security Top 10 (2023), the OWASP Web Security Testing Guide, OWASP ASVS 4.0.3 (Level 2 as the target) and the OWASP Webhook Security Cheat Sheet.

**How it was tested:**
- Source review of every route, API call, redirect, HTML sink and storage use in the website.
- `bun audit` for dependencies.
- The production build served locally by the hardened Bun host and loaded in headless Chrome, which captured Content-Security-Policy violations.
- Path checks for exposed files against the local host only.
- Against production, a small number of ordinary read requests: response headers, and calls without a valid session to confirm they are refused.

No brute-forcing, no directory guessing against production, no mutations, no payments, no accounts, no leads.

**Limits:**
- The nPanel backend (`apps/server`, `packages/api`) is tracked in git, but this machine has a partial (blobless) sparse checkout and no SSH key for GitHub. Of 2,626 backend and docs files, 2,587 are not available locally, so the backend could not be read.
- Every control that lives in the backend is therefore marked **Not Verified**. None is marked as passing because the website behaves correctly.
- **Payment security has not been validated.** Frontend testing cannot show that a forged payment notification is rejected.

## Skills used

| Need | Skill | Decision |
| --- | --- | --- |
| UI and UX work | `frontend-design` (anthropics/skills, installed in the project) | Used for the design phases |
| Finding skills | `find-skills` (installed) | Used to search skills.sh for security, webhook, browser-testing and SEO skills |
| Security review of changes | `review-security` and the built-in security-review subagent (Cursor) | Available; to be run on the final diff |
| Browser testing | Built-in browser tools, the `browser-use` subagent and the project's headless Chrome scripts | Used; `anthropics/skills@webapp-testing` (199.7K installs) would duplicate this, so not installed |
| OWASP audit | Candidates found: `owasp/secure-agent-playbook@agent-security-audit` (270 installs, audits AI-agent setups, not web apps), `walletconnect/skills@security-audit-owasp-top-10` (30 installs), others under 40 installs | **Not installed**: too few installs or the wrong target. The OWASP documents were used directly. |
| Penetration testing | `usestrix/strix` (about 20K installs) drives an autonomous scanner against live targets | **Not installed**: active scanning of production is outside the brief |
| Payment webhooks | Only provider-specific skills for Clerk, Zoom and others; nothing for M-Pesa Daraja or Jenga | **Not installed**; the providers' own documentation is the authority |
| Technical SEO | `agricidaniel/claude-seo@seo-technical` (7.8K), `aaron-he-zhu/...technical-seo-checker` (5.6K), both individual authors | **Not installed** so far: checklist-only value that existing tools cover. Can be added if wanted. |

No additional installation is needed.

## Findings

Severity follows OWASP risk rating (likelihood × impact). Status: **Fixed** (in this codebase, tested locally), **Backend** (needs the nPanel team), **Not Verified** (backend control that could not be inspected), **Pass** (verified).

| ID | Vulnerability | Severity | Component | Evidence | Business impact | Remediation | Status | Test result |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SEC-01 | Client-supplied price accepted for domain transfers (API3/API6, price manipulation) | **Critical** | `storefront.cart.createHandoff` → `quote` | A handoff with `customerPriceAmount: 1` quoted KES 1 + KES 1 VAT for `.co.ke` and `.com` transfers (log C-1) | A transfer could be bought for KES 2 if payment uses the quote | Price transfers server-side from the registry fee + margin; ignore every client price field | Backend (B-1) | Reproduced with a quote only; no payment made |
| SEC-02 | Order creation depends on the browser, and the browser re-sends the cart at order time | **High** | `storefront.orders.createFromPayment` | Website code calls it after the browser sees a successful payment, passing `cart` again (`storefront-checkout-api.ts`) | Paid orders lost if the tab closes; possible mismatch between the cart paid for and the cart ordered | Create the order from the verified payment record on the server; ignore the re-sent cart; see the payment checklist below | Not Verified (B-12, B-13) | Cannot be tested without a sandbox |
| SEC-03 | Payment notification authenticity, amount matching, idempotency, replay protection | **High** (until verified) | M-Pesa STK callback, Jenga callback, order state machine | Backend source not available | A forged notification could mark an order paid and provision services | Checklist and test plan below | Not Verified | — |
| SEC-04 | Account enumeration | **Medium** | `storefront.auth.checkEmail` (public) | The contract returns `{ exists: boolean }` for any email (`storefront-checkout-api.ts:107`) | Attackers can test lists of emails for customer accounts, which helps phishing and password stuffing | Rate-limit per IP and per email; return the same response whichever path applies (send a sign-in or verification link either way); add bot protection | Backend | Not probed (would need real emails) |
| SEC-05 | No spam or abuse protection on enquiry forms | **Medium** | `storefront.leads.submit`, contact and corporate forms | No honeypot, CAPTCHA or Turnstile in the website code | Fake leads, cost, possible email abuse through notifications | Server-side rate limits and validation; Cloudflare Turnstile or a similar challenge checked server-side; a honeypot field the server rejects | Not Verified (server) | Not submitted (no production leads) |
| SEC-06 | Missing browser security headers (CSP, clickjacking, MIME sniffing, referrer, permissions) | **Medium** | `www.nisccloud.com` (Vercel) and `server.ts` | Live response had only HSTS; no CSP, X-Frame-Options, nosniff, Referrer-Policy or Permissions-Policy | Clickjacking on cart and payment pages; weaker defence against injected scripts | New `src/lib/security-headers.ts`, used by the generated `vercel.json` and by `server.ts`; inline theme script moved to `/theme-init.js` so scripts need no `unsafe-inline` | **Fixed** | Headers served locally; 6 key pages, light and dark, loaded with **zero CSP violations**. To confirm on a Vercel preview. |
| SEC-07 | Client-controlled `X-Forwarded-For` passed to the backend | **Medium** | `server.ts` proxy | Incoming `X-Forwarded-For`, `X-Real-IP` and `Forwarded` were copied through | A caller could pick the IP the backend logs and rate-limits on, bypassing per-IP limits | Strip client forwarding headers; set the address from the socket, or from the right-most hop when `TRUST_PROXY=1` behind a load balancer | **Fixed** | Typecheck and build pass |
| SEC-08 | Vulnerable dependencies in the shipped bundle | **Medium** | `react-router` 7.17 (open redirect via backslash, route-matching DoS), `insane` 2.6.2 (ReDoS, no fixed release) | `bun audit`: 48 advisories (25 high) | Open redirect through crafted links; browser hangs on crafted AI chat content | `bun audit fix` (38 fixed); `react-router-dom` ^7.18.2 (7.18.5 installed); `insane` replaced by DOMPurify 3.4 in `ai-markdown-renderer.tsx` (same tag allowlist, scheme allowlist, `rel="noopener noreferrer"` on links) | **Fixed** | 4 advisories remain: esbuild (dev server on Windows), minimatch and postcss-selector-parser (lint and build tooling), Zod 3 (validates the visitor's own form input). Accepted as low risk. |
| SEC-09 | Malformed URL crashed static serving | **Low** | `server.ts` | `decodeURIComponent` threw on `%E0%A4%A` | Error responses, noisy logs | Caught; returns 404 | **Fixed** | Returns 404 |
| SEC-10 | AI chat markdown can show images from any HTTPS host | **Low** | `ai-markdown-renderer.tsx` | `img` allowed with any `https:` source | A crafted reply could load a tracking image | Consider limiting images to `storage.nisccloud.com` | Open (low) | — |
| SEC-11 | Raw registry (EPP) XML returned to the browser | **Low** | `kenic.domainCheck.check` | About 3 KB of EPP XML per lookup in the response | Leaks registry internals | Return only the normalised fields | Backend (B-8) | — |
| SEC-12 | Upstream provider names visible in API procedure names | **Info** | `hivelocity.*`, `openProvider.*` | Network tab | Contradicts the no-provider-names rule | Backend aliases | Backend (B-9) | — |
| SEC-13 | HSTS has no `includeSubDomains` or `preload` | **Low** | Vercel | `max-age=63072000` only | Subdomains can be downgraded on first visit | Add both once every `*.nisccloud.com` host is HTTPS-only (owner check) | Owner decision | — |
| SEC-14 | Lockfile from a sparse checkout | **Process** | `bun.lock` | The local lockfile covers only the website workspaces (other apps are not checked out) | Committing it would break the monorepo's other apps | Never commit `bun.lock` from this checkout; repeat the dependency upgrades in a full checkout | Open | — |
| SEC-15 | Cart link (handoff) integrity | — | `createHandoff` / `quote` | HS256, 2-hour expiry; forged and garbage tokens rejected | — | — | **Pass** | Log C-3 |
| SEC-16 | Payment, ticket and support status calls without a session | — | `payment.getJengaPaymentStatus`, `pollPaymentStatus`, `queryStkPush`, `tickets.getList`, `support.guest.getList` | All return **401 UNAUTHORIZED** with a made-up token or no session | — | — | **Pass** (authentication); per-customer isolation (BOLA) Not Verified without two test accounts | 7 read-only calls |
| SEC-17 | Error messages leak internals | — | API errors | No stack traces, file paths or SQL in error bodies | — | — | **Pass** | — |
| SEC-18 | Exposed files, source maps, secrets | — | Build and host | No `.map` files or `sourceMappingURL`; no keys in the bundle; `.env` holds only public `VITE_*` URLs. `/.env`, `/.git/*`, `/server.ts`, `/package.json`, `/vercel.json`, `/bun.lock`, `/src/*`, `/design/*`, traversal attempts and `/admin` all return 404 | — | — | **Pass** | 19 paths checked against the local host only |
| SEC-19 | CORS on the API | — | `npanel-server.nisccloud.com` | An untrusted `Origin` gets no `Access-Control-Allow-Origin` (credentials header present) | — | — | **Pass** for untrusted origins | — |
| SEC-20 | Open redirects in the website | — | Navigation and sign-in | All redirect targets are built from constants or the site's own origin; no redirect takes a URL from the query string | — | — | **Pass** (router advisory fixed in SEC-08) | — |
| SEC-22 | API rate limiting | — | `storefront.cart.quote` | After about 75 quotes in 80 seconds from one address, the API returned "Rate limit exceeded. Please try again shortly." | — | Confirm equivalent limits on `auth.*`, `leads.submit` and payment initiation | **Pass** for the quote endpoint; others Not Verified | Observed during the billing-cycle test |
| SEC-21 | Session cookies, CSRF, rate limits on sign-in, customer-to-customer isolation, file uploads, SSRF in URL-fetching features, logging of personal data, TLS configuration of the API | — | nPanel backend | Backend not available; needs a test account | — | See "Access needed" | Not Verified | — |

## Payment integrity checklist (OWASP Webhook Security Cheat Sheet)

All thirteen controls are **Not Verified**: the backend code that would implement them could not be read. The guidance follows each provider's documented mechanism.

- **M-Pesa (Daraja STK push):** Safaricom does not sign STK callbacks.
- **Jenga:** the backend must confirm each payment server-to-server with Jenga's transaction-status API, using the merchant credentials, before trusting any callback or browser return.

| # | Control | Expected implementation | Status |
| --- | --- | --- | --- |
| 1 | Notifications authenticated | M-Pesa: an unguessable per-environment callback path, plus an STK Push Query (`/mpesa/stkpushquery/v1/query`) with the stored `CheckoutRequestID` before trusting a result. Safaricom's published callback IP ranges can be allow-listed as defence in depth. Jenga: a status query by order reference; verify a signature if the merchant account provides signed notifications. | Not Verified |
| 2 | Signatures validated server-side | Where the provider signs; never in the browser | Not Verified |
| 3 | Amount matches the server-side order total | Compare the provider-confirmed amount with the total stored when payment started, not with anything the browser sends | Not Verified |
| 4 | Currency and transaction references validated | KES only for M-Pesa; the reference must match the stored `CheckoutRequestID` or Jenga order reference | Not Verified |
| 5 | Payment belongs to the right order and customer | The stored payment intent links order, organisation and customer; the checkout token's organisation must match | Not Verified |
| 6 | Duplicate deliveries do not duplicate orders, credits or provisioning | A unique constraint on the provider receipt (`MpesaReceiptNumber`, Jenga transaction ID); idempotent state transitions | Not Verified |
| 7 | Replays cannot repeat fulfilment | Same as 6; reject notifications for orders that are already settled | Not Verified |
| 8 | A success-URL redirect cannot mark an order paid | The Jenga return page must only trigger a server-side status check | Not Verified |
| 9 | Client-supplied status, amount, currency, product or discount cannot complete payment | `createFromPayment` must take its inputs from the stored intent, not the request (SEC-02) | Not Verified (current contract accepts a cart from the browser) |
| 10 | Provisioning only after a verified, eligible payment | State machine: pending → paid (verified) → provisioning | Not Verified |
| 11 | Failed, pending, reversed and cancelled payments never fulfil | M-Pesa `ResultCode` ≠ 0; Jenga statuses other than paid; reversals handled | Not Verified |
| 12 | Secrets stored server-side and never sent to the browser | No payment secrets in the bundle (SEC-18). The backend environment schema has no payment variables, so payment credentials are presumably in the database or admin settings; their encryption at rest is Not Verified. | Partly verified (browser side only) |
| 13 | Auditable payment-state records | An append-only table of every notification, status query and transition, with timestamps and actor | Not Verified |

### Test plan for the backend team (sandbox or mocks only)

Run against the Daraja sandbox and the Jenga sandbox, with provisioning stubbed:

1. Post a forged STK callback (`ResultCode: 0`) for a real pending `CheckoutRequestID` without paying. Expected: the order stays unpaid, because the STK query says not paid.
2. Post the same genuine callback twice. Expected: one order, one provisioning job.
3. Pay KES 1 less than the total in the sandbox. Expected: rejected or flagged; no provisioning.
4. Call `createFromPayment` with a cart different from the paid one. Expected: the order matches the paid intent, or the call is rejected.
5. Call `createFromPayment` with another customer's `checkoutRequestId`. Expected: rejected.
6. Open the Jenga return URL directly without paying. Expected: still unpaid.
7. Cancel at the M-Pesa prompt, let it time out, and send a reversal. Expected: no fulfilment.
8. Close the browser right after paying. Expected: the order is still created from the callback (SEC-02).
9. Check that the audit table records every step above.

## Changes made in this codebase

- `src/lib/security-headers.ts` (new): CSP, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy and Cross-Origin-Opener-Policy. `connect-src` allows nPanel (`npanel.nisccloud.com`) for the sign-in check; `form-action` allows HTTPS for the card-payment POST.
- `scripts/vercel-routes.ts` and `vercel.json` (regenerated): the headers on every path.
- `server.ts`: the same headers on static responses; client forwarding headers stripped; `TRUST_PROXY` option; malformed URLs return 404.
- `index.html` and `public/theme-init.js`: inline theme script moved to a file.
- `src/components/ai-markdown-renderer.tsx`: DOMPurify replaces `insane`.
- Dependencies: `bun audit fix`, `react-router-dom` ^7.18.2, `dompurify` ^3, `insane` removed.

## Access needed to finish the audit

1. Read access to the nPanel backend repository, or a full checkout on this machine. This is enough for a code review of payments, the order state machine, authorisation (BOLA), sessions and CSRF.
2. A staging environment with the Daraja and Jenga sandboxes and stubbed provisioning, to run the test plan above.
3. Two test customer accounts in separate organisations, to test isolation between customers.
4. Confirmation of where payment credentials are stored, and how.
