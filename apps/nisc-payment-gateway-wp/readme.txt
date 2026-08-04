=== Nisc Payment Gateway for WooCommerce ===
Contributors: nisccloud
Tags: woocommerce, mpesa, payments, kenya, nisc
Requires at least: 6.4
Tested up to: 7.0
Requires PHP: 8.0
Stable tag: 0.1.9
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Start accepting M-Pesa payments in minutes. No gateway management. No compliance headaches. Just simple payments.

== Description ==

**Stop managing payment gateways. Start collecting payments.**

Setting up M-Pesa shouldn't take days. Managing compliance, security, and Safaricom integrations shouldn't be your problem.

Nisc Cloud Payment Gateway gives you M-Pesa payments without the burden of running a payment gateway yourself.

= The Problem We Solve =

You want to accept M-Pesa. But getting there means:
* Dealing with Safaricom API complexity
* Managing security and PCI compliance
* Storing sensitive credentials in your WordPress database
* Troubleshooting webhook failures
* Keeping up with API changes

**That's too much work just to collect payments.**

= The Nisc Solution =

We handle the gateway. You collect payments.

1. **Get access** - Contact us (+254748777666 or support@nisccloud.com)
2. **Paste one API key** - Takes 30 seconds in WooCommerce settings
3. **Click Connect** - Everything configures automatically
4. **Start collecting payments** - That's it

No compliance management. No security maintenance. No gateway operations.

We handle all of that so you don't have to.

= What You Get =

* **Setup in minutes, not days** - Paste key, click connect, done
* **Zero gateway management** - Compliance, security, infrastructure we handle it all
* **Always works** - Webhooks auto-register, payments auto-reconcile
* **Built-in testing** - Test M-Pesa without creating real orders
* **Enterprise reliability** - Same infrastructure powering high-volume merchants

= How to get access =

Contact Nisc Cloud to get set up and receive your API key:

* Phone: **+254748777666**
* Email: **support@nisccloud.com**

= After you have access =

1. Paste your API key in WooCommerce → Settings → Payments → Nisc Payment Gateway.
2. Click Connect the plugin registers your webhook automatically.
3. Use **Connection test** (green/red card) to confirm gateway + M-Pesa token, then optionally **Test STK → webhook**.
4. Enable the method and take orders.

== External services ==

This plugin connects to the **Nisc Cloud Payment Gateway** API to process M-Pesa STK Push payments, register webhooks, run connection health checks, and receive payment status updates. The service is required for the plugin to accept payments.

Service endpoint (default): `https://npanel-server.nisccloud.com/api/nisc-gateway`

What data is sent and when:

* **Connect / disconnect (admin):** API key authentication; store webhook URL (`https://your-site/wp-json/nisc-gateway/v1/webhook`) when connecting; webhook clear request when disconnecting or deactivating.
* **Connection / health checks (admin):** Unauthenticated health ping and authenticated connection test to confirm the gateway is reachable and credentials work. No customer order data is sent.
* **Checkout payment (customer):** Amount, currency, M-Pesa phone number, order reference/id, order number, short order description, and site URL metadata when a customer pays with M-Pesa.
* **Admin test STK:** Amount, currency, phone number, and test metadata when a store admin runs the built-in Test STK → webhook tool.
* **Incoming webhooks:** Nisc Cloud posts signed payment status updates back to your WordPress site (payment id, status, M-Pesa receipt/transaction details as applicable).

This service is provided by Nisc Cloud Limited:

* Terms of Service: https://staging.nisccloud.com/terms
* Privacy Policy: https://staging.nisccloud.com/privacy

Note: These legal pages are currently published on our staging landing site (staging.nisccloud.com). The same pages will be available at nisccloud.com/terms and nisccloud.com/privacy once the production landing site cutover is complete.

M-Pesa payments initiated through this gateway are completed via Safaricom's M-Pesa network. Safaricom receives payment instructions from Nisc Cloud (not directly from this plugin). See Safaricom's terms and privacy policy: https://www.safaricom.co.ke/terms and https://www.safaricom.co.ke/privacy-policy

This plugin does not track users for analytics or advertising. Data is sent only to process payments and keep payment status in sync.

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

== Screenshots ==

1. Simple three-step setup: paste API key, connect, and start accepting M-Pesa payments
2. Connection test confirms gateway status and M-Pesa credentials before going live
3. Test STK Push feature lets you preview webhooks without affecting real orders
4. Clean M-Pesa checkout experience - customers receive STK prompt on their phone
5. WooCommerce payment settings showing Nisc Payment Gateway configuration

== Changelog ==

= 0.1.9 =
* Documented Nisc Cloud Payment Gateway external service usage in readme (Guideline 6), including data sent and links to terms and privacy policy.
* Ensured languages/ exists with index.php for Domain Path checks; CI Plugin Check slug matches wordpress.org permalink.

= 0.1.8 =
* Fixed WordPress.org plugin checker warnings: created languages folder and sanitized POST input.
* Added sanitize_text_field() to amount parameter in test STK endpoint.

= 0.1.7 =
* Fixed WordPress.org automated checks: removed hidden .gitkeep file and updated text domain to match plugin slug.
* Text domain changed to 'nisc-payment-gateway-for-woocommerce' across all translation strings.

= 0.1.6 =
* Refined marketing messaging to focus on core value: simplicity without gateway management.
* Removed Upgrade Notice section (not needed for initial WordPress.org release).
* Updated all descriptions to emphasize pain-solution over technical features.

= 0.1.5 =
* Fixed WordPress.org submission: Plugin URI and Author URI must differ (removed duplicate Plugin URI).
* Refocused marketing on value proposition: simplicity of getting payments without managing a gateway yourself.
* Updated all descriptions to emphasize pain-solution rather than technical features.

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
