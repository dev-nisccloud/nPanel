<?php
/**
 * Plugin bootstrap.
 *
 * @package Nisc_Payment_Gateway
 */

declare(strict_types=1);

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

final class Nisc_PG_Plugin {

	private static ?self $instance = null;

	public static function instance(): self {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	public function init(): void {
		if ( ! class_exists( 'WooCommerce' ) ) {
			add_action( 'admin_notices', array( $this, 'missing_woocommerce_notice' ) );
			return;
		}

		add_action( 'rest_api_init', array( Nisc_PG_Webhook_Controller::class, 'register_routes' ) );
		add_filter( 'woocommerce_payment_gateways', array( $this, 'register_gateway' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_admin_assets' ) );
		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_frontend_assets' ) );
		add_filter( 'plugin_action_links_' . NISC_PG_BASENAME, array( $this, 'action_links' ) );
		add_action( 'wp_ajax_nisc_pg_connect', array( $this, 'ajax_connect' ) );
		add_action( 'wp_ajax_nisc_pg_disconnect', array( $this, 'ajax_disconnect' ) );
		add_action( 'wp_ajax_nisc_pg_refresh_status', array( $this, 'ajax_refresh_status' ) );
	}

	/**
	 * @param array<int,string> $gateways Gateways.
	 * @return array<int,string>
	 */
	public function register_gateway( array $gateways ): array {
		require_once NISC_PG_PATH . 'includes/class-nisc-wc-gateway.php';
		$gateways[] = 'Nisc_PG_WC_Gateway';
		return $gateways;
	}

	public function enqueue_admin_assets( string $hook ): void {
		if ( 'woocommerce_page_wc-settings' !== $hook ) {
			return;
		}

		// phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$section = isset( $_GET['section'] ) ? sanitize_text_field( wp_unslash( $_GET['section'] ) ) : '';
		if ( 'nisc_payment_gateway' !== $section ) {
			return;
		}

		wp_enqueue_style(
			'nisc-pg-admin',
			NISC_PG_URL . 'assets/css/admin.css',
			array(),
			NISC_PG_VERSION
		);

		wp_enqueue_script(
			'nisc-pg-admin',
			NISC_PG_URL . 'assets/js/admin.js',
			array( 'jquery' ),
			NISC_PG_VERSION,
			true
		);

		$settings = get_option( 'woocommerce_nisc_payment_gateway_settings', array() );
		$connected = 'yes' === ( $settings['connected'] ?? 'no' );

		wp_localize_script(
			'nisc-pg-admin',
			'niscPgAdmin',
			array(
				'ajaxUrl'      => admin_url( 'admin-ajax.php' ),
				'nonce'        => wp_create_nonce( 'nisc_pg_admin' ),
				'connected'    => $connected,
				'webhookUrl'   => Nisc_PG_Webhook_Controller::get_webhook_url(),
				'i18n'         => array(
					'connecting'   => __( 'Connecting…', 'nisc-payment-gateway' ),
					'disconnecting'=> __( 'Disconnecting…', 'nisc-payment-gateway' ),
					'refreshing'   => __( 'Checking…', 'nisc-payment-gateway' ),
					'connectOk'    => __( 'Connected. Webhook registered automatically.', 'nisc-payment-gateway' ),
					'connectFail'  => __( 'Could not connect. Check your API key and try again.', 'nisc-payment-gateway' ),
					'disconnected' => __( 'Disconnected.', 'nisc-payment-gateway' ),
				),
			)
		);
	}

	public function enqueue_frontend_assets(): void {
		if ( ! function_exists( 'is_order_received_page' ) || ! is_order_received_page() ) {
			return;
		}

		wp_enqueue_style(
			'nisc-pg-frontend',
			NISC_PG_URL . 'assets/css/admin.css',
			array(),
			NISC_PG_VERSION
		);
	}

	/**
	 * @param array<string,string> $links Links.
	 * @return array<string,string>
	 */
	public function action_links( array $links ): array {
		$url = admin_url( 'admin.php?page=wc-settings&tab=checkout&section=nisc_payment_gateway' );
		$links = array_merge(
			array(
				'settings' => '<a href="' . esc_url( $url ) . '">' . esc_html__( 'Settings', 'nisc-payment-gateway' ) . '</a>',
			),
			$links
		);
		return $links;
	}

	public function missing_woocommerce_notice(): void {
		echo '<div class="notice notice-error"><p>';
		echo esc_html__( 'Nisc Payment Gateway requires WooCommerce to be installed and active.', 'nisc-payment-gateway' );
		echo '</p></div>';
	}

	public function ajax_connect(): void {
		check_ajax_referer( 'nisc_pg_admin', 'nonce' );

		if ( ! current_user_can( 'manage_woocommerce' ) ) {
			wp_send_json_error( array( 'message' => __( 'Permission denied.', 'nisc-payment-gateway' ) ), 403 );
		}

		$api_key = isset( $_POST['api_key'] ) ? sanitize_text_field( wp_unslash( $_POST['api_key'] ) ) : '';
		if ( '' === $api_key ) {
			wp_send_json_error( array( 'message' => __( 'Please paste your API key.', 'nisc-payment-gateway' ) ) );
		}

		if ( ! preg_match( '/^npg_(test|live|sandbox|prod)_/i', $api_key ) && ! str_starts_with( $api_key, 'npg_' ) ) {
			wp_send_json_error( array( 'message' => __( 'That does not look like a Nisc API key (expected npg_…).', 'nisc-payment-gateway' ) ) );
		}

		$client   = new Nisc_PG_Api_Client( $api_key );
		$webhook  = Nisc_PG_Webhook_Controller::get_webhook_url();
		$response = $client->register_webhook( $webhook );

		if ( ! $response['ok'] ) {
			$message = $response['error']['message'] ?? __( 'Connection failed.', 'nisc-payment-gateway' );
			wp_send_json_error(
				array(
					'message' => $message,
					'code'    => $response['error']['code'] ?? 'API_ERROR',
				)
			);
		}

		$data   = $response['data'] ?? array();
		$secret = isset( $data['webhookSecret'] ) ? (string) $data['webhookSecret'] : '';

		if ( '' === $secret ) {
			wp_send_json_error( array( 'message' => __( 'Gateway connected but did not return a webhook secret.', 'nisc-payment-gateway' ) ) );
		}

		update_option( 'nisc_pg_webhook_secret', $secret, false );

		$settings = get_option( 'woocommerce_nisc_payment_gateway_settings', array() );
		if ( ! is_array( $settings ) ) {
			$settings = array();
		}

		$settings['enabled']           = 'yes';
		$settings['api_key']           = $api_key;
		$settings['connected']         = 'yes';
		$settings['merchant_id']       = isset( $data['merchantId'] ) ? (string) $data['merchantId'] : '';
		$settings['merchant_name']     = isset( $data['merchantName'] ) ? (string) $data['merchantName'] : '';
		$settings['environment']       = isset( $data['environment'] ) ? (string) $data['environment'] : '';
		$settings['webhook_url']       = isset( $data['url'] ) ? (string) $data['url'] : $webhook;
		$settings['connected_at']      = isset( $data['registeredAt'] ) ? (string) $data['registeredAt'] : gmdate( 'c' );
		$settings['last_error']        = '';

		update_option( 'woocommerce_nisc_payment_gateway_settings', $settings );

		wp_send_json_success(
			array(
				'message'      => __( 'Connected. Webhook registered automatically.', 'nisc-payment-gateway' ),
				'merchantName' => $settings['merchant_name'],
				'environment'  => $settings['environment'],
				'webhookUrl'   => $settings['webhook_url'],
				'connectedAt'  => $settings['connected_at'],
				'maskedKey'    => self::mask_api_key( $api_key ),
			)
		);
	}

	public function ajax_disconnect(): void {
		check_ajax_referer( 'nisc_pg_admin', 'nonce' );

		if ( ! current_user_can( 'manage_woocommerce' ) ) {
			wp_send_json_error( array( 'message' => __( 'Permission denied.', 'nisc-payment-gateway' ) ), 403 );
		}

		$settings = get_option( 'woocommerce_nisc_payment_gateway_settings', array() );
		$api_key  = is_array( $settings ) ? (string) ( $settings['api_key'] ?? '' ) : '';

		if ( $api_key ) {
			$client = new Nisc_PG_Api_Client( $api_key );
			$client->clear_webhook();
		}

		delete_option( 'nisc_pg_webhook_secret' );

		if ( is_array( $settings ) ) {
			$settings['connected']     = 'no';
			$settings['api_key']       = '';
			$settings['merchant_id']   = '';
			$settings['merchant_name'] = '';
			$settings['environment']   = '';
			$settings['webhook_url']   = '';
			$settings['connected_at']  = '';
			$settings['last_error']    = '';
			$settings['enabled']       = 'no';
			update_option( 'woocommerce_nisc_payment_gateway_settings', $settings );
		}

		wp_send_json_success( array( 'message' => __( 'Disconnected.', 'nisc-payment-gateway' ) ) );
	}

	public function ajax_refresh_status(): void {
		check_ajax_referer( 'nisc_pg_admin', 'nonce' );

		if ( ! current_user_can( 'manage_woocommerce' ) ) {
			wp_send_json_error( array( 'message' => __( 'Permission denied.', 'nisc-payment-gateway' ) ), 403 );
		}

		$settings = get_option( 'woocommerce_nisc_payment_gateway_settings', array() );
		$api_key  = is_array( $settings ) ? (string) ( $settings['api_key'] ?? '' ) : '';

		if ( ! $api_key ) {
			wp_send_json_error( array( 'message' => __( 'Not connected.', 'nisc-payment-gateway' ) ) );
		}

		$client   = new Nisc_PG_Api_Client( $api_key );
		$response = $client->get_webhook();

		if ( ! $response['ok'] ) {
			wp_send_json_error(
				array(
					'message' => $response['error']['message'] ?? __( 'Status check failed.', 'nisc-payment-gateway' ),
				)
			);
		}

		$data = $response['data'] ?? array();
		wp_send_json_success(
			array(
				'registered'   => ! empty( $data['registered'] ),
				'url'          => $data['url'] ?? null,
				'merchantName' => $data['merchantName'] ?? '',
				'environment'  => $data['environment'] ?? '',
				'registeredAt' => $data['registeredAt'] ?? null,
			)
		);
	}

	public function maybe_unregister_webhook_on_deactivate(): void {
		$settings = get_option( 'woocommerce_nisc_payment_gateway_settings', array() );
		$api_key  = is_array( $settings ) ? (string) ( $settings['api_key'] ?? '' ) : '';
		if ( ! $api_key ) {
			return;
		}

		$client = new Nisc_PG_Api_Client( $api_key );
		$client->clear_webhook();
	}

	public static function mask_api_key( string $key ): string {
		$len = strlen( $key );
		if ( $len <= 12 ) {
			return str_repeat( '•', max( 0, $len - 4 ) ) . substr( $key, -4 );
		}
		return substr( $key, 0, 8 ) . str_repeat( '•', 12 ) . substr( $key, -4 );
	}
}
