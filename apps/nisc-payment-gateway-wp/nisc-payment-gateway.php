<?php
/**
 * Plugin Name:       Nisc Payment Gateway for WooCommerce
 * Description:       Accept M-Pesa without managing a payment gateway yourself. Setup in minutes. We handle compliance, security, everything. Contact: +254748777666 or support@nisccloud.com.
 * Version:           0.1.10
 * Requires at least: 6.4
 * Tested up to:      7.0
 * Requires PHP:      8.0
 * Author:            Nisc Cloud
 * Author URI:        https://nisccloud.com
 * License:           GPLv2 or later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:        nisc-payment-gateway-for-woocommerce
 * Domain Path:       /languages
 * Requires Plugins:  woocommerce
 * WC requires at least: 8.0
 * WC tested up to:   9.9
 *
 * @package Nisc_Payment_Gateway
 */

declare(strict_types=1);

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'NISC_PG_VERSION', '0.1.10' );
define( 'NISC_PG_FILE', __FILE__ );
define( 'NISC_PG_PATH', plugin_dir_path( __FILE__ ) );
define( 'NISC_PG_URL', plugin_dir_url( __FILE__ ) );
define( 'NISC_PG_BASENAME', plugin_basename( __FILE__ ) );

/** Default public gateway base (no trailing slash). Override with filter `nisc_pg_api_base_url`. */
define( 'NISC_PG_DEFAULT_API_BASE', 'https://npanel-server.nisccloud.com/api/nisc-gateway' );

require_once NISC_PG_PATH . 'includes/class-nisc-api-client.php';
require_once NISC_PG_PATH . 'includes/class-nisc-order-service.php';
require_once NISC_PG_PATH . 'includes/class-nisc-test-service.php';
require_once NISC_PG_PATH . 'includes/class-nisc-webhook-controller.php';
require_once NISC_PG_PATH . 'includes/class-nisc-dokan-integration.php';
require_once NISC_PG_PATH . 'includes/class-nisc-plugin.php';

/**
 * Bootstrap after plugins load so WooCommerce is available.
 */
add_action(
	'plugins_loaded',
	static function (): void {
		Nisc_PG_Plugin::instance()->init();
	},
	20
);

register_activation_hook(
	__FILE__,
	static function (): void {
		if ( ! class_exists( 'WooCommerce' ) ) {
			deactivate_plugins( NISC_PG_BASENAME );
			wp_die(
				esc_html__( 'Nisc Payment Gateway requires WooCommerce to be installed and active.', 'nisc-payment-gateway-for-woocommerce' ),
				esc_html__( 'Plugin dependency missing', 'nisc-payment-gateway-for-woocommerce' ),
				array( 'back_link' => true )
			);
		}

		flush_rewrite_rules();
	}
);

register_deactivation_hook(
	__FILE__,
	static function (): void {
		Nisc_PG_Plugin::instance()->maybe_unregister_webhook_on_deactivate();
		flush_rewrite_rules();
	}
);

/**
 * Declare HPOS compatibility.
 */
add_action(
	'before_woocommerce_init',
	static function (): void {
		if ( class_exists( \Automattic\WooCommerce\Utilities\FeaturesUtil::class ) ) {
			\Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility( 'custom_order_tables', __FILE__, true );
		}
	}
);
