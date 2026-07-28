<?php
/**
 * WooCommerce Checkout Blocks support.
 *
 * @package Nisc_Payment_Gateway
 */

declare(strict_types=1);

use Automattic\WooCommerce\Blocks\Payments\Integrations\AbstractPaymentMethodType;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Nisc Payment Gateway Blocks integration.
 *
 * Registers the payment method with WooCommerce Checkout Blocks.
 */
final class Nisc_PG_Blocks_Support extends AbstractPaymentMethodType {

	/**
	 * Payment method name/id.
	 *
	 * @var string
	 */
	protected $name = 'nisc_payment_gateway';

	/**
	 * Gateway instance.
	 *
	 * @var Nisc_PG_WC_Gateway|null
	 */
	private $gateway = null;

	/**
	 * Initialize the payment method type.
	 */
	public function initialize(): void {
		$this->settings = get_option( 'woocommerce_nisc_payment_gateway_settings', array() );
		$gateways       = WC()->payment_gateways->payment_gateways();
		$this->gateway  = $gateways['nisc_payment_gateway'] ?? null;
	}

	/**
	 * Check if the gateway is active.
	 *
	 * @return bool
	 */
	public function is_active(): bool {
		return $this->gateway && $this->gateway->is_available();
	}

	/**
	 * Register scripts for the payment method.
	 *
	 * @return array<string>
	 */
	public function get_payment_method_script_handles(): array {
		$script_asset_path = NISC_PG_PATH . 'assets/js/blocks/checkout.asset.php';
		$script_asset      = file_exists( $script_asset_path )
			? require $script_asset_path
			: array(
				'dependencies' => array(),
				'version'      => NISC_PG_VERSION,
			);

		wp_register_script(
			'nisc-payment-gateway-blocks',
			plugins_url( 'assets/js/blocks/checkout.js', dirname( __FILE__ ) ),
			$script_asset['dependencies'],
			$script_asset['version'],
			true
		);

		return array( 'nisc-payment-gateway-blocks' );
	}

	/**
	 * Get payment method data for the frontend.
	 *
	 * @return array<string,mixed>
	 */
	public function get_payment_method_data(): array {
		if ( ! $this->gateway ) {
			return array();
		}

		return array(
			'title'       => $this->gateway->get_option( 'title' ),
			'description' => $this->gateway->get_option( 'description' ),
			'supports'    => array_filter( $this->gateway->supports, array( $this->gateway, 'supports' ) ),
			'icon'        => $this->gateway->get_option( 'icon', '' ),
		);
	}
}
