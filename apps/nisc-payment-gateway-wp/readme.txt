=== Nisc Payment Gateway for WooCommerce ===
Contributors: nisccloud
Tags: woocommerce, mpesa, payments, kenya, nisc
Requires at least: 6.4
Tested up to: 7.0
Requires PHP: 8.0
Stable tag: 0.1.5
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Nisc Cloud Payment Gateway: seamless M-Pesa STK Push for WooCommerce. Get access: +254748777666 or support@nisccloud.com.

== Description ==

**Nisc Cloud Payment Gateway** turns your WooCommerce store into an M-Pesa-ready checkout fast STK Push payments, automatic webhooks, and no Safaricom credentials stored in WordPress.

Merchants paste one API key, click Connect, and start taking payments. Sandbox vs production is controlled by the key we issue  no environment toggle in WordPress.

= How to get access =

Contact Nisc Cloud to get set up and receive your API key:

* Phone: **+254748777666**
* Email: **support@nisccloud.com**

= After you have access =

1. Paste your API key in WooCommerce → Settings → Payments → Nisc Payment Gateway.
2. Click Connect the plugin registers your webhook automatically.
3. Use **Connection test** (green/red card) to confirm gateway + M-Pesa token, then optionally **Test STK → webhook**.
4. Enable the method and take orders.

== Installation ==

1. Contact Nisc Cloud for access (+254748777666 or support@nisccloud.com), then install the plugin ZIP we provide.
2. In WordPress: Plugins → Add New → Upload Plugin → install the ZIP.
3. Activate the plugin (WooCommerce must already be active).
4. Go to WooCommerce → Settings → Payments → Nisc Payment Gateway.
5. Paste your `npg_…` API key and click Connect.
6. Optionally send a test STK to yourself and confirm the webhook preview appears.
7. Enable the payment method and save checkout labels.

== Frequently Asked Questions ==

= Do I need to paste a webhook URL in nPanel? =

No. Clicking Connect registers `https://your-site/wp-json/nisc-gateway/v1/webhook` for you.

= Where do I get the API key? =

Contact Nisc Cloud to get access: call **+254748777666** or email **support@nisccloud.com**. Once your merchant is set up, you will receive an API key to paste into the plugin settings.

= Can I test without creating a real order? =

Yes. After connecting, use **Test STK → webhook** on the settings page. Enter your phone, send a test prompt, complete or cancel it, and preview the webhook JSON. Test payments never update WooCommerce orders.

= Does the plugin work with Dokan multi-vendor marketplace? =

Yes! Once enabled in WooCommerce → Settings → Payments, M-Pesa automatically appears at checkout for all vendor stores. No additional configuration needed. Customers can pay with M-Pesa when buying from any vendor.

Note: This is for customer payments only. Vendors should use other methods for withdrawals/payouts.

= Why don't I see the payment method at checkout? =

If you see "There are no payment methods available" at checkout, you're likely using WooCommerce Checkout Blocks (default since WooCommerce 8.3). Update to version 0.1.4+ which adds full Checkout Blocks support.

Alternatively, switch to Classic Checkout: go to Pages → Checkout, select the "Payment Options" block, and click "Switch to classic checkout" in the sidebar.

= Does the plugin support cards or Stripe? =

Not in v1. M-Pesa STK Push only.

== Changelog ==

= 0.1.5 =
* Fixed WordPress.org submission: Plugin URI and Author URI must differ (removed duplicate Plugin URI).
* Updated plugin description and access instructions (contact +254748777666 or support@nisccloud.com).
* Version bump for clean reinstall / review resubmission.

= 0.1.4 =
* Added WooCommerce Checkout Blocks support  payment gateway now works with both Classic Checkout and Checkout Blocks.
* Fixed: Payment method now appears at checkout on stores using the new block-based checkout (WooCommerce 8.3+).
* Improved documentation for Dokan integration and checkout troubleshooting.

= 0.1.3 =
* Added Dokan multi-vendor marketplace support  M-Pesa now available at checkout for all vendor stores.
* Added GET endpoint for webhook testing and verification.
* Enhanced webhook debugging with request logging (when WP_DEBUG is enabled).
* Improved webhook reliability and error handling.

= 0.1.2 =
* Admin: Connection test button (always on settings)  green/red card for gateway reachability, API key, and M-Pesa OAuth token.
* Admin: Test STK → webhook flow on the same settings page (send yourself a prompt, preview incoming webhook JSON).
* Test webhooks are accepted and logged for preview without updating any WooCommerce order.

= 0.1.1 =
* Admin UI: white/cyan branding, fixed step number alignment, clearer copy.
* ZIP builds via GitHub Actions only (Linux paths for reliable WordPress install).

= 0.1.0 =
* Initial private release: connect flow, STK checkout, HMAC webhooks, HPOS support.
* Distributed via GitHub Actions artifacts / releases (manual workflow).
