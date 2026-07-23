=== Nisc Payment Gateway for WooCommerce ===
Contributors: nisccloud
Tags: woocommerce, mpesa, payments, kenya, nisc
Requires at least: 6.4
Tested up to: 7.0
Requires PHP: 8.0
Stable tag: 0.1.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Accept M-Pesa payments through Nisc Cloud Payment Gateway. Paste your API key — webhooks register automatically.

== Description ==

Nisc Payment Gateway for WooCommerce lets merchants accept M-Pesa STK Push payments without storing Safaricom credentials in WordPress.

1. Get an API key from nPanel (agency creates the merchant).
2. Paste the key in WooCommerce → Settings → Payments → Nisc Payment Gateway.
3. Click Connect — the plugin registers your webhook automatically.
4. Enable the method and take orders.

Sandbox vs production is controlled by the API key issued in nPanel. There is no environment toggle in WordPress.

== Installation ==

1. Download the private ZIP from Nisc Cloud / your agency contact.
2. In WordPress: Plugins → Add New → Upload Plugin → install the ZIP.
3. Activate the plugin (WooCommerce must already be active).
4. Go to WooCommerce → Settings → Payments → Nisc Payment Gateway.
5. Paste your `npg_…` API key and click Connect.
6. Enable the payment method and save checkout labels.

== Frequently Asked Questions ==

= Do I need to paste a webhook URL in nPanel? =

No. Clicking Connect registers `https://your-site/wp-json/nisc-gateway/v1/webhook` for you.

= Where do I get the API key? =

From your Nisc Cloud / nPanel merchant account under Payment Gateway → API keys.

= Does the plugin support cards or Stripe? =

Not in v1. M-Pesa STK Push only.

== Changelog ==

= 0.1.0 =
* Initial private release: connect flow, STK checkout, HMAC webhooks, HPOS support.
* Distributed via GitHub Actions artifacts / releases (manual workflow).
