# Nisc Payment Gateway — WordPress / WooCommerce Plugin

## Locked decisions

| Decision | Choice |
|----------|--------|
| Scope | **WooCommerce only** (no standalone shortcodes / forms in v1) |
| Distribution | **Private ZIP** (not WordPress.org yet) |
| Repo location | **`apps/nisc-payment-gateway-wp/`** in this monorepo |
| Merchant config in WP | **API key only** (no Sandbox/Production toggle) |
| Webhook setup | **Self-registered** by the plugin when the API key is saved |
| Environment | Already set on the **API key / credentials in nPanel** — plugin does not choose it |
| Branding | Official logo `assets/images/nisc-payment-gateway-logo.png` (cyan `#00ADEF` on black) |

---

## Status (implemented)

### Gateway API

- `GET /api/nisc-gateway/v1/webhook` — connection status (no secret)
- `PUT /api/nisc-gateway/v1/webhook` — register URL, rotate + return `webhookSecret`
- `DELETE /api/nisc-gateway/v1/webhook` — clear registration

### WordPress plugin (`apps/nisc-payment-gateway-wp`)

- Guided admin UI: 3-step setup, Connect with API key, auto webhook registration
- WooCommerce payment method (M-Pesa STK)
- REST webhook `POST /wp-json/nisc-gateway/v1/webhook` with HMAC verify
- Current version: **0.1.0** (keep `package.json`, plugin header, `NISC_PG_VERSION`, and `readme.txt` Stable tag in sync)
- **ZIP builds only via GitHub Actions** (Ubuntu) — no local zip script (Windows `Compress-Archive` broke activation with backslash paths)
- CI release: `.github/workflows/wordpress-plugin-nisc-payment-gateway.yml` — **manual only**

Default API base: `https://npanel-server.nisccloud.com/api/nisc-gateway`  
Override: WordPress filter `nisc_pg_api_base_url`.

---

## Versioning & release (GitHub)

**Source of truth:** `apps/nisc-payment-gateway-wp/package.json` → `"version"`.

Before every release, bump these to the same value:

1. `package.json` → `version`
2. `nisc-payment-gateway.php` → `Version:` header and `NISC_PG_VERSION`
3. `readme.txt` → `Stable tag:` + changelog entry

### Manual GitHub Actions release (only supported build)

1. Merge plugin changes.
2. Actions → **WordPress Plugin (Nisc Payment Gateway)** → Run workflow.
3. Download:
   - Workflow **Artifacts**, or
   - **Releases** tag `nisc-payment-gateway-wp/vX.Y.Z` (if enabled)

ZIP layout (required by WordPress):

```text
nisc-payment-gateway/
  nisc-payment-gateway.php
  includes/
  assets/
  readme.txt
  ...
```

If a previous broken ZIP was installed, delete that plugin folder in WP Admin before uploading the new one.

This workflow is intentionally **not** linked to `deploy.yml` / `system-deploy.yml`.
---

## Plugin Check (PCP)

[Plugin Check](https://wordpress.org/plugins/plugin-check/) is the same tooling WordPress.org reviewers lean on. Use it before every release / .org submission.

### CI (already wired)

Workflow: `.github/workflows/wordpress-plugin-check.yml`

- Runs on **manual dispatch**, and on PRs/pushes that touch `apps/nisc-payment-gateway-wp/**`
- **Not** linked to deploy or the ZIP release workflow
- Copies a clean plugin tree (excludes `dist/`, `scripts/`, `package.json`) then runs [`wordpress/plugin-check-action`](https://github.com/WordPress/plugin-check-action)

Results show up as **GitHub annotations** on the failing lines.

If a check is a known false positive, add its error code under `ignore-codes:` in that workflow (don’t blanket `ignore-errors`).

### Local — Option 1: WP Admin (easiest)

1. Spin up any local WordPress + WooCommerce (Local WP, Laravel Herd, Docker, etc.).
2. Install & activate **[Plugin Check](https://wordpress.org/plugins/plugin-check/)** from wordpress.org.
3. Upload/symlink this plugin into `wp-content/plugins/nisc-payment-gateway/`.
4. Go to **Tools → Plugin Check**, select **Nisc Payment Gateway for WooCommerce**, run checks.

### Local — Option 2: WP-CLI

With WordPress + Plugin Check installed:

```bash
wp plugin install plugin-check --activate
wp plugin check nisc-payment-gateway --categories=general,security,performance,plugin_repo
```

Useful flags:

```bash
wp plugin check nisc-payment-gateway --format=table
wp plugin check nisc-payment-gateway --ignore-codes=textdomain_mismatch
wp plugin check nisc-payment-gateway --exclude-directories=vendor
```

### What to fix first

Prioritize **errors** in `plugin_repo`, `security`, and `general` (escaping, nonces, headers, readme, text domain). Warnings can wait unless you’re submitting to wordpress.org.

---

## Pushing updates to merchants (options)

Merchants will not happily re-upload ZIPs forever. Choose one path:

### Option A — WordPress.org (best “Update now” UX)

Users see the normal WP admin update. Zero custom update code.

**You need:**

| Requirement | Details |
|-------------|---------|
| wordpress.org account | Create at [wordpress.org](https://wordpress.org) |
| Plugin review submission | [Submit plugin](https://wordpress.org/plugins/developers/add/) — review often takes **days–weeks** |
| **GPL-compatible license** | Required (we set `GPLv2 or later` in `readme.txt` for this path) |
| Unique slug | e.g. `nisc-payment-gateway` — must not conflict |
| Clean `readme.txt` | Headers, FAQ, changelog, screenshots (optional but expected) |
| SVN access | After approval you get an SVN repo; releases are tagged in SVN (`tags/0.1.0`) |
| Trademark / branding | Avoid implying endorsement by WordPress/WooCommerce; “Nisc” trademark is yours to defend |
| WooCommerce dependency | Declare `Requires Plugins: woocommerce`; test HPOS |
| No “calling home” abuse | API calls to Nisc Gateway for payments are fine; disclose in readme |
| Privacy / security | Don’t store secrets in plain logs; pass Plugin Check / PHPCS where possible |

**Release flow after approval:**

1. Bump version in plugin files.
2. Build ZIP (or export tree).
3. SVN commit trunk + `svn cp trunk tags/0.1.1`.
4. wordpress.org mirrors the new tag → sites get the update notification.

You can still keep the GitHub Actions ZIP as an internal/backup channel.

### Option B — Stay private + custom updater (no .org)

If you do not want GPL public listing:

1. Host ZIPs on GitHub Releases (what the workflow already does), **or** on nPanel CDN.
2. Add [Plugin Update Checker](https://github.com/YahnisElsts/plugin-update-checker) (or a small custom updater) that points at:
   - GitHub Releases JSON, or
   - Your own `https://npanel…/plugins/nisc-payment-gateway/update.json`
3. Merchants still get **Dashboard → Updates** for this plugin.

Tradeoff: more code to maintain; works for private/paid distribution.

### Recommendation

- **Now (0.x):** GitHub Actions artifact + Release ZIP (already wired).
- **When stable / want zero-friction updates:** submit to **WordPress.org** (Option A).
- If the product must stay closed-source: use Option B and keep GPL off .org.

---

## Compatibility & versioning

| Plane | Policy |
|-------|--------|
| Plugin SemVer | Current **`0.1.0`**; bump before each release; ZIP = `nisc-payment-gateway-{version}.zip` |
| Gateway API | Stay on path `/v1` |
| WordPress | Requires at least **6.4**; test on current stable |
| WooCommerce | Requires at least **8.0**; **HPOS-compatible** from day one |
| PHP | Requires **8.0+** |

Plugin header:

```php
/**
 * Plugin Name: Nisc Payment Gateway for WooCommerce
 * Version: 0.1.0
 * Requires at least: 6.4
 * Tested up to: 7.0
 * Requires PHP: 8.0
 * Requires Plugins: woocommerce
 * WC requires at least: 8.0
 * WC tested up to: 9.9
 */
```

---

## Proposed folder layout

```text
apps/nisc-payment-gateway-wp/
├── nisc-payment-gateway.php
├── includes/
│   ├── class-nisc-api-client.php
│   ├── class-nisc-wc-gateway.php
│   ├── class-nisc-webhook-controller.php
│   ├── class-nisc-order-service.php
│   └── class-nisc-plugin.php
├── assets/
├── languages/
├── readme.txt
└── package.json          # version only — ZIP built in GitHub Actions
```

ZIP artifact is produced only by `.github/workflows/wordpress-plugin-nisc-payment-gateway.yml`.

---

## Implementation phases

### Phase A — Gateway (blocker for self-register)

- [x] `PUT/GET/DELETE /api/nisc-gateway/v1/webhook`
- [x] Persist + rotate `settings.webhookUrl` / `settings.webhookSecret`
- [x] Outbound webhook forwarder uses those settings + HMAC
- [x] Documented in this file / webhook docs

### Phase B — Plugin MVP

- [x] Scaffold `apps/nisc-payment-gateway-wp`
- [x] WC payment method + API key setting
- [x] On Connect: register webhook
- [x] `process_payment` → create payment
- [x] REST webhook controller → order status
- [x] Private ZIP via GitHub Actions only (no local zip script)

### Phase C — Hardening

- [ ] Idempotent webhooks, order notes, masked logs
- [x] Disconnect on deactivate (`DELETE` webhook)
- [ ] Install / config guide for merchants
- [ ] Sandbox E2E on a real WP + Woo site

### Phase D — Later

- [ ] Refunds UI, more providers
- [ ] WordPress.org submission **or** private Plugin Update Checker
- [ ] Auto-updates for merchants

---

## Out of scope (0.1.x)

- Non-WooCommerce shortcodes
- Environment toggle in WP
- Manual webhook URL paste in nPanel (agency can still override via dashboard if needed)
- Stripe / PayPal / etc. in the plugin (gateway may add providers later; plugin stays M-Pesa until then)