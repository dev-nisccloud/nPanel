<?php
/**
 * Dokan marketplace integration.
 *
 * @package Nisc_Payment_Gateway
 */

declare(strict_types=1);

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Integration with Dokan multi-vendor marketplace plugin.
 * Ensures Nisc Payment Gateway is available at checkout for customers buying from vendor stores.
 */
final class Nisc_PG_Dokan_Integration {

	/**
	 * Initialize Dokan integration hooks.
	 */
	public static function init(): void {
		if ( ! function_exists( 'dokan' ) ) {
			return;
		}

		add_filter( 'woocommerce_payment_gateways', array( self::class, 'ensure_gateway_available' ), 999 );
		add_filter( 'dokan_available_gateways', array( self::class, 'add_to_dokan_gateways' ), 10, 1 );
		add_filter( 'woocommerce_available_payment_gateways', array( self::class, 'ensure_available_at_checkout' ), 999 );
		add_action( 'dokan_payment_settings_before_form', array( self::class, 'add_admin_notice' ) );
	}

	/**
	 * Ensure gateway is available in Dokan contexts.
	 *
	 * @param array<int,string> $gateways Gateway classes.
	 * @return array<int,string>
	 */
	public static function ensure_gateway_available( array $gateways ): array {
		if ( ! in_array( 'Nisc_PG_WC_Gateway', $gateways, true ) ) {
			require_once NISC_PG_PATH . 'includes/class-nisc-wc-gateway.php';
			$gateways[] = 'Nisc_PG_WC_Gateway';
		}
		return $gateways;
	}

	/**
	 * Add Nisc gateway to Dokan's available payment gateways list.
	 *
	 * @param array<string,mixed> $gateways Available gateways.
	 * @return array<string,mixed>
	 */
	public static function add_to_dokan_gateways( array $gateways ): array {
		$settings = get_option( 'woocommerce_nisc_payment_gateway_settings', array() );
		$enabled  = is_array( $settings ) && 'yes' === ( $settings['enabled'] ?? 'no' );
		$connected = is_array( $settings ) && 'yes' === ( $settings['connected'] ?? 'no' );

		if ( $enabled && $connected ) {
			$gateways['nisc_payment_gateway'] = array(
				'id'    => 'nisc_payment_gateway',
				'title' => __( 'M-Pesa (Nisc)', 'nisc-payment-gateway' ),
			);
		}

		return $gateways;
	}

	/**
	 * Ensure gateway is available at checkout for Dokan vendor stores.
	 *
	 * @param array<string,WC_Payment_Gateway> $available_gateways Available payment gateways.
	 * @return array<string,WC_Payment_Gateway>
	 */
	public static function ensure_available_at_checkout( array $available_gateways ): array {
		if ( ! is_checkout() ) {
			return $available_gateways;
		}

		$settings = get_option( 'woocommerce_nisc_payment_gateway_settings', array() );
		$enabled  = is_array( $settings ) && 'yes' === ( $settings['enabled'] ?? 'no' );
		$connected = is_array( $settings ) && 'yes' === ( $settings['connected'] ?? 'no' );

		if ( $enabled && $connected && isset( $available_gateways['nisc_payment_gateway'] ) ) {
			return $available_gateways;
		}

		if ( $enabled && $connected && ! isset( $available_gateways['nisc_payment_gateway'] ) ) {
			$all_gateways = WC()->payment_gateways->payment_gateways();
			if ( isset( $all_gateways['nisc_payment_gateway'] ) ) {
				$available_gateways['nisc_payment_gateway'] = $all_gateways['nisc_payment_gateway'];
			}
		}

		return $available_gateways;
	}

	/**
	 * Add admin notice in Dokan payment settings.
	 */
	public static function add_admin_notice(): void {
		$settings = get_option( 'woocommerce_nisc_payment_gateway_settings', array() );
		$enabled  = is_array( $settings ) && 'yes' === ( $settings['enabled'] ?? 'no' );
		$connected = is_array( $settings ) && 'yes' === ( $settings['connected'] ?? 'no' );

		if ( $enabled && $connected ) {
			?>
			<div class="dokan-alert dokan-alert-success" style="margin-bottom: 20px;">
				<strong><?php esc_html_e( 'Nisc Payment Gateway (M-Pesa)', 'nisc-payment-gateway' ); ?></strong>
				<p>
					<?php esc_html_e( 'M-Pesa payments via Nisc Payment Gateway are enabled for customer checkout on all vendor stores.', 'nisc-payment-gateway' ); ?>
					<?php
					printf(
						/* translators: %s: settings page URL */
						wp_kses_post( __( 'Configure in <a href="%s">WooCommerce Payment Settings</a>.', 'nisc-payment-gateway' ) ),
						esc_url( admin_url( 'admin.php?page=wc-settings&tab=checkout&section=nisc_payment_gateway' ) )
					);
					?>
				</p>
			</div>
			<?php
		}
	}
}
